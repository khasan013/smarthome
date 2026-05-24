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

const CLOSED_COMPLAINT_STATUSES = ["Resolved", "Rejected", "Completed"];
function billTotal(bill) {
  return (bill.rent || 0) + (bill.serviceCharge || 0) + (bill.electricity || 0) + (bill.gas || 0) + (bill.water || 0) + (bill.otherCosts || 0);
}
function isPaid(bill) {
  return bill.status === "PAID" || bill.status === "Paid";
}

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
    bookings: bookings.map(serializeBooking)
  });
});

function escapePdfText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdf(lines) {
  const content = [
    "BT",
    "/F1 20 Tf",
    "50 790 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 11 Tf",
    ...lines.slice(1).flatMap((line) => ["0 -22 Td", `(${escapePdfText(line)}) Tj`]),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

const downloadMonthlyReport = asyncHandler(async (req, res) => {
  const building = req.user.building;
  const [flats, bills] = await Promise.all([
    User.find({ building, role: "tenant" }),
    Bill.find({ building }).sort({ createdAt: -1 })
  ]);
  const paidBills = bills.filter(isPaid);
  const unpaidBills = bills.filter((bill) => !isPaid(bill));
  const collected = paidBills.reduce((sum, bill) => sum + billTotal(bill), 0);
  const pending = unpaidBills.reduce((sum, bill) => sum + billTotal(bill), 0);
  const pdf = createSimplePdf([
    "Smart Building Monthly Report",
    `Collected amount: Tk ${collected}`,
    `Pending amount: Tk ${pending}`,
    `Paid users: ${new Set(paidBills.map((bill) => bill.tenant.toString())).size}`,
    `Unpaid users: ${new Set(unpaidBills.map((bill) => bill.tenant.toString())).size}`,
    `Bills count: ${bills.length}`,
    `Residents: ${flats.length}`,
    `Generated: ${new Date().toISOString()}`
  ]);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=\"monthly-report.pdf\"");
  res.send(pdf);
});

module.exports = { getDashboard, downloadMonthlyReport };
