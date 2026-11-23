import 'parse'

const Parse = window.Parse;

// Most photos one recipe can have (the cloud function enforces the same limit)
export const MAX_PHOTOS = 5;

// Sends the photos (pages of one recipe, in order) to the "extractRecipe"
// Cloud Code function, which asks Claude to read them and returns:
//   { ok: true, recipe: { name, description, category, categoryId, ingredients: [], instructions: [] } }
// or, when the photos could not be read:
//   { ok: false, reason: "blurry" | "cut_off" | "too_dark" | ..., page: 1-based page number or 0 }
export const extractRecipeFromPhotos = (photos) => {
  return Parse.Cloud.run("extractRecipe", {
    images: photos.map(({ base64, mediaType }) => ({ image: base64, mediaType })),
  });
};

// Image src for a { base64, mediaType } photo that hasn't been saved yet
export const photoSrc = (photo) => `data:${photo.mediaType};base64,${photo.base64}`;
