import { sendEmailQuote } from "../services/emailService.js";
import { getWhatsAppDeliveryErrorMessage, sendWhatsAppMessage } from "../services/whatsappService.js";
import { createDashboardNotification } from "../services/dashboardService.js";
import { generatePDF } from "../services/pdfService.js";

export const sendQuotationController = async (req, res) => {
  const { queryId, channels, quoteDetails, agent } = req.body;
  const normalizedChannels = Array.isArray(channels)
    ? channels.map((channel) => String(channel || "").trim().toLowerCase())
    : [];

  if (!queryId || !quoteDetails || !normalizedChannels.length) {
    return res.status(400).json({ status: "error", message: "Invalid request data" });
  }

  try {
    const results = {};

    if (
      normalizedChannels.includes("dashboard") ||
      normalizedChannels.includes("dashboard_notification")
    ) {
      results.dashboard = await createDashboardNotification(queryId, {
        ...quoteDetails,
        deliveryChannels: normalizedChannels,
        recipientEmail: agent?.email || "",
        recipientPhone: agent?.phone || "",
      });
    }

    if (normalizedChannels.includes("email")) {
      if (!agent?.email) {
        return res.status(400).json({ status: "error", message: "Agent email required" });
      }

      results.email = await sendEmailQuote(agent.email, quoteDetails);
    }

    if (normalizedChannels.includes("whatsapp")) {
      if (!agent?.phone) {
        return res.status(400).json({ status: "error", message: "Agent phone required" });
      }

      try {
        results.whatsapp = await sendWhatsAppMessage({
          ...quoteDetails,
          phone: agent.phone,
        });
      } catch (whatsappError) {
        return res.status(400).json({
          status: "error",
          message: getWhatsAppDeliveryErrorMessage(whatsappError),
        });
      }
    }

    if (normalizedChannels.includes("pdf")) {
      results.pdf = await generatePDF({
        ...quoteDetails,
        queryId: quoteDetails?.queryId || queryId,
      });
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
