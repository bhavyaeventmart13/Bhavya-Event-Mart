import fs from "fs-extra";
import archiver from "archiver";
import axios from "axios";
import Product from "../models/Product.js";

const TEMP_DIR = "product_backup_temp";

// =======================================
// 🔹 SAFE IMAGE DOWNLOAD (WITH TIMEOUT)
// =======================================
const downloadImage = async (url, filepath) => {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      timeout: 10000, // ⏱ 10 sec timeout
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (err) {
    throw new Error(`Failed: ${url}`);
  }
};

// =======================================
// 🔹 SAFE WRAPPER (NO CRASH)
// =======================================
const safeDownload = async (url, filepath, failedImages) => {
  try {
    if (!url || !url.startsWith("http")) return;

    await downloadImage(url, filepath);
  } catch (err) {
    console.error("❌ Image failed:", url);

    failedImages.push({
      url,
      error: err.message,
    });
  }
};

// =======================================
// 🔹 BACKUP CONTROLLER
// =======================================
export const backupProducts = async (req, res) => {
  try {
    console.log("🚀 Backup started...");

    // 🔹 Clean & create temp folder
    await fs.remove(TEMP_DIR);
    await fs.mkdirp(`${TEMP_DIR}/images`);

    // 🔹 Fetch all products
    const products = await Product.find();

    // 🔹 Save JSON
    await fs.writeJson(`${TEMP_DIR}/products.json`, products);

    let imageCount = 1;
    const failedImages = [];

    // =======================================
    // 🔹 DOWNLOAD IMAGES (SAFE + PARALLEL)
    // =======================================
    for (const product of products) {

      // MAIN IMAGES
      if (product.imageUrls?.length) {

        const chunkSize = 5; // 🔥 parallel limit

        for (let i = 0; i < product.imageUrls.length; i += chunkSize) {
          const chunk = product.imageUrls.slice(i, i + chunkSize);

          await Promise.all(
            chunk.map((url) => {
              const filePath = `${TEMP_DIR}/images/img_${imageCount++}.jpg`;
              return safeDownload(url, filePath, failedImages);
            })
          );
        }
      }

      // COLOR IMAGES
      if (product.colors?.length) {
        for (const color of product.colors) {
          if (color.image) {
            const filePath = `${TEMP_DIR}/images/color_${imageCount++}.jpg`;
            await safeDownload(color.image, filePath, failedImages);
          }
        }
      }
    }

    console.log("✅ Image download completed");

    // =======================================
    // 🔹 SAVE FAILED IMAGES LOG
    // =======================================
    if (failedImages.length > 0) {
      await fs.writeJson(
        `${TEMP_DIR}/failed-images.json`,
        failedImages,
        { spaces: 2 }
      );
    }

    // =======================================
    // 🔹 CREATE ZIP
    // =======================================
    const zipPath = "product-backup.zip";

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(TEMP_DIR, false);

    archive.finalize();

    // =======================================
    // 🔹 SEND FILE
    // =======================================
    output.on("close", async () => {
      console.log("📦 ZIP ready");

      res.download(zipPath, "product-backup.zip", async () => {
        console.log("📤 Backup sent");

        await fs.remove(TEMP_DIR);
        await fs.remove(zipPath);
      });
    });

    archive.on("error", (err) => {
      throw err;
    });

  } catch (err) {
    console.error("❌ Backup error:", err);
    res.status(500).json({ message: "Product backup failed" });
  }
};