import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import API from "../../../utils/Api";
import AddFinanceExecutiveModal from "../../../modal/AddFinanceExecutiveModal";

function IconUserPlus({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconUsers({ size = 17, color = "#f59e0b" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTrendUp({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconAlertTriangle({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const statusStyles = {
  Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border border-rose-200 bg-rose-50 text-rose-600",
  Busy: "border border-amber-200 bg-amber-50 text-amber-700",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[11px] font-medium whitespace-nowrap ${statusStyles[status] || statusStyles.Active}`}>
      {status}
    </span>
  );
}

function accuracyBarColor(value) {
  if (value >= 90) return "bg-emerald-500";
  if (value >= 80) return "bg-amber-500";
  return "bg-rose-500";
}

function AnimatedBar({ width, className }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setAnimatedWidth(width);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [width]);

  return (
    <div
      className={className}
      style={{
        width: `${animatedWidth}%`,
        transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    />
  );
}

function ResolutionBreakdown({ settled, escalated }) {
  const total = settled + escalated || 1;
  const settledWidth = (settled / total) * 100;
  const escalatedWidth = (escalated / total) * 100;

  return (
    <div className="w-[170px]">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {settled}
        </span>
        <span className="text-[10px] font-medium text-slate-400">settled</span>

        <span className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24">
            <path d="M12 4.5l8 14H4l8-14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 9v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="15.8" r="0.9" fill="currentColor" />
          </svg>
          {escalated}
        </span>
        <span className="text-[10px] font-medium text-slate-400">escalated</span>
      </div>

      <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <AnimatedBar width={settledWidth} className="h-full bg-emerald-500" />
          <AnimatedBar width={escalatedWidth} className="h-full bg-orange-400" />
        </div>
      </div>
    </div>
  );
}

function AnimatedAccuracyBar({ accuracy }) {
  return (
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
      <AnimatedBar
        width={accuracy}
        className={`h-full rounded-full ${accuracyBarColor(accuracy)}`}
      />
    </div>
  );
}

export default function MyFinanceTeam() {
  const user = useSelector((state) => state.auth.user);
  const [team, setTeam] = useState([]);
  const [summary, setSummary] = useState({});
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const loadTeam = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError("");

      const { data } = await API.get("/finance-manager/team");
      setTeam(data?.data?.team || []);
      setSummary(data?.data?.summary || {});
      setDateLabel(data?.data?.dateLabel || "");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load finance team";
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
    loadTeam();
  }, []);

  const handleAdd = async (payload) => {
    try {
      setAddSubmitting(true);
      const { data } = await API.post("/finance-manager/team", payload);
      await loadTeam({ silent: true });
      return data;
    } finally {
      setAddSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-0 w-full overflow-x-hidden bg-slate-50 font-sans">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white py-3 text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-700">My Team</span>
            <span className="mx-2 text-gray-300">|</span>
            Loading...
          </div>
          <div>Logged in as <span className="font-medium text-gray-700">{user?.name || "Finance Manager"}</span></div>
        </div>
        <div className="max-w-6xl py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-7 w-40 rounded bg-gray-200" />
                <div className="h-4 w-60 rounded bg-gray-200" />
              </div>
              <div className="h-10 w-44 rounded-lg bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
            <div className="h-[420px] rounded-xl border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  const totalExecutives = summary?.totalExecutives ?? team.length;
  const atRiskExecutives = summary?.atRiskExecutives ?? team.filter((member) => member.status === "At Risk").length;
  const avgTeamAccuracy = summary?.avgTeamAccuracy ?? 0;
  const addedThisWeek = summary?.addedThisWeek ?? 0;

  return (
    <div className="min-h-0 w-full overflow-x-hidden bg-slate-50 font-sans">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white py-1.5 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">My Team</span>
          <span className="mx-2 text-gray-300">|</span>
          {dateLabel || "Finance Team"}
        </div>
        <div>Logged in as <span className="font-medium text-gray-700">{user?.name || "Finance Manager"}</span></div>
      </div>

      <div className="max-w-6xl py-8">
        <div className="mb-7 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-medium text-gray-900">My Finance Team</h1>
            <p className="mt-1 text-sm text-gray-500">Finance executive roster and performance management</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <IconUserPlus />
            Add Finance Executive
          </button>
        </div>

        {error ? (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadTeam()}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs text-slate-400">Total Finance Executives</p>
            <p className="text-3xl font-bold text-slate-900">{totalExecutives}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <IconTrendUp />
              {addedThisWeek} added this week
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs text-slate-400">At Risk Executives</p>
            <p className="text-3xl font-bold text-red-500">{atRiskExecutives}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <IconAlertTriangle />
              Need immediate attention
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs text-slate-400">Avg. Team Accuracy</p>
            <p className="text-3xl font-bold text-slate-900">{avgTeamAccuracy}%</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <IconTrendUp />
              Based on reviewed payment verifications
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
            <IconUsers />
            <span className="text-[15px] font-semibold text-slate-900">Finance Executive Directory</span>
          </div>

          <div className="custom-scroll overflow-x-auto">
            <table className="min-w-[1080px] w-full table-fixed text-xs">
              <colgroup>
                <col style={{ width: "220px" }} />
                <col style={{ width: "250px" }} />
                <col style={{ width: "155px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "120px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">Exec Name</th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">Email</th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                    <span className="block">Verifications</span>
                    <span className="mt-0.5 block">Pending</span>
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                    Resolution Breakdown
                    <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-400">Settled vs. Escalated</span>
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">Accuracy %</th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                      No finance executives are mapped to this manager yet.
                    </td>
                  </tr>
                ) : (
                  team.map((member) => (
                    <tr key={member.id} className="border-b border-slate-200/80 transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${member.avatarColor}`}>
                            {member.initials}
                          </div>
                          <span className="whitespace-nowrap text-sm font-medium text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle text-sm text-slate-700">{member.email}</td>
                      <td className="px-4 py-4 align-middle">
                        <span className={`inline-flex min-w-[20px] text-sm font-semibold tabular-nums ${member.pending > 10 ? "text-red-500" : member.pending > 0 ? "text-amber-500" : "text-emerald-600"}`}>
                          {member.pending}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <ResolutionBreakdown settled={member.settled} escalated={member.escalated} />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <AnimatedAccuracyBar accuracy={member.accuracy} />
                          <span className="text-sm font-semibold text-slate-700">{member.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <StatusBadge status={member.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showAdd ? (
          <AddFinanceExecutiveModal
            loading={addSubmitting}
            managerName={user?.name || "Finance Manager"}
            onClose={() => setShowAdd(false)}
            onAdd={handleAdd}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
