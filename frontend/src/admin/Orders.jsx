// ===========================================
// src/admin/Orders.jsx — FINAL (With Fix for Uncaught TypeError: reading 'slice')
// ===========================================

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import { FiDownload, FiFileText, FiSearch } from "react-icons/fi";
import "./Orders.css"; // Ensure this path is correct for the dark theme CSS
import jsPDF from "jspdf";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("default");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const initialLoad = useRef(true);
  const hasAlerted = useRef(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ===========================
  // Fetch Orders
  // ===========================
  const fetchOrders = async () => {
    try {
      if (initialLoad.current) setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      if (!hasAlerted.current) {
        alert("Failed to load orders.");
        hasAlerted.current = true;
      }
    } finally {
      if (initialLoad.current) {
        initialLoad.current = false;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===========================
  // VERIFY PAYMENT
  // ===========================
  const handleVerifyPayment = async (orderId) => {
    if (!window.confirm("Verify payment for this order?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_BASE}/api/orders/${orderId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchOrders();

      // Update local state for the modal without waiting for re-fetch to close modal
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, paymentStatus: "Paid" }));
      }
    } catch (err) {
      console.error("❌ Payment verification failed:", err);
      alert("Error verifying payment.");
    }
  };

  // ===========================
  // UPDATE ORDER STATUS
  // ===========================
  const handleStatusChange = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_BASE}/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchOrders();

      // Update local state for the modal
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: status }));
      }
    } catch (err) {
      console.error("❌ Status update failed:", err);
      alert("Error updating order status.");
    }
  };

  // ===========================
  // SEARCH + SORT
  // ===========================
  const filtered = orders.filter((o) => {
    const text = (
      (o._id || "") +
      " " +
      (o.userInfoSnapshot?.name || "") +
      " " +
      (o.userInfoSnapshot?.phone || "") +
      " " +
      (o.items?.map((i) => i.name).join(" ") || "")
    ).toLowerCase();

    return text.includes((searchTerm || "").toLowerCase());
  });

  const sortedOrders = [...filtered].sort((a, b) => {
    switch (sortType) {
      case "name":
        return (a.userInfoSnapshot?.name || "").localeCompare(
          b.userInfoSnapshot?.name || ""
        );
      case "price-high":
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case "price-low":
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "payment":
        return (a.paymentStatus || "").localeCompare(b.paymentStatus || "");
      default:
        return 0;
    }
  });

  // ===========================
  // EXPORT CSV
  // ===========================
  const exportCSV = () => {
    if (!orders.length) return alert("No orders available.");

    const rows = [
      [
        "S/N",
        "Order ID",
        "User Name",
        "Phone",
        "Address",
        "Total",
        "Payment",
        "Status",
        "Date",
        "Item Count",
        "Items",
      ],
      ...orders.map((order, idx) => [
        idx + 1,
        // Safely access _id
        order._id ? order._id.slice(-6).toUpperCase() : "N/A",
        order.userInfoSnapshot?.name || "",
        order.userInfoSnapshot?.phone || "",
        (order.userInfoSnapshot?.address || "").replace(/\n/g, " "),
        order.totalAmount || 0,
        order.paymentStatus || "Pending",
        order.orderStatus || "N/A",
        order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A",
        order.items?.length || 0,
        order.items
          ?.map((i) => `${i.name} (${i.size}) × ${i.quantity}`)
          .join(" | "),
      ]),
    ];

    const csv =
      "data:text/csv;charset=utf- 8," +
      rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "all_orders.csv";
    link.click();
  };

  // ===========================
  // PDF: ALL ORDERS
  // ===========================
  const downloadAllPDF = () => {
    if (!orders.length) {
      alert("No orders to export.");
      return;
    }

    const doc = new jsPDF({ unit: "pt" });
    doc.setFontSize(12);
    doc.text("All Orders Report", 20, 30);

    let y = 55;
    const pageHeight = doc.internal.pageSize.height;

    orders.forEach((o, i) => {
      // Safely access _id
      const shortId = o._id ? o._id.slice(-6).toUpperCase() : "N/A";
      const line = `${i + 1}) ${shortId} | ${o.userInfoSnapshot?.name || "—"} | ₹${o.totalAmount || 0} | ${o.paymentStatus || "—"}`;
      doc.text(line, 20, y);
      y += 16;
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 40;
      }
    });

    doc.save("all_orders.pdf");
  };

  // ===========================
  // PDF: SINGLE ORDER (uses short Order ID)
  // ===========================
  const downloadOrderPDF = (order) => {
    if (!order) return;

    const doc = new jsPDF({ unit: "pt" });
    doc.setFontSize(14);
    doc.text("Order Receipt", 20, 28);
    doc.setFontSize(11);

    let y = 56;

    // USER section first
    doc.text(`Name: ${order.userInfoSnapshot?.name || "N/A"}`, 20, y);
    y += 14;
    doc.text(`Phone: ${order.userInfoSnapshot?.phone || "N/A"}`, 20, y);
    y += 14;
    doc.text(
      `Address: ${(order.userInfoSnapshot?.address || "N/A").replace(/\n/g, " ")}`,
      20,
      y
    );
    y += 20;

    // ITEMS section second
    doc.text("Items:", 20, y);
    y += 14;
    (order.items || []).forEach((it, idx) => {
      const line = `${idx + 1}. ${it.name} (${it.size}) x${it.quantity}`;
      doc.text(line, 24, y);
      y += 14;
      if (y > doc.internal.pageSize.height - 40) {
        doc.addPage();
        y = 40;
      }
    });

    y += 8;

    // ORDER ID (short) third
    // Safely access _id
    const shortId = order._id ? order._id.slice(-6).toUpperCase() : "N/A";
    doc.text(`Order ID: ${shortId}`, 20, y);
    y += 16;

    // Payment proof not embedded (link shown)
    doc.text(`Total: ₹${order.totalAmount || 0}`, 20, y);
    y += 14;
    doc.text(`Payment Status: ${order.paymentStatus || "N/A"}`, 20, y);
    y += 14;
    doc.text(`Order Status: ${order.orderStatus || "N/A"}`, 20, y);

    doc.save(`order_${shortId}.pdf`);
  };

  // ===========================
  // OPEN/CLOSE MODAL
  // ===========================
  const onRowClick = (order) => {
    setSelectedOrder(order);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedOrder(null);
    document.body.style.overflow = "auto";
  };

  // Helper to stop propagation for action buttons in table (so clicking Verify doesn't open modal)
  const handleActionClick = (e, fn) => {
    e.stopPropagation();
    fn();
  };

  // Thumbnail size chosen: 120x120
  const proofThumbSize = 120;

  // Helper function to format date
  const formatOrderDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="orders-page">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        {/* HEADER */}
        <header className="products-header">
          <div className="header-info">
            <h1>Orders</h1>
            <p>Manage customer orders and track activity</p>
          </div>

          <div className="header-actions">
            <button className="button secondary" onClick={exportCSV}>
              <FiFileText /> Export CSV
            </button>
            <button className="button primary" onClick={downloadAllPDF}>
              <FiDownload /> Download PDF
            </button>
          </div>
        </header>

        {/* FILTER */}
        <section className="filter-section card">
          <h3>Filter Orders</h3>
          <p className="filter-description">Search or sort orders easily</p>

          <div className="filter-controls">
            <div className="search-input-container">
              <FiSearch className="search-icon" />
              <input
                className="search-input transparent"
                placeholder="Search orders by name, phone, order ID or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-direct-sort">
              <label className="sort-label">Sort By:</label>
              <select
                className="dropdown-select"
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="name">Name</option>
                <option value="price-high">Price: High → Low</option>
                <option value="price-low">Price: Low → High</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="payment">Payment Status</option>
              </select>
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="product-catalog card">
          <div className="catalog-header">
            <h3>All Orders</h3>
            <p>{sortedOrders.length} orders found</p>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: 20 }}>
                      Loading...
                    </td>
                  </tr>
                ) : sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: 20 }}>
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order, idx) => (
                    <tr
                      key={order._id}
                      className="clickable-row"
                      onClick={() => onRowClick(order)}
                    >
                      <td>{idx + 1}</td>
                      <td>{order._id.slice(-6).toUpperCase()}</td>
                      <td>{order.userInfoSnapshot?.name || "—"}</td>
                      <td>{order.userInfoSnapshot?.phone || "—"}</td>
                      <td className="address-cell">{order.userInfoSnapshot?.address || "—"}</td>
                      <td>
                        {order.items?.slice(0, 2).map((i, ii) => (
                          <div key={ii}>
                            {i.name} ({i.size}) × {i.quantity}
                          </div>
                        ))}
                        {order.items?.length > 2 && <div>+ {order.items.length - 2} more</div>}
                      </td>
                      <td>₹{order.totalAmount?.toLocaleString() || 0}</td>
                      <td>
                        <span className={order.paymentStatus === "Paid" ? "paid" : "pending"}>
                          {order.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td>{order.orderStatus || "—"}</td>
                      <td>
                        {order.paymentStatus !== "Paid" && (
                          <button
                            className="btn-verify-table"
                            onClick={(e) =>
                              handleActionClick(e, () => handleVerifyPayment(order._id))
                            }
                          >
                            Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Footer />
      </main>

      {/* MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => downloadOrderPDF(selectedOrder)}
                >
                  <FiDownload /> PDF
                </button>
                <button className="button" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>

            <div className="modal-content">
              {/* 1) USER DETAILS */}
              <h4>Customer</h4>
              <p><strong>Name:</strong> {selectedOrder.userInfoSnapshot?.name || "—"}</p>
              <p><strong>Phone:</strong> {selectedOrder.userInfoSnapshot?.phone || "—"}</p>
              <p><strong>Address:</strong> <span className="address-cell">{selectedOrder.userInfoSnapshot?.address || "—"}</span></p>

              {/* 2) ITEMS */}
              <h4 style={{ marginTop: 12 }}>Items</h4>
              <div className="modal-items">
                {selectedOrder.items?.map((it, i) => (

                  <div className="modal-item-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>

                    {/* ✅ IMAGE */}
                    {it.image && (
                      <img
                        src={it.image}
                        alt={it.name}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #333",
                        }}
                      />
                    )}

                    {/* NAME */}
                    <div style={{ flex: 1 }}>
                      {i + 1}. {it.name}
                    </div>

                    {/* RATE */}
                    <div style={{ width: 100 }}>
                      ₹{it.price || 0}
                    </div>

                    {/* SIZE */}
                    <div style={{ width: 80 }}>
                      {it.size}
                    </div>

                    {/* QTY */}
                    <div style={{ width: 60 }}>
                      x{it.quantity}
                    </div>

                  </div>
                ))}
              </div>

              {/* 3) ORDER INFO (ID, Total, Date) */}
              <h4 style={{ marginTop: 12 }}>Order Summary</h4>
              {/* *** FIX APPLIED HERE: Safe access to selectedOrder._id before .slice() *** */}
              <p>
                <strong>Order ID:</strong>
                {selectedOrder._id
                  ? selectedOrder._id.slice(-6).toUpperCase()
                  : "—"
                }
              </p>
              <p>
                <strong>Total Amount:</strong>
                <span className="amount-text"> ₹{selectedOrder.totalAmount?.toLocaleString() || 0}</span>
              </p>
              <p><strong>Date Placed:</strong> {formatOrderDate(selectedOrder.createdAt)}</p>

              {/* 4) PAYMENT PROOF thumbnail */}
              {selectedOrder.paymentProof && (
                <>
                  <h4 style={{ marginTop: 8 }}>Payment Proof</h4>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <a href={selectedOrder.paymentProof} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedOrder.paymentProof}
                        alt="payment-proof"
                        style={{
                          width: proofThumbSize,
                          height: proofThumbSize,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #222",
                        }}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    </a>
                    <div>
                      <a href={selectedOrder.paymentProof} target="_blank" rel="noopener noreferrer" className="view-proof-link">View full image</a>
                      <div style={{ marginTop: 8, color: "#bbb" }}>Click thumbnail to open full proof in new tab</div>
                    </div>
                  </div>
                </>
              )}

              {/* 5) PAYMENT STATUS & VERIFY */}
              <div style={{ marginTop: 12 }}>
                <strong>Payment Status:</strong>{" "}
                <span className={selectedOrder.paymentStatus === "Paid" ? "paid" : "pending"}>
                  {selectedOrder.paymentStatus || "Pending"}
                </span>

                {selectedOrder.paymentStatus !== "Paid" && (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn-verify" onClick={() => handleVerifyPayment(selectedOrder._id)}>Verify Payment</button>
                  </div>
                )}
              </div>

              {/* 6) ORDER STATUS */}
              <div style={{ marginTop: 12 }}>
                <h4>Update Order Status</h4>
                {/* Added an extra check here just in case, though selectedOrder is already checked above */}
                {selectedOrder._id && (
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;