// Shopping list Cloud Code (loaded from main.js with require("./shoppingList")).
// Turns a recipe's free-text ingredients into structured items with Claude.
// The API key stays on the server: ANTHROPIC_API_KEY in Back4App's environment variables.

const sdk = require("@anthropic-ai/sdk");
const Anthropic = sdk.default || sdk;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_TEXT_LENGTH = 5000; // characters of ingredient text per request

const SYSTEM_PROMPT = `You turn a recipe's ingredient list into shopping list items.
The text usually has one ingredient per line, but it may also be separated by commas or written as free text.
For each ingredient, return:
- name: the ingredient itself, lowercase, without amounts or preparation notes (e.g. "all-purpose flour", "egg", "olive oil"). Use the singular form.
- quantity: the amount as a number (convert fractions like "1 1/2" to 1.5), or null when there is no amount (e.g. "salt to taste").
- unit: the unit, lowercase and singular (e.g. "cup", "tbsp", "tsp", "g", "oz", "lb", "clove", "can"), or null when the amount is a count of the item itself (e.g. "2 eggs") or there is no amount.
- originalText: the ingredient exactly as written in the input.
Do not add ingredients that are not in the text. Skip headings and empty lines.`;

// Shape Claude must reply with. Nullable fields use anyOf with "null".
const ITEMS_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { anyOf: [{ type: "number" }, { type: "null" }] },
          unit: { anyOf: [{ type: "string" }, { type: "null" }] },
          originalText: { type: "string" },
        },
        required: ["name", "quantity", "unit", "originalText"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

// Called from the React app with
//   Parse.Cloud.run("parseIngredients", { text: "2 cups flour\n1 egg" })
// Returns [{ name, quantity, unit, originalText }, ...]
Parse.Cloud.define("parseIngredients", async (request) => {
  const { user, params } = request;
  if (!user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "You must be logged in.");
  }

  const text = typeof params.text === "string" ? params.text.trim() : "";
  if (!text) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "This recipe has no ingredients.");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, "The ingredient list is too long.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "The ingredient reader isn't set up (missing API key).");
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      output_config: {
        effort: "low", // simple extraction, so keep it fast and cheap
        format: { type: "json_schema", schema: ITEMS_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Ingredients:\n${text}` }],
    });
  } catch (err) {
    console.error("Claude API error:", err);
    if (err instanceof Anthropic.RateLimitError) {
      throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "The ingredient reader is busy. Try again in a minute.");
    }
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "Couldn't read the ingredients. Please try again.");
  }

  if (response.stop_reason === "refusal") {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "These ingredients couldn't be processed.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "The ingredient list was too long to read in one go.");
  }

  // The reply can start with a thinking block, so look for the text block
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "No ingredients were returned.");
  }

  try {
    return JSON.parse(textBlock.text).items;
  } catch (err) {
    console.error("Bad JSON from Claude:", textBlock.text);
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, "Couldn't read the ingredients. Please try again.");
  }
});
