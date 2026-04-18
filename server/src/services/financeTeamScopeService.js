import Auth from "../models/auth.model.js";
import Counter from "../models/counter.model.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

const TEAM_ROLE = "finance_partner";

const normalizeValue = (value = "") => String(value || "").trim();

export const normalizeEntityId = (value = "") => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    return String(value?._id || value?.id || value || "").trim();
  }
  return String(value).trim();
};

export const getManagerIdentityCandidates = (manager = {}) =>
  [...new Set([
    normalizeValue(manager?._id),
    normalizeValue(manager?.id),
    normalizeValue(manager?.name),
    normalizeValue(manager?.email),
    normalizeValue(manager?.employeeId),
  ].filter(Boolean))];

const stableHash = (seed = "") =>
  String(seed || "")
    .split("")
    .reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 0);

const getStableAssigneeFromSeed = (seed = "", teamMembers = []) => {
  if (!teamMembers.length) return "";
  const normalizedSeed = normalizeValue(seed);
  const index = stableHash(normalizedSeed || "finance-team") % teamMembers.length;
  return normalizeEntityId(teamMembers[index]?._id);
};

export const getActiveFinanceMembersForAssignment = async () =>
  Auth.find({
    role: TEAM_ROLE,
    isDeleted: { $ne: true },
    accountStatus: "Active",
  })
    .select("name email employeeId manager profileImage accountStatus createdAt")
    .sort({ createdAt: 1, name: 1 });

const resolveManagerByIdentity = async (identity = "") => {
  const normalizedIdentity = normalizeValue(identity);
  if (!normalizedIdentity) return null;

  const conditions = [
    { email: normalizedIdentity.toLowerCase() },
    { employeeId: normalizedIdentity },
    { name: normalizedIdentity },
  ];

  if (mongoose.Types.ObjectId.isValid(normalizedIdentity)) {
    conditions.unshift({ _id: normalizedIdentity });
  }

  return Auth.findOne({
    isDeleted: { $ne: true },
    $or: conditions,
  }).select("name email employeeId _id");
};

export const getManagedFinanceMembers = async (managerIdentity = "") => {
  const normalizedIdentity = normalizeValue(managerIdentity);
  if (!normalizedIdentity) return [];

  const manager =
    typeof managerIdentity === "object" && managerIdentity !== null
      ? managerIdentity
      : await resolveManagerByIdentity(normalizedIdentity);

  const identityCandidates = manager
    ? getManagerIdentityCandidates(manager)
    : [normalizedIdentity];

  return Auth.find({
    role: TEAM_ROLE,
    isDeleted: { $ne: true },
    manager: { $in: identityCandidates },
  })
    .select("name email employeeId manager profileImage accountStatus createdAt")
    .sort({ createdAt: 1, name: 1 });
};

export const getRoundRobinFinanceAssignee = async ({ keepAssigneeId = "" } = {}) => {
  const activeFinanceMembers = await getActiveFinanceMembersForAssignment();
  if (!activeFinanceMembers.length) return null;

  const normalizedAssigneeId = normalizeEntityId(keepAssigneeId);
  const existingAssignee = activeFinanceMembers.find(
    (member) => normalizeEntityId(member._id) === normalizedAssigneeId,
  );

  if (existingAssignee) {
    return existingAssignee;
  }

  let counter = await Counter.findOne({ name: "finance_payment_assign" });
  if (!counter) {
    counter = await Counter.create({
      name: "finance_payment_assign",
      seq: 0,
    });
  }

  const financeIndex = counter.seq % activeFinanceMembers.length;
  const assignedFinanceMember = activeFinanceMembers[financeIndex];

  counter.seq += 1;
  await counter.save();

  return assignedFinanceMember;
};

export const getFinanceAccessContext = async (user = {}) => {
  if (user?.role === "admin") {
    return {
      scope: "admin",
      teamMembers: [],
      teamMemberIds: [],
      currentUserId: normalizeEntityId(user?.id || user?._id),
    };
  }

  if (user?.role === "finance_manager") {
    const manager = await Auth.findById(user.id).select("name email employeeId _id role isDeleted");

    if (!manager || manager.isDeleted) {
      throw new ApiError(404, "Finance manager profile not found");
    }

    const teamMembers = await getManagedFinanceMembers(manager);

    return {
      scope: "manager",
      manager,
      teamMembers,
      teamMemberIds: teamMembers.map((member) => normalizeEntityId(member._id)),
      currentUserId: normalizeEntityId(manager._id),
    };
  }

  if (user?.role === TEAM_ROLE) {
    const financeUser = await Auth.findById(user.id).select(
      "name email employeeId manager _id role isDeleted accountStatus",
    );

    if (!financeUser || financeUser.isDeleted) {
      throw new ApiError(404, "Finance executive profile not found");
    }

    const managerIdentity = normalizeValue(financeUser.manager);
    if (!managerIdentity) {
      throw new ApiError(
        403,
        "This finance account is not mapped to any finance manager team",
      );
    }

    const manager = await resolveManagerByIdentity(managerIdentity);
    const teamMembers = await getManagedFinanceMembers(manager || managerIdentity);
    const currentUserId = normalizeEntityId(financeUser._id);
    const teamMemberIds = teamMembers.map((member) => normalizeEntityId(member._id));

    if (!teamMemberIds.includes(currentUserId)) {
      throw new ApiError(
        403,
        "This finance account is not part of an active finance manager team",
      );
    }

    return {
      scope: "member",
      manager,
      currentMember: financeUser,
      teamMembers,
      teamMemberIds,
      currentUserId,
    };
  }

  throw new ApiError(403, "Not authorized");
};

export const resolveFinanceAssigneeId = ({
  teamMembers = [],
  explicitAssigneeIds = [],
  fallbackSeed = "",
}) => {
  const teamMemberIds = new Set(teamMembers.map((member) => normalizeEntityId(member._id)));
  const matchedAssignee = explicitAssigneeIds
    .map((value) => normalizeEntityId(value))
    .find((value) => teamMemberIds.has(value));

  if (matchedAssignee) {
    return matchedAssignee;
  }

  return getStableAssigneeFromSeed(fallbackSeed, teamMembers);
};

export const decorateFinanceAssignment = ({
  rows = [],
  teamMembers = [],
  getExplicitAssigneeIds = () => [],
  getFallbackSeed = () => "",
}) => {
  const teamMembersById = new Map(
    teamMembers.map((member) => [normalizeEntityId(member._id), member]),
  );

  return rows.map((row) => {
    const assignedFinanceId = resolveFinanceAssigneeId({
      teamMembers,
      explicitAssigneeIds: getExplicitAssigneeIds(row),
      fallbackSeed: getFallbackSeed(row),
    });
    const assignedMember = teamMembersById.get(assignedFinanceId);

    return {
      ...row,
      assignedFinanceId,
      assignedFinanceName: assignedMember?.name || "",
      assignedFinanceEmail: assignedMember?.email || "",
      assignedFinanceEmployeeId: assignedMember?.employeeId || "",
    };
  });
};

export const filterRowsByFinanceAccess = ({
  rows = [],
  accessContext = null,
}) => {
  if (!accessContext || accessContext.scope === "admin") {
    return rows;
  }

  const teamMemberIds = new Set(accessContext.teamMemberIds || []);

  if (accessContext.scope === "manager") {
    return rows.filter((row) => teamMemberIds.has(normalizeEntityId(row.assignedFinanceId)));
  }

  return rows.filter(
    (row) => normalizeEntityId(row.assignedFinanceId) === accessContext.currentUserId,
  );
};
