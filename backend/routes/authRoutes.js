import express from "express";
import {
  register,
  login,
  profile,
  forgot,
  verifyOtp,
  resetPassword,
} from "../controllers/authController.js";

import { protect, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =========================================
// PUBLIC ROUTES
// =========================================

router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgot);
router.post("/verify-otp", verifyOtp);
router.post("/reset", resetPassword);

// =========================================
// PROTECTED ROUTES
// =========================================

router.get("/profile", protect, profile);

router.get("/verify-admin", protect, adminMiddleware, (req, res) => {
  res.json({ success: true, message: "Admin verified successfully" });
});

export default router;