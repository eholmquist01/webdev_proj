import ShoppingListItem from "../../src/Components/ShoppingList/ShoppingListItem.jsx";

// A combined row like the ones aggregateItems returns
const group = {
  name: "flour",
  amounts: [
    { quantity: 3.5, unit: "cup" },
    { quantity: 2, unit: "tbsp" },
  ],
  recipes: [
    { id: "r1", name: "Bread" },
    { id: "r2", name: "Cake" },
  ],
  itemIds: ["a", "b", "c"],
};

// The row is a child component: it gets everything through props
// and reports clicks through onRemove, so it can be tested on its own.
describe("<ShoppingListItem />", () => {
  // The component renders an <li>, so mount it inside a <ul>
  const mountRow = (props) =>
    cy.mount(
      <ul>
        <ShoppingListItem group={group} isPending={false} onRemove={cy.stub().as("onRemove")} {...props} />
      </ul>
    );

  it("shows the name, the combined amounts and the recipes", () => {
    mountRow();

    cy.contains(".shopping-list-item-name", "flour");
    // units are made plural, abbreviations stay the same
    cy.contains(".shopping-list-item-amount", "3.5 cups + 2 tbsp");
    cy.contains(".shopping-list-item-recipes", "For: Bread, Cake");
  });

  it("shows 'as needed' for items with no quantity", () => {
    mountRow({
      group: { ...group, name: "salt", amounts: [{ quantity: null, unit: null }] },
    });

    cy.contains(".shopping-list-item-amount", "as needed");
  });

  it("labels items from a deleted recipe", () => {
    mountRow({ group: { ...group, recipes: [{ id: "r9", name: "" }] } });

    cy.contains(".shopping-list-item-recipes", "For: Deleted recipe");
  });

  it("labels typed-in items as added by you", () => {
    mountRow({ group: { ...group, recipes: [{ id: "r1", name: "Bread" }], addedByUser: true } });

    cy.contains(".shopping-list-item-recipes", "For: Bread, added by you");
  });

  it("calls onRemove with the group when Remove is clicked", () => {
    mountRow();

    cy.contains("button", "Remove").click();
    cy.get("@onRemove").should("have.been.calledOnceWith", group);
  });

  it("disables the button while the row is being removed", () => {
    mountRow({ isPending: true });

    cy.contains("button", "Removing...").should("be.disabled");
    cy.get("@onRemove").should("not.have.been.called");
  });
});
