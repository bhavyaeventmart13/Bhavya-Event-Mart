import mongoose from "mongoose";

const autoResponseSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    replyText: {
      type: String,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    // TYPE (simple or product)
    type: {
      type: String,
      enum: ["simple", "product"],
      default: "simple",
    },

    // PRODUCT LINK
    link: {
      type: String,
      default: null,
    },

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

    scoreBoost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ FIX: Normal index
autoResponseSchema.index({ keyword: 1 });

// ✅ FIX: Text index for faster search
autoResponseSchema.index({ keyword: "text" });

export default mongoose.model("AutoResponse", autoResponseSchema);