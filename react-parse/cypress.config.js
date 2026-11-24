import { defineConfig } from "cypress";

// Component testing: Cypress starts its own Vite dev server (using vite.config.js,
// so the "parse" alias works) and mounts components or runs modules in a real browser.
export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
