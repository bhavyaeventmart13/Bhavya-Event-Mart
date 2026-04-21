import mongoose from "mongoose";

// ==========================
// Size Schema (UNCHANGED)
// ==========================
const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: [true, "Size label is required"],
    trim: true,
  },
  originalPrice: {
    type: Number,
    required: [true, "Original price is required"],
    min: [0, "Price cannot be negative"],
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: [0, "Discount cannot be less than 0%"],
    max: [100, "Discount cannot exceed 100%"],
  },
  gstPercent: {
    type: Number,
    default: 0,
    min: [0, "GST cannot be less than 0%"],
    max: [100, "GST cannot exceed 100%"],
  },
  discountedPrice: {
    type: Number,
    required: [true, "Discounted price is required"],
    min: [0, "Discounted price cannot be negative"],
  },
});

// ==========================
// Product Schema (STRUCTURE UNCHANGED)
// ==========================
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    categories: [
      {
        name: {
          type: String,
          required: [true, "Category name is required"],
          trim: true,
        },
        subcategories: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],

    stockUnits: {
      type: Number,
      default: 0,
      min: [0, "Stock units cannot be negative"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    sizes: {
      type: [sizeSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one size must be provided.",
      },
    },

  status: {
  type: String,
  enum: ["Available", "Unavailable", "Low stock"],
  default: "Available",
},

    refNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
        // ==========================
    // 🎨 Color / Shade Variants (OPTIONAL)
    // ==========================
    colors: [
      {
        name: {
          type: String,
          trim: true,
          required: true, // e.g. "Yellow", "Baby Pink"
        },
        hex: {
          type: String,   // e.g. "#FFD700"
          trim: true,
        },
        image: {
          type: String,   // exactly ONE image per color
          required: true,
        },
      },
    ],


    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) && arr.every((url) => typeof url === "string"),
        message: "Invalid image URL format.",
      },
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// 🔥 OPTIMIZED INDEXES (NO LOGIC CHANGE)
// ==========================

// Fast category-only queries
productSchema.index({ "categories.name": 1 });

// Fast category + subcategory queries
productSchema.index({
  "categories.name": 1,
  "categories.subcategories": 1,
});

// Fast sorting by newest
productSchema.index({ createdAt: -1 });

// Text search (already correct)
productSchema.index({ name: "text", description: "text" });

// ==========================
// Export Model
// ==========================
export default mongoose.model("Product", productSchema);
