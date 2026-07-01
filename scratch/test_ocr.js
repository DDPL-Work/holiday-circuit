import fs from "fs";
import { analyzeInvoiceFile } from "../server/src/services/invoiceExtractionService.js";

async function main() {
  const file = {
    path: "c:\\Users\\DELL\\OneDrive\\Desktop\\Holiday circuit\\holiday-circuit\\server\\uploads\\1782809723103-1.webp",
    originalname: "1.webp",
    mimetype: "image/webp",
  };

  try {
    const result = await analyzeInvoiceFile(file, {
      claimedSummary: {},
      expectedSummary: {
        subtotal: 98350,
        totalTax: 4917.5,
        grandTotal: 103267.5,
        currency: "INR"
      }
    });

    console.log("=== EXTRACTION RESULT ===");
    console.log("Status:", result.status);
    console.log("Confidence:", result.confidence);
    console.log("Fields:", JSON.stringify(result.fields, null, 2));
    console.log("\n=== RAW TEXT EXTRACTED ===");
    console.log(result.rawTextSample);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
