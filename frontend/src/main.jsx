import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// =============================================
// 🔹 Main App Rendering
// =============================================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// =============================================
// 🔥 SERVICE WORKER — ENABLE ONLY IN PRODUCTION
// =============================================
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    // Register service worker ONLY in production
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        console.log("%c[SW] Registered Successfully (PROD)", "color: green");
      })
      .catch((err) => {
        console.error("[SW] Registration failed:", err);
      });
  } else {
    // In development: always unregister SW to avoid caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        reg.unregister();
        console.log("%c[SW] Unregistered (DEV MODE)", "color: orange");
      });
    });
  }
}
