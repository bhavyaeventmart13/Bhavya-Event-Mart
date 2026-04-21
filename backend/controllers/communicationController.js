import Lead from "../models/Lead.js";
import Conversation from "../models/Conversation.js";
import { detectIntent, checkAutoReply, getProductFlow } from "../services/keywordService.js";
import { handleConversationFlow } from "../services/smartFlowService.js";
import { sendMetaWhatsAppMessage } from "../services/metaWhatsAppService.js";
import { io } from "../server.js";

// 🛡️ GLOBAL LOCK
const processingMessages = new Set();

// ======================================================
// PROCESS INCOMING MESSAGE
// ======================================================
export const processIncomingMessage = async ({
  platform,
  name,
  phone,
  email,
  messageText,
  channelMessageId,
}) => {
  try {
    const cleanMessage = typeof messageText === "string" ? messageText.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    if (!cleanPhone) {
      console.error("❌ Missing phone number");
      return { success: false, autoReply: null };
    }

    // 🛡️ MEMORY LOCK
    if (channelMessageId) {
      if (processingMessages.has(channelMessageId)) {
        console.log("🚫 Memory Blocked:", channelMessageId);
        return { success: true, autoReply: null };
      }
      processingMessages.add(channelMessageId);
      setTimeout(() => processingMessages.delete(channelMessageId), 60000);
    }

    // 1️⃣ LEAD
    let lead = await Lead.findOne({ phone: cleanPhone });
    if (!lead) {
      lead = await Lead.create({
        name: name || cleanPhone,
        phone: cleanPhone,
        email: email || "",
        platform,
        lastMessageAt: new Date(),
      });
    } else {
      lead.lastMessageAt = new Date();
      const intent = detectIntent(cleanMessage);
      lead.intent = intent;

      if (intent === "bulk_order") lead.leadScore += 50;
      else if (intent === "catalogue_request") lead.leadScore += 30;

      lead.leadScore = Math.min(lead.leadScore, 100);
      if (lead.leadScore >= 40) lead.priority = "high";

      await lead.save();
    }

    // 2️⃣ CONVERSATION
    let conversation = await Conversation.findOne({
      leadId: lead._id,
      channel: platform || "whatsapp",
    });

    if (!conversation) {
      conversation = await Conversation.create({
        leadId: lead._id,
        channel: platform || "whatsapp",
        currentStep: "start",
      });
    }

    // 🛡️ DB LOCK + SAVE MESSAGE
    if (channelMessageId) {
      const lockResult = await Conversation.updateOne(
        {
          _id: conversation._id,
          "messages.channelMessageId": { $ne: channelMessageId }
        },
        {
          $push: {
            messages: {
              sender: "user",
              text: cleanMessage,
              channelMessageId,
              timestamp: new Date()
            }
          },
          $set: { lastUserMessage: cleanMessage },
          $inc: { unreadCount: 1 }
        }
      );

      if (lockResult.modifiedCount === 0) {
        console.log("🚫 Duplicate message blocked");
        return { success: true, autoReply: null };
      }

    } else {
      // ✅ FIX: WEB / NO ID
      await Conversation.updateOne(
        { _id: conversation._id },
        {
          $push: {
            messages: {
              sender: "user",
              text: cleanMessage,
              timestamp: new Date()
            }
          },
          $set: { lastUserMessage: cleanMessage },
          $inc: { unreadCount: 1 }
        }
      );
    }

    conversation = await Conversation.findById(conversation._id);

    // 🤖 AI LOGIC
    let autoReply = null;
    const lang = conversation.userDetails?.lang || "en";

    autoReply = await handleConversationFlow(conversation, cleanMessage);

    if (!autoReply) autoReply = await checkAutoReply(cleanMessage);

    if (!autoReply) {
      const productSearch = await getProductFlow(cleanMessage);
      if (productSearch?.link && productSearch.link !== "nan") {
        autoReply = lang === "hi"
          ? `Searching for *${productSearch.name || cleanMessage}*?\n${productSearch.link}`
          : `Searching for *${productSearch.name || cleanMessage}*?\n${productSearch.link}`;
      }
    }

    // 🔄 SEND + SAVE BOT
    if (autoReply) {
      const replies = Array.isArray(autoReply) ? autoReply : [autoReply];

      for (const replyText of replies) {
        await sendMetaWhatsAppMessage(cleanPhone, replyText);

        conversation.messages.push({
          sender: "bot",
          text: replyText,
          timestamp: new Date()
        });
      }

      conversation.needsManualSupport = false;

    } else if (conversation.currentStep === "completed") {
      const fallback = lang === "hi"
        ? "Maaf kijiyega, mujhe samajh nahi aaya."
        : "Sorry, I didn’t understand that.";

      await sendMetaWhatsAppMessage(cleanPhone, fallback);

      conversation.messages.push({
        sender: "bot",
        text: fallback,
        timestamp: new Date()
      });

      conversation.needsManualSupport = true;
    } else {
      conversation.needsManualSupport = true;
    }

    await conversation.save();
    io.emit("newMessage");

    return { success: true, autoReply };

  } catch (error) {
    console.error("❌ Error:", error);
    return { success: false };
  }
};

// ======================================================
// ADMIN FUNCTIONS
// ======================================================
export const getAllConversations = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    // ✅ FIXED LIMIT
    const limit = parseInt(req.query.limit) || 50;

    const { status, unreadOnly, assignedTo, channel } = req.query;
    const skip = (page - 1) * limit;

    const leadFilter = {};
    if (status) leadFilter.status = status;
    if (assignedTo) leadFilter.assignedTo = assignedTo;

    const conversationFilter = {};
    if (status || assignedTo) {
      const leads = await Lead.find(leadFilter).select("_id").lean();
      conversationFilter.leadId = { $in: leads.map(l => l._id) };
    }

    if (channel) conversationFilter.channel = channel;
    if (unreadOnly === "true") conversationFilter.unreadCount = { $gt: 0 };

    const conversations = await Conversation.find(conversationFilter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("leadId")
      .lean();

    const total = await Conversation.countDocuments(conversationFilter);

    return res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      conversations: conversations.map(conv => ({
        _id: conv._id,
        lead: conv.leadId,
        unreadCount: conv.unreadCount,
        needsManualSupport: conv.needsManualSupport,
        channel: conv.channel,
        updatedAt: conv.updatedAt,
        lastMessage: conv.messages?.slice(-1)[0] || null,
      }))
    });

  } catch {
    return res.status(500).json({ success: false });
  }
};

// ======================================================
// SINGLE
// ======================================================
export const getSingleConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate("leadId");

    if (!conversation) return res.status(404).json({ success: false });

    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      await conversation.save();
    }

    res.json({ success: true, conversation });

  } catch {
    res.status(500).json({ success: false });
  }
};

// ======================================================
// ADMIN REPLY
// ======================================================
export const sendManualReply = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    const conversation = await Conversation.findById(conversationId).populate("leadId");
    const phone = conversation?.leadId?.phone;

    if (!phone) return res.status(400).json({ message: "No phone" });

    await sendMetaWhatsAppMessage(phone, message);

    conversation.messages.push({
      sender: "admin",
      text: message,
      timestamp: new Date()
    });

    conversation.needsManualSupport = false;
    conversation.unreadCount = 0;

    await conversation.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};
// ======================================================
// ASSIGN LEAD
// ======================================================
export const assignLeadToAdmin = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    await Lead.findByIdAndUpdate(conversation?.leadId, {
      assignedTo: userId,
      status: "assigned",
    });

    return res.json({ success: true, message: "Assigned" });

  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

// ======================================================
// CLOSE CONVERSATION
// ======================================================
export const closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    await Lead.findByIdAndUpdate(conversation?.leadId, {
      status: "closed",
    });

    conversation.needsManualSupport = false;
    await conversation.save();

    return res.json({ success: true, message: "Closed" });

  } catch (error) {
    return res.status(500).json({ success: false });
  }
};