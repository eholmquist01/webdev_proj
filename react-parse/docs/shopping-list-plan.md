# Shopping List Feature — Plan

## Context
RecipeMe stores each recipe's ingredients as one free-text string (the `Main.jsx` textarea, shown unchanged in `RecipeCard`). The shopping list feature should:
- use AI to split that text into individual items
- let a user add or remove a recipe's ingredients from the list
- combine items from all recipes into one master list stored in Back4App
- show that list on its own page
- include a Cypress test for one module (story 6)

Constraints from CLAUDE.md:
- Don't modify `Recipes.js`, `Categories.js`, `Users.js` or the existing Back4App classes.
- Keep secrets in Cloud Code only.
- The parent component owns data and children use props and callbacks.
- Handle loading, errors and unmount properly.
- Work on the `eh-shopping-list` branch (already checked out) and never on `main`.
- Do one story at a time and stop after each one.

## Back4App schema — new class `ShoppingListItem`
| Field | Type | Notes |
|---|---|---|
| `name` | String | normalized ingredient name, e.g. "all-purpose flour" |
| `quantity` | Number (nullable) | e.g. 2. Null for "salt to taste" |
| `unit` | String (nullable) | e.g. "cup". Singular and lowercase so items can be summed |
| `originalText` | String | the original line, e.g. "2 cups flour", kept for display and fallback |
| `recipe` | Pointer → `Recipe` | which recipe the item came from (lets us remove a recipe's items) |
| `owner` | Pointer → `_User` | same pattern as `Recipe` |
| ACL | owner read/write only | `new Parse.ACL(Parse.User.current())`, same as `createRecipe` |

There's no separate "ShoppingList" class. The master list is all of a user's `ShoppingListItem` rows, combined on the client.

## Cloud Code (story 2) — add to the existing Back4App `main.js`
Your partner's Back4App `main.js` currently holds only the template `hello` function and comments. I'll **append** `parseIngredients` below it and leave `hello` alone. I'll also keep a copy in the repo at `cloud/main.js` so the code gets reviewed and graded. That copy leaves out the template's curl comment, because it contains the REST API key. You then paste or deploy the function through the Back4App dashboard → Cloud Code.
- `Parse.Cloud.define("parseIngredients", async (request) => …)`
  - Requires `request.user`, so logged-out callers are rejected.
  - Validates that `request.params.text` is a non-empty string with a length cap.
  - Calls the Anthropic Messages API with `fetch` and model `claude-haiku-5-5`.
  - The key comes from `process.env.ANTHROPIC_API_KEY`, the env var your partner already created in Back4App. It's never committed.
  - If the key is missing, the function throws a clear `Parse.Error`.
  - Prompts for JSON `[{ name, quantity, unit, originalText }]`. Before writing this I'll check the claude-api skill for the current structured-output and JSON options.
  - Parses and validates the response shape, then returns the array. Throws `Parse.Error` on failure.

## Service — `src/Services/ShoppingList.js` (new)
Follows the existing pattern: `import 'parse'`, `const Parse = window.Parse`, map Parse objects to plain objects, and filter every read by `owner`. The `Recipe` pointer is built locally with `Parse.Object.extend("Recipe").createWithoutData(id)`, so `Recipes.js` is not touched.
- `parseIngredients(text)` → `Parse.Cloud.run("parseIngredients", { text })` (story 2)
- `getShoppingListItems()` → `[{ id, name, quantity, unit, originalText, recipeId, recipeName }]` (uses `include("recipe")`) (story 3)
- `addRecipeToShoppingList(recipe)` → parse `recipe.ingredients`, build the items, then `Parse.Object.saveAll` (story 3)
- `removeRecipeFromShoppingList(recipeId)` → query by recipe pointer and owner, then `Parse.Object.destroyAll` (story 3)
- `removeShoppingListItem(id)` → delete a single item (story 3)
- `aggregateItems(items)` (story 3) is a **pure function**, so it can be tested without Back4App:
  - Groups items by normalized name.
  - Sums `quantity` when the units match.
  - Keeps amounts with different units or no quantity as separate entries in that group.
  - Records which recipes each group came from.

## Components
Each component gets its own folder and a co-located CSS file.
- **`RecipeDisplay.jsx`** (changed, parent) (story 4):
  - Also loads `getShoppingListItems()` to get the set of recipe ids already on the list.
  - Passes `inShoppingList` and `onToggleShoppingList` down.
  - Tracks a "pending" recipe id so the button is disabled while the AI call runs.
  - (Optional, ask first) Also removes a deleted recipe's items in `handleDelete`, so no items are left pointing at a deleted recipe.
- **`RecipeList.jsx`** (changed): passes the new props through.
- **`RecipeCard.jsx`** (changed): adds an "Add to shopping list" / "Remove from shopping list" button that calls `onToggleShoppingList(recipe)`.
- **`ShoppingList/ShoppingList.jsx`** (new, parent) (story 5):
  - Loads items, runs `aggregateItems`, and shows loading and error states.
  - Owns the remove handlers and updates the list locally after a delete, same as `RecipeDisplay.handleDelete`.
- **`ShoppingList/ShoppingListItem.jsx`** (new, child): displays one aggregated row (total amount, which recipes it's from) with a remove button that calls back up to the parent.
- **`Components.jsx`**: adds a `/ShoppingList` route inside the protected `HeaderLayout`.
- **`Header.jsx`**: adds a "Shopping List" link.

To avoid state updates after unmount, every data-loading effect sets `let ignore = false` and the cleanup sets `ignore = true`. The effect only calls `setState` when `!ignore`.

## Testing (story 6) — Cypress
- Add a `cypress` dev dependency and `cypress.config.js` with `component: { devServer: { framework: "react", bundler: "vite" } }`. I'll check that Cypress supports Vite 8 when installing. If it doesn't, the fallback is e2e mode against `npm run dev`.
- `cypress/component/aggregateItems.cy.js` runs unit-style tests of `aggregateItems`:
  - summing items with the same unit
  - keeping amounts with different units separate
  - null quantities
  - case and whitespace differences in names
- `cypress/component/ShoppingListItem.cy.jsx` mounts the child with fixed props and checks that it renders and that the remove callback fires.
- Add scripts: `"test": "cypress run --component"` and `"cy:open": "cypress open"`.

## Build order (stop after each story for you to test and commit)
1. **Story 2:**
   - Build `cloud/main.js` and the `parseIngredients` service function.
   - Deploy the Cloud Code and set the env var in Back4App.
   - Test by calling `parseIngredients("2 cups flour\n1 egg")` from the browser console.
2. **Story 3:**
   - Create the `ShoppingListItem` class in Back4App (or let the first save create it, then lock down Class Level Permissions).
   - Add the CRUD and `aggregateItems` functions to the service.
3. **Story 4:** add the button wiring in `RecipeDisplay`, `RecipeList` and `RecipeCard`.
4. **Story 5:** add the `ShoppingList` and `ShoppingListItem` components, the route and the header link.
5. **Story 6:** set up Cypress and write the specs.
6. **Wrap-up:**
   - Add a `CHANGELOG.md` entry for 0.4.0 and bump `package.json` to 0.4.0.
   - Add the `ShoppingList` service and `cloud/` to CLAUDE.md's architecture notes.

## Verification
- Story 2: running `Parse.Cloud.run` in the browser console returns structured items. It's rejected when logged out.
- Story 3: items appear in the Back4App dashboard with the correct owner, ACL and recipe pointer. Removing a recipe deletes only that recipe's items.
- Story 4: the button toggles state, survives a page refresh (the state is loaded from Back4App), and is disabled while a request is in progress.
- Story 5: shared ingredients are combined across recipes, and remove updates the list without a reload.
- Story 6: `npm test` passes, and `npm run lint` is clean.
