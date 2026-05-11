// ===============================
// services/uploadService.js
// OPTIMIZED – SAFE – CDN ENABLED
// ===============================
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

// ===============================
// Initialize Google Cloud Storage
// ===============================
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET);

// ✅ CDN BASE (NEW)
const CDN_BASE = `https://storage.googleapis.com/${process.env.GCLOUD_BUCKET}`;

// ===============================
// 🔥 COMPRESS IMAGE (NO LOGIC CHANGE)
// ===============================
const compressImage = async (file) => {
  try {
    const buffer = await sharp(file.buffer)
      .resize({ width: 1200 })
      .jpeg({ quality: 70 })
      .toBuffer();

    return {
      ...file,
      buffer,
      mimetype: "image/jpeg",
    };
  } catch (err) {
    console.warn("⚠️ Compression skipped:", err.message);
    return file;
  }
};

// ===============================
// 🖼️ GENERATE THUMBNAIL (SAFE)
// ===============================
const generateThumbnail = async (file) => {
  try {
    const buffer = await sharp(file.buffer)
      .resize({ width: 300 })
      .jpeg({ quality: 60 })
      .toBuffer();

    return {
      ...file,
      buffer,
      mimetype: "image/jpeg",
    };
  } catch (err) {
    console.warn("⚠️ Thumbnail skipped:", err.message);
    return null;
  }
};

// ===============================
// INTERNAL: Write buffer to GCS
// ===============================
const writeToGCS = (blob, file) =>
  new Promise((resolve, reject) => {
    const stream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end(file.buffer);
  });

// ===============================
// Upload Single Image (CDN ENABLED)
// ===============================
export const uploadImage = async (file) => {
  if (!file) throw new Error("No file provided for upload");

  try {
    const compressedFile = await compressImage(file);
    const thumbnailFile = await generateThumbnail(compressedFile);

    const baseName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const originalFileName = `products/original/${baseName}.jpg`;
    const thumbnailFileName = `products/thumb/${baseName}.jpg`;

    const originalBlob = bucket.file(originalFileName);
    const thumbnailBlob = bucket.file(thumbnailFileName);

    await writeToGCS(originalBlob, compressedFile);

    if (thumbnailFile) {
      await writeToGCS(thumbnailBlob, thumbnailFile);
    }

    // ✅ CDN URLs
    const originalUrl = `${CDN_BASE}/${originalFileName}`;
    const thumbnailUrl = thumbnailFile
      ? `${CDN_BASE}/${thumbnailFileName}`
      : null;

    return {
      url: originalUrl,
      thumbnailUrl,
    };
  } catch (error) {
    console.error("❌ Upload error:", error);
    throw new Error("Failed to upload image to GCS");
  }
};

// ===============================
// Upload Multiple Images (UNCHANGED)
// ===============================
export const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];

  const results = [];

  for (const file of files) {
    const result = await uploadImage(file);
    results.push(result);
  }

  return results;
};

// ===============================
// Save Canva Design (UNCHANGED)
// ===============================
export const saveCanvaDesign = async (designUrl) => {
  if (!designUrl) throw new Error("No Canva design URL provided");
  return designUrl;
};

// ===============================
// INTERNAL: Parse GCS Key
// ===============================
function parseGcsKeyFromUrl(urlOrKey, fallbackBucket) {
  if (!urlOrKey) return null;

  if (!urlOrKey.includes("://")) {
    return { bucket: fallbackBucket, key: urlOrKey.replace(/^\/+/, "") };
  }

  if (urlOrKey.startsWith("gs://")) {
    const [bucket, ...rest] = urlOrKey.replace("gs://", "").split("/");
    return { bucket, key: rest.join("/") };
  }

  try {
    const u = new URL(urlOrKey);
    const [bucket, ...rest] = u.pathname.replace(/^\/+/, "").split("/");
    return { bucket, key: rest.join("/") };
  } catch {
    return null;
  }
}

// ===============================
// Delete Single Image (UNCHANGED)
// ===============================
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const parsed = parseGcsKeyFromUrl(imageUrl, bucket.name);
    if (!parsed?.key) return;

    await storage
      .bucket(parsed.bucket)
      .file(parsed.key)
      .delete({ ignoreNotFound: true });

    const thumbKey = parsed.key.replace(
      "products/original/",
      "products/thumb/"
    );

    await storage
      .bucket(parsed.bucket)
      .file(thumbKey)
      .delete({ ignoreNotFound: true });
  } catch (error) {
    console.warn("⚠️ Image delete skipped:", error?.message);
  }
};

// ===============================
// Delete Multiple Images (UNCHANGED)
// ===============================
export const deleteImages = async (imageUrls) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

  await Promise.allSettled(imageUrls.map(deleteImage));
};

// ===============================
// Upload Offer Popup Image (CDN ENABLED)
// ===============================
export const uploadOfferImage = async (file) => {
  if (!file) throw new Error("No offer image provided");

  const compressedFile = await compressImage(file);

  const fileName = `offer-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.jpg`;

  const blob = bucket.file(fileName);

  await writeToGCS(blob, compressedFile);

  return `${CDN_BASE}/${fileName}`;
};

// ===============================
// Upload Payment Proof (CDN ENABLED)
// ===============================
export const uploadPaymentProofToGCS = async (file) => {
  if (!file) throw new Error("No payment proof provided");

  const ext = file.originalname.split(".").pop();

  const fileName = `paymentProofs/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const blob = bucket.file(fileName);

  await writeToGCS(blob, file);

  return `${CDN_BASE}/${fileName}`;
};