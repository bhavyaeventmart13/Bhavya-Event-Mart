// ============================================
// ❌ DEPRECATED FILE
// ============================================
// This file is no longer needed because
// adminMiddleware is now handled inside authMiddleware.js

// 👉 Keep this file ONLY to avoid breaking imports

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied: Admins only",
  });
};