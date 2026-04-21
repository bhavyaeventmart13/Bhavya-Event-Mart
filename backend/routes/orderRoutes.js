import express from "express";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  verifyPayment,
  assignOrderToStaff,
  addOrderImages,
} from "../controllers/orderController.js";

import { protect, adminMiddleware } from "../middlewares/authMiddleware.js";

// ===============================
// Multer + GCS Upload
// ===============================
import multer from "multer";
import { uploadPaymentProofToGCS } from "../services/uploadService.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// ===============================
// 📤 Middleware: Upload payment proof to GCS
// ===============================
const processPaymentProofUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      req.paymentProofUrl = "";
      return next();
    }

    const url = await uploadPaymentProofToGCS(req.file);
    req.paymentProofUrl = url;

    next();
  } catch (error) {
    console.error("❌ Payment proof upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Payment proof upload failed",
    });
  }
};

// ==============================
// 🧾 USER ROUTES
// ==============================

router.post(
  "/",
  protect,
  upload.single("paymentProof"),
  processPaymentProofUpload,
  createOrder
);

router.get("/my", protect, getUserOrders);

// ==============================
// 🛡️ ADMIN ROUTES
// ==============================

router.get("/", protect, adminMiddleware, getAllOrders);

router.patch("/:id/status", protect, adminMiddleware, updateOrderStatus);

router.patch("/:id/verify", protect, adminMiddleware, verifyPayment);

// ==============================
// 🆕 EXTRA ROUTES
// ==============================

router.patch("/:id/assign", protect, adminMiddleware, assignOrderToStaff);

router.post("/:id/images", protect, addOrderImages);

export default router;