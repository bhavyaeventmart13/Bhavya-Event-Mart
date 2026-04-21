import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ============================================
// 🔒 AUTH MIDDLEWARE
// ============================================
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id name phone email role"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// ============================================
// 🛡️ ADMIN MIDDLEWARE (SINGLE SOURCE OF TRUTH)
// ============================================
export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied: Admins only",
  });
};

// ============================================
// ⚙️ BACKWARD COMPATIBILITY
// ============================================
export { protect as authMiddleware };