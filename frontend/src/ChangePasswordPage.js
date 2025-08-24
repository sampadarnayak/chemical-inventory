import React, { useState } from "react";

function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();
    localStorage.setItem("password", newPassword);
    alert("✅ Password updated successfully!");
    setNewPassword("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Change Password</h2>
      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;
