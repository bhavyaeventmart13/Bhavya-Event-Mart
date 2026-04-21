import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,

    platform: {
      type: String,
      enum: ["whatsapp", "instagram", "facebook", "email", "web"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "closed"],
      default: "pending",
    },

    priority: {
      type: String,
      enum: ["normal", "high"],
      default: "normal",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    tags: [String],

    lastMessageAt: Date,

    // ======================================
    // STEP 7 — Lead Intelligence Fields
    // ======================================

    intent: {
      type: String,
      enum: [
        "product_enquiry",
        "catalogue_request",
        "price_check",
        "bulk_order",
        "location_query",
        "general",
      ],
      default: "general",
    },

    leadScore: {
      type: Number,
      default: 0,
    },

    // ======================================
    // 🔥 NEW — CHATBOT INTELLIGENCE FIELDS
    // ======================================

    interestedProduct: {
      type: String,
      default: null,
    },

    preferences: {
      type: mongoose.Schema.Types.Mixed, // flexible (type, color, pattern)
      default: {},
    },

    detailsCollected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ======================================
// Indexes
// ======================================

leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ platform: 1 });

export default mongoose.model("Lead", leadSchema);