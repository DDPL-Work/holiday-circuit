import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { CalendarRange, ChevronDown, Hash, Mail, MoreHorizontal, Phone } from "lucide-react";
import API from "../../../utils/Api";
import AddOpsExecutiveModal from "../../../modal/AddOpsExecutiveModal";
import {
  OpsManagerReassignModal,
} from "../../../modal/OpsManagerReassignModals";

function IconUserPlus({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconUsers({ size = 17, color = "#378ADD" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconReassign({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11a8.5 8.5 0 0 1 14.4-5.9L20 7.5" />
      <path d="M20 3.5v4h-4" />
      <path d="M21 13a8.5 8.5 0 0 1-14.4 5.9L4 16.5" />
      <path d="M4 20.5v-4h4" />
    </svg>
  );
}

function IconTrendUp({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconAlertTriangle({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function perfBarColor(p) {
  if (p >= 90) return "bg-emerald-500";
  if (p >= 75) return "bg-amber-500";
  return "bg-rose-500";
}

function perfBarTrackColor(p) {
  if (p >= 90) return "bg-emerald-100";
  if (p >= 75) return "bg-amber-100";
  return "bg-rose-100";
}

function formatPercentValue(value) {
  return value === null || value === undefined || Number.isNaN(Number(value)) ? "--" : `${Number(value)}%`;
}

function clampPercentWidth(value) {
  return `${Math.min(100, Math.max(6, Number(value) || 0))}%`;
}

function formatDateInputValue(dateValue, { subtractOneDay = false } = {}) {
  if (!dateValue) return "";

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "";

  if (subtractOneDay) {
    parsedDate.setDate(parsedDate.getDate() - 1);
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTrendMeta(delta, fallbackLabel = "No comparison available") {
  if (delta === null || delta === undefined || Number.isNaN(Number(delta))) {
    return {
      badgeClass: "border-slate-200 bg-slate-100 text-slate-500",
      valueClass: "text-slate-400",
      label: fallbackLabel,
      shortLabel: "--",
      directionClass: "",
      showIcon: false,
    };
  }

  const numericDelta = Number(delta);
  const prefix = numericDelta >= 0 ? "+" : "-";
  const magnitude = Math.abs(numericDelta);

  if (numericDelta >= 0) {
    return {
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      valueClass: "text-emerald-600",
      label: `${prefix}${magnitude}% improved`,
      shortLabel: `${prefix}${magnitude}%`,
      directionClass: "",
      showIcon: true,
    };
  }

  return {
    badgeClass: "border-rose-200 bg-rose-50 text-rose-600",
    valueClass: "text-rose-500",
    label: `${prefix}${magnitude}% dropped`,
    shortLabel: `${prefix}${magnitude}%`,
    directionClass: "rotate-180",
    showIcon: true,
  };
}

function getRowTone(status) {
  if (status === "At Risk") {
    return "bg-rose-50/45 hover:bg-rose-50/70";
  }

  if (status === "Active") {
    return "bg-emerald-50/35 hover:bg-emerald-50/60";
  }

  return "bg-amber-50/35 hover:bg-amber-50/55";
}

const statusStyles = {
  Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border border-rose-200 bg-rose-50 text-rose-600",
  Busy: "border border-amber-200 bg-amber-50 text-amber-700",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[11px] font-medium whitespace-nowrap ${statusStyles[status] || statusStyles.Active}`}>
      {status}
    </span>
  );
}

export default function MyOperationTeam() {
  const user = useSelector((state) => state.auth.user);
  const [team, setTeam] = useState([]);
  const [summary, setSummary] = useState({});
  const [performanceWindow, setPerformanceWindow] = useState({});
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reassignTarget, setReassignTarget] = useState(null);
  const [performanceCard, setPerformanceCard] = useState(null);
  const [period, setPeriod] = useState("current_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const performanceCardTimerRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);
  const latestLoadRequestRef = useRef(0);

  const clearPerformanceCardTimer = useCallback(() => {
    if (performanceCardTimerRef.current) {
      window.clearTimeout(performanceCardTimerRef.current);
      performanceCardTimerRef.current = null;
    }
  }, []);

  const closePerformanceCard = useCallback((immediate = false) => {
    clearPerformanceCardTimer();
    setPerformanceCard((current) => {
      if (!current) return null;
      if (immediate) return null;

      performanceCardTimerRef.current = window.setTimeout(() => {
        setPerformanceCard(null);
        performanceCardTimerRef.current = null;
      }, 180);

      return { ...current, open: false };
    });
  }, [clearPerformanceCardTimer]);

  const openPerformanceCard = useCallback((memberId) => {
    clearPerformanceCardTimer();

    setPerformanceCard({
      id: memberId,
      open: true,
    });
  }, [clearPerformanceCardTimer]);

  useEffect(() => () => clearPerformanceCardTimer(), [clearPerformanceCardTimer]);

  useEffect(() => {
    if (!performanceCard?.open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [closePerformanceCard, performanceCard]);

  const loadTeam = useCallback(async ({
    background = false,
    notifyOnError = false,
    periodValue = period,
    startDateValue = customStartDate,
    endDateValue = customEndDate,
  } = {}) => {
    const requestId = latestLoadRequestRef.current + 1;
    latestLoadRequestRef.current = requestId;

    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const params = { period: periodValue };
      if (periodValue === "custom") {
        params.startDate = startDateValue;
        params.endDate = endDateValue;
      }

      const { data } = await API.get("/ops/manager/dashboard", { params });
      if (requestId !== latestLoadRequestRef.current) {
        return;
      }
      setTeam(data?.data?.team || []);
      setSummary(data?.data?.summary || {});
      setPerformanceWindow(data?.data?.performanceWindow || {});
      setDateLabel(data?.data?.dateLabel || "");
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (requestId !== latestLoadRequestRef.current) {
        return;
      }
      const message = err?.response?.data?.message || "Failed to load operations team";
      setError(message);
      if (notifyOnError) {
        toast.error(message);
      }
    } finally {
      if (requestId === latestLoadRequestRef.current) {
        if (background) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    }
  }, [customEndDate, customStartDate, period]);

  useEffect(() => {
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }

    loadTeam({
      background: hasLoadedOnceRef.current,
      periodValue: period,
      startDateValue: customStartDate,
      endDateValue: customEndDate,
    });
  }, [period, customStartDate, customEndDate, loadTeam]);

  const handleAdd = async (payload) => {
    try {
      setAddSubmitting(true);
      const { data } = await API.post("/ops/manager/team", payload);
      await loadTeam({ background: true, notifyOnError: true });
      return data;
    } finally {
      setAddSubmitting(false);
    }
  };

  const addedThisWeek = summary?.addedThisWeek ?? 0;
  const atRisk = summary?.atRiskExecutives ?? 0;
  const avgPerf = summary?.avgTeamPerformance ?? 0;
  const performanceDelta = summary?.performanceDelta;
  const customRangePending = period === "custom" && (!customStartDate || !customEndDate);
  const displayedAvgPerformance = customRangePending ? null : avgPerf;
  const performanceDeltaClass =
    customRangePending || performanceDelta === null || performanceDelta === undefined
      ? "text-gray-400"
      : performanceDelta >= 0
        ? "text-green-600"
        : "text-red-500";
  const periodLabel = performanceWindow?.currentLabel || summary?.performanceWindowLabel || "Current period";
  const comparisonLabel = summary?.performanceDeltaLabel || performanceWindow?.comparisonLabel || "vs previous period";
  const performanceMember = performanceCard ? team.find((member) => member.id === performanceCard.id) : null;
  const performanceMemberCurrent =
    customRangePending || performanceMember?.performanceCurrent === null || performanceMember?.performanceCurrent === undefined
      ? null
      : Number(performanceMember.performanceCurrent);
  const performanceMemberBarTone =
    performanceMemberCurrent === null
      ? { fill: "bg-slate-300", track: "bg-slate-200" }
      : { fill: perfBarColor(performanceMemberCurrent), track: perfBarTrackColor(performanceMemberCurrent) };
  const performanceMemberValueClass =
    performanceMemberCurrent === null
      ? "text-slate-900"
      : performanceMemberCurrent >= 90
        ? "text-emerald-600"
        : performanceMemberCurrent >= 80
          ? "text-amber-600"
          : "text-rose-500";
  const selectedRangeStartValue = period === "custom"
    ? customStartDate
    : formatDateInputValue(performanceWindow?.current?.start);
  const selectedRangeEndValue = period === "custom"
    ? customEndDate
    : formatDateInputValue(performanceWindow?.current?.endExclusive, { subtractOneDay: true });

  if (loading) {
    return (
      <div className="min-h-0 w-full overflow-x-hidden bg-gray-50 font-sans">
        <div className="bg-white border-b border-gray-200 px- py-3 flex justify-between items-center text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-700">My Team</span>
            <span className="mx-2 text-gray-300">|</span>
            Loading...
          </div>
          <div>Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span></div>
        </div>
        <div className="max-w-6xl mx-auto px- py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-7 w-40 rounded bg-gray-200" />
                <div className="h-4 w-60 rounded bg-gray-200" />
              </div>
              <div className="h-10 w-40 rounded-lg bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
            <div className="h-[420px] rounded-xl border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 w-full overflow-x-hidden bg-gray-50 font-sans">
      <div className="bg-white border-b border-gray-200 px- py-1.5 flex justify-between items-center text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">My Team</span>
          <span className="mx-2 text-gray-300">|</span>
          {dateLabel || "Operations Team"}
        </div>
        <div>Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span></div>
      </div>

      <div className="max-w-6xl mx-auto px- py-2 pt-8">
        <div className="flex justify-between items-start mb-7">
          <div>
            <h1 className="text-xl font-medium text-gray-900">My Team</h1>
            <p className="text-sm text-gray-500 mt-1">Executive roster and workload management</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition"
          >
            <IconUserPlus />
            Add Ops Executive
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadTeam({ background: hasLoadedOnceRef.current })}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-7 grid gap-4 md:grid-cols-3">
          <div className="h-full bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Total Executives</p>
            <p className="text-3xl font-medium text-gray-900">{summary?.totalExecutives ?? team.length}</p>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <IconTrendUp />
              {addedThisWeek} added this week
            </p>
          </div>
          <div className="h-full bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">At Risk Executives</p>
            <p className="text-3xl font-medium text-red-500">{atRisk}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <IconAlertTriangle />
              Need immediate attention
            </p>
          </div>
          <div className="h-full bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">Avg. Team Performance</p>
            <p className="text-3xl font-medium text-gray-900">
              {displayedAvgPerformance === null ? "--" : `${displayedAvgPerformance}%`}
            </p>
            <p className={`text-xs mt-2 flex items-center gap-1 ${performanceDeltaClass}`}>
              <IconTrendUp />
              {customRangePending
                ? "Choose a custom date range to measure performance"
                : performanceDelta === null || performanceDelta === undefined
                ? `Measured for ${periodLabel}`
                : `${performanceDelta >= 0 ? "+" : "-"}${Math.abs(performanceDelta)}% ${comparisonLabel}`}
            </p>
          </div>
        </div>

        <div className="mb-7 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <CalendarRange className="h-3.5 w-3.5" />
                {customRangePending
                  ? "Select both dates to load performance"
                  : `Showing performance for ${periodLabel}`}
              </div>
              {refreshing ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  Updating team data...
                </div>
              ) : null}
              <p className="text-sm text-slate-600">
                The performance and status indicators now follow the selected range.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4 w-full">
              <label className="block flex-1 min-w-[220px] max-w-sm">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Range</span>
                <div className="relative">
                  <select
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                  >
                    <option value="current_month">Current Month</option>
                    <option value="previous_month">Previous Month</option>
                    <option value="current_year">Current Year</option>
                    <option value="previous_year">Previous Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              {period === "custom" && (
                <>
                  <label className="block flex-1 min-w-[160px] max-w-sm">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Start Date</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(event) => setCustomStartDate(event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                  <label className="block flex-1 min-w-[160px] max-w-sm">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">End Date</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(event) => setCustomEndDate(event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
            <IconUsers />
            <span className="text-[15px] font-semibold text-slate-900">Executive Directory</span>
            {refreshing ? (
              <span className="ml-auto text-[11px] font-medium text-slate-500">Refreshing...</span>
            ) : null}
          </div>

          <div className="thin-scrollbar overflow-x-auto">
            <table className="min-w-[1240px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "260px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "280px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "160px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  {["Exec Name", "Contact", "Active Queries", "Overdue Quotes", "Performance", "Status", "Action"].map((header) => (
                    <th key={header} className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#35507a] whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                      No operations executives are mapped to this manager yet.
                    </td>
                  </tr>
                ) : (
                  team.map((member) => {
                    const isExpanded = performanceCard?.id === member.id && performanceCard?.open;
                    const compactPerformance =
                      customRangePending || member.performanceCurrent === null || member.performanceCurrent === undefined
                        ? null
                        : Number(member.performanceCurrent);
                    const compactPreviousPerformance =
                      customRangePending || member.performancePrevious === null || member.performancePrevious === undefined
                        ? null
                        : Number(member.performancePrevious);
                    const compactTrend =
                      customRangePending || member.performanceTrend === null || member.performanceTrend === undefined
                        ? compactPerformance !== null && compactPreviousPerformance !== null
                          ? compactPerformance - compactPreviousPerformance
                          : null
                        : Number(member.performanceTrend);
                    const hasScopedPerformance = compactPerformance !== null && Number.isFinite(compactPerformance);
                    const trendMeta = getTrendMeta(compactTrend, member.performanceComparisonLabel || comparisonLabel);
                    const barTrackColor = hasScopedPerformance ? perfBarTrackColor(compactPerformance) : "bg-slate-200";
                    const rowTone = getRowTone(member.status);
                    return (
                      <tr key={member.id} className={`border-b border-slate-200/90 transition-colors ${rowTone}`}>
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 ring-1 ring-blue-100">
                                {member.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="whitespace-nowrap text-[14px] font-medium text-slate-900">{member.name}</p>
                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{member.employeeId || "Employee ID pending"}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span className="truncate">{member.email || "No email mapped"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                <span>{member.phone || "No phone mapped"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-middle text-[14px] font-medium tabular-nums text-slate-900">{member.activeQueries}</td>
                          <td className="px-5 py-4 align-middle">
                            <span className={`text-[14px] font-medium tabular-nums ${member.overdueQuotes === 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {member.overdueQuotes}
                            </span>
                          </td>
                          <td className="relative px-5 py-4 align-middle">
                            <button
                              type="button"
                              onClick={() => {
                                if (performanceCard?.id === member.id && performanceCard?.open) {
                                  closePerformanceCard();
                                  return;
                                }

                                openPerformanceCard(member.id);
                              }}
                              className={`flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                                hasScopedPerformance
                                  ? compactTrend !== null && compactTrend < 0
                                    ? "border-rose-200 bg-rose-50/80 hover:bg-white hover:border-rose-300"
                                    : "border-emerald-200 bg-emerald-50/70 hover:bg-white hover:border-emerald-300"
                                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums text-slate-900">
                                    {formatPercentValue(compactPerformance)}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${trendMeta.badgeClass}`}>
                                    {trendMeta.showIcon ? (
                                      <span className={`inline-flex ${trendMeta.directionClass}`}>
                                        <IconTrendUp size={11} />
                                      </span>
                                    ) : null}
                                    {trendMeta.shortLabel}
                                  </span>
                                </div>
                                <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${barTrackColor}`}>
                                  {hasScopedPerformance ? (
                                    <div
                                      className={`h-full rounded-full ${perfBarColor(compactPerformance)}`}
                                      style={{ width: clampPercentWidth(compactPerformance) }}
                                    />
                                  ) : (
                                    <div className="h-full w-8 rounded-full bg-slate-300" />
                                  )}
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <span className="truncate text-[10px] font-medium text-slate-500">
                                    {customRangePending ? "Awaiting dates" : member.performanceScopeLabel || periodLabel}
                                  </span>
                                  <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500">
                                    {isExpanded ? "Hide details" : member.performanceComparisonLabel || comparisonLabel}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </td>
                          <td className={`px-5 py-4 align-middle ${isExpanded ? "relative z-40" : ""}`}><StatusBadge status={member.status} /></td>
                          <td className="px-5 py-4 align-middle">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setReassignTarget(member);
                              }}
                              disabled={!member.canReassign || team.length < 2}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-[12px] font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                            >
                              <IconReassign />
                              Re-assign
                            </button>
                          </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {performanceCard && performanceMember ? (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closePerformanceCard();
              }
            }}
          >
            <div
              className={`relative flex max-h-[calc(100vh-32px)] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-300 ease-out ${
                performanceCard.open ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
              }`}
            >
              <div className="relative overflow-y-auto thin-scrollbar pb-4">
                {/* 1. Classic Clean Header */}
                <div className="flex items-start justify-between border-b border-slate-100 bg-white px-5 pt-4 pb-3">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    {performanceMember.profileImage ? (
                      <img
                        src={performanceMember.profileImage}
                        alt={performanceMember.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-bold text-blue-600 ring-1 ring-blue-100">
                        {performanceMember.initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-bold text-slate-900 leading-tight">{performanceMember.name}</p>
                      <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
                        {performanceMember.employeeId || "Ops Executive"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closePerformanceCard}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <span className="text-xl leading-none">&times;</span>
                  </button>
                </div>

                {/* 2. Contact Details */}
                <div className="px-5 pt-3">
                  <div className="space-y-2 rounded-xl bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{performanceMember.email || "No email mapped"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{performanceMember.phone || "No phone mapped"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Efficiency Gauge */}
                <div className="mt-4 px-5">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Overall Efficiency</span>
                      <span className="text-[12px] font-medium text-slate-500 mt-0.5">
                        {customRangePending ? "Select dates" : performanceMember.performanceScopeLabel || periodLabel}
                      </span>
                    </div>
                    <span className={`text-2xl font-bold tracking-tight ${performanceMemberValueClass}`}>
                      {formatPercentValue(performanceMemberCurrent)}
                    </span>
                  </div>
                  <div className={`h-2.5 overflow-hidden rounded-full shadow-inner ${performanceMemberBarTone.track}`}>
                    {performanceMemberCurrent === null ? (
                      <div className="h-full w-12 rounded-full bg-slate-200" />
                    ) : (
                      <div
                        className={`h-full rounded-full ${performanceMemberBarTone.fill}`}
                        style={{ width: clampPercentWidth(performanceMemberCurrent) }}
                      />
                    )}
                  </div>
                </div>

                {/* 4. Classic Metrics Grid */}
                <div className="mt-4 px-5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Scoped Queries</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">{customRangePending ? "--" : performanceMember.performanceMetrics?.scopedQueries ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Quotes Sent</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">{customRangePending ? "--" : performanceMember.performanceMetrics?.quoteSentCount ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">On-Time Rate</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">
                        {customRangePending || performanceMember.performanceMetrics?.onTimeRate === null || performanceMember.performanceMetrics?.onTimeRate === undefined
                          ? "--"
                          : `${performanceMember.performanceMetrics.onTimeRate}%`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-500">Conversion</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">
                        {customRangePending || performanceMember.performanceMetrics?.conversionRate === null || performanceMember.performanceMetrics?.conversionRate === undefined
                          ? "--"
                          : `${performanceMember.performanceMetrics.conversionRate}%`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Classic Filter Block */}
                <div className="mt-4 px-5">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">Performance Range</p>
                      <span className="text-[11px] font-medium text-slate-500">
                        {period === "custom" ? "Custom" : periodLabel}
                      </span>
                    </div>

                    <div className="grid gap-2">
                      <div className="relative">
                        <select
                          value={period}
                          onChange={(event) => setPeriod(event.target.value)}
                          className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[12px] font-medium text-slate-700 outline-none transition focus:border-blue-400"
                        >
                          <option value="current_month">Current Month</option>
                          <option value="previous_month">Previous Month</option>
                          <option value="current_year">Current Year</option>
                          <option value="previous_year">Previous Year</option>
                          <option value="custom">Custom Range</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={selectedRangeStartValue}
                          onChange={(event) => setCustomStartDate(event.target.value)}
                          disabled={period !== "custom"}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <input
                          type="date"
                          value={selectedRangeEndValue}
                          onChange={(event) => setCustomEndDate(event.target.value)}
                          disabled={period !== "custom"}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {reassignTarget && (
        <OpsManagerReassignModal
          exec={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onSuccess={() => loadTeam({ background: true, notifyOnError: true })}
        />
      )}

      {showAdd && (
        <AddOpsExecutiveModal
          loading={addSubmitting}
          managerName={user?.name || "Operations Manager"}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
