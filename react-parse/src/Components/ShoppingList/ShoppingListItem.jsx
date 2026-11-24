import { formatAmounts } from "./formatAmount.js";
import "./ShoppingListItem.css";

// One row of the shopping list (child): shows a combined ingredient and
// reports "remove" clicks to the ShoppingList parent, which does the delete.
//   group      { name, amounts: [{ quantity, unit }], recipes: [{ id, name }], addedByUser, itemIds }
//   isPending  true while this row is being removed
//   onRemove   called with the group
const ShoppingListItem = ({ group, isPending, onRemove }) => {
  const recipeNames = group.recipes.map((recipe) => recipe.name || "Deleted recipe");
  // Typed-in items have no recipe, so they're listed as "added by you"
  if (group.addedByUser) {
    recipeNames.push("added by you");
  }

  return (
    <li className="shopping-list-item">
      <div className="shopping-list-item-text">
        <span className="shopping-list-item-name">{group.name}</span>
        <span className="shopping-list-item-amount">
          {formatAmounts(group.amounts)}
        </span>
        {recipeNames.length > 0 && (
          <span className="shopping-list-item-recipes">
            For: {recipeNames.join(", ")}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => onRemove(group)}
        aria-label={`Remove ${group.name} from shopping list`}
      >
        {isPending ? "Removing..." : "Remove"}
      </button>
    </li>
  );
};

export default ShoppingListItem;
