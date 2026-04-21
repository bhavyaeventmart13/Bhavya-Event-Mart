import Blog from "../models/Blog.js";

// ==========================
// CREATE BLOG
// ==========================
export const createBlog = async (req, res) => {
  try {
    const { title, slug, blocks, coverImage } = req.body;

    if (!title || !blocks || !blocks.length) {
      return res.status(400).json({
        success: false,
        message: "Blog title and content are required",
      });
    }

    // Slug is optional for future use, auto-generate if missing
    const finalSlug =
      slug ||
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

    const exists = await Blog.findOne({ slug: finalSlug });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Blog already exists",
      });
    }

    const blog = await Blog.create({
      title,
      slug: finalSlug,
      coverImage,
      blocks,
    });

    res.status(201).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
    });
  }
};

// ==========================
// GET ALL BLOGS (FULL CONTENT)
// ==========================
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    console.error("Fetch blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load blogs",
    });
  }
};

// ==========================
// GET BLOG BY SLUG (OPTIONAL / FUTURE)
// ==========================
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json(blog);
  } catch (error) {
    console.error("Fetch blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load blog",
    });
  }
};

// ==========================
// DELETE BLOG
// ==========================
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
    });
  }
};
