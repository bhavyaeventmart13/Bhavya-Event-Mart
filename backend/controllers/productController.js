// ===================================================================
// products controller (FINAL – COLOR SAFE, BACKWARD COMPATIBLE)
// ===================================================================

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import { deleteImages } from "../services/uploadService.js";
import csv from "csvtojson";
import { Parser } from "json2csv";
import { uploadImages } from "../services/uploadService.js";

dotenv.config();
const normalize = (str = "") =>
  str
    .toLowerCase()
    .replace(/\(.*?\)/g, "")   // remove (concept)
    .replace(/concepts/g, "concept")
    .replace(/\s+/g, " ")
    .trim();

// ======================================================
// Google Cloud Storage Setup
// ======================================================
const gc = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const bucket = gc.bucket(process.env.GCLOUD_BUCKET);

// ======================================================
// Utility: Upload Multiple Files to GCS
// ======================================================
const uploadFilesToGCS = async (files = []) => {
  if (!files.length) return [];

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const filename = `${Date.now()}-${file.originalname.replace(
            /\s+/g,
            "-"
          )}`;
          const blob = bucket.file(filename);

          const stream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
            metadata: {
              cacheControl: "public, max-age=31536000, immutable",
            },
          });

          stream.on("finish", () =>
            resolve(
              `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            )
          );
          stream.on("error", reject);
          stream.end(file.buffer);
        })
    )
  );
};

// ===================================================================
// 🔍 SEARCH PRODUCTS + CATEGORY + SUBCATEGORY
// ===================================================================
export const searchProductsController = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.json({ products: [], categories: [], subcategories: [] });
    }

    const regex = new RegExp(q, "i");

    const products = await Product.find({
      $or: [
        { name: regex },
        { description: regex },
        { "categories.name": regex },
        { "categories.subcategories": regex },
      ],
    })
      .select("name imageUrls categories")
      .limit(10)
      .lean();

    const categoryDocs = await Category.find({ name: regex }).lean();

    const categoriesFromCategory = categoryDocs.map((c) => ({ name: c.name }));

    const categoriesFromProducts = [];
    products.forEach((p) => {
      (p.categories || []).forEach((c) => {
        if (regex.test(c.name)) {
          categoriesFromProducts.push({ name: c.name });
        }
      });
    });

    const categories = [
      ...new Map(
        [...categoriesFromCategory, ...categoriesFromProducts].map((c) => [
          c.name,
          c,
        ])
      ).values(),
    ];

    const subcategories = [];
    categoryDocs.forEach((cat) => {
      (cat.subcategories || []).forEach((sub) => {
        if (sub.toLowerCase().includes(q.toLowerCase())) {
          subcategories.push({
            categoryName: cat.name,
            subName: sub,
          });
        }
      });
    });

    res.json({ products, categories, subcategories });
  } catch (err) {
    console.error("❌ Search Error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};

// ===================================================================
// ➕ ADD PRODUCT (COLOR SAFE)
// ===================================================================
export const addProduct = async (req, res) => {
  try {
    const {
      productName,
      categories,
      stockUnits,
      description,
      selectedSizes,
      status,
      refNumber,
      colors,
    } = req.body;

    if (!productName || !categories) {
      return res
        .status(400)
        .json({ message: "Product name and category are required." });
    }

    let parsedCategories;
    try {
      parsedCategories = JSON.parse(categories);
      // 🔥 Ensure category exists (normalized matching)
for (const cat of parsedCategories) {

  let existing = await Category.findOne({
    name: { $regex: `^${cat.name}$`, $options: "i" },
  });

  if (!existing) {
    await Category.create({
      name: cat.name,
      subcategories: (cat.subcategories || []).map((s) => ({
        name: s,
      })),
    });
  } else {
    const existingSubs = existing.subcategories.map((s) =>
      normalize(s.name)
    );

    (cat.subcategories || []).forEach((sub) => {
      if (!existingSubs.includes(normalize(sub))) {
        existing.subcategories.push({ name: sub });
      }
    });

    await existing.save();
  }
}
    } catch {
      return res.status(400).json({ message: "Invalid categories format" });
    }

    // ✅ MAIN PRODUCT IMAGES
  const imageResults =
  req.files?.images?.length > 0
    ? await uploadImages(req.files.images)
    : [];

const imageUrls = imageResults.map((img) =>
  typeof img === "string" ? img : img.url
);

    const sizesArray = selectedSizes
      ? JSON.parse(selectedSizes).map((s) => ({
        size: s.size,
        originalPrice: s.originalPrice,
        discountPercent: s.discountPercent || 0,
        gstPercent: s.gstPercent || 0,
        discountedPrice: s.discountedPrice,
      }))
      : [];

    // ✅ COLORS + COLOR IMAGES
    let parsedColors = [];
    if (colors) {
      try {
        const temp = JSON.parse(colors);

        if (req.files?.colorImages?.length) {
         const uploadedResults = await uploadImages(req.files.colorImages);

const uploaded = uploadedResults.map((img) =>
  typeof img === "string" ? img : img.url
);

          parsedColors = temp.map((c, i) => ({
            ...c,
            image: uploaded[i],
          }));
        } else {
          parsedColors = temp;
        }
      } catch { }
    }

    const product = new Product({
      name: productName.trim(),
      categories: parsedCategories,
      stockUnits: Number(stockUnits) || 0,
      description: description || "",
      sizes: sizesArray,
      status: status || "Available",
      refNumber: refNumber || "",
      imageUrls,
      colors: parsedColors,
    });

    await product.save();

    res.status(201).json({
      message: "✅ Product added successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Add Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===================================================================
// 📦 BULK UPLOAD PRODUCTS (UNCHANGED)
// ===================================================================
export const bulkUploadProducts = async (req, res) => {
  try {
    const { categories, commonFields, products } = req.body;

    if (!categories?.length || !products?.length) {
      return res.status(400).json({ message: "Invalid bulk payload" });
    }

    const normalizedCategories = categories.map((c) => ({
      name: c.name?.trim(),
      subcategories: c.subcategories || [],
    }));

    const newProducts = products.map((p) => ({
      name: p.name?.trim() || "Unnamed Product",
      description: commonFields.description || "",
      categories: normalizedCategories,
      sizes: commonFields.sizes,
      status: commonFields.status || "Available",
      stockUnits: 0,
      imageUrls: p.imageUrls || [],
      refNumber: p.refNumber || "",
      colors: p.colors || [],
    }));

    const created = await Product.insertMany(newProducts, { ordered: false });

    res.status(201).json({
      message: "✅ Bulk upload successful",
      count: created.length,
    });
  } catch (err) {
    console.error("❌ Bulk Upload Error:", err);
    res.status(500).json({ message: "Bulk upload failed" });
  }
};
export const getProducts = async (req, res) => {
  try {
    let { category, subcategory, colors } = req.query;

    // -------------------------------
    // CLEAN INPUT
    // -------------------------------
 

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // -------------------------------
    // ESCAPE REGEX
    // -------------------------------
    const escapeRegex = (str = "") =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const safeCategory = escapeRegex(category);
    const safeSubcategory = escapeRegex(subcategory);

    // -------------------------------
let filter = {};

// 🔥 SUBCATEGORY SELECTED → STRICT MATCH
if (subcategory) {
  filter = {
    categories: {
      $elemMatch: {
        name: { $regex: `^${safeCategory}$`, $options: "i" },
        subcategories: {
          $in: [new RegExp(`^${safeSubcategory}$`, "i")],
        },
      },
    },
  };
}

// 🔥 ONLY CATEGORY SELECTED
else {
  filter = {
    "categories.name": {
      $regex: `^${safeCategory}$`,
      $options: "i",
    },
  };
}

// -------------------------------
// COLOR FILTER
// -------------------------------
if (colors) {
  filter = {
    $and: [
      filter,
      {
        "colors.name": {
          $in: colors.split(","),
        },
      },
    ],
  };
}

// -------------------------------
// FETCH PRODUCTS
// -------------------------------
const products = await Product.find(filter)
  .sort({ createdAt: -1 })
  .lean();

    res.json(products);
  } catch (err) {
    console.error("❌ Get Products Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ===================================================================
// 🛡️ ADMIN – GET ALL PRODUCTS
// ===================================================================
export const getAllProductsAdmin = async (req, res) => {
  try {
    // 🔥 FETCH ALL PRODUCTS (NO PAGINATION)
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    // 🔥 TOTAL COUNT
    const total = products.length;

    // 🔥 RESPONSE
    res.json({
      products,
      total,
    });
  } catch (err) {
    console.error("❌ Admin Get Products Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===================================================================
// ✏️ UPDATE PRODUCT (COLOR SAFE)
// ===================================================================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, {
      name: req.body.productName ?? product.name,
      description: req.body.description ?? product.description,
      status: req.body.status ?? product.status,
      refNumber: req.body.refNumber ?? product.refNumber,
    });

    if (req.body.categories) {
      product.categories = JSON.parse(req.body.categories);
    }

    if (req.body.selectedSizes) {
      product.sizes = JSON.parse(req.body.selectedSizes);
    }

    // Update gallery images
   
// 🔥 Get existing images from frontend
let existingImages = [];

try {
  existingImages = req.body.existingImages
    ? JSON.parse(req.body.existingImages)
    : product.imageUrls || [];
} catch {
  existingImages = product.imageUrls || [];
}

// 🔥 Upload new images
let newImageUrls = [];

if (req.files?.images?.length) {
 const uploadedResults = await uploadImages(req.files.images);

newImageUrls = uploadedResults.map((img) =>
  typeof img === "string" ? img : img.url
);
}

// 🔥 Find deleted images
const deletedImages = (product.imageUrls || []).filter(
  (img) => !existingImages.includes(img)
);

// 🔥 Delete only removed images from GCS
if (deletedImages.length > 0) {
  await deleteImages(deletedImages);
}

// 🔥 Final merge
product.imageUrls = [...existingImages, ...newImageUrls];
    // Update colors
    if (req.body.colors) {
      try {
        const temp = JSON.parse(req.body.colors);

        if (req.files?.colorImages?.length) {
        const uploadedResults = await uploadImages(req.files.colorImages);

const uploaded = uploadedResults.map((img) =>
  typeof img === "string" ? img : img.url
);

          product.colors = temp.map((c, i) => ({
            ...c,
            image: uploaded[i],
          }));
        } else {
          product.colors = temp;
        }
      } catch { }
    }

    await product.save();

    res.json({
      message: "✅ Product updated successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Update Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===================================================================
// GET PRODUCT BY ID
// ===================================================================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("❌ Get Product by ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/// ===================================================================
// 📄 CSV BULK EDIT — FINAL SAFE VERSION (STABLE + FIXED)
// ===================================================================
export const csvBulkEditController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file missing" });
    }

    // 🔥 USE GLOBAL NORMALIZE (DO NOT OVERRIDE)
const normalizeSimple = (str = "") =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");   // normalize internal spaces

    const csvString = req.file.buffer.toString();
    const rows = await csv().fromString(csvString);

    if (!rows.length) {
      return res.status(400).json({ message: "CSV is empty" });
    }

    const summary = {
      updated: [],
      notFound: [],
      sizeSkipped: [],
      invalidRows: 0,
    };

    // =====================================================
    // GROUP BY refNumber
    // =====================================================
    const grouped = new Map();

    rows.forEach((row) => {
      const ref = row.refNumber?.toString().trim();
      const size = row.size?.toString().trim();

      if (!ref || !size) {
        summary.invalidRows++;
        return;
      }

      if (!grouped.has(ref)) grouped.set(ref, []);
      grouped.get(ref).push(row);
    });

    // =====================================================
    // BULK FETCH PRODUCTS
    // =====================================================
    const refNumbers = Array.from(grouped.keys());

    const products = await Product.find({
      refNumber: { $in: refNumbers },
    });

    const productMap = new Map();
    products.forEach((p) => {
      productMap.set(p.refNumber, p);
    });

    // =====================================================
    // PROCESS PRODUCTS
    // =====================================================
    for (const [refNumber, rowsArr] of grouped.entries()) {
      const product = productMap.get(refNumber);

      if (!product) {
        summary.notFound.push(refNumber);
        continue;
      }

      if (!Array.isArray(product.sizes)) product.sizes = [];

      let touched = false;

      // =====================================================
      // UPDATE PRODUCT NAME (FIRST ROW ONLY)
      // =====================================================
      const firstRow = rowsArr[0];

      if (firstRow.productName?.trim()) {
        const newName = firstRow.productName.trim();
        if (product.name !== newName) {
          product.name = newName;
          touched = true;
        }
      }

      // =====================================================
      // UPDATE STATUS (CASE SAFE)
      // =====================================================
     const validStatusMap = {
  "available": "Available",
  "unavailable": "Unavailable",
  "low stock": "Low stock",
};

const statusValue = firstRow.status?.toString().trim().toLowerCase();

if (statusValue && validStatusMap[statusValue]) {
  const formatted = validStatusMap[statusValue];

  if (product.status !== formatted) {
    product.status = formatted;
    touched = true;
  }
}
const stockValue = Number(firstRow.stockUnits);

if (!isNaN(stockValue) && stockValue >= 0) {
  if (product.stockUnits !== stockValue) {
    product.stockUnits = stockValue;
    touched = true;
  }
}
      // =====================================================
      // CREATE SIZE MAP
      // =====================================================
      const sizeMap = new Map();
      product.sizes.forEach((s) => {
        sizeMap.set(normalizeSimple(s.size), s);
      });

      const seenSizes = new Set();

      // =====================================================
      // PROCESS ROWS
      // =====================================================
      rowsArr.forEach((row) => {
        delete row.image; // 🔥 ignore image field

        const cleanSize = row.size?.toString().trim();

        if (!cleanSize) {
          summary.invalidRows++;
          return;
        }

        const sizeKey = normalizeSimple(cleanSize);

        // ❌ Duplicate size in CSV
        if (seenSizes.has(sizeKey)) {
          summary.invalidRows++;
          return;
        }
        seenSizes.add(sizeKey);

        // =====================================================
        // FIND SIZE (STRICT MATCH)
        // =====================================================
        const sizeObj = sizeMap.get(sizeKey);

        if (!sizeObj) {
          summary.sizeSkipped.push({
            refNumber,
            size: cleanSize,
          });
          return;
        }

        // =====================================================
        // VALIDATE VALUES
        // =====================================================
        const original = Number(row.originalPrice);
        const discount = Number(row.discountPercent || 0);
        const gst = Number(row.gstPercent || 0);

        if (
          isNaN(original) ||
          original <= 0 ||
          isNaN(discount) ||
          isNaN(gst) ||
          discount < 0 ||
          gst < 0 ||
          discount > 100
        ) {
          summary.invalidRows++;
          return;
        }

        // =====================================================
        // CALCULATE PRICE
        // =====================================================
        let discounted = original - (original * discount) / 100;
        discounted = discounted + (discounted * gst) / 100;

        const finalPrice = Number(discounted.toFixed(2));

        // =====================================================
        // UPDATE ONLY IF CHANGED
        // =====================================================
        let changed = false;

        if (sizeObj.originalPrice !== original) {
          sizeObj.originalPrice = original;
          changed = true;
        }

        if (sizeObj.discountPercent !== discount) {
          sizeObj.discountPercent = discount;
          changed = true;
        }

        if (sizeObj.gstPercent !== gst) {
          sizeObj.gstPercent = gst;
          changed = true;
        }

        if (sizeObj.discountedPrice !== finalPrice) {
          sizeObj.discountedPrice = finalPrice;
          changed = true;
        }

        if (changed) touched = true;
      });

      // =====================================================
      // SAVE PRODUCT
      // =====================================================
      if (touched) {
        try {
          await product.save();

          if (!summary.updated.includes(refNumber)) {
            summary.updated.push(refNumber);
          }
        } catch (err) {
          summary.invalidRows++;
        }
      }
    }

    return res.json({
      message: "CSV bulk edit completed",
      summary,
    });

  } catch (err) {
    console.error("❌ CSV Bulk Edit Error:", err);
    return res.status(500).json({
      message: "CSV bulk edit failed",
      error: err.message,
    });
  }
};
// ===================================================================
// 📤 CSV EXPORT (FIXED)
// ===================================================================
export const csvExportController = async (req, res) => {
  try {
    const { category, subcategory } = req.query;

    let filter = {};

if (category && subcategory) {
  const subArr = subcategory.split(",").map((s) => s.trim());

  filter = {
    categories: {
      $elemMatch: {
        name: { $regex: `^${category}$`, $options: "i" },
        subcategories: { $in: subArr },
      },
    },
  };
} else if (category) {
  filter = {
    "categories.name": {
      $regex: `^${category}$`,
      $options: "i",
    },
  };
}

    const products = await Product.find(filter).lean();

    const rows = [];

    products.forEach((product) => {
      if (!product.refNumber) return;
      if (!Array.isArray(product.sizes)) return;

      const image = product.imageUrls?.[0] || "";

      product.sizes.forEach((size) => {
       rows.push({
  refNumber: product.refNumber,
  productName: product.name || "",
  image,
  size: size.size,
  originalPrice: size.originalPrice,
  discountPercent: size.discountPercent,
  gstPercent: size.gstPercent,
  stockUnits: product.stockUnits || 0,   // ✅ added
  status: product.status,
});
      });
    });

    const parser = new Parser({
      fields: [
  "refNumber",
  "productName",
  "image",
  "size",
  "originalPrice",
  "discountPercent",
  "gstPercent",
  "stockUnits",   // ✅ added
  "status",
],
    });

    const csvData = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");

    return res.send(csvData);

  } catch (err) {
    console.error("❌ CSV Export Error:", err);
    return res.status(500).json({ message: "CSV export failed" });
  }
};