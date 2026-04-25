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
} from "lucide-react";
import API from "../../../utils/Api";

const DEFAULT_RANGE_DAYS = 90;
const RUPEE_SYMBOL = "\u20B9";

const statusConfig = {
  Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Busy: "bg-amber-50 text-amber-700 border border-amber-200",
  "At Risk": "bg-rose-50 text-rose-700 border border-rose-200",
};

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
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white border-b border-gray-200 px-1 py-1 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-800">Finance Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">{todayLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm font-semibold text-gray-800">
            {user?.name || "Finance Manager"}
          </p>
        </div>
      </div>

      <div className="px- py- pt-5 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FinanceCommandArtwork />
            Finance Command Center - Week {weekNumber}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Financial oversight and payout validation management
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2">Total Verifications</p>
              <p className="text-3xl font-bold text-gray-900">
                {teamLoading ? "..." : dashboardSummary.totalVerifications}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
              <CheckCircle size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2">DMC Payouts Settled</p>
              <p className="text-3xl font-bold text-gray-900">
                {invoiceLoading ? "..." : formatCompactCurrency(dashboardSummary.settledAmount)}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  showNegativeTrend
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <TrendingUp size={11} />
                {showNegativeTrend ? "-" : "+"}
                {dashboardSummary.payoutTrend.percentage}% vs Last Week
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2">Rate Mismatch Flags</p>
              <p className="text-3xl font-bold text-gray-900">
                {invoiceLoading ? "..." : dashboardSummary.mismatchFlags}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  mismatchNeedsReview
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                <AlertTriangle size={11} />
                {mismatchNeedsReview ? "Needs Review" : "No Issues"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <Flag size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-500" />
                Payout Validation - Team Overview
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Executive performance on verification and settlement tasks
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <Calendar size={14} className="text-gray-400" />
              <label className="font-medium">From:</label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-gray-400"
              />
              <label className="font-medium">To:</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(event) => setToDate(event.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">
                    Exec Name
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                    Verifications Pending
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                    Resolution Breakdown
                    <div className="text-[10px] font-normal text-gray-400 normal-case tracking-normal mt-0.5">
                      Invoices Settled vs. Escalated to Admin
                    </div>
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                    Accuracy %
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-sm text-center text-gray-400">
                      Loading team overview...
                    </td>
                  </tr>
                ) : dashboardState.team.length ? (
                  dashboardState.team.map((exec, index) => {
                    const total = Number(exec?.settled || 0) + Number(exec?.escalated || 0);
                    const settledPct = total > 0 ? (Number(exec?.settled || 0) / total) * 100 : 0;
                    const escalatedPct =
                      total > 0 ? (Number(exec?.escalated || 0) / total) * 100 : 0;

                    return (
                      <tr
                        key={exec.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index === dashboardState.team.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                                exec.avatarColor || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {exec.initials || "F"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{exec.name}</p>
                              <p className="text-[11px] text-gray-400">{exec.email || "-"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`text-base font-semibold ${pendingColor(
                              Number(exec?.pending || 0),
                            )}`}
                          >
                            {Number(exec?.pending || 0)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                <CheckCheck size={10} />
                                Settled: {Number(exec?.settled || 0)}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
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

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <AnimatedAccuracyBar
                              accuracy={Number(exec?.accuracy || 0)}
                              barClassName={accuracyColor(Number(exec?.accuracy || 0))}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {Number(exec?.accuracy || 0)}%
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${
                              statusConfig[exec.status] || statusConfig.Active
                            }`}
                          >
                            {exec.status || "Active"}
                          </span>
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
    </div>
  );
}
