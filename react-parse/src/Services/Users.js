const axios = window.axios;
const url =
  "https://my-json-server.typicode.com/kellybuchanan/WebDev-Spring2021";

// create new user
export const createUser = (id, firstName, lastName, email, password) => {
  return axios({
    method: "post",
    url: `${url}/users`,
    data: {
      id,
      firstName,
      lastName,
      email,
      password,
    },
    headers: {
      "Content-Type": "application/json",
    },
    json: true,
  })
    .then((response) => {
      console.log("POST response: ", response);
    })
    .catch((err) => {
      console.log("POST error: ", err);
    });
};

// get users
export const getAllUsers = () => {
  return (
    axios
      .get("./Services/users.json")
      .then((response) => {
        console.log(response.data);
        return response.data;
      })
      .catch((err) => {
        console.log("GET Error: ", err);
      })
  );
};

// user login
export const login = (email, password) => {
  return axios
    .get("./Services/users.json")
    // .get(`${url}/users`)
    .then((response) => {
      const user = response.data.find(
        (u) => u.email === email && u.password === password
      );
      if (!user) throw new Error("Invalid credentials");
      return user;
    })
    .catch((err) => {
      console.log("LOGIN Error: ", err);
      throw err; // re-throw so Login.js's try/catch can catch it
    });
};
