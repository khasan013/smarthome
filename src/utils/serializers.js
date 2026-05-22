function toId(value) {
  return value ? value.toString() : "";
}

function serializeUser(user) {
  return {
    id: toId(user._id),
    name: user.name,
    phone: user.phone,
    role: user.role,
    flatNo: user.flatNo || "",
    rent: user.rent || 0,
    status: user.status,
    building: toId(user.building)
  };
}

function serializeBuilding(building) {
  return {
    id: toId(building._id),
    name: building.name,
    code: building.code
  };
}

function serializeFlat(user) {
  return {
    id: toId(user._id),
    name: user.name,
    phone: user.phone,
    flatNo: user.flatNo || "",
    status: user.status,
    rent: user.rent || 0
  };
}

function serializeNotice(notice) {
  return {
    id: toId(notice._id),
    title: notice.title,
    description: notice.description,
    date: notice.date
  };
}

function serializeBill(bill) {
  return {
    id: toId(bill._id),
    month: bill.month,
    rent: bill.rent,
    serviceCharge: bill.serviceCharge,
    status: bill.status,
    flatNo: bill.flatNo,
    tenant: toId(bill.tenant),
    dueDate: bill.dueDate ? bill.dueDate.toISOString() : null
  };
}

function serializeComplaint(complaint) {
  return {
    id: toId(complaint._id),
    flatNo: complaint.flatNo,
    category: complaint.category,
    message: complaint.message,
    status: complaint.status,
    tenant: toId(complaint.tenant)
  };
}

module.exports = {
  serializeUser,
  serializeBuilding,
  serializeFlat,
  serializeNotice,
  serializeBill,
  serializeComplaint
};
