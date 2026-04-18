import Notification from "../models/notification.model.js";
import TravelQuery from "../models/TravelQuery.model.js";

export const createDashboardNotification = async (queryId, quoteDetails) => {
  const query = await TravelQuery.findById(queryId);

  if (!query) {
    throw new Error("Travel query not found");
  }

  const notification = await Notification.create({ user: query.agent,type: "info", title: "New Quotation Received",
    message: `Quotation received for query ${query.queryId}`,
    meta: {
      queryId: query._id,
      quoteDetails,
    },
  });

  return notification;
};


