import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

import bgImage from "./hospital-bg.jpg";
import logo from "./uog-logo.png";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await login(username, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message || "Login failed. Please try again.");
    }

    setSubmitting(false);
  };

  return (
    <div className="uog-login">
      <img src={bgImage} alt="" className="uog-login__bgImage" />
      <div className="uog-login__overlay" />

      <header className="uog-login__header">
        <div className="uog-login__logoBox">
          <img src={logo} alt="University of Gondar Hospital" />
        </div>
        <a href="mailto:admin@uog.edu.et" className="uog-login__adminLink">
          Contact the Admin
        </a>
      </header>

      <main className="uog-login__main">
        <section className="uog-login__card">
          <button
            type="button"
            className="uog-login__close"
            onClick={() => window.location.reload()}
            aria-label="Close"
          >
            ×
          </button>

          <h1 className="uog-login__title">Login</h1>

          {error && <div className="uog-login__error">{error}</div>}

          <form onSubmit={handleSubmit} className="uog-login__form">
            <div className="uog-login__field">
              <label htmlFor="username">User Account</label>
              <div className="uog-login__inputWrap uog-login__inputWrap--user">
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="uog-login__field">
              <label htmlFor="password">Password</label>
              <div className="uog-login__inputWrap uog-login__inputWrap--password">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="uog-login__forgotRow">
              <a href="#" className="uog-login__forgot">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="uog-login__submit"
            >
              {submitting ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
        </section>
      </main>

      <footer className="uog-login__footer">
        © 2026 University of Gondar Hospital Referral System
      </footer>
    </div>
  );
};

export default Login;