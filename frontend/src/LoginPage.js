import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";
import "./styles/Login.css"; // keep using your existing css

function LoginPage({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hardcoded credentials for now
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true);
      navigate("/list");
    } else {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="login-wrap">
      {/* Brand / Title */}
      <div className="brand">
        <div className="brand-mark">🧪</div>
        <div className="brand-text">
          <h1>Inventory</h1>
          <p>Chemical Inventory Management</p>
        </div>
      </div>

      {/* Card */}
      <div className="login-card">
        <h2>Sign in</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="input-group">
            <span className="input-icon"><User size={18} /></span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="input-group">
            <span className="input-icon"><Lock size={18} /></span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn-primary">Login</button>
        </form>

      
      </div>
    </div>
  );
}

export default LoginPage;
