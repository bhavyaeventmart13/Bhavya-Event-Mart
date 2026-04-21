// ===========================================
// src/pages/Checkout.jsx — FINAL FIXED VERSION
// (Resolves address editing, item safety, & validation)
// ===========================================

import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { CartContext } from "../context/CartContext";
import "../styles/Checkout.css";

import { FaMapMarkerAlt, FaShoppingCart, FaCreditCard } from "react-icons/fa";

import qr from "../assets/pankajsirqr.jpg";
import gpayLogo from "../assets/gpay-logo.png";
import phonepeLogo from "../assets/phonepe-logo.png";
import paytmLogo from "../assets/paytm-logo.png";

// UPI Merchant ID
const MERCHANT_UPI_ID = "paytmqr6I5I98@ptys";

// Backend API Base
const API_BASE = import.meta.env.VITE_API_URL || "";

const Checkout = ({ show, onClose }) => {
  const { user, setPendingCheckout, setShowAuthPopup } = useContext(UserContext);
  const { cart, clearCart } = useContext(CartContext);

  const [address, setAddress] = useState("");
  const [hasEditedAddress, setHasEditedAddress] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
const [email, setEmail] = useState("");
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Cart total
  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  // Prefill address ONLY if user hasn't edited
  useEffect(() => {
    if (user && !hasEditedAddress) {
      setAddress(user.address || "");
    }
  }, [user, hasEditedAddress]);

  // Disable scroll when popup open
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [show]);

  // Show login popup if user not logged in
  useEffect(() => {
    if (show && !user) {
      setPendingCheckout(true);
      setShowAuthPopup(true);
    }
  }, [show, user, setPendingCheckout, setShowAuthPopup]);

  // Recalculate payable amount
  useEffect(() => {
    const payable = Math.max(totalAmount - discount, 0);
    setFinalTotal(parseFloat(payable.toFixed(2)));
  }, [totalAmount, discount]);

  if (!show || !user) return null;

  // Handler to track address changes
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setHasEditedAddress(true);
  };

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setPaymentProofFile(file);
  };

  // Coupon Logic
  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    let d = 0;

    switch (code) {
      case "PANKAJ50": d = 50; break;
      case "WELCOME10": d = totalAmount * 0.1; break;
      case "FABRIC200": d = 200; break;
      case "FIRST100":
        if (!user?.ordersCount || user.ordersCount === 0) d = 100;
        else return setCouponMsg("❌ FIRST100 only for your first order");
        break;
      case "SAVE20": d = totalAmount * 0.2; break;
      case "BIG500":
        if (totalAmount >= 3000) d = 500;
        else return setCouponMsg("❌ BIG500 valid above ₹3000");
        break;
      case "FLAT30": d = Math.min(totalAmount * 0.3, 300); break;
      default:
        setDiscount(0);
        return setCouponMsg("❌ Invalid coupon");
    }

    setDiscount(parseFloat(Math.min(d, totalAmount).toFixed(2)));
    setCouponMsg(`✔ You saved ₹${d.toFixed(2)}`);
  };

  // Open UPI Apps
  const openUPIApp = (scheme) => {
    const amount = finalTotal.toFixed(2);
    const params = `pa=${MERCHANT_UPI_ID}&pn=PankajCloth&am=${amount}&cu=INR&tn=Order`;

    let url = "upi://pay?" + params;
    if (scheme === "gpay") url = "tez://upi/pay?" + params;
    if (scheme === "phonepe") url = "phonepe://pay?" + params;
    if (scheme === "paytm") url = "paytmmp://pay?" + params;

    window.location.href = url;
  };

  // Place Order
  const handlePlaceOrder = async () => {
    // 1. ADDRESS VALIDATION (NEW)
    if (!email || !email.trim()) {
  return alert("Please enter your email");
}
    if (!address || !address.trim()) {
      return alert("Please enter shipping address");
    }

    // 2. PAYMENT PROOF VALIDATION
    if (!paymentProofFile) {
      return alert("Please upload payment screenshot!");
    }

    // 3. TOKEN SAFETY
    const token = localStorage.getItem("token");
    if (!token) return alert("Session expired. Please login again.");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("shippingAddress", address);
      formData.append("email", email);
      formData.append("totalAmount", totalAmount.toFixed(2));
      formData.append("discount", discount.toFixed(2));
      formData.append("finalAmount", finalTotal.toFixed(2));
      formData.append("couponCode", couponCode.trim());
      formData.append("paymentProof", paymentProofFile);

      // 4. ITEMS SAFETY (NEW: added || null fallback)
      formData.append(
        "items",
        JSON.stringify(
          cart.map((item) => ({
            product: item._id || item.id || null,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            image: item.image || item.imageUrls?.[0] || "", // ✅ ADD THIS
          }))
        )
      );

      // 5. ENDPOINT (Matches backend: pending, assigned, in_progress, etc.)
      const endpoint = API_BASE
        ? `${API_BASE}/api/orders`
        : "/api/orders";

      const res = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        clearCart();
        setSuccessMsg("✅ Payment uploaded! We will update you soon.");
        setCouponCode("");
        setDiscount(0);
        setPaymentProofFile(null);
        setHasEditedAddress(false);
      } else {
        alert("Order failed. Try again.");
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      alert(err.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-popup-wrapper" onClick={onClose}>
      <div className="checkout-popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-popup" onClick={onClose}>✖</button>

        <h2 className="checkout-title">Complete Your Order</h2>

        <section className="user-details">
          <h3><FaMapMarkerAlt /> Shipping Details</h3>
          <p><b>Name:</b> {user.name}</p>
          <p><b>Phone:</b> {user.phone}</p>

          <h4 className="address-heading">Address</h4>
          <textarea
            rows="2"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter full address (House no, Street, City, Pincode)..."
          />
        </section>

        <section className="coupon-section">
          <h3>Apply Coupon</h3>
          <div className="coupon-box">
            <input
              type="text"
              placeholder="Enter coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button className="apply-btn" onClick={applyCoupon}>Apply</button>
          </div>
          {couponMsg && <p className="coupon-msg">{couponMsg}</p>}
        </section>

        <section className="order-summary">
          <h3><FaShoppingCart /> Order Summary</h3>
          {cart.map((item, i) => (
            <div className="checkout-item" key={i}>
              <span>{item.name} ({item.size})</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div className="summary-line">
            <span>Subtotal</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="summary-line discount-line">
              <span>Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-line final-line">
            <span>Amount Payable</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </section>

        <section className="payment-section">
          <h3><FaCreditCard /> Pay Using UPI</h3>
          <div className="upi-buttons">
            <button className="upi-btn gpay-btn" onClick={() => openUPIApp("gpay")}>
              <img src={gpayLogo} alt="Google Pay" /> Google Pay
            </button>

            {!isIOS && (
              <button className="upi-btn phonepe-btn" onClick={() => openUPIApp("phonepe")}>
                <img src={phonepeLogo} alt="PhonePe" /> PhonePe
              </button>
            )}

            {!isIOS && (
              <button className="upi-btn paytm-btn" onClick={() => openUPIApp("paytm")}>
                <img src={paytmLogo} alt="Paytm" /> Paytm
              </button>
            )}

            {isIOS && (
              <button
                className="upi-btn copyupi-btn"
                onClick={() => {
                  navigator.clipboard.writeText(MERCHANT_UPI_ID);
                  alert("UPI ID Copied!");
                }}
              >
                Copy UPI ID
              </button>
            )}
          </div>

          <div className="qr-container">
            <img src={qr} className="qr-image" alt="UPI QR Code" />
          </div>

          <h4 className="upload-heading">Upload Payment Screenshot</h4>
          <div className="upload-section">
            <label htmlFor="file-upload" className="file-upload-btn">Choose File</label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={handleFileUpload}
            />
            <span className="file-name">
              {paymentProofFile ? paymentProofFile.name : "No file chosen"}
            </span>
          </div>
          {paymentProofFile && <p className="proof-success">✔ File ready</p>}
        </section>
        <h4 className="address-heading">Email</h4>

 <div className="coupon-box">
<input
  type="email"
 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter your email"
  required
/>

          </div>


        <button
          className="btn place-order-btn"
          disabled={loading}
          onClick={handlePlaceOrder}
        >
          {loading
            ? "Placing Order..."
            : `Submit Proof & Place Order (₹${finalTotal.toFixed(2)})`}
        </button>

        {successMsg && <p className="success-msg">{successMsg}</p>}
      </div>
    </div>
  );
};

export default Checkout;