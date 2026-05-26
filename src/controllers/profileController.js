const Building = require("../models/Building");
const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeBuilding, serializeUser } = require("../utils/serializers");

const updateProfile = asyncHandler(async (req, res) => {
  ["name", "phone", "email", "profilePhoto"].forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();

  const building = await Building.findById(req.user.building);
  let buildingChanged = false;
  if (req.user.role === "admin" && building) {
    if (req.body.buildingName !== undefined && building.name !== req.body.buildingName) {
      building.name = req.body.buildingName;
      buildingChanged = true;
    }
    ["emergencyContact", "securityGuard", "electrician", "plumber", "profilePhoto"].forEach((field) => {
      if (req.body[field] !== undefined && building[field] !== req.body[field]) {
        building[field] = req.body[field];
        buildingChanged = true;
      }
    });
    await building.save();
  }

  if (buildingChanged) {
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
          title: "Building information updated",
          message: "Admin updated building contact or profile information.",
          type: "announcement"
        }))
      );
    }
  }

  res.json({
    success: true,
    user: serializeUser(req.user),
    building: serializeBuilding(await Building.findById(req.user.building).populate("admin"))
  });
});

module.exports = { updateProfile };
