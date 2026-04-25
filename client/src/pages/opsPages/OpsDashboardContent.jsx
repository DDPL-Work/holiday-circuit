import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Users,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import API from "../../utils/Api.js";

const emptyDashboard = {
  headerTitle: "OPS-DASHBOARD",
  stats: {
    pendingQueries: { value: 0, text: "No change from last week", trend: "neutral" },
    activeBookings: { value: 0, text: "No change from last week", trend: "neutral" },
    vouchersGenerated: { value: 0, text: "No change from last week", trend: "neutral" },
    pendingActions: { value: 0, text: "No change from last week", trend: "neutral" },
  },
  recentActivity: [],
  performance: {
    queriesHandled: { label: "Queries Handled", value: "0%", progress: 0 },
    avgResponseTime: { label: "Avg. Response Time", value: "0h", progress: 0 },
    vouchersPerDay: { label: "Vouchers / Day", value: "0", progress: 0 },
  },
};

const tagColorMap = {
  new: "bg-purple-100 text-purple-600",
  accepted: "bg-blue-100 text-blue-600",
  draft: "bg-amber-100 text-amber-600",
  quoted: "bg-emerald-100 text-emerald-600",
  voucher: "bg-green-100 text-green-600",
  sent: "bg-cyan-100 text-cyan-600",
  verified: "bg-lime-100 text-lime-600",
  rejected: "bg-red-100 text-red-600",
  escalated: "bg-orange-100 text-orange-600",
  invoice: "bg-indigo-100 text-indigo-600",
  updated: "bg-slate-100 text-slate-600",
};

const getTimeAgo = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffInMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

const getTrendColorClass = (trend, danger = false) => {
  if (danger) {
    return trend === "down" ? "text-green-500" : trend === "up" ? "text-red-500" : "text-red-500";
  }

  return trend === "down" ? "text-red-500" : "text-green-500";
};

export default function OpsDashboardContent() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/ops/dashboard");
        setDashboard(data?.data || emptyDashboard);
      } catch (fetchError) {
        console.error("Failed to load ops dashboard", fetchError);
        setDashboard(emptyDashboard);
        setError(fetchError?.response?.data?.message || "Unable to load ops dashboard right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-64px)] bg-[#F5F7FB] sm:p-1"
    >
      <div className="mb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-bold">{dashboard.headerTitle || "OPS-DASHBOARD"}</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md transition"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Your Access Level</h2>
              <p className="text-sm text-gray-500">
                Access to daily operational tasks and booking management
              </p>
            </div>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-600">
            Operations Team
          </span>
        </div>

        <p className="mb-4 text-sm font-medium text-gray-500">PERMISSIONS</p>

        <motion.ul
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.12 },
            },
          }}
          className="mb-4 space-y-2 text-sm text-gray-700"
        >
          {[
            "View booking management hub",
            "Accept and process orders",
            "Generate and manage vouchers",
            "Update booking statuses",
            "View operational reports",
          ].map((item, index) => (
            <motion.li
              key={index}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.4, ease: "easeOut" },
                },
              }}
              whileHover={{ x: 4 }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              {item}
            </motion.li>
          ))}
        </motion.ul>

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-600">
          <AlertCircle className="h-4 w-4" />
          Some advanced permissions are restricted. Contact admin for access.
        </div>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.18 },
          },
        }}
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Pending Queries"
          value={loading ? "..." : dashboard.stats.pendingQueries.value}
          change={loading ? "Loading..." : dashboard.stats.pendingQueries.text}
          trend={dashboard.stats.pendingQueries.trend}
          icon={<Clock className="h-5 w-5 text-purple-500 " />}
        />

        <StatCard
          title="Active Bookings"
          value={loading ? "..." : dashboard.stats.activeBookings.value}
          change={loading ? "Loading..." : dashboard.stats.activeBookings.text}
          trend={dashboard.stats.activeBookings.trend}
          icon={<CheckCircle className="h-5 w-5 text-blue-500" />}
        />

        <StatCard
          title="Vouchers Generated"
          value={loading ? "..." : dashboard.stats.vouchersGenerated.value}
          change={loading ? "Loading..." : dashboard.stats.vouchersGenerated.text}
          trend={dashboard.stats.vouchersGenerated.trend}
          icon={<FileText className="h-5 w-5 text-green-500 " />}
        />

        <StatCard
          title="Pending Actions"
          value={loading ? "..." : dashboard.stats.pendingActions.value}
          change={loading ? "Loading..." : dashboard.stats.pendingActions.text}
          trend={dashboard.stats.pendingActions.trend}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          danger
        />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentActivity items={dashboard.recentActivity} loading={loading} />
        <TeamPerformance performance={dashboard.performance} loading={loading} />
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, change, trend, icon, danger }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.9, rotate: -2 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: 0,
          transition: { type: "spring", stiffness: 120, damping: 12 },
        },
      }}
      whileHover={{ y: -1, scale: 1.015 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span>{icon}</span>
      </div>

      <p className="text-xl font-bold text-[#0F172A]">{value}</p>

      <p className={`mt-1 text-xs ${getTrendColorClass(trend, danger)}`}>{change}</p>
    </motion.div>
  );
}

function RecentActivity({ items, loading }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md sm:p-6 xl:col-span-2">
      <h3 className="mb-4 font-bold text-[#0F172A]">Recent Activity</h3>

      {loading ? (
        <div className="space-y-3 text-sm">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-gray-200 px-4 py-3 text-xs text-gray-400"
            >
              Loading activity...
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400">
          No recent activity yet.
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.15 },
            },
          }}
          className="space-y-3 text-sm"
        >
          {items.map((item) => (
            <ActivityItem key={item.id} {...item} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ActivityItem({ title, tag, variant, company, destination, occurredAt }) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          x: 120,
          scale: 0.95,
          filter: "blur(4px)",
        },
        show: {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            type: "spring",
            stiffness: 120,
            damping: 14,
          },
        },
      }}
      whileHover={{ x: 6, scale: 1.02 }}
      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50"
    >
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium text-[#0F172A]">{title}</span>

          <span className={`rounded-full px-2 py-0.5 text-xs ${tagColorMap[variant] || tagColorMap.updated}`}>
            {tag}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-4 w-4" />
          <span>{company}</span>
          <span className="mx-1">→</span>
          <span>{destination}</span>
        </div>
      </div>

      <span className="whitespace-nowrap text-xs text-gray-400">{getTimeAgo(occurredAt)}</span>
    </motion.div>
  );
}

function TeamPerformance({ performance, loading }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="mb-4 font-bold text-[#0F172A]">Team Performance</h3>

      <div className="space-y-4 text-sm">
        <Progress
          label={performance.queriesHandled.label}
          value={loading ? "..." : performance.queriesHandled.value}
          progress={loading ? 0 : performance.queriesHandled.progress}
          color="bg-blue-500"
        />

        <Progress
          label={performance.avgResponseTime.label}
          value={loading ? "..." : performance.avgResponseTime.value}
          progress={loading ? 0 : performance.avgResponseTime.progress}
          color="bg-green-500"
        />

        <Progress
          label={performance.vouchersPerDay.label}
          value={loading ? "..." : performance.vouchersPerDay.value}
          progress={loading ? 0 : performance.vouchersPerDay.progress}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}

function Progress({ label, value, progress, color }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-gray-700">{label}</span>

        <span className="font-medium text-gray-900">{value}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, Number(progress || 0)))}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-2 rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
