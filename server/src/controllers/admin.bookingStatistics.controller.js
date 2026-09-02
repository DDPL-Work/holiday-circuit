import TravelQuery from "../models/TravelQuery.model.js";
import Quotation from "../models/quotation.model.js";

// Fetch list of vouchered queries
export const getVoucheredQueries = async (req, res) => {
  try {
    const queries = await TravelQuery.find({ voucherStatus: "generated" })
      .populate("agent", "name companyName")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .lean();

    const queryIds = queries.map((q) => q._id);
    
    // Fetch associated quotations to extract DMC and potentially ops creator
    const quotations = await Quotation.find({ queryId: { $in: queryIds } })
      .populate("createdBy", "name")
      .populate("services.dmcId", "name companyName")
      .sort({ createdAt: -1 }) // if multiple exist, the latest will be mapped
      .lean();
      
    const quotationMap = {};
    quotations.forEach((quot) => {
      if (!quotationMap[quot.queryId.toString()]) {
        quotationMap[quot.queryId.toString()] = quot;
      }
    });

    // Map to what the frontend expects
    const mappedData = queries.map((q) => {
      const quot = quotationMap[q._id.toString()];

      // Safely access fields
      const agentName = q.agent
        ? q.agent.companyName || q.agent.name || "Unassigned"
        : "Unassigned";
        
      let opsName = "Unassigned";
      if (q.assignedTo && q.assignedTo.name) {
        opsName = q.assignedTo.name;
      } else if (quot && quot.createdBy && quot.createdBy.name) {
        opsName = quot.createdBy.name;
      }

      let dmcName = "N/A";
      if (quot && quot.services) {
        const uniqueDmcs = [...new Set(quot.services.map(s => {
          if (s.dmcId && typeof s.dmcId === 'object') {
            return s.dmcId.companyName || s.dmcId.name || s.dmcName;
          }
          return s.dmcName;
        }).filter(Boolean))];
        if (uniqueDmcs.length > 0) {
          dmcName = uniqueDmcs.join(", ");
        }
      }

      const duration =
        q.startDate && q.endDate
          ? Math.ceil((new Date(q.endDate) - new Date(q.startDate)) / (1000 * 60 * 60 * 24))
          : 0;

      return {
        _id: q._id,
        id: q.queryId || "N/A",
        bookingType: q.tourType || "Package",
        destination: q.destination || "N/A",
        ops: opsName,
        agent: agentName,
        dmc: dmcName,
        bookingDate: q.createdAt ? new Date(q.createdAt).toISOString().split("T")[0] : "N/A",
        travelDate: q.startDate ? new Date(q.startDate).toISOString().split("T")[0] : "N/A",
        duration: duration || 0,
        country: q.destination || "N/A",
        city: q.destination || "N/A",
        hotels: q.hotelCategory || "N/A",
        pax: (q.numberOfAdults || 0) + (q.numberOfChildren || 0),
        amount: q.customerBudget ? `₹${q.customerBudget.toLocaleString("en-IN")}` : "N/A",
      };
    });

    res.status(200).json({ success: true, data: mappedData });
  } catch (error) {
    console.error("Error fetching vouchered queries:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Fetch full details of a specific query by Mongo _id
export const getQueryDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const query = await TravelQuery.findById(id)
      .populate("agent", "name companyName")
      .populate("assignedTo", "name")
      .lean();

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    // Try to find the associated quotation to extract detailed services
    // Finding the latest quotation for this query
    const quotation = await Quotation.findOne({ queryId: query._id })
      .populate("createdBy", "name")
      .populate("services.dmcId", "name companyName")
      .sort({ createdAt: -1 })
      .lean();

    let dmc = "N/A";
    let services = [];
    let fallbackOpsName = null;

    if (quotation) {
      if (quotation.createdBy && quotation.createdBy.name) {
        fallbackOpsName = quotation.createdBy.name;
      }
      
      if (quotation.services) {
        // Best effort mapping of quotation services
        services = quotation.services.map((s) => {
          let type = "Activity";
          if (s.serviceType) {
              type = s.serviceType;
          } else if (s.title && s.title.toLowerCase().includes("flight")) {
              type = "Flight";
          } else if (s.title && s.title.toLowerCase().includes("hotel")) {
              type = "Hotel";
          } else if (s.title && s.title.toLowerCase().includes("transfer")) {
              type = "Transfer";
          }
          
          return {
            type: type,
            name: s.title || s.name || s.provider || "Service",
            details: s.description || s.details || "N/A",
          };
        });
        
        const uniqueDmcs = [...new Set(quotation.services.map(s => {
          if (s.dmcId && typeof s.dmcId === 'object') {
            return s.dmcId.companyName || s.dmcId.name || s.dmcName;
          }
          return s.dmcName;
        }).filter(Boolean))];
        if (uniqueDmcs.length > 0) dmc = uniqueDmcs.join(", ");
      }
    }

    // Map core query data
    const agentName = query.agent
      ? query.agent.companyName || query.agent.name || "Unassigned"
      : "Unassigned";
      
    let opsName = "Unassigned";
    if (query.assignedTo && query.assignedTo.name) {
      opsName = query.assignedTo.name;
    } else if (fallbackOpsName) {
      opsName = fallbackOpsName;
    }
    const duration =
      query.startDate && query.endDate
        ? Math.ceil((new Date(query.endDate) - new Date(query.startDate)) / (1000 * 60 * 60 * 24))
        : 0;

    const mappedDetails = {
      _id: query._id,
      id: query.queryId || "N/A",
      bookingType: query.tourType || "Package",
      destination: query.destination || "N/A",
      ops: opsName,
      agent: agentName,
      dmc: dmc,
      bookingDate: query.createdAt ? new Date(query.createdAt).toISOString().split("T")[0] : "N/A",
      travelDate: query.startDate ? new Date(query.startDate).toISOString().split("T")[0] : "N/A",
      duration: duration || 0,
      country: query.destination || "N/A",
      city: query.destination || "N/A",
      hotels: query.hotelCategory || "N/A",
      pax: (query.numberOfAdults || 0) + (query.numberOfChildren || 0),
      amount: query.customerBudget ? `₹${query.customerBudget.toLocaleString("en-IN")}` : "N/A",
      services: services,
    };

    res.status(200).json({ success: true, data: mappedDetails });
  } catch (error) {
    console.error("Error fetching query details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
