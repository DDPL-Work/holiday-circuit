import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { CalendarRange, ChevronDown, Hash, Mail, MoreHorizontal, Phone } from "lucide-react";
import API from "../../../utils/Api";
import AddOpsExecutiveModal from "../../../modal/AddOpsExecutiveModal";
import {
  OpsManagerReassignModal,
} from "../../../modal/OpsManagerReassignModals";

const PERFORMANCE_CARD_EXIT_MS = 320;

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

function getPerformanceValueClass(p) {
  if (p === null || p === undefined || Number.isNaN(Number(p))) {
    return "text-slate-900";
  }

  if (p >= 90) return "text-emerald-600";
  if (p >= 75) return "text-amber-600";
  return "text-rose-500";
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
  // Return premium subtle background colors with silky hover transitions
  if (status === "At Risk") {
    return "bg-white hover:bg-gradient-to-r hover:from-rose-50/20 hover:to-white/80 transition-all duration-300";
  }

  if (status === "Active") {
    return "bg-white hover:bg-gradient-to-r hover:from-emerald-50/15 hover:to-white/80 transition-all duration-300";
  }

  return "bg-white hover:bg-gradient-to-r hover:from-amber-50/15 hover:to-white/80 transition-all duration-300";
}

const statusStyles = {
  Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border border-rose-200 bg-rose-50 text-rose-600",
  Busy: "border border-amber-200 bg-amber-50 text-amber-700",
};

function StatusBadge({ status }) {
  const dotColor =
    status === "Active"
      ? "bg-emerald-500 animate-pulse"
      : status === "At Risk"
        ? "bg-rose-500"
        : "bg-amber-500";
  return (
    <span className={`inline-flex items-center gap-1.5 justify-center rounded-full px-3 py-1 text-[11px] font-semibold border whitespace-nowrap transition-all duration-200 shadow-sm ${statusStyles[status] || statusStyles.Active}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
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
  const [modalPeriod, setModalPeriod] = useState("current_month");
  const [modalCustomStartDate, setModalCustomStartDate] = useState("");
  const [modalCustomEndDate, setModalCustomEndDate] = useState("");
  const [modalTeam, setModalTeam] = useState([]);
  const [modalPerformanceWindow, setModalPerformanceWindow] = useState({});
  const [modalRefreshing, setModalRefreshing] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const performanceCardTimerRef = useRef(null);
  const performanceCardOpenFrameRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);
  const latestLoadRequestRef = useRef(0);
  const latestModalRequestRef = useRef(0);

  const clearPerformanceCardTimer = useCallback(() => {
    if (performanceCardTimerRef.current) {
      window.clearTimeout(performanceCardTimerRef.current);
      performanceCardTimerRef.current = null;
    }

    if (performanceCardOpenFrameRef.current) {
      window.cancelAnimationFrame(performanceCardOpenFrameRef.current);
      performanceCardOpenFrameRef.current = null;
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
      }, PERFORMANCE_CARD_EXIT_MS);

      return { ...current, open: false };
    });
  }, [clearPerformanceCardTimer]);

  const openPerformanceCard = useCallback((memberId) => {
    clearPerformanceCardTimer();
    setModalPeriod(period);
    setModalCustomStartDate(customStartDate);
    setModalCustomEndDate(customEndDate);
    setModalTeam(team);
    setModalPerformanceWindow(performanceWindow);
    setModalRefreshing(false);

    setPerformanceCard({
      id: memberId,
      open: false,
    });

    performanceCardOpenFrameRef.current = window.requestAnimationFrame(() => {
      performanceCardOpenFrameRef.current = null;
      setPerformanceCard((current) => {
        if (!current || current.id !== memberId) {
          return current;
        }

        return { ...current, open: true };
      });
    });
  }, [
    clearPerformanceCardTimer,
    customEndDate,
    customStartDate,
    period,
    performanceWindow,
    team,
  ]);

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

  const fetchDashboardSnapshot = useCallback(async ({
    periodValue,
    startDateValue = "",
    endDateValue = "",
    skipGlobalLoader = false,
  }) => {
    const params = { period: periodValue };
    if (periodValue === "custom") {
      params.startDate = startDateValue;
      params.endDate = endDateValue;
    }

    const { data } = await API.get("/ops/manager/dashboard", {
      params,
      skipGlobalLoader,
    });

    return {
      team: data?.data?.team || [],
      summary: data?.data?.summary || {},
      performanceWindow: data?.data?.performanceWindow || {},
      dateLabel: data?.data?.dateLabel || "",
    };
  }, []);

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
      const snapshot = await fetchDashboardSnapshot({
        periodValue,
        startDateValue,
        endDateValue,
        skipGlobalLoader: background,
      });
      if (requestId !== latestLoadRequestRef.current) {
        return;
      }
      setTeam(snapshot.team);
      setSummary(snapshot.summary);
      setPerformanceWindow(snapshot.performanceWindow);
      setDateLabel(snapshot.dateLabel);
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
  }, [customEndDate, customStartDate, fetchDashboardSnapshot, period]);

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

  useEffect(() => {
    if (!performanceCard?.open) {
      return undefined;
    }

    if (modalPeriod === "custom" && (!modalCustomStartDate || !modalCustomEndDate)) {
      return undefined;
    }

    const modalMatchesPageRange =
      modalPeriod === period &&
      modalCustomStartDate === customStartDate &&
      modalCustomEndDate === customEndDate;

    if (modalMatchesPageRange) {
      setModalTeam(team);
      setModalPerformanceWindow(performanceWindow);
      setModalRefreshing(false);
      return undefined;
    }

    let ignore = false;
    const requestId = latestModalRequestRef.current + 1;
    latestModalRequestRef.current = requestId;
    setModalRefreshing(true);

    fetchDashboardSnapshot({
      periodValue: modalPeriod,
      startDateValue: modalCustomStartDate,
      endDateValue: modalCustomEndDate,
      skipGlobalLoader: true,
    })
      .then((snapshot) => {
        if (ignore || requestId !== latestModalRequestRef.current) {
          return;
        }
        setModalTeam(snapshot.team);
        setModalPerformanceWindow(snapshot.performanceWindow);
      })
      .catch((err) => {
        if (ignore || requestId !== latestModalRequestRef.current) {
          return;
        }
        toast.error(err?.response?.data?.message || "Failed to load performance preview");
      })
      .finally(() => {
        if (!ignore && requestId === latestModalRequestRef.current) {
          setModalRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    customEndDate,
    customStartDate,
    fetchDashboardSnapshot,
    modalCustomEndDate,
    modalCustomStartDate,
    modalPeriod,
    performanceCard?.open,
    performanceWindow,
    period,
    team,
  ]);

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
  const modalCustomRangePending = modalPeriod === "custom" && (!modalCustomStartDate || !modalCustomEndDate);
  const modalPeriodLabel = modalPerformanceWindow?.currentLabel || "Current period";
  const performanceMember = performanceCard ? modalTeam.find((member) => member.id === performanceCard.id) : null;
  const performanceMemberCurrent =
    modalCustomRangePending || performanceMember?.performanceCurrent === null || performanceMember?.performanceCurrent === undefined
      ? null
      : Number(performanceMember.performanceCurrent);
  const performanceMemberBarTone =
    performanceMemberCurrent === null
      ? { fill: "bg-slate-300", track: "bg-slate-200" }
      : { fill: perfBarColor(performanceMemberCurrent), track: perfBarTrackColor(performanceMemberCurrent) };
  const performanceMemberValueClass = getPerformanceValueClass(performanceMemberCurrent);
  const selectedRangeStartValue = modalPeriod === "custom"
    ? modalCustomStartDate
    : formatDateInputValue(modalPerformanceWindow?.current?.start);
  const selectedRangeEndValue = modalPeriod === "custom"
    ? modalCustomEndDate
    : formatDateInputValue(modalPerformanceWindow?.current?.endExclusive, { subtractOneDay: true });

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
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-[26px] font-black bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent tracking-tight leading-none">My Team</h1>
            <p className="text-sm text-gray-500 mt-1.5 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              Executive roster and workload management
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#2563eb] hover:from-[#1e3a8a] hover:via-[#2563eb] hover:to-[#3b82f6] text-white text-sm font-extrabold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
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
          {/* Total Executives */}
          <div className="group relative flex min-h-[120px] flex-col justify-between rounded-2xl border border-slate-200 border-b-[4.5px] p-5 bg-gradient-to-br from-blue-50/90 via-white to-white border-blue-100/70 border-b-blue-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap">Total Executives</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mt-1.5">{summary?.totalExecutives ?? team.length}</p>
            </div>
            <p className="text-xs text-green-600 font-bold mt-3 flex items-center gap-1.5 bg-green-50/50 rounded-lg px-2.5 py-1 border border-green-100/60 self-start">
              <IconTrendUp />
              {addedThisWeek} added this week
            </p>
          </div>

          {/* At Risk Executives */}
          <div className="group relative flex min-h-[120px] flex-col justify-between rounded-2xl border border-slate-200 border-b-[4.5px] p-5 bg-gradient-to-br from-rose-50/90 via-white to-white border-rose-100/70 border-b-rose-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap">At Risk Executives</p>
              <p className="text-3xl font-black text-rose-600 tracking-tight leading-none mt-1.5">{atRisk}</p>
            </div>
            <p className="text-xs text-rose-600 font-bold mt-3 flex items-center gap-1.5 bg-rose-50/50 rounded-lg px-2.5 py-1 border border-rose-100/60 self-start">
              <IconAlertTriangle />
              Need immediate attention
            </p>
          </div>

          {/* Avg. Team Performance */}
          <div className="group relative flex min-h-[120px] flex-col justify-between rounded-2xl border border-slate-200 border-b-[4.5px] p-5 bg-gradient-to-br from-emerald-50/90 via-white to-white border-emerald-100/70 border-b-emerald-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap">Avg. Team Performance</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mt-1.5">
                {displayedAvgPerformance === null ? "--" : `${displayedAvgPerformance}%`}
              </p>
            </div>
            <p className={`text-xs font-bold mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1 border self-start ${
              customRangePending 
                ? "text-slate-500 bg-slate-50 border-slate-100" 
                : performanceDeltaClass === "text-green-600" 
                  ? "text-green-600 bg-green-50/50 border-green-100/60" 
                  : "text-rose-600 bg-rose-50/50 border-rose-100/60"
            }`}>
              <IconTrendUp />
              {customRangePending
                ? "Choose a custom date range"
                : performanceDelta === null || performanceDelta === undefined
                  ? `Measured for ${periodLabel}`
                  : `${performanceDelta >= 0 ? "+" : "-"}${Math.abs(performanceDelta)}% ${comparisonLabel}`}
            </p>
          </div>
        </div>

        <div className="mb-7 rounded-[20px] border border-slate-200 bg-gradient-to-br from-slate-50/20 via-white to-white p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100/60 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                  <CalendarRange className="h-3.5 w-3.5 text-blue-600" />
                  {customRangePending
                    ? "Select both dates to load performance"
                    : `Showing performance for ${periodLabel}`}
                </div>
                {refreshing ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200/50 px-3.5 py-1.5 text-xs font-bold text-slate-600 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-ping" />
                    Updating team data...
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                The performance and status indicators now follow the selected range.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto">
              <label className="block flex-1 min-w-[220px] max-w-sm lg:w-[220px]">
                <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Range</span>
                <div className="relative">
                  <select
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                    className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-slate-50/50 pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="current_month">Current Month</option>
                    <option value="previous_month">Previous Month</option>
                    <option value="current_year">Current Year</option>
                    <option value="previous_year">Previous Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              {period === "custom" && (
                <>
                  <label className="block flex-1 min-w-[160px] max-w-sm">
                    <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Start Date</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(event) => setCustomStartDate(event.target.value)}
                      className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/50 px-5 text-sm text-slate-750 outline-none transition focus:border-blue-400 focus:bg-white cursor-pointer font-semibold"
                    />
                  </label>
                  <label className="block flex-1 min-w-[160px] max-w-sm">
                    <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">End Date</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(event) => setCustomEndDate(event.target.value)}
                      className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/50 px-5 text-sm text-slate-750 outline-none transition focus:border-blue-400 focus:bg-white cursor-pointer font-semibold"
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
            <table className="min-w-[1140px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "200px" }} />
                <col style={{ width: "210px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "240px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "130px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {[
                    { label: "Exec Name", align: "text-left pl-6" },
                    { label: "Contact", align: "text-left" },
                    { label: "Active Queries", align: "text-center" },
                    { label: "Overdue Quotes", align: "text-center" },
                    { label: "Performance", align: "text-center" },
                    { label: "Status", align: "text-center" },
                    { label: "Action", align: "text-center" },
                  ].map((col) => (
                    <th key={col.label} className={`py-2.5 px-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap ${col.align}`}>
                      {col.label}
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
                        <td className={`pl-6 pr-4 py-2.5 align-middle border-l-[3.5px] transition-all duration-300 ${
                          member.status === "At Risk" 
                            ? "border-l-rose-500" 
                            : member.status === "Active" 
                              ? "border-l-emerald-500" 
                              : "border-l-amber-500"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white/80">
                              {member.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="whitespace-nowrap text-[14px] font-bold text-slate-900 leading-tight">{member.name}</p>
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                <Hash className="h-3.5 w-3.5 text-slate-400" />
                                <span>{member.employeeId || "Employee ID pending"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[12.5px] text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-blue-500/85 shrink-0" />
                              <span className="truncate max-w-[210px]">{member.email || "No email mapped"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[12.5px] text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-emerald-500/85 shrink-0" />
                              <span>{member.phone || "No phone mapped"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[13px] font-bold tabular-nums text-slate-800 shadow-sm min-w-[36px]">
                            {member.activeQueries}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[13px] font-bold tabular-nums shadow-sm min-w-[36px] border ${
                            member.overdueQuotes === 0 
                              ? "bg-emerald-50/80 border-emerald-100 text-emerald-700" 
                              : "bg-rose-50 border-rose-100 text-rose-600 animate-pulse"
                          }`}>
                            {member.overdueQuotes}
                          </span>
                        </td>
                        <td className="relative px-3 py-2.5 align-middle">
                          <button
                            type="button"
                            onClick={() => {
                              if (performanceCard?.id === member.id && performanceCard?.open) {
                                closePerformanceCard();
                                return;
                              }

                              openPerformanceCard(member.id);
                            }}
                            className={`flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-1.5 text-left transition-all duration-300 hover:scale-[1.02] shadow-[0_2px_8px_rgba(15,23,42,0.02)] ${
                              hasScopedPerformance
                                ? compactTrend !== null && compactTrend < 0
                                  ? "border-rose-200 bg-gradient-to-br from-rose-50/90 to-pink-50/30 hover:from-white hover:to-rose-50/20 hover:border-rose-300 hover:shadow-[0_4px_12px_rgba(244,63,94,0.05)]"
                                  : "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/30 hover:from-white hover:to-emerald-50/10 hover:border-emerald-300 hover:shadow-[0_4px_12px_rgba(16,185,129,0.05)]"
                                : "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-white hover:to-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-slate-800">
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
                              <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${barTrackColor}`}>
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
                        <td className={`px-4 py-2.5 align-middle text-center ${isExpanded ? "relative z-40" : ""}`}>
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-4 py-2.5 align-middle text-center">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setReassignTarget(member);
                            }}
                            disabled={!member.canReassign || team.length < 2}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                              !member.canReassign || team.length < 2
                                ? "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-400 cursor-not-allowed border border-slate-200/60"
                                : "bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 hover:from-blue-600 hover:via-indigo-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                            }`}
                          >
                            <IconReassign size={11} />
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
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] transition-all duration-200 ease-out ${
              performanceCard.open ? "bg-slate-950/35 opacity-100" : "bg-slate-950/0 opacity-0"
            }`}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closePerformanceCard();
              }
            }}
          >
            <div
              className={`relative flex max-h-[calc(100vh-32px)] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)] transition-all duration-300 ease-out ${
                performanceCard.open ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.96] opacity-0"
                }`}
            >
              <div className="relative overflow-y-auto thin-scrollbar pb-3.5">
                {/* 1. Classic Clean Header */}
                <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 px-5 py-2.5">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    {performanceMember.profileImage ? (
                      <img
                        src={performanceMember.profileImage}
                        alt={performanceMember.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 text-sm font-bold text-white ring-2 ring-white shadow-sm">
                        {performanceMember.initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-slate-900 leading-tight">{performanceMember.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                        {performanceMember.employeeId || "Ops Executive"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closePerformanceCard}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                </div>

                {/* 2. Contact Details */}
                <div className="px-5 pt-2">
                  <div className="space-y-1 rounded-xl bg-gradient-to-br from-slate-50/80 to-slate-100/40 border border-slate-200/50 px-4 py-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-600">
                      <Mail className="h-3 w-3 text-blue-500/85 shrink-0" />
                      <span className="truncate">{performanceMember.email || "No email mapped"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-600">
                      <Phone className="h-3 w-3 text-emerald-500/85 shrink-0" />
                      <span>{performanceMember.phone || "No phone mapped"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Efficiency Gauge */}
                <div className="mt-2.5 px-5">
                  <div className="mb-1.5 flex items-end justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall Efficiency</span>
                      <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {modalCustomRangePending ? "Select dates" : performanceMember.performanceScopeLabel || modalPeriodLabel}
                      </span>
                    </div>
                    <span className={`text-xl font-black tracking-tight ${performanceMemberValueClass}`}>
                      {formatPercentValue(performanceMemberCurrent)}
                    </span>
                  </div>
                  <div className={`h-1.5 overflow-hidden rounded-full shadow-inner ${performanceMemberBarTone.track}`}>
                    {performanceMemberCurrent === null ? (
                      <div className="h-full w-12 rounded-full bg-slate-200 animate-pulse" />
                    ) : (
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          performanceMemberCurrent >= 90 
                            ? "from-emerald-400 to-teal-500" 
                            : performanceMemberCurrent >= 75 
                              ? "from-amber-400 to-orange-500" 
                              : "from-rose-400 to-pink-500"
                        }`}
                        style={{ width: clampPercentWidth(performanceMemberCurrent) }}
                      />
                    )}
                  </div>
                </div>

                {/* 4. Classic Metrics Grid */}
                <div className="mt-2.5 px-5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-150 bg-gradient-to-br from-blue-50/30 via-white to-white px-3 py-1.5 shadow-[0_2px_8px_rgba(59,130,246,0.02)] border-b-[3px] border-b-blue-500/80 hover:scale-[1.02] transition-transform duration-200">
                      <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-450">Scoped Queries</p>
                      <p className="text-[17px] font-extrabold text-slate-900">{modalCustomRangePending ? "--" : performanceMember.performanceMetrics?.scopedQueries ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-150 bg-gradient-to-br from-violet-50/30 via-white to-white px-3 py-1.5 shadow-[0_2px_8px_rgba(139,92,246,0.02)] border-b-[3px] border-b-violet-500/80 hover:scale-[1.02] transition-transform duration-200">
                      <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-450">Quotes Sent</p>
                      <p className="text-[17px] font-extrabold text-slate-900">{modalCustomRangePending ? "--" : performanceMember.performanceMetrics?.quoteSentCount ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-150 bg-gradient-to-br from-emerald-50/30 via-white to-white px-3 py-1.5 shadow-[0_2px_8px_rgba(16,185,129,0.02)] border-b-[3px] border-b-emerald-500/80 hover:scale-[1.02] transition-transform duration-200">
                      <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-455">On-Time Rate</p>
                      <p className="text-[17px] font-extrabold text-slate-900">
                        {modalCustomRangePending || performanceMember.performanceMetrics?.onTimeRate === null || performanceMember.performanceMetrics?.onTimeRate === undefined
                          ? "--"
                          : `${performanceMember.performanceMetrics.onTimeRate}%`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-150 bg-gradient-to-br from-amber-50/30 via-white to-white px-3 py-1.5 shadow-[0_2px_8px_rgba(245,158,11,0.02)] border-b-[3px] border-b-amber-500/80 hover:scale-[1.02] transition-transform duration-200">
                      <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-455">Conversion</p>
                      <p className="text-[17px] font-extrabold text-slate-900">
                        {modalCustomRangePending || performanceMember.performanceMetrics?.conversionRate === null || performanceMember.performanceMetrics?.conversionRate === undefined
                          ? "--"
                          : `${performanceMember.performanceMetrics.conversionRate}%`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Classic Filter Block */}
                <div className="mt-2.5 px-5">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100/30 p-2.5 shadow-inner">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Performance Range</p>
                      <div className="flex items-center gap-2">
                        {modalRefreshing ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200/50 animate-pulse">
                            <span className="h-1 w-1 rounded-full bg-slate-400" />
                            Updating
                          </span>
                        ) : null}
                        <span className="text-[9px] font-bold text-slate-500 bg-white/80 border border-slate-200/60 rounded-full px-2 py-0.5">
                          {modalPeriod === "custom" ? "Custom" : modalPeriodLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <div className="relative">
                        <select
                          value={modalPeriod}
                          onChange={(event) => setModalPeriod(event.target.value)}
                          className="h-8 w-full appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-10 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white cursor-pointer"
                        >
                          <option value="current_month">Current Month</option>
                          <option value="previous_month">Previous Month</option>
                          <option value="current_year">Current Year</option>
                          <option value="previous_year">Previous Year</option>
                          <option value="custom">Custom Range</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={selectedRangeStartValue}
                          onChange={(event) => setModalCustomStartDate(event.target.value)}
                          disabled={modalPeriod !== "custom"}
                          className="h-8 w-full rounded-full border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50/50 disabled:opacity-60 cursor-pointer"
                        />
                        <input
                          type="date"
                          value={selectedRangeEndValue}
                          onChange={(event) => setModalCustomEndDate(event.target.value)}
                          disabled={modalPeriod !== "custom"}
                          className="h-8 w-full rounded-full border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50/50 disabled:opacity-60 cursor-pointer"
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
