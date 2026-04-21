// ===========================================
// src/context/CartContext.jsx (Final Updated)
// ===========================================
import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // ---------------- LOAD CART ONCE ----------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved && saved !== "undefined") {
        setCart(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error parsing saved cart:", err);
      localStorage.removeItem("cart");
    }
  }, []);

  // ---------------- SAVE ON EVERY CHANGE ----------------
  useEffect(() => {
    if (Array.isArray(cart)) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  // ---------------- CART SIDEBAR ----------------
  const openCart = () => setShowCart(true);
  const closeCart = () => setShowCart(false);

  // ---------------- ADD TO CART ----------------
  const addToCart = (item) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      const idx = updated.findIndex(
        (i) => i.id === item.id && i.size === item.size
      );

      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + item.quantity,
        };
      } else {
        updated.push({ ...item, quantity: item.quantity || 1 });
      }

      return [...updated];
    });
  };

  // ---------------- UPDATE QUANTITY (Updated for typing support) ----------------
  const updateQuantity = (id, size, newQty) => {
    setCart((prevCart) => {
      const updated = prevCart.map((item) => {
        if (item.id === id && item.size === size) {
          
          // ⭐ Allow blank / typing stage
          if (newQty === "" || newQty === null) {
            return { ...item, quantity: "" };
          }

          // ⭐ Reject invalid values
          if (isNaN(newQty)) {
            return item;
          }

          const safeQty = Number(newQty);

          // ⭐ Final minimum = 1
          return { ...item, quantity: Math.max(1, safeQty) };
        }
        return item;
      });

      return [...updated];
    });
  };

  // ---------------- REMOVE FROM CART ----------------
  const removeFromCart = (id, size) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.size === size))
    );
  };

  // ---------------- CLEAR CART ----------------
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        showCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
