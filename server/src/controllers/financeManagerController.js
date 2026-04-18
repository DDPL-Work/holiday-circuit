import bcrypt from "bcrypt";
import Auth from "../models/auth.model.js";
import Invoice from "../models/invoice.model.js";
import ApiError from "../utils/ApiError.js";
import { sendTeamMemberCredentialsMail } from "../services/sendEmail.js";
import {
  decorateFinanceAssignment,
  getManagedFinanceMembers,
  normalizeEntityId,
} from "../services/financeTeamScopeService.js";

const avatarPalette = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
];

const TEAM_ROLE = "finance_partner";
const ROLE_LABEL = "Finance Executive";
const TEAM_DEPARTMENT = "Finance";
const TEAM_DESIGNATION = "Finance Executive";
const TEAM_DEFAULT_PERMISSIONS = ["View", "Edit", "Export", "Manage Verifications"];

const ensureFinanceManagerAccess = (req) => {
  if (req.user?.role !== "finance_manager") {
    throw new ApiError(403, "Only finance managers can access this area");
  }
};

const initials = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "FM";

const getAvatarStyle = (name = "") => {
  const seed = String(name || "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return avatarPalette[seed % avatarPalette.length];
};

const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
};

const parseDateOnly = (value = "", { endOfDay = false } = {}) => {
  if (!value) return null;

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (endOfDay) {
    parsedDate.setHours(23, 59, 59, 999);
  } else {
    parsedDate.setHours(0, 0, 0, 0);
  }

  return parsedDate;
};

const getInvoiceActivityDate = (invoice = {}) => {
  const candidates = [
    invoice?.paymentVerification?.reviewedAt,
    invoice?.paymentVerification?.teamDecisionAt,
    invoice?.paymentSubmission?.submittedAt,
    invoice?.updatedAt,
    invoice?.createdAt,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
};

const isWithinDateWindow = (value, startDate, endDate) => {
  const parsedValue = value instanceof Date ? value : value ? new Date(value) : null;
  if (!parsedValue || Number.isNaN(parsedValue.getTime())) {
    return !startDate && !endDate;
  }

  if (startDate && parsedValue < startDate) {
    return false;
  }

  if (endDate && parsedValue > endDate) {
    return false;
  }

  return true;
};

const generateTemporaryPassword = () => {
  const random = Math.random().toString(36).slice(2, 8);
  const suffix = `${Math.floor(100 + Math.random() * 900)}`;
  return `HC@${random}${suffix}`;
};

const normalizePermissionList = (permissions = []) =>
  [...new Set(
    (Array.isArray(permissions) ? permissions : [])
      .map((permission) => String(permission || "").trim())
      .filter(Boolean),
  )];

const buildFinanceTeamRows = (teamMembers = [], assignedInvoices = []) =>
  teamMembers.map((member) => {
    const memberId = normalizeEntityId(member._id);
    const handledInvoices = assignedInvoices.filter(
      (invoice) => normalizeEntityId(invoice?.assignedFinanceId) === memberId,
    );
    const settled = handledInvoices.filter(
      (invoice) => String(invoice?.reviewStatus || "") === "Verified",
    ).length;
    const escalated = handledInvoices.filter(
      (invoice) => String(invoice?.reviewStatus || "") === "Rejected",
    ).length;
    const pending = handledInvoices.filter(
      (invoice) => String(invoice?.reviewStatus || "") === "Pending",
    ).length;
    const reviewedCount = settled + escalated;
    const accuracy = reviewedCount ? round((settled / reviewedCount) * 100, 0) : 0;

    let status = "Active";
    if (String(member.accountStatus || "") !== "Active") {
      status = "At Risk";
    } else if (reviewedCount > 0 && accuracy < 80) {
      status = "At Risk";
    } else if (escalated > 0) {
      status = "Busy";
    }

    const avatar = getAvatarStyle(member.name);

    return {
      id: memberId,
      name: member.name || ROLE_LABEL,
      email: member.email || "",
      employeeId: member.employeeId || "",
      profileImage: member.profileImage || "",
      initials: initials(member.name),
      avatarColor: `${avatar.bg} ${avatar.text}`,
      pending,
      settled,
      escalated,
      reviewedCount,
      accuracy,
      status,
      accountStatus: member.accountStatus || "Active",
      createdAt: member.createdAt || null,
    };
  });

export const getFinanceManagerTeam = async (req, res, next) => {
  try {
    ensureFinanceManagerAccess(req);

    const startDate = parseDateOnly(req.query?.fromDate || req.query?.startDate || "");
    const endDate = parseDateOnly(req.query?.toDate || req.query?.endDate || "", {
      endOfDay: true,
    });

    if ((req.query?.fromDate || req.query?.startDate) && !startDate) {
      return next(new ApiError(400, "Invalid from date"));
    }

    if ((req.query?.toDate || req.query?.endDate) && !endDate) {
      return next(new ApiError(400, "Invalid to date"));
    }

    if (startDate && endDate && startDate > endDate) {
      return next(new ApiError(400, "From date cannot be after to date"));
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const manager = await Auth.findById(req.user.id).select("name email employeeId _id");

    if (!manager) {
      return next(new ApiError(404, "Manager profile not found"));
    }

    const teamMembers = await getManagedFinanceMembers(manager);
    const teamIds = teamMembers.map((member) => member._id);
    const assignedInvoices = teamIds.length
      ? await Invoice.find({
        $or: [
          { "paymentSubmission.submittedAt": { $exists: true, $ne: null } },
          { "paymentVerification.reviewedBy": { $in: teamIds } },
          { "paymentVerification.status": { $in: ["Pending", "Verified", "Rejected"] } },
          { paymentStatus: { $in: ["Partially Paid", "Paid", "Unpaid"] } },
        ],
      }).select("invoiceNumber paymentVerification paymentSubmission paymentStatus createdAt updatedAt")
      : [];

    const teamScopedInvoices = decorateFinanceAssignment({
      rows: assignedInvoices.map((invoice) => ({
        id: normalizeEntityId(invoice._id),
        invoiceNumber: invoice.invoiceNumber || "",
        reviewStatus:
          invoice?.paymentVerification?.teamDecisionStatus ||
          invoice?.paymentVerification?.status ||
          (invoice?.paymentStatus === "Paid"
            ? "Verified"
            : invoice?.paymentStatus === "Unpaid"
              ? "Rejected"
              : "Pending"),
        assignedTo: invoice?.paymentVerification?.assignedTo || null,
        teamDecisionBy: invoice?.paymentVerification?.teamDecisionBy || null,
        reviewedBy: invoice?.paymentVerification?.reviewedBy || null,
        activityAt: getInvoiceActivityDate(invoice),
      })),
      teamMembers,
      getExplicitAssigneeIds: (invoice) => [
        invoice.assignedTo,
        invoice.teamDecisionBy,
        invoice.reviewedBy,
      ],
      getFallbackSeed: (invoice) => invoice.invoiceNumber || invoice.id,
    });

    const filteredTeamScopedInvoices = teamScopedInvoices.filter((invoice) =>
      isWithinDateWindow(invoice.activityAt, startDate, endDate),
    );

    const team = buildFinanceTeamRows(teamMembers, filteredTeamScopedInvoices);
    const avgTeamAccuracy = team.length
      ? round(
        team.reduce((total, member) => total + Number(member.accuracy || 0), 0) / team.length,
        0,
      )
      : 0;

    res.status(200).json({
      success: true,
      data: {
        dateLabel: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(now),
        summary: {
          totalExecutives: team.length,
          addedThisWeek: teamMembers.filter((member) => {
            const createdAt = member?.createdAt ? new Date(member.createdAt) : null;
            return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= weekStart;
          }).length,
          atRiskExecutives: team.filter((member) => member.status === "At Risk").length,
          avgTeamAccuracy,
        },
        filters: {
          fromDate: startDate ? startDate.toISOString().slice(0, 10) : "",
          toDate: endDate ? endDate.toISOString().slice(0, 10) : "",
        },
        team,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createFinanceTeamMember = async (req, res, next) => {
  try {
    ensureFinanceManagerAccess(req);

    const {
      fullName,
      name,
      email,
      phone,
      employeeId = "",
      designation = "",
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
    const normalizedDesignation = String(designation || "").trim();
    const normalizedPermissions = normalizePermissionList(permissions);
    const normalizedPasswordMode = String(passwordMode || "auto").trim().toLowerCase();
    const normalizedAccountStatus = accountStatus === "Inactive" ? "Inactive" : "Active";
    const normalizedAccessExpiry = accessExpiry ? new Date(accessExpiry) : null;

    if (!trimmedName || !normalizedEmail || !normalizedPhone || !normalizedDesignation) {
      return next(new ApiError(400, "Name, email, phone, and designation are required"));
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

    const existingPhone = await Auth.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return next(new ApiError(400, "A user with this phone number already exists"));
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
      phone: normalizedPhone,
      employeeId: normalizedEmployeeId || undefined,
      password: hashedPassword,
      role: TEAM_ROLE,
      manager: String(req.user?.id || ""),
      department: TEAM_DEPARTMENT,
      designation: normalizedDesignation || TEAM_DESIGNATION,
      permissions: normalizedPermissions.length ? normalizedPermissions : TEAM_DEFAULT_PERMISSIONS,
      accountStatus: normalizedAccountStatus,
      accessExpiry: normalizedAccessExpiry,
      isApproved: true,
    });

    let credentialsEmailSent = false;

    if (sendWelcome) {
      try {
        await sendTeamMemberCredentialsMail(normalizedEmail, {
          name: trimmedName,
          role: ROLE_LABEL,
          loginEmail: normalizedEmail,
          password: initialPassword,
        });
        credentialsEmailSent = true;
      } catch (error) {
        credentialsEmailSent = false;
      }
    }

    res.status(201).json({
      success: true,
      message: credentialsEmailSent
        ? "Finance executive added successfully and credentials were emailed"
        : "Finance executive added successfully",
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
      },
      credentialsEmailSent,
      temporaryPassword: credentialsEmailSent ? "" : initialPassword,
    });
  } catch (error) {
    next(error);
  }
};
