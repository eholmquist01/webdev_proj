import Header from "./Header/Header.jsx";
import Main from "./Main/Main.jsx";
import RecipeDisplay from "./RecipeDisplay/RecipeDisplay.jsx";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Auth from "./Auth/Auth";
import AuthLogin from "./Auth/AuthLogin";
import AuthRegister from "./Auth/AuthRegister";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoutes.jsx";

// shows the header above whichever page is nested inside it
const HeaderLayout = () => (
  <>
    <Header />
    <Outlet />
  </>
);

const Components = () => {
  return (
    <Router>
      <Routes>
        {/* pages without the header */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/register" element={<AuthRegister />} />

        {/* pages with the header */}
        <Route element={<HeaderLayout />}>
          <Route
            path="/main"
            element={<ProtectedRoute element={<Main />} />}
          />
          <Route
            path="/RecipeDisplay"
            element={<ProtectedRoute element={<RecipeDisplay />} />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
};

export default Components;