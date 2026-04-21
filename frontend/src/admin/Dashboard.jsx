
// ===========================================
// src/admin/AdminDashboard.jsx
// FINAL VERSION (Orders + Users + Clean CSV)
// ===========================================

import React, { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "./Sidebar.jsx";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer.jsx";

import "./Dashboard.css";

const AdminDashboard = () => {

  // =============================
  // STATE
  // =============================
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL;

  // =============================
  // FETCH DASHBOARD DATA
  // =============================
  useEffect(() => {
    const fetchDashboardData = async () => {

      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {

        const [ordersRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/orders`, {
            headers: { Authorization: `Bearer ${token}` }
          }),

          axios.get(`${API_BASE}/api/user/all`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setOrders(ordersRes.data?.orders || []);
        setUsers(usersRes.data?.users || []);

      } catch (err) {

        console.error("Dashboard fetch failed:", err);
        setOrders([]);
        setUsers([]);

      } finally {

        setLoading(false);

      }

    };

    fetchDashboardData();

  }, [API_BASE]);

  // =============================
  // DASHBOARD STATS
  // =============================
  const totalUsers = users.length;
  const totalOrders = orders.length;

  const totalAmount = orders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0
  );

  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === "Delivered"
  ).length;

  const pendingOrders = totalOrders - deliveredOrders;

  const updatedPercent = totalOrders
    ? Math.round((deliveredOrders / totalOrders) * 100)
    : 0;

  const pendingPercent = 100 - updatedPercent;

  // =============================
  // DOWNLOAD CSV (NAME + PHONE)
  // =============================
  const downloadUsersCSV = () => {

    if (!users || users.length === 0) {
      alert("No users available");
      return;
    }

    const headers = ["Name", "Phone"];

    const rows = users.map((u) => [

      `"${u.name || ""}"`,

      `="${u.phone || ""}"`

    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customer_contacts.csv");

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  };

  // =============================
  // RENDER
  // =============================
  return (

    <div className="admin-dashboard-wrapper">

      <Sidebar />

      <main className="main-content">

        <Navbar />

        <div className="admin-dashboard-page fade-in">

          <h2>Admin Dashboard</h2>

          <p className="subtitle">
            Quick overview of your business performance and activity.
          </p>

          {/* =============================
              SUMMARY GRID
          ============================= */}

          <div className="dashboard-grid">

            <div className="dashboard-card">
              <h3>Total Users</h3>
              <p>{totalUsers}</p>
            </div>

            <div className="dashboard-card">
              <h3>Total Orders</h3>
              <p>{totalOrders}</p>
            </div>

            <div className="dashboard-card">
              <h3>Total Amount (₹)</h3>
              <p>₹{totalAmount.toLocaleString()}</p>
            </div>

            <div className="dashboard-card">
              <h3>Pending Orders</h3>
              <p>{pendingOrders}</p>
            </div>

            <div className="dashboard-card">
              <h3>Delivered Orders</h3>
              <p>{deliveredOrders}</p>
            </div>

            <div className="dashboard-card">

              <h3>Updated vs Pending</h3>

              <div className="mini-bar">

                <div
                  className="bar delivered"
                  style={{ width: `${updatedPercent}%` }}
                />

                <div
                  className="bar pending"
                  style={{ width: `${pendingPercent}%` }}
                />

              </div>

            </div>

          </div>


          {/* =============================
              USERS TABLE
          ============================= */}

          <section className="card" style={{ marginTop: 30 }}>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px"
              }}
            >

              <h3>Registered Users</h3>

              <button
                onClick={downloadUsersCSV}
                style={{
                  background: "#0ea5e9",
                  color: "#fff",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Download Phone CSV
              </button>

            </div>

            <div className="table-responsive">

              <table>

                <thead>

                  <tr>

                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        Loading...
                      </td>
                    </tr>

                  ) : users.length === 0 ? (

                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        No users found
                      </td>
                    </tr>

                  ) : (

                    users.map((u, i) => (

                      <tr key={u._id}>

                        <td>{i + 1}</td>

                        <td>{u.name || "—"}</td>

                        <td>{u.phone || "—"}</td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>

        <Footer />

      </main>

    </div>

  );

};

export default AdminDashboard;

