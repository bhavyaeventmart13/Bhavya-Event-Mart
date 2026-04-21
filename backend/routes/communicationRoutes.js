import express from "express";

import {
  processIncomingMessage,
  sendManualReply,
  getAllConversations,
  getSingleConversation,
  assignLeadToAdmin,
  closeConversation,
} from "../controllers/communicationController.js";

import {
  getKeywords,
  createKeyword,
} from "../controllers/keywordController.js";

import { protect, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================
// Test Route (Postman / Development Only)
// ======================================

router.post("/test-message", async (req, res) => {
  try {
    const result = await processIncomingMessage(req.body);

    return res.json(result);
  } catch (error) {
    console.error("❌ Test Message Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// ======================================
// Admin Manual Reply
// ======================================

router.post(
  "/reply",
  protect,
  adminMiddleware,
  sendManualReply
);

// ======================================
// Get All Conversations (CRM Inbox)
// ======================================

router.get(
  "/conversations",
  protect,
  adminMiddleware,
  getAllConversations
);

// ======================================
// Get Single Conversation (Chat View)
// ======================================

router.get(
  "/conversations/:id",
  protect,
  adminMiddleware,
  getSingleConversation
);

// ======================================
// Assign Lead To Admin
// ======================================

router.patch(
  "/assign",
  protect,
  adminMiddleware,
  assignLeadToAdmin
);

// ======================================
// Close Conversation
// ======================================

router.patch(
  "/close",
  protect,
  adminMiddleware,
  closeConversation
);

// ======================================
// STEP 8 — Keyword Manager APIs
// ======================================

// Get all keywords (Admin Panel)
router.get("/keywords", getKeywords);

// Create new keyword auto reply
router.post(
  "/keywords",
  protect,
  adminMiddleware,
  createKeyword
);

// ======================================
// Export Router
// ======================================

export default router;