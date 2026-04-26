// ===========================================
// src/pages/Product.jsx (Updated with Multi-Subcategory CSV)
// ===========================================
import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  FiUploadCloud,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiList,
  FiMonitor,
} from "react-icons/fi";
import "./Product.css";
import axios from "axios";

import Sidebar from "./Sidebar";
import AddProduct from "./Addproduct";
import EditProduct from "./EditProduct";
import Navbar from "../component/Navbar";
import AddPopup from "../admin/AddPopup";
import { ProductContext } from "../context/ProductContext";
import Footer from "../component/Footer";
import BulkUpload from "../admin/BulkUpload.jsx";

const Product = () => {
  const {
    products,
    setProducts,
    fetchAllProductsAdmin,
    totalProducts,
    adminPage
  } = useContext(ProductContext);

  const [csvCategory, setCsvCategory] = useState("");
  const [csvSubcategory, setCsvSubcategory] = useState([]);
  const [csvCategories, setCsvCategories] = useState([]);
  const [headerCategory, setHeaderCategory] = useState("");
  const [headerSubcategory, setHeaderSubcategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [backupLoading, setBackupLoading] = useState(false);
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState([]);

  // Selected CSV category
  const selectedCategoryObj = csvCategories.find((c) => c.name === csvCategory);

  const subcategories =
    selectedCategoryObj?.subcategories?.map((s) =>
      typeof s === "string" ? s : s.name
    ) || [];

  // ================= INITIAL LOAD =================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchAllProductsAdmin();

        const res = await fetch(
          "https://https://bhavya-event-mart.onrender.com/api/categories"
        );
        const data = await res.json();
        if (res.ok) {
          setCategories(data);
          setCsvCategories(data);
        }
      } catch (err) {
        console.error("❌ Initial load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchAllProductsAdmin]);

  // ================= CRUD =================
  const handleAddProduct = (newProduct) =>
    setProducts((prev) => [newProduct, ...prev]);

  const handleEdit = (product) => setEditingProduct(product);

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
    );
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login required");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch { }

      if (!res.ok) {
        alert(data?.message || "Delete failed");
        return;
      }

      alert("✅ Product deleted!");
      fetchAllProductsAdmin();
    } catch {
      alert("Delete error");
    }
  };

  // ================= STATUS =================
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "status-available";
      case "unavailable":
        return "status-unavailable";
      case "low stock":
        return "status-low";
      default:
        return "status-default";
    }
  };

  // ================= FILTER + SORT (MEMOIZED) =================
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = searchTerm.toLowerCase();
        const nameHit = p.name?.toLowerCase().includes(q);
        const refHit = p.refNumber?.toLowerCase().includes(q);

        const catHit =
          Array.isArray(p.categories) &&
          p.categories.some((c) => {
            const catName = c?.name?.toLowerCase() || "";
            const subNames =
              Array.isArray(c.subcategories)
                ? c.subcategories.join(", ").toLowerCase()
                : "";
            return catName.includes(q) || subNames.includes(q);
          });

        return nameHit || refHit || catHit;
      })
      .sort((a, b) => {
        if (sortOption === "price-low")
          return (a.sizes?.[0]?.discountedPrice || 0) -
            (b.sizes?.[0]?.discountedPrice || 0);

        if (sortOption === "price-high")
          return (b.sizes?.[0]?.discountedPrice || 0) -
            (a.sizes?.[0]?.discountedPrice || 0);

        if (sortOption === "category")
          return (a.categories?.[0]?.name || "").localeCompare(
            b.categories?.[0]?.name || ""
          );

        if (sortOption === "subcategory")
          return (a.categories?.[0]?.subcategories?.[0] || "").localeCompare(
            b.categories?.[0]?.subcategories?.[0] || ""
          );

        return 0;
      });
  }, [products, searchTerm, sortOption]);

  // ================= REORDER =================
  const toggleCategorySelection = (name) => {
    setSelectedOrder((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };
  const toggleSubSelection = (name) => {
    setSelectedSubOrder((prev) =>
      prev.includes(name)
        ? prev.filter((s) => s !== name)
        : [...prev, name]
    );
  };
  const handleSaveOrder = async () => {
    if (!selectedOrder.length) return alert("Select categories");

    try {
      const res = await fetch(
        "https://https://bhavya-event-mart.onrender.com/api/categories/reorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedCategories: selectedOrder }),
        }
      );

      if (res.ok) {
        alert("✅ Order updated");
        setShowReorderModal(false);
      }
    } catch {
      alert("Save error");
    }
  };

  const handleSaveSubOrder = async () => {
    if (!selectedCategoryForSub || !selectedSubOrder.length) {
      return alert("Select subcategories");
    }

    const category = categories.find(c => c.name === selectedCategoryForSub);

    try {
      const res = await fetch(
        "https://https://bhavya-event-mart.onrender.com/api/categories/reorder-subcategories",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: category._id,
            orderedSubcategories: selectedSubOrder.map(name => ({
              name
            }))
          })
        }
      );
      if (res.ok) {
        alert("✅ Subcategory order updated");

        // ✅ REFRESH CATEGORIES
        const updated = await fetch(
          "https://https://bhavya-event-mart.onrender.com/api/categories"
        );
        const data = await updated.json();

        setCategories(data);
        setCsvCategories(data);

        setSelectedSubOrder([]);
        setSelectedCategoryForSub(null);
      }

    } catch {
      alert("Error saving subcategory order");
    }
  };

  // ================= PRODUCT BACKUP =================
  const handleProductBackup = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Login required");
        return;
      }

      setBackupLoading(true);

      // 🔥 Show start message
      alert("📦 Backup started... Please wait");
      setTimeout(() => {
        alert("⏳ Backup is taking longer... please wait");
      }, 15000);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/backup`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Backup failed");
        setBackupLoading(false); // 🔥 FIX
        return;
      }
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `product-backup-${Date.now()}.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      alert("✅ Backup downloaded successfully!");

    } catch (err) {
      console.error(err);
      alert("❌ Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };
  // ================= CSV =================
  const downloadCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/products/csv-export`;

      const params = [];
      if (csvCategory) params.push(`category=${encodeURIComponent(csvCategory)}`);
      if (csvSubcategory.length)
        params.push(`subcategory=${encodeURIComponent(csvSubcategory.join(","))}`);

      if (params.length) url += "?" + params.join("&");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = await res.blob();
      const link = document.createElement("a");

      const nameParts = [];
      if (csvCategory) nameParts.push(csvCategory);
      if (csvSubcategory.length) nameParts.push(csvSubcategory.join("-"));

      link.href = window.URL.createObjectURL(blob);
      link.download = nameParts.length
        ? `${nameParts.join("_")}.csv`
        : "products.csv";

      link.click();
    } catch {
      alert("CSV download failed");
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/products/csv-bulk-edit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const summary = res.data.summary;

      alert(
        `✅ CSV Upload Completed

Updated: ${summary.updated.length}
Not Found: ${summary.notFound.length}
Size Skipped: ${summary.sizeSkipped.length}
Invalid Rows: ${summary.invalidRows}`
      );

      fetchAllProductsAdmin();

    } catch (err) {
      console.error(err);
      alert("❌ CSV upload failed");
    }
  };
  {/* ========================================================== */ }
  {/* 🧾 Render Layout */ }
  {/* ========================================================== */ }

  return (
    <div className="products-page">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <header className="products-header">
          <div className="top-action-row">

            <button className="button secondary" onClick={() => setShowBulk(true)}>
              <FiUploadCloud /> Bulk Upload
            </button>

            <button className="button secondary" onClick={() => setShowPopupModal(true)}>
              <FiMonitor /> Add Popup
            </button>

            <button className="button primary" onClick={() => setIsModalOpen(true)}>
              <FiPlus /> Add Product
            </button>

            <button className="button secondary" onClick={() => setShowReorderModal(true)}>
              <FiList /> Reorder Categories
            </button>

            {/* CATEGORY DROPDOWN */}
            <select
              className="csv-category-select"
              value={csvCategory}
              onChange={(e) => {
                setCsvCategory(e.target.value);
                setCsvSubcategory([]);
              }}
            >
              <option value="">Select Category</option>
              {csvCategories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* SUBCATEGORY CHECKBOXES */}
            {csvCategory && subcategories.length > 0 && (
              <div className="csv-subcategory-box">
                {subcategories.map((sub) => (
                  <label key={sub} style={{ marginRight: "10px", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      value={sub}
                      checked={csvSubcategory.includes(sub)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCsvSubcategory((prev) => [...prev, sub]);
                        } else {
                          setCsvSubcategory((prev) =>
                            prev.filter((s) => s !== sub)
                          );
                        }
                      }}
                    />{" "}
                    {sub}
                  </label>
                ))}
              </div>
            )}

            <button className="button secondary" onClick={downloadCSV}>
              Download CSV
            </button>

            <label className="csv-upload-btn">
              Upload CSV
              <input type="file" accept=".csv" hidden onChange={handleCsvUpload} />

            </label>


          </div>
        </header>
        {/* ================= FILTER SECTION ================= */}
        <section className="filter-section card">
          <p className="filter-description" style={{ fontSize: "12px", opacity: 0.8 }}>
            select category → tick subcategories → download csv → edit file → upload csv → table updates automatically

            ✅ Allowed:

            Update price

            Update discount

            Update GST

            Update product name

            Update status

            ❌ Not allowed:

            Create new sizes

            Rename sizes

            Update image

            Update refNumber
          </p>

          <h3>Filter Products</h3>

          <div className="filter-controls">
            <div className="search-input-container">
              <FiSearch className="search-icon" />
              <input
                className="search-input transparent"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-direct-sort">
              <label className="sort-label">Sort By:</label>
              <select
                className="dropdown-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="category">Category</option>
                <option value="subcategory">Subcategory</option>
              </select>
            </div>
          </div>
        </section>

        {/* ================= PRODUCT CATALOG ================= */}
        <section className="product-catalog card">
          <div className="catalog-header">
            <h3>Product Catalog</h3>

            <p style={{ fontSize: "13px", opacity: 0.8 }}>
              Total Products : {totalProducts || filteredProducts.length} products
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <p style={{ padding: "30px", textAlign: "center", opacity: 0.7 }}>
              No products found
            </p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Reference #</th>
                    <th>Product Name</th>

                    {/* CATEGORY HEADER FILTER */}
                    <th>


                      <div style={{ marginTop: "6px" }}>
                        <select
                          className="admin-category-select"
                          value={headerCategory}
                          onChange={(e) => {
                            setHeaderCategory(e.target.value);
                            setHeaderSubcategory("");
                          }}
                        >
                          <option value="">              Category → Subcategory</option>

                          {categories.map((c) => (
                            <option key={c._id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {headerCategory && (
                          <select
                            className="admin-subcategory-select"
                            value={headerSubcategory}
                            onChange={(e) => setHeaderSubcategory(e.target.value)}
                          >
                            <option value=""> Subcategories</option>

                            {categories
                              .find((c) => c.name === headerCategory)
                              ?.subcategories.map((s) => (
                                <option
                                  key={typeof s === "string" ? s : s._id}
                                  value={typeof s === "string" ? s : s.name}
                                >
                                  {typeof s === "string" ? s : s.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </th>

                    <th>Size-wise Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {[...filteredProducts]
                    .filter((p) => {
                      if (!headerCategory) return true;
                      return p.categories?.some((c) => c.name === headerCategory);
                    })
                    .filter((p) => {
                      if (!headerSubcategory) return true;
                      return p.categories?.some((c) =>
                        c.subcategories?.includes(headerSubcategory)
                      );
                    })
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                    .map((p) => (
                      <tr key={p._id}>
                      <td className="product-image-cell">
  {p.imageUrls?.length ? (
    <img
      src={p.thumbnailUrl || p.imageUrls[0]}
      alt={p.name}
      className="product-image"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className="product-image-placeholder">IMG</div>
  )}
</td>

                        <td>{p.refNumber || "N/A"}</td>

                        <td>
                          <div className="product-name-info">
                            <span>{p.name}</span>
                            <span className="product-id">ID: {p._id}</span>
                          </div>
                        </td>

                        <td>
                          {Array.isArray(p.categories) && p.categories.length ? (
                            p.categories.map((c, i) => {
                              const catName = c?.name || "Unknown";
                              const subNames =
                                Array.isArray(c.subcategories) && c.subcategories.length
                                  ? c.subcategories.join(", ")
                                  : "";

                              return (
                                <span key={i}>
                                  {catName}
                                  {subNames ? ` → ${subNames}` : ""}
                                  {i < p.categories.length - 1 ? " | " : ""}
                                </span>
                              );
                            })
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          {Array.isArray(p.sizes) && p.sizes.length ? (
                            <div className="size-price-list">
                              {p.sizes.map((s, i) => (
                                <div key={i}>
                                  <strong>{s.size}</strong> → ₹{s.discountedPrice}
                                  <span className="old-price"> (₹{s.originalPrice})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <span className={getStatusClass(p.status)}>
                            {p.status || "Available"}
                          </span>
                        </td>

                        <td className="action-buttons">
                          <button className="text-button edit" onClick={() => handleEdit(p)}>
                            <FiEdit /> Edit
                          </button>
                          <button className="text-button delete" onClick={() => handleDelete(p._id)}>
                            <FiTrash2 /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>


            </div>
          )}
        </section>



        {/* Modals */}
        {showBulk && <BulkUpload isOpen={showBulk} onClose={() => setShowBulk(false)} />}

        {isModalOpen && (
          <AddProduct
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onProductAdded={handleAddProduct}
          />
        )}

        {editingProduct && (
          <EditProduct
            isOpen={!!editingProduct}
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onProductUpdated={handleProductUpdated}
          />
        )}

        {showPopupModal && (
          <AddPopup isOpen={showPopupModal} onClose={() => setShowPopupModal(false)} />
        )}

        {/* Reorder Modal */}
        {showReorderModal && (
          <div className="modal-overlay">
            <div className="modal-content card">
              <h2>Reorder Categories</h2>


              <div className="category-list">
                {categories.map((cat) => {
                  const index = selectedOrder.indexOf(cat.name);
                  const isSelected = index !== -1;

                  return (
                    <button
                      key={cat._id}
                      className={`category-btn ${isSelected ? "selected-category" : ""}`}
                      onClick={() => toggleCategorySelection(cat.name)}
                    >
                      {cat.name}
                      {isSelected && (
                        <span className="selection-number">{index + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <hr />

              <h3>Reorder Subcategories</h3>

              <select
                value={selectedCategoryForSub || ""}
                onChange={(e) => {
                  setSelectedCategoryForSub(e.target.value);
                  setSelectedSubOrder([]);
                }}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {selectedCategoryForSub && (
                <div className="category-list">
                  {categories
                    .find(c => c.name === selectedCategoryForSub)
                    ?.subcategories.map((sub) => {
                      const name = typeof sub === "string" ? sub : sub.name;
                      const index = selectedSubOrder.indexOf(name);
                      const isSelected = index !== -1;

                      return (
                        <button
                          key={name}
                          className={`category-btn ${isSelected ? "selected-category" : ""}`}
                          onClick={() => toggleSubSelection(name)}
                        >
                          {name}
                          {isSelected && (
                            <span className="selection-number">{index + 1}</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              <p className="selected-text">
                Selected Order:{" "}
                {selectedOrder.map((c, i) => `${i + 1}. ${c}`).join(" → ")}
              </p>

              <div className="modal-actions">
                <button className="button primary" onClick={handleSaveSubOrder}>
                  Save Subcategory Order
                </button>
                <button
                  className="button secondary"
                  onClick={() => setShowReorderModal(false)}
                >
                  Cancel
                </button>
                <button className="button primary" onClick={handleSaveOrder}>
                  Save Order
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Product;
