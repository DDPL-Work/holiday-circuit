import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  CheckCircle2,
  TrendingUp,
  Building2,
  Clock,
  Users,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  X,
  Info,
  Clock3,
} from "lucide-react";
import API from "../../utils/Api";
import { AnimatePresence, motion } from "framer-motion";

const permissions = [
  "Verify agent payments",
  "Manage internal invoices",
  "Track payment statuses",
  "Review UTR numbers and receipts",
  "Generate financial reports",
];

const formatCurrency = (value) =>
  `\u20B9 ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatCompactDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "-";

  return `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
};

const notifConfig = {
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
  warning: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50", dot: "bg-yellow-500" },
};

const getTimeAgo = (date) => {
  const now = new Date();
  const created = new Date(date);
  const diffInMinutes = Math.floor((now - created) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

const NotificationPanel = ({
  notifications,
  onDismiss,
  onClose,
  onClearAll,
  loadingNotifications,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.96 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
  >
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-gray-700" />
        <span className="text-sm font-semibold text-gray-900">Finance Notifications</span>
        {notifications.length > 0 && (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </div>
      <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
      <AnimatePresence initial={false}>
        {loadingNotifications ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-xs">No internal invoice notifications</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = notifConfig[notif.type] || notifConfig.info;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={notif._id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
                <div className={`flex-shrink-0 rounded-lg p-1.5 ${cfg.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900">{notif.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{notif.message}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Clock3 className="h-2.5 w-2.5 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{getTimeAgo(notif.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(notif._id)}
                  className="mt-0.5 flex-shrink-0 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>

    {notifications.length > 0 && (
      <div className="border-t border-gray-100 px-4 py-2.5">
        <button
          onClick={onClearAll}
          className="text-[11px] font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          Clear all
        </button>
      </div>
    )}
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Unpaid: "bg-red-50 text-red-600 border-red-100",
    "Pending Verification": "bg-amber-50 text-amber-600 border-amber-100",
    Settled: "bg-green-50 text-green-600 border-green-100",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-50 text-gray-600 border-gray-100"}`}
    >
      {status}
    </span>
  );
};

const DateRangeInputs = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onApply,
}) => (
  <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end">
    <div className="flex-1">
      <label className="mb-1 block text-xs text-slate-500">Start Date</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
    </div>
    <div className="flex-1">
      <label className="mb-1 block text-xs text-slate-500">End Date</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
    </div>
    <button
      onClick={onApply}
      className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
    >
      Apply
    </button>
  </div>
);

const TabButton = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
      active
        ? "bg-slate-900 text-white shadow"
        : "text-slate-500 hover:text-slate-800"
    }`}
  >
    {id === "custom" && <Calendar className="h-3.5 w-3.5" />}
    {label}
  </button>
);

const createEmptyDashboard = () => ({
  metrics: {
    receivableTotal: 0,
    payableTotal: 0,
    pendingVerifications: 0,
    receivableChange: "0% vs last period",
    payableChange: "0% vs last period",
    pendingChange: "0% vs previous period",
    settledTotal: 0,
    pendingApprovals: 0,
    overduePayments: 0,
    taxCollected: 0,
  },
  receivables: [],
  payables: [],
  bankReconciliationStatus: "Up to Date",
  window: { start: "", end: "" },
});

const FinanceDashboard = () => {
  const [dashboardRangeType, setDashboardRangeType] = useState("weekly");
  const [dashboardLastPresetRange, setDashboardLastPresetRange] = useState("weekly");
  const [dashboardStartDate, setDashboardStartDate] = useState("");
  const [dashboardEndDate, setDashboardEndDate] = useState("");
  const [dashboardAppliedRange, setDashboardAppliedRange] = useState({ start: "", end: "" });
  const [summaryRangeType, setSummaryRangeType] = useState("weekly");
  const [summaryLastPresetRange, setSummaryLastPresetRange] = useState("weekly");
  const [summaryStartDate, setSummaryStartDate] = useState("");
  const [summaryEndDate, setSummaryEndDate] = useState("");
  const [summaryAppliedRange, setSummaryAppliedRange] = useState({ start: "", end: "" });
  const [dashboardData, setDashboardData] = useState(createEmptyDashboard());
  const [summaryData, setSummaryData] = useState(createEmptyDashboard());
  const [notifications, setNotifications] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [bellPop, setBellPop] = useState(false);
  const [hasFetchedNotifications, setHasFetchedNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardRangeError, setDashboardRangeError] = useState("");
  const [summaryRangeError, setSummaryRangeError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const params = { range: dashboardRangeType };
        if (dashboardRangeType === "custom") {
          params.startDate = dashboardAppliedRange.start;
          params.endDate = dashboardAppliedRange.end;
        }

        const { data } = await API.get("/admin/finance-dashboard", { params });
        setDashboardData(data?.data || createEmptyDashboard());
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError?.response?.data?.message || "Failed to load dashboard");
        setDashboardData(createEmptyDashboard());
      } finally {
        setLoading(false);
      }
    };

    if (
      dashboardRangeType === "custom" &&
      (!dashboardAppliedRange.start || !dashboardAppliedRange.end)
    ) {
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, [dashboardRangeType, dashboardAppliedRange]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);

        const params = { range: summaryRangeType };
        if (summaryRangeType === "custom") {
          params.startDate = summaryAppliedRange.start;
          params.endDate = summaryAppliedRange.end;
        }

        const { data } = await API.get("/admin/finance-dashboard", { params });
        setSummaryData(data?.data || createEmptyDashboard());
      } catch (fetchError) {
        console.error(fetchError);
        setSummaryData(createEmptyDashboard());
      } finally {
        setSummaryLoading(false);
      }
    };

    if (
      summaryRangeType === "custom" &&
      (!summaryAppliedRange.start || !summaryAppliedRange.end)
    ) {
      setSummaryLoading(false);
      return;
    }

    fetchSummary();
  }, [summaryRangeType, summaryAppliedRange]);

  useEffect(() => {
    const fetchNotifications = async (silent = false) => {
      try {
        if (!silent) setLoadingNotifications(true);
        const { data } = await API.get("/admin/notifications");
        const nextNotifications = data?.notifications || [];

        setNotifications((prevNotifications) => {
          const previousCount = prevNotifications.filter(
            (notification) => notification?.title === "New Internal Invoice Submitted",
          ).length;
          const nextCount = nextNotifications.filter(
            (notification) => notification?.title === "New Internal Invoice Submitted",
          ).length;

          if (hasFetchedNotifications && nextCount > previousCount) {
            setBellPop(true);
          }

          return nextNotifications;
        });
      } catch (fetchError) {
        console.error("Failed to load finance notifications", fetchError);
      } finally {
        setHasFetchedNotifications(true);
        if (!silent) setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(() => {
      fetchNotifications(true);
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [hasFetchedNotifications]);

  useEffect(() => {
    if (!bellPop) return undefined;

    const timeoutId = window.setTimeout(() => {
      setBellPop(false);
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [bellPop]);

  const financeNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => notification?.title === "New Internal Invoice Submitted",
      ),
    [notifications],
  );

  const unreadFinanceCount =
    financeNotifications.filter((notification) => !notification.isRead).length ||
    financeNotifications.length;

  const summaryLabel =
    summaryRangeType === "weekly"
      ? "Custom Range Summary"
      : summaryRangeType === "monthly"
        ? "This Month Summary"
        : "Custom Range Summary";

  const tabLabel =
    dashboardRangeType === "weekly"
      ? "This Week"
      : dashboardRangeType === "monthly"
        ? "This Month"
        : "This Range";

  const handleDashboardRangeTypeChange = (nextRange) => {
    if (nextRange === "custom") {
      if (dashboardRangeType === "custom") {
        setDashboardRangeError("");
        setDashboardRangeType(dashboardLastPresetRange || "weekly");
        return;
      }

      setDashboardRangeError("");
      setDashboardRangeType("custom");
      return;
    }

    setDashboardLastPresetRange(nextRange);
    setDashboardRangeError("");
    setDashboardRangeType(nextRange);
  };

  const handleSummaryRangeTypeChange = (nextRange) => {
    if (nextRange === "custom") {
      if (summaryRangeType === "custom") {
        setSummaryRangeError("");
        setSummaryRangeType(summaryLastPresetRange || "weekly");
        return;
      }

      setSummaryRangeError("");
      setSummaryRangeType("custom");
      return;
    }

    setSummaryLastPresetRange(nextRange);
    setSummaryRangeError("");
    setSummaryRangeType(nextRange);
  };

  const applyDashboardCustomRange = () => {
    if (!dashboardStartDate || !dashboardEndDate) {
      setDashboardRangeError("Start date and end date dono select karo.");
      return;
    }

    if (new Date(dashboardStartDate) > new Date(dashboardEndDate)) {
      setDashboardRangeError("Start date end date se bada nahi ho sakta.");
      return;
    }

    setDashboardRangeError("");
    setDashboardAppliedRange({ start: dashboardStartDate, end: dashboardEndDate });
  };

  const applySummaryCustomRange = () => {
    if (!summaryStartDate || !summaryEndDate) {
      setSummaryRangeError("Start date and end date dono select karo.");
      return;
    }

    if (new Date(summaryStartDate) > new Date(summaryEndDate)) {
      setSummaryRangeError("Start date end date se bada nahi ho sakta.");
      return;
    }

    setSummaryRangeError("");
    setSummaryAppliedRange({ start: summaryStartDate, end: summaryEndDate });
  };

  const dismissNotification = async (id) => {
    try {
      await API.delete(`/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((notification) => notification._id !== id));
    } catch (fetchError) {
      console.error("Failed to delete finance notification", fetchError);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Promise.all(
        financeNotifications.map((notification) =>
          API.delete(`/admin/notifications/${notification._id}`),
        ),
      );
      setNotifications((prev) =>
        prev.filter(
          (notification) => notification?.title !== "New Internal Invoice Submitted",
        ),
      );
      setOpenNotifications(false);
    } catch (fetchError) {
      console.error("Failed to clear finance notifications", fetchError);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6  pb-1 text-slate-800">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finance Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track receivables, payables, and payment verifications
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 sm:flex-nowrap">
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-1 py-1">
            <TabButton
              id="weekly"
              label="Weekly"
              active={dashboardRangeType === "weekly"}
              onClick={handleDashboardRangeTypeChange}
            />
            <TabButton
              id="monthly"
              label="Monthly"
              active={dashboardRangeType === "monthly"}
              onClick={handleDashboardRangeTypeChange}
            />
            <TabButton
              id="custom"
              label="Custom Range"
              active={dashboardRangeType === "custom"}
              onClick={handleDashboardRangeTypeChange}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <CheckCircle2
              className={`h-5 w-5 ${
                dashboardData.bankReconciliationStatus === "Up to Date"
                  ? "text-green-500"
                  : "text-amber-500"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium leading-tight text-slate-500">
                Bank Reconciliation
              </span>
              <span
                className={`text-xs font-bold leading-tight ${
                  dashboardData.bankReconciliationStatus === "Up to Date"
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {dashboardData.bankReconciliationStatus}
              </span>
            </div>
          </div>

          <div className="relative shrink-0">
            <motion.button
              onClick={() => setOpenNotifications((value) => !value)}
              animate={
                bellPop
                  ? { scale: [1, 1.12, 1], rotate: [0, -10, 10, -6, 6, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <Bell className={`h-[18px] w-[18px] ${bellPop ? "text-blue-600" : "text-gray-600"}`} />
              {unreadFinanceCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadFinanceCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {openNotifications && (
                <NotificationPanel
                  notifications={financeNotifications}
                  onDismiss={dismissNotification}
                  onClose={() => setOpenNotifications(false)}
                  onClearAll={clearAllNotifications}
                  loadingNotifications={loadingNotifications}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {dashboardRangeType === "custom" && (
          <motion.div
            key="dashboard-custom-range-panel"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Custom Date Range</h3>
              </div>
              <DateRangeInputs
                startDate={dashboardStartDate}
                endDate={dashboardEndDate}
                onStartChange={(value) => {
                  setDashboardStartDate(value);
                  if (dashboardRangeError) setDashboardRangeError("");
                }}
                onEndChange={(value) => {
                  setDashboardEndDate(value);
                  if (dashboardRangeError) setDashboardRangeError("");
                }}
                onApply={applyDashboardCustomRange}
              />
              {dashboardRangeError && (
                <p className="mt-2 text-sm font-medium text-red-500">
                  {dashboardRangeError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <Shield className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">Your Access Level</h2>
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                Finance Team
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Access restricted to financial operations
            </p>
            <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-600">
              Permissions
            </p>
            <div className="grid grid-cols-1 gap-x-50 gap-y-2 md:grid-cols-2">
              {permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="text-sm text-slate-600">{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Total Collection</h3>
            <p className="mb-3 text-xs text-slate-400">Payments received from agents</p>
            <p className="text-xl font-bold text-blue-600">
              {loading ? "..." : formatCurrency(dashboardData.metrics.receivableTotal)}
            </p>
            <p className="mt-2 text-xs font-medium text-green-500">
              {dashboardData.metrics.receivableChange}
            </p>
          </div>
          <TrendingUp className="h-6 w-6 text-blue-500" />
        </div>

        <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Total Payouts</h3>
            <p className="mb-3 text-xs text-slate-400">Money paid to DMCs</p>
            <p className="text-xl font-bold text-purple-600">
              {loading ? "..." : formatCurrency(dashboardData.metrics.payableTotal)}
            </p>
            <p className="mt-2 text-xs font-medium text-green-500">
              {dashboardData.metrics.payableChange}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-2">
            <Building2 className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Pending Verifications
            </h3>
            <p className="mb-3 text-xs text-slate-400">Awaiting UTR verification</p>
            <p className="text-2xl font-bold text-orange-500">
              {loading ? "..." : dashboardData.metrics.pendingVerifications}
            </p>
            <p className="mt-2 text-xs font-medium text-red-500">
              {dashboardData.metrics.pendingChange}
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 p-2">
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 border-b border-gray-300 p-5">
            <Users className="h-5 w-5 text-slate-600" />
            <h2 className="text-md font-bold">Agent Receivables</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
            ) : dashboardData.receivables.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No transactions found for{" "}
              <span className="font-semibold text-slate-600">{tabLabel}</span>
              </div>
            ) : (
              dashboardData.receivables.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="rounded-lg border-b border-gray-50 p-4 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <span className="text-sm font-bold">{item.id}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-xs text-slate-500">{item.company}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Payment Due: {formatCompactDate(item.date)}</span>
                      </div>
                    </div>
                    <span className="text-base font-bold">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 border-b border-gray-300 p-5">
            <Building2 className="h-5 w-5 text-slate-600" />
            <h2 className="text-md font-bold">DMC Payables</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
            ) : dashboardData.payables.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No payables found for{" "}
              <span className="font-semibold text-slate-600">{tabLabel}</span>
              </div>
            ) : (
              dashboardData.payables.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="rounded-lg border-b border-gray-50 p-4 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <span className="text-sm font-bold">{item.name}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Payment Due: {formatCompactDate(item.date)}</span>
                      </div>
                    </div>
                    <span className="text-base font-bold">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{summaryLabel}</h2>
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-gray-100 px-1 py-1">
            <TabButton
              id="weekly"
              label="Weekly"
              active={summaryRangeType === "weekly"}
              onClick={handleSummaryRangeTypeChange}
            />
            <TabButton
              id="monthly"
              label="Monthly"
              active={summaryRangeType === "monthly"}
              onClick={handleSummaryRangeTypeChange}
            />
            <TabButton
              id="custom"
              label="Custom"
              active={summaryRangeType === "custom"}
              onClick={handleSummaryRangeTypeChange}
            />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {summaryRangeType === "custom" && (
            <motion.div
              key="summary-custom-range-panel"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mb-5 border-t border-gray-100 pt-4">
                <DateRangeInputs
                  startDate={summaryStartDate}
                  endDate={summaryEndDate}
                  onStartChange={(value) => {
                    setSummaryStartDate(value);
                    if (summaryRangeError) setSummaryRangeError("");
                  }}
                  onEndChange={(value) => {
                    setSummaryEndDate(value);
                    if (summaryRangeError) setSummaryRangeError("");
                  }}
                  onApply={applySummaryCustomRange}
                />
                {summaryRangeError && (
                  <p className="mt-2 text-sm font-medium text-red-500">{summaryRangeError}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 text-center md:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="mb-2 rounded-full bg-green-50 p-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="mb-1 text-xs text-slate-500">Payments Settled</p>
            <p className="text-xl font-bold text-green-600">
              {summaryLoading ? "..." : formatCurrency(summaryData.metrics.settledTotal)}
            </p>
          </div>

          <div className="flex flex-col items-center border-l border-gray-100">
            <div className="mb-2 rounded-full bg-amber-50 p-3">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <p className="mb-1 text-xs text-slate-500">Pending Approvals</p>
            <p className="text-xl font-bold text-amber-600">
              {summaryLoading ? "..." : summaryData.metrics.pendingApprovals}
            </p>
          </div>

          <div className="flex flex-col items-center border-l border-gray-100">
            <div className="mb-2 rounded-full bg-red-50 p-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="mb-1 text-xs text-slate-500">Overdue Payments</p>
            <p className="text-xl font-bold text-red-600">
              {summaryLoading ? "..." : summaryData.metrics.overduePayments}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
