import {
  FileQuestionMark,
  CircleCheckBig,
  Wallet,
  ArrowUpRight,
  Clock,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/Api.js";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const activityToneClasses = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
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
};

const formatCurrency = (value, currency = "INR") => {
  const amount = Math.round(Number(value || 0)).toLocaleString("en-IN");
  return currency === "INR" ? `₹ ${amount}` : `${currency} ${amount}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const getTimeAgo = (date) => {
  if (!date) return "Just now";
  const now = new Date();
  const created = new Date(date);
  const diffInMinutes = Math.floor((now - created) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

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
  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-[radial-gradient(circle_at_top,_#dbeafe,_#bfdbfe_55%,_#93c5fd)] shadow-[0_10px_24px_rgba(59,130,246,0.18)]">
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
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

  const queryTrend = dashboard.trends.queries || { change: 0, direction: "flat" };

  const stats = [
    {
      key: "queries",
      label: "Total Queries",
      value: formatNumber(dashboard.summary.totalQueries),
      helper: getTrendCopy(queryTrend),
      helperClassName: getTrendColor(queryTrend.direction),
      icon: FileQuestionMark,
      iconWrapClass: "bg-blue-100 text-blue-600",
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
    },
  ];

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-5 p-  min-h-screen"
    >
      {/* ── Header ── */}
      <motion.header
        variants={cardVariant}
        className="flex flex-col gap-3"
      >
        <div>
          <div className="flex items-center gap-3">
            <AgentHeaderArtwork />
            <h1 className="text-[1.5rem] font-bold leading-tight text-gray-900">Agent Dashboard</h1>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">Overview of your travel agency performance.</p>
        </div>
      </motion.header>

      {/* ── Error banner ── */}
      {dashboardError && (
        <motion.div
          variants={cardVariant}
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {dashboardError}
        </motion.div>
      )}

      {/* ── Stat cards ── */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.key}
              variants={cardVariant}
              whileHover={{ y: -2 }}
              className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.9rem] text-gray-500">{card.label}</p>
                  <h2 className="mt-1.5 text-[1.5rem] font-semibold leading-tight text-gray-900">
                    {loadingDashboard ? "..." : card.value}
                  </h2>
                  <p className={`mt-2.5 text-[0.78rem] ${card.helperClassName}`}>
                    {loadingDashboard ? "Loading..." : card.helper}
                  </p>
                </div>
                <div
                  className={`flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-full ${card.iconWrapClass}`}
                >
                  <Icon className="h-[20px] w-[20px]" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.section>

      {/* ── Bottom grid ── */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">

        {/* Recent Activity */}
        <motion.article
          variants={cardVariant}
          className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2"
        >
          <h3 className="mb-2 text-[1.1rem] font-semibold text-gray-900">Recent Activity</h3>

          {loadingDashboard ? (
            <div className="flex min-h-56 items-center justify-center text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading activity...
            </div>
          ) : dashboard.recentActivity.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
              No recent activity yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {dashboard.recentActivity.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-[14px]">
                  <button
                    type="button"
                    onClick={() => item.link && navigate(item.link)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[0.85rem] font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[0.70rem] text-gray-500">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      {item.subtitle} · {getTimeAgo(item.date)}
                    </p>
                  </button>
                  <span
                    className={`inline-flex flex-shrink-0 items-center rounded-full px-4 py-1.5 text-[0.70rem] font-medium ${
                      activityToneClasses[item.tone] || activityToneClasses.info
                    }`}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.article>

        {/* Quick Actions */}
        <motion.article
          variants={cardVariant}
          className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h3 className="mb-5 text-[1.1rem] font-semibold text-gray-900">Quick Actions</h3>

          <div className="space-y-3">
            {[
              { label: "Create New Query", path: "/agent/queries" },
              { label: "Upload Passport", path: "/agent/documents" },
              { label: "Check Wallet History", path: "/agent/finance" },
            ].map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-300 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-[0.70rem] font-medium text-gray-900">{action.label}</span>
                <ArrowUpRight className="h-[15px] w-[15px] flex-shrink-0 text-gray-500" />
              </motion.button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-3">
            <p className="text-[0.9rem] font-semibold text-gray-900">Pro Tip</p>
            <p className="mt-1.5 text-[0.60rem] leading-[1.55] text-gray-500">
              Complete your KYC verification to unlock higher withdrawal limits and premium support.
            </p>
          </div>
        </motion.article>
      </motion.section>
    </motion.section>
  );
};

export default AgentDashboard;
