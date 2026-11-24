import "./AddItemForm.css";

// Form for typing in items that aren't from a recipe (child).
// It's fully controlled: the ShoppingList parent owns the text and does the
// saving, so this component only shows the input and reports changes up.
//   value     the text in the box
//   isAdding  true while the items are being read and saved
//   onChange  called with the new text
//   onSubmit  called when the user clicks Add (or presses Enter)
const AddItemForm = ({ value, isAdding, onChange, onSubmit }) => {
  const handleSubmit = (event) => {
    event.preventDefault(); // stop the page from reloading
    onSubmit();
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <label htmlFor="add-item-text">Add your own items</label>
      <div className="add-item-form-row">
        <input
          type="text"
          id="add-item-text"
          placeholder="e.g. 2 cups milk, paper towels, 3 bananas"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          disabled={isAdding}
          maxLength={1000}
        />
        <button type="submit" disabled={isAdding || !value.trim()}>
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
};

export default AddItemForm;
