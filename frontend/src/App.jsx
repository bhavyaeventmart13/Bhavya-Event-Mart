// ===========================================
// src/App.jsx (Scroll Fix Applied)
// ===========================================

import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes.jsx";

// Global Context Providers
import { ProductProvider } from "./context/ProductContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

// 🔥 Disable React Router automatic scroll reset
function DisableScrollRestore() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return null;
}

const App = () => {
  return (
    <UserProvider>
      <ProductProvider>
        <CartProvider>
          <BrowserRouter>
            {/* ⭐ IMPORTANT */}
            <DisableScrollRestore />

            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </ProductProvider>
    </UserProvider>
  );
};

export default App;
