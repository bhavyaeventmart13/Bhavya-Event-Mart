import express from "express";
const router = express.Router();

// Controllers
import {
  createQuickOrder,
  getQuickOrders,
  updateQuickOrder,
  deleteQuickOrder,
  addWorkImages,
} from "../controllers/quickOrderController.js";

// Middlewares
import { protect, adminMiddleware } from "../middlewares/authMiddleware.js";

/* ================= ROUTES ================= */

// Create Quick Order (Staff/Admin)
router.post("/", protect, createQuickOrder);

// Get All Quick Orders (Staff/Admin)
router.get("/", protect, getQuickOrders);

// Update Quick Order (Assign / Status / Edit)
router.put("/:id", protect, updateQuickOrder);

// Add Work Images (Staff/Admin)
router.post("/:id/images", protect, addWorkImages);

// Delete Quick Order (Admin only)
router.delete("/:id", protect, adminMiddleware, deleteQuickOrder);

export default router;