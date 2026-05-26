const Bill = require("../models/Bill");
const Complaint = require("../models/Complaint");
const Notice = require("../models/Notice");
const Notification = require("../models/Notification");
const Facility = require("../models/Facility");
const Booking = require("../models/Booking");
const VisitorRequest = require("../models/VisitorRequest");
const User = require("../models/User");
const Building = require("../models/Building");
const asyncHandler = require("../middleware/asyncHandler");
const { createReportPdf } = require("../utils/premiumPdf");
const {
  serializeBill,
  serializeComplaint,
  serializeFacility,
  serializeBooking,
  serializeFlat,
  serializeNotification,
  serializeNotice,
  serializeVisitorRequest
} = require("../utils/serializers");

const CLOSED_COMPLAINT_STATUSES = ["Resolved", "Rejected", "Completed"];
const NOTICE_RETENTION_MS = 1000 * 60 * 60 * 24 * 7;
const NOTIFICATION_RETENTION_MS = 1000 * 60 * 60 * 24 * 15;
function billTotal(bill) {
  return (bill.rent || 0) + (bill.serviceCharge || 0) + (bill.electricity || 0) + (bill.gas || 0) + (bill.water || 0) + (bill.otherCosts || 0);
}
function isPaid(bill) {
  return bill.status === "PAID" || bill.status === "Paid";
}

const getDashboard = asyncHandler(async (req, res) => {
  const building = req.user.building;
  const noticeCutoff = new Date(Date.now() - NOTICE_RETENTION_MS);
  const notificationCutoff = new Date(Date.now() - NOTIFICATION_RETENTION_MS);

  if (req.user.role === "admin") {
    const [flats, bills, complaints, notices, notifications, facilities, bookings, visitors] = await Promise.all([
      User.find({ building, role: "tenant" }).sort({ flatNo: 1 }),
      Bill.find({ building }).sort({ createdAt: -1 }),
      Complaint.find({ building }).populate("tenant").sort({ createdAt: -1 }),
      Notice.find({ building, createdAt: { $gte: noticeCutoff } }).sort({ createdAt: -1 }).limit(5),
      Notification.find({ building, createdAt: { $gte: notificationCutoff } }).sort({ createdAt: -1 }).limit(20),
      Facility.find({ building }).sort({ name: 1 }),
      Booking.find({ building }).populate("facility").sort({ createdAt: -1 }),
      VisitorRequest.find({ building }).populate("tenant").sort({ createdAt: -1 }).limit(20)
    ]);

    const activeComplaints = complaints.filter((complaint) => !CLOSED_COMPLAINT_STATUSES.includes(complaint.status));
    const resolvedHistory = complaints.filter((complaint) => CLOSED_COMPLAINT_STATUSES.includes(complaint.status));
    const totalRevenue = bills.filter(isPaid).reduce((sum, bill) => sum + billTotal(bill), 0);
    const pendingAmount = bills.filter((bill) => !isPaid(bill)).reduce((sum, bill) => sum + billTotal(bill), 0);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        pendingAmount,
        paidUsers: new Set(bills.filter(isPaid).map((bill) => bill.tenant.toString())).size,
        unpaidUsers: new Set(bills.filter((bill) => !isPaid(bill)).map((bill) => bill.tenant.toString())).size,
        billsCount: bills.length,
        activeFlats: flats.filter((flat) => flat.status === "approved" || flat.status === "Active").length,
        pendingApprovals: flats.filter((flat) => flat.status === "pending" || flat.status === "Pending").length,
        pendingComplaints: activeComplaints.length,
        pendingBills: bills.filter((bill) => bill.status === "UNPAID" || bill.status === "Unpaid").length
      },
      flats: flats.map(serializeFlat),
      bills: bills.map(serializeBill),
      complaints: activeComplaints.map(serializeComplaint),
      resolvedHistory: resolvedHistory.map(serializeComplaint),
      notices: notices.map(serializeNotice),
      notifications: notifications.map(serializeNotification),
      facilities: facilities.map(serializeFacility),
      bookings: bookings.map(serializeBooking),
      visitors: visitors.map(serializeVisitorRequest)
    });
    return;
  }

  const [bills, complaints, notices, notifications, facilities, bookings, visitors] = await Promise.all([
    Bill.find({ building, tenant: req.user._id }).sort({ createdAt: -1 }),
    Complaint.find({ building, tenant: req.user._id }).populate("tenant").sort({ createdAt: -1 }),
    Notice.find({ building, createdAt: { $gte: noticeCutoff } }).sort({ createdAt: -1 }).limit(5),
    Notification.find({ building, createdAt: { $gte: notificationCutoff }, $or: [{ user: req.user._id }, { user: null }] }).sort({ createdAt: -1 }).limit(20),
    Facility.find({ building }).sort({ name: 1 }),
    Booking.find({ building, tenant: req.user._id }).populate("facility").sort({ createdAt: -1 }),
    VisitorRequest.find({ building, tenant: req.user._id }).populate("tenant").sort({ createdAt: -1 }).limit(20)
  ]);

  const currentDue = bills.filter((bill) => !isPaid(bill)).reduce((sum, bill) => sum + billTotal(bill), 0);

  res.json({
    success: true,
    stats: {
      currentDue,
      unpaidBills: bills.filter((bill) => bill.status === "UNPAID" || bill.status === "Unpaid").length,
      pendingComplaints: complaints.filter((complaint) => !CLOSED_COMPLAINT_STATUSES.includes(complaint.status)).length
    },
    bills: bills.map(serializeBill),
    complaints: complaints.map(serializeComplaint),
    notices: notices.map(serializeNotice),
    notifications: notifications.map(serializeNotification),
    facilities: facilities.map(serializeFacility),
    bookings: bookings.map(serializeBooking),
    visitors: visitors.map(serializeVisitorRequest)
  });
});

const downloadMonthlyReport = asyncHandler(async (req, res) => {
  const building = req.user.building;
  const [buildingDoc, flats, bills] = await Promise.all([
    Building.findById(building).populate("admin"),
    User.find({ building, role: "tenant" }),
    Bill.find({ building }).populate("tenant").sort({ createdAt: -1 })
  ]);
  const paidBills = bills.filter(isPaid);
  const unpaidBills = bills.filter((bill) => !isPaid(bill));
  const collected = paidBills.reduce((sum, bill) => sum + billTotal(bill), 0);
  const pending = unpaidBills.reduce((sum, bill) => sum + billTotal(bill), 0);
  const pdf = createReportPdf({
    title: "Smart Building Monthly Report",
    buildingName: buildingDoc?.name,
    houseCode: buildingDoc?.code,
    adminName: req.user.name,
    adminPhone: req.user.phone,
    ownerName: buildingDoc?.admin?.name || req.user.name,
    ownerPhone: buildingDoc?.admin?.phone || req.user.phone,
    month: req.query.month || new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    collected,
    pending,
    paidUsers: new Set(paidBills.map((bill) => bill.tenant.toString())).size,
    unpaidUsers: new Set(unpaidBills.map((bill) => bill.tenant.toString())).size,
    billsCount: bills.length,
    residents: flats.length,
    paidRows: paidBills.slice(0, 8).map((bill) => ({
      flatNo: bill.flatNo,
      resident: bill.tenant?.name,
      amount: billTotal(bill)
    })),
    unpaidRows: unpaidBills.slice(0, 8).map((bill) => ({
      flatNo: bill.flatNo,
      resident: bill.tenant?.name,
      amount: billTotal(bill)
    })),
    generatedAt: new Date().toISOString()
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=\"monthly-report.pdf\"");
  res.send(pdf);
});

module.exports = { getDashboard, downloadMonthlyReport };
