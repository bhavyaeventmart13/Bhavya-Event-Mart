import mongoose from "mongoose";

/* ============================================================
   🖼️ Banner Schema
============================================================ */
const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: "" },
  order: { type: Number, default: 1 },
});

/* ============================================================
   ⭐ Best Seller Schema
============================================================ */
const bestSellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, default: 0 },
});

/* ============================================================
   🏷️ Home Category Schema
============================================================ */
const homeCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  link: { type: String, default: "" },
});

/* ============================================================
   🎥 Home Video Schema (MULTIPLE + THUMBNAIL)
============================================================ */
const homeVideoSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true, // Google Cloud video URL
  },
  thumbnailUrl: {
    type: String,
    required: true, // Google Cloud thumbnail image URL
  },
});

/* ============================================================
   🏠 Home Content Schema
============================================================ */
const homeContentSchema = new mongoose.Schema(
  {
    banners: {
      type: [bannerSchema],
      default: [],
    },

    bestSellers: {
      type: [bestSellerSchema],
      default: [],
    },

    homeCategories: {
      type: [homeCategorySchema],
      default: [],
    },

    // ✅ MULTIPLE VIDEOS (Reels / Admin Preview)
    homeVideos: {
      type: [homeVideoSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomeContent", homeContentSchema);
