import Notification from "../models/notification.model.js";
import TravelQuery from "../models/TravelQuery.model.js";

const resolveTravelQuery = async (queryId) => {
  if (!queryId) return null;

  const idValue = String(queryId || "").trim();

  const queryByMongoId = await TravelQuery.findById(idValue);
  if (queryByMongoId) {
    return queryByMongoId;
  }

  return TravelQuery.findOne({ queryId: idValue });
};

const joinNotificationParts = (items = []) => {
  const parts = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
};

const buildDeliveryNote = (quoteDetails = {}) => {
  const channels = Array.isArray(quoteDetails?.deliveryChannels)
    ? quoteDetails.deliveryChannels.map((channel) => String(channel || "").trim().toLowerCase())
    : [];
  const parts = [];

  if (channels.includes("dashboard") || channels.includes("dashboard_notification")) {
    parts.push("available in your dashboard");
  }

  if (channels.includes("email")) {
    parts.push(`sent to your email${quoteDetails?.recipientEmail ? ` (${quoteDetails.recipientEmail})` : ""}`);
  }

  if (channels.includes("whatsapp")) {
    parts.push(`shared on WhatsApp${quoteDetails?.recipientPhone ? ` (${quoteDetails.recipientPhone})` : ""}`);
  }

  if (channels.includes("pdf")) {
    parts.push("prepared as a downloadable PDF copy");
  }

  const deliveryText = joinNotificationParts(parts);
  return deliveryText ? ` It was ${deliveryText}.` : "";
};

export const createDashboardNotification = async (queryId, quoteDetails = {}) => {
  const query = await resolveTravelQuery(queryId);

  if (!query) {
    throw new Error("Travel query not found");
  }

  const quotationNumber = String(quoteDetails?.quotationNumber || "").trim();

  return Notification.create({
    user: query.agent,
    type: "success",
    title: "Quotation Received",
    message: quotationNumber
      ? `Quotation ${quotationNumber} is ready for ${query.destination}.${buildDeliveryNote(quoteDetails)}`
      : `Quotation received for query ${query.queryId}.${buildDeliveryNote(quoteDetails)}`,
    link: "/agent/queries",
    meta: {
      queryId: query._id,
      quotationNumber,
      destination: query.destination,
      totalAmount: Number(quoteDetails?.totalAmount || 0),
      deliveryChannels: Array.isArray(quoteDetails?.deliveryChannels) ? quoteDetails.deliveryChannels : [],
      recipientEmail: quoteDetails?.recipientEmail || "",
      recipientPhone: quoteDetails?.recipientPhone || "",
      quoteDetails,
    },
  });
};
