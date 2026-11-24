import 'parse'

const Parse = window.Parse

// Sends a recipe's ingredient text to the "parseIngredients" Cloud Code function,
// which asks Claude to split it into items. Resolves to:
//   [{ name, quantity (number or null), unit (string or null), originalText }, ...]
// Rejects with a Parse.Error whose message can be shown to the user.
export const parseIngredients = (text) => {
  return Parse.Cloud.run("parseIngredients", { text }).catch((err) => {
    console.error("parseIngredients Error: ", err);
    throw err;
  });
};
