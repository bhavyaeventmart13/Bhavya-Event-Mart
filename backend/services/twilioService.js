// ==============================
// services/twilioService.js
// PRODUCTION SAFE VERSION
// ==============================

import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// Validate credentials early
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error("❌ Twilio credentials are missing in environment variables.");
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ==============================
// Send WhatsApp Message
// ==============================

export const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!to || !message) {
      console.error("❌ Missing 'to' or 'message' parameter in sendWhatsAppMessage");
      return;
    }

    const response = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio Sandbox number
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log("✅ WhatsApp message sent successfully");
    console.log("Message SID:", response.sid);

    return response;
  } catch (error) {
    console.error("❌ Twilio Send Error:");
    console.error(error.message);

    if (error.response) {
      console.error("Twilio Response Data:", error.response.data);
    }
  }
};