const ChatMessage = require("../models/ChatMessage");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeChatMessage } = require("../utils/serializers");

const listMessages = asyncHandler(async (req, res) => {
  const query = { building: req.user.building };
  if (req.user.role !== "admin") {
    query.$or = [{ sender: req.user._id }, { recipient: req.user._id }, { recipient: null }];
  }

  const messages = await ChatMessage.find(query)
    .populate("sender")
    .populate("recipient")
    .sort({ createdAt: -1 })
    .limit(80);

  res.json({ success: true, messages: messages.reverse().map(serializeChatMessage) });
});

const createMessage = asyncHandler(async (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) {
    res.status(400);
    throw new Error("Message is required");
  }

  const message = await ChatMessage.create({
    building: req.user.building,
    sender: req.user._id,
    recipient: req.user.role === "admin" ? req.body.recipient || null : null,
    text
  });
  await message.populate("sender");
  await message.populate("recipient");

  res.status(201).json({ success: true, message: serializeChatMessage(message) });
});

module.exports = { listMessages, createMessage };
