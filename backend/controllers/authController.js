import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOTP, verifyOTPCode } from "../services/otpService.js";

// ==============================
// TOKEN GENERATOR
// ==============================
const tokenFor = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "10d" }
  );

// ==============================
// REGISTER (FINAL FIXED)
// ==============================
export const register = async (req, res) => {
  try {
    const { name, phone, email, address, password } = req.body;

    // ✅ Basic validation
    if (!name || (!phone && !email) || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ SAFE QUERY (FIXED)
    const query = [];
    if (phone) query.push({ phone });
    if (email) query.push({ email });

    const exists = await User.findOne({ $or: query });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ CREATE USER (FORCE CUSTOMER)
    const user = await User.create({
      name,
      phone,
      email,
      address,
      password,
      role: "customer",
      createdBy: null,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: tokenFor(user),
    });
  } catch (err) {
    console.error("❌ Register Error:", err);

    // ✅ RETURN REAL ERROR (IMPORTANT)
    return res.status(400).json({
      message: err.message || "Registration failed",
    });
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

    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }
    ).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await user.matchPassword(password);

    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      success: true,
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      role: user.role,
      token: tokenFor(user),
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("❌ Profile Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// FORGOT PASSWORD
// ==============================
export const forgot = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || identifier.trim() === "") {
      return res.status(400).json({ message: "Identifier required" });
    }

    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendOTP(cleanIdentifier);

    return res.json({
      success: true,
      message: "OTP sent",
    });
  } catch (err) {
    console.error("❌ Forgot Error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ==============================
// VERIFY OTP
// ==============================
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Missing data" });
    }

    const ok = await verifyOTPCode(identifier.trim(), otp.trim());

    if (!ok) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({
      success: true,
      message: "OTP verified",
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// RESET PASSWORD
// ==============================
export const resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing data" });
    }

    const cleanIdentifier = identifier.trim();

    const ok = await verifyOTPCode(cleanIdentifier, otp.trim());

    if (!ok) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const isEmail = cleanIdentifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};