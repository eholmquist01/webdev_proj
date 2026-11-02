import Header from "./Header/Header.jsx";
import Main from "./Main/Main.jsx";
import RecipeDisplay from "./RecipeDisplay/RecipeDisplay.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Auth/Auth.js";
import AuthRegister from "./Auth/AuthRegister.js";
import AuthLogin from "./Auth/AuthLogin.js";
import ProtectedRoute from "../Services/ProtectedRoute.js";

const Components = () => {
  return (
    <Router>
      <Routes>
      <Route path="/login" element={<PublicRoute element={<AuthLogin />}/>} />
        <Route path="/main" element={<ProtectedRoute element={<Main />}/>} />
        <Route path="/RecipeDisplay" element={<ProtectedRoute element={<RecipeDisplay/>}/>} />
        <Route path="/auth" element={<PublicRoute element={<Auth />} />} />
        <Route path="/register" element={<PublicRoute element={<AuthRegister />} />} />
        <Route path="*" element={<PublicRoute element={<Navigate to="/auth" replace />} />} />
      </Routes>
    </Router>
  );
};

export default Components;


