import React, { useEffect, useState } from "react";
import { getAllRecipes } from "../../Services/Recipes.js";
import MainList from "./MainList.js";

const Main = () => {
  // initialize variables
  const [recipes, setRecipes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState([]);
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // Load recipes through recipes service at main load
  useEffect(() => {
    getAllRecipes().then((data) => {
      setRecipes(data || []);
      setIsLoaded(true);
    });
  }, []);

  // handles if a category is checked in the form and adds to category list
  const handleCategory = (event) => {
    const value = event.currentTarget.value;
    if (event.currentTarget.checked) {
      setCategory(category.concat(value));
    } else {
      setCategory(category.filter((c) => c != value));
    }
  };

  // creates a new recipe that will be displayed in all recipes
  const enterSubmit = () => {
    const newRecipe = {
      id: Date.now(),
      name: name,
      description: description,
      category: category,
      ingredients: ingredients,
      instructions: instructions,
    };

    // adds new recipe to the recipes list and sets form back to empty
    setRecipes([newRecipe].concat(recipes));
    setName("");
    setDescription("");
    setCategory([]);
    setIngredients("");
    setInstructions("");
  };

  // child sends back to main to delete a recipe when passed to MainList
  const deleteRecipe = (id) => {
    setRecipes(recipes.filter((recipe) => recipe.id !== id));
  };

  return (
    <>
      {isLoaded && (
        <div>
          <h1>RecipeMe - a resource for collecting and organizing recipes!</h1>
          <p>Add your recipe below:</p>

          {/* Recipe Entry form */}
          <form>
            <div className="form-row">
              <label htmlFor="recipe-name">Recipe Name:</label>
              <input
                type="text"
                id="recipe-name"
                name="name"
                value={name}
                onInput={(event) => setName(event.currentTarget.value)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="recipe-description">Recipe Description:</label>
              <input
                type="text"
                id="recipe-description"
                name="description"
                value={description}
                onInput={(event) => setDescription(event.currentTarget.value)}
              />
            </div>

            {/* checkboxes for categories */}
            <div className="form-row">
              <span className="row-label">Category:</span>
              <div className="checkbox-group">
                <span>
                  <input
                    type="checkbox"
                    id="dessert"
                    name="category"
                    value="dessert"
                    checked={category.includes("dessert")}
                    onChange={handleCategory}
                  />
                  <label htmlFor="dessert">Dessert</label>
                </span>
                <span>
                  <input
                    type="checkbox"
                    id="main"
                    name="category"
                    value="main"
                    checked={category.includes("main")}
                    onChange={handleCategory}
                  />
                  <label htmlFor="main">Main</label>
                </span>
                <span>
                  <input
                    type="checkbox"
                    id="appetizer"
                    name="category"
                    value="appetizer"
                    checked={category.includes("appetizer")}
                    onChange={handleCategory}
                  />
                  <label htmlFor="appetizer">Appetizer</label>
                </span>
                <span>
                  <input
                    type="checkbox"
                    id="drink"
                    name="category"
                    value="drink"
                    checked={category.includes("drink")}
                    onChange={handleCategory}
                  />
                  <label htmlFor="drink">Drink</label>
                </span>
                <span>
                  <input
                    type="checkbox"
                    id="soups"
                    name="category"
                    value="soups"
                    checked={category.includes("soups")}
                    onChange={handleCategory}
                  />
                  <label htmlFor="soups">Soups</label>
                </span>
                <span>
                  <input
                    type="checkbox"
                    id="salads"
                    name="category"
                    value="salads"
                    checked={category.includes("salads")}
                    onChange={handleCategory}
                  />
                  <label htmlFor="salads">Salads</label>
                </span>
              </div>
            </div>

            {/* text areas for handling large text */}
            <div className="form-row">
              <label htmlFor="ingredients">Ingredients:</label>
              <textarea
                id="ingredients"
                name="ingredients"
                rows="5"
                value={ingredients}
                onInput={(event) => setIngredients(event.currentTarget.value)}
              ></textarea>
            </div>

            <div className="form-row">
              <label htmlFor="instructions">Instructions:</label>
              <textarea
                id="instructions"
                name="instructions"
                rows="5"
                value={instructions}
                onInput={(event) => setInstructions(event.currentTarget.value)}
              ></textarea>
            </div>

            {/* submit */}
            <button type="button" onClick={enterSubmit}>
              Add Recipe
            </button>
          </form>

          {/* Gets recipes as child component and passes delete function to child */}
          <MainList recipes={recipes} onDelete={deleteRecipe} />
        </div>
      )}
    </>
  );
};

export default Main;
