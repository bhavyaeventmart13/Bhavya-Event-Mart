import { processIncomingMessage } from "./communicationController.js";
import { sendWhatsAppMessage } from "../services/twilioService.js";
import { sendMetaWhatsAppMessage } from "../services/metaWhatsAppService.js";
import { sendInstagramMessage, getInstagramUsername } from "../services/instagramService.js";
import { sendFacebookMessage } from "../services/facebookService.js";

const VERIFY_TOKEN =
  process.env.META_VERIFY_TOKEN || "pankaj_meta_verify_token";

export const handleMetaWebhook = async (req, res) => {
  // ================= VERIFY =================
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification failed");
  }

  // 🔥 IMMEDIATE ACKNOWLEDGMENT: Stop Meta from retrying
  res.sendStatus(200);

  try {
    const body = req.body;

    // ================= INSTAGRAM =================
    if (body.object === "instagram") {
      const entry = body.entry?.[0];
      const messagingEvent = entry?.messaging?.[0];

      if (!messagingEvent || messagingEvent.message?.is_echo) return;

      const senderId = messagingEvent.sender?.id;
      const messageText = messagingEvent.message?.text || "";
      const messageId = messagingEvent.message?.mid || null;

      if (!senderId || !messageText) return;

      // Process in background
      (async () => {
        let username = senderId;
        try {
          const fetched = await getInstagramUsername(senderId);
          if (fetched) username = fetched;
        } catch (err) {
          console.error("❌ Instagram Username Fetch Error:", err.message);
        }

        const result = await processIncomingMessage({
          platform: "instagram",
          name: username,
          phone: senderId,
          email: "",
          messageText,
          channelMessageId: messageId,
        });

        // Only reply if processIncomingMessage didn't send it already
        if (result?.autoReply) {
          await sendInstagramMessage(senderId, result.autoReply);
        }
      })();
    }

    // ================= FACEBOOK =================
    if (body.object === "page") {
      const event = body.entry?.[0]?.messaging?.[0];
      if (!event || event.message?.is_echo) return;

      const senderId = event.sender?.id;
      const messageText = event.message?.text || "";

      (async () => {
        const result = await processIncomingMessage({
          platform: "facebook",
          name: senderId,
          phone: senderId,
          email: "",
          messageText,
          channelMessageId: null,
        });

        if (result?.autoReply) {
          await sendFacebookMessage(senderId, result.autoReply);
        }
      })();
    }

    // ================= WHATSAPP =================
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.statuses) return;

      const messages = value?.messages;
      if (!messages || messages.length === 0) return;

      const message = messages[0];
      const phone = message?.from;
      const messageId = message?.id || null;

      const botNumber = value?.metadata?.display_phone_number;
      if (phone === botNumber) return;

      let messageText = "";
      if (message.type === "text") {
        messageText = message.text?.body || "";
      } else if (message.type === "button") {
        messageText = message.button?.text || "";
      } else if (message.type === "interactive") {
        messageText =
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          "";
      }

      if (!messageText) return;

      // 🔥 PROCESS IN BACKGROUND: Don't await here so the 200 OK stays sent
      processIncomingMessage({
        platform: "whatsapp",
        name: value.contacts?.[0]?.profile?.name || phone,
        phone,
        email: "",
        messageText,
        channelMessageId: messageId,
      });
      // NOTE: Removed sendMetaWhatsAppMessage call here because 
      // communicationController already handles the sending.
    }

  } catch (error) {
    console.error("❌ Meta Webhook Error:", error);
  }
};

// ================= TWILIO =================
export const handleWhatsAppWebhook = async (req, res) => {
  res.status(200).send("OK"); // Respond immediately

  try {
    const messageText = req.body.Body?.trim() || "";
    const from = req.body.From || "";
    const messageSid = req.body.MessageSid || null;

    if (!from) return;

    const phone = from.replace("whatsapp:", "").trim();

    processIncomingMessage({
      platform: "whatsapp",
      name: phone,
      phone,
      email: "",
      messageText,
      channelMessageId: messageSid,
    });

  } catch (error) {
    console.error("❌ Twilio Error:", error);
  }
};

// ================= WEB =================
export const handleWebChatWebhook = async (req, res) => {
  try {
    const { name, phone, messageText } = req.body || {};

    if (!phone || !messageText) {
      return res.status(400).json({
        success: false,
        message: "Phone and messageText required",
      });
    }

    // Acknowledge web request
    res.json({ success: true, message: "Message processed" });

    processIncomingMessage({
      platform: "web",
      name: name || phone,
      phone,
      email: "",
      messageText,
      channelMessageId: null,
    });

  } catch (error) {
    console.error("❌ Web Error:", error);
  }
};