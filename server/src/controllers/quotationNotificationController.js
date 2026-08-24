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

    const opsQuoteDetails = {
      ...quoteDetails,
      isOpsQuotation: true,
      agentBrandingName: "Holiday Circuit",
      agentLogo: "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",
      agentCompanyAddress: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
      agentPhone: "+91 8851346665, +91 9971706003",
      agentEmail: "ops@leelatravels.com",
    };

    if (
      normalizedChannels.includes("dashboard") ||
      normalizedChannels.includes("dashboard_notification")
    ) {
      results.dashboard = await createDashboardNotification(queryId, {
        ...opsQuoteDetails,
        deliveryChannels: normalizedChannels,
        recipientEmail: agent?.email || "",
        recipientPhone: agent?.phone || "",
      });
    }

    if (normalizedChannels.includes("email")) {
      if (!agent?.email) {
        return res.status(400).json({ status: "error", message: "Agent email required" });
      }

      results.email = await sendEmailQuote(agent.email, opsQuoteDetails);
    }

    if (normalizedChannels.includes("whatsapp")) {
      if (!agent?.phone) {
        return res.status(400).json({ status: "error", message: "Agent phone required" });
      }

      try {
        results.whatsapp = await sendWhatsAppMessage({
          ...opsQuoteDetails,
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
        ...opsQuoteDetails,
        queryId: opsQuoteDetails?.queryId || queryId,
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
