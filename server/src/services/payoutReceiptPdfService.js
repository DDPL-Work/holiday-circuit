import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { pdfMemoryCache } from "../utils/pdfCache.js";

const BRAND = Object.freeze({
  name: "Holiday Circuit",
  address: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
  email: "ops@holidaycircuit.com",
  phone: "+91 8851346665, +91 9971706003",
  website: "www.holidaycircuit.com",
  navy: "#0f766e",
  orange: "#0f766e",
  orangeLight: "#2dd4bf",
  orangeBright: "#14b8a6",
  border: "#d6dde7",
  labelBg: "#f2f4f7",
  text: "#0f172a",
  muted: "#64748b",
  surface: "#ffffff",
  success: "#0f766e",
});

const PAGE = Object.freeze({
  x: 34,
  y: 28,
  width: 527,
  bodyX: 50,
  bodyWidth: 495,
  footerY: 770,
});

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const ensureUploadsDir = () => ensureDir(path.join(process.cwd(), "uploads", "payoutreceipts"));

const ensureAgentReceiptUploadsDir = () =>
  ensureDir(path.join(process.cwd(), "uploads", "agentreceipts"));

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const numberToWords = (num) => {
  if (!num || Number.isNaN(Number(num))) return "";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let n = Math.floor(Number(num));
  if (n === 0) return "Zero Only";
  if (n > 999999999) return `${n} Only`;

  let str = "";
  const crore = Math.floor(n / 10000000);
  n -= crore * 10000000;
  const lakh = Math.floor(n / 100000);
  n -= lakh * 100000;
  const thousand = Math.floor(n / 1000);
  n -= thousand * 1000;
  const hundred = Math.floor(n / 100);
  n -= hundred * 100;

  const appendChunk = (value, label) => {
    if (!value) return;
    str += (value < 20 ? ones[value] : `${tens[Math.floor(value / 10)]}${value % 10 !== 0 ? `-${ones[value % 10]}` : ""}`) + ` ${label} `;
  };

  appendChunk(crore, "Crore");
  appendChunk(lakh, "Lakh");
  appendChunk(thousand, "Thousand");
  if (hundred > 0) str += `${ones[hundred]} Hundred `;
  if (n > 0) {
    if (str) str += "and ";
    str += n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? `-${ones[n % 10]}` : ""}`;
  }

  return `${str.trim()} Only`;
};

const resolveBrandLogoPath = () => {
  const candidates = [
    path.join(process.cwd(), "..", "client", "src", "assets", "logo img.png"),
    path.join(process.cwd(), "uploads", "1771279110850-logo img.png"),
    path.join(process.cwd(), "uploads", "1771278920287-logo img.png"),
    path.join(process.cwd(), "uploads", "1771278816234-logo img.png"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
};

const drawRect = (doc, x, y, width, height, fillColor, strokeColor = BRAND.border, lineWidth = 0.7) => {
  doc.save();
  doc.rect(x, y, width, height).fillAndStroke(fillColor, strokeColor);
  doc.restore();
  doc.lineWidth(lineWidth);
};

const drawFrame = (doc) => {
  doc.save();
  doc.rect(24, 20, 547, 802).lineWidth(1).strokeColor("#cfd6de").stroke();
  doc.restore();
};

const drawHeader = (doc, { logoPath = "", title = "Payment Receipt" }) => {
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 76, BRAND.navy, BRAND.navy);

  doc.save();
  doc.polygon([PAGE.x, PAGE.y], [PAGE.x + 92, PAGE.y], [PAGE.x + 70, PAGE.y + 76], [PAGE.x, PAGE.y + 76]).fill(BRAND.orangeBright);
  doc.polygon([PAGE.x + PAGE.width - 54, PAGE.y], [PAGE.x + PAGE.width, PAGE.y], [PAGE.x + PAGE.width - 30, PAGE.y + 76], [PAGE.x + PAGE.width - 84, PAGE.y + 76]).fill(BRAND.orangeBright);
  doc.restore();

  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.x + 36, PAGE.y + 8, { fit: [160, 60], align: "center", valign: "center" });
    } catch (error) {
      doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff").text("HC", PAGE.x + 36, PAGE.y + 24, {
        width: 160,
        align: "center",
      });
    }
  }

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#fff7ed").text(BRAND.name, PAGE.x + 210, PAGE.y + 30, {
    width: 280,
    align: "right",
  });

  doc.save();
  doc.rect(PAGE.x, 110, PAGE.width, 34).fill(BRAND.orange);
  doc.rect(PAGE.x, 110, PAGE.width, 2).fill(BRAND.orangeLight);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(13).fillColor("#ffffff").text(title, PAGE.x, 120, {
    width: PAGE.width,
    align: "center",
  });
};

const drawTableRow = (
  doc,
  {
    x,
    y,
    label,
    labelSub = "",
    value,
    width = PAGE.bodyWidth,
    labelWidth = 170,
    rowHeight = 28,
    valueFont = "Helvetica",
    valueSize = 9,
    valueColor = BRAND.text,
    labelColor = BRAND.text,
  },
) => {
  doc.save();
  doc.rect(x, y, width, rowHeight).lineWidth(0.7).strokeColor(BRAND.border).stroke();
  doc.rect(x, y, labelWidth, rowHeight).fillAndStroke(BRAND.labelBg, BRAND.border);
  doc.moveTo(x + labelWidth, y).lineTo(x + labelWidth, y + rowHeight).lineWidth(0.7).strokeColor(BRAND.border).stroke();
  doc.restore();

  if (labelSub) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(labelColor).text(label, x + 9, y + 6, {
      width: labelWidth - 16,
    });
    doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted).text(labelSub, x + 9, y + 17, {
      width: labelWidth - 16,
    });
  } else {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(labelColor).text(label, x + 9, y + 8, {
      width: labelWidth - 16,
    });
  }

  const valueY = rowHeight === 34 ? y + 11 : y + 8;

  if (value && value.includes(" | ")) {
    const parts = value.split(" | ");
    const prefixText = parts[0] + "  ";
    const suffixText = parts[1];

    doc.font(valueFont).fontSize(valueSize).fillColor(valueColor).text(prefixText, x + labelWidth + 9, valueY);
    
    // Measure prefix text width
    doc.font(valueFont).fontSize(valueSize);
    const prefixWidth = doc.widthOfString(prefixText);
    const circleX = x + labelWidth + 9 + prefixWidth + 5;
    const circleY = valueY + 4.5;

    // Draw checkmark icon (green circle with white tick mark)
    doc.save();
    doc.circle(circleX, circleY, 5.5).fill("#0f766e");
    doc.moveTo(circleX - 2.5, circleY)
       .lineTo(circleX - 0.8, circleY + 2.2)
       .lineTo(circleX + 2.8, circleY - 1.8)
       .lineWidth(1.2)
       .strokeColor("#ffffff")
       .stroke();
    doc.restore();

    // Draw suffix text after the checkmark icon
    doc.font(valueFont).fontSize(valueSize).fillColor(valueColor).text(suffixText, x + labelWidth + 9 + prefixWidth + 14, valueY, {
      width: width - labelWidth - 16 - prefixWidth - 14,
    });
  } else {
    doc.font(valueFont).fontSize(valueSize).fillColor(valueColor).text(value || "-", x + labelWidth + 9, valueY, {
      width: width - labelWidth - 16,
    });
  }
};

const buildGuestSummary = ({ adults = 0, children = 0 } = {}) => {
  const parts = [];
  if (Number(adults || 0) > 0) parts.push(`${Math.round(Number(adults || 0))} Adults`);
  if (Number(children || 0) > 0) parts.push(`${Math.round(Number(children || 0))} Children`);
  return parts.join(" | ") || "Traveler details not shared";
};

const buildTravelDateLabel = ({ startDate, endDate }) => {
  if (startDate && endDate) {
    return `From ${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`;
  }
  if (startDate) return formatDateLabel(startDate);
  return "-";
};

const drawFooter = (doc) => {
  drawRect(doc, PAGE.x, PAGE.footerY, PAGE.width, 24, BRAND.navy, BRAND.navy);
  doc.save();
  doc.polygon([PAGE.x, PAGE.footerY], [PAGE.x + 14, PAGE.footerY + 12], [PAGE.x, PAGE.footerY + 24]).fill(BRAND.orangeBright);
  doc.polygon([PAGE.x + PAGE.width, PAGE.footerY], [PAGE.x + PAGE.width - 14, PAGE.footerY + 12], [PAGE.x + PAGE.width, PAGE.footerY + 24]).fill(BRAND.orangeBright);
  doc.restore();

  doc.font("Helvetica").fontSize(7.3).fillColor("#ffffff").text(
    `${BRAND.phone} | ${BRAND.email} | ${BRAND.website}`,
    PAGE.bodyX,
    PAGE.footerY + 8,
    {
      width: PAGE.bodyWidth,
      align: "center",
    },
  );
};

const finalizePdf = async (doc, stream) => {
  doc.end();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

export const generatePayoutReceiptPdf = async ({
  invoiceNumber = "",
  queryCode = "",
  payoutDate = null,
  payoutReference = "",
  payoutAmount = 0,
  payoutBank = "",
  currency = "INR",
  destination = "",
  dmcName = "",
  adults = 0,
  children = 0,
  startDate = null,
  endDate = null,
  generatedAt = new Date(),
  trackerPayments = [],
  cumulativePaid = 0,
  remainingAmount = 0,
  totalAmount = 0,
}) => {
  // [LOCAL] Disk write disabled — no files saved to uploads/payoutreceipts/
  // const dirPath = ensureUploadsDir();
  const sanitizedInvoiceNumber = String(invoiceNumber || queryCode || "receipt").replace(/[^a-zA-Z0-9]/g, "");
  const fileName = `DmcPayoutReceipt${sanitizedInvoiceNumber}.pdf`;
  // const absoluteFilePath = path.join(dirPath, fileName); // [LOCAL] disk write disabled
  const absoluteFilePath = "";
  const publicFilePath = `/uploads/payoutreceipts/${fileName}`;

  const doc = new PDFDocument({ margin: 34, size: "A4" });
  
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      pdfMemoryCache.set(publicFilePath, buffer);
      setTimeout(() => pdfMemoryCache.delete(publicFilePath), 15 * 60 * 1000);
      resolve();
    });
    doc.on("error", reject);
  });

  drawFrame(doc);
  drawHeader(doc, { logoPath: resolveBrandLogoPath(), title: "Payment Receipt" });

  let y = 152;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Payment Date", value: formatDateLabel(payoutDate) });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Reference ID", value: payoutReference || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Bank Name", value: payoutBank || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Paid By", value: "Holiday Circuit Finance Team" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Credit Account", value: dmcName || "-" });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Amount Paid",
    value: formatCurrency(payoutAmount, currency),
    valueFont: "Helvetica-Bold",
  });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Amount In Words",
    value: `${currency}: ${numberToWords(payoutAmount)}`,
    rowHeight: 34,
  });
  y += 42;

  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Trip ID", value: queryCode || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Invoice Number", value: invoiceNumber || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Destination", value: destination || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Guest Details", value: buildGuestSummary({ adults, children }) });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Travel Date", value: buildTravelDateLabel({ startDate, endDate }) });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Transfer Bank",
    value: payoutBank || "-",
  });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Payment Status",
    labelSub: "(including this payment)",
    value:
      Math.max(0, remainingAmount || 0) > 0
        ? `${formatCurrency(cumulativePaid || payoutAmount, currency)} / ${formatCurrency(totalAmount || cumulativePaid || payoutAmount, currency)} | Partial Payment Clear`
        : `${formatCurrency(cumulativePaid || payoutAmount, currency)} / ${formatCurrency(totalAmount || cumulativePaid || payoutAmount, currency)} | Payment Clear`,
    rowHeight: 34,
    valueFont: "Helvetica-Bold",
    valueColor: BRAND.success,
  });

  y += 54;

  if (Array.isArray(trackerPayments) && trackerPayments.length > 0) {
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND.text).text("Installment Payment Statement", PAGE.bodyX, y);
    y += 16;

    drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, 24, BRAND.labelBg, BRAND.border);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569");
    doc.text("Installment No.", PAGE.bodyX + 10, y + 8, { width: 85 });
    doc.text("Payment Date", PAGE.bodyX + 100, y + 8, { width: 85 });
    doc.text("Bank Name", PAGE.bodyX + 190, y + 8, { width: 95 });
    doc.text("Reference ID", PAGE.bodyX + 290, y + 8, { width: 95 });
    doc.text("Amount Paid", PAGE.bodyX + 390, y + 8, { width: 95, align: "right" });
    y += 24;

    trackerPayments.forEach((entry, idx) => {
      drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, 22, BRAND.surface, BRAND.border);
      const entryAmt = Math.round(Number(entry?.amount || 0));
      const entryDateVal = entry?.paymentDate || entry?.createdAt || "";
      const entryDateLabel = formatDateLabel(entryDateVal);
      const entryBankName = String(entry?.bankName || payoutBank || "-").trim();
      const entryReference = String(entry?.utrNumber || payoutReference || "-").trim();

      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(`Installment ${idx + 1}`, PAGE.bodyX + 10, y + 7, { width: 85 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(entryDateLabel, PAGE.bodyX + 100, y + 7, { width: 85 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(entryBankName, PAGE.bodyX + 190, y + 7, { width: 95 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(entryReference, PAGE.bodyX + 290, y + 7, { width: 95 });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(formatCurrency(entryAmt, currency), PAGE.bodyX + 390, y + 7, {
        width: 95,
        align: "right",
      });
      y += 22;
    });

    drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, 24, BRAND.labelBg, BRAND.border);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text("Total Amount Paid", PAGE.bodyX + 10, y + 8);
    doc.text(formatCurrency(cumulativePaid || payoutAmount, currency), PAGE.bodyX + 390, y + 8, {
      width: 95,
      align: "right",
    });
    y += 38;
  }

  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted).text(
    `Receipt Generated On ${new Date(generatedAt).toLocaleString("en-GB")}`,
    PAGE.bodyX,
    y,
    {
      width: PAGE.bodyWidth,
      align: "right",
    },
  );

  doc.font("Helvetica").fontSize(8).fillColor(BRAND.muted).text(
    "This is a computer generated payment receipt. No signature or stamp is required.",
    PAGE.bodyX,
    y + 18,
    {
      width: PAGE.bodyWidth,
      align: "center",
    },
  );

  drawFooter(doc);
  // await finalizePdf(doc, stream); // [LOCAL] disk write disabled
  doc.end();
  await pdfPromise;

  return {
    fileName,
    absoluteFilePath,
    publicFilePath,
  };
};

export const generateAgentPaymentReceiptPdf = async ({
  invoiceNumber = "",
  queryCode = "",
  paymentDate = null,
  paymentReference = "",
  bankName = "",
  amountPaid = 0,
  totalAmount = 0,
  cumulativePaid = 0,
  remainingAmount = 0,
  paidBy = "",
  destination = "",
  guestDetails = "",
  startDate = null,
  endDate = null,
  generatedAt = new Date(),
  receiptTitle = "Payment Receipt",
  trackerPayments = [],
}) => {
  // [LOCAL] Disk write disabled — no files saved to uploads/agentreceipts/
  // const dirPath = ensureAgentReceiptUploadsDir();
  const sanitizedInvoiceNumber = String(invoiceNumber || queryCode || "receipt").replace(/[^a-zA-Z0-9]/g, "");
  const uniqueSuffix = new Date(generatedAt || new Date()).getTime();
  const fileName = `AgentPaymentReceipt${sanitizedInvoiceNumber}${uniqueSuffix}.pdf`;
  // const absoluteFilePath = path.join(dirPath, fileName); // [LOCAL] disk write disabled
  const absoluteFilePath = "";
  const publicFilePath = `/uploads/agentreceipts/${fileName}`;

  const doc = new PDFDocument({ margin: 34, size: "A4" });
  
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      pdfMemoryCache.set(publicFilePath, buffer);
      setTimeout(() => pdfMemoryCache.delete(publicFilePath), 15 * 60 * 1000);
      resolve();
    });
    doc.on("error", reject);
  });

  drawFrame(doc);
  drawHeader(doc, { logoPath: resolveBrandLogoPath(), title: receiptTitle || "Payment Receipt" });

  let y = 152;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Payment Date", value: formatDateLabel(paymentDate) });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Reference ID", value: paymentReference || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Bank Name", value: bankName || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Paid By", value: paidBy || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Credit Account", value: "Leela Travels" });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Amount Paid",
    value: formatCurrency(amountPaid, "INR"),
    valueFont: "Helvetica-Bold",
  });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Amount In Words",
    value: `INR: ${numberToWords(amountPaid)}`,
    rowHeight: 34,
  });
  y += 42;

  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Trip ID", value: queryCode || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Destination", value: destination || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Guest Details", value: guestDetails || "-" });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Travel Date",
    value: buildTravelDateLabel({ startDate, endDate }),
    valueFont: "Helvetica-Bold",
  });
  y += 28;
  drawTableRow(doc, {
    x: PAGE.bodyX,
    y,
    label: "Payment Status",
    labelSub: "(including this payment)",
    value:
      Math.max(0, remainingAmount || 0) > 0
        ? `${formatCurrency(cumulativePaid || amountPaid, "INR")} / ${formatCurrency(totalAmount || cumulativePaid || amountPaid, "INR")} | Partial Payment Clear`
        : `${formatCurrency(cumulativePaid || amountPaid, "INR")} / ${formatCurrency(totalAmount || cumulativePaid || amountPaid, "INR")} | Payment Clear`,
    rowHeight: 34,
    valueFont: "Helvetica-Bold",
    valueColor: BRAND.success,
  });

  y += 54;

  if (Math.max(0, remainingAmount || 0) === 0 && Array.isArray(trackerPayments) && trackerPayments.length > 0) {
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND.text).text("Installment Payment Statement", PAGE.bodyX, y);
    y += 16;

    drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, 24, BRAND.labelBg, BRAND.border);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569");
    doc.text("Installment No.", PAGE.bodyX + 10, y + 8, { width: 85 });
    doc.text("Payment Date", PAGE.bodyX + 100, y + 8, { width: 85 });
    doc.text("Bank Name", PAGE.bodyX + 190, y + 8, { width: 95 });
    doc.text("Reference ID", PAGE.bodyX + 290, y + 8, { width: 95 });
    doc.text("Amount Paid", PAGE.bodyX + 390, y + 8, { width: 95, align: "right" });
    y += 24;

    trackerPayments.forEach((entry, idx) => {
      drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, 22, BRAND.surface, BRAND.border);
      const entryAmt = Math.round(Number(entry?.amount || 0));
      const entryDateVal = entry?.paymentDate || entry?.createdAt || "";
      const entryDateLabel = entry?.displayDate || formatDateLabel(entryDateVal);
      const entryBankName = String(entry?.bankName || bankName || "-").trim();
      const entryReference = String(entry?.utrNumber || paymentReference || "-").trim();

      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(`Installment ${idx + 1}`, PAGE.bodyX + 10, y + 7, { width: 85 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(entryDateLabel, PAGE.bodyX + 100, y + 7, { width: 85 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(entryBankName, PAGE.bodyX + 190, y + 7, { width: 95 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(entryReference, PAGE.bodyX + 290, y + 7, { width: 95 });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(formatCurrency(entryAmt, "INR"), PAGE.bodyX + 390, y + 7, {
        width: 95,
        align: "right",
      });
      y += 22;
    });

    drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, 24, BRAND.labelBg, BRAND.border);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text("Total Amount Paid", PAGE.bodyX + 10, y + 8);
    doc.text(formatCurrency(cumulativePaid || amountPaid, "INR"), PAGE.bodyX + 390, y + 8, {
      width: 95,
      align: "right",
    });
    y += 38;
  }

  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted).text(
    `Receipt Generated On ${new Date(generatedAt).toLocaleString("en-GB")}`,
    PAGE.bodyX,
    y,
    {
      width: PAGE.bodyWidth,
      align: "right",
    },
  );

  doc.font("Helvetica").fontSize(8).fillColor(BRAND.muted).text(
    "This is a computer generated document. No signature/stamp required.",
    PAGE.bodyX,
    y + 18,
    {
      width: PAGE.bodyWidth,
      align: "center",
    },
  );

  drawFooter(doc);
  // await finalizePdf(doc, stream); // [LOCAL] disk write disabled
  doc.end();
  await pdfPromise;

  return {
    fileName,
    absoluteFilePath,
    publicFilePath,
  };
};
