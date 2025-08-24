import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import FormPage from "./FormPage";
import ListPage from "./ListPage";
import LoginPage from "./LoginPage";
import ChangePasswordPage from "./ChangePasswordPage";
import "./styles/Global.css"; // Background CSS

function App() {
  // ✅ Start by checking token immediately
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token"); // true if token exists, else false
  });

  return (
    <div className="app-background">
      <Router>
        <Routes>
          {/* LOGIN */}
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/" replace /> // already logged in → go to Add Chemical
              ) : (
                <LoginPage setIsLoggedIn={setIsLoggedIn} />
              )
            }
          />

          {/* ADD CHEMICAL (default home) */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <ProtectedLayout>
                  <FormPage setIsLoggedIn={setIsLoggedIn} />
                </ProtectedLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* VIEW LIST */}
          <Route
            path="/list"
            element={
              isLoggedIn ? (
                <ProtectedLayout>
                  <ListPage setIsLoggedIn={setIsLoggedIn} />
                </ProtectedLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* CHANGE PASSWORD */}
          <Route
            path="/change-password"
            element={
              isLoggedIn ? (
                <ProtectedLayout>
                  <ChangePasswordPage setIsLoggedIn={setIsLoggedIn} />
                </ProtectedLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ✅ Catch-all now respects login */}
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />}
          />
        </Routes>
      </Router>
    </div>
  );
}

// ✅ Shared layout for all logged-in pages
function ProtectedLayout({ children }) {
  return <div className="page-container">{children}</div>;
}

export default App;
