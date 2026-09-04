import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { pdfMemoryCache } from "../utils/pdfCache.js";

const ensureUploadsDir = () => {
  const dirPath = path.join(process.cwd(), "uploads", "internal-invoices");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const formatMoney = (value, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDateLabel = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTemplateLabel = (value = "") =>
  String(value || "aurora-ledger")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const drawRoundedCard = (doc, x, y, width, height, fillColor, strokeColor = null, radius = 14) => {
  doc.save();
  doc.roundedRect(x, y, width, height, radius);
  if (fillColor) {
    doc.fillAndStroke(fillColor, strokeColor || fillColor);
  } else {
    doc.stroke(strokeColor || "#e2e8f0");
  }
  doc.restore();
};

const drawLabelValue = (doc, { x, y, label, value, width, align = "left" }) => {
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#64748b").text(label, x, y, { width, align });
  doc.font("Helvetica").fontSize(10).fillColor("#0f172a").text(value || "-", x, y + 11, {
    width,
    align,
  });
};

const TEMPLATE_CONFIG = {
  "aurora-ledger": {
    key: "aurora-ledger",
    accent: "#1d4ed8",
    headerFill: "#0f172a",
    headerText: "#ffffff",
    mutedText: "#64748b",
    cardFill: "#f8fafc",
    cardStroke: "#e2e8f0",
    tableHeaderFill: "#eff6ff",
    summaryFill: "#eff6ff",
    noteFill: "#f8fafc",
    radius: 14,
  },
  "classic-ledger": {
    key: "classic-ledger",
    accent: "#374151",
    headerFill: "#ffffff",
    headerText: "#111827",
    mutedText: "#4b5563",
    cardFill: "#ffffff",
    cardStroke: "#d1d5db",
    tableHeaderFill: "#f3f4f6",
    summaryFill: "#f9fafb",
    noteFill: "#ffffff",
    radius: 8,
  },
  "compact-ledger": {
    key: "compact-ledger",
    accent: "#0891b2",
    headerFill: "#ecfeff",
    headerText: "#164e63",
    mutedText: "#475569",
    cardFill: "#ffffff",
    cardStroke: "#bae6fd",
    tableHeaderFill: "#ecfeff",
    summaryFill: "#f0fdfa",
    noteFill: "#f8fafc",
    radius: 8,
  },
  "finance-ledger": {
    key: "finance-ledger",
    accent: "#047857",
    headerFill: "#064e3b",
    headerText: "#ffffff",
    mutedText: "#64748b",
    cardFill: "#f8fafc",
    cardStroke: "#bbf7d0",
    tableHeaderFill: "#ecfdf5",
    summaryFill: "#ecfdf5",
    noteFill: "#f0fdf4",
    radius: 12,
  },
};

const getTemplateConfig = (templateVariant = "") =>
  TEMPLATE_CONFIG[templateVariant] || TEMPLATE_CONFIG["aurora-ledger"];

const drawInvoiceHeader = (doc, { config, queryCode, invoiceMeta = {}, dmcName = "" }) => {
  const resolvedDmcName = String(invoiceMeta.supplierName || dmcName || "DMC Partner").trim().toUpperCase();

  if (config.key === "classic-ledger") {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#10b981").text(resolvedDmcName, 40, 36);
    doc.font("Helvetica-Bold").fontSize(22).fillColor(config.headerText).text("Internal Invoice", 40, 48);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(config.mutedText)
      .text("Finance review copy for DMC settlement validation", 40, 76);

    drawRoundedCard(doc, 420, 42, 135, 50, "#ffffff", config.cardStroke, config.radius);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(config.mutedText).text("BOOKING REF", 438, 54, {
      width: 100,
      align: "center",
    });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(config.headerText).text(queryCode || "-", 438, 68, {
      width: 100,
      align: "center",
    });
    doc.moveTo(40, 108).lineTo(555, 108).strokeColor(config.cardStroke).stroke();
    return 124;
  }

  if (config.key === "compact-ledger") {
    drawRoundedCard(doc, 40, 34, 515, 58, config.headerFill, config.cardStroke, config.radius);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(config.accent).text(resolvedDmcName, 56, 43);
    doc.font("Helvetica-Bold").fontSize(15).fillColor(config.headerText).text("Internal Invoice", 56, 54);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(config.mutedText)
      .text("Compact finance review copy", 56, 72);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(config.accent).text("BOOKING REF", 430, 49, {
      width: 92,
      align: "right",
    });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(config.headerText).text(queryCode || "-", 430, 64, {
      width: 92,
      align: "right",
    });
    return 106;
  }

  if (config.key === "finance-ledger") {
    drawRoundedCard(doc, 40, 40, 515, 92, config.headerFill, config.headerFill, config.radius);
    doc.rect(40, 40, 10, 92).fill("#10b981");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#10b981").text(resolvedDmcName, 64, 52);
    doc.font("Helvetica-Bold").fontSize(20).fillColor(config.headerText).text("Internal Invoice Details", 64, 66);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#d1fae5")
      .text("Internal invoice payout validation copy", 64, 92);

    drawRoundedCard(doc, 420, 58, 115, 52, "#065f46", "#10b981", config.radius);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#a7f3d0").text("BOOKING REF", 435, 72, {
      width: 85,
      align: "center",
    });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(config.headerText).text(queryCode || "-", 435, 86, {
      width: 85,
      align: "center",
    });
    return 148;
  }

  drawRoundedCard(doc, 40, 40, 515, 92, config.headerFill, config.headerFill, config.radius);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#10b981").text(resolvedDmcName, 58, 52);
  doc.font("Helvetica-Bold").fontSize(20).fillColor(config.headerText).text("Internal Invoice", 58, 66);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#cbd5e1")
    .text("Finance review copy for DMC settlement validation", 58, 92);

  drawRoundedCard(doc, 420, 58, 115, 52, config.accent, config.accent, config.radius);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#bfdbfe").text("BOOKING REF", 435, 72, {
    width: 85,
    align: "center",
  });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(config.headerText).text(queryCode || "-", 435, 86, {
    width: 85,
    align: "center",
  });
  return 148;
};

const drawSnapshotSection = (doc, {
  config,
  y,
  invoiceMeta = {},
  dmcName = "",
  destination = "",
  templateVariant = "",
}) => {
  if (config.key === "compact-ledger") {
    drawRoundedCard(doc, 40, y, 515, 76, config.cardFill, config.cardStroke, config.radius);
    const cells = [
      ["DMC / Supplier", invoiceMeta.supplierName || dmcName || "-"],
      ["Destination", destination || "-"],
      ["Invoice No.", invoiceMeta.invoiceNumber || "-"],
      ["Invoice Date", formatDateLabel(invoiceMeta.invoiceDate)],
      [`${Number(invoiceMeta.creditPeriodDays || 7)}-day Credit`, formatDateLabel(invoiceMeta.dueDate)],
      ["Template", formatTemplateLabel(templateVariant)],
    ];

    cells.forEach(([label, value], index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      drawLabelValue(doc, {
        x: 56 + col * 166,
        y: y + 14 + row * 32,
        label,
        value,
        width: 145,
      });
    });
    return y + 98;
  }

  drawRoundedCard(doc, 40, y, 252, 92, config.cardFill, config.cardStroke, config.radius);
  drawRoundedCard(doc, 303, y, 252, 92, config.cardFill, config.cardStroke, config.radius);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Partner Snapshot", 56, y + 16);
  drawLabelValue(doc, {
    x: 56,
    y: y + 36,
    label: "DMC / Supplier",
    value: invoiceMeta.supplierName || dmcName || "-",
    width: 210,
  });
  drawLabelValue(doc, {
    x: 56,
    y: y + 66,
    label: "Destination",
    value: destination || "-",
    width: 210,
  });

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Invoice Snapshot", 319, y + 16);
  drawLabelValue(doc, {
    x: 319,
    y: y + 36,
    label: "Invoice No.",
    value: invoiceMeta.invoiceNumber || "-",
    width: 95,
  });
  drawLabelValue(doc, {
    x: 430,
    y: y + 36,
    label: "Template",
    value: formatTemplateLabel(templateVariant),
    width: 95,
    align: "right",
  });
  drawLabelValue(doc, {
    x: 319,
    y: y + 66,
    label: "Invoice Date",
    value: formatDateLabel(invoiceMeta.invoiceDate),
    width: 95,
  });
  drawLabelValue(doc, {
    x: 430,
    y: y + 66,
    label: `${Number(invoiceMeta.creditPeriodDays || 7)}-day Credit`,
    value: formatDateLabel(invoiceMeta.dueDate),
    width: 95,
    align: "right",
  });

  return y + 114;
};

const drawItemsTableHeader = (doc, y, config = TEMPLATE_CONFIG["aurora-ledger"]) => {
  const columns = [
    { key: "service", label: "Service", x: 52, width: 162, align: "left" },
    { key: "type", label: "Type", x: 220, width: 60, align: "left" },
    { key: "qty", label: "Qty", x: 286, width: 36, align: "right" },
    { key: "rate", label: "Rate", x: 328, width: 74, align: "right" },
    { key: "subtotal", label: "Subtotal", x: 408, width: 72, align: "right" },
    { key: "tax", label: "Tax", x: 486, width: 57, align: "right" },
  ];

  doc.save();
  doc.roundedRect(40, y, 515, 24, config.radius).fill(config.tableHeaderFill);
  columns.forEach((column) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#475569")
      .text(column.label, column.x, y + 8, {
        width: column.width,
        align: column.align,
      });
  });
  doc.restore();

  return columns;
};

const ensureSpaceForBlock = (doc, requiredHeight, onNewPage) => {
  if (doc.y + requiredHeight <= doc.page.height - 40) return;
  doc.addPage();
  onNewPage?.();
};

export const generateInternalInvoicePdf = async ({
  queryCode,
  invoiceMeta = {},
  items = [],
  summary = {},
  taxConfig = {},
  dmcName = "",
  destination = "",
  templateVariant = "",
}) => {
  const config = getTemplateConfig(templateVariant);
  // [LOCAL] Disk write disabled — no files saved to uploads/internal-invoices/
  // const dirPath = ensureUploadsDir();
  const sanitizedInvoiceNumber = String(invoiceMeta.invoiceNumber || queryCode || "invoice")
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `DMC_Internal_Invoice_${sanitizedInvoiceNumber}.pdf`;
  // const absoluteFilePath = path.join(dirPath, fileName); // [LOCAL] disk write disabled
  const absoluteFilePath = "";
  const publicFilePath = `/uploads/internal-invoices/${fileName}`;

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      pdfMemoryCache.set(publicFilePath, buffer);
      setTimeout(() => pdfMemoryCache.delete(publicFilePath), 15 * 60 * 1000);
      resolve(buffer);
    });
    doc.on("error", reject);
  });

  const snapshotY = drawInvoiceHeader(doc, { config, queryCode, invoiceMeta, dmcName });
  const itemizedHeadingY = drawSnapshotSection(doc, {
    config,
    y: snapshotY,
    invoiceMeta,
    dmcName,
    destination,
    templateVariant,
  });
  doc.y = itemizedHeadingY;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Itemized Services", 40, itemizedHeadingY, {
    width: 515,
    align: "left",
  });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(config.mutedText)
    .text(
      "Auto-generated from DMC internal invoice line items submitted to finance.",
      40,
      itemizedHeadingY + 16,
      { width: 515, align: "left" },
    );
  doc.y = itemizedHeadingY + 38;

  let columns = drawItemsTableHeader(doc, doc.y, config);
  doc.y += 32;

  items.forEach((item, index) => {
    const serviceHeight = doc.heightOfString(item.service || "-", {
      width: columns[0].width,
      align: "left",
    });
    const rowHeight = Math.max(26, serviceHeight + 12);

    ensureSpaceForBlock(doc, rowHeight + 18, () => {
      const continuedY = doc.y;
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Itemized Services (cont.)", 40, continuedY, {
        width: 515,
        align: "left",
      });
      doc.y = continuedY + 22;
      columns = drawItemsTableHeader(doc, doc.y, config);
      doc.y += 32;
    });

    const rowY = doc.y;
    drawRoundedCard(
      doc,
      40,
      rowY,
      515,
      rowHeight,
      index % 2 === 0 ? "#ffffff" : config.cardFill,
      config.cardStroke,
      config.radius,
    );

    doc.font("Helvetica").fontSize(9).fillColor("#0f172a");
    doc.text(item.service || "-", columns[0].x, rowY + 8, {
      width: columns[0].width,
      align: "left",
    });
    doc.text(item.type || "-", columns[1].x, rowY + 8, {
      width: columns[1].width,
      align: "left",
    });
    doc.text(String(item.qty || 0), columns[2].x, rowY + 8, {
      width: columns[2].width,
      align: "right",
    });
    doc.text(formatMoney(item.rate, item.currency), columns[3].x, rowY + 8, {
      width: columns[3].width,
      align: "right",
    });
    doc.text(formatMoney(item.subtotal, item.currency), columns[4].x, rowY + 8, {
      width: columns[4].width,
      align: "right",
    });
    doc.text(formatMoney(item.tax, item.currency), columns[5].x, rowY + 8, {
      width: columns[5].width,
      align: "right",
    });

    doc.y = rowY + rowHeight + 8;
  });

  ensureSpaceForBlock(doc, 170);

  drawRoundedCard(doc, 40, doc.y, 250, 118, config.summaryFill, config.cardStroke, config.radius);
  drawRoundedCard(doc, 305, doc.y, 250, 118, config.cardFill, config.cardStroke, config.radius);

  const summaryY = doc.y;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(config.accent).text("Tax Configuration", 56, summaryY + 14);
  doc.font("Helvetica").fontSize(9).fillColor("#334155");
  doc.text(`GST Rate: ${taxConfig.gstRate || 0}%`, 56, summaryY + 36);
  doc.text(`TCS Rate: ${taxConfig.tcsRate || 0}%`, 56, summaryY + 54);
  doc.text(`Other Tax: ${formatMoney(taxConfig.otherTax, items[0]?.currency)}`, 56, summaryY + 72);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Financial Summary", 321, summaryY + 14);
  const summaryLines = [
    ["Subtotal", formatMoney(summary.subtotal, items[0]?.currency)],
    [`GST (${taxConfig.gstRate || 0}%)`, formatMoney(summary.gstAmount, items[0]?.currency)],
    [`TCS (${taxConfig.tcsRate || 0}%)`, formatMoney(summary.tcsAmount, items[0]?.currency)],
    ["Total Tax", formatMoney(summary.totalTax, items[0]?.currency)],
    ["Grand Total", formatMoney(summary.grandTotal, items[0]?.currency)],
  ];

  summaryLines.forEach(([label, value], index) => {
    const lineY = summaryY + 34 + index * 16;
    doc.font(index === summaryLines.length - 1 ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    doc.fillColor("#475569").text(label, 321, lineY, { width: 110 });
    doc.fillColor(index === summaryLines.length - 1 ? "#0f172a" : "#0f172a").text(value, 430, lineY, {
      width: 95,
      align: "right",
    });
  });

  doc.y = summaryY + 136;
  ensureSpaceForBlock(doc, 66);
  const noteY = doc.y;
  drawRoundedCard(doc, 40, noteY, 515, 58, config.noteFill, config.cardStroke, config.radius);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text("Finance Review Note", 56, noteY + 12, {
    width: 470,
    align: "left",
  });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#64748b")
    .text(
      "Use this document to validate DMC-submitted service totals, taxes, and payout readiness before settling the invoice.",
      56,
      noteY + 28,
      { width: 470 },
    );
  doc.y = noteY + 70;

  doc.end();

  const finalBuffer = await pdfPromise;

  // const stats = fs.statSync(absoluteFilePath); // [LOCAL] disk write disabled
  // const fileSizeKb = Math.max(1, Math.round(stats.size / 1024));
  const fileSizeKb = Math.max(1, Math.round(finalBuffer.length / 1024));

  return {
    name: fileName,
    filePath: publicFilePath,
    size: `${fileSizeKb} kB`,
    kind: "invoice",
  };
};
