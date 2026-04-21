import { getProductFlow } from "./keywordService.js";

// ======================================
// 🔧 HELPER: Extract details dynamically
// ======================================
const extractDetails = (msg) => {
  const text = (msg || "").toLowerCase();
  const data = { color: null, type: null, use: null };
  const colors = ["red", "blue", "green", "gold", "white", "pink", "yellow", "black", "silver"];
  for (let c of colors) { if (text.includes(c)) data.color = c; }
  const types = ["printed", "plain", "designer", "artificial", "natural"];
  for (let t of types) { if (text.includes(t)) data.type = t; }
  return data;
};

// ======================================
// 📂 HELPER: Get Full Category List
// ======================================
const getFullCatalog = () => {
  return `*Printed Fabrics*
https://pankajcloth.com/categories/FABRICS/Printed%20Fabrics

*Fabric Usage*
https://pankajcloth.com/categories/FABRICS/Fabric%20Usage

*Misc Fabrics*
https://pankajcloth.com/categories/FABRICS/Misc%20Fabrics

*Colour Charts*
https://pankajcloth.com/categories/FABRICS/Colour%20Charts

*Plain Fabrics*
https://pankajcloth.com/categories/FABRICS/Plain%20Fabrics

*Color Combinations*
https://pankajcloth.com/categories/FABRICS/Color%20Combinations

*Ceiling Designer*
https://pankajcloth.com/categories/TAILOR%20MADE/Ceiling%20Designer

*Digital Print Displays*
https://pankajcloth.com/categories/TAILOR%20MADE/Digital%20Print%20Displays

*Light Ceiling*
https://pankajcloth.com/categories/TAILOR%20MADE/Light%20Ceiling

*Ceiling Jhumer*
https://pankajcloth.com/categories/TAILOR%20MADE/Ceiling%20Jhumer

*Sliding Fancy*
https://pankajcloth.com/categories/TAILOR%20MADE/Siding%20Fancy

*Round Table Cover & Runner*
https://pankajcloth.com/categories/TAILOR%20MADE/Round%20Table%20Cover%20%26%20Runner

*Chair Cover & Ribbon*
https://pankajcloth.com/categories/TAILOR%20MADE/Chair%20Cover%20%26%20Ribbon

*Printed Top,Ceiling & Siding*
https://pankajcloth.com/categories/TAILOR%20MADE/Printed%20Top%2CCeiling%20%26%20Siding

*Cushion & Load Cover*
https://pankajcloth.com/categories/TAILOR%20MADE/Cusion%20%26%20load%20Cover

*Round Table Covers (Nepron)*
https://pankajcloth.com/categories/TAILOR%20MADE/Round%20Table%20Covers%20(Nepron)

*Danglers*
https://pankajcloth.com/categories/DIGITAL%20PRINT%20(CONCEPTS)/Danglers

*Digital Print Panel*
https://pankajcloth.com/categories/DIGITAL%20PRINT%20(CONCEPTS)/Digital%20Print%20Panel

*Digital Stage Backdrop*
https://pankajcloth.com/categories/DIGITAL%20PRINT%20(CONCEPTS)/Digital%20Stage%20Backdrop

*Digital Mantra Print*
https://pankajcloth.com/categories/DIGITAL%20PRINT%20(CONCEPTS)/Digital%20Mantra%20Print

*Digital Print Carpet*
https://pankajcloth.com/categories/CARPETS%20%26%20MATTING/Digital%20Print%20Carpet

*Rotory Print Carpet*
https://pankajcloth.com/categories/CARPETS%20%26%20MATTING/Rotory%20Print%20Carpet

*Plain Carpet*
https://pankajcloth.com/categories/CARPETS%20%26%20MATTING/Plain%20Carpet

*Matting & Agriculture Net*
https://pankajcloth.com/categories/CARPETS%20%26%20MATTING/Matting%20%26%20Agriculture%20Net

*Loose Flowers*
https://pankajcloth.com/categories/ARTIFICAL%20FLOWERS/Loose%20Flowers

*Flower Patta & Bouquets*
https://pankajcloth.com/categories/ARTIFICAL%20FLOWERS/Flower%20Patta%20%26%20Bouquets

*Bunches & Sticks*
https://pankajcloth.com/categories/ARTIFICAL%20FLOWERS/Bunches%20%26%20Sticks

*Flower Wall*
https://pankajcloth.com/categories/ARTIFICAL%20FLOWERS/Flower%20Wall

*METAL PROPS*
https://pankajcloth.com/categories/METAL%20PROPS

*Marriage Stage Sofa*
https://pankajcloth.com/categories/FURNITURE/Marriage%20Stage%20Sofa

*Cushion Sofa*
https://pankajcloth.com/categories/FURNITURE/Cusion%20Sofa

*Jhula Sankheda*
https://pankajcloth.com/categories/FURNITURE/Jhula%20Sankheda

*Acrylic Moulded Chairs*
https://pankajcloth.com/categories/FURNITURE/Acrylic%20Moulded%20Chairs

*Tables*
https://pankajcloth.com/categories/FURNITURE/Tables

*Steel Sofa & Chair*
https://pankajcloth.com/categories/FURNITURE/Steel%20Sofa%20%26%20Chair

*Marriage Stage Sofa (Ready)*
https://pankajcloth.com/categories/FURNITURE/Marriage%20Stage%20Sofa%20(Ready)

*Light Jhumers*
https://pankajcloth.com/categories/LIGHT%20JHUMERS%20%26%20PROPS/Light%20Jhumers

*Light Props*
https://pankajcloth.com/categories/LIGHT%20JHUMERS%20%26%20PROPS/Light%20Props

*MIRROR SETUPS*
https://pankajcloth.com/categories/MIRROR%20SETUPS

*WEDDING PROPS*
https://pankajcloth.com/categories/WEDDING%20PROPS

*COOLERS*
https://pankajcloth.com/categories/COOLERS

*ESSENTIALS*
https://pankajcloth.com/categories/ESSENTIALS`;
};

// ======================================
// 🧠 SMART DETECTION FALLBACK
// ======================================
const findBestCategoryMatch = (msg) => {
  const catalog = getFullCatalog().split('\n\n');
  let bestMatch = null;

  for (const entry of catalog) {
    const lines = entry.split('\n');
    const categoryName = lines[0].replace(/\*/g, '').toLowerCase();
    const categoryLink = lines[1];

    // Check if user message contains any part of the category name
    if (msg.includes(categoryName) || categoryName.includes(msg)) {
      return { name: lines[0].replace(/\*/g, ''), link: categoryLink };
    }
  }
  return null;
};

export const handleConversationFlow = async (conversation, messageText) => {
  const msg = (messageText || "").toLowerCase().trim();
  const greetings = ["hi", "hello", "hey", "hii", "namaste", "ram ram"];

  if (!conversation.userDetails) {
    conversation.userDetails = { name: "Guest", phone: "", city: "Unknown", lang: "hi" };
  }

  // ✅ Step Reset Logic
  if (conversation.currentStep === "completed") {
    if (greetings.some(g => msg.includes(g))) {
      conversation.currentStep = "start";
    } else {
      return null; 
    }
  }

  // STEP 0: START -> HINGLISH ONLY
  if (conversation.currentStep === "start") {
    conversation.userDetails.lang = "hi";
    conversation.currentStep = "collecting_phone";
    return `Welcome to *Pankaj Cloth Store* Nagpur! 🙌\n\nBehtar jaankari ke liye, please apna *10-digit Phone Number* share karein.`;
  }

  const lang = conversation.userDetails.lang || "hi";

  // STEP 2: PHONE COLLECTION
  if (conversation.currentStep === "collecting_phone") {
    const cleanNum = msg.replace(/\D/g, "");
    if (cleanNum.length < 10) {
      return "❌ Galat number. Kripya 10-digit number bhein.";
    }
    
    conversation.userDetails.phone = cleanNum;
    conversation.currentStep = "asking_product";
    
    const website = "https://pankajcloth.com/";
    const playStore = "https://play.google.com/store/apps/details?id=com.pankajcloth.mobile";
    const appStore = "https://apps.apple.com/in/app/pankaj-cloth/id6758455759";

    const msg1 = `Dhanyawad! 🙌\n\n🌐 *Website:* ${website}\n\n📱 *Download App:*\nAndroid: ${playStore}\niPhone: ${appStore}`;
    const msg2 = `*Aap hamari categories explore kar sakte hain:* 👇\n\n${getFullCatalog()}\n\n*Aaj aap kya dekhna chahte hain?* (Fabric, Jhoomar, Sofa, etc.)`;

    return [msg1, msg2]; 
  }

  // STEP 3: SMART PRODUCT DETECTION (Enhanced)
  if (conversation.currentStep === "asking_product") {
    if (msg.includes("category") || msg.includes("all")) return getFullCatalog();

    // 1. Try specialized keyword service first
    let productMatch = await getProductFlow(msg);
    
    // 2. SMART FALLBACK: If service fails, scan the catalog list directly
    if (!productMatch || productMatch.link === "nan") {
      productMatch = findBestCategoryMatch(msg);
    }

    if (productMatch?.link && productMatch.link !== "nan") {
      conversation.currentProduct = productMatch.link;
      conversation.currentStep = "asking_preferences";
      return `Sahi choice! Hamare paas *${productMatch.name}* ka bohot bada stock hai. 👍\n\nKya aapko koi specific color ya type chahiye? (Example: "Red Printed")`;
    } else {
      conversation.currentStep = "completed";
      return null; 
    }
  }

  // STEP 4: PREFERENCES
  if (conversation.currentStep === "asking_preferences") {
    const details = extractDetails(msg);
    conversation.currentStep = "completed";
    const link = conversation.currentProduct;

    return `Theek hai! Maine note kar liya hai. ✅\n\nYahan saari variety dekhein: ${link}\n\nHumari team Nagpur office se aapse jald contact karegi.`;
  }

  return null;
};