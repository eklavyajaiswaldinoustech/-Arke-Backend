const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    default: "Jewelry Shopping Assistant",
  },
  userPreferences: {
    budget: [Number],
    metalType: String,
    occasion: String,
    gemstone: String,
    style: String,
  },
  lastMessage: String,
  startedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
