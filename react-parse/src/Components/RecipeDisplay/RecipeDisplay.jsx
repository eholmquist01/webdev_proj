import { useEffect, useRef, useState } from "react";
import {
  getAllRecipes,
  getRecipesByCategory,
  deleteRecipe,
} from "../../Services/Recipes.js";
import { getAllCategories } from "../../Services/Categories.js";
import {
  getShoppingListItems,
  addRecipeToShoppingList,
  removeRecipeFromShoppingList,
} from "../../Services/ShoppingList.js";
import RecipeList from "./RecipeList.jsx";
import "./RecipeDisplay.css";

const RecipeDisplay = () => {
  // Initialize state variables
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState("");

  // Shopping list state, owned here and passed down to each RecipeCard
  // Ids of recipes that have items on the shopping list
  const [shoppingRecipeIds, setShoppingRecipeIds] = useState(() => new Set());
  // Ids of recipes being added/removed right now (their buttons are disabled)
  const [pendingRecipeIds, setPendingRecipeIds] = useState(() => new Set());
  const [shoppingError, setShoppingError] = useState("");

  // False once the page is gone, so slow requests (the AI call can take a few
  // seconds) don't update state after the user navigates away
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true; // StrictMode runs effects twice, so set it again here
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load which recipes are already on the shopping list
  useEffect(() => {
    let ignore = false; // set to true on unmount so we skip the state update

    const loadShoppingList = async () => {
      try {
        const items = await getShoppingListItems();
        if (!ignore) {
          setShoppingRecipeIds(new Set(items.map((item) => item.recipeId)));
        }
      } catch (error) {
        console.error("Error loading shopping list:", error);
        if (!ignore) {
          setShoppingError("Unable to load your shopping list.");
        }
      }
    };

    loadShoppingList();
    return () => {
      ignore = true;
    };
  }, []);

  // Load categories when the component mounts
  useEffect(() => {
    let ignore = false; // set to true on unmount so we skip the state update

    const loadCategories = async () => {
      try {
        const data = await getAllCategories();

        console.log("Categories returned:", data);

        if (!ignore) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        if (!ignore) {
          setCategories([]);
        }
      }
    };

    loadCategories();
    return () => {
      ignore = true;
    };
  }, []);

  // Load recipes when the component mounts and whenever the selected category changes
  useEffect(() => {
    // Set to true on unmount, or when the category changes before this request
    // finishes, so an older (slower) response can't overwrite a newer one
    let ignore = false;

    const loadRecipes = async () => {
      setIsLoaded(false);
      setError("");

      try {
        const data =
          selectedCategory === "all"
            ? await getAllRecipes()
            : await getRecipesByCategory(selectedCategory);

        console.log("Recipes returned:", data);

        if (ignore) return;

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
        if (ignore) return;
        setRecipes([]);
        setError("Unable to load recipes. Please try again.");
      } finally {
        if (!ignore) {
          setIsLoaded(true);
        }
      }
    };

    loadRecipes();
    return () => {
      ignore = true;
    };
  }, [selectedCategory]);

  // Delete a recipe, remove it from the displayed list, and delete its shopping list items
  const handleDelete = async (id) => {
    try {
      await deleteRecipe(id);
    } catch (error) {
      console.error("Error deleting recipe:", error);
      if (isMountedRef.current) {
        setError("Unable to delete the recipe. Please try again.");
      }
      return; // recipe wasn't deleted, so keep its shopping list items too
    }

    if (isMountedRef.current) {
      setRecipes((current) =>
        current.filter((recipe) => recipe.id !== id)
      );
    }

    // Always clean up, even if shoppingRecipeIds failed to load, so no items
    // are left pointing at a deleted recipe (finds nothing if it wasn't on the list)
    try {
      await removeRecipeFromShoppingList(id);
      if (!isMountedRef.current) return;
      setShoppingRecipeIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error("Error removing deleted recipe from shopping list:", error);
      if (isMountedRef.current) {
        setShoppingError(
          "The recipe was deleted, but its items couldn't be removed from your shopping list."
        );
      }
    }
  };

  // Add a recipe's ingredients to the shopping list, or remove them if already there
  // (called by RecipeCard's button)
  const handleToggleShoppingList = async (recipe) => {
    const isOnList = shoppingRecipeIds.has(recipe.id);

    // copy the Set before changing it: React only re-renders for a new object
    setPendingRecipeIds((current) => new Set(current).add(recipe.id));
    setShoppingError("");

    try {
      if (isOnList) {
        await removeRecipeFromShoppingList(recipe.id);
      } else {
        await addRecipeToShoppingList(recipe);
      }
      if (!isMountedRef.current) return;

      setShoppingRecipeIds((current) => {
        const next = new Set(current);
        if (isOnList) {
          next.delete(recipe.id);
        } else {
          next.add(recipe.id);
        }
        return next;
      });
    } catch (error) {
      console.error("Error updating shopping list:", error);
      if (!isMountedRef.current) return;
      // Cloud Code errors carry a message meant for the user
      setShoppingError(
        `Couldn't update the shopping list for "${recipe.name}". ${error.message || "Please try again."}`
      );
    } finally {
      if (isMountedRef.current) {
        setPendingRecipeIds((current) => {
          const next = new Set(current);
          next.delete(recipe.id);
          return next;
        });
      }
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

      {/* Shopping list problems are shown without hiding the recipes */}
      {shoppingError && <p role="alert">{shoppingError}</p>}

      {/* Display recipes after loading */}
      {isLoaded && !error && (
          <RecipeList
            recipes={recipes}
            onDelete={handleDelete}
            shoppingRecipeIds={shoppingRecipeIds}
            pendingRecipeIds={pendingRecipeIds}
            onToggleShoppingList={handleToggleShoppingList}
          />
      )}
    </div>
  );
};

export default RecipeDisplay;
