// ===========================================
// src/admin/Inventory.jsx (Final with Subcategory + Centered +/− Controls)
// ===========================================

import React, { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer.jsx";
import "./Inventory.css";

const Inventory = () => {
  const [products, setProducts] = useState([
    { name: "Red Velvet Cloth", category: "Cloth Material", subcategory: "Velvet", stock: 25, status: "In Stock" },
    { name: "Golden Tent Fabric", category: "Wedding Tent", subcategory: "Canopy", stock: 8, status: "Low Stock" },
    { name: "Flower Garland", category: "Decoration Props", subcategory: "Artificial Flowers", stock: 4, status: "Low Stock" },
    { name: "Silk Curtain", category: "Cloth Material", subcategory: "Silk", stock: 0, status: "Out of Stock" },
  ]);

  const handleStockChange = (index, type) => {
    const newProducts = [...products];
    if (type === "add") newProducts[index].stock += 1;
    else if (type === "remove" && newProducts[index].stock > 0)
      newProducts[index].stock -= 1;

    // Update status dynamically
    if (newProducts[index].stock === 0) newProducts[index].status = "Out of Stock";
    else if (newProducts[index].stock <= 10) newProducts[index].status = "Low Stock";
    else newProducts[index].status = "In Stock";

    setProducts(newProducts);
  };

  return (
    <div className="admin-dashboard-wrapper">
      <Sidebar />
      <main className="main-content">
        <Navbar />

        <div className="admin-inventory-page fade-in">
          <h2>Inventory Management</h2>
          <p className="subtitle">
            Track and manage stock levels by category and subcategory.
          </p>

          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.subcategory}</td>
                    <td>{p.stock}</td>

                    <td>
                      {p.status === "In Stock" ? (
                        <span className="stock-badge good">In Stock</span>
                      ) : p.status === "Low Stock" ? (
                        <span className="stock-badge low">Low Stock</span>
                      ) : (
                        <span className="stock-badge out">Out of Stock</span>
                      )}
                    </td>

                    <td className="adjust-buttons">
                      <div className="action-controls">
                        <button
                          className="btn-remove"
                          onClick={() => handleStockChange(i, "remove")}
                        >
                          −
                        </button>
                        <button
                          className="btn-add"
                          onClick={() => handleStockChange(i, "add")}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default Inventory;
