import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import API from "../../utils/Api";

const formatHeaderDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatTimeAgo = (value) => {
  if (!value) return "Just now";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";

  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

const defaultDashboard = {
  dateLabel: formatHeaderDate(),
  summary: {
    pendingQueries: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
    activeBookings: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
    vouchersGenerated: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
    pendingActions: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
  },
  recentActivity: [],
  performance: {
    queriesHandled: {
      value: "0%",
      width: "0%",
      color: "bg-blue-600",
    },
    avgResponseTime: {
      value: "0h",
      width: "0%",
      color: "bg-green-600",
    },
    vouchersPerDay: {
      value: "0",
      width: "0%",
      color: "bg-purple-600",
    },
  },
};

const getTrendClass = (tone, invert = false) => {
  if (invert) {
    return tone === "negative" ? "text-green-600" : "text-red-500";
  }

  return tone === "negative" ? "text-red-500" : "text-green-600";
};

function DmcHeaderArtwork() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-[radial-gradient(circle_at_top,_#dcfce7,_#bbf7d0_55%,_#6ee7b7)] shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
      <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
        <defs>
          <linearGradient id="dmc-dashboard-mark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect x="11" y="14" width="26" height="19" rx="6" fill="#f0fdf4" stroke="url(#dmc-dashboard-mark)" strokeWidth="1.6" />
        <path d="M16 22h16M16 27h10" stroke="#34d399" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M18 35l6-5 6 5" fill="none" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        <path d="M24 11v6" stroke="#f59e0b" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="24" cy="9.5" r="2.2" fill="#f59e0b" />
        <circle cx="16" cy="17" r="1.8" fill="#10b981" />
        <circle cx="32" cy="17" r="1.8" fill="#60a5fa" />
      </svg>
      <div className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-white/25 blur-sm" />
    </div>
  );
}

export default function DMCDashboard() {
  const [dashboard, setDashboard] = useState(defaultDashboard);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const { data } = await API.get("/dmc/dashboard");
        if (isMounted) {
          setDashboard(data?.data || defaultDashboard);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load DMC dashboard",
        );
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = dashboard?.summary || defaultDashboard.summary;
  const performance = dashboard?.performance || defaultDashboard.performance;
  const recentActivity = useMemo(() => {
    if (Array.isArray(dashboard?.recentActivity) && dashboard.recentActivity.length) {
      return dashboard.recentActivity;
    }

    return [
      {
        title: "No Activity Yet",
        badge: "Idle",
        color: "bg-gray-100 text-gray-500",
        company: "Your DMC activity will appear here",
        timestamp: null,
      },
    ];
  }, [dashboard]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}

      <div className="mb-5">
        <div>
          <div className="flex items-center gap-3">
            <DmcHeaderArtwork />
            <h1 className="text-xl font-semibold">Dmc Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500">
            {dashboard?.dateLabel || defaultDashboard.dateLabel}
          </p>
        </div>
      </div>

      {/*=================== Access Level Card ========================================== */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Shield size={20} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Your Access Level</h2>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-xl border">
                DMC Partner
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              External partner with restricted access
            </p>

            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-2">PERMISSIONS</p>

              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Upload contracted rates (bulk upload)
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Enter confirmation numbers
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Update fulfillment status
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  View assigned bookings only
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/*=================================== Stats Cards ============================================== */}

      <div className="grid grid-cols-4 gap-2 mb-6">
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Pending Queries</p>
            <h3 className="text-xl font-semibold">
              {summary.pendingQueries?.value ?? 0}
            </h3>
            <p
              className={`text-xs ${getTrendClass(summary.pendingQueries?.tone, true)}`}
            >
              {summary.pendingQueries?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-purple-100 p-2 rounded-lg">
            <Clock className="text-purple-600" />
          </div>
        </div>

        {/* Card 2 */}

        <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Active Bookings</p>
            <h3 className="text-xl font-semibold">
              {summary.activeBookings?.value ?? 0}
            </h3>
            <p className={`text-xs ${getTrendClass(summary.activeBookings?.tone)}`}>
              {summary.activeBookings?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-blue-100 p-2 rounded-lg">
            <CheckCircle className="text-blue-600" />
          </div>
        </div>

        {/* Card 3 */}

        <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Vouchers Generated</p>
            <h3 className="text-xl font-semibold">
              {summary.vouchersGenerated?.value ?? 0}
            </h3>
            <p
              className={`text-xs ${getTrendClass(summary.vouchersGenerated?.tone)}`}
            >
              {summary.vouchersGenerated?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-green-100 p-2 rounded-lg">
            <FileText className="text-green-600" />
          </div>
        </div>

        {/* Card 4 */}

        <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Pending Actions</p>
            <h3 className="text-xl font-semibold">
              {summary.pendingActions?.value ?? 0}
            </h3>
            <p
              className={`text-xs ${getTrendClass(summary.pendingActions?.tone, true)}`}
            >
              {summary.pendingActions?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-orange-100 p-2 rounded-lg">
            <AlertCircle className="text-orange-600" />
          </div>
        </div>
      </div>

      {/*================================ Bottom Section =========================== */}

      <div className="grid grid-cols-3 gap-3">
        {/*----------------- Recent Activity------------------ */}

        <div className="col-span-2 bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          {recentActivity.map((item, index) => (
            <Activity
              key={`${item.title}-${item.timestamp || index}`}
              title={item.title}
              badge={item.badge}
              color={item.color}
              company={item.company}
              time={formatTimeAgo(item.timestamp)}
            />
          ))}
        </div>

        {/*=================================== Team Performance ================================== */}

        <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Team Performance</h2>

          <Progress
            title="Queries Handled"
            value={performance.queriesHandled?.value || "0%"}
            width={performance.queriesHandled?.width || "0%"}
            color={performance.queriesHandled?.color || "bg-blue-600"}
          />

          <Progress
            title="Avg. Response Time"
            value={performance.avgResponseTime?.value || "0h"}
            width={performance.avgResponseTime?.width || "0%"}
            color={performance.avgResponseTime?.color || "bg-green-600"}
          />

          <Progress
            title="Vouchers/Day"
            value={performance.vouchersPerDay?.value || "0"}
            width={performance.vouchersPerDay?.width || "0%"}
            color={performance.vouchersPerDay?.color || "bg-purple-600"}
          />
        </div>
      </div>
    </div>
  );
}

function Activity({ title, badge, color, company, time }) {
  return (
    <div className="flex justify-between items-center border border-gray-200 shadow-xs rounded-xl p-2.5 mb-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{title}</p>
          <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
            {badge}
          </span>
        </div>
        <p className="text-[12px] text-gray-500">{company}</p>
      </div>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
}

function Progress({ title, value, width, color }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-1">
        <span>{title}</span>
        <span className="text-gray-500">{value}</span>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div className={`${color} h-2 rounded-full`} style={{ width }}></div>
      </div>
    </div>
  );
}
