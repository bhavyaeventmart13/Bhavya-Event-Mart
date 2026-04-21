import express from "express";

import {
  handleMetaWebhook,
  handleWhatsAppWebhook,
  handleWebChatWebhook
} from "../controllers/webhookController.js";

const router = express.Router();


// ======================================
// META WEBHOOK
// Handles:
//   - WhatsApp Cloud API
//   - Instagram
//   - Facebook Messenger
// ======================================

router.get("/meta", handleMetaWebhook);   // verification
router.post("/meta", handleMetaWebhook);  // incoming events



// ======================================
// WhatsApp Webhook (Twilio Sandbox)
// ======================================

router.post("/whatsapp", handleWhatsAppWebhook);



// ======================================
// Website Chat Webhook
// ======================================

router.post("/webchat", handleWebChatWebhook);



// ======================================
// Export Router
// ======================================

export default router;