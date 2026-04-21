// ===============================
// scripts/migrateToCDN.js (FIXED)
// ===============================

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// 👉 IMPORTANT
const CDN_BASE = "https://cdn.pankajcloth.com";

// ===============================
// CONNECT DB
// ===============================
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
  }
};

// ===============================
// 🔥 FIXED CONVERSION LOGIC
// ===============================
const convertToCDN = (url) => {
  if (!url) return url;

  // ✅ Case 1: Already correct CDN → keep
  if (url.includes("cdn.pankajcloth.com/pankaj-clothing-storage")) {
    return url;
  }

  // ❌ Case 2: Wrong CDN (missing bucket) → FIX
  if (
    url.includes("cdn.pankajcloth.com") &&
    !url.includes("pankaj-clothing-storage")
  ) {
    const fileName = url.split("cdn.pankajcloth.com/")[1];
    return `${CDN_BASE}/pankaj-clothing-storage/${fileName}`;
  }

  // ❌ Case 3: Old GCS → convert
  if (url.includes("storage.googleapis.com")) {
    const parts = url.split("storage.googleapis.com/");
    return `${CDN_BASE}/${parts[1]}`;
  }

  // fallback
  return url;
};

// ===============================
// 🚀 MIGRATION
// ===============================
const migrate = async () => {
  try {
    const products = await Product.find({}, "imageUrls");

    console.log(`📦 Total Products: ${products.length}`);

    let updatedCount = 0;

    for (const product of products) {
      if (!product.imageUrls || product.imageUrls.length === 0) continue;

      const newUrls = product.imageUrls.map(convertToCDN);

      const isChanged =
        JSON.stringify(newUrls) !== JSON.stringify(product.imageUrls);

      if (!isChanged) continue;

      await Product.updateOne(
        { _id: product._id },
        { $set: { imageUrls: newUrls } }
      );

      updatedCount++;

      if (updatedCount % 50 === 0) {
        console.log(`🔄 Updated: ${updatedCount}`);
      }
    }

    console.log("✅ Migration Complete");
    console.log(`🎯 Total Updated: ${updatedCount}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Error:", err);
    process.exit(1);
  }
};

// ===============================
const run = async () => {
  await connectDB();
  await migrate();
};

run();