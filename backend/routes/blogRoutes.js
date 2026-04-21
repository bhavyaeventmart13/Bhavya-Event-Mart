import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  deleteBlog,
} from "../controllers/blogController.js";

const router = express.Router();

// ==========================
// BLOG ROUTES
// ==========================

// Create blog (Admin)
router.post("/", createBlog);

// Get all blogs (Frontend / Blog page)
router.get("/", getAllBlogs);

// Get single blog by slug (OPTIONAL – future use)
router.get("/slug/:slug", getBlogBySlug);

// Delete blog by id (Admin)
router.delete("/:id", deleteBlog);

export default router;
