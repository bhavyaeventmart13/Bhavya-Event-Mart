import AutoResponse from "../models/AutoResponse.js";

// ======================================
// 🔧 NORMALIZER (NEW)
// ======================================
const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ======================================
// GET ALL KEYWORDS
// ======================================
export const getKeywords = async (req, res) => {
  try {
    const keywords = await AutoResponse.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      keywords,
    });
  } catch (error) {
    console.error("❌ Get Keywords Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch keywords",
    });
  }
};

// ======================================
// CREATE NEW KEYWORD (FIXED)
// ======================================
export const createKeyword = async (req, res) => {
  try {
    let { keyword, replyText, intent, scoreBoost, type, link } = req.body;

    if (!keyword || !replyText) {
      return res.status(400).json({
        success: false,
        message: "Keyword and replyText are required",
      });
    }

    // ✅ normalize keyword
    keyword = normalize(keyword);

    // ✅ case-insensitive duplicate check
    const existing = await AutoResponse.findOne({
      keyword: { $regex: `^${keyword}$`, $options: "i" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Keyword already exists",
      });
    }

    const newKeyword = await AutoResponse.create({
      keyword,
      replyText,
      type: type || "simple",
      link: link || null,
      intent: intent || "general",
      scoreBoost: scoreBoost || 0,
    });

    return res.json({
      success: true,
      keyword: newKeyword,
    });
  } catch (error) {
    console.error("❌ Create Keyword Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create keyword",
    });
  }
};

// ======================================
// UPDATE KEYWORD (FIXED)
// ======================================
export const updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    let { keyword, replyText, intent, scoreBoost, type, link } = req.body;

    if (keyword) {
      keyword = normalize(keyword);
    }

    const updatedKeyword = await AutoResponse.findByIdAndUpdate(
      id,
      {
        ...(keyword && { keyword }),
        ...(replyText && { replyText }),
        ...(type && { type }),
        ...(link !== undefined && { link }),
        ...(intent && { intent }),
        ...(scoreBoost !== undefined && { scoreBoost }),
      },
      { new: true }
    );

    if (!updatedKeyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword not found",
      });
    }

    return res.json({
      success: true,
      keyword: updatedKeyword,
    });
  } catch (error) {
    console.error("❌ Update Keyword Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update keyword",
    });
  }
};

// ======================================
// DELETE KEYWORD
// ======================================
export const deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await AutoResponse.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Keyword not found",
      });
    }

    return res.json({
      success: true,
      message: "Keyword deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Keyword Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete keyword",
    });
  }
};