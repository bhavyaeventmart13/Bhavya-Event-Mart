// ===========================================
// routes/userUploadRoutes.js
// FINAL — SAFE + CLEAN + PRODUCTION READY
// ===========================================

import express from "express";
import multer from "multer";

import {
  authMiddleware,
  adminMiddleware as adminMiddleware,
} from "../middlewares/authMiddleware.js";

import {
  uploadUserImage,
  getAllUploadsAdmin,
  updateUploadStatus,
  deleteUpload,
} from "../controllers/userUploadController.js";

const router = express.Router();

// ======================================================
// MULTER CONFIG (STRICT SAFE)
// ======================================================
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP allowed"), false);
    }
    cb(null, true);
  },
});

// ======================================================
// ERROR HANDLER
// ======================================================
const handleUploadError = (err, req, res, next) => {
  console.error("❌ Upload Error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Max size is 3MB.",
    });
  }

  return res.status(400).json({
    message: err.message || "Upload failed",
  });
};

// ======================================================
// 🟢 USER: Upload Image
// POST /api/user-uploads
// ======================================================
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  uploadUserImage
);

// ======================================================
// 🛡️ ADMIN: Get All Uploads
// ======================================================
router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllUploadsAdmin
);

// ======================================================
// 🟡 ADMIN: Approve / Reject
// ======================================================
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateUploadStatus
);

// ======================================================
// 🔴 ADMIN: Delete Upload
// ======================================================
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteUpload
);

// ======================================================
// MULTER ERROR HANDLER (IMPORTANT)
// ======================================================
router.use(handleUploadError);

export default router;