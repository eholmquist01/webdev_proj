import 'parse'

const Parse = window.Parse

const ShoppingListItem = Parse.Object.extend("ShoppingListItem")
// Pointer to a Recipe by id, built here so Recipes.js doesn't need to change
const recipePointer = (recipeId) =>
  Parse.Object.extend("Recipe").createWithoutData(recipeId)

// turn a Parse ShoppingListItem into the plain object the components use
const toItem = (r) => {
  const recipe = r.get("recipe")
  return {
    id: r.id,
    name: r.get("name"),
    quantity: r.get("quantity") ?? null,
    unit: r.get("unit") ?? null,
    originalText: r.get("originalText"),
    recipeId: recipe ? recipe.id : null,
    // undefined if the recipe was deleted, since include() can't load it
    recipeName: (recipe && recipe.get("name")) || "",
  }
}

// Sends a recipe's ingredient text to the "parseIngredients" Cloud Code function,
// which asks Claude to split it into items. Resolves to:
//   [{ name, quantity (number or null), unit (string or null), originalText }, ...]
// Rejects with a Parse.Error whose message can be shown to the user.
export const parseIngredients = (text) => {
  return Parse.Cloud.run("parseIngredients", { text }).catch((err) => {
    console.error("parseIngredients Error: ", err)
    throw err
  })
}

// get all of the current user's shopping list items
export const getShoppingListItems = () => {
  const query = new Parse.Query(ShoppingListItem)
  query.equalTo("owner", Parse.User.current())
  query.include("recipe")
  // only load the recipe's name, not its photos or other fields
  query.select("name", "quantity", "unit", "originalText", "recipe.name")
  query.ascending("name")
  query.limit(1000)
  return query
    .find()
    .then((response) => response.map(toItem))
    .catch((err) => {
      console.error("GET Error with ShoppingListItem: ", err)
      throw err
    })
}

// delete all of the current user's items that came from one recipe
export const removeRecipeFromShoppingList = async (recipeId) => {
  const query = new Parse.Query(ShoppingListItem)
  query.equalTo("owner", Parse.User.current())
  query.equalTo("recipe", recipePointer(recipeId))
  query.limit(1000)
  try {
    const items = await query.find()
    await Parse.Object.destroyAll(items)
    return items.map((item) => item.id)
  } catch (err) {
    console.error("DELETE Error with ShoppingListItem: ", err)
    throw err
  }
}

// add a recipe's ingredients to the shopping list
// recipe is the plain object from Recipes.js: { id, name, ingredients, ... }
// Resolves to the new items, in the same shape as getShoppingListItems
export const addRecipeToShoppingList = async (recipe) => {
  // ask Claude first: if this fails, nothing has been changed yet
  const parsed = await parseIngredients(recipe.ingredients || "")

  // clear any items already saved for this recipe, so adding twice doesn't duplicate them
  await removeRecipeFromShoppingList(recipe.id)

  const saved = await saveItems(parsed, recipe.id)
  // the saved pointers don't carry the name, so fill it in from the recipe we were given
  return saved.map((item) => ({ ...item, recipeName: recipe.name }))
}

// add items the user typed in (e.g. "2 cups milk, paper towels"), not from a recipe
// Resolves to the new items, in the same shape as getShoppingListItems (recipeId is null)
export const addTypedItemsToShoppingList = async (text) => {
  const parsed = await parseIngredients(text)
  return saveItems(parsed, null)
}

// save parsed items for the current user; recipeId is null for typed-in items
const saveItems = async (parsed, recipeId) => {
  const user = Parse.User.current()
  const items = parsed.map((p) => {
    const item = new ShoppingListItem()
    item.set("name", p.name)
    item.set("quantity", p.quantity)
    item.set("unit", p.unit)
    item.set("originalText", p.originalText)
    if (recipeId) {
      item.set("recipe", recipePointer(recipeId))
    }
    item.set("owner", user)
    item.setACL(new Parse.ACL(user))
    return item
  })

  try {
    const saved = await Parse.Object.saveAll(items)
    return saved.map(toItem)
  } catch (err) {
    console.error("POST Error with ShoppingListItem: ", err)
    throw err
  }
}

// delete one shopping list item by id
export const removeShoppingListItem = (id) => {
  return ShoppingListItem.createWithoutData(id)
    .destroy()
    .catch((err) => {
      console.error("DELETE Error with ShoppingListItem: ", err)
      throw err
    })
}

// lowercase, trim and collapse spaces so "Olive  Oil " matches "olive oil"
const normalize = (text) =>
  (text || "").toLowerCase().trim().replace(/\s+/g, " ")

// avoid long decimals from adding fractions (0.1 + 0.2)
const round = (n) => Math.round(n * 100) / 100

// Combines items from every recipe into one master list. Pure function (no Parse),
// so it can be tested on its own.
//   items: [{ id, name, quantity, unit, originalText, recipeId, recipeName }]
// Returns, sorted by name:
//   [{ name, amounts: [{ quantity, unit }], recipes: [{ id, name }], addedByUser, itemIds: [] }]
// - addedByUser is true if any of the items was typed in (has no recipe)
// - items with the same name are one group
// - quantities with the same unit are added together
// - different units ("1 cup" and "2 tbsp") stay as separate amounts,
//   since converting between them isn't reliable
// - items with no quantity ("salt to taste") add one { quantity: null, unit: null } amount
export const aggregateItems = (items) => {
  const groups = new Map()

  for (const item of items) {
    const name = normalize(item.name)
    if (!name) continue

    if (!groups.has(name)) {
      groups.set(name, { name, amounts: new Map(), recipes: new Map(), addedByUser: false, itemIds: [] })
    }
    const group = groups.get(name)
    group.itemIds.push(item.id)
    if (item.recipeId) {
      group.recipes.set(item.recipeId, { id: item.recipeId, name: item.recipeName })
    } else {
      group.addedByUser = true
    }

    const hasQuantity = typeof item.quantity === "number" && !Number.isNaN(item.quantity)
    const unit = normalize(item.unit) || null
    // one amount per unit; "no quantity" gets its own key
    const key = hasQuantity ? `unit:${unit ?? ""}` : "none"
    const amount = group.amounts.get(key)
    if (!amount) {
      group.amounts.set(key, { quantity: hasQuantity ? item.quantity : null, unit: hasQuantity ? unit : null })
    } else if (hasQuantity) {
      amount.quantity = round(amount.quantity + item.quantity)
    }
  }

  // turn the Maps into plain arrays for the components
  return [...groups.values()]
    .map((g) => ({
      name: g.name,
      amounts: [...g.amounts.values()],
      recipes: [...g.recipes.values()],
      addedByUser: g.addedByUser,
      itemIds: g.itemIds,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
