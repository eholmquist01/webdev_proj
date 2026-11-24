import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getShoppingListItems,
  removeShoppingListItem,
  removeRecipeFromShoppingList,
  addTypedItemsToShoppingList,
  aggregateItems,
} from "../../Services/ShoppingList.js";
import ShoppingListItem from "./ShoppingListItem.jsx";
import AddItemForm from "./AddItemForm.jsx";
import { downloadShoppingListPdf } from "./shoppingListPdf.js";
import "./ShoppingList.css";

// Master shopping list page (parent): owns the items, the add/remove handlers,
// and the typed-in text. Each ShoppingListItem row only displays one combined
// ingredient and reports "remove" clicks back up here; AddItemForm reports
// typing and submits back up here.
const ShoppingList = () => {
  // Raw items from Back4App, one per ingredient per recipe (or per typed-in item)
  const [items, setItems] = useState([]);
  // Text in the "Add your own items" box, and whether it's being saved
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  // Errors from removing, shown without hiding the list
  const [actionError, setActionError] = useState("");
  // Keys of rows/recipes being removed right now (their buttons are disabled)
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  // True while the PDF is being built (the first click also loads jsPDF)
  const [isMakingPdf, setIsMakingPdf] = useState(false);

  // False once the page is gone, so slow deletes don't update state after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true; // StrictMode runs effects twice, so set it again here
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load the shopping list when the page opens
  useEffect(() => {
    let ignore = false; // set to true on unmount so we skip the state update

    const loadItems = async () => {
      try {
        const data = await getShoppingListItems();
        if (!ignore) {
          setItems(data);
        }
      } catch (error) {
        console.error("Error loading shopping list:", error);
        if (!ignore) {
          setError("Unable to load your shopping list. Please try again.");
        }
      } finally {
        if (!ignore) {
          setIsLoaded(true);
        }
      }
    };

    loadItems();
    return () => {
      ignore = true;
    };
  }, []);

  // Combine the raw items into one row per ingredient. Recalculated on every
  // render, so removing items updates the totals straight away.
  const groups = aggregateItems(items);

  // Recipes that have items on the list, for the "remove a whole recipe" buttons
  const recipesOnList = [
    ...new Map(
      items
        .filter((item) => item.recipeId)
        .map((item) => [item.recipeId, { id: item.recipeId, name: item.recipeName }])
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  // Shared by both remove handlers: marks the button pending, runs the delete,
  // then drops the removed items from state (no reload needed)
  const runRemove = async (key, remove, shouldKeep, failMessage) => {
    setPendingKeys((current) => new Set(current).add(key));
    setActionError("");

    try {
      await remove();
      if (!isMountedRef.current) return;
      setItems((current) => current.filter(shouldKeep));
    } catch (error) {
      console.error("Error removing from shopping list:", error);
      if (isMountedRef.current) {
        setActionError(failMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setPendingKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    }
  };

  // Remove one combined row: deletes every item in it (from every recipe)
  const handleRemoveGroup = (group) => {
    const ids = new Set(group.itemIds);
    return runRemove(
      `item:${group.name}`,
      () => Promise.all(group.itemIds.map(removeShoppingListItem)),
      (item) => !ids.has(item.id),
      `Couldn't remove "${group.name}". Please try again.`
    );
  };

  // Remove all of one recipe's items
  const handleRemoveRecipe = (recipe) => {
    return runRemove(
      `recipe:${recipe.id}`,
      () => removeRecipeFromShoppingList(recipe.id),
      (item) => item.recipeId !== recipe.id,
      `Couldn't remove "${recipe.name}" from your list. Please try again.`
    );
  };

  // Add the typed-in items (called by AddItemForm). The text goes through the
  // same AI parsing as recipes, so "2 cups milk" combines with milk from a recipe.
  const handleAddTyped = async () => {
    const text = newItemText.trim();
    if (!text) return;

    setIsAdding(true);
    setActionError("");
    try {
      const added = await addTypedItemsToShoppingList(text);
      if (!isMountedRef.current) return;

      if (added.length === 0) {
        setActionError(`Couldn't find any items in "${text}".`);
      } else {
        setItems((current) => [...current, ...added]);
        setNewItemText(""); // clear the box only when it worked
      }
    } catch (error) {
      console.error("Error adding items:", error);
      if (isMountedRef.current) {
        setActionError(`Couldn't add those items. ${error.message || "Please try again."}`);
      }
    } finally {
      if (isMountedRef.current) {
        setIsAdding(false);
      }
    }
  };

  // Download the combined list (what's on screen) as a PDF
  const handleDownloadPdf = async () => {
    setIsMakingPdf(true);
    setActionError("");
    try {
      await downloadShoppingListPdf(groups, recipesOnList);
    } catch (error) {
      console.error("Error creating PDF:", error);
      if (isMountedRef.current) {
        setActionError("Couldn't create the PDF. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsMakingPdf(false);
      }
    }
  };

  return (
    <div className="shopping-list">
      <div className="shopping-list-header">
        <h1>Shopping List</h1>
        {isLoaded && !error && groups.length > 0 && (
          <button
            type="button"
            className="shopping-list-download"
            disabled={isMakingPdf}
            onClick={handleDownloadPdf}
          >
            {isMakingPdf ? "Creating PDF..." : "Download PDF"}
          </button>
        )}
      </div>

      {!isLoaded && <p>Loading your shopping list...</p>}

      {isLoaded && error && <p role="alert">{error}</p>}

      {isLoaded && !error && (
        <AddItemForm
          value={newItemText}
          isAdding={isAdding}
          onChange={setNewItemText}
          onSubmit={handleAddTyped}
        />
      )}

      {actionError && <p role="alert">{actionError}</p>}

      {isLoaded && !error && groups.length === 0 && (
        <p>
          Your shopping list is empty. Type items in above, or add recipes from
          the <Link to="/RecipeDisplay">Recipes</Link> page.
        </p>
      )}

      {isLoaded && !error && groups.length > 0 && (
        <>
          {/* Only when there are recipe items (a list can be all typed-in items) */}
          {recipesOnList.length > 0 && (
          <section className="shopping-list-recipes" aria-label="Recipes on your list">
            <h2>Recipes on your list</h2>
            <ul>
              {recipesOnList.map((recipe) => (
                <li key={recipe.id}>
                  <span>{recipe.name || "Deleted recipe"}</span>
                  <button
                    type="button"
                    className="shopping-list-secondary"
                    disabled={pendingKeys.has(`recipe:${recipe.id}`)}
                    onClick={() => handleRemoveRecipe(recipe)}
                  >
                    {pendingKeys.has(`recipe:${recipe.id}`) ? "Removing..." : "Remove recipe"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          )}

          <h2>Items ({groups.length})</h2>
          <ul className="shopping-list-items">
            {groups.map((group) => (
              <ShoppingListItem
                key={group.name}
                group={group}
                isPending={pendingKeys.has(`item:${group.name}`)}
                onRemove={handleRemoveGroup}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default ShoppingList;
