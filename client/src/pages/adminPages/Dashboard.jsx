import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertCircle, BookOpen, Check, Eye, FileText, Loader2, ReceiptText, Send, UserRound, X } from "lucide-react";
import API from "../../utils/Api";

const TABS = ["Overview", "Queries", "Bookings", "Vouchers", "Reports"];

const permissionsFallback = [
  "Manage all users and roles",
  "View and modify contracted rates",
  "Full booking management access",
  "Order acceptance and processing",
  "Voucher generation and management",
  "Confirmation number entry",
  "Payment verification",
  "Internal invoice management",
];

const statIconMap = {
  "Pending Queries": { icon: AlertCircle, iconBg: "bg-amber-100 text-amber-700" },
  "Active Bookings": { icon: BookOpen, iconBg: "bg-blue-100 text-blue-700" },
  "Vouchers Generated": { icon: ReceiptText, iconBg: "bg-teal-100 text-teal-700" },
  "Pending Actions": { icon: FileText, iconBg: "bg-rose-100 text-rose-700" },
};

const quotationStatusStyles = {
  "Quote Sent": "bg-sky-50 text-sky-700 border border-sky-200",
  "Quote Accepted": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Markup Applied": "bg-violet-50 text-violet-700 border border-violet-200",
  "Sent to Client": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Revision Requested": "bg-rose-50 text-rose-700 border border-rose-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Revised: "bg-amber-50 text-amber-700 border border-amber-200",
  Pending: "bg-slate-50 text-slate-600 border border-slate-200",
  Rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

const quotationStatusCopy = {
  "Quote Sent": "Ops has shared the quotation and is waiting for agent action.",
  "Quote Accepted": "Agent has accepted this quotation.",
  "Markup Applied": "Agent has applied a markup by adjusting the client-side pricing.",
  "Sent to Client": "Agent has forwarded this quotation to the client.",
  Rejected: "Agent has rejected this quotation attempt.",
  "Revision Requested": "Agent has rejected this quotation attempt.",
  Confirmed: "This quotation has reached the final conversion stage.",
  Revised: "Quotation was revised and put back into the process.",
  Pending: "This quotation is currently in the processing stage.",
};

const formatDateTimeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
};

const getRecentQueryPresentation = (query) => {
  const opsStage = String(query?.opsStage || "");
  if (opsStage === "Accepted") return { label: "Booking Accepted", pill: "Accepted", pillClass: "bg-blue-100 text-blue-700", iconBg: "bg-green-100 text-green-700", icon: "✓" };
  if (opsStage === "Confirmed") return { label: "Confirmation Entered", pill: "Confirmed", pillClass: "bg-cyan-100 text-cyan-700", iconBg: "bg-teal-100 text-teal-700", icon: "✦" };
  if (opsStage === "Vouchered") return { label: "Voucher Generated", pill: "Vouchered", pillClass: "bg-green-100 text-green-700", iconBg: "bg-amber-100 text-amber-700", icon: "◈" };
  if (opsStage === "Revision Query") return { label: "Revision Requested", pill: "Revision", pillClass: "bg-violet-100 text-violet-700", iconBg: "bg-violet-100 text-violet-700", icon: "R" };
  if (opsStage === "Rejected") return { label: "Query Rejected", pill: "Rejected", pillClass: "bg-rose-100 text-rose-700", iconBg: "bg-rose-100 text-rose-700", icon: "X" };
  return { label: "New Query", pill: "New", pillClass: "bg-violet-100 text-violet-700", iconBg: "bg-blue-100 text-blue-700", icon: "✉" };
};

// ─── Booking status color helper ───────────────────────────────────────────
const bookingStatusDot = {
  Confirmed: "bg-emerald-400",
  Pending: "bg-amber-400",
  Cancelled: "bg-rose-400",
  Active: "bg-blue-400",
};

// ─── Voucher status pill ────────────────────────────────────────────────────
const voucherStatusPill = {
  Sent: "bg-sky-50 text-sky-700 border border-sky-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Generated: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Expired: "bg-rose-50 text-rose-700 border border-rose-200",
};

function StatCard({ label, value, change, changeUp }) {
  const config = statIconMap[label] || statIconMap["Pending Actions"];
  const Icon = config.icon;
  return (
    <div className="cursor-default rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${config.iconBg}`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="mt-1 text-3xl font-medium leading-none text-gray-800">{value}</div>
      <div className={`mt-1 text-xs ${changeUp ? "text-green-600" : "text-red-500"}`}>{change}</div>
    </div>
  );
}

function PerformanceBars({ rows = [], animate }) {
  return (
    <div className="divide-y divide-gray-100">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="p-4">
          <div className="mb-2 flex justify-between">
            <span className="text-xs text-gray-400">{row.label}</span>
            <span className="text-sm font-medium text-gray-700">{row.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${row.color || "bg-blue-500"} transition-all duration-1000 ease-out`}
              style={{ width: animate ? `${row.width || 0}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ bars = [], color, animate }) {
  const max = Math.max(...bars, 1);
  return (
    <div className="mt-3 flex h-10 items-end gap-1">
      {bars.map((value, index) => (
        <div
          key={`${color}-${index}`}
          className={`flex-1 rounded-t ${color} transition-all duration-700 ease-out`}
          style={{
            height: animate ? `${Math.max(6, Math.round((value / max) * 40))}px` : "0px",
            opacity: index === bars.length - 1 ? 1 : 0.4,
            transitionDelay: `${index * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="px-4 py-10 text-center text-sm text-gray-400">{message}</div>;
}

function QuotationTrackerModal({ query, onClose }) {
  const navigate = useNavigate();
  const [quotationHistory, setQuotationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);

  const queryObjectId = query?.queryObjectId || query?.id || query?.builderState?._id;

  const handleEditQuotation = (quotation) => {
    if (!query?.builderState?._id) { toast.error("Query details are incomplete for quotation editing."); return; }
    navigate("/ops/quotation-builder", { state: { ...query.builderState, editQuotationId: quotation?.id || "" } });
    onClose();
  };

  useEffect(() => {
    const fetchQuotationHistory = async () => {
      if (!queryObjectId) { setQuotationHistory([]); setError("Quotation tracker is unavailable for this query"); setLoading(false); return; }
      try {
        setLoading(true); setError("");
        const { data } = await API.get(`/admin/queries/${queryObjectId}/quotations`);
        setQuotationHistory(data?.data?.quotations || []);
      } catch (err) {
        setQuotationHistory([]); setError(err?.response?.data?.message || "Failed to load quotation history");
      } finally { setLoading(false); }
    };
    fetchQuotationHistory();
  }, [queryObjectId, reloadSeed]);

  const shouldCenterSingleCard = !loading && !error && quotationHistory.length === 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="finance-transparent-scrollbar fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 pb-6 pt-8"
      style={{ background: "rgba(10, 15, 35, 0.6)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 18 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 18 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-[1320px]"
      >
        <div className="mx-auto mb-2 max-w-[1040px] px-1 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.2)" }}>{query?.queryId || "Query"}</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "16px" }}>.</span>
            <span className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.12)" }}>{query?.name || "Unknown Agent"} - {query?.destination || "-"}</span>
            <span className="rounded-lg px-2.5 py-1 text-[11px] font-medium" style={{ background: "rgba(212,242,61,0.12)", color: "rgba(212,242,61,0.95)", border: "1px solid rgba(212,242,61,0.2)" }}>
              {loading ? "Loading attempts..." : `${quotationHistory.length} quotation attempt${quotationHistory.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="absolute right-4 top-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base leading-none transition-all"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
        >&times;</button>

        {loading ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl px-6 py-10 text-center" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#d4f23d]" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-white">Loading quotation attempts...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl p-6" style={{ background: "rgba(127, 29, 29, 0.2)", border: "1px solid rgba(252, 165, 165, 0.24)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            <div>
              <p className="text-sm font-semibold text-white">Quotation tracker unavailable</p>
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{error}</p>
            </div>
            <button type="button" onClick={() => setReloadSeed((v) => v + 1)} className="rounded-xl bg-[#d4f23d] px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-[#c5e535]">Retry</button>
          </div>
        ) : quotationHistory.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            <p className="text-base font-semibold text-white">No quotation attempts yet</p>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Is query ke liye abhi tak koi quotation create ya send nahi hua hai.</p>
          </div>
        ) : (
          <div
            className={`mx-auto flex max-w-[1040px] flex-wrap gap-4 ${shouldCenterSingleCard ? "min-h-[calc(100vh-220px)] items-center justify-center" : "items-start"}`}
          >
            {quotationHistory.map((quotation, index) => (
              <motion.div key={quotation.id || quotation.attemptNumber}
                initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut", delay: index * 0.04 }}
                className="flex w-full max-w-[512px] flex-col rounded-2xl px-5 py-4 md:w-[calc(50%-0.5rem)]"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)" }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Quotation {quotation.attemptNumber}</span>
                  </div>
                  {quotation.isLatest ? <span className="rounded-full bg-[#d4f23d]/90 px-2 py-1 text-[10px] font-semibold uppercase text-gray-900">Latest</span> : null}
                </div>
                <div className="mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold leading-tight text-white">{quotation.quotationNumber || `Quotation ${quotation.attemptNumber}`}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${quotationStatusStyles[quotation.status] || quotationStatusStyles.Pending}`}>{quotation.displayStatus || quotation.status || "Pending"}</span>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: "rgba(255,255,255,0.52)" }}>Created {quotation.createdAtLabel || formatDateTimeLabel(quotation.createdAt) || "-"}</p>
                </div>
                <div className="mb-2">
                  <p className="text-2xl font-semibold text-white">{quotation.amount}</p>
                  {quotation.agentRemark ? (
                    <p className="mt-1 text-xs font-medium" style={{ color: "rgba(254, 178, 178, 0.95)" }}>Remark: {quotation.agentRemark}</p>
                  ) : (
                    <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{quotationStatusCopy[quotation.displayStatus || quotation.status] || quotationStatusCopy.Pending}</p>
                  )}
                </div>
                <ul className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[`Valid till: ${quotation.validTill || "Not shared"}`, `Contents: ${quotation.serviceCount} services`, `Quote type: ${quotation.quoteCategory || "Standard"}`].map((item) => (
                    <li key={item} className="flex min-w-0 items-center gap-2 text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.72)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,242,61,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2.5">
                  <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Last update {quotation.updatedAtLabel || quotation.createdAtLabel || "-"}</div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => handleEditQuotation(quotation)} className="rounded-xl px-3.5 py-1.5 text-xs font-semibold transition" style={{ background: "rgba(212,242,61,0.95)", color: "#162033" }}>Edit</button>
                    <button type="button" onClick={() => toast("Preview action coming soon")} className="rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.82)", borderColor: "rgba(255,255,255,0.14)" }}>Preview</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [visible, setVisible] = useState("Overview");
  const [animating, setAnimating] = useState(false);
  const [barsReady, setBarsReady] = useState(false);
  const [miniReady, setMiniReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [selectedQuotationQuery, setSelectedQuotationQuery] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/dashboard");
      setDashboardData(data?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setTimeout(() => setBarsReady(true), 150);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === activeTab || animating) return;
    setAnimating(true); setBarsReady(false); setMiniReady(false);
    setTimeout(() => {
      setActiveTab(tab); setVisible(tab); setAnimating(false);
      if (tab === "Overview") setTimeout(() => setBarsReady(true), 120);
      if (tab === "Reports") setTimeout(() => setMiniReady(true), 100);
    }, 180);
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleOpenReplyModal = (query) => { setSelectedEscalation(query); setReplyText(""); };
  const handleCloseReplyModal = () => { setSelectedEscalation(null); setReplyText(""); };

  const handleSubmitReply = async () => {
    const trimmedReply = replyText.trim();
    if (!trimmedReply) { toast.error("Please write a reply for operations."); return; }
    if (!selectedEscalation?.id) { toast.error("Escalation details are missing."); return; }
    try {
      setReplySubmitting(true);
      const { data } = await API.patch(`/admin/queries/${selectedEscalation.id}/reply-to-ops`, { reply: trimmedReply });
      toast.success(data?.message || "Reply sent to ops successfully");
      handleCloseReplyModal();
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send reply right now.");
    } finally { setReplySubmitting(false); }
  };

  const permissions = dashboardData?.permissions || permissionsFallback;
  const summaryCards = dashboardData?.summaryCards || [];
  const queryFlow = dashboardData?.queryFlow || [];
  const performance = dashboardData?.performance || [];
  const queries = dashboardData?.queries || [];
  const bookings = dashboardData?.bookings || [];
  const vouchers = dashboardData?.vouchers || [];
  const reports = dashboardData?.reports || [];
  const header = dashboardData?.header || {};

  const queryCount = useMemo(() => queries.length, [queries.length]);
  const bookingCount = useMemo(() => bookings.length, [bookings.length]);
  const voucherCount = useMemo(() => vouchers.length, [vouchers.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
          <Loader2 size={18} className="animate-spin" />Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">{header.title || "Dashboard"}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">{header.roleLabel || "Administrator"}</span>
            </div>
            <p className="text-xs text-gray-400">{header.subtitle || "Complete access to all system features"}</p>
          </div>
          <span className="text-xs text-gray-400">Logged in as <strong className="text-gray-600">{header.loggedInAs || "Administrator"}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="custom-scroll flex gap-0 overflow-x-auto border-b border-gray-100 bg-white px-3 sm:px-5">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => handleTabClick(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-all duration-200 ${activeTab === tab ? "border-violet-600 font-medium text-violet-600" : "border-transparent text-gray-400 hover:text-gray-700"}`}
          >{tab}</button>
        ))}
      </div>

      <div className="transition-all duration-200" style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(6px)" : "translateY(0px)" }}>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {visible === "Overview" && (
          <div className="space-y-4 p-3 sm:p-5">
            <div className="rounded-xl border border-gray-300 bg-white p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Permissions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission, index) => (
                  <div key={`${permission}-${index}`} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600"><Check size={10} strokeWidth={3} /></div>
                    {permission}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => <StatCard key={card.label} label={card.label} value={card.value} change={card.change} changeUp={card.changeUp} />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-800"><Activity size={15} className="text-violet-500" />Recent Activity</div>
                {queryFlow.length ? (
                  <div className="space-y-4 p-4">
                    {queryFlow.slice(0, 5).map((query) => {
                      const presentation = getRecentQueryPresentation(query);
                      return (
                        <div key={query.id} className="flex items-center justify-between rounded-2xl border border-slate-300/80 px-4 py-4 transition-colors duration-150 hover:bg-slate-50">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs ${presentation.iconBg}`}>{presentation.icon}</div>
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-700">
                                <span>{presentation.label}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${presentation.pillClass}`}>{presentation.pill}</span>
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><UserRound size={12} className="text-gray-400" /><span>{query.agency} → {query.destination}</span></p>
                            </div>
                          </div>
                          <span className="ml-3 whitespace-nowrap text-xs text-gray-400">{query.time}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : <EmptyState message="No queries available." />}
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-800"><Activity size={15} className="text-blue-500" />Team Performance</div>
                <PerformanceBars rows={performance} animate={barsReady} />
              </div>
            </div>
          </div>
        )}

        {/* ── QUERIES ──────────────────────────────────────────── */}
        {visible === "Queries" && (
          <div className="p-3 sm:p-5">
            {/* Header bar */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Pending Queries & Escalations</h2>
                <p className="mt-0.5 text-xs text-gray-400">{queryCount} total entries</p>
              </div>
            </div>

            {queries.length ? (
              <div className="space-y-2.5">
                {queries.map((query, i) => (
                  <motion.div
                    key={query.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:border-violet-100 hover:shadow-sm"
                  >
                    {/* Left accent stripe */}
                    <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${query.adminCoordinationStatus === "pending_admin_reply" ? "bg-orange-400" : "bg-violet-200"}`} />

                    <div className="px-5 py-4 pl-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        {/* Left: avatar + info */}
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${query.bg} ${query.color}`}>
                            {query.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">{query.name}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${query.statusClass || "bg-blue-100 text-blue-700"}`}>{query.status}</span>
                              {query.adminCoordinationStatus === "pending_admin_reply" && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">Reply Needed</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-400">{query.queryId} · {query.destination}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">Ops: {query.opsStatusLabel || "—"}</p>
                          </div>
                        </div>

                        {/* Right: time + actions */}
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          <span className="text-xs text-gray-400">{query.time}</span>
                          <button type="button" onClick={() => setSelectedQuotationQuery(query)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
                          >
                            <Eye size={12} />View Quotations
                          </button>
                          {query.adminCoordinationStatus === "pending_admin_reply" && (
                            <button onClick={() => handleOpenReplyModal(query)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700"
                            >
                              <Send size={11} />Reply to Ops
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Escalation note */}
                      {query.opsEscalationNote && (
                        <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 px-3.5 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Ops note</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-700">{query.opsEscalationNote}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{query.opsEscalationBy || "Operations"}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
                <p className="text-sm text-gray-400">No pending queries found.</p>
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS ─────────────────────────────────────────── */}
        {visible === "Bookings" && (
          <div className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Active Bookings</h2>
                <p className="mt-0.5 text-xs text-gray-400">{bookingCount} total bookings</p>
              </div>
            </div>

            {bookings.length ? (
              <div className="space-y-2">
                {bookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3.5 transition-all duration-200 hover:border-blue-100 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left: destination + agency */}
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Icon circle */}
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-800">
                          {booking.destination}
                          {/* status dot + label */}
                          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${bookingStatusDot[booking.status] || "bg-gray-300"}`} />
                            {booking.status}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{booking.agency} · Ref: <span className="font-mono">{booking.queryId}</span></p>
                      </div>
                    </div>

                    {/* Right: meta chips */}
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <span className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs text-gray-500">{booking.date}</span>
                      <span className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">{booking.pax} pax</span>
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${booking.statusClass}`}>{booking.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
                <p className="text-sm text-gray-400">No active bookings found.</p>
              </div>
            )}
          </div>
        )}

        {/* ── VOUCHERS ─────────────────────────────────────────── */}
        {visible === "Vouchers" && (
          <div className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Generated Vouchers</h2>
                <p className="mt-0.5 text-xs text-gray-400">{voucherCount} total vouchers</p>
              </div>
            </div>

            {vouchers.length ? (
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {vouchers.map((voucher, i) => (
                  <motion.div
                    key={voucher.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: i * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-teal-100 hover:shadow-sm"
                  >
                    {/* Top: voucher num + status */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                          <ReceiptText size={14} />
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-700">{voucher.num}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${voucherStatusPill[voucher.status] || voucherStatusPill.Pending}`}>{voucher.status}</span>
                    </div>

                    {/* Agency + destination */}
                    <p className="text-sm font-semibold text-gray-800">{voucher.agency}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{voucher.destination}</p>

                    {/* Footer: date */}
                    <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2.5">
                      <span className="text-[11px] text-gray-400">Generated</span>
                      <span className="text-[11px] font-medium text-gray-600">{voucher.date}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
                <p className="text-sm text-gray-400">No vouchers available.</p>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS ──────────────────────────────────────────── */}
        {visible === "Reports" && (
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {reports.length ? (
                reports.map((report, index) => (
                  <div key={`${report.label}-${index}`} className="rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="text-3xl font-medium text-gray-800">{report.value}</div>
                    <div className="mt-1 text-xs text-gray-400">{report.label}</div>
                    <MiniBarChart bars={report.bars} color={report.color} animate={miniReady} />
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-gray-100 bg-white"><EmptyState message="No report metrics available." /></div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedQuotationQuery ? <QuotationTrackerModal query={selectedQuotationQuery} onClose={() => setSelectedQuotationQuery(null)} /> : null}
      </AnimatePresence>

      {/* Reply Modal */}
      {selectedEscalation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Admin Reply</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedEscalation.queryId} - {selectedEscalation.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedEscalation.destination}</p>
              </div>
              <button onClick={handleCloseReplyModal} disabled={replySubmitting} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"><X size={16} /></button>
            </div>
            {selectedEscalation.opsEscalationNote ? (
              <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Latest ops note</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{selectedEscalation.opsEscalationNote}</p>
                <p className="mt-2 text-[11px] text-slate-500">{selectedEscalation.opsEscalationBy || "Operations"}</p>
              </div>
            ) : null}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">Reply for Ops</label>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write the admin decision, approval note, or next step for operations..."
                className="min-h-[140px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100" rows={6}
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={handleCloseReplyModal} disabled={replySubmitting} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-70">Cancel</button>
              <button onClick={handleSubmitReply} disabled={replySubmitting} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                {replySubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                Send Reply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
