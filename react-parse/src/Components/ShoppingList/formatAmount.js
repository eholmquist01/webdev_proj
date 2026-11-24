// Shared by ShoppingListItem (on screen) and shoppingListPdf (the download),
// so both show amounts the same way.

// Short units that stay the same in the plural ("2 tbsp", not "2 tbsps")
const NO_PLURAL = new Set(["tbsp", "tsp", "g", "kg", "mg", "ml", "l", "oz", "lb", "fl oz", "qt", "pt"]);

// "cup" -> "cups", "pinch" -> "pinches"; leaves abbreviations alone
const pluralUnit = (unit, quantity) => {
  if (quantity === 1 || NO_PLURAL.has(unit) || unit.endsWith("s")) return unit;
  return /(ch|sh|x)$/.test(unit) ? `${unit}es` : `${unit}s`;
};

// { quantity: 2, unit: "cup" } -> "2 cups"; no quantity -> "as needed"
export const formatAmount = ({ quantity, unit }) => {
  if (quantity === null) return "as needed";
  return unit ? `${quantity} ${pluralUnit(unit, quantity)}` : `${quantity}`;
};

// All of a group's amounts on one line: "3.5 cups + 2 tbsp"
export const formatAmounts = (amounts) => amounts.map(formatAmount).join(" + ");
