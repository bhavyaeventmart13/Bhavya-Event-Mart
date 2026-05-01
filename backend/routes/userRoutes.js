import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

import {
  protect,
  adminMiddleware,
} from "../middlewares/authMiddleware.js";

import {
  getAllUsers,
  getUserProfile,
  deleteMyAccount,
} from "../controllers/userController.js";

const router = express.Router();

// ===========================================
// Helper: JWT Token Generator
// ===========================================
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "10d" });

/* ======================================================
   🟢 ADMIN: CREATE USER (FINAL FIXED)
====================================================== */
router.post("/register", protect, adminMiddleware, async (req, res) => {
  try {
    let { name, phone, email, password, address, role } = req.body;

    // ✅ FORCE ROLE CONTROL (SECURITY FIX)
    const finalRole = role === "staff" ? "staff" : "customer";

    // ✅ CLEAN EMPTY VALUES
    phone = phone?.trim() || undefined;
    email = email?.trim() || undefined;

    // 🔴 VALIDATION
    if (!name || (!phone && !email) || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔴 CHECK EXISTING USER
    const exists = await User.findOne({
      $or: [{ phone }, { email }],
    });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ CREATE USER (CRITICAL FIX: createdBy)
    const user = await User.create({
      name,
      phone,
      email,
      password,
      address,
      role: finalRole,
      createdBy: finalRole === "staff" ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Register Error:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});

/* ======================================================
   🟢 LOGIN USER
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid phone/email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid phone/email or password",
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
// ======================================================
// 🟢 PUBLIC REGISTER (APP / WEBSITE USERS)
// ======================================================
router.post("/register-public", async (req, res) => {
  try {
    let { name, phone, email, password, address } = req.body;

    // Clean values
    phone = phone?.trim() || undefined;
    email = email?.trim() || undefined;

    // Validation
    if (!name || (!phone && !email) || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check existing
    const exists = await User.findOne({
      $or: [{ phone }, { email }],
    });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (always customer)
    const user = await User.create({
      name,
      phone,
      email,
      password,
      address,
      role: "customer",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  } catch (err) {
    console.error("❌ Public Register Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});

/* ======================================================
   🟢 GET PROFILE
====================================================== */
router.get("/profile", protect, getUserProfile);

/* ======================================================
   🔴 DELETE OWN ACCOUNT
====================================================== */
router.delete("/me", protect, deleteMyAccount);

/* ======================================================
   🟡 ADMIN: GET ALL STAFF USERS
====================================================== */
router.get("/all", protect, adminMiddleware, getAllUsers);

export default router;