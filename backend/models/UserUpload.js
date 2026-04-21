// ===========================================
// models/UserUpload.js
// FINAL — SAFE + OPTIMIZED + PRODUCTION READY
// ===========================================

import mongoose from "mongoose";

const userUploadSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    uploadedBy: {
      type: String,
      default: "Anonymous",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      lowercase: true,
      trim: true,
    },

    reviewedBy: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 INDEX FOR PERFORMANCE
userUploadSchema.index({ createdAt: -1 });

const UserUpload = mongoose.model("UserUpload", userUploadSchema);

export default UserUpload;