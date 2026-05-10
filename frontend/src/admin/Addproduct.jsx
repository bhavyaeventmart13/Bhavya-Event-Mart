// ===========================================
// src/admin/AddProduct.jsx (Updated with 'ap-' prefix)
// ===========================================
import React, { useEffect, useRef, useState } from "react";
import {
  FaTimes,
  FaUpload,
  FaMagic,
  FaPaintBrush,
  FaPlus,
  FaMinus,
  FaSave,
} from "react-icons/fa";
// NOTE: We assume Addproduct.css will be updated with the new class names
import "./Addproduct.css";

const AddProduct = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // ==========================
  // State Variables
  // ==========================
  const [productName, setProductName] = useState("");
  const [categoryData, setCategoryData] = useState([]);
  const [subCategoryInput, setSubCategoryInput] = useState({});
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [stockUnits, setStockUnits] = useState("");
  const [description, setDescription] = useState("");
  const [aiPrompt, setAIPrompt] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [customSize, setCustomSize] = useState("");
  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [status, setStatus] = useState("Available");
  const [refNumber, setRefNumber] = useState("");
const [editingCategoryId, setEditingCategoryId] = useState(null);
const [editingSubId, setEditingSubId] = useState(null);
const [editValue, setEditValue] = useState("");
  const overlayRef = useRef(null);

  const availableSizes = [
    "10X15",
    "10X30",
    "15X15",
    "15X30",
    "4X4",
    "6X6",
    "1.50X15",
    "15 Feet",
    "30 Feet",
    " 5 Feet X 150 Feet",
    "10 Feet X 150 Feet",
    "100 Mtr",
    "200 Mtr",
    "500 Mtr",
    "1000 Mtr",
    "5000 Mtr",
  ];

  // ==========================
  // Effects
  // ==========================
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!productName) return setRefNumber("");
    const prodPart = productName.substring(0, 3).toUpperCase();
    const mainCat = categoryData.find((cat) => cat.selected)?.name || "XXX";
    const catPart = mainCat.substring(0, 3).toUpperCase();
    const subCatObj = categoryData
      .find((cat) => cat.selected)
      ?.subcategories.find((s) => s.selected);
    const subPart = subCatObj
      ? subCatObj.name.substring(0, 3).toUpperCase()
      : "YYY";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setRefNumber(`PC-${prodPart}-${catPart}-${subPart}-${randomDigits}`);
  }, [productName, categoryData]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          "https://bhavya-event-mart.onrender.com/api/categories"
        );
        const data = await res.json();
        setCategoryData(
          data.map((cat) => ({
            _id: cat._id,
            name: cat.name,
             thumbnail: cat.thumbnail || "", 
            selected: false,
            subcategories: (cat.subcategories || []).map((s) => ({
              _id: s._id,
              name: s.name,
              selected: false,
                thumbnail: s.thumbnail || "" 
            })),
            showSubInput: false,
          }))
        );
      } catch (err) {
        console.error("Error fetching categories:", err);
        alert("Failed to fetch categories from backend.");
      }
    };
    fetchCategories();
  }, []);

  // ==========================
  // Category & Subcategory Handlers
  // ==========================
  const toggleCategory = (catId) =>
    setCategoryData((prev) =>
      prev.map((cat) =>
        cat._id === catId ? { ...cat, selected: !cat.selected } : cat
      )
    );

  const toggleSubInput = (catId) =>
    setCategoryData((prev) =>
      prev.map((cat) =>
        cat._id === catId
          ? { ...cat, showSubInput: !cat.showSubInput }
          : cat
      )
    );

  const addCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (
      categoryData.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      )
    )
      return alert("Category already exists.");
    setCategoryData((prev) => [
      ...prev,
      {
        _id: Date.now().toString(),
        name: trimmed,
        selected: true,
        subcategories: [],
        showSubInput: true,
         thumbnail: ""
      },
    ]);
    setNewCategoryInput("");
  };

  const uploadCategoryImage = async (file, catId) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      "https://bhavya-event-mart.onrender.com/api/categories/upload-thumbnail",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert("Upload failed");
      return;
    }

    setCategoryData((prev) =>
      prev.map((cat) =>
        cat._id === catId
          ? { ...cat, thumbnail: data.thumbnailUrl }
          : cat
      )
    );
  } catch (err) {
    console.error(err);
    alert("Upload error");
  }
};

  const addSubcategory = (catId) => {
    const trimmed = (subCategoryInput[catId] || "").trim();
    if (!trimmed) return;
    setCategoryData((prev) =>
      prev.map((cat) => {
        if (cat._id === catId) {
          if (
            cat.subcategories.some(
              (s) => s.name.toLowerCase() === trimmed.toLowerCase()
            )
          )
            return cat;
          return {
            ...cat,
            selected: true,
            subcategories: [
              ...cat.subcategories,
              {
                _id: Date.now().toString(),
                name: trimmed,
                selected: true,
                 thumbnail: ""
              },
            ],
            showSubInput: false,
          };
        }
        return cat;
      })
    );
    setSubCategoryInput((prev) => ({ ...prev, [catId]: "" }));
  };

  const toggleSubcategory = (catId, subId) =>
    setCategoryData((prev) =>
      prev.map((cat) =>
        cat._id === catId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((s) =>
                s._id === subId ? { ...s, selected: !s.selected } : s
              ),
            }
          : cat
      )
    );

  const removeSubcategory = async (catId, subId, subName) => {
    try {
      const catObj = categoryData.find((c) => c._id === catId);
      const resCheck = await fetch(
        `https://bhavya-event-mart.onrender.com/api/products/check-subcategory?category=${encodeURIComponent(
          catObj.name
        )}&subcategory=${encodeURIComponent(subName)}`
      );
      const dataCheck = await resCheck.json();
      if (dataCheck.hasProducts)
        return alert(
          `Cannot delete subcategory "${subName}" because it has existing products.`
        );

      if (
        !window.confirm(
          `Are you sure you want to delete subcategory "${subName}"?`
        )
      )
        return;

      const res = await fetch(
        "https://bhavya-event-mart.onrender.com/api/categories/delete-subcategory",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: catObj.name,
            subcategory: subName,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Cannot delete subcategory.");

      setCategoryData((prev) =>
        prev.map((cat) =>
          cat._id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.filter(
                  (s) => s._id !== subId
                ),
              }
            : cat
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete subcategory.");
    }
  };
const uploadSubcategoryImage = async (file, catId, subId) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      "https://bhavya-event-mart.onrender.com/api/categories/upload-thumbnail",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert("Upload failed");
      return;
    }

    // ✅ SAVE THUMBNAIL IN STATE
    setCategoryData((prev) =>
      prev.map((cat) =>
        cat._id === catId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((s) =>
                s._id === subId
                  ? { ...s, thumbnail: data.thumbnailUrl }
                  : s
              ),
            }
          : cat
      )
    );
  } catch (err) {
    console.error(err);
    alert("Upload error");
  }
};
  const removeCategory = async (catId) => {
    try {
      const category = categoryData.find((c) => c._id === catId);
      if (!category) return;

      if (category.subcategories.length > 0) {
        return alert(
          `Cannot delete category "${category.name}" because it has subcategories.`
        );
      }

      const resCheck = await fetch(
        `https://bhavya-event-mart.onrender.com/api/products/check-category?category=${encodeURIComponent(
          category.name
        )}`
      );
      const dataCheck = await resCheck.json();
      if (dataCheck.hasProducts)
        return alert(
          `Cannot delete category "${category.name}" because it has existing products.`
        );

      if (
        !window.confirm(
          `Are you sure you want to permanently delete category "${category.name}"?`
        )
      )
        return;

      const res = await fetch(
        `https://bhavya-event-mart.onrender.com/api/categories/${encodeURIComponent(
          category.name
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Cannot delete category.");

      setCategoryData((prev) => prev.filter((c) => c._id !== catId));
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the category.");
    }
  };

  const handleSaveCategories = async () => {
const categoriesToSave = categoryData.map((cat) => ({
  _id: cat._id,
  name: cat.name,
  thumbnail: cat.thumbnail || "",   // ✅ ADD THIS
  subcategories: cat.subcategories.map((s) => ({
    _id: s._id,
    name: s.name,
    thumbnail: s.thumbnail || ""
  })),
}));
    try {
      const res = await fetch(
        "https://bhavya-event-mart.onrender.com/api/categories/updateAll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoriesToSave),
        }
      );
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to save categories.");
      alert("Category structure saved successfully!");
    } catch (err) {
      console.error("Error saving categories:", err);
      alert("An error occurred while saving categories.");
    }
  };
// START EDIT CATEGORY
const startEditCategory = (catId) => {
  const cat = categoryData.find((c) => c._id === catId);
  if (!cat) return;

  setEditingCategoryId(catId);
  setEditingSubId(null);
  setEditValue(cat.name);
};

// START EDIT SUBCATEGORY
const startEditSubcategory = (catId, subId) => {
  const cat = categoryData.find((c) => c._id === catId);
  if (!cat) return;

  const sub = cat.subcategories.find((s) => s._id === subId);
  if (!sub) return;

  setEditingCategoryId(catId);
  setEditingSubId(subId);
  setEditValue(sub.name);
};

// CANCEL EDIT
const cancelEdit = () => {
  setEditingCategoryId(null);
  setEditingSubId(null);
  setEditValue("");
};
const saveEdit = (catId, subId = null) => {
  const newName = editValue.trim();
  if (!newName) return alert("Name cannot be empty");

  setCategoryData((prev) =>
    prev.map((cat) => {
      if (cat._id !== catId) return cat;

      // CATEGORY EDIT
      if (!subId) {
        // duplicate check
        const exists = prev.some(
          (c) =>
            c._id !== catId &&
            c.name.toLowerCase() === newName.toLowerCase()
        );
        if (exists) {
          alert("Category already exists");
          return cat;
        }

        return { ...cat, name: newName };
      }

      // SUBCATEGORY EDIT
      return {
        ...cat,
        subcategories: cat.subcategories.map((s) => {
          if (s._id !== subId) return s;

          // duplicate check
          const exists = cat.subcategories.some(
            (x) =>
              x._id !== subId &&
              x.name.toLowerCase() === newName.toLowerCase()
          );
          if (exists) {
            alert("Subcategory already exists");
            return s;
          }

          return { ...s, name: newName };
        }),
      };
    })
  );

  cancelEdit();
};
  // ==========================
  // File & Image Handlers
  // ==========================
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = [];
    newFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024)
        alert(`File "${file.name}" is larger than 5 MB.`);
      else validFiles.push(file);
    });
    if (files.length + validFiles.length > 10)
      return alert("Maximum 10 images allowed.");
    setFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleRemoveFile = (index) => {
    if (imagePreviews[index]) URL.revokeObjectURL(imagePreviews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () =>
      imagePreviews.forEach(
        (url) => typeof url === "string" && URL.revokeObjectURL(url)
      );
  }, [imagePreviews]);

  // ==========================
  // AI Description
  // ==========================
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return alert("Please enter a prompt for AI!");
    try {
      const res = await fetch(
        "https://bhavya-event-mart.onrender.com/api/ai/generate-description",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: aiPrompt }),
        }
      );
      const data = await res.json();
      setDescription(data.generatedText);
    } catch (err) {
      console.error(err);
      alert("Error generating description");
    }
  };

  // ==========================
  // Size Handlers
  // ==========================
  const toggleSize = (size) => {
    setSelectedSizes((prev) => {
      const exists = prev.find((s) => s.size === size);
      if (exists) return prev.filter((s) => s.size !== size);
      // Retaining the original logic for size object structure
      return [...prev, { size, price: "", discount: "", gstPercent: "", finalPrice: "" }];
    });
  };

  const removeSize = (sizeToRemove) =>
    setSelectedSizes((prev) => prev.filter((s) => s.size !== sizeToRemove));

  const addCustomSize = () => {
    const trimmed = customSize.trim().toUpperCase();
    if (!trimmed || selectedSizes.some((s) => s.size === trimmed)) return;
    // Retaining the original logic for size object structure
    setSelectedSizes((prev) => [
      ...prev,
      { size: trimmed, price: "", discount: "", gstPercent: "", finalPrice: "" },
    ]);
    setCustomSize("");
  };

  const updateSizeField = (size, field, value) => {
    setSelectedSizes((prev) =>
      prev.map((s) => {
        if (s.size !== size) return s;
        const updated = { ...s, [field]: value };

        // GST-aware calculation
        const price = parseFloat(updated.price) || 0;
        const discount = parseFloat(updated.discount) || 0;
        const gst = parseFloat(updated.gstPercent) || 0;

        const discounted = price - (price * discount) / 100;
        const gstAmount = (discounted * gst) / 100;
        const final = discounted + gstAmount;

        updated.finalPrice = final > 0 ? final.toFixed(2) : "";
        return updated;
      })
    );
  };

  // ==========================
  // Submit Handler
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🧩 Collect selected categories and subcategories
    const selectedCategories = categoryData
      .filter(
        (cat) => cat.selected || cat.subcategories.some((s) => s.selected)
      )
      .map((cat) => ({
        name: cat.name,
        subcategories: cat.subcategories
          .filter((s) => s.selected)
          .map((s) => s.name),
      }));

    // 🧩 Validation checks
    const hasInvalid = selectedSizes.some(
      (s) => !s.price || !s.finalPrice || Number(s.price) <= 0
    );

    if (
      !productName ||
      selectedCategories.length === 0 ||
      selectedSizes.length === 0 ||
      hasInvalid
    ) {
      return alert(
        "Please fill Product Name, Category/Subcategory, and ensure valid Size & Price details."
      );
    }

    // Include GST in each size object
    const formattedSizes = selectedSizes.map(
      ({ size, price, discount, gstPercent, finalPrice }) => ({
        size,
        originalPrice: Number(price),
        discountPercent: Number(discount) || 0,
        gstPercent: Number(gstPercent) || 0,
        discountedPrice: Number(finalPrice),
      })
    );

    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("categories", JSON.stringify(selectedCategories));
    formData.append("stockUnits", stockUnits || 0);
    formData.append("description", description);
    formData.append("selectedSizes", JSON.stringify(formattedSizes));
    formData.append("status", status);
    formData.append("refNumber", refNumber);
    files.forEach((file) => formData.append("images", file));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in as admin to add products.");
        return;
      }

      const res = await fetch(
        "https://bhavya-event-mart.onrender.com/api/products/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // include JWT
          },
          body: formData,
        }
      );

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw };
      }

      if (!res.ok) {
        const msg =
          data?.message ||
          (res.status === 401
            ? "Unauthorized. Please log in again."
            : "Failed to add product.");
        alert(msg);
        if (res.status === 401) localStorage.removeItem("token");
        return;
      }

      alert("✅ Product added successfully!");
      window.dispatchEvent(new Event("productAdded"));
      onClose();
    } catch (err) {
      console.error("Add product error:", err);
      alert("Error adding product. Please try again.");
    }
  };

  // ==========================
  // JSX (Updated with 'ap-' prefix)
  // ==========================
  return (
    <div
      className="ap-modal-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="ap-modal-content">
        <div className="ap-modal-header">
          <div className="ap-modal-title-group">
            <h3>Add New Product</h3>
            <p>Fill in the details below to add a product to your inventory.</p>
          </div>
          <button className="ap-modal-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ap-product-form" noValidate>
          {/* Product Name */}
          <div className="ap-form-section">
            <h4>Product Name</h4>
            <input
              type="text"
              placeholder="Enter product name*"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
{/* Category Section */}
<div className="ap-form-section">
  <h4>Categories & Subcategories</h4>

  {/* ADD CATEGORY */}
  <div className="ap-new-category-input">
    <input
      type="text"
      placeholder="Add new category"
      value={newCategoryInput}
      onChange={(e) => setNewCategoryInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && addCategory()}
    />
    <button
      type="button"
      className="ap-add-category-btn"
      onClick={addCategory}
    >
      <FaPlus /> Add Category
    </button>
  </div>

  {/* CATEGORY LIST */}
  {categoryData.map((cat) => (
    <div key={cat._id} className="ap-category-group">

      {/* CATEGORY HEADER */}
      <div className="ap-category-header">
    <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadCategoryImage(file, cat._id);
  }}
/>

{cat.thumbnail && (
  <img
    src={cat.thumbnail}
    style={{ width: 50, height: 50, borderRadius: 6 }}
  />
)}
        <label className="ap-checkbox-label ap-category-checkbox">
          <input
            type="checkbox"
            checked={cat.selected}
            onChange={() => toggleCategory(cat._id)}
          />
          <span className="ap-checkbox-custom" />

          {/* CATEGORY NAME / EDIT */}
          {editingCategoryId === cat._id && editingSubId === null ? (
            <div className="ap-edit-box">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => saveEdit(cat._id)}
              >
                ✔
              </button>
              <button
                type="button"
                onClick={cancelEdit}
              >
                ✖
              </button>
            </div>
          ) : (
            <span className="ap-category-name-text">
              {cat.name}
            </span>
          )}
        </label>

        {/* 🔥 EDIT CATEGORY */}
        <button
          type="button"
          className="ap-edit-btn"
          onClick={() => startEditCategory(cat._id)}
          title="Edit category"
        >
          ✏
        </button>

        {/* DELETE CATEGORY */}
        <button
          type="button"
          className="ap-minus-btn"
          onClick={() => removeCategory(cat._id)}
          title="Remove category"
        >
          <FaMinus />
        </button>

        {/* ADD SUBCATEGORY */}
        <button
          type="button"
          className="ap-plus-btn"
          onClick={() => toggleSubInput(cat._id)}
          title="Add subcategory"
        >
          <FaPlus />
        </button>
      </div>

      {/* ADD SUBCATEGORY INPUT */}
      {cat.showSubInput && (
        <div className="ap-subcategory-input">
          <input
            type="text"
            placeholder="Add subcategory"
            value={subCategoryInput[cat._id] || ""}
            onChange={(e) =>
              setSubCategoryInput((prev) => ({
                ...prev,
                [cat._id]: e.target.value,
              }))
            }
            onKeyDown={(e) =>
              e.key === "Enter" && addSubcategory(cat._id)
            }
          />
          <button
            type="button"
            className="ap-add-subcategory-btn"
            onClick={() => addSubcategory(cat._id)}
          >
            <FaPlus /> Add
          </button>
        </div>
      )}

      {/* SUBCATEGORY LIST */}
      {cat.subcategories.length > 0 && (
        <div className="ap-subcategory-dropdown">
          <ul>
            {cat.subcategories.map((sub) => (
              <li key={sub._id} className="ap-subcategory-item">
                <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadSubcategoryImage(file, cat._id, sub._id);
  }}
/>

{sub.thumbnail && (
  <img
    src={sub.thumbnail}
    style={{ width: 40, height: 40, borderRadius: 6 }}
  />
)}

                <label className="ap-checkbox-label">
                  <input
                    type="checkbox"
                    checked={sub.selected}
                    onChange={() =>
                      toggleSubcategory(cat._id, sub._id)
                    }
                  />
                  <span className="ap-checkbox-custom" />

                  {/* SUBCATEGORY NAME / EDIT */}
                  {editingCategoryId === cat._id &&
                  editingSubId === sub._id ? (
                    <div className="ap-edit-box">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() =>
                          saveEdit(cat._id, sub._id)
                        }
                      >
                        ✔
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                      >
                        ✖
                      </button>
                    </div>
                  ) : (
                    <span className="ap-subcategory-name">
                      {sub.name}
                    </span>
                  )}
                </label>

                {/* 🔥 EDIT SUBCATEGORY */}
                <button
                  type="button"
                  className="ap-edit-subcat-btn"
                  onClick={() =>
                    startEditSubcategory(cat._id, sub._id)
                  }
                  title="Edit subcategory"
                >
                  ✏
                </button>

                {/* DELETE SUBCATEGORY */}
                <button
                  type="button"
                  className="ap-remove-subcat-btn"
                  onClick={() =>
                    removeSubcategory(
                      cat._id,
                      sub._id,
                      sub.name
                    )
                  }
                  title="Remove subcategory"
                >
                  <FaTimes />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ))}
</div>

{/* SAVE BUTTON */}
<div className="ap-form-section ap-standalone-button-section">
  <button
    type="button"
    className="ap-save-category-button"
    onClick={handleSaveCategories}
  >
    <FaSave /> Save Category Structure
  </button>
</div>

          {/* Image Upload */}
          <div className="ap-form-section">
            <div className="ap-section-header">
              <h4>Images</h4>
              <button
                type="button"
                className="ap-canva-edit"
                onClick={() =>
                  window.open(
                    "https://www.canva.com",
                    "CanvaEditor",
                    "width=600,height=550,top=100,left=100"
                  )
                }
              >
                <FaPaintBrush /> Edit in Canva
              </button>
              <button
                type="button"
                className="ap-canva-edit"
                onClick={() =>
                  window.open(
                    "https://openai.com",
                    "CanvaEditor",
                    "width=600,height=550,top=100,left=100"
                  )
                }
              >
                <FaPaintBrush /> Edit in Sora
              </button>
            </div>
            <div className="ap-image-upload-area">
              <input
                className="ap-file-input"
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                onChange={handleFileChange}
              />
              <FaUpload className="ap-upload-icon" />
              <p className="ap-upload-text">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p className="ap-upload-hint">PNG, JPG, WEBP accepted</p>
            </div>
            {imagePreviews.length > 0 && (
              <div className="ap-image-preview-container">
                {imagePreviews.map((p, i) => (
                  <div key={i} className="ap-preview-item">
                    <img src={p} alt={`preview ${i + 1}`} loading="lazy" />
                    <button
                      type="button"
                      className="ap-remove-image-button"
                      onClick={() => handleRemoveFile(i)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="ap-form-section">
            <div className="ap-section-header">
              <h4>Description</h4>
              <button
                type="button"
                className="ap-ai-generate"
                onClick={handleAIGenerate}
              >
                <FaMagic /> Generate with AI
              </button>
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="Enter AI prompt..."
              className="ap-ai-prompt-input"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description will appear here..."
              rows={8}
            />
          </div>
          {/* Sizes Section */}
          <div className="ap-form-section">
            <h4>Sizes Available</h4>
            <div className="ap-sizes-selection">
              {availableSizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={`ap-size-tag ${selectedSizes.some((s) => s.size === size) ? "selected" : ""
                    }`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="ap-custom-size-input-group">
              <input
                type="text"
                placeholder="Add custom size"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSize()}
              />
              <button type="button" className="ap-add-button" onClick={addCustomSize}>
                Add
              </button>
            </div>

            {selectedSizes.length > 0 && (
              <div className="ap-size-table-container">
                <table className="ap-size-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Price</th>
                      <th>Discount (%)</th>
                      <th>GST (%)</th>
                      <th>Final Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSizes.map((s) => (
                      <tr key={s.size}>
                        <td>{s.size}</td>
                        <td>
                          <input
                            type="number"
                            value={s.price}
                            min="0"
                            placeholder="Price"
                            onChange={(e) =>
                              updateSizeField(s.size, "price", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={s.discount}
                            min="0"
                            max="100"
                            placeholder="Discount"
                            onChange={(e) =>
                              updateSizeField(s.size, "discount", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={s.gstPercent}
                            min="0"
                            max="100"
                            placeholder="GST"
                            onChange={(e) => updateSizeField(s.size, "gstPercent", e.target.value)}
                          />

                        </td>
                        <td>
                          <strong className="ap-final-price">
                            {s.finalPrice ? `₹${s.finalPrice}` : "-"}
                          </strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ap-remove-tag-button"
                            onClick={() => removeSize(s.size)}
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>


          {/* Stock & Reference */}
          <div className="ap-form-section">
            <h4>Stock & Reference</h4>
            <div className="ap-form-row">
              <div className="ap-form-group">
                <input
                  type="number"
                  value={stockUnits}
                  onChange={(e) => setStockUnits(e.target.value)}
                  placeholder="Stock Units"
                  min="0"
                />
              </div>
              <div className="ap-form-group">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
              {refNumber && (
                <p className="ap-ref-number">
                  <strong>{refNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="ap-modal-footer">
            <button
              type="button"
              className="ap-cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="ap-save-button">
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;