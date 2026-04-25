import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import API from "../../../utils/Api";
import {
  OpsManagerReassignModal,
} from "../../../modal/OpsManagerReassignModals";

function perfBarColor(p) {
  if (p >= 90) return "bg-emerald-500";
  if (p >= 75) return "bg-amber-500";
  return "bg-rose-500";
}

function StatusBadge({ status }) {
  const map = {
    Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    "At Risk": "border border-rose-200 bg-rose-50 text-rose-600",
    Busy: "border border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[11px] font-medium whitespace-nowrap ${map[status] || map.Active}`}>
      {status}
    </span>
  );
}

function IconSend({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconDoc({ size = 20, color = "#378ADD" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconClock({ size = 20, color = "#1D9E75" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconTrendUp({ size = 20, color = "#BA7517" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconUsers({ size = 16, color = "#378ADD" }) {
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

function IconArrowUp({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconArrowDown({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function MetricCard({ label, value, badge, badgeType, icon, iconBg }) {
  const badgeStyle =
    badgeType === "up"
      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
      : badgeType === "down"
        ? "border border-rose-200 bg-rose-50 text-rose-600"
        : "border border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="flex min-h-[116px] items-start justify-between rounded-[20px] border border-slate-300 bg-white px-5 py-5">
      <div className="flex min-h-[76px] flex-col">
        <p className="mb-1 text-[13px] font-medium text-slate-700">{label}</p>
        <p className="text-[22px] font-semibold leading-tight text-slate-950">{value}</p>
        <div className="mt-3 min-h-[28px]">
          {badge ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeStyle}`}>
              {badgeType === "up" ? <IconArrowUp /> : badgeType === "down" ? <IconArrowDown /> : null}
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}

function OpsCommandArtwork() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-[radial-gradient(circle_at_top,_#e0f2fe,_#bae6fd_55%,_#7dd3fc)] shadow-[0_10px_24px_rgba(14,165,233,0.18)]">
      <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
        <defs>
          <linearGradient id="ops-command-grid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect x="10" y="12" width="28" height="22" rx="6" fill="#eff6ff" stroke="url(#ops-command-grid)" strokeWidth="1.6" />
        <path d="M16 20h6M26 20h6M16 25h16" stroke="#38bdf8" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M18 31l4-4 3 2 5-6" fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <circle cx="15" cy="15" r="2.1" fill="#2563eb" />
        <circle cx="33" cy="15" r="2.1" fill="#14b8a6" />
        <circle cx="24" cy="10.5" r="2.2" fill="#f59e0b" />
        <path d="M17 15h14" stroke="#93c5fd" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M24 12.7v5" stroke="#93c5fd" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
      <div className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-white/25 blur-sm" />
    </div>
  );
}

export default function OperationManagerDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reassignTarget, setReassignTarget] = useState(null);

  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError("");

      const { data } = await API.get("/ops/manager/dashboard");
      setDashboard(data?.data || null);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load operations dashboard";
      setError(message);
      if (silent) {
        toast.error(message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSubmitReport = async () => {
    try {
      setReportSubmitting(true);
      const { data } = await API.post("/ops/manager/report");
      setSubmitted(true);
      toast.success(data?.message || "Team report submitted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit team report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const summary = dashboard?.summary || {};
  const team = dashboard?.team || [];
  const dateLabel = dashboard?.dateLabel || "Loading...";
  const headerTitle = dashboard?.headerTitle || "Ops Command Center";
  const headerSubtitle = dashboard?.headerSubtitle || "Team oversight and performance tracking";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-700">Dashboard</span>
            <span className="mx-2 text-gray-300">|</span>
            {dateLabel}
          </div>
          <div>
            Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-7 w-72 rounded bg-gray-200" />
                <div className="h-4 w-52 rounded bg-gray-200" />
              </div>
              <div className="h-11 w-48 rounded-xl bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
            <div className="h-96 rounded-xl border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white border-b border-gray-200 px-2 py-2  flex justify-between items-center text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">Dashboard</span>
          <span className="mx-2 text-gray-300">|</span>
          {dateLabel}
        </div>
        <div>
          Logged in as : <span className="font-medium text-blue-800">{user?.name || "Operations Manager"}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-1 pt-6.5">
        <div className="flex justify-between items-start mb-7">
          <div>
            <div className="flex items-center gap-3">
              <OpsCommandArtwork />
              <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">{headerSubtitle}</p>
          </div>
          <button
            onClick={handleSubmitReport}
            disabled={reportSubmitting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              submitted
                ? "bg-green-600 text-white cursor-default"
                : "bg-gray-900 text-white hover:bg-gray-700"
            } ${reportSubmitting ? "opacity-70 cursor-wait" : ""}`}
          >
            <IconSend size={14} />
            {reportSubmitting ? "Submitting..." : submitted ? "Report Submitted!" : "Submit Team Report to Admin"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Total Team Queries"
            value={summary.totalTeamQueries ?? 0}
            iconBg="bg-blue-50"
            icon={<IconDoc />}
          />
          <MetricCard
            label="Avg. Time to Quote"
            value={summary.avgTimeToQuote || "0 hrs"}
            badge={summary.avgTimeToQuoteBadge?.value}
            badgeType={summary.avgTimeToQuoteBadge?.trend}
            iconBg="bg-emerald-50"
            icon={<IconClock />}
          />
          <MetricCard
            label="Conversion Rate"
            value={`${summary.conversionRate ?? 0}%`}
            badge={summary.conversionRateBadge?.value}
            badgeType={summary.conversionRateBadge?.trend}
            iconBg="bg-amber-50"
            icon={<IconTrendUp />}
          />
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-300 px-5 py-5">
            <div className="flex items-center gap-2">
              <IconUsers />
              <h2 className="text-[15px] font-semibold text-slate-900">Team Workload</h2>
            </div>
            <p className="mt-1 text-[13px] text-slate-600">Live executive activity and performance overview</p>
          </div>

          <div className="thin-scrollbar overflow-x-auto">
            <table className="min-w-[980px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "210px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "190px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "170px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50/70">
                  {["Exec Name", "Active Queries", "Overdue Quotes", "Performance %", "Status", "Action"].map((header) => (
                    <th key={header} className="px-5 py-3.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#35507a] whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                      No operations executives are mapped to this manager yet.
                    </td>
                  </tr>
                ) : (
                  team.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-300/90 transition-colors hover:bg-slate-50/40"
                    >
                      <td className="px-5 py-4 align-middle flex items-center justify-center ">
                        <div className="flex items-center gap-3">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.name}
                              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-blue-100"
                            />
                          ) : (
                            <div className="flex h-6 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 ring-1 ring-blue-100">
                              {member.initials}
                            </div>
                          )}
                          <div className="min-w-0 ">
                            <p className="truncate text-[14px] font-medium text-slate-900">{member.name}</p>
                            <p className="truncate text-[12px] text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2 text-[14px] font-medium tabular-nums text-slate-900">
                        <span className="flex items-center justify-center">{member.activeQueries}</span>
                      </td>

                      <td className="px-4 py-1 ">
                        <span className={`text-[14px] flex items-center justify-center font-medium tabular-nums ${member.overdueQuotes === 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {member.overdueQuotes}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                          <div className="h-1.5 w-20 overflow-hidden  rounded-full bg-slate-200">
                            <div className={`h-full rounded-full ${perfBarColor(member.performance)}`} style={{ width: `${member.performance}%` }} />
                          </div>
                          <span className="text-[13px]  tabular-nums text-slate-700">{member.performance}%</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle flex items-center justify-center">
                        <StatusBadge status={member.status} />
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setReassignTarget(member);
                          }}
                          disabled={!member.canReassign || team.length < 2}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-[12px] font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 cursor-pointer"
                        >
                          <IconReassign />
                          Re-assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {reassignTarget && (
        <OpsManagerReassignModal
          exec={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onSuccess={() => loadDashboard({ silent: true })}
        />
      )}

    </div>
  );
}
