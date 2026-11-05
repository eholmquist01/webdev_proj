import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyUser } from "../../Services/Users";
import "./Auth.css";

const features = [
  {
    title: "Save your recipes",
    text: "Keep every family favorite and weeknight go-to in one place.",
  },
  {
    title: "Sort by category",
    text: "Appetizers, soups, desserts, drinks. Find the right dish fast.",
  },
  {
    title: "Cook with confidence",
    text: "Ingredients and instructions are always just a click away.",
  },
];

const Auth = () => {
  const navigate = useNavigate();

  // redirect already authenticated users to the main page
  useEffect(() => {
    if (verifyUser()) {
      navigate("/main");
    }
  }, [navigate]);

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <h1 className="auth-title">RecipeMe</h1>
        <p className="auth-tagline">
          A home for collecting and organizing the recipes you love.
        </p>
        <div className="auth-actions">
          <Link to="/login" className="auth-button auth-button-primary">
            Login
          </Link>
          <Link to="/register" className="auth-button auth-button-secondary">
            Create an account
          </Link>
        </div>
      </section>

      <section className="auth-features">
        {features.map((feature) => (
          <article key={feature.title} className="auth-feature">
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Auth;