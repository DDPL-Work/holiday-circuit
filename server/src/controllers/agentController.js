
import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravalQuery.model.js";
import Counter from "../models/counter.model.js";
import Quotation from "../models/quotation.model.js";
import Invoice from "../models/invoice.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


// ========================== Register Agent ==========================

export const registerAgent = async (req, res, next) => {
  try {
    const { name, email, password, companyName,  gstNumber, phone  } = req.body;

    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "Email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, "Documents are required"));
}
const documents = req.files.map(file => file.path);

    const agent = await Auth.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
      companyName,
      gstNumber,
      documents,
      phone,
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: "Registered successfully. Waiting for admin approval.",  agent
    });

  } catch (error) {
    next(error);
  }
};


// ========================== Login Agent ==========================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await Auth.findOne({ email });

    if (!user) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    // Only agents need approval
    if (user.role === "agent" && !user.isApproved) {
      return next(new ApiError(403, "Your profile is under review. You will get access within 24–48 hours."));
    }

    const token = jwt.sign(
      { id: user._id,role: user.role ,name: user.name,email: user.email },process.env.JWT_SECRET,
      { expiresIn: "5d"}
    );

    res.status(200).json({
      message: "Login successfully",
      success: true,
      token,
      role: user.role,
      user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
  },
    });

  } catch (error) {
    next(error);
  }
};


/* ========================= AGENT DASHBOARD DATA ========================= */

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.user._id;

    const totalQueries = await TravelQuery.countDocuments({ agent: agentId });

    const statusCounts = await TravelQuery.aggregate([
      { $match: { agent: agentId } },
      { $group: { _id: "$agentStatus", count: { $sum: 1 } } }
    ]);

    const invoices = await Invoice.find({ agent: agentId });

    res.json({
      totalQueries,
      statusCounts,
      invoices
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ========================= CREATE TRAVEL QUERY ========================= */

export const createQuery = async (req, res, next) => {
  try {

    const createLog = (action, performedBy) => ({action, performedBy, timestamp: new Date()})
    
    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return next(new ApiError(401, "Unauthorized. Agent not found"));
    }

    const {
      destination,
      startDate,
      endDate,
      numberOfAdults,
      numberOfChildren,
      customerBudget,
      transportRequired,
      sightseeingRequired,
      specialRequirements,
    } = req.body;

    // ✅ Basic validation
    if (!destination || !startDate || !endDate || !numberOfAdults) {
      return next(new ApiError(400, "Required fields are missing"));
    }

    /* ================= QUERY NUMBER ================= */

    let queryCounter = await Counter.findOne({ name: "query" });

    if (!queryCounter) {
      queryCounter = await Counter.create({
        name: "query",
        seq: 1000
      });
    }

    queryCounter.seq += 1;
    await queryCounter.save();

    const queryId = `QRY-${queryCounter.seq}`;


    /* ================= OPS ROUND ROBIN ================= */

    //========================= 1️⃣ get all active ops users ================================
    const opsUsers = await Auth.find({ role: "operations", isApproved: true }).sort({ createdAt: 1 });

    if (!opsUsers.length) {
      return next(new ApiError(400, "No operations user available"));
    }

    //===================== 2️⃣ ops counter ==========================
    let opsCounter = await Counter.findOne({ name: "ops_assign" });

    if (!opsCounter) {
      opsCounter = await Counter.create({
        name: "ops_assign",
        seq: 0
      });
    }

    //======================== 3️⃣round robin logic ========================================
    const opsIndex = opsCounter.seq % opsUsers.length;
    const assignedOps = opsUsers[opsIndex];

    opsCounter.seq += 1;
    await opsCounter.save();

    /* ================= CREATE QUERY ================= */

    const query = await TravelQuery.create({
      agent: req.user.id,
      assignedTo: assignedOps._id,   // KEY LINE
      queryId,
      destination,
      startDate,
      endDate,
      numberOfAdults,
      numberOfChildren,
      customerBudget,
      hotelCategory: "4 Star",
      transportRequired,
      sightseeingRequired,
      specialRequirements,
       //  IMPORTANT
       agentStatus: "Pending",
       opsStatus: "New_Query",

  // ✅ ACTIVITY LOG
    activityLog: [
    createLog("Query Received", "System"),
  ]
    });

    return res.status(201).json({
      success: true,
      message: "Query created and assigned successfully",
      query
    });

  } catch (error) {
    next(error);
  }
};


/* ========================= VIEW OWN QUERIES ========================= */

export const getMyQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const queries = await TravelQuery.find({ agent: req.user.id }).sort({ createdAt: -1 });

    return res.json({ message: "All queries fetched successfully", queries });

  } catch (error) {
    next(error);
  }
};

/* ========================= VIEW QUOTATION ========================= */
// Get quotations for a specific TravelQuery
export const getQuotationsByQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;

    if (!queryId) {
      return next(new ApiError(400, "Query ID is required"));
    }

    // Check if the TravelQuery exists
    const query = await TravelQuery.findById(queryId);
    if (!query) {
      return next(new ApiError(404, "Travel query not found"));
    }

    // Role-based access
    const userRole = req.user.role; // middleware se set
    const userId = req.user.id;

    if (userRole === "agent" && query.agent.toString() !== userId) {
      return next(new ApiError(403, "Forbidden: You cannot access this quotation"));
    }

    // Fetch quotations for this query
    const quotations = await Quotation.find({ queryId: query._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      quotations
    });

  } catch (error) {
    next(error);
  }
};

//================ Accept Quotation by Agent ======================

export const acceptQuotationByAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, markupType, markupValue } = req.body;

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    /* STEP 1: ACCEPT QUOTE */
    if (action === "ACCEPT") {
      if (quotation.status !== "Quote Sent") {
        return next(new ApiError(400, "Quote cannot be accepted"));
      }

      quotation.status = "Quote Accepted";
      await quotation.save();

      return res.json({ success: true, quotation });
    }

    /* STEP 2: APPLY MARKUP */
    if (action === "APPLY_MARKUP") {
      if (quotation.status !== "Quote Accepted") {
        return next(new ApiError(400, "Accept quote first"));
      }

      if (!markupType || markupValue <= 0) {
        return next(new ApiError(400, "Invalid markup"));
      }

      const opsTotal = quotation.pricing.totalAmount;

      const markupAmount =
  markupType === "PERCENT"
    ? Math.round((opsTotal * markupValue) / 100)
    : Math.round(markupValue);

quotation.agentMarkup = {
  type: markupType,
  value: markupValue,
  markupAmount
};

quotation.clientTotalAmount = Math.round(opsTotal + markupAmount);
      quotation.status = "Markup Applied";

      await quotation.save();

      return res.json({ success: true, quotation });
    }

    /* STEP 3: SEND TO CLIENT */
    if (action === "SEND_TO_CLIENT") {
      if (quotation.status !== "Markup Applied") {
        return next(new ApiError(400, "Apply markup first"));
      }

      quotation.status = "Sent to Client";
      await quotation.save();

      return res.json({ success: true, quotation });
    }

    return next(new ApiError(400, "Invalid action"));
  } catch (error) {
    next(error);
  }
};



/* ========================= REQUEST QUOTATION REVISION ========================= */

export const requestQuotationRevision = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { status: "Revised" },
      { new: true }
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json({ message: "Revision requested successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================= CONFIRM QUOTATION ========================= */

export const confirmQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { status: "Confirmed" },
      { new: true }
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json({ message: "Quotation confirmed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================= VIEW INVOICES ========================= */

export const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      agent: req.user._id
    }).populate("query");

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================= UPDATE PAYMENT STATUS (OFFLINE) ========================= */

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, remarks } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      {
        paymentStatus,
        remarks,
        paymentUpdatedBy: req.user._id
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Payment status updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
