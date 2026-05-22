const Bill = require("../models/Bill");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { serializeBill } = require("../utils/serializers");

async function findTenantForBill(req) {
  if (req.body.tenant || req.body.tenantId || req.body.flatId) {
    return User.findOne({
      _id: req.body.tenant || req.body.tenantId || req.body.flatId,
      building: req.user.building,
      role: "tenant"
    });
  }

  if (req.body.flatNo) {
    return User.findOne({
      flatNo: req.body.flatNo,
      building: req.user.building,
      role: "tenant"
    });
  }

  return null;
}

const listBills = asyncHandler(async (req, res) => {
  const query = { building: req.user.building };

  if (req.user.role !== "admin") {
    query.tenant = req.user._id;
  } else if (req.query.flatNo) {
    query.flatNo = req.query.flatNo;
  }

  const bills = await Bill.find(query).sort({ createdAt: -1 });
  res.json({ success: true, bills: bills.map(serializeBill) });
});

const createBill = asyncHandler(async (req, res) => {
  const { month } = req.body;
  const tenant = await findTenantForBill(req);

  if (!tenant) {
    res.status(404);
    throw new Error("Tenant/flat was not found");
  }

  if (!month) {
    res.status(400);
    throw new Error("Bill month is required");
  }

  const bill = await Bill.create({
    building: req.user.building,
    tenant: tenant._id,
    flatNo: tenant.flatNo,
    month,
    rent: Number(req.body.rent ?? tenant.rent ?? 0),
    serviceCharge: Number(req.body.serviceCharge || 0),
    status: req.body.status || "Unpaid",
    dueDate: req.body.dueDate
  });

  res.status(201).json({ success: true, bill: serializeBill(bill) });
});

const updateBill = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, building: req.user.building };
  if (req.user.role !== "admin") {
    query.tenant = req.user._id;
  }

  const bill = await Bill.findOne(query);
  if (!bill) {
    res.status(404);
    throw new Error("Bill was not found");
  }

  if (req.user.role === "admin") {
    ["month", "status", "dueDate"].forEach((field) => {
      if (req.body[field] !== undefined) {
        bill[field] = req.body[field];
      }
    });

    if (req.body.rent !== undefined) {
      bill.rent = Number(req.body.rent);
    }
    if (req.body.serviceCharge !== undefined) {
      bill.serviceCharge = Number(req.body.serviceCharge);
    }
  } else if (req.body.status && req.body.status !== "Paid") {
    res.status(403);
    throw new Error("Tenants can only mark their own bill as paid");
  }

  if (req.body.status === "Paid") {
    bill.status = "Paid";
    bill.paidAt = new Date();
  }

  await bill.save();
  res.json({ success: true, bill: serializeBill(bill) });
});

module.exports = { listBills, createBill, updateBill };
