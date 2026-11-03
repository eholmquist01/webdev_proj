import Header from "./Header/Header.jsx";
import Main from "./Main/Main.jsx";
import RecipeDisplay from "./RecipeDisplay/RecipeDisplay.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Auth/Auth.js";
import AuthRegister from "./Auth/AuthRegister.js";
import AuthLogin from "./Auth/AuthLogin.js";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoutes.js";

const Components = () => {
  return (
    <Router>
      <Routes>
      <Route path="/login" element={<AuthLogin />}/>
        <Route path="/main" element={<ProtectedRoute element={<Main />}/>} />
        <Route path="/RecipeDisplay" element={<ProtectedRoute element={<RecipeDisplay/>}/>} />
        <Route path="/auth" element={<Auth />}/>
        <Route path="/register" element={<AuthRegister />}/>
        <Route path="*" element={<Navigate to="/auth" replace />}/>
      </Routes>
    </Router>
  );
};

export default Components;


