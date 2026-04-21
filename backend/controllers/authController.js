import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendOTP, verifyOTPCode } from "../services/otpService.js";

// ==============================
// TOKEN GENERATOR (ROLE BASED)
// ==============================
const tokenFor = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "10d" }
  );

// ==============================
// REGISTER
// ==============================
export const register = async (req, res) => {
  try {
    const { name, phone, email, address, password, role } = req.body;

    if ((!phone && !email) || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const query = [];
    if (phone) query.push({ phone });
    if (email) query.push({ email });

    const exists = query.length ? await User.findOne({ $or: query }) : null;
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      phone,
      email,
      address,
      password,
      role: role || "customer",
    });

    return res.status(201).json({
      message: "User registered successfully",
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: tokenFor(user),
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// LOGIN
// ==============================
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const isEmail = identifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    ).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      role: user.role,
      token: tokenFor(user),
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// PROFILE
// ==============================
export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name phone email address role"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("Profile Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// FORGOT PASSWORD
// ==============================
export const forgot = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    await sendOTP(phone);

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Forgot Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// VERIFY OTP
// ==============================
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const ok = await verifyOTPCode(phone, otp);
    if (!ok) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// RESET PASSWORD
// ==============================
export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const ok = await verifyOTPCode(phone, otp);
    if (!ok) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};