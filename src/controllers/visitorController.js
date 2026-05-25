const Notification = require("../models/Notification");
const VisitorRequest = require("../models/VisitorRequest");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeVisitorRequest } = require("../utils/serializers");

const listVisitors = asyncHandler(async (req, res) => {
  const query = { building: req.user.building };
  if (req.user.role !== "admin") query.tenant = req.user._id;

  const visitors = await VisitorRequest.find(query)
    .populate("tenant")
    .sort({ createdAt: -1 })
    .limit(80);

  res.json({ success: true, visitors: visitors.map(serializeVisitorRequest) });
});

const createVisitor = asyncHandler(async (req, res) => {
  const { visitorName, phone, purpose, visitDate } = req.body;
  if (!visitorName || !visitorName.trim()) {
    res.status(400);
    throw new Error("Visitor name is required");
  }

  const visitor = await VisitorRequest.create({
    building: req.user.building,
    tenant: req.user._id,
    visitorName: visitorName.trim(),
    phone: phone || "",
    purpose: purpose || "",
    visitDate: visitDate || "",
    status: "pending"
  });

  await Notification.create({
    building: req.user.building,
    title: "Visitor approval requested",
    message: `${req.user.name} requested visitor approval for ${visitor.visitorName}.`,
    type: "visitor"
  });
  await visitor.populate("tenant");

  res.status(201).json({ success: true, visitor: serializeVisitorRequest(visitor) });
});

const updateVisitor = asyncHandler(async (req, res) => {
  const visitor = await VisitorRequest.findOne({ _id: req.params.id, building: req.user.building }).populate("tenant");
  if (!visitor) {
    res.status(404);
    throw new Error("Visitor request was not found");
  }

  visitor.status = req.body.status || visitor.status;
  await visitor.save();

  await Notification.create({
    building: req.user.building,
    user: visitor.tenant._id,
    title: "Visitor request updated",
    message: `${visitor.visitorName} is ${visitor.status}.`,
    type: "visitor"
  });

  res.json({ success: true, visitor: serializeVisitorRequest(visitor) });
});

module.exports = { listVisitors, createVisitor, updateVisitor };
