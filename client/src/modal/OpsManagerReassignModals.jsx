import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import API from "../utils/Api";

// ─── Styles ──────────────────────────────────────────────────────────────────

const memberStatusStyles = {
  Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border border-rose-200 bg-rose-50 text-rose-600",
  Busy: "border border-amber-200 bg-amber-50 text-amber-700",
};

const queryCategoryStyles = {
  new: "bg-sky-50 border border-sky-200 text-sky-700",
  requote_pending: "bg-amber-50 border border-amber-200 text-amber-700",
  at_risk: "bg-rose-50 border border-rose-200 text-rose-600",
  active: "bg-slate-50 border border-slate-200 text-slate-600",
};

const queryStatusColors = {
  New: "text-sky-600 font-bold",
  Quoted: "text-emerald-600 font-bold",
  Overdue: "text-rose-600 font-bold animate-pulse",
  "In Progress": "text-slate-500 font-bold",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function summarizeSelectedQueries(items = []) {
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.categoryKey === "new") acc.newCount += 1;
      if (item.categoryKey === "requote_pending") acc.requotePendingCount += 1;
      if (item.categoryKey === "at_risk") acc.atRiskCount += 1;
      if (item.categoryKey === "active") acc.activeCount += 1;
      return acc;
    },
    { total: 0, newCount: 0, requotePendingCount: 0, atRiskCount: 0, activeCount: 0 },
  );
}

// ─── Small primitives ─────────────────────────────────────────────────────────

function IconClose({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MemberStatusBadge({ status }) {
  const dotColor =
    status === "Active"
      ? "bg-emerald-500 animate-pulse"
      : status === "At Risk"
        ? "bg-rose-500"
        : "bg-amber-500";
  return (
    <span className={`inline-flex items-center gap-1.5 justify-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border whitespace-nowrap shadow-sm transition-all duration-200 ${memberStatusStyles[status] || memberStatusStyles.Active}`}>
      <span className={`h-1 w-1 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

function QueryCategoryBadge({ categoryKey, label }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${queryCategoryStyles[categoryKey] || queryCategoryStyles.active}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "bg-gradient-to-br from-slate-50 via-slate-100/40 to-white border-slate-200 border-b-[3.5px] border-b-slate-500 text-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.01)]",
    blue: "bg-gradient-to-br from-blue-50/50 via-white to-white border-blue-100 border-b-[3.5px] border-b-blue-500 text-blue-700 shadow-[0_2px_8px_rgba(59,130,246,0.02)]",
    amber: "bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-100 border-b-[3.5px] border-b-amber-500 text-amber-700 shadow-[0_2px_8px_rgba(245,158,11,0.02)]",
    rose: "bg-gradient-to-br from-rose-50/50 via-white to-white border-rose-100 border-b-[3.5px] border-b-rose-500 text-rose-750 shadow-[0_2px_8px_rgba(244,63,94,0.02)]",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 transition-transform hover:scale-[1.02] duration-200 ${toneMap[tone] || toneMap.slate}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-[17px] font-extrabold leading-none">{value}</p>
    </div>
  );
}

// ─── Workload progress bar ────────────────────────────────────────────────────

function WorkloadBar({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const barTone = 
    clamped >= 80 
      ? "from-rose-450 to-pink-550" 
      : clamped >= 50 
        ? "from-amber-400 to-orange-500" 
        : "from-emerald-400 to-teal-500";
  return (
    <div className="mt-3.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${barTone}`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>Capacity Workload</span>
        <span className="font-bold text-slate-700">{clamped}%</span>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, bg = "bg-blue-50", text = "text-blue-600" }) {
  const gradientBg = bg === "bg-blue-100" || bg === "bg-blue-50"
    ? "bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 text-white ring-2 ring-white shadow-sm"
    : bg;
  const isCustomText = bg === "bg-blue-100" || bg === "bg-blue-50" ? "text-white" : text;
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${gradientBg} ${isCustomText}`}>
      {initials}
    </div>
  );
}

// ─── Custom Checkbox ──────────────────────────────────────────────────────────

function CustomCheckbox({ checked }) {
  return (
    <div
      className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200 cursor-pointer ${
        checked 
          ? "border-indigo-600 bg-indigo-600 shadow-[0_2px_6px_rgba(99,102,241,0.3)]" 
          : "border-slate-300 bg-white hover:border-slate-400"
      }`}
    >
      {checked && <IconCheck />}
    </div>
  );
}

// ─── Custom Radio ─────────────────────────────────────────────────────────────

function CustomRadio({ checked }) {
  return (
    <div
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200 cursor-pointer ${
        checked 
          ? "border-indigo-600 bg-indigo-600 shadow-[0_2px_6px_rgba(99,102,241,0.3)]" 
          : "border-slate-300 bg-white hover:border-slate-400"
      }`}
    >
      {checked && <div className="h-[7px] w-[7px] rounded-full bg-white scale-100 transition-transform" />}
    </div>
  );
}

// ─── Recipient row ────────────────────────────────────────────────────────────

function RecipientRow({ member, selected, onSelect }) {
  return (
    <label
      onClick={onSelect}
      className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 border-l-[3.5px] border-transparent ${
        selected 
          ? "bg-gradient-to-r from-blue-50/80 via-indigo-50/15 to-white border-l-indigo-500" 
          : "hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white bg-white"
      }`}
    >
      <div className="mt-0.5">
        <CustomRadio checked={selected} />
      </div>
      <Avatar initials={member.initials} bg={member.avatar?.bg} text={member.avatar?.text} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-slate-800 leading-tight">{member.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{member.currentWorkloadLabel}</p>
          </div>
          <MemberStatusBadge status={member.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
            {member.newQueries || 0} new
          </span>
          <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {member.requotePendingQueries || 0} re-quote
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {member.reassignedCurrentQueries || 0} reassigned
          </span>
        </div>
      </div>
    </label>
  );
}

// ─── Query row ────────────────────────────────────────────────────────────────

function QueryRow({ query, checked, onToggle }) {
  return (
    <label
      onClick={onToggle}
      className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 border-l-[3.5px] border-transparent ${
        checked 
          ? "bg-gradient-to-r from-blue-50/50 via-indigo-50/10 to-white border-l-blue-500" 
          : "hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white bg-white"
      }`}
    >
      <div className="mt-1">
        <CustomCheckbox checked={checked} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-800 leading-tight">{query.queryId || "Query"}</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">{query.destination}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-bold text-slate-800">{query.amount}</p>
            <p className={`mt-0.5 text-[11px] font-extrabold uppercase tracking-wide ${queryStatusColors[query.status] || "text-slate-400"}`}>
              {query.status}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <QueryCategoryBadge categoryKey={query.categoryKey} label={query.categoryLabel} />
          {query.createdAtLabel && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {query.createdAtLabel}
            </span>
          )}
          {query.quoteSentAtLabel && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              Quote: {query.quoteSentAtLabel}
            </span>
          )}
        </div>
        {query.note && <p className="mt-2 text-[11px] leading-relaxed text-slate-450 bg-slate-50 p-2 rounded-lg border border-slate-100">{query.note}</p>}
      </div>
    </label>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-shadow hover:shadow-[0_6px_25px_rgba(15,23,42,0.04)]">
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
      <div>
        <p className="text-[12.5px] font-bold text-slate-800 tracking-tight">{title}</p>
        {subtitle && <p className="mt-0.5 text-[10.5px] font-medium text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function OpsManagerReassignModal({ exec, onClose, onSuccess }) {
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [selectedQueryIds, setSelectedQueryIds] = useState([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!exec?.id) { setPreview(null); setPreviewLoading(false); return; }
      try {
        setPreviewLoading(true);
        const { data } = await API.get(`/ops/manager/reassign-preview/${exec.id}`);
        if (ignore) return;
        const payload = data?.data || null;
        setPreview(payload);
        setSelectedTargetId("");
        setSelectedQueryIds((payload?.queries || []).map((q) => q.id));
      } catch (err) {
        if (!ignore) { toast.error(err?.response?.data?.message || "Failed to load reassign details"); onClose(); }
      } finally {
        if (!ignore) setPreviewLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [exec?.id]);

  const queries = preview?.queries || [];
  const recipients = preview?.recipients || [];
  const selectedQueries = useMemo(() => queries.filter((q) => selectedQueryIds.includes(q.id)), [queries, selectedQueryIds]);
  const selectedSummary = useMemo(() => summarizeSelectedQueries(selectedQueries), [selectedQueries]);
  const allSelected = queries.length > 0 && selectedQueryIds.length === queries.length;

  const toggleQuery = (id) =>
    setSelectedQueryIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);

  const toggleAllQueries = () =>
    setSelectedQueryIds(allSelected ? [] : queries.map((q) => q.id));

  const handleConfirm = async () => {
    if (!exec?.id || !selectedTargetId || !selectedQueryIds.length) return;
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
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reassign queries");
    } finally {
      setSubmitting(false);
    }
  };

  // Estimated workload % for source member (demo: active / (active + 2))
  const workloadPct = Math.round(
    ((preview?.sourceMember?.activeQueries ?? exec?.activeQueries ?? 0) /
      Math.max(1, (preview?.sourceMember?.activeQueries ?? exec?.activeQueries ?? 0) + 2)) * 100,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[88vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)] border border-slate-200/80">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 px-6 py-4">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Re-assign queries</h3>
            <p className="mt-0.5 text-[12px] font-medium text-slate-500">
              Queries moving from{" "}
              <span className="font-semibold text-slate-750">{exec?.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-655 active:scale-95 cursor-pointer shadow-sm border border-slate-200/60"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        {previewLoading ? (
          <div className="space-y-4 px-6 py-6 animate-pulse">
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-40 rounded-2xl bg-slate-100" />
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="h-48 rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin] thin-scrollbar space-y-5">
            
            {/* 1. Source Overview */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 px-1 mb-1.5">1. Source Overview</p>
              {/* Source member card */}
              <Section>
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={(preview?.sourceMember?.name || exec?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        bg="bg-blue-50"
                        text="text-blue-700"
                      />
                      <div>
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">{preview?.sourceMember?.name || exec?.name}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate max-w-[300px]">{preview?.sourceMember?.email || exec?.email || "Operations Executive"}</p>
                      </div>
                    </div>
                    <MemberStatusBadge status={preview?.sourceMember?.status || exec?.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <StatCard label="Active" value={preview?.sourceMember?.activeQueries ?? exec?.activeQueries ?? 0} tone="slate" />
                    <StatCard label="New" value={preview?.summary?.newCount ?? 0} tone="blue" />
                    <StatCard label="Re-quote" value={preview?.summary?.requotePendingCount ?? 0} tone="amber" />
                    <StatCard label="At Risk" value={preview?.summary?.atRiskCount ?? 0} tone="rose" />
                  </div>
                  <WorkloadBar value={workloadPct} />
                </div>
              </Section>
            </div>

            {/* 2. Assign Target */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 px-1 mb-1.5 pt-1">2. Assign Target</p>
              {/* Assign To */}
              <Section>
                <SectionHeader title="Assign Target" subtitle="Team workload snapshot before reassignment" />
                {recipients.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                    No other team member is available right now.
                  </p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto [scrollbar-width:thin] thin-scrollbar">
                    {recipients.map((member) => (
                      <RecipientRow
                        key={member.id}
                        member={member}
                        selected={selectedTargetId === member.id}
                        onSelect={() => setSelectedTargetId(member.id)}
                      />
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* 3. Selection Preview */}
            {queries.length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 px-1 mb-1.5 pt-1">3. Selection Preview</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 shadow-inner">
                  <div className="grid grid-cols-4 gap-3">
                    <StatCard label="Selected" value={selectedSummary.total} tone="slate" />
                    <StatCard label="New" value={selectedSummary.newCount} tone="blue" />
                    <StatCard label="Re-quote" value={selectedSummary.requotePendingCount} tone="amber" />
                    <StatCard label="At Risk" value={selectedSummary.atRiskCount} tone="rose" />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Select Queries to Move */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 px-1 mb-1.5 pt-1">4. Select Queries to Move</p>
              {/* Queries */}
              <Section>
                <SectionHeader
                  title="Select Queries to Move"
                  subtitle="Check which queries should be reassigned"
                  action={
                    queries.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllQueries}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition hover:underline cursor-pointer bg-indigo-50 px-2.5 py-0.5 rounded-md"
                      >
                        {allSelected ? "Clear all" : "Select all"}
                      </button>
                    )
                  }
                />
                {queries.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[12px] text-slate-400">
                    No eligible queries available for reassignment.
                  </p>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto [scrollbar-width:thin] thin-scrollbar">
                    {queries.map((query) => (
                      <QueryRow
                        key={query.id}
                        query={query}
                        checked={selectedQueryIds.includes(query.id)}
                        onToggle={() => toggleQuery(query.id)}
                      />
                    ))}
                  </div>
                )}
              </Section>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-3.5">
          <p className="text-[12.5px] font-bold text-slate-455">
            <span className="font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 shadow-sm">{selectedQueryIds.length}</span>{" "}
            {selectedQueryIds.length === 1 ? "query" : "queries"} selected to transfer
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-600 bg-white transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedTargetId || !selectedQueryIds.length}
              className={`rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                submitting || !selectedTargetId || !selectedQueryIds.length
                  ? "bg-gradient-to-r from-slate-150 to-slate-200 text-slate-400 border border-slate-200/60 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 hover:from-blue-600 hover:via-indigo-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              }`}
            >
              {submitting ? "Reassigning..." : "Confirm Reassign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}