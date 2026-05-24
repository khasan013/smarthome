function toId(value) {
  return value ? value.toString() : "";
}

function serializeUser(user) {
  return {
    id: toId(user._id),
    name: user.name,
    phone: user.phone,
    email: user.email || "",
    role: user.role,
    flatNo: user.flatNo || "",
    rent: user.rent || 0,
    status: user.status,
    building: toId(user.building),
    profilePhoto: user.profilePhoto || "",
    joinDate: user.createdAt ? user.createdAt.toISOString() : null
  };
}

function serializeBuilding(building) {
  return {
    id: toId(building._id),
    name: building.name,
    code: building.code,
    emergencyContact: building.emergencyContact || "",
    securityGuard: building.securityGuard || "",
    electrician: building.electrician || "",
    plumber: building.plumber || "",
    profilePhoto: building.profilePhoto || ""
  };
}

function serializeFlat(user) {
  return {
    id: toId(user._id),
    name: user.name,
    phone: user.phone,
    email: user.email || "",
    flatNo: user.flatNo || "",
    status: user.status,
    rent: user.rent || 0,
    joinDate: user.createdAt ? user.createdAt.toISOString() : null
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
    electricity: bill.electricity || 0,
    gas: bill.gas || 0,
    water: bill.water || 0,
    otherCosts: bill.otherCosts || 0,
    total:
      (bill.rent || 0) +
      (bill.serviceCharge || 0) +
      (bill.electricity || 0) +
      (bill.gas || 0) +
      (bill.water || 0) +
      (bill.otherCosts || 0),
    status: bill.status,
    flatNo: bill.flatNo,
    tenant: toId(bill.tenant),
    invoiceId: bill.invoiceId || toId(bill._id),
    dueDate: bill.dueDate ? bill.dueDate.toISOString() : null
  };
}

function serializeComplaint(complaint) {
  return {
    id: toId(complaint._id),
    flatNo: complaint.flatNo,
    category: complaint.category,
    title: complaint.title || complaint.category,
    message: complaint.message,
    status: complaint.status,
    tenant: toId(complaint.tenant),
    photoUrl: complaint.photoUrl || "",
    priority: complaint.priority || "Medium",
    adminComment: complaint.adminComment || "",
    assignedAction: complaint.assignedAction || "",
    createdAt: complaint.createdAt ? complaint.createdAt.toISOString() : null,
    timeline: complaint.timeline || [],
    userName: complaint.tenant && complaint.tenant.name ? complaint.tenant.name : "",
    phone: complaint.tenant && complaint.tenant.phone ? complaint.tenant.phone : ""
  };
}

function serializeNotification(notification) {
  return {
    id: toId(notification._id),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt ? notification.createdAt.toISOString() : null
  };
}

function serializeFacility(facility) {
  return {
    id: toId(facility._id),
    name: facility.name,
    description: facility.description || "",
    price: facility.price || 0,
    imageUrl: facility.imageUrl || "",
    active: facility.active
  };
}

function serializeBooking(booking) {
  return {
    id: toId(booking._id),
    facility: booking.facility && booking.facility.name ? serializeFacility(booking.facility) : toId(booking.facility),
    tenant: toId(booking.tenant),
    date: booking.date,
    note: booking.note || "",
    status: booking.status,
    createdAt: booking.createdAt ? booking.createdAt.toISOString() : null
  };
}

module.exports = {
  serializeUser,
  serializeBuilding,
  serializeFlat,
  serializeNotice,
  serializeBill,
  serializeComplaint,
  serializeNotification,
  serializeFacility,
  serializeBooking
};
