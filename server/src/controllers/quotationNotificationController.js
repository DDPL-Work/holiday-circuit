import { sendEmailQuote } from "../services/emailService.js";
import { sendWhatsAppMessage } from "../services/whatsappService.js";
import { createDashboardNotification } from "../services/dashboardService.js";
import { generatePDF } from "../services/pdfService.js";

export const sendQuotationController = async (req, res) => {
  const { queryId, channels, quoteDetails, agent } = req.body;
console.log("CHANNELS:", channels);
console.log("EMAIL CHECK:", channels.includes("email"));

  if (!queryId || !quoteDetails || !channels?.length) {
    return res.status(400).json({ status: "error", message: "Invalid request data" });
  }

  try {
    const results = {};
    if (channels.includes("dashboard")) {
      results.dashboard = await createDashboardNotification(queryId, quoteDetails);
    }
    if (channels.includes("email")) {
      if (!agent?.email) {
        console.log("EMAIL BLOCK RUNNING");
        return res.status(400).json({ message: "Agent email required" });
      }
      results.email = await sendEmailQuote(agent.email, quoteDetails);
    }

    if (channels.includes("whatsapp")) {
      if (!agent?.phone) {
        return res.status(400).json({ message: "Agent phone required" });
      }
      results.whatsapp = await sendWhatsAppMessage(agent.phone, quoteDetails);
    }
   if (channels.includes("pdf")) {
  try {
    quoteDetails.queryId = queryId;
    results.pdf = await generatePDF(quoteDetails);
  } catch (err) {
    console.log("PDF ERROR:", err.message);
  }
}
    return res.status(200).json({ status: "success", results });
  } catch (error) {
    console.error("Quotation send error:", error); 
    return res.status(500).json({
      status: "error",
      message: "Failed to send quotation",
      error: error.message,
    });
  }
};