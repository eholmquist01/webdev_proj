import { Link } from "react-router-dom";
import AuthLogout from "../Auth/AuthLogout";

const Header = () => (
  <header className="header">
    <nav>
      <ul>
        <li>
          <Link to="/main">Home</Link>
        </li>
        <li>
          <Link to="/RecipeDisplay">Recipes</Link>
        </li>
        <li>
          <AuthLogout />
        </li>
      </ul>
    </nav>
  </header>
);

export default Header;