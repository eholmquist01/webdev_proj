import Header from "./Header/Header.jsx";
import Main from "./Main/Main.jsx";
import RecipeDisplay from "./RecipeDisplay/RecipeDisplay.jsx";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./Auth/Auth";
import AuthLogin from "./Auth/AuthLogin";
import AuthRegister from "./Auth/AuthRegister";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoutes.jsx";

const Components = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/main" element={<ProtectedRoute element={<Main />} />} />
        <Route
          path="/RecipeDisplay"
          element={<ProtectedRoute element={<RecipeDisplay />} />}
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<AuthRegister />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
};

export default Components;


