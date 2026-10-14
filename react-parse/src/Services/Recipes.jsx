import axios from "axios";
import 'parse'

const Parse = window.Parse;

// delete recipe - remove by id
export const deleteRecipe = (id) => {
  const Recipe = Parse.Object.extend("Recipe");
  const query = new Parse.Query(Recipe);
  return query.get(id).then((recipe) => {
    console.log("DELETE recipe: ", recipe);
    recipe.destroy();
  })
  .catch((err) => {
    console.log("Delete error: ", err);
  })
};

// create recipe
export const createRecipe = (
  id,
  name,
  description,
  category,
  ingredients,
  instructions
) => {
  console.log("Creating", name);
  const Recipe = Parse.Object.extend("Recipe");
  const recipe = new Recipe();
  // using setter to update object
  recipe.set("id", id);
  recipe.set("name", name);
  recipe.set("description", description);
  recipe.set("ingredients", ingredients);
  recipe.set("instructions", instructions);
  return recipe.save().then((result) => {
    // returns new Recipe object
    return result
  });
};

// get recipes - read operation
export const getAllRecipes = () => {
  const Recipe = Parse.Object.extend("Recipe");
  const query = new Parse.Query(Recipe);
  query.include("category");

  return query
    .find()
    .then((response) => {
      console.log(response);
      return response.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        description: r.get("description"),
        category: category,
        ingredients: r.get("ingredients"),
        instructions: r.get("instructions"),
      }));
    })
    .catch((err) => {
      console.log("GET Error: ", err);
    });
};
