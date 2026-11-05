# Changelog

All notable changes to this project are documented in this file.

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