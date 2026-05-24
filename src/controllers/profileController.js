const Building = require("../models/Building");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeBuilding, serializeUser } = require("../utils/serializers");

const updateProfile = asyncHandler(async (req, res) => {
  ["name", "phone", "email", "profilePhoto"].forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();

  const building = await Building.findById(req.user.building);
  if (req.user.role === "admin" && building) {
    if (req.body.buildingName !== undefined) building.name = req.body.buildingName;
    ["emergencyContact", "securityGuard", "electrician", "plumber", "profilePhoto"].forEach((field) => {
      if (req.body[field] !== undefined) building[field] = req.body[field];
    });
    await building.save();
  }

  res.json({
    success: true,
    user: serializeUser(req.user),
    building: serializeBuilding(await Building.findById(req.user.building).populate("admin"))
  });
});

module.exports = { updateProfile };
