import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePDF = async (quoteDetails) => {
  // 👉 uploads folder ka correct absolute path
  const dirPath = path.join(process.cwd(), "uploads");

  // 👉 folder exist nahi hai to create karo
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 👉 file ka proper path
  const filePath = path.join(
    dirPath,
    `quotation_${quoteDetails.queryId}.pdf`
  );

  const doc = new PDFDocument();

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text("Quotation Details", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(JSON.stringify(quoteDetails, null, 2));

  doc.end();

  // 👉 wait karo file complete likhne ka
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { filePath };
};