import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
  import { verifyUser } from "../../Services/Users";

const Auth = () => {
  const navigate = useNavigate();

  // redirect already authenticated users to the main page
  useEffect(() => {
    if (verifyUser()) {
      alert("You are already logged in");
      navigate("/main");
    }
  }, [navigate]);

  return (
    <div>
      <Link to="/register">
        <button>Register</button>
      </Link>
      <br />
      <br />
      <Link to="/login">
        <button>Login</button>
      </Link>
    </div>
  );
};

export default Auth;