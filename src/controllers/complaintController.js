const Complaint = require("../models/Complaint");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeComplaint } = require("../utils/serializers");

const listComplaints = asyncHandler(async (req, res) => {
  const query = { building: req.user.building };

  if (req.user.role !== "admin") {
    query.tenant = req.user._id;
  }

  const complaints = await Complaint.find(query).sort({ createdAt: -1 });
  res.json({ success: true, complaints: complaints.map(serializeComplaint) });
});

const createComplaint = asyncHandler(async (req, res) => {
  const { category, message } = req.body;
  const flatNo = req.body.flatNo || req.user.flatNo;

  if (!flatNo || !category || !message) {
    res.status(400);
    throw new Error("Flat number, category and message are required");
  }

  const complaint = await Complaint.create({
    building: req.user.building,
    tenant: req.user.role === "tenant" ? req.user._id : req.body.tenant,
    flatNo,
    category,
    message,
    status: req.body.status || "Pending"
  });

  res.status(201).json({ success: true, complaint: serializeComplaint(complaint) });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    building: req.user.building
  });

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint was not found");
  }

  if (req.body.status !== undefined) {
    complaint.status = req.body.status;
  }

  await complaint.save();
  res.json({ success: true, complaint: serializeComplaint(complaint) });
});

module.exports = { listComplaints, createComplaint, updateComplaint };
