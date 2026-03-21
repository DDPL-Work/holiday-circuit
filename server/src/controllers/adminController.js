import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravalQuery.model.js";
import RateContract from "../models/rateContract.model.js"
import Invoice from "../models/invoice.model.js"
import { sendAgentApprovalMail } from "../services/sendEmail.js";
import bcrypt from "bcrypt"




// =============================== Get Pending Agents ===============================

export const getPendingAgents = async (req, res, next) => {
  try {
    const agents = await Auth.find({
      role: "agent",
      isApproved: false
    }).select("-password");

    res.status(200).json({
      success: true,
      agents
    });
  } catch (error) {
    next(error);
  }
};

// ====================== Approve Agent Controller ================================

export const approveAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.body?.status; 

    const agent = await Auth.findById(id);

    if (!agent || agent.role !== "agent") {
      return next(new ApiError(404, "Agent not found"));
    }

    if (status === "rejected") {
      await agent.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Agent rejected and removed",
      });
    }

    // default approve
    agent.isApproved = true;
    await agent.save();
    await sendAgentApprovalMail(agent.email);
    console.log("Mail going to:", agent.email);

    res.status(200).json({
      success: true,
      message: "Agent approved and email sent",
    });
  } catch (error) {
    next(error);
  }
};


// =============================== Change User Role ===============================
// export const changeUserRole = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const { role } = req.body; // admin | agent | operations

//     const user = await Auth.findById(userId);

//     if (!user) {
//       return next(new ApiError(404, "User not found"));
//     }

//     user.role = role;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "User role updated"
//     });

//   } catch (error) {
//     next(error);
//   }
// };


// =============================== CREATE OPERATIONS USER ===============================

export const createOperationsUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new ApiError(400, "All fields are required"));
    }

    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "User already exists"));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const operationsUser = await Auth.create({
  name,
  email,
  password: hashedPassword,   // IMPORTANT
  role: "operations",
  isApproved: true
});

    res.status(201).json({
      success: true,
      message: "Operations user created successfully",
      user: {
        id: operationsUser._id,
        name: operationsUser.name,
        email: operationsUser.email,
        role: operationsUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};


//================ Admin Create Dmc Partner ==========================================

export const createDmcPartner = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password || !companyName) {
      return next(new ApiError(400, "All fields are required"));
    }

    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      return next(new ApiError(400, "User already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const dmcPartner = await Auth.create({
      name,
      email,
      password: hashedPassword,
      companyName,
      role: "dmc_partner",
      isApproved: true
    });

    res.status(201).json({
      success: true,
      message: "DMC Partner created successfully",
      partner: {
        id: dmcPartner._id,
        name: dmcPartner.name,
        email: dmcPartner.email,
        companyName: dmcPartner.companyName,
        role: dmcPartner.role
      }
    });

  } catch (error) {
    next(error);
  }
};

//================ Admin Create Finance Partner ==========================================

export const createFinancePartner = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    // validation
    if (!name || !email || !password || !companyName) {
      return next(new ApiError(400, "All fields are required"));
    }

    // check existing user
    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      return next(new ApiError(400, "User already exists"));
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create finance partner
    const financePartner = await Auth.create({
      name,
      email,
      password: hashedPassword,
      companyName,
      role: "finance_partner",
      isApproved: true
    });

    res.status(201).json({
      success: true,
      message: "Finance Partner created successfully",
      partner: {
        id: financePartner._id,
        name: financePartner.name,
        email: financePartner.email,
        companyName: financePartner.companyName,
        role: financePartner.role
      }
    });

  } catch (error) {
    next(error);
  }
};

// =============================== Get All Users (System-wide) ===============================
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await Auth.find().select("-password");

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};


// =============================== Create / Update Rate Contracts ===============================

export const createRateContract = async (req, res, next) => {
try {
if (!req.user) {
return next(new ApiError(401, "Unauthorized"));
}
const contract = await RateContract.create({
...req.body,
createdBy: req.user.id
});

res.status(201).json({
success: true,
message: "Rate contract created successfully",
contract
});
} catch (error) {
next(error);
}
};

// =============================== Update Rate Contracts ===============================

export const updateRateContract = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const { contractId } = req.params;

    const contract = await RateContract.findById(contractId);

    if (!contract) {
      return next(new ApiError(404, "Rate contract not found"));
    }

    Object.assign(contract, req.body);
    await contract.save();

    res.status(200).json({
      success: true,
      message: "Rate contract updated successfully",
      contract
    });
  } catch (error) {
    next(error);
  }
};


// ===============================  Deactivate Rate Contract ===============================

export const deactivateRateContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await RateContract.findById(id);
    
    if (!contract) {
      return next(new ApiError(404, "Contract not found"));
    }

    contract.isActive = false;
    await contract.save();

    res.status(200).json({
      success: true,
      message: "Contract deactivated Success"
    });
  } catch (error) {
    next(error);
  }
};




// =============================== System Activity Dashboard ===============================

export const getSystemStats = async (req, res, next) => {
  try {
    const totalAgents = await Auth.countDocuments({ role: "agent" });
    const totalQueries = await TravelQuery.countDocuments();
    const totalInvoices = await Invoice.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalAgents,
        totalQueries,
        totalInvoices
      }
    });
  } catch (error) {
    next(error);
  }
};

// =============================== View All Payments (Offline) ===============================

export const getAllPayments = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate("agent", "name companyName")
      .populate("query");

    res.status(200).json({
      success: true,
      invoices
    });
  } catch (error) {
    next(error);
  }
};