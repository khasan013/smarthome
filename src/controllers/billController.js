const Bill = require("../models/Bill");
const Notification = require("../models/Notification");
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

  const bill = await Bill.findOneAndUpdate(
    {
      building: req.user.building,
      tenant: tenant._id,
      month
    },
    {
      building: req.user.building,
      tenant: tenant._id,
      flatNo: tenant.flatNo,
      month,
      rent: Number(req.body.rent ?? tenant.rent ?? 0),
      serviceCharge: Number(req.body.serviceCharge || 0),
      electricity: Number(req.body.electricity || 0),
      gas: Number(req.body.gas || 0),
      water: Number(req.body.water || 0),
      otherCosts: Number(req.body.otherCosts || 0),
      invoiceId: req.body.invoiceId || `INV-${tenant.flatNo}-${month}`.replace(/\s+/g, "-").toUpperCase(),
      status: req.body.status || "UNPAID",
      dueDate: req.body.dueDate
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  await Notification.create({
    building: req.user.building,
    user: tenant._id,
    title: "Bill generated",
    message: `${month} bill is ready for flat ${tenant.flatNo}.`,
    type: "bill"
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
    bill.status = "PAID";
    bill.paidAt = new Date();
  } else if (req.body.status === "PAID") {
    bill.status = "PAID";
    bill.paidAt = new Date();
  }

  await bill.save();

  if (bill.status === "PAID") {
    await Notification.create({
      building: req.user.building,
      user: bill.tenant,
      title: "Payment received",
      message: `${bill.month} bill marked as paid.`,
      type: "payment"
    });
  }
  res.json({ success: true, bill: serializeBill(bill) });
});

const downloadBill = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, building: req.user.building };
  if (req.user.role !== "admin") query.tenant = req.user._id;

  const bill = await Bill.findOne(query).populate("tenant");
  if (!bill) {
    res.status(404);
    throw new Error("Bill was not found");
  }

  const total =
    bill.rent + bill.serviceCharge + bill.electricity + bill.gas + bill.water + bill.otherCosts;
  const html = `
Smart Building Manager Invoice
Invoice: ${bill.invoiceId || bill._id}
Flat: ${bill.flatNo}
Resident: ${bill.tenant ? bill.tenant.name : ""}
Month: ${bill.month}
Rent: ${bill.rent}
Electricity: ${bill.electricity}
Gas: ${bill.gas}
Water: ${bill.water}
Service charge: ${bill.serviceCharge}
Other costs: ${bill.otherCosts}
Total: ${total}
Status: ${bill.status}
QR: ${bill.invoiceId || bill._id}
`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${bill.invoiceId || bill._id}.pdf"`);
  res.send(Buffer.from(html));
});

module.exports = { listBills, createBill, updateBill, downloadBill };
