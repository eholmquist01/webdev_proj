import React from "react";
import { Link } from "react-router-dom";
import "./AuthForm.css";

const AuthForm = ({ user, onChange, onSubmit, isLogin }) => {
  return (
    <main className="auth-form-page">
      <div className="auth-card">
        <h1 className="auth-card-title">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="auth-card-subtitle">
          {isLogin
            ? "Log in to see your recipes."
            : "Sign up to start collecting recipes."}
        </p>

        <form onSubmit={onSubmit}>
          {!isLogin && (
            <>
              <div className="auth-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={user.firstName}
                  onChange={onChange}
                  name="firstName"
                  placeholder="first name"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={user.lastName}
                  onChange={onChange}
                  name="lastName"
                  placeholder="last name"
                  required
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="username">
              {isLogin ? "Username or Email" : "Username"}
            </label>
            <input
              id="username"
              type="text"
              value={user.username}
              onChange={onChange}
              name="username"
              placeholder={isLogin ? "username or email" : "username"}
              required
            />
          </div>

          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={user.email}
                onChange={onChange}
                name="email"
                placeholder="email"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={user.password}
              onChange={onChange}
              name="password"
              placeholder="password"
              required
            />
          </div>

          <button type="submit" className="auth-submit">
            {isLogin ? "Login" : "Submit"}
          </button>
        </form>

        <div className="auth-links">
          <Link to={isLogin ? "/register" : "/login"}>
            {isLogin ? "Need an account? Register" : "Have an account? Login"}
          </Link>
          <Link to="/auth">&larr; Back to welcome page</Link>
        </div>
      </div>
    </main>
  );
};

export default AuthForm;