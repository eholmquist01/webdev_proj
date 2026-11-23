// Back4App Cloud Code
// Deploy this folder's contents (main.js + package.json) to Back4App:
//   Dashboard > Cloud Code > Functions & Web Hosting > upload to the "cloud" folder > Deploy
// Then add the API key under App Settings > Server Settings > Environment Variables:
//   ANTHROPIC_API_KEY=sk-ant-...

const sdk = require("@anthropic-ai/sdk");
const Anthropic = sdk.default || sdk;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BASE64_LENGTH = 5 * 1024 * 1024; // Claude accepts images up to 5 MB
const MAX_IMAGES = 5; // pages per recipe

const SYSTEM_PROMPT = `You read photos of recipes (cookbook pages, recipe cards, handwritten notes, screenshots) and transcribe them into structured fields.
A recipe may span several photos. They are labelled "Page 1 of N", "Page 2 of N", and so on, in reading order; combine them into one recipe.
- Copy the recipe's own wording; do not invent ingredients, quantities, or steps that are not in the photo.
- ingredients: one entry per ingredient line, including quantity and unit.
- instructions: one entry per step, without leading step numbers.
- description: one or two sentences summarising the dish; use the recipe's intro text if there is one.
- category: pick the closest match from the allowed list.

Before transcribing, decide whether the photos can be read reliably.
If any part needed for the recipe (name, ingredients or steps) cannot be read with confidence, do not guess:
set readable to false, leave the other fields empty, and set unreadableReason to the main cause:
- "blurry": text is out of focus or motion-blurred
- "cut_off": part of the recipe is outside the frame or cropped
- "too_dark": the photo is underexposed or heavily shadowed
- "glare": reflections or bright spots hide the text
- "too_small": the text is too small or far away to read
- "handwriting_illegible": handwriting that cannot be made out
- "not_a_recipe": the photos do not contain a recipe
- "other": any other reason
Set unreadablePage to the page number (starting at 1) that causes the problem, or 0 if it is not one specific page.
If the photos are readable, set readable to true, unreadableReason to "" and unreadablePage to 0.`;

const UNREADABLE_REASONS = [
  "",
  "blurry",
  "cut_off",
  "too_dark",
  "glare",
  "too_small",
  "handwriting_illegible",
  "not_a_recipe",
  "other",
];

function buildSchema(categoryNames) {
  return {
    type: "object",
    properties: {
      readable: { type: "boolean" },
      unreadableReason: { type: "string", enum: UNREADABLE_REASONS },
      unreadablePage: { type: "integer" },
      name: { type: "string" },
      description: { type: "string" },
      category: categoryNames.length
        ? { type: "string", enum: [...categoryNames, ""] }
        : { type: "string" },
      ingredients: { type: "array", items: { type: "string" } },
      instructions: { type: "array", items: { type: "string" } },
    },
    required: ["readable", "unreadableReason", "unreadablePage", "name", "description", "category", "ingredients", "instructions"],
    additionalProperties: false,
  };
}

// Called from the React app with
//   Parse.Cloud.run("extractRecipe", { images: [{ image, mediaType }, ...] })
// (a single { image, mediaType } is still accepted)
Parse.Cloud.define("extractRecipe", async (request) => {
  const { user, params } = request;
  if (!user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "You must be logged in.");
  }

  const images = Array.isArray(params.images)
    ? params.images
    : [{ image: params.image, mediaType: params.mediaType }];

  if (images.length === 0) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "No image was sent.");
  }
  if (images.length > MAX_IMAGES) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `Send at most ${MAX_IMAGES} photos.`);
  }
  for (const { image, mediaType } of images) {
    if (typeof image !== "string" || !image) {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "No image was sent.");
    }
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Unsupported image type.");
    }
    if (image.length > MAX_BASE64_LENGTH) {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "Image is too large.");
    }
  }

  // Each photo is labelled with its page number, then followed by the instructions
  const content = images.flatMap(({ image, mediaType }, i) => [
    { type: "text", text: `Page ${i + 1} of ${images.length}:` },
    { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
  ]);

  // Load category names so Claude picks one that exists in the database
  const categories = await new Parse.Query("Category")
    .limit(1000)
    .find({ sessionToken: user.getSessionToken() });
  const categoryNames = categories.map((c) => c.get("name")).filter(Boolean);

  let response;
  try {
    response = await anthropic.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: buildSchema(categoryNames) },
      },
      // If a safety classifier declines, the API retries on a fallback model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...content,
            {
              type: "text",
              text: `${
                images.length > 1
                  ? "These photos are pages of one recipe, in order. Combine them into one recipe."
                  : "Transcribe the recipe in this photo."
              } Allowed categories: ${categoryNames.join(", ") || "(none)"}`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.error("Claude API error:", err);
    if (err instanceof Anthropic.RateLimitError) {
      throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "The recipe reader is busy. Try again in a minute.");
    }
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "Couldn't read the recipe. Please try again.");
  }

  if (response.stop_reason === "refusal") {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "This photo couldn't be processed.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "The recipe was too long to read in one go.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "No recipe was returned.");
  }

  const recipe = JSON.parse(textBlock.text);
  // Not an error: the client shows a tip for this reason and offers "Try again"
  if (!recipe.readable) {
    const page = recipe.unreadablePage;
    return {
      ok: false,
      reason: recipe.unreadableReason || "other",
      // only pass on a page number that exists
      page: Number.isInteger(page) && page >= 1 && page <= images.length ? page : 0,
    };
  }

  // Send the category's id too, so the form can preselect it
  const match = categories.find((c) => c.get("name") === recipe.category);

  return {
    ok: true,
    recipe: {
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      categoryId: match ? match.id : "",
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
    },
  };
});
