import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { verifyUser } from "../../Services/Users";

// Create Protected Route for all components that need to be authenticated first
const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();
  const loggedIn = verifyUser();

  // this will stop double alerts in strict mode
  const alerted = useRef(false)
  
  // checks if the user is not logged in and redirects them to authentication page
  useEffect(() => {
    if (!loggedIn && !alerted.current) {
      alerted.current = true;
      alert("You need to log in first.");
      navigate("/auth", { replace: true });
      }
    }, [loggedIn, navigate]);

  return loggedIn ? element:null;
};

export default ProtectedRoute;