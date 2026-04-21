import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const GRAPH_URL = "https://graph.facebook.com/v19.0";

/*
------------------------------------------------
SEND INSTAGRAM MESSAGE
------------------------------------------------
*/
export const sendInstagramMessage = async (recipientId, message) => {

  try {

    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const PAGE_ID = process.env.META_PAGE_ID;

    if (!ACCESS_TOKEN || !PAGE_ID) {
      console.error("❌ Missing META_ACCESS_TOKEN or META_PAGE_ID in .env");
      return;
    }

    const url = `${GRAPH_URL}/${PAGE_ID}/messages`;

    const payload = {
      messaging_product: "instagram",
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      },
      messaging_type: "RESPONSE" // ✅ FIX (IMPORTANT)
    };

    console.log("📤 Sending Instagram reply:", payload);

    const response = await fetch(`${url}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {

      console.error("❌ Instagram Send Error:", data.error);

    } else {

      console.log("✅ Instagram message sent successfully", data);

    }

  } catch (error) {

    console.error("❌ Instagram Send Error:", error.message);

  }

};


/*
------------------------------------------------
GET INSTAGRAM USERNAME
------------------------------------------------
*/
export const getInstagramUsername = async (userId) => {

  try {

    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      console.error("❌ Missing META_ACCESS_TOKEN");
      return userId;
    }

    const url = `${GRAPH_URL}/${userId}?fields=username&access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url);

    const data = await response.json();

    if (data.error) {

      console.error("❌ Username Fetch Error:", data.error);
      return userId;

    }

    if (data.username) {
      console.log("👤 Instagram username fetched:", data.username);
      return data.username;
    }

    return userId;

  } catch (error) {

    console.error("❌ Username fetch error:", error.message);
    return userId;

  }

};
// 253607e17e95f5776fe00033af16973d