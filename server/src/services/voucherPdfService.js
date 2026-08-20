import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import sharp from "sharp";

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

const loadBrandImage = async (source = "") => {
  const value = String(source || "").trim();
  if (!value) return null;

  const toPdfImage = async (buffer) => {
    try {
      return await sharp(buffer).png().toBuffer();
    } catch {
      return buffer;
    }
  };

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value)) {
    try {
      return await toPdfImage(Buffer.from(value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/i, ""), "base64"));
    } catch {
      return null;
    }
  }

  if (/^https:\/\//i.test(value) && typeof fetch === "function") {
    try {
      const response = await fetch(value, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      return await toPdfImage(Buffer.from(await response.arrayBuffer()));
    } catch {
      return null;
    }
  }

  const localPath = value.startsWith("/") ? path.join(process.cwd(), value.slice(1)) : value;
  return fs.existsSync(localPath) ? toPdfImage(await fs.promises.readFile(localPath)) : null;
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

const drawAgentHeader = (doc, branding = {}, logo = null) => {
  // Keep the PDF branding dimensions in sync with the email voucher header.
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 94, BRAND.surface, BRAND.border, 0.8);
  if (logo) {
    try {
      doc.image(logo, PAGE.x + 16, PAGE.y + 12, { fit: [100, 70], align: "center", valign: "center" });
    } catch {}
  }

  const detailsX = logo ? PAGE.x + 128 : PAGE.x + 22;
  const detailsWidth = PAGE.x + PAGE.width - detailsX - 18;
  const name = String(branding.name || "Travel Voucher");
  doc.font("Helvetica-Bold").fontSize(20).fillColor(BRAND.text).text(name, detailsX, PAGE.y + 17, { width: detailsWidth });
  doc.font("Helvetica").fontSize(8).fillColor("#475569").text(String(branding.address || ""), detailsX, PAGE.y + 46, {
    width: detailsWidth,
    lineGap: 1,
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#3252C3").text(
    `Phone: ${branding.phone || "-"}${branding.email ? `  •  Email: ${branding.email}` : ""}`,
    detailsX,
    PAGE.y + 74,
    { width: detailsWidth },
  );
  doc.save();
  doc.moveTo(PAGE.x, PAGE.y + 94).lineTo(PAGE.x + PAGE.width, PAGE.y + 94).lineWidth(1.4).strokeColor("#dbe3ee").stroke();
  doc.restore();
};

const drawAgentFooter = (doc, branding = {}, footer = null) => {
  if (footer) {
    try {
      // Keep the uploaded footer banner anchored at the bottom of the page.
      doc.image(footer, PAGE.x, PAGE.footerY - 48, { fit: [PAGE.width, 76], align: "center", valign: "center" });
      return;
    } catch {}
  }

  drawRect(doc, PAGE.x, PAGE.footerY - 8, PAGE.width, 36, "#f8fafc", "#dbe3ee", 0.7);
  doc.font("Helvetica-Bold").fontSize(7.4).fillColor("#334155").text(String(branding.name || "Travel Voucher"), PAGE.bodyX, PAGE.footerY, {
    width: PAGE.bodyWidth,
    align: "center",
  });
  doc.font("Helvetica").fontSize(7.2).fillColor("#475569").text(
    `Phone: ${branding.phone || "-"}  |  Email: ${branding.email || "-"}${branding.website ? `  |  ${branding.website}` : ""}`,
    PAGE.bodyX,
    PAGE.footerY + 13,
    { width: PAGE.bodyWidth, align: "center" },
  );
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

  const branding = voucherDetails?.branding || {};
  const hasAgentBranding = Boolean(branding.name || branding.logo || branding.footer);
  const [agentLogo, agentFooter] = hasAgentBranding
    ? await Promise.all([loadBrandImage(branding.logo), loadBrandImage(branding.footer)])
    : [null, null];
  drawFrame(doc);
  if (hasAgentBranding) drawAgentHeader(doc, branding, agentLogo);
  else drawHeader(doc, { logoPath: resolveBrandLogoPath(), title: "Travel Voucher" });

  let y = hasAgentBranding ? 142 : 152;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Voucher Number", value: voucherDetails.voucherNumber || voucherDetails.query || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Guest Details", value: voucherDetails.name || voucherDetails.guestName || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Destination", value: voucherDetails.destination || "-" });
  y += 28;
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Duration", value: voucherDetails.duration || "-" });
  y += 28;

  const passengerBreakup = formatTravelerBreakup({
    adults: voucherDetails.adults,
    children: voucherDetails.children,
    travelerSummary: voucherDetails.travelerSummary,
    passengers: voucherDetails.passengers,
  });

  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Pax Details", value: passengerBreakup });
  y += 28;
  const travelDateVal = voucherDetails.travelDate || voucherDetails.date || null;
  const travelDates = voucherDetails.travelDates || formatDateLabel(travelDateVal);
  drawTableRow(doc, { x: PAGE.bodyX, y, label: "Travel Dates", value: travelDates });

  y += 40;

  drawSectionBar(doc, y, "SERVICE DETAILS");
  y += 30;

  // Draw Services Table Header
  doc.save();
  doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 22).fillAndStroke(BRAND.labelBg, BRAND.border);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text);
  doc.text("Type", PAGE.bodyX + 8, y + 7, { width: 62 });
  doc.text("Service Description", PAGE.bodyX + 78, y + 7, { width: 202 });
  doc.text("Confirmation Status", PAGE.bodyX + 290, y + 7, { width: 104 });
  doc.text("Confirmation Number", PAGE.bodyX + 402, y + 7, { width: 86, align: "right" });

  y += 22;

  (voucherDetails.services || []).forEach((service) => {
    const type = service.type || "Service";
    const title = service.title || service.name || "Service details missing";
    const rawConfirmation = String(service.confirmation || "").trim();
    const confirmationNumber = String(
      service.confirmationNumber || service.confirmationNo || service.cnfNumber ||
      service.supplierConfirmation || service.voucherNumber ||
      (!/^(pending|confirmed|confirmed\(confirmed\)|not available)$/i.test(rawConfirmation) ? rawConfirmation : "") || "-",
    ).trim();
    const status = String(
      service.status || (confirmationNumber === "-" || /^pending$/i.test(rawConfirmation) ? "Pending" : "Confirmed"),
    ).trim();

    const displayType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

    doc.save();
    doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 26).lineWidth(0.7).strokeColor(BRAND.border).stroke();
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.muted);
    doc.text(displayType, PAGE.bodyX + 8, y + 8, { width: 62 });

    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.text);
    doc.text(title, PAGE.bodyX + 78, y + 8, { width: 202, ellipsis: true });

    // Pending is intentionally plain text in both the mail body and the PDF.
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text);
    doc.text(status || "Pending", PAGE.bodyX + 290, y + 8, { width: 104 });
    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.text);
    doc.text(confirmationNumber, PAGE.bodyX + 402, y + 8, { width: 86, align: "right", ellipsis: true });

    y += 26;
  });

  y += 24;
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.muted).text(
    "This is a computer generated document. No signature/stamp required.",
    PAGE.bodyX,
    y,
    { width: PAGE.bodyWidth, align: "center" }
  );

  if (hasAgentBranding) {
    drawAgentFooter(doc, branding, agentFooter);
  } else drawFooter(doc);

  await finalizePdf(doc, stream);

  return {
    absoluteFilePath,
    publicFilePath,
    fileName,
  };
};
