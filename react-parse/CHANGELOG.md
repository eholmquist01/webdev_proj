# Changelog

All notable changes to this project are documented in this file.

## [0.4.0] - 2026-11-24

### Added
- Recipe photo upload: add up to 5 photos (one per page) of a recipe, and Claude reads them through the new `extractRecipe` Cloud Code function to fill in the recipe form
- Fields filled in from a photo are highlighted until edited, with the photos shown beside the form for checking
- Tips for photos that can't be read (blurry, cut off, too dark, glare, and more), with options to try again or replace a page
- Recipes are saved with their photos, and recipe cards can switch between the recipe text and the original photos
- Shopping list: "Add to shopping list" / "Remove from shopping list" button on each recipe card
- `parseIngredients` Cloud Code function that uses Claude to split a recipe's ingredient text into items with a name, quantity, and unit
- `ShoppingList.js` service with `getShoppingListItems`, `addRecipeToShoppingList`, `addTypedItemsToShoppingList`, `removeRecipeFromShoppingList`, `removeShoppingListItem`, and `aggregateItems`
- New `ShoppingListItem` class in Back4App, with each item owned by its user and linked to its recipe
- Shopping List page that combines ingredients across recipes, adds up amounts with the same unit, and shows which recipes each item is for
- Typing in your own shopping list items, like "2 cups milk, paper towels"
- Download the shopping list as a PDF
- `/ShoppingList` route and a "Shopping List" link in the header
- Cypress component tests for `aggregateItems` and `ShoppingListItem`, run with `npm test` (or `npm run cy:open` to watch them)
- Cloud Code now lives in the repo under `back4app-cloud/cloud/`

### Changed
- `createRecipe` accepts optional photos, and recipes returned by `Recipes.js` include `photoUrls`
- Recipe cards keep the line breaks in ingredients and instructions
- Deleting a recipe also removes its items from the shopping list
- `package.json` version now matches the changelog

### Fixed
- Changing the category filter quickly could show recipes from an earlier category when an older request finished last
- Recipes and categories no longer update state after leaving the Recipes page

## [0.3.0] - 2026-11-05

### Added
- User authentication through Back4App, with `createUser`, `loginUser`, `verifyUser`, and `logoutUser` service functions
- `Auth` landing page with links to log in or create an account
- `AuthLogin` and `AuthRegister` pages sharing a reusable `AuthForm` component
- `ProtectedRoute` component that only lets logged-in users reach protected pages and sends logged-out users to `/auth`
- Catch-all route that redirects unknown URLs to `/auth`
- Logged-in users who open the login, register, or landing page are sent back to the main page no matter what page they are on

### Changed
- The header layout is now protected, so the header and all pages inside it only render for logged-in users
- After logging in or registering, users go straight to `/main` instead of `/`
- Only displays recipes that were created by user, altered functions in `Recipes.js`
- Registration now redirects with `replace`, so the back button doesn't return to the form
- service name from `AuthService.js` to `Users.js`

### Fixed
- Alerts showing twice in development because of React StrictMode now shows once
- Card layout in CSS file

## [0.2.0] - 2026-10-16

### Added
- Rebuilt the app as a React + Vite project and moved it into a GitHub repository, with separate frontend and backend branches merged through pull requests
- Routing between pages, with a shared header
- Parse initialization in `index.jsx`, connecting the app to Back4App database backend
- Category model with `getAllCategories` function
- `getRecipesByCategory` service function, so recipes can be loaded and filtered by category
- Stylesheets for the app, including styled recipe cards
- Explanatory comments throughout the codebase

### Changed
- connect the `getAllRecipes`, `createRecipe`, and `deleteRecipe` through backend
- Recipes now belong to a single category instead of a list of categories
- `Main` now handles only the recipe form and creates recipes through the service

### Fixed
- backend parsing so the website displays recipe data
- formatting of recipe cards


### Removed
- `MainList` component, replaced by the new recipe display components

## [0.1.0] - Initial version (before the GitHub repository)

### Added
- Single-page recipe app with two components: `Main` (recipe form) and `MainList` (recipe list)
- Add and delete recipes, with each recipe able to have multiple categories