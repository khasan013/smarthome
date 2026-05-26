const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Notification = require("../models/Notification");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeBooking, serializeFacility } = require("../utils/serializers");

async function ensureDefaultFacilities(building) {
  const count = await Facility.countDocuments({ building });
  if (count > 0) return;
  await Facility.insertMany(
    ["Community Hall", "Roof", "Parking", "Generator", "Pool"].map((name) => ({
      building,
      name,
      description: `${name} booking`,
      price: name === "Parking" ? 1000 : 0
    }))
  );
}

const listFacilities = asyncHandler(async (req, res) => {
  await ensureDefaultFacilities(req.user.building);
  const facilities = await Facility.find({ building: req.user.building, active: true }).sort({ name: 1 });
  const bookings = await Booking.find({ building: req.user.building })
    .populate("facility")
    .sort({ createdAt: -1 });
  res.json({
    success: true,
    facilities: facilities.map(serializeFacility),
    bookings: bookings.map(serializeBooking)
  });
});

const createFacility = asyncHandler(async (req, res) => {
  const { name, description, price, imageUrl } = req.body;
  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Facility name is required");
  }

  const facility = await Facility.create({
    building: req.user.building,
    name: name.trim(),
    description: description || "",
    price: Number(price) || 0,
    imageUrl: imageUrl || "",
    active: true
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
        title: "Facility updated",
        message: `${facility.name} is now available.`,
        type: "announcement"
      }))
    );
  }

  res.status(201).json({ success: true, facility: serializeFacility(facility) });
});

const createBooking = asyncHandler(async (req, res) => {
  const { facilityId, date, note } = req.body;
  if (!facilityId || !date) {
    res.status(400);
    throw new Error("Facility and date are required");
  }

  const booking = await Booking.create({
    building: req.user.building,
    facility: facilityId,
    tenant: req.user._id,
    date,
    note,
    status: "pending"
  });
  await Notification.create({
    building: req.user.building,
    title: "Facility booking requested",
    message: `${req.user.name} requested a facility booking.`,
    type: "booking"
  });
  await booking.populate("facility");
  res.status(201).json({ success: true, booking: serializeBooking(booking) });
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, building: req.user.building });
  if (!booking) {
    res.status(404);
    throw new Error("Booking was not found");
  }
  booking.status = req.body.status || booking.status;
  await booking.save();
  await Notification.create({
    building: req.user.building,
    user: booking.tenant,
    title: "Facility booking updated",
    message: `Your booking is ${booking.status}.`,
    type: "booking"
  });
  await booking.populate("facility");
  res.json({ success: true, booking: serializeBooking(booking) });
});

module.exports = { listFacilities, createFacility, createBooking, updateBooking };
