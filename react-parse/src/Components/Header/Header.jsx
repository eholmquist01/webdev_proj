import { Link } from "react-router-dom";

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
                    <Link to="/auth">Log out</Link>
                </li>
            </ul>
        </nav>
    </header>
)

export default Header;