const Notice = require("../models/Notice");
const Notification = require("../models/Notification");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeNotice } = require("../utils/serializers");

const NOTICE_RETENTION_MS = 1000 * 60 * 60 * 24 * 7;

const listNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find({
    building: req.user.building,
    createdAt: { $gte: new Date(Date.now() - NOTICE_RETENTION_MS) }
  }).sort({ createdAt: -1 });
  res.json({ success: true, notices: notices.map(serializeNotice) });
});

const createNotice = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("Title and description are required");
  }

  const notice = await Notice.create({
    building: req.user.building,
    title,
    description,
    date: req.body.date,
    createdBy: req.user._id
  });

  const tenants = await User.find({
    building: req.user.building,
    role: "tenant",
    status: { $in: ["approved", "Active"] }
  }).select("_id");
  if (tenants.length > 0) {
    await Notification.insertMany(
      tenants.map((tenant) => ({
        building: req.user.building,
        user: tenant._id,
        title: title.trim(),
        message: description.trim(),
        type: "announcement"
      }))
    );
  }

  res.status(201).json({ success: true, notice: serializeNotice(notice) });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndDelete({
    _id: req.params.id,
    building: req.user.building
  });

  if (!notice) {
    res.status(404);
    throw new Error("Notice was not found");
  }

  res.json({ success: true, message: "Notice deleted" });
});

module.exports = { listNotices, createNotice, deleteNotice };
