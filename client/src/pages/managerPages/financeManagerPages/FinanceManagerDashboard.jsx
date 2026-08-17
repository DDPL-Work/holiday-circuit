import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  CheckCircle,
  DollarSign,
  Flag,
  TrendingUp,
  AlertTriangle,
  CheckCheck,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import API from "../../../utils/Api";

const DEFAULT_RANGE_DAYS = 90;
const RUPEE_SYMBOL = "\u20B9";

const statusConfig = {
  Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Busy: "bg-amber-50 text-amber-700 border border-amber-200",
  "At Risk": "bg-rose-50 text-rose-700 border border-rose-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[11px] font-medium whitespace-nowrap ${statusConfig[status] || statusConfig.Active}`}
    >
      {status}
    </span>
  );
}

const accuracyColor = (accuracy) => {
  if (accuracy >= 90) return "bg-emerald-500";
  if (accuracy >= 80) return "bg-amber-400";
  return "bg-rose-500";
};

const pendingColor = (count) => {
  if (count <= 6) return "text-emerald-600";
  if (count <= 10) return "text-amber-500";
  return "text-rose-500";
};

const formatLocalDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - DEFAULT_RANGE_DAYS);

  return {
    fromDate: formatLocalDateInput(startDate),
    toDate: formatLocalDateInput(endDate),
  };
};

const parseFilterDate = (value = "", { endOfDay = false } = {}) => {
  if (!value) return null;

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;

  if (endOfDay) {
    parsedDate.setHours(23, 59, 59, 999);
  } else {
    parsedDate.setHours(0, 0, 0, 0);
  }

  return parsedDate;
};

const getIsoWeekNumber = (value = new Date()) => {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

const formatCompactAmount = (value = 0, divisor = 1, suffix = "") => {
  const scaledValue = Number(value || 0) / divisor;
  return scaledValue.toFixed(1).replace(/\.0$/, "") + suffix;
};

const formatCompactCurrency = (value = 0) => {
  const amount = Number(value || 0);
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= 10000000) {
    return `${RUPEE_SYMBOL}${formatCompactAmount(amount, 10000000, "Cr")}`;
  }

  if (absoluteAmount >= 100000) {
    return `${RUPEE_SYMBOL}${formatCompactAmount(amount, 100000, "L")}`;
  }

  return `${RUPEE_SYMBOL}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getInvoiceReferenceDate = (invoice = {}) => {
  const candidates = [
    invoice?.payoutDateValue,
    invoice?.reviewedAtValue,
    invoice?.submittedAtValue,
    invoice?.dueDateValue,
    invoice?.invoiceDateValue,
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

const isDateWithinRange = (value, startDate, endDate) => {
  const parsedDate = value instanceof Date ? value : value ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  if (startDate && parsedDate < startDate) return false;
  if (endDate && parsedDate > endDate) return false;
  return true;
};

const sumInvoiceAmount = (invoices = []) =>
  invoices.reduce(
    (total, invoice) => total + Number(invoice?.payoutAmount || invoice?.amount || 0),
    0,
  );

const calculateWeeklyTrend = (invoices = []) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const currentStart = new Date(today);
  currentStart.setDate(today.getDate() - 6);
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - 6);
  previousStart.setHours(0, 0, 0, 0);

  const paidInvoices = invoices.filter((invoice) => invoice?.status === "Paid");

  const currentTotal = sumInvoiceAmount(
    paidInvoices.filter((invoice) =>
      isDateWithinRange(getInvoiceReferenceDate(invoice), currentStart, today),
    ),
  );

  const previousTotal = sumInvoiceAmount(
    paidInvoices.filter((invoice) =>
      isDateWithinRange(getInvoiceReferenceDate(invoice), previousStart, previousEnd),
    ),
  );

  if (!previousTotal) {
    return {
      percentage: currentTotal > 0 ? 100 : 0,
      direction: currentTotal > 0 ? "up" : "flat",
    };
  }

  const percentage = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);

  return {
    percentage: Math.abs(percentage),
    direction: percentage > 0 ? "up" : percentage < 0 ? "down" : "flat",
  };
};

const createEmptyDashboardState = () => ({
  team: [],
  internalInvoices: [],
});

function AnimatedResolutionBar({ settledPct, escalatedPct }) {
  const [animatedWidths, setAnimatedWidths] = useState({
    settled: 0,
    escalated: 0,
  });

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setAnimatedWidths({
        settled: settledPct,
        escalated: escalatedPct,
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [settledPct, escalatedPct]);

  return (
    <div className="flex gap-0.5 h-1.5 w-36 rounded-full overflow-hidden bg-gray-100">
      <div
        className="h-full bg-emerald-500 rounded-full"
        style={{
          width: `${animatedWidths.settled}%`,
          transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <div
        className="h-full bg-amber-400 rounded-full"
        style={{
          width: `${animatedWidths.escalated}%`,
          transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

function AnimatedAccuracyBar({ accuracy, barClassName }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setAnimatedWidth(accuracy);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [accuracy]);

  return (
    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${barClassName}`}
        style={{
          width: `${animatedWidth}%`,
          transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

function FinanceCommandArtwork() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-amber-100 bg-[radial-gradient(circle_at_top,_#fef3c7,_#fde68a_55%,_#fbbf24)] shadow-[0_10px_24px_rgba(245,158,11,0.2)]">
      <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
        <defs>
          <linearGradient id="finance-command-ledger" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect x="11" y="11" width="26" height="26" rx="7" fill="#fffbeb" stroke="url(#finance-command-ledger)" strokeWidth="1.6" />
        <path d="M17 18h14M17 23h8M17 28h14" stroke="#f59e0b" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="30.5" cy="22.5" r="4.5" fill="#0f766e" />
        <path d="M30.5 19.9v5.2M28.4 22.5h4.2" stroke="#ecfdf5" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M19 32c1.8-2.4 3.6-3.6 5.5-3.6 2 0 3.6 1 4.8 2.9" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="15.5" cy="15.5" r="2" fill="#2563eb" />
        <circle cx="33" cy="15" r="1.8" fill="#14b8a6" />
      </svg>
      <div className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-white/25 blur-sm" />
    </div>
  );
}

export default function FinanceCommandCenter() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const user = useSelector((state) => state.auth.user);

  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [dashboardState, setDashboardState] = useState(createEmptyDashboardState());
  const [teamLoading, setTeamLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [teamError, setTeamError] = useState("");

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const weekNumber = useMemo(() => getIsoWeekNumber(new Date()), []);
  const startDate = useMemo(() => parseFilterDate(fromDate), [fromDate]);
  const endDate = useMemo(() => parseFilterDate(toDate, { endOfDay: true }), [toDate]);

  useEffect(() => {
    let isMounted = true;

    const loadTeamOverview = async () => {
      try {
        setTeamLoading(true);
        setTeamError("");

        const { data } = await API.get("/finance-manager/team", {
          params: {
            fromDate,
            toDate,
          },
        });

        if (!isMounted) return;

        setDashboardState((currentState) => ({
          ...currentState,
          team: data?.data?.team || [],
        }));
      } catch (error) {
        if (!isMounted) return;

        setTeamError(
          error?.response?.data?.message || "Unable to load finance team overview right now.",
        );
        setDashboardState((currentState) => ({
          ...currentState,
          team: [],
        }));
      } finally {
        if (isMounted) {
          setTeamLoading(false);
        }
      }
    };

    loadTeamOverview();

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate]);

  const [reportsHistory, setReportsHistory] = useState([]);

  const loadReportsHistory = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("finance_reports_history") || "[]");
      setReportsHistory(stored);
    } catch (e) {
      console.warn("Could not load reports history:", e);
    }
  };

  useEffect(() => {
    loadReportsHistory();

    const handleReportEvent = () => loadReportsHistory();
    window.addEventListener("finance-report-submitted", handleReportEvent);
    window.addEventListener("storage", handleReportEvent);

    return () => {
      window.removeEventListener("finance-report-submitted", handleReportEvent);
      window.removeEventListener("storage", handleReportEvent);
    };
  }, []);

  const downloadReportCSV = (report) => {
    if (!report || !report.items) return;

    let csvContent = "";
    if (report.type === "Payment Verification") {
      const headers = [
        "Booking ID",
        "Agent / Customer Name",
        "Amount (INR)",
        "Payment Method",
        "Transaction ID / UTR",
        "Verification Status",
        "Submitted Date",
      ];
      const rows = report.items.map((i) => [
        `"${i.bookingId || ""}"`,
        `"${i.agentName || ""}"`,
        `"${i.amount || 0}"`,
        `"${i.paymentMethod || ""}"`,
        `"${i.transactionId || ""}"`,
        `"${i.status || ""}"`,
        `"${i.date || ""}"`,
      ]);
      csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else {
      const headers = [
        "Invoice Number",
        "DMC Name",
        "Amount (INR)",
        "Status",
        "Due Date",
        "UTR / Ref",
        "Bank Name",
      ];
      const rows = report.items.map((i) => [
        `"${i.invoiceNumber || ""}"`,
        `"${i.dmcName || ""}"`,
        `"${i.amount || 0}"`,
        `"${i.status || ""}"`,
        `"${i.dueDate || ""}"`,
        `"${i.utr || ""}"`,
        `"${i.bank || ""}"`,
      ]);
      csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(report.title || "Finance-Report").replace(/\s+/g, "-")}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 3000);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInternalInvoices = async () => {
      try {
        setInvoiceLoading(true);

        const { data } = await API.get("/admin/internal-invoices");

        if (!isMounted) return;

        setDashboardState((currentState) => ({
          ...currentState,
          internalInvoices: data?.data?.invoices || [],
        }));
      } catch {
        if (!isMounted) return;

        setDashboardState((currentState) => ({
          ...currentState,
          internalInvoices: [],
        }));
      } finally {
        if (isMounted) {
          setInvoiceLoading(false);
        }
      }
    };

    loadInternalInvoices();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInternalInvoices = useMemo(
    () =>
      dashboardState.internalInvoices.filter((invoice) =>
        isDateWithinRange(getInvoiceReferenceDate(invoice), startDate, endDate),
      ),
    [dashboardState.internalInvoices, startDate, endDate],
  );

  const dashboardSummary = useMemo(() => {
    const totalVerifications = dashboardState.team.reduce(
      (total, executive) =>
        total + Number(executive?.pending || 0) + Number(executive?.settled || 0),
      0,
    );

    const paidInvoices = filteredInternalInvoices.filter((invoice) => invoice?.status === "Paid");
    const rejectedInvoices = filteredInternalInvoices.filter(
      (invoice) => invoice?.status === "Rejected",
    );
    const payoutTrend = calculateWeeklyTrend(dashboardState.internalInvoices);

    return {
      totalVerifications,
      settledAmount: sumInvoiceAmount(paidInvoices),
      mismatchFlags: rejectedInvoices.length,
      payoutTrend,
    };
  }, [dashboardState.internalInvoices, dashboardState.team, filteredInternalInvoices]);

  const showNegativeTrend = dashboardSummary.payoutTrend.direction === "down";
  const mismatchNeedsReview = dashboardSummary.mismatchFlags > 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8fc] font-sans">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-[#f8fafc] to-[#EFF5FC]">
        <div className="flex items-center justify-between px-0 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80 shadow-sm">
              <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800 leading-none">Finance Overview</p>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-semibold">{todayLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9.5px] text-slate-400">Logged in as</p>
            <p className="text-xs font-semibold text-slate-700">{user?.name || "Finance Manager"}</p>
          </div>
        </div>
      </div>

      <div className="px-0 pt-4">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <FinanceCommandArtwork />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[18px] font-extrabold text-slate-900 tracking-tight leading-none">
                  Finance Command Center
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9.5px] font-bold text-blue-700 tracking-wide uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Week {weekNumber}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] text-slate-500 font-medium">Financial oversight and payout validation management</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-[12px] bg-gradient-to-br from-[#dbeafe]/30 via-white to-white border border-blue-200/80 border-b-4 border-b-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.02)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Verifications</p>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <CheckCircle size={14} className="text-blue-500" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-blue-600">{teamLoading ? "..." : dashboardSummary.totalVerifications}</p>
              <span className="text-[10px] font-semibold text-slate-400">
                Checks allocated
              </span>
            </div>
          </div>

          <div className="rounded-[12px] bg-gradient-to-br from-[#d1fae5]/30 via-white to-white border border-emerald-200/80 border-b-4 border-b-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.02)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">DMC Payouts Settled</p>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <DollarSign size={14} className="text-emerald-500" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between flex-wrap gap-x-2">
              <p className="text-2xl font-extrabold text-emerald-600">
                {invoiceLoading ? "..." : formatCompactCurrency(dashboardSummary.settledAmount)}
              </p>
              <span className={`inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${
                showNegativeTrend
                  ? "bg-rose-50/80 text-rose-700 border-rose-200/60"
                  : "bg-emerald-50/80 text-emerald-700 border-emerald-200/60"
              }`}>
                <TrendingUp size={9} />
                {showNegativeTrend ? "-" : "+"}
                {dashboardSummary.payoutTrend.percentage}% wk
              </span>
            </div>
          </div>

          <div className="rounded-[12px] bg-gradient-to-br from-[#ffe4e6]/30 via-white to-white border border-rose-200/80 border-b-4 border-b-rose-500 shadow-[0_4px_12px_rgba(244,63,94,0.02)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rate Mismatch Flags</p>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <Flag size={14} className="text-rose-500" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-rose-600">{invoiceLoading ? "..." : dashboardSummary.mismatchFlags}</p>
              <span className={`inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${
                mismatchNeedsReview
                  ? "bg-rose-50/80 text-rose-700 border-rose-200/60 animate-pulse"
                  : "bg-emerald-50/80 text-emerald-700 border-emerald-200/60"
              }`}>
                <AlertTriangle size={9} />
                {mismatchNeedsReview ? "Needs Review" : "Healthy"}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-slate-50/80 via-slate-50/30 to-white">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.22)] transition-transform duration-300 hover:scale-105">
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 hover:opacity-10 transition-opacity" />
                <TrendingUp size={18} color="white" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-none">
                    Payout Validation &mdash; Team Overview
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-2 py-0.5 text-[9.5px] font-semibold text-orange-700 tracking-wide uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Performance
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1 font-medium leading-relaxed">
                  Executive performance on verification and settlement tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500 text-[10.5px] uppercase tracking-wider">From:</span>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-bold focus:outline-none focus:border-blue-400"
              />
              <span className="font-semibold text-slate-500 text-[10.5px] uppercase tracking-wider">To:</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(event) => setToDate(event.target.value)}
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-bold focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="finance-transparent-scrollbar overflow-x-auto">
            <div className="min-w-[950px]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-6 py-2.5 text-left text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">Exec Name</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-center text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">Verifications Pending</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">Resolution Breakdown</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">Accuracy %</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                      Loading team overview...
                    </td>
                  </tr>
                ) : dashboardState.team.length ? (
                  dashboardState.team.map((exec) => {
                    const total = Number(exec?.settled || 0) + Number(exec?.escalated || 0);
                    const settledPct = total > 0 ? (Number(exec?.settled || 0) / total) * 100 : 0;
                    const escalatedPct =
                      total > 0 ? (Number(exec?.escalated || 0) / total) * 100 : 0;
 
                    return (
                      <tr
                        key={exec.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                exec.avatarColor || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {exec.initials || "F"}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800 leading-normal">{exec.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">{exec.email || "-"}</p>
                            </div>
                          </div>
                        </td>
 
                        <td className="px-4 py-2.5 text-center align-middle">
                          <span
                            className={`text-[13px] font-extrabold tabular-nums ${pendingColor(
                              Number(exec?.pending || 0),
                            )}`}
                          >
                            {Number(exec?.pending || 0)}
                          </span>
                        </td>
 
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                <CheckCheck size={10} />
                                Settled: {Number(exec?.settled || 0)}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/70 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                <AlertTriangle size={10} />
                                Escalated: {Number(exec?.escalated || 0)}
                              </span>
                            </div>
                            <AnimatedResolutionBar
                              settledPct={settledPct}
                              escalatedPct={escalatedPct}
                            />
                          </div>
                        </td>
 
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-3">
                            <AnimatedAccuracyBar
                              accuracy={Number(exec?.accuracy || 0)}
                              barClassName={accuracyColor(Number(exec?.accuracy || 0))}
                            />
                            <span className="text-[12.5px] font-extrabold text-slate-700">
                              {Number(exec?.accuracy || 0)}%
                            </span>
                          </div>
                        </td>
 
                        <td className="px-4 py-2.5 align-middle">
                          <StatusBadge status={exec.status} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-sm text-center text-gray-400">
                      {teamError || "No finance activity found for the selected dates."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Submitted Finance Reports Hub */}
        <div className="mt-6 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.22)] transition-transform duration-300 hover:scale-105">
                <FileSpreadsheet size={19} color="white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-none">
                    Exported Finance Reports
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 tracking-wide uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Manager Hub
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1 font-medium leading-relaxed">
                  Real-time submitted reports from DMC Invoices &amp; Payment Verification pages
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {reportsHistory.length > 0 ? (
              reportsHistory.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100/80 shadow-2xs">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[13px] font-bold text-slate-800 leading-none">
                          {report.title}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                            report.type === "Payment Verification"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {report.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        Generated on: <span className="text-slate-600 font-semibold">{report.generatedAt}</span> &bull; Source: <span className="text-slate-600 font-semibold">{report.source}</span> &bull; Records: <span className="text-emerald-700 font-bold">{report.totalItems || report.items?.length || 0}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadReportCSV(report)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 shrink-0 self-start sm:self-center"
                  >
                    <Download size={13} />
                    <span>Download CSV</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
                No exported finance reports found yet. When reports are exported from Internal Invoices or Payment Verification pages, they will appear here for download.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
