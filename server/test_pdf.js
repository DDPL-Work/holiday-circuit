import { generatePDF } from "./src/services/pdfService.js";

async function main() {
  try {
    console.log("Generating client quotation PDF...");
    const result = await generatePDF({
      quotationNumber: "QT-1141",
      queryId: "QRY-1081",
      destination: "Goa",
      travelDates: "23 May 2026 - 26 May 2026",
      durationLabel: "3 Nights / 4 Days",
      travelerSummary: "2 Adults",
      validTill: "27 May 2026",
      recipientName: "Adult_1",
      agentLogo: "", // Triggers fallback initials
      agentBrandingName: "DDLC Company Pvt. Ltd.",
      agentEmail: "joy@gmail.com",
      agentPhone: "+91 9999999999",
      agentGstNumber: "07AAAAA1111A1Z1",
      totalAmount: 75509,
      currency: "INR",
      services: [
        {
          title: "Grand Hyatt Goa",
          typeLabel: "hotel",
          serviceDateLabel: "23 May 2026",
          location: "Goa, India",
          quantityLabel: "1N | 1 Room | 1 Pax",
          description: "Notes: Bay View Room | CP | Grand Hyatt Goa Hotel | Wifi | Air Conditioning"
        }
      ],
      inclusions: ["Accommodation", "Breakfast"],
      exclusions: ["Flights", "Personal Expenses"],
      additionalNotes: ["Check-in time is 2 PM"],
      includeSellerBankDetails: false
    });
    console.log("PDF generated successfully:", result.filePath);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

main();
