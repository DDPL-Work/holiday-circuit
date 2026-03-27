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
import {sendEmailQuote}  from "../services/emailService.js";
import {sendWhatsAppMessage}  from "../services/whatsappService.js";
import mongoose from "mongoose";


const normalizeUsageType = (value) => {
  if (!value) return "point-to-point";

  const v = value.toLowerCase().trim();

  if (v.includes("one") || v.includes("point")) return "point-to-point";
  if (v.includes("round") || v.includes("two")) return "round-trip";
  if (v.includes("full")) return "full-day";
  if (v.includes("half")) return "half-day";

  return "point-to-point";
};


const addLogIfNotExists = (query, action, performedBy) => {
  const exists = query.activityLog.some(
    (log) => log.action === action
  );

  if (!exists) {
    query.activityLog.push({
      action,
      performedBy,
      timestamp: new Date()
    });
  }
};


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
      console.log("USER ID:", req.user.id);
      return next(new ApiError(403, "Unauthorized"));
    }

    if (query.opsStatus === "Pending_Accept") {
      return res.json({ success: true, query });
    }

    query.opsStatus = "Pending_Accept";
    query.agentStatus = "Revision Requested";
    query.rejectionNote = reason;

   query.activityLog.push({action: "Query Rejected", performedBy: req.user.name || "Operations", timestamp: new Date()});

    await query.save();

    res.json({
      success: true,
      message: "Query rejected",
      query
    });

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
      console.log("USER ID:", req.user.id);
      return next(new ApiError(403, "Not authorized"));
    }

    if (query.opsStatus === "Booking_Accepted") {
      return next(new ApiError(400, "Already accepted"));
    }

    query.opsStatus = "Booking_Accepted";
    query.agentStatus = "In Progress";
    query.rejectionNote = undefined;

    query.activityLog.push({
      action: "Query Accepted",
      performedBy: "Operations",
      timestamp: new Date(),
    });

    await query.save();

    res.json({ success: true, query });

  } catch (error) {
    next(error);
  }
};



//============================================ Accept Query==================================================

// export const acceptQuery = async (req, res) => {
//   try {
//     const query = await TravelQuery.findById(req.params.id);

//     if (!query) {
//       return res.status(404).json({ message: "Query not found" });
//     }

//     const createLog = (action, performedBy) => ({action,performedBy,timestamp: new Date()});

//     query.opsStatus = "Booking_Accepted";
//     // addLogIfNotExists(query, "Query Accepted", "Ops");
//    query.activityLog.push({
//   action: "Query Accepted",
//   performedBy: "Ops",
//   timestamp: new Date()
// });
 
//     await query.save();

//     res.json({ success: true, message: "Query accepted" });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



export const startQuotation = async (req, res) => {
  const query = await TravelQuery.findById(req.params.id);

  const createLog = (action, performedBy) => ({action,performedBy,timestamp: new Date()});

  query.quotationStatus = "Quotation_Created";
  addLogIfNotExists(query, "Quotation Started", "Ops");
  // query.activityLog.push(createLog("Quotation Started", "Ops"));

  await query.save();

  res.json({ success: true });
};


export const sendQuotation = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found"
      });
    }

    // optional safety
    if (query.quotationStatus === "Sent_To_Agent") {return res.status(400).json({
        success: false,
        message: "Quotation already sent"
      });
    }

    // ✅ update status
    query.opsStatus = "Confirmed";
    query.quotationStatus = "Sent_To_Agent";
    query.agentStatus = "Quote Sent";

    // ✅ add activity log
    query.activityLog.push({
      action: "Quote Sent",
      performedBy: "Ops",
      timestamp: new Date()
    });

    await query.save();

    res.json({ success: true });

  } catch (error) {
    console.error("Send Quotation Error:", error);
    next(error);
  }
};



export const passToAdmin = async (req, res) => {
  const query = await TravelQuery.findById(req.params.id);

  const createLog = (action, performedBy) => ({
    action,
    performedBy,
    timestamp: new Date()
  });
   addLogIfNotExists(query, "Passed to Admin", "Ops");
  // query.activityLog.push(createLog("Passed to Admin", "Ops"));

  await query.save();

  res.json({ success: true });
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
  assignedTo: new mongoose.Types.ObjectId(req.user.id),
 
  opsStatus: { 
    $in: ["Pending_Accept", "New_Query", "Rejected", "Booking_Accepted" , "Confirmed"]
  }
})
.populate("agent", "name companyName email")
.sort({ createdAt: -1 });

    // Pending orders count
  const pendingOrders = await TravelQuery.countDocuments({
  assignedTo: new mongoose.Types.ObjectId(req.user.id),
  opsStatus: "Pending_Accept"
});

     // Avg response time
    // let totalTime = 0;
    // queries.forEach((q) => {
    //   const diff = new Date() - new Date(q.createdAt);
    //   totalTime += diff;
    // });
    

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
      pricing,
      sendVia = [] ,
      services = [],
      opsPercent = 0,
      opsAmount = 0,
      serviceCharge = 0,
      handlingFee = 0,
      inclusions = []
    } = req.body;


// const gstAmount = Number(req.body.tax?.gstAmount ?? 0);
// const tcsAmount = Number(req.body.tax?.tcsAmount ?? 0);
// const tourismAmount = Number(req.body.tax?.tourismAmount ?? 0);
  

    if (!services.length) {
  return next(new ApiError(400, "No services selected"));
}

    if (!queryId || !validTill || !pricing?.baseAmount) {
      return next(new ApiError(400, "Required fields are missing"));
    }

   const query = await TravelQuery.findOne({ queryId }).populate("agent");

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    const lastQuotation = await Quotation.findOne().sort({ createdAt: -1 });

    let quotationNumber = "QT-1001";

    if (lastQuotation?.quotationNumber) {
      const lastNumber = parseInt(lastQuotation.quotationNumber.split("-")[1]);
      quotationNumber = `QT-${lastNumber + 1}`;
    }

//     if (sendVia === "email") {
//   await sendQuotationEmail(quotation);
// }

// if (sendVia === "whatsapp") {
//   await sendWhatsappMessage(quotation);
// }

// if (sendVia === "dashboard") {
//   await createNotification(quotation);
// }

// if (sendVia === "pdf") {
//   await generatePDF(quotation);
// }

 const baseAmount = pricing?.baseAmount;
const gstPercent = Number(req.body.tax?.gstPercent ?? 0);
const tcsPercent = Number(req.body.tax?.tcsPercent ?? 0);

const gstAmount = Number(req.body.tax?.gstAmount ?? 0);
const tcsAmount = Number(req.body.tax?.tcsAmount ?? 0);
const tourismAmount = Number(req.body.tax?.tourismAmount ?? 0);

    const base = Number(baseAmount || 0);
    console.log("🔥 BASE:", base);
    const ops = Number(opsPercent)
    const opsAmt = Number(opsAmount)
    let finalOpsAmount = 0;
   if (opsAmt > 0) {
  finalOpsAmount = opsAmt;
  } else if (ops > 0) {
  finalOpsAmount = ((base + servicesTotal) * ops) / 100;
  }

  console.log("🔥 OPS FINAL:", {
  opsPercent: ops,
  opsAmount: opsAmt,
  finalOpsAmount
});

    const service = Number(serviceCharge || 0);
    const handling = Number(handlingFee || 0);


    const tourismAmt = Number(tourismAmount);
    const servicesTotal = services.reduce((sum, s) => {return sum + Number(s.total || 0)}, 0);
     const subTotal = Number(base + servicesTotal + finalOpsAmount + service + handling);
     
     let finalGstAmount = gstAmount;
     let finalTcsAmount = tcsAmount;

// GST auto calculate
if (!finalGstAmount && gstPercent > 0) {
  finalGstAmount = (subTotal * gstPercent) / 100;
}

// TCS auto calculate
if (!finalTcsAmount && tcsPercent > 0) {
  finalTcsAmount = (subTotal * tcsPercent) / 100;
}

const taxTotal = Number(finalGstAmount + finalTcsAmount + tourismAmount);
    // const subTotal = base + opsAmt + service + handling;
const totalAmount = Number(subTotal + taxTotal);

  const formattedServices = services.map(s => ({
  serviceId: s.serviceId,
  type: s.type,
  title: s.title,

  city: s.city,
  country: s.country,
  description: s.description,

  roomCategory: s.roomCategory,
  bedType: s.bedType,
  adults: s.adults,
  children: s.children,
  infants: s.infants,

  // HOTEL
  nights: s.nights || 1,
  adults: s.adults || 0,
  children: s.children || 0,
  infants: s.infants || 0,
  rooms: s.rooms || 1,
  bedType: s.bedType,

  // TRANSFER
  vehicleType: s.vehicleType,
  passengerCapacity: s.passengerCapacity,
  luggageCapacity: s.luggageCapacity,
  days: s.days || 1,

  // ACTIVITY
  pax: s.pax || 1,

  // PRICE
  price: s.price || 0,
  total: s.total || 0,
  usageType: normalizeUsageType(s.usageType)
}));

console.log("🔥 DEBUG:", {
  subTotal,
  gstPercent,
  finalGstAmount,
  tcsPercent,
  finalTcsAmount
});

  const quotation = await Quotation.create({
  quotationNumber,
  queryId: query._id,
  agent: query.agent,
  createdBy: req.user.id,

  inclusions,

  services: formattedServices,   // ✅ ADD THIS

  pricing: {
    baseAmount: base,
    subTotal: servicesTotal,
    opsMarkup:{
    percent: ops,
    amount:finalOpsAmount,
    },
    opsCharges: {
      serviceCharge: service,
      handlingFee: handling
    },
   tax: {
  gst: {
    percent: gstPercent,
    amount: finalGstAmount
  },
  tcs: {
    percent: tcsPercent,
    amount: finalTcsAmount
  },
  tourismFee: {
    amount: tourismAmount
  },
  totalTax: taxTotal
},
totalAmount: totalAmount
},

  validTill,
  status: "Quote Sent"
});

const quoteDetails = {
  name: query.agent?.name,
  agentName: query.agent?.name,
  destination: query.destination,
  days: query.totalDays || 5,
  price: totalAmount,
  totalAmount: totalAmount,
  validTill: new Date(validTill).toDateString(),
  phone: query.agent?.phone,
};

if (isNaN(totalAmount)) {
  return next(new ApiError(400, "Total amount calculation failed"));
}
// 🔥 SEND EMAIL / WHATSAPP BASED ON USER SELECTION
const sendViaArray = Array.isArray(sendVia) ? sendVia : [sendVia];

if (sendViaArray.includes("email")) {
  await sendEmailQuote(query.agent.email, quoteDetails);
}

if (sendViaArray.includes("whatsapp")) {
  await sendWhatsAppMessage(quoteDetails);
}

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



