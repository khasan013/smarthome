const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeFlat } = require("../utils/serializers");

const listFlats = asyncHandler(async (req, res) => {
  const flats = await User.find({ building: req.user.building, role: "tenant" }).sort({ flatNo: 1 });
  res.json({ success: true, flats: flats.map(serializeFlat) });
});

const createFlat = asyncHandler(async (req, res) => {
  const { name, phone, flatNo, password } = req.body;
  const rent = Number(req.body.rent || 0);

  if (!name || !phone || !flatNo || !password) {
    res.status(400);
    throw new Error("Name, phone, flat number and password are required");
  }

  const duplicate = await User.findOne({
    building: req.user.building,
    $or: [{ phone }, { flatNo }]
  });

  if (duplicate) {
    res.status(409);
    throw new Error("Phone or flat number is already registered");
  }

  const flat = await User.create({
    name,
    phone,
    flatNo,
    rent,
    password,
    role: "tenant",
    building: req.user.building,
    status: req.body.status || "Active"
  });

  res.status(201).json({ success: true, flat: serializeFlat(flat) });
});

const updateFlat = asyncHandler(async (req, res) => {
  const flat = await User.findOne({
    _id: req.params.id,
    building: req.user.building,
    role: "tenant"
  });

  if (!flat) {
    res.status(404);
    throw new Error("Flat was not found");
  }

  ["name", "phone", "flatNo", "status"].forEach((field) => {
    if (req.body[field] !== undefined) {
      flat[field] = req.body[field];
    }
  });

  if (req.body.rent !== undefined) {
    flat.rent = Number(req.body.rent);
  }

  await flat.save();
  res.json({ success: true, flat: serializeFlat(flat) });
});

const deleteFlat = asyncHandler(async (req, res) => {
  const flat = await User.findOneAndDelete({
    _id: req.params.id,
    building: req.user.building,
    role: "tenant"
  });

  if (!flat) {
    res.status(404);
    throw new Error("Flat was not found");
  }

  res.json({ success: true, message: "Flat deleted" });
});

module.exports = { listFlats, createFlat, updateFlat, deleteFlat };
