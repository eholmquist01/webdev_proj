import { aggregateItems } from "../../src/Services/ShoppingList.js";

// Builds a shopping list item like the ones getShoppingListItems returns
const item = (id, name, quantity, unit, recipeId = "r1", recipeName = "Bread") => ({
  id,
  name,
  quantity,
  unit,
  originalText: `${quantity ?? ""} ${unit ?? ""} ${name}`.trim(),
  recipeId,
  recipeName,
});

// aggregateItems is a pure function, so these tests run without Back4App
describe("aggregateItems", () => {
  it("returns an empty list for no items", () => {
    expect(aggregateItems([])).to.deep.equal([]);
  });

  it("adds up quantities that use the same unit", () => {
    const result = aggregateItems([
      item("a", "flour", 2, "cup", "r1", "Bread"),
      item("b", "flour", 1.5, "cup", "r2", "Cake"),
    ]);

    expect(result).to.have.length(1);
    expect(result[0].name).to.equal("flour");
    expect(result[0].amounts).to.deep.equal([{ quantity: 3.5, unit: "cup" }]);
  });

  it("keeps different units as separate amounts", () => {
    const result = aggregateItems([
      item("a", "butter", 1, "cup"),
      item("b", "butter", 2, "tbsp"),
    ]);

    expect(result[0].amounts).to.deep.equal([
      { quantity: 1, unit: "cup" },
      { quantity: 2, unit: "tbsp" },
    ]);
  });

  it("adds up counted items that have no unit", () => {
    const result = aggregateItems([item("a", "egg", 2, null), item("b", "egg", 3, null)]);

    expect(result[0].amounts).to.deep.equal([{ quantity: 5, unit: null }]);
  });

  it("shows items with no quantity once, as a null amount", () => {
    const result = aggregateItems([
      item("a", "salt", null, null, "r1", "Bread"),
      item("b", "salt", null, null, "r2", "Cake"),
    ]);

    expect(result[0].amounts).to.deep.equal([{ quantity: null, unit: null }]);
  });

  it("keeps a null quantity next to real amounts of the same ingredient", () => {
    const result = aggregateItems([
      item("a", "salt", 1, "tsp"),
      item("b", "salt", null, null),
    ]);

    expect(result[0].amounts).to.deep.equal([
      { quantity: 1, unit: "tsp" },
      { quantity: null, unit: null },
    ]);
  });

  it("matches names and units regardless of case and extra spaces", () => {
    const result = aggregateItems([
      item("a", "Olive Oil", 1, "Tbsp"),
      item("b", "  olive   oil ", 2, " tbsp "),
    ]);

    expect(result).to.have.length(1);
    expect(result[0].name).to.equal("olive oil");
    expect(result[0].amounts).to.deep.equal([{ quantity: 3, unit: "tbsp" }]);
  });

  it("rounds sums to avoid long decimals", () => {
    const result = aggregateItems([item("a", "milk", 0.1, "cup"), item("b", "milk", 0.2, "cup")]);

    expect(result[0].amounts[0].quantity).to.equal(0.3);
  });

  it("lists each recipe once and keeps every item id", () => {
    const result = aggregateItems([
      item("a", "flour", 2, "cup", "r1", "Bread"),
      item("b", "flour", 1, "tbsp", "r1", "Bread"),
      item("c", "flour", 1, "cup", "r2", "Cake"),
    ]);

    expect(result[0].recipes).to.deep.equal([
      { id: "r1", name: "Bread" },
      { id: "r2", name: "Cake" },
    ]);
    expect(result[0].itemIds).to.deep.equal(["a", "b", "c"]);
  });

  it("sorts groups by name and skips items with no name", () => {
    const result = aggregateItems([
      item("a", "sugar", 1, "cup"),
      item("b", "", 1, "cup"),
      item("c", "apple", 2, null),
    ]);

    expect(result.map((group) => group.name)).to.deep.equal(["apple", "sugar"]);
  });
});
