import { useEffect, useState } from "react";
import { createRecipe } from "../../Services/Recipes.js";
import { getAllCategories } from "../../Services/Categories.js";
import "./Main.css";

const Main = () => {
  // Initialize state variables
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // Track submission status and messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load categories when the component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories();
        console.log("Categories returned:", data);
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Unable to load categories.");
      }
    };

    loadCategories();
  }, []);

  // Create a recipe and clear the form after success
  const enterSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Validate required fields
    if (!name.trim()) {
      setError("Please enter a recipe name.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    try {
      setIsSubmitting(true);

      console.log("Submitting recipe:", {
        name,
        description,
        categoryId,
        ingredients,
        instructions,
      });

      await createRecipe(
        name.trim(),
        description,
        categoryId,
        ingredients,
        instructions
      );

      // Clear the form only if creation succeeds
      setName("");
      setDescription("");
      setCategoryId("");
      setIngredients("");
      setInstructions("");

      setSuccess("Recipe added successfully!");
    } catch (err) {
      console.error("Error creating recipe:", err);
      setError(
        err?.message || "Unable to add recipe. Check the console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-page">
      <h1>RecipeMe - a resource for collecting and organizing recipes!</h1>
      <p>Add your recipe below:</p>

      {success && (
      <div className="success-popup" role="status">
        <span className="success-icon">✓</span>
        {success}
        <button
          type="button"
          className="success-close"
          onClick={() => setSuccess("")}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    )}

      <form onSubmit={enterSubmit}>
        <div className="form-row">
          <label htmlFor="recipe-name">Recipe Name:</label>
          <input
            type="text"
            id="recipe-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="recipe-description">
            Recipe Description:
          </label>
          <input
            type="text"
            id="recipe-description"
            name="description"
            value={description}
            onChange={(event) =>
              setDescription(event.currentTarget.value)
            }
          />
        </div>

        <div className="form-row">
          <label htmlFor="recipe-category">Category:</label>
          <select
            id="recipe-category"
            name="category"
            value={categoryId}
            onChange={(event) =>
              setCategoryId(event.currentTarget.value)
            }
            required
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="ingredients">Ingredients:</label>
          <textarea
            id="ingredients"
            name="ingredients"
            rows={5}
            value={ingredients}
            onChange={(event) =>
              setIngredients(event.currentTarget.value)
            }
          />
        </div>

        <div className="form-row">
          <label htmlFor="instructions">Instructions:</label>
          <textarea
            id="instructions"
            name="instructions"
            rows={5}
            value={instructions}
            onChange={(event) =>
              setInstructions(event.currentTarget.value)
            }
          />
        </div>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding Recipe..." : "Add Recipe"}
        </button>
      </form>
    </div>
  );
};

export default Main;
