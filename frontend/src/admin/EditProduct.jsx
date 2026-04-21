// ===========================================
// src/admin/EditProduct.jsx (Final Fixed & Enhanced)
// ===========================================
import React, { useState, useEffect } from "react";
import "./EditProduct.css";
import noImage from "../assets/react.svg";

const EditProduct = ({ isOpen, onClose, product, onProductUpdated }) => {
  const [formData, setFormData] = useState({});
  const [sizes, setSizes] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ======================================================
  // Load product data when opened
  // ======================================================
  useEffect(() => {
    if (product) {
      const formattedCategories = Array.isArray(product.categories)
        ? product.categories
            .map((cat) => {
              const subcats = Array.isArray(cat.subcategories)
                ? cat.subcategories.join(" → ")
                : "";
              return subcats ? `${cat.name} → ${subcats}` : cat.name;
            })
            .join(", ")
        : "";

      setFormData({
        productName: product.name || "",
        categories: formattedCategories,
        stockUnits: product.stockUnits || 0,
        status: product.status || "Available",
        refNumber: product.refNumber || "",
        description: product.description || "",
      });

      setSizes(product.sizes || []);
      setExistingImages(product.imageUrls || []);
     setImagePreviews([]);
      setImages([]);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // ======================================================
  // Input Handlers
  // ======================================================
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleFileChange = (e) => {
  const files = Array.from(e.target.files);

  // 🔥 ADD instead of replace
  setImages((prev) => [...prev, ...files]);

  const previews = files.map((f) => URL.createObjectURL(f));

  setImagePreviews((prev) => [...prev, ...previews]);
};

  // ======================================================
  // Size Handlers (GST aware)
  // ======================================================
  const handleSizeChange = (index, field, value) => {
    const updated = [...sizes];
    updated[index][field] = value;

    const base = Number(updated[index].originalPrice || 0);
    const discount = Number(updated[index].discountPercent || 0);
    const gst = Number(updated[index].gstPercent || 0);

    // Apply discount first, then GST
    const discounted = base - (base * discount) / 100;
    const gstAmount = (discounted * gst) / 100;
    updated[index].discountedPrice = Number((discounted + gstAmount).toFixed(2));

    setSizes(updated);
  };

  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      {
        size: "",
        originalPrice: 0,
        discountPercent: 0,
        gstPercent: 0,
        discountedPrice: 0,
      },
    ]);
  };

  const removeSize = (index) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };
// ======================================================
// Submit Handler (with JWT + existingImages)
// ======================================================
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const data = new FormData();

  // ==============================
  // Format categories → structured JSON
  // ==============================
  const categoryPairs = formData.categories
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c);

  const structuredCategories = categoryPairs.map((pair) => {
    const [main, sub] = pair.split("→").map((p) => p.trim());
    return { name: main, subcategories: sub ? [sub] : [] };
  });

  // ==============================
  // Append fields
  // ==============================
  data.append("productName", formData.productName);
  data.append("categories", JSON.stringify(structuredCategories));
  data.append("stockUnits", formData.stockUnits);
  data.append("status", formData.status);
  data.append("refNumber", formData.refNumber);
  data.append("description", formData.description);
  data.append("selectedSizes", JSON.stringify(sizes));

  // 🔥 VERY IMPORTANT (STEP 1)
  data.append("existingImages", JSON.stringify(existingImages));

  // ==============================
  // Append new images (multiple)
  // ==============================
  if (images.length > 0) {
    images.forEach((img) => data.append("images", img));
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in as admin to update products.");
      setLoading(false);
      return;
    }

    const res = await fetch(
      `https://pankaj-cloth-webapp.onrender.com/api/products/${product._id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      }
    );

    const result = await res.json();

    if (res.ok) {
      alert("✅ Product updated successfully!");
      onProductUpdated(result.product);
      onClose();
    } else {
      alert(result.message || "Failed to update product.");
    }
  } catch (err) {
    console.error("❌ Update failed:", err);
    alert("Network or server error. See console for details.");
  } finally {
    setLoading(false);
  }
};
const removeExistingImage = (index) => {
  setExistingImages((prev) => prev.filter((_, i) => i !== index));
};
  // ======================================================
  // UI Layout
  // ======================================================
  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal-content">
        <button className="edit-modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 className="edit-modal-header">Edit Product</h2>

        <form onSubmit={handleSubmit}>
          <div className="edit-modal-form">
            {/* Left: Image Upload Section */}
            <div className="form-image-section">
              <p>Product Images</p>
              <label htmlFor="imageUpload" className="image-uploader">
                <span>Click to Upload</span>
                <small>PNG / JPG up to 10MB</small>
              </label>
              <input
                id="imageUpload"
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />

<div className="image-preview-container">

  {/* EXISTING IMAGES */}
  {existingImages.map((url, i) => (
    <div key={`exist-${i}`} className="image-preview-box">
      <img
        src={url}
        alt="Existing"
        className="image-preview"
        onError={(e) => (e.target.src = noImage)}
      />

      {/* REMOVE BUTTON */}
      <button
        type="button"
        className="remove-image-btn"
        onClick={() => removeExistingImage(i)}
      >
        ✕
      </button>
    </div>
  ))}

  {/* NEW IMAGES */}
  {imagePreviews.map((preview, i) => (
    <div key={`new-${i}`} className="image-preview-box new-preview">
      <img src={preview} alt="New" className="image-preview" />
      <span className="new-badge">New</span>
    </div>
  ))}

</div>
            </div>

            {/* Right: Product Details */}
            <div className="form-details-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reference #</label>
                  <input
                    type="text"
                    name="refNumber"
                    value={formData.refNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Categories</label>
                  <input
                    type="text"
                    name="categories"
                    value={formData.categories}
                    onChange={handleChange}
                    required
                  />
                  <small className="hint-text">
                    Format: Category → Subcategory, Category2 → Sub2
                  </small>
                </div>

                <div className="form-group">
                  <label>Stock Units</label>
                  <input
                    type="number"
                    name="stockUnits"
                    value={formData.stockUnits}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <input
                    type="text"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group form-full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* ======================
                  SIZE-WISE PRICE SECTION
              ====================== */}
              <div className="size-section form-full-width">
                <label>Size-wise Prices</label>

                {sizes.length === 0 && (
                  <p className="no-sizes">No sizes added yet.</p>
                )}

                {sizes.map((size, i) => (
                  <div className="size-row" key={i}>
                    <input
                      type="text"
                      placeholder="Size (e.g. 15x15)"
                      value={size.size}
                      onChange={(e) =>
                        handleSizeChange(i, "size", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Original Price"
                      value={size.originalPrice}
                      onChange={(e) =>
                        handleSizeChange(i, "originalPrice", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Discount %"
                      value={size.discountPercent}
                      onChange={(e) =>
                        handleSizeChange(i, "discountPercent", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="GST %"
                      value={size.gstPercent}
                      onChange={(e) =>
                        handleSizeChange(i, "gstPercent", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Final Price"
                      value={size.discountedPrice}
                      readOnly
                    />
                    <button
                      type="button"
                      className="remove-size-btn"
                      onClick={() => removeSize(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="add-size-btn"
                  onClick={addSize}
                >
                  + Add Size
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="edit-modal-buttons">
            <button
              type="button"
              className="button cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="button save" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
