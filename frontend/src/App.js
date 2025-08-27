import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import ListPage from "./ListPage";
import FormPage from "./FormPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />

        {/* Chemical list (protected) */}
        <Route
          path="/list"
          element={isLoggedIn ? <ListPage /> : <Navigate to="/login" />}
        />

        {/* Add/Edit chemical (protected) */}
        <Route
          path="/form"
          element={isLoggedIn ? <FormPage setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />}
        />

        {/* Default → redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
