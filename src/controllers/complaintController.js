const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeComplaint } = require("../utils/serializers");

const CLOSED_STATUSES = ["Resolved", "Rejected", "Completed"];
const STATUS_ALIASES = {
  Open: "Pending",
  "Under Review": "Assigned",
  "In Progress": "Assigned"
};

function normalizeStatus(status) {
  return STATUS_ALIASES[status] || status || "Pending";
}

const listComplaints = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 15), 1), 50);
  const skip = (page - 1) * limit;
  const query = { building: req.user.building };

  if (req.user.role !== "admin") {
    query.tenant = req.user._id;
  } else {
    query.status = { $nin: CLOSED_STATUSES };
  }

  const [complaints, total, resolvedHistory] = await Promise.all([
    Complaint.find(query)
      .populate("tenant")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(query),
    req.user.role === "admin"
      ? Complaint.find({ building: req.user.building, status: { $in: CLOSED_STATUSES } })
          .populate("tenant")
          .sort({ createdAt: -1 })
          .limit(25)
          .lean()
      : Promise.resolve([])
  ]);
  const serialized = complaints.map(serializeComplaint);
  res.json({
    success: true,
    complaints: serialized,
    resolvedHistory: resolvedHistory.map(serializeComplaint),
    page,
    limit,
    total,
    hasMore: skip + serialized.length < total
  });
});

const createComplaint = asyncHandler(async (req, res) => {
  const { category, message, title, priority, photoUrl } = req.body;
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
    title: title || category,
    message,
    priority: priority || "Medium",
    photoUrl: photoUrl || "",
    status: normalizeStatus(req.body.status),
    timeline: [{ status: "Pending", comment: "Complaint submitted" }]
  });

  await Notification.create({
    building: req.user.building,
    title: "New complaint submitted",
    message: `${flatNo}: ${title || category}`,
    type: "complaint"
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
    complaint.status = normalizeStatus(req.body.status);
  }
  if (req.body.adminComment !== undefined) complaint.adminComment = req.body.adminComment;
  if (req.body.assignedAction !== undefined) complaint.assignedAction = req.body.assignedAction;
  complaint.timeline.push({
    status: complaint.status,
    comment: req.body.adminComment || req.body.assignedAction || "Complaint updated"
  });

  await complaint.save();

  if (complaint.tenant) {
    await Notification.create({
      building: req.user.building,
      user: complaint.tenant,
      title: "Complaint updated",
      message: `${complaint.title || complaint.category} is now ${complaint.status}.`,
      type: "complaint"
    });
  }
  res.json({ success: true, complaint: serializeComplaint(complaint) });
});

module.exports = { listComplaints, createComplaint, updateComplaint };
