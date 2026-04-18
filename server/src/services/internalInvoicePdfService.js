import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

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

const drawRoundedCard = (doc, x, y, width, height, fillColor, strokeColor = null) => {
  doc.save();
  doc.roundedRect(x, y, width, height, 14);
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

const drawItemsTableHeader = (doc, y) => {
  const columns = [
    { key: "service", label: "Service", x: 44, width: 170, align: "left" },
    { key: "type", label: "Type", x: 220, width: 60, align: "left" },
    { key: "qty", label: "Qty", x: 286, width: 36, align: "right" },
    { key: "rate", label: "Rate", x: 328, width: 78, align: "right" },
    { key: "subtotal", label: "Subtotal", x: 412, width: 72, align: "right" },
    { key: "tax", label: "Tax", x: 490, width: 58, align: "right" },
  ];

  doc.save();
  doc.roundedRect(40, y, 515, 24, 10).fill("#eff6ff");
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
  const dirPath = ensureUploadsDir();
  const sanitizedInvoiceNumber = String(invoiceMeta.invoiceNumber || queryCode || "invoice")
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `DMC_Internal_Invoice_${sanitizedInvoiceNumber}.pdf`;
  const absoluteFilePath = path.join(dirPath, fileName);
  const publicFilePath = `/uploads/internal-invoices/${fileName}`;

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const stream = fs.createWriteStream(absoluteFilePath);
  doc.pipe(stream);

  drawRoundedCard(doc, 40, 40, 515, 92, "#0f172a");
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text("Internal Invoice", 58, 58);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#cbd5e1")
    .text("Finance review copy for DMC settlement validation", 58, 88);

  drawRoundedCard(doc, 420, 58, 115, 52, "#1d4ed8");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#bfdbfe").text("BOOKING REF", 435, 72, {
    width: 85,
    align: "center",
  });
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#ffffff").text(queryCode || "-", 435, 86, {
    width: 85,
    align: "center",
  });

  drawRoundedCard(doc, 40, 148, 252, 92, "#f8fafc", "#e2e8f0");
  drawRoundedCard(doc, 303, 148, 252, 92, "#f8fafc", "#e2e8f0");

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Partner Snapshot", 56, 164);
  drawLabelValue(doc, {
    x: 56,
    y: 184,
    label: "DMC / Supplier",
    value: invoiceMeta.supplierName || dmcName || "-",
    width: 210,
  });
  drawLabelValue(doc, {
    x: 56,
    y: 214,
    label: "Destination",
    value: destination || "-",
    width: 210,
  });

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Invoice Snapshot", 319, 164);
  drawLabelValue(doc, {
    x: 319,
    y: 184,
    label: "Invoice No.",
    value: invoiceMeta.invoiceNumber || "-",
    width: 95,
  });
  drawLabelValue(doc, {
    x: 430,
    y: 184,
    label: "Template",
    value: templateVariant || "aurora-ledger",
    width: 95,
    align: "right",
  });
  drawLabelValue(doc, {
    x: 319,
    y: 214,
    label: "Invoice Date",
    value: formatDateLabel(invoiceMeta.invoiceDate),
    width: 95,
  });
  drawLabelValue(doc, {
    x: 430,
    y: 214,
    label: "Due Date",
    value: formatDateLabel(invoiceMeta.dueDate),
    width: 95,
    align: "right",
  });

  doc.y = 262;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Itemized Services");
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text("Auto-generated from DMC internal invoice line items submitted to finance.");
  doc.moveDown(0.6);

  let columns = drawItemsTableHeader(doc, doc.y);
  doc.y += 32;

  items.forEach((item, index) => {
    const serviceHeight = doc.heightOfString(item.service || "-", {
      width: columns[0].width,
      align: "left",
    });
    const rowHeight = Math.max(26, serviceHeight + 12);

    ensureSpaceForBlock(doc, rowHeight + 18, () => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Itemized Services (cont.)");
      doc.moveDown(0.5);
      columns = drawItemsTableHeader(doc, doc.y);
      doc.y += 32;
    });

    const rowY = doc.y;
    drawRoundedCard(
      doc,
      40,
      rowY,
      515,
      rowHeight,
      index % 2 === 0 ? "#ffffff" : "#f8fafc",
      "#e2e8f0",
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

  drawRoundedCard(doc, 40, doc.y, 250, 118, "#eff6ff", "#bfdbfe");
  drawRoundedCard(doc, 305, doc.y, 250, 118, "#f8fafc", "#e2e8f0");

  const summaryY = doc.y;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#1d4ed8").text("Tax Configuration", 56, summaryY + 14);
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
  drawRoundedCard(doc, 40, doc.y, 515, 48, "#f8fafc", "#e2e8f0");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text("Finance Review Note", 56, doc.y + 12);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#64748b")
    .text(
      "Use this document to validate DMC-submitted service totals, taxes, and payout readiness before settling the invoice.",
      56,
      doc.y + 25,
      { width: 470 },
    );

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const stats = fs.statSync(absoluteFilePath);
  const fileSizeKb = Math.max(1, Math.round(stats.size / 1024));

  return {
    name: fileName,
    filePath: publicFilePath,
    size: `${fileSizeKb} kB`,
    kind: "invoice",
  };
};
