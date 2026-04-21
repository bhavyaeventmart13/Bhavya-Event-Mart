// ===========================================
// src/admin/BulkUpload.jsx (Fixed Version)
// ===========================================
import React, { useEffect, useState } from "react";
import "./BulkUpload.css";
import { FaPlus, FaTimes, FaPaintBrush } from "react-icons/fa";


export default function BulkUpload({ isOpen, onClose, onDone }) {
  if (!isOpen) return null;

  // ---------------- STATE ----------------
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Available");
  const [sizes, setSizes] = useState([]);
  const [customSize, setCustomSize] = useState("");
  const [rows, setRows] = useState([
    {
      name: "",
      files: [],
      imageUrls: [],
      refNumber: "",
      colors: []
    }
  ]);

  const [uploading, setUploading] = useState(false);

  const availableSizes = [
    "10X15", "10X30", "15X15", "15X30", "4X4", "6X6", "1.50X15",
    "15 Feet", "30 Feet", "5 Feet X 150 Feet", "10 Feet X 150 Feet",
    "100 Mtr", "200 Mtr", "500 Mtr", "1000 Mtr", "5000 Mtr",
    "All CUSTOM SIZES AVAIABLE"
  ];

  // ---------------- FETCH CATEGORIES ----------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        const mapped = data.map((cat) => ({
          _id: cat._id,
          name: cat.name,
          selected: false,
          subcategories: (cat.subcategories || []).map((s) => ({
            name: typeof s === "string" ? s : s.name,
            selected: false,
          })),
          showSubInput: false,
        }));
        setCategories(mapped);
      } catch (err) {
        console.error("❌ Category fetch error:", err);
        alert("Failed to fetch categories.");
      }
    };
    fetchCategories();
  }, []);

  // ---------------- CATEGORY HANDLERS ----------------
  const toggleCategory = (index) =>
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );

  const toggleSubcategory = (catIndex, subIndex) =>
    setCategories((prev) =>
      prev.map((c, i) =>
        i === catIndex
          ? {
              ...c,
              subcategories: c.subcategories.map((s, j) =>
                j === subIndex ? { ...s, selected: !s.selected } : s
              ),
            }
          : c
      )
    );

  const toggleSubInput = (index) =>
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, showSubInput: !c.showSubInput } : c))
    );

  const addSubcategory = (index, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setCategories((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              subcategories: [
                ...c.subcategories.filter((s) => s.name !== trimmed),
                { name: trimmed, selected: true },
              ],
              showSubInput: false,
            }
          : c
      )
    );
  };

  const removeSubcategory = (catIndex, subName) =>
    setCategories((prev) =>
      prev.map((c, i) =>
        i === catIndex
          ? { ...c, subcategories: c.subcategories.filter((s) => s.name !== subName) }
          : c
      )
    );

  // ---------------- SIZE HANDLERS ----------------
  const calcFinal = (s) => {
    const p = parseFloat(s.price) || 0;
    const d = parseFloat(s.discountPercent) || 0;
    const g = parseFloat(s.gstPercent) || 0;
    const discounted = p - (p * d) / 100;
    const gstAdded = discounted + (discounted * g) / 100;
    return gstAdded > 0 ? gstAdded.toFixed(2) : "";
  };

  const addSize = (size) => {
    const trimmed = size.trim().toUpperCase();
    if (!trimmed || sizes.some((s) => s.size === trimmed)) return;
    setSizes((prev) => [
      ...prev,
      { size: trimmed, price: "", discountPercent: "", gstPercent: "", final: "" },
    ]);
  };

  const updateSize = (label, key, val) =>
    setSizes((prev) =>
      prev.map((s) => {
        if (s.size === label) {
          const newState = { ...s, [key]: val };
          return { ...newState, final: calcFinal(newState) };
        }
        return s;
      })
    );

  const removeSize = (label) => setSizes((prev) => prev.filter((s) => s.size !== label));

  // ---------------- ROW HANDLERS ----------------
  const addRow = () =>
    setRows((r) => [
      ...r,
      {
        name: "",
        files: [],
        imageUrls: [],
        refNumber: "",
        colors: []
      }
    ]);

  const removeRow = (i) => setRows((r) => r.filter((_, x) => x !== i));
const updateRow = (index, changes) =>
  setRows((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], ...changes };
    return next;
  });


  // ---------------- UPLOAD IMAGES ----------------
 const uploadImages = async (files) => {
  if (!files.length) return [];

  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));

  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/upload/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Image upload failed");

  // ✅ SUPPORT BOTH RESPONSE SHAPES
  return data.urls || data.imageUrls || [];
};


  // ---------------- REF GENERATOR ----------------
  const generateRefNumber = (name, cat, sub) => {
    const prodPart = (name || "XXX").substring(0, 3).toUpperCase();
    const catPart = (cat || "CAT").substring(0, 3).toUpperCase();
    const subPart = (sub || "SUB").substring(0, 3).toUpperCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `PC-${prodPart}-${catPart}-${subPart}-${randomDigits}`;
  };

  // ---------------- SUBMIT ----------------
  const submit = async () => {
    const selectedCategories = categories
      .filter((c) => c.selected || c.subcategories.some((s) => s.selected))
      .map((cat) => ({
        name: cat.name,
        subcategories: cat.subcategories.filter((s) => s.selected).map((s) => s.name),
      }));

    if (!selectedCategories.length)
      return alert("⚠️ Please select at least one category!");
    if (!sizes.length) return alert("⚠️ Please add at least one size!");

    const productsToUpload = rows.filter(
  (r) => r.files.length > 0 || r.colors.length > 0
);

    if (!productsToUpload.length)
      return alert("⚠️ Please select files for at least one product row!");

    try {
      setUploading(true);
      const token = localStorage.getItem("token");

      const formattedSizes = sizes.map((s) => ({
        size: s.size,
        originalPrice: +s.price,
        discountPercent: +s.discountPercent || 0,
        gstPercent: +s.gstPercent || 0,
        discountedPrice: +s.final,
      }));

const uploadedProducts = [];

const BATCH_SIZE = 5; // 🔥 FINAL REQUIREMENT

for (let i = 0; i < productsToUpload.length; i += BATCH_SIZE) {
  const batch = productsToUpload.slice(i, i + BATCH_SIZE);

  const batchResults = await Promise.all(
    batch.map(async (r) => {
      // ✅ upload main product images
      const imageUrls = await uploadImages(r.files);

      // ✅ upload color images
      let colors = [];
      if (r.colors?.length) {
        const validColors = r.colors.filter((c) => c.name?.trim() && c.file);

        const colorResults = [];

        for (const c of validColors) {
          const [img] = await uploadImages([c.file]); // 🔥 sequential inside
          colorResults.push({
            name: c.name,
            hex: c.hex,
            image: img,
          });
        }

        colors = colorResults;
      }

      return {
        name: r.name || "Unnamed Product",
        imageUrls,
        refNumber: generateRefNumber(r.name, "", ""),
        colors,
      };
    })
  );

  uploadedProducts.push(...batchResults);
}


      const payload = {
        categories: selectedCategories,
        commonFields: { description, status, sizes: formattedSizes },
        products: uploadedProducts,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/bulk-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      alert(`✅ Uploaded ${data.count || uploadedProducts.length} products successfully!`);
      onDone?.();
      onClose();
    } catch (err) {
      console.error("❌ Bulk upload error:", err);
      alert(err.message || "Unexpected error during upload.");
    } finally {
      setUploading(false);
    }
  };

// ---------------- RENDER ----------------
return (
  <div className="bulk-upload-container">
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content">
        <h3>Bulk Upload Products</h3>

        <div className="form-section">
          <h4>Product Rows</h4>

          {rows.map((r, i) => (
            <div key={i} className="bulk-row">
              {/* Product Name */}
              <input
                placeholder={`Product ${i + 1} Name`}
                value={r.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
              />

              {/* Enable Colors + Images + Remove */}
              <div className="enable-colors-row">
                <label>
                  <input
                    type="checkbox"
                    checked={!!r.colors.length}
                    onChange={(e) =>
                      updateRow(i, {
                        colors: e.target.checked
                          ? r.colors.length
                            ? r.colors
                            : [{ name: "", hex: "#cccccc", file: null }]
                          : [],
                      })
                    }
                  />
                  Enable Colors / Shades
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    updateRow(i, { files: Array.from(e.target.files) });
                    e.target.value = "";
                  }}
                />

                <button
                  type="button"
                  className="remove-product-btn"
                  onClick={() => removeRow(i)}
                >
                  Remove
                </button>
              </div>

              {/* Colors Section */}
              {r.colors.length > 0 && (
                <div className="colors-section">
                  <strong style={{ fontSize: "13px" }}>Colors</strong>

                  {r.colors.map((c, ci) => (
                    <div key={ci} className="color-input-row">
                      <input
                        placeholder="Color name"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...r.colors];
                          updated[ci].name = e.target.value;
                          updateRow(i, { colors: updated });
                        }}
                      />

                      <input
                        type="color"
                        value={c.hex || "#cccccc"}
                        onChange={(e) => {
                          const updated = [...r.colors];
                          updated[ci].hex = e.target.value;
                          updateRow(i, { colors: updated });
                        }}
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const updated = [...r.colors];
                          updated[ci].file = e.target.files[0];
                          updateRow(i, { colors: updated });
                        }}
                      />

                      <button
                        type="button"
                        className="remove-color-btn"
                        onClick={() => {
                          const updated = r.colors.filter((_, x) => x !== ci);
                          updateRow(i, { colors: updated });
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-color-btn"
                    onClick={() =>
                      updateRow(i, {
                        colors: [
                          ...r.colors,
                          { name: "", hex: "#cccccc", file: null },
                        ],
                      })
                    }
                  >
                    + Add Color
                  </button>
                </div>
              )}

              {/* File Preview */}
              {r.files.length > 0 && (
                <div className="file-list">
                  <span style={{ color: "#f2c572" }}>
                    {r.files.length} file
                    {r.files.length > 1 ? "s" : ""} selected:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {r.files.map((f, idx) => (
                      <span key={idx} className="file-pill">
                        {f.name.length > 15
                          ? f.name.slice(0, 12) + "..."
                          : f.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            className="add-product-row-btn"
            onClick={addRow}
          >
            + Add Another Product
          </button>
        </div>
          <div className="form-section">
            <h4>Categories & Subcategories (Select Multiple)</h4>
            {categories.map((cat, i) => (
              <div key={cat._id} className="category-group">
                <div className="category-header">
                  <label className="checkbox-label category-checkbox">
                    <input
                      type="checkbox"
                      checked={cat.selected}
                      onChange={() => toggleCategory(i)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="category-name-text">{cat.name}</span>
                  </label>
                  <button
                    className="plus-btn"
                    title="Add Subcategory"
                    onClick={() => toggleSubInput(i)}
                  >
                    <FaPlus />
                  </button>
                </div>

                {cat.showSubInput && (
                  <div className="subcategory-input">
                    <input
                      type="text"
                      placeholder="Enter new subcategory name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addSubcategory(i, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        addSubcategory(i, e.target.previousSibling.value);
                        e.target.previousSibling.value = "";
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}

                {cat.subcategories.length > 0 && (
                  <ul className="subcategory-list">
                    {cat.subcategories.map((sub, j) => (
                      <li key={j}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={sub.selected}
                            onChange={() => toggleSubcategory(i, j)}
                          />
                          <span className="checkbox-custom"></span>
                          <span className="subcategory-name-text">{sub.name}</span>
                        </label>
                        <button
                          className="remove-subcat-btn"
                          title="Remove Subcategory"
                          onClick={() => removeSubcategory(i, sub.name)}
                        >
                          <FaTimes />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="form-section">
            <div className="desc-header">
              <h4 style={{ margin: 0 }}>Description</h4>
              <button
                type="button"
                className="canva-edit"
                onClick={() =>
                  window.open(
                    "https://openai.com",
                    "CanvaEditor",
                    "width=600,height=550,top=100,left=100"
                  )
                }
              >
                <FaPaintBrush /> Generate With Ai
              </button>
            </div>
            <textarea
              placeholder="Enter AI prompt or description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-section">
            <h4>Sizes Available</h4>
            <div className="size-buttons">
              {availableSizes.map((sz) => (
                <button key={sz} type="button" onClick={() => addSize(sz)}>
                  {sz}
                </button>
              ))}
            </div>
            <div className="size-input">
              <input
                type="text"
                placeholder="Add custom size"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (addSize(customSize), setCustomSize(""))
                }
              />
              <button onClick={() => (addSize(customSize), setCustomSize(""))}>
                Add
              </button>
            </div>

            {sizes.length > 0 && (
              <table className="size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Price (₹)</th>
                    <th>Discount (%)</th>
                    <th>GST (%)</th>
                    <th>Final Price (₹)</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((s) => (
                    <tr key={s.size}>
                      <td>{s.size}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={s.price}
                          onChange={(e) => updateSize(s.size, "price", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={s.discountPercent}
                          onChange={(e) =>
                            updateSize(s.size, "discountPercent", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={s.gstPercent}
                          onChange={(e) =>
                            updateSize(s.size, "gstPercent", e.target.value)
                          }
                        />
                      </td>
                      <td>₹{s.final}</td>
                      <td>
                        <button onClick={() => removeSize(s.size)}>
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button
              type="submit"
              onClick={submit}
              disabled={uploading || !sizes.length}
            >
              {uploading
                ? "Uploading..."
                : `Upload All (${rows.filter((r) => r.files.length > 0).length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}