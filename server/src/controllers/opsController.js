import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravalQuery.model.js";
import Quotation from "../models/quotation.model.js";
import Invoice from "../models/invoice.model.js";
import Counter from "../models/counter.model.js"
import Hotel from "../models/hotelDmc.model.js";
import Activity from "../models/activityDmc.model.js";
import Transfer from "../models/transferDmc.model.js";
// import Package from "../models/PackageDmc.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js"


/* =========================GET ALL QUERIES (OPS) ========================= */

export const getAllQueries = async (req, res, next) => {
  try {
    const queries = await TravelQuery.find({
      assignedTo: req.user.id
    })
    
      .populate("agent", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Assigned queries fetched successfully",
      queries
    });
  } catch (error) {
    next(error);
  }
};


// ==================== Reject Query by Ops ==================================

export const rejectQueryByOps = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (query.assignedTo.toString() !== req.user.id) {
      return next(new ApiError(403, "Unauthorized"));
    }

    if (query.opsStatus !== "New_Query") {
      return next(new ApiError(400, "Cannot reject now"));
    }

    query.opsStatus = "Pending_Accept";
    query.agentStatus = "Revision Requested";
    query.rejectionNote = reason;

    query.activityLog.push({ action: "Query Rejected", performedBy: "Operations", timestamp: new Date()});

    await query.save();

   res.json({ success: true, message: "Query rejected", query });

  } catch (error) {
    next(error);
  }
};

// ========================== Accept Query By Ops ==============================

export const acceptQueryByOps = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (query.assignedTo.toString() !== req.user.id) {
      return next(new ApiError(403, "Not authorized"));
    }

     // ✅ status condition fix
    if (
      query.opsStatus !== "New_Query" &&
      query.opsStatus !== "Revision_Query" &&
      query.opsStatus !== "Pending_Accept"
    ) {
      return next(new ApiError(400, "Cannot accept"));
    }

    query.opsStatus = "Booking_Accepted";
    query.agentStatus = "In Progress";

    query.activityLog.push({
      action: "Query Accepted",
      performedBy: "Operations",
      timestamp: new Date()
    });

    await query.save();

    res.json({ success: true, query });

  } catch (error) {
    next(error);
  }
};


/* =========================UPDATE QUERY STATUS========================= */

export const updateQueryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = await TravelQuery.findById(id);
    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    query.status = status;
    await query.save();

    return res.json({message: "Query status updated successfully", query});
  } catch (error) {
    next(error);
  }
};


//==================== Get Order Acceptance Order =====================================

export const getOrderAcceptanceQueries = async (req, res, next) => {
  try {

    const queries = await TravelQuery.find({
      opsStatus: "Booking_Accepted"
    })
      .populate("agent", "name companyName email")
      .sort({ createdAt: -1 });

    // Pending orders count
    const pendingOrders = await TravelQuery.countDocuments({
      opsStatus: "Booking_Accepted",
      quotationStatus: "Awaiting_Decision"
    });

     // Avg response time
    let totalTime = 0;

    queries.forEach((q) => {
      const diff = new Date() - new Date(q.createdAt);
      totalTime += diff;
    });

 let avgResponseTime = "0m";

if (queries.length > 0) {

  const totalTime = queries.reduce((sum, q) => {
    return sum + (new Date() - new Date(q.createdAt));
  }, 0);

  const avgMs = totalTime / queries.length;

  const totalMinutes = Math.floor(avgMs / (1000 * 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  avgResponseTime =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

    res.status(200).json({
      success: true,
      pendingOrders,
      avgResponseTime,
      queries
    });

  } catch (error) {
    next(error);
  }
};

/* ========================= CREATE QUOTATION ========================= */

export const createQuotation = async (req, res, next) => {
  try {

    const {
      queryId,
      validTill,
      baseAmount,
      opsPercent = 0,
      opsAmount = 0,
      serviceCharge = 0,
      handlingFee = 0,
      gstPercent = 0,
      gstAmount = 0,
      tcsPercent = 0,
      tcsAmount = 0,
      tourismAmount = 0,
      inclusions = []
    } = req.body;

    if (!queryId || !validTill || !baseAmount) {
      return next(new ApiError(400, "Required fields are missing"));
    }

    const query = await TravelQuery.findOne({ queryId });

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    const lastQuotation = await Quotation.findOne().sort({ createdAt: -1 });

    let quotationNumber = "QT-1001";

    if (lastQuotation?.quotationNumber) {
      const lastNumber = parseInt(lastQuotation.quotationNumber.split("-")[1]);
      quotationNumber = `QT-${lastNumber + 1}`;
    }

    const base = Number(baseAmount);
    const ops = Number(opsPercent)
    const opsAmt = Number(opsAmount)
    const service = Number(serviceCharge);
    const handling = Number(handlingFee);

    const gst = Number(gstPercent);
    const gstAmt = Number(gstAmount);
    const tcs = Number(tcsPercent)
    const tcsAmt = Number(tcsAmount);
    const tourismAmt = Number(tourismAmount);

    const taxTotal = gstAmt + tcsAmt + tourismAmt;
    const subTotal = base + opsAmt + service + handling;
    const totalAmount = subTotal + taxTotal;

    const quotation = await Quotation.create({

      quotationNumber,
      queryId: query._id,
      agent: query.agent,
      createdBy: req.user.id,

      inclusions,

 pricing: {
  baseAmount: base,

  opsMarkup:{
       percent: ops,
       amount:opsAmt
  },

  opsCharges: {
    serviceCharge: service,
    handlingFee: handling
  },

  tax: {
    gst: {
      percent: gst,
      amount: gstAmt
    },

    tcs: {
      percent: tcs,
      amount: tcsAmt
    },

tourismFee: {
  amount: tourismAmt
},

    totalTax: taxTotal
  },

  totalAmount
},

      validTill,
      status: "Quote Sent"

    });

    query.quotationStatus = "Sent_To_Agent";
    query.opsStatus = "Confirmed";
    query.agentStatus = "Quote Sent";

    query.activityLog.push({
      action: "Quote Sent",
      performedBy: "Ops Team",
      timestamp: new Date()
    });

    await query.save();

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation
    });

  } catch (error) {
    next(error);
  }
};



/* =========================ADD QUOTATION ITEM========================= */

export const addQuotationItem = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { inclusions } = req.body;

    if (!inclusions) {
      return next(new ApiError(400, "Inclusions are required"));
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    //CASE 1: array
    if (Array.isArray(inclusions)) {
      quotation.inclusions.push(...inclusions);
    }
    //CASE 2: single string 
    else {
      quotation.inclusions.push(inclusions);
    }

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Inclusions added successfully",
      quotation,
    });
  } catch (error) {
    next(error);
  }
};


/* ========================REVISE QUOTATION ========================= */

export const reviseQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    quotation.revision = (quotation.revision || 0) + 1;
    quotation.status = "Revision Requested";

    await quotation.save();

    return res.json({
      message: "Quotation revised successfully",
      quotation,
    });
  } catch (error) {
    next(error);
  }
};


/* ========================= GENERATE INVOICE ========================= */
export const generateInvoice = async (req, res, next) => {
  try {
    const { quotationId } = req.body;

    if (!quotationId) {
      return next(new ApiError(400, "Quotation ID is required"));
    }

    // 1️⃣ Quotation fetch
    const quotation = await Quotation.findById(quotationId).populate("query");

    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }
      
    let counter = await Counter.findOne({ name: "invoice" });

if (!counter) {
  // first time
  counter = await Counter.create({
    name: "invoice",
    seq: 1000
  });
}

// increment
counter.seq += 1;
await counter.save();

const invoiceNumber = `INV-${counter.seq}`;
    // Invoice create
    const invoice = await Invoice.create({
      query: quotation.query._id,
      agent: quotation.agent,
      generatedBy: req.user.id,        // ops / admin
      invoiceNumber,
      invoiceType: req.user.role,       // "operations" or "admin"
      totalAmount: quotation.totalAmount,
      paymentStatus: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      invoice
    });

  } catch (error) {
    next(error);
  }
};

//============================= Search by destination, package name, or services=======================

export const searchServices = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: "Query is required" });

    const regex = new RegExp(query, 'i'); // case-insensitive partial match

    // Hotels
    const hotels = await Hotel.find({
      $or: [
        { serviceName: regex },
        { hotelName: regex },        // serviceName equivalent
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ],
      status: "active"
    });

    // Activities
    const activities = await Activity.find({
      $or: [
        { serviceName: regex },
        { name: regex },            // serviceName equivalent
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ]
    });

    // Transfers
    const transfers = await Transfer.find({
      $or: [
        { serviceName: regex },     // serviceName field
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ]
    });

    // Sightseeing
    const sightseeing = await Sightseeing.find({
      $or: [
        { serviceName: regex },
        { name: regex },            // serviceName equivalent
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        hotels,
        activities,
        transfers,
        sightseeing
      }
    });

  } catch (error) {
    next(error);
  }
};
