// backend/routes/canvaRoutes.js
import express from "express";
import multer from "multer";
import { uploadImages, saveCanvaDesign } from "../services/uploadService.js";
import axios from "axios";

const router = express.Router();

// Multer setup for in-memory upload
const upload = multer({ storage: multer.memoryStorage() });

// ==========================
// 1️⃣ Canva OAuth Redirect
// ==========================
router.get("/oauth/redirect", async (req, res) => {
  const { code } = req.query; // Canva sends ?code=...
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const clientId = process.env.CANVA_CLIENT_ID;
    const clientSecret = process.env.CANVA_CLIENT_SECRET;
    const redirectUri = process.env.CANVA_REDIRECT_URI;

    const response = await axios.post(
      "https://api.canva.com/rest/v1/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(clientId + ":" + clientSecret).toString(
            "base64"
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = response.data;

    const frontendUrl = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/canva-success?token=${access_token}`);
  } catch (err) {
    console.error("❌ Canva OAuth Error:", err.message);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

// ==========================
// 2️⃣ Canva Return Navigation
// ==========================
router.get("/return-nav", (req, res) => {
  // Optional: Canva redirects here after editing
  // Close the popup or redirect to frontend page
  res.send("<script>window.close();</script>");
});

// ==========================
// 3️⃣ Upload Local File
// ==========================
router.post("/upload", upload.single("design"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No design file uploaded" });

    const uploadedUrls = await uploadImages([req.file]);
    if (!uploadedUrls || uploadedUrls.length === 0)
      return res.status(500).json({ message: "Failed to upload Canva design" });

    res.status(201).json({
      message: "✅ Canva design uploaded successfully",
      url: uploadedUrls[0],
    });
  } catch (err) {
    console.error("❌ Canva Upload Error:", err);
    res.status(500).json({
      message: "Server error uploading Canva design",
      error: err.message,
    });
  }
});

// ==========================
// 4️⃣ Save Canva Export URL
// ==========================
router.post("/upload-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "No URL provided" });

    const savedUrl = await saveCanvaDesign(url);
    res.status(201).json({ message: "Canva design URL saved", url: savedUrl });
  } catch (err) {
    console.error("❌ Canva URL Save Error:", err);
    res.status(500).json({ message: "Error saving Canva design URL", error: err.message });
  }
});

export default router;
