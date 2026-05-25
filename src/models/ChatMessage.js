const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

chatMessageSchema.index({ building: 1, createdAt: -1 });
chatMessageSchema.index({ building: 1, sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
