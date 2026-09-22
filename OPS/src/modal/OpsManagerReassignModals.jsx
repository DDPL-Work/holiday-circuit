import { useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import API from "../utils/Api";

// ─── Styles ──────────────────────────────────────────────────────────────────

const memberStatusStyles = {
  Active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "At Risk": "border border-red-200 bg-red-50 text-[#EF4444]",
  Busy: "border border-amber-200 bg-amber-50 text-amber-700",
};

const queryCategoryStyles = {
  new: "bg-sky-50 border border-sky-200 text-sky-700",
  requote_pending: "bg-amber-50 border border-amber-200 text-amber-700",
  at_risk: "bg-red-50 border border-red-200 text-[#EF4444]",
  active: "bg-slate-50 border border-slate-200 text-slate-600",
};

const queryStatusColors = {
  New: "text-sky-600 font-bold",
  Quoted: "text-emerald-600 font-bold",
  Overdue: "text-[#EF4444] font-bold",
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

function IconChevronDown({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MemberStatusBadge({ status }) {
  const dotColor =
    status === "Active"
      ? "bg-emerald-500 animate-pulse"
      : status === "At Risk"
        ? "bg-[#EF4444]"
        : "bg-amber-500";
  return (
    <span className={`inline-flex items-center gap-1.5 justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold border whitespace-nowrap shadow-sm transition-all duration-200 ${memberStatusStyles[status] || memberStatusStyles.Active}`}>
      <span className={`h-1 w-1 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

function QueryCategoryBadge({ categoryKey, label }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${queryCategoryStyles[categoryKey] || queryCategoryStyles.active}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "bg-white border-slate-200 border-b-[3px] border-b-slate-500 text-slate-800 shadow-sm",
    blue: "bg-white border-slate-200 border-b-[3px] border-b-[#3E63DD] text-[#3E63DD] shadow-sm",
    amber: "bg-white border-slate-200 border-b-[3px] border-b-amber-500 text-amber-700 shadow-sm",
    rose: "bg-white border-slate-200 border-b-[3px] border-b-[#EF4444] text-[#EF4444] shadow-sm",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 transition-transform duration-200 ${toneMap[tone] || toneMap.slate}`}>
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
      ? "from-[#EF4444] to-red-400" 
      : clamped >= 50 
        ? "from-amber-400 to-orange-500" 
        : "from-emerald-400 to-teal-500";
  return (
    <div className="mt-3.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50 shadow-inner">
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
  const customBg = bg === "bg-blue-100" || bg === "bg-blue-50"
    ? "bg-[#3E63DD] text-white ring-2 ring-white shadow-sm"
    : bg;
  const isCustomText = bg === "bg-blue-100" || bg === "bg-blue-50" ? "text-white" : text;
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${customBg} ${isCustomText}`}>
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
          <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
            {member.newQueries || 0} new
          </span>
          <span className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {member.requotePendingQueries || 0} re-quote
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
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
          ? "bg-blue-50/50 border-l-[#3E63DD]" 
          : "hover:bg-slate-50 bg-white"
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
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {query.createdAtLabel}
            </span>
          )}
          {query.quoteSentAtLabel && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
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

function Section({ children, className = "overflow-hidden" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 rounded-t-xl">
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const triggerClose = () => {
    setActive(false);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        setSelectedQueryIds([]);
      } catch (err) {
        if (!ignore) { toast.error(err?.response?.data?.message || "Failed to load reassign details"); triggerClose(); }
      } finally {
        if (!ignore) setPreviewLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [exec?.id]);

  const [queryFilter, setQueryFilter] = useState("all");
  const queries = preview?.queries || [];
  const recipients = preview?.recipients || [];
  const selectedQueries = useMemo(() => queries.filter((q) => selectedQueryIds.includes(q.id)), [queries, selectedQueryIds]);
  const selectedSummary = useMemo(() => summarizeSelectedQueries(selectedQueries), [selectedQueries]);

  const filteredQueries = useMemo(() => {
    if (queryFilter === "all") return queries;
    return queries.filter((q) => q.categoryKey === queryFilter);
  }, [queries, queryFilter]);

  const allFilteredSelected = useMemo(() => {
    if (filteredQueries.length === 0) return false;
    return filteredQueries.every((q) => selectedQueryIds.includes(q.id));
  }, [filteredQueries, selectedQueryIds]);

  const toggleQuery = (id) =>
    setSelectedQueryIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);

  const toggleAllFilteredQueries = () => {
    if (allFilteredSelected) {
      setSelectedQueryIds((cur) => cur.filter((id) => !filteredQueries.some((fq) => fq.id === id)));
    } else {
      setSelectedQueryIds((cur) => {
        const next = [...cur];
        filteredQueries.forEach((fq) => {
          if (!next.includes(fq.id)) next.push(fq.id);
        });
        return next;
      });
    }
  };

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
      triggerClose();
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px] transition-all duration-200 ease-out ${active ? "opacity-100" : "opacity-0"}`}>
      <div className={`flex max-h-[88vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl border border-slate-200 transition-all duration-200 ease-out ${active ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-900 px-6 py-4">
          <div>
            <h3 className="text-[17.5px] font-bold text-white tracking-tight">Re-assign queries</h3>
            <p className="mt-0.5 text-[12px] font-medium text-slate-300">
              Queries moving from{" "}
              <span className="font-bold text-white">{exec?.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={triggerClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95 cursor-pointer shadow-sm border border-white/10"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        {previewLoading ? (
          <div className="space-y-4 px-6 py-6 animate-pulse">
            <div className="h-28 rounded-xl bg-slate-200/60" />
            <div className="h-40 rounded-xl bg-slate-200/60" />
            <div className="h-16 rounded-xl bg-slate-200/60" />
            <div className="h-48 rounded-xl bg-slate-200/60" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-5">
            
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
              <Section className="overflow-visible">
                <SectionHeader title="Assign Target" subtitle="Team workload snapshot before reassignment" />
                {recipients.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                    No other team member is available right now.
                  </p>
                ) : (
                  <div className="px-4 pt-4 pb-5">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left transition-all duration-200 hover:border-[#3E63DD] hover:bg-white focus:outline-none cursor-pointer shadow-sm"
                      >
                        {selectedTargetId ? (
                          (() => {
                            const selectedMember = recipients.find((r) => r.id === selectedTargetId);
                            if (!selectedMember) return <span className="text-[13px] font-semibold text-slate-500">Select target team member...</span>;
                            return (
                              <span className="flex items-center gap-3">
                                <Avatar initials={selectedMember.initials} bg={selectedMember.avatar?.bg} text={selectedMember.avatar?.text} />
                                <span>
                                  <span className="block text-[13px] font-bold text-slate-800 leading-none">{selectedMember.name}</span>
                                  <span className="mt-1 block text-[11px] font-semibold text-[#3E63DD] leading-none">{selectedMember.currentWorkloadLabel}</span>
                                </span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="flex items-center gap-3 text-slate-400">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </span>
                            <span className="text-[13px] font-semibold text-slate-500">Select target team member...</span>
                          </span>
                        )}
                        <IconChevronDown className={`text-slate-400 transition-transform duration-250 ${dropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute left-0 right-0 z-20 mt-2 max-h-[380px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {recipients.map((member) => (
                            <div
                              key={member.id}
                             onClick={() => {
                                if (selectedTargetId === member.id) {
                                  setSelectedTargetId("");
                                } else {
                                  setSelectedTargetId(member.id);
                                }
                              }}
                              className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 border-l-[3.5px] border-transparent ${
                                selectedTargetId === member.id
                                  ? "bg-blue-50/60 border-l-[#3E63DD]"
                                  : "hover:bg-slate-50 bg-white"
                              }`}
                            >
                              <div className="mt-1">
                                <CustomCheckbox checked={selectedTargetId === member.id} />
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
                                  <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                    {member.newQueries || 0} new
                                  </span>
                                  <span className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    {member.requotePendingQueries || 0} re-quote
                                  </span>
                                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {member.reassignedCurrentQueries || 0} reassigned
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Section>
            </div>

            {/* 3. Selection Preview */}
            {queries.length > 0 && (
              <div className={`transition-all duration-300 ${dropdownOpen ? "filter blur-[2.5px] opacity-40 pointer-events-none" : ""}`}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 px-1 mb-1.5 pt-1">3. Selection Preview</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
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
            <div className={`transition-all duration-300 ${dropdownOpen ? "filter blur-[2.5px] opacity-40 pointer-events-none" : ""}`}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 px-1 mb-1.5 pt-1">4. Select Queries to Move</p>
              {/* Queries */}
              <Section>
                <SectionHeader
                  title="Select Queries to Move"
                  subtitle="Check which queries should be reassigned"
                  action={
                    queries.length > 0 && (
                      <div className="flex items-center gap-2.5">
                        <select
                          value={queryFilter}
                          onChange={(e) => setQueryFilter(e.target.value)}
                          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none transition hover:border-[#3E63DD] shadow-sm"
                        >
                          <option value="all">All Queries ({queries.length})</option>
                          <option value="new">New ({queries.filter(q => q.categoryKey === "new").length})</option>
                          <option value="requote_pending">Re-quote ({queries.filter(q => q.categoryKey === "requote_pending").length})</option>
                          <option value="at_risk">At Risk ({queries.filter(q => q.categoryKey === "at_risk").length})</option>
                          <option value="active">Active ({queries.filter(q => q.categoryKey === "active").length})</option>
                        </select>
                        <button
                          type="button"
                          onClick={toggleAllFilteredQueries}
                          className="text-[11px] font-bold text-[#3E63DD] hover:text-blue-800 transition hover:underline cursor-pointer bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 shadow-sm whitespace-nowrap"
                        >
                          {allFilteredSelected ? "Clear all" : "Select all"}
                        </button>
                      </div>
                    )
                  }
                />
                {filteredQueries.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[12px] text-slate-400">
                    No eligible queries found for this filter.
                  </p>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredQueries.map((query) => (
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
        <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5 transition-all duration-300 ${dropdownOpen ? "filter blur-[2.5px] opacity-40 pointer-events-none" : ""}`}>
          <p className="text-[12.5px] font-bold text-slate-600">
            <span className="font-extrabold text-[#3E63DD] bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5 shadow-sm">{selectedQueryIds.length}</span>{" "}
            {selectedQueryIds.length === 1 ? "query" : "queries"} selected to transfer
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={triggerClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedTargetId || !selectedQueryIds.length}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                submitting || !selectedTargetId || !selectedQueryIds.length
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-[#3E63DD] hover:bg-[#3353c7] text-white shadow-sm hover:shadow active:scale-95 cursor-pointer"
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