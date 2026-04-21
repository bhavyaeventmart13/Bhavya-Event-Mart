import mongoose from "mongoose";

/* ================= ITEM SCHEMA ================= */
const itemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/* ================= MAIN SCHEMA ================= */
const quickOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
    },

    items: {
      type: [itemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    // ✅ FIXED: proper user reference
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✅ NEW: staff assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✅ FIXED: correct status flow
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },

    // ✅ NEW: image support
    workImages: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

/* ================= INDEX ================= */
quickOrderSchema.index({ createdAt: -1 });

/* ================= AUTO ORDER NUMBER ================= */
quickOrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = "QO-" + Date.now();
  }
  next();
});

export default mongoose.model("QuickOrder", quickOrderSchema);