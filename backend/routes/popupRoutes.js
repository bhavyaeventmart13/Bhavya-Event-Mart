// ===============================
// routes/popupRoutes.js
// ===============================
import express from "express";
import Popup from "../models/Popup.js";
import upload from "../middlewares/upload.js";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ===============================
// GOOGLE CLOUD STORAGE SETUP
// ===============================
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET);
// ===============================
// UPLOAD IMAGE TO GCS
// ===============================
const uploadImageToGCS = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      if (!file) return resolve("");

      const fileName = `${Date.now()}-${file.originalname}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      });

      blobStream.on("error", (err) => reject(err));
      blobStream.end(file.buffer);
    } catch (err) {
      reject(err);
    }
  });
};

// ===============================
// ADD POPUP (with optional image upload)
// ===============================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl || "";

    // If user uploaded a file, upload it to GCS
    if (req.file) {
      imageUrl = await uploadImageToGCS(req.file);
    }

    const popup = new Popup({
      title: req.body.title,
      description: req.body.description,
      imageUrl,
      link: req.body.link || "",
      isActive: true,
    });

    await popup.save();
    res.status(201).json({ message: "✅ Popup added successfully", popup });
  } catch (error) {
    console.error("❌ Error adding popup:", error);
    res.status(500).json({ message: "Error adding popup" });
  }
});

// ===============================
// GET ALL POPUPS (for admin view)
// ===============================
router.get("/", async (req, res) => {
  try {
    const popups = await Popup.find().sort({ _id: -1 }); // newest first
    res.status(200).json(popups);
  } catch (error) {
    console.error("❌ Error fetching popups:", error);
    res.status(500).json({ message: "Error fetching popups" });
  }
});

// ===============================
// GET ACTIVE POPUP (for homepage)
// ===============================
router.get("/active", async (req, res) => {
  try {
    const popup = await Popup.findOne({ isActive: true }).sort({ _id: -1 });
    res.status(200).json(popup || null);
  } catch (error) {
    console.error("❌ Error fetching active popup:", error);
    res.status(500).json({ message: "Error fetching active popup" });
  }
});

// ===============================
// DELETE POPUP BY ID
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const popup = await Popup.findById(req.params.id);
    if (!popup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    await Popup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "🗑️ Popup deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting popup:", error);
    res.status(500).json({ message: "Error deleting popup" });
  }
});

export default router;
