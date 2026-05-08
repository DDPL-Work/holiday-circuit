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
      ? `Quotation ${quotationNumber} is ready for ${query.destination}.`
      : `Quotation received for query ${query.queryId}.`,
    link: "/agent/queries",
    meta: {
      queryId: query._id,
      quotationNumber,
      destination: query.destination,
      totalAmount: Number(quoteDetails?.totalAmount || 0),
      quoteDetails,
    },
  });
};
