// ===========================================
// src/component/CartSidebar.jsx (Final Fixed Version)
// ===========================================
import React, { useEffect } from "react";
import { FaPlus, FaMinus, FaTimes } from "react-icons/fa";
import "../styles/CartSidebar.css";

const CartSidebar = ({ show, onClose, cart = [], updateQty, removeItem, onCheckout }) => {
  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [show]);

  // Subtotal
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item?.price || 0);
    const qty = Number(item?.quantity || 0);
    return sum + price * qty;
  }, 0);

  // + / - buttons
  const handleQuantityChange = (item, change) => {
    const newQty = Number(item.quantity) + change;
    if (newQty < 1) return;
    updateQty(item.id, item.size, newQty);
  };

  // Fixed: Multi-digit typing (Allows typing 100+ without state resetting)
  const handleManualQuantityChange = (item, event) => {
    const value = event.target.value;

    if (value === "") {
      updateQty(item.id, item.size, "");
      return;
    }

    if (!/^[0-9]+$/.test(value)) return;

    const parsed = parseInt(value, 10);

    // Step 1: Immediately update the component state with the string value 
    updateQty(item.id, item.size, value);

    // Step 2: If the fully typed value is a valid positive integer, 
    // update the underlying cart logic with the numeric value.
    if (parsed > 0) {
      updateQty(item.id, item.size, parsed);
    }
  };

  const handleRemoveItem = (item) => {
    if (window.confirm(`Remove ${item.name} from cart?`)) {
      removeItem(item.id, item.size);
    }
  };

  if (!show) return null;

  return (
    <div className="cart-sidebar-overlay" onClick={onClose}>
      <div
        className={`cart-sidebar ${show ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cart-header">
          <h3>🛒 Shopping Cart</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            cart.map((item, i) => (
              <div className="cart-item" key={`${item.id}-${item.size}-${i}`}>
                {/* Remove Button (Positioned Absolutely) */}
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item)}
                >
                  <FaTimes />
                </button>

                {/* Main Content Row */}
                <div className="cart-item-main">
                  <img
                    src={item.image}
                    className="cart-item-img"
                    onError={(e) => (e.target.style.display = "none")}
                  />

                  {/* Details and Controls Column */}
                  <div className="cart-item-details-column">
                    <div className="cart-item-info">
                      {/* Name and Weight Row (e.g., Artificial Candles - 8.600kg) */}
                      <div className="cart-item-name-row">
                        <p className="cart-item-name">{item.name}</p>
                        {/* Static weight text added for display consistency with the image */}
                        <p className="cart-item-weight"> </p> 
                      </div>
                      <p className="cart-item-size">Size: {item.size}</p>
                    </div>

                    {/* Quantity Row */}
                    <div className="cart-quantity-row">
                      <label className="qty-label">Quantity</label>
                      <div className="cart-item-controls">
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={Number(item.quantity) <= 1}
                        >
                          <FaMinus />
                        </button>
                        <input
                          type="text"
                          className="qty-input-box"
                          value={item.quantity === "" ? "" : String(item.quantity)}
                          onChange={(e) => handleManualQuantityChange(item, e)}
                        />
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item, 1)}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Row (Separate from details, aligned below the image/details block) */}
                <div className="cart-price-row">
                  <p className="cart-item-price">
                    ₹{(item.price * (item.quantity || 0)).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="cart-footer">
          <div className="subtotal">
            <span>Subtotal:</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>

          <div className="cart-footer-buttons">
            <button className="checkout-btn" onClick={onCheckout}>
              Proceed to Checkout
            </button>
            <button className="continue-btn" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;