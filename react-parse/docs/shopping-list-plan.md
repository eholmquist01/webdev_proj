# Shopping List Feature — Plan

## Context
RecipeMe stores each recipe's ingredients as one free-text string (the `Main.jsx` textarea, shown in `RecipeCard` with its line breaks kept). Recipes filled in from a photo (partner's PR #10) have one ingredient per line, but typed recipes can still be comma-separated or free text. The shopping list feature should:
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

## Cloud Code (story 2) — new file in `back4app-cloud/cloud/`
The Cloud Code now lives in the repo at `back4app-cloud/cloud/` (at the repo root, next to `react-parse/`). It came in with your partner's PR #10. That folder has:
- `main.js`, with her `extractRecipe` function. It creates a shared `anthropic` client from `process.env.ANTHROPIC_API_KEY`.
- `package.json`, which depends on `@anthropic-ai/sdk`.

**Where the code goes:** `parseIngredients` goes in a new file, `back4app-cloud/cloud/shoppingList.js`. Her `main.js` gets one new line, `require("./shoppingList")`. That keeps our change to her file as small as possible. **Confirm with your partner before touching `main.js`.** If she'd rather keep it to one file, append the function to `main.js` instead.

- `Parse.Cloud.define("parseIngredients", async (request) => …)`
  - Requires `request.user`, so logged-out callers are rejected.
  - Validates that `request.params.text` is a non-empty string with a length cap.
  - Uses the existing `@anthropic-ai/sdk` dependency and the same client setup as `main.js`, with model `claude-haiku-5-5`. It doesn't use raw `fetch`.
  - The key comes from `process.env.ANTHROPIC_API_KEY`, which is already set in Back4App. It's never committed.
  - Uses the same structured-output pattern as `extractRecipe`: `output_config.format: { type: "json_schema", schema }`, with the schema `{ items: [{ name, quantity (number|null), unit (string|null), originalText }] }`.
  - The prompt says ingredients are usually one per line but may be comma-separated or free text.
  - Error handling copies hers: `stop_reason` "refusal" and "max_tokens" get their own checks, `RateLimitError` becomes a friendly `Parse.Error`, and any other API error becomes a generic `Parse.Error`.
  - Returns the `items` array.

**Deploy warning:** Back4App deploys the whole `cloud` folder, and a deploy replaces whatever was there before. Upload all of `main.js`, `shoppingList.js` and `package.json` together. Otherwise one partner's function wipes out the other's. Tell your partner before deploying.

## Service — `src/Services/ShoppingList.js` (new)
Follows the existing pattern: `import 'parse'`, `const Parse = window.Parse`, map Parse objects to plain objects, and filter every read by `owner`. The `Recipe` pointer is built locally with `Parse.Object.extend("Recipe").createWithoutData(id)`, so `Recipes.js` is not touched.
- `parseIngredients(text)` → `Parse.Cloud.run("parseIngredients", { text })` (story 2)
- `getShoppingListItems()` → `[{ id, name, quantity, unit, originalText, recipeId, recipeName }]` (story 3)
  - Uses `include("recipe")` plus `select(...)` with the item fields and `"recipe.name"`. Recipes now have a `photos` array of files, and the `select` keeps the query from loading them.
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
  - Since PR #10, the card has local `showPhoto` state and switches between the recipe text and the photos. The new button goes next to Delete, outside that switch, so it shows in both views.
  - The button gets its own class, because `.recipe-card button` makes every button pink.
  - Your partner just edited this file, so coordinate with her to avoid merge conflicts.
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
   - Build `back4app-cloud/cloud/shoppingList.js`, the `require` line in `main.js`, and the `parseIngredients` service function.
   - Deploy the whole `back4app-cloud/cloud` folder. The env var is already set.
   - Test by calling `parseIngredients("2 cups flour\n1 egg")` from the browser console. Then check that photo upload (`extractRecipe`) still works.
2. **Story 3:**
   - Create the `ShoppingListItem` class in Back4App (or let the first save create it, then lock down Class Level Permissions).
   - Add the CRUD and `aggregateItems` functions to the service.
3. **Story 4:** add the button wiring in `RecipeDisplay`, `RecipeList` and `RecipeCard`.
4. **Story 5:** add the `ShoppingList` and `ShoppingListItem` components, the route and the header link.
5. **Story 6:** set up Cypress and write the specs.
6. **Wrap-up:**
   - Add a `CHANGELOG.md` entry for the next version after the latest one in the changelog at that time, and bump `package.json` to match.
     - Photo upload (PR #10) has no changelog entry yet. If your partner adds it as 0.4.0, the shopping list becomes 0.5.0.
   - Add the `ShoppingList` service and `back4app-cloud/cloud/shoppingList.js` to CLAUDE.md's architecture notes.

## Verification
- Story 2: running `Parse.Cloud.run` in the browser console returns structured items. It's rejected when logged out. Photo upload still works after the deploy.
- Story 3: items appear in the Back4App dashboard with the correct owner, ACL and recipe pointer. Removing a recipe deletes only that recipe's items.
- Story 4: the button toggles state, survives a page refresh (the state is loaded from Back4App), and is disabled while a request is in progress.
- Story 5: shared ingredients are combined across recipes, and remove updates the list without a reload.
- Story 6: `npm test` passes, and `npm run lint` is clean.
