import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const BRAND = Object.freeze({
  name: "Holiday Circuit",
  subline: "Travel Quotation",
  address: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
  email: "ops@leelatravels.com",
  phone: "+91 8851346665, +91 9971706003",
});

const COLORS = Object.freeze({
  ink: "#10213a",
  text: "#334155",
  muted: "#64748b",
  accent: "#0f766e",
  accentSoft: "#e6fffb",
  accentBorder: "#7dd3c7",
  border: "#cbd5e1",
  light: "#f8fafc",
  totalBg: "#ecfdf5",
  totalText: "#166534",
});

const PAGE = Object.freeze({
  frameX: 28,
  frameY: 28,
  contentX: 44,
  contentWidth: 507,
  topRibbonY: 54,
  footerY: 790,
});

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFileToken = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "quote";

const formatCurrency = (value, currency = "INR") =>
  `${String(currency || "INR").toUpperCase()} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

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
    path.join(process.cwd(), "uploads", "1771279110850-logo img.png"),
    path.join(process.cwd(), "uploads", "1771278920287-logo img.png"),
    path.join(process.cwd(), "uploads", "1771278816234-logo img.png"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
};

const drawRoundedBox = (doc, x, y, width, height, fillColor, strokeColor = COLORS.border, radius = 10) => {
  doc.save();
  doc.roundedRect(x, y, width, height, radius).fillAndStroke(fillColor, strokeColor);
  doc.restore();
};

const drawPageFrame = (doc) => {
  const frameWidth = doc.page.width - PAGE.frameX * 2;
  const frameHeight = doc.page.height - PAGE.frameY * 2;

  doc
    .save()
    .roundedRect(PAGE.frameX, PAGE.frameY, frameWidth, frameHeight, 16)
    .lineWidth(1.1)
    .strokeColor(COLORS.accentBorder)
    .stroke()
    .restore();

  doc.save();
  doc.rect(PAGE.contentX, PAGE.topRibbonY, PAGE.contentWidth, 20).fill(COLORS.accent);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#ffffff")
    .text("HOLIDAY CIRCUIT QUOTATION", PAGE.contentX, PAGE.topRibbonY + 6, {
      width: PAGE.contentWidth,
      align: "center",
      characterSpacing: 1.2,
    });
  doc.restore();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text("This is a computer-generated quotation and does not require a signature.", PAGE.contentX, PAGE.footerY, {
      width: PAGE.contentWidth,
      align: "center",
    });
};

const drawLogoBadge = (doc, logoPath, x, y) => {
  if (logoPath) {
    try {
      doc.image(logoPath, x, y, {
        fit: [48, 48],
        align: "center",
        valign: "center",
      });
      return;
    } catch (error) {
      // Fall back to the HC badge if the image cannot be rendered.
    }
  }

  doc.save();
  doc.roundedRect(x, y, 48, 48, 10).fillAndStroke("#ffffff", COLORS.border);
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.accent)
    .text("HC", x, y + 14, { width: 48, align: "center" });
  doc.restore();
};

const drawMetaCell = (doc, { x, y, width, label, value }) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.4)
    .fillColor(COLORS.muted)
    .text(label, x, y, { width, align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(value || "-", x, y + 10, { width, align: "center" });
};

const drawPartyBlock = (doc, { x, y, width, title, primary, lines = [], align = "left", height = 78 }) => {
  drawRoundedBox(doc, x, y, width, height, "#ffffff");

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(title, x + 10, y + 10, {
      width: width - 20,
      align,
      characterSpacing: 0.9,
    });

  doc
    .font("Helvetica-Bold")
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
      .font("Helvetica")
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
  drawRoundedBox(doc, PAGE.contentX, y, PAGE.contentWidth, 22, "#ecfeff", COLORS.accentBorder, 6);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.accent)
    .text(title, PAGE.contentX, y + 7, {
      width: PAGE.contentWidth,
      align: "center",
      characterSpacing: 0.8,
    });
};

const drawSnapshotGrid = (doc, quoteDetails = {}) => {
  const gridY = 250;
  const gridHeight = 70;
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

  drawSectionBar(doc, 222, "TRIP SNAPSHOT");
  drawRoundedBox(doc, PAGE.contentX, gridY, PAGE.contentWidth, gridHeight, "#ffffff");

  for (let index = 1; index < columns; index += 1) {
    const lineX = PAGE.contentX + columnWidth * index;
    doc
      .save()
      .moveTo(lineX, gridY)
      .lineTo(lineX, gridY + gridHeight)
      .lineWidth(0.7)
      .strokeColor(COLORS.border)
      .stroke()
      .restore();
  }

  doc
    .save()
    .moveTo(PAGE.contentX, gridY + rowHeight)
    .lineTo(PAGE.contentX + PAGE.contentWidth, gridY + rowHeight)
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .stroke()
    .restore();

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cellX = PAGE.contentX + column * columnWidth;
    const cellY = gridY + row * rowHeight;

    doc
      .font("Helvetica-Bold")
      .fontSize(7.2)
      .fillColor(COLORS.muted)
      .text(item.label, cellX + 10, cellY + 10, { width: columnWidth - 20 });

    doc
      .font("Helvetica-Bold")
      .fontSize(8.2)
      .fillColor(COLORS.ink)
      .text(item.value || "-", cellX + 10, cellY + 21, {
        width: columnWidth - 20,
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
  const pillWidth = Math.min(width - 12, Math.max(46, doc.widthOfString(label || "-", { font: "Helvetica-Bold", size: 7.6 }) + 18));
  const pillX = x + Math.max(6, (width - pillWidth) / 2);

  doc.save();
  doc.roundedRect(pillX, y, pillWidth, 16, 8).fillAndStroke(palette.fill, palette.stroke);
  doc
    .font("Helvetica-Bold")
    .fontSize(7.6)
    .fillColor(palette.text)
    .text(label || "-", pillX, y + 5, {
      width: pillWidth,
      align: "center",
    });
  doc.restore();
};

const drawServicesTableHeader = (doc, y) => {
  const columns = [
    { label: "S.NO.", x: PAGE.contentX, width: 38, align: "center" },
    { label: "PARTICULARS", x: PAGE.contentX + 38, width: 175, align: "left" },
    { label: "CATEGORY", x: PAGE.contentX + 213, width: 78, align: "center" },
    { label: "SERVICE DATE", x: PAGE.contentX + 291, width: 80, align: "center" },
    { label: "LOCATION", x: PAGE.contentX + 371, width: 86, align: "left" },
    { label: "QTY", x: PAGE.contentX + 457, width: 50, align: "center" },
  ];

  drawRoundedBox(doc, PAGE.contentX, y, PAGE.contentWidth, 24, "#f0fdfa", COLORS.accentBorder, 4);

  columns.forEach((column, index) => {
    if (index > 0) {
      doc
        .save()
        .moveTo(column.x, y)
        .lineTo(column.x, y + 24)
        .lineWidth(0.6)
        .strokeColor(COLORS.accentBorder)
        .stroke()
        .restore();
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.ink)
      .text(column.label, column.x + 6, y + 8, {
        width: column.width - 12,
        align: column.align,
        characterSpacing: 0.4,
      });
  });

  return columns;
};

const drawServiceRow = (doc, columns, y, service = {}, index = 0) => {
  const notesText = service?.description ? `Notes: ${service.description}` : "";
  const quantityText = service?.quantityLabel || "-";
  const locationText = service?.location || "-";
  const dateText = service?.serviceDateLabel || "-";
  const titleText = service?.title || "Service";
  const typeText = service?.typeLabel || "Travel Service";

  doc.font("Helvetica-Bold").fontSize(10);
  const titleHeight = doc.heightOfString(titleText, { width: columns[1].width - 16 });

  doc.font("Helvetica").fontSize(8.3);
  const notesHeight = notesText ? doc.heightOfString(notesText, { width: columns[1].width - 16 }) : 0;
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
    4,
  );

  columns.forEach((column, columnIndex) => {
    if (columnIndex === 0) return;

    doc
      .save()
      .moveTo(column.x, y)
      .lineTo(column.x, y + rowHeight)
      .lineWidth(0.55)
      .strokeColor(COLORS.border)
      .stroke()
      .restore();
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(String(index + 1), columns[0].x + 4, y + 14, {
      width: columns[0].width - 8,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(titleText, columns[1].x + 8, y + 8, {
      width: columns[1].width - 16,
    });

  if (notesText) {
    doc
      .font("Helvetica")
      .fontSize(8.3)
      .fillColor(COLORS.text)
      .text(notesText, columns[1].x + 8, y + 8 + titleHeight + 4, {
        width: columns[1].width - 16,
      });
  }

  drawServiceTypePill(doc, columns[2].x, y + Math.max(10, rowHeight / 2 - 8), columns[2].width, typeText);

  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.text)
    .text(dateText, columns[3].x + 6, y + 12, {
      width: columns[3].width - 12,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.text)
    .text(locationText, columns[4].x + 8, y + 12, {
      width: columns[4].width - 16,
    });

  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.text)
    .text(quantityText, columns[5].x + 6, y + 12, {
      width: columns[5].width - 12,
      align: "center",
    });

  return rowHeight;
};

const drawContinuationHeader = (doc, quoteDetails = {}) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.ink)
    .text("Selected Services (Continued)", PAGE.contentX, 88);

  doc
    .font("Helvetica")
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

const drawSummarySection = (doc, y, quoteDetails = {}, servicesCount = 0) => {
  const leftWidth = 326;
  const rightWidth = 165;
  const leftX = PAGE.contentX;
  const rightX = PAGE.contentX + leftWidth + 16;
  const amountText = formatCurrency(quoteDetails?.totalAmount || 0, quoteDetails?.currency || "INR");
  const amountWords = formatAmountInWords(quoteDetails?.totalAmount || 0);

  drawSectionBar(doc, y, "QUOTATION SUMMARY");

  drawRoundedBox(doc, leftX, y + 30, leftWidth, 66, "#ffffff");
  drawRoundedBox(doc, rightX, y + 30, rightWidth, 66, COLORS.totalBg, "#bbf7d0");

  doc
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .fillColor(COLORS.muted)
    .text("AMOUNT CHARGEABLE (IN WORDS)", leftX + 12, y + 40);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(`INR: ${amountWords}`, leftX + 12, y + 52, {
      width: leftWidth - 24,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.text)
    .text(
      `Selected services: ${servicesCount} | Recipient: ${quoteDetails?.recipientName || "-"}`,
      leftX + 12,
      y + 76,
      {
        width: leftWidth - 24,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .fillColor(COLORS.totalText)
    .text("FINAL AMOUNT", rightX, y + 40, {
      width: rightWidth,
      align: "center",
      characterSpacing: 0.7,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.totalText)
    .text(amountText, rightX, y + 54, {
      width: rightWidth,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(7.8)
    .fillColor(COLORS.text)
    .text("Taxes and charges are already reflected in the total shared by operations.", rightX + 10, y + 76, {
      width: rightWidth - 20,
      align: "center",
    });

  return y + 106;
};

const drawTermsSection = (doc, y) => {
  const terms = [
    "Rates are subject to availability and confirmation at the time of booking.",
    "Only the services listed in this quotation are included in the shared amount.",
    "Any amendment after confirmation may affect availability and final pricing.",
    "Hotel check-in, check-out, and supplier-specific policies will apply as per service rules.",
    "Please review and confirm within the validity period to avoid fare or rate changes.",
  ];

  drawSectionBar(doc, y, "TERMS AND CONDITIONS");
  drawRoundedBox(doc, PAGE.contentX, y + 30, PAGE.contentWidth, 88, "#ffffff");

  let cursorY = y + 40;
  terms.forEach((term, index) => {
    doc
      .font("Helvetica")
      .fontSize(8.2)
      .fillColor(COLORS.text)
      .text(`${index + 1}. ${term}`, PAGE.contentX + 14, cursorY, {
        width: PAGE.contentWidth - 28,
      });

    cursorY = doc.y + 5;
  });
};

const drawBulletListSection = (doc, y, title, items = [], emptyLabel = "No items provided.") => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  drawSectionBar(doc, y, title);

  const contentItems = normalizedItems.length ? normalizedItems : [emptyLabel];
  let contentHeight = 18;
  doc.font("Helvetica").fontSize(8.2);

  contentItems.forEach((item, index) => {
    contentHeight += doc.heightOfString(
      normalizedItems.length ? `${index + 1}. ${item}` : item,
      { width: PAGE.contentWidth - 28 },
    ) + 6;
  });

  drawRoundedBox(doc, PAGE.contentX, y + 30, PAGE.contentWidth, Math.max(46, contentHeight), "#ffffff");

  let cursorY = y + 40;
  contentItems.forEach((item, index) => {
    doc
      .font("Helvetica")
      .fontSize(8.2)
      .fillColor(normalizedItems.length ? COLORS.text : COLORS.muted)
      .text(normalizedItems.length ? `${index + 1}. ${item}` : item, PAGE.contentX + 14, cursorY, {
        width: PAGE.contentWidth - 28,
      });

    cursorY = doc.y + 6;
  });

  return y + 30 + Math.max(46, contentHeight) + 14;
};

const normalizeItineraryItems = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item, index) => ({
          dayNumber: Math.max(1, Number(item?.dayNumber || index + 1)),
          dayLabel: String(item?.dayLabel || "").trim(),
          title: String(item?.title || item?.heading || "").trim(),
          description: String(item?.description || "").trim(),
        }))
        .filter((item) => item.title || item.description)
    : [];

const drawItinerarySection = (doc, y, items = [], quoteDetails = {}) => {
  const normalizedItems = normalizeItineraryItems(items);
  let cursorY = y;

  const startSection = () => {
    if (cursorY + 70 > 740) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails);
      cursorY = 132;
    }

    drawSectionBar(doc, cursorY, "DAY WISE ITINERARY");
    cursorY += 30;
  };

  startSection();

  if (!normalizedItems.length) {
    drawRoundedBox(doc, PAGE.contentX, cursorY, PAGE.contentWidth, 46, "#ffffff");
    doc
      .font("Helvetica")
      .fontSize(8.4)
      .fillColor(COLORS.muted)
      .text("No day wise itinerary provided.", PAGE.contentX + 14, cursorY + 16, {
        width: PAGE.contentWidth - 28,
      });

    return cursorY + 60;
  }

  normalizedItems.forEach((item) => {
    const heading = [item.dayLabel, item.title].filter(Boolean).join(": ") || `Day ${item.dayNumber}`;
    const description = item.description || "";

    doc.font("Helvetica-Bold").fontSize(9.2);
    const headingHeight = doc.heightOfString(heading, {
      width: PAGE.contentWidth - 28,
    });
    doc.font("Helvetica").fontSize(8.2);
    const descriptionHeight = description
      ? doc.heightOfString(description, { width: PAGE.contentWidth - 28 })
      : 0;
    const cardHeight = Math.max(48, headingHeight + descriptionHeight + 22);

    if (cursorY + cardHeight > 740) {
      doc.addPage();
      drawPageFrame(doc);
      drawContinuationHeader(doc, quoteDetails);
      cursorY = 132;
      drawSectionBar(doc, cursorY, "DAY WISE ITINERARY");
      cursorY += 30;
    }

    drawRoundedBox(doc, PAGE.contentX, cursorY, PAGE.contentWidth, cardHeight, "#ffffff");
    doc
      .font("Helvetica-Bold")
      .fontSize(9.2)
      .fillColor("#9a3412")
      .text(heading, PAGE.contentX + 14, cursorY + 12, {
        width: PAGE.contentWidth - 28,
      });

    if (description) {
      doc
        .font("Helvetica")
        .fontSize(8.2)
        .fillColor(COLORS.text)
        .text(description, PAGE.contentX + 14, doc.y + 4, {
          width: PAGE.contentWidth - 28,
        });
    }

    cursorY += cardHeight + 8;
  });

  return cursorY + 6;
};

const drawInclusionsExclusionsSection = (doc, y, inclusions = [], exclusions = []) => {
  const normalizedInclusions = Array.isArray(inclusions)
    ? inclusions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const normalizedExclusions = Array.isArray(exclusions)
    ? exclusions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  const leftItems = normalizedInclusions.length ? normalizedInclusions : ["No inclusions provided."];
  const rightItems = normalizedExclusions.length ? normalizedExclusions : ["No exclusions provided."];
  const sectionX = PAGE.contentX;
  const sectionWidth = PAGE.contentWidth;
  const leftX = sectionX + 14;
  const columnGap = 24;
  const columnWidth = (sectionWidth - 28 - columnGap) / 2;
  const rightX = leftX + columnWidth + columnGap;
  const contentStartY = y + 44;

  doc.save();
  doc.roundedRect(sectionX, y, sectionWidth, 28, 8).fillAndStroke("#ffe2bd", "#ffd2a3");
  doc.rect(sectionX, y, 6, 28).fill("#f97316");
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#9a3412")
    .text("Inclusions/Exclusions", sectionX + 16, y + 8, {
      width: sectionWidth - 32,
    });
  doc.restore();

  doc.font("Helvetica").fontSize(8.6);

  const getColumnHeight = (items) =>
    items.reduce((total, item, index) => (
      total + doc.heightOfString(`${index + 1}. ${item}`, { width: columnWidth - 22 }) + 10
    ), 28);

  const contentHeight = Math.max(getColumnHeight(leftItems), getColumnHeight(rightItems), 60);

  drawRoundedBox(doc, sectionX, y + 38, sectionWidth, contentHeight + 18, "#ffffff");

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(COLORS.ink)
    .text("Inclusions", leftX, contentStartY, { width: columnWidth - 12 });
  doc
    .save()
    .moveTo(leftX, contentStartY + 16)
    .lineTo(leftX + 78, contentStartY + 16)
    .lineWidth(3)
    .strokeColor("#16a34a")
    .stroke()
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(COLORS.ink)
    .text("Exclusions", rightX, contentStartY, { width: columnWidth - 12 });
  doc
    .save()
    .moveTo(rightX, contentStartY + 16)
    .lineTo(rightX + 78, contentStartY + 16)
    .lineWidth(3)
    .strokeColor("#dc2626")
    .stroke()
    .restore();

  let leftCursorY = contentStartY + 30;
  leftItems.forEach((item, index) => {
    doc
      .font("Helvetica")
      .fontSize(8.6)
      .fillColor(normalizedInclusions.length ? COLORS.text : COLORS.muted)
      .text(`${index + 1}. ${item}`, leftX, leftCursorY, {
        width: columnWidth - 12,
      });

    leftCursorY = doc.y + 7;
  });

  let rightCursorY = contentStartY + 30;
  rightItems.forEach((item, index) => {
    doc
      .font("Helvetica")
      .fontSize(8.6)
      .fillColor(normalizedExclusions.length ? COLORS.text : COLORS.muted)
      .text(`${index + 1}. ${item}`, rightX, rightCursorY, {
        width: columnWidth - 12,
      });

    rightCursorY = doc.y + 7;
  });

  return y + 38 + contentHeight + 32;
};

export const generatePDF = async (quoteDetails = {}) => {
  const uploadsDir = path.join(process.cwd(), "uploads", "quotations");
  ensureDirectory(uploadsDir);

  const fileToken = sanitizeFileToken(
    quoteDetails?.quotationNumber || quoteDetails?.queryId || quoteDetails?.destination,
  );
  const fileName = `quotation_${fileToken}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const publicFilePath = `/uploads/quotations/${fileName}`;

  const doc = new PDFDocument({
    size: "A4",
    margin: 36,
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const logoPath = resolveBrandLogoPath();

  drawPageFrame(doc);
  drawLogoBadge(doc, logoPath, PAGE.contentX + 8, 88);

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.ink)
    .text(BRAND.name, PAGE.contentX + 68, 92);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`${BRAND.subline} | Curated travel services for your booking review`, PAGE.contentX + 68, 114);

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

  drawPartyBlock(doc, {
    x: PAGE.contentX,
    y: 138,
    width: 245,
    title: "SELLER",
    primary: BRAND.name,
    lines: [BRAND.address, `Email: ${BRAND.email}`, `Phone: ${BRAND.phone}`],
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
  drawSectionBar(doc, 332, "SELECTED SERVICES");

  let servicesTableY = 360;
  let columns = drawServicesTableHeader(doc, servicesTableY);
  let cursorY = servicesTableY + 30;

  const services = Array.isArray(quoteDetails?.services) ? quoteDetails.services : [];
  if (!services.length) {
    drawRoundedBox(doc, PAGE.contentX, cursorY, PAGE.contentWidth, 42, "#ffffff");
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(COLORS.muted)
      .text("No service details are available for this quotation.", PAGE.contentX, cursorY + 15, {
        width: PAGE.contentWidth,
        align: "center",
      });
    cursorY += 56;
  } else {
    services.forEach((service, index) => {
      doc.font("Helvetica-Bold").fontSize(10);
      const titleHeight = doc.heightOfString(service?.title || "Service", { width: 159 });
      doc.font("Helvetica").fontSize(8.3);
      const notesHeight = service?.description
        ? doc.heightOfString(`Notes: ${service.description}`, { width: 159 })
        : 0;
      const locationHeight = doc.heightOfString(service?.location || "-", { width: 70 });
      const quantityHeight = doc.heightOfString(service?.quantityLabel || "-", { width: 38, align: "center" });
      const dateHeight = doc.heightOfString(service?.serviceDateLabel || "-", { width: 68, align: "center" });

      const estimatedRowHeight = Math.max(
        44,
        titleHeight + notesHeight + 24,
        locationHeight + 18,
        quantityHeight + 18,
        dateHeight + 18,
      );

      if (cursorY + estimatedRowHeight > 690) {
        doc.addPage();
        drawPageFrame(doc);
        drawContinuationHeader(doc, quoteDetails);
        drawSectionBar(doc, 132, "SELECTED SERVICES");
        servicesTableY = 164;
        columns = drawServicesTableHeader(doc, servicesTableY);
        cursorY = servicesTableY + 30;
      }

      const rowHeight = drawServiceRow(doc, columns, cursorY, service, index);
      cursorY += rowHeight + 8;
    });
  }

  if (cursorY > 630) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails);
    cursorY = 132;
  } else {
    cursorY += 10;
  }

  cursorY = drawSummarySection(doc, cursorY, quoteDetails, services.length);

  if (cursorY + 140 > 740) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails);
    cursorY = 132;
  }

  cursorY = drawInclusionsExclusionsSection(
    doc,
    cursorY,
    quoteDetails?.inclusions,
    quoteDetails?.exclusions,
  );

  if (cursorY + 120 > 740) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails);
    cursorY = 132;
  }

  cursorY = drawItinerarySection(
    doc,
    cursorY,
    quoteDetails?.dayWiseItinerary,
    quoteDetails,
  );

  if (cursorY + 120 > 740) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails);
    cursorY = 132;
  }

  cursorY = drawBulletListSection(
    doc,
    cursorY,
    "IMPORTANT NOTES",
    quoteDetails?.additionalNotes,
    "No additional notes provided.",
  );

  if (cursorY + 140 > 740) {
    doc.addPage();
    drawPageFrame(doc);
    drawContinuationHeader(doc, quoteDetails);
    cursorY = 132;
  }

  drawTermsSection(doc, cursorY);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { filePath, publicFilePath, fileName };
};
