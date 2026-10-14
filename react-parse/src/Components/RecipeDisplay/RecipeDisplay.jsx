import React, { useEffect, useState } from "react";
import {
  getAllRecipes,
  getRecipesByCategory,
  deleteRecipe,
} from "../../Services/Recipes.jsx";
import RecipeList from "./RecipeList.jsx";

const RecipeDisplay = () => {
  // initialize variables
  const [recipes, setRecipes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Load recipes through recipes service at load and whenever the filter changes
  useEffect(() => {
    const request =
      selectedCategory === "all"
        ? getAllRecipes()
        : getRecipesByCategory(selectedCategory);

    request.then((data) => {
      setRecipes(data || []);
      setIsLoaded(true);
    });
  }, [selectedCategory]);

  // child sends back an id to delete a recipe when passed to RecipeList
  const handleDelete = (id) => {
    deleteRecipe(id).then(() => {
      setRecipes(recipes.filter((recipe) => recipe.id !== id));
    });
  };

  return (
    <>
      {isLoaded && (
        <div>
          {/* Category filter */}
          <div className="form-row">
            <label htmlFor="category-filter">Filter by category:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.currentTarget.value)}
            >
              <option value="all">All</option>
              <option value="dessert">Dessert</option>
              <option value="main">Main</option>
              <option value="appetizer">Appetizer</option>
              <option value="drink">Drink</option>
              <option value="soups">Soups</option>
              <option value="salads">Salads</option>
            </select>
          </div>

          {/* Passes recipes and delete function to child */}
          <RecipeList recipes={recipes} onDelete={handleDelete} />
        </div>
      )}
    </>
  );
};

export default RecipeDisplay;