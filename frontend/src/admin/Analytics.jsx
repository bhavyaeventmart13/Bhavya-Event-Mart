// ===========================================
// src/admin/Analytics.jsx (Final 2x2 Grid Layout)
// ===========================================

import React from "react";
import Sidebar from "./Sidebar.jsx";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer.jsx";
import "./Analytics.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const Analytics = () => {
  // ===== Static Data Sets =====
  const profitData = [
    { month: "Jan", value: 20000 },
    { month: "Feb", value: 18000 },
    { month: "Mar", value: 25000 },
    { month: "Apr", value: 22000 },
    { month: "May", value: 26000 },
    { month: "Jun", value: 24000 },
    { month: "Jul", value: 28000 },
  ];

  const incomeData = [
    { month: "Jan", value: 600000 },
    { month: "Feb", value: 650000 },
    { month: "Mar", value: 700000 },
    { month: "Apr", value: 720000 },
    { month: "May", value: 745000 },
    { month: "Jun", value: 740000 },
    { month: "Jul", value: 745000 },
  ];

  const salesData = [
    { month: "Jan", value: 35000 },
    { month: "Feb", value: 30000 },
    { month: "Mar", value: 45000 },
    { month: "Apr", value: 32000 },
    { month: "May", value: 50000 },
    { month: "Jun", value: 38000 },
    { month: "Jul", value: 60000 },
  ];

  const deliveryData = [
    { month: "Jan", value: 40 },
    { month: "Feb", value: 45 },
    { month: "Mar", value: 48 },
    { month: "Apr", value: 50 },
    { month: "May", value: 52 },
    { month: "Jun", value: 49 },
    { month: "Jul", value: 52 },
  ];

  return (
    <div className="admin-dashboard-wrapper">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <div className="admin-analytics-page fade-in">
          <h2>Analytics Dashboard</h2>
          <p className="subtitle">
            Visual overview of monthly profit, income, sales, and delivery performance.
          </p>

          {/* =============================
              🧠 2×2 Grid Layout
          ============================= */}
          <div className="analytics-grid">
            {/* 1️⃣ Monthly Profit / Loss */}
            <div className="analytics-section">
              <div className="analytics-card">
                <h3>Monthly Profit / Loss</h3>
                <p>₹25,000</p>
                <span className="status up">▲ Up by 12%</span>
              </div>
              <div className="analytics-graph">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#00e676"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2️⃣ Total Annual Income */}
            <div className="analytics-section">
              <div className="analytics-card">
                <h3>Total Annual Income</h3>
                <p>₹7,45,000</p>
                <span className="status down">▼ Down by 3%</span>
              </div>
              <div className="analytics-graph">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f0b90b"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3️⃣ Monthly Sales */}
            <div className="analytics-section">
              <div className="analytics-card">
                <h3>Monthly Sales</h3>
                <p>₹60,000</p>
                <span className="status up">▲ Up by 8%</span>
              </div>
              <div className="analytics-graph">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#ffb74d"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4️⃣ Deliveries & Orders */}
            <div className="analytics-section">
              <div className="analytics-card">
                <h3>Deliveries & Orders</h3>
                <p>52 Delivered / 6 Pending</p>
                <span className="status neutral">⚙ On Track</span>
              </div>
              <div className="analytics-graph">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={deliveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#03a9f4"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default Analytics;
