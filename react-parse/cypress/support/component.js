// Runs before every component spec. Adds cy.mount() for rendering React components.
import { mount } from "cypress/react";

Cypress.Commands.add("mount", mount);
