import React, { useEffect, useState } from "react";

const MainList = ({ recipes, onDelete }) => {
  if (recipes.length === 0) {
    return <p>No recipes yet - add one</p>;
  }

  return (
    <div id="recipe-list">
      <h2>All Recipes</h2>
      {recipes.map((recipe) => (
        <article key={recipe.id}>
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
      ))}
    </div>
  );
};

export default MainList;
