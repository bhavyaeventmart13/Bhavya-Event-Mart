// ===========================================
// backend/models/Order.js (FINAL FIXED)
// ===========================================

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userInfoSnapshot: {
      name: String,
      phone: String,
       email: String,
      address: String,
    },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productCode: String,
        name: String,
        size: String,
        quantity: Number,
        price: Number,
        image: String, // ✅ ADD THIS
      },
    ],

    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String, required: true },

    paymentMethod: {
      type: String,
      enum: ["QR", "COD", "Online"],
      default: "QR",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    // ✅ FIXED: consistent lowercase status (match system)
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // (kept as-is, optional field)
    orderType: {
      type: String,
      enum: ["normal"],
      default: "normal",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    workImages: [
      {
        type: String,
      },
    ],

    paymentProof: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);