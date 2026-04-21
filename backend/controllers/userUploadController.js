// ===========================================
// controllers/userUploadController.js
// FINAL — SAFE + VALIDATED + PRODUCTION READY
// ===========================================

import mongoose from "mongoose";
import UserUpload from "../models/UserUpload.js";
import { uploadImage, deleteImage } from "../services/uploadService.js";

// ======================================================
// 🟢 USER: UPLOAD IMAGE
// POST /api/user-uploads
// ======================================================
export const uploadUserImage = async (req, res) => {
  try {
    // ================= VALIDATIONS =================

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    // 🔥 STRICT FILE TYPE CHECK (SAFE)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Only JPG, PNG, WEBP allowed" });
    }

    // 🔥 SIZE CHECK (DOUBLE SAFETY)
    if (req.file.size > 3 * 1024 * 1024) {
      return res.status(400).json({ message: "File too large (max 3MB)" });
    }

    // ================= UPLOAD =================

    const imageUrl = await uploadImage(req.file);

    // ================= SAVE =================

    const upload = await UserUpload.create({
      imageUrl,
      uploadedBy: req.user.name || "Anonymous",
      phone: req.user.phone || "",
      note: req.body.note || "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      upload,
    });
  } catch (err) {
    console.error("❌ User Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

// ======================================================
// 🛡️ ADMIN: GET ALL UPLOADS (PAGINATED SAFE)
// GET /api/user-uploads/admin
// ======================================================
export const getAllUploadsAdmin = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 50; // SAFE LIMIT
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      UserUpload.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserUpload.countDocuments(),
    ]);

    res.json({
      success: true,
      uploads,
      total,
      page,
    });
  } catch (err) {
    console.error("❌ Fetch Uploads Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch uploads",
    });
  }
};

// ======================================================
// 🟢 ADMIN: UPDATE STATUS (APPROVE / REJECT)
// PATCH /api/user-uploads/:id/status
// ======================================================
export const updateUploadStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 SAFE OBJECT ID CHECK
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    let { status } = req.body;

    status = status?.toLowerCase();

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const upload = await UserUpload.findById(id);

    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    upload.status = status;
    upload.reviewedBy = req.user?.name || "Admin";
    upload.reviewedAt = new Date();

    await upload.save();

    res.json({
      success: true,
      message: `Upload ${status}`,
      upload,
    });
  } catch (err) {
    console.error("❌ Status Update Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

// ======================================================
// 🔴 ADMIN: DELETE UPLOAD (REMOVE IMAGE + DB)
// DELETE /api/user-uploads/:id
// ======================================================
export const deleteUpload = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 SAFE OBJECT ID CHECK
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const upload = await UserUpload.findById(id);

    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    // 🔥 DELETE IMAGE FROM GCS (SAFE FAIL)
    if (upload.imageUrl) {
      await deleteImage(upload.imageUrl).catch((err) => {
        console.error("⚠️ GCS Delete Failed:", err.message);
      });
    }

    await upload.deleteOne();

    res.json({
      success: true,
      message: "Upload deleted",
    });
  } catch (err) {
    console.error("❌ Delete Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};