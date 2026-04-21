// ===========================================
// routes/uploadRoutes.js (Final Optimized)
// ===========================================
import express from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  uploadImages,
  uploadPaymentProofToGCS,
} from "../services/uploadService.js";

const router = express.Router();

// =====================================================
// ✅ MULTER CONFIG (OPTIMIZED + SAFE)
// =====================================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 🔥 3MB per file
    files: 20, // 🔥 allow up to 20 files (your requirement)
  },
  fileFilter: (req, file, cb) => {
    // ✅ Only allow images for /images route
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// =====================================================
// 🔧 COMMON ERROR HANDLER
// =====================================================
const handleUploadError = (res, err) => {
  console.error("❌ Upload Error:", err);

  // Multer specific errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Max size is 3MB.",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      message: "Too many files. Max allowed is 20.",
    });
  }

  return res.status(400).json({
    message: err.message || "Upload failed",
  });
};

// =====================================================
// ✅ Upload Multiple Images (Bulk Upload & Products)
// =====================================================
router.post("/images", authMiddleware, (req, res) => {
  upload.array("images", 20)(req, res, async (err) => {
    try {
      // 🔥 Handle multer errors safely
      if (err) return handleUploadError(res, err);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No images provided" });
      }

      // 🔥 Upload images to GCS (optimized service)
      const urls = await uploadImages(req.files);

      res.status(200).json({ urls });
    } catch (error) {
      console.error("❌ Image upload error:", error);
      res.status(500).json({
        message: error.message || "Failed to upload images",
      });
    }
  });
});

// =====================================================
// ✅ Upload Payment Proof (SAFE)
// =====================================================
router.post("/payment-proof", authMiddleware, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    try {
      if (err) return handleUploadError(res, err);

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const url = await uploadPaymentProofToGCS(req.file);

      res.status(200).json({
        success: true,
        url,
      });
    } catch (error) {
      console.error("❌ Payment proof upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Upload failed",
      });
    }
  });
});

// =====================================================
// ⭐ Simple Single File Upload (SAFE)
// =====================================================
router.post("/", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    try {
      if (err) return handleUploadError(res, err);

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const url = await uploadPaymentProofToGCS(req.file);

      res.status(200).json({ url });
    } catch (error) {
      console.error("❌ Simple Upload Error:", error);
      res.status(500).json({
        message: "Upload failed",
        error: error.message,
      });
    }
  });
});

export default router;
