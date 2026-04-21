import bcrypt from "bcrypt";
import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import Notification from "../models/notification.model.js";
import TravelQuery from "../models/TravelQuery.model.js";
import Quotation from "../models/quotation.model.js";

import { sendTeamMemberCredentialsMail } from "../services/sendEmail.js";

const TERMINAL_OPS_STATUSES = new Set(["Rejected", "Vouchered"]);
const TERMINAL_AGENT_STATUSES = new Set(["Rejected"]);
const CONVERTED_AGENT_STATUSES = new Set(["Client Approved", "Confirmed"]);
const REASSIGNABLE_OPS_STATUSES = new Set([
  "New_Query",
  "Pending_Accept",
  "Revision_Query",
  "Booking_Accepted",
  "Invoice_Requested",
  "Confirmed",
]);
const NEW_QUERY_STATUSES = new Set(["New_Query", "Pending_Accept"]);

const avatarPalette = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
];

const ROLE_LABEL = "Ops Executive";
const TEAM_DEPARTMENT = "Operations";
const TEAM_DESIGNATION = "Operations Executive";
const TEAM_DEFAULT_PERMISSIONS = ["View", "Edit", "Export", "Manage Booking"];

const ensureOperationManagerAccess = (req) => {
  if (req.user?.role !== "operation_manager") {
    throw new ApiError(403, "Only operation managers can access this area");
  }
};

const ensureQuotationTrackerAccess = (req) => {
  if (!["operation_manager", "admin"].includes(req.user?.role)) {
    throw new ApiError(403, "Only operation managers or admins can access this area");
  }
};

const initials = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "OP";

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

const generateTemporaryPassword = () => {
  const random = Math.random().toString(36).slice(2, 8);
  const suffix = `${Math.floor(100 + Math.random() * 900)}`;
  return `HC@${random}${suffix}`;
};

const formatHours = (hours) => {
  const safeHours = Number(hours || 0);

  if (!safeHours) return "0 hrs";
  if (safeHours < 1) return `${Math.max(1, Math.round(safeHours * 60))} mins`;
  if (safeHours < 10) return `${round(safeHours, 1)} hrs`;
  return `${Math.round(safeHours)} hrs`;
};

const formatDateLabel = (value, options = {}) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
};

const formatDateTimeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) =>
  `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))}`;

const getISOWeek = (date = new Date()) => {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 4 - (target.getDay() || 7));

  const yearStart = new Date(target.getFullYear(), 0, 1);
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
};

const startOfWeek = (date = new Date()) => {
  const target = new Date(date);
  const day = (target.getDay() + 6) % 7;
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() - day);
  return target;
};

const endOfWeekExclusive = (date = new Date()) => {
  const target = startOfWeek(date);
  target.setDate(target.getDate() + 7);
  return target;
};

const startOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonthExclusive = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1);

const startOfYear = (date = new Date()) =>
  new Date(date.getFullYear(), 0, 1);

const endOfYearExclusive = (date = new Date()) =>
  new Date(date.getFullYear() + 1, 0, 1);

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatPeriodLabel = (start, endExclusive, { compact = false } = {}) => {
  if (!start || !endExclusive) return "";
  const safeStart = new Date(start);
  const safeEnd = new Date(endExclusive.getTime() - 1);

  if (Number.isNaN(safeStart.getTime()) || Number.isNaN(safeEnd.getTime())) {
    return "";
  }

  if (
    safeStart.getDate() === 1 &&
    safeEnd.getDate() === new Date(safeEnd.getFullYear(), safeEnd.getMonth() + 1, 0).getDate() &&
    safeStart.getMonth() === safeEnd.getMonth() &&
    safeStart.getFullYear() === safeEnd.getFullYear()
  ) {
    return new Intl.DateTimeFormat("en-US", {
      month: compact ? "short" : "long",
      year: "numeric",
    }).format(safeStart);
  }

  if (
    safeStart.getDate() === 1 &&
    safeStart.getMonth() === 0 &&
    safeEnd.getDate() === 31 &&
    safeEnd.getMonth() === 11 &&
    safeStart.getFullYear() === safeEnd.getFullYear()
  ) {
    return `${safeStart.getFullYear()}`;
  }

  return `${formatDateLabel(safeStart)} - ${formatDateLabel(safeEnd)}`;
};

const buildPerformanceWindow = ({ period = "current_month", startDate = "", endDate = "" } = {}) => {
  const now = new Date();
  const normalizedPeriod = String(period || "current_month").trim().toLowerCase();
  let currentStart = null;
  let currentEnd = null;
  let comparisonLabel = "vs previous period";

  if (normalizedPeriod === "previous_month") {
    currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    comparisonLabel = "vs month before";
  } else if (normalizedPeriod === "current_year") {
    currentStart = startOfYear(now);
    currentEnd = endOfYearExclusive(now);
    comparisonLabel = "vs previous year";
  } else if (normalizedPeriod === "previous_year") {
    currentStart = new Date(now.getFullYear() - 1, 0, 1);
    currentEnd = new Date(now.getFullYear(), 0, 1);
    comparisonLabel = "vs year before";
  } else if (normalizedPeriod === "custom") {
    const parsedStart = parseDateOnly(startDate);
    const parsedEnd = parseDateOnly(endDate);

    if (!parsedStart || !parsedEnd || parsedEnd < parsedStart) {
      throw new ApiError(400, "Valid custom start and end dates are required");
    }

    currentStart = parsedStart;
    currentEnd = new Date(parsedEnd);
    currentEnd.setDate(currentEnd.getDate() + 1);
    comparisonLabel = "vs previous range";
  } else {
    currentStart = startOfMonth(now);
    currentEnd = endOfMonthExclusive(now);
    comparisonLabel = "vs previous month";
  }

  const duration = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    key: normalizedPeriod === "custom" ? "custom" : normalizedPeriod,
    comparisonLabel,
    current: {
      start: currentStart,
      endExclusive: currentEnd,
      label: formatPeriodLabel(currentStart, currentEnd),
    },
    previous: {
      start: previousStart,
      endExclusive: previousEnd,
      label: formatPeriodLabel(previousStart, previousEnd),
    },
  };
};

const isWithinRange = (value, start, endExclusive) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date < endExclusive;
};

const calculateAverageQuoteHours = (queries = [], start, endExclusive) => {
  const durations = queries
    .map((query) => {
      const quoteSentAt = getQuoteSentAt(query);
      const createdAt = query?.createdAt ? new Date(query.createdAt) : null;

      if (!quoteSentAt || !createdAt || Number.isNaN(createdAt.getTime())) {
        return null;
      }

      if (!isWithinRange(quoteSentAt, start, endExclusive)) {
        return null;
      }

      return (quoteSentAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    })
    .filter((value) => value !== null && value >= 0);

  if (!durations.length) {
    return null;
  }

  return durations.reduce((total, value) => total + value, 0) / durations.length;
};

const calculateConversionRate = (queries = [], start, endExclusive) => {
  const scopedQueries = queries.filter((query) => isWithinRange(query?.createdAt, start, endExclusive));

  if (!scopedQueries.length) {
    return null;
  }

  const convertedCount = scopedQueries.filter(isConvertedQuery).length;
  return (convertedCount / scopedQueries.length) * 100;
};

const buildOpsMetricBadge = (current, previous, { lowerIsBetter = false, suffix = "vs Last Week" } = {}) => {
  if (current === null || current === undefined) {
    return null;
  }

  const currentValue = Number(current);

  if (!Number.isFinite(currentValue)) {
    return null;
  }

  const previousValue = Number(previous);

  if (!Number.isFinite(previousValue) || previousValue <= 0) {
    return {
      trend: "neutral",
      value: "This week only",
    };
  }

  const rawChange = ((currentValue - previousValue) / previousValue) * 100;
  const effectiveChange = lowerIsBetter ? -rawChange : rawChange;
  const roundedChange = round(effectiveChange, 0);

  if (!roundedChange) {
    return null;
  }

  return {
    trend: roundedChange > 0 ? "up" : "down",
    value: `${roundedChange > 0 ? "+" : "-"}${Math.abs(roundedChange)}% ${suffix}`.trim(),
  };
};

const getManagerIdentityCandidates = (manager = {}) =>
  [...new Set([
    manager._id?.toString(),
    manager.name,
    manager.email,
    manager.employeeId,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean))];

const normalizePermissionList = (permissions = []) =>
  [...new Set(
    (Array.isArray(permissions) ? permissions : [])
      .map((permission) => String(permission || "").trim())
      .filter(Boolean),
  )];

const isActiveWorkloadQuery = (query = {}) =>
  !TERMINAL_OPS_STATUSES.has(String(query?.opsStatus || "")) &&
  !TERMINAL_AGENT_STATUSES.has(String(query?.agentStatus || ""));

const clampBetween = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(value || 0)));

const getActivityTimestamps = (query = {}, action = "") =>
  (Array.isArray(query?.activityLog) ? query.activityLog : [])
    .filter((entry) => String(entry?.action || "").trim() === String(action || "").trim())
    .map((entry) => (entry?.timestamp ? new Date(entry.timestamp) : null))
    .filter((value) => value && !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

const getQuoteSentAt = (query = {}) => {
  const sentLog = Array.isArray(query?.activityLog)
    ? query.activityLog.find((entry) => String(entry?.action || "").trim() === "Quote Sent")
    : null;

  if (sentLog?.timestamp) {
    return new Date(sentLog.timestamp);
  }

  return null;
};

const getLatestActivityAt = (query = {}, action = "", { after = null } = {}) => {
  const timestamps = getActivityTimestamps(query, action);

  if (!timestamps.length) {
    return null;
  }

  const afterDate = after ? new Date(after) : null;
  const afterTime =
    afterDate && !Number.isNaN(afterDate.getTime()) ? afterDate.getTime() : null;
  const scoped = afterTime === null
    ? timestamps
    : timestamps.filter((value) => value.getTime() >= afterTime);

  return scoped.length ? scoped[scoped.length - 1] : null;
};

const isQuoteSent = (query = {}) =>
  Boolean(getQuoteSentAt(query)) || String(query?.quotationStatus || "") === "Sent_To_Agent";

const isQuoteOverdue = (query = {}) => {
  if (!isActiveWorkloadQuery(query) || isQuoteSent(query)) {
    return false;
  }

  const createdAt = query?.createdAt ? new Date(query.createdAt) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursElapsed > 48;
};

const isConvertedQuery = (query = {}) =>
  CONVERTED_AGENT_STATUSES.has(String(query?.agentStatus || "")) ||
  String(query?.opsStatus || "") === "Confirmed";

const isRequotePendingQuery = (query = {}) =>
  isActiveWorkloadQuery(query) &&
  (String(query?.opsStatus || "") === "Revision_Query" ||
    String(query?.agentStatus || "") === "Revision Requested");

const getReassignCategory = (query = {}) => {
  if (NEW_QUERY_STATUSES.has(String(query?.opsStatus || ""))) {
    return { key: "new", label: "New Query" };
  }

  if (isRequotePendingQuery(query)) {
    return { key: "requote_pending", label: "Re-quote Pending" };
  }

  if (isQuoteOverdue(query)) {
    return { key: "at_risk", label: "At Risk" };
  }

  return { key: "active", label: "Active Queue" };
};

const getLatestReassignmentEntry = (query = {}, userId = "") => {
  const history = Array.isArray(query?.reassignmentHistory) ? query.reassignmentHistory : [];
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return history.length ? history[history.length - 1] : null;
  }

  const matches = history.filter((entry) => String(entry?.toUser || "") === normalizedUserId);
  return matches.length ? matches[matches.length - 1] : null;
};

const getNextReassignmentEntry = (query = {}, userId = "", after = null) => {
  const history = Array.isArray(query?.reassignmentHistory) ? query.reassignmentHistory : [];
  const normalizedUserId = String(userId || "").trim();
  const afterDate = after ? new Date(after) : null;
  const afterTime =
    afterDate && !Number.isNaN(afterDate.getTime()) ? afterDate.getTime() : null;

  if (!normalizedUserId) {
    return null;
  }

  const matches = history
    .map((entry) => ({
      ...entry,
      movedAtDate: entry?.movedAt ? new Date(entry.movedAt) : null,
    }))
    .filter(
      (entry) =>
        String(entry?.fromUser || "") === normalizedUserId &&
        entry.movedAtDate &&
        !Number.isNaN(entry.movedAtDate.getTime()) &&
        (afterTime === null || entry.movedAtDate.getTime() > afterTime),
    )
    .sort((left, right) => left.movedAtDate.getTime() - right.movedAtDate.getTime());

  return matches.length ? matches[0] : null;
};

const getHoursBetween = (start, end = new Date()) => {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (
    !startDate ||
    !endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return 0;
  }

  return round(Math.max(0, endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60), 1);
};

const getManagedTeamMembers = async (req) => {
  const manager = await Auth.findById(req.user.id).select("name email employeeId _id");

  if (!manager) {
    throw new ApiError(404, "Manager profile not found");
  }

  const identityCandidates = getManagerIdentityCandidates(manager);

  if (!identityCandidates.length) {
    return [];
  }

  return Auth.find({
    role: "operations",
    isDeleted: { $ne: true },
    manager: { $in: identityCandidates },
  })
    .select("name email phone employeeId profileImage accountStatus manager createdAt")
    .sort({ createdAt: 1 });
};

const getManagedTeamQueries = async (teamIds, queryOptions = {}) => {
  if (!teamIds.length) {
    return [];
  }

  let request = TravelQuery.find({ assignedTo: { $in: teamIds } });

  if (queryOptions.select) {
    request = request.select(queryOptions.select);
  }

  if (Array.isArray(queryOptions.populate)) {
    queryOptions.populate.forEach((item) => {
      request = request.populate(item);
    });
  }

  return request.sort({ createdAt: -1 });
};

const getPeriodScopedQueries = (queries = [], start, endExclusive) =>
  queries.filter((query) => isWithinRange(query?.createdAt, start, endExclusive));

const isQuoteOverdueAt = (query = {}, referenceDate = new Date()) => {
  if (!isActiveWorkloadQuery(query) || isQuoteSent(query)) {
    return false;
  }

  const createdAt = query?.createdAt ? new Date(query.createdAt) : null;
  const compareAt = referenceDate ? new Date(referenceDate) : new Date();

  if (
    !createdAt ||
    !compareAt ||
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(compareAt.getTime())
  ) {
    return false;
  }

  const hoursElapsed = (compareAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursElapsed > 48;
};

const buildPerformanceSnapshot = (queries = [], start, endExclusive) => {
  const scopedQueries = getPeriodScopedQueries(queries, start, endExclusive);
  const comparisonPoint = new Date(endExclusive.getTime() - 1);
  const activeScopedQueries = scopedQueries.filter(isActiveWorkloadQuery);
  const overdueQuotes = activeScopedQueries.filter((query) =>
    isQuoteOverdueAt(query, comparisonPoint),
  ).length;
  const quoteSentCount = scopedQueries.filter(isQuoteSent).length;
  const convertedCount = scopedQueries.filter(isConvertedQuery).length;
  const onTimeRate = scopedQueries.length
    ? ((scopedQueries.length - overdueQuotes) / scopedQueries.length) * 100
    : null;
  const conversionRate = quoteSentCount ? (convertedCount / quoteSentCount) * 100 : null;
  const usesWeightedPerformance = quoteSentCount > 0;

  let performance = null;
  if (scopedQueries.length) {
    performance = quoteSentCount
      ? Math.round(((onTimeRate || 0) * 0.65) + ((conversionRate || 0) * 0.35))
      : Math.round(onTimeRate || 0);
  }

  return {
    scopedQueries: scopedQueries.length,
    activeQueries: activeScopedQueries.length,
    overdueQuotes,
    quoteSentCount,
    convertedCount,
    onTimeRate: onTimeRate === null ? null : round(onTimeRate, 0),
    conversionRate: conversionRate === null ? null : round(conversionRate, 0),
    performance,
    usesWeightedPerformance,
  };
};

const buildTeamRows = (teamMembers = [], teamQueries = [], performanceWindow = null) =>
  teamMembers
    .map((member) => {
      const memberId = String(member._id);
      const assignedQueries = teamQueries.filter((query) => String(query?.assignedTo || "") === memberId);
      const activeQueries = assignedQueries.filter(isActiveWorkloadQuery);
      const newQueries = activeQueries.filter((query) => NEW_QUERY_STATUSES.has(String(query?.opsStatus || "")));
      const requotePendingQueries = activeQueries.filter(isRequotePendingQuery);
      const reassignedQueries = activeQueries.filter((query) => {
        const latestEntry = getLatestReassignmentEntry(query);
        return latestEntry && String(latestEntry?.toUser || "") === memberId;
      });
      const overdueQuotes = activeQueries.filter(isQuoteOverdue).length;
      const quoteSentCount = assignedQueries.filter(isQuoteSent).length;
      const convertedCount = assignedQueries.filter(isConvertedQuery).length;
      const onTimeRate = activeQueries.length
        ? ((activeQueries.length - overdueQuotes) / activeQueries.length) * 100
        : 100;
      const conversionRate = quoteSentCount ? (convertedCount / quoteSentCount) * 100 : 100;
      const usesWeightedPerformance = quoteSentCount > 0;
      const timelinessContribution = usesWeightedPerformance
        ? onTimeRate * 0.65
        : onTimeRate;
      const conversionContribution = usesWeightedPerformance
        ? conversionRate * 0.35
        : 0;

      let performance = 100;
      if (assignedQueries.length) {
        performance = quoteSentCount
          ? Math.round((onTimeRate * 0.65) + (conversionRate * 0.35))
          : Math.round(onTimeRate);
      }

      const currentPerformanceSnapshot = performanceWindow
        ? buildPerformanceSnapshot(
          assignedQueries,
          performanceWindow.current.start,
          performanceWindow.current.endExclusive,
        )
        : null;
      const previousPerformanceSnapshot = performanceWindow
        ? buildPerformanceSnapshot(
          assignedQueries,
          performanceWindow.previous.start,
          performanceWindow.previous.endExclusive,
        )
        : null;
      const currentPerformance = currentPerformanceSnapshot?.performance ?? null;
      const previousPerformance = previousPerformanceSnapshot?.performance ?? null;
      const statusActiveQueries = performanceWindow
        ? currentPerformanceSnapshot?.activeQueries || 0
        : activeQueries.length;
      const statusOverdueQuotes = performanceWindow
        ? currentPerformanceSnapshot?.overdueQuotes || 0
        : overdueQuotes;
      const statusPerformance = performanceWindow ? (currentPerformance ?? 100) : performance;

      let status = "Active";
      if (String(member.accountStatus || "") !== "Active") {
        status = "At Risk";
      } else if (statusOverdueQuotes >= 3 || statusPerformance < 75) {
        status = "At Risk";
      } else if (statusActiveQueries >= 12 || statusOverdueQuotes > 0) {
        status = "Busy";
      }
      const performanceTrend =
        currentPerformance === null ||
        previousPerformance === null
          ? null
          : round(
            Number(currentPerformance) - Number(previousPerformance),
            0,
          );

      return {
        id: memberId,
        name: member.name || "Operations Executive",
        email: member.email || "",
        phone: member.phone || "",
        employeeId: member.employeeId || "",
        profileImage: member.profileImage || "",
        initials: initials(member.name),
        avatar: getAvatarStyle(member.name),
        activeQueries: activeQueries.length,
        newQueries: newQueries.length,
        requotePendingQueries: requotePendingQueries.length,
        reassignedCurrentQueries: reassignedQueries.length,
        overdueQuotes,
        quoteSentCount,
        convertedCount,
        onTimeRate: round(onTimeRate, 0),
        conversionRate: usesWeightedPerformance ? round(conversionRate, 0) : null,
        performance,
        performanceCurrent:
          currentPerformance,
        performancePrevious:
          previousPerformance,
        performanceTrend,
        performanceScopeLabel: performanceWindow?.current?.label || "",
        performanceComparisonLabel: performanceWindow?.comparisonLabel || "vs previous period",
        statusScopeLabel: performanceWindow?.current?.label || "Live queue",
        performanceMetrics: {
          scopedQueries: currentPerformanceSnapshot?.scopedQueries || 0,
          quoteSentCount: currentPerformanceSnapshot?.quoteSentCount || 0,
          convertedCount: currentPerformanceSnapshot?.convertedCount || 0,
          onTimeRate: currentPerformanceSnapshot?.onTimeRate,
          conversionRate: currentPerformanceSnapshot?.conversionRate,
        },
        performanceModel: {
          maxScore: 100,
          usesWeightedPerformance,
          timelinessWeight: usesWeightedPerformance ? 65 : 100,
          conversionWeight: usesWeightedPerformance ? 35 : 0,
          timelinessContribution: round(timelinessContribution, 0),
          conversionContribution: round(conversionContribution, 0),
        },
        status,
        accountStatus: member.accountStatus || "Active",
        canReassign: activeQueries.length > 0,
        createdAt: member.createdAt || null,
      };
    })
    .sort((left, right) => right.activeQueries - left.activeQueries || right.overdueQuotes - left.overdueQuotes);

const buildDashboardPayload = async (req) => {
  const now = new Date();
  const performanceWindow = buildPerformanceWindow({
    period: req.query?.period,
    startDate: req.query?.startDate,
    endDate: req.query?.endDate,
  });
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeekExclusive(now);
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = weekStart;
  const teamMembers = await getManagedTeamMembers(req);
  const teamIds = teamMembers.map((member) => member._id);

  const teamQueries = await getManagedTeamQueries(teamIds, {
    select: "assignedTo queryId quotationStatus agentStatus opsStatus createdAt updatedAt activityLog destination customerBudget reassignmentHistory",
  });

  const currentAverageQuoteHours = calculateAverageQuoteHours(teamQueries, weekStart, weekEnd);
  const previousAverageQuoteHours = calculateAverageQuoteHours(teamQueries, previousWeekStart, previousWeekEnd);
  const currentConversionRate = calculateConversionRate(teamQueries, weekStart, weekEnd);
  const previousConversionRate = calculateConversionRate(teamQueries, previousWeekStart, previousWeekEnd);

  const teamRows = buildTeamRows(teamMembers, teamQueries, performanceWindow);
  const membersWithPerformance = teamRows.filter((member) => member.performanceCurrent !== null);
  const membersWithPreviousPerformance = teamRows.filter((member) => member.performancePrevious !== null);
  const avgTeamPerformance = membersWithPerformance.length
    ? Math.round(
      membersWithPerformance.reduce((total, member) => total + Number(member.performanceCurrent || 0), 0) /
        membersWithPerformance.length,
    )
    : 0;
  const previousAvgTeamPerformance = membersWithPreviousPerformance.length
    ? Math.round(
      membersWithPreviousPerformance.reduce((total, member) => total + Number(member.performancePrevious || 0), 0) /
        membersWithPreviousPerformance.length,
    )
    : 0;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekNumber = getISOWeek(now);

  return {
    generatedAt: now,
    dateLabel: dateFormatter.format(now),
    weekNumber,
    headerTitle: `Ops Command Center - Week ${weekNumber}`,
    headerSubtitle: "Team oversight and performance tracking",
    summary: {
      totalTeamQueries: teamQueries.length,
      avgTimeToQuoteHours: currentAverageQuoteHours,
      avgTimeToQuote: formatHours(currentAverageQuoteHours),
      avgTimeToQuoteBadge: buildOpsMetricBadge(currentAverageQuoteHours, previousAverageQuoteHours, {
        lowerIsBetter: true,
        suffix: "speed",
      }),
      conversionRate: currentConversionRate === null ? 0 : round(currentConversionRate, 0),
      conversionRateBadge: buildOpsMetricBadge(currentConversionRate, previousConversionRate),
      activeExecutives: teamRows.filter((member) => member.accountStatus === "Active").length,
      totalExecutives: teamRows.length,
      addedThisWeek: teamMembers.filter((member) => isWithinRange(member.createdAt, weekStart, weekEnd)).length,
      atRiskExecutives: teamRows.filter((member) => member.status === "At Risk").length,
      avgTeamPerformance,
      performanceDelta:
        membersWithPerformance.length && membersWithPreviousPerformance.length
          ? avgTeamPerformance - previousAvgTeamPerformance
          : null,
      performanceDeltaLabel: performanceWindow.comparisonLabel,
      performanceWindowLabel: performanceWindow.current.label,
    },
    performanceWindow: {
      key: performanceWindow.key,
      currentLabel: performanceWindow.current.label,
      previousLabel: performanceWindow.previous.label,
      comparisonLabel: performanceWindow.comparisonLabel,
      startDate: performanceWindow.current.start.toISOString().slice(0, 10),
      endDate: new Date(performanceWindow.current.endExclusive.getTime() - 1).toISOString().slice(0, 10),
    },
    team: teamRows,
  };
};

const getQueryUiStatus = (query = {}) => {
  if (isQuoteOverdue(query)) return "Overdue";
  if (isQuoteSent(query)) return "Quoted";
  if (NEW_QUERY_STATUSES.has(String(query?.opsStatus || ""))) return "New";
  return "In Progress";
};

const buildQueryRows = (queries = []) =>
  queries.map((query) => {
    const deadline = query?.createdAt ? new Date(query.createdAt) : null;
    if (deadline) {
      deadline.setDate(deadline.getDate() + 2);
    }

    const assignedUserName = query?.assignedTo?.name || "Unassigned";
    const status = getQueryUiStatus(query);

    return {
      id: query.queryId || "",
      queryObjectId: query._id,
      client: query?.agent?.companyName || query?.agent?.name || "Travel Partner",
      clientEmail: query?.agent?.email || "",
      destination: query?.destination || "",
      assignedTo: assignedUserName,
      assignedToEmail: query?.assignedTo?.email || "",
      initials: initials(assignedUserName),
      avatar: getAvatarStyle(assignedUserName),
      status,
      deadline: formatDateLabel(deadline),
      deadlineRed: status === "Overdue",
      amount: formatCurrency(query?.customerBudget || 0),
      amountValue: Number(query?.customerBudget || 0),
      startDate: formatDateLabel(query?.startDate),
      endDate: formatDateLabel(query?.endDate),
      opsStatus: query?.opsStatus || "",
      agentStatus: query?.agentStatus || "",
      quotationStatus: query?.quotationStatus || "",
      createdAt: query?.createdAt || null,
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

const buildQuotationHistoryRows = (quotations = [], options = {}) =>
  quotations
    .slice()
    .sort(
      (left, right) =>
        new Date(left?.createdAt || 0).getTime() - new Date(right?.createdAt || 0).getTime(),
    )
    .map((quotation, index, list) => {
      const opsAmount = Number(quotation?.pricing?.totalAmount || 0);
      const clientAmount =
        quotation?.clientTotalAmount === undefined || quotation?.clientTotalAmount === null
          ? null
          : Number(quotation.clientTotalAmount);
      const markupAmount = Number(quotation?.agentMarkup?.markupAmount || 0);
      const isLatest = index === list.length - 1;
      const revisionRemark = String(quotation?.agentRevisionRemark || "").trim()
        || (quotation?.status === "Revision Requested" && isLatest
          ? String(options?.latestRevisionRemark || "").trim()
          : "");

      return {
        id: String(quotation?._id || ""),
        attemptNumber: index + 1,
        isLatest,
        quotationNumber: quotation?.quotationNumber || "",
        status: quotation?.status || "Pending",
        displayStatus: quotation?.status === "Revision Requested" ? "Rejected" : quotation?.status || "Pending",
        quoteCategory: quotation?.pricing?.quoteCategory || "",
        amount: formatCurrency(clientAmount ?? opsAmount),
        amountValue: clientAmount ?? opsAmount,
        opsAmount: formatCurrency(opsAmount),
        clientAmount: clientAmount === null ? "" : formatCurrency(clientAmount),
        hasMarkup: markupAmount > 0,
        markupAmount: markupAmount > 0 ? formatCurrency(markupAmount) : "",
        validTill: formatDateLabel(quotation?.validTill),
        createdAt: quotation?.createdAt || null,
        createdAtLabel: formatDateTimeLabel(quotation?.createdAt),
        updatedAt: quotation?.updatedAt || null,
        updatedAtLabel: formatDateTimeLabel(quotation?.updatedAt),
        serviceCount: Array.isArray(quotation?.services) ? quotation.services.length : 0,
        inclusionCount: Array.isArray(quotation?.inclusions) ? quotation.inclusions.length : 0,
        agentRemark: revisionRemark,
      };
    });

const buildReassignQueryRows = (queries = []) => {
  const categoryPriority = {
    new: 0,
    requote_pending: 1,
    at_risk: 2,
    active: 3,
  };

  return queries
    .map((query) => {
      const category = getReassignCategory(query);
      const quoteSentAt = getQuoteSentAt(query);
      const status = getQueryUiStatus(query);

      let note = "Active follow-up queue";
      if (category.key === "new") {
        note = query?.createdAt ? `Created ${formatDateLabel(query.createdAt)}` : "Recently created";
      } else if (category.key === "requote_pending") {
        note = quoteSentAt
          ? `Revision pending • First quote sent ${formatDateLabel(quoteSentAt)}`
          : "Revision pending for re-quote";
      } else if (category.key === "at_risk") {
        note = "Quote timeline needs attention";
      }

      return {
        id: String(query?._id || ""),
        queryId: query?.queryId || "",
        destination: query?.destination || "Destination pending",
        amount: formatCurrency(query?.customerBudget || 0),
        amountValue: Number(query?.customerBudget || 0),
        categoryKey: category.key,
        categoryLabel: category.label,
        status,
        note,
        quoteSentAtLabel: formatDateLabel(quoteSentAt),
        createdAtLabel: formatDateLabel(query?.createdAt),
        createdAt: query?.createdAt || null,
        opsStatus: query?.opsStatus || "",
        agentStatus: query?.agentStatus || "",
        quotationStatus: query?.quotationStatus || "",
        overdue: isQuoteOverdue(query),
      };
    })
    .sort((left, right) => {
      const categoryDelta = (categoryPriority[left.categoryKey] ?? 99) - (categoryPriority[right.categoryKey] ?? 99);
      if (categoryDelta !== 0) return categoryDelta;

      return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
    });
};

const summarizeReassignQueries = (queries = []) =>
  queries.reduce(
    (summary, query) => {
      summary.total += 1;
      if (query.categoryKey === "new") summary.newCount += 1;
      if (query.categoryKey === "requote_pending") summary.requotePendingCount += 1;
      if (query.categoryKey === "at_risk") summary.atRiskCount += 1;
      if (query.categoryKey === "active") summary.activeCount += 1;
      return summary;
    },
    {
      total: 0,
      newCount: 0,
      requotePendingCount: 0,
      atRiskCount: 0,
      activeCount: 0,
    },
  );

const getReassignableQueriesForUser = (teamQueries = [], userId = "") =>
  teamQueries.filter(
    (query) =>
      String(query?.assignedTo || "") === String(userId || "") &&
      REASSIGNABLE_OPS_STATUSES.has(String(query?.opsStatus || "")) &&
      String(query?.agentStatus || "") !== "Rejected",
  );

const buildReassignPreviewPayload = (teamRows = [], teamQueries = [], fromUserId = "") => {
  const sourceMember = teamRows.find((member) => member.id === String(fromUserId || "")) || null;
  const reassignRows = buildReassignQueryRows(getReassignableQueriesForUser(teamQueries, fromUserId));

  return {
    sourceMember,
    summary: summarizeReassignQueries(reassignRows),
    recipients: teamRows
      .filter((member) => member.id !== String(fromUserId || ""))
      .map((member) => ({
        ...member,
        currentWorkloadLabel: `${member.activeQueries} active queries`,
      })),
    queries: reassignRows,
  };
};

const buildReassignmentPerformanceSnapshot = (query = {}, memberId = "", receivedEntry = null) => {
  const receivedAt = receivedEntry?.movedAt ? new Date(receivedEntry.movedAt) : null;
  const safeReceivedAt =
    receivedAt && !Number.isNaN(receivedAt.getTime()) ? receivedAt : null;
  const movedOutEntry = safeReceivedAt
    ? getNextReassignmentEntry(query, memberId, safeReceivedAt)
    : null;
  const quoteSentAt = safeReceivedAt
    ? getLatestActivityAt(query, "Quote Sent", { after: safeReceivedAt })
    : getQuoteSentAt(query);
  const revisionRequestedAt = safeReceivedAt
    ? getLatestActivityAt(query, "Revision Requested", { after: safeReceivedAt })
    : getLatestActivityAt(query, "Revision Requested");
  const updatedAt = query?.updatedAt ? new Date(query.updatedAt) : null;
  const safeUpdatedAt =
    updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null;
  const currentlyAssigned = String(query?.assignedTo || "") === String(memberId || "");
  const revisionReason = String(query?.rejectionNote || "").trim();
  const hasRevisionRequest =
    Boolean(revisionRequestedAt) ||
    Boolean(revisionReason) ||
    isRequotePendingQuery(query);
  const isSolvedAfterReassignment =
    Boolean(quoteSentAt) ||
    isConvertedQuery(query) ||
    String(query?.quotationStatus || "") === "Sent_To_Agent";
  const referenceEndAt =
    quoteSentAt ||
    movedOutEntry?.movedAtDate ||
    (isSolvedAfterReassignment ? safeUpdatedAt : null) ||
    (currentlyAssigned ? new Date() : safeUpdatedAt) ||
    safeReceivedAt ||
    new Date();
  const workingHours = getHoursBetween(safeReceivedAt, referenceEndAt);

  let impactPoints = 0;

  if (isSolvedAfterReassignment) {
    if (workingHours <= 12) impactPoints += 12;
    else if (workingHours <= 24) impactPoints += 8;
    else if (workingHours <= 48) impactPoints += 4;
    else impactPoints += 1;
  }

  if (isConvertedQuery(query)) {
    impactPoints += 4;
  }

  if (workingHours > 72) impactPoints -= 18;
  else if (workingHours > 48) impactPoints -= 12;
  else if (workingHours > 24) impactPoints -= 6;

  if (hasRevisionRequest) {
    impactPoints -= 10;
  }

  if (currentlyAssigned && isQuoteOverdue(query)) {
    impactPoints -= 8;
  }

  if (!currentlyAssigned && movedOutEntry && !isSolvedAfterReassignment) {
    impactPoints -= 3;
  }

  const performanceScore = clampBetween(78 + impactPoints, 32, 98);

  let resolvedStateLabel = "Open in queue";
  if (quoteSentAt) {
    resolvedStateLabel = "Quote sent after reassignment";
  } else if (isConvertedQuery(query)) {
    resolvedStateLabel = "Converted / confirmed";
  } else if (movedOutEntry?.toName) {
    resolvedStateLabel = `Moved to ${movedOutEntry.toName}`;
  } else if (hasRevisionRequest) {
    resolvedStateLabel = "Revision affecting delivery";
  }

  const narrativeParts = [];

  if (hasRevisionRequest) {
    narrativeParts.push("Revision pressure reduced the score");
  }
  if (workingHours > 24) {
    narrativeParts.push(`${formatHours(workingHours)} handling time stretched the turnaround`);
  } else if (isSolvedAfterReassignment) {
    narrativeParts.push(`Resolved movement inside ${formatHours(workingHours)}`);
  }
  if (currentlyAssigned && isQuoteOverdue(query)) {
    narrativeParts.push("This query is still overdue in queue");
  }
  if (!narrativeParts.length) {
    narrativeParts.push("Healthy movement with no visible performance drag");
  }

  return {
    receivedAt: safeReceivedAt,
    receivedAtLabel: formatDateTimeLabel(safeReceivedAt),
    quoteSentAt,
    quoteSentAtLabel: formatDateTimeLabel(quoteSentAt),
    revisionRequestedAt,
    revisionRequestedAtLabel: formatDateTimeLabel(revisionRequestedAt),
    movedOutAt: movedOutEntry?.movedAtDate || null,
    movedOutAtLabel: formatDateTimeLabel(movedOutEntry?.movedAtDate),
    workingHours,
    workingHoursLabel: formatHours(workingHours),
    hasRevisionRequest,
    revisionReason,
    isSolvedAfterReassignment,
    resolvedStateLabel,
    performanceImpactPoints: impactPoints,
    performanceDirection:
      impactPoints > 0 ? "up" : impactPoints < 0 ? "down" : "neutral",
    performanceScore,
    performanceNote: narrativeParts.join(". "),
  };
};

const buildReassignmentDetailPayload = (teamRows = [], teamQueries = [], memberId = "") => {
  const normalizedMemberId = String(memberId || "");
  const member = teamRows.find((row) => row.id === normalizedMemberId) || null;
  const teamMap = new Map(teamRows.map((row) => [row.id, row]));

  const items = teamQueries
    .map((query) => {
      const latestEntry = getLatestReassignmentEntry(query, normalizedMemberId);
      if (!latestEntry) return null;

      const category = getReassignCategory(query);
      const currentlyAssigned = String(query?.assignedTo || "") === normalizedMemberId;
      const currentOwner = teamMap.get(String(query?.assignedTo || ""));
      const performance = buildReassignmentPerformanceSnapshot(
        query,
        normalizedMemberId,
        latestEntry,
      );

      return {
        id: String(query?._id || ""),
        queryId: query?.queryId || "",
        destination: query?.destination || "Destination pending",
        amount: formatCurrency(query?.customerBudget || 0),
        categoryKey: category.key,
        categoryLabel: category.label,
        status: getQueryUiStatus(query),
        fromName: latestEntry?.fromName || "Operations Executive",
        movedAt: latestEntry?.movedAt || null,
        movedAtLabel: formatDateTimeLabel(latestEntry?.movedAt),
        isCurrentlyAssigned: currentlyAssigned,
        currentOwnerName: currentlyAssigned
          ? member?.name || latestEntry?.toName || "Operations Executive"
          : currentOwner?.name || latestEntry?.toName || "Operations Executive",
        ...performance,
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.movedAt || 0).getTime() - new Date(left.movedAt || 0).getTime());

  const currentItems = items.filter((item) => item.isCurrentlyAssigned);
  const totalWorkingHours = items.reduce(
    (total, item) => total + Number(item.workingHours || 0),
    0,
  );
  const averageWorkingHours = items.length ? totalWorkingHours / items.length : 0;
  const netImpactPoints = items.reduce(
    (total, item) => total + Number(item.performanceImpactPoints || 0),
    0,
  );
  const avgPerformanceScore = items.length
    ? round(
      items.reduce(
        (total, item) => total + Number(item.performanceScore || 0),
        0,
      ) / items.length,
      0,
    )
    : Number(member?.performance || 0);

  return {
    member,
    summary: {
      totalReceivedCount: items.length,
      currentAssignedCount: currentItems.length,
      newCount: currentItems.filter((item) => item.categoryKey === "new").length,
      requotePendingCount: currentItems.filter((item) => item.categoryKey === "requote_pending").length,
      avgHandleTime: formatHours(averageWorkingHours),
      avgHandleTimeHours: round(averageWorkingHours, 1),
      revisionAffectedCount: items.filter((item) => item.hasRevisionRequest).length,
      solvedCount: items.filter((item) => item.isSolvedAfterReassignment).length,
      recoveredCount: items.filter((item) => item.performanceImpactPoints > 0).length,
      netImpactPoints,
      avgPerformanceScore,
    },
    items,
  };
};

export const getOperationManagerDashboard = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

    const dashboard = await buildDashboardPayload(req);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export const getOperationManagerQueries = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

    const teamMembers = await getManagedTeamMembers(req);
    const teamIds = teamMembers.map((member) => member._id);
    const queries = await getManagedTeamQueries(teamIds, {
      select: "queryId destination customerBudget createdAt startDate endDate quotationStatus agentStatus opsStatus activityLog assignedTo numberOfAdults numberOfChildren hotelCategory transportRequired sightseeingRequired specialRequirements reassignmentHistory agent",
      populate: [
        { path: "agent", select: "name companyName email" },
        { path: "assignedTo", select: "name email" },
      ],
    });

    const rows = buildQueryRows(queries);

    res.status(200).json({
      success: true,
      data: {
        dateLabel: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date()),
        queries: rows,
        summary: {
          total: rows.length,
          newCount: rows.filter((item) => item.status === "New").length,
          inProgressCount: rows.filter((item) => item.status === "In Progress").length,
          quotedCount: rows.filter((item) => item.status === "Quoted").length,
          overdueCount: rows.filter((item) => item.status === "Overdue").length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOperationManagerQueryQuotations = async (req, res, next) => {
  try {
    ensureQuotationTrackerAccess(req);

    const queryId = String(req.params?.queryId || "").trim();
    if (!queryId) {
      return next(new ApiError(400, "Query id is required"));
    }

    const query =
      req.user?.role === "admin"
        ? await TravelQuery.findById(queryId).select("_id queryId rejectionNote")
        : await (async () => {
            const teamMembers = await getManagedTeamMembers(req);
            const teamIds = teamMembers.map((member) => member._id);

            return TravelQuery.findOne({
              _id: queryId,
              assignedTo: { $in: teamIds },
            }).select("_id queryId rejectionNote");
          })();

    if (!query) {
      return next(
        new ApiError(
          404,
          req.user?.role === "admin" ? "Query not found" : "Query not found in your team",
        ),
      );
    }

    const quotations = await Quotation.find({ queryId: query._id })
      .select(
        "quotationNumber status pricing.totalAmount pricing.quoteCategory clientTotalAmount validTill services inclusions agentMarkup agentRevisionRemark createdAt updatedAt",
      )
      .sort({ createdAt: 1 });

    const rows = buildQuotationHistoryRows(quotations, {
      latestRevisionRemark: query?.rejectionNote || "",
    });

    res.status(200).json({
      success: true,
      data: {
        queryId: query.queryId || "",
        quotations: rows,
        summary: {
          totalQuotations: rows.length,
          latestStatus: rows[rows.length - 1]?.status || "",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOperationManagerReassignPreview = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

    const fromUserId = String(req.params?.userId || req.query?.userId || "").trim();
    if (!fromUserId) {
      return next(new ApiError(400, "Source executive is required"));
    }

    const teamMembers = await getManagedTeamMembers(req);
    const teamIds = teamMembers.map((member) => member._id);
    const teamQueries = await getManagedTeamQueries(teamIds, {
      select: "assignedTo queryId quotationStatus agentStatus opsStatus createdAt updatedAt activityLog destination customerBudget reassignmentHistory rejectionNote",
    });
    const teamRows = buildTeamRows(teamMembers, teamQueries);

    if (!teamRows.some((member) => member.id === fromUserId)) {
      return next(new ApiError(404, "Selected executive was not found in your team"));
    }

    res.status(200).json({
      success: true,
      data: buildReassignPreviewPayload(teamRows, teamQueries, fromUserId),
    });
  } catch (error) {
    next(error);
  }
};

export const getOperationManagerReassignmentDetails = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

    const memberId = String(req.params?.userId || req.query?.userId || "").trim();
    if (!memberId) {
      return next(new ApiError(400, "Team member is required"));
    }

    const teamMembers = await getManagedTeamMembers(req);
    const teamIds = teamMembers.map((member) => member._id);
    const teamQueries = await getManagedTeamQueries(teamIds, {
      select: "assignedTo queryId quotationStatus agentStatus opsStatus createdAt updatedAt activityLog destination customerBudget reassignmentHistory rejectionNote",
    });
    const teamRows = buildTeamRows(teamMembers, teamQueries);

    if (!teamRows.some((member) => member.id === memberId)) {
      return next(new ApiError(404, "Selected executive was not found in your team"));
    }

    res.status(200).json({
      success: true,
      data: buildReassignmentDetailPayload(teamRows, teamQueries, memberId),
    });
  } catch (error) {
    next(error);
  }
};

export const createOperationTeamMember = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

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
      role: "operations",
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
        ? "Ops executive added successfully and credentials were emailed"
        : "Ops executive added successfully",
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

export const reassignOperationManagerWorkload = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

    const fromUserId = String(req.body?.fromUserId || "").trim();
    const toUserId = String(req.body?.toUserId || "").trim();
    const requestedQueryIds = Array.isArray(req.body?.queryIds)
      ? req.body.queryIds.map((value) => String(value || "").trim()).filter(Boolean)
      : [];

    if (!fromUserId || !toUserId) {
      return next(new ApiError(400, "Both source and target executives are required"));
    }

    if (fromUserId === toUserId) {
      return next(new ApiError(400, "Please choose a different executive for reassignment"));
    }

    const teamMembers = await getManagedTeamMembers(req);
    const teamMemberIds = new Set(teamMembers.map((member) => String(member._id)));

    if (!teamMemberIds.has(fromUserId) || !teamMemberIds.has(toUserId)) {
      return next(new ApiError(403, "You can reassign workload only within your own operations team"));
    }

    if (!requestedQueryIds.length) {
      return next(new ApiError(400, "Please select at least one query to reassign"));
    }

    const queriesToMove = await TravelQuery.find({
      _id: { $in: requestedQueryIds },
      assignedTo: fromUserId,
      opsStatus: { $in: [...REASSIGNABLE_OPS_STATUSES] },
      agentStatus: { $ne: "Rejected" },
    }).select("queryId destination customerBudget opsStatus agentStatus quotationStatus activityLog reassignmentHistory assignedTo");

    if (!queriesToMove.length) {
      return res.status(200).json({
        success: true,
        message: "Selected queries were no longer available to reassign",
        movedCount: 0,
      });
    }

    const now = new Date();
    const performedBy = req.user?.name || "Operations Manager";
    const performedById = req.user?.id || null;
    const queryIds = queriesToMove.map((query) => query._id);

    const [fromMember, toMember] = teamMembers.reduce(
      (accumulator, member) => {
        const memberId = String(member._id);
        if (memberId === fromUserId) accumulator[0] = member;
        if (memberId === toUserId) accumulator[1] = member;
        return accumulator;
      },
      [null, null],
    );

    const fromName = fromMember?.name || "Operations Executive";
    const toName = toMember?.name || "Operations Executive";

    await TravelQuery.updateMany(
      { _id: { $in: queryIds } },
      {
        $set: { assignedTo: toUserId },
        $push: {
          activityLog: {
            action: "Reassigned by Manager",
            performedBy,
            timestamp: now,
          },
          reassignmentHistory: {
            fromUser: fromUserId,
            fromName,
            toUser: toUserId,
            toName,
            performedById,
            performedByName: performedBy,
            movedAt: now,
          },
        },
      },
    );

    const movedQueries = buildReassignQueryRows(queriesToMove);

    const notificationPayloads = [fromMember, toMember]
      .filter(Boolean)
      .map((member) => ({
        user: member._id,
        type: "info",
        title: "Workload Reassigned",
        message:
          member === toMember
            ? `${queriesToMove.length} queries have been reassigned to you by ${performedBy}.`
            : `${queriesToMove.length} queries were moved from your queue by ${performedBy}.`,
        meta: {
          movedCount: queriesToMove.length,
          fromUserId,
          toUserId,
          queryIds: movedQueries.map((query) => query.queryId),
        },
      }));

    if (notificationPayloads.length) {
      await Notification.insertMany(notificationPayloads);
    }

    res.status(200).json({
      success: true,
      message: `${queriesToMove.length} queries reassigned successfully`,
      movedCount: queriesToMove.length,
      movedQueries,
    });
  } catch (error) {
    next(error);
  }
};

export const submitOperationManagerReport = async (req, res, next) => {
  try {
    ensureOperationManagerAccess(req);

    const dashboard = await buildDashboardPayload(req);
    const adminUsers = await Auth.find({
      role: "admin",
      isDeleted: { $ne: true },
    }).select("_id");

    if (!adminUsers.length) {
      return next(new ApiError(404, "No admin users available to receive the report"));
    }

    const managerName = req.user?.name || "Operations Manager";
    const summary = dashboard.summary || {};

    await Notification.insertMany(
      adminUsers.map((adminUser) => ({
        user: adminUser._id,
        type: "info",
        title: "Ops Team Report Submitted",
        message: `${managerName} submitted the weekly operations report for Week ${dashboard.weekNumber}.`,
        link: "/admin/dashboard",
        meta: {
          weekNumber: dashboard.weekNumber,
          submittedBy: managerName,
          totalTeamQueries: summary.totalTeamQueries || 0,
          avgTimeToQuote: summary.avgTimeToQuote || "0 hrs",
          conversionRate: summary.conversionRate || 0,
          teamSize: summary.totalExecutives || 0,
        },
      })),
    );

    res.status(200).json({
      success: true,
      message: "Team report submitted to admin successfully",
    });
  } catch (error) {
    next(error);
  }
};
