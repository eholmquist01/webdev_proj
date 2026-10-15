import React, { useEffect, useState } from "react";
import {
  getAllRecipes,
  getRecipesByCategory,
  deleteRecipe,
} from "../../Services/Recipes.jsx";
import { getAllCategories } from "../../Services/Categories.jsx";
import RecipeList from "./RecipeList.jsx";
import "./RecipeDisplay.css";

const RecipeDisplay = () => {
  // Initialize state variables
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState("");

  // Load categories when the component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories();

        console.log("Categories returned:", data);

        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Load recipes when the component mounts and whenever the selected category changes
  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoaded(false);
      setError("");

      try {
        const data =
          selectedCategory === "all"
            ? await getAllRecipes()
            : await getRecipesByCategory(selectedCategory);

        console.log("Recipes returned:", data);

        if (Array.isArray(data)) {
          setRecipes(data);
        } else {
          console.error(
            "Expected an array of recipes, but received:",
            data
          );

          setRecipes([]);
          setError("The recipe data was returned in an unexpected format.");
        }
      } catch (error) {
        console.error("Error loading recipes:", error);
        setRecipes([]);
        setError("Unable to load recipes. Please try again.");
      } finally {
        setIsLoaded(true);
      }
    };

    loadRecipes();
  }, [selectedCategory]);

  // Delete a recipe and remove it from the displayed list
  const handleDelete = async (id) => {
    try {
      await deleteRecipe(id);

      setRecipes((current) =>
        current.filter((recipe) => recipe.id !== id)
      );
    } catch (error) {
      console.error("Error deleting recipe:", error);
      setError("Unable to delete the recipe. Please try again.");
    }
  };

  return (
    <div className="recipe-display">
      <h1>Recipes</h1>

        {/* Filter by category */}
        <div className="form-row">
          <label htmlFor="category-filter">
            Filter by category:
          </label>

          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.currentTarget.value)
            }
          >
            <option value="all">All</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

      {/* Some debugging/error handling */}
      {/* Show a loading message while recipes are being fetched */}
      {!isLoaded && <p>Loading recipes...</p>}

      {/* Show an error if loading fails */}
      {isLoaded && error && <p role="alert">{error}</p>}

      {/* Display recipes after loading */}
      {isLoaded && !error && (
          <RecipeList
            recipes={recipes}
            onDelete={handleDelete}
          />
      )}
    </div>
  );
};

export default RecipeDisplay;
