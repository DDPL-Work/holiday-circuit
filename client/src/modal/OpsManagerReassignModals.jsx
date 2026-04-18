import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import API from "../utils/Api";

const memberStatusStyles = {
  Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border border-rose-200 bg-rose-50 text-rose-600",
  Busy: "border border-amber-200 bg-amber-50 text-amber-700",
};

const queryCategoryStyles = {
  new: "border border-sky-200 bg-sky-50 text-sky-700",
  requote_pending: "border border-amber-200 bg-amber-50 text-amber-700",
  at_risk: "border border-rose-200 bg-rose-50 text-rose-600",
  active: "border border-slate-200 bg-slate-50 text-slate-600",
};

const queryStatusStyles = {
  New: "text-sky-700",
  Quoted: "text-emerald-700",
  Overdue: "text-rose-600",
  "In Progress": "text-slate-600",
};

const clampScore = (value) => Math.max(0, Math.min(100, Number(value || 0)));

function IconClose({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MemberStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[11px] font-medium whitespace-nowrap ${memberStatusStyles[status] || memberStatusStyles.Active}`}>
      {status}
    </span>
  );
}

function TinyStat({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function QueryCategoryBadge({ categoryKey, label }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium ${queryCategoryStyles[categoryKey] || queryCategoryStyles.active}`}>
      {label}
    </span>
  );
}




const graphStars = [
  { top: "10%", left: "8%", size: 2, opacity: 0.45 },
  { top: "18%", left: "18%", size: 3, opacity: 0.7 },
  { top: "12%", left: "34%", size: 2, opacity: 0.35 },
  { top: "23%", left: "48%", size: 3, opacity: 0.65 },
  { top: "9%", left: "66%", size: 2, opacity: 0.55 },
  { top: "17%", left: "82%", size: 3, opacity: 0.75 },
  { top: "32%", left: "12%", size: 2, opacity: 0.4 },
  { top: "38%", left: "28%", size: 2, opacity: 0.55 },
  { top: "29%", left: "58%", size: 3, opacity: 0.55 },
  { top: "36%", left: "74%", size: 2, opacity: 0.35 },
  { top: "47%", left: "9%", size: 3, opacity: 0.4 },
  { top: "52%", left: "24%", size: 2, opacity: 0.6 },
  { top: "44%", left: "43%", size: 2, opacity: 0.35 },
  { top: "49%", left: "64%", size: 3, opacity: 0.6 },
  { top: "41%", left: "88%", size: 2, opacity: 0.5 },
];

const clampMetric = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(value || 0)));

const formatSignedPoints = (value) => {
  const points = Number(value || 0);

  if (points > 0) return `+${points} pts`;
  if (points < 0) return `-${Math.abs(points)} pts`;
  return "0 pts";
};

const buildLinePath = (points = []) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

const getShortQueryLabel = (queryId = "", fallback = "") => {
  const label = String(queryId || "").trim();

  if (!label) {
    return fallback;
  }

  return label.length > 6 ? label.slice(-6) : label;
};

function PerformanceImpactBadge({ direction, value }) {
  const classes =
    direction === "up"
      ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
      : direction === "down"
        ? "border-rose-300/50 bg-rose-400/15 text-rose-100"
        : "border-white/20 bg-white/10 text-white/80";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${classes}`}>
      {formatSignedPoints(value)}
    </span>
  );
}

function ReassignmentPerformanceGraph({ memberName, items = [], summary = {} }) {
  const graphItems = useMemo(
    () =>
      [...items]
        .sort(
          (left, right) =>
            new Date(left.receivedAt || left.movedAt || 0).getTime() -
            new Date(right.receivedAt || right.movedAt || 0).getTime(),
        )
        .slice(-6),
    [items],
  );

  if (!graphItems.length) {
    return null;
  }

  const width = 880;
  const height = 300;
  const padding = { top: 30, right: 44, bottom: 48, left: 26 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxHours = Math.max(24, ...graphItems.map((item) => Number(item.workingHours || 0)));
  const points = graphItems.map((item, index) => {
    const ratio = graphItems.length === 1 ? 0.5 : index / (graphItems.length - 1);
    const x = padding.left + (innerWidth * ratio);
    const score = clampMetric(item.performanceScore);
    const y = padding.top + ((100 - score) / 100) * innerHeight;
    const barHeight = Math.max(16, ((Number(item.workingHours || 0) / maxHours) * (innerHeight - 12)));

    return {
      item,
      x,
      y,
      barHeight,
      barY: padding.top + innerHeight - barHeight,
    };
  });
  const linePath = buildLinePath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`
      : "";
  const milestoneIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
    .filter((value) => value >= 0);
  const netImpactLabel =
    Number(summary?.netImpactPoints || 0) > 0
      ? `+${summary.netImpactPoints} pts recovered`
      : Number(summary?.netImpactPoints || 0) < 0
        ? `-${Math.abs(summary.netImpactPoints)} pts dragged`
        : "Balanced impact";

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.28),_transparent_28%),radial-gradient(circle_at_18%_20%,_rgba(34,211,238,0.18),_transparent_24%),linear-gradient(135deg,_#03111f,_#081a34_45%,_#0d2c59_100%)] px-5 py-5 text-white shadow-[0_30px_80px_rgba(2,8,23,0.45)]">
      {graphStars.map((star, index) => (
        <span
          key={`${star.top}-${star.left}-${index}`}
          className="pointer-events-none absolute rounded-full bg-cyan-100"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            boxShadow: "0 0 12px rgba(186,230,253,0.65)",
          }}
        />
      ))}

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-100/70">Reassignment Performance Trend</p>
          <h4 className="mt-3 text-2xl font-semibold text-white">{memberName || "Executive"} workload recovery</h4>
          <p className="mt-2 max-w-2xl text-sm text-sky-100/78">
            Bars show handling time per reassigned query, while the glowing line tracks the performance score after revision pressure, delay, and recovery.
          </p>
        </div>

        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-sky-50/85 shadow-[0_10px_24px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          {summary?.revisionAffectedCount || 0} revision-led drags
        </div>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-white/5 px-2 py-2 backdrop-blur-sm">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[300px] w-full">
          <defs>
            <linearGradient id="ops-graph-bar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c4f1ff" stopOpacity="0.98" />
              <stop offset="55%" stopColor="#67c7ff" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#2458ff" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id="ops-graph-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="ops-graph-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.01" />
            </linearGradient>
            <filter id="ops-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker id="ops-arrow" markerWidth="10" markerHeight="10" refX="6.5" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7" fill="none" stroke="#f8fafc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          {[0, 1, 2, 3].map((row) => {
            const y = padding.top + ((innerHeight / 3) * row);
            return (
              <line
                key={`grid-${row}`}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(191,219,254,0.18)"
                strokeDasharray="4 10"
              />
            );
          })}

          {areaPath ? (
            <path d={areaPath} fill="url(#ops-graph-area)" />
          ) : null}

          {points.map((point) => (
            <g key={`${point.item.id}-${point.x}`}>
              <rect
                x={point.x - 14}
                y={point.barY}
                width="28"
                height={point.barHeight}
                rx="12"
                fill="url(#ops-graph-bar)"
                opacity="0.9"
              />
              <rect
                x={point.x - 14}
                y={point.barY}
                width="28"
                height="6"
                rx="12"
                fill="rgba(255,255,255,0.78)"
                opacity="0.7"
              />
            </g>
          ))}

          {points.length > 1 ? (
            <path
              d={linePath}
              fill="none"
              stroke="url(#ops-graph-line)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ops-glow)"
              markerEnd="url(#ops-arrow)"
            />
          ) : null}

          {points.map((point, index) => (
            <g key={`${point.item.id}-marker-${index}`}>
              <circle cx={point.x} cy={point.y} r="10" fill="rgba(56,189,248,0.16)" />
              <circle cx={point.x} cy={point.y} r="4.8" fill="#f8fafc" />
            </g>
          ))}

          {milestoneIndexes.map((index) => {
            const point = points[index];

            if (!point) return null;

            return (
              <text
                key={`${point.item.id}-score-label`}
                x={point.x + 10}
                y={point.y - 10}
                fill="#e0f2fe"
                fontSize="12"
                fontWeight="700"
              >
                {point.item.performanceScore}
              </text>
            );
          })}

          {points.map((point, index) => (
            <text
              key={`${point.item.id}-label`}
              x={point.x}
              y={height - 14}
              fill="rgba(224,242,254,0.82)"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {getShortQueryLabel(point.item.queryId, `Q${index + 1}`)}
            </text>
          ))}
        </svg>
      </div>


    </div>
  );
}

function ReassignmentInsightCard({ item }) {
  const impactTone =
    item.performanceDirection === "down"
      ? "rose"
      : item.hasRevisionRequest
        ? "amber"
        : "blue";

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.queryId || "Query"}</p>
          <h5 className="mt-2 text-lg font-semibold text-slate-900">{item.destination}</h5>
          <p className="mt-1 text-sm text-slate-500">{item.amount}</p>
        </div>

        <div className="text-right">
          <PerformanceImpactBadge direction={item.performanceDirection} value={item.performanceImpactPoints} />
          <p className="mt-3 text-3xl font-semibold leading-none text-slate-950">{item.performanceScore}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">query score</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <QueryCategoryBadge categoryKey={item.categoryKey} label={item.categoryLabel} />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          From {item.fromName}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {item.receivedAtLabel || item.movedAtLabel || "Recently reassigned"}
        </span>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
          {item.resolvedStateLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TinyStat label="Handled In" value={item.workingHoursLabel || "0 hrs"} tone="slate" />
        <TinyStat label="Impact" value={formatSignedPoints(item.performanceImpactPoints)} tone={impactTone} />
        <TinyStat label="Status" value={item.status || "In Progress"} tone="blue" />
      </div>

      {item.revisionReason ? (
        <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Revision Reason</p>
          <p className="mt-2 text-sm text-amber-900">{item.revisionReason}</p>
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-slate-600">{item.performanceNote}</p>
      <p className="mt-2 text-xs font-medium text-slate-400">
        {item.isCurrentlyAssigned
          ? "Currently assigned to this executive."
          : `Currently with ${item.currentOwnerName}.`}
      </p>
    </div>
  );
}

function summarizeSelectedQueries(items = []) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.categoryKey === "new") summary.newCount += 1;
      if (item.categoryKey === "requote_pending") summary.requotePendingCount += 1;
      if (item.categoryKey === "at_risk") summary.atRiskCount += 1;
      if (item.categoryKey === "active") summary.activeCount += 1;
      return summary;
    },
    {
      total: 0,
      newCount: 0,
      requotePendingCount: 0,
      atRiskCount: 0,
      activeCount: 0,
    },
  );
}

export function OpsManagerReassignModal({ exec, onClose, onSuccess }) {
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [selectedQueryIds, setSelectedQueryIds] = useState([]);

  useEffect(() => {
    let ignore = false;

    const loadPreview = async () => {
      if (!exec?.id) {
        setPreview(null);
        setPreviewLoading(false);
        return;
      }

      try {
        setPreviewLoading(true);
        const { data } = await API.get(`/ops/manager/reassign-preview/${exec.id}`);
        if (ignore) return;

        const payload = data?.data || null;
        setPreview(payload);
        setSelectedTargetId("");
        setSelectedQueryIds((payload?.queries || []).map((query) => query.id));
      } catch (error) {
        if (!ignore) {
          toast.error(error?.response?.data?.message || "Failed to load reassign details");
          onClose();
        }
      } finally {
        if (!ignore) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      ignore = true;
    };
  }, [exec?.id]);

  const queries = preview?.queries || [];
  const recipients = preview?.recipients || [];
  const selectedQueries = useMemo(
    () => queries.filter((query) => selectedQueryIds.includes(query.id)),
    [queries, selectedQueryIds],
  );
  const selectedSummary = useMemo(
    () => summarizeSelectedQueries(selectedQueries),
    [selectedQueries],
  );
  const allSelected = queries.length > 0 && selectedQueryIds.length === queries.length;

  const toggleQuery = (queryId) => {
    setSelectedQueryIds((current) =>
      current.includes(queryId)
        ? current.filter((id) => id !== queryId)
        : [...current, queryId],
    );
  };

  const toggleAllQueries = () => {
    setSelectedQueryIds(allSelected ? [] : queries.map((query) => query.id));
  };

  const handleConfirm = async () => {
    if (!exec?.id || !selectedTargetId || !selectedQueryIds.length) {
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await API.post("/ops/manager/reassign", {
        fromUserId: exec.id,
        toUserId: selectedTargetId,
        queryIds: selectedQueryIds,
      });

      toast.success(data?.message || "Queries reassigned successfully");
      onSuccess?.(data?.data || data || null);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reassign queries");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[78vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Re-assign queries</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose exactly which queries should move from <span className="font-medium text-slate-700">{exec?.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <IconClose />
          </button>
        </div>

        {previewLoading ? (
          <div className="grid gap-4 px-4 py-4">
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{preview?.sourceMember?.name || exec?.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{preview?.sourceMember?.email || exec?.email || "Operations Executive"}</p>
                  </div>
                  <MemberStatusBadge status={preview?.sourceMember?.status || exec?.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <TinyStat label="Active" value={preview?.sourceMember?.activeQueries ?? exec?.activeQueries ?? 0} tone="slate" />
                  <TinyStat label="New" value={preview?.summary?.newCount ?? 0} tone="blue" />
                  <TinyStat label="Re-quote" value={preview?.summary?.requotePendingCount ?? 0} tone="amber" />
                  <TinyStat label="At Risk" value={preview?.summary?.atRiskCount ?? 0} tone="rose" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Assign To</p>
                  <p className="mt-1 text-xs text-slate-500">Team workload snapshot before reassignment</p>
                </div>

                <div className="thin-scrollbar max-h-56 space-y-3 overflow-y-auto px-4 py-4">
                  {recipients.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                      No other team member is available right now.
                    </p>
                  ) : (
                    recipients.map((member) => (
                      <label
                        key={member.id}
                        className={`block cursor-pointer rounded-2xl border p-4 transition ${
                          selectedTargetId === member.id
                            ? "border-blue-300 bg-blue-50/70 shadow-[0_8px_20px_rgba(59,130,246,0.08)]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ops-reassign-target"
                          className="sr-only"
                          checked={selectedTargetId === member.id}
                          onChange={() => setSelectedTargetId(member.id)}
                        />
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${member.avatar?.bg || "bg-blue-100"} ${member.avatar?.text || "text-blue-700"}`}>
                            {member.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{member.currentWorkloadLabel}</p>
                              </div>
                              <MemberStatusBadge status={member.status} />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                                {member.newQueries || 0} new
                              </span>
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                {member.requotePendingQueries || 0} re-quote pending
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                {member.reassignedCurrentQueries || 0} reassigned in queue
                              </span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Select Queries To Move</p>
                  <p className="mt-1 text-xs text-slate-500">Use checkboxes to decide which new or re-quote pending items move out.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAllQueries}
                  disabled={!queries.length}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:grid-cols-4">
                <TinyStat label="Selected" value={selectedSummary.total} tone="slate" />
                <TinyStat label="New" value={selectedSummary.newCount} tone="blue" />
                <TinyStat label="Re-quote" value={selectedSummary.requotePendingCount} tone="amber" />
                <TinyStat label="At Risk" value={selectedSummary.atRiskCount} tone="rose" />
              </div>

              <div className="thin-scrollbar max-h-64 space-y-3 overflow-y-auto px-4 py-4">
                {queries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    No eligible queries are currently available for reassignment.
                  </div>
                ) : (
                  queries.map((query) => {
                    const checked = selectedQueryIds.includes(query.id);
                    return (
                      <label
                        key={query.id}
                        className={`block cursor-pointer rounded-2xl border p-4 transition ${
                          checked
                            ? "border-blue-300 bg-blue-50/50 shadow-[0_8px_20px_rgba(59,130,246,0.06)]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={checked}
                            onChange={() => toggleQuery(query.id)}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{query.queryId || "Query"}</p>
                                <p className="mt-1 text-sm text-slate-600">{query.destination}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">{query.amount}</p>
                                <p className={`mt-1 text-[11px] font-medium ${queryStatusStyles[query.status] || "text-slate-500"}`}>
                                  {query.status}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <QueryCategoryBadge categoryKey={query.categoryKey} label={query.categoryLabel} />
                              {query.createdAtLabel ? (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                  {query.createdAtLabel}
                                </span>
                              ) : null}
                              {query.quoteSentAtLabel ? (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                  First quote: {query.quoteSentAtLabel}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-3 text-xs text-slate-500">{query.note}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            {selectedQueryIds.length} query selected for reassignment
          </p>
          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedTargetId || !selectedQueryIds.length}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none"
            >
              {submitting ? "Reassigning..." : "Confirm Reassign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpsManagerReassignmentHistoryModal({ member, onClose }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadDetails = async () => {
      if (!member?.id) {
        setPayload(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await API.get(`/ops/manager/reassignments/${member.id}`);
        if (!ignore) {
          setPayload(data?.data || null);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error?.response?.data?.message || "Failed to load reassignment details");
          onClose();
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      ignore = true;
    };
  }, [member?.id]);

  const items = payload?.items || [];
  const summary = payload?.summary || {};
  const detailMember = payload?.member || member;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{payload?.member?.name || member?.name} reassignment details</h3>
            <p className="mt-1 text-sm text-slate-500">Reassigned query turnaround, revision drag, and performance recovery in one view.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <IconClose />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 px-6 py-6">
            <div className="h-72 animate-pulse rounded-[28px] bg-slate-100" />
            <div className="h-28 animate-pulse rounded-[28px] bg-slate-100" />
            <div className="h-80 animate-pulse rounded-[28px] bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="thin-scrollbar flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <ReassignmentPerformanceGraph
                  memberName={detailMember?.name || member?.name}
                  items={items}
                  summary={summary}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
