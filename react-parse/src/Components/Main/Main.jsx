import { useEffect, useState } from "react";
import { createRecipe } from "../../Services/Recipes.js";
import { getAllCategories } from "../../Services/Categories.js";
import "./Main.css";
import PhotoUpload from "../PhotoUpload/PhotoUpload.jsx";
import { photoSrc } from "../../Services/RecipePhoto.js";

const Main = () => {
  // Initialize state variables
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // Recipe photos ([{ id, base64, mediaType }], one per page), saved along with the recipe
  const [photos, setPhotos] = useState([]);
  // Which page is shown large beside the form while reviewing
  const [reviewPage, setReviewPage] = useState(0);
  // True once the photos have been read: they are shown beside the form
  const [isReviewing, setIsReviewing] = useState(false);
  // Fields filled in from the photo that the user hasn't edited yet
  const [aiFields, setAiFields] = useState(() => new Set());

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

    // Hide the success message after 3 seconds
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(""), 3000);

    // Cancel the timer if the message changes or the component unmounts
    return () => clearTimeout(timer);
  }, [success]);

  // New photos (or none) mean the old highlights no longer apply
  const handlePhotosChange = (nextPhotos) => {
    setPhotos(nextPhotos);
    setReviewPage(0);
    setIsReviewing(false);
    setAiFields(new Set());
  };

  // Fill the form with the fields read from the recipe photo and highlight them
  const applyExtractedRecipe = (recipe) => {
    const values = {
      name: recipe.name || "",
      description: recipe.description || "",
      category: recipe.categoryId || "",
      ingredients: (recipe.ingredients || []).join("\n"),
      instructions: (recipe.instructions || [])
        .map((step, i) => `${i + 1}. ${step}`)
        .join("\n"),
    };

    setName(values.name);
    setDescription(values.description);
    if (values.category) setCategoryId(values.category);
    setIngredients(values.ingredients);
    setInstructions(values.instructions);

    // Only highlight fields that actually got a value
    setAiFields(new Set(Object.keys(values).filter((key) => values[key])));
    setIsReviewing(true);
    setError("");
    setSuccess("");
  };

  // Remove a field's highlight once the user edits it
  const clearAi = (key) => {
    setAiFields((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const aiClass = (key) => (aiFields.has(key) ? "ai-filled" : undefined);

  const showPhotos = isReviewing && photos.length > 0;
  const currentPage = Math.min(reviewPage, photos.length - 1);

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
        instructions,
        photos
      );

      // Clear the form only if creation succeeds
      setName("");
      setDescription("");
      setCategoryId("");
      setIngredients("");
      setInstructions("");
      handlePhotosChange([]);

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
    <div className={isReviewing ? "main-page main-page--wide" : "main-page"}>
      <h1>RecipeMe - a resource for collecting and organizing recipes!</h1>
      <p>Add your recipe below:</p>

      <PhotoUpload
        photos={photos}
        onPhotosChange={handlePhotosChange}
        onRecipeExtracted={applyExtractedRecipe}
        reviewing={isReviewing}
      />

      <div className={showPhotos ? "main-review" : undefined}>
        {showPhotos && (
          <aside className="main-review-photo">
            <img
              src={photoSrc(photos[currentPage])}
              alt={`Page ${currentPage + 1} of your recipe photos`}
            />

            {/* Switch between pages when there is more than one */}
            {photos.length > 1 && (
              <div className="main-review-pages" role="group" aria-label="Recipe pages">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    type="button"
                    className={i === currentPage ? "is-current" : undefined}
                    aria-pressed={i === currentPage}
                    onClick={() => setReviewPage(i)}
                  >
                    <img src={photoSrc(photo)} alt="" />
                    <span>Page {i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        <form onSubmit={enterSubmit}>
          {aiFields.size > 0 && (
            <p className="ai-legend">
              <span className="ai-legend-swatch" aria-hidden="true" />
              Highlighted fields were filled in from your photo. Check them against the picture.
            </p>
          )}

          <div className="form-row">
            <label htmlFor="recipe-name">Recipe Name:</label>
            <input
              type="text"
              id="recipe-name"
              name="name"
              className={aiClass("name")}
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                clearAi("name");
              }}
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
              className={aiClass("description")}
              value={description}
              onChange={(event) => {
                setDescription(event.currentTarget.value);
                clearAi("description");
              }}
            />
          </div>

          <div className="form-row">
            <label htmlFor="recipe-category">Category:</label>
            <select
              id="recipe-category"
              name="category"
              className={aiClass("category")}
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.currentTarget.value);
                clearAi("category");
              }}
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
              className={aiClass("ingredients")}
              value={ingredients}
              onChange={(event) => {
                setIngredients(event.currentTarget.value);
                clearAi("ingredients");
              }}
            />
          </div>

          <div className="form-row">
            <label htmlFor="instructions">Instructions:</label>
            <textarea
              id="instructions"
              name="instructions"
              rows={5}
              className={aiClass("instructions")}
              value={instructions}
              onChange={(event) => {
                setInstructions(event.currentTarget.value);
                clearAi("instructions");
              }}
            />
          </div>

          {error && <p role="alert">{error}</p>}
          {success && <p role="status">{success}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Recipe..." : "Add Recipe"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Main;
