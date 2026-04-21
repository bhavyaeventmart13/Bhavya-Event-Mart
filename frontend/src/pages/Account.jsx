// ===========================================
// src/pages/Account.jsx — FINAL VERSION
// ===========================================

import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";

import { UserContext } from "../context/UserContext";
import Navbar from "../component/Navbar.jsx";
import CategoriesSidebar from "../component/CategoriesSidebar.jsx";
import Footer from "../component/Footer.jsx";
import "../styles/Account.css";

import CartSidebar from "../component/CartSidebar.jsx";
import Checkout from "./Checkout.jsx";
import { CartContext } from "../context/CartContext.jsx";

const DEFAULT_PROFILE_IMAGE = "/path/to/default-avatar.jpg"; 

const Account = () => {
    const { user } = useContext(UserContext);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const { cart, showCart, closeCart, updateQuantity, removeFromCart } =
        useContext(CartContext);

    const [showCheckout, setShowCheckout] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL || "";

    // ❗ Prevent double-fetch in React StrictMode (development)
    const fetchedOnce = useRef(false);

    // =======================================================
    // Fetch Logged-In User Orders  → /api/orders/my
    // =======================================================
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!user || !token) return;
        if (fetchedOnce.current) return; // ⛔ stops flicker
        fetchedOnce.current = true;

        const fetchOrders = async () => {
            try {
                setLoading(true);

                const res = await axios.get(`${API_BASE}/api/orders/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setOrders(res.data?.orders || []);
            } catch (err) {
                console.error("❌ Error fetching orders:", err);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    // =======================================================
    // PAGE UI
    // =======================================================
    return (
        <>
            <div className="account-wrapper">
                <Navbar />

                <div className="account-layout">
                    {/* Sidebar - This component will be hidden via CSS media query on mobile */}
                    <aside className="account-sidebar">
                        <CategoriesSidebar />
                    </aside>

                    {/* Main Section */}
                    <main className="account-page">
                        <h2>My Account</h2>

                        {/* ================== PROFILE ================== */}
                        <section className="account-info">
                            <h3>Profile</h3>
                            
                            {/* 🖼️ PROFILE IMAGE SLOT */}
                            <div className="profile-image-container">
                                <img
                                    src={user?.profileImage || DEFAULT_PROFILE_IMAGE}
                                    alt={user?.name || "Profile"}
                                    className="profile-image"
                                    onError={(e) => {
                                        // Hide image if loading fails
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            
                            <div className="profile-grid">
                                <div className="profile-item">
                                    <span className="label">Name</span>
                                    <span className="value">{user?.name || "—"}</span>
                                </div>

                                <div className="profile-item">
                                    <span className="label">Email</span>
                                    <span className="value">{user?.email || "—"}</span>
                                </div>

                                <div className="profile-item">
                                    <span className="label">Phone</span>
                                    <span className="value">{user?.phone || "—"}</span>
                                </div>

                                <div className="profile-item">
                                    <span className="label">Address</span>
                                    <span className="value">{user?.address || "—"}</span>
                                </div>
                            </div>
                        </section>

                        {/* ================== ORDERS ================== */}
                        <section className="my-orders">
                            <h3>My Orders</h3>

                            {loading ? (
                                <p className="loading">Loading your orders...</p>
                            ) : orders.length === 0 ? (
                                <p className="no-orders">No orders found.</p>
                            ) : (
                                <div className="order-table-wrapper">
                                    <table className="order-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date</th>
                                                <th>Items</th>
                                                <th>Total (₹)</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th>Proof</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order._id}>
                                                    <td>{order._id.slice(-6).toUpperCase()}</td>
                                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>

                                                    <td>
                                                        {order.items.map((item, i) => (
                                                            <div key={i}>
                                                                {item.name} ({item.size}) × {item.quantity} — ₹
                                                                {item.price}
                                                            </div>
                                                        ))}
                                                    </td>

                                                    <td>₹{order.totalAmount.toLocaleString()}</td>
                                                    <td className="payment">{order.paymentStatus}</td>
                                                    <td className="status">{order.orderStatus}</td>

                                                    {/* Payment proof Preview - "View Full" removed */}
                                                    <td>
                                                        {order.paymentProof ? (
                                                            <div className="proof-wrapper">
                                                                <a
                                                                    href={order.paymentProof}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <img
                                                                        src={order.paymentProof}
                                                                        alt="Proof"
                                                                        className="proof-thumb"
                                                                        onError={(e) =>
                                                                            (e.target.style.display = "none")
                                                                        }
                                                                    />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </main>
                </div>

                <Footer />
            </div>

            {/* Cart Sidebar */}
            <CartSidebar
                show={showCart}
                onClose={closeCart}
                cart={cart}
                updateQty={updateQuantity}
                removeItem={removeFromCart}
                onCheckout={() => setShowCheckout(true)}
            />

            {/* Checkout Popup */}
            <Checkout show={showCheckout} onClose={() => setShowCheckout(false)} />
        </>
    );
};

export default Account;