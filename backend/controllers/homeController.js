import HomeContent from "../models/HomeContent.js";
import { deleteImage } from "../services/uploadService.js";

/* ============================================================
   ✅ GET HOMEPAGE DATA
   Returns: banners, bestSellers, homeCategories, homeVideos
============================================================ */
export const getHomeContent = async (req, res) => {
  try {
    const content =
      (await HomeContent.findOne()) || {
        banners: [],
        bestSellers: [],
        homeCategories: [],
        homeVideos: [],
      };

    // Sort banners by display order
    if (content.banners?.length > 0) {
      content.banners.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: "Failed to load homepage data" });
  }
};

/* ============================================================
   🛠️ ADD NEW BANNER
============================================================ */
export const addBanner = async (req, res) => {
  try {
    const { imageUrl, title, order } = req.body;

    let content = await HomeContent.findOne();
    if (!content) content = new HomeContent();

    content.banners.push({
      imageUrl,
      title: title || "",
      order: order || content.banners.length + 1,
    });

    await content.save();
    res.json({ message: "Banner added", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to add banner" });
  }
};

/* ============================================================
   🗑️ DELETE BANNER
============================================================ */
export const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    let content = await HomeContent.findOne();
    if (!content)
      return res.status(404).json({ message: "No homepage content found" });

    content.banners = content.banners.filter(
      (b) => b._id.toString() !== bannerId
    );

    await content.save();
    res.json({ message: "Banner deleted successfully", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete banner" });
  }
};

/* ============================================================
   🛠️ ADD BEST SELLER (NO DUPLICATES)
============================================================ */
export const addBestSeller = async (req, res) => {
  try {
    const { name, imageUrl, price } = req.body;

    let content = await HomeContent.findOne();
    if (!content) content = new HomeContent();

    const exists = content.bestSellers.some(
      (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: "This best seller already exists" });
    }

    content.bestSellers.push({
      name,
      imageUrl,
      price: price || 0,
    });

    await content.save();
    res.json({ message: "Best seller added", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to add best seller" });
  }
};

/* ============================================================
   🗑️ DELETE BEST SELLER
============================================================ */
export const deleteBestSeller = async (req, res) => {
  try {
    const bestId = req.params.id;

    let content = await HomeContent.findOne();
    if (!content)
      return res.status(404).json({ message: "No homepage content found" });

    content.bestSellers = content.bestSellers.filter(
      (s) => s._id.toString() !== bestId
    );

    await content.save();
    res.json({ message: "Deleted Best Seller", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete best seller" });
  }
};

/* ============================================================
   🛠️ ADD HOME CATEGORY
============================================================ */
export const addHomeCategory = async (req, res) => {
  try {
    const { name, imageUrl, link } = req.body;

    let content = await HomeContent.findOne();
    if (!content) content = new HomeContent();

    content.homeCategories.push({
      name,
      imageUrl,
      link: link || "",
    });

    await content.save();
    res.json({ message: "Category added", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to add category" });
  }
};

/* ============================================================
   🗑️ DELETE HOME CATEGORY
============================================================ */
export const deleteHomeCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    let content = await HomeContent.findOne();
    if (!content)
      return res.status(404).json({ message: "No homepage content found" });

    content.homeCategories = content.homeCategories.filter(
      (c) => c._id.toString() !== categoryId
    );

    await content.save();
    res.json({ message: "Category deleted", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

/* ============================================================
   🎥 ADD HOME VIDEO (MULTIPLE)
============================================================ */
export const addHomeVideo = async (req, res) => {
  try {
    const { videoUrl, thumbnailUrl } = req.body;

    if (!videoUrl || !thumbnailUrl) {
      return res.status(400).json({ message: "Video & thumbnail required" });
    }

    let content = await HomeContent.findOne();
    if (!content) content = new HomeContent();

    content.homeVideos.push({ videoUrl, thumbnailUrl });

    await content.save();
    res.json({ message: "Home video added", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to add home video" });
  }
};

/* ============================================================
   🎥 DELETE HOME VIDEO (DB + GCS)
============================================================ */
export const deleteHomeVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    let content = await HomeContent.findOne();
    if (!content)
      return res.status(404).json({ message: "No homepage content found" });

    const video = content.homeVideos.find(
      (v) => v._id.toString() === videoId
    );
    if (!video)
      return res.status(404).json({ message: "Video not found" });

    // 🔥 Delete from Google Cloud
    await deleteImage(video.videoUrl);
    await deleteImage(video.thumbnailUrl);

    content.homeVideos = content.homeVideos.filter(
      (v) => v._id.toString() !== videoId
    );

    await content.save();
    res.json({ message: "Home video deleted", content });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete home video" });
  }
};

/* ============================================================
   🧹 CLEAR ALL HOMEPAGE DATA
============================================================ */
export const resetHome = async (req, res) => {
  await HomeContent.deleteMany({});
  res.json({ message: "Homepage data cleared" });
};
