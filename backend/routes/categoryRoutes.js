// routes/categoryRoutes.js
import express from "express";
import mongoose from "mongoose"; // 🔥 ADD THIS
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const router = express.Router();
const normalize = (str = "") =>
  str
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/concepts/g, "concept")
    .replace(/\s+/g, " ")
    .trim();
// ===============================================================
// 🔍 SEARCH CATEGORIES & SUBCATEGORIES
// ===============================================================
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q) {
      return res.json({ categories: [], subcategories: [] });
    }

    const cats = await Category.find({
      name: { $regex: q, $options: "i" },
    });

    const categories = cats.map((c) => ({
      name: c.name,
    }));

    let subcategories = [];

    cats.forEach((cat) => {
      (cat.subcategories || []).forEach((sub) => {
        if (sub.name.toLowerCase().includes(q)) {
          subcategories.push({
            category: cat.name,
            name: sub.name,
          });
        }
      });
    });

    res.json({ categories, subcategories });
  } catch (err) {
    console.error("❌ Category search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

// ===============================
// GET ALL CATEGORIES
// ===============================
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });

    // ✅ SORT SUBCATEGORIES
    categories.forEach(cat => {
      cat.subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// ===============================
// 🔥 UPDATED: POST /updateAll
// ===============================
router.post("/updateAll", async (req, res) => {
  try {
    const categoriesFromFrontend = req.body;

    if (!Array.isArray(categoriesFromFrontend)) {
      return res
        .status(400)
        .json({ message: "Request body must be an array of categories." });
    }

    // =====================================
    // 1️⃣ GET OLD DATA
    // =====================================
    const oldCategories = await Category.find();

    // =====================================
    // 2️⃣ CREATE RENAME MAP
    // =====================================
    const renameMap = {
      categories: {},
      subcategories: {},
    };

    categoriesFromFrontend.forEach((newCat) => {
      const oldCat = oldCategories.find(
        (c) => c._id.toString() === String(newCat._id)
      );

      if (!oldCat) return;

      // CATEGORY RENAME
      if (oldCat.name !== newCat.name) {
        renameMap.categories[normalize(oldCat.name)] = newCat.name;
      }

      const oldSubs = oldCat.subcategories || [];

      (newCat.subcategories || []).forEach((newSub) => {
        const oldSub = oldSubs.find(
          (s) => s._id.toString() === String(newSub._id)
        );

        if (!oldSub) return;

        if (oldSub.name !== newSub.name) {
          const key = `${normalize(oldCat.name)}||${normalize(oldSub.name)}`;

          renameMap.subcategories[key] = {
            newSub: newSub.name,
          };
        }
      });
    });

    console.log("🔥 Rename Map:", renameMap);

    // =====================================
    // 3️⃣ UPDATE CATEGORY COLLECTION
    // =====================================
    const operations = categoriesFromFrontend.map((cat, index) => {
      const isValidId = mongoose.Types.ObjectId.isValid(cat._id);

      return {
        updateOne: {
          filter: isValidId
            ? { _id: cat._id } // existing category
            : { name: cat.name }, // new category

          update: {
            $set: {
              name: cat.name,
              order: index,
              subcategories: (cat.subcategories || []).map((sub, subIndex) => ({
                _id: mongoose.Types.ObjectId.isValid(sub._id)
                  ? sub._id
                  : new mongoose.Types.ObjectId(),
                name: sub.name,
                order: subIndex
              }))
            },
          },

          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      await Category.bulkWrite(operations);
    }

    // =====================================
    // 4️⃣ UPDATE PRODUCTS (CRITICAL)
    // =====================================
    const products = await Product.find();

    for (let product of products) {
      let updated = false;

      product.categories = product.categories.map((cat) => {
        const oldCatName = normalize(cat.name);

        let newCatName = cat.name;

        if (renameMap.categories[oldCatName]) {
          newCatName = renameMap.categories[oldCatName];
          updated = true;
        }

        const newSubs = (cat.subcategories || []).map((sub) => {
          const key = `${oldCatName}||${normalize(sub)}`;

          if (renameMap.subcategories[key]) {
            updated = true;
            return renameMap.subcategories[key].newSub;
          }

          return sub;
        });

        return {
          name: newCatName,
          subcategories: newSubs,
        };
      });

      if (updated) {
        await product.save();
      }
    }

    // =====================================
    // RESPONSE
    // =====================================
    res.status(200).json({
      message: "Category structure + product sync updated successfully.",
    });
  } catch (error) {
    console.error("❌ Error saving category structure:", error);
    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
});

// ===============================
// REORDER
// ===============================
router.post("/reorder", async (req, res) => {
  try {
    const { orderedCategories } = req.body;
    if (!Array.isArray(orderedCategories)) {
      return res
        .status(400)
        .json({ message: "Invalid data. Must be an array of category names." });
    }

    const operations = orderedCategories.map((name, index) => ({
      updateOne: {
        filter: { name },
        update: { $set: { order: index } },
      },
    }));

    if (operations.length > 0) await Category.bulkWrite(operations);

    res.status(200).json({ message: "Category order saved successfully." });
  } catch (error) {
    console.error("❌ Error reordering categories:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ===============================
// DELETE CATEGORY
// ===============================
router.delete("/:name", async (req, res) => {
  try {
    const categoryName = req.params.name;

    const cat = await Category.findOne({
      name: { $regex: `^${categoryName}$`, $options: "i" },
    });

    if (!cat) {
      return res
        .status(404)
        .json({ message: `Category "${categoryName}" not found.` });
    }

    if (cat.subcategories && cat.subcategories.length > 0) {
      return res.status(400).json({
        message: `Cannot delete category "${cat.name}". Delete its subcategories first.`,
      });
    }

    const productCount = await Product.countDocuments({
      "categories.name": { $regex: `^${cat.name}$`, $options: "i" },
    });

    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category "${cat.name}". Delete its products first.`,
      });
    }

    await Category.findByIdAndDelete(cat._id);

    res
      .status(200)
      .json({ message: `Category "${cat.name}" was deleted successfully.` });
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    res
      .status(500)
      .json({ message: "Internal server error while deleting category." });
  }
});

// ===============================
// DELETE SUBCATEGORY
// ===============================
router.post("/delete-subcategory", async (req, res) => {
  try {
    const { category, subcategory } = req.body;

    if (!category || !subcategory) {
      return res.status(400).json({
        message: "Both category and subcategory are required.",
      });
    }

    const cat = await Category.findOne({
      name: { $regex: `^${category}$`, $options: "i" },
    });

    if (!cat) {
      return res
        .status(404)
        .json({ message: `Category "${category}" not found.` });
    }

    const subExists = cat.subcategories.some(
      (s) => s.name.toLowerCase() === subcategory.toLowerCase()
    );

    if (!subExists) {
      return res.status(404).json({
        message: `Subcategory "${subcategory}" not found in category "${cat.name}".`,
      });
    }

    const productCount = await Product.countDocuments({
      "categories.subcategories": {
        $regex: `^${subcategory}$`,
        $options: "i",
      },
    });

    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete subcategory "${subcategory}". Delete its products first.`,
      });
    }

    cat.subcategories = cat.subcategories.filter(
      (s) => s.name.toLowerCase() !== subcategory.toLowerCase()
    );

    await cat.save();

    res.status(200).json({
      message: `Subcategory "${subcategory}" deleted successfully from "${cat.name}".`,
    });
  } catch (error) {
    console.error("❌ Error deleting subcategory:", error);
    res.status(500).json({
      message: "Internal server error while deleting subcategory.",
    });
  }
});
// ===============================
// REORDER SUBCATEGORIES
// ===============================
router.post("/reorder-subcategories", async (req, res) => {
  try {
    const { categoryId, orderedSubcategories } = req.body;

    if (!categoryId || !Array.isArray(orderedSubcategories)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.subcategories = orderedSubcategories.map((sub, index) => ({
      _id: sub._id || new mongoose.Types.ObjectId(),
      name: sub.name,
      order: index
    }));

    await category.save();

    res.status(200).json({ message: "Subcategory order updated" });

  } catch (err) {
    console.error("❌ Subcategory reorder error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;