const Bill = require("../models/Bill");
const Complaint = require("../models/Complaint");
const Notice = require("../models/Notice");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const {
  serializeBill,
  serializeComplaint,
  serializeFlat,
  serializeNotice
} = require("../utils/serializers");

const getDashboard = asyncHandler(async (req, res) => {
  const building = req.user.building;

  if (req.user.role === "admin") {
    const [flats, bills, complaints, notices] = await Promise.all([
      User.find({ building, role: "tenant" }).sort({ flatNo: 1 }),
      Bill.find({ building }).sort({ createdAt: -1 }),
      Complaint.find({ building }).sort({ createdAt: -1 }),
      Notice.find({ building }).sort({ createdAt: -1 }).limit(5)
    ]);

    const totalRevenue = bills
      .filter((bill) => bill.status === "Paid")
      .reduce((sum, bill) => sum + bill.rent + bill.serviceCharge, 0);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        activeFlats: flats.filter((flat) => flat.status === "Active").length,
        pendingComplaints: complaints.filter((complaint) => complaint.status === "Pending").length,
        pendingBills: bills.filter((bill) => bill.status === "Unpaid").length
      },
      flats: flats.map(serializeFlat),
      bills: bills.map(serializeBill),
      complaints: complaints.map(serializeComplaint),
      notices: notices.map(serializeNotice)
    });
    return;
  }

  const [bills, complaints, notices] = await Promise.all([
    Bill.find({ building, tenant: req.user._id }).sort({ createdAt: -1 }),
    Complaint.find({ building, tenant: req.user._id }).sort({ createdAt: -1 }),
    Notice.find({ building }).sort({ createdAt: -1 }).limit(5)
  ]);

  const currentDue = bills
    .filter((bill) => bill.status !== "Paid")
    .reduce((sum, bill) => sum + bill.rent + bill.serviceCharge, 0);

  res.json({
    success: true,
    stats: {
      currentDue,
      unpaidBills: bills.filter((bill) => bill.status === "Unpaid").length,
      pendingComplaints: complaints.filter((complaint) => complaint.status === "Pending").length
    },
    bills: bills.map(serializeBill),
    complaints: complaints.map(serializeComplaint),
    notices: notices.map(serializeNotice)
  });
});

module.exports = { getDashboard };
