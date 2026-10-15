import 'parse'

const Parse = window.Parse;

// connect category pointer to recipes
const Category = Parse.Object.extend("Category");
const categoryPointer = (categoryId) => Category.createWithoutData(categoryId);

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
export const createRecipe = (
  name,
  description,
  categoryId,
  ingredients,
  instructions
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
  return recipe.save()
    .then((saved) => saved.fetch({ include: "category" }))
    .then((r) => ({
        id: r.id,
        name: r.get("name"),
        description: r.get("description"),
        category: r.get("category").get("name"),
        ingredients: r.get("ingredients"),
        instructions: r.get("instructions"),
  }));
};

// get recipes - read operation
export const getAllRecipes = () => {
  const Recipe = Parse.Object.extend("Recipe");
  const query = new Parse.Query(Recipe);
  // include category columns in query
  query.include("category");

  return query
    .find()
    .then((response) => {
      console.log(response);
      return response.map((r) => ({
        id: r.id,
        name: r.get("name"),
        description: r.get("description"),
        category: r.get("category").get("name"),
        ingredients: r.get("ingredients"),
        instructions: r.get("instructions"),
      }));
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

  return query
    .find()
    .then((response) => {
      return response.map((r) => ({
        id: r.id,
        name: r.get("name"),
        description: r.get("description"),
        category: r.get("category").get("name"),
        ingredients: r.get("ingredients"),
        instructions: r.get("instructions"),
      }));
    })
    .catch((err) => {
      console.error("GET Error with Recipes/Categories: ", err);
      throw err;
    });
};
