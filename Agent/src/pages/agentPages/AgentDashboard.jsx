import {
  FileQuestionMark,
  CircleCheckBig,
  Wallet,
  ArrowUpRight,
  Plus,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/Api.js";
import PerformanceAnalytics from "../../components/analytics/PerformanceAnalytics.jsx";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const emptyDashboard = {
  summary: {
    totalQueries: 0,
    activeBookings: 0,
    activeBookingsTouchedToday: 0,
    walletBalance: 0,
    pendingCommissions: 0,
    totalEarnings: 0,
    currency: "INR",
  },
  trends: {
    queries: {
      change: 0,
      direction: "flat",
    },
  },
  pipeline: [],
  recentActivity: [],
  queryTrendData: [],
};

const formatCurrency = (value, currency = "INR") => {
  const amount = Math.round(Number(value || 0)).toLocaleString("en-IN");
  return currency === "INR" ? `₹ ${amount}` : `${currency} ${amount}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const getTrendCopy = (trend = {}) => {
  const change = Math.abs(Number(trend?.change || 0));
  if (trend?.direction === "up") return `+${change}% from last month`;
  if (trend?.direction === "down") return `-${change}% from last month`;
  return "No change vs last month";
};

const getTrendColor = (direction = "flat") => {
  if (direction === "up") return "text-green-600";
  if (direction === "down") return "text-rose-600";
  return "text-gray-500";
};

const AgentHeaderArtwork = () => (
  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-sky-100 bg-[radial-gradient(circle_at_top,_#dbeafe,_#bfdbfe_55%,_#93c5fd)] shadow-[0_10px_24px_rgba(59,130,246,0.18)]">
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
      <defs>
        <linearGradient id="agent-orbit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="15.5" fill="#eff6ff" stroke="url(#agent-orbit)" strokeWidth="1.6" />
      <circle cx="24" cy="20" r="5.2" fill="#2563eb" />
      <path d="M15.6 33.2c1.9-4.4 5.3-6.8 8.4-6.8s6.5 2.4 8.4 6.8" fill="#0f766e" />
      <path d="M12.5 17.5a16.5 16.5 0 0 1 6.3-6.1" fill="none" stroke="#60a5fa" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M35.5 30.5a16.5 16.5 0 0 1-6.3 6.1" fill="none" stroke="#38bdf8" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="13.5" cy="16.7" r="2.1" fill="#f59e0b" />
      <circle cx="34.7" cy="31.6" r="1.8" fill="#14b8a6" />
    </svg>
    <div className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-white/25 blur-sm" />
  </div>
);

const AgentDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const now = new Date();
  const currentWeekIndex = Math.floor((now.getDate() - 1) / 7);
  const initialDefaultFilter = {
    timeRange: "weekly",
    selectedYear: now.getFullYear(),
    selectedMonth: now.getMonth(),
    selectedWeek: currentWeekIndex,
  };

  const [queryFilters, setQueryFilters] = useState(initialDefaultFilter);
  const [paymentFilters, setPaymentFilters] = useState(initialDefaultFilter);

  const fetchDashboardData = async (qFilters = queryFilters, pFilters = paymentFilters) => {
    try {
      setLoadingDashboard(true);
      setDashboardError("");
      const params = new URLSearchParams();

      if (qFilters.timeRange) params.append("queryRange", qFilters.timeRange);
      if (qFilters.selectedYear) params.append("queryYear", qFilters.selectedYear);
      if (qFilters.selectedMonth !== undefined) params.append("queryMonth", qFilters.selectedMonth);
      if (qFilters.selectedWeek !== undefined) params.append("queryWeek", qFilters.selectedWeek);

      if (pFilters.timeRange) params.append("paymentRange", pFilters.timeRange);
      if (pFilters.selectedYear) params.append("paymentYear", pFilters.selectedYear);
      if (pFilters.selectedMonth !== undefined) params.append("paymentMonth", pFilters.selectedMonth);
      if (pFilters.selectedWeek !== undefined) params.append("paymentWeek", pFilters.selectedWeek);

      const queryString = params.toString();
      const url = queryString ? `/agent/dashboard?${queryString}` : "/agent/dashboard";
      const { data: dashboardData } = await API.get(url);

      setDashboard({
        summary: {
          totalQueries: Number(dashboardData?.summary?.totalQueries || 0),
          activeBookings: Number(dashboardData?.summary?.activeBookings || 0),
          activeBookingsTouchedToday: Number(dashboardData?.summary?.activeBookingsTouchedToday || 0),
          pastQueries: Number(dashboardData?.summary?.pastQueries || 0),
          presentQueries: Number(dashboardData?.summary?.presentQueries || 0),
          futureQueries: Number(dashboardData?.summary?.futureQueries || 0),
          receivedAmount: Number(dashboardData?.summary?.receivedAmount || 0),
          amountPayable: Number(dashboardData?.summary?.amountPayable || 0),
          clientPendingAmount: Number(dashboardData?.summary?.clientPendingAmount || 0),
          walletBalance: Number(dashboardData?.summary?.walletBalance || 0),
          pendingCommissions: Number(dashboardData?.summary?.pendingCommissions || 0),
          totalEarnings: Number(dashboardData?.summary?.totalEarnings || 0),
          currency: dashboardData?.summary?.currency || "INR",
        },
        trends: {
          queries: {
            change: Number(dashboardData?.trends?.queries?.change || 0),
            direction: dashboardData?.trends?.queries?.direction || "flat",
          },
        },
        pipeline: Array.isArray(dashboardData?.pipeline) ? dashboardData.pipeline : [],
        recentActivity: Array.isArray(dashboardData?.recentActivity) ? dashboardData.recentActivity : [],
        queryTrendData: Array.isArray(dashboardData?.queryTrendData) ? dashboardData.queryTrendData : [],
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setDashboardError(error?.response?.data?.message || "Unable to load dashboard right now.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(queryFilters, paymentFilters);
  }, [queryFilters, paymentFilters]);

  const queryTrend = dashboard.trends.queries || { change: 0, direction: "flat" };

  const quickActions = [
    {
      label: "Create New Query",
      path: "/agent/queries?create=true",
      borderColor: "border-l-blue-500",
      bgClass: "from-blue-50/20 to-white hover:from-blue-50/50 hover:to-white/80",
      icon: Plus,
      iconColor: "text-blue-600 bg-blue-50/80 border border-blue-100",
    },
    {
      label: "Upload Document",
      path: "/agent/documents",
      borderColor: "border-l-violet-500",
      bgClass: "from-violet-50/20 to-white hover:from-violet-50/50 hover:to-white/80",
      icon: Upload,
      iconColor: "text-violet-600 bg-violet-50/80 border border-violet-100",
    },
    {
      label: "Check Payment History",
      path: "/agent/finance",
      borderColor: "border-l-amber-500",
      bgClass: "from-amber-50/20 to-white hover:from-amber-50/50 hover:to-white/80",
      icon: Wallet,
      iconColor: "text-amber-600 bg-amber-50/80 border border-amber-100",
    },
  ];

  const stats = [
    {
      key: "queries",
      label: "Total Queries",
      value: formatNumber(dashboard.summary.totalQueries),
      helper: getTrendCopy(queryTrend),
      helperClassName: getTrendColor(queryTrend.direction),
      icon: FileQuestionMark,
      iconWrapClass: "bg-blue-100 text-blue-600",
      gradient: "linear-gradient(135deg, rgba(219, 234, 254, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)",
      borderBottom: "3px solid #3b82f6",
    },
    {
      key: "bookings",
      label: "Booking Payments",
      value: formatNumber(dashboard.summary.activeBookings),
      helper: `+${formatNumber(dashboard.summary.activeBookingsTouchedToday)} updated today`,
      helperClassName:
        dashboard.summary.activeBookingsTouchedToday > 0 ? "text-green-600" : "text-gray-500",
      icon: CircleCheckBig,
      iconWrapClass: "bg-green-100 text-green-600",
      gradient: "linear-gradient(135deg, rgba(220, 252, 231, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)",
      borderBottom: "3px solid #10b981",
    },
  ];

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-3.5 px-0 pt-0 pb-0"
    >
      {/* ── Header ── */}
      <motion.header
        variants={cardVariant}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-3">
          <AgentHeaderArtwork />
          <div>
            <h1 className="text-xl font-bold leading-tight text-gray-900">Agent Dashboard</h1>
            <p className="text-[0.78rem] text-gray-500">Overview of your travel agency performance.</p>
          </div>
        </div>
      </motion.header>

      {/* ── Error banner ── */}
      {dashboardError && (
        <motion.div
          variants={cardVariant}
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700"
        >
          {dashboardError}
        </motion.div>
      )}

      {/* ── Stat cards ── */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:grid-cols-2">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.key}
              variants={cardVariant}
              whileHover={{ y: -1 }}
              style={{ background: card.gradient, borderBottom: card.borderBottom }}
              className="flex flex-col justify-between rounded-xl border border-gray-100 p-2.5 sm:p-3 shadow-sm min-h-[76px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold leading-tight text-gray-600 truncate">{card.label}</p>
                  <h2 className="mt-0.5 text-sm sm:text-base font-extrabold leading-none text-gray-900 truncate">
                    {loadingDashboard ? "..." : card.value}
                  </h2>
                </div>
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full ${card.iconWrapClass}`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <p className={`mt-1.5 text-[0.65rem] font-medium leading-tight truncate ${card.helperClassName}`}>
                {loadingDashboard ? "Loading..." : card.helper}
              </p>
            </motion.article>
          );
        })}
      </motion.section>

      {/* ── Analytics + Quick Actions grid ── */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 gap-3 lg:grid-cols-3 items-stretch">

        {/* Left: Analytics */}
        <motion.article variants={cardVariant} className="lg:col-span-2 flex flex-col">
          <PerformanceAnalytics
            dashboard={dashboard}
            loadingDashboard={loadingDashboard}
            onQueryFilterChange={setQueryFilters}
          />
        </motion.article>

        {/* Right: Quick Actions + Pro Tip */}
        <div className="flex flex-col gap-3">
          <motion.article
            variants={cardVariant}
            className="rounded-[18px] border border-gray-100 bg-white p-3.5 shadow-sm"
          >
            <h3 className="mb-2.5 text-[0.88rem] font-bold text-gray-900">Quick Actions</h3>

            <div className="space-y-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    whileHover={{ x: 2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    className={`flex w-full items-center justify-between rounded-xl border border-gray-100 border-l-4 ${action.borderColor} bg-gradient-to-r ${action.bgClass} px-3 py-2 text-left shadow-sm transition-all`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${action.iconColor}`}>
                        <ActionIcon className="h-[13px] w-[13px] flex-shrink-0" />
                      </div>
                      <span className="text-[0.75rem] font-bold text-gray-900">{action.label}</span>
                    </div>
                    <ArrowUpRight className="h-[13px] w-[13px] flex-shrink-0 text-gray-400" />
                  </motion.button>
                );
              })}
            </div>
          </motion.article>

          <motion.article
            variants={cardVariant}
            className="rounded-[18px] border border-gray-100 bg-white p-3.5 shadow-sm"
          >
            <h3 className="mb-2 text-[0.88rem] font-bold text-gray-900">Pro Tip</h3>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[0.7rem] leading-[1.6] text-gray-500">
                Complete your KYC verification to unlock higher withdrawal limits and premium support.
              </p>
            </div>
          </motion.article>
        </div>
      </motion.section>
    </motion.section>
  );
};

export default AgentDashboard;
