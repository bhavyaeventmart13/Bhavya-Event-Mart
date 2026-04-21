import mongoose from "mongoose";

// ======================================
// Message Sub-Schema
// ======================================
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "admin", "bot"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    channelMessageId: {
      type: String,
      default: null,
      // Note: Index is handled at the parent level for uniqueness
    },
  },
  { _id: false }
);

// ======================================
// Conversation Schema
// ======================================
const conversationSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    // Multi-Channel Support
    channel: {
      type: String,
      enum: ["whatsapp", "instagram", "facebook", "email", "web"],
      default: "whatsapp",
    },

    // Messages Array
    messages: {
      type: [messageSchema],
      default: [],
    },

    // 🛡️ Extra Protection: Track last message text to prevent echo loops
    lastUserMessage: {
      type: String,
      default: "",
    },

    // CRM Flags
    needsManualSupport: {
      type: Boolean,
      default: false,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },

    // 🔥 USER DETAILS
    userDetails: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      city: { type: String, default: "" },
      lang: { type: String, default: "en" },
    },

    // 🔥 FLOW CONTROL
    currentStep: {
      type: String,
      enum: [
        "start",
        "choosing_language",
        "collecting_name",
        "collecting_city",
        "collecting_phone",
        "asking_product",
        "asking_preferences",
        "completed",
      ],
      default: "start",
    },

    // 🔥 PRODUCT TRACKING (Stores the URL of the last searched product)
    currentProduct: {
      type: String,
      default: "",
    },

    // 🔥 FLOW DATA
    flow: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ======================================
// INDEXES
// ======================================

// 1. Inbox Sorting (Descending)
conversationSchema.index({ updatedAt: -1 });

// 2. Lookup for Active Chats
conversationSchema.index({ leadId: 1, channel: 1 });

// 3. CRM Filters
conversationSchema.index({ unreadCount: -1 });
conversationSchema.index({ channel: 1, needsManualSupport: 1 });

// 🛡️ CRITICAL SAFETY: Unique Message ID Index
// This prevents the DB from ever accepting the same Meta message ID twice.
// Use 'sparse' to allow multiple 'null' channelMessageIds for manual/system messages.
conversationSchema.index(
  { "messages.channelMessageId": 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("Conversation", conversationSchema);