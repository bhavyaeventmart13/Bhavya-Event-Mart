// ===========================================
// backend/models/Task.js (FINAL FIXED)
// ===========================================

import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    deadline: {
      type: Date,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ FIXED: consistent lowercase status (match system)
    status: {
      type: String,
      enum: ["pending", "started", "completed"],
      default: "pending",
    },

    pendingReason: {
      type: String,
      default: "",
    },

    // ✅ TASK TYPE (important for logic/UI)
    taskType: {
      type: String,
      enum: ["general", "order", "quick_order"],
      default: "general",
    },

    // ✅ LINK TASK WITH ORDER / QUICK ORDER
    linkedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "orderModel",
      default: null,
    },

    orderModel: {
      type: String,
      enum: ["Order", "QuickOrder"],
      default: null,
    },

    // ✅ IMAGE PROOF SUPPORT
    workImages: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);