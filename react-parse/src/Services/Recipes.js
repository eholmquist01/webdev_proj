import 'parse'

const Parse = window.Parse;

// connect category pointer to recipes
const Category = Parse.Object.extend("Category");
const categoryPointer = (categoryId) => Category.createWithoutData(categoryId);

// URLs of a recipe's photos: the "photos" array, or the single "photo"
// that recipes saved before multi-photo support have
const photoUrlsOf = (r) => {
  const photos = r.get("photos");
  if (Array.isArray(photos) && photos.length > 0) {
    return photos.map((file) => file.url());
  }
  const photo = r.get("photo");
  return photo ? [photo.url()] : [];
};

// turn a Parse Recipe object into the plain object the components use
const toRecipe = (r) => ({
  id: r.id,
  name: r.get("name"),
  description: r.get("description"),
  category: r.get("category").get("name"),
  ingredients: r.get("ingredients"),
  instructions: r.get("instructions"),
  photoUrls: photoUrlsOf(r), // original recipe photos, in page order
});

// delete recipe - remove by id
export const deleteRecipe = (id) => {
  const Recipe = Parse.Object.extend("Recipe");
  const query = new Parse.Query(Recipe);
  return query.get(id).then((recipe) => {
    console.log("DELETE recipe: ", recipe);
    return recipe.destroy();
  })
  .catch((err) => {
    console.error("Delete error: ", err);
    throw err;
  })
};

// create recipe
// photos is optional: [{ base64, mediaType }] from the photo uploader, in page order
export const createRecipe = async (
  name,
  description,
  categoryId,
  ingredients,
  instructions,
  photos = []
) => {
  console.log("Creating", name);
  const Recipe = Parse.Object.extend("Recipe");
  const recipe = new Recipe();
  // using setter to update object
  recipe.set("name", name);
  recipe.set("description", description);
  recipe.set("category", categoryPointer(categoryId)) // points to category
  recipe.set("ingredients", ingredients);
  recipe.set("instructions", instructions);
  recipe.set("owner", Parse.User.current());
  recipe.setACL(new Parse.ACL(Parse.User.current()));

  // upload the photos first, then link them to the recipe (order is kept)
  if (photos.length > 0) {
    const files = await Promise.all(
      photos.map((photo, i) =>
        new Parse.File(`recipe-${i + 1}.jpg`, { base64: photo.base64 }, photo.mediaType).save()
      )
    );
    recipe.set("photos", files);
  }

  const saved = await recipe.save();
  const r = await saved.fetch({ include: "category" });
  return toRecipe(r);
};

// get recipes - read operation
export const getAllRecipes = () => {
  const Recipe = Parse.Object.extend("Recipe");
  const query = new Parse.Query(Recipe);
  // include category columns in query
  query.include("category");
  query.equalTo("owner", Parse.User.current());

  return query
    .find()
    .then((response) => {
      console.log(response);
      return response.map(toRecipe);
    })
    .catch((err) => {
      console.error("GET Error: ", err);
      throw err;
    });
};

// get recipes based on category - used in display page
export const getRecipesByCategory = (categoryId) => {
  const Recipe = Parse.Object.extend("Recipe");
  const query = new Parse.Query(Recipe);
  // include category columns in query
  query.equalTo("category", categoryPointer(categoryId));
  query.include("category");
  query.equalTo("owner", Parse.User.current());

  return query
    .find()
    .then((response) => {
      return response.map(toRecipe);
    })
    .catch((err) => {
      console.error("GET Error with Recipes/Categories: ", err);
      throw err;
    });
};
