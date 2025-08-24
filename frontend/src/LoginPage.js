import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Login.css";
import API_BASE_URL from "./config";

function LoginPage({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // ✅ stop refresh

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("token", data.token); // ✅ store token
          setIsLoggedIn(true);
          navigate("/add"); // ✅ go to Add Chemical page after login
        } else {
          setError(data.message || "Invalid username or password");
        }
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Inventory</h1>
      <form className="login-box" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {/* ✅ Important: type="submit" now works with onSubmit */}
        <button type="submit">Login</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;
