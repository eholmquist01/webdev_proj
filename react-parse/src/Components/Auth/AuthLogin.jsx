import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, verifyUser } from "../../Services/Users";
import AuthForm from "./AuthForm";

const AuthLogin = () => {
  const navigate = useNavigate();

  // username can be either a username or an email
  const [user, setUser] = useState({ username: "", password: "" });

  // redirect already authenticated users to the main page
  useEffect(() => {
    if (verifyUser()) {
      alert("You are already logged in");
      navigate("/main");
    }
  }, [navigate]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    loginUser(user.username, user.password).then((loggedInUser) => {
      if (loggedInUser) {
        alert(`${loggedInUser.get("firstName")}, you successfully logged in!`);
        navigate("/");
      }
    });
  };

  return (
    <div>
      <AuthForm
        user={user}
        onChange={onChangeHandler}
        onSubmit={onSubmitHandler}
        isLogin
      />
    </div>
  );
};

export default AuthLogin;