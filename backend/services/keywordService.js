import AutoResponse from "../models/AutoResponse.js";

// ======================================
// 🔧 NORMALIZER (Cleans text for matching)
// ======================================
const normalize = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ======================================
// Detect Lead Intent (Updated for Hinglish)
// ======================================
export const detectIntent = (messageText) => {
  if (!messageText) return "general";
  const msg = messageText.toLowerCase();

  // Price & Rate
  if (msg.includes("price") || msg.includes("rate") || msg.includes("cost") || msg.includes("bhao") || msg.includes("kitne") || msg.includes("paisa") || msg.includes("kitna")) return "price_check";
  
  // Catalogue
  if (msg.includes("catalog") || msg.includes("catalogue") || msg.includes("brochure") || msg.includes("variety") || msg.includes("photo") || msg.includes("design") || msg.includes("sample")) return "catalogue_request";
  
  // Bulk
  if (msg.includes("bulk") || msg.includes("wholesale") || msg.includes("many pieces") || msg.includes("zyada") || msg.includes("qty") || msg.includes("quantity") || msg.includes("thok")) return "bulk_order";
  
  // Location
  if (msg.includes("location") || msg.includes("address") || msg.includes("where are you") || msg.includes("kaha hai") || msg.includes("shop kidhar") || msg.includes("nagpur") || msg.includes("dukan")) return "location_query";
  
  // General Product enquiry
  if (
    msg.includes("chair") ||
    msg.includes("mandap") ||
    msg.includes("fabric") ||
    msg.includes("kapda") ||
    msg.includes("stage") ||
    msg.includes("flower") ||
    msg.includes("jhumer") ||
    msg.includes("sofa") ||
    msg.includes("parda")
  ) {
    return "product_enquiry";
  }

  return "general";
};

// ======================================
// 🔥 PRODUCT MATCHING (Links/Search)
// ======================================
export const getProductFlow = async (msg) => {
  try {
    if (!msg || typeof msg !== "string") return null;

    let text = normalize(msg);
    const words = text.split(" ");

    // Hinglish & Common Typo Aliases
    const aliases = {
      "jhoomar": ["jhumer", "jhoomer", "jhoomar", "jhumar", "jumer", "jumar", "lighting", "light", "jhumaar"],
      "cooler": ["cooler", "coler", "air cooler", "coolers", "kular", "coolar"],
      "sofa": ["sofa", "shofa", "couch", "furniture", "sofa set", "sopha"],
      "flower": ["flower", "phool", "folwer", "flowers", "ful", "phul", "rose", "gulaab"],
      "fabric": ["kapda", "fabric", "cloth", "fapric", "meter", "parda", "curtain", "velvet", "revolving"],
      "carpet": ["carpet", "kaaleen", "matting", "mat", "kaalin", "rug"],
      "chair": ["chair", "kursi", "khursi", "chayer"]
    };

    // Check if user input matches any alias group
    for (const [correctKeyword, variations] of Object.entries(aliases)) {
      if (variations.some(v => text.includes(v))) {
        text = correctKeyword; 
        break;
      }
    }

    const autoResponses = await AutoResponse.find({
      active: true,
      link: { $nin: [null, "nan", ""] } 
    }).lean();

    if (!autoResponses?.length) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const item of autoResponses) {
      if (!item.keyword) continue;

      const keyword = normalize(item.keyword);
      const keywordParts = keyword.split(" ");
      let score = 0;

      // 1. Exact Match (Highest Weight)
      if (text === keyword) score += 75;

      // 2. Partial Phrase Match
      if (text.includes(keyword) && keyword.length > 3) score += 45;

      // 3. Word-by-Word Overlap
      const matchedWords = keywordParts.filter(pw => words.includes(pw));
      const matchRatio = matchedWords.length / keywordParts.length;

      if (matchRatio >= 0.6) {
        score += (matchRatio * 35);
      }

      // 4. Admin Boost (Manually push certain products higher)
      score += (item.scoreBoost || 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // Threshold check: We want to be reasonably sure before sending a link
    return bestScore >= 20 ? bestMatch : null;

  } catch (error) {
    console.error("❌ getProductFlow Error:", error);
    return null;
  }
};

// ======================================
// SIMPLE AUTO REPLY (Static Text like Address/Timing)
// ======================================
export const checkAutoReply = async (messageText) => {
  try {
    if (!messageText || typeof messageText !== "string") return null;

    const msg = normalize(messageText);
    if (msg.length < 2) return null;

    // Fetch responses that are TEXT only (no links)
    const autoResponses = await AutoResponse.find({
      active: true,
      $or: [{ link: null }, { link: "nan" }, { link: "" }]
    }).lean();

    if (!autoResponses?.length) return null;

    for (const response of autoResponses) {
      if (!response.keyword) continue;

      const keyword = normalize(response.keyword);

      // Exact check
      if (msg === keyword) return response.replyText;

      // Keyword inside message (e.g. "aapka address kya hai" matches "address")
      if (msg.includes(keyword) && keyword.length >= 4) {
        return response.replyText;
      }

      // Reverse check: message is inside the keyword (e.g. "timing" matches "shop timing")
      if (keyword.includes(msg) && msg.length >= 4) {
        return response.replyText;
      }
    }

    return null;

  } catch (error) {
    console.error("❌ AutoReply Check Error:", error);
    return null;
  }
};