import {
  FileQuestionMark,
  CircleCheckBig,
  Wallet,
  ArrowUpRight,
  Loader2,
  Plus,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import API from "../../utils/Api.js";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#0f172a] text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs shadow-xl min-w-[130px] backdrop-blur-md bg-opacity-95">
        <p className="font-semibold text-slate-400">{label} {dataPoint.year}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span className="text-slate-350">Queries</span>
            </div>
            <span className="font-bold text-[#10b981]">{payload[0].value}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              <span className="text-slate-350">Bookings</span>
            </div>
            <span className="font-bold text-[#3b82f6]">{payload[1]?.value ?? 0}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingDashboard(true);
        setDashboardError("");
        const { data: dashboardData } = await API.get("/agent/dashboard");

        setDashboard({
          summary: {
            totalQueries: Number(dashboardData?.summary?.totalQueries || 0),
            activeBookings: Number(dashboardData?.summary?.activeBookings || 0),
            activeBookingsTouchedToday: Number(dashboardData?.summary?.activeBookingsTouchedToday || 0),
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

    fetchDashboardData();
  }, []);

  const [timeRange, setTimeRange] = useState(6);

  const filteredChartData = useMemo(() => {
    if (!dashboard?.queryTrendData || dashboard.queryTrendData.length === 0) return [];
    return dashboard.queryTrendData.slice(-timeRange);
  }, [dashboard?.queryTrendData, timeRange]);

  const statsSummary = useMemo(() => {
    if (!dashboard?.queryTrendData || dashboard.queryTrendData.length === 0) {
      return { totalQueries: 0, totalBookings: 0, changePercent: 0, isUp: true };
    }

    const data = dashboard.queryTrendData;
    const len = data.length;

    if (timeRange === 6 && len >= 12) {
      const currentPeriod = data.slice(-6);
      const previousPeriod = data.slice(-12, -6);

      const currentQueries = currentPeriod.reduce((sum, item) => sum + item.queries, 0);
      const previousQueries = previousPeriod.reduce((sum, item) => sum + item.queries, 0);

      const diff = currentQueries - previousQueries;
      const changePercent = previousQueries > 0 ? ((diff / previousQueries) * 100).toFixed(1) : (diff > 0 ? "100.0" : "0.0");
      return {
        totalQueries: currentQueries,
        totalBookings: currentPeriod.reduce((sum, item) => sum + item.bookings, 0),
        changePercent: Math.abs(parseFloat(changePercent)),
        isUp: diff >= 0,
      };
    } else if (timeRange === 3 && len >= 6) {
      const currentPeriod = data.slice(-3);
      const previousPeriod = data.slice(-6, -3);

      const currentQueries = currentPeriod.reduce((sum, item) => sum + item.queries, 0);
      const previousQueries = previousPeriod.reduce((sum, item) => sum + item.queries, 0);

      const diff = currentQueries - previousQueries;
      const changePercent = previousQueries > 0 ? ((diff / previousQueries) * 100).toFixed(1) : (diff > 0 ? "100.0" : "0.0");
      return {
        totalQueries: currentQueries,
        totalBookings: currentPeriod.reduce((sum, item) => sum + item.bookings, 0),
        changePercent: Math.abs(parseFloat(changePercent)),
        isUp: diff >= 0,
      };
    } else {
      const currentQueries = data.reduce((sum, item) => sum + item.queries, 0);
      const currentBookings = data.reduce((sum, item) => sum + item.bookings, 0);
      const queryChange = Number(dashboard?.trends?.queries?.change || 0);
      const direction = dashboard?.trends?.queries?.direction || "flat";
      return {
        totalQueries: currentQueries,
        totalBookings: currentBookings,
        changePercent: queryChange,
        isUp: direction === "up",
      };
    }
  }, [dashboard?.queryTrendData, dashboard?.trends?.queries, timeRange]);

  const queryTrend = dashboard.trends.queries || { change: 0, direction: "flat" };

  const quickActions = [
    {
      label: "Create New Query",
      path: "/agent/queries",
      borderColor: "border-l-blue-500",
      bgClass: "from-blue-50/20 to-white hover:from-blue-50/50 hover:to-white/80",
      icon: Plus,
      iconColor: "text-blue-600 bg-blue-50/80 border border-blue-100",
    },
    {
      label: "Upload Passport",
      path: "/agent/documents",
      borderColor: "border-l-violet-500",
      bgClass: "from-violet-50/20 to-white hover:from-violet-50/50 hover:to-white/80",
      icon: Upload,
      iconColor: "text-violet-600 bg-violet-50/80 border border-violet-100",
    },
    {
      label: "Check Wallet History",
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
      label: "Active Bookings",
      value: formatNumber(dashboard.summary.activeBookings),
      helper: `+${formatNumber(dashboard.summary.activeBookingsTouchedToday)} updated today`,
      helperClassName:
        dashboard.summary.activeBookingsTouchedToday > 0 ? "text-green-600" : "text-gray-500",
      icon: CircleCheckBig,
      iconWrapClass: "bg-green-100 text-green-600",
      gradient: "linear-gradient(135deg, rgba(220, 252, 231, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)",
      borderBottom: "3px solid #10b981",
    },
    {
      key: "wallet",
      label: "Wallet Balance",
      value: formatCurrency(dashboard.summary.walletBalance, dashboard.summary.currency),
      helper: `Pending commission: ${formatCurrency(
        dashboard.summary.pendingCommissions,
        dashboard.summary.currency,
      )}`,
      helperClassName: "text-gray-500",
      icon: Wallet,
      iconWrapClass: "bg-amber-100 text-amber-600",
      gradient: "linear-gradient(135deg, rgba(254, 243, 199, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)",
      borderBottom: "3px solid #f59e0b",
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
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700"
        >
          {dashboardError}
        </motion.div>
      )}

      {/* ── Stat cards ── */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.key}
              variants={cardVariant}
              whileHover={{ y: -1 }}
              style={{ background: card.gradient, borderBottom: card.borderBottom }}
              className="rounded-[18px] border border-gray-100 p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <h2 className="mt-1 text-[1.35rem] font-bold leading-tight text-gray-900">
                    {loadingDashboard ? "..." : card.value}
                  </h2>
                  <p className={`mt-2 text-[0.75rem] font-semibold ${card.helperClassName}`}>
                    {loadingDashboard ? "Loading..." : card.helper}
                  </p>
                </div>
                <div
                  className={`flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-full ${card.iconWrapClass}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.section>

      {/* ── Bottom grid ── */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Performance Overview Chart */}
        <motion.article
          variants={cardVariant}
          style={{ background: "linear-gradient(135deg, #ffffff 0%, rgba(219, 234, 254, 0.55) 50%, rgba(238, 242, 255, 0.7) 100%)" }}
          className="rounded-[18px] border border-gray-100 p-4.5 shadow-sm lg:col-span-2 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">
                Performance Overview
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                  {loadingDashboard ? "..." : statsSummary.totalQueries}
                </span>
                <span className="text-xs text-gray-500 font-semibold">Total Queries</span>
                {!loadingDashboard && statsSummary.changePercent > 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[0.70rem] font-semibold px-2 py-0.25 rounded-full ${
                    statsSummary.isUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                  }`}>
                    {statsSummary.isUp ? '▲' : '▼'} {statsSummary.changePercent}%
                  </span>
                )}
              </div>
              <p className="text-[0.72rem] text-gray-500 mt-0.5">
                {timeRange === 12 
                  ? "Query submissions and conversions over the past year" 
                  : `vs previous ${timeRange} months`}
              </p>
            </div>

            {/* Controls & Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[0.70rem] font-bold mr-1 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span className="text-gray-500">Queries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-gray-500">Bookings</span>
                </div>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer outline-none transition hover:border-gray-300 focus:ring-2 focus:ring-blue-150"
              >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            </div>
          </div>

          <div className="relative h-48 w-full flex-1 min-h-[195px]">
            {loadingDashboard ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-[1px] rounded-xl text-gray-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading chart data...
              </div>
            ) : filteredChartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                No activity data available to plot.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredChartData}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(226, 232, 240, 0.5)"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    tick={{ fontSize: 9, fontWeight: 600, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                    allowDecimals={false}
                    tick={{ fontSize: 9, fontWeight: 500, fill: "#94a3b8" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQueries)"
                    activeDot={{ r: 4, strokeWidth: 1.5, stroke: "#ffffff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    activeDot={{ r: 4, strokeWidth: 1.5, stroke: "#ffffff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.article>

        {/* Quick Actions */}
        <motion.article
          variants={cardVariant}
          className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 text-[0.95rem] font-bold text-gray-900">Quick Actions</h3>

          <div className="space-y-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ x: 2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className={`flex w-full items-center justify-between rounded-xl border border-gray-150 border-l-4 ${action.borderColor} bg-gradient-to-r ${action.bgClass} px-3 py-2 text-left shadow-sm transition-all`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${action.iconColor}`}>
                      <ActionIcon className="h-[13px] w-[13px] flex-shrink-0" />
                    </div>
                    <span className="text-[0.76rem] font-bold text-gray-900">{action.label}</span>
                  </div>
                  <ArrowUpRight className="h-[13px] w-[13px] flex-shrink-0 text-gray-400" />
                </motion.button>
              );
            })}
          </div>

          <div className="mt-3.5 rounded-xl bg-slate-50 p-2.5">
            <p className="text-[0.82rem] font-bold text-gray-900">Pro Tip</p>
            <p className="mt-1 text-[0.58rem] leading-[1.5] text-gray-500">
              Complete your KYC verification to unlock higher withdrawal limits and premium support.
            </p>
          </div>
        </motion.article>
      </motion.section>
    </motion.section>
  );
};

export default AgentDashboard;
