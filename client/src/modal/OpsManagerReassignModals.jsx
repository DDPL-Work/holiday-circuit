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
  New: "text-sky-600",
  Quoted: "text-emerald-600",
  Overdue: "text-rose-600",
  "In Progress": "text-slate-500",
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
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MemberStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${memberStatusStyles[status] || memberStatusStyles.Active}`}>
      {status}
    </span>
  );
}

function QueryCategoryBadge({ categoryKey, label }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${queryCategoryStyles[categoryKey] || queryCategoryStyles.active}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "text-slate-900",
    blue: "text-blue-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold leading-none ${toneMap[tone] || toneMap.slate}`}>{value}</p>
    </div>
  );
}

// ─── Workload progress bar ────────────────────────────────────────────────────

function WorkloadBar({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const color = clamped >= 80 ? "bg-rose-400" : clamped >= 50 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-slate-400">Workload at {clamped}% capacity</p>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, bg = "bg-blue-100", text = "text-blue-700" }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${bg} ${text}`}>
      {initials}
    </div>
  );
}

// ─── Custom Checkbox ──────────────────────────────────────────────────────────

function CustomCheckbox({ checked }) {
  return (
    <div
      className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border transition-all ${
        checked ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
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
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all ${
        checked ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
      }`}
    >
      {checked && <div className="h-[7px] w-[7px] rounded-full bg-white" />}
    </div>
  );
}

// ─── Recipient row ────────────────────────────────────────────────────────────

function RecipientRow({ member, selected, onSelect }) {
  return (
    <label
      onClick={onSelect}
      className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
        selected ? "bg-blue-50/70" : "hover:bg-slate-50"
      }`}
    >
      <div className="mt-0.5">
        <CustomRadio checked={selected} />
      </div>
      <Avatar initials={member.initials} bg={member.avatar?.bg} text={member.avatar?.text} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-900">{member.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{member.currentWorkloadLabel}</p>
          </div>
          <MemberStatusBadge status={member.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
            {member.newQueries || 0} new
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            {member.requotePendingQueries || 0} re-quote
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
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
      className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
        checked ? "bg-blue-50/50" : "hover:bg-slate-50"
      }`}
    >
      <div className="mt-1">
        <CustomCheckbox checked={checked} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-900">{query.queryId || "Query"}</p>
            <p className="mt-0.5 text-[12px] text-slate-500">{query.destination}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-medium text-slate-900">{query.amount}</p>
            <p className={`mt-0.5 text-[11px] font-medium ${queryStatusColors[query.status] || "text-slate-400"}`}>
              {query.status}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <QueryCategoryBadge categoryKey={query.categoryKey} label={query.categoryLabel} />
          {query.createdAtLabel && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {query.createdAtLabel}
            </span>
          )}
          {query.quoteSentAtLabel && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              Quote: {query.quoteSentAtLabel}
            </span>
          )}
        </div>
        {query.note && <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{query.note}</p>}
      </div>
    </label>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
      <div>
        <p className="text-[12px] font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[82vh] w-full max-w-[540px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)]">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">Re-assign queries</h3>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Queries moving from{" "}
              <span className="font-medium text-slate-700">{exec?.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        {previewLoading ? (
          <div className="space-y-3 px-5 py-5">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">

            {/* Source member card */}
            <Section>
              <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={(preview?.sourceMember?.name || exec?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      bg="bg-blue-100"
                      text="text-blue-700"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{preview?.sourceMember?.name || exec?.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{preview?.sourceMember?.email || exec?.email || "Operations Executive"}</p>
                    </div>
                  </div>
                  <MemberStatusBadge status={preview?.sourceMember?.status || exec?.status} />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <StatCard label="Active" value={preview?.sourceMember?.activeQueries ?? exec?.activeQueries ?? 0} tone="slate" />
                  <StatCard label="New" value={preview?.summary?.newCount ?? 0} tone="blue" />
                  <StatCard label="Re-quote" value={preview?.summary?.requotePendingCount ?? 0} tone="amber" />
                  <StatCard label="At Risk" value={preview?.summary?.atRiskCount ?? 0} tone="rose" />
                </div>
                <WorkloadBar value={workloadPct} />
              </div>
            </Section>

            {/* Assign To */}
            <Section>
              <SectionHeader title="Assign To" subtitle="Team workload snapshot before reassignment" />
              {recipients.length === 0 ? (
                <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                  No other team member is available right now.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto [scrollbar-width:thin]">
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

            {/* Selected summary chips */}
            {queries.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <StatCard label="Selected" value={selectedSummary.total} tone="slate" />
                <StatCard label="New" value={selectedSummary.newCount} tone="blue" />
                <StatCard label="Re-quote" value={selectedSummary.requotePendingCount} tone="amber" />
                <StatCard label="At Risk" value={selectedSummary.atRiskCount} tone="rose" />
              </div>
            )}

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
                      className="text-[11px] font-medium text-blue-500 hover:underline"
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
                <div className="max-h-60 overflow-y-auto [scrollbar-width:thin]">
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
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[12px] text-slate-400">
            <span className="font-semibold text-slate-700">{selectedQueryIds.length}</span>{" "}
            {selectedQueryIds.length === 1 ? "query" : "queries"} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedTargetId || !selectedQueryIds.length}
              className="rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {submitting ? "Reassigning..." : "Confirm Reassign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}