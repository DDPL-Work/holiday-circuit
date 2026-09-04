import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { pdfMemoryCache } from "../utils/pdfCache.js";

/* ============================================================================
 * BRAND / PAGE CONSTANTS
 * ==========================================================================*/

const BRAND = Object.freeze({
  name: "Holiday Circuit",
  address: "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Near UK Nursing Home, New Delhi, Delhi, India - 110018",
  email: "ops@holidaycircuit.com",
  phone: "+91 8851346665",
  website: "www.holidaycircuit.com",
  headerBg: "#dce8f6",       // Soft light pastel blue
  yellowBg: "#fef08a",       // Soft yellow
  border: "#b3cae8",         // Soft blue border
  navy: "#0f1d32",
  text: "#000000",
  textMuted: "#334155",
  textDark: "#1e293b",
  blueConfirm: "#713f12",    // Confirmation brown
  greenConfirmed: "#15803d", // Confirmed green
  danger: "#e11d48",         // Pending red
  notesGold: "#92400e",      // Notes label
  surface: "#ffffff",
});

const PAGE = Object.freeze({
  x: 34,
  y: 28,
  width: 527,
  bodyX: 34,
  bodyWidth: 527,
  footerY: 768,
  contentBottom: 752,
  continuationTop: 40,
});

/* ============================================================================
 * GENERIC HELPERS
 * ==========================================================================*/

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const ensureVouchersDir = () => ensureDir(path.join(process.cwd(), "uploads", "vouchers"));

const normalizeCompanyName = (name, fallback = "Holiday Circuit") => {
  const str = String(name || "").trim();
  if (!str) return fallback;
  return str;
};

const formatOrdinalDate = (d) => {
  if (!d) return "-";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-US", { month: "short" });
  const year = dateObj.getFullYear();
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";
  return `${day}${suffix} ${month}, ${year}`;
};

const formatShortDate = (d) => {
  if (!d) return "-";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-US", { month: "short" });
  const year = dateObj.getFullYear();
  return `${day} ${month}, ${year}`;
};

const formatTravelerBreakup = ({ adults = 0, children = 0, travelerSummary = "", passengers = "" } = {}) => {
  const safeAdults = Number(adults || 0);
  const safeChildren = Number(children || 0);
  const parts = [];

  if (safeAdults > 0) parts.push(`${safeAdults} Adult${safeAdults > 1 ? "s" : ""}`);
  if (safeChildren > 0) parts.push(`${safeChildren} Child${safeChildren > 1 ? "ren" : ""}`);

  if (parts.length) return parts.join(", ");
  if (travelerSummary) return travelerSummary;
  return passengers || "2 Adults";
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

  if (/^https?:\/\//i.test(value) && typeof fetch === "function") {
    try {
      const response = await fetch(value, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) return null;
      return await toPdfImage(Buffer.from(await response.arrayBuffer()));
    } catch {
      return null;
    }
  }

  const localPath = value.startsWith("/") ? path.join(process.cwd(), value.slice(1)) : value;
  return fs.existsSync(localPath) ? toPdfImage(await fs.promises.readFile(localPath)) : null;
};

const resolveHotelMealPlanText = (h = {}) => {
  const candidates = [
    h.mealPlan,
    h.meal_plan,
    h.meal,
    h.meals,
    h.mealType,
  ].filter((v) => typeof v === "string" && v.trim().length > 0);

  for (const candidate of candidates) {
    const upper = candidate.trim().toUpperCase();
    if (upper === "EP" || upper.includes("ROOM ONLY") || upper.includes("ONLY ROOM") || upper.includes("NO MEAL")) {
      return "EP ( Room Only )";
    }
    if (upper === "MAP" || upper.includes("HALF BOARD") || upper.includes("BREAKFAST & DINNER") || upper.includes("BREAKFAST AND DINNER") || upper.includes("BREAKFAST + DINNER")) {
      return "MAP ( Breakfast & Dinner Included )";
    }
    if (upper === "AP" || upper.includes("FULL BOARD") || upper.includes("ALL MEAL")) {
      return "AP ( Breakfast, Lunch & Dinner Included )";
    }
    if (upper === "AI" || upper.includes("ALL INCLUSIVE")) {
      return "AI ( All Inclusive )";
    }
    if (upper === "CP" || upper.includes("BREAKFAST") || upper.includes("BED & BREAKFAST") || upper.includes("B&B")) {
      return "CP ( Breakfast Included )";
    }
  }

  const textSources = [
    h.description,
    h.roomDescription,
    h.hotelDescription,
    h.roomType,
    h.roomCategory,
    h.inclusions,
    h.notes,
  ].filter(Boolean);

  for (const source of textSources) {
    const segments = String(source).split("|").map((s) => s.trim().toUpperCase());
    for (const seg of segments) {
      if (seg === "EP" || seg === "ROOM ONLY" || seg === "ONLY ROOM" || seg === "NO MEALS" || seg === "NO MEAL") {
        return "EP ( Room Only )";
      }
      if (seg === "MAP" || seg === "HALF BOARD" || seg === "BREAKFAST & DINNER" || seg === "BREAKFAST AND DINNER" || seg === "BREAKFAST + DINNER") {
        return "MAP ( Breakfast & Dinner Included )";
      }
      if (seg === "AP" || seg === "FULL BOARD" || seg === "ALL MEALS" || seg === "ALL MEAL") {
        return "AP ( Breakfast, Lunch & Dinner Included )";
      }
      if (seg === "AI" || seg === "ALL INCLUSIVE") {
        return "AI ( All Inclusive )";
      }
      if (seg === "CP" || seg === "BREAKFAST INCLUDED" || seg === "BREAKFAST" || seg === "BED & BREAKFAST" || seg === "B&B") {
        return "CP ( Breakfast Included )";
      }
    }
  }

  const fullDesc = textSources.join(" ");
  if (/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test(fullDesc)) {
    return "EP ( Room Only )";
  }
  if (/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test(fullDesc)) {
    return "MAP ( Breakfast & Dinner Included )";
  }
  if (/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test(fullDesc)) {
    return "AP ( Breakfast, Lunch & Dinner Included )";
  }
  if (/\b(AI|ALL\s*INCLUSIVE)\b/i.test(fullDesc)) {
    return "AI ( All Inclusive )";
  }
  if (/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test(fullDesc)) {
    return "CP ( Breakfast Included )";
  }

  const fallbackRaw = candidates[0] || h.description || h.roomType || "";
  return fallbackRaw.trim() ? fallbackRaw.trim() : "As per hotel policy";
};

/* ============================================================================
 * LOW LEVEL DRAWING PRIMITIVES
 * ==========================================================================*/

const drawRect = (doc, x, y, width, height, fillColor, strokeColor = BRAND.border, lineWidth = 0.7) => {
  doc.save();
  doc.lineWidth(lineWidth);
  if (fillColor && strokeColor) {
    doc.rect(x, y, width, height).fillAndStroke(fillColor, strokeColor);
  } else if (fillColor) {
    doc.rect(x, y, width, height).fill(fillColor);
  } else if (strokeColor) {
    doc.rect(x, y, width, height).stroke(strokeColor);
  }
  doc.restore();
};

const drawFrame = (doc) => {
  doc.save();
  doc.rect(24, 20, 547, 802).lineWidth(1).strokeColor(BRAND.border).stroke();
  doc.restore();
};

/* ============================================================================
 * HEADER & FOOTER
 * ==========================================================================*/

const drawHeader = (doc, { logoPath = "" } = {}) => {
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 74, BRAND.navy, BRAND.navy);

  drawRect(doc, PAGE.x + 30, PAGE.y + 14, 120, 46, BRAND.surface, "#5a8aa8", 1.5);
  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.x + 36, PAGE.y + 18, { fit: [108, 38], align: "center", valign: "center" });
    } catch {
      doc.font("Helvetica-Bold").fontSize(18).fillColor(BRAND.navy).text("HC", PAGE.x + 30, PAGE.y + 25, {
        width: 120,
        align: "center",
      });
    }
  }

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text(BRAND.name, PAGE.x + 180, PAGE.y + 26, {
    width: 320,
    align: "right",
  });

  return PAGE.y + 80;
};

const drawAgentHeader = (doc, branding = {}, logo = null) => {
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 88, BRAND.surface, BRAND.border, 0.8);
  if (logo) {
    try {
      doc.image(logo, PAGE.x + 16, PAGE.y + 10, { fit: [95, 68], align: "center", valign: "center" });
    } catch {
      /* ignore broken logo */
    }
  }

  const detailsX = logo ? PAGE.x + 120 : PAGE.x + 20;
  const detailsWidth = PAGE.x + PAGE.width - detailsX - 16;
  const name = normalizeCompanyName(branding.name || BRAND.name);
  const address = branding.address || "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Near UK Nursing Home, New Delhi, Delhi, India - 110018";

  doc.font("Helvetica-Bold").fontSize(18).fillColor(BRAND.text).text(name, detailsX, PAGE.y + 14, { width: detailsWidth });
  doc.font("Helvetica").fontSize(7.8).fillColor("#475569").text(String(address), detailsX, PAGE.y + 39, {
    width: detailsWidth,
    lineGap: 1,
    height: 22,
    ellipsis: true,
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#2B5083").text(
    `Phone: ${branding.phone || "-"}${branding.email ? `  •  Email: ${branding.email}` : ""}`,
    detailsX,
    PAGE.y + 66,
    { width: detailsWidth },
  );

  return PAGE.y + 94;
};

const drawFooter = (doc, { branding = {}, hasAgentBranding = false, agentFooterImage = null } = {}) => {
  if (hasAgentBranding && agentFooterImage) {
    try {
      doc.image(agentFooterImage, PAGE.x, PAGE.footerY - 44, { fit: [PAGE.width, 68], align: "center", valign: "center" });
      return;
    } catch {
      /* fall through to text footer */
    }
  }

  if (hasAgentBranding) {
    drawRect(doc, PAGE.x, PAGE.footerY - 6, PAGE.width, 32, "#f8fafc", BRAND.border, 0.7);
    doc.font("Helvetica-Bold").fontSize(7.4).fillColor("#334155").text(String(normalizeCompanyName(branding.name || BRAND.name)), PAGE.bodyX, PAGE.footerY, {
      width: PAGE.bodyWidth,
      align: "center",
    });
    doc.font("Helvetica").fontSize(7.2).fillColor("#475569").text(
      `Phone: ${branding.phone || "-"}  |  Email: ${branding.email || "-"}`,
      PAGE.bodyX,
      PAGE.footerY + 12,
      { width: PAGE.bodyWidth, align: "center" },
    );
    return;
  }

  drawRect(doc, PAGE.x, PAGE.footerY, PAGE.width, 22, BRAND.navy, BRAND.navy);
  doc.font("Helvetica").fontSize(7.3).fillColor("#ffffff").text(
    `${BRAND.name}  |  ${branding.phone || BRAND.phone}  |  ${branding.email || BRAND.email}`,
    PAGE.bodyX,
    PAGE.footerY + 6,
    { width: PAGE.bodyWidth, align: "center" },
  );
};

/* ============================================================================
 * PAGE-BREAK MANAGEMENT
 * ==========================================================================*/

const createPageContext = (doc, { branding, hasAgentBranding, agentFooterImage }) => {
  const footerOpts = { branding, hasAgentBranding, agentFooterImage };

  doc.on("pageAdded", () => {
    drawFrame(doc);
    drawFooter(doc, footerOpts);
  });

  return {
    ensureSpace(y, needed) {
      if (y + needed <= PAGE.contentBottom) return y;
      doc.addPage();
      return PAGE.continuationTop;
    },
  };
};

/* ============================================================================
 * 1. OVERVIEW TABLE
 * ==========================================================================*/

const drawOverviewTable = (doc, pageCtx, y, data) => {
  let cursorY = pageCtx.ensureSpace(y, 134);

  const startX = PAGE.bodyX;
  const totalWidth = PAGE.bodyWidth;
  const rowHeight = 22;

  // Table Header
  drawRect(doc, startX, cursorY, totalWidth, rowHeight, BRAND.headerBg, BRAND.border, 0.8);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND.text).text(
    `Trip ID: ${data.tripId || "4304633"}`,
    startX,
    cursorY + 6,
    { width: totalWidth, align: "center" }
  );
  cursorY += rowHeight;

  // Row 1: Start Date & Trip Duration
  const wLabel1 = 95;
  const wVal1 = 168.5;
  const wLabel2 = 105;
  const wVal2 = 158.5;

  // Row 1
  drawRect(doc, startX, cursorY, wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text("Start Date", startX + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1, cursorY, wVal1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(String(data.startDate || "-"), startX + wLabel1 + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1 + wVal1, cursorY, wLabel2, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text("Trip Duration", startX + wLabel1 + wVal1 + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1 + wVal1 + wLabel2, cursorY, wVal2, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(String(data.duration || "-"), startX + wLabel1 + wVal1 + wLabel2 + 8, cursorY + 6);
  cursorY += rowHeight;

  // Row 2: Destination
  drawRect(doc, startX, cursorY, wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text("Destination", startX + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1, cursorY, totalWidth - wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(String(data.destination || "-"), startX + wLabel1 + 8, cursorY + 6);
  cursorY += rowHeight;

  // Row 3: Guest Name & Guest Ph.
  drawRect(doc, startX, cursorY, wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text("Guest Name", startX + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1, cursorY, wVal1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(String(data.guestName || "Valued Client"), startX + wLabel1 + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1 + wVal1, cursorY, wLabel2, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text("Guest Ph.", startX + wLabel1 + wVal1 + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1 + wVal1 + wLabel2, cursorY, wVal2, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.text).text(String(data.guestPhone || "-"), startX + wLabel1 + wVal1 + wLabel2 + 8, cursorY + 6);
  cursorY += rowHeight;

  // Row 4: Pax Details
  drawRect(doc, startX, cursorY, wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text("Pax Details", startX + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1, cursorY, totalWidth - wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text(String(data.pax || "-"), startX + wLabel1 + 8, cursorY + 6);
  cursorY += rowHeight;

  // Row 5: Issued By
  drawRect(doc, startX, cursorY, wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text("Issued By", startX + 8, cursorY + 6);

  drawRect(doc, startX + wLabel1, cursorY, totalWidth - wLabel1, rowHeight, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.textDark).text(String(data.issuedBy || "Holiday Circuit"), startX + wLabel1 + 8, cursorY + 6);
  cursorY += rowHeight;

  return cursorY + 12;
};

/* ============================================================================
 * 2. HOTEL CARDS
 * ==========================================================================*/

const drawHotelCard = (doc, pageCtx, y, hotel, tripDefaults) => {
  const cardHeight = 142;
  let cursorY = pageCtx.ensureSpace(y, cardHeight);

  const startX = PAGE.bodyX;
  const totalWidth = PAGE.bodyWidth;

  const hTitle = hotel.title || hotel.hotelName || hotel.name || `${tripDefaults.destination || "Destination"} Hotel`;
  const hRating = hotel.rating || hotel.starRating || hotel.category || "5 star";
  const hAddress = hotel.address || hotel.hotelAddress || hotel.location || `${tripDefaults.destination || "India"}`;

  const realCnfNum = hotel.confirmationNumber || hotel.cnfNumber || hotel.supplierConfirmation || hotel.voucherNumber || (hotel.confirmation && !hotel.confirmation.toLowerCase().includes("pending") ? hotel.confirmation : null);
  const isHotelConfirmed = Boolean(
    realCnfNum ||
    (hotel.status && String(hotel.status).toLowerCase() === "confirmed") ||
    (hotel.confirmation && !String(hotel.confirmation).toLowerCase().includes("pending")) ||
    hotel.isVoucherGenerated
  );
  const hStatLabel = isHotelConfirmed ? "Confirmed" : "Pending";
  const cnfDisplay = realCnfNum ? String(realCnfNum).trim() : (isHotelConfirmed ? "Confirmed" : "Pending");

  const checkInDate = hotel.checkIn ? formatOrdinalDate(hotel.checkIn) : tripDefaults.startDateOrdinal;
  const checkInTime = hotel.checkInTime || "14:00 hrs";
  const nights = Number(hotel.nights || hotel.numberOfNights || tripDefaults.nights || 1);
  const checkOutDate = hotel.checkOut ? formatOrdinalDate(hotel.checkOut) : tripDefaults.endDateOrdinal;
  const checkOutTime = hotel.checkOutTime || "12:00 hrs";

  const checkInShort = hotel.checkIn ? formatShortDate(hotel.checkIn) : tripDefaults.startDateShort;
  const mealPlanStr = resolveHotelMealPlanText(hotel);
  const nightMealStr = `${checkInShort} (${hotel.nightLabel || (nights > 1 ? `${nights} Nights` : '1st N')}) - ${mealPlanStr}`;
  const roomTypeStr = `${hotel.numberOfRooms || hotel.rooms || 1} x ${hotel.roomType || hotel.roomCategory || "Superior King Room"}`;
  const paxDetailStr = hotel.pax || tripDefaults.pax || "2 Pax";

  // Card Header
  drawRect(doc, startX, cursorY, totalWidth, 20, BRAND.headerBg, BRAND.border, 0.8);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND.text).text("Hotel", startX + 10, cursorY + 5);
  cursorY += 20;

  // Card Body Background & Border
  const bodyHeight = 122;
  drawRect(doc, startX, cursorY, totalWidth, bodyHeight, BRAND.surface, BRAND.border, 0.8);

  const innerX = startX + 10;
  const innerW = totalWidth - 20;

  // Title, Rating, Address
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND.text).text(hTitle, innerX, cursorY + 8, { width: innerW });
  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.textMuted).text(hRating, innerX, cursorY + 21, { width: innerW });
  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.textDark).text(hAddress, innerX, cursorY + 31, { width: innerW, height: 10, ellipsis: true });

  // Confirmation line
  doc.save();
  doc.moveTo(innerX, cursorY + 44).lineTo(innerX + innerW, cursorY + 44).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.blueConfirm).text(`Confirmation: ${cnfDisplay}`, innerX, cursorY + 49, { continued: true });
  doc.font("Helvetica-BoldOblique").fontSize(8).fillColor(isHotelConfirmed ? BRAND.greenConfirmed : BRAND.danger).text(`  ( ${hStatLabel} )`);

  // Check-In & Check-Out Highlight Box
  const boxY = cursorY + 63;
  const boxH = 22;
  const col1W = 60;
  const col2W = (innerW / 2) - col1W;

  // Check-In
  drawRect(doc, innerX, boxY, col1W, boxH, BRAND.yellowBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.text).text("Check-in", innerX, boxY + 6, { width: col1W, align: "center" });

  drawRect(doc, innerX + col1W, boxY, col2W, boxH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(BRAND.text).text(checkInDate, innerX + col1W + 6, boxY + 6, { continued: true });
  doc.font("Helvetica-Oblique").fontSize(7).fillColor(BRAND.textMuted).text(` at ${checkInTime}`);

  // Check-Out
  const col3X = innerX + (innerW / 2);
  drawRect(doc, col3X, boxY, col1W, boxH, BRAND.yellowBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.text).text("Check-out", col3X, boxY + 6, { width: col1W, align: "center" });

  drawRect(doc, col3X + col1W, boxY, col2W, boxH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(BRAND.text).text(`${checkOutDate} (${nights}N)`, col3X + col1W + 6, boxY + 6, { continued: true });
  doc.font("Helvetica-BoldOblique").fontSize(7).fillColor(isHotelConfirmed ? BRAND.greenConfirmed : BRAND.danger).text(` (${hStatLabel})`);

  // Night and Meals & Room Type Sub-Table
  const subY = boxY + boxH + 6;
  const subH1 = 14;
  const subH2 = 17;
  const subCol1W = innerW * 0.58;
  const subCol2W = innerW * 0.42;

  // Sub-Header
  drawRect(doc, innerX, subY, subCol1W, subH1, BRAND.headerBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.text).text("Night and Meals", innerX + 6, subY + 3);

  drawRect(doc, innerX + subCol1W, subY, subCol2W, subH1, BRAND.headerBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.text).text("Room Type", innerX + subCol1W + 6, subY + 3);

  // Sub-Row
  drawRect(doc, innerX, subY + subH1, subCol1W, subH2, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(7.2).fillColor(BRAND.text).text(nightMealStr, innerX + 6, subY + subH1 + 4, { width: subCol1W - 12 });

  drawRect(doc, innerX + subCol1W, subY + subH1, subCol2W, subH2, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.2).fillColor(BRAND.text).text(roomTypeStr, innerX + subCol1W + 6, subY + subH1 + 4, { width: subCol2W - 12, continued: true });
  doc.font("Helvetica").fontSize(6.8).fillColor(BRAND.textMuted).text(`  •  ${paxDetailStr}`);

  cursorY += bodyHeight;
  return cursorY + 12;
};

/* ============================================================================
 * 3. TRANSFER / ACTIVITY / SIGHTSEEING CARDS
 * ==========================================================================*/

const drawNonHotelCard = (doc, pageCtx, y, s, tripDefaults) => {
  const cardHeight = 136;
  let cursorY = pageCtx.ensureSpace(y, cardHeight);

  const startX = PAGE.bodyX;
  const totalWidth = PAGE.bodyWidth;

  const sTypeRaw = String(s.type || s.category || "Service").toLowerCase();
  const sTitle = s.title || s.name || s.serviceName || `${tripDefaults.destination || "Service"} Service`;
  const sDesc = s.description || s.details || s.notes || "";

  const isTransport = sTypeRaw.includes("transfer") || sTypeRaw.includes("transport") || sTypeRaw.includes("cab") || sTypeRaw.includes("car");

  // Format Transport Specifics (Usage/Trip Type, Passenger & Luggage Capacity)
  const rawUsage = String(s.usageType || s.transferType || s.tripType || s.serviceMode || s.direction || "").trim();
  let usageLabel = "";
  if (rawUsage) {
    const lowUsage = rawUsage.toLowerCase();
    if (lowUsage.includes("point") || lowUsage.includes("oneway") || lowUsage.includes("one-way") || lowUsage.includes("one way")) {
      usageLabel = "One Way (Point to Point)";
    } else if (lowUsage.includes("round")) {
      usageLabel = "Round Trip";
    } else if (lowUsage.includes("full") || lowUsage.includes("day")) {
      usageLabel = "Full Day Disposal";
    } else if (lowUsage.includes("half")) {
      usageLabel = "Half Day Disposal";
    } else if (lowUsage.includes("pickup") || lowUsage.includes("pick-up")) {
      usageLabel = "Airport / Station Pickup";
    } else if (lowUsage.includes("drop")) {
      usageLabel = "Airport / Station Drop";
    } else {
      usageLabel = rawUsage;
    }
  } else {
    const titleLow = String(sTitle || "").toLowerCase();
    if (titleLow.includes("round trip") || titleLow.includes("round-trip")) {
      usageLabel = "Round Trip";
    } else if (titleLow.includes("disposal") || titleLow.includes("full day")) {
      usageLabel = "Full Day Disposal";
    } else if (titleLow.includes("half day")) {
      usageLabel = "Half Day Disposal";
    } else {
      usageLabel = "One Way Transfer";
    }
  }

  const vType = s.vehicleType || s.carType || s.vehicle || (isTransport ? "Private AC Vehicle" : "Standard Vehicle");
  const vCount = s.vehicleCount || s.numberOfVehicles || s.quantity || 1;
  const vehicleTitle = `${vCount > 1 ? `${vCount} x ` : ''}${vType}`;

  let passCap = s.passengerCapacity || s.maxPassengers || s.maxPax || s.seatingCapacity || s.seats || s.paxCapacity || null;
  let luggCap = s.luggageCapacity || s.maxLuggage || s.luggage || s.baggageCapacity || s.bags || null;

  if (!passCap && isTransport) {
    const vtLow = String(vType).toLowerCase();
    if (vtLow.includes("sedan") || vtLow.includes("etios") || vtLow.includes("dzire") || vtLow.includes("car")) {
      passCap = "Max 4 Pax";
    } else if (vtLow.includes("innova") || vtLow.includes("suv") || vtLow.includes("ertiga") || vtLow.includes("crysta")) {
      passCap = "Max 6 Pax";
    } else if (vtLow.includes("tempo") || vtLow.includes("van") || vtLow.includes("minivan")) {
      passCap = "Max 12 Pax";
    } else if (vtLow.includes("coach") || vtLow.includes("bus")) {
      passCap = "Max 25 Pax";
    } else {
      passCap = "Max 4 Pax";
    }
  } else if (passCap && !String(passCap).toLowerCase().includes("pax")) {
    passCap = `Max ${passCap} Pax`;
  }

  if (!luggCap && isTransport) {
    const vtLow = String(vType).toLowerCase();
    if (vtLow.includes("sedan") || vtLow.includes("etios") || vtLow.includes("dzire") || vtLow.includes("car")) {
      luggCap = "2 Bags";
    } else if (vtLow.includes("innova") || vtLow.includes("suv") || vtLow.includes("ertiga") || vtLow.includes("crysta")) {
      luggCap = "4 Bags";
    } else if (vtLow.includes("tempo") || vtLow.includes("van") || vtLow.includes("minivan")) {
      luggCap = "8 Bags";
    } else if (vtLow.includes("coach") || vtLow.includes("bus")) {
      luggCap = "20 Bags";
    } else {
      luggCap = "2-3 Bags";
    }
  } else if (luggCap && !String(luggCap).toLowerCase().includes("bag")) {
    luggCap = `${luggCap} Bags`;
  }

  let sectionTitle = "Service";
  let badge1Label = "Service Date";
  let badge2Label = "Service Type";
  let badge2Value = s.transferType || s.vehicleType || s.category || "Standard Service";
  let subCol1Title = "Service Details";
  let subCol2Title = "Pax / Vehicle Details";

  if (isTransport) {
    sectionTitle = "Transfer";
    badge1Label = "Transfer Date";
    badge2Label = "Vehicle & Trip";
    badge2Value = `${vType} (${usageLabel})`;
    subCol1Title = "Transfer Description & Route";
    subCol2Title = "Vehicle & Capacity Details";
  } else if (sTypeRaw.includes("activity")) {
    sectionTitle = "Activity";
    badge1Label = "Activity Date";
    badge2Label = "Timing";
    badge2Value = s.timing || s.duration || s.slot || "As per schedule";
    subCol1Title = "Activity Description";
    subCol2Title = "Pax Details";
  } else if (sTypeRaw.includes("sightseeing")) {
    sectionTitle = "Sightseeing";
    badge1Label = "Tour Date";
    badge2Label = "Tour Type";
    badge2Value = s.tourType || "Sightseeing Tour";
    subCol1Title = "Sightseeing Description";
    subCol2Title = "Pax Details";
  } else if (sTypeRaw.includes("flight")) {
    sectionTitle = "Flight";
    badge1Label = "Flight Date";
    badge2Label = "Sector";
    badge2Value = s.flightNumber || s.sector || "Flight Service";
    subCol1Title = "Flight Details";
    subCol2Title = "Pax Details";
  }

  const realCnf = s.confirmationNumber || s.cnfNumber || s.supplierConfirmation || s.voucherNumber || (s.confirmation && !s.confirmation.toLowerCase().includes("pending") ? s.confirmation : null);
  const isConfirmed = Boolean(
    realCnf ||
    (s.status && String(s.status).toLowerCase() === "confirmed") ||
    (s.confirmation && !String(s.confirmation).toLowerCase().includes("pending")) ||
    s.isVoucherGenerated
  );
  const statLabel = isConfirmed ? "Confirmed" : "Pending";
  const cnfDisplay = realCnf ? String(realCnf).trim() : (isConfirmed ? "Confirmed" : "Pending");

  const sDateFormatted = s.serviceDate ? formatOrdinalDate(s.serviceDate) : (s.date ? formatOrdinalDate(s.date) : tripDefaults.startDateOrdinal);
  const sTimeFormatted = s.time || s.pickupTime || "10:00 hrs";
  const sPaxVehicleStr = s.vehicleType ? `${s.vehicleType} • ${tripDefaults.pax || "2 Pax"}` : (s.pax || tripDefaults.pax || "2 Pax");
  const sDetailsStr = `${sTitle} - ${statLabel === "Confirmed" ? "Confirmed Service" : "Service"}`;

  // Card Header
  drawRect(doc, startX, cursorY, totalWidth, 20, BRAND.headerBg, BRAND.border, 0.8);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND.text).text(sectionTitle, startX + 10, cursorY + 5);
  cursorY += 20;

  // Card Body Background & Border (increased height for transport if details are richer)
  const bodyHeight = isTransport ? 126 : 116;
  drawRect(doc, startX, cursorY, totalWidth, bodyHeight, BRAND.surface, BRAND.border, 0.8);

  const innerX = startX + 10;
  const innerW = totalWidth - 20;

  // Title, Subtitle, Desc
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND.text).text(sTitle, innerX, cursorY + 8, { width: innerW });
  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.textMuted).text(`${sectionTitle} • ${tripDefaults.destination || "Destination"}`, innerX, cursorY + 21, { width: innerW });
  if (sDesc) {
    doc.font("Helvetica").fontSize(7.2).fillColor(BRAND.textDark).text(sDesc, innerX, cursorY + 31, { width: innerW, height: 10, ellipsis: true });
  }

  // Confirmation line
  doc.save();
  doc.moveTo(innerX, cursorY + 42).lineTo(innerX + innerW, cursorY + 42).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.blueConfirm).text(`Confirmation: ${cnfDisplay}`, innerX, cursorY + 46, { continued: true });
  doc.font("Helvetica-BoldOblique").fontSize(8).fillColor(isConfirmed ? BRAND.greenConfirmed : BRAND.danger).text(`  ( ${statLabel} )`);

  // Service Date & Details Highlight Box
  const boxY = cursorY + 59;
  const boxH = 22;
  const col1W = 65;
  const col2W = (innerW / 2) - col1W;

  // Badge 1
  drawRect(doc, innerX, boxY, col1W, boxH, BRAND.yellowBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.text).text(badge1Label, innerX, boxY + 6, { width: col1W, align: "center" });

  drawRect(doc, innerX + col1W, boxY, col2W, boxH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(BRAND.text).text(sDateFormatted, innerX + col1W + 6, boxY + 6, { continued: true });
  doc.font("Helvetica-Oblique").fontSize(7).fillColor(BRAND.textMuted).text(` at ${sTimeFormatted}`);

  // Badge 2
  const col3X = innerX + (innerW / 2);
  drawRect(doc, col3X, boxY, col1W, boxH, BRAND.yellowBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.text).text(badge2Label, col3X, boxY + 6, { width: col1W, align: "center" });

  drawRect(doc, col3X + col1W, boxY, col2W, boxH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(BRAND.text).text(badge2Value, col3X + col1W + 6, boxY + 6, { continued: true });
  doc.font("Helvetica-BoldOblique").fontSize(7).fillColor(isConfirmed ? BRAND.greenConfirmed : BRAND.danger).text(` (${statLabel})`);

  // Sub-Table
  const subY = boxY + boxH + 6;
  const subH1 = 14;
  const subH2 = isTransport ? 28 : 17;
  const subCol1W = innerW * 0.58;
  const subCol2W = innerW * 0.42;

  // Sub-Header
  drawRect(doc, innerX, subY, subCol1W, subH1, BRAND.headerBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.text).text(subCol1Title, innerX + 6, subY + 3);

  drawRect(doc, innerX + subCol1W, subY, subCol2W, subH1, BRAND.headerBg, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.text).text(subCol2Title, innerX + subCol1W + 6, subY + 3);

  // Sub-Row
  drawRect(doc, innerX, subY + subH1, subCol1W, subH2, BRAND.surface, BRAND.border, 0.7);
  if (isTransport) {
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor(BRAND.text).text(sDetailsStr, innerX + 6, subY + subH1 + 4, { width: subCol1W - 12, height: 10, ellipsis: true });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#1e40af").text(`${usageLabel}`, innerX + 6, subY + subH1 + 15, { continued: Boolean(s.pickupLocation || s.dropLocation) });
    if (s.pickupLocation || s.dropLocation) {
      doc.font("Helvetica").fontSize(6.8).fillColor(BRAND.textDark).text(`  •  ${s.pickupLocation || 'Pickup'} ➔ ${s.dropLocation || 'Drop'}`);
    }
  } else {
    doc.font("Helvetica").fontSize(7.2).fillColor(BRAND.text).text(sDetailsStr, innerX + 6, subY + subH1 + 4, { width: subCol1W - 12, height: 10, ellipsis: true });
  }

  drawRect(doc, innerX + subCol1W, subY + subH1, subCol2W, subH2, BRAND.surface, BRAND.border, 0.7);
  if (isTransport) {
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor(BRAND.text).text(vehicleTitle, innerX + subCol1W + 6, subY + subH1 + 3);
    doc.font("Helvetica").fontSize(6.8).fillColor(BRAND.textDark).text(`Pax: ${passCap}  |  Luggage: ${luggCap}`, innerX + subCol1W + 6, subY + subH1 + 14);
  } else {
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor(BRAND.text).text(sPaxVehicleStr, innerX + subCol1W + 6, subY + subH1 + 4, { width: subCol2W - 12 });
  }

  cursorY += bodyHeight;
  return cursorY + 12;
};

/* ============================================================================
 * 3.5. TERMS & CONDITIONS TABLE
 * ==========================================================================*/

const drawTermsAndConditionsTable = (doc, pageCtx, y, terms = []) => {
  const rawTerms = Array.isArray(terms)
    ? terms.filter((t) => typeof t === "string" && t.trim().length > 0)
    : typeof terms === "string"
    ? terms.split("\n").map((t) => t.trim()).filter((t) => t.length > 0)
    : [];

  if (!rawTerms.length) return y;

  const startX = PAGE.bodyX;
  const totalWidth = PAGE.bodyWidth;

  let cursorY = pageCtx.ensureSpace(y, 40);

  // Header
  drawRect(doc, startX, cursorY, totalWidth, 18, BRAND.headerBg, BRAND.border, 0.8);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.text).text("Terms & Conditions", startX + 8, cursorY + 4.5);
  cursorY += 18;

  // Items
  rawTerms.forEach((item, idx) => {
    const text = `${idx + 1}. ${item}`;
    doc.font("Helvetica").fontSize(7.2);
    const itemHeight = Math.max(16, doc.heightOfString(text, { width: totalWidth - 16, lineGap: 1.5 }) + 6);
    cursorY = pageCtx.ensureSpace(cursorY, itemHeight);

    drawRect(doc, startX, cursorY, totalWidth, itemHeight, BRAND.surface, BRAND.border, 0.5);
    doc.font("Helvetica").fontSize(7.2).fillColor(BRAND.textDark).text(text, startX + 8, cursorY + 3.5, {
      width: totalWidth - 16,
      lineGap: 1.5,
    });
    cursorY += itemHeight;
  });

  return cursorY + 8;
};

/* ============================================================================
 * 4. HELPLINE TABLE
 * ==========================================================================*/

const drawHelplineTable = (doc, pageCtx, y, helpline = {}) => {
  let cursorY = pageCtx.ensureSpace(y, 44);

  const startX = PAGE.bodyX;
  const totalWidth = PAGE.bodyWidth;

  // Header
  drawRect(doc, startX, cursorY, totalWidth, 18, BRAND.yellowBg, BRAND.border, 0.8);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.text).text("Helpline", startX, cursorY + 4.5, {
    width: totalWidth,
    align: "center",
  });
  cursorY += 18;

  // Row
  const rowH = 22;
  const col1W = totalWidth * 0.34;
  const col2W = totalWidth * 0.33;
  const col3W = totalWidth * 0.33;

  drawRect(doc, startX, cursorY, col1W, rowH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.text).text(String(helpline.companyName || BRAND.name), startX + 8, cursorY + 6);

  drawRect(doc, startX + col1W, cursorY, col2W, rowH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica").fontSize(8).fillColor(BRAND.text).text("24x7 Operational", startX + col1W, cursorY + 6, {
    width: col2W,
    align: "center",
  });

  drawRect(doc, startX + col1W + col2W, cursorY, col3W, rowH, BRAND.surface, BRAND.border, 0.7);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.text).text(String(helpline.phone || BRAND.phone), startX + col1W + col2W, cursorY + 6, {
    width: col3W - 8,
    align: "right",
  });

  return cursorY + rowH + 8;
};

/* ============================================================================
 * MISC
 * ==========================================================================*/

const finalizePdf = async (doc, stream) => {
  doc.end();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

/* ============================================================================
 * MAIN ENTRY POINT
 * ==========================================================================*/

export const generateVoucherPdf = async (voucherDetails) => {
  // [LOCAL] Disk write disabled — no files saved to uploads/vouchers/
  // const dirPath = ensureVouchersDir();
  const dirPath = "";
  const safeVoucherNumber = String(voucherDetails.voucherNumber || voucherDetails.query || "voucher").replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `Travel_Voucher_${safeVoucherNumber}.pdf`;
  // const absoluteFilePath = path.join(dirPath, fileName); // [LOCAL] disk write disabled
  const absoluteFilePath = "";
  const publicFilePath = `/uploads/vouchers/${fileName}`;

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

  const branding = voucherDetails?.branding && typeof voucherDetails.branding === "object" ? voucherDetails.branding : {};
  const hasAgentBranding = Boolean(branding.name || branding.logo || branding.footer);
  const [agentLogo, agentFooterImage] = hasAgentBranding
    ? await Promise.all([loadBrandImage(branding.logo), loadBrandImage(branding.footer)])
    : [null, null];

  drawFrame(doc);
  drawFooter(doc, { branding, hasAgentBranding, agentFooterImage });

  const pageCtx = createPageContext(doc, { branding, hasAgentBranding, agentFooterImage });

  // 1. Header (Agent Header or Brand Header)
  let y = hasAgentBranding ? drawAgentHeader(doc, branding, agentLogo) : drawHeader(doc, { logoPath: resolveBrandLogoPath() });
  y += 10;

  // Resolve Dates & Pax
  const resolvedTravelDate = voucherDetails.startDate || voucherDetails.travelDate || voucherDetails.date || null;
  const startObj = resolvedTravelDate ? new Date(resolvedTravelDate) : new Date();
  const startDateOrdinal = !isNaN(startObj.getTime()) ? formatOrdinalDate(startObj) : "22nd Dec, 2026";
  const startDateShort = !isNaN(startObj.getTime()) ? formatShortDate(startObj) : "22 Dec, 2026";

  const nights = Number(voucherDetails.nights || voucherDetails.numberOfNights || 4);
  const days = Number(voucherDetails.days || voucherDetails.numberOfDays || (nights + 1));
  const endObj = voucherDetails.endDate ? new Date(voucherDetails.endDate) : new Date(startObj.getTime() + nights * 86400000);
  const endDateOrdinal = !isNaN(endObj.getTime()) ? formatOrdinalDate(endObj) : "26th Dec, 2026";

  const tripDefaults = {
    destination: voucherDetails.destination || "India",
    duration: voucherDetails.duration || `${nights} Night${nights > 1 ? "s" : ""} / ${days} Days`,
    nights,
    days,
    startDateOrdinal,
    startDateShort,
    endDateOrdinal,
    pax: formatTravelerBreakup({
      adults: voucherDetails.adults,
      children: voucherDetails.children,
      travelerSummary: voucherDetails.travelerSummary,
      passengers: voucherDetails.passengers,
    }),
  };

  const resolveTripId = (data) => {
    const raw = data.tripId || data.queryId || data.query || data.voucherNumber || "";
    const clean = String(raw).replace(/^#\s*/, "").trim();
    if (!clean) return "QRY-1109";
    if (clean.toUpperCase().startsWith("QRY-")) return clean.toUpperCase();
    if (clean.toUpperCase().startsWith("VCH-")) return `QRY-${clean.replace(/^VCH-?/i, "")}`;
    return `QRY-${clean}`;
  };

  // 2. Overview Table
  y = drawOverviewTable(doc, pageCtx, y, {
    tripId: resolveTripId(voucherDetails),
    startDate: startDateOrdinal,
    duration: tripDefaults.duration,
    destination: tripDefaults.destination,
    guestName: voucherDetails.guestName || voucherDetails.name || "Valued Client",
    guestPhone: voucherDetails.guestPhone || voucherDetails.clientPhone || voucherDetails.phone || "-",
    pax: tripDefaults.pax,
    issuedBy: normalizeCompanyName(
      voucherDetails.issuedBy || BRAND.name,
      BRAND.name
    ),
  });

  // 3. Services (Hotel Cards & Non-Hotel Cards)
  const rawServices = Array.isArray(voucherDetails.services) && voucherDetails.services.length > 0 ? voucherDetails.services : [];
  const hotelServices = rawServices.filter((s) => String(s.type || s.category || "").toLowerCase().includes("hotel"));
  const nonHotelServices = rawServices.filter((s) => !String(s.type || s.category || "").toLowerCase().includes("hotel"));

  const displayHotels = hotelServices;

  if (displayHotels.length === 0 && nonHotelServices.length === 0) {
    const emptyH = 28;
    y = pageCtx.ensureSpace(y, emptyH);
    drawRect(doc, PAGE.bodyX, y, PAGE.bodyWidth, emptyH, "#f8fafc", BRAND.border, 0.6);
    doc.font("Helvetica-Oblique").fontSize(8).fillColor(BRAND.textMuted).text(
      "No specific hotel accommodations or services listed for this voucher.",
      PAGE.bodyX,
      y + 9,
      { width: PAGE.bodyWidth, align: "center" }
    );
    y += emptyH + 10;
  } else {
    displayHotels.forEach((h) => {
      y = drawHotelCard(doc, pageCtx, y, h, tripDefaults);
    });

    nonHotelServices.forEach((s) => {
      y = drawNonHotelCard(doc, pageCtx, y, s, tripDefaults);
    });
  }

  // 3.5 Terms & Conditions Table
  // const defaultTermsList = [
  //   "Welcome to Holiday Circuit. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.",
  //   "Bookings and Reservations",
  //   "Booking Process: When you make a booking or reservation through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.",
  //   "Payment: Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.",
  //   "Cancellations and Refunds: Cancellation and refund policies vary depending on the type of booking. Please refer to the specific cancellation policy provided at the time of booking. Holiday Circuit reserves the right to charge cancellation fees as applicable.",
  //   "Intellectual Property",
  //   "Ownership: All content, trademarks, logos, and intellectual property on the Holiday Circuit website and app are the property of Holiday Circuit or its licensors. You may not use, reproduce, or distribute our content without prior written permission.",
  //   "Changes to Terms and Conditions: We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.",
  //   "By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
  // ];



  let termsList = voucherDetails.termsAndConditions || voucherDetails.terms || [];
  if (!termsList || !termsList.length) {
    termsList = defaultTermsList;
  }
  y = drawTermsAndConditionsTable(doc, pageCtx, y, termsList);

  // 4. Helpline Table
  y = drawHelplineTable(doc, pageCtx, y, {
    companyName: BRAND.name,
    phone: BRAND.phone,
  });

  // 6. Generated timestamp note
  doc.font("Helvetica").fontSize(7.5).fillColor("#64748b").text(
    `Generated On - ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} - ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} Hrs UTC`,
    PAGE.bodyX,
    y,
    { width: PAGE.bodyWidth, align: "right" }
  );

  // await finalizePdf(doc, stream); // [LOCAL] disk write disabled
  doc.end();
  await pdfPromise;

  return {
    absoluteFilePath,
    publicFilePath,
    fileName,
  };
};