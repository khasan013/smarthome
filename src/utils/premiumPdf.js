function escapePdfText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(value) {
  return `Tk ${Number(value || 0).toLocaleString("en-US")}`;
}

function buildPdf(commands) {
  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
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

function text(cmds, value, x, y, size = 10, bold = false, color = "0 0 0") {
  cmds.push(
    `${color} rg`,
    "BT",
    `/${bold ? "F2" : "F1"} ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(value)}) Tj`,
    "ET"
  );
}

function rect(cmds, x, y, w, h, color, strokeColor = null) {
  cmds.push(`${color} rg`, `${x} ${y} ${w} ${h} re f`);
  if (strokeColor) {
    cmds.push(`${strokeColor} RG`, `${x} ${y} ${w} ${h} re S`);
  }
}

function line(cmds, x1, y1, x2, y2, color = "0.78 0.78 0.78", width = 1) {
  cmds.push(`${color} RG`, `${width} w`, `${x1} ${y1} m`, `${x2} ${y2} l S`);
}

function drawQr(cmds, seed, x, y) {
  rect(cmds, x, y, 76, 76, "0.96 0.96 0.96", "0.82 0.82 0.82");
  const value = String(seed || "SMART-BUILDING");
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const code = value.charCodeAt((row * 9 + col) % value.length);
      if ((code + row + col) % 3 === 0 || row < 2 && col < 2 || row > 6 && col < 2 || row < 2 && col > 6) {
        rect(cmds, x + 7 + col * 7, y + 7 + row * 7, 5, 5, "0.05 0.05 0.05");
      }
    }
  }
}

function header(cmds, title, subtitle, status) {
  rect(cmds, 0, 760, 595, 82, "0.04 0.05 0.05");
  rect(cmds, 36, 785, 44, 34, "0.84 1 0");
  text(cmds, "SB", 50, 796, 14, true, "0.04 0.05 0.05");
  text(cmds, title, 96, 804, 22, true, "1 1 1");
  text(cmds, subtitle, 96, 782, 10, false, "0.78 0.78 0.78");
  rect(cmds, 468, 790, 84, 24, status === "PAID" ? "0.84 1 0" : "1 0.82 0.22");
  text(cmds, status || "DIGITAL", 486, 798, 10, true, "0.04 0.05 0.05");
}

function summaryCard(cmds, label, value, x, y, w = 156) {
  rect(cmds, x, y, w, 56, "0.96 0.97 0.95", "0.86 0.88 0.82");
  text(cmds, label, x + 14, y + 35, 9, false, "0.34 0.36 0.34");
  text(cmds, value, x + 14, y + 16, 15, true, "0.04 0.05 0.05");
}

function table(cmds, rows, x, y, w) {
  rect(cmds, x, y - 24, w, 24, "0.08 0.09 0.08");
  text(cmds, "Description", x + 12, y - 16, 10, true, "1 1 1");
  text(cmds, "Amount", x + w - 82, y - 16, 10, true, "1 1 1");
  rows.forEach((row, index) => {
    const rowY = y - 48 - index * 28;
    rect(cmds, x, rowY, w, 28, index % 2 === 0 ? "0.99 0.99 0.98" : "0.94 0.95 0.93");
    text(cmds, row[0], x + 12, rowY + 10, 10, false, "0.12 0.13 0.12");
    text(cmds, row[1], x + w - 82, rowY + 10, 10, true, "0.12 0.13 0.12");
  });
  return y - 48 - rows.length * 28;
}

function compactTable(cmds, title, rows, x, y, w) {
  text(cmds, title, x, y, 12, true, "0.04 0.05 0.05");
  rect(cmds, x, y - 26, w, 22, "0.08 0.09 0.08");
  text(cmds, "Flat / Resident", x + 10, y - 18, 8, true, "1 1 1");
  text(cmds, "Amount", x + w - 64, y - 18, 8, true, "1 1 1");
  const safeRows = rows.length ? rows : [{ flatNo: "-", resident: "No records", amount: 0 }];
  safeRows.slice(0, 8).forEach((row, index) => {
    const rowY = y - 48 - index * 20;
    rect(cmds, x, rowY, w, 20, index % 2 === 0 ? "0.99 0.99 0.98" : "0.94 0.95 0.93");
    const label = `${row.flatNo || "-"} / ${row.resident || "Resident"}`.slice(0, 34);
    text(cmds, label, x + 10, rowY + 7, 8, false, "0.12 0.13 0.12");
    text(cmds, money(row.amount), x + w - 64, rowY + 7, 8, true, "0.12 0.13 0.12");
  });
}

function createInvoicePdf({ buildingName, invoiceId, residentName, flatNo, meterNumber, month, rows, total, status }) {
  const cmds = [];
  header(cmds, "Smart Building Manager Invoice", `Invoice ${invoiceId}`, status);
  text(cmds, buildingName || "Smart Building", 36, 726, 18, true, "0.04 0.05 0.05");
  text(cmds, `Resident: ${residentName || ""}`, 36, 704, 11, false, "0.28 0.30 0.28");
  text(cmds, `Flat: ${flatNo || ""}    Meter: ${meterNumber || "Not set"}    Month: ${month || ""}`, 36, 688, 11, false, "0.28 0.30 0.28");
  summaryCard(cmds, "Invoice total", money(total), 36, 610);
  summaryCard(cmds, "Payment status", status || "UNPAID", 216, 610);
  summaryCard(cmds, "Invoice ID", invoiceId, 396, 610);
  const endY = table(cmds, rows, 36, 568, 350);
  rect(cmds, 408, 472, 132, 132, "0.98 0.98 0.96", "0.82 0.82 0.82");
  drawQr(cmds, invoiceId, 436, 500);
  text(cmds, "Scan / verify invoice", 428, 486, 9, false, "0.34 0.36 0.34");
  line(cmds, 36, endY - 24, 540, endY - 24);
  text(cmds, "Total payable", 350, endY - 52, 12, false, "0.28 0.30 0.28");
  text(cmds, money(total), 446, endY - 52, 18, true, "0.04 0.05 0.05");
  line(cmds, 36, 112, 190, 112);
  line(cmds, 386, 112, 540, 112);
  text(cmds, "Resident signature", 58, 92, 9, false, "0.34 0.36 0.34");
  text(cmds, "Authorized signature", 408, 92, 9, false, "0.34 0.36 0.34");
  text(cmds, "Generated digitally by Smart Building Manager", 36, 42, 9, false, "0.45 0.45 0.45");
  return buildPdf(cmds);
}

function createReportPdf({
  title,
  buildingName,
  houseCode,
  adminName,
  adminPhone,
  ownerName,
  ownerPhone,
  month,
  collected,
  pending,
  paidUsers,
  unpaidUsers,
  billsCount,
  residents,
  paidRows = [],
  unpaidRows = [],
  generatedAt
}) {
  const cmds = [];
  header(cmds, title || "Smart Building Monthly Report", `${buildingName || "Smart Building"} / House ${houseCode || "-"} / ${month || ""}`, "REPORT");
  text(cmds, buildingName || "Smart Building", 36, 726, 18, true, "0.04 0.05 0.05");
  text(cmds, `House code: ${houseCode || "-"}    Admin: ${adminName || "-"}    Month: ${month || "-"}`, 36, 706, 10, false, "0.28 0.30 0.28");
  summaryCard(cmds, "Collected", money(collected), 36, 636);
  summaryCard(cmds, "Pending", money(pending), 216, 636);
  summaryCard(cmds, "Residents", String(residents || 0), 396, 636);
  const rows = [
    ["Paid users", String(paidUsers || 0)],
    ["Unpaid users", String(unpaidUsers || 0)],
    ["Bills count", String(billsCount || 0)],
    ["Total collection", money(collected)],
    ["Generated", String(generatedAt || new Date().toISOString()).slice(0, 19)]
  ];
  table(cmds, rows, 36, 576, 504);
  compactTable(cmds, "Paid users", paidRows, 36, 378, 240);
  compactTable(cmds, "Unpaid users", unpaidRows, 300, 378, 240);
  rect(cmds, 36, 142, 504, 54, "0.05 0.06 0.06");
  text(cmds, "Financial summary", 58, 174, 14, true, "1 1 1");
  text(cmds, `Collected ${money(collected)} and pending ${money(pending)} for ${residents || 0} residents.`, 58, 154, 9, false, "0.78 0.78 0.78");
  line(cmds, 36, 92, 210, 92);
  line(cmds, 342, 92, 540, 92);
  text(cmds, "Prepared by", 36, 112, 9, true, "0.04 0.05 0.05");
  text(cmds, adminName || "-", 36, 72, 10, false, "0.18 0.20 0.18");
  text(cmds, adminPhone || "-", 36, 58, 9, false, "0.34 0.36 0.34");
  text(cmds, String(generatedAt || new Date().toISOString()).slice(0, 10), 36, 44, 9, false, "0.34 0.36 0.34");
  text(cmds, "Approved by", 342, 112, 9, true, "0.04 0.05 0.05");
  text(cmds, ownerName || "-", 342, 72, 10, false, "0.18 0.20 0.18");
  text(cmds, ownerPhone || "-", 342, 58, 9, false, "0.34 0.36 0.34");
  text(cmds, "Signature", 450, 44, 9, false, "0.34 0.36 0.34");
  text(cmds, "Generated digitally by Smart Building Manager", 36, 20, 8, false, "0.45 0.45 0.45");
  return buildPdf(cmds);
}

module.exports = { createInvoicePdf, createReportPdf, money };
