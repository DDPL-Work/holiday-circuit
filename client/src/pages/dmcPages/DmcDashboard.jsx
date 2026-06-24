import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import API from "../../utils/Api";

const formatHeaderDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

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
  uploadTrendData: [],
  trends: {
    records: {
      change: 0,
      direction: "flat",
    },
  },
};

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
      <div className="bg-[#0f172a] text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs shadow-xl min-w-[160px] backdrop-blur-md bg-opacity-95">
        <p className="font-semibold text-slate-400">{label} {dataPoint.year}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span className="text-slate-350">Total Records</span>
            </div>
            <span className="font-bold text-[#10b981]">{dataPoint.records}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              <span className="text-slate-350">Total Uploads</span>
            </div>
            <span className="font-bold text-[#3b82f6]">{dataPoint.uploads}</span>
          </div>
          
          <div className="border-t border-slate-800 my-1 pt-1.5 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Breakdown</p>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Hotels</span>
              <span className="font-medium text-slate-200">{dataPoint.hotels ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Transports</span>
              <span className="font-medium text-slate-200">{dataPoint.transports ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Activities</span>
              <span className="font-medium text-slate-200">{dataPoint.activities ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Sightseeings</span>
              <span className="font-medium text-slate-200">{dataPoint.sightseeings ?? 0}</span>
            </div>
            {dataPoint.packages > 0 && (
              <div className="flex items-center justify-between gap-4 text-[11px]">
                <span className="text-slate-400">Packages</span>
                <span className="font-medium text-slate-200">{dataPoint.packages}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
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
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoadingDashboard(true);
        const { data } = await API.get("/dmc/dashboard");
        if (isMounted) {
          setDashboard(data?.data || defaultDashboard);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load DMC dashboard",
        );
      } finally {
        if (isMounted) {
          setLoadingDashboard(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = dashboard?.summary || defaultDashboard.summary;
  const performance = dashboard?.performance || defaultDashboard.performance;
  const [timeRange, setTimeRange] = useState(6);

  const filteredChartData = useMemo(() => {
    if (!dashboard?.uploadTrendData || dashboard.uploadTrendData.length === 0) return [];
    return dashboard.uploadTrendData.slice(-timeRange);
  }, [dashboard?.uploadTrendData, timeRange]);

  const statsSummary = useMemo(() => {
    if (!dashboard?.uploadTrendData || dashboard.uploadTrendData.length === 0) {
      return { totalRecords: 0, totalUploads: 0, changePercent: 0, isUp: true };
    }

    const data = dashboard.uploadTrendData;
    const len = data.length;

    if (timeRange === 6 && len >= 12) {
      const currentPeriod = data.slice(-6);
      const previousPeriod = data.slice(-12, -6);

      const currentRecords = currentPeriod.reduce((sum, item) => sum + item.records, 0);
      const previousRecords = previousPeriod.reduce((sum, item) => sum + item.records, 0);

      const diff = currentRecords - previousRecords;
      const changePercent = previousRecords > 0 ? ((diff / previousRecords) * 100).toFixed(1) : (diff > 0 ? "100.0" : "0.0");
      return {
        totalRecords: currentRecords,
        totalUploads: currentPeriod.reduce((sum, item) => sum + item.uploads, 0),
        changePercent: Math.abs(parseFloat(changePercent)),
        isUp: diff >= 0,
      };
    } else if (timeRange === 3 && len >= 6) {
      const currentPeriod = data.slice(-3);
      const previousPeriod = data.slice(-6, -3);

      const currentRecords = currentPeriod.reduce((sum, item) => sum + item.records, 0);
      const previousRecords = previousPeriod.reduce((sum, item) => sum + item.records, 0);

      const diff = currentRecords - previousRecords;
      const changePercent = previousRecords > 0 ? ((diff / previousRecords) * 100).toFixed(1) : (diff > 0 ? "100.0" : "0.0");
      return {
        totalRecords: currentRecords,
        totalUploads: currentPeriod.reduce((sum, item) => sum + item.uploads, 0),
        changePercent: Math.abs(parseFloat(changePercent)),
        isUp: diff >= 0,
      };
    } else {
      const currentRecords = data.reduce((sum, item) => sum + item.records, 0);
      const currentUploads = data.reduce((sum, item) => sum + item.uploads, 0);
      const recordsChange = Number(dashboard?.trends?.records?.change || 0);
      const direction = dashboard?.trends?.records?.direction || "flat";
      return {
        totalRecords: currentRecords,
        totalUploads: currentUploads,
        changePercent: recordsChange,
        isUp: direction === "up",
      };
    }
  }, [dashboard?.uploadTrendData, dashboard?.trends?.records, timeRange]);
  const recentActivity = useMemo(() => {
    if (Array.isArray(dashboard?.recentActivity) && dashboard.recentActivity.length) {
      return [...dashboard.recentActivity].sort(
        (left, right) =>
          new Date(right?.timestamp || 0).getTime() - new Date(left?.timestamp || 0).getTime(),
      );
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
    <motion.div
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="bg-gray-50 min-h-screen space-y-6 p-0"
    >
      {/* Header */}
      <motion.div variants={cardVariant}>
        <div>
          <div className="flex items-center gap-3">
            <DmcHeaderArtwork />
            <h1 className="text-xl font-bold leading-tight text-gray-900">DMC Dashboard</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {dashboard?.dateLabel || defaultDashboard.dateLabel}
          </p>
        </div>
      </motion.div>

      {/*=================== Access Level Card ========================================== */}
      <motion.div variants={cardVariant} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Shield size={20} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-950">Your Access Level</h2>

              <span className="text-xs bg-green-150 text-green-700 px-2 py-0.5 rounded-xl border border-green-100">
                DMC Partner
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              External partner with restricted access
            </p>

            <div className="mt-4">
              <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider">PERMISSIONS</p>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  Upload contracted rates (bulk upload)
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  Enter confirmation numbers
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  Update fulfillment status
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  View assigned bookings only
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/*=================================== Stats Cards ============================================== */}
      <motion.div variants={cardVariant} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div 
          style={{ background: "linear-gradient(135deg, rgba(243, 232, 255, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #a855f7" }}
          className="border-0 shadow-xs rounded-[18px] py-3.5 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">Pending Queries</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">
              {summary.pendingQueries?.value ?? 0}
            </h3>
            <p
              className={`text-[11px] mt-1.5 font-semibold whitespace-nowrap ${getTrendClass(summary.pendingQueries?.tone, true)}`}
            >
              {summary.pendingQueries?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-purple-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
            <Clock className="text-purple-600 h-5 w-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div 
          style={{ background: "linear-gradient(135deg, rgba(219, 234, 254, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #3b82f6" }}
          className="border-0 shadow-xs rounded-[18px] py-3.5 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">Active Bookings</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">
              {summary.activeBookings?.value ?? 0}
            </h3>
            <p className={`text-[11px] mt-1.5 font-semibold whitespace-nowrap ${getTrendClass(summary.activeBookings?.tone)}`}>
              {summary.activeBookings?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-blue-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
            <CheckCircle className="text-blue-600 h-5 w-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div 
          style={{ background: "linear-gradient(135deg, rgba(220, 252, 231, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #10b981" }}
          className="border-0 shadow-xs rounded-[18px] py-3.5 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">Vouchers Generated</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">
              {summary.vouchersGenerated?.value ?? 0}
            </h3>
            <p
              className={`text-[11px] mt-1.5 font-semibold whitespace-nowrap ${getTrendClass(summary.vouchersGenerated?.tone)}`}
            >
              {summary.vouchersGenerated?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-green-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
            <FileText className="text-green-600 h-5 w-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div 
          style={{ background: "linear-gradient(135deg, rgba(254, 243, 199, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #f59e0b" }}
          className="border-0 shadow-xs rounded-[18px] py-3.5 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">Pending Actions</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">
              {summary.pendingActions?.value ?? 0}
            </h3>
            <p
              className={`text-[11px] mt-1.5 font-semibold whitespace-nowrap ${getTrendClass(summary.pendingActions?.tone, true)}`}
            >
              {summary.pendingActions?.text || "0% from last week"}
            </p>
          </div>

          <div className="bg-orange-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
            <AlertCircle className="text-orange-600 h-5 w-5" />
          </div>
        </div>
      </motion.div>

      {/*================================ Bottom Section =========================== */}
      <motion.div variants={cardVariant} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/*----------------- Bulk Upload Performance Overview Chart ------------------ */}
        <div
          style={{ background: "linear-gradient(135deg, #ffffff 0%, rgba(240, 253, 244, 0.55) 50%, rgba(236, 253, 245, 0.7) 100%)" }}
          className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-[18px] border border-gray-200 pt-5 pb-4 px-0 shadow-xs flex flex-col justify-between overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 px-5">
            <div>
              <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">
                Upload Performance Overview
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {loadingDashboard ? "..." : statsSummary.totalRecords}
                </span>
                {!loadingDashboard && statsSummary.changePercent > 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[0.70rem] font-semibold px-2 py-0.5 rounded-full ${
                    statsSummary.isUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                  }`}>
                    {statsSummary.isUp ? '▲' : '▼'} {statsSummary.changePercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Total Records Uploaded
              </p>
              <p className="text-[0.72rem] text-gray-400 mt-0.5">
                {timeRange === 12 
                  ? "Bulk uploaded files and records over the past year" 
                  : `vs previous ${timeRange} months`}
              </p>
            </div>

            {/* Controls & Legend */}
            <div className="flex flex-wrap items-center gap-4 self-end md:self-start">
              <div className="flex items-center gap-3 text-[0.70rem] font-bold mr-1 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span className="text-gray-500">Records</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-gray-500">Uploads</span>
                </div>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer outline-none transition hover:border-gray-300 focus:ring-2 focus:ring-emerald-150"
              >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            </div>
          </div>

          <div className="relative h-48 w-full flex-1 min-h-[195px] px-1">
            {loadingDashboard ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-[1px] rounded-xl text-gray-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-500" />
                Loading chart data...
              </div>
            ) : filteredChartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                No upload activity data available to plot.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredChartData}
                  margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.6)"
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
                    dataKey="records"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRecords)"
                    activeDot={{ r: 4, strokeWidth: 1.5, stroke: "#ffffff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUploads)"
                    activeDot={{ r: 4, strokeWidth: 1.5, stroke: "#ffffff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>



        {/*=================================== Team Performance ================================== */}

        
        {/* <div className="bg-white border border-gray-200 shadow-xs rounded-[18px] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-[0.95rem] font-bold text-gray-900 mb-6">Team Performance</h2>

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
        </div> */}


      </motion.div>
    </motion.div>
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
