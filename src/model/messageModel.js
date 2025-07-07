const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
    },
    file: {
      type: String, // <-- Object emas, String bo‘lishi kerak
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["text", "image", "audio", "video"],
      default: "text"
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Messages", messageSchema);