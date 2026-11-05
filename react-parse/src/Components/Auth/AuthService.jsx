import Parse from "parse";

// used in AuthRegister
export const createUser = (newUser) => {
  const user = new Parse.User();

  user.set("username", newUser.username);
  user.set("email", newUser.email);
  user.set("firstName", newUser.firstName);
  user.set("lastName", newUser.lastName);
  user.set("password", newUser.password);

  return user
    .signUp()
    .then((newUserSaved) => {
      return newUserSaved;
    })
    .catch((error) => {
      alert(`Error ${error.code}: ${error.message}`);
    });
};

// used in AuthLogin; usernameOrEmail can be either one
export const loginUser = (usernameOrEmail, password) => {
  return Parse.User.logIn(usernameOrEmail, password)
    .then((loggedInUser) => {
      return loggedInUser;
    })
    .catch((error) => {
      alert(`Error ${error.code}: ${error.message}`);
    });
};

// true if someone is currently logged in, false otherwise
export const verifyUser = () => {
  return Parse.User.current()?.authenticated() ?? false;
};