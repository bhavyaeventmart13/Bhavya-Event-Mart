// =============================
// routes/productRoutes.js
// FINAL — ADMIN + FRONTEND SAFE (COLOR ENABLED)
// =============================

import express from "express";
import multer from "multer";
import { csvExportController } from "../controllers/productController.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

import Product from "../models/Product.js";
import Category from "../models/Category.js";

import { uploadImages, deleteImages } from "../services/uploadService.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { backupProducts } from "../controllers/productBackupController.js";

// ✅ CONTROLLER IMPORTS
import {
  bulkUploadProducts,
  getProducts,
  getAllProductsAdmin,
  getProductById,
  csvBulkEditController,
} from "../controllers/productController.js";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const csvUpload = multer({ storage: multer.memoryStorage() });

// ======================================================
// 🔍 SEARCH PRODUCTS (Navbar)
// ======================================================
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q) return res.json({ products: [] });

    const found = await Product.find(
      { name: { $regex: q, $options: "i" } },
      { name: 1, imageUrls: 1 }
    )
      .limit(8)
      .lean();

    const formatted = found.map((p) => ({
      _id: p._id,
      name: p.name,
      image: p.imageUrls?.[0] || "/noimage.png",
    }));

    res.json({ products: formatted });
  } catch (error) {
    console.error("❌ Product search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
});

// ======================================================
// 🔍 SEARCH CATEGORIES + SUBCATEGORIES
// ======================================================
router.get("/search/categories", async (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q) return res.json({ categories: [], subcategories: [] });

    const cats = await Category.find({
      name: { $regex: q, $options: "i" },
    }).lean();

    const categories = cats.map((c) => ({ name: c.name }));

    const subcategories = [];
    cats.forEach((cat) => {
      (cat.subcategories || []).forEach((sub) => {
        if (sub?.toLowerCase().includes(q)) {
          subcategories.push({
            category: cat.name,
            name: sub,
          });
        }
      });
    });

    res.json({ categories, subcategories });
  } catch (err) {
    console.error("❌ Category search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

// ======================================================
// ➕ ADD PRODUCT (ADMIN) — COLOR SAFE
// ======================================================
router.post(
  "/add",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "colorImages", maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const {
        productName,
        categories,
        stockUnits,
        description,
        selectedSizes,
        status,
        refNumber,
        colors,
      } = req.body;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Upload main images
      const imageUrls =
        req.files?.images?.length > 0
          ? await uploadImages(req.files.images, false)
          : [];

      // Parse categories
      let parsedCategories = [];
      try {
        parsedCategories = JSON.parse(categories || "[]");
      } catch {}

      // Parse sizes
      let sizesArray = [];
      try {
        sizesArray = JSON.parse(selectedSizes || "[]");
      } catch {}

      // Parse + attach color images
      let parsedColors = [];
      if (colors) {
        try {
          const temp = JSON.parse(colors);

          if (req.files?.colorImages?.length) {
            const uploaded = await uploadImages(
              req.files.colorImages,
              false
            );

            parsedColors = temp.map((c, i) => ({
              ...c,
              image: uploaded[i],
            }));
          } else {
            parsedColors = temp;
          }
        } catch {}
      }

      const product = await Product.create({
        name: productName.trim(),
        categories: parsedCategories,
        stockUnits: Number(stockUnits) || 0,
        description: description || "",
        sizes: sizesArray,
        imageUrls,
        colors: parsedColors,
        refNumber: refNumber || "",
        status: status || "Available",
      });

      res.status(201).json({
        message: "✅ Product added successfully",
        product,
      });
    } catch (error) {
      console.error("❌ Add Product Error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ======================================================
// 📦 BULK UPLOAD PRODUCTS (ADMIN)
// ======================================================
router.post(
  "/bulk-upload",
  authMiddleware,
  adminMiddleware,
  bulkUploadProducts
);
// ======================================================
// 📄 CSV BULK EDIT (ADMIN — EXISTING PRODUCTS ONLY)
// ======================================================
router.post(
  "/csv-bulk-edit",
  authMiddleware,
  adminMiddleware,
  csvUpload.single("file"),
  csvBulkEditController
);


// ======================================================
// 🛡️ ADMIN — GET ALL PRODUCTS
// ======================================================
router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllProductsAdmin
);



// ======================================================
// 🌐 FRONTEND — GET PRODUCTS BY CATEGORY
// ======================================================
router.get("/", getProducts);

// ======================================================
// ❌ DELETE PRODUCT (ADMIN)
// ======================================================
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      if (product.imageUrls?.length) {
        await deleteImages(product.imageUrls).catch(() => {});
      }

      await product.deleteOne();
      res.json({ message: "✅ Product deleted successfully" });
    } catch (error) {
      console.error("❌ Delete Product Error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ======================================================
// ✏️ UPDATE PRODUCT (ADMIN) — COLOR SAFE
// ======================================================
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "colorImages", maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      if (req.body.productName)
        product.name = req.body.productName.trim();

      if (req.body.categories) {
        try {
          product.categories = JSON.parse(req.body.categories);
        } catch {}
      }

      if (req.body.stockUnits !== undefined)
        product.stockUnits = Number(req.body.stockUnits);

      if (req.body.description)
        product.description = req.body.description;

      if (req.body.status) product.status = req.body.status;
      if (req.body.refNumber) product.refNumber = req.body.refNumber;

      if (req.body.selectedSizes) {
        try {
          product.sizes = JSON.parse(req.body.selectedSizes);
        } catch {}
      }

      // Update gallery images
   // ===============================
// IMAGE UPDATE LOGIC (FINAL FIX)
// ===============================

let existingImages = [];

try {
  existingImages = req.body.existingImages
    ? JSON.parse(req.body.existingImages)
    : product.imageUrls || [];
} catch {
  existingImages = product.imageUrls || [];
}

// 🔥 Upload new images
let newImageUrls = [];

if (req.files?.images?.length) {
  newImageUrls = await uploadImages(req.files.images, false);
}

// 🔥 Find deleted images
const deletedImages = (product.imageUrls || []).filter(
  (img) => !existingImages.includes(img)
);

// 🔥 Delete only removed images
if (deletedImages.length > 0) {
  await deleteImages(deletedImages).catch(() => {});
}

// 🔥 Final merge
product.imageUrls = [...existingImages, ...newImageUrls];
      // Update colors
      if (req.body.colors) {
        try {
          const temp = JSON.parse(req.body.colors);

          if (req.files?.colorImages?.length) {
            const uploaded = await uploadImages(
              req.files.colorImages,
              false
            );

            product.colors = temp.map((c, i) => ({
              ...c,
              image: uploaded[i],
            }));
          } else {
            product.colors = temp;
          }
        } catch {}
      }

      await product.save();
      res.json({ message: "✅ Product updated successfully", product });
    } catch (error) {
      console.error("❌ Update Product Error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);
// ======================================================
// 📤 CSV EXPORT (ADMIN)
// ======================================================
router.get(
  "/csv-export",
  authMiddleware,
  adminMiddleware,
  csvExportController
);

router.get("/:id", getProductById);

// ======================================================
// 📦 PRODUCT BACKUP (ADMIN)
// ======================================================
router.get(
  "/backup",
  authMiddleware,
  adminMiddleware,
  backupProducts
);

export default router;

