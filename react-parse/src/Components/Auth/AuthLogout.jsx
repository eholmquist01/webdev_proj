import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutUser, verifyUser } from "../../Services/Users";

const AuthLogout = () => {
  const navigate = useNavigate();

  // makes this component re-render on every navigation, so the button
  // appears right after login and disappears right after logout
  useLocation();

  const onLogout = () => {
    logoutUser().then(() => navigate("/auth"));
  };

  // only show the button when someone is logged in
  if (!verifyUser()) {
    return null;
  }

  return (
    <button type="button" onClick={onLogout}>
      Log out
    </button>
  );
};

export default AuthLogout;