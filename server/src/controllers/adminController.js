import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravelQuery.model.js";
import RateContract from "../models/rateContract.model.js"
import Invoice from "../models/invoice.model.js"
import InternalInvoice from "../models/internalInvoice.model.js";
import Notification from "../models/notification.model.js";
import Quotation from "../models/quotation.model.js";
import Voucher from "../models/voucher.model.js";
import Confirmation from "../models/dmcConfirmation.js";
import { sendAccountDeletionMail, sendAgentApprovalMail, sendAgentRejectionMail, sendTeamMemberCredentialsMail } from "../services/sendEmail.js";
import { sendEmailFinalInvoice } from "../services/emailService.js";
import {
  decorateFinanceAssignment,
  filterRowsByFinanceAccess,
  getFinanceAccessContext,
  normalizeEntityId,
  resolveFinanceAssigneeId,
} from "../services/financeTeamScopeService.js";
import bcrypt from "bcrypt"

const addQueryLogIfMissing = (query, action, performedBy) => {
  if (!query) return;

  const exists = (query.activityLog || []).some((entry) => entry.action === action);

  if (!exists) {
    query.activityLog.push({
      action,
      performedBy,
      timestamp: new Date(),
    });
  }
};

const MANAGED_USER_ROLES = [
  "admin",
  "operations",
  "finance_partner",
  "dmc_partner",
  "operation_manager",
  "finance_manager",
];

const FRONTEND_ROLE_TO_BACKEND = {
  "Super Admin": "admin",
  "Ops Team": "operations",
  "Finance Team": "finance_partner",
  "DMC Partner": "dmc_partner",
  "Operation Manager": "operation_manager",
  "Finance Manager": "finance_manager",
};

const BACKEND_ROLE_TO_FRONTEND = {
  admin: "Super Admin",
  operations: "Ops Team",
  finance_partner: "Finance Team",
  dmc_partner: "DMC Partner",
  operation_manager: "Operation Manager",
  finance_manager: "Finance Manager",
};

const normalizeManagedRole = (role = "") =>
  FRONTEND_ROLE_TO_BACKEND[role] || (MANAGED_USER_ROLES.includes(role) ? role : "");

const formatManagedUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  companyName: user.companyName || "",
  phone: user.phone || "",
  profileImage: user.profileImage || "",
  employeeId: user.employeeId || "",
  manager: user.manager || "",
  department: user.department || "",
  designation: user.designation || "",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  accountStatus: user.accountStatus || "Active",
  isDeleted: Boolean(user.isDeleted),
  deletedAt: user.deletedAt || null,
  deletedBy: user.deletedBy || "",
  deletionReason: user.deletionReason || "",
  accessExpiry: user.accessExpiry || null,
  lastLoginAt: user.lastLoginAt || null,
  role: user.role,
  roleLabel: BACKEND_ROLE_TO_FRONTEND[user.role] || user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const AGENT_DOCUMENT_LABELS = ["GST Certificate", "Business License"];

const formatAgentApproval = (agent) => ({
  id: agent._id,
  name: agent.name || "",
  email: agent.email || "",
  companyName: agent.companyName || "",
  gstNumber: agent.gstNumber || "",
  phone: agent.phone || "",
  status: agent.status || (agent.isApproved ? "approve" : "pending"),
  isApproved: Boolean(agent.isApproved),
  accountStatus: agent.accountStatus || "Inactive",
  reviewedAt: agent.reviewedAt || null,
  reviewedBy: agent.reviewedBy || "",
  rejectionReason: agent.rejectionReason || "",
  submittedAt: agent.createdAt || null,
  updatedAt: agent.updatedAt || null,
  documents: (Array.isArray(agent.documents) ? agent.documents : []).map((url, index) => ({
    id: `${agent._id}-${index}`,
    label: AGENT_DOCUMENT_LABELS[index] || `Document ${index + 1}`,
    url,
  })),
});

const normalizePermissionList = (permissions = []) =>
  [...new Set((Array.isArray(permissions) ? permissions : [])
    .map((permission) => String(permission || "").trim())
    .filter(Boolean))];

const generateTemporaryPassword = () => {
  const random = Math.random().toString(36).slice(2, 8);
  const suffix = `${Math.floor(100 + Math.random() * 900)}`;
  return `HC@${random}${suffix}`;
};

const ensureAdminAccess = (req) => {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Only super admins can manage team members");
  }
};

const isPendingAdminReply = (query = {}) =>
  String(query?.adminCoordination?.status || "").trim() === "pending_admin_reply";

const ensureFinanceApiAccess = async (req) => {
  if (!["finance_partner", "finance_manager", "admin"].includes(req.user?.role)) {
    throw new ApiError(403, "Not authorized");
  }

  return getFinanceAccessContext(req.user);
};


// =============================== Get Pending Agents ===============================

export const getPendingAgents = async (req, res, next) => {
  try {
    const agents = await Auth.find({
      role: "agent",
      isDeleted: { $ne: true },
    })
      .sort({ updatedAt: -1 })
      .select("-password -resetPasswordOtpHash -resetPasswordOtpExpiry -resetPasswordOtpVerifiedAt");

    const rows = agents
      .map(formatAgentApproval)
      .sort((left, right) => {
        const statusOrder = { pending: 0, rejected: 1, approve: 2 };
        const orderDifference = (statusOrder[left.status] ?? 99) - (statusOrder[right.status] ?? 99);
        if (orderDifference !== 0) return orderDifference;
        return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
      });

    res.status(200).json({
      success: true,
      agents: rows,
      summary: {
        pending: rows.filter((agent) => agent.status === "pending").length,
        approved: rows.filter((agent) => agent.status === "approve").length,
        rejected: rows.filter((agent) => agent.status === "rejected").length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================== Approve Agent Controller ================================

export const approveAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedStatus = String(req.body?.status || "approve").trim().toLowerCase();
    const rejectionReason = String(req.body?.reason || req.body?.rejectionReason || "").trim();

    const agent = await Auth.findById(id);

    if (!agent || agent.role !== "agent") {
      return next(new ApiError(404, "Agent not found"));
    }

    const reviewerName = req.user?.name || req.user?.email || "Admin";
    const reviewerId = req.user?.id || req.user?._id || "";
    const shouldReject = requestedStatus === "reject" || requestedStatus === "rejected";

    if (shouldReject) {
      if (!rejectionReason) {
        return next(new ApiError(400, "Rejection reason is required"));
      }

      agent.isApproved = false;
      agent.status = "rejected";
      agent.accountStatus = "Inactive";
      agent.reviewedAt = new Date();
      agent.reviewedBy = reviewerName;
      agent.reviewedById = String(reviewerId || "");
      agent.rejectionReason = rejectionReason;
      await agent.save();
      await sendAgentRejectionMail(agent.email, {
        name: agent.name,
        companyName: agent.companyName,
        reason: rejectionReason,
      });

      return res.status(200).json({
        success: true,
        message: "Agent registration rejected and email sent",
        agent: formatAgentApproval(agent),
      });
    }

    agent.isApproved = true;
    agent.status = "approve";
    agent.accountStatus = "Active";
    agent.reviewedAt = new Date();
    agent.reviewedBy = reviewerName;
    agent.reviewedById = String(reviewerId || "");
    agent.rejectionReason = "";
    await agent.save();
    await sendAgentApprovalMail(agent.email, {
      name: agent.name,
      companyName: agent.companyName,
    });

    res.status(200).json({
      success: true,
      message: "Agent approved and email sent",
      agent: formatAgentApproval(agent),
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
    return next(
      new ApiError(
        400,
        "Finance team members must be created by a finance manager under their team",
      ),
    );
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

export const getManagedUsers = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const users = await Auth.find({
      role: { $in: MANAGED_USER_ROLES },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users: users.map(formatManagedUser),
    });
  } catch (error) {
    next(error);
  }
};

export const createManagedUser = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const {
      fullName,
      name,
      email,
      phone,
      employeeId = "",
      manager = "",
      selectedRole,
      role,
      department,
      designation,
      permissions = [],
      passwordMode = "auto",
      manualPassword = "",
      accountStatus = "Active",
      accessExpiry = "",
      sendWelcome = true,
    } = req.body || {};

    const trimmedName = String(fullName || name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedEmployeeId = String(employeeId || "").trim();
    const normalizedManager = String(manager || "").trim();
    const normalizedDepartment = String(department || "").trim();
    const normalizedDesignation = String(designation || "").trim();
    const normalizedRole = normalizeManagedRole(selectedRole || role);
    const normalizedPermissions = normalizePermissionList(permissions);
    const normalizedPasswordMode = String(passwordMode || "auto").trim().toLowerCase();
    const normalizedAccountStatus = accountStatus === "Inactive" ? "Inactive" : "Active";
    const normalizedAccessExpiry = accessExpiry ? new Date(accessExpiry) : null;

    if (!trimmedName || !normalizedEmail || !normalizedPhone || !normalizedRole || !normalizedDepartment || !normalizedDesignation) {
      return next(new ApiError(400, "Name, email, phone, role, department, and designation are required"));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return next(new ApiError(400, "Please enter a valid email address"));
    }

    if (!["auto", "manual"].includes(normalizedPasswordMode)) {
      return next(new ApiError(400, "Invalid password mode"));
    }

    if (normalizedAccessExpiry && Number.isNaN(normalizedAccessExpiry.getTime())) {
      return next(new ApiError(400, "Access expiry date is invalid"));
    }

    const initialPassword =
      normalizedPasswordMode === "manual"
        ? String(manualPassword || "")
        : generateTemporaryPassword();

    if (String(initialPassword).length < 8) {
      return next(new ApiError(400, "Password must be at least 8 characters"));
    }

    const existingUser = await Auth.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new ApiError(400, "A user with this email already exists"));
    }

    if (normalizedEmployeeId) {
      const existingEmployee = await Auth.findOne({ employeeId: normalizedEmployeeId });
      if (existingEmployee) {
        return next(new ApiError(400, "Employee ID already exists"));
      }
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const createdUser = await Auth.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      employeeId: normalizedEmployeeId || undefined,
      manager: normalizedManager,
      role: normalizedRole,
      department: normalizedDepartment,
      designation: normalizedDesignation,
      permissions: normalizedPermissions,
      accountStatus: normalizedAccountStatus,
      accessExpiry: normalizedAccessExpiry,
      isApproved: true,
    });

    let credentialsEmailSent = false;

    if (sendWelcome) {
      await sendTeamMemberCredentialsMail(normalizedEmail, {
        name: trimmedName,
        role: BACKEND_ROLE_TO_FRONTEND[normalizedRole] || normalizedRole,
        loginEmail: normalizedEmail,
        password: initialPassword,
      });
      credentialsEmailSent = true;
    }

    res.status(201).json({
      success: true,
      message: credentialsEmailSent
        ? "User created successfully and login credentials were emailed"
        : "User created successfully",
      user: formatManagedUser(createdUser),
      credentialsEmailSent,
      temporaryPassword: credentialsEmailSent ? "" : initialPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const updateManagedUser = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { id } = req.params;
    const {
      fullName,
      name,
      email,
      phone,
      employeeId = "",
      manager = "",
      selectedRole,
      role,
      department,
      designation,
      permissions = [],
      accountStatus = "Active",
      accessExpiry = "",
    } = req.body || {};

    const trimmedName = String(fullName || name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedEmployeeId = String(employeeId || "").trim();
    const normalizedManager = String(manager || "").trim();
    const normalizedDepartment = String(department || "").trim();
    const normalizedDesignation = String(designation || "").trim();
    const normalizedRole = normalizeManagedRole(selectedRole || role);
    const normalizedPermissions = normalizePermissionList(permissions);
    const normalizedAccountStatus = accountStatus === "Inactive" ? "Inactive" : "Active";
    const normalizedAccessExpiry = accessExpiry ? new Date(accessExpiry) : null;

    if (!trimmedName || !normalizedEmail || !normalizedPhone || !normalizedRole || !normalizedDepartment || !normalizedDesignation) {
      return next(new ApiError(400, "Name, email, phone, role, department, and designation are required"));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return next(new ApiError(400, "Please enter a valid email address"));
    }

    if (normalizedAccessExpiry && Number.isNaN(normalizedAccessExpiry.getTime())) {
      return next(new ApiError(400, "Access expiry date is invalid"));
    }

    const user = await Auth.findOne({
      _id: id,
      role: { $in: MANAGED_USER_ROLES },
    });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    if (user.isDeleted) {
      return next(new ApiError(400, "Deleted users cannot be edited"));
    }

    const existingUser = await Auth.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });
    if (existingUser) {
      return next(new ApiError(400, "A user with this email already exists"));
    }

    if (normalizedEmployeeId) {
      const existingEmployee = await Auth.findOne({
        employeeId: normalizedEmployeeId,
        _id: { $ne: id },
      });
      if (existingEmployee) {
        return next(new ApiError(400, "Employee ID already exists"));
      }
    }

    if (String(req.user?.id) === String(user._id) && normalizedAccountStatus === "Inactive") {
      return next(new ApiError(400, "You cannot deactivate your own account"));
    }

    user.name = trimmedName;
    user.email = normalizedEmail;
    user.phone = normalizedPhone;
    user.employeeId = normalizedEmployeeId || undefined;
    user.manager = normalizedManager;
    user.role = normalizedRole;
    user.department = normalizedDepartment;
    user.designation = normalizedDesignation;
    user.permissions = normalizedPermissions;
    user.accountStatus = normalizedAccountStatus;
    user.accessExpiry = normalizedAccessExpiry;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: formatManagedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateManagedUserStatus = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { id } = req.params;
    const nextStatus = req.body?.accountStatus === "Inactive" ? "Inactive" : "Active";

    const user = await Auth.findOne({
      _id: id,
      role: { $in: MANAGED_USER_ROLES },
    });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    if (user.isDeleted) {
      return next(new ApiError(400, "Deleted users cannot be updated"));
    }

    if (String(req.user?.id) === String(user._id) && nextStatus === "Inactive") {
      return next(new ApiError(400, "You cannot deactivate your own account"));
    }

    user.accountStatus = nextStatus;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User marked as ${nextStatus.toLowerCase()}`,
      user: formatManagedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteManagedUser = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { id } = req.params;
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return next(new ApiError(400, "Deletion reason is required"));
    }

    const user = await Auth.findOne({
      _id: id,
      role: { $in: MANAGED_USER_ROLES },
    });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    if (String(req.user?.id) === String(user._id)) {
      return next(new ApiError(400, "You cannot delete your own account"));
    }

    if (user.isDeleted) {
      return next(new ApiError(400, "User is already deleted"));
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = String(req.user?.id || "");
    user.deletionReason = reason;
    user.accountStatus = "Inactive";
    await user.save();

    // Notify via email (notifications cannot be seen after deletion).
    // If email fails, we still keep deletion successful.
    try {
      await sendAccountDeletionMail(user.email, {
        name: user.name || "Team Member",
        role: BACKEND_ROLE_TO_FRONTEND[user.role] || user.role,
        reason,
      });
    } catch (mailError) {
      console.error("Account deletion email failed:", mailError);
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user: formatManagedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const restoreManagedUser = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { id } = req.params;

    const user = await Auth.findOne({
      _id: id,
      role: { $in: MANAGED_USER_ROLES },
    });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    if (!user.isDeleted) {
      return next(new ApiError(400, "User is not deleted"));
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = "";
    user.deletionReason = "";
    user.accountStatus = "Active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User restored successfully",
      user: formatManagedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const permanentlyDeleteManagedUser = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { id } = req.params;

    const user = await Auth.findOne({
      _id: id,
      role: { $in: MANAGED_USER_ROLES },
    });

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    if (String(req.user?.id) === String(user._id)) {
      return next(new ApiError(400, "You cannot permanently delete your own account"));
    }

    if (!user.isDeleted) {
      return next(new ApiError(400, "Please soft delete the user first"));
    }

    await Auth.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      message: "User permanently deleted successfully",
      userId: String(user._id),
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

export const replyToOpsEscalation = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { id } = req.params;
    const reply = String(req.body?.reply || req.body?.message || "").trim();

    if (!reply) {
      return next(new ApiError(400, "Reply message is required"));
    }

    const query = await TravelQuery.findById(id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!isPendingAdminReply(query)) {
      return next(new ApiError(400, "This query is not awaiting admin reply"));
    }

    const actorName = req.user?.name || req.user?.email || "Admin";
    const repliedAt = new Date();
    const currentAdminCoordination =
      query.adminCoordination?.toObject?.() || query.adminCoordination || {};
    const existingThread = Array.isArray(currentAdminCoordination.thread)
      ? currentAdminCoordination.thread
      : [];

    query.activityLog = Array.isArray(query.activityLog) ? query.activityLog : [];
    query.activityLog.push({
      action: "Admin Replied",
      performedBy: actorName,
      timestamp: repliedAt,
    });

    query.adminCoordination = {
      ...currentAdminCoordination,
      status: "replied",
      lastAdminReply: reply,
      lastAdminReplyAt: repliedAt,
      lastAdminReplyBy: req.user?.id || null,
      lastAdminReplyByName: actorName,
      thread: [
        ...existingThread,
        {
          senderRole: "admin",
          senderId: req.user?.id || null,
          senderName: actorName,
          message: reply,
          createdAt: repliedAt,
        },
      ],
    };

    await query.save();

    const opsRecipientId =
      query.adminCoordination?.lastOpsMessageBy ||
      query.assignedTo ||
      null;

    if (opsRecipientId) {
      await Notification.create({
        user: opsRecipientId,
        type: "info",
        title: "Admin replied to escalation",
        message: `${actorName} replied on ${query.queryId}.`,
        link: "/ops/order-acceptance",
        meta: {
          queryId: query._id,
          queryNumber: query.queryId,
          reply,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reply sent to ops successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardData = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      return next(new ApiError(403, "Not authorized"));
    }

    const now = new Date();
    const today = startOfDay(now);
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - 6);
    const previousWeekEnd = new Date(currentWeekStart.getTime() - 1);
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekEnd.getDate() - 6);
    previousWeekStart.setHours(0, 0, 0, 0);

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentMonthStart.getTime() - 1);
    const monthBuckets = getMonthlyBuckets(6);

    const [queries, agents, managedUsers, vouchers, invoices, internalInvoices, confirmations] = await Promise.all([
      TravelQuery.find()
        .populate("agent", "name companyName email")
        .populate("assignedTo", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      Auth.find({ role: "agent" }).select("name companyName").lean(),
      Auth.find({ role: { $in: MANAGED_USER_ROLES } })
        .select("name role accountStatus createdAt updatedAt")
        .lean(),
      Voucher.find()
        .populate("agent", "name companyName")
        .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren")
        .sort({ generatedAt: -1, createdAt: -1 })
        .lean(),
      Invoice.find()
        .populate("agent", "name companyName")
        .populate("query", "queryId destination")
        .lean(),
      InternalInvoice.find().lean(),
      Confirmation.find()
        .populate("dmcId", "name companyName")
        .lean(),
    ]);

    const confirmationLookup = new Map();
    confirmations.forEach((confirmation) => {
      const key = String(confirmation.queryId || "").trim();
      if (key && !confirmationLookup.has(key)) {
        confirmationLookup.set(key, confirmation);
      }
    });

    const pendingQueryStatuses = new Set(["New_Query", "Pending_Accept", "Revision_Query"]);
    const activeBookingStatuses = new Set(["Booking_Accepted", "Invoice_Requested", "Confirmed", "Vouchered"]);

    const pendingQueries = queries.filter((query) => pendingQueryStatuses.has(query.opsStatus));
    const activeBookings = queries.filter((query) => activeBookingStatuses.has(query.opsStatus));
    const escalationQueries = queries.filter((query) => isPendingAdminReply(query));
    const pendingActionQueryCount = new Set(
      [...pendingQueries, ...escalationQueries].map((query) => String(query._id || "")),
    ).size;
    const generatedVouchers = vouchers.filter((voucher) =>
      ["generated", "sent"].includes(String(voucher.status || "").toLowerCase()),
    );
    const pendingActionsCount =
      pendingActionQueryCount +
      internalInvoices.filter((invoice) => ["Submitted", "In Review"].includes(invoice.status)).length +
      invoices.filter((invoice) => invoice.paymentVerification?.status === "Pending").length;

    const currentPendingQueries = pendingQueries.filter((query) =>
      isWithinRange(query.createdAt || query.updatedAt, currentWeekStart, now),
    ).length;
    const previousPendingQueries = pendingQueries.filter((query) =>
      isWithinRange(query.createdAt || query.updatedAt, previousWeekStart, previousWeekEnd),
    ).length;

    const currentActiveBookings = activeBookings.filter((query) =>
      isWithinRange(query.updatedAt || query.createdAt, currentWeekStart, now),
    ).length;
    const previousActiveBookings = activeBookings.filter((query) =>
      isWithinRange(query.updatedAt || query.createdAt, previousWeekStart, previousWeekEnd),
    ).length;

    const currentVouchers = generatedVouchers.filter((voucher) =>
      isWithinRange(voucher.generatedAt || voucher.createdAt, currentWeekStart, now),
    ).length;
    const previousVouchers = generatedVouchers.filter((voucher) =>
      isWithinRange(voucher.generatedAt || voucher.createdAt, previousWeekStart, previousWeekEnd),
    ).length;

    const currentPendingActions = pendingActionsCount;
    const previousPendingActions =
      pendingQueries.filter((query) => isWithinRange(query.updatedAt || query.createdAt, previousWeekStart, previousWeekEnd)).length +
      escalationQueries.filter((query) => isWithinRange(query.adminCoordination?.lastOpsMessageAt || query.updatedAt || query.createdAt, previousWeekStart, previousWeekEnd)).length +
      internalInvoices.filter((invoice) => isWithinRange(invoice.updatedAt || invoice.createdAt, previousWeekStart, previousWeekEnd)).filter((invoice) => ["Submitted", "In Review"].includes(invoice.status)).length +
      invoices.filter((invoice) => isWithinRange(invoice.updatedAt || invoice.createdAt, previousWeekStart, previousWeekEnd)).filter((invoice) => invoice.paymentVerification?.status === "Pending").length;

    const totalQueries = queries.length;
    const processedQueries = queries.filter(
      (query) =>
        !["New_Query", "Pending_Accept"].includes(query.opsStatus) ||
        ["In Progress", "Quote Sent", "Client Approved", "Confirmed"].includes(query.agentStatus),
    ).length;
    const queriesHandledPercent = totalQueries
      ? Math.round((processedQueries / totalQueries) * 100)
      : 0;

    const respondedQueries = queries.filter(
      (query) => !["New_Query", "Pending_Accept"].includes(query.opsStatus),
    );
    const avgResponseHours = respondedQueries.length
      ? respondedQueries.reduce((sum, query) => {
          const createdAt = new Date(query.createdAt);
          const updatedAt = new Date(query.updatedAt || query.createdAt);
          return sum + Math.max(0, (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        }, 0) / respondedQueries.length
      : 0;

    const lastThirtyDaysStart = new Date(today);
    lastThirtyDaysStart.setDate(today.getDate() - 29);
    const vouchersLastThirtyDays = generatedVouchers.filter((voucher) =>
      isWithinRange(voucher.generatedAt || voucher.createdAt, lastThirtyDaysStart, now),
    );
    const vouchersPerDay = vouchersLastThirtyDays.length
      ? Number((vouchersLastThirtyDays.length / 30).toFixed(1))
      : 0;

    const totalRevenueThisMonth = invoices
      .filter((invoice) => isWithinRange(invoice.createdAt, currentMonthStart, now))
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0), 0);

    const totalRevenuePreviousMonth = invoices
      .filter((invoice) => isWithinRange(invoice.createdAt, previousMonthStart, previousMonthEnd))
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0), 0);

    const activeManagedUsers = managedUsers.filter((user) => user.accountStatus !== "Inactive");
    const currentManagedUsers = managedUsers.filter((user) => isWithinRange(user.createdAt, currentMonthStart, now)).length;
    const previousManagedUsers = managedUsers.filter((user) => isWithinRange(user.createdAt, previousMonthStart, previousMonthEnd)).length;

    const reviewedInvoices = invoices.filter((invoice) => invoice.paymentVerification?.reviewedAt);
    const financeReviewHours = reviewedInvoices.length
      ? reviewedInvoices.reduce((sum, invoice) => {
          const createdAt = new Date(invoice.createdAt);
          const reviewedAt = new Date(invoice.paymentVerification?.reviewedAt || invoice.createdAt);
          return sum + Math.max(0, (reviewedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        }, 0) / reviewedInvoices.length
      : 0;

    const submittedConfirmations = confirmations.filter((confirmation) => confirmation.status === "submitted");
    const dmcFulfillmentHours = submittedConfirmations.length
      ? submittedConfirmations.reduce((sum, confirmation) => {
          const createdAt = new Date(confirmation.createdAt);
          const submittedAt = new Date(confirmation.updatedAt || confirmation.createdAt);
          return sum + Math.max(0, (submittedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        }, 0) / submittedConfirmations.length
      : 0;

    const adminCoordinationHours = Number(
      (
        [avgResponseHours, financeReviewHours, dmcFulfillmentHours]
          .filter((value) => Number.isFinite(value) && value > 0)
          .reduce((sum, value, _index, values) => sum + value / values.length, 0) || 0
      ).toFixed(1),
    );

    const invoiceByQueryId = invoices.reduce((acc, invoice) => {
      const key = String(invoice.query?._id || invoice.query || "").trim();
      if (!key) return acc;

      const existing = acc[key];
      const existingTime = existing ? new Date(existing.createdAt || 0).getTime() : 0;
      const currentTime = new Date(invoice.createdAt || 0).getTime();

      if (!existing || currentTime >= existingTime) {
        acc[key] = invoice;
      }

      return acc;
    }, {});

    const topAgentRevenue = Object.values(
      invoices.reduce((acc, invoice) => {
        const key = String(invoice.agent?._id || invoice.agent || "unknown");
        const label = invoice.agent?.companyName || invoice.agent?.name || "Unknown Agent";

        if (!acc[key]) {
          acc[key] = { name: label, revenue: 0 };
        }

        acc[key].revenue += Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0);
        return acc;
      }, {}),
    )
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5);

    const masterBookingRows = activeBookings.slice(0, 8).map((query) => {
      const latestInvoice = invoiceByQueryId[String(query._id || "").trim()];
      const confirmation =
        confirmationLookup.get(String(query.queryId || "").trim()) ||
        confirmationLookup.get(String(query._id || "").trim()) ||
        null;

      const paymentStatus =
        latestInvoice?.paymentVerification?.status ||
        latestInvoice?.paymentStatus ||
        "Pending";

      return {
        id: query.queryId || "-",
        agent: query.agent?.companyName || query.agent?.name || "Unknown Agent",
        amount: Number(latestInvoice?.totalAmount || latestInvoice?.pricingSnapshot?.grandTotal || 0),
        paymentStatus,
        dmc:
          confirmation?.dmcId?.companyName ||
          confirmation?.dmcId?.name ||
          "-",
      };
    });

    const recentQueries = pendingQueries.slice(0, 6).map((query) => ({
      id: query._id,
      initials: getInitials(query.agent?.companyName || query.agent?.name || "Agent"),
      name: query.agent?.companyName || query.agent?.name || "Unknown Agent",
      destination: `${query.destination || "-"} · ${daysBetween(query.startDate, query.endDate) - 1} nights`,
      time: formatRelativeTime(query.createdAt || query.updatedAt),
      status: "New",
      statusClass: "bg-blue-100 text-blue-700",
      bg: "bg-blue-100",
      color: "text-blue-700",
      queryId: query.queryId,
    }));

    const queryDashboardPool = Array.from(
      new Map(
        [...escalationQueries, ...pendingQueries].map((query) => [String(query._id || ""), query]),
      ).values(),
    );

    const recentQueryRows = queryDashboardPool
      .sort(
        (left, right) =>
          new Date(right.adminCoordination?.lastOpsMessageAt || right.updatedAt || right.createdAt) -
          new Date(left.adminCoordination?.lastOpsMessageAt || left.updatedAt || left.createdAt),
      )
      .slice(0, 12)
      .map((query) => {
        const hasPendingEscalation = isPendingAdminReply(query);

        return {
          id: query._id,
          initials: getInitials(query.agent?.companyName || query.agent?.name || "Agent"),
          name: query.agent?.companyName || query.agent?.name || "Unknown Agent",
          destination: `${query.destination || "-"} · ${daysBetween(query.startDate, query.endDate) - 1} nights`,
          time: formatRelativeTime(
            query.adminCoordination?.lastOpsMessageAt ||
            query.createdAt ||
            query.updatedAt,
          ),
          status: hasPendingEscalation ? "Admin Reply Pending" : "New",
          statusClass: hasPendingEscalation
            ? "bg-orange-100 text-orange-700"
            : "bg-blue-100 text-blue-700",
          bg: hasPendingEscalation ? "bg-orange-100" : "bg-blue-100",
          color: hasPendingEscalation ? "text-orange-700" : "text-blue-700",
          queryId: query.queryId,
          adminCoordinationStatus: String(query.adminCoordination?.status || "idle"),
          opsEscalationNote: String(query.adminCoordination?.lastOpsMessage || "").trim(),
          opsEscalationBy: String(query.adminCoordination?.lastOpsMessageByName || "").trim(),
          opsEscalationAt: query.adminCoordination?.lastOpsMessageAt || null,
          opsStatusLabel: getOpsStageLabel(query.opsStatus),
          builderState: {
            _id: query?._id || null,
            queryId: query?.queryId || "",
            destination: query?.destination || "",
            customerBudget: Number(query?.customerBudget || 0),
            startDate: query?.startDate || null,
            endDate: query?.endDate || null,
            numberOfAdults: Number(query?.numberOfAdults || 0),
            numberOfChildren: Number(query?.numberOfChildren || 0),
            hotelCategory: query?.hotelCategory || "",
            transportRequired: Boolean(query?.transportRequired),
            sightseeingRequired: Boolean(query?.sightseeingRequired),
            specialRequirements: query?.specialRequirements || "",
            opsStatus: query?.opsStatus || "",
            agentStatus: query?.agentStatus || "",
            quotationStatus: query?.quotationStatus || "",
            reassignmentHistory: Array.isArray(query?.reassignmentHistory) ? query.reassignmentHistory : [],
            agent: query?.agent
              ? {
                  _id: query.agent._id || null,
                  id: query.agent._id || null,
                  name: query.agent.name || "",
                  companyName: query.agent.companyName || "",
                  email: query.agent.email || "",
                }
              : null,
            assignedTo: query?.assignedTo
              ? {
                  _id: query.assignedTo._id || null,
                  id: query.assignedTo._id || null,
                  name: query.assignedTo.name || "",
                  email: query.assignedTo.email || "",
                }
              : null,
          },
        };
      });

    const bookingRows = activeBookings.slice(0, 8).map((query) => ({
      id: query._id,
      agency: query.agent?.companyName || query.agent?.name || "Unknown Agent",
      destination: query.destination || "-",
      status: query.opsStatus,
      statusClass:
        query.opsStatus === "Vouchered"
          ? "bg-amber-100 text-amber-700"
          : query.opsStatus === "Confirmed"
            ? "bg-teal-100 text-teal-700"
            : "bg-green-100 text-green-700",
      date: formatDashboardDate(query.startDate),
      pax: Number(query.numberOfAdults || 0) + Number(query.numberOfChildren || 0),
      queryId: query.queryId,
    }));

    const voucherRows = vouchers.slice(0, 8).map((voucher) => ({
      id: voucher._id,
      num: voucher.voucherNumber || "-",
      agency: voucher.agent?.companyName || voucher.agent?.name || "Unknown Agent",
      destination: voucher.destination || voucher.query?.destination || "-",
      date: formatRelativeTime(voucher.generatedAt || voucher.createdAt),
      status: voucher.status === "sent" ? "Sent" : voucher.status === "generated" ? "Generated" : "Ready",
      statusClass:
        voucher.status === "sent"
          ? "bg-green-100 text-green-700"
          : voucher.status === "generated"
            ? "bg-teal-100 text-teal-700"
            : "bg-amber-100 text-amber-700",
    }));

    const queryFlowRows = queries
      .slice()
      .sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt) -
          new Date(left.updatedAt || left.createdAt),
      )
      .map((query) => {
        const confirmation =
          confirmationLookup.get(String(query.queryId || "").trim()) ||
          confirmationLookup.get(String(query._id || "").trim()) ||
          null;

        return {
          id: query._id,
          queryId: query.queryId || "-",
          initials: getInitials(query.agent?.companyName || query.agent?.name || "Agent"),
          agency: query.agent?.companyName || query.agent?.name || "Unknown Agent",
          destination: query.destination || "-",
          time: formatRelativeTime(query.updatedAt || query.createdAt),
          travelDate: formatDashboardDate(query.startDate),
          pax: Number(query.numberOfAdults || 0) + Number(query.numberOfChildren || 0),
          agentStage: getAgentStageLabel(query.agentStatus),
          opsStage: getOpsStageLabel(query.opsStatus),
          dmcStage: getDmcStageLabel({ query, confirmation }),
        };
      });

    const monthRevenueBuckets = monthBuckets.map((bucket) => ({ ...bucket }));
    const monthQueryBuckets = monthBuckets.map((bucket) => ({ ...bucket }));
    const monthVoucherBuckets = monthBuckets.map((bucket) => ({ ...bucket }));
    const monthBookingBuckets = monthBuckets.map((bucket) => ({ ...bucket }));

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      const bucket = monthRevenueBuckets.find((item) => isWithinRange(invoiceDate, item.start, item.end));
      if (bucket) {
        bucket.value += Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0);
      }
    });

    queries.forEach((query) => {
      const queryDate = new Date(query.createdAt);
      const queryBucket = monthQueryBuckets.find((item) => isWithinRange(queryDate, item.start, item.end));
      if (queryBucket) queryBucket.value += 1;

      if (["Confirmed", "Vouchered"].includes(query.opsStatus)) {
        const bookingBucket = monthBookingBuckets.find((item) =>
          isWithinRange(query.updatedAt || query.createdAt, item.start, item.end),
        );
        if (bookingBucket) bookingBucket.value += 1;
      }
    });

    vouchers.forEach((voucher) => {
      const voucherDate = new Date(voucher.generatedAt || voucher.createdAt);
      const bucket = monthVoucherBuckets.find((item) => isWithinRange(voucherDate, item.start, item.end));
      if (bucket) bucket.value += 1;
    });

    const revenueThisMonth = invoices
      .filter((invoice) => isWithinRange(invoice.createdAt, currentMonthStart, now))
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0), 0);

    const monthlyQueries = queries.filter((query) => isWithinRange(query.createdAt, currentMonthStart, now));
    const monthlyConfirmedBookings = monthlyQueries.filter((query) =>
      ["Confirmed", "Vouchered"].includes(query.opsStatus),
    );
    const bookingConversionRate = monthlyQueries.length
      ? (monthlyConfirmedBookings.length / monthlyQueries.length) * 100
      : 0;
    const monthlyVouchers = vouchers.filter((voucher) =>
      isWithinRange(voucher.generatedAt || voucher.createdAt, currentMonthStart, now),
    );
    const pendingPaymentsThisMonth = invoices.filter((invoice) =>
      isWithinRange(invoice.createdAt, currentMonthStart, now) &&
      invoice.paymentVerification?.status === "Pending",
    ).length;

    const dashboardPayload = {
      header: {
        title: "Admin Dashboard",
        roleLabel: "Administrator",
        subtitle: `${now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })} — complete access to all system features`,
        loggedInAs: req.user?.name || req.user?.email || "Administrator",
      },
      permissions: [
        "Manage all users and roles",
        "View and modify contracted rates",
        "Full booking management access",
        "Order acceptance and processing",
        "Voucher generation and management",
        "Confirmation number entry",
        "Payment verification",
        "Internal invoice management",
      ],
      summaryCards: [
        {
          label: "Pending Queries",
          value: pendingQueries.length,
          change: formatChangeText(currentPendingQueries, previousPendingQueries),
          changeUp: currentPendingQueries >= previousPendingQueries,
          icon: "Q",
          iconBg: "bg-amber-100",
        },
        {
          label: "Active Bookings",
          value: activeBookings.length,
          change: formatChangeText(currentActiveBookings, previousActiveBookings),
          changeUp: currentActiveBookings >= previousActiveBookings,
          icon: "B",
          iconBg: "bg-blue-100",
        },
        {
          label: "Vouchers Generated",
          value: generatedVouchers.length,
          change: formatChangeText(currentVouchers, previousVouchers),
          changeUp: currentVouchers >= previousVouchers,
          icon: "V",
          iconBg: "bg-teal-100",
        },
        {
          label: "Pending Actions",
          value: pendingActionsCount,
          change: formatChangeText(currentPendingActions, previousPendingActions),
          changeUp: currentPendingActions <= previousPendingActions,
          icon: "!",
          iconBg: "bg-amber-100",
        },
      ],
      queryFlow: queryFlowRows,
      performance: [
        {
          label: "Queries Handled",
          value: `${queriesHandledPercent}%`,
          width: queriesHandledPercent,
          color: "bg-blue-500",
        },
        {
          label: "Avg. Response Time",
          value: `${avgResponseHours.toFixed(1)}h`,
          width: Math.max(10, 100 - Math.min(100, Math.round(avgResponseHours * 10))),
          color: "bg-green-500",
        },
        {
          label: "Vouchers / Day",
          value: `${vouchersPerDay}`,
          width: Math.min(100, Math.round((vouchersPerDay / 10) * 100)),
          color: "bg-violet-500",
        },
      ],
      queries: recentQueryRows,
      bookings: bookingRows,
      vouchers: voucherRows,
      reports: [
        {
          value: formatCompactCurrencyValue(revenueThisMonth),
          label: "Revenue this month",
          bars: monthRevenueBuckets.map((bucket) => Math.round(bucket.value)),
          color: "bg-blue-400",
        },
        {
          value: `${bookingConversionRate.toFixed(0)}%`,
          label: "Booking conversion rate",
          bars: monthBookingBuckets.map((bucket, index) => {
            const queryCount = monthQueryBuckets[index]?.value || 0;
            return queryCount ? Math.round((bucket.value / queryCount) * 100) : 0;
          }),
          color: "bg-green-400",
        },
        {
          value: `${monthlyQueries.length}`,
          label: "Total queries this month",
          bars: monthQueryBuckets.map((bucket) => bucket.value),
          color: "bg-violet-400",
        },
        {
          value: `${pendingPaymentsThisMonth}`,
          label: "Payments pending verification",
          bars: monthVoucherBuckets.map((bucket) => bucket.value),
          color: "bg-amber-400",
        },
      ],
      superAdmin: {
        statCards: [
          {
            label: "Total Revenue",
            value: formatCompactCurrencyValue(totalRevenueThisMonth),
            sub: formatChangeText(totalRevenueThisMonth, totalRevenuePreviousMonth, "vs last month"),
            iconKey: "revenue",
          },
          {
            label: "Active Bookings",
            value: `${activeBookings.length}`,
            sub: formatChangeText(currentActiveBookings, previousActiveBookings),
            iconKey: "bookings",
          },
          {
            label: "Active Users",
            value: `${activeManagedUsers.length}`,
            sub: formatChangeText(currentManagedUsers, previousManagedUsers, "added vs last month"),
            iconKey: "users",
          },
          {
            label: "Avg Processing Time",
            value: `${avgResponseHours.toFixed(1)}h`,
            sub: `${Math.max(0, financeReviewHours).toFixed(1)}h finance review avg`,
            iconKey: "time",
          },
        ],
        agentPerformance: topAgentRevenue,
        teamEfficiency: [
          { name: "Ops Team", hours: Number(avgResponseHours.toFixed(1)) },
          { name: "Finance Team", hours: Number(financeReviewHours.toFixed(1)) },
          { name: "DMC Partners", hours: Number(dmcFulfillmentHours.toFixed(1)) },
        ],
        masterBookings: masterBookingRows,
      },
      meta: {
        totalAgents: agents.length,
        totalQueries: totalQueries,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardPayload,
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

const formatDashboardDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatNotificationCurrency = (value, currency = "INR") =>
  `${currency} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

const formatCompactCurrencyValue = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);

  if (absolute >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")}Cr`;
  }

  if (absolute >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")}L`;
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatRelativeTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

const getInitials = (value = "") =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "HC";

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const daysBetween = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

const isWithinRange = (value, start, end) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= start && parsed <= end;
};

const getPercentageChange = (currentValue, previousValue) => {
  if (!previousValue) return currentValue ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

const formatChangeText = (currentValue, previousValue, suffix = "from last week") => {
  const change = getPercentageChange(currentValue, previousValue);
  const prefix = change >= 0 ? "+" : "-";
  return `${prefix}${Math.abs(change).toFixed(0)}% ${suffix}`;
};

const getMonthlyBuckets = (monthCount = 6) => {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, index) => {
    const bucketDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - index - 1), 1);
    return {
      key: `${bucketDate.getFullYear()}-${bucketDate.getMonth()}`,
      label: bucketDate.toLocaleDateString("en-GB", { month: "short" }),
      start: new Date(bucketDate.getFullYear(), bucketDate.getMonth(), 1),
      end: new Date(bucketDate.getFullYear(), bucketDate.getMonth() + 1, 0, 23, 59, 59, 999),
      value: 0,
    };
  });
};

const normalizeStageLabel = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim() || "-";

const getAgentStageLabel = (status = "") => {
  const labelMap = {
    Pending: "Pending",
    "In Progress": "In Progress",
    "Quote Sent": "Quote Sent",
    "Client Approved": "Client Approved",
    Confirmed: "Confirmed",
    Rejected: "Rejected",
    "Revision Requested": "Revision Requested",
  };

  return labelMap[status] || normalizeStageLabel(status || "Pending");
};

const getOpsStageLabel = (status = "") => {
  const labelMap = {
    New_Query: "New Query",
    Pending_Accept: "Pending Accept",
    Revision_Query: "Revision Query",
    Rejected: "Rejected",
    Booking_Accepted: "Accepted",
    Invoice_Requested: "Finance Pending",
    Confirmed: "Confirmed",
    Vouchered: "Vouchered",
  };

  return labelMap[status] || normalizeStageLabel(status || "Pending");
};

const getDmcStageLabel = ({ query, confirmation }) => {
  const confirmationStatus = String(confirmation?.status || "").toLowerCase();
  const opsStatus = String(query?.opsStatus || "");

  if (confirmationStatus === "submitted") return "Submitted";
  if (confirmationStatus === "draft") return "Draft";
  if (opsStatus === "Vouchered") return "Voucher Ready";
  if (opsStatus === "Rejected") return "Closed";
  if (["Booking_Accepted", "Invoice_Requested", "Confirmed"].includes(opsStatus)) {
    return "Pending";
  }

  return "Awaiting Ops";
};

const getOpsServicesTotal = (quotation) =>
  Number(quotation?.pricing?.subTotal || 0) ||
  (quotation?.services || []).reduce(
    (sum, service) => sum + Number(service?.total || 0),
    0,
  );

const formatInternalInvoiceRow = (invoice, quotation) => ({
  id: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  queryId: invoice.query?.queryId || invoice.queryCode || "-",
  destination: invoice.query?.destination || invoice.destination || "-",
  dmcName:
    invoice.dmc?.companyName ||
    invoice.dmc?.name ||
    invoice.dmcName ||
    "-",
  agentName:
    invoice.agent?.companyName ||
    invoice.agent?.name ||
    invoice.agentName ||
    "-",
  supplierName: invoice.supplierName || "-",
  invoiceDate: formatDashboardDate(invoice.invoiceDate),
  invoiceDateValue: invoice.invoiceDate,
  dueDate: formatDashboardDate(invoice.dueDate),
  dueDateValue: invoice.dueDate,
  submittedAt: formatDashboardDate(invoice.submittedAt || invoice.createdAt),
  submittedAtValue: invoice.submittedAt || invoice.createdAt,
  status: invoice.status || "Submitted",
  amount: Number(invoice.summary?.grandTotal || 0),
  dmcServicesTotal: Number(invoice.summary?.subtotal || 0),
  tax: Number(invoice.summary?.totalTax || 0),
  opsServicesTotal: getOpsServicesTotal(quotation),
  currency: invoice.items?.[0]?.currency || "INR",
  templateVariant: invoice.templateVariant || "aurora-ledger",
  items: invoice.items || [],
  documents: invoice.documents || [],
  taxConfig: invoice.taxConfig || {},
  summary: invoice.summary || {},
  quotationNumber: quotation?.quotationNumber || "",
  payoutReference: invoice.payoutReference || "",
  payoutDate: formatDashboardDate(invoice.payoutDate),
  payoutDateValue: invoice.payoutDate,
  payoutBank: invoice.payoutBank || "",
  payoutAmount: Number(invoice.payoutAmount || 0),
  financeNotes: invoice.financeNotes || "",
  assignedTo: invoice.assignedTo || null,
  assignedToName:
    invoice.assignedTo?.companyName ||
    invoice.assignedTo?.name ||
    invoice.assignedToName ||
    "",
  assignedToEmail:
    invoice.assignedTo?.email ||
    invoice.assignedToEmail ||
    "",
  assignedAt: formatDashboardDate(invoice.assignedAt),
  assignedAtValue: invoice.assignedAt || null,
  reviewedBy: invoice.reviewedBy || null,
  reviewedByName: invoice.reviewedByName || "",
  reviewedAt: formatDashboardDate(invoice.reviewedAt),
  reviewedAtValue: invoice.reviewedAt || null,
});

const getPaymentVerificationStatus = (invoice) => {
  if (invoice?.paymentVerification?.status) {
    return invoice.paymentVerification.status;
  }

  if (invoice?.paymentStatus === "Paid") return "Verified";
  if (invoice?.paymentStatus === "Unpaid") return "Rejected";
  return "Pending";
};

const getPaymentWorkflowStatus = (invoice) => {
  const finalStatus = getPaymentVerificationStatus(invoice);

  if (finalStatus === "Verified" || finalStatus === "Rejected") {
    return finalStatus;
  }

  if (invoice?.paymentVerification?.teamDecisionStatus) {
    return "Manager Review";
  }

  return "Pending";
};

const resolveOpsConfirmedInvoiceAmount = (invoice = {}) => {
  const pricingSnapshot = invoice?.pricingSnapshot || {};
  const snapshotOpsAmount =
    Number(pricingSnapshot.servicesTotal || 0) +
    Number(pricingSnapshot.packageTemplateAmount || 0) +
    Number(pricingSnapshot.opsMarkupAmount || 0) +
    Number(pricingSnapshot.serviceCharge || 0) +
    Number(pricingSnapshot.handlingFee || 0) +
    Number(pricingSnapshot.totalTax || 0);

  if (snapshotOpsAmount > 0) {
    return Math.round(snapshotOpsAmount);
  }

  const quotationOpsAmount = Number(
    invoice?.quotation?.pricing?.totalAmount ||
    invoice?.quotation?.totalAmount ||
    0,
  );

  if (quotationOpsAmount > 0) {
    return Math.round(quotationOpsAmount);
  }

  return Math.round(
    Number(invoice?.totalAmount || pricingSnapshot?.grandTotal || 0),
  );
};

const getCouponVerificationContext = (invoice = {}) => {
  const couponApplication = invoice?.paymentSubmission?.couponApplication || null;
  if (!couponApplication?.couponId) return null;

  const subtotalAmount = Math.round(Number(couponApplication?.subtotalAmount || 0));
  const discountAmount = Math.round(Number(couponApplication?.discountAmount || 0));
  const payableAmount = Math.max(
    Math.round(Number(couponApplication?.payableAmount || 0)),
    0,
  );
  const discountValue = Number(couponApplication?.discountValue || 0);

  return {
    applied: true,
    code: couponApplication.code || "",
    discountType: couponApplication.discountType || "",
    discountValue,
    discountLabel: couponApplication.discountLabel || "",
    subtotalAmount,
    discountAmount,
    payableAmount,
    appliedAt: couponApplication.appliedAt || null,
    appliedAtLabel: formatDashboardDate(couponApplication.appliedAt),
    summary:
      couponApplication.discountType === "percentage"
        ? `${couponApplication.code || "Coupon"} applied with ${Number(discountValue || 0)}% off. Payable amount reduced to ${payableAmount}.`
        : `${couponApplication.code || "Coupon"} applied with discount ${couponApplication.discountLabel || discountAmount}. Payable amount reduced to ${payableAmount}.`,
  };
};

const formatPaymentVerificationRow = (invoice) => {
  const verificationStatus = getPaymentVerificationStatus(invoice);
  const workflowStatus = getPaymentWorkflowStatus(invoice);
  const assignedFinance =
    invoice.paymentVerification?.assignedTo ||
    invoice.paymentVerification?.reviewedBy ||
    null;
  const opsInvoiceAmount = resolveOpsConfirmedInvoiceAmount(invoice);
  const couponContext = getCouponVerificationContext(invoice);
  const expectedAmount =
    couponContext?.applied && couponContext?.payableAmount >= 0
      ? couponContext.payableAmount
      : opsInvoiceAmount;
  const receivedAmount = Math.round(
    Number(invoice.paymentSubmission?.amount || 0),
  );
  const hasReceivedAmount = receivedAmount > 0;
  const amountVariance = hasReceivedAmount ? receivedAmount - expectedAmount : 0;
  const amountStatus = !hasReceivedAmount
    ? "Not Submitted"
    : amountVariance === 0
      ? "Matched"
      : amountVariance < 0
        ? "Short"
        : "Excess";

  return {
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    bookingReference: invoice.query?.queryId || "-",
    queryId: invoice.query?.queryId || "",
    agentName:
      invoice.agent?.companyName ||
      invoice.agent?.name ||
      "-",
    agentEmail: invoice.agent?.email || "",
    amount: expectedAmount,
    opsInvoiceAmount,
    expectedAmount,
    receivedAmount,
    amountVariance,
    amountStatus,
    paymentOnBehalfOf: invoice.paymentSubmission?.onBehalfOf || "",
    remarks: invoice.remarks || "",
    utrNumber: invoice.paymentSubmission?.utrNumber || "",
    bankName: invoice.paymentSubmission?.bankName || "",
    paymentDate: formatDashboardDate(invoice.paymentSubmission?.paymentDate),
    paymentDateValue: invoice.paymentSubmission?.paymentDate || null,
    receiptUrl: invoice.paymentSubmission?.receipt?.url || "",
    receiptName: invoice.paymentSubmission?.receipt?.fileName || "",
    receiptMimeType: invoice.paymentSubmission?.receipt?.mimeType || "",
    receiptSize: Number(invoice.paymentSubmission?.receipt?.size || 0),
    submittedAt: formatDashboardDate(invoice.paymentSubmission?.submittedAt),
    submittedAtValue: invoice.paymentSubmission?.submittedAt || null,
    submittedBy: invoice.paymentSubmission?.submittedBy || null,
    status: verificationStatus,
    workflowStatus,
    needsManagerReview:
      verificationStatus === "Pending" &&
      Boolean(invoice.paymentVerification?.teamDecisionStatus),
    assignedFinanceId: assignedFinance,
    assignedFinanceName:
      invoice.paymentVerification?.assignedToName ||
      invoice.paymentVerification?.assignedTo?.companyName ||
      invoice.paymentVerification?.assignedTo?.name ||
      invoice.paymentVerification?.reviewedByName ||
      "",
    assignedFinanceEmail:
      invoice.paymentVerification?.assignedToEmail ||
      invoice.paymentVerification?.assignedTo?.email ||
      "",
    assignedAt: formatDashboardDate(invoice.paymentVerification?.assignedAt),
    assignedAtValue: invoice.paymentVerification?.assignedAt || null,
    rejectionReason: invoice.paymentVerification?.rejectionReason || "",
    rejectionRemarks: invoice.paymentVerification?.rejectionRemarks || "",
    reviewedBy: invoice.paymentVerification?.reviewedBy || null,
    reviewedByName:
      invoice.paymentVerification?.reviewedByName ||
      invoice.paymentVerification?.reviewedBy?.companyName ||
      invoice.paymentVerification?.reviewedBy?.name ||
      "",
    reviewedAt: formatDashboardDate(invoice.paymentVerification?.reviewedAt),
    reviewedAtValue: invoice.paymentVerification?.reviewedAt || null,
    teamDecisionStatus: invoice.paymentVerification?.teamDecisionStatus || "",
    teamDecisionReason: invoice.paymentVerification?.teamDecisionReason || "",
    teamDecisionRemarks: invoice.paymentVerification?.teamDecisionRemarks || "",
    teamDecisionBy: invoice.paymentVerification?.teamDecisionBy || null,
    teamDecisionByName: invoice.paymentVerification?.teamDecisionByName || "",
    teamDecisionAt: formatDashboardDate(invoice.paymentVerification?.teamDecisionAt),
    teamDecisionAtValue: invoice.paymentVerification?.teamDecisionAt || null,
    sentToManagerAt: formatDashboardDate(invoice.paymentVerification?.sentToManagerAt),
    sentToManagerAtValue: invoice.paymentVerification?.sentToManagerAt || null,
    couponApplied: Boolean(couponContext?.applied),
    couponCode: couponContext?.code || "",
    couponDiscountLabel: couponContext?.discountLabel || "",
    couponDiscountType: couponContext?.discountType || "",
    couponDiscountValue: Number(couponContext?.discountValue || 0),
    couponSubtotalAmount: Number(couponContext?.subtotalAmount || 0),
    couponDiscountAmount: Number(couponContext?.discountAmount || 0),
    couponPayableAmount: Number(couponContext?.payableAmount || 0),
    couponAppliedAt: couponContext?.appliedAt || null,
    couponAppliedAtLabel: couponContext?.appliedAtLabel || "",
    couponSummary: couponContext?.summary || "",
    canGenerateInvoice: verificationStatus === "Verified",
    finalInvoiceStatus: invoice.finalInvoiceDispatch?.status || "Not Sent",
    finalInvoiceSentAt: formatDashboardDate(invoice.finalInvoiceDispatch?.sentAt),
    finalInvoiceSentAtValue: invoice.finalInvoiceDispatch?.sentAt || null,
    finalInvoiceSentBy: invoice.finalInvoiceDispatch?.sentBy || null,
    finalInvoiceSentByName: invoice.finalInvoiceDispatch?.sentByName || "",
    finalInvoiceRecipientEmail:
      invoice.finalInvoiceDispatch?.recipientEmail ||
      invoice.agent?.email ||
      "",
    canSendFinalInvoice:
      verificationStatus === "Verified" &&
      Boolean(invoice.agent?.email),
    auditTrail: (invoice.paymentAuditTrail || []).map((entry) => ({
      action: entry.action,
      status: entry.status,
      reason: entry.reason || "",
      remarks: entry.remarks || "",
      performedBy: entry.performedBy || null,
      performedByName: entry.performedByName || "",
      performedAt: formatDashboardDate(entry.performedAt),
      performedAtValue: entry.performedAt || null,
    })),
  };
};

const decoratePaymentVerificationRows = (rows = [], accessContext = null) =>
  filterRowsByFinanceAccess({
    rows: decorateFinanceAssignment({
      rows,
      teamMembers: accessContext?.teamMembers || [],
      getExplicitAssigneeIds: (row) => [row.assignedFinanceId, row.reviewedBy],
      getFallbackSeed: (row) => row.invoiceNumber || row.id,
    }),
    accessContext,
  });

const decorateInternalInvoiceRows = (rows = [], accessContext = null) =>
  filterRowsByFinanceAccess({
    rows: decorateFinanceAssignment({
      rows,
      teamMembers: accessContext?.teamMembers || [],
      getExplicitAssigneeIds: (row) => [row.assignedTo, row.reviewedBy],
      getFallbackSeed: (row) => row.invoiceNumber || row.id || row.queryId,
    }),
    accessContext,
  });

const ensureFinanceRecordAccess = ({
  teamMembers = [],
  accessContext = null,
  explicitAssigneeIds = [],
  fallbackSeed = "",
}) => {
  if (!accessContext || accessContext.scope === "admin") {
    return;
  }

  const assignedFinanceId = resolveFinanceAssigneeId({
    teamMembers,
    explicitAssigneeIds,
    fallbackSeed,
  });

  if (accessContext.scope === "manager") {
    const teamMemberIds = new Set(accessContext.teamMemberIds || []);
    if (!teamMemberIds.has(assignedFinanceId)) {
      throw new ApiError(403, "This record is outside your finance team");
    }
    return;
  }

  if (assignedFinanceId !== accessContext.currentUserId) {
    throw new ApiError(403, "This record is assigned to another finance executive");
  }
};

const mapInvoiceStatus = (paymentStatus) => {
  if (paymentStatus === "Paid") return "Settled";
  if (paymentStatus === "Partially Paid") return "Pending Verification";
  return "Unpaid";
};

const mapInternalInvoiceStatus = (status) => {
  if (status === "Paid") return "Settled";
  if (status === "Rejected") return "Unpaid";
  return "Pending Verification";
};

const getInternalInvoiceRelevantDate = (invoice) => {
  const sourceDate =
    (invoice?.status === "Paid" && invoice?.payoutDate) ||
    invoice?.submittedAt ||
    invoice?.invoiceDate ||
    invoice?.createdAt;

  const parsed = new Date(sourceDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinWindow = (value, start, end) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= start && parsed <= end;
};

const getRangeWindow = (range, startDate, endDate) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "monthly") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getPreviousWindow = ({ start, end }) => {
  const duration = end.getTime() - start.getTime() + 1;
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(end.getTime() - duration),
  };
};

const calculateChangeText = (currentValue, previousValue, suffix = "vs last period") => {
  if (!previousValue) {
    if (!currentValue) return "0% vs last period";
    return "+100% vs last period";
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.abs(change).toFixed(0);
  const prefix = change >= 0 ? "+" : "-";
  return `${prefix}${rounded}% ${suffix}`;
};

const buildFinanceMetrics = (rows) => {
  const receivables = rows.filter((row) => row.bucket === "receivable");
  const payables = rows.filter((row) => row.bucket === "payable");

  const receivableTotal = receivables.reduce((sum, row) => sum + row.amountValue, 0);
  const payableTotal = payables.reduce((sum, row) => sum + row.amountValue, 0);
  const pendingCount = receivables.filter((row) => row.status === "Pending Verification").length;
  const settledTotal = rows
    .filter((row) => row.status === "Settled")
    .reduce((sum, row) => sum + row.amountValue, 0);
  const pendingApprovals = payables.filter((row) => row.status === "Pending Verification").length;
  const overdue = rows.filter((row) => row.status === "Unpaid" && row.isOverdue).length;

  return {
    receivableTotal,
    payableTotal,
    pendingCount,
    settledTotal,
    pendingApprovals,
    overdue,
    taxCollected: 0,
  };
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const INDIAN_DESTINATION_KEYWORDS = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);

  if (absolute >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, "")}Cr`;
  }

  if (absolute >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, "")}L`;
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercentValue = (value, digits = 1) =>
  `${Number(value || 0).toFixed(digits).replace(/\.0$/, "")}%`;

const calculateGrowthPercentage = (currentValue, previousValue) => {
  if (!previousValue) {
    return currentValue ? 100 : 0;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
};

const formatGrowthText = (currentValue, previousValue, comparisonLabel) => {
  const growth = calculateGrowthPercentage(currentValue, previousValue);
  const rounded = Math.abs(growth).toFixed(0);
  const prefix = growth >= 0 ? "+" : "-";
  return `${prefix}${rounded}% ${comparisonLabel}`;
};

const getMetricAppearance = (type) => {
  if (type === "inward") {
    return {
      color: "#16a34a",
      bg: "#f0fdf4",
      iconColor: "#16a34a",
      changeTone: "positive",
    };
  }

  if (type === "outward") {
    return {
      color: "#dc2626",
      bg: "#fef2f2",
      iconColor: "#dc2626",
      changeTone: "negative",
    };
  }

  if (type === "profit") {
    return {
      color: "#2563eb",
      bg: "#eff6ff",
      iconColor: "#2563eb",
      changeTone: "positive",
    };
  }

  return {
    color: "#7c3aed",
    bg: "#f5f3ff",
    iconColor: "#7c3aed",
    changeTone: "positive",
  };
};

const inferDomesticDestination = (destination = "") => {
  const normalized = String(destination || "").toLowerCase();
  return INDIAN_DESTINATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const getAnalyticsInvoiceDate = (invoice) => {
  const parsed = new Date(invoice?.createdAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAnalyticsInternalInvoiceDate = (invoice) => {
  const source =
    invoice?.payoutDate ||
    invoice?.submittedAt ||
    invoice?.invoiceDate ||
    invoice?.createdAt;

  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const createMonthlyBuckets = (referenceDate) => {
  const buckets = [];
  const baseMonth = startOfMonth(referenceDate);

  for (let index = 11; index >= 0; index -= 1) {
    const bucketStart = addMonths(baseMonth, -index);
    const bucketEnd = new Date(bucketStart.getFullYear(), bucketStart.getMonth() + 1, 0, 23, 59, 59, 999);

    buckets.push({
      label: MONTH_LABELS[bucketStart.getMonth()],
      start: bucketStart,
      end: bucketEnd,
      inward: 0,
      outward: 0,
    });
  }

  return buckets;
};

const createYearlyBuckets = (referenceDate) => {
  const buckets = [];
  const currentYear = referenceDate.getFullYear();

  for (let year = currentYear - 5; year <= currentYear; year += 1) {
    buckets.push({
      label: String(year),
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
      inward: 0,
      outward: 0,
    });
  }

  return buckets;
};

const getAggregateWindowStart = (referenceDate) => addMonths(startOfMonth(referenceDate), -11);

const getPreviousAggregateWindow = (startDate, monthSpan = 12) => {
  const previousStart = addMonths(startDate, -monthSpan);
  const previousEnd = new Date(startDate.getTime() - 1);
  return { start: previousStart, end: previousEnd };
};

const sumInvoiceAmountsInWindow = (invoices, start, end) =>
  invoices.reduce((sum, invoice) => {
    const invoiceDate = getAnalyticsInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return sum;
    return sum + Number(invoice.totalAmount || 0);
  }, 0);

const sumInternalInvoiceAmountsInWindow = (invoices, start, end) =>
  invoices.reduce((sum, invoice) => {
    const invoiceDate = getAnalyticsInternalInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return sum;
    return sum + Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
  }, 0);

const getCurrentYearWindow = (referenceDate) => ({
  start: new Date(referenceDate.getFullYear(), 0, 1),
  end: new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59, 999),
});

const getPreviousYearWindow = (referenceDate) => ({
  start: new Date(referenceDate.getFullYear() - 1, 0, 1),
  end: new Date(referenceDate.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
});

const getTaxWindow = (referenceDate, mode) => {
  if (mode === "yearly") {
    return {
      start: new Date(referenceDate.getFullYear(), 0, 1),
      end: new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59, 999),
      label: String(referenceDate.getFullYear()),
    };
  }

  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const label = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return { start, end, label };
};

const buildMetricPayload = ({
  inwardTotal,
  outwardTotal,
  previousInwardTotal,
  previousOutwardTotal,
  comparisonLabel,
}) => {
  const profitTotal = inwardTotal - outwardTotal;
  const previousProfitTotal = previousInwardTotal - previousOutwardTotal;
  const margin = inwardTotal ? (profitTotal / inwardTotal) * 100 : 0;
  const previousMargin = previousInwardTotal
    ? (previousProfitTotal / previousInwardTotal) * 100
    : 0;

  return {
    inward: {
      label: "Total Inward",
      sub: "Money from Agents",
      val: formatCompactCurrency(inwardTotal),
      change: formatGrowthText(inwardTotal, previousInwardTotal, comparisonLabel),
      up: inwardTotal >= previousInwardTotal,
      ...getMetricAppearance("inward"),
    },
    outward: {
      label: "Total Outward",
      sub: "Money to DMCs",
      val: formatCompactCurrency(outwardTotal),
      change: formatGrowthText(outwardTotal, previousOutwardTotal, comparisonLabel),
      up: outwardTotal >= previousOutwardTotal,
      ...getMetricAppearance("outward"),
    },
    profit: {
      label: "Net Profit",
      sub: "After all expenses",
      val: formatCompactCurrency(profitTotal),
      change: formatGrowthText(profitTotal, previousProfitTotal, comparisonLabel),
      up: profitTotal >= previousProfitTotal,
      ...getMetricAppearance("profit"),
    },
    margin: {
      label: "Profit Margin",
      sub: "Percentage of revenue",
      val: formatPercentValue(margin),
      change: formatGrowthText(margin, previousMargin, comparisonLabel),
      up: margin >= previousMargin,
      ...getMetricAppearance("margin"),
    },
  };
};

const buildTaxSummary = ({
  invoices,
  internalInvoices,
  referenceDate,
  mode,
  inwardTotal,
}) => {
  const { start, end, label } = getTaxWindow(referenceDate, mode);

  let gstTotal = 0;
  let tcsDomestic = 0;
  let tcsInternational = 0;
  let tdfTotal = 0;
  let tdfTransactions = 0;

  invoices.forEach((invoice) => {
    const invoiceDate = getAnalyticsInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return;

    const gstAmount = Number(invoice.pricingSnapshot?.gstAmount || 0);
    const tcsAmount = Number(invoice.pricingSnapshot?.tcsAmount || 0);
    const tourismAmount = Number(invoice.pricingSnapshot?.tourismAmount || 0);
    const destination = invoice.query?.destination || invoice.tripSnapshot?.destination || "";

    gstTotal += gstAmount;
    if (inferDomesticDestination(destination)) {
      tcsDomestic += tcsAmount;
    } else {
      tcsInternational += tcsAmount;
    }

    if (tourismAmount > 0) {
      tdfTotal += tourismAmount;
      tdfTransactions += 1;
    }
  });

  internalInvoices.forEach((invoice) => {
    const invoiceDate = getAnalyticsInternalInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return;

    const gstAmount = Number(invoice.summary?.gstAmount || 0);
    const tcsAmount = Number(invoice.summary?.tcsAmount || 0);
    const tourismAmount = Number(invoice.summary?.otherTaxAmount || 0);
    const destination = invoice.query?.destination || invoice.destination || "";

    gstTotal += gstAmount;
    if (inferDomesticDestination(destination)) {
      tcsDomestic += tcsAmount;
    } else {
      tcsInternational += tcsAmount;
    }

    if (tourismAmount > 0) {
      tdfTotal += tourismAmount;
      tdfTransactions += 1;
    }
  });

  const tcsTotal = tcsDomestic + tcsInternational;
  const totalTaxCollected = gstTotal + tcsTotal + tdfTotal;
  const taxAsPercent = inwardTotal ? (totalTaxCollected / inwardTotal) * 100 : 0;
  const pendingTaxReview =
    invoices.filter((invoice) => {
      const invoiceDate = getAnalyticsInvoiceDate(invoice);
      return (
        invoiceDate &&
        invoiceDate >= start &&
        invoiceDate <= end &&
        invoice.paymentStatus !== "Paid"
      );
    }).length +
    internalInvoices.filter((invoice) => {
      const invoiceDate = getAnalyticsInternalInvoiceDate(invoice);
      return (
        invoiceDate &&
        invoiceDate >= start &&
        invoiceDate <= end &&
        !["Paid", "Rejected"].includes(invoice.status)
      );
    }).length;

  const nextFilingDue = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 20);

  return {
    periodLabel: label,
    gst: {
      total: formatCompactCurrency(gstTotal),
      rateLabel: "@ 18% on taxable amount",
      status: gstTotal > 0 ? "Collected" : "No activity",
      breakdown: [
        { label: "CGST (9%)", value: formatCompactCurrency(gstTotal / 2) },
        { label: "SGST (9%)", value: formatCompactCurrency(gstTotal / 2) },
      ],
    },
    tcs: {
      total: formatCompactCurrency(tcsTotal),
      rateLabel: "@ 5% on package cost",
      status: tcsTotal > 0 ? "Collected" : "No activity",
      breakdown: [
        { label: "Domestic Tours", value: formatCompactCurrency(tcsDomestic) },
        { label: "International Tours", value: formatCompactCurrency(tcsInternational) },
      ],
    },
    tdf: {
      total: formatCompactCurrency(tdfTotal),
      rateLabel: "Tax per hotel levy",
      status: tdfTotal > 0 ? "Collected" : "No activity",
      breakdown: [
        { label: "Total Transactions", value: tdfTransactions.toLocaleString("en-IN") },
        {
          label: "Avg Per Invoice",
          value: formatCompactCurrency(tdfTransactions ? tdfTotal / tdfTransactions : 0),
        },
      ],
    },
    summaryBar: {
      totalTaxCollected: formatCompactCurrency(totalTaxCollected),
      taxAsPercent: formatPercentValue(taxAsPercent),
      complianceStatus: pendingTaxReview === 0 ? "All Taxes Filed" : "Review Pending",
      complianceTone: pendingTaxReview === 0 ? "success" : "warning",
      nextFilingDue: nextFilingDue.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
  };
};

const buildAdvancedAnalyticsPayload = ({
  invoices,
  internalInvoices,
  referenceDate,
  mode,
}) => {
  const buckets = mode === "yearly"
    ? createYearlyBuckets(referenceDate)
    : createMonthlyBuckets(referenceDate);

  buckets.forEach((bucket) => {
    invoices.forEach((invoice) => {
      const invoiceDate = getAnalyticsInvoiceDate(invoice);
      if (!invoiceDate || invoiceDate < bucket.start || invoiceDate > bucket.end) return;
      bucket.inward += Number(invoice.totalAmount || 0);
    });

    internalInvoices.forEach((invoice) => {
      const invoiceDate = getAnalyticsInternalInvoiceDate(invoice);
      if (!invoiceDate || invoiceDate < bucket.start || invoiceDate > bucket.end) return;
      bucket.outward += Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
    });
  });

  const inwardTotal = buckets.reduce((sum, bucket) => sum + bucket.inward, 0);
  const outwardTotal = buckets.reduce((sum, bucket) => sum + bucket.outward, 0);

  let previousInwardTotal = 0;
  let previousOutwardTotal = 0;
  let comparisonLabel = "vs last period";

  if (mode === "yearly") {
    const currentYearWindow = getCurrentYearWindow(referenceDate);
    const previousYearWindow = getPreviousYearWindow(referenceDate);

    previousInwardTotal = sumInvoiceAmountsInWindow(
      invoices,
      previousYearWindow.start,
      previousYearWindow.end,
    );
    previousOutwardTotal = sumInternalInvoiceAmountsInWindow(
      internalInvoices,
      previousYearWindow.start,
      previousYearWindow.end,
    );

    const currentYearInward = sumInvoiceAmountsInWindow(
      invoices,
      currentYearWindow.start,
      currentYearWindow.end,
    );
    const currentYearOutward = sumInternalInvoiceAmountsInWindow(
      internalInvoices,
      currentYearWindow.start,
      currentYearWindow.end,
    );

    comparisonLabel = "vs last year";

    return {
      chart: {
        labels: buckets.map((bucket) => bucket.label),
        inward: buckets.map((bucket) => Number(bucket.inward.toFixed(2))),
        outward: buckets.map((bucket) => Number(bucket.outward.toFixed(2))),
      },
      metrics: buildMetricPayload({
        inwardTotal: currentYearInward,
        outwardTotal: currentYearOutward,
        previousInwardTotal,
        previousOutwardTotal,
        comparisonLabel,
      }),
      taxSummary: buildTaxSummary({
        invoices,
        internalInvoices,
        referenceDate,
        mode,
        inwardTotal: currentYearInward,
      }),
    };
  }

  const aggregateWindowStart = getAggregateWindowStart(referenceDate);
  const previousWindow = getPreviousAggregateWindow(aggregateWindowStart);

  previousInwardTotal = sumInvoiceAmountsInWindow(
    invoices,
    previousWindow.start,
    previousWindow.end,
  );
  previousOutwardTotal = sumInternalInvoiceAmountsInWindow(
    internalInvoices,
    previousWindow.start,
    previousWindow.end,
  );

  return {
    chart: {
      labels: buckets.map((bucket) => bucket.label),
      inward: buckets.map((bucket) => Number(bucket.inward.toFixed(2))),
      outward: buckets.map((bucket) => Number(bucket.outward.toFixed(2))),
    },
    metrics: buildMetricPayload({
      inwardTotal,
      outwardTotal,
      previousInwardTotal,
      previousOutwardTotal,
      comparisonLabel,
    }),
    taxSummary: buildTaxSummary({
      invoices,
      internalInvoices,
      referenceDate,
      mode,
      inwardTotal,
    }),
  };
};

export const getFinanceDashboard = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const range = String(req.query.range || "weekly").toLowerCase();
    const { start, end } = getRangeWindow(range, req.query.startDate, req.query.endDate);
    const previousWindow = getPreviousWindow({ start, end });

    const [currentInvoices, previousInvoices, internalInvoices] = await Promise.all([
      Invoice.find({
        createdAt: { $gte: start, $lte: end },
      })
        .populate("agent", "name companyName")
        .populate("generatedBy", "name companyName role")
        .populate("query", "queryId")
        .lean(),
      Invoice.find({
        createdAt: { $gte: previousWindow.start, $lte: previousWindow.end },
      })
        .populate("agent", "name companyName")
        .populate("generatedBy", "name companyName role")
        .populate("query", "queryId")
        .lean(),
      InternalInvoice.find({
        $or: [
          { payoutDate: { $gte: previousWindow.start, $lte: end } },
          { submittedAt: { $gte: previousWindow.start, $lte: end } },
          { invoiceDate: { $gte: previousWindow.start, $lte: end } },
          { createdAt: { $gte: previousWindow.start, $lte: end } },
        ],
      })
        .populate("dmc", "name companyName")
        .populate("query", "queryId")
        .lean(),
    ]);

    const normalizeInvoice = (invoice) => {
      const status = mapInvoiceStatus(invoice.paymentStatus);
      const createdAt = new Date(invoice.createdAt);
      const generatedByRole = invoice.generatedBy?.role || invoice.invoiceType;
      const isPayable = generatedByRole === "dmc_partner";

      return {
        id: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || "-",
        company:
          invoice.agent?.companyName ||
          invoice.agent?.name ||
          invoice.generatedBy?.companyName ||
          invoice.generatedBy?.name ||
          "-",
        name:
          invoice.generatedBy?.companyName ||
          invoice.generatedBy?.name ||
          invoice.agent?.companyName ||
          invoice.agent?.name ||
          "-",
        date: formatDashboardDate(invoice.createdAt),
        dateValue: createdAt,
        amount: invoice.totalAmount,
        amountValue: Number(invoice.totalAmount || 0),
        status,
        assignedFinanceId:
          invoice?.paymentVerification?.assignedTo ||
          invoice?.paymentVerification?.reviewedBy ||
          null,
        reviewedBy: invoice?.paymentVerification?.reviewedBy || null,
        bucket: isPayable ? "payable" : "receivable",
        isOverdue:
          status === "Unpaid" &&
          createdAt.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000,
      };
    };

    const currentRows = currentInvoices.map(normalizeInvoice);
    const previousRows = previousInvoices.map(normalizeInvoice);

    const normalizedPayables = internalInvoices
      .map((invoice) => {
        const relevantDate = getInternalInvoiceRelevantDate(invoice);
        if (!relevantDate) return null;

        const status = mapInternalInvoiceStatus(invoice.status);
        const amountValue = Number(
          invoice.payoutAmount || invoice.summary?.grandTotal || 0,
        );

        return {
          id: invoice.invoiceNumber,
          queryId: invoice.query?.queryId || invoice.queryCode || "-",
          company:
            invoice.dmc?.companyName ||
            invoice.dmc?.name ||
            invoice.dmcName ||
            invoice.supplierName ||
            "-",
          name:
            invoice.dmc?.companyName ||
            invoice.dmc?.name ||
            invoice.dmcName ||
            invoice.supplierName ||
            "-",
          date: formatDashboardDate(relevantDate),
          dateValue: relevantDate,
          amount: amountValue,
          amountValue,
          status,
          reviewedBy: invoice?.reviewedBy || null,
          bucket: "payable",
          isOverdue:
            status !== "Settled" &&
            relevantDate.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000,
        };
      })
      .filter(Boolean);

    const currentPayables = normalizedPayables.filter((row) =>
      isWithinWindow(row.dateValue, start, end),
    );
    const previousPayables = normalizedPayables.filter((row) =>
      isWithinWindow(row.dateValue, previousWindow.start, previousWindow.end),
    );

    currentRows.push(...currentPayables);
    previousRows.push(...previousPayables);

    const scopedCurrentRows =
      accessContext.scope === "admin"
        ? currentRows
        : filterRowsByFinanceAccess({
          rows: decorateFinanceAssignment({
            rows: currentRows,
            teamMembers: accessContext.teamMembers,
            getExplicitAssigneeIds: (row) => [row.assignedFinanceId, row.reviewedBy],
            getFallbackSeed: (row) => `${row.bucket}-${row.id}-${row.queryId}`,
          }),
          accessContext,
        });

    const scopedPreviousRows =
      accessContext.scope === "admin"
        ? previousRows
        : filterRowsByFinanceAccess({
          rows: decorateFinanceAssignment({
            rows: previousRows,
            teamMembers: accessContext.teamMembers,
            getExplicitAssigneeIds: (row) => [row.assignedFinanceId, row.reviewedBy],
            getFallbackSeed: (row) => `${row.bucket}-${row.id}-${row.queryId}`,
          }),
          accessContext,
        });

    const currentMetrics = buildFinanceMetrics(scopedCurrentRows);
    const previousMetrics = buildFinanceMetrics(scopedPreviousRows);

    const receivables = scopedCurrentRows
      .filter((row) => row.bucket === "receivable")
      .sort((left, right) => new Date(right.dateValue) - new Date(left.dateValue))
      .map((row) => ({
        id: row.id,
        status: row.status,
        company: row.company,
        date: row.date,
        amount: row.amountValue,
        queryId: row.queryId,
      }));

    const payables = scopedCurrentRows
      .filter((row) => row.bucket === "payable")
      .sort((left, right) => new Date(right.dateValue) - new Date(left.dateValue))
      .map((row) => ({
        name: row.name,
        status: row.status,
        date: row.date,
        amount: row.amountValue,
        id: row.id,
        queryId: row.queryId,
      }));

    res.status(200).json({
      success: true,
      data: {
        range,
        window: {
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
        },
        metrics: {
          receivableTotal: currentMetrics.receivableTotal,
          payableTotal: currentMetrics.payableTotal,
          pendingVerifications: currentMetrics.pendingCount,
          receivableChange: calculateChangeText(
            currentMetrics.receivableTotal,
            previousMetrics.receivableTotal,
          ),
          payableChange: calculateChangeText(
            currentMetrics.payableTotal,
            previousMetrics.payableTotal,
          ),
          pendingChange: calculateChangeText(
            currentMetrics.pendingCount,
            previousMetrics.pendingCount,
            "vs previous period",
          ),
          settledTotal: currentMetrics.settledTotal,
          pendingApprovals: currentMetrics.pendingApprovals,
          overduePayments: currentMetrics.overdue,
          taxCollected: currentMetrics.taxCollected,
        },
        receivables,
        payables,
        bankReconciliationStatus:
          currentMetrics.pendingCount === 0 && currentMetrics.pendingApprovals === 0
            ? "Up to Date"
            : "Needs Attention",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdvancedAnalytics = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const referenceDate = new Date();
    const earliestYearStart = new Date(referenceDate.getFullYear() - 5, 0, 1);
    const earliestMonthlyStart = addMonths(startOfMonth(referenceDate), -23);
    const earliestDate = earliestYearStart < earliestMonthlyStart
      ? earliestYearStart
      : earliestMonthlyStart;

    const [invoices, internalInvoices] = await Promise.all([
      Invoice.find({
        createdAt: { $gte: earliestDate },
      })
        .populate("query", "queryId destination")
        .lean(),
      InternalInvoice.find({
        $or: [
          { payoutDate: { $gte: earliestDate } },
          { submittedAt: { $gte: earliestDate } },
          { invoiceDate: { $gte: earliestDate } },
          { createdAt: { $gte: earliestDate } },
        ],
      })
        .populate("query", "queryId destination")
        .lean(),
    ]);

    const scopedInvoices =
      accessContext.scope === "admin"
        ? invoices
        : invoices.filter((invoice) =>
          decoratePaymentVerificationRows(
            [formatPaymentVerificationRow(invoice)],
            accessContext,
          ).length > 0,
        );

    const scopedInternalInvoices =
      accessContext.scope === "admin"
        ? internalInvoices
        : internalInvoices.filter((invoice) =>
          decorateInternalInvoiceRows(
            [formatInternalInvoiceRow(invoice, null)],
            accessContext,
          ).length > 0,
        );

    const monthly = buildAdvancedAnalyticsPayload({
      invoices: scopedInvoices,
      internalInvoices: scopedInternalInvoices,
      referenceDate,
      mode: "monthly",
    });

    const yearly = buildAdvancedAnalyticsPayload({
      invoices: scopedInvoices,
      internalInvoices: scopedInternalInvoices,
      referenceDate,
      mode: "yearly",
    });

    res.status(200).json({
      success: true,
      data: {
        generatedOn: referenceDate.toISOString(),
        monthly,
        yearly,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInternalInvoices = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const invoices = await InternalInvoice.find()
      .populate("query", "queryId destination")
      .populate("dmc", "name companyName")
      .populate("agent", "name companyName")
      .populate("assignedTo", "name companyName email")
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    const queryIds = [...new Set(
      invoices
        .map((invoice) => invoice.query?._id?.toString())
        .filter(Boolean),
    )];

    const quotations = queryIds.length
      ? await Quotation.find({ queryId: { $in: queryIds } })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const quotationByQueryId = quotations.reduce((acc, quotation) => {
      const key = quotation.queryId?.toString();
      if (!key || acc[key]) return acc;
      acc[key] = quotation;
      return acc;
    }, {});

    const rows = invoices.map((invoice) =>
      formatInternalInvoiceRow(
        invoice,
        quotationByQueryId[invoice.query?._id?.toString?.() || ""],
      ),
    );

    const scopedRows =
      accessContext.scope === "admin"
        ? rows
        : decorateInternalInvoiceRows(rows, accessContext);

    const summary = {
      totalInvoices: scopedRows.length,
      submitted: scopedRows.filter((row) => row.status === "Submitted").length,
      inReview: scopedRows.filter((row) => row.status === "In Review").length,
      approved: scopedRows.filter((row) => row.status === "Approved").length,
      paid: scopedRows.filter((row) => row.status === "Paid").length,
      totalAmount: scopedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      pendingAmount: scopedRows
        .filter((row) => row.status !== "Paid")
        .reduce((sum, row) => sum + Number(row.amount || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        invoices: scopedRows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentVerifications = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const invoices = await Invoice.find({
      $or: [
        { "paymentSubmission.submittedAt": { $exists: true, $ne: null } },
        { "paymentVerification.status": { $in: ["Verified", "Rejected"] } },
        { paymentStatus: { $in: ["Partially Paid", "Paid", "Unpaid"] } },
      ],
    })
      .populate("query", "queryId destination")
      .populate("agent", "name companyName email")
      .populate("quotation", "pricing.totalAmount totalAmount")
      .populate("paymentVerification.assignedTo", "name companyName email")
      .populate("paymentVerification.reviewedBy", "name companyName")
      .sort({
        "paymentSubmission.submittedAt": -1,
        updatedAt: -1,
      })
      .lean();

    const rows = invoices.map(formatPaymentVerificationRow);
    const scopedRows =
      accessContext.scope === "admin"
        ? rows
        : decoratePaymentVerificationRows(rows, accessContext);

    const summary = {
      totalPayments: scopedRows.length,
      pendingReview: scopedRows.filter((row) => row.workflowStatus === "Pending").length,
      sentToManager: scopedRows.filter((row) => row.workflowStatus === "Manager Review").length,
      verified: scopedRows.filter((row) => row.workflowStatus === "Verified").length,
      rejected: scopedRows.filter((row) => row.workflowStatus === "Rejected").length,
      totalAmount: scopedRows.reduce((sum, row) => sum + Number(row.expectedAmount || row.amount || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        payments: scopedRows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewPaymentVerification = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const { id } = req.params;
    const {
      status,
      rejectionReason = "",
      rejectionRemarks = "",
      reviewRemarks = "",
      rejectionTarget = "",
    } = req.body || {};

    if (!["Verified", "Rejected"].includes(status)) {
      return next(new ApiError(400, "Invalid payment verification status"));
    }

    const invoice = await Invoice.findById(id)
      .populate("query", "queryId destination")
      .populate("agent", "name companyName email")
      .populate("quotation", "pricing.totalAmount totalAmount");

    if (!invoice) {
      return next(new ApiError(404, "Payment record not found"));
    }

    ensureFinanceRecordAccess({
      teamMembers: accessContext.teamMembers,
      accessContext,
      explicitAssigneeIds: [
        invoice?.paymentVerification?.assignedTo,
        invoice?.paymentVerification?.reviewedBy,
      ],
      fallbackSeed: invoice.invoiceNumber || normalizeEntityId(invoice._id),
    });

    if (
      !invoice.paymentSubmission?.utrNumber ||
      !invoice.paymentSubmission?.bankName ||
      !invoice.paymentSubmission?.paymentDate ||
      !invoice.paymentSubmission?.receipt?.url
    ) {
      return next(new ApiError(400, "Payment submission is incomplete for verification"));
    }

    const couponContext = getCouponVerificationContext(invoice);
    const expectedAmount =
      couponContext?.applied && couponContext?.payableAmount >= 0
        ? couponContext.payableAmount
        : resolveOpsConfirmedInvoiceAmount(invoice);
    const receivedAmount = Math.round(
      Number(invoice.paymentSubmission?.amount || 0),
    );
    const paymentOnBehalfOf = String(invoice.paymentSubmission?.onBehalfOf || "").trim();

    if (status === "Verified") {
      if (receivedAmount <= 0) {
        return next(new ApiError(400, "Declared payment amount is required before verification"));
      }

      if (!paymentOnBehalfOf) {
        return next(new ApiError(400, "Payment on behalf of is required before verification"));
      }

      if (receivedAmount !== expectedAmount) {
        return next(
          new ApiError(
            400,
            `Amount mismatch: expected ${expectedAmount} but received ${receivedAmount}${couponContext?.applied ? ` after coupon ${couponContext.code || "adjustment"}` : ""}`,
          ),
        );
      }
    }

    if (status === "Rejected" && !String(rejectionReason || "").trim()) {
      if (
        accessContext.scope === "member" ||
        !String(invoice.paymentVerification?.teamDecisionReason || "").trim()
      ) {
        return next(new ApiError(400, "Rejection reason is required"));
      }
    }

    const normalizedRejectionTarget = String(rejectionTarget || "").trim().toLowerCase();
    if (
      accessContext.scope === "member" &&
      status === "Rejected" &&
      normalizedRejectionTarget &&
      !["agent", "manager"].includes(normalizedRejectionTarget)
    ) {
      return next(new ApiError(400, "Invalid rejection target"));
    }

    const reviewerName = req.user?.name || req.user?.companyName || "Finance Team";
    const assignedFinanceId =
      invoice.paymentVerification?.assignedTo ||
      invoice.paymentVerification?.reviewedBy ||
      req.user.id;
    const assignedFinanceName =
      invoice.paymentVerification?.assignedToName ||
      invoice.paymentVerification?.reviewedByName ||
      reviewerName;
    const assignedFinanceEmail =
      invoice.paymentVerification?.assignedToEmail ||
      req.user?.email ||
      "";
    const reviewedAt = new Date();
    const shouldReturnRejectedPaymentToAgent =
      accessContext.scope === "member" &&
      status === "Rejected" &&
      normalizedRejectionTarget === "agent";

    if (accessContext.scope === "member" && !shouldReturnRejectedPaymentToAgent) {
      invoice.paymentVerification = {
        ...invoice.paymentVerification,
        status: "Pending",
        assignedTo: assignedFinanceId,
        assignedToName: assignedFinanceName,
        assignedToEmail: assignedFinanceEmail,
        assignedAt: invoice.paymentVerification?.assignedAt || reviewedAt,
        rejectionReason: "",
        rejectionRemarks: "",
        reviewedBy: undefined,
        reviewedByName: "",
        reviewedAt: undefined,
        teamDecisionStatus: status,
        teamDecisionReason: status === "Rejected" ? String(rejectionReason).trim() : "",
        teamDecisionRemarks: String(reviewRemarks || rejectionRemarks || "").trim(),
        teamDecisionBy: req.user.id,
        teamDecisionByName: reviewerName,
        teamDecisionAt: reviewedAt,
        sentToManagerAt: reviewedAt,
      };
      invoice.paymentUpdatedBy = req.user.id;
      invoice.paymentStatus = "Partially Paid";
      invoice.remarks =
        status === "Rejected"
          ? [String(rejectionReason).trim(), String(reviewRemarks || rejectionRemarks || "").trim()]
              .filter(Boolean)
              .join(" | ")
          : "Awaiting finance manager approval";
      invoice.paymentAuditTrail.push({
        action: status,
        status: "Pending",
        reason: status === "Rejected" ? String(rejectionReason).trim() : "",
        remarks: [
          status === "Verified"
            ? "Finance executive recommended verification"
            : "Finance executive recommended rejection",
          String(reviewRemarks || rejectionRemarks || "").trim(),
          accessContext.manager?.name
            ? `Sent to manager: ${accessContext.manager.name}`
            : "Sent to finance manager",
        ].filter(Boolean).join(" | "),
        performedBy: req.user.id,
        performedByName: reviewerName,
        performedAt: reviewedAt,
      });

      await invoice.save();

      if (accessContext.manager?._id) {
        await Notification.create({
          user: accessContext.manager._id,
          type: status === "Verified" ? "info" : "warning",
          title: "Finance Team Review Ready",
          message:
            status === "Verified"
              ? `${invoice.invoiceNumber} is recommended for verification by ${reviewerName}.`
              : `${invoice.invoiceNumber} was recommended for rejection by ${reviewerName}.`,
          link: "/financeManager/allTeamTransaction",
          meta: {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            queryId: invoice.query?.queryId || "",
            status: "Pending",
            recommendedStatus: status,
            recommendedBy: reviewerName,
            recommendedAt: reviewedAt,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Review submitted to finance manager successfully",
        data: formatPaymentVerificationRow(invoice.toObject()),
      });
    }

    const finalRejectionReason =
      status === "Rejected"
        ? String(
            rejectionReason ||
            invoice.paymentVerification?.teamDecisionReason ||
            "",
          ).trim()
        : "";
    const finalRejectionRemarks =
      status === "Rejected"
        ? String(
            rejectionRemarks ||
            reviewRemarks ||
            invoice.paymentVerification?.teamDecisionRemarks ||
            "",
          ).trim()
        : "";
    const finalReviewRemarks =
      status === "Verified"
        ? String(reviewRemarks || "").trim()
        : finalRejectionRemarks;

    invoice.paymentVerification = {
      ...invoice.paymentVerification,
      status,
      assignedTo: assignedFinanceId,
      assignedToName: assignedFinanceName,
      assignedToEmail: assignedFinanceEmail,
      assignedAt: invoice.paymentVerification?.assignedAt || reviewedAt,
      rejectionReason: finalRejectionReason,
      rejectionRemarks: finalRejectionRemarks,
      reviewedBy: req.user.id,
      reviewedByName: reviewerName,
      reviewedAt,
      ...(shouldReturnRejectedPaymentToAgent
        ? {
            teamDecisionStatus: "",
            teamDecisionReason: "",
            teamDecisionRemarks: "",
            teamDecisionBy: undefined,
            teamDecisionByName: "",
            teamDecisionAt: undefined,
            sentToManagerAt: undefined,
          }
        : {}),
    };
    invoice.paymentUpdatedBy = req.user.id;
    invoice.paymentStatus = status === "Verified" ? "Paid" : "Unpaid";
    invoice.remarks =
      status === "Rejected"
        ? [finalRejectionReason, finalRejectionRemarks].filter(Boolean).join(" | ")
        : [String("Payment verified by finance"), finalReviewRemarks].filter(Boolean).join(" | ");
    invoice.paymentAuditTrail.push({
      action: status,
      status,
      reason: finalRejectionReason,
      remarks: finalReviewRemarks,
      performedBy: req.user.id,
      performedByName: reviewerName,
      performedAt: reviewedAt,
    });

    await invoice.save();

    const relatedQueryId = invoice.query?._id || invoice.query;
    if (relatedQueryId) {
      const query = await TravelQuery.findById(relatedQueryId);

      if (query) {
        if (status === "Verified") {
          if (query.opsStatus !== "Vouchered") {
            query.opsStatus = "Confirmed";
          }
          query.agentStatus = "Confirmed";
          addQueryLogIfMissing(query, "Payment Verified", "Finance Team");
          addQueryLogIfMissing(query, "Booking Confirmed", "Finance Team");
        } else if (query.opsStatus !== "Vouchered") {
          query.opsStatus = "Invoice_Requested";
          if (query.agentStatus === "Confirmed") {
            query.agentStatus = "Client Approved";
          }
          addQueryLogIfMissing(query, "Payment Rejected", "Finance Team");
        }

        await query.save();
      }
    }

    const notificationPayload =
      status === "Rejected"
        ? {
            type: "warning",
            title: "Payment Rejected",
            message: `${invoice.invoiceNumber} payment was rejected by finance. Reason: ${invoice.paymentVerification.rejectionReason}`,
          }
        : {
            type: "success",
            title: "Payment Verified",
            message: `${invoice.invoiceNumber} payment has been verified by finance for ${formatNotificationCurrency(
              invoice.totalAmount || 0,
            )}.`,
          };

    await Notification.create({
      user: invoice.agent?._id || invoice.agent,
      ...notificationPayload,
      link: "/agent/invoices",
      meta: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || "",
        status,
        reviewedBy: reviewerName,
        reviewedAt,
      },
    });

    res.status(200).json({
      success: true,
      message:
        status === "Verified"
          ? accessContext.scope === "manager"
            ? "Payment verified and approved by finance manager"
            : "Payment verified successfully"
          : shouldReturnRejectedPaymentToAgent
            ? "Payment rejected by finance executive and sent back to agent"
            : accessContext.scope === "manager"
            ? "Payment rejected and sent back by finance manager"
            : "Payment rejected successfully",
      data: formatPaymentVerificationRow(invoice.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

export const sendFinalInvoiceToAgent = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren")
      .populate("agent", "name companyName email")
      .populate("paymentVerification.assignedTo", "name companyName email")
      .populate("paymentVerification.reviewedBy", "name companyName email");

    if (!invoice) {
      return next(new ApiError(404, "Invoice not found"));
    }

    ensureFinanceRecordAccess({
      teamMembers: accessContext.teamMembers,
      accessContext,
      explicitAssigneeIds: [
        invoice?.paymentVerification?.assignedTo,
        invoice?.paymentVerification?.reviewedBy,
      ],
      fallbackSeed: invoice.invoiceNumber || normalizeEntityId(invoice._id),
    });

    const verificationStatus = getPaymentVerificationStatus(invoice);
    if (verificationStatus !== "Verified" || invoice.paymentStatus !== "Paid") {
      return next(new ApiError(400, "Final invoice can be sent only after payment is verified by finance"));
    }

    const agentEmail = String(invoice.agent?.email || "").trim();
    if (!agentEmail) {
      return next(new ApiError(400, "Agent email is missing for this invoice"));
    }

    const senderName = req.user?.name || req.user?.companyName || "Finance Team";
    const sentAt = new Date();

    await sendEmailFinalInvoice(agentEmail, {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt || sentAt,
      destination: invoice.query?.destination || invoice.tripSnapshot?.destination || "",
      agentName: invoice.agent?.companyName || invoice.agent?.name || "Agent",
      agentEmail,
      currency: invoice.currency || invoice.pricingSnapshot?.currency || "INR",
      totalAmount: invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0,
      lineItems: Array.isArray(invoice.lineItems) ? invoice.lineItems : [],
      pricingSnapshot: invoice.pricingSnapshot || {},
      tripSnapshot: {
        queryId: invoice.query?.queryId || invoice.tripSnapshot?.queryId || "",
        destination: invoice.query?.destination || invoice.tripSnapshot?.destination || "",
        startDate: invoice.query?.startDate || invoice.tripSnapshot?.startDate || null,
        endDate: invoice.query?.endDate || invoice.tripSnapshot?.endDate || null,
        numberOfAdults:
          Number(invoice.query?.numberOfAdults || invoice.tripSnapshot?.numberOfAdults || 0),
        numberOfChildren:
          Number(invoice.query?.numberOfChildren || invoice.tripSnapshot?.numberOfChildren || 0),
      },
    });

    invoice.finalInvoiceDispatch = {
      status: "Sent",
      sentAt,
      sentBy: req.user.id,
      sentByName: senderName,
      recipientEmail: agentEmail,
      templateVariant: "finance-word-ledger",
    };

    await invoice.save();

    await Notification.create({
      user: invoice.agent?._id || invoice.agent,
      type: "success",
      title: "Final Invoice Sent",
      message: `${invoice.invoiceNumber} final invoice has been shared by finance.`,
      link: "/agent/bookings",
      meta: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || "",
        sentBy: senderName,
        sentAt,
      },
    });

    res.status(200).json({
      success: true,
      message: "Final invoice sent to agent successfully",
      data: formatPaymentVerificationRow(invoice.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

export const updateInternalInvoiceStatus = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const { id } = req.params;
    const {
      status,
      reason = "",
      notifyAdmin = false,
      mismatchReason = "",
      adminMessage = "",
      payoutReference = "",
      payoutDate,
      payoutBank = "",
      payoutAmount = 0,
    } = req.body || {};

    if (!["Approved", "Rejected", "Paid"].includes(status)) {
      return next(new ApiError(400, "Invalid internal invoice status"));
    }

    const invoice = await InternalInvoice.findById(id)
      .populate("query", "queryId destination")
      .populate("dmc", "name companyName")
      .populate("assignedTo", "name companyName email")
      .populate("agent", "name companyName");

    if (!invoice) {
      return next(new ApiError(404, "Internal invoice not found"));
    }

    ensureFinanceRecordAccess({
      teamMembers: accessContext.teamMembers,
      accessContext,
      explicitAssigneeIds: [invoice.assignedTo, invoice.reviewedBy],
      fallbackSeed: invoice.invoiceNumber || normalizeEntityId(invoice._id),
    });

    const reviewerName = req.user?.name || req.user?.companyName || "Finance Team";
    const reviewedAt = new Date();

    if (status === "Approved") {
      invoice.status = "Approved";
      invoice.financeNotes = String(reason || "").trim() || "Invoice validated by finance manager";
    }

    if (status === "Rejected") {
      if (!String(reason || "").trim()) {
        return next(new ApiError(400, "Rejection reason is required"));
      }

      invoice.status = "Rejected";
      invoice.financeNotes = String(reason).trim();
    }

    if (status === "Paid") {
      if (!payoutReference || !payoutDate || !payoutBank || Number(payoutAmount || 0) <= 0) {
        return next(new ApiError(400, "Payout reference, date, bank, and amount are required"));
      }

      const expectedAmount = Number(invoice.summary?.grandTotal || 0);
      const submittedAmount = Number(payoutAmount || 0);
      const roundedExpectedAmount = Math.round(expectedAmount);
      const roundedSubmittedAmount = Math.round(submittedAmount);

      if (roundedSubmittedAmount !== roundedExpectedAmount) {
        return next(new ApiError(400, "Payout amount does not match invoice total"));
      }

      invoice.status = "Paid";
      invoice.payoutReference = String(payoutReference).trim();
      invoice.payoutDate = new Date(payoutDate);
      invoice.payoutBank = String(payoutBank).trim();
      invoice.payoutAmount = roundedSubmittedAmount;
      invoice.financeNotes = invoice.financeNotes || "Payout confirmed by finance";
    }

    if (!invoice.assignedTo && req.user?.role === "finance_partner") {
      invoice.assignedTo = req.user.id;
      invoice.assignedToName = reviewerName;
      invoice.assignedToEmail = req.user?.email || "";
      invoice.assignedAt = reviewedAt;
    }

    invoice.reviewedBy = req.user.id;
    invoice.reviewedByName = reviewerName;
    invoice.reviewedAt = reviewedAt;

    await invoice.save();

    const notificationPayload =
      status === "Rejected"
        ? {
            type: "warning",
            title: "Internal Invoice Rejected",
            message: `${invoice.invoiceNumber} was rejected by finance. Reason: ${invoice.financeNotes}`,
          }
        : status === "Approved"
          ? {
              type: "success",
              title: "Internal Invoice Validated",
              message: `${invoice.invoiceNumber} was validated by finance and is ready for payout processing.`,
            }
          : {
              type: "success",
              title: "Internal Invoice Paid",
              message: `${invoice.invoiceNumber} has been paid by finance for ${formatNotificationCurrency(
                invoice.payoutAmount || invoice.summary?.grandTotal || 0,
                invoice.items?.[0]?.currency || "INR",
              )}.`,
            };

    await Notification.create({
      user: invoice.dmc?._id || invoice.dmc,
      ...notificationPayload,
      link: "/dmc/confirmation",
      meta: {
        internalInvoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || invoice.queryCode || "",
        status,
        payoutAmount: invoice.payoutAmount || 0,
        payoutBank: invoice.payoutBank || "",
        payoutDate: invoice.payoutDate || null,
      },
    });

    const shouldNotifyAdmin = status === "Rejected" && Boolean(notifyAdmin);
    if (shouldNotifyAdmin) {
      const adminUsers = await Auth.find({
        role: "admin",
        isDeleted: { $ne: true },
        accountStatus: { $ne: "Inactive" },
      }).select("_id");

      const normalizedMismatchReason = String(mismatchReason || "").trim();
      const normalizedAdminMessage = String(adminMessage || "").trim();
      const escalationActor = req.user?.name || req.user?.companyName || reviewerName;
      const escalationMessageParts = [
        `${invoice.invoiceNumber} was escalated by ${escalationActor} for admin review.`,
        normalizedMismatchReason ? `Reason for mismatch: ${normalizedMismatchReason}.` : "",
        normalizedAdminMessage ? `Finance note: ${normalizedAdminMessage}` : "",
      ].filter(Boolean);

      if (adminUsers.length) {
        await Notification.insertMany(
          adminUsers.map((adminUser) => ({
            user: adminUser._id,
            type: "warning",
            title: "Internal invoice mismatch escalated",
            message: escalationMessageParts.join(" "),
            link: "/finance/internalInvoice",
            meta: {
              internalInvoiceId: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              queryId: invoice.query?._id || invoice.query || null,
              queryNumber: invoice.query?.queryId || invoice.queryCode || "",
              mismatchReason: normalizedMismatchReason,
              adminMessage: normalizedAdminMessage,
              financeNotes: invoice.financeNotes || "",
              source: "finance_internal_invoice_mismatch",
            },
          })),
        );
      }
    }

    const quotation = await Quotation.findOne({ queryId: invoice.query?._id || invoice.query })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: `Internal invoice marked as ${status.toLowerCase()}`,
      data: formatInternalInvoiceRow(invoice.toObject(), quotation),
    });
  } catch (error) {
    next(error);
  }
};
