import React from "react";

const RecipeCard = ({ recipe, onDelete }) => {
  return (
    <article>
      <h3>{recipe.name}</h3>
      <p>
        <strong>Category: </strong>
        {Array.isArray(recipe.category)
          ? recipe.category.join(", ")
          : recipe.category}
      </p>
      <p>{recipe.description}</p>
      <p>
        <strong>Ingredients: </strong> {recipe.ingredients}
      </p>
      <p>
        <strong>Instructions: </strong> {recipe.instructions}
      </p>

      <button type="button" onClick={() => onDelete(recipe.id)}>
        Delete
      </button>
    </article>
  );
};

export default RecipeCard;