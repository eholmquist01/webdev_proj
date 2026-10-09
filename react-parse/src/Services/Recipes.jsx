import axios from "axios";
// import Parse from "parse";
const Parse = window.Parse;
const url =
  "https://my-json-server.typicode.com/kellybuchanan/WebDev-Spring2021";

// delete recipe
export const deleteRecipe = (id) => {
  return axios({
    method: "delete",
    url: `${url}/recipes/${id}`,
  })
    .then((response) => {
      console.log("DELETE response: ", response);
      return response.data;
    })
    .catch((err) => {
      console.log("DELETE error: ", err);
    });
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
  return axios({
    method: "post",
    url: `${url}/recipes`,
    data: {
      id,
      name,
      description,
      category,
      ingredients,
      instructions,
    },
    headers: {
      "Content-Type": "application/json",
    },
    json: true,
  })
    .then((response) => {
      console.log("POST response: ", response);
    })
    .catch((err) => {
      console.log("POST error: ", err);
    });
};

// get recipes
export const getAllRecipes = () => {
  // .get(`${url}/recipes`)
  const query = new Parse.Query("Recipes");
  return query
    .find()
    .then((response) => {
      console.log(response);
      return response.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        description: r.get("description"),
        category: r.get("category"),
        ingredients: r.get("ingredients"),
        instructions: r.get("instructions"),
      }));
    })
    .catch((err) => {
      console.log("GET Error: ", err);
    });
};
