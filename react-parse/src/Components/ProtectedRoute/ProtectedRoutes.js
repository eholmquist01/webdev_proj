import React from "react";
import { Navigate } from "react-router-dom";
import { verifyUser } from "../Components/Auth/AuthService";

const ProtectedRoute = ({ element }) => {
    return verifyUser() ? element : (alert("Please log in first"), <Navigate to="/auth" replace/>);
};

export default ProtectedRoute;