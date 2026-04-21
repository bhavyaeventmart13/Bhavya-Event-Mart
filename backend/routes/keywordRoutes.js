import express from "express";
import {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword
} from "../controllers/keywordController.js";

import { protect,  adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==============================
// Get All Keywords
// ==============================
router.get(
  "/",
  protect,
  adminMiddleware,
  getKeywords
);

// ==============================
// Create Keyword
// ==============================
router.post(
  "/",
  protect,
  adminMiddleware,
  createKeyword
);

// ==============================
// Update Keyword
// ==============================
router.put(
  "/:id",
  protect,
  adminMiddleware,
  updateKeyword
);

// ==============================
// Delete Keyword
// ==============================
router.delete(
  "/:id",
  protect,
  adminMiddleware,
  deleteKeyword
);

export default router;