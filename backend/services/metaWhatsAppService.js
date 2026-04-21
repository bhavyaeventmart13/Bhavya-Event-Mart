import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send WhatsApp Message via Meta API
 */
export const sendMetaWhatsAppMessage = async (to, message) => {
  try {
    const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.error("❌ Meta WhatsApp credentials missing in .env");
      return null;
    }

    if (!to || !message) {
      console.error("❌ Missing 'to' or 'message' content");
      return null;
    }

    // ✅ Standardize phone number (Ensure it has no '+' or spaces)
    const cleanTo = typeof to === "string" 
      ? to.replace(/\D/g, "") 
      : to.toString();

    // 🛡️ META SAFETY: Check 4096 character limit
    let safeMessage = typeof message === "string" ? message.trim() : "";
    
    if (safeMessage.length > 4090) {
      console.warn("⚠️ Message length exceeds Meta limit. Truncating...");
      safeMessage = safeMessage.substring(0, 4090) + "...";
    }

    if (!safeMessage) safeMessage = "Hello! How can we help you today?";

    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: true, // ✅ Set to TRUE so users see your website/product images
        body: safeMessage,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.error) {
      // Logic for the specific #100 error you saw earlier
      if (data.error.code === 100) {
        console.error("❌ Meta Validation Error (Check character length or phone format):", data.error.message);
      } else {
        console.error("❌ Meta API Error:", data.error);
      }
      return null;
    }

    console.log("✅ WhatsApp sent successfully. Message ID:", data.messages?.[0]?.id);
    return data;

  } catch (error) {
    console.error("❌ Meta Service Exception:", error.message);
    return null;
  }
};