const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeChatMessage } = require("../utils/serializers");

const listMessages = asyncHandler(async (req, res) => {
  const query = { building: req.user.building };
  const recipientId = req.query.recipient;

  if (req.user.role === "admin") {
    if (recipientId) {
      const resident = await User.findOne({ _id: recipientId, building: req.user.building, role: { $ne: "admin" } });
      if (!resident) {
        res.status(404);
        throw new Error("Resident not found");
      }
      query.$or = [
        { sender: req.user._id, recipient: resident._id },
        { sender: resident._id, recipient: req.user._id },
        { sender: resident._id, recipient: null }
      ];
    }
  } else {
    const admin = await User.findOne({ building: req.user.building, role: "admin" }).select("_id");
    query.$or = [
      { sender: req.user._id },
      { recipient: req.user._id }
    ];
    if (admin) {
      query.$or.push({ sender: admin._id, recipient: req.user._id });
    }
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
  const photoUrl = (req.body.photoUrl || "").trim();
  if (!text && !photoUrl) {
    res.status(400);
    throw new Error("Message or photo is required");
  }
  if (photoUrl && photoUrl.length > 5 * 1024 * 1024) {
    res.status(413);
    throw new Error("Photo is too large");
  }

  let recipient = null;
  if (req.user.role === "admin") {
    if (!req.body.recipient) {
      res.status(400);
      throw new Error("Resident recipient is required");
    }
    const resident = await User.findOne({ _id: req.body.recipient, building: req.user.building, role: { $ne: "admin" } });
    if (!resident) {
      res.status(404);
      throw new Error("Resident not found");
    }
    recipient = resident._id;
  } else {
    const admin = await User.findOne({ building: req.user.building, role: "admin" }).select("_id");
    recipient = admin ? admin._id : null;
  }

  const message = await ChatMessage.create({
    building: req.user.building,
    sender: req.user._id,
    recipient,
    text,
    photoUrl
  });
  await message.populate("sender");
  await message.populate("recipient");

  res.status(201).json({ success: true, message: serializeChatMessage(message) });
});

module.exports = { listMessages, createMessage };
