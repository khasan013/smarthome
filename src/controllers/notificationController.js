const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");

const markNotificationsRead = asyncHandler(async (req, res) => {
  const query = {
    building: req.user.building,
    read: false,
    $or: [{ user: req.user._id }, { user: null }]
  };

  if (req.user.role === "admin") {
    delete query.$or;
  }

  const result = await Notification.updateMany(query, { $set: { read: true } });
  res.json({ success: true, modifiedCount: result.modifiedCount || 0 });
});

module.exports = { markNotificationsRead };
