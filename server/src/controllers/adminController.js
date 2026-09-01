import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravelQuery.model.js";
import RateContract from "../models/rateContract.model.js"
import Invoice from "../models/invoice.model.js"
import InternalInvoice from "../models/internalInvoice.model.js";
import DmcSettlementBatch from "../models/dmcSettlementBatch.model.js";
import AdminOverrideCase from "../models/adminOverrideCase.model.js";
import Notification from "../models/notification.model.js";
import Quotation from "../models/quotation.model.js";
import Voucher from "../models/voucher.model.js";
import Confirmation from "../models/dmcConfirmation.js";
import { sendAccountDeletionMail, sendAgentApprovalMail, sendAgentRejectionMail, sendTeamMemberCredentialsMail } from "../services/sendEmail.js";
import { sendAgentPaymentReceiptMail, sendDmcPayoutReceiptMail, sendEmailFinalInvoice } from "../services/emailService.js";
import { getEmailDeliveryErrorMessage } from "../services/mailer.js";
import { getEmailValidationError } from "../utils/emailValidation.js";
import { normalizeAccessExpiry } from "../utils/accessExpiry.js";
import { generateAgentPaymentReceiptPdf, generatePayoutReceiptPdf, numberToWords } from "../services/payoutReceiptPdfService.js";
import { analyzeInvoiceFile } from "../services/invoiceExtractionService.js";
import { buildInvoiceLineItems } from "./opsController.js";
import {
  decorateFinanceAssignment,
  filterRowsByFinanceAccess,
  getFinanceAccessContext,
  normalizeEntityId,
  resolveFinanceAssigneeId,
} from "../services/financeTeamScopeService.js";
import { createNotification } from "../services/notificationDispatchService.js";
import { notifyTeamMemberCreationStakeholders } from "../services/teamMemberNotificationService.js";
import bcrypt from "bcrypt"
import fs from "fs";
import path from "path";

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


const createFinanceSideNotification = (req, payload) =>
  createNotification(payload, {
    mirrorToAdmins: true,
    sourceRole: req.user?.role,
    sourceUserId: req.user?.id || req.user?._id || null,
    sourceName: req.user?.name || req.user?.companyName || "Finance Team",
  });


const buildEmailDeliveryNote = (email = "") =>
  ` It was sent to your email${email ? ` (${email})` : ""}.`;

const getFinanceDispatchNote = (
  dispatchChannel = "",
  { email = "", phone = "", documentLabel = "document" } = {},
) => {
  const normalizedChannel = String(dispatchChannel || "").trim().toUpperCase();

  if (normalizedChannel === "EMAIL") {
    return ` ${documentLabel} was sent by email${email ? ` (${email})` : ""}.`;
  }

  if (normalizedChannel === "WHATSAPP") {
    return ` ${documentLabel} is ready to share on WhatsApp${phone ? ` (${phone})` : ""}.`;
  }

  if (normalizedChannel === "PDF") {
    return ` ${documentLabel} PDF is ready to download.`;
  }

  return "";
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

const formatManagedUser = (user) => {
  const lastActiveDate = user.lastActiveAt || user.lastLoginAt;
  const lastActiveMs = lastActiveDate ? new Date(lastActiveDate).getTime() : 0;
  const isOnline = Boolean(lastActiveMs && (Date.now() - lastActiveMs) < 120000); // 2 minutes real-time window

  return {
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
    lastActiveAt: user.lastActiveAt || null,
    isOnline: isOnline,
    role: user.role,
    roleLabel: BACKEND_ROLE_TO_FRONTEND[user.role] || user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    creditDays: Array.isArray(user.creditDays) ? user.creditDays : (user.creditDays !== undefined ? [user.creditDays] : [7]),
  };
};

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

const OVERRIDE_CASE_TARGET_LABELS = {
  ops_query: "Ops Escalation",
  agent_approval: "Agent Approval",
  payment_verification: "Payment Verification",
  internal_invoice: "Internal Invoice",
};

const OVERRIDE_STATUS_BY_DECISION = {
  approve: "Overridden",
  reject: "Rejected",
  resolve: "Resolved",
};

const normalizeOverrideDecision = (decision = "") =>
  String(decision || "").trim().toLowerCase();

const formatAdminOverrideCase = (entry = {}) => ({
  id: entry._id || `${entry.targetType}-${entry.targetId}`,
  targetType: entry.targetType,
  targetId: entry.targetId,
  reference: entry.reference || "-",
  sourceModule: entry.sourceModule || OVERRIDE_CASE_TARGET_LABELS[entry.targetType] || "System",
  title: entry.title || "Admin override case",
  description: entry.description || "",
  status: entry.status || "Open",
  requestedByName: entry.requestedByName || "",
  requestedAt: entry.requestedAt || entry.createdAt || null,
  requestedAtLabel: formatRelativeTime(entry.requestedAt || entry.createdAt || entry.updatedAt),
  resolvedByName: entry.resolvedByName || "",
  resolvedAt: entry.resolvedAt || null,
  decision: entry.decision || "",
  resolutionNote: entry.resolutionNote || "",
});

const buildDerivedOverrideCase = (payload = {}) =>
  formatAdminOverrideCase({
    status: "Open",
    requestedAt: payload.requestedAt || new Date(),
    ...payload,
  });

const syncAdminOverrideCase = async ({
  targetType,
  targetId,
  reference,
  sourceModule,
  title,
  description,
  requestedByName = "",
  decision,
  resolutionNote,
  actorId,
  actorName,
}) => {
  const normalizedDecision = normalizeOverrideDecision(decision);
  const status = OVERRIDE_STATUS_BY_DECISION[normalizedDecision] || "Resolved";
  const now = new Date();

  return AdminOverrideCase.findOneAndUpdate(
    { targetType, targetId },
    {
      $set: {
        targetType,
        targetId,
        reference,
        sourceModule,
        title,
        description,
        requestedByName,
        status,
        decision: normalizedDecision,
        resolutionNote,
        resolvedBy: actorId || null,
        resolvedByName: actorName,
        resolvedAt: now,
      },
      $setOnInsert: {
        requestedAt: now,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};



const ensureFinanceApiAccess = async (req) => {
  if (!["finance_partner", "finance_manager", "admin"].includes(req.user?.role)) {
    throw new ApiError(403, "Not authorized");
  }

  return getFinanceAccessContext(req.user);
};

const parseFinanceJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseFinanceDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addFinanceCreditDays = (value, daysToAdd = 0) => {
  const parsed = parseFinanceDateOrNull(value);
  if (!parsed) return null;
  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed;
};

const buildManualUploadedInvoiceDocument = (file) => {
  if (!file?.path) return null;
  const normalizedFilePath = String(file.path).replace(/\\/g, "/");
  const absoluteFilePath = path.join(process.cwd(), normalizedFilePath);
  const fileSizeKb =
    fs.existsSync(absoluteFilePath)
      ? Math.max(1, Math.round(fs.statSync(absoluteFilePath).size / 1024))
      : null;

  return {
    name: file.originalname || path.basename(file.path),
    filePath: `/${normalizedFilePath.replace(/^\/+/, "")}`,
    size: fileSizeKb ? `${fileSizeKb} kB` : "",
    mimeType: file.mimetype || "",
    kind: "invoice",
  };
};

export const previewManualInvoiceExtraction = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ApiError(400, "Upload an invoice file to parse"));
    }

    const claimedSummary = parseFinanceJsonField(req.body?.claimedSummary, {});
    const extraction = await analyzeInvoiceFile(req.file, { claimedSummary });

    await fs.promises.unlink(req.file.path).catch(() => null);

    res.status(200).json({
      success: true,
      message: extraction.status === "parsed"
        ? "Invoice parsed successfully"
        : "Invoice uploaded, but automatic extraction needs manual review",
      data: extraction,
    });
  } catch (error) {
    next(error);
  }
};

const MANAGED_USER_NOTIFICATION_LINKS = {
  admin: "/admin/user-management",
  operations: "/ops/dashboard",
  finance_partner: "/finance/dashboard",
  dmc_partner: "/dmc/dashboard",
  operation_manager: "/operationManager/operationManagerDashboard",
  finance_manager: "/financeManager/financeManagerDashboard",
};

const getManagedUserNotificationLink = (role = "") =>
  MANAGED_USER_NOTIFICATION_LINKS[String(role || "").trim()] || "";

const notifyManagedUserAccountEvent = async (user, payload = {}) => {
  if (!user?._id) return;

  const {
    type = "info",
    title = "Account Updated",
    message = "Your account details were updated.",
    meta = {},
  } = payload;

  await Notification.create({
    user: user._id,
    type,
    title,
    message,
    link: getManagedUserNotificationLink(user.role),
    meta: {
      kind: "managed_user_account",
      role: user.role,
      ...meta,
    },
  });
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
    const normalizedAccessExpiry = normalizeAccessExpiry(accessExpiry);

    if (!trimmedName || !normalizedEmail || !normalizedPhone || !normalizedRole || !normalizedDepartment || !normalizedDesignation) {
      return next(new ApiError(400, "Name, email, phone, role, department, and designation are required"));
    }

    const emailValidationError = getEmailValidationError(normalizedEmail);
    if (emailValidationError) {
      return next(new ApiError(400, emailValidationError));
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

    await notifyTeamMemberCreationStakeholders({
      createdUser,
      actorUserId: req.user?.id || req.user?._id || "",
      actorRole: req.user?.role || "admin",
      actorName: req.user?.name || "Admin",
      managerRef: normalizedManager,
      expectedManagerRoles:
        normalizedRole === "operations"
          ? ["operation_manager"]
          : normalizedRole === "finance_partner"
            ? ["finance_manager"]
            : [],
      includeAdminBroadcast: false,
    });

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
    const normalizedAccessExpiry = normalizeAccessExpiry(accessExpiry);

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

    await notifyManagedUserAccountEvent(user, {
      title: "Profile Updated",
      message: "Your account profile, role, or access details were updated by admin.",
      meta: {
        action: "updated",
        accountStatus: normalizedAccountStatus,
      },
    });

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

    await notifyManagedUserAccountEvent(user, {
      type: nextStatus === "Active" ? "success" : "warning",
      title: nextStatus === "Active" ? "Account Activated" : "Account Deactivated",
      message:
        nextStatus === "Active"
          ? "Your account access has been activated by admin."
          : "Your account access has been deactivated by admin.",
      meta: {
        action: "status_changed",
        accountStatus: nextStatus,
      },
    });

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

    await notifyManagedUserAccountEvent(user, {
      type: "success",
      title: "Account Restored",
      message: "Your account has been restored and is active again.",
      meta: {
        action: "restored",
        accountStatus: "Active",
      },
    });

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

export const resolveAdminOverrideCase = async (req, res, next) => {
  try {
    ensureAdminAccess(req);

    const { targetType, id } = req.params;
    const decision = normalizeOverrideDecision(req.body?.decision || "resolve");
    const resolutionNote = String(req.body?.resolutionNote || req.body?.note || "").trim();

    if (!Object.prototype.hasOwnProperty.call(OVERRIDE_CASE_TARGET_LABELS, targetType)) {
      return next(new ApiError(400, "Invalid override case type"));
    }

    if (!["approve", "reject", "resolve"].includes(decision)) {
      return next(new ApiError(400, "Invalid override decision"));
    }

    if (!resolutionNote) {
      return next(new ApiError(400, "Resolution note is required"));
    }

    const actorName = req.user?.name || req.user?.email || "Super Admin";
    const actorId = req.user?.id || req.user?._id || null;
    const resolvedAt = new Date();
    let casePayload = null;

    if (targetType === "ops_query") {
      const query = await TravelQuery.findById(id);
      if (!query) return next(new ApiError(404, "Query not found"));

      const currentAdminCoordination =
        query.adminCoordination?.toObject?.() || query.adminCoordination || {};
      const existingThread = Array.isArray(currentAdminCoordination.thread)
        ? currentAdminCoordination.thread
        : [];

      query.activityLog = Array.isArray(query.activityLog) ? query.activityLog : [];
      query.activityLog.push({
        action: decision === "reject" ? "Admin Dispute Rejected" : "Admin Override Resolved",
        performedBy: actorName,
        timestamp: resolvedAt,
      });
      query.adminCoordination = {
        ...currentAdminCoordination,
        status: "replied",
        lastAdminReply: resolutionNote,
        lastAdminReplyAt: resolvedAt,
        lastAdminReplyBy: actorId,
        lastAdminReplyByName: actorName,
        thread: [
          ...existingThread,
          {
            senderRole: "admin",
            senderId: actorId,
            senderName: actorName,
            message: `[${decision.toUpperCase()}] ${resolutionNote}`,
            createdAt: resolvedAt,
          },
        ],
      };
      await query.save();

      const opsRecipientId = query.adminCoordination?.lastOpsMessageBy || query.assignedTo || null;
      if (opsRecipientId) {
        await Notification.create({
          user: opsRecipientId,
          type: decision === "reject" ? "warning" : "success",
          title: "Admin override resolved",
          message: `${actorName} resolved ${query.queryId}: ${resolutionNote}`,
          link: "/ops/order-acceptance",
          meta: {
            queryId: query._id,
            queryNumber: query.queryId,
            decision,
            resolutionNote,
          },
        });
      }

      casePayload = {
        targetType,
        targetId: query._id,
        reference: query.queryId || String(query._id),
        sourceModule: "Operations",
        title: "Ops escalation/dispute",
        description: query.adminCoordination?.lastOpsMessage || query.destination || "",
        requestedByName: query.adminCoordination?.lastOpsMessageByName || "Operations",
      };
    }

    if (targetType === "agent_approval") {
      const agent = await Auth.findById(id);
      if (!agent || agent.role !== "agent") return next(new ApiError(404, "Agent not found"));
      if (decision === "resolve") {
        return next(new ApiError(400, "Choose approve or reject for agent approval override"));
      }

      if (decision === "approve") {
        agent.isApproved = true;
        agent.status = "approve";
        agent.accountStatus = "Active";
        agent.rejectionReason = "";
        await sendAgentApprovalMail(agent.email, {
          name: agent.name,
          companyName: agent.companyName,
        });
      } else {
        agent.isApproved = false;
        agent.status = "rejected";
        agent.accountStatus = "Inactive";
        agent.rejectionReason = resolutionNote;
        await sendAgentRejectionMail(agent.email, {
          name: agent.name,
          companyName: agent.companyName,
          reason: resolutionNote,
        });
      }

      agent.reviewedAt = resolvedAt;
      agent.reviewedBy = actorName;
      agent.reviewedById = String(actorId || "");
      await agent.save();

      casePayload = {
        targetType,
        targetId: agent._id,
        reference: agent.companyName || agent.name || agent.email,
        sourceModule: "Agent Registration",
        title: "Agent approval override",
        description: `${agent.companyName || agent.name || "Agent"} registration reviewed by Super Admin`,
        requestedByName: agent.companyName || agent.name || "Agent",
      };
    }

    if (targetType === "payment_verification") {
      const invoice = await Invoice.findById(id)
        .populate("query", "queryId destination")
        .populate("agent", "name companyName email phone");
      if (!invoice) return next(new ApiError(404, "Payment record not found"));
      if (decision === "resolve") {
        return next(new ApiError(400, "Choose approve or reject for payment verification override"));
      }

      const receivedAmount = Math.round(Number(invoice.paymentSubmission?.amount || 0));
      const expectedAmount = getCouponVerificationContext(invoice)?.payableAmount >= 0
        ? getCouponVerificationContext(invoice).payableAmount
        : resolveOpsConfirmedInvoiceAmount(invoice);

      if (decision === "approve" && receivedAmount <= 0) {
        return next(new ApiError(400, "Payment amount is required before approval override"));
      }

      const verificationStatus = decision === "approve" ? "Verified" : "Rejected";
      const isFullPayment = receivedAmount >= Math.round(Number(expectedAmount || invoice.totalAmount || 0));
      invoice.paymentVerification = {
        ...invoice.paymentVerification,
        status: verificationStatus,
        escalatedToAdmin: false,
        rejectionReason: decision === "reject" ? resolutionNote : "",
        rejectionRemarks: decision === "reject" ? "Rejected by Super Admin override" : "",
        reviewedBy: actorId,
        reviewedByName: actorName,
        reviewedAt: resolvedAt,
        teamDecisionStatus: "",
        teamDecisionReason: "",
        teamDecisionRemarks: "",
        teamDecisionBy: undefined,
        teamDecisionByName: "",
        teamDecisionAt: undefined,
        sentToManagerAt: undefined,
      };
      invoice.paymentUpdatedBy = actorId;
      invoice.paymentStatus = decision === "approve"
        ? isFullPayment
          ? "Paid"
          : "Partially Paid"
        : "Unpaid";
      invoice.remarks = decision === "approve"
        ? `Payment approved by Super Admin override: ${resolutionNote}`
        : `Payment rejected by Super Admin override: ${resolutionNote}`;
      invoice.paymentAuditTrail = Array.isArray(invoice.paymentAuditTrail) ? invoice.paymentAuditTrail : [];
      invoice.paymentAuditTrail.push({
        action: verificationStatus,
        status: verificationStatus,
        reason: decision === "reject" ? resolutionNote : "",
        remarks: `Super Admin override: ${resolutionNote}`,
        performedBy: actorId,
        performedByName: actorName,
        performedAt: resolvedAt,
      });
      await invoice.save();

      if (invoice.query?._id) {
        const query = await TravelQuery.findById(invoice.query._id);
        if (query) {
          if (decision === "approve" && isFullPayment) {
            query.opsStatus = query.opsStatus === "Vouchered" ? "Payment_Completed" : "Confirmed";
            query.agentStatus = "Confirmed";
            addQueryLogIfMissing(query, "Payment Override Approved", actorName);
          } else if (decision === "approve") {
            if (!["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
              query.opsStatus = "Invoice_Requested";
            }
            query.agentStatus = "Confirmed";
            addQueryLogIfMissing(query, "Partial Payment Override Approved", actorName);
            addQueryLogIfMissing(query, "Booking Confirmed", actorName);
          } else {
            addQueryLogIfMissing(query, "Payment Override Rejected", actorName);
          }
          await query.save();
        }
      }

      await createNotification({
        user: invoice.agent?._id || invoice.agent,
        type: decision === "approve" ? "success" : "warning",
        title: decision === "approve" ? "Payment Override Approved" : "Payment Override Rejected",
        message: `${invoice.invoiceNumber} was ${decision === "approve" ? "approved" : "rejected"} by Super Admin override.`,
        link: "/agent/invoices",
        meta: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          queryId: invoice.query?.queryId || "",
          decision,
          resolutionNote,
        },
      });

      casePayload = {
        targetType,
        targetId: invoice._id,
        reference: invoice.invoiceNumber,
        sourceModule: "Finance",
        title: "Agent payment verification override",
        description: `${invoice.agent?.companyName || invoice.agent?.name || "Agent"} - ${formatNotificationCurrency(receivedAmount)}`,
        requestedByName: invoice.paymentVerification?.assignedToName || invoice.paymentVerification?.reviewedByName || "Finance Team",
      };
    }

    if (targetType === "internal_invoice") {
      const invoice = await InternalInvoice.findById(id).populate("dmc", "name companyName email");
      if (!invoice) return next(new ApiError(404, "Internal invoice not found"));
      if (decision === "approve") {
        invoice.status = "Approved";
      } else if (decision === "reject") {
        invoice.status = "Rejected";
      }
      invoice.financeNotes = `Super Admin ${decision}: ${resolutionNote}`;
      invoice.reviewedBy = actorId;
      invoice.reviewedByName = actorName;
      invoice.reviewedAt = resolvedAt;
      invoice.escalatedToAdmin = false;
      await invoice.save();

      await createNotification({
        user: invoice.dmc?._id || invoice.dmc,
        type: decision === "reject" ? "warning" : "success",
        title: decision === "reject" ? "Invoice Override Rejected" : "Invoice Override Resolved",
        message: `${invoice.invoiceNumber} was ${decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "resolved"} by Super Admin.`,
        link: "/dmc/confirmation",
        meta: {
          internalInvoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          decision,
          resolutionNote,
        },
      });

      casePayload = {
        targetType,
        targetId: invoice._id,
        reference: invoice.invoiceNumber,
        sourceModule: "DMC/Finance",
        title: "Internal invoice dispute",
        description: `${invoice.dmc?.companyName || invoice.dmc?.name || invoice.supplierName || "DMC"} - ${formatNotificationCurrency(invoice.summary?.grandTotal || 0)}`,
        requestedByName: invoice.assignedToName || invoice.reviewedByName || "Finance Team",
      };
    }

    const overrideCase = await syncAdminOverrideCase({
      ...casePayload,
      decision,
      resolutionNote,
      actorId,
      actorName,
    });

    return res.status(200).json({
      success: true,
      message: "Super Admin override resolved successfully",
      overrideCase: formatAdminOverrideCase(overrideCase.toObject()),
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

    const [queries, agents, managedUsers, vouchers, invoices, internalInvoices, confirmations, persistedOverrideCases] = await Promise.all([
      TravelQuery.find()
        .populate("agent", "name companyName email")
        .populate("assignedTo", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      Auth.find({ role: "agent" })
        .select("name companyName email status isApproved accountStatus createdAt updatedAt")
        .lean(),
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
        .populate("query", "queryId destination startDate endDate opsStatus agentStatus")
        .lean(),
      InternalInvoice.find().lean(),
      Confirmation.find()
        .populate("dmcId", "name companyName")
        .lean(),
      AdminOverrideCase.find()
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(30)
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
    const activeBookingStatuses = new Set(["Booking_Accepted", "Invoice_Requested", "Confirmed", "Vouchered", "Payment_Completed"]);

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

    const masterBookingRows = activeBookings.map((query) => {
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

    const closedOverrideKeys = new Set(
      persistedOverrideCases
        .filter((entry) => entry.status && entry.status !== "Open")
        .map((entry) => `${entry.targetType}:${String(entry.targetId || "")}`),
    );
    const overrideCaseMap = new Map();
    const addOverrideCase = (entry) => {
      if (!entry?.targetType || !entry?.targetId) return;
      const key = `${entry.targetType}:${String(entry.targetId || "")}`;
      if (closedOverrideKeys.has(key) && entry.status === "Open") return;
      if (!overrideCaseMap.has(key)) overrideCaseMap.set(key, entry);
    };

    persistedOverrideCases.forEach((entry) => addOverrideCase(formatAdminOverrideCase(entry)));

    escalationQueries.forEach((query) => addOverrideCase(buildDerivedOverrideCase({
      targetType: "ops_query",
      targetId: query._id,
      reference: query.queryId || String(query._id),
      sourceModule: "Operations",
      title: "Ops escalation/dispute",
      description: query.adminCoordination?.lastOpsMessage || query.destination || "",
      requestedByName: query.adminCoordination?.lastOpsMessageByName || "Operations",
      requestedAt: query.adminCoordination?.lastOpsMessageAt || query.updatedAt || query.createdAt,
    })));

    agents
      .filter((agent) => agent.status === "pending")
      .forEach((agent) => addOverrideCase(buildDerivedOverrideCase({
        targetType: "agent_approval",
        targetId: agent._id,
        reference: agent.companyName || agent.name || agent.email,
        sourceModule: "Agent Registration",
        title: "Agent approval override",
        description: `${agent.companyName || agent.name || "Agent"} is awaiting Super Admin review`,
        requestedByName: agent.companyName || agent.name || "Agent",
        requestedAt: agent.createdAt || agent.updatedAt,
      })));

    invoices
      .filter((invoice) =>
        invoice.paymentSubmission?.submittedAt &&
        invoice.paymentVerification?.status === "Pending" &&
        invoice.paymentVerification?.escalatedToAdmin === true,
      )
      .forEach((invoice) => addOverrideCase(buildDerivedOverrideCase({
        targetType: "payment_verification",
        targetId: invoice._id,
        reference: invoice.invoiceNumber,
        sourceModule: "Finance",
        title: "Agent payment verification override",
        description: `${invoice.agent?.companyName || invoice.agent?.name || "Agent"} - ${formatNotificationCurrency(invoice.paymentSubmission?.amount || invoice.totalAmount || 0)}`,
        requestedByName: invoice.paymentVerification?.assignedToName || invoice.paymentVerification?.reviewedByName || "Finance Team",
        requestedAt: invoice.paymentSubmission?.submittedAt || invoice.updatedAt || invoice.createdAt,
      })));

    internalInvoices
      .filter((invoice) => invoice.escalatedToAdmin === true)
      .forEach((invoice) => addOverrideCase(buildDerivedOverrideCase({
        targetType: "internal_invoice",
        targetId: invoice._id,
        reference: invoice.invoiceNumber,
        sourceModule: "DMC/Finance",
        title: "Internal invoice dispute",
        description: `${invoice.dmcName || invoice.supplierName || "DMC"} - ${formatNotificationCurrency(invoice.summary?.grandTotal || 0)}`,
        requestedByName: invoice.assignedToName || invoice.reviewedByName || "Finance Team",
        requestedAt: invoice.submittedAt || invoice.updatedAt || invoice.createdAt,
      })));

    const overrideCaseRows = Array.from(overrideCaseMap.values())
      .sort(
        (left, right) =>
          (left.status === "Open" ? -1 : 1) - (right.status === "Open" ? -1 : 1) ||
          new Date(right.requestedAt || right.resolvedAt || 0) - new Date(left.requestedAt || left.resolvedAt || 0),
      )
      .slice(0, 18);

    const monthRevenueBuckets = monthBuckets.map((bucket) => ({ ...bucket }));
    const monthQueryBuckets = monthBuckets.map((bucket) => ({ ...bucket }));
    const monthVoucherBuckets = monthBuckets.map((bucket) => ({ ...bucket }));
    const monthBookingBuckets = monthBuckets.map((bucket) => ({ ...bucket }));

    invoices.forEach((invoice) => {
      const invoiceDate = getAnalyticsInvoiceDate(invoice);
      const bucket = monthRevenueBuckets.find((item) => isWithinRange(invoiceDate, item.start, item.end));
      if (bucket) {
        bucket.value += Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0);
      }
    });

    queries.forEach((query) => {
      const queryDate = new Date(query.createdAt);
      const queryBucket = monthQueryBuckets.find((item) => isWithinRange(queryDate, item.start, item.end));
      if (queryBucket) queryBucket.value += 1;

      if (["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
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
      .filter((invoice) => isWithinRange(getAnalyticsInvoiceDate(invoice), currentMonthStart, now))
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount || invoice.pricingSnapshot?.grandTotal || 0), 0);

    const monthlyQueries = queries.filter((query) => isWithinRange(query.createdAt, currentMonthStart, now));
    const monthlyConfirmedBookings = monthlyQueries.filter((query) =>
      ["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus),
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

    // =========================================================================
    // Booking Trends Comparison: Last Year Same Month & Same Quarter (YoY & QoQ)
    // =========================================================================
    const calculateTrendPct = (current = 0, previous = 0) => {
      const c = Number(current) || 0;
      const p = Number(previous) || 0;
      if (p === 0) return c > 0 ? 100 : 0;
      return Number((((c - p) / p) * 100).toFixed(1));
    };

    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0 to 11
    const lastYear = currentYear - 1;
    const currentQuarterIndex = Math.floor(currentMonthIndex / 3); // 0 (Q1) to 3 (Q4)

    const confirmedBookingQueries = queries.filter((query) =>
      activeBookingStatuses.has(query.opsStatus) ||
      ["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus) ||
      ["Confirmed", "Client Approved"].includes(query.agentStatus)
    );

    const getQueryBookingRevenue = (query) => {
      const qKey = String(query._id || query.queryId || "").trim();
      const inv = invoiceByQueryId[qKey];
      return Number(inv?.totalAmount || inv?.pricingSnapshot?.grandTotal || query.customerBudget || 0);
    };

    const getQueryReferenceDate = (query) => {
      return new Date(query.createdAt || query.updatedAt || query.startDate || now);
    };

    const filterBookingsInWindow = (winStart, winEnd) => {
      return confirmedBookingQueries.filter((query) => {
        const d = getQueryReferenceDate(query);
        return isWithinRange(d, winStart, winEnd);
      });
    };

    // 1. Monthly Comparison (Same Month Last Year & Previous Month MoM)
    const curMonthRangeStart = new Date(currentYear, currentMonthIndex, 1, 0, 0, 0, 0);
    const curMonthRangeEnd = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999);
    const lastYearMonthRangeStart = new Date(lastYear, currentMonthIndex, 1, 0, 0, 0, 0);
    const lastYearMonthRangeEnd = new Date(lastYear, currentMonthIndex + 1, 0, 23, 59, 59, 999);
    const prevMonthRangeStart = new Date(currentYear, currentMonthIndex - 1, 1, 0, 0, 0, 0);
    const prevMonthRangeEnd = new Date(currentYear, currentMonthIndex, 0, 23, 59, 59, 999);

    const curMonthBookingsList = filterBookingsInWindow(curMonthRangeStart, curMonthRangeEnd);
    const lastYearMonthBookingsList = filterBookingsInWindow(lastYearMonthRangeStart, lastYearMonthRangeEnd);
    const prevMonthBookingsList = filterBookingsInWindow(prevMonthRangeStart, prevMonthRangeEnd);

    const curMonthBookingsCount = curMonthBookingsList.length;
    const lastYearMonthBookingsCount = lastYearMonthBookingsList.length;
    const prevMonthBookingsCount = prevMonthBookingsList.length;

    const curMonthBookingRevenue = curMonthBookingsList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
    const lastYearMonthBookingRevenue = lastYearMonthBookingsList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
    const prevMonthBookingRevenue = prevMonthBookingsList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);

    const monthYoYGrowth = calculateTrendPct(curMonthBookingsCount, lastYearMonthBookingsCount);
    const monthMoMGrowth = calculateTrendPct(curMonthBookingsCount, prevMonthBookingsCount);
    const monthRevenueYoYGrowth = calculateTrendPct(curMonthBookingRevenue, lastYearMonthBookingRevenue);

    const monthNamesList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const curMonthName = monthNamesList[currentMonthIndex];
    const prevMonthName = monthNamesList[currentMonthIndex === 0 ? 11 : currentMonthIndex - 1];

    // 2. Quarterly Comparison (Same Quarter Last Year & Previous Quarter QoQ)
    const quarterStartMonth = currentQuarterIndex * 3;
    const curQuarterRangeStart = new Date(currentYear, quarterStartMonth, 1, 0, 0, 0, 0);
    const curQuarterRangeEnd = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59, 999);
    const lastYearQuarterRangeStart = new Date(lastYear, quarterStartMonth, 1, 0, 0, 0, 0);
    const lastYearQuarterRangeEnd = new Date(lastYear, quarterStartMonth + 3, 0, 23, 59, 59, 999);

    const prevQYear = currentQuarterIndex === 0 ? currentYear - 1 : currentYear;
    const prevQStartMonth = currentQuarterIndex === 0 ? 9 : (currentQuarterIndex - 1) * 3;
    const prevQuarterRangeStart = new Date(prevQYear, prevQStartMonth, 1, 0, 0, 0, 0);
    const prevQuarterRangeEnd = new Date(prevQYear, prevQStartMonth + 3, 0, 23, 59, 59, 999);

    const curQuarterBookingsList = filterBookingsInWindow(curQuarterRangeStart, curQuarterRangeEnd);
    const lastYearQuarterBookingsList = filterBookingsInWindow(lastYearQuarterRangeStart, lastYearQuarterRangeEnd);
    const prevQuarterBookingsList = filterBookingsInWindow(prevQuarterRangeStart, prevQuarterRangeEnd);

    const curQuarterBookingsCount = curQuarterBookingsList.length;
    const lastYearQuarterBookingsCount = lastYearQuarterBookingsList.length;
    const prevQuarterBookingsCount = prevQuarterBookingsList.length;

    const curQuarterBookingRevenue = curQuarterBookingsList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
    const lastYearQuarterBookingRevenue = lastYearQuarterBookingsList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
    const prevQuarterBookingRevenue = prevQuarterBookingsList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);

    const quarterYoYGrowth = calculateTrendPct(curQuarterBookingsCount, lastYearQuarterBookingsCount);
    const quarterQoQGrowth = calculateTrendPct(curQuarterBookingsCount, prevQuarterBookingsCount);
    const quarterRevenueYoYGrowth = calculateTrendPct(curQuarterBookingRevenue, lastYearQuarterBookingRevenue);

    const quarterLabelsList = ["Q1 (Jan - Mar)", "Q2 (Apr - Jun)", "Q3 (Jul - Sep)", "Q4 (Oct - Dec)"];
    const curQuarterLabel = quarterLabelsList[currentQuarterIndex];
    const lastYearSameQuarterLabel = `${quarterLabelsList[currentQuarterIndex]} ${lastYear}`;
    const prevQuarterLabel = `${quarterLabelsList[prevQStartMonth / 3]} ${prevQYear}`;

    // 3. 12-Month YoY Trend Chart Array
    const monthlyTrendData = monthNamesList.map((name, mIdx) => {
      const mThisStart = new Date(currentYear, mIdx, 1, 0, 0, 0, 0);
      const mThisEnd = new Date(currentYear, mIdx + 1, 0, 23, 59, 59, 999);
      const mLastStart = new Date(lastYear, mIdx, 1, 0, 0, 0, 0);
      const mLastEnd = new Date(lastYear, mIdx + 1, 0, 23, 59, 59, 999);

      const thisList = filterBookingsInWindow(mThisStart, mThisEnd);
      const lastList = filterBookingsInWindow(mLastStart, mLastEnd);

      const thisCount = thisList.length;
      const lastCount = lastList.length;
      const thisRev = thisList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
      const lastRev = lastList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
      const yoyChange = calculateTrendPct(thisCount, lastCount);
      const yoyRevChange = calculateTrendPct(thisRev, lastRev);

      return {
        month: name,
        fullLabel: `${name} ${currentYear}`,
        thisYear: thisCount,
        lastYear: lastCount,
        thisYearRevenue: thisRev,
        lastYearRevenue: lastRev,
        growthPercent: yoyChange,
        revenueGrowthPercent: yoyRevChange,
        isCurrentMonth: mIdx === currentMonthIndex,
      };
    });

    // 4. 4-Quarter Trend Chart Array
    const quarterlyTrendData = quarterLabelsList.map((label, qIdx) => {
      const qStartMonth = qIdx * 3;
      const qThisStart = new Date(currentYear, qStartMonth, 1, 0, 0, 0, 0);
      const qThisEnd = new Date(currentYear, qStartMonth + 3, 0, 23, 59, 59, 999);
      const qLastStart = new Date(lastYear, qStartMonth, 1, 0, 0, 0, 0);
      const qLastEnd = new Date(lastYear, qStartMonth + 3, 0, 23, 59, 59, 999);

      const thisList = filterBookingsInWindow(qThisStart, qThisEnd);
      const lastList = filterBookingsInWindow(qLastStart, qLastEnd);

      const thisCount = thisList.length;
      const lastCount = lastList.length;
      const thisRev = thisList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
      const lastRev = lastList.reduce((sum, q) => sum + getQueryBookingRevenue(q), 0);
      const yoyChange = calculateTrendPct(thisCount, lastCount);
      const yoyRevChange = calculateTrendPct(thisRev, lastRev);

      return {
        quarter: `Q${qIdx + 1}`,
        label,
        thisYear: thisCount,
        lastYear: lastCount,
        thisYearRevenue: thisRev,
        lastYearRevenue: lastRev,
        growthPercent: yoyChange,
        revenueGrowthPercent: yoyRevChange,
        isCurrentQuarter: qIdx === currentQuarterIndex,
      };
    });

    const bookingTrendsPayload = {
      monthlyComparison: {
        currentMonthLabel: `${curMonthName} ${currentYear}`,
        lastYearSameMonthLabel: `${curMonthName} ${lastYear}`,
        previousMonthLabel: `${prevMonthName} ${currentMonthIndex === 0 ? currentYear - 1 : currentYear}`,
        currentMonthBookings: curMonthBookingsCount,
        lastYearSameMonthBookings: lastYearMonthBookingsCount,
        previousMonthBookings: prevMonthBookingsCount,
        currentMonthRevenue: curMonthBookingRevenue,
        lastYearSameMonthRevenue: lastYearMonthBookingRevenue,
        previousMonthRevenue: prevMonthBookingRevenue,
        growthPercent: monthYoYGrowth,
        momGrowthPercent: monthMoMGrowth,
        revenueGrowthPercent: monthRevenueYoYGrowth,
        trend: monthYoYGrowth >= 0 ? "up" : "down",
      },
      quarterlyComparison: {
        currentQuarterLabel: `${curQuarterLabel} ${currentYear}`,
        lastYearSameQuarterLabel,
        previousQuarterLabel: prevQuarterLabel,
        currentQuarterBookings: curQuarterBookingsCount,
        lastYearSameQuarterBookings: lastYearQuarterBookingsCount,
        previousQuarterBookings: prevQuarterBookingsCount,
        currentQuarterRevenue: curQuarterBookingRevenue,
        lastYearSameQuarterRevenue: lastYearQuarterBookingRevenue,
        previousQuarterRevenue: prevQuarterBookingRevenue,
        growthPercent: quarterYoYGrowth,
        qoqGrowthPercent: quarterQoQGrowth,
        revenueGrowthPercent: quarterRevenueYoYGrowth,
        trend: quarterYoYGrowth >= 0 ? "up" : "down",
      },
      monthlyTrendData,
      quarterlyTrendData,
    };

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
        bookingTrends: bookingTrendsPayload,
        masterBookings: masterBookingRows,
        overrideCases: overrideCaseRows,
        overrideSummary: {
          open: overrideCaseRows.filter((entry) => entry.status === "Open").length,
          resolved: overrideCaseRows.filter((entry) => entry.status !== "Open").length,
        },
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
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) return null;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatNotificationCurrency = (value, currency = "INR") =>
  `${currency} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

const formatTruncatedCompactDecimal = (value) => {
  const truncated = Math.trunc(Number(value || 0) * 100) / 100;
  return truncated.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

const formatCompactCurrencyValue = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.floor(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";

  if (absolute >= 10000000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 10000000)}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 100000)}L`;
  }

  return `${sign}\u20B9${absolute.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
    Invoice_Requested: "Amount/Docs Pending",
    Confirmed: "Confirmed",
    Vouchered: "Vouchered",
    Payment_Completed: "Payment Completed",
  };

  return labelMap[status] || normalizeStageLabel(status || "Pending");
};

const getDmcStageLabel = ({ query, confirmation }) => {
  const confirmationStatus = String(confirmation?.status || "").toLowerCase();
  const opsStatus = String(query?.opsStatus || "");

  if (confirmationStatus === "submitted") return "Submitted";
  if (confirmationStatus === "draft") return "Draft";
  if (opsStatus === "Payment_Completed") return "Payment Completed";
  if (opsStatus === "Vouchered") return "Voucher Ready";
  if (opsStatus === "Rejected") return "Closed";
  if (["Booking_Accepted", "Invoice_Requested", "Confirmed"].includes(opsStatus)) {
    return "Pending";
  }

  return "Awaiting Ops";
};

const roundMoney = (value = 0) => Math.round(Number(value || 0));

const getQuotationServiceBaseAmount = (quotation) =>
  Number(quotation?.pricing?.subTotal || 0) ||
  (quotation?.services || []).reduce(
    (sum, service) => sum + Number(service?.totalInInr ?? service?.total ?? 0),
    0,
  );

const getOpsServicesTotal = (quotation) => {
  const serviceBaseAmount = getQuotationServiceBaseAmount(quotation);
  const opsGrandTotal = Number(quotation?.pricing?.totalAmount || 0);
  const clientGrandTotal =
    quotation?.clientTotalAmount === undefined || quotation?.clientTotalAmount === null
      ? 0
      : Number(quotation.clientTotalAmount || 0);

  if (clientGrandTotal > 0 && opsGrandTotal > 0 && clientGrandTotal < opsGrandTotal) {
    return roundMoney(clientGrandTotal * (serviceBaseAmount / opsGrandTotal));
  }

  return roundMoney(serviceBaseAmount);
};

const normalizePhoneForWhatsappShare = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};
const buildDmcPayoutWhatsappMessage = ({
  dmcName = "",
  invoiceNumber = "",
  queryCode = "",
  payoutAmount = 0,
  cumulativePaid = 0,
  remainingAmount = 0,
  currency = "INR",
  receiptUrl = "",
  payoutInstallments = [],
  currentInstallment = null,
  destination = "",
  guestDetails = "",
  startDate = null,
  endDate = null,
  bankName = "",
  referenceId = "",
} = {}) => {
  const parts = [
    `*HOLIDAY CIRCUIT PAYOUT*`,
    `_DMC Payout Receipt_`,
    "",
    `Hello *${dmcName || "Partner"}*,`,
    "",
    `Holiday Circuit has completed the payout for internal invoice *${invoiceNumber || "-"}*.`,
    "",
    `*TRIP DETAILS:*`,
    `Trip ID/Ref: ${queryCode || "-"}`,
  ];

  if (destination) {
    parts.push(`Destination: ${destination}`);
  }
  if (guestDetails) {
    parts.push(`Guest Details: ${guestDetails}`);
  }

  let travelDateLabel = "";
  if (startDate && endDate) {
    const sDate = formatDashboardDate(startDate);
    const eDate = formatDashboardDate(endDate);
    if (sDate && eDate) {
      travelDateLabel = `From ${sDate} to ${eDate}`;
    } else if (sDate) {
      travelDateLabel = sDate;
    }
  } else if (startDate) {
    travelDateLabel = formatDashboardDate(startDate);
  }
  if (travelDateLabel) {
    parts.push(`Travel Date: ${travelDateLabel}`);
  }

  parts.push(`Invoice: ${invoiceNumber || "-"}`);
  parts.push("");

  const amountInWords = numberToWords(payoutAmount);

  parts.push(`*PAYOUT SUMMARY:*`);
  parts.push(`Current Paid: ${formatNotificationCurrency(payoutAmount || 0, currency)}`);
  if (amountInWords) {
    parts.push(`Amount in Words: ${currency}: ${amountInWords}`);
  }
  if (bankName) {
    parts.push(`Bank Name: ${bankName}`);
  }
  if (referenceId) {
    parts.push(`Reference/UTR: ${referenceId}`);
  }
  parts.push(`Total Paid: ${formatNotificationCurrency(cumulativePaid || payoutAmount || 0, currency)}`);
  parts.push(`Remaining: ${formatNotificationCurrency(remainingAmount || 0, currency)}`);

  const paymentStatusLabel =
    Math.max(0, remainingAmount || 0) > 0
      ? `${formatNotificationCurrency(cumulativePaid || payoutAmount, currency)} / ${formatNotificationCurrency((cumulativePaid || payoutAmount) + remainingAmount, currency)} (Partial Payout Clear)`
      : `${formatNotificationCurrency(cumulativePaid || payoutAmount, currency)} / ${formatNotificationCurrency(cumulativePaid || payoutAmount, currency)} (Payout Clear)`;
  parts.push(`Payment Status: ${paymentStatusLabel}`);

  if (Array.isArray(payoutInstallments) && payoutInstallments.length > 0) {
    parts.push("");
    parts.push(`*PAYOUT BREAKDOWN:*`);

    payoutInstallments.forEach((entry, idx) => {
      const entryAmt = Math.round(Number(entry?.amount || 0));
      const entryDateVal = entry?.paymentDate || entry?.createdAt || "";
      const entryDateLabel = entry?.displayDate || formatDashboardDate(entryDateVal) || "-";
      const entryBankName = String(entry?.bankName || "-").trim();
      const entryReference = String(entry?.utrNumber || "-").trim();

      const entryTime = entryDateVal ? new Date(entryDateVal).getTime() : 0;
      const currentInstTime = (currentInstallment?.paymentDate || currentInstallment?.createdAt)
        ? new Date(currentInstallment.paymentDate || currentInstallment.createdAt).getTime()
        : 0;

      const isCurrent =
        currentInstallment &&
        entryAmt === Math.round(Number(currentInstallment?.amount || 0)) &&
        entryReference === String(currentInstallment?.utrNumber || "-").trim() &&
        entryTime === currentInstTime;

      parts.push("");
      parts.push(`Payout Installment ${idx + 1} ${isCurrent ? "*(Current)*" : ""}`);
      parts.push(`Date: ${entryDateLabel}`);
      if (entryBankName && entryBankName !== "-") {
        parts.push(`Bank: ${entryBankName}`);
      }
      if (entryReference && entryReference !== "-") {
        parts.push(`Reference: ${entryReference}`);
      }
      parts.push(`Amount: ${formatNotificationCurrency(entryAmt, currency)}`);
    });
  }

  if (receiptUrl) {
    parts.push("");
    parts.push(`Download Payout Receipt: ${receiptUrl}`);
  }

  parts.push("");
  parts.push("Regards,");
  parts.push("Holiday Circuit Finance Team");

  return parts.filter((p) => typeof p === "string").join("\n");
};

const buildAgentPaymentReceiptWhatsappMessage = ({
  agentName = "",
  invoiceNumber = "",
  queryCode = "",
  amountPaid = 0,
  cumulativePaid = 0,
  remainingAmount = 0,
  currency = "INR",
  receiptUrl = "",
  receiptTitle = "Payment Receipt",
  trackerPayments = [],
  selectedInstallment = null,
  destination = "",
  guestDetails = "",
  startDate = null,
  endDate = null,
  creditAccount = "Leela Travels",
  bankName = "",
  referenceId = "",
} = {}) => {
  const parts = [
    `*HOLIDAY CIRCUIT RECEIPT*`,
    `_${receiptTitle}_`,
    "",
    `Hello *${agentName || "Partner"}*,`,
    "",
    `Holiday Circuit has generated your ${receiptTitle.toLowerCase()} for invoice *${invoiceNumber || "-"}*.`,
    "",
    `*TRIP DETAILS:*`,
    `Trip ID: ${queryCode || "-"}`,
  ];

  if (destination) {
    parts.push(`Destination: ${destination}`);
  }
  if (guestDetails) {
    parts.push(`Guest Details: ${guestDetails}`);
  }

  let travelDateLabel = "";
  if (startDate && endDate) {
    const sDate = formatDashboardDate(startDate);
    const eDate = formatDashboardDate(endDate);
    if (sDate && eDate) {
      travelDateLabel = `From ${sDate} to ${eDate}`;
    } else if (sDate) {
      travelDateLabel = sDate;
    }
  } else if (startDate) {
    travelDateLabel = formatDashboardDate(startDate);
  }
  if (travelDateLabel) {
    parts.push(`Travel Date: ${travelDateLabel}`);
  }

  parts.push(`Invoice: ${invoiceNumber || "-"}`);
  parts.push("");

  const amountInWords = numberToWords(amountPaid);

  parts.push(`*PAYMENT SUMMARY:*`);
  parts.push(`Current Paid: ${formatNotificationCurrency(amountPaid || 0, currency)}`);
  if (amountInWords) {
    parts.push(`Amount in Words: ${currency}: ${amountInWords}`);
  }
  if (bankName) {
    parts.push(`Bank Name: ${bankName}`);
  }
  if (referenceId) {
    parts.push(`Reference/UTR: ${referenceId}`);
  }
  if (creditAccount) {
    parts.push(`Credit Account: ${creditAccount}`);
  }
  parts.push(`Total Paid: ${formatNotificationCurrency(cumulativePaid || amountPaid || 0, currency)}`);
  parts.push(`Remaining: ${formatNotificationCurrency(remainingAmount || 0, currency)}`);

  const paymentStatusLabel =
    Math.max(0, remainingAmount || 0) > 0
      ? `${formatNotificationCurrency(cumulativePaid || amountPaid, currency)} / ${formatNotificationCurrency((cumulativePaid || amountPaid) + remainingAmount, currency)} (Partial Payment Clear)`
      : `${formatNotificationCurrency(cumulativePaid || amountPaid, currency)} / ${formatNotificationCurrency(cumulativePaid || amountPaid, currency)} (Payment Clear)`;
  parts.push(`Payment Status: ${paymentStatusLabel}`);

  if (Array.isArray(trackerPayments) && trackerPayments.length > 0) {
    parts.push("");
    parts.push(`*INSTALLMENT BREAKDOWN:*`);

    trackerPayments.forEach((entry, idx) => {
      const entryAmt = Math.round(Number(entry?.amount || 0));
      const entryDateVal = entry?.paymentDate || entry?.createdAt || "";
      const entryDateLabel = entry?.displayDate || formatDashboardDate(entryDateVal) || "-";
      const entryBankName = String(entry?.bankName || "-").trim();
      const entryReference = String(entry?.utrNumber || "-").trim();

      const entryTime = entryDateVal ? new Date(entryDateVal).getTime() : 0;
      const selectedTime = (selectedInstallment?.paymentDate || selectedInstallment?.createdAt)
        ? new Date(selectedInstallment.paymentDate || selectedInstallment.createdAt).getTime()
        : 0;

      const isCurrent =
        selectedInstallment &&
        entryAmt === Math.round(Number(selectedInstallment?.amount || 0)) &&
        entryReference === String(selectedInstallment?.utrNumber || "-").trim() &&
        entryTime === selectedTime;

      parts.push("");
      parts.push(`Installment ${idx + 1} ${isCurrent ? "*(Current)*" : ""}`);
      parts.push(`Date: ${entryDateLabel}`);
      if (entryBankName && entryBankName !== "-") {
        parts.push(`Bank: ${entryBankName}`);
      }
      if (entryReference && entryReference !== "-") {
        parts.push(`Reference: ${entryReference}`);
      }
      parts.push(`Amount: ${formatNotificationCurrency(entryAmt, currency)}`);
    });
  }

  if (receiptUrl) {
    parts.push("");
    parts.push(`Download Receipt PDF: ${receiptUrl}`);
  }

  parts.push("");
  parts.push("Regards,");
  parts.push("Holiday Circuit Finance Team");

  return parts.filter((p) => typeof p === "string").join("\n");
};

const formatInternalInvoiceRow = (invoice, quotation) => ({
  id: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  settlementType: invoice.settlementType || (invoice.batchNumber ? "bulk" : "single"),
  batchNumber: invoice.batchNumber || "",
  queryId:
    invoice.query?.queryId ||
    invoice.queryCode ||
    (Array.isArray(invoice.coveredQueries) && invoice.coveredQueries.length
      ? `${invoice.coveredQueries.length} bookings`
      : "-"),
  destination:
    invoice.query?.destination ||
    invoice.destination ||
    (Array.isArray(invoice.coveredQueries) && invoice.coveredQueries.length
      ? "Bulk Settlement"
      : "-"),
  dmcName:
    invoice.dmc?.companyName ||
    invoice.dmc?.name ||
    invoice.dmcName ||
    "-",
  dmcEmail: invoice.dmc?.email || "",
  dmcPhone: invoice.dmc?.phone || "",
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
  creditPeriodDays: Number(invoice.creditPeriodDays || 7),
  creditTermLabel: `${Number(invoice.creditPeriodDays || 7)}-day credit`,
  submittedAt: formatDashboardDate(invoice.submittedAt || invoice.createdAt),
  submittedAtValue: invoice.submittedAt || invoice.createdAt,
  status: invoice.status || "Submitted",
  amount: Number(invoice.summary?.grandTotal || 0),
  dmcServicesTotal: Number(invoice.summary?.subtotal || 0),
  tax: Number(invoice.summary?.totalTax || 0),
  opsServicesTotal: invoice.batchNumber
    ? Number(invoice.summary?.subtotal || 0)
    : getOpsServicesTotal(quotation),
  currency: invoice.items?.[0]?.currency || "INR",
  templateVariant: invoice.templateVariant || "aurora-ledger",
  invoiceSource: invoice.invoiceSource || "system_template",
  uploadedInvoice: invoice.uploadedInvoice || {},
  claimedSummary: invoice.claimedSummary || {},
  invoiceExtraction: invoice.invoiceExtraction || {},
  items: invoice.items || [],
  documents: invoice.documents || [],
  taxConfig: invoice.taxConfig || {},
  summary: invoice.summary || {},
  quotationNumber: quotation?.quotationNumber || "",
  coveredQueries: invoice.coveredQueries || [],
  payoutReference: invoice.payoutReference || "",
  payoutDate: formatDashboardDate(invoice.payoutDate),
  payoutDateValue: invoice.payoutDate,
  payoutBank: invoice.payoutBank || "",
  payoutAmount: Number(invoice.payoutAmount || 0),
  payoutInstallments: (invoice.payoutInstallments && invoice.payoutInstallments.length > 0)
    ? invoice.payoutInstallments.map((inst) => ({
      id: inst._id || inst.id,
      amount: Number(inst.amount || 0),
      utrNumber: inst.utrNumber || "",
      bankName: inst.bankName || "",
      paymentDate: formatDashboardDate(inst.paymentDate),
      paymentDateValue: inst.paymentDate,
      financeNotes: inst.financeNotes || "",
      paidByName: inst.paidByName || "",
      createdAt: inst.createdAt,
    }))
    : (invoice.payoutAmount > 0 ? [{
      id: "legacy",
      amount: Number(invoice.payoutAmount || 0),
      utrNumber: invoice.payoutReference || "",
      bankName: invoice.payoutBank || "",
      paymentDate: formatDashboardDate(invoice.payoutDate),
      paymentDateValue: invoice.payoutDate,
      financeNotes: invoice.financeNotes || "",
      paidByName: invoice.reviewedByName || "Finance Team",
      createdAt: invoice.reviewedAt || invoice.updatedAt,
    }] : []),
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
  startDate: invoice.query?.startDate || null,
  endDate: invoice.query?.endDate || null,
  adults: Number(invoice.query?.numberOfAdults || 0),
  children: Number(invoice.query?.numberOfChildren || 0),
});

const roundInvoiceAmount = (value) => Math.round(Number(value || 0));

const invoiceAmountsMatch = (left, right) =>
  roundInvoiceAmount(left) === roundInvoiceAmount(right);

const getInternalInvoiceItemSubtotal = (item = {}) => {
  const subtotal = Number(item.subtotal);
  if (Number.isFinite(subtotal)) return subtotal;
  return Number(item.qty || 0) * Number(item.rate || 0);
};

const getInternalInvoiceTaxConfig = (invoice = {}) => {
  const taxConfig = invoice.taxConfig || {};

  return {
    gstRate: Number(taxConfig.gstRate ?? invoice.gstRate ?? 0),
    tcsRate: Number(taxConfig.tcsRate ?? invoice.tcsRate ?? 0),
    otherTax: Number(
      taxConfig.otherTax ??
      taxConfig.otherTaxAmount ??
      invoice.otherTax ??
      invoice.otherTaxAmount ??
      0,
    ),
  };
};

const getInternalInvoiceExpectedSummary = (invoice = {}) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const taxConfig = getInternalInvoiceTaxConfig(invoice);
  const fallbackSummary = invoice.summary || {};
  const subtotal = items.length
    ? items.reduce((sum, item) => sum + getInternalInvoiceItemSubtotal(item), 0)
    : Number(fallbackSummary.subtotal || 0);
  const gstRate = Number(taxConfig.gstRate || 0);
  const tcsRate = Number(taxConfig.tcsRate || 0);
  const itemTaxTotal = items.reduce((sum, item) => {
    const itemTax = Number(item.tax);
    const hasItemTax = item.tax !== undefined && item.tax !== null && item.tax !== "";
    return hasItemTax && Number.isFinite(itemTax) ? sum + itemTax : sum;
  }, 0);
  const gstAmount = gstRate > 0
    ? (subtotal * gstRate) / 100
    : itemTaxTotal || Number(fallbackSummary.gstAmount || 0);
  const tcsAmount = (subtotal * tcsRate) / 100;
  const otherTaxAmount = Number(taxConfig.otherTax || 0);
  const totalTax = gstAmount + tcsAmount + otherTaxAmount;

  return {
    subtotal,
    totalTax,
    grandTotal: subtotal + totalTax,
  };
};

const getUploadedInvoiceAmountValidation = (invoice = {}) => {
  if (String(invoice.invoiceSource || "") !== "uploaded_invoice") {
    return { passed: true, message: "" };
  }

  const extraction = invoice.invoiceExtraction || {};
  if (
    extraction.status === "parsed" &&
    extraction.verification &&
    extraction.verification.claimedMatchesExtracted === false
  ) {
    return {
      passed: false,
      message:
        extraction.verification.warnings?.join(" ") ||
        "Uploaded invoice OCR/PDF parser total does not match the entered claimed amount.",
    };
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  if (!items.length) {
    return { passed: true, message: "" };
  }

  const currency = invoice.items?.[0]?.currency || "INR";
  const expected = getInternalInvoiceExpectedSummary(invoice);
  const claimed = {
    subtotal: Number(invoice.claimedSummary?.subtotal ?? invoice.summary?.subtotal ?? 0),
    taxAmount: Number(
      invoice.claimedSummary?.taxAmount ??
      invoice.claimedSummary?.totalTax ??
      invoice.summary?.totalTax ??
      0,
    ),
    grandTotal: Number(invoice.claimedSummary?.grandTotal ?? invoice.summary?.grandTotal ?? 0),
  };

  const mismatchNotes = [];

  if (!invoiceAmountsMatch(claimed.subtotal, expected.subtotal)) {
    mismatchNotes.push(
      `subtotal ${formatNotificationCurrency(claimed.subtotal, currency)} should be ${formatNotificationCurrency(expected.subtotal, currency)}`,
    );
  }

  if (!invoiceAmountsMatch(claimed.taxAmount, expected.totalTax)) {
    mismatchNotes.push(
      `tax ${formatNotificationCurrency(claimed.taxAmount, currency)} should be ${formatNotificationCurrency(expected.totalTax, currency)}`,
    );
  }

  if (!invoiceAmountsMatch(claimed.grandTotal, expected.grandTotal)) {
    mismatchNotes.push(
      `grand total ${formatNotificationCurrency(claimed.grandTotal, currency)} should be ${formatNotificationCurrency(expected.grandTotal, currency)}`,
    );
  }

  if (!invoiceAmountsMatch(claimed.subtotal + claimed.taxAmount, claimed.grandTotal)) {
    mismatchNotes.push(
      `subtotal plus tax is ${formatNotificationCurrency(claimed.subtotal + claimed.taxAmount, currency)}, not ${formatNotificationCurrency(claimed.grandTotal, currency)}`,
    );
  }

  return {
    passed: mismatchNotes.length === 0,
    message: mismatchNotes.length
      ? `Uploaded invoice amount mismatch: ${mismatchNotes.join("; ")}.`
      : "",
  };
};

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

  // 1. Prioritize invoice totalAmount (actual total amount payable by the agent including markup)
  const invoiceTotal = Number(invoice?.totalAmount || 0);
  if (invoiceTotal > 0) {
    return Math.round(invoiceTotal);
  }

  // 2. Fallback to pricingSnapshot grandTotal
  const grandTotal = Number(pricingSnapshot?.grandTotal || 0);
  if (grandTotal > 0) {
    return Math.round(grandTotal);
  }

  // 3. Fallback to snapshot ops cost sum if totalAmount is missing or 0
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

  return 0;
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
  const paymentTrackerEntries = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
      .map((entry, index) => {
        const amount = Math.round(Number(entry?.amount || 0));
        if (!Number.isFinite(amount) || amount <= 0) return null;
        const paymentDateValue = entry?.paymentDate || entry?.createdAt || null;
        return {
          id: `${invoice._id}-${index}`,
          amount,
          note: String(entry?.note || "").trim(),
          rawDate: paymentDateValue,
          date:
            String(entry?.displayDate || "").trim() ||
            formatDashboardDate(paymentDateValue) ||
            "Pending",
          createdAt: entry?.createdAt || null,
          verificationStatus:
            String(entry?.verificationStatus || "").trim() === "Verified"
              ? "Verified"
              : "Pending",
          verifiedAt: entry?.verifiedAt || null,
          verifiedAtLabel: formatDashboardDate(entry?.verifiedAt || null),
          verifiedByName: String(entry?.verifiedByName || "").trim(),
          receipt: {
            url: entry?.receipt?.url || (index === 0 ? invoice.paymentSubmission?.receipt?.url || "" : ""),
            fileName: entry?.receipt?.fileName || (index === 0 ? invoice.paymentSubmission?.receipt?.fileName || "" : ""),
            mimeType: entry?.receipt?.mimeType || (index === 0 ? invoice.paymentSubmission?.receipt?.mimeType || "" : ""),
            size: Number(entry?.receipt?.size || (index === 0 ? invoice.paymentSubmission?.receipt?.size || 0 : 0)),
          },
          receiptStatus: String(entry?.receiptStatus || "").trim(),
          receiptSentAt: entry?.receiptSentAt || null,
          receiptSentByName: String(entry?.receiptSentByName || "").trim(),
        };
      })
      .filter(Boolean)
    : [];
  const normalizedPaymentTrackerEntries = paymentTrackerEntries.length
    ? paymentTrackerEntries
    : receivedAmount > 0
      ? [
        {
          id: `${invoice._id}-fallback`,
          amount: receivedAmount,
          note: String(invoice?.remarks || "").trim(),
          rawDate: invoice.paymentSubmission?.paymentDate || invoice.paymentSubmission?.submittedAt || null,
          date:
            formatDashboardDate(
              invoice.paymentSubmission?.paymentDate ||
              invoice.paymentSubmission?.submittedAt ||
              null,
            ) || "Pending",
          createdAt: invoice.paymentSubmission?.submittedAt || null,
          verificationStatus: verificationStatus === "Verified" ? "Verified" : "Pending",
          verifiedAt: invoice.paymentVerification?.reviewedAt || null,
          verifiedAtLabel: formatDashboardDate(invoice.paymentVerification?.reviewedAt || null),
          verifiedByName: invoice.paymentVerification?.reviewedByName || "",
          receipt: {
            url: invoice.paymentSubmission?.receipt?.url || "",
            fileName: invoice.paymentSubmission?.receipt?.fileName || "",
            mimeType: invoice.paymentSubmission?.receipt?.mimeType || "",
            size: Number(invoice.paymentSubmission?.receipt?.size || 0),
          },
          receiptStatus: "",
          receiptSentAt: null,
          receiptSentByName: "",
        },
      ]
      : [];
  const paymentTrackerPaidAmount = normalizedPaymentTrackerEntries.reduce(
    (sum, entry) => sum + Math.round(Number(entry?.amount || 0)),
    0,
  );

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
    agentPhone: invoice.agent?.phone || "",
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
    invoicePaymentStatus: invoice.paymentStatus || "Pending",
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
    paymentTrackerTotal: expectedAmount,
    paymentTrackerPaidAmount,
    paymentTrackerEntries: normalizedPaymentTrackerEntries,
    canGenerateInvoice: verificationStatus === "Verified" && invoice.paymentStatus === "Paid",
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
      ["Partially Paid", "Paid"].includes(invoice.paymentStatus) &&
      Boolean(invoice.agent?.email),
    paymentReceiptStatus: invoice.paymentReceiptDispatch?.status || "Not Sent",
    paymentReceiptSentAt: formatDashboardDate(invoice.paymentReceiptDispatch?.sentAt),
    paymentReceiptSentAtValue: invoice.paymentReceiptDispatch?.sentAt || null,
    paymentReceiptSentByName: invoice.paymentReceiptDispatch?.sentByName || "",
    paymentReceiptRecipientEmail:
      invoice.paymentReceiptDispatch?.recipientEmail ||
      invoice.agent?.email ||
      "",
    canSendPaymentReceipt:
      verificationStatus === "Verified" &&
      Boolean(invoice.agent?.email) &&
      paymentTrackerPaidAmount > 0,
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

const decorateFinanceDashboardRows = (rows = [], accessContext = null) => {
  if (!accessContext || accessContext.scope === "admin") {
    return rows;
  }

  const decoratedRows = decorateFinanceAssignment({
    rows,
    teamMembers: accessContext.teamMembers || [],
    getExplicitAssigneeIds: (row) => [row.assignedFinanceId, row.assignedTo, row.reviewedBy],
    getFallbackSeed: (row) => row.id || row.invoiceNumber || row.queryId,
  });

  const teamMemberIds = new Set(accessContext.teamMemberIds || []);
  return decoratedRows.filter((row) =>
    teamMemberIds.has(normalizeEntityId(row.assignedFinanceId)),
  );
};

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

const parseDashboardDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getPaymentTrackerDates = (invoice = {}) => {
  const trackerPayments = Array.isArray(invoice?.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
    : [];

  return trackerPayments
    .map((entry) => parseDashboardDateValue(entry?.paymentDateValue || entry?.paymentDate || entry?.createdAt))
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());
};

const getAgentInvoiceDateCandidates = (invoice = {}) =>
  [
    ...getPaymentTrackerDates(invoice),
    invoice?.paymentSubmission?.paymentDate,
    invoice?.paymentSubmission?.submittedAt,
    invoice?.paymentVerification?.reviewedAt,
    invoice?.paymentVerification?.teamDecisionAt,
    invoice?.paymentVerification?.sentToManagerAt,
    invoice?.paymentVerification?.assignedAt,
    invoice?.updatedAt,
    invoice?.createdAt,
  ]
    .map(parseDashboardDateValue)
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());

const getAgentInvoiceRelevantDate = (invoice, start = null, end = null) => {
  const candidates = getAgentInvoiceDateCandidates(invoice);
  if (!start || !end) return candidates[0] || null;

  return candidates.find((date) => date >= start && date <= end) || null;
};

const buildAgentInvoiceWindowQuery = (start, end) => ({
  $or: [
    { createdAt: { $gte: start, $lte: end } },
    { updatedAt: { $gte: start, $lte: end } },
    { "paymentSubmission.paymentDate": { $gte: start, $lte: end } },
    { "paymentSubmission.submittedAt": { $gte: start, $lte: end } },
    { "paymentSubmission.trackerPayments.paymentDateValue": { $gte: start, $lte: end } },
    { "paymentSubmission.trackerPayments.paymentDate": { $gte: start, $lte: end } },
    { "paymentSubmission.trackerPayments.createdAt": { $gte: start, $lte: end } },
    { "paymentVerification.reviewedAt": { $gte: start, $lte: end } },
    { "paymentVerification.teamDecisionAt": { $gte: start, $lte: end } },
    { "paymentVerification.sentToManagerAt": { $gte: start, $lte: end } },
    { "paymentVerification.assignedAt": { $gte: start, $lte: end } },
  ],
});

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

  if (range === "daily") {
    const start = new Date(today);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "monthly") {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "yearly") {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const end = new Date(today);
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
  const absolute = Math.floor(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";

  if (absolute >= 10000000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 10000000)}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 100000)}L`;
  }

  return `${sign}\u20B9${absolute.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

const parseAnalyticsDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAnalyticsInvoiceDate = (invoice) => {
  const source =
    invoice?.query?.startDate ||
    invoice?.tripSnapshot?.startDate ||
    invoice?.createdAt;

  return parseAnalyticsDate(source);
};

const isVerifiedAnalyticsStatus = (value = "") =>
  String(value || "").trim().toLowerCase() === "verified";

const getInvoicePaymentRecognitionDate = (invoice = {}) => {
  const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
    : [];
  const verifiedTrackerDates = trackerPayments
    .filter((entry) => isVerifiedAnalyticsStatus(entry?.verificationStatus))
    .map((entry) =>
      parseAnalyticsDate(entry?.verifiedAt) ||
      parseAnalyticsDate(entry?.paymentDate) ||
      parseAnalyticsDate(entry?.createdAt),
    )
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime());

  if (verifiedTrackerDates.length) return verifiedTrackerDates[0];

  if (
    isVerifiedAnalyticsStatus(invoice.paymentVerification?.status) ||
    String(invoice.paymentStatus || "").trim() === "Paid"
  ) {
    return (
      parseAnalyticsDate(invoice.paymentVerification?.reviewedAt) ||
      parseAnalyticsDate(invoice.paymentSubmission?.paymentDate) ||
      parseAnalyticsDate(invoice.paymentSubmission?.submittedAt) ||
      parseAnalyticsDate(invoice.updatedAt) ||
      parseAnalyticsDate(invoice.createdAt)
    );
  }

  return null;
};

const getAnalyticsInternalInvoiceDate = (invoice) => {
  const source =
    invoice?.query?.startDate ||
    invoice?.tripSnapshot?.startDate ||
    invoice?.payoutDate ||
    invoice?.submittedAt ||
    invoice?.invoiceDate ||
    invoice?.createdAt;

  return parseAnalyticsDate(source);
};

const getAnalyticsQueryDate = (query = {}) => parseAnalyticsDate(query?.createdAt);

const getAnalyticsConfirmationDate = (query = {}) =>
  parseAnalyticsDate(query?.updatedAt || query?.createdAt);

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const createMonthlyBuckets = (referenceDate) => {
  const buckets = [];
  const yearStart = new Date(referenceDate.getFullYear(), 0, 1);

  for (let index = 0; index < 12; index += 1) {
    const bucketStart = addMonths(yearStart, index);
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

const getAggregateWindowStart = (referenceDate) => new Date(referenceDate.getFullYear(), 0, 1);

const getPreviousAggregateWindow = (startDate, monthSpan = 12) => {
  const previousStart = addMonths(startDate, -monthSpan);
  const previousEnd = new Date(startDate.getTime() - 1);
  return { start: previousStart, end: previousEnd };
};

const sumInvoiceAmountsInWindow = (invoices, start, end) =>
  invoices.reduce((sum, invoice) => {
    const invoiceDate = getAnalyticsInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return sum;
    return sum + getInvoiceRevenueAmount(invoice);
  }, 0);

const sumInternalInvoiceAmountsInWindow = (invoices, start, end, allowedKeys = null) =>
  sumInternalInvoiceCostEntriesInWindow(invoices, start, end, allowedKeys);

const CONFIRMED_QUERY_STATUSES = new Set(["Invoice_Requested", "Confirmed", "Vouchered", "Payment_Completed"]);
const CONFIRMED_AGENT_STATUSES = new Set(["Client Approved", "Booking Confirmed", "Partially Paid", "Confirmed"]);
const CONFIRMED_ACTIVITY_ACTIONS = new Set([
  "Booking Confirmed",
  "Partial Payment Verified",
  "Partial Payment Override Approved",
]);

const isConfirmedAnalyticsQuery = (query = {}) => {
  const hasBookingConfirmedLog = (query?.activityLog || []).some(
    (entry) => CONFIRMED_ACTIVITY_ACTIONS.has(String(entry?.action || "")),
  );

  return (
    CONFIRMED_QUERY_STATUSES.has(String(query?.opsStatus || "")) ||
    CONFIRMED_AGENT_STATUSES.has(String(query?.agentStatus || "")) ||
    hasBookingConfirmedLog
  );
};

const isCancelledAnalyticsQuery = (query = {}) =>
  String(query?.opsStatus || "") === "Rejected" ||
  String(query?.agentStatus || "") === "Rejected";

const normalizeAnalyticsDestination = (destination = "") =>
  String(destination || "").trim() || "Unassigned";

const getInvoiceSubmittedAmount = (invoice = {}) => {
  const directSubmissionAmount = Number(invoice.paymentSubmission?.amount || 0);
  const trackerTotal = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments.reduce((sum, entry) => sum + Number(entry?.amount || 0), 0)
    : 0;

  return Math.max(directSubmissionAmount, trackerTotal, 0);
};

const getInvoiceGrossRevenueAmount = (invoice = {}) =>
  Math.max(
    Number(invoice.totalAmount || 0),
    Number(invoice.pricingSnapshot?.grandTotal || 0),
    getInvoiceSubmittedAmount(invoice),
  );

const getInvoiceOfferContext = (invoice = {}) => {
  const couponApplication =
    invoice?.paymentSubmission?.couponApplication ||
    invoice?.couponApplication ||
    null;
  const grossAmount = getInvoiceGrossRevenueAmount(invoice);
  const rawDiscountAmount = Math.round(Number(couponApplication?.discountAmount || 0));
  const rawPayableAmount = Math.round(Number(couponApplication?.payableAmount || 0));
  const hasPayableReduction =
    rawPayableAmount > 0 && grossAmount > 0 && rawPayableAmount < Math.round(grossAmount);

  if (!couponApplication?.couponId && !couponApplication?.code && rawDiscountAmount <= 0 && !hasPayableReduction) {
    return {
      applied: false,
      code: "",
      discountAmount: 0,
      payableAmount: grossAmount,
      label: "",
    };
  }

  const subtotalAmount = Math.round(Number(couponApplication?.subtotalAmount || grossAmount || 0));
  const payableAmount = Math.max(
    rawPayableAmount,
    0,
  );
  const explicitDiscountAmount = rawDiscountAmount;
  const inferredDiscountAmount =
    payableAmount > 0 ? Math.max(0, subtotalAmount - payableAmount) : 0;
  const discountAmount = explicitDiscountAmount > 0 ? explicitDiscountAmount : inferredDiscountAmount;
  const resolvedPayableAmount =
    payableAmount > 0 ? payableAmount : Math.max(0, subtotalAmount - discountAmount);
  const code = String(couponApplication?.code || "").trim();
  const discountLabel = String(couponApplication?.discountLabel || "").trim();

  return {
    applied: true,
    code,
    discountAmount,
    payableAmount: resolvedPayableAmount,
    label: [code, discountLabel].filter(Boolean).join(" - "),
  };
};

const getInvoiceRevenueAmount = (invoice = {}) => {
  const offerContext = getInvoiceOfferContext(invoice);
  return offerContext.applied
    ? Number(offerContext.payableAmount || 0)
    : getInvoiceGrossRevenueAmount(invoice);
};

const PAYMENT_RECEIVED_INVOICE_STATUSES = new Set(["Paid", "Partially Paid", "Partially_Paid"]);

const getInvoiceReceivedAmount = (invoice = {}) => {
  const invoiceTotal = getInvoiceRevenueAmount(invoice);
  if (String(invoice.paymentStatus || "").trim() === "Paid") return invoiceTotal;

  const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
    : [];
  const verifiedTrackerTotal = trackerPayments.reduce((sum, entry) => {
    if (!isVerifiedAnalyticsStatus(entry?.verificationStatus)) return sum;
    return sum + Number(entry?.amount || 0);
  }, 0);
  if (verifiedTrackerTotal > 0) return Math.min(invoiceTotal, verifiedTrackerTotal);

  if (isVerifiedAnalyticsStatus(invoice.paymentVerification?.status)) {
    return Math.min(invoiceTotal, Number(invoice.paymentSubmission?.amount || 0));
  }

  return 0;
};

const hasInvoicePaymentReceived = (invoice = {}) => {
  const paymentStatus = String(invoice.paymentStatus || "").trim();
  if (PAYMENT_RECEIVED_INVOICE_STATUSES.has(paymentStatus)) return true;

  const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
    : [];
  const verifiedTrackerTotal = trackerPayments.reduce((sum, entry) => {
    if (!isVerifiedAnalyticsStatus(entry?.verificationStatus)) return sum;
    return sum + Number(entry?.amount || 0);
  }, 0);
  if (verifiedTrackerTotal > 0) return true;

  return (
    isVerifiedAnalyticsStatus(invoice.paymentVerification?.status) &&
    Number(invoice.paymentSubmission?.amount || 0) > 0
  );
};

const getInvoiceBookingKey = (invoice = {}) =>
  invoice.query?.queryId ||
  invoice.query?._id?.toString?.() ||
  invoice.query?.toString?.() ||
  invoice.invoiceNumber ||
  invoice._id?.toString?.() ||
  "";

const getInternalInvoiceCostAmount = (invoice = {}) => {
  const isBatch = Boolean(invoice.batchNumber || invoice.settlementType === "bulk");
  if (isBatch) {
    return Number(invoice.summary?.grandTotal || invoice.claimedSummary?.grandTotal || invoice.payoutAmount || 0);
  }
  return Number(invoice.payoutAmount || invoice.summary?.grandTotal || invoice.claimedSummary?.grandTotal || 0);
};

const getInternalInvoiceCostEntries = (invoice = {}, allowedKeys = null) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const isBatch = Boolean(invoice.batchNumber || invoice.settlementType === "bulk");

  if (isBatch && !items.length) {
    return [];
  }

  if (isBatch && items.length) {
    const invoiceTotal = getInternalInvoiceCostAmount(invoice);
    const itemSubtotalTotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

    return items.map((item) => {
      const itemSubtotal = Number(item.subtotal || 0);
      const proportionalAmount = itemSubtotalTotal > 0
        ? (invoiceTotal * itemSubtotal) / itemSubtotalTotal
        : itemSubtotal + Number(item.tax || 0);
      const date =
        parseAnalyticsDate(item.serviceDate) ||
        parseAnalyticsDate(item.creditStartDate) ||
        parseAnalyticsDate(item.query?.startDate);

      const itemKeys = [
        item.query?._id ? String(item.query?._id) : null,
        item.query?.queryId ? String(item.query?.queryId) : null,
        item.queryCode ? String(item.queryCode) : null,
        item.queryId ? String(item.queryId) : null,
      ].filter(Boolean);

      return {
        date,
        destination: normalizeAnalyticsDestination(
          item.destination || item.query?.destination || invoice.destination,
        ),
        amount: Number(proportionalAmount || 0),
        itemKeys,
      };
    }).filter((entry) => {
      if (!entry.date || entry.amount <= 0) return false;
      if (allowedKeys && allowedKeys.size > 0) {
        return entry.itemKeys.some((k) => allowedKeys.has(k));
      }
      return true;
    });
  }

  return [
    {
      date: getAnalyticsInternalInvoiceDate(invoice),
      destination: normalizeAnalyticsDestination(invoice.query?.destination || invoice.destination),
      amount: getInternalInvoiceCostAmount(invoice),
    },
  ].filter((entry) => entry.date && entry.amount > 0);
};

const sumInternalInvoiceCostEntriesInWindow = (invoices, start, end, allowedKeys = null) =>
  invoices.reduce(
    (sum, invoice) =>
      sum + getInternalInvoiceCostEntries(invoice, allowedKeys).reduce((entrySum, entry) => {
        if (!entry.date || entry.date < start || entry.date > end) return entrySum;
        return entrySum + Number(entry.amount || 0);
      }, 0),
    0,
  );

const getInternalInvoicePayoutEntries = (invoice = {}) => {
  const installments = Array.isArray(invoice.payoutInstallments) ? invoice.payoutInstallments : [];
  if (installments.length > 0) {
    return installments.map((inst) => {
      const date = parseAnalyticsDate(inst.paymentDate || inst.createdAt);
      return {
        date,
        amount: Number(inst.amount || 0),
      };
    }).filter((entry) => entry.date && entry.amount > 0);
  }

  const amount = Number(invoice.payoutAmount || 0);
  if (amount > 0) {
    const date = parseAnalyticsDate(invoice.payoutDate || invoice.submittedAt || invoice.createdAt);
    if (date) {
      return [{ date, amount }];
    }
  }

  return [];
};

const sumInternalInvoicePayoutsInWindow = (invoices, start, end) =>
  invoices.reduce(
    (sum, invoice) =>
      sum + getInternalInvoicePayoutEntries(invoice).reduce((entrySum, entry) => {
        if (!entry.date || entry.date < start || entry.date > end) return entrySum;
        return entrySum + Number(entry.amount || 0);
      }, 0),
    0,
  );

const toReportCurrency = (value) => formatCompactCurrency(value);

const createCustomBuckets = (start, end) => {
  const buckets = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= limit) {
    const bucketStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const bucketEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);

    const actualStart = bucketStart < start ? start : bucketStart;
    const actualEnd = bucketEnd > end ? end : bucketEnd;

    buckets.push({
      label: bucketStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      start: actualStart,
      end: actualEnd,
      inward: 0,
      outward: 0,
    });

    current.setMonth(current.getMonth() + 1);
  }

  if (buckets.length === 0) {
    buckets.push({
      label: "Custom Period",
      start,
      end,
      inward: 0,
      outward: 0,
    });
  }

  return buckets;
};

const buildCustomAnalyticsPayload = ({
  queries,
  invoices,
  internalInvoices,
  start,
  end,
  allowedKeys = null,
}) => {
  const buckets = createCustomBuckets(start, end);

  buckets.forEach((bucket) => {
    invoices.forEach((invoice) => {
      const invoiceDate = getAnalyticsInvoiceDate(invoice);
      if (!invoiceDate || invoiceDate < bucket.start || invoiceDate > bucket.end) return;
      bucket.inward += getInvoiceRevenueAmount(invoice);
    });

    internalInvoices.forEach((invoice) => {
      bucket.outward += getInternalInvoiceCostEntries(invoice, allowedKeys).reduce((sum, entry) => {
        if (!entry.date || entry.date < bucket.start || entry.date > bucket.end) return sum;
        return sum + Number(entry.amount || 0);
      }, 0);
    });
  });

  const inwardTotal = buckets.reduce((sum, bucket) => sum + bucket.inward, 0);
  const outwardTotal = buckets.reduce((sum, bucket) => sum + bucket.outward, 0);
  const payoutTotal = sumInternalInvoicePayoutsInWindow(internalInvoices, start, end);

  const durationMs = end.getTime() - start.getTime() + 1;
  const prevStart = new Date(start.getTime() - durationMs);
  const prevEnd = new Date(start.getTime() - 1);

  const previousInwardTotal = sumInvoiceAmountsInWindow(invoices, prevStart, prevEnd);
  const previousOutwardTotal = sumInternalInvoiceAmountsInWindow(internalInvoices, prevStart, prevEnd, allowedKeys);
  const previousPayoutTotal = sumInternalInvoicePayoutsInWindow(internalInvoices, prevStart, prevEnd);

  const chart = {
    labels: buckets.map((b) => b.label),
    inward: buckets.map((b) => Number(b.inward.toFixed(2))),
    outward: buckets.map((b) => Number(b.outward.toFixed(2))),
  };

  const metrics = buildMetricPayload({
    inwardTotal,
    outwardTotal,
    payoutTotal,
    previousInwardTotal,
    previousOutwardTotal,
    previousPayoutTotal,
    comparisonLabel: "vs prev range",
  });

  const taxSummary = buildTaxSummary({
    invoices,
    internalInvoices,
    referenceDate: start,
    mode: "custom",
    inwardTotal,
    customStart: start,
    customEnd: end,
  });

  return {
    chart,
    metrics,
    taxSummary,
  };
};

const createReportBuckets = (referenceDate, mode = "monthly") =>
  (mode === "yearly" ? createYearlyBuckets(referenceDate) : createMonthlyBuckets(referenceDate));

const getReportWindow = (referenceDate, mode = "monthly") =>
  mode === "yearly" ? getTaxWindow(referenceDate, "yearly") : getTaxWindow(referenceDate, "monthly");

const buildQueryAnalyticsReport = ({
  queries = [],
  referenceDate,
  mode = "monthly",
  customStart,
  customEnd,
}) => {
  const activeWindow = customStart && customEnd
    ? {
      start: customStart,
      end: customEnd,
      label: `${customStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${customEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    }
    : getReportWindow(referenceDate, mode);

  const reportBuckets = customStart && customEnd
    ? createCustomBuckets(customStart, customEnd).map((bucket) => ({
      ...bucket,
      queries: 0,
      confirmed: 0,
      cancelled: 0,
      destinations: {},
    }))
    : createReportBuckets(referenceDate, mode).map((bucket) => ({
      ...bucket,
      queries: 0,
      confirmed: 0,
      cancelled: 0,
      destinations: {},
    }));

  const activePeriodQueries = queries.filter((query) => {
    const queryDate = getAnalyticsQueryDate(query);
    return queryDate && queryDate >= activeWindow.start && queryDate <= activeWindow.end;
  });
  const confirmedQueries = activePeriodQueries.filter(isConfirmedAnalyticsQuery);
  const cancelledQueries = activePeriodQueries.filter(isCancelledAnalyticsQuery);
  const destinationMap = new Map();

  queries.forEach((query) => {
    const queryDate = getAnalyticsQueryDate(query);
    if (!queryDate) return;

    const queryBucket = reportBuckets.find((bucket) =>
      queryDate >= bucket.start && queryDate <= bucket.end,
    );
    if (queryBucket) {
      queryBucket.queries += 1;
      if (isConfirmedAnalyticsQuery(query)) queryBucket.confirmed += 1;
      if (isCancelledAnalyticsQuery(query)) queryBucket.cancelled += 1;
      const destination = normalizeAnalyticsDestination(query.destination);
      queryBucket.destinations[destination] = (queryBucket.destinations[destination] || 0) + 1;
    }
  });

  activePeriodQueries.forEach((query) => {
    const destination = normalizeAnalyticsDestination(query.destination);

    if (!destinationMap.has(destination)) {
      destinationMap.set(destination, {
        destination,
        queries: 0,
        confirmed: 0,
        cancelled: 0,
      });
    }

    const destinationRow = destinationMap.get(destination);
    destinationRow.queries += 1;
    if (isConfirmedAnalyticsQuery(query)) destinationRow.confirmed += 1;
    if (isCancelledAnalyticsQuery(query)) destinationRow.cancelled += 1;
  });

  const conversionPercent = activePeriodQueries.length ? (confirmedQueries.length / activePeriodQueries.length) * 100 : 0;
  const periodPrefix = mode === "yearly" ? "Yearly" : "Monthly";

  return {
    summaryCards: [
      {
        label: `${periodPrefix} Queries`,
        value: activePeriodQueries.length.toLocaleString("en-IN"),
        sub: activeWindow.label,
      },
      {
        label: "Confirmed Queries",
        value: confirmedQueries.length.toLocaleString("en-IN"),
        sub: activeWindow.label,
      },
      {
        label: "Cancelled Queries",
        value: cancelledQueries.length.toLocaleString("en-IN"),
        sub: activeWindow.label,
      },
      {
        label: "Conversion %",
        value: formatPercentValue(conversionPercent),
        sub: `${activeWindow.label} confirmed / queries`,
      },
    ],
    monthlyQueries: reportBuckets.map((bucket) => ({
      label: bucket.label,
      queries: bucket.queries,
      confirmed: bucket.confirmed,
      cancelled: bucket.cancelled,
      destinations: Object.entries(bucket.destinations || {})
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    })),
    destinationWiseQueries: Array.from(destinationMap.values())
      .map((row) => ({
        ...row,
        conversionPercent: row.queries ? Number(((row.confirmed / row.queries) * 100).toFixed(1)) : 0,
      }))
      .sort((left, right) => right.queries - left.queries || right.confirmed - left.confirmed),
    confirmationTrends: reportBuckets.map((bucket) => ({
      label: bucket.label,
      confirmed: bucket.confirmed,
      cancelled: bucket.cancelled,
      conversionPercent: bucket.queries ? Number(((bucket.confirmed / bucket.queries) * 100).toFixed(1)) : 0,
    })),
  };
};

const buildRevenueAnalyticsReport = ({
  queries = [],
  invoices = [],
  quotations = [],
  internalInvoices = [],
  referenceDate,
  mode = "monthly",
  customStart,
  customEnd,
  allowedKeys = null,
}) => {
  const activeWindow = customStart && customEnd
    ? {
      start: customStart,
      end: customEnd,
      label: `${customStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${customEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    }
    : getReportWindow(referenceDate, mode);

  const reportBuckets = customStart && customEnd
    ? createCustomBuckets(customStart, customEnd).map((bucket) => ({
      ...bucket,
      revenue: 0,
      bookings: 0,
      receivedPayment: 0,
    }))
    : createReportBuckets(referenceDate, mode).map((bucket) => ({
      ...bucket,
      revenue: 0,
      bookings: 0,
      receivedPayment: 0,
    }));
  const destinationMap = new Map();
  const dailyRevenueMap = new Map();
  const paidBookingKeys = new Set();
  let currentPeriodPendingRevenue = 0;
  const addQueryContextToMap = (map, query = {}) => {
    const keys = [
      query?._id?.toString?.(),
      query?.id?.toString?.(),
      query?.queryId,
    ].filter(Boolean);

    keys.forEach((key) => map.set(String(key), query));
    return map;
  };
  const queryContextByKey = queries.reduce(addQueryContextToMap, new Map());
  const addQueryKey = (set, value) => {
    const normalized = normalizeEntityId(value);
    if (normalized && normalized !== "-") set.add(String(normalized));
  };
  const getInvoiceAnalyticsQueryKeys = (invoice = {}) => {
    const keys = new Set();
    addQueryKey(keys, invoice.query);
    addQueryKey(keys, invoice.query?._id);
    addQueryKey(keys, invoice.query?.queryId);
    addQueryKey(keys, invoice.tripSnapshot?.queryId);
    return keys;
  };
  const getQuotationAnalyticsQueryKeys = (quotation = {}) => {
    const keys = new Set();
    addQueryKey(keys, quotation.queryId);
    addQueryKey(keys, quotation.queryId?._id);
    addQueryKey(keys, quotation.queryId?.queryId);
    return keys;
  };
  const invoicedQueryKeys = invoices.reduce((set, invoice) => {
    if (getInvoiceGrossRevenueAmount(invoice) <= 0) return set;
    getInvoiceAnalyticsQueryKeys(invoice).forEach((key) => set.add(key));
    return set;
  }, new Set());
  const getInvoiceQueryContext = (invoice = {}) => {
    if (invoice.query && typeof invoice.query === "object" && (invoice.query.destination || invoice.query.startDate)) {
      return invoice.query;
    }

    const candidates = [
      invoice.query?._id?.toString?.(),
      invoice.query?.queryId,
      invoice.query?.toString?.(),
      invoice.tripSnapshot?.queryId,
    ].filter(Boolean);

    return candidates.map((key) => queryContextByKey.get(String(key))).find(Boolean) || {};
  };
  const getQuotationQueryContext = (quotation = {}) => {
    if (quotation.queryId && typeof quotation.queryId === "object" && (quotation.queryId.destination || quotation.queryId.startDate)) {
      return quotation.queryId;
    }

    const candidates = [
      quotation.queryId?._id?.toString?.(),
      quotation.queryId?.queryId,
      quotation.queryId?.toString?.(),
    ].filter(Boolean);

    return candidates.map((key) => queryContextByKey.get(String(key))).find(Boolean) || {};
  };
  const getInvoiceReportDate = (invoice = {}) => {
    const queryContext = getInvoiceQueryContext(invoice);
    return (
      getInvoicePaymentRecognitionDate(invoice) ||
      parseAnalyticsDate(queryContext.startDate) ||
      getAnalyticsInvoiceDate(invoice)
    );
  };
  const getInvoiceTravelReportDate = (invoice = {}) => {
    const queryContext = getInvoiceQueryContext(invoice);
    return (
      parseAnalyticsDate(queryContext.startDate) ||
      parseAnalyticsDate(invoice.tripSnapshot?.startDate)
    );
  };
  const getQuotationReportDate = (quotation = {}) => {
    const queryContext = getQuotationQueryContext(quotation);
    return (
      parseAnalyticsDate(queryContext.startDate) ||
      parseAnalyticsDate(quotation.updatedAt || quotation.createdAt)
    );
  };
  const getInvoiceReportDestination = (invoice = {}) => {
    const queryContext = getInvoiceQueryContext(invoice);
    return normalizeAnalyticsDestination(
      queryContext.destination ||
      invoice.query?.destination ||
      invoice.tripSnapshot?.destination,
    );
  };
  const getQuotationReportDestination = (quotation = {}) => {
    const queryContext = getQuotationQueryContext(quotation);
    return normalizeAnalyticsDestination(
      queryContext.destination ||
      quotation.queryId?.destination,
    );
  };
  const getQuotationGrossRevenueAmount = (quotation = {}) => {
    const servicesTotal = Array.isArray(quotation.services)
      ? quotation.services.reduce((sum, service) => sum + Number(service?.totalInInr || service?.total || 0), 0)
      : 0;

    return Math.max(
      Number(quotation.clientTotalAmount || 0),
      Number(quotation.pricing?.totalAmount || 0),
      Number(quotation.totalAmount || 0),
      servicesTotal,
    );
  };
  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const addTravelDateRevenue = (date, totalAmount, receivedAmount = 0) => {
    const dateKey = formatDateKey(date);
    const existing = dailyRevenueMap.get(dateKey) || {
      date: dateKey,
      label: date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      revenue: 0,
      receivedPayment: 0,
      bookings: 0,
    };

    existing.revenue += totalAmount;
    existing.receivedPayment += receivedAmount;
    existing.bookings += 1;
    dailyRevenueMap.set(dateKey, existing);
  };

  invoices.forEach((invoice) => {
    const travelDate = getInvoiceTravelReportDate(invoice);
    const revenueReportDate = travelDate || getInvoiceReportDate(invoice);
    if (!revenueReportDate) return;

    const destination = getInvoiceReportDestination(invoice);
    const grossAmount = getInvoiceGrossRevenueAmount(invoice);
    const totalAmount = getInvoiceRevenueAmount(invoice);
    const receivedAmount = getInvoiceReceivedAmount(invoice);
    const offerContext = getInvoiceOfferContext(invoice);

    const bucket = reportBuckets.find((item) =>
      revenueReportDate >= item.start && revenueReportDate <= item.end,
    );
    if (bucket) {
      bucket.revenue += totalAmount;
      bucket.receivedPayment += receivedAmount;
    }
    if (revenueReportDate >= activeWindow.start && revenueReportDate <= activeWindow.end) {
      addTravelDateRevenue(revenueReportDate, totalAmount, receivedAmount);
      currentPeriodPendingRevenue += Math.max(0, totalAmount - receivedAmount);
      if (hasInvoicePaymentReceived(invoice)) {
        const bookingKey = getInvoiceBookingKey(invoice);
        if (bookingKey) paidBookingKeys.add(String(bookingKey));
      }
    }

    if (!travelDate || travelDate < activeWindow.start || travelDate > activeWindow.end) return;

    if (!destinationMap.has(destination)) {
      destinationMap.set(destination, {
        destination,
        grossRevenue: 0,
        revenue: 0,
        pendingRevenue: 0,
        cost: 0,
        bookings: 0,
        offerDiscount: 0,
        offerLabels: new Set(),
      });
    }

    const destinationRow = destinationMap.get(destination);
    destinationRow.grossRevenue += grossAmount;
    destinationRow.revenue += receivedAmount;
    destinationRow.pendingRevenue += Math.max(0, totalAmount - receivedAmount);
    destinationRow.offerDiscount += Number(offerContext.discountAmount || 0);
    if (offerContext.label) destinationRow.offerLabels.add(offerContext.label);
  });

  quotations.forEach((quotation) => {
    if (String(quotation.status || "") !== "Confirmed") return;

    const quotationQueryKeys = getQuotationAnalyticsQueryKeys(quotation);
    if (Array.from(quotationQueryKeys).some((key) => invoicedQueryKeys.has(key))) return;

    const travelDate = getQuotationReportDate(quotation);
    if (!travelDate) return;

    const grossAmount = getQuotationGrossRevenueAmount(quotation);
    if (grossAmount <= 0) return;

    const destination = getQuotationReportDestination(quotation);
    if (travelDate < activeWindow.start || travelDate > activeWindow.end) return;

    currentPeriodPendingRevenue += grossAmount;
    const bucket = reportBuckets.find((item) =>
      travelDate >= item.start && travelDate <= item.end,
    );
    if (bucket) {
      bucket.revenue += grossAmount;
    }

    if (!destinationMap.has(destination)) {
      destinationMap.set(destination, {
        destination,
        grossRevenue: 0,
        revenue: 0,
        pendingRevenue: 0,
        cost: 0,
        bookings: 0,
        offerDiscount: 0,
        offerLabels: new Set(),
      });
    }

    const destinationRow = destinationMap.get(destination);
    destinationRow.grossRevenue += grossAmount;
    destinationRow.pendingRevenue += grossAmount;
  });

  queries.forEach((query) => {
    if (!isConfirmedAnalyticsQuery(query)) return;

    const travelDate = parseAnalyticsDate(query.startDate);
    if (!travelDate) return;

    const bucket = reportBuckets.find((item) =>
      travelDate >= item.start && travelDate <= item.end,
    );
    if (bucket) bucket.bookings += 1;
    if (travelDate < activeWindow.start || travelDate > activeWindow.end) return;

    const destination = normalizeAnalyticsDestination(query.destination);
    if (!destinationMap.has(destination)) {
      destinationMap.set(destination, {
        destination,
        grossRevenue: 0,
        revenue: 0,
        pendingRevenue: 0,
        cost: 0,
        bookings: 0,
        offerDiscount: 0,
        offerLabels: new Set(),
      });
    }
    destinationMap.get(destination).bookings += 1;
  });

  internalInvoices.forEach((invoice) => {
    getInternalInvoiceCostEntries(invoice, allowedKeys).forEach((entry) => {
      if (!entry.date || entry.date < activeWindow.start || entry.date > activeWindow.end) return;

      const destination = normalizeAnalyticsDestination(entry.destination);
      if (!destinationMap.has(destination)) {
        destinationMap.set(destination, {
          destination,
          grossRevenue: 0,
          revenue: 0,
          pendingRevenue: 0,
          cost: 0,
          bookings: 0,
          offerDiscount: 0,
          offerLabels: new Set(),
        });
      }

      destinationMap.get(destination).cost += Number(entry.amount || 0);
    });
  });

  const currentPeriodRevenue = reportBuckets
    .filter((bucket) => bucket.start >= activeWindow.start && bucket.end <= activeWindow.end)
    .reduce((sum, bucket) => sum + bucket.revenue, 0);
  const currentPeriodReceivedPayment = reportBuckets
    .filter((bucket) => bucket.start >= activeWindow.start && bucket.end <= activeWindow.end)
    .reduce((sum, bucket) => sum + bucket.receivedPayment, 0);
  const currentPeriodBookings = reportBuckets
    .filter((bucket) => bucket.start >= activeWindow.start && bucket.end <= activeWindow.end)
    .reduce((sum, bucket) => sum + bucket.bookings, 0);
  const currentPeriodPaidBookings = paidBookingKeys.size;

  const destinationProfitability = Array.from(destinationMap.values())
    .map((row) => {
      const profit = row.revenue - row.cost;
      const marginBase = row.grossRevenue || row.revenue;
      const margin = marginBase ? (profit / marginBase) * 100 : 0;

      return {
        destination: row.destination,
        grossRevenue: Number(Number(row.grossRevenue || 0).toFixed(2)),
        grossRevenueLabel: toReportCurrency(row.grossRevenue || 0),
        revenue: Number(row.revenue.toFixed(2)),
        revenueLabel: toReportCurrency(row.revenue),
        pendingRevenue: Number(Number(row.pendingRevenue || 0).toFixed(2)),
        pendingRevenueLabel: toReportCurrency(row.pendingRevenue || 0),
        cost: Number(row.cost.toFixed(2)),
        costLabel: toReportCurrency(row.cost),
        offerDiscount: Number(Number(row.offerDiscount || 0).toFixed(2)),
        offerDiscountLabel: toReportCurrency(row.offerDiscount || 0),
        offerLabel: row.offerLabels?.size
          ? Array.from(row.offerLabels).join(", ")
          : "",
        profit: Number(profit.toFixed(2)),
        profitLabel: toReportCurrency(profit),
        marginPercent: Number(margin.toFixed(1)),
        bookings: row.bookings,
      };
    })
    .filter((row) => row.grossRevenue > 0 || row.revenue > 0 || row.cost > 0)
    .sort((left, right) => right.profit - left.profit || right.revenue - left.revenue)
    .slice(0, 10);

  return {
    summaryCards: [
      {
        label: mode === "yearly" ? "Yearly Revenue" : "Monthly Revenue",
        value: toReportCurrency(currentPeriodRevenue),
        sub: `${activeWindow.label} total receivable`,
      },
      {
        label: "Verified Payment Revenue",
        value: toReportCurrency(currentPeriodReceivedPayment),
        sub: "Received/verified payment for period",
      },
      {
        label: mode === "yearly" ? "Yearly Bookings" : "Monthly Bookings",
        value: currentPeriodBookings.toLocaleString("en-IN"),
        sub: activeWindow.label,
      },
      {
        label: "Pending Revenue",
        value: toReportCurrency(currentPeriodPendingRevenue),
        sub: "Total unpaid balance for month",
      },
      {
        label: "Confirmed Bookings",
        value: currentPeriodPaidBookings.toLocaleString("en-IN"),
        sub: "Full/partial payment received",
      },
    ],
    monthlyRevenue: reportBuckets.map((bucket) => ({
      label: bucket.label,
      revenue: Number(bucket.revenue.toFixed(2)),
      revenueLabel: toReportCurrency(bucket.revenue),
      bookings: bucket.bookings,
    })),
    monthlyBookings: reportBuckets.map((bucket) => ({
      label: bucket.label,
      bookings: bucket.bookings,
    })),
    travelDateRevenue: reportBuckets.map((bucket) => ({
      label: bucket.label,
      revenue: Number(bucket.revenue.toFixed(2)),
      revenueLabel: toReportCurrency(bucket.revenue),
      receivedPayment: Number(bucket.receivedPayment.toFixed(2)),
      receivedPaymentLabel: toReportCurrency(bucket.receivedPayment),
      bookings: bucket.bookings,
    })),
    travelDateEntries: Array.from(dailyRevenueMap.values())
      .map((row) => ({
        ...row,
        revenue: Number(row.revenue.toFixed(2)),
        revenueLabel: toReportCurrency(row.revenue),
        receivedPayment: Number(Number(row.receivedPayment || 0).toFixed(2)),
        receivedPaymentLabel: toReportCurrency(row.receivedPayment || 0),
      }))
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    destinationProfitability,
  };
};

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

const formatTaxMonthValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatTaxYearValue = (date) => String(date.getFullYear());

const buildMetricPayload = ({
  inwardTotal,
  outwardTotal,
  payoutTotal = 0,
  previousInwardTotal,
  previousOutwardTotal,
  previousPayoutTotal = 0,
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
      sub: "Total amount from Agents",
      val: formatCompactCurrency(inwardTotal),
      change: formatGrowthText(inwardTotal, previousInwardTotal, comparisonLabel),
      up: inwardTotal >= previousInwardTotal,
      ...getMetricAppearance("inward"),
    },
    outward: {
      label: "Total Outward",
      sub: "Money to DMCs",
      val: formatCompactCurrency(outwardTotal),
      payoutVal: formatCompactCurrency(payoutTotal),
      change: formatGrowthText(outwardTotal, previousOutwardTotal, comparisonLabel),
      payoutChange: formatGrowthText(payoutTotal, previousPayoutTotal, comparisonLabel),
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
  customStart,
  customEnd,
}) => {
  const start = customStart || getTaxWindow(referenceDate, mode).start;
  const end = customEnd || getTaxWindow(referenceDate, mode).end;
  const label = customStart && customEnd
    ? `${customStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${customEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : getTaxWindow(referenceDate, mode).label;

  let gstTotal = 0;
  let tcsDomestic = 0;
  let tcsInternational = 0;
  let tdsTotal = 0;
  let tdsTransactions = 0;

  invoices.forEach((invoice) => {
    const invoiceDate = getAnalyticsInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return;

    const gstAmount = Number(invoice.pricingSnapshot?.gstAmount || 0);
    const tcsAmount = Number(invoice.pricingSnapshot?.tcsAmount || 0);
    const tdsAmount = Number(invoice.pricingSnapshot?.tdsAmount || invoice.pricingSnapshot?.tourismAmount || 0);
    const destination = invoice.query?.destination || invoice.tripSnapshot?.destination || "";

    gstTotal += gstAmount;
    if (inferDomesticDestination(destination)) {
      tcsDomestic += tcsAmount;
    } else {
      tcsInternational += tcsAmount;
    }

    if (tdsAmount > 0) {
      tdsTotal += tdsAmount;
      tdsTransactions += 1;
    }
  });

  internalInvoices.forEach((invoice) => {
    const invoiceDate = getAnalyticsInternalInvoiceDate(invoice);
    if (!invoiceDate || invoiceDate < start || invoiceDate > end) return;

    const gstAmount = Number(invoice.summary?.gstAmount || 0);
    const tcsAmount = Number(invoice.summary?.tcsAmount || 0);
    const tdsAmount = Number(invoice.summary?.tdsAmount || invoice.summary?.otherTaxAmount || 0);
    const destination = invoice.query?.destination || invoice.destination || "";

    gstTotal += gstAmount;
    if (inferDomesticDestination(destination)) {
      tcsDomestic += tcsAmount;
    } else {
      tcsInternational += tcsAmount;
    }

    if (tdsAmount > 0) {
      tdsTotal += tdsAmount;
      tdsTransactions += 1;
    }
  });

  const tcsTotal = tcsDomestic + tcsInternational;
  const totalTaxCollected = gstTotal + tcsTotal + tdsTotal;
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
    tds: {
      total: formatCompactCurrency(tdsTotal),
      rateLabel: "Tax deducted at source",
      status: tdsTotal > 0 ? "Collected" : "No activity",
      breakdown: [
        { label: "Total Transactions", value: tdsTransactions.toLocaleString("en-IN") },
        {
          label: "Avg Per Invoice",
          value: formatCompactCurrency(tdsTransactions ? tdsTotal / tdsTransactions : 0),
        },
      ],
    },
    tdf: {
      total: formatCompactCurrency(tdsTotal),
      rateLabel: "Tax deducted at source",
      status: tdsTotal > 0 ? "Collected" : "No activity",
      breakdown: [
        { label: "Total Transactions", value: tdsTransactions.toLocaleString("en-IN") },
        {
          label: "Avg Per Invoice",
          value: formatCompactCurrency(tdsTransactions ? tdsTotal / tdsTransactions : 0),
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

const buildMonthlyTaxPeriods = ({
  queries,
  invoices,
  quotations,
  internalInvoices,
  referenceDate,
  allowedKeys = null,
}) => {
  const yearStart = new Date(referenceDate.getFullYear(), 0, 1);

  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = addMonths(yearStart, index);
    const { start, end } = getTaxWindow(monthDate, "monthly");
    const previousMonthDate = addMonths(monthDate, -1);
    const previousWindow = getTaxWindow(previousMonthDate, "monthly");
    const inwardTotal = sumInvoiceAmountsInWindow(invoices, start, end);
    const outwardTotal = sumInternalInvoiceAmountsInWindow(internalInvoices, start, end, allowedKeys);
    const payoutTotal = sumInternalInvoicePayoutsInWindow(internalInvoices, start, end);
    const previousInwardTotal = sumInvoiceAmountsInWindow(
      invoices,
      previousWindow.start,
      previousWindow.end,
    );
    const previousOutwardTotal = sumInternalInvoiceAmountsInWindow(
      internalInvoices,
      previousWindow.start,
      previousWindow.end,
      allowedKeys,
    );
    const previousPayoutTotal = sumInternalInvoicePayoutsInWindow(
      internalInvoices,
      previousWindow.start,
      previousWindow.end,
    );
    const taxSummary = buildTaxSummary({
      invoices,
      internalInvoices,
      referenceDate: monthDate,
      mode: "monthly",
      inwardTotal,
    });

    return {
      value: formatTaxMonthValue(monthDate),
      label: taxSummary.periodLabel,
      metrics: buildMetricPayload({
        inwardTotal,
        outwardTotal,
        payoutTotal,
        previousInwardTotal,
        previousOutwardTotal,
        previousPayoutTotal,
        comparisonLabel: "vs last month",
      }),
      taxSummary,
      reports: {
        query: buildQueryAnalyticsReport({
          queries,
          referenceDate: monthDate,
          mode: "monthly",
        }),
        revenue: buildRevenueAnalyticsReport({
          queries,
          invoices,
          quotations,
          internalInvoices,
          referenceDate: monthDate,
          mode: "monthly",
        }),
      },
    };
  });
};

const buildYearlyTaxPeriods = ({
  queries,
  invoices,
  quotations,
  internalInvoices,
  referenceDate,
}) => {
  const currentYear = referenceDate.getFullYear();

  return Array.from({ length: 6 }, (_, index) => {
    const year = currentYear - 5 + index;
    const yearDate = new Date(year, 0, 1);
    const { start, end } = getTaxWindow(yearDate, "yearly");
    const previousWindow = getPreviousYearWindow(yearDate);
    const inwardTotal = sumInvoiceAmountsInWindow(invoices, start, end);
    const outwardTotal = sumInternalInvoiceAmountsInWindow(internalInvoices, start, end);
    const previousInwardTotal = sumInvoiceAmountsInWindow(
      invoices,
      previousWindow.start,
      previousWindow.end,
    );
    const previousOutwardTotal = sumInternalInvoiceAmountsInWindow(
      internalInvoices,
      previousWindow.start,
      previousWindow.end,
    );
    const taxSummary = buildTaxSummary({
      invoices,
      internalInvoices,
      referenceDate: yearDate,
      mode: "yearly",
      inwardTotal,
    });

    return {
      value: formatTaxYearValue(yearDate),
      label: taxSummary.periodLabel,
      metrics: buildMetricPayload({
        inwardTotal,
        outwardTotal,
        previousInwardTotal,
        previousOutwardTotal,
        comparisonLabel: "vs last year",
      }),
      taxSummary,
      reports: {
        query: buildQueryAnalyticsReport({
          queries,
          referenceDate: yearDate,
          mode: "yearly",
        }),
        revenue: buildRevenueAnalyticsReport({
          queries,
          invoices,
          quotations,
          internalInvoices,
          referenceDate: yearDate,
          mode: "yearly",
        }),
      },
    };
  });
};

const buildAdvancedAnalyticsPayload = ({
  queries,
  invoices,
  quotations,
  internalInvoices,
  referenceDate,
  mode,
  allowedKeys = null,
}) => {
  const buckets = mode === "yearly"
    ? createYearlyBuckets(referenceDate)
    : createMonthlyBuckets(referenceDate);

  buckets.forEach((bucket) => {
    invoices.forEach((invoice) => {
      const invoiceDate = getAnalyticsInvoiceDate(invoice);
      if (!invoiceDate || invoiceDate < bucket.start || invoiceDate > bucket.end) return;
      bucket.inward += getInvoiceRevenueAmount(invoice);
    });

    internalInvoices.forEach((invoice) => {
      bucket.outward += getInternalInvoiceCostEntries(invoice, allowedKeys).reduce((sum, entry) => {
        if (!entry.date || entry.date < bucket.start || entry.date > bucket.end) return sum;
        return sum + Number(entry.amount || 0);
      }, 0);
    });
  });

  const inwardTotal = buckets.reduce((sum, bucket) => sum + bucket.inward, 0);
  const outwardTotal = buckets.reduce((sum, bucket) => sum + bucket.outward, 0);

  let previousInwardTotal = 0;
  let previousOutwardTotal = 0;
  let comparisonLabel = "vs last period";

  if (mode === "yearly") {
    const yearPeriods = buildYearlyTaxPeriods({
      queries,
      invoices,
      quotations,
      internalInvoices,
      referenceDate,
    });
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
      allowedKeys,
    );
    const previousPayoutTotal = sumInternalInvoicePayoutsInWindow(
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
      allowedKeys,
    );
    const currentYearPayout = sumInternalInvoicePayoutsInWindow(
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
        payoutTotal: currentYearPayout,
        previousInwardTotal,
        previousOutwardTotal,
        previousPayoutTotal,
        comparisonLabel,
      }),
      taxSummary: yearPeriods.find((period) => period.value === formatTaxYearValue(referenceDate))?.taxSummary || buildTaxSummary({
        invoices,
        internalInvoices,
        referenceDate,
        mode,
        inwardTotal: currentYearInward,
      }),
      yearPeriods,
    };
  }

  const aggregateWindowStart = getAggregateWindowStart(referenceDate);
  const previousWindow = getPreviousAggregateWindow(aggregateWindowStart);
  const taxPeriods = buildMonthlyTaxPeriods({
    queries,
    invoices,
    quotations,
    internalInvoices,
    referenceDate,
    allowedKeys,
  });

  previousInwardTotal = sumInvoiceAmountsInWindow(
    invoices,
    previousWindow.start,
    previousWindow.end,
  );
  previousOutwardTotal = sumInternalInvoiceAmountsInWindow(
    internalInvoices,
    previousWindow.start,
    previousWindow.end,
    allowedKeys,
  );
  const previousPayoutTotal = sumInternalInvoicePayoutsInWindow(
    internalInvoices,
    previousWindow.start,
    previousWindow.end,
  );
  const currentPeriodPayout = sumInternalInvoicePayoutsInWindow(
    internalInvoices,
    aggregateWindowStart,
    referenceDate,
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
      payoutTotal: currentPeriodPayout,
      previousInwardTotal,
      previousOutwardTotal,
      previousPayoutTotal,
      comparisonLabel,
    }),
    taxSummary: taxPeriods.find((period) => period.value === formatTaxMonthValue(referenceDate))?.taxSummary || buildTaxSummary({
      invoices,
      internalInvoices,
      referenceDate,
      mode,
      inwardTotal,
    }),
    taxPeriods,
  };
};

export const getFinanceDashboard = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    const range = String(req.query.range || "weekly").toLowerCase();
    const { start, end } = getRangeWindow(range, req.query.startDate, req.query.endDate);
    const previousWindow = getPreviousWindow({ start, end });

    const [agentInvoices, internalInvoices] = await Promise.all([
      Invoice.find(buildAgentInvoiceWindowQuery(previousWindow.start, end))
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

    const normalizeInvoice = (invoice, windowStart, windowEnd) => {
      const status = mapInvoiceStatus(invoice.paymentStatus);
      const relevantDate = getAgentInvoiceRelevantDate(invoice, windowStart, windowEnd);
      if (!relevantDate) return null;
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
        date: formatDashboardDate(relevantDate),
        dateValue: relevantDate,
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
          relevantDate.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000,
      };
    };

    const currentRows = agentInvoices
      .map((invoice) => normalizeInvoice(invoice, start, end))
      .filter(Boolean);
    const previousRows = agentInvoices
      .map((invoice) => normalizeInvoice(invoice, previousWindow.start, previousWindow.end))
      .filter(Boolean);

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
          assignedFinanceId: invoice?.assignedTo || null,
          assignedTo: invoice?.assignedTo || null,
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
        : decorateFinanceDashboardRows(currentRows, accessContext);

    const scopedPreviousRows =
      accessContext.scope === "admin"
        ? previousRows
        : decorateFinanceDashboardRows(previousRows, accessContext);

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

const formatFinanceParticipantOption = (user = {}) => {
  const status = String(user.status || "").toLowerCase();
  const accountStatus = String(user.accountStatus || "").toLowerCase();
  const hasApprovalStatus = status ? status === "approve" : true;
  const adminApproved = Boolean(user.isApproved) && hasApprovalStatus && accountStatus !== "inactive";

  return {
    id: user._id?.toString?.() || "",
    name: user.name || "",
    companyName: user.companyName || "",
    email: user.email || "",
    role: user.role || "",
    status: user.status || "",
    accountStatus: user.accountStatus || "",
    isApproved: Boolean(user.isApproved),
    adminApproved,
  };
};

export const getAdvancedAnalytics = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);

    let referenceDate = new Date();
    if (req.query.startDate) {
      const parsedStart = new Date(req.query.startDate);
      if (!Number.isNaN(parsedStart.getTime())) {
        referenceDate = parsedStart;
      }
    }
    const isCustom = req.query.startDate && req.query.endDate;
    let customStart = null;
    let customEnd = null;
    if (isCustom) {
      customStart = new Date(req.query.startDate);
      customStart.setHours(0, 0, 0, 0);
      customEnd = new Date(req.query.endDate);
      customEnd.setHours(23, 59, 59, 999);
    }

    const earliestYearStart = new Date(referenceDate.getFullYear() - 5, 0, 1);
    const earliestMonthlyStart = addMonths(startOfMonth(referenceDate), -23);
    let earliestDate = earliestYearStart < earliestMonthlyStart
      ? earliestYearStart
      : earliestMonthlyStart;

    if (customStart && customStart < earliestDate) {
      earliestDate = customStart;
    }

    const [queries, invoices, quotations, internalInvoices, settlementBatches, agents, dmcPartners] = await Promise.all([
      TravelQuery.find({
        $or: [
          { createdAt: { $gte: earliestDate } },
          { updatedAt: { $gte: earliestDate } },
          { startDate: { $gte: earliestDate } },
        ],
      })
        .select("queryId destination startDate endDate opsStatus agentStatus activityLog.action createdAt updatedAt")
        .lean(),
      Invoice.find({
        $or: [
          { createdAt: { $gte: earliestDate } },
          { updatedAt: { $gte: earliestDate } },
          { "tripSnapshot.startDate": { $gte: earliestDate } },
          { "paymentSubmission.paymentDate": { $gte: earliestDate } },
          { "paymentSubmission.submittedAt": { $gte: earliestDate } },
          { "paymentSubmission.trackerPayments.paymentDateValue": { $gte: earliestDate } },
          { "paymentSubmission.trackerPayments.paymentDate": { $gte: earliestDate } },
          { "paymentSubmission.trackerPayments.verifiedAt": { $gte: earliestDate } },
        ],
      })
        .populate("query", "queryId destination startDate endDate opsStatus agentStatus activityLog.action")
        .populate("agent", "name companyName email phone")
        .lean(),
      Quotation.find({
        status: "Confirmed",
        $or: [
          { createdAt: { $gte: earliestDate } },
          { updatedAt: { $gte: earliestDate } },
          { validTill: { $gte: earliestDate } },
        ],
      })
        .select("queryId quotationNumber pricing.totalAmount clientTotalAmount services.total services.totalInInr totalAmount status createdAt updatedAt")
        .populate("queryId", "queryId destination startDate endDate opsStatus agentStatus activityLog.action")
        .lean(),
      InternalInvoice.find({
        $or: [
          { payoutDate: { $gte: earliestDate } },
          { submittedAt: { $gte: earliestDate } },
          { invoiceDate: { $gte: earliestDate } },
          { createdAt: { $gte: earliestDate } },
        ],
      })
        .populate("query", "queryId destination startDate endDate opsStatus agentStatus activityLog.action")
        .lean(),
      DmcSettlementBatch.find({
        $or: [
          { payoutDate: { $gte: earliestDate } },
          { submittedAt: { $gte: earliestDate } },
          { invoiceDate: { $gte: earliestDate } },
          { createdAt: { $gte: earliestDate } },
          { "items.serviceDate": { $gte: earliestDate } },
          { "items.creditStartDate": { $gte: earliestDate } },
        ],
      })
        .populate("items.query", "queryId destination startDate endDate opsStatus agentStatus activityLog.action")
        .populate("dmc", "name companyName email phone")
        .populate("assignedTo", "name companyName email")
        .lean(),
      Auth.find({ role: "agent", isDeleted: { $ne: true } })
        .select("name companyName email role status isApproved accountStatus")
        .sort({ companyName: 1, name: 1, email: 1 })
        .lean(),
      Auth.find({ role: "dmc_partner", isDeleted: { $ne: true } })
        .select("name companyName email role status isApproved accountStatus")
        .sort({ companyName: 1, name: 1, email: 1 })
        .lean(),
    ]);
    const allInternalInvoices = [
      ...internalInvoices,
      ...settlementBatches.map((batch) => ({
        ...batch,
        settlementType: "bulk",
      })),
    ];

    const getAnalyticsRecordId = (record = {}) =>
      record?._id?.toString?.() ||
      record?.id?.toString?.() ||
      record?.invoiceNumber ||
      record?.batchNumber ||
      JSON.stringify(record);
    const addQueryKey = (set, value) => {
      const normalized = normalizeEntityId(value);
      if (normalized && normalized !== "-") set.add(normalized);
    };
    const getInvoiceQueryKeys = (invoice = {}) => {
      const keys = new Set();
      addQueryKey(keys, invoice.query);
      addQueryKey(keys, invoice.query?._id);
      addQueryKey(keys, invoice.query?.queryId);
      addQueryKey(keys, invoice.queryCode);
      addQueryKey(keys, invoice.tripSnapshot?.queryId);
      return keys;
    };
    const getQuotationQueryKeys = (quotation = {}) => {
      const keys = new Set();
      addQueryKey(keys, quotation.queryId);
      addQueryKey(keys, quotation.queryId?._id);
      addQueryKey(keys, quotation.queryId?.queryId);
      return keys;
    };
    const getInternalInvoiceQueryKeys = (invoice = {}) => {
      const keys = new Set();
      addQueryKey(keys, invoice.query);
      addQueryKey(keys, invoice.query?._id);
      addQueryKey(keys, invoice.query?.queryId);
      addQueryKey(keys, invoice.queryCode);
      (invoice.coveredQueries || []).forEach((covered) => {
        addQueryKey(keys, covered.query);
        addQueryKey(keys, covered.query?._id);
        addQueryKey(keys, covered.query?.queryId);
        addQueryKey(keys, covered.queryCode);
        addQueryKey(keys, covered.queryId);
      });
      (invoice.items || []).forEach((item) => {
        addQueryKey(keys, item.query);
        addQueryKey(keys, item.query?._id);
        addQueryKey(keys, item.query?.queryId);
        addQueryKey(keys, item.queryCode);
        addQueryKey(keys, item.queryId);
      });
      return keys;
    };
    const getInternalInvoiceChildQueryKeys = (invoice = {}) => {
      const keys = new Set();
      (invoice.coveredQueries || []).forEach((covered) => {
        addQueryKey(keys, covered.query);
        addQueryKey(keys, covered.query?._id);
        addQueryKey(keys, covered.query?.queryId);
        addQueryKey(keys, covered.queryCode);
        addQueryKey(keys, covered.queryId);
      });
      (invoice.items || []).forEach((item) => {
        addQueryKey(keys, item.query);
        addQueryKey(keys, item.query?._id);
        addQueryKey(keys, item.query?.queryId);
        addQueryKey(keys, item.queryCode);
        addQueryKey(keys, item.queryId);
      });
      return keys.size ? keys : getInternalInvoiceQueryKeys(invoice);
    };
    const recordMatchesKeys = (recordKeys = new Set(), allowedKeys = new Set()) =>
      Array.from(recordKeys).some((key) => allowedKeys.has(key));
    const mergeRecordsById = (...groups) => {
      const map = new Map();
      groups.flat().forEach((record) => {
        map.set(getAnalyticsRecordId(record), record);
      });
      return Array.from(map.values());
    };
    const filterInternalInvoiceByQueryKeys = (invoice = {}, allowedKeys = new Set()) => {
      const isBatch = Boolean(invoice.batchNumber || invoice.settlementType === "bulk");
      if (isBatch) {
        return invoice;
      }
      if (!allowedKeys.size) return invoice;
      if (!recordMatchesKeys(getInternalInvoiceQueryKeys(invoice), allowedKeys)) return null;

      const hasQueryScopedItems = Array.isArray(invoice.items) && invoice.items.some((item) =>
        Boolean(item?.query || item?.queryCode || item?.query?.queryId || item?.query?._id),
      );
      const filteredItems = hasQueryScopedItems
        ? invoice.items.filter((item) => {
          const itemKeys = new Set();
          addQueryKey(itemKeys, item.query);
          addQueryKey(itemKeys, item.query?._id);
          addQueryKey(itemKeys, item.query?.queryId);
          addQueryKey(itemKeys, item.queryCode);
          return recordMatchesKeys(itemKeys, allowedKeys);
        })
        : [];
      const filteredCoveredQueries = Array.isArray(invoice.coveredQueries)
        ? invoice.coveredQueries.filter((covered) => {
          const coveredKeys = new Set();
          addQueryKey(coveredKeys, covered.query);
          addQueryKey(coveredKeys, covered.query?._id);
          addQueryKey(coveredKeys, covered.query?.queryId);
          addQueryKey(coveredKeys, covered.queryCode);
          return recordMatchesKeys(coveredKeys, allowedKeys);
        })
        : [];

      if (hasQueryScopedItems && filteredItems.length === 0) {
        return null;
      }

      return {
        ...invoice,
        items: hasQueryScopedItems ? filteredItems : invoice.items,
        coveredQueries: Array.isArray(invoice.coveredQueries) ? filteredCoveredQueries : invoice.coveredQueries,
      };
    };

    const baseScopedInvoices =
      accessContext.scope === "admin"
        ? invoices
        : invoices.filter((invoice) =>
          decoratePaymentVerificationRows(
            [formatPaymentVerificationRow(invoice)],
            accessContext,
          ).length > 0,
        );

    const baseScopedInternalInvoices =
      accessContext.scope === "admin"
        ? allInternalInvoices
        : allInternalInvoices.filter((invoice) =>
          decorateInternalInvoiceRows(
            [formatInternalInvoiceRow(invoice, null)],
            accessContext,
          ).length > 0,
        );
    const scopedInvoiceQueryKeys = baseScopedInvoices.reduce((set, invoice) => {
      getInvoiceQueryKeys(invoice).forEach((key) => set.add(key));
      return set;
    }, new Set());
    const allAgentInvoiceQueryKeys = invoices.reduce((set, invoice) => {
      getInvoiceQueryKeys(invoice).forEach((key) => set.add(key));
      return set;
    }, new Set());
    const scopedInvoices = baseScopedInvoices;
    const agentMatchedInternalInvoices =
      accessContext.scope === "admin"
        ? []
        : allInternalInvoices.filter((invoice) =>
          recordMatchesKeys(getInternalInvoiceQueryKeys(invoice), scopedInvoiceQueryKeys),
        );
    const candidateScopedInternalInvoices = mergeRecordsById(
      baseScopedInternalInvoices,
      agentMatchedInternalInvoices,
    );
    const scopedInternalInvoices =
      accessContext.scope === "admin"
        ? baseScopedInternalInvoices
        : candidateScopedInternalInvoices
          .filter((invoice) => {
            if (invoice.batchNumber || invoice.settlementType === "bulk") {
              const assignedTo = invoice.assignedTo || invoice.reviewedBy || null;
              const assignedFinanceId = assignedTo ? String(assignedTo?._id || assignedTo) : null;
              if (accessContext.scope === "manager") {
                const teamMemberIds = new Set(accessContext.teamMemberIds || []);
                return teamMemberIds.has(assignedFinanceId);
              }
              return assignedFinanceId === accessContext.currentUserId;
            }
            const internalKeys = getInternalInvoiceQueryKeys(invoice);
            const hasAgentInvoice = recordMatchesKeys(internalKeys, allAgentInvoiceQueryKeys);
            return hasAgentInvoice
              ? recordMatchesKeys(internalKeys, scopedInvoiceQueryKeys)
              : true;
          })
          .map((invoice) => {
            const internalKeys = getInternalInvoiceQueryKeys(invoice);
            const hasAgentInvoice = recordMatchesKeys(internalKeys, allAgentInvoiceQueryKeys);
            return hasAgentInvoice
              ? filterInternalInvoiceByQueryKeys(invoice, scopedInvoiceQueryKeys)
              : invoice;
          })
          .filter(Boolean);
    const scopedInternalQueryKeys = scopedInternalInvoices.reduce((set, invoice) => {
      getInternalInvoiceQueryKeys(invoice).forEach((key) => set.add(key));
      return set;
    }, new Set());
    const profitInternalInvoices = accessContext.scope === "admin"
      ? scopedInternalInvoices
      : candidateScopedInternalInvoices
        .filter((invoice) => {
          const internalKeys = getInternalInvoiceQueryKeys(invoice);
          const hasAgentInvoice = recordMatchesKeys(internalKeys, allAgentInvoiceQueryKeys);
          return hasAgentInvoice
            ? recordMatchesKeys(internalKeys, scopedInvoiceQueryKeys)
            : true;
        })
        .map((invoice) => {
          const internalKeys = getInternalInvoiceQueryKeys(invoice);
          const hasAgentInvoice = recordMatchesKeys(internalKeys, allAgentInvoiceQueryKeys);
          return hasAgentInvoice
            ? filterInternalInvoiceByQueryKeys(invoice, scopedInvoiceQueryKeys)
            : invoice;
        })
        .filter(Boolean);
    const profitInternalQueryKeys = profitInternalInvoices.reduce((set, invoice) => {
      getInternalInvoiceQueryKeys(invoice).forEach((key) => set.add(key));
      return set;
    }, new Set());
    const profitQueryKeys = Array.from(profitInternalQueryKeys);
    const profitQueryObjectIds = profitQueryKeys.filter((key) => /^[a-f\d]{24}$/i.test(key));
    const profitQueryCodes = profitQueryKeys.filter((key) => !/^[a-f\d]{24}$/i.test(key));
    const profitAgentInvoiceFilters = [
      profitQueryObjectIds.length ? { query: { $in: profitQueryObjectIds } } : null,
      profitQueryCodes.length ? { "tripSnapshot.queryId": { $in: profitQueryCodes } } : null,
    ].filter(Boolean);
    const directlyMatchedProfitAgentInvoices = profitAgentInvoiceFilters.length
      ? await Invoice.find({ $or: profitAgentInvoiceFilters })
        .populate("query", "queryId destination startDate endDate opsStatus agentStatus activityLog.action")
        .populate("agent", "name companyName email phone")
        .lean()
      : [];
    const profitAgentInvoices = mergeRecordsById(
      profitInternalQueryKeys.size
        ? invoices.filter((invoice) => recordMatchesKeys(getInvoiceQueryKeys(invoice), profitInternalQueryKeys))
        : [],
      directlyMatchedProfitAgentInvoices,
    );
    const bulkProfitSummaries = profitInternalInvoices
      .filter((invoice) => invoice.settlementType === "bulk" || (invoice.coveredQueries && invoice.coveredQueries.length > 0))
      .map((invoice) => {
        const queryKeys = getInternalInvoiceChildQueryKeys(invoice);
        const agentRevenue = profitAgentInvoices.reduce((sum, agentInvoice) => (
          recordMatchesKeys(getInvoiceQueryKeys(agentInvoice), queryKeys)
            ? sum + getInvoiceGrossRevenueAmount(agentInvoice)
            : sum
        ), 0);
        const dmcCost = Number(invoice.summary?.grandTotal || invoice.claimedSummary?.grandTotal || invoice.payoutAmount || 0);
        const profit = agentRevenue - dmcCost;

        return {
          id: getAnalyticsRecordId(invoice),
          batchNumber: invoice.batchNumber || "",
          invoiceNumber: invoice.invoiceNumber || "",
          dmcName: invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName || "",
          queryKeys: Array.from(queryKeys),
          agentRevenue,
          dmcCost,
          profit,
          margin: agentRevenue > 0 ? (profit / agentRevenue) * 100 : 0,
        };
      });
    const scopedAnalyticsQueryKeys = new Set([
      ...scopedInternalQueryKeys,
      ...scopedInvoiceQueryKeys,
    ]);
    const isQuotationVisibleForFinanceAccess = (quotation = {}) => {
      const quotationKeys = getQuotationQueryKeys(quotation);
      if (recordMatchesKeys(quotationKeys, scopedAnalyticsQueryKeys)) return true;
      if (recordMatchesKeys(quotationKeys, allAgentInvoiceQueryKeys)) return false;
      if (String(quotation.queryId?.agentStatus || "").trim() !== "Client Approved") return false;

      const assignedFinanceId = resolveFinanceAssigneeId({
        teamMembers: accessContext.teamMembers || [],
        explicitAssigneeIds: [],
        fallbackSeed: quotation.quotationNumber || quotation.queryId?.queryId || quotation._id,
      });

      if (accessContext.scope === "manager") {
        return new Set(accessContext.teamMemberIds || []).has(assignedFinanceId);
      }

      return assignedFinanceId === accessContext.currentUserId;
    };
    const scopedQuotations =
      accessContext.scope === "admin"
        ? quotations
        : quotations.filter(isQuotationVisibleForFinanceAccess);

    const calculationAllowedKeys = accessContext.scope === "admin" ? null : scopedInvoiceQueryKeys;

    const monthly = buildAdvancedAnalyticsPayload({
      queries,
      invoices: scopedInvoices,
      quotations: scopedQuotations,
      internalInvoices: scopedInternalInvoices,
      referenceDate,
      mode: "monthly",
      allowedKeys: calculationAllowedKeys,
    });

    const yearly = buildAdvancedAnalyticsPayload({
      queries,
      invoices: scopedInvoices,
      quotations: scopedQuotations,
      internalInvoices: scopedInternalInvoices,
      referenceDate,
      mode: "yearly",
      allowedKeys: calculationAllowedKeys,
    });
    const reports = {
      query: buildQueryAnalyticsReport({
        queries,
        referenceDate,
        mode: "monthly",
      }),
      revenue: buildRevenueAnalyticsReport({
        queries,
        invoices: scopedInvoices,
        quotations: scopedQuotations,
        internalInvoices: profitInternalInvoices,
        referenceDate,
        mode: "monthly",
        allowedKeys: calculationAllowedKeys,
      }),
      monthly: monthly.taxPeriods?.find((item) => item.value === formatTaxMonthValue(referenceDate))?.reports || {},
      yearly: yearly.yearPeriods?.find((item) => item.value === formatTaxYearValue(referenceDate))?.reports || {},
    };

    let customPayload = null;
    let customReports = null;
    if (isCustom) {
      customPayload = buildCustomAnalyticsPayload({
        queries,
        invoices: scopedInvoices,
        internalInvoices: scopedInternalInvoices,
        start: customStart,
        end: customEnd,
        allowedKeys: calculationAllowedKeys,
      });

      customReports = {
        query: buildQueryAnalyticsReport({
          queries,
          referenceDate,
          mode: "monthly",
          customStart,
          customEnd,
        }),
        revenue: buildRevenueAnalyticsReport({
          queries,
          invoices: scopedInvoices,
          quotations: scopedQuotations,
          internalInvoices: profitInternalInvoices,
          referenceDate,
          mode: "monthly",
          customStart,
          customEnd,
          allowedKeys: calculationAllowedKeys,
        }),
      };
    }

    res.status(200).json({
      success: true,
      data: {
        generatedOn: referenceDate.toISOString(),
        monthly,
        yearly,
        reports,
        custom: customPayload,
        customReports,
        participants: {
          agents: agents.map(formatFinanceParticipantOption),
          dmcs: dmcPartners.map(formatFinanceParticipantOption),
        },
        invoices: scopedInvoices,
        quotations: scopedQuotations,
        internalInvoices: scopedInternalInvoices,
        profitAgentInvoices,
        profitInternalInvoices,
        bulkProfitSummaries,
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
      .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren")
      .populate("dmc", "name companyName email phone")
      .populate("agent", "name companyName email phone")
      .populate("assignedTo", "name companyName email")
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();
    const settlementBatches = await DmcSettlementBatch.find()
      .populate("dmc", "name companyName email phone")
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

    const rows = [
      ...invoices.map((invoice) =>
        formatInternalInvoiceRow(
          invoice,
          quotationByQueryId[invoice.query?._id?.toString?.() || ""],
        ),
      ),
      ...settlementBatches.map((batch) =>
        formatInternalInvoiceRow(
          {
            ...batch,
            settlementType: "bulk",
            queryCode: `${batch.coveredQueries?.length || 0} bookings`,
            destination: "Bulk Settlement",
          },
          null,
        ),
      ),
    ].sort(
      (left, right) =>
        new Date(right.submittedAtValue || 0).getTime() -
        new Date(left.submittedAtValue || 0).getTime(),
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

export const getFinanceDmcVendors = async (req, res, next) => {
  try {
    await ensureFinanceApiAccess(req);

    const vendors = await Auth.find({
      role: "dmc_partner",
      isDeleted: { $ne: true },
      accountStatus: { $ne: "Inactive" },
    })
      .select("name companyName email phone gstNumber creditDays accountStatus createdAt")
      .sort({ companyName: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: vendors.map((vendor) => ({
        id: vendor._id,
        name: vendor.companyName || vendor.name || "DMC Vendor",
        companyName: vendor.companyName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        gstNumber: vendor.gstNumber || "",
        creditDays: Array.isArray(vendor.creditDays) && vendor.creditDays.length
          ? vendor.creditDays
          : [7, 15],
        accountStatus: vendor.accountStatus || "Active",
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const uploadManualBulkInvoice = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);
    const invoiceMeta = parseFinanceJsonField(req.body?.invoiceMeta, {});
    const claimedSummary = parseFinanceJsonField(req.body?.claimedSummary, {});
    const vendorId = String(req.body?.vendorId || invoiceMeta?.vendorId || "").trim();
    const invoiceNumber = String(invoiceMeta?.invoiceNumber || req.body?.invoiceNumber || "").trim();
    const invoiceDate = parseFinanceDateOrNull(invoiceMeta?.invoiceDate || req.body?.invoiceDate);
    const creditPeriodDays = Number(invoiceMeta?.creditPeriodDays || req.body?.creditPeriodDays || 7);
    const uploadedInvoiceDocument = buildManualUploadedInvoiceDocument(req.file);
    const subtotal = Number(claimedSummary?.subtotal || req.body?.subtotal || 0);
    const taxAmount = Number(claimedSummary?.taxAmount || req.body?.taxAmount || 0);
    const grandTotal = Number(claimedSummary?.grandTotal || req.body?.grandTotal || 0);

    if (!vendorId) {
      return next(new ApiError(400, "Select a DMC vendor before uploading invoice"));
    }

    if (!invoiceNumber) {
      return next(new ApiError(400, "Invoice number is required"));
    }

    if (!invoiceDate) {
      return next(new ApiError(400, "Invoice date is required"));
    }

    if (![7, 15].includes(creditPeriodDays)) {
      return next(new ApiError(400, "Credit period must be 7 or 15 days"));
    }

    if (!uploadedInvoiceDocument) {
      return next(new ApiError(400, "Bulk invoice file is required"));
    }

    if (grandTotal <= 0) {
      return next(new ApiError(400, "Grand total must be greater than zero"));
    }

    const vendor = await Auth.findOne({
      _id: vendorId,
      role: "dmc_partner",
      isDeleted: { $ne: true },
    }).select("name companyName email phone").lean();

    if (!vendor) {
      return next(new ApiError(404, "DMC vendor not found"));
    }

    const duplicate = await DmcSettlementBatch.findOne({
      dmc: vendor._id,
      invoiceNumber,
    }).lean();

    if (duplicate) {
      return next(new ApiError(409, "This vendor invoice number is already uploaded"));
    }

    const dueDate = parseFinanceDateOrNull(invoiceMeta?.dueDate) ||
      addFinanceCreditDays(invoiceDate, creditPeriodDays);
    const reviewerName = req.user?.name || req.user?.companyName || "Finance Team";
    const isFinanceMember = accessContext.scope === "member";
    const summary = {
      subtotal,
      gstAmount: 0,
      tcsAmount: 0,
      otherTaxAmount: taxAmount,
      totalTax: taxAmount,
      grandTotal,
    };
    const invoiceExtraction = await analyzeInvoiceFile(req.file, {
      claimedSummary: { subtotal, taxAmount, grandTotal },
    });

    const batch = await DmcSettlementBatch.create({
      batchNumber: `MANUAL-BULK-${Date.now()}`,
      invoiceNumber,
      dmc: vendor._id,
      dmcName: vendor.companyName || vendor.name || "DMC Vendor",
      supplierName: vendor.companyName || vendor.name || "DMC Vendor",
      coveredQueries: [],
      invoiceDate,
      dueDate,
      creditPeriodDays,
      items: [],
      documents: [uploadedInvoiceDocument],
      invoiceSource: "uploaded_invoice",
      uploadedInvoice: {
        name: uploadedInvoiceDocument.name,
        filePath: uploadedInvoiceDocument.filePath,
        size: uploadedInvoiceDocument.size,
        mimeType: uploadedInvoiceDocument.mimeType,
      },
      claimedSummary: {
        subtotal,
        taxAmount,
        grandTotal,
      },
      invoiceExtraction,
      summary,
      templateVariant: "",
      status: "Submitted",
      submittedBy: req.user.id,
      submittedAt: new Date(),
      assignedTo: isFinanceMember ? req.user.id : null,
      assignedToName: isFinanceMember ? reviewerName : "",
      assignedToEmail: isFinanceMember ? req.user?.email || "" : "",
      assignedAt: isFinanceMember ? new Date() : null,
      financeNotes: String(invoiceMeta?.notes || req.body?.notes || "").trim(),
    });

    await createFinanceSideNotification(req, {
      user: vendor._id,
      type: "info",
      title: "Bulk vendor invoice uploaded",
      message: `${reviewerName} uploaded ${invoiceNumber} for finance settlement review.`,
      link: "/dmc/confirmation",
      meta: {
        settlementBatchId: batch._id,
        settlementType: "bulk",
        invoiceNumber,
        status: "Submitted",
      },
    });

    const populatedBatch = await DmcSettlementBatch.findById(batch._id)
      .populate("dmc", "name companyName email phone")
      .populate("assignedTo", "name companyName email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Bulk invoice uploaded for finance settlement",
      data: formatInternalInvoiceRow(
        {
          ...populatedBatch,
          settlementType: "bulk",
          queryCode: "Manual bulk invoice",
          destination: "Bulk Settlement",
        },
        null,
      ),
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
      .select(
        "invoiceNumber query agent quotation paymentStatus totalAmount pricingSnapshot couponApplication paymentSubmission paymentVerification paymentAuditTrail finalInvoiceDispatch paymentReceiptDispatch remarks createdAt updatedAt",
      )
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
      reviewTarget = "",
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
    const isFullPayment = receivedAmount === expectedAmount;
    const isPartialPayment =
      receivedAmount > 0 &&
      expectedAmount > 0 &&
      receivedAmount < expectedAmount;

    if (status === "Verified") {
      if (receivedAmount <= 0) {
        return next(new ApiError(400, "Declared payment amount is required before verification"));
      }

      if (!paymentOnBehalfOf) {
        return next(new ApiError(400, "Payment on behalf of is required before verification"));
      }

      if (receivedAmount > expectedAmount) {
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
    const normalizedReviewTarget = String(reviewTarget || "").trim().toLowerCase();
    if (
      accessContext.scope === "member" &&
      status === "Rejected" &&
      normalizedRejectionTarget &&
      !["agent", "manager"].includes(normalizedRejectionTarget)
    ) {
      return next(new ApiError(400, "Invalid rejection target"));
    }
    if (
      accessContext.scope === "member" &&
      status === "Verified" &&
      normalizedReviewTarget &&
      !["agent", "manager"].includes(normalizedReviewTarget)
    ) {
      return next(new ApiError(400, "Invalid verification target"));
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
    const shouldSendVerifiedPaymentToManager =
      accessContext.scope === "member" &&
      status === "Verified" &&
      normalizedReviewTarget !== "agent";
    const shouldSendMemberReviewToManager =
      accessContext.scope === "member" &&
      (
        shouldSendVerifiedPaymentToManager ||
        (status === "Rejected" && !shouldReturnRejectedPaymentToAgent)
      );

    const shouldSendManagerReviewToAdmin =
      accessContext.scope === "manager" &&
      (normalizedReviewTarget === "admin" || normalizedRejectionTarget === "admin");

    if (shouldSendMemberReviewToManager) {
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
        await createFinanceSideNotification(req, {
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
    } else if (shouldSendManagerReviewToAdmin) {
      invoice.paymentVerification = {
        ...invoice.paymentVerification,
        status: "Pending",
        escalatedToAdmin: true,
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
        sentToManagerAt: invoice.paymentVerification?.sentToManagerAt || reviewedAt,
      };
      invoice.paymentUpdatedBy = req.user.id;
      invoice.remarks = `Escalated to Super Admin by finance manager: ${status === "Rejected" ? String(rejectionReason).trim() : "Recommended for verification"}`;
      invoice.paymentAuditTrail.push({
        action: status,
        status: "Pending",
        reason: status === "Rejected" ? String(rejectionReason).trim() : "",
        remarks: `Escalated to Super Admin by finance manager: ${String(reviewRemarks || rejectionRemarks || "").trim()}`,
        performedBy: req.user.id,
        performedByName: reviewerName,
        performedAt: reviewedAt,
      });

      await invoice.save();

      const adminUsers = await Auth.find({
        role: "admin",
        isDeleted: { $ne: true },
        accountStatus: { $ne: "Inactive" },
      }).select("_id");
      if (adminUsers.length) {
        await Promise.all(
          adminUsers.map((admin) =>
            createFinanceSideNotification(req, {
              user: admin._id,
              type: "warning",
              title: "Payment verification escalated",
              message: `${invoice.invoiceNumber} was escalated to Admin by ${reviewerName}.`,
              link: "/admin/dashboard",
              meta: {
                invoiceId: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                queryId: invoice.query?._id || null,
              },
            })
          )
        );
      }

      return res.status(200).json({
        success: true,
        message: "Review escalated to Super Admin successfully",
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
      ...((accessContext.scope === "member" && status === "Verified") || shouldReturnRejectedPaymentToAgent
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
    invoice.paymentStatus = status === "Verified"
      ? isFullPayment
        ? "Paid"
        : "Partially Paid"
      : "Unpaid";
    invoice.remarks =
      status === "Rejected"
        ? [finalRejectionReason, finalRejectionRemarks].filter(Boolean).join(" | ")
        : [String(isPartialPayment ? "Partial payment verified by finance" : "Payment verified by finance"), finalReviewRemarks].filter(Boolean).join(" | ");
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
        if (status === "Verified" && isFullPayment) {
          if (query.opsStatus === "Vouchered") {
            query.opsStatus = "Payment_Completed";
          } else if (query.opsStatus !== "Payment_Completed") {
            query.opsStatus = "Confirmed";
          }
          query.agentStatus = "Confirmed";
          addQueryLogIfMissing(query, "Payment Verified", "Finance Team");
          addQueryLogIfMissing(query, "Booking Confirmed", "Finance Team");
        } else if (status === "Verified" && isPartialPayment) {
          if (!["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
            query.opsStatus = "Invoice_Requested";
          }
          query.agentStatus = "Confirmed";
          addQueryLogIfMissing(query, "Partial Payment Verified", "Finance Team");
          addQueryLogIfMissing(query, "Booking Confirmed", "Finance Team");
        } else if (!["Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
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
          title: isPartialPayment ? "Partial Payment Verified" : "Payment Verified",
          message: isPartialPayment
            ? `${invoice.invoiceNumber} partial payment has been verified by finance for ${formatNotificationCurrency(receivedAmount)}.`
            : `${invoice.invoiceNumber} payment has been verified by finance for ${formatNotificationCurrency(
              invoice.totalAmount || 0,
            )}.`,
        };

    await createFinanceSideNotification(req, {
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
            ? isPartialPayment
              ? "Partial payment verified and approved by finance manager"
              : "Payment verified and approved by finance manager"
            : accessContext.scope === "member"
              ? isPartialPayment
                ? "Partial payment verified by finance executive successfully"
                : "Payment verified by finance executive and sent forward successfully"
              : isPartialPayment
                ? "Partial payment verified successfully"
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
      .populate("paymentVerification.reviewedBy", "name companyName email")
      .populate("quotation", "services inclusions exclusions");

    if (!invoice) {
      return next(new ApiError(404, "Invoice not found"));
    }

    if (invoice.quotation) {
      if (!invoice.quotation.queryId && invoice.query) {
        invoice.quotation.queryId = invoice.query;
      }
      const updatedLineItems = buildInvoiceLineItems(invoice.quotation);
      if (updatedLineItems && updatedLineItems.length > 0) {
        invoice.lineItems = updatedLineItems;
        await invoice.save();
      }
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
    if (verificationStatus !== "Verified" || !["Partially Paid", "Paid"].includes(invoice.paymentStatus)) {
      return next(new ApiError(400, "Final invoice can be sent only after the partial or full payment is verified by finance"));
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
      inclusions: Array.isArray(invoice.quotation?.inclusions) ? invoice.quotation.inclusions : [],
      exclusions: Array.isArray(invoice.quotation?.exclusions) ? invoice.quotation.exclusions : [],
      quotation: invoice.quotation,
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

    await createFinanceSideNotification(req, {
      user: invoice.agent?._id || invoice.agent,
      type: "success",
      title: "Final Invoice Sent",
      message: `${invoice.invoiceNumber} final invoice has been shared by finance.${buildEmailDeliveryNote(agentEmail)}`,
      link: "/agent/bookings",
      meta: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || "",
        sentBy: senderName,
        sentAt,
        deliveryChannel: "EMAIL",
        recipientEmail: agentEmail,
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

const resolveReceiptClientName = (query = {}) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const adultTraveler = travelers.find(
    (traveler) =>
      String(traveler?.travelerType || "").trim().toLowerCase() === "adult" &&
      String(traveler?.fullName || "").trim(),
  );
  const firstTraveler = travelers.find((traveler) => String(traveler?.fullName || "").trim());
  return (
    String(adultTraveler?.fullName || "").trim() ||
    String(firstTraveler?.fullName || "").trim() ||
    "Guest"
  );
};

export const sendPaymentReceiptToAgent = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);
    const { id } = req.params;
    const normalizedRecipientEmail = String(req.body?.recipientEmail || "").trim().toLowerCase();
    const normalizedDispatchChannel = String(req.body?.dispatchChannel || "EMAIL").trim().toUpperCase();
    const normalizedRecipientPhone = String(req.body?.recipientPhone || "").trim();
    const requestedInstallmentIndex = Number(req.body?.installmentIndex);

    const invoice = await Invoice.findById(id)
      .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren travelerDetails clientEmail")
      .populate("agent", "name companyName email phone");

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

    const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
      ? invoice.paymentSubmission.trackerPayments.filter((entry) => Number(entry?.amount || 0) > 0)
      : [];
    const totalPaid = trackerPayments.length
      ? trackerPayments.reduce((sum, entry) => sum + Math.round(Number(entry?.amount || 0)), 0)
      : Math.round(Number(invoice.paymentSubmission?.amount || 0));

    const couponContext = getCouponVerificationContext(invoice);
    const expectedAmount =
      couponContext?.applied && couponContext?.payableAmount >= 0
        ? couponContext.payableAmount
        : resolveOpsConfirmedInvoiceAmount(invoice);

    if (totalPaid <= 0) {
      return next(new ApiError(400, "No verified payment amount is available to generate the receipt"));
    }

    const hasRequestedInstallment = Number.isInteger(requestedInstallmentIndex);
    if (
      hasRequestedInstallment &&
      (requestedInstallmentIndex < 0 || requestedInstallmentIndex >= trackerPayments.length)
    ) {
      return next(new ApiError(400, "Selected installment was not found for this payment tracker"));
    }

    const selectedInstallment = trackerPayments.length
      ? hasRequestedInstallment
        ? trackerPayments[requestedInstallmentIndex]
        : trackerPayments[trackerPayments.length - 1]
      : null;
    const verificationStatus = getPaymentVerificationStatus(invoice);
    const isSelectedInstallmentVerified =
      String(selectedInstallment?.verificationStatus || "").trim() === "Verified";
    if (
      !(verificationStatus === "Verified" && invoice.paymentStatus === "Paid") &&
      !isSelectedInstallmentVerified
    ) {
      return next(new ApiError(400, "Verify this installment first before sending its receipt"));
    }

    if (!["EMAIL", "WHATSAPP", "PDF"].includes(normalizedDispatchChannel)) {
      return next(new ApiError(400, "Invalid receipt sharing channel"));
    }

    const recipientEmail = normalizedRecipientEmail || String(invoice.agent?.email || "").trim().toLowerCase();
    if (normalizedDispatchChannel === "EMAIL") {
      const emailValidationError = getEmailValidationError(recipientEmail);
      if (!recipientEmail || emailValidationError) {
        return next(new ApiError(400, emailValidationError || "A valid agent email is required"));
      }
    }

    if (normalizedDispatchChannel === "WHATSAPP" && !normalizePhoneForWhatsappShare(normalizedRecipientPhone)) {
      return next(new ApiError(400, "A valid agent WhatsApp number is required"));
    }

    const receiptAmount = selectedInstallment
      ? Math.round(Number(selectedInstallment?.amount || 0))
      : totalPaid;
    const cumulativePaid = selectedInstallment
      ? trackerPayments
        .slice(0, hasRequestedInstallment ? requestedInstallmentIndex + 1 : trackerPayments.length)
        .reduce((sum, entry) => sum + Math.round(Number(entry?.amount || 0)), 0)
      : totalPaid;

    const clientName = resolveReceiptClientName(invoice.query);
    const travelerSummary = [
      clientName,
      Number(invoice.query?.numberOfAdults || 0) > 0 ? `${Math.round(Number(invoice.query?.numberOfAdults || 0))} Adults` : "",
      Number(invoice.query?.numberOfChildren || 0) > 0 ? `${Math.round(Number(invoice.query?.numberOfChildren || 0))} Children` : "",
    ].filter(Boolean).join(" - ");

    const paidBy = [
      invoice.agent?.companyName || invoice.agent?.name || "Agent",
      invoice.query?.queryId ? `Trip ID: ${invoice.query.queryId}` : "",
    ].filter(Boolean).join(" - ");
    const remainingAmount = Math.max(0, Math.round(Number(expectedAmount || 0)) - cumulativePaid);
    const receiptPaymentDate =
      selectedInstallment?.paymentDate ||
      selectedInstallment?.createdAt ||
      invoice.paymentSubmission?.paymentDate ||
      new Date();
    const receiptTitle = selectedInstallment ? "Installment Payment Receipt" : "Payment Receipt";

    const receiptPdf = await generateAgentPaymentReceiptPdf({
      invoiceNumber: invoice.invoiceNumber,
      queryCode: invoice.query?.queryId || "",
      paymentDate: receiptPaymentDate,
      paymentReference: invoice.paymentSubmission?.utrNumber || "",
      bankName: invoice.paymentSubmission?.bankName || "",
      amountPaid: receiptAmount,
      totalAmount: expectedAmount || totalPaid,
      cumulativePaid,
      remainingAmount,
      paidBy,
      destination: invoice.query?.destination || invoice.tripSnapshot?.destination || "",
      guestDetails: travelerSummary || clientName,
      startDate: invoice.query?.startDate || invoice.tripSnapshot?.startDate || null,
      endDate: invoice.query?.endDate || invoice.tripSnapshot?.endDate || null,
      generatedAt: new Date(),
      receiptTitle,
      trackerPayments: trackerPayments.filter(
        (entry) => String(entry?.verificationStatus || "").trim() === "Verified"
      ),
    });

    let serverBaseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    if (serverBaseUrl.includes("localhost")) {
      serverBaseUrl = serverBaseUrl.replace("localhost", "127.0.0.1");
    }
    const receiptUrl = `${serverBaseUrl}${receiptPdf.publicFilePath}`;
    let dispatchResult = {
      channel: normalizedDispatchChannel,
      status: "ready",
      message: "Payment receipt PDF is ready to download.",
      recipientEmail: "",
      recipientPhone: "",
      whatsappMessage: "",
    };

    if (normalizedDispatchChannel === "EMAIL") {
      try {
        await sendAgentPaymentReceiptMail(recipientEmail, {
          agentName: invoice.agent?.companyName || invoice.agent?.name || "Agent",
          clientName,
          invoiceNumber: invoice.invoiceNumber,
          queryCode: invoice.query?.queryId || "",
          destination: invoice.query?.destination || invoice.tripSnapshot?.destination || "",
          amountPaid: receiptAmount,
          cumulativePaid,
          remainingAmount,
          paymentDate: receiptPaymentDate,
          paymentReference: invoice.paymentSubmission?.utrNumber || "",
          attachmentPath: receiptPdf.absoluteFilePath,
          attachmentName: receiptPdf.fileName,
          receiptTitle,
        });
      } catch (mailError) {
        return next(
          new ApiError(
            502,
            `Receipt PDF was generated, but email delivery failed. ${getEmailDeliveryErrorMessage(mailError)}`,
          ),
        );
      }
      dispatchResult = {
        channel: "EMAIL",
        status: "sent",
        message: "Payment receipt emailed to the agent successfully.",
        recipientEmail,
        recipientPhone: "",
        whatsappMessage: "",
      };
    } else if (normalizedDispatchChannel === "WHATSAPP") {
      dispatchResult = {
        channel: "WHATSAPP",
        status: "ready",
        message: "WhatsApp receipt is ready to share.",
        recipientEmail: "",
        recipientPhone: normalizePhoneForWhatsappShare(normalizedRecipientPhone),
        whatsappMessage: buildAgentPaymentReceiptWhatsappMessage({
          agentName: invoice.agent?.companyName || invoice.agent?.name || "Agent",
          invoiceNumber: invoice.invoiceNumber,
          queryCode: invoice.query?.queryId || "",
          amountPaid: receiptAmount,
          cumulativePaid,
          remainingAmount,
          currency: invoice.currency || invoice.pricingSnapshot?.currency || "INR",
          receiptUrl,
          receiptTitle,
          trackerPayments: trackerPayments.filter(
            (entry) => String(entry?.verificationStatus || "").trim() === "Verified"
          ),
          selectedInstallment,
          destination: invoice.query?.destination || invoice.tripSnapshot?.destination || "",
          guestDetails: travelerSummary || clientName,
          startDate: invoice.query?.startDate || invoice.tripSnapshot?.startDate || null,
          endDate: invoice.query?.endDate || invoice.tripSnapshot?.endDate || null,
          creditAccount: "Leela Travels",
          bankName: selectedInstallment?.bankName || invoice.paymentSubmission?.bankName || "",
          referenceId: selectedInstallment?.utrNumber || invoice.paymentSubmission?.utrNumber || "",
        }),
      };
    }

    if (selectedInstallment) {
      selectedInstallment.receiptStatus = "Sent";
      selectedInstallment.receiptSentAt = new Date();
      selectedInstallment.receiptSentByName = req.user?.name || req.user?.companyName || "Finance Team";
      invoice.markModified("paymentSubmission.trackerPayments");
    }

    invoice.paymentReceiptDispatch = {
      status: "Sent",
      sentAt: new Date(),
      sentBy: req.user.id,
      sentByName: req.user?.name || req.user?.companyName || "Finance Team",
      recipientEmail: normalizedDispatchChannel === "EMAIL" ? recipientEmail : "",
      templateVariant: "agent-payment-receipt",
    };

    await invoice.save();

    await createFinanceSideNotification(req, {
      user: invoice.agent?._id || invoice.agent,
      type: "success",
      title: "Payment Receipt Sent",
      message: `${invoice.invoiceNumber} payment receipt has been shared by finance.${getFinanceDispatchNote(dispatchResult.channel, {
        email: dispatchResult.recipientEmail,
        phone: dispatchResult.recipientPhone,
        documentLabel: "Payment receipt",
      })}`,
      link: "/agent/bookings",
      meta: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || "",
        recipientEmail: dispatchResult.recipientEmail,
        recipientPhone: dispatchResult.recipientPhone,
        deliveryChannel: dispatchResult.channel,
        sentAt: invoice.paymentReceiptDispatch.sentAt,
      },
    });

    res.status(200).json({
      success: true,
      message:
        dispatchResult.message ||
        (selectedInstallment
          ? "Installment payment receipt shared with the agent successfully"
          : "Payment receipt shared with the agent successfully"),
      data: formatPaymentVerificationRow(invoice.toObject()),
      receiptDocument: {
        name: receiptPdf.fileName,
        filePath: receiptPdf.publicFilePath,
      },
      dispatch: dispatchResult,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentTrackerInstallment = async (req, res, next) => {
  try {
    const accessContext = await ensureFinanceApiAccess(req);
    const { id, installmentIndex } = req.params;
    const normalizedInstallmentIndex = Number(installmentIndex);

    if (!Number.isInteger(normalizedInstallmentIndex) || normalizedInstallmentIndex < 0) {
      return next(new ApiError(400, "Invalid installment index"));
    }

    const invoice = await Invoice.findById(id)
      .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren travelerDetails clientEmail")
      .populate("agent", "name companyName email phone");

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

    const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
      ? invoice.paymentSubmission.trackerPayments
      : [];

    if (!trackerPayments.length || !trackerPayments[normalizedInstallmentIndex]) {
      return next(new ApiError(404, "Installment not found"));
    }

    const targetEntry = trackerPayments[normalizedInstallmentIndex];
    const installmentAmount = Math.round(Number(targetEntry?.amount || 0));
    if (installmentAmount <= 0) {
      return next(new ApiError(400, "Installment amount is invalid"));
    }

    const reviewerName = req.user?.name || req.user?.companyName || "Finance Team";
    const verifiedAt = new Date();

    targetEntry.verificationStatus = "Verified";
    targetEntry.verifiedAt = verifiedAt;
    targetEntry.verifiedBy = req.user.id;
    targetEntry.verifiedByName = reviewerName;

    invoice.markModified("paymentSubmission.trackerPayments");
    invoice.paymentAuditTrail.push({
      action: "Verified",
      status: invoice.paymentVerification?.status || "Pending",
      reason: "",
      remarks: `Installment ${normalizedInstallmentIndex + 1} verified for ${formatNotificationCurrency(installmentAmount)} by ${reviewerName}`,
      performedBy: req.user.id,
      performedByName: reviewerName,
      performedAt: verifiedAt,
    });

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: `Installment ${normalizedInstallmentIndex + 1} verified successfully`,
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
      dispatchChannel = "",
      dispatchRecipientEmail = "",
      dispatchRecipientPhone = "",
    } = req.body || {};

    if (!["Approved", "Rejected", "Paid", "Partially Paid"].includes(status)) {
      return next(new ApiError(400, "Invalid internal invoice status"));
    }

    let invoice = await InternalInvoice.findById(id)
      .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren")
      .populate("dmc", "name companyName email phone")
      .populate("assignedTo", "name companyName email")
      .populate("agent", "name companyName email phone");
    let isSettlementBatch = false;

    if (!invoice) {
      invoice = await DmcSettlementBatch.findById(id)
        .populate("dmc", "name companyName email phone")
        .populate("assignedTo", "name companyName email");
      isSettlementBatch = Boolean(invoice);
    }

    if (!invoice) {
      return next(new ApiError(404, "Internal invoice not found"));
    }

    ensureFinanceRecordAccess({
      teamMembers: accessContext.teamMembers,
      accessContext,
      explicitAssigneeIds: [invoice.assignedTo, invoice.reviewedBy],
      fallbackSeed: invoice.invoiceNumber || normalizeEntityId(invoice._id),
    });

    if (["Approved", "Paid", "Partially Paid"].includes(status)) {
      const amountValidation = getUploadedInvoiceAmountValidation(invoice);
      if (!amountValidation.passed) {
        return next(new ApiError(400, amountValidation.message));
      }
    }

    const reviewerName = req.user?.name || req.user?.companyName || "Finance Team";
    const reviewedAt = new Date();
    const normalizedDispatchChannel = String(dispatchChannel || "").trim().toUpperCase();
    const normalizedDispatchEmail = String(dispatchRecipientEmail || "").trim().toLowerCase();
    const normalizedDispatchPhone = String(dispatchRecipientPhone || "").trim();
    let receiptDocument = null;
    let dispatchResult = {
      channel: normalizedDispatchChannel || "",
      status: "skipped",
      message: "",
      recipientEmail: normalizedDispatchEmail,
      recipientPhone: normalizedDispatchPhone,
      whatsappMessage: "",
    };

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

    if (status === "Paid" || status === "Partially Paid") {
      if (!payoutReference || !payoutDate || !payoutBank || Number(payoutAmount || 0) <= 0) {
        return next(new ApiError(400, "Payout reference, date, bank, and amount are required"));
      }

      const totalExpected = Number(invoice.summary?.grandTotal || 0);
      const newAmount = Number(payoutAmount || 0);

      // Handle legacy payouts integration
      if (invoice.payoutAmount > 0 && (!invoice.payoutInstallments || invoice.payoutInstallments.length === 0)) {
        invoice.payoutInstallments = [
          {
            amount: invoice.payoutAmount,
            utrNumber: invoice.payoutReference || "Legacy",
            bankName: invoice.payoutBank || "Legacy",
            paymentDate: invoice.payoutDate || invoice.updatedAt || new Date(),
            financeNotes: invoice.financeNotes || "Legacy payment",
            paidBy: invoice.reviewedBy || req.user.id,
            paidByName: invoice.reviewedByName || "Finance Team",
            createdAt: invoice.reviewedAt || invoice.updatedAt || new Date(),
          },
        ];
      }

      // Sum existing installments
      const alreadyPaid = (invoice.payoutInstallments || []).reduce(
        (sum, entry) => sum + Number(entry.amount || 0),
        0
      );

      const remainingBefore = Math.max(0, totalExpected - alreadyPaid);
      const roundedRemainingBefore = Math.round(remainingBefore);
      const roundedNewAmount = Math.round(newAmount);

      if (roundedNewAmount > roundedRemainingBefore) {
        return next(new ApiError(400, `Payout amount Rs ${roundedNewAmount} exceeds remaining balance of Rs ${roundedRemainingBefore}`));
      }

      if (normalizedDispatchChannel === "EMAIL") {
        const emailValidationError = getEmailValidationError(normalizedDispatchEmail);
        if (!normalizedDispatchEmail || emailValidationError) {
          return next(new ApiError(400, emailValidationError || "A valid DMC email address is required"));
        }
      }

      if (normalizedDispatchChannel === "WHATSAPP" && !normalizePhoneForWhatsappShare(normalizedDispatchPhone)) {
        return next(new ApiError(400, "A valid DMC WhatsApp number is required"));
      }

      // Push new installment
      invoice.payoutInstallments.push({
        amount: roundedNewAmount,
        utrNumber: String(payoutReference).trim(),
        bankName: String(payoutBank).trim(),
        paymentDate: new Date(payoutDate),
        financeNotes: String(reason || adminMessage || "").trim() || "Payout confirmed by finance",
        paidBy: req.user.id,
        paidByName: reviewerName,
        createdAt: reviewedAt,
      });

      const newCumulativePaid = alreadyPaid + roundedNewAmount;

      invoice.payoutAmount = newCumulativePaid;
      invoice.payoutReference = String(payoutReference).trim();
      invoice.payoutDate = new Date(payoutDate);
      invoice.payoutBank = String(payoutBank).trim();
      invoice.financeNotes = String(reason || adminMessage || "").trim() || "Payout confirmed by finance";

      if (Math.round(newCumulativePaid) >= Math.round(totalExpected)) {
        invoice.status = "Paid";
      } else {
        invoice.status = "Partially Paid";
      }
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

    if (status === "Paid" || status === "Partially Paid") {
      const totalExpected = Number(invoice.summary?.grandTotal || 0);
      const currentInst = invoice.payoutInstallments[invoice.payoutInstallments.length - 1];

      const payoutReceipt = await generatePayoutReceiptPdf({
        invoiceNumber: invoice.invoiceNumber,
        queryCode: invoice.query?.queryId || invoice.queryCode || invoice.batchNumber || "",
        payoutDate: currentInst ? currentInst.paymentDate : invoice.payoutDate,
        payoutReference: currentInst ? currentInst.utrNumber : invoice.payoutReference,
        payoutAmount: currentInst ? currentInst.amount : invoice.payoutAmount,
        payoutBank: currentInst ? currentInst.bankName : invoice.payoutBank,
        totalAmount: totalExpected,
        cumulativePaid: invoice.payoutAmount,
        remainingAmount: Math.max(0, totalExpected - invoice.payoutAmount),
        currency: invoice.items?.[0]?.currency || "INR",
        destination: invoice.query?.destination || invoice.destination || (isSettlementBatch ? "Bulk Settlement" : ""),
        dmcName:
          invoice.dmc?.companyName ||
          invoice.dmc?.name ||
          invoice.dmcName ||
          invoice.supplierName ||
          "DMC Partner",
        adults: Number(invoice.query?.numberOfAdults || 0),
        children: Number(invoice.query?.numberOfChildren || 0),
        startDate: invoice.query?.startDate || null,
        endDate: invoice.query?.endDate || null,
        generatedAt: reviewedAt,
        trackerPayments: invoice.payoutInstallments,
      });

      receiptDocument = {
        name: payoutReceipt.fileName,
        filePath: payoutReceipt.publicFilePath,
      };
      if (currentInst) {
        currentInst.receiptUrl = payoutReceipt.publicFilePath;
        currentInst.filePath = payoutReceipt.publicFilePath;
      }
      invoice.payoutReceiptUrl = payoutReceipt.publicFilePath;
      invoice.documents = Array.isArray(invoice.documents) ? invoice.documents : [];
      invoice.documents.push({
        name: payoutReceipt.fileName,
        filePath: payoutReceipt.publicFilePath,
        size: "",
        kind: "payout_receipt",
      });
      await invoice.save();

      let serverBaseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
      if (serverBaseUrl.includes("localhost")) {
        serverBaseUrl = serverBaseUrl.replace("localhost", "127.0.0.1");
      }
      const receiptUrl = `${serverBaseUrl}${payoutReceipt.publicFilePath}`;

      if (normalizedDispatchChannel === "EMAIL") {
        try {
          await sendDmcPayoutReceiptMail(normalizedDispatchEmail, {
            dmcName:
              invoice.dmc?.companyName ||
              invoice.dmc?.name ||
              invoice.dmcName ||
              invoice.supplierName ||
              "DMC Partner",
            invoiceNumber: invoice.invoiceNumber,
            queryCode: invoice.query?.queryId || invoice.queryCode || invoice.batchNumber || "",
            destination: invoice.query?.destination || invoice.destination || (isSettlementBatch ? "Bulk Settlement" : ""),
            payoutAmount: currentInst ? currentInst.amount : invoice.payoutAmount,
            payoutDate: currentInst ? currentInst.paymentDate : invoice.payoutDate,
            payoutReference: currentInst ? currentInst.utrNumber : invoice.payoutReference,
            currency: invoice.items?.[0]?.currency || "INR",
            attachmentPath: payoutReceipt.absoluteFilePath,
            attachmentName: payoutReceipt.fileName,
          });
          dispatchResult = {
            channel: "EMAIL",
            status: "sent",
            message: "Payment receipt emailed to the DMC successfully.",
            recipientEmail: normalizedDispatchEmail,
            recipientPhone: "",
            whatsappMessage: "",
          };
        } catch (dispatchError) {
          dispatchResult = {
            channel: "EMAIL",
            status: "failed",
            message: dispatchError?.message || "Payment receipt email could not be sent.",
            recipientEmail: normalizedDispatchEmail,
            recipientPhone: "",
            whatsappMessage: "",
          };
        }
      } else if (normalizedDispatchChannel === "WHATSAPP") {
        dispatchResult = {
          channel: "WHATSAPP",
          status: "ready",
          message: "WhatsApp receipt is ready to share.",
          recipientEmail: "",
          recipientPhone: normalizePhoneForWhatsappShare(normalizedDispatchPhone),
          whatsappMessage: buildDmcPayoutWhatsappMessage({
            dmcName:
              invoice.dmc?.companyName ||
              invoice.dmc?.name ||
              invoice.dmcName ||
              invoice.supplierName ||
              "Partner",
            invoiceNumber: invoice.invoiceNumber,
            queryCode: invoice.query?.queryId || invoice.queryCode || invoice.batchNumber || "",
            payoutAmount: currentInst ? currentInst.amount : invoice.payoutAmount,
            cumulativePaid: invoice.payoutAmount,
            remainingAmount: Math.max(0, totalExpected - invoice.payoutAmount),
            currency: invoice.items?.[0]?.currency || "INR",
            receiptUrl,
            payoutInstallments: invoice.payoutInstallments,
            currentInstallment: currentInst,
            destination: invoice.query?.destination || invoice.destination || (isSettlementBatch ? "Bulk Settlement" : ""),
            guestDetails: [
              Number(invoice.query?.numberOfAdults || 0) > 0 ? `${invoice.query.numberOfAdults} Adults` : "",
              Number(invoice.query?.numberOfChildren || 0) > 0 ? `${invoice.query.numberOfChildren} Children` : "",
            ].filter(Boolean).join(" - "),
            startDate: invoice.query?.startDate || null,
            endDate: invoice.query?.endDate || null,
            bankName: currentInst ? currentInst.bankName : invoice.payoutBank || "",
            referenceId: currentInst ? currentInst.utrNumber : invoice.payoutReference || "",
          }),
        };
      } else if (normalizedDispatchChannel === "PDF") {
        dispatchResult = {
          channel: "PDF",
          status: "ready",
          message: "Payment receipt PDF is ready to download.",
          recipientEmail: "",
          recipientPhone: "",
          whatsappMessage: "",
        };
      }
    }

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
            )}.${getFinanceDispatchNote(dispatchResult.channel, {
              email: dispatchResult.recipientEmail,
              phone: dispatchResult.recipientPhone,
              documentLabel: "Payment receipt",
            })}`,
          };

    await createFinanceSideNotification(req, {
      user: invoice.dmc?._id || invoice.dmc,
      ...notificationPayload,
      link: "/dmc/confirmation",
      meta: {
        internalInvoiceId: invoice._id,
        settlementType: isSettlementBatch ? "bulk" : "single",
        invoiceNumber: invoice.invoiceNumber,
        queryId: invoice.query?.queryId || invoice.queryCode || invoice.batchNumber || "",
        status,
        payoutAmount: invoice.payoutAmount || 0,
        payoutBank: invoice.payoutBank || "",
        payoutDate: invoice.payoutDate || null,
        dispatchChannel: dispatchResult.channel || "",
        dispatchStatus: dispatchResult.status || "",
        recipientEmail: dispatchResult.recipientEmail || "",
        recipientPhone: dispatchResult.recipientPhone || "",
      },
    });

    const shouldNotifyAdmin = status === "Rejected" && Boolean(notifyAdmin);
    if (shouldNotifyAdmin) {
      invoice.escalatedToAdmin = true;
      await invoice.save();

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
              queryNumber: invoice.query?.queryId || invoice.queryCode || invoice.batchNumber || "",
              mismatchReason: normalizedMismatchReason,
              adminMessage: normalizedAdminMessage,
              financeNotes: invoice.financeNotes || "",
              source: "finance_internal_invoice_mismatch",
            },
          })),
        );
      }
    }

    const quotation = invoice.query
      ? await Quotation.findOne({ queryId: invoice.query?._id || invoice.query })
        .sort({ createdAt: -1 })
        .lean()
      : null;

    res.status(200).json({
      success: true,
      message: `Internal invoice marked as ${status.toLowerCase()}`,
      data: formatInternalInvoiceRow(
        {
          ...invoice.toObject(),
          settlementType: isSettlementBatch ? "bulk" : "single",
          queryCode: isSettlementBatch ? `${invoice.coveredQueries?.length || 0} bookings` : invoice.queryCode,
          destination: isSettlementBatch ? "Bulk Settlement" : invoice.destination,
        },
        quotation,
      ),
      receiptDocument,
      dispatch: dispatchResult,
    });
  } catch (error) {
    next(error);
  }
};
