import TravelQuery from "../models/TravelQuery.model.js";
import Quotation from "../models/quotation.model.js";
import InternalInvoice from "../models/internalInvoice.model.js";
import Auth from "../models/auth.model.js";

// Helper to resolve clean DMC and Business Partner names for a query
const resolveQueryDmcAndPartners = (query, quotation, invoices = [], authMap = new Map(), knownPartnerNames = new Set()) => {
  const dmcSet = new Set();

  // 1. Check Query direct business partner / offline partner fields
  if (query?.businessPartnerName && String(query.businessPartnerName).trim()) {
    dmcSet.add(String(query.businessPartnerName).trim());
  }

  // 2. Check Quotation level
  if (quotation) {
    if (quotation.businessPartnerName && String(quotation.businessPartnerName).trim()) {
      dmcSet.add(String(quotation.businessPartnerName).trim());
    }
    if (quotation.assignedPartnerName && String(quotation.assignedPartnerName).trim()) {
      dmcSet.add(String(quotation.assignedPartnerName).trim());
    }

    if (Array.isArray(quotation.services)) {
      quotation.services.forEach((s) => {
        // Explicit service business partner
        if (s.businessPartnerName && String(s.businessPartnerName).trim()) {
          dmcSet.add(String(s.businessPartnerName).trim());
        }
        // Registered partner in Auth
        if (s.supplierName && knownPartnerNames.has(s.supplierName.trim().toLowerCase())) {
          dmcSet.add(s.supplierName.trim());
        }
        // Online DMC reference
        if (s.dmcId) {
          if (typeof s.dmcId === "object") {
            const name = s.dmcId.companyName || s.dmcId.name;
            if (name) dmcSet.add(name);
          } else {
            const dmcUser = authMap.get(s.dmcId.toString());
            if (dmcUser?.companyName || dmcUser?.name) {
              dmcSet.add(dmcUser.companyName || dmcUser.name);
            }
          }
        } else if (s.dmcName && knownPartnerNames.has(s.dmcName.trim().toLowerCase())) {
          dmcSet.add(s.dmcName.trim());
        }
      });
    }
  }

  // 3. Check Invoices level
  if (Array.isArray(invoices)) {
    invoices.forEach((iv) => {
      if (iv.businessPartnerName && String(iv.businessPartnerName).trim()) {
        dmcSet.add(String(iv.businessPartnerName).trim());
      }
      if (iv.dmc) {
        if (typeof iv.dmc === "object") {
          const name = iv.dmc.companyName || iv.dmc.name;
          if (name) dmcSet.add(name);
        } else {
          const dmcUser = authMap.get(iv.dmc.toString());
          if (dmcUser?.companyName || dmcUser?.name) {
            dmcSet.add(dmcUser.companyName || dmcUser.name);
          }
        }
      } else if (iv.dmcName && (iv.partnerType === "offline_partner" || knownPartnerNames.has(iv.dmcName.trim().toLowerCase()))) {
        dmcSet.add(String(iv.dmcName).replace(/\s*\(Offline Partner\)/i, "").trim());
      }
    });
  }

  const list = Array.from(dmcSet).filter(Boolean);
  return list.length ? list.join(", ") : "N/A";
};

// Fetch list of vouchered / confirmed booking queries
export const getVoucheredQueries = async (req, res) => {
  try {
    const queries = await TravelQuery.find({
      $or: [
        { voucherStatus: { $in: ["generated", "sent"] } },
        { opsStatus: { $in: ["Vouchered", "Confirmed", "Payment_Completed"] } },
        { voucherNumber: { $exists: true, $ne: "" } },
        { voucherGeneratedAt: { $exists: true, $ne: null } },
      ],
    })
      .populate("agent", "name companyName")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .lean();

    const queryIds = queries.map((q) => q._id);

    // Fetch associated quotations to extract DMC, Business Partners, and ops creator
    const quotations = await Quotation.find({ queryId: { $in: queryIds } })
      .populate("createdBy", "name")
      .populate("services.dmcId", "name companyName")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch associated internal invoices for offline/online partner mapping
    const internalInvoices = await InternalInvoice.find({ query: { $in: queryIds } })
      .populate("dmc", "name companyName")
      .lean();

    // Fetch auth users for partner / DMC lookup
    const authUsers = await Auth.find({
      $or: [{ role: "dmc_partner" }, { isBusinessPartner: true }, { role: "dmc" }, { role: "partner" }],
    }).lean();
    const authMap = new Map();
    authUsers.forEach((u) => authMap.set(u._id.toString(), u));

    const knownPartnerNames = new Set(
      authUsers
        .flatMap((u) => [u.name, u.companyName])
        .filter(Boolean)
        .map((n) => n.trim().toLowerCase())
    );

    const quotationMap = {};
    quotations.forEach((quot) => {
      if (!quotationMap[quot.queryId.toString()]) {
        quotationMap[quot.queryId.toString()] = quot;
      }
    });

    const invoiceMap = {};
    internalInvoices.forEach((iv) => {
      const qKey = iv.query?.toString();
      if (!invoiceMap[qKey]) invoiceMap[qKey] = [];
      invoiceMap[qKey].push(iv);
    });

    // Map to what the frontend expects
    const mappedData = queries.map((q) => {
      const quot = quotationMap[q._id.toString()];
      const invList = invoiceMap[q._id.toString()] || [];

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

      const dmcName = resolveQueryDmcAndPartners(q, quot, invList, authMap, knownPartnerNames);

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
    }).filter((item) => item.dmc && item.dmc !== "N/A");

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

    const quotation = await Quotation.findOne({ queryId: query._id })
      .populate("createdBy", "name")
      .populate("services.dmcId", "name companyName")
      .sort({ createdAt: -1 })
      .lean();

    const internalInvoices = await InternalInvoice.find({ query: query._id })
      .populate("dmc", "name companyName")
      .lean();

    const authUsers = await Auth.find({
      $or: [{ role: "dmc_partner" }, { isBusinessPartner: true }, { role: "dmc" }, { role: "partner" }],
    }).lean();
    const authMap = new Map();
    authUsers.forEach((u) => authMap.set(u._id.toString(), u));

    const knownPartnerNames = new Set(
      authUsers
        .flatMap((u) => [u.name, u.companyName])
        .filter(Boolean)
        .map((n) => n.trim().toLowerCase())
    );

    let services = [];
    let fallbackOpsName = null;

    if (quotation) {
      if (quotation.createdBy && quotation.createdBy.name) {
        fallbackOpsName = quotation.createdBy.name;
      }

      if (quotation.services) {
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

          const provider =
            s.businessPartnerName ||
            s.supplierName ||
            (s.dmcId && typeof s.dmcId === "object" ? s.dmcId.companyName || s.dmcId.name : null) ||
            s.dmcName ||
            "";

          return {
            type: type,
            name: s.title || s.name || s.provider || "Service",
            provider: provider || "Partner",
            details: s.description || s.details || "N/A",
          };
        });
      }
    }

    const dmc = resolveQueryDmcAndPartners(query, quotation, internalInvoices, authMap, knownPartnerNames);

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
