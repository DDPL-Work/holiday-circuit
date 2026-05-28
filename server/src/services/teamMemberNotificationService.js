import mongoose from "mongoose";
import Auth from "../models/auth.model.js";
import Notification from "../models/notification.model.js";

const ROLE_LABELS = {
  admin: "Super Admin",
  operations: "Ops Team",
  finance_partner: "Finance Team",
  dmc_partner: "DMC Partner",
  operation_manager: "Operation Manager",
  finance_manager: "Finance Manager",
};

const DASHBOARD_LINKS = {
  admin: "/admin/user-management",
  operations: "/ops/dashboard",
  finance_partner: "/finance/dashboard",
  dmc_partner: "/dmc/dashboard",
  operation_manager: "/operationManager/operationManagerDashboard",
  finance_manager: "/financeManager/financeManagerDashboard",
};

const getRoleLabel = (role = "") => ROLE_LABELS[String(role || "").trim()] || String(role || "").trim();
const getDashboardLink = (role = "") => DASHBOARD_LINKS[String(role || "").trim()] || "";

const buildIdentityMatch = (value = "") => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return [];

  const conditions = [
    { name: normalizedValue },
    { email: normalizedValue.toLowerCase() },
    { employeeId: normalizedValue },
  ];

  if (mongoose.Types.ObjectId.isValid(normalizedValue)) {
    conditions.unshift({ _id: normalizedValue });
  }

  return conditions;
};

const resolveManagerUser = async (managerRef = "", expectedRoles = []) => {
  const identityConditions = buildIdentityMatch(managerRef);
  if (!identityConditions.length) {
    return null;
  }

  const query = {
    isDeleted: { $ne: true },
    accountStatus: { $ne: "Inactive" },
    $or: identityConditions,
  };

  if (Array.isArray(expectedRoles) && expectedRoles.length) {
    query.role = { $in: expectedRoles };
  }

  return Auth.findOne(query).select("_id name role");
};

const getActiveAdmins = async () =>
  Auth.find({
    role: "admin",
    isDeleted: { $ne: true },
    accountStatus: { $ne: "Inactive" },
  }).select("_id");

const dedupeNotifications = (payloads = []) => {
  const seen = new Set();

  return payloads.filter((payload) => {
    const key = [
      String(payload?.user || ""),
      String(payload?.title || ""),
      String(payload?.message || ""),
      String(payload?.link || ""),
    ].join("::");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const notifyTeamMemberCreationStakeholders = async ({
  createdUser = null,
  actorUserId = "",
  actorRole = "",
  actorName = "",
  managerRef = "",
  expectedManagerRoles = [],
  includeAdminBroadcast = false,
} = {}) => {
  if (!createdUser?._id) {
    return [];
  }

  const createdUserRoleLabel = getRoleLabel(createdUser.role);
  const createdUserDesignation = String(createdUser.designation || createdUserRoleLabel).trim();
  const actorLabel = String(actorName || getRoleLabel(actorRole) || "Manager").trim();
  const payloads = [
    {
      user: createdUser._id,
      type: "success",
      title: "Account Created",
      message: `Your ${createdUserDesignation} account is ready on Holiday Circuit.`,
      link: getDashboardLink(createdUser.role),
      meta: {
        kind: "managed_user_account",
        action: "created",
        role: createdUser.role,
        createdByRole: actorRole || "",
      },
    },
  ];

  if (actorUserId) {
    payloads.push({
      user: actorUserId,
      type: "success",
      title: "Team Member Added",
      message: `${createdUser.name || "Team member"} was added as ${createdUserDesignation}.`,
      link: getDashboardLink(actorRole),
      meta: {
        kind: "team_member_created",
        createdUserId: createdUser._id,
        createdUserRole: createdUser.role,
      },
    });
  }

  const resolvedManager = await resolveManagerUser(managerRef, expectedManagerRoles);
  if (resolvedManager && String(resolvedManager._id) !== String(actorUserId || "")) {
    payloads.push({
      user: resolvedManager._id,
      type: "info",
      title: "New Team Member Assigned",
      message: `${createdUser.name || "A team member"} joined your team as ${createdUserDesignation}.`,
      link: getDashboardLink(resolvedManager.role),
      meta: {
        kind: "team_member_created",
        createdUserId: createdUser._id,
        createdUserRole: createdUser.role,
      },
    });
  }

  if (includeAdminBroadcast) {
    const adminUsers = await getActiveAdmins();

    adminUsers.forEach((adminUser) => {
      payloads.push({
        user: adminUser._id,
        type: "info",
        title: "Team Member Added",
        message: `${createdUser.name || "A team member"} was added by ${actorLabel} as ${createdUserDesignation}.`,
        link: getDashboardLink("admin"),
        meta: {
          kind: "team_member_created",
          createdUserId: createdUser._id,
          createdUserRole: createdUser.role,
          createdByRole: actorRole || "",
        },
      });
    });
  }

  const uniquePayloads = dedupeNotifications(payloads);
  if (!uniquePayloads.length) {
    return [];
  }

  return Notification.insertMany(uniquePayloads);
};
