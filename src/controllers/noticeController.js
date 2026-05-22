const Notice = require("../models/Notice");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeNotice } = require("../utils/serializers");

const listNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find({ building: req.user.building }).sort({ createdAt: -1 });
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
