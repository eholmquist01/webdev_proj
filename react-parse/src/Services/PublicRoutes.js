import React from "react";
import { Navigate } from "react-router-dom";
import { verifyUser } from "../Components/Auth/AuthService";

const PublicRoute = ({ element }) => {
    return verifyUser() ? element : (<Navigate to="/main" replace/>, element);
};

export default PublicRoute;