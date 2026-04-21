import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export const sendFacebookMessage = async (recipientId, message) => {

  try {

    const PAGE_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

    const payload = {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: {
        text: message
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ Messenger Send Error:", data.error);
    } else {
      console.log("✅ Messenger message sent");
    }

  } catch (error) {

    console.error("❌ Messenger Send Error:", error.message);

  }

};