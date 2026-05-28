import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const BRAND = Object.freeze({
  name: "Holiday Circuit",
  address: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
  email: "ops@holidaycircuit.com",
  phone: "+91 8851346665, +91 9971706003",
  website: "www.holidaycircuit.com",
  navy: "#151d31",
  orange: "#d95508",
  orangeLight: "#f08b4c",
  orangeBright: "#ff7a00",
  border: "#cfd6de",
  labelBg: "#f2f4f7",
  text: "#0f172a",
  muted: "#64748b",
  surface: "#ffffff",
  success: "#15803d",
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

const ensureVouchersDir = () => ensureDir(path.join(process.cwd(), "uploads", "vouchers"));

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

const formatTravelerBreakup = ({ adults = 0, children = 0, travelerSummary = "", passengers = "" } = {}) => {
  const safeAdults = Number(adults || 0);
  const safeChildren = Number(children || 0);
  const parts = [];

  if (safeAdults > 0) parts.push(`${safeAdults} Adult${safeAdults > 1 ? "s" : ""}`);
  if (safeChildren > 0) parts.push(`${safeChildren} Child${safeChildren > 1 ? "ren" : ""}`);

  if (parts.length) return parts.join(", ");
  if (travelerSummary) return travelerSummary;
  return passengers || "-";
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

const drawHeader = (doc, { logoPath = "", title = "Travel Voucher" }) => {
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 76, BRAND.navy, BRAND.navy);

  doc.save();
  doc.polygon([PAGE.x, PAGE.y], [PAGE.x + 92, PAGE.y], [PAGE.x + 70, PAGE.y + 76], [PAGE.x, PAGE.y + 76]).fill(BRAND.orangeBright);
  doc.polygon([PAGE.x + PAGE.width - 54, PAGE.y], [PAGE.x + PAGE.width, PAGE.y], [PAGE.x + PAGE.width - 30, PAGE.y + 76], [PAGE.x + PAGE.width - 84, PAGE.y + 76]).fill(BRAND.orangeBright);
  doc.restore();

  drawRect(doc, PAGE.x + 40, PAGE.y + 16, 132, 46, BRAND.surface, BRAND.orange, 1);
  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.x + 48, PAGE.y + 22, { fit: [116, 34], align: "center", valign: "center" });
    } catch (error) {
      doc.font("Helvetica-Bold").fontSize(18).fillColor(BRAND.orange).text("HC", PAGE.x + 40, PAGE.y + 27, {
        width: 132,
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

  doc.font("Helvetica-Bold").fontSize(9).fillColor(labelColor).text(label, x + 9, y + 8, {
    width: labelWidth - 16,
  });
  doc.font(valueFont).fontSize(valueSize).fillColor(valueColor).text(value || "-", x + labelWidth + 9, y + 8, {
    width: width - labelWidth - 16,
  });
};

const drawSectionBar = (doc, y, title) => {
  doc.save();
  doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 22).fill(BRAND.navy);
  doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 1.5).fill(BRAND.orange);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff").text(title, PAGE.bodyX, y + 7, {
    width: PAGE.bodyWidth,
    align: "center",
    characterSpacing: 0.8,
  });
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

export const generateVoucherPdf = async (voucherDetails) => {
  const dirPath = ensureVouchersDir();
  const safeVoucherNumber = String(voucherDetails.voucherNumber || voucherDetails.query || "voucher").replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `Travel_Voucher_${safeVoucherNumber}.pdf`;
  const absoluteFilePath = path.join(dirPath, fileName);
  const publicFilePath = `/uploads/vouchers/${fileName}`;

  const doc = new PDFDocument({ margin: 34, size: "A4" });
  const stream = fs.createWriteStream(absoluteFilePath);
  doc.pipe(stream);

  drawFrame(doc);
  drawHeader(doc, { logoPath: resolveBrandLogoPath(), title: "Travel Voucher" });

  let y = 152;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Voucher Number", value: voucherDetails.voucherNumber || voucherDetails.query || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Destination", value: voucherDetails.destination || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Duration", value: voucherDetails.duration || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Passengers", value: voucherDetails.passengers || "-" });
  
  y += 42;
  
  const passengerBreakup = formatTravelerBreakup({
    adults: voucherDetails.adults,
    children: voucherDetails.children,
    travelerSummary: voucherDetails.travelerSummary,
    passengers: voucherDetails.passengers,
  });

  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Guest Details", value: voucherDetails.name || voucherDetails.guestName || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Pax Details", value: passengerBreakup });
  y += 28;
  const travelDateVal = voucherDetails.travelDate || voucherDetails.date || null;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Travel Date", value: formatDateLabel(travelDateVal) });

  y += 42;

  drawSectionBar(doc, y, "SERVICE DETAILS");
  y += 30;

  // Draw Services Table Header
  doc.save();
  doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 22).fillAndStroke(BRAND.labelBg, BRAND.border);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text);
  doc.text("Type", PAGE.bodyX + 10, y + 7, { width: 80 });
  doc.text("Service Description", PAGE.bodyX + 100, y + 7, { width: 260 });
  doc.text("DMC Confirmation", PAGE.bodyX + 370, y + 7, { width: 110, align: "right" });

  y += 22;

  (voucherDetails.services || []).forEach((service) => {
    const type = service.type || "Service";
    const title = service.title || service.name || "Service details missing";
    const confirmation = service.confirmation || "Pending";
    const status = service.status || "";

    const displayType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    const displayConfirmation = status ? `${confirmation} (${status})` : confirmation;

    doc.save();
    doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 26).lineWidth(0.7).strokeColor(BRAND.border).stroke();
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.muted);
    doc.text(displayType, PAGE.bodyX + 10, y + 8, { width: 80 });

    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.text);
    doc.text(title, PAGE.bodyX + 100, y + 8, { width: 260 });

    const isConfirmed = confirmation && confirmation.toLowerCase() !== "pending" && confirmation.toLowerCase() !== "not available";
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(isConfirmed ? BRAND.success : BRAND.orange);
    doc.text(displayConfirmation, PAGE.bodyX + 370, y + 8, { width: 110, align: "right" });

    y += 26;
  });

  y += 24;
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.muted).text(
    "This is a computer generated document. No signature/stamp required.",
    PAGE.bodyX,
    y,
    { width: PAGE.bodyWidth, align: "center" }
  );

  drawFooter(doc);

  await finalizePdf(doc, stream);

  return {
    absoluteFilePath,
    publicFilePath,
    fileName,
  };
};
