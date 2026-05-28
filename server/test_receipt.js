import { generateAgentPaymentReceiptPdf, generatePayoutReceiptPdf } from "./src/services/payoutReceiptPdfService.js";

async function main() {
  try {
    console.log("Generating test PDFs...");
    const agentReceipt = await generateAgentPaymentReceiptPdf({
      invoiceNumber: "INV-12345",
      queryCode: "TRIP-1001",
      paymentDate: new Date(),
      paymentReference: "UTR99887766",
      amountPaid: 15000,
      totalAmount: 45000,
      cumulativePaid: 15000,
      remainingAmount: 30000,
      paidBy: "John Doe Travels - Trip ID: TRIP-1001",
      destination: "Maldives",
      guestDetails: "2 Adults - 1 Child",
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      generatedAt: new Date(),
      receiptTitle: "Installment Payment Receipt",
    });
    console.log("Agent receipt generated successfully:", agentReceipt.absoluteFilePath);

    const payoutReceipt = await generatePayoutReceiptPdf({
      invoiceNumber: "INV-12345",
      queryCode: "TRIP-1001",
      payoutDate: new Date(),
      payoutReference: "TXN112233",
      payoutAmount: 15000,
      payoutBank: "HDFC Bank",
      currency: "INR",
      destination: "Maldives",
      dmcName: "Maldives DMC Pvt Ltd",
      adults: 2,
      children: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      generatedAt: new Date(),
      totalAmount: 45000,
      cumulativePaid: 35000,
      remainingAmount: 10000,
      trackerPayments: [
        { amount: 20000, utrNumber: "TXN112211", bankName: "ICICI Bank", paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { amount: 15000, utrNumber: "TXN112233", bankName: "HDFC Bank", paymentDate: new Date() },
      ],
    });
    console.log("Payout receipt generated successfully:", payoutReceipt.absoluteFilePath);
  } catch (error) {
    console.error("Error generating receipts:", error);
  }
}

main();
