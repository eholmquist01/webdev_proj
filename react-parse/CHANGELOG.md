# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-10-16

### Added
- Rebuilt the app as a React + Vite project and moved it into a GitHub repository, with separate frontend and backend branches merged through pull requests
- Routing between pages, with a shared header
- Parse initialization in `index.jsx`, connecting the app to Back4App database backend
- Category model with `getAllCategories` function
- `getRecipesByCategory` service function, so recipes can be loaded and filtered by category
- Stylesheets for the app, including styled recipe cards
- Explanatory comments throughout the codebasea

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