import { formatAmounts } from "./formatAmount.js";

// Page layout in millimetres (jsPDF's default unit, on an A4 page)
const MARGIN = 20;
const LINE_HEIGHT = 6;
const BOX_SIZE = 4; // tick box in front of each item

// Builds a PDF of the combined shopping list and downloads it.
//   groups: the output of aggregateItems
//   recipes: [{ id, name }] the recipes on the list
// jsPDF is imported only when this runs, so it isn't in the main app bundle.
export const downloadShoppingListPdf = async (groups, recipes) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  // Start a new page when the next block won't fit
  const ensureSpace = (height) => {
    if (y + height > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Title and date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Shopping List", MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), MARGIN, y);
  y += LINE_HEIGHT;

  // Which recipes the list is for (wrapped if it's long)
  if (recipes.length > 0) {
    const recipeLines = doc.splitTextToSize(
      `Recipes: ${recipes.map((r) => r.name || "Deleted recipe").join(", ")}`,
      textWidth
    );
    doc.text(recipeLines, MARGIN, y);
    y += recipeLines.length * 5;
  }
  y += LINE_HEIGHT;

  // One line per item: [ ] Flour - 3.5 cups + 2 tbsp
  doc.setFontSize(12);
  for (const group of groups) {
    const name = group.name.charAt(0).toUpperCase() + group.name.slice(1);
    const lines = doc.splitTextToSize(
      `${name} - ${formatAmounts(group.amounts)}`,
      textWidth - BOX_SIZE - 4
    );
    ensureSpace(lines.length * LINE_HEIGHT);

    doc.rect(MARGIN, y - BOX_SIZE + 0.5, BOX_SIZE, BOX_SIZE); // empty tick box
    doc.text(lines, MARGIN + BOX_SIZE + 4, y);
    y += lines.length * LINE_HEIGHT + 2;
  }

  doc.save(`shopping-list-${new Date().toISOString().slice(0, 10)}.pdf`);
};
