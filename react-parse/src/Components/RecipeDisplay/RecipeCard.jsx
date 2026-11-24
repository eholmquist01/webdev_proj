import { useState } from "react";
import "./RecipeCard.css";

// Recipe card display
// Recipes saved with photos can be switched between the text and the original photos
// The shopping list button only reports clicks up; RecipeDisplay owns the list state
const RecipeCard = ({
  recipe,
  onDelete,
  inShoppingList,
  isShoppingPending,
  onToggleShoppingList,
}) => {
  const [showPhoto, setShowPhoto] = useState(false);
  const photoUrls = recipe.photoUrls ?? [];
  const hasPhotos = photoUrls.length > 0;
  const photoLabel = photoUrls.length === 1 ? "View photo" : `View photos (${photoUrls.length})`;

  return (
    <article className="recipe-card">
      <h3>{recipe.name}</h3>

      <p>
        <strong>Category: </strong>
        {recipe.category}
      </p>

      {hasPhotos && (
        <button
          type="button"
          className="recipe-card-toggle"
          aria-pressed={showPhoto}
          onClick={() => setShowPhoto((current) => !current)}
        >
          {showPhoto ? "View recipe" : photoLabel}
        </button>
      )}

      {showPhoto && hasPhotos ? (
        photoUrls.map((url, i) => (
          <figure key={url} className="recipe-card-photo">
            <img
              src={url}
              alt={
                photoUrls.length > 1
                  ? `Page ${i + 1} of the ${recipe.name} recipe`
                  : `Photo of the ${recipe.name} recipe`
              }
            />
            <figcaption>
              {photoUrls.length > 1 && <span>Page {i + 1} of {photoUrls.length} · </span>}
              <a href={url} target="_blank" rel="noreferrer">
                Open full size
              </a>
            </figcaption>
          </figure>
        ))
      ) : (
        <>
          <p>{recipe.description}</p>

          <div className="recipe-card-section">
            <strong>Ingredients:</strong>
            <p className="recipe-card-multiline">{recipe.ingredients}</p>
          </div>

          <div className="recipe-card-section">
            <strong>Instructions:</strong>
            <p className="recipe-card-multiline">{recipe.instructions}</p>
          </div>
        </>
      )}

      {/* Outside the photo/text switch so both buttons show in either view */}
      <div className="recipe-card-actions">
        <button
          type="button"
          className="recipe-card-shopping"
          aria-pressed={inShoppingList}
          disabled={isShoppingPending}
          onClick={() => onToggleShoppingList(recipe)}
        >
          {isShoppingPending
            ? inShoppingList
              ? "Removing..."
              : "Adding..."
            : inShoppingList
              ? "Remove from shopping list"
              : "Add to shopping list"}
        </button>

        <button type="button" onClick={() => onDelete(recipe.id)}>
          Delete
        </button>
      </div>
    </article>
  );
};

export default RecipeCard;
