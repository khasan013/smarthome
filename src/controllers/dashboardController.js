const Bill = require("../models/Bill");
const Complaint = require("../models/Complaint");
const Notice = require("../models/Notice");
const Notification = require("../models/Notification");
const Facility = require("../models/Facility");
const Booking = require("../models/Booking");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const {
  serializeBill,
  serializeComplaint,
  serializeFacility,
  serializeBooking,
  serializeFlat,
  serializeNotification,
  serializeNotice
} = require("../utils/serializers");

const getDashboard = asyncHandler(async (req, res) => {
  const building = req.user.building;

  if (req.user.role === "admin") {
    const [flats, bills, complaints, notices, notifications, facilities, bookings] = await Promise.all([
      User.find({ building, role: "tenant" }).sort({ flatNo: 1 }),
      Bill.find({ building }).sort({ createdAt: -1 }),
      Complaint.find({ building }).populate("tenant").sort({ createdAt: -1 }),
      Notice.find({ building }).sort({ createdAt: -1 }).limit(5),
      Notification.find({ building }).sort({ createdAt: -1 }).limit(20),
      Facility.find({ building }).sort({ name: 1 }),
      Booking.find({ building }).populate("facility").sort({ createdAt: -1 })
    ]);

    const totalRevenue = bills
      .filter((bill) => bill.status === "Paid")
      .reduce((sum, bill) => sum + bill.rent + bill.serviceCharge, 0);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        activeFlats: flats.filter((flat) => flat.status === "approved" || flat.status === "Active").length,
        pendingApprovals: flats.filter((flat) => flat.status === "pending" || flat.status === "Pending").length,
        pendingComplaints: complaints.filter((complaint) => complaint.status === "Open" || complaint.status === "Pending").length,
        pendingBills: bills.filter((bill) => bill.status === "UNPAID" || bill.status === "Unpaid").length
      },
      flats: flats.map(serializeFlat),
      bills: bills.map(serializeBill),
      complaints: complaints.map(serializeComplaint),
      notices: notices.map(serializeNotice),
      notifications: notifications.map(serializeNotification),
      facilities: facilities.map(serializeFacility),
      bookings: bookings.map(serializeBooking)
    });
    return;
  }

  const [bills, complaints, notices, notifications, facilities, bookings] = await Promise.all([
    Bill.find({ building, tenant: req.user._id }).sort({ createdAt: -1 }),
    Complaint.find({ building, tenant: req.user._id }).populate("tenant").sort({ createdAt: -1 }),
    Notice.find({ building }).sort({ createdAt: -1 }).limit(5),
    Notification.find({ building, $or: [{ user: req.user._id }, { user: null }] }).sort({ createdAt: -1 }).limit(20),
    Facility.find({ building }).sort({ name: 1 }),
    Booking.find({ building, tenant: req.user._id }).populate("facility").sort({ createdAt: -1 })
  ]);

  const currentDue = bills
    .filter((bill) => bill.status !== "Paid")
    .reduce((sum, bill) => sum + bill.rent + bill.serviceCharge, 0);

  res.json({
    success: true,
    stats: {
      currentDue,
      unpaidBills: bills.filter((bill) => bill.status === "UNPAID" || bill.status === "Unpaid").length,
      pendingComplaints: complaints.filter((complaint) => complaint.status === "Open" || complaint.status === "Pending").length
    },
    bills: bills.map(serializeBill),
    complaints: complaints.map(serializeComplaint),
    notices: notices.map(serializeNotice),
    notifications: notifications.map(serializeNotification),
    facilities: facilities.map(serializeFacility),
    bookings: bookings.map(serializeBooking)
  });
});

module.exports = { getDashboard };
