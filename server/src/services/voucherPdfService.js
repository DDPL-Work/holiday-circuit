import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import sharp from "sharp";

/* ============================================================================
 * BRAND / PAGE CONSTANTS
 * ==========================================================================*/

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
  danger: "#dc2626",
});

// Every x/y/width used across the document is derived from this single
// object so the geometry never has to be "guessed" per-section.
const PAGE = Object.freeze({
  x: 34,
  y: 28,
  width: 527,
  bodyX: 50,
  bodyWidth: 495,
  footerY: 770,
  contentBottom: 748, // last y a new row/paragraph may start at before we page-break
  continuationTop: 50, // where content resumes on page 2+
});

/* ============================================================================
 * GENERIC HELPERS (unchanged behaviour from the previous implementation)
 * ==========================================================================*/

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

const capitalize = (value = "") => (value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "");

/* ============================================================================
 * LOW LEVEL DRAWING PRIMITIVES
 * ==========================================================================*/

const drawRect = (doc, x, y, width, height, fillColor, strokeColor = BRAND.border, lineWidth = 0.7) => {
  doc.save();
  doc.lineWidth(lineWidth);
  doc.rect(x, y, width, height).fillAndStroke(fillColor, strokeColor);
  doc.restore();
};

const drawFrame = (doc) => {
  doc.save();
  doc.rect(24, 20, 547, 802).lineWidth(1).strokeColor(BRAND.border).stroke();
  doc.restore();
};

/**
 * Full-width colored section header bar used above every table
 * (Trip Voucher / a services category / Terms and Conditions / Helpline).
 * Returns the y coordinate directly below the bar.
 */
const drawSectionHeader = (doc, y, title, { height = 22 } = {}) => {
  doc.save();
  doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, height).fill(BRAND.navy);
  doc.rect(PAGE.bodyX, y, PAGE.bodyWidth, 1.6).fill(BRAND.orange);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#ffffff").text(title, PAGE.bodyX, y + height / 2 - 5, {
    width: PAGE.bodyWidth,
    align: "center",
    characterSpacing: 0.6,
  });

  return y + height;
};

/* ============================================================================
 * HEADER / FOOTER
 * ==========================================================================*/

const drawHeader = (doc, { logoPath = "" } = {}) => {
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 76, BRAND.navy, BRAND.navy);

  doc.save();
  doc
    .polygon([PAGE.x, PAGE.y], [PAGE.x + 92, PAGE.y], [PAGE.x + 70, PAGE.y + 76], [PAGE.x, PAGE.y + 76])
    .fill(BRAND.orangeBright);
  doc
    .polygon(
      [PAGE.x + PAGE.width - 54, PAGE.y],
      [PAGE.x + PAGE.width, PAGE.y],
      [PAGE.x + PAGE.width - 30, PAGE.y + 76],
      [PAGE.x + PAGE.width - 84, PAGE.y + 76],
    )
    .fill(BRAND.orangeBright);
  doc.restore();

  drawRect(doc, PAGE.x + 40, PAGE.y + 16, 132, 46, BRAND.surface, BRAND.orange, 1);
  if (logoPath) {
    try {
      doc.image(logoPath, PAGE.x + 48, PAGE.y + 22, { fit: [116, 34], align: "center", valign: "center" });
    } catch {
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

  return PAGE.y + 76;
};

const drawAgentHeader = (doc, branding = {}, logo = null) => {
  drawRect(doc, PAGE.x, PAGE.y, PAGE.width, 94, BRAND.surface, BRAND.border, 0.8);
  if (logo) {
    try {
      doc.image(logo, PAGE.x + 16, PAGE.y + 12, { fit: [100, 70], align: "center", valign: "center" });
    } catch {
      /* ignore broken logo */
    }
  }

  const detailsX = logo ? PAGE.x + 128 : PAGE.x + 22;
  const detailsWidth = PAGE.x + PAGE.width - detailsX - 18;
  const name = String(branding.name || BRAND.name);
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

  return PAGE.y + 94;
};

/** Dedicated title bar, drawn as its own layout step (spec item #2). */
const drawMainTitle = (doc, y, title) => {
  doc.save();
  doc.rect(PAGE.x, y, PAGE.width, 30).fill(BRAND.orange);
  doc.rect(PAGE.x, y, PAGE.width, 2).fill(BRAND.orangeLight);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(13).fillColor("#ffffff").text(title, PAGE.x, y + 9, {
    width: PAGE.width,
    align: "center",
  });

  return y + 30;
};

const drawFooter = (doc, { branding = {}, hasAgentBranding = false, agentFooterImage = null } = {}) => {
  if (hasAgentBranding && agentFooterImage) {
    try {
      doc.image(agentFooterImage, PAGE.x, PAGE.footerY - 48, { fit: [PAGE.width, 76], align: "center", valign: "center" });
      return;
    } catch {
      /* fall through to text footer */
    }
  }

  if (hasAgentBranding) {
    drawRect(doc, PAGE.x, PAGE.footerY - 8, PAGE.width, 36, "#f8fafc", "#dbe3ee", 0.7);
    doc.font("Helvetica-Bold").fontSize(7.4).fillColor("#334155").text(String(branding.name || BRAND.name), PAGE.bodyX, PAGE.footerY, {
      width: PAGE.bodyWidth,
      align: "center",
    });
    doc.font("Helvetica").fontSize(7.2).fillColor("#475569").text(
      `Phone: ${branding.phone || "-"}  |  Email: ${branding.email || "-"}${branding.website ? `  |  ${branding.website}` : ""}`,
      PAGE.bodyX,
      PAGE.footerY + 13,
      { width: PAGE.bodyWidth, align: "center" },
    );
    return;
  }

  drawRect(doc, PAGE.x, PAGE.footerY, PAGE.width, 24, BRAND.navy, BRAND.navy);
  doc.save();
  doc.polygon([PAGE.x, PAGE.footerY], [PAGE.x + 14, PAGE.footerY + 12], [PAGE.x, PAGE.footerY + 24]).fill(BRAND.orangeBright);
  doc
    .polygon([PAGE.x + PAGE.width, PAGE.footerY], [PAGE.x + PAGE.width - 14, PAGE.footerY + 12], [PAGE.x + PAGE.width, PAGE.footerY + 24])
    .fill(BRAND.orangeBright);
  doc.restore();

  doc.font("Helvetica").fontSize(7.3).fillColor("#ffffff").text(
    `${BRAND.name}  |  ${branding.phone || BRAND.phone}  |  ${branding.email || BRAND.email}  |  ${branding.website || BRAND.website}`,
    PAGE.bodyX,
    PAGE.footerY + 8,
    { width: PAGE.bodyWidth, align: "center" },
  );
};

const drawContinuationBanner = (doc, title) => {
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.muted).text(`${title} (contd.)`, PAGE.bodyX, 30, {
    width: PAGE.bodyWidth,
    align: "right",
  });
};

/* ============================================================================
 * PAGE-BREAK MANAGEMENT
 *
 * `pageCtx` is created once per document and reused everywhere so that a
 * table/paragraph drawer never has to know how to add a page itself beyond
 * calling `ensureSpace`.
 * ==========================================================================*/

const createPageContext = (doc, { branding, hasAgentBranding, agentFooterImage, title }) => {
  const footerOpts = { branding, hasAgentBranding, agentFooterImage };

  doc.on("pageAdded", () => {
    drawFrame(doc);
    drawFooter(doc, footerOpts);
    drawContinuationBanner(doc, title);
  });

  return {
    /** Ensures `needed` px are available below `y`; returns the (possibly new) y. */
    ensureSpace(y, needed) {
      if (y + needed <= PAGE.contentBottom) return y;
      doc.addPage();
      return PAGE.continuationTop;
    },
  };
};

/* ============================================================================
 * GENERIC GRID TABLE UTILITY (drawGridTable)
 *
 * headers: [{ label, width, align? }]
 * rows:    array of row-defs, each row-def is an array (1 per column) of
 *          cell-defs: { lines: [{ text, bold?, color?, size?, align? }] }
 * ==========================================================================*/

const LINE_HEIGHT = 10.2;
const CELL_PAD_X = 7;
const CELL_PAD_Y = 6;

const measureRowHeight = (row) => {
  const maxLines = Math.max(1, ...row.map((cell) => cell.lines.length));
  return Math.max(24, maxLines * LINE_HEIGHT + CELL_PAD_Y * 2);
};

const drawTableHeaderRow = (doc, x, y, headers) => {
  const totalWidth = headers.reduce((sum, h) => sum + h.width, 0);
  doc.save();
  doc.rect(x, y, totalWidth, 20).fill(BRAND.navy);
  doc.restore();

  let cx = x;
  headers.forEach((h) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text(h.label, cx + CELL_PAD_X, y + 6, {
      width: h.width - CELL_PAD_X * 2,
      align: h.align || "left",
    });
    if (cx > x) {
      doc.save();
      doc.moveTo(cx, y).lineTo(cx, y + 20).lineWidth(0.6).strokeColor("#2a3550").stroke();
      doc.restore();
    }
    cx += h.width;
  });

  return y + 20;
};

const drawTableDataRow = (doc, x, y, headers, row) => {
  const totalWidth = headers.reduce((sum, h) => sum + h.width, 0);
  const rowHeight = measureRowHeight(row);

  doc.save();
  doc.rect(x, y, totalWidth, rowHeight).lineWidth(0.7).strokeColor(BRAND.border).stroke();
  doc.restore();

  let cx = x;
  headers.forEach((h, colIndex) => {
    if (cx > x) {
      doc.save();
      doc.moveTo(cx, y).lineTo(cx, y + rowHeight).lineWidth(0.7).strokeColor(BRAND.border).stroke();
      doc.restore();
    }

    let ly = y + CELL_PAD_Y;
    const cell = row[colIndex] || { lines: [{ text: "-" }] };
    cell.lines.forEach((line) => {
      doc
        .font(line.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(line.size || 8.3)
        .fillColor(line.color || BRAND.text)
        .text(line.text ?? "-", cx + CELL_PAD_X, ly, {
          width: h.width - CELL_PAD_X * 2,
          align: line.align || h.align || "left",
        });
      ly += LINE_HEIGHT;
    });

    cx += h.width;
  });

  return y + rowHeight;
};

/**
 * Draws a bordered grid table with a solid header bar, wrapping text inside
 * cells and re-emitting the header row automatically whenever a page break
 * occurs mid-table.
 */
const drawGridTable = (doc, pageCtx, { x = PAGE.bodyX, y, headers, rows }) => {
  let cursorY = pageCtx.ensureSpace(y, 20 + measureRowHeight(rows[0] || [{ lines: [{ text: "-" }] }]));
  cursorY = drawTableHeaderRow(doc, x, cursorY, headers);

  rows.forEach((row) => {
    const rowHeight = measureRowHeight(row);
    const afterBreakY = pageCtx.ensureSpace(cursorY, rowHeight);
    if (afterBreakY !== cursorY) {
      // A page break happened - repeat the header on the new page for context.
      cursorY = drawTableHeaderRow(doc, x, afterBreakY, headers);
    } else {
      cursorY = afterBreakY;
    }
    cursorY = drawTableDataRow(doc, x, cursorY, headers, row);
  });

  return cursorY;
};

/* ============================================================================
 * TRIP VOUCHER TABLE (label/value 2-column grid, spec item #3)
 * ==========================================================================*/

const drawLabelValueHalfCell = (doc, x, y, width, height, label, value, labelWidth = 84) => {
  doc.save();
  doc.rect(x, y, width, height).lineWidth(0.7).strokeColor(BRAND.border).stroke();
  doc.rect(x, y, labelWidth, height).fillAndStroke(BRAND.labelBg, BRAND.border);
  doc.moveTo(x + labelWidth, y).lineTo(x + labelWidth, y + height).lineWidth(0.7).strokeColor(BRAND.border).stroke();
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(8.3).fillColor(BRAND.text).text(label, x + 8, y + height / 2 - 5, {
    width: labelWidth - 14,
  });
  doc.font("Helvetica").fontSize(8.6).fillColor(BRAND.text).text(value || "-", x + labelWidth + 8, y + height / 2 - 5, {
    width: width - labelWidth - 14,
  });
};

const drawTripVoucherTable = (doc, pageCtx, y, data) => {
  let cursorY = pageCtx.ensureSpace(y, 22);
  cursorY = drawSectionHeader(doc, cursorY, "Trip Voucher");

  const halfWidth = PAGE.bodyWidth / 2;
  const rowHeight = 26;
  const leftX = PAGE.bodyX;
  const rightX = PAGE.bodyX + halfWidth;

  const pairedRows = [
    { left: ["Trip ID", data.tripId], right: ["Start Date", data.startDate] },
    { left: ["Destination", data.destination], right: ["Trip Duration", data.duration] },
    { left: ["Guest Name", data.guestName], right: ["Guest Ph.", data.guestPhone] },
  ];

  pairedRows.forEach(({ left, right }) => {
    cursorY = pageCtx.ensureSpace(cursorY, rowHeight);
    drawLabelValueHalfCell(doc, leftX, cursorY, halfWidth, rowHeight, left[0], left[1]);
    drawLabelValueHalfCell(doc, rightX, cursorY, halfWidth, rowHeight, right[0], right[1]);
    cursorY += rowHeight;
  });

  // Pax has no right-hand equivalent, so it spans the full row width.
  cursorY = pageCtx.ensureSpace(cursorY, rowHeight);
  drawLabelValueHalfCell(doc, leftX, cursorY, PAGE.bodyWidth, rowHeight, "Pax", data.pax, 84);
  cursorY += rowHeight;

  return cursorY;
};

/* ============================================================================
 * CATEGORIZED SERVICES TABLES (spec item #4)
 * ==========================================================================*/

const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("confirm")) return BRAND.success;
  if (s.includes("cancel")) return BRAND.danger;
  return BRAND.orange; // pending / unknown
};

const groupServicesByType = (services = []) => {
  const preferredOrder = ["hotel", "flight", "cab", "transfer", "activity", "sightseeing"];
  const groups = new Map();

  services.forEach((service) => {
    const type = String(service.type || "other").toLowerCase();
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(service);
  });

  const orderedKeys = [
    ...preferredOrder.filter((k) => groups.has(k)),
    ...[...groups.keys()].filter((k) => !preferredOrder.includes(k)).sort(),
  ];

  return orderedKeys.map((type) => ({ type, items: groups.get(type) }));
};

const CATEGORY_LABELS = {
  hotel: "Hotels",
  flight: "Flights",
  cab: "Cabs",
  transfer: "Transfers",
  activity: "Activities",
  sightseeing: "Sightseeing",
};

const resolveConfirmationNumber = (service) => {
  const raw = String(service.confirmation || "").trim();
  const isStatusWord = /^(pending|confirmed|not available)$/i.test(raw);
  return (
    service.confirmationNumber ||
    service.confirmationNo ||
    service.cnfNumber ||
    service.supplierConfirmation ||
    (!isStatusWord && raw ? raw : "") ||
    "-"
  );
};

const resolveStatus = (service, confirmationNumber) => {
  const raw = String(service.confirmation || "").trim();
  return service.status || (confirmationNumber === "-" || /^pending$/i.test(raw) ? "Pending" : "Confirmed");
};

/** Hotel-specific columns: Hotel | Check-In | Check-Out | Accommodation */
const buildHotelRow = (service) => {
  const confirmationNumber = resolveConfirmationNumber(service);
  const status = resolveStatus(service, confirmationNumber);

  const hotelLines = [{ text: service.name || service.title || "Hotel details missing", bold: true }];
  if (service.address) hotelLines.push({ text: service.address, size: 7.4, color: BRAND.muted });

  const checkInLines = [{ text: formatDateLabel(service.checkIn || service.checkInDate) }];
  if (service.nights) checkInLines.push({ text: `${service.nights} Night${service.nights > 1 ? "s" : ""}`, size: 7.4, color: BRAND.muted });

  const checkOutLines = [{ text: formatDateLabel(service.checkOut || service.checkOutDate) }];

  const accommodationLines = [];
  if (service.roomType || service.roomCount) {
    accommodationLines.push({ text: `${service.roomCount || 1} x ${service.roomType || "Room"}` });
  }
  if (service.mealPlan) accommodationLines.push({ text: service.mealPlan, size: 7.6, color: BRAND.muted });
  accommodationLines.push({ text: `CNF: ${confirmationNumber}`, bold: true, color: statusColor(status), size: 7.8 });

  return [
    { lines: hotelLines },
    { lines: checkInLines },
    { lines: checkOutLines },
    { lines: accommodationLines },
  ];
};

/** Generic columns for every non-hotel category: Date | Description | Confirmation No. | Status */
const buildGenericRow = (service) => {
  const confirmationNumber = resolveConfirmationNumber(service);
  const status = resolveStatus(service, confirmationNumber);

  const descriptionLines = [{ text: service.name || service.title || "Service details missing", bold: true }];
  if (service.description) descriptionLines.push({ text: service.description, size: 7.4, color: BRAND.muted });

  return [
    { lines: [{ text: formatDateLabel(service.date || service.travelDate) }] },
    { lines: descriptionLines },
    { lines: [{ text: confirmationNumber }] },
    { lines: [{ text: status, bold: true, color: statusColor(status) }] },
  ];
};

const drawServicesSection = (doc, pageCtx, y, services = []) => {
  const groups = groupServicesByType(services);
  let cursorY = y;

  groups.forEach(({ type, items }) => {
    const label = CATEGORY_LABELS[type] || `${capitalize(type)}s`;

    cursorY = pageCtx.ensureSpace(cursorY, 22);
    cursorY = drawSectionHeader(doc, cursorY, label);

    if (type === "hotel") {
      const headers = [
        { label: "Hotel", width: 150 },
        { label: "Check-In", width: 90 },
        { label: "Check-Out", width: 90 },
        { label: "Accommodation", width: 165 },
      ];
      const rows = items.map(buildHotelRow);
      cursorY = drawGridTable(doc, pageCtx, { y: cursorY, headers, rows });
    } else {
      const headers = [
        { label: "Date", width: 85 },
        { label: "Description", width: 220 },
        { label: "Confirmation No.", width: 105 },
        { label: "Status", width: 85 },
      ];
      const rows = items.map(buildGenericRow);
      cursorY = drawGridTable(doc, pageCtx, { y: cursorY, headers, rows });
    }

    cursorY += 12; // gap before next category
  });

  return cursorY;
};

/* ============================================================================
 * DYNAMIC TERMS AND CONDITIONS (spec item #5)
 *
 * Accepts:
 *  - an array of plain strings           -> rendered as bullets
 *  - an array of { text, bold, heading } -> bold/heading honoured per item
 *  - an HTML-ish string                  -> <li> become bullets, <b>/<strong>
 *                                            become bold runs, other tags
 *                                            are stripped
 * ==========================================================================*/

const decodeEntities = (str = "") =>
  str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

/** Splits a chunk of text/HTML into { text, bold } runs on <b>/<strong>. */
const splitBoldRuns = (fragment = "") => {
  const runs = [];
  const regex = /<(b|strong)>(.*?)<\/\1>/gis;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(fragment)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: fragment.slice(lastIndex, match.index), bold: false });
    }
    runs.push({ text: match[2], bold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < fragment.length) {
    runs.push({ text: fragment.slice(lastIndex), bold: false });
  }

  return runs
    .map((r) => ({ ...r, text: decodeEntities(r.text.replace(/<[^>]+>/g, "")).trim() }))
    .filter((r) => r.text.length > 0);
};

const normalizeTerms = (input) => {
  // Array of strings or objects. A string entry may itself contain several
  // <li> tags (e.g. pasted from a rich-text editor), so it is expanded into
  // one bullet per <li> rather than being treated as a single bullet.
  if (Array.isArray(input) && input.length) {
    return input.flatMap((item) => {
      if (typeof item === "string") {
        const listItems = [...item.matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map((m) => m[1]);
        if (listItems.length) {
          return listItems.map((li) => ({ type: "bullet", runs: splitBoldRuns(li) }));
        }
        return [{ type: "bullet", runs: splitBoldRuns(item) }];
      }
      const text = item.text || item.label || "";
      return [
        {
          type: item.heading ? "heading" : "bullet",
          runs: [{ text: decodeEntities(String(text)), bold: Boolean(item.bold || item.heading) }],
        },
      ];
    });
  }

  // HTML / plain string.
  if (typeof input === "string" && input.trim()) {
    const listItems = [...input.matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map((m) => m[1]);
    if (listItems.length) {
      return listItems.map((item) => ({ type: "bullet", runs: splitBoldRuns(item) }));
    }

    const paragraphs = input
      .split(/<\/p>|<br\s*\/?>|\n+/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length) {
      return paragraphs.map((p) => ({ type: "paragraph", runs: splitBoldRuns(p) }));
    }
  }

  // Fallback default terms when none were supplied by the database.
  return [
    "All bookings are subject to availability at the time of confirmation.",
    "Check-in and check-out times are as per the respective service provider's policy.",
    "Cancellations and amendments are governed by the applicable supplier's terms.",
    "Holiday Circuit acts as a facilitator and is not liable for service-provider delays.",
  ].map((text) => ({ type: "bullet", runs: [{ text, bold: false }] }));
};

const drawTermsSection = (doc, pageCtx, y, termsInput) => {
  const terms = normalizeTerms(termsInput);
  let cursorY = pageCtx.ensureSpace(y, 22);
  cursorY = drawSectionHeader(doc, cursorY, "Terms and Conditions");
  cursorY += 10;

  const textX = PAGE.bodyX + 4;
  const textWidth = PAGE.bodyWidth - 8;

  terms.forEach((term) => {
    const bulletIndent = term.type === "bullet" ? 12 : 0;
    const startX = textX + bulletIndent;
    const startWidth = textWidth - bulletIndent;

    cursorY = pageCtx.ensureSpace(cursorY, 12);

    if (term.type === "bullet") {
      doc.font("Helvetica").fontSize(8.4).fillColor(BRAND.text).text("•", textX, cursorY, { width: 10 });
    }

    doc.fontSize(term.type === "heading" ? 9.5 : 8.4).fillColor(BRAND.text);
    term.runs.forEach((run, idx) => {
      const isLast = idx === term.runs.length - 1;
      doc.font(run.bold || term.type === "heading" ? "Helvetica-Bold" : "Helvetica");
      if (idx === 0) {
        doc.text(`${run.text} `, startX, cursorY, { width: startWidth, continued: !isLast, lineGap: 2 });
      } else {
        doc.text(`${run.text} `, { continued: !isLast, lineGap: 2 });
      }
    });

    cursorY = doc.y + 4;
  });

  return cursorY;
};

/* ============================================================================
 * HELPLINE TABLE (spec item #6)
 * ==========================================================================*/

const drawHelplineTable = (doc, pageCtx, y, helpline = {}) => {
  let cursorY = pageCtx.ensureSpace(y, 22);
  cursorY = drawSectionHeader(doc, cursorY, "Helpline");

  const headers = [
    { label: "Company Name", width: 195, align: "left" },
    { label: "Timings", width: 150, align: "center" },
    { label: "Phone Number", width: 150, align: "right" },
  ];

  const rows = [
    [
      { lines: [{ text: helpline.companyName || BRAND.name, bold: true }] },
      { lines: [{ text: helpline.timings || "24x7 Operational", align: "center" }] },
      { lines: [{ text: helpline.phone || BRAND.phone, align: "right", bold: true, color: BRAND.orange }] },
    ],
  ];

  return drawGridTable(doc, pageCtx, { y: cursorY, headers, rows });
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
  const dirPath = ensureVouchersDir();
  const safeVoucherNumber = String(voucherDetails.voucherNumber || voucherDetails.query || "voucher").replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `Travel_Voucher_${safeVoucherNumber}.pdf`;
  const absoluteFilePath = path.join(dirPath, fileName);
  const publicFilePath = `/uploads/vouchers/${fileName}`;

  const doc = new PDFDocument({ margin: 34, size: "A4" });
  const stream = fs.createWriteStream(absoluteFilePath);
  doc.pipe(stream);

  const title = "Booking Confirmation Voucher";
  const branding = voucherDetails?.branding && typeof voucherDetails.branding === "object" ? voucherDetails.branding : {};
  const hasAgentBranding = Boolean(branding.name || branding.logo || branding.footer);
  const [agentLogo, agentFooterImage] = hasAgentBranding
    ? await Promise.all([loadBrandImage(branding.logo), loadBrandImage(branding.footer)])
    : [null, null];

  // Page 1 frame/footer must be drawn manually - the `pageAdded` listener
  // (registered below) only fires for page 2 onward.
  drawFrame(doc);
  drawFooter(doc, { branding, hasAgentBranding, agentFooterImage });

  const pageCtx = createPageContext(doc, { branding, hasAgentBranding, agentFooterImage, title });

  // 1. Header/Logo
  let y = hasAgentBranding ? drawAgentHeader(doc, branding, agentLogo) : drawHeader(doc, { logoPath: resolveBrandLogoPath() });

  // 2. Title
  y = drawMainTitle(doc, y + 8, title);
  y += 16;

  // 3. Introductory text
  doc.font("Helvetica").fontSize(9).fillColor(BRAND.muted).text(
    "We are pleased to confirm the below booking. Please find confirmation details",
    PAGE.bodyX,
    y,
    { width: PAGE.bodyWidth, align: "left" },
  );
  y = doc.y + 14;

  // 4. Trip Voucher table
  const passengers = formatTravelerBreakup({
    adults: voucherDetails.adults,
    children: voucherDetails.children,
    travelerSummary: voucherDetails.travelerSummary,
    passengers: voucherDetails.passengers,
  });

  y = drawTripVoucherTable(doc, pageCtx, y, {
    tripId: voucherDetails.tripId || voucherDetails.voucherNumber || voucherDetails.query || "-",
    destination: voucherDetails.destination,
    guestName: voucherDetails.guestName || voucherDetails.name,
    pax: passengers,
    startDate: voucherDetails.startDate || formatDateLabel(voucherDetails.travelDate || voucherDetails.date),
    duration: voucherDetails.duration,
    guestPhone: voucherDetails.guestPhone || voucherDetails.phone,
  });
  y += 14;

  // 5. Services section, grouped by type
  if (Array.isArray(voucherDetails.services) && voucherDetails.services.length) {
    y = drawServicesSection(doc, pageCtx, y, voucherDetails.services);
  }

  // 6. Terms and conditions
  y = drawTermsSection(doc, pageCtx, y, voucherDetails.termsAndConditions);
  y += 14;

  // 7. Helpline table
  y = drawHelplineTable(doc, pageCtx, y, {
    companyName: branding.name || BRAND.name,
    timings: voucherDetails.helpline?.timings,
    phone: branding.phone || voucherDetails.helpline?.phone || BRAND.phone,
  });

  await finalizePdf(doc, stream);

  return {
    absoluteFilePath,
    publicFilePath,
    fileName,
  };
};