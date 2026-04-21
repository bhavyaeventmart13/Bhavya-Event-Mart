import express from "express";
import {
  getHomeContent,
  addBanner,
  addBestSeller,
  deleteBanner,
  addHomeCategory,
  deleteHomeCategory,
  addHomeVideo,
  deleteHomeVideo,
  resetHome,
  deleteBestSeller,
} from "../controllers/homeController.js";

import {
  protect,
   adminMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// -------------------------------------------
// 🏠 Public Route — Fetch Homepage Data
// -------------------------------------------
router.get("/", getHomeContent);

// -------------------------------------------
// 🔒 Admin Routes — Protected Actions
// -------------------------------------------

// ----------------------
// 🖼️ Banners
// ----------------------
router.post("/banner", protect, adminMiddleware, addBanner);
router.delete("/banner/:id", protect, adminMiddleware, deleteBanner);

// ----------------------
// ⭐ Best Sellers
// ----------------------
router.post("/bestseller", protect, adminMiddleware, addBestSeller);
router.delete("/bestseller/:id", protect, adminMiddleware, deleteBestSeller);

// ----------------------
// 🏷️ Home Categories
// ----------------------
router.post("/category", protect, adminMiddleware, addHomeCategory);
router.delete("/category/:id", protect, adminMiddleware, deleteHomeCategory);

// ----------------------
// 🎥 Home Videos (MULTIPLE)
// ----------------------
router.post("/video", protect, adminMiddleware, addHomeVideo);
router.delete("/video/:id", protect, adminMiddleware, deleteHomeVideo);

// ----------------------
// 🧹 Reset All Homepage Data
// ----------------------
router.delete("/reset", protect, adminMiddleware, resetHome);

export default router;
