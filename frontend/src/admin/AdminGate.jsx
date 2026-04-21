import React from "react";
import { Navigate } from "react-router-dom";

const AdminGate = ({ children }) => {
  try {
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    // ✅ Allow if role = admin OR isAdmin = true
    if (user && (user.role === "admin" || user.isAdmin === true)) {
      return children;
    }

    // ❌ Not authorized
    return <Navigate to="/" replace />;
  } catch (err) {
    console.error("AdminGate error:", err);
    return <Navigate to="/" replace />;
  }
};

export default AdminGate;