import 'parse'

const Parse = window.Parse

// get all the categories in the database
export const getAllCategories = () => {
  // retrieve data from Category Class in App
  const query = new Parse.Query("Category")
  // display them in alphabetical order
  query.ascending("name")
  return query
    .find()
    .then((response) => {
        return response.map((r) => ({
          id: r.id,
          name: r.get("name"),
          description: r.get("description"),
      }));
    })
    .catch((err) => {
      console.log("GET Error: ", err);
    });
};
