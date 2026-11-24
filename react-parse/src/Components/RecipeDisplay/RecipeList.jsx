import { Link } from "react-router-dom";
import RecipeCard from "./RecipeCard.jsx";
import "./RecipeList.css";

const RecipeList = ({
  recipes,
  onDelete,
  shoppingRecipeIds,
  pendingRecipeIds,
  onToggleShoppingList,
}) => {
// show message if no recipes
  if (recipes.length === 0) {
    return (
      <p>
        No recipes found - <Link to="/">add one</Link>
      </p>
    );
  }
    // display recipes
  return (
    <div id="recipe-list">
      <h2>Recipes</h2>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onDelete={onDelete}
          inShoppingList={shoppingRecipeIds.has(recipe.id)}
          isShoppingPending={pendingRecipeIds.has(recipe.id)}
          onToggleShoppingList={onToggleShoppingList}
        />
      ))}
    </div>
  );
};

export default RecipeList;