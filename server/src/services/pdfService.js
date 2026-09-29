import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import { pdfMemoryCache } from "../utils/pdfCache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveFontPath = (fileName) => {
  const candidates = [
    path.join(__dirname, "..", "assets", "fonts", fileName),
    path.join(process.cwd(), "src", "assets", "fonts", fileName),
    path.join(process.cwd(), "server", "src", "assets", "fonts", fileName),
  ];
  return candidates.find((p) => fs.existsSync(p) && fs.statSync(p).size > 10000) || candidates[0];
};

const FONT_REGULAR_PATH = resolveFontPath("Roboto-Regular.ttf");
const FONT_BOLD_PATH = resolveFontPath("Roboto-Bold.ttf");

const getLogoBuffer = (inputPathOrUrl) => {
  return new Promise((resolve) => {
    try { 
      if (!inputPathOrUrl || typeof inputPathOrUrl !== "string") {
        resolve(null);
        return;
      }

      let cleanPath = inputPathOrUrl.trim();
      if (
        !cleanPath ||
        cleanPath.includes("1771279110850") ||
        cleanPath.includes("1771278920287") ||
        cleanPath.includes("1771278816234")
      ) {
        resolve(null);
        return;
      }

      if (cleanPath.startsWith("data:image/")) {
        try {
          const base64Data = cleanPath.split(";base64,").pop();
          if (base64Data) {
            resolve(Buffer.from(base64Data, "base64"));
            return;
          }
        } catch (e) {}
      }

      let relativePath = cleanPath;
      if (cleanPath.includes("/uploads/")) {
        relativePath = cleanPath.substring(cleanPath.indexOf("/uploads/") + 9);
      } else if (cleanPath.includes("\\uploads\\")) {
        relativePath = cleanPath.substring(cleanPath.indexOf("\\uploads\\") + 9);
      }
      relativePath = relativePath.replace(/^[/\\]+/, "");

      const candidates = [
        cleanPath,
        path.join(process.cwd(), relativePath),
        path.join(process.cwd(), "uploads", relativePath),
        path.join(process.cwd(), "..", "uploads", relativePath),
        path.join(process.cwd(), "src", "uploads", relativePath),
      ];

      for (const candidate of candidates) {
        try {
          if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            resolve(fs.readFileSync(candidate));
            return;
          }
        } catch (err) {}
      }

      if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
        const client = cleanPath.startsWith("https") ? https : http;
        const req = client.get(cleanPath, (res) => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          const data = [];
          res.on("data", (chunk) => data.push(chunk));
          res.on("end", () => resolve(Buffer.concat(data)));
          res.on("error", () => resolve(null));
        });
        req.on("error", () => resolve(null));
        req.setTimeout(2500, () => {
          req.destroy();
          resolve(null);
        });
        return;
      }

      resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
};

const BRAND = Object.freeze({
  name: "Holiday Circuit",
  subline: "Travel Quotation",
  address: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
  email: "ops@holidaycircuit.com",
  phone: "+91 8851346665, +91 9971706003",
});

const COLORS = Object.freeze({
  ink: "#10213a",
  text: "#334155",
  muted: "#64748b",
  accent: "#0f766e",
  accentSoft: "#f0fdfa",
  accentBorder: "#e2e8f0",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  light: "#f8fafc",
  totalBg: "#f0fdf4",
  totalBorder: "#bbf7d0",
  totalText: "#15803d",
});

const PAGE = Object.freeze({
  frameX: 28,
  frameY: 28,
  contentX: 44,
  contentWidth: 507,
  topRibbonY: 54,
  footerY: 790,
});

const CONTENT_BOTTOM_LIMIT = PAGE.footerY - 16;
const SERVICE_ROW_BREAK_LIMIT = CONTENT_BOTTOM_LIMIT - 6;

const DEFAULT_SELLER_BANK_DETAILS = Object.freeze([
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
]);

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const downloadFont = (url, destPath) => {
  return new Promise((resolve, reject) => {
    ensureDirectory(path.dirname(destPath));
    const handleRequest = (currentUrl) => {
      https
        .get(currentUrl, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            handleRequest(response.headers.location);
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download font: status code ${response.statusCode}`));
            return;
          }
          const file = fs.createWriteStream(destPath);
          response.pipe(file);
          file.on("finish", () => {
            file.close(resolve);
          });
          file.on("error", (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        })
        .on("error", (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
    };
    handleRequest(url);
  });
};

const ensureFontsExist = async () => {
  try {
    if (fs.existsSync(FONT_REGULAR_PATH) && fs.existsSync(FONT_BOLD_PATH)) {
      const regSize = fs.statSync(FONT_REGULAR_PATH).size;
      const boldSize = fs.statSync(FONT_BOLD_PATH).size;
      if (regSize > 10000 && boldSize > 10000) {
        return true;
      }
      // If either file is empty/corrupted, delete them
      if (fs.existsSync(FONT_REGULAR_PATH)) fs.unlinkSync(FONT_REGULAR_PATH);
      if (fs.existsSync(FONT_BOLD_PATH)) fs.unlinkSync(FONT_BOLD_PATH);
    }
  } catch (statErr) {
    console.error("Error statting font files:", statErr);
  }

  try {
    const regularUrl = "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf";
    const boldUrl = "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf";

    if (!fs.existsSync(FONT_REGULAR_PATH)) {
      await downloadFont(regularUrl, FONT_REGULAR_PATH);
    }
    if (!fs.existsSync(FONT_BOLD_PATH)) {
      await downloadFont(boldUrl, FONT_BOLD_PATH);
    }
    
    // Final verification of newly downloaded files
    if (fs.existsSync(FONT_REGULAR_PATH) && fs.existsSync(FONT_BOLD_PATH)) {
      const regSize = fs.statSync(FONT_REGULAR_PATH).size;
      const boldSize = fs.statSync(FONT_BOLD_PATH).size;
      if (regSize > 10000 && boldSize > 10000) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error downloading Roboto fonts, falling back to standard Helvetica:", error);
    try {
      if (fs.existsSync(FONT_REGULAR_PATH)) fs.unlinkSync(FONT_REGULAR_PATH);
      if (fs.existsSync(FONT_BOLD_PATH)) fs.unlinkSync(FONT_BOLD_PATH);
    } catch (cleanErr) {}
    return false;
  }
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "HC";
  const noise = ["pvt", "ltd", "private", "limited"];
  const words = name
    .trim()
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, "")) // Keep only alphabetic characters
    .filter(w => w.length > 0 && !noise.includes(w.toLowerCase()));

  if (words.length === 0) {
    const fallbackWords = name
      .trim()
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, ""))
      .filter(w => w.length > 0);
    if (fallbackWords.length === 0) return "HC";
    return fallbackWords[0].slice(0, 2).toUpperCase();
  }

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  const word = words[0];
  if (word.length >= 2) {
    return word.slice(0, 2).toUpperCase();
  }
  return word[0].toUpperCase();
};

const sanitizeFileToken = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "quote";

const INR_SYMBOL = "₹";

const formatCurrency = (value, currency = "INR") => {
  const symbol = String(currency || "INR").toUpperCase() === "INR" ? INR_SYMBOL : currency;
  return `${symbol} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
};

const drawRupeeSymbol = (doc, x, y, options = {}) => {
  const size = Number(options?.size || 12);
  const color = options?.color || COLORS.ink;
  const strokeWidth = Number(options?.strokeWidth || Math.max(0.85, size * 0.09));
  const leftX = x;
  const stemX = x + size * 0.16;
  const topY = y;
  const midY = y + size * 0.28;
  const joinY = y + size * 0.52;
  const bottomY = y + size;
  const rightTopX = x + size * 0.82;
  const rightMidX = x + size * 0.72;
  const rightCurveX = x + size * 0.76;
  const rightLegX = x + size * 0.74;

  doc
    .save()
    .lineCap("round")
    .lineJoin("round")
    .lineWidth(strokeWidth)
    .strokeColor(color)
    // Top horizontal bar
    .moveTo(leftX, topY)
    .lineTo(rightTopX, topY)
    // Second horizontal bar
    .moveTo(leftX, midY)
    .lineTo(rightMidX, midY)
    // Vertical stem
    .moveTo(stemX, topY)
    .lineTo(stemX, joinY)
    // Upper loop (R-curve)
    .moveTo(stemX, topY)
    .bezierCurveTo(
      rightCurveX,
      topY + size * 0.02,
      rightCurveX,
      joinY,
      stemX,
      joinY,
    )
    // Diagonal leg
    .moveTo(stemX + size * 0.06, joinY)
    .lineTo(rightLegX, bottomY)
    .stroke()
    .restore();
};

const formatDateLabel = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SMALL_NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS_WORDS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const formatWordsBelowHundred = (value) => {
  if (value < 20) return SMALL_NUMBER_WORDS[value];

  const tens = Math.floor(value / 10);
  const remainder = value % 10;
  return remainder ? `${TENS_WORDS[tens]} ${SMALL_NUMBER_WORDS[remainder]}` : TENS_WORDS[tens];
};

const formatWordsBelowThousand = (value) => {
  if (value < 100) return formatWordsBelowHundred(value);

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  return remainder
    ? `${SMALL_NUMBER_WORDS[hundreds]} Hundred ${formatWordsBelowHundred(remainder)}`
    : `${SMALL_NUMBER_WORDS[hundreds]} Hundred`;
};

const formatAmountInWords = (value) => {
  const normalizedValue = Math.round(Number(value || 0));

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return "Zero Only";
  }

  const groups = [
    { size: 10000000, label: "Crore" },
    { size: 100000, label: "Lakh" },
    { size: 1000, label: "Thousand" },
    { size: 1, label: "" },
  ];

  let remaining = normalizedValue;
  const parts = [];

  groups.forEach(({ size, label }) => {
    if (remaining < size) return;

    const count = Math.floor(remaining / size);
    remaining %= size;

    if (!count) return;

    const wordGroup = formatWordsBelowThousand(count);
    parts.push(label ? `${wordGroup} ${label}` : wordGroup);
  });

  return `${parts.join(" ").replace(/\s+/g, " ").trim()} Only`;
};

const resolveBrandLogoPath = () => {
  const candidates = [
    path.join(process.cwd(), "..", "client", "src", "assets", "logo img.png"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
};

const drawRoundedBox = (doc, x, y, width, height, fillColor, strokeColor = COLORS.border, radius = 3) => {
  doc.save();
  doc.roundedRect(x, y, width, height, radius).fillAndStroke(fillColor, strokeColor);
  doc.restore();
};

const drawPageFrame = (doc) => {
  const frameWidth = doc.page.width - PAGE.frameX * 2;
  const frameHeight = doc.page.height - PAGE.frameY * 2;

  doc
    .save()
    .roundedRect(PAGE.frameX, PAGE.frameY, frameWidth, frameHeight, 6)
    .lineWidth(0.8)
    .strokeColor("#cbd5e1")
    .stroke()
    .restore();

  const brandName = doc.brandName || "Holiday Circuit";

  doc.save();
  doc.rect(PAGE.contentX, PAGE.topRibbonY, PAGE.contentWidth, 20).fill(COLORS.accent);
  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(8)
    .fillColor("#ffffff")
    .text(`${brandName.toUpperCase()} QUOTATION`, PAGE.contentX, PAGE.topRibbonY + 6, {
      width: PAGE.contentWidth,
      align: "center",
      characterSpacing: 1.2,
    });
  doc.restore();

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text("This is a computer-generated quotation and does not require a signature.", PAGE.contentX, PAGE.footerY, {
      width: PAGE.contentWidth,
      align: "center",
    });
};

const drawLogoBadge = (doc, logoPath, x, y, initials = "HC") => {
  if (logoPath) {
    try {
      doc.image(logoPath, x, y, {
        fit: [48, 48],
        align: "center",
        valign: "center",
      });
      return;
    } catch (error) {
      // Fall back to the initials if the image cannot be rendered.
    }
  }

  doc.save();
  doc.roundedRect(x, y, 48, 48, 4).fillAndStroke("#ffffff", COLORS.border);
  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.accent)
    .text(initials, x, y + 14, { width: 48, align: "center" });
  doc.restore();
};

const drawMetaCell = (doc, { x, y, width, label, value }) => {
  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(7.4)
    .fillColor(COLORS.muted)
    .text(label, x, y, { width, align: "center" });

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(value || "-", x, y + 10, { width, align: "center" });
};

const drawPartyBlock = (doc, { x, y, width, title, primary, lines = [], align = "left", height = 76 }) => {
  drawRoundedBox(doc, x, y, width, height, "#ffffff", COLORS.border, 3);

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(title, x + 10, y + 10, {
      width: width - 20,
      align,
      characterSpacing: 0.9,
    });

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(13)
    .fillColor(COLORS.ink)
    .text(primary || "-", x + 10, y + 24, {
      width: width - 20,
      align,
    });

  let cursorY = y + 40;
  lines.forEach((line) => {
    if (!line) return;

    doc
      .font(doc.fontRegular || "Helvetica")
      .fontSize(8.2)
      .fillColor(COLORS.text)
      .text(line, x + 10, cursorY, {
        width: width - 20,
        align,
      });

    cursorY = doc.y + 2;
  });
};

const drawSectionBar = (doc, y, title) => {
  drawRoundedBox(doc, PAGE.contentX, y, PAGE.contentWidth, 20, "#f0fdfa", COLORS.accentBorder, 3);
  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.accent)
    .text(title, PAGE.contentX, y + 6, {
      width: PAGE.contentWidth,
      align: "center",
      characterSpacing: 0.8,
    });
};

const drawSnapshotGrid = (doc, quoteDetails = {}) => {
  const gridY = 246;
  const gridHeight = 64;
  const columns = 4;
  const columnWidth = PAGE.contentWidth / columns;
  const rowHeight = gridHeight / 2;
  const items = [
    { label: "Quotation No.", value: quoteDetails?.quotationNumber || "-" },
    { label: "Trip ID", value: quoteDetails?.queryId || "-" },
    { label: "Destination", value: quoteDetails?.destination || "-" },
    { label: "Total Services", value: String(Array.isArray(quoteDetails?.services) ? quoteDetails.services.length : 0) },
    { label: "Travel Dates", value: quoteDetails?.travelDates || "-" },
    { label: "Duration", value: quoteDetails?.durationLabel || "-" },
    { label: "Travelers", value: quoteDetails?.travelerSummary || "-" },
    { label: "Valid Till", value: quoteDetails?.validTill || "-" },
  ];

  drawSectionBar(doc, 220, "TRIP SNAPSHOT");
  drawRoundedBox(doc, PAGE.contentX, gridY, PAGE.contentWidth, gridHeight, "#ffffff", COLORS.border, 3);

  for (let index = 1; index < columns; index += 1) {
    const lineX = PAGE.contentX + columnWidth * index;
    doc
      .save()
      .moveTo(lineX, gridY)
      .lineTo(lineX, gridY + gridHeight)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke()
      .restore();
  }

  doc
    .save()
    .moveTo(PAGE.contentX, gridY + rowHeight)
    .lineTo(PAGE.contentX + PAGE.contentWidth, gridY + rowHeight)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke()
    .restore();

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cellX = PAGE.contentX + column * columnWidth;
    const cellY = gridY + row * rowHeight;

    doc
      .font(doc.fontBold || "Helvetica-Bold")
      .fontSize(7.2)
      .fillColor(COLORS.muted)
      .text(item.label, cellX + 8, cellY + 7, { width: columnWidth - 16 });

    doc
      .font(doc.fontBold || "Helvetica-Bold")
      .fontSize(8.2)
      .fillColor(COLORS.ink)
      .text(item.value || "-", cellX + 8, cellY + 18, {
        width: columnWidth - 16,
      });
  });
};

const getServiceBadgePalette = (typeLabel = "") => {
  const normalized = String(typeLabel || "").trim().toLowerCase();

  if (normalized.includes("hotel")) {
    return { fill: "#dbeafe", stroke: "#93c5fd", text: "#1d4ed8" };
  }
  if (normalized.includes("transport")) {
    return { fill: "#dcfce7", stroke: "#86efac", text: "#15803d" };
  }
  if (normalized.includes("activity")) {
    return { fill: "#fef3c7", stroke: "#fcd34d", text: "#b45309" };
  }
  if (normalized.includes("sightseeing")) {
    return { fill: "#ede9fe", stroke: "#c4b5fd", text: "#6d28d9" };
  }

  return { fill: "#e2e8f0", stroke: "#cbd5e1", text: COLORS.ink };
};

const drawServiceTypePill = (doc, x, y, width, label) => {
  const palette = getServiceBadgePalette(label);
  const pillWidth = Math.min(width - 12, Math.max(44, doc.widthOfString(label || "-", { font: doc.fontBold || "Helvetica-Bold", size: 7.5 }) + 16));
  const pillX = x + Math.max(6, (width - pillWidth) / 2);

  doc.save();
  doc.roundedRect(pillX, y, pillWidth, 16, 3).fillAndStroke(palette.fill, palette.stroke);
  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(palette.text)
    .text(label || "-", pillX, y + 4.5, {
      width: pillWidth,
      align: "center",
    });
  doc.restore();
};

const drawServicesTableHeader = (doc, y) => {
  const columns = [
    { label: "S.NO.", x: PAGE.contentX, width: 38, align: "center" },
    { label: "PARTICULARS", x: PAGE.contentX + 38, width: 165, align: "left" },
    { label: "CATEGORY", x: PAGE.contentX + 203, width: 74, align: "center" },
    { label: "SERVICE DATE", x: PAGE.contentX + 277, width: 76, align: "center" },
    { label: "LOCATION", x: PAGE.contentX + 353, width: 82, align: "left" },
    { label: "QTY", x: PAGE.contentX + 435, width: 72, align: "center" },
  ];

  drawRoundedBox(doc, PAGE.contentX, y, PAGE.contentWidth, 22, "#f0fdfa", COLORS.border, 3);

  columns.forEach((column, index) => {
    if (index > 0) {
      doc
        .save()
        .moveTo(column.x, y)
        .lineTo(column.x, y + 22)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke()
        .restore();
    }

    doc
      .font(doc.fontBold || "Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.ink)
      .text(column.label, column.x + 4, y + 7, {
        width: column.width - 8,
        align: column.align,
        characterSpacing: 0.4,
      });
  });

  return columns;
};

const buildServiceDescriptionLines = (description = "") => {
  const normalizedDescription = String(description || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

  if (!normalizedDescription) return [];

  return normalizedDescription
    .split("\n")
    .flatMap((line) =>
      line
        .replace(/\s+(?=Extra km rate:|Note:)/gi, "\n")
        .split("\n")
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    )
    .map((line) => {
      const isHighlighted = /^(Extra km rate:|Note:)/i.test(line);
      return {
        text: isHighlighted ? line : `Notes: ${line}`,
        highlighted: isHighlighted,
      };
    });
};

const getServiceDescriptionLinesHeight = (doc, lines = [], width = 0) => {
  if (!lines.length) return 0;

  return lines.reduce((height, line, index) => {
    const lineHeight = doc.heightOfString(line.text, { width });
    return height + lineHeight + (index > 0 ? 2 : 0);
  }, 0);
};

const drawTextWithRupeeSymbol = (doc, text, x, y, options = {}) => {
  const value = String(text || "");
  const width = Number(options.width || 0);
  const color = options.color || COLORS.text;
  const fontSize = Number(options.fontSize || 8.3);
  const fontName = options.font || doc.fontRegular || "Helvetica";

  doc
    .font(fontName)
    .fontSize(fontSize)
    .fillColor(color)
    .text(value, x, y, { width });
  return doc.y;
};

const drawServiceDescriptionLines = (doc, lines = [], x, y, width) => {
  let cursorY = y;

  lines.forEach((line, index) => {
    if (index > 0) cursorY += 2;

    cursorY = drawTextWithRupeeSymbol(doc, line.text, x, cursorY, {
      width,
      color: line.highlighted ? "#c2410c" : COLORS.text,
      font: line.highlighted ? (doc.fontBold || "Helvetica-Bold") : (doc.fontRegular || "Helvetica"),
      fontSize: 8.3,
    });
  });

  return cursorY;
};

const drawServiceRow = (doc, columns, y, service = {}, index = 0) => {
  const type = String(service?.type || service?.serviceType || service?.category || "").toLowerCase();
  
  // Format description lines with rich details (Pickup Time, Tour Type, Slot, Duration, etc.)
  let rawDesc = String(service?.description || "");
  const extraDetails = [];

  if (["transfer", "transport", "car"].includes(type)) {
    const pickupTime = service?.pickupTime || service?.time || service?.selectedSlot || "";
    if (pickupTime && !rawDesc.toLowerCase().includes("pickup time")) {
      extraDetails.push(`Pickup Time: ${pickupTime}`);
    }
  } else if (["activity", "sightseeing"].includes(type)) {
    const tourType = service?.tourType || "Sharing Tour";
    const slotTime = service?.selectedSlot || service?.slot || service?.time || "";
    
    // Format duration (e.g. 600 -> 10 Hours)
    const rawDur = String(service?.duration || "").trim();
    let formattedDur = "";
    if (rawDur) {
      const numDur = Number(rawDur);
      if (!isNaN(numDur) && numDur > 0) {
        const hrs = numDur / 60;
        formattedDur = hrs >= 1 ? `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)} Hours` : `${numDur} Mins`;
      } else {
        formattedDur = rawDur;
      }
    }

    if (tourType && !rawDesc.toLowerCase().includes("tour type")) extraDetails.push(`Tour Type: ${tourType}`);
    if (slotTime && !rawDesc.toLowerCase().includes("slot")) extraDetails.push(`Slot: ${slotTime}`);
    if (formattedDur && !rawDesc.toLowerCase().includes("duration")) extraDetails.push(`Duration: ${formattedDur}`);
  } else if (["hotel", "stay", "accommodation"].includes(type) || service?.hotelName) {
    const hotelName = service?.hotelName || service?.hotel || "";
    const rawStar = service?.starCategory || service?.hotelCategory || service?.starRating || "";
    const mealPlan = service?.mealPlan || service?.meals || service?.meal_plan || "";
    const roomCat = service?.roomCategory || service?.roomType || "";

    if (hotelName && !rawDesc.toLowerCase().includes(hotelName.toLowerCase())) {
      extraDetails.push(`Hotel: ${hotelName}`);
    }
    if (rawStar) {
      const starText = String(rawStar).toLowerCase().includes("star") ? String(rawStar) : `${rawStar} Star`;
      if (!rawDesc.toLowerCase().includes("star")) {
        extraDetails.push(`Rating: ${starText}`);
      }
    }
    if (mealPlan) {
      const u = String(mealPlan).toUpperCase();
      let mLabel = mealPlan;
      if (u === "EP" || u.includes("ROOM ONLY")) mLabel = "EP (Room Only)";
      else if (u === "CP" || u.includes("BREAKFAST")) mLabel = "CP (Breakfast Included)";
      else if (u === "MAP" || u.includes("DINNER")) mLabel = "MAP (Breakfast & Dinner)";
      else if (u === "AP" || u.includes("ALL MEALS")) mLabel = "AP (All Meals Included)";
      else if (u === "AI" || u.includes("ALL INCLUSIVE")) mLabel = "AI (All Inclusive)";
      if (!rawDesc.toLowerCase().includes("meal plan") && !rawDesc.toLowerCase().includes(mLabel.toLowerCase())) {
        extraDetails.push(`Meal Plan: ${mLabel}`);
      }
    }
    if (roomCat && !rawDesc.toLowerCase().includes(roomCat.toLowerCase())) {
      extraDetails.push(`Room: ${roomCat}`);
    }
  }

  const fullDesc = [rawDesc, ...extraDetails].filter(Boolean).join(" | ");
  const descriptionLines = buildServiceDescriptionLines(fullDesc);

  // Quantity / Pax formatting
  let quantityText = service?.quantityLabel || "-";
  if (["activity", "sightseeing"].includes(type)) {
    const numAdults = Number(service?.adults !== undefined && service?.adults !== null ? service?.adults : 0);
    const numChildren = Number(service?.children !== undefined && service?.children !== null ? service?.children : 0);
    const numInfants = Number(service?.infants !== undefined && service?.infants !== null ? service?.infants : 0);
    const hasBreakdown = (numAdults > 0 || numChildren > 0 || numInfants > 0);
    const totalPax = hasBreakdown ? (numAdults + numChildren + numInfants) : Number(service?.pax || 0);

    if (hasBreakdown) {
      const parts = [];
      if (numAdults > 0) parts.push(`${numAdults} Adult${numAdults > 1 ? 's' : ''}`);
      if (numChildren > 0) parts.push(`${numChildren} Child${numChildren > 1 ? 'ren' : ''}`);
      if (numInfants > 0) parts.push(`${numInfants} Infant${numInfants > 1 ? 's' : ''}`);
      quantityText = `${totalPax} Pax (${parts.join(", ")})`;
    } else if (totalPax > 1) {
      quantityText = `${totalPax} Pax`;
    }
  } else if (["transfer", "transport", "car"].includes(type)) {
    const pickupTime = service?.pickupTime || service?.time || "";
    if (pickupTime && !quantityText.toLowerCase().includes("pickup")) {
      quantityText = `${quantityText}\n(Pickup: ${pickupTime})`;
    }
  }

  const locationText = service?.location || service?.city || "-";
  const dateText = service?.serviceDateLabel || service?.date || "-";
  const titleText = service?.title || "Service";
  const typeText = normalizeServiceTypeLabel(service?.typeLabel || service?.type);

  doc.font(doc.fontBold || "Helvetica-Bold").fontSize(10);
  const titleHeight = doc.heightOfString(titleText, { width: columns[1].width - 16 });

  doc.font(doc.fontRegular || "Helvetica").fontSize(8.3);
  const notesHeight = getServiceDescriptionLinesHeight(doc, descriptionLines, columns[1].width - 16);
  const locationHeight = doc.heightOfString(locationText, { width: columns[4].width - 16 });
  const quantityHeight = doc.heightOfString(quantityText, { width: columns[5].width - 16, align: "center" });
  const dateHeight = doc.heightOfString(dateText, { width: columns[3].width - 16, align: "center" });

  const rowHeight = Math.max(
    44,
    titleHeight + notesHeight + 24,
    locationHeight + 18,
    quantityHeight + 18,
    dateHeight + 18,
  );

  drawRoundedBox(
    doc,
    PAGE.contentX,
    y,
    PAGE.contentWidth,
    rowHeight,
    index % 2 === 0 ? "#ffffff" : COLORS.light,
    COLORS.border,
    3,
  );

  columns.forEach((column, columnIndex) => {
    if (columnIndex === 0) return;

    doc
      .save()
      .moveTo(column.x, y)
      .lineTo(column.x, y + rowHeight)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke()
      .restore();
  });

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(String(index + 1), columns[0].x + 4, y + 14, {
      width: columns[0].width - 8,
      align: "center",
    });

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(titleText, columns[1].x + 8, y + 8, {
      width: columns[1].width - 16,
    });

  if (descriptionLines.length) {
    drawServiceDescriptionLines(
      doc,
      descriptionLines,
      columns[1].x + 8,
      y + 8 + titleHeight + 4,
      columns[1].width - 16,
    );
  }

  drawServiceTypePill(doc, columns[2].x, y + Math.max(10, rowHeight / 2 - 8), columns[2].width, typeText);

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.text)
    .text(dateText, columns[3].x + 6, y + 12, {
      width: columns[3].width - 12,
      align: "center",
    });

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.text)
    .text(locationText, columns[4].x + 8, y + 12, {
      width: columns[4].width - 16,
    });

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.text)
    .text(quantityText, columns[5].x + 6, y + 12, {
      width: columns[5].width - 12,
      align: "center",
    });

  return rowHeight;
};

const drawContinuationHeader = (
  doc,
  quoteDetails = {},
  title = "Quotation Details (Continued)",
) => {
  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.ink)
    .text(title, PAGE.contentX, 88);

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      `Quotation No. ${quoteDetails?.quotationNumber || "-"} | Trip ID ${quoteDetails?.queryId || "-"}`,
      PAGE.contentX,
      108,
      {
        width: PAGE.contentWidth,
        align: "right",
      },
    );
};

const SUMMARY_SECTION_HEIGHT = 96;

const drawSummarySection = (doc, y, quoteDetails = {}, servicesCount = 0) => {
  const leftWidth = 326;
  const rightWidth = 165;
  const leftX = PAGE.contentX;
  const rightX = PAGE.contentX + leftWidth + 16;
  const normalizedCurrency = String(quoteDetails?.currency || "INR").trim().toUpperCase() || "INR";
  const totalAmountNumber = Math.round(Number(quoteDetails?.totalAmount || 0));
  const amountText = formatCurrency(totalAmountNumber, normalizedCurrency);
  const amountWords = formatAmountInWords(quoteDetails?.totalAmount || 0);
  const isInrCurrency = normalizedCurrency === "INR";
  const amountWordsText = isInrCurrency ? `₹ ${amountWords}` : `${normalizedCurrency}: ${amountWords}`;

  drawSectionBar(doc, y, "QUOTATION SUMMARY");

  const boxY = y + 24;
  const boxHeight = 62;

  drawRoundedBox(doc, leftX, boxY, leftWidth, boxHeight, "#ffffff", COLORS.border, 3);
  drawRoundedBox(doc, rightX, boxY, rightWidth, boxHeight, COLORS.totalBg, COLORS.totalBorder, 3);

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text("AMOUNT CHARGEABLE (IN WORDS)", leftX + 10, boxY + 8);

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLORS.ink)
    .text(amountWordsText, leftX + 10, boxY + 22, {
      width: leftWidth - 20,
    });

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(7.8)
    .fillColor(COLORS.text)
    .text(
      `Selected services: ${servicesCount} | Recipient: ${quoteDetails?.recipientName || "-"}`,
      leftX + 10,
      boxY + 44,
      {
        width: leftWidth - 20,
      },
    );

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.totalText)
    .text("FINAL AMOUNT", rightX, boxY + 8, {
      width: rightWidth,
      align: "center",
      characterSpacing: 0.7,
    });

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.totalText)
    .text(amountText, rightX, boxY + 22, {
      width: rightWidth,
      align: "center",
    });

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.text)
    .text("Taxes and charges are already reflected in the total shared by operations.", rightX + 8, boxY + 44, {
      width: rightWidth - 16,
      align: "center",
    });

  return boxY + boxHeight + 8;
};

const parseStructuredTerms = (rawContent) => {
  if (!rawContent) return [];
  let text = "";
  if (Array.isArray(rawContent)) {
    text = rawContent
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return item.content || item.text || item.name || item.item || item.label || "";
        }
        return String(item || "");
      })
      .join("\n");
  } else if (typeof rawContent === "string") {
    text = rawContent;
  } else {
    text = String(rawContent || "");
  }

  // Convert HTML block tags to newlines
  text = text
    .replace(/<\/(p|li|div|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Split known major categories if merged
  const majorSections = [
    "Bookings and Reservations",
    "Travel Documents and Requirements",
    "Changes to Itineraries & Liability",
    "Contact Information",
    "Intellectual Property",
    "Changes to Terms and Conditions",
  ];

  majorSections.forEach((sec) => {
    const reg = new RegExp(`(^|\\s|\\.|\\n)(${sec})(:?)`, "gi");
    text = text.replace(reg, "\n\n__HEADER__$2:\n");
  });

  // Split sub-items
  const subItems = [
    "Booking Process",
    "Payment Terms",
    "Payment",
    "Confirmation",
    "Credit Card",
    "Confirmation Vouchers",
    "Airport Transfers & Tour Pick Ups",
    "Airport Transfers",
    "Taxes",
    "Changes & Cancellations",
    "Cancellations and Refunds",
    "Valid ID Proof",
    "Health & Vaccinations",
    "Travel Insurance",
    "Changes by [^:\n]+",
    "Service Providers Liability",
    "Force Majeure",
    "Governing Law",
    "Ownership",
  ];

  subItems.forEach((sub) => {
    const reg = new RegExp(`(^|\\s|\\.|\\n)(${sub}):`, "gi");
    text = text.replace(reg, "\n__SUB__$2:");
  });

  // Split payment nested items e.g. "Minimum 50%...", "Remaining 50%...", "In Case of Airline...", "If a booking is under..."
  text = text
    .replace(/(\.|\n)\s*(Minimum 50%[^\.]+?\.)/gi, "\n__NESTED__$2")
    .replace(/(\.|\n)\s*(Remaining 50%[^\.]+?\.)/gi, "\n__NESTED__$2")
    .replace(/(\.|\n)\s*(In Case of Airline[^\.]+?\.)/gi, "\n__NESTED__$2")
    .replace(/(\.|\n)\s*(If a booking is under[^\.]+?\.)/gi, "\n__NESTED__$2");

  // Split general sentences if merged after period without space
  text = text.replace(/([.!?])([A-Z0-9])/g, "$1\n$2");

  const rawLines = text
    .split("\n")
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);

  let headerCount = 0;
  let nestedCount = 0;

  const items = [];
  rawLines.forEach((line) => {
    if (line.startsWith("__HEADER__")) {
      headerCount++;
      nestedCount = 0;
      const cleanLine = line.replace("__HEADER__", "").trim();
      items.push({
        type: "header",
        level: 1,
        number: headerCount,
        text: `${headerCount}. ${cleanLine.replace(/:$/, "")}`,
        rawText: cleanLine,
      });
    } else if (line.startsWith("__SUB__")) {
      nestedCount = 0;
      const cleanLine = line.replace("__SUB__", "").trim();
      items.push({
        type: "subitem",
        level: 2,
        text: `• ${cleanLine}`,
        rawText: cleanLine,
      });
    } else if (line.startsWith("__NESTED__")) {
      nestedCount++;
      const cleanLine = line.replace("__NESTED__", "").trim();
      items.push({
        type: "nested",
        level: 3,
        number: nestedCount,
        text: `${nestedCount}. ${cleanLine}`,
        rawText: cleanLine,
      });
    } else {
      items.push({
        type: "text",
        level: 0,
        text: line,
        rawText: line,
      });
    }
  });

  return items;
};

const parseTermsContentList = (rawContent) => {
  return parseStructuredTerms(rawContent);
};

const getTermsSectionEstimatedHeight = (doc, customTerms = []) => {
  const items = parseStructuredTerms(customTerms);
  if (!items.length) return 60;

  let totalHeight = 16;
  items.forEach((item) => {
    const fontSize = item.type === "header" ? 8 : (item.type === "nested" ? 7.2 : 7.5);
    const fontName = item.type === "header" ? (doc.fontBold || "Helvetica-Bold") : (doc.fontRegular || "Helvetica");
    const xOffset = item.type === "nested" ? 22 : (item.type === "subitem" ? 8 : 0);
    const itemWidth = PAGE.contentWidth - 28 - xOffset;
    doc.font(fontName).fontSize(fontSize);
    const h = doc.heightOfString(item.text, { width: itemWidth });
    const topPad = item.type === "header" ? 5 : (item.type === "nested" ? 2 : 2.5);
    totalHeight += h + topPad;
  });

  return Math.max(60, totalHeight + 16);
};

const drawTermsSection = (doc, y, customTerms = []) => {
  const items = parseStructuredTerms(customTerms);
  const brandName = doc.brandName || BRAND.name;
  const isAgentBrand = brandName && brandName.trim().toLowerCase() !== BRAND.name.toLowerCase();
  if (!items.length) {
    items.push(
      { type: "text", level: 0, text: `Welcome to ${brandName}. These Terms and Conditions govern your use of ${brandName} services. When you make a booking, you agree to be bound by these Terms.` },
      { type: "header", level: 1, text: "1. Bookings and Reservations" },
      { type: "subitem", level: 2, text: "• Minimum 50% of the booking amount is required at the time of booking confirmation." },
      { type: "subitem", level: 2, text: "• Remaining 50% in 2 parts: 25% within 30 Days prior to departure and 25% within 20 days prior to departure." },
      { type: "subitem", level: 2, text: "• In Case of Airline booking / Train Tickets, 100% ticket cost to be paid at confirmation." },
      { type: "subitem", level: 2, text: "• In Case a booking is under 100% cancellation period, 100% booking amount is required at confirmation." },
      { type: "subitem", level: 2, text: "• Confirmation: Booking is confirmed only upon receipt of payment. Booking will be auto cancelled in case of non-payment within stipulated time." },
      { type: "subitem", level: 2, text: "• Credit Card: Payments may attract an additional charge from 3% to 5% depending upon card type." },
      { type: "subitem", level: 2, text: "• Confirmation Vouchers: Provided only 7 days before the arrival date." },
      { type: "subitem", level: 2, text: "• Airport Transfers & Tour Pickups: Includes 60 minutes waiting time for Airport pick-ups. Delayed at immigration/luggage requires calling emergency number to extend. For all other pick-ups, driver will wait for 10 minutes at Hotel Lobby / Reception." },
      { type: "subitem", level: 2, text: "• Taxes: Any changes in taxes (GST/TCS/Government Tax) at confirmation will be adjusted as per prevailing law." },
      { type: "subitem", level: 2, text: `• Changes & Cancellations are subject to fees/penalties determined by service providers and ${brandName}.` },
      { type: "header", level: 1, text: "2. Travel Documents and Requirements" },
      { type: "subitem", level: 2, text: "• Valid ID Proof: Responsibility of guest to possess valid ID/Visas. To Enter Nepal by Air: Valid Passport or Election Card is Mandatory. Aadhar Card is NOT valid for Travel." },
      { type: "subitem", level: 2, text: "• Health & Vaccinations: Guest is responsible for meeting all health and vaccination entry requirements." },
      { type: "subitem", level: 2, text: "• Travel Insurance: Strongly recommended to protect against unexpected events, trip cancellations, or emergencies." },
      { type: "header", level: 1, text: "3. Changes to Itineraries & Liability" },
      { type: "subitem", level: 2, text: `• Changes by ${brandName}: Right reserved to modify itinerary/accommodations due to unforeseen circumstances with prompt notice.` },
      { type: "subitem", level: 2, text: `• Force Majeure & Liability: ${brandName} acts as an intermediary; not liable for third-party negligence or force majeure events.` },
      { type: "subitem", level: 2, text: "• Governing Law: Governed by the laws of New Delhi Jurisdiction." },
      { type: "header", level: 1, text: "4. Contact Information" },
      { type: "subitem", level: 2, text: isAgentBrand && (doc.agentAddress || doc.agentEmail || doc.agentPhone)
        ? `• ${brandName}: ${[doc.agentAddress, doc.agentEmail ? `Email: ${doc.agentEmail}` : '', doc.agentPhone ? `Ph: ${doc.agentPhone}` : ''].filter(Boolean).join(' | ')}`
        : `• ${BRAND.name}: ${BRAND.address} | Email: ${BRAND.email} | Ph: ${BRAND.phone}`
      }
    );
  }

  drawSectionBar(doc, y, "TERMS AND CONDITIONS");

  let contentHeight = 14;
  items.forEach((item) => {
    const fontSize = item.type === "header" ? 8 : (item.type === "nested" ? 7.2 : 7.5);
    const fontName = item.type === "header" ? (doc.fontBold || "Helvetica-Bold") : (doc.fontRegular || "Helvetica");
    const xOffset = item.type === "nested" ? 22 : (item.type === "subitem" ? 8 : 0);
    const itemWidth = PAGE.contentWidth - 28 - xOffset;

    doc.font(fontName).fontSize(fontSize);
    const h = doc.heightOfString(item.text, { width: itemWidth });
    const topPad = item.type === "header" ? 5 : (item.type === "nested" ? 2 : 2.5);
    contentHeight += h + topPad;
  });

  const boxHeight = Math.max(50, contentHeight + 12);
  const boxY = y + 24;
  drawRoundedBox(doc, PAGE.contentX, boxY, PAGE.contentWidth, boxHeight, "#ffffff", COLORS.border, 3);

  let cursorY = boxY + 8;
  items.forEach((item) => {
    const fontSize = item.type === "header" ? 8 : (item.type === "nested" ? 7.2 : 7.5);
    const fontName = item.type === "header" ? (doc.fontBold || "Helvetica-Bold") : (doc.fontRegular || "Helvetica");
    const color = item.type === "header" ? "#0f172a" : (item.type === "nested" ? "#334155" : COLORS.text || "#1e293b");
    const xOffset = item.type === "nested" ? 20 : (item.type === "subitem" ? 8 : 0);
    const itemWidth = PAGE.contentWidth - 24 - xOffset;
    const topPad = item.type === "header" ? 4 : (item.type === "nested" ? 1.5 : 2);

    cursorY += topPad;
    doc
      .font(fontName)
      .fontSize(fontSize)
      .fillColor(color)
      .text(item.text, PAGE.contentX + 12 + xOffset, cursorY, {
        width: itemWidth,
      });

    cursorY = doc.y;
  });

  return boxY + boxHeight + 8;
};

const normalizeSellerBankDetails = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim(),
        }))
        .filter((item) => item.label && item.value)
    : [];

  return normalizedItems.length ? normalizedItems : [...DEFAULT_SELLER_BANK_DETAILS];
};

const normalizeServiceTypeLabel = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase().replace(/_/g, " ");

  if (!normalizedValue) return "Travel Service";
  if (normalizedValue === "hotel") return "Hotel";
  if (normalizedValue === "transfer" || normalizedValue === "transport" || normalizedValue === "car") {
    return "Transport";
  }
  if (normalizedValue === "activity") return "Activity";
  if (normalizedValue === "sightseeing") return "Sightseeing";

  return normalizedValue.replace(/\b\w/g, (character) => character.toUpperCase());
};

const getSellerBankDetailsSectionHeight = (items = []) => {
  const normalizedItems = normalizeSellerBankDetails(items);
  return 24 + Math.max(56, normalizedItems.length * 26 + 10) + 8;
};

const drawSellerBankDetailsSection = (doc, y, items = []) => {
  const normalizedItems = normalizeSellerBankDetails(items);
  const sectionHeight = Math.max(56, normalizedItems.length * 26 + 10);

  drawSectionBar(doc, y, "SELLER'S BANK DETAILS");
  const boxY = y + 24;
  drawRoundedBox(doc, PAGE.contentX, boxY, PAGE.contentWidth, sectionHeight, "#ffffff", COLORS.border, 3);

  let cursorY = boxY + 10;
  normalizedItems.forEach((item, index) => {
    if (index > 0) {
      doc
        .save()
        .moveTo(PAGE.contentX + 12, cursorY - 6)
        .lineTo(PAGE.contentX + PAGE.contentWidth - 12, cursorY - 6)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke()
        .restore();
    }

    doc
      .font(doc.fontBold || "Helvetica-Bold")
      .fontSize(8.4)
      .fillColor(COLORS.muted)
      .text(item.label, PAGE.contentX + 12, cursorY, {
        width: 140,
      });

    doc
      .font(doc.fontBold || "Helvetica-Bold")
      .fontSize(8.8)
      .fillColor(COLORS.ink)
      .text(item.value, PAGE.contentX + 160, cursorY, {
        width: PAGE.contentWidth - 172,
      });

    cursorY += 26;
  });

  return boxY + sectionHeight + 8;
};

const drawBulletListSection = (doc, y, title, items = [], emptyLabel = "No items provided.") => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  drawSectionBar(doc, y, title);

  const contentItems = normalizedItems.length ? normalizedItems : [emptyLabel];
  let contentHeight = 12;
  doc.font(doc.fontRegular || "Helvetica").fontSize(8.2);

  contentItems.forEach((item, index) => {
    contentHeight += doc.heightOfString(
      normalizedItems.length ? `${index + 1}. ${item}` : item,
      { width: PAGE.contentWidth - 24 },
    ) + 4;
  });

  const boxHeight = Math.max(36, contentHeight);
  const boxY = y + 24;
  drawRoundedBox(doc, PAGE.contentX, boxY, PAGE.contentWidth, boxHeight, "#ffffff", COLORS.border, 3);

  let cursorY = boxY + 8;
  contentItems.forEach((item, index) => {
    doc
      .font(doc.fontRegular || "Helvetica")
      .fontSize(8.2)
      .fillColor(normalizedItems.length ? COLORS.text : COLORS.muted)
      .text(normalizedItems.length ? `${index + 1}. ${item}` : item, PAGE.contentX + 12, cursorY, {
        width: PAGE.contentWidth - 24,
      });

    cursorY = doc.y + 4;
  });

  return boxY + boxHeight + 8;
};

const getBulletListSectionHeight = (doc, items = [], emptyLabel = "No items provided.") => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const contentItems = normalizedItems.length ? normalizedItems : [emptyLabel];
  let contentHeight = 12;
  doc.font(doc.fontRegular || "Helvetica").fontSize(8.2);

  contentItems.forEach((item, index) => {
    contentHeight += doc.heightOfString(
      normalizedItems.length ? `${index + 1}. ${item}` : item,
      { width: PAGE.contentWidth - 24 },
    ) + 4;
  });

  return 24 + Math.max(36, contentHeight) + 8;
};

const normalizeItineraryItems = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item, index) => ({
          dayNumber: Math.max(1, Number(item?.dayNumber || item?.day || index + 1)),
          dayLabel: String(item?.dayLabel || (item?.day ? `Day ${item.day}` : "")).trim(),
          title: String(item?.title || item?.heading || item?.dayTitle || "").trim(),
          description: String(item?.description || item?.details || item?.content || "").trim(),
        }))
        .filter((item) => item.title || item.description)
    : [];

const drawItinerarySection = (doc, y, items = [], quoteDetails = {}) => {
  const normalizedItems = normalizeItineraryItems(items);
  let cursorY = y;

  const startSection = () => {
    if (cursorY + 70 > CONTENT_BOTTOM_LIMIT) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails, "Day Wise Itinerary (Continued)");
      cursorY = 132;
    }

    drawSectionBar(doc, cursorY, "DAY WISE ITINERARY");
    cursorY += 30;
  };

  startSection();

  if (!normalizedItems.length) {
    drawRoundedBox(doc, PAGE.contentX, cursorY, PAGE.contentWidth, 40, "#ffffff", COLORS.border, 3);
    doc
      .font(doc.fontRegular || "Helvetica")
      .fontSize(8.4)
      .fillColor(COLORS.muted)
      .text("No day wise itinerary provided.", PAGE.contentX + 12, cursorY + 14, {
        width: PAGE.contentWidth - 24,
      });

    return cursorY + 48;
  }

  normalizedItems.forEach((item) => {
    const heading = [item.dayLabel, item.title].filter(Boolean).join(": ") || `Day ${item.dayNumber}`;
    const description = item.description || "";

    doc.font(doc.fontBold || "Helvetica-Bold").fontSize(9.2);
    const headingHeight = doc.heightOfString(heading, {
      width: PAGE.contentWidth - 24,
    });
    doc.font(doc.fontRegular || "Helvetica").fontSize(8.2);
    const descriptionHeight = description
      ? doc.heightOfString(description, { width: PAGE.contentWidth - 24 })
      : 0;
    const cardHeight = Math.max(44, headingHeight + descriptionHeight + 18);

    if (cursorY + cardHeight > CONTENT_BOTTOM_LIMIT) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails, "Day Wise Itinerary (Continued)");
      cursorY = 132;
      drawSectionBar(doc, cursorY, "DAY WISE ITINERARY");
      cursorY += 24;
    }

    drawRoundedBox(doc, PAGE.contentX, cursorY, PAGE.contentWidth, cardHeight, "#ffffff", COLORS.border, 3);
    doc
      .font(doc.fontBold || "Helvetica-Bold")
      .fontSize(9.2)
      .fillColor("#9a3412")
      .text(heading, PAGE.contentX + 12, cursorY + 10, {
        width: PAGE.contentWidth - 24,
      });

    if (description) {
      doc
        .font(doc.fontRegular || "Helvetica")
        .fontSize(8.2)
        .fillColor(COLORS.text)
        .text(description, PAGE.contentX + 12, doc.y + 3, {
          width: PAGE.contentWidth - 24,
        });
    }

    cursorY += cardHeight + 6;
  });

  return cursorY + 6;
};

const drawInclusionsExclusionsSection = (doc, y, inclusions = [], exclusions = [], quoteDetails = {}) => {
  const stripHtml = (text) => String(text || "").replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
  const normalizedInclusions = Array.isArray(inclusions)
    ? inclusions.map(stripHtml).filter(Boolean)
    : [];
  const normalizedExclusions = Array.isArray(exclusions)
    ? exclusions.map(stripHtml).filter(Boolean)
    : [];

  let currentY = y;
  const ensureSpace = (requiredHeight) => {
    if (currentY + requiredHeight > CONTENT_BOTTOM_LIMIT) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
      currentY = 132;
    }
  };

  const inclusionHeight = getBulletListSectionHeight(doc, normalizedInclusions, "No inclusions provided.");
  ensureSpace(inclusionHeight);
  currentY = drawBulletListSection(
    doc,
    currentY,
    "INCLUSIONS",
    normalizedInclusions,
    "No inclusions provided.",
  );

  const exclusionHeight = getBulletListSectionHeight(doc, normalizedExclusions, "No exclusions provided.");
  ensureSpace(exclusionHeight);
  currentY = drawBulletListSection(
    doc,
    currentY,
    "EXCLUSIONS",
    normalizedExclusions,
    "No exclusions provided.",
  );

  return currentY;
};

const getInclusionsExclusionsSectionHeight = (doc, inclusions = [], exclusions = []) =>
  getBulletListSectionHeight(doc, inclusions, "No inclusions provided.")
  + getBulletListSectionHeight(doc, exclusions, "No exclusions provided.");

export const generatePDF = async (quoteDetails = {}) => {
  // [LOCAL] Disk write disabled — no files saved to uploads/quotations/
  // const uploadsDir = path.join(process.cwd(), "uploads", "quotations");
  // ensureDirectory(uploadsDir);
  const uploadsDir = "";

  const fileToken = sanitizeFileToken(
    quoteDetails?.quotationNumber || quoteDetails?.queryId || quoteDetails?.destination,
  );
  const fileVariantSuffix = quoteDetails?.includeSellerBankDetails === false ? "_client" : "";
  const fileName = `quotation_${fileToken}${fileVariantSuffix}.pdf`;
  // const filePath = path.join(uploadsDir, fileName); // [LOCAL] disk write disabled
  const filePath = "";
  const publicFilePath = `/uploads/quotations/${fileName}`;

  const brandName = quoteDetails.agentBrandingName || quoteDetails.agencyName || BRAND.name;
  const brandSubline = (quoteDetails.agentBrandingName && quoteDetails.agentBrandingName !== BRAND.name)
    ? "Travel Quotation | Curated travel services for your booking review"
    : `${BRAND.subline} | Curated travel services for your booking review`;

  const hasFonts = await ensureFontsExist();

  const doc = new PDFDocument({
    size: "A4",
    margin: 36,
  });
  doc.brandName = brandName; // Store it for drawPageFrame!
  doc.agentAddress = quoteDetails.agentCompanyAddress || quoteDetails.companyAddress || "";
  doc.agentEmail = quoteDetails.agentEmail || "";
  doc.agentPhone = quoteDetails.agentPhone || "";

  let loadedFonts = false;
  if (hasFonts) {
    try {
      doc.registerFont("Roboto", FONT_REGULAR_PATH);
      doc.registerFont("Roboto-Bold", FONT_BOLD_PATH);
      doc.fontRegular = "Roboto";
      doc.fontBold = "Roboto-Bold";
      loadedFonts = true;
    } catch (fontRegisterError) {
      console.error("Failed to register Roboto fonts, falling back to Helvetica:", fontRegisterError);
      try {
        if (fs.existsSync(FONT_REGULAR_PATH)) fs.unlinkSync(FONT_REGULAR_PATH);
        if (fs.existsSync(FONT_BOLD_PATH)) fs.unlinkSync(FONT_BOLD_PATH);
      } catch (cleanupErr) {}
    }
  }

  if (!loadedFonts) {
    doc.fontRegular = "Helvetica";
    doc.fontBold = "Helvetica-Bold";
  }

  // Set the default font
  doc.font(doc.fontRegular);

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  let generatedBuffer = null;
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on("end", () => {
      generatedBuffer = Buffer.concat(chunks);
      pdfMemoryCache.set(publicFilePath, generatedBuffer);
      // Clean up memory after 15 minutes
      setTimeout(() => pdfMemoryCache.delete(publicFilePath), 15 * 60 * 1000);
      resolve(generatedBuffer);
    });
    doc.on("error", reject);
  });

  let logoPath = null;
  if (quoteDetails.agentLogo) {
    logoPath = await getLogoBuffer(quoteDetails.agentLogo);
  }

  if (!logoPath && !quoteDetails.agentBrandingName) {
    logoPath = resolveBrandLogoPath();
  }

  drawPageFrame(doc);
  drawLogoBadge(doc, logoPath, PAGE.contentX + 8, 88, getInitials(brandName));

  doc
    .font(doc.fontBold || "Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.ink)
    .text(brandName, PAGE.contentX + 68, 92);

  doc
    .font(doc.fontRegular || "Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(brandSubline, PAGE.contentX + 68, 114);

  const metaStartX = PAGE.contentX + 360;
  const metaCellWidth = 48;
  drawMetaCell(doc, {
    x: metaStartX - 14,
    y: 88,
    width: metaCellWidth,
    label: "ISSUE DATE",
    value: formatDateLabel(new Date()),
  });
  drawMetaCell(doc, {
    x: metaStartX + 40,
    y: 88,
    width: metaCellWidth,
    label: "VALID TILL",
    value: quoteDetails?.validTill || "-",
  });
  drawMetaCell(doc, {
    x: metaStartX + 95,
    y: 88,
    width: 52,
    label: "TRIP ID",
    value: quoteDetails?.queryId || "-",
  });

  const isAgentCustomBrand = brandName && brandName.trim().toLowerCase() !== BRAND.name.toLowerCase();
  drawPartyBlock(doc, {
    x: PAGE.contentX,
    y: 138,
    width: 245,
    title: "SELLER",
    primary: brandName,
    lines: isAgentCustomBrand
      ? [
          quoteDetails.agentCompanyAddress || quoteDetails.companyAddress || "",
          quoteDetails.agentEmail ? `Email: ${quoteDetails.agentEmail}` : "",
          quoteDetails.agentPhone ? `Phone: ${quoteDetails.agentPhone}` : "",
          quoteDetails.agentGstNumber ? `GST: ${quoteDetails.agentGstNumber}` : "",
        ].filter(Boolean)
      : [BRAND.address, `Email: ${BRAND.email}`, `Phone: ${BRAND.phone}`],
  });

  drawPartyBlock(doc, {
    x: PAGE.contentX + 262,
    y: 138,
    width: 245,
    title: "PREPARED FOR",
    primary: quoteDetails?.recipientName || "Agent",
    align: "right",
    lines: [
      quoteDetails?.destination || "-",
      quoteDetails?.travelDates || "-",
      `Quotation No. ${quoteDetails?.quotationNumber || "-"}`,
    ],
  });

  drawSnapshotGrid(doc, quoteDetails);
  drawSectionBar(doc, 322, "SELECTED SERVICES");

  let servicesTableY = 348;
  let columns = drawServicesTableHeader(doc, servicesTableY);
  let cursorY = servicesTableY + 28;

  const services = Array.isArray(quoteDetails?.services) ? quoteDetails.services : [];
  if (!services.length) {
    drawRoundedBox(doc, PAGE.contentX, cursorY, PAGE.contentWidth, 38, "#ffffff", COLORS.border, 3);
    doc
      .font(doc.fontRegular || "Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("No service details are available for this quotation.", PAGE.contentX, cursorY + 13, {
        width: PAGE.contentWidth,
        align: "center",
      });
    cursorY += 46;
  } else {
    services.forEach((service, index) => {
      doc.font(doc.fontBold || "Helvetica-Bold").fontSize(10);
      const titleHeight = doc.heightOfString(service?.title || "Service", {
        width: columns[1].width - 16,
      });
      doc.font(doc.fontRegular || "Helvetica").fontSize(8.3);
      const notesHeight = getServiceDescriptionLinesHeight(
        doc,
        buildServiceDescriptionLines(service?.description),
        columns[1].width - 16,
      );
      const locationHeight = doc.heightOfString(service?.location || "-", {
        width: columns[4].width - 16,
      });
      const quantityHeight = doc.heightOfString(service?.quantityLabel || "-", {
        width: columns[5].width - 16,
        align: "center",
      });
      const dateHeight = doc.heightOfString(service?.serviceDateLabel || "-", {
        width: columns[3].width - 16,
        align: "center",
      });

      const estimatedRowHeight = Math.max(
        42,
        titleHeight + notesHeight + 20,
        locationHeight + 16,
        quantityHeight + 16,
        dateHeight + 16,
      );

      if (cursorY + estimatedRowHeight > SERVICE_ROW_BREAK_LIMIT) {
        doc.addPage();
        drawPageFrame(doc);
        drawContinuationHeader(doc, quoteDetails, "Selected Services (Continued)");
        drawSectionBar(doc, 132, "SELECTED SERVICES");
        servicesTableY = 158;
        columns = drawServicesTableHeader(doc, servicesTableY);
        cursorY = servicesTableY + 28;
      }

      const rowHeight = drawServiceRow(doc, columns, cursorY, service, index);
      cursorY += rowHeight + 5;
    });
  }

  if (cursorY + SUMMARY_SECTION_HEIGHT > CONTENT_BOTTOM_LIMIT) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
    cursorY = 132;
  } else {
    cursorY += 6;
  }

  cursorY = drawSummarySection(doc, cursorY, quoteDetails, services.length);

  cursorY = drawInclusionsExclusionsSection(
    doc,
    cursorY,
    quoteDetails?.inclusions,
    quoteDetails?.exclusions,
    quoteDetails,
  );

  if (cursorY + 70 > CONTENT_BOTTOM_LIMIT) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
    cursorY = 132;
  }

  cursorY = drawItinerarySection(
    doc,
    cursorY,
    quoteDetails?.dayWiseItinerary || quoteDetails?.itinerary || quoteDetails?.schedule,
    quoteDetails,
  );

  const importantNotesHeight = getBulletListSectionHeight(
    doc,
    quoteDetails?.additionalNotes,
    "No additional notes provided.",
  );

  if (cursorY + importantNotesHeight > CONTENT_BOTTOM_LIMIT) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
    cursorY = 132;
  }

  cursorY = drawBulletListSection(
    doc,
    cursorY,
    "IMPORTANT NOTES",
    quoteDetails?.additionalNotes,
    "No additional notes provided.",
  );
  const shouldShowBankDetails = Boolean(
    quoteDetails?.includeSellerBankDetails === true ||
    (!quoteDetails?.isClientQuotation && quoteDetails?.includeSellerBankDetails !== false && Array.isArray(quoteDetails?.sellerBankDetails) && quoteDetails.sellerBankDetails.length > 0)
  );
  if (shouldShowBankDetails) {
    const sellerBankDetailsHeight = getSellerBankDetailsSectionHeight(
      quoteDetails?.sellerBankDetails,
    );

    if (cursorY + sellerBankDetailsHeight > CONTENT_BOTTOM_LIMIT) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
      cursorY = 132;
    }

    cursorY = drawSellerBankDetailsSection(
      doc,
      cursorY,
      quoteDetails?.sellerBankDetails,
    );
  }

  const termsSectionEstimatedHeight = getTermsSectionEstimatedHeight(
    doc,
    quoteDetails?.termsAndConditions || quoteDetails?.customTerms,
  );

  if (!quoteDetails?.removeTerms) {
    if (cursorY + 12 + termsSectionEstimatedHeight > CONTENT_BOTTOM_LIMIT && cursorY > 160) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
      cursorY = 132;
    }

    cursorY = drawTermsSection(doc, cursorY + 12, quoteDetails?.termsAndConditions || quoteDetails?.customTerms);
  }

  if (quoteDetails?.agentFooterImage) {
    const footerBuffer = await getLogoBuffer(quoteDetails.agentFooterImage);
    if (footerBuffer) {
      const targetFooterY = PAGE.footerY - 60;

      // If current content overlaps the bottom footer area, move footer banner to a new page
      if (cursorY > targetFooterY - 10) {
        doc.addPage();
        drawPageFrame(doc);
        drawContinuationHeader(doc, quoteDetails, "Quotation Details (Continued)");
      }

      try {
        doc.image(footerBuffer, PAGE.contentX, targetFooterY, {
          fit: [PAGE.contentWidth, 54],
          align: "center",
          valign: "center",
        });
      } catch (footerErr) {
        console.error("Error embedding agent footer image in PDF:", footerErr);
      }
    }
  }

  doc.end();

  await pdfPromise;

  return { filePath, publicFilePath, fileName, buffer: generatedBuffer };
};