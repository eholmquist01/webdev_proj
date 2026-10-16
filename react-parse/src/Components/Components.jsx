import Header from "./Header/Header.jsx";
import Main from "./Main/Main.jsx";
import RecipeDisplay from "./RecipeDisplay/RecipeDisplay.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function Components() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/RecipeDisplay" element={<RecipeDisplay />} />
      </Routes>
    </Router>
  );
}

export default Components;
