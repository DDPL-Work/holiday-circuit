import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../../../utils/Api";
import CreateNewQueries from "../../../modal/CreateNewQueries.Modal";

const statusStyles = {
  "In Progress": "bg-amber-50 text-amber-750 border border-amber-150/70",
  Quoted: "bg-emerald-50 text-emerald-750 border border-emerald-150/70",
  Overdue: "bg-rose-50 text-rose-650 border border-rose-150/70 animate-pulse",
  New: "bg-sky-50 text-sky-750 border border-sky-150/70",
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

const PAGE_SIZE = 8;

const formatDateTimeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function IconSend({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconInbox({ size = 17, color = "#378ADD" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconSearch({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFilter({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconChevronLeft({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconEye({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DetailModal({ query, onClose }) {
  const navigate = useNavigate();
  const [quotationHistory, setQuotationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);

  const handleEditQuotation = (quotation) => {
    if (!query?.builderState?._id) {
      toast.error("Query details are incomplete for quotation editing.");
      return;
    }

    navigate("/ops/quotation-builder", {
      state: {
        ...query.builderState,
        editQuotationId: quotation?.id || "",
      },
    });
    onClose();
  };

  useEffect(() => {
    const fetchQuotationHistory = async () => {
      if (!query?.queryObjectId) {
        setQuotationHistory([]);
        setError("Quotation tracker is unavailable for this query");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const { data } = await API.get(`/ops/manager/queries/${query.queryObjectId}/quotations`);
        setQuotationHistory(data?.data?.quotations || []);
      } catch (err) {
        setQuotationHistory([]);
        setError(err?.response?.data?.message || "Failed to load quotation history");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationHistory();
  }, [query?.queryObjectId, reloadSeed]);

  const shouldCenterSingleCard = !loading && !error && quotationHistory.length === 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="finance-transparent-scrollbar fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(10, 15, 35, 0.65)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 18 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-[1040px] my-auto max-h-[92vh] flex flex-col"
      >
        <div className="max-w-[1040px] w-full mx-auto mb-3 px-1 pr-10 sm:pr-12">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {query.id}
            </span>
            <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "16px" }}>.</span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-lg truncate max-w-full"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {query.client} - {query.destination}
            </span>
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(212,242,61,0.12)", color: "rgba(212,242,61,0.95)", border: "1px solid rgba(212,242,61,0.2)" }}
            >
              {loading ? "Loading attempts..." : `${quotationHistory.length} quotation attempt${quotationHistory.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-0 right-0 sm:right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all text-lg leading-none shrink-0 cursor-pointer z-10"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.25)";
            event.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.12)";
            event.currentTarget.style.color = "rgba(255,255,255,0.85)";
          }}
        >
          &times;
        </button>

        {loading ? (
          <div
            className="rounded-2xl px-6 py-10 min-h-[40vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full border-2 border-white/20 border-t-[#d4f23d] animate-spin"
              aria-hidden="true"
            />
            <p className="text-sm font-medium mt-4 text-white">Loading quotation attempts...</p>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              background: "rgba(127, 29, 29, 0.2)",
              border: "1px solid rgba(252, 165, 165, 0.24)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <div>
              <p className="text-sm font-semibold text-white">Quotation tracker unavailable</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>{error}</p>
            </div>
            <button
              onClick={() => setReloadSeed((value) => value + 1)}
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold bg-[#d4f23d] text-gray-900 hover:bg-[#c5e535] transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : quotationHistory.length === 0 ? (
          <div
            className="rounded-2xl p-6 sm:p-8 min-h-[40vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <p className="text-base font-semibold text-white">No quotation attempts yet</p>
            <p className="text-xs sm:text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Is query ke liye abhi tak koi quotation create ya send nahi hua hai.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1 thin-scrollbar max-h-[calc(92vh-70px)]">
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1040px] mx-auto ${shouldCenterSingleCard ? "md:max-w-[520px]" : ""}`}
            >
              {quotationHistory.map((quotation, index) => (
                <motion.div
                  key={quotation.id || quotation.attemptNumber}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut", delay: index * 0.04 }}
                  className="w-full rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                          Quotation {quotation.attemptNumber}
                        </span>
                      </div>
                      {quotation.isLatest && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#d4f23d]/90 text-gray-900">
                          Latest
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-semibold leading-tight text-white">
                          {quotation.quotationNumber || `Quotation ${quotation.attemptNumber}`}
                        </h3>
                        <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${quotationStatusStyles[quotation.status] || quotationStatusStyles.Pending}`}>
                          {quotation.displayStatus || quotation.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.52)" }}>
                        Created {quotation.createdAtLabel || formatDateTimeLabel(quotation.createdAt) || "-"}
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="text-xl sm:text-2xl font-semibold text-white">{quotation.amount}</p>
                      {quotation.agentRemark ? (
                        <p className="text-xs mt-1 font-medium" style={{ color: "rgba(254, 178, 178, 0.95)" }}>
                          Remark: {quotation.agentRemark}
                        </p>
                      ) : (
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {quotationStatusCopy[quotation.displayStatus || quotation.status] || quotationStatusCopy.Pending}
                        </p>
                      )}
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {[
                        `Valid till: ${quotation.validTill || "Not shared"}`,
                        `Contents: ${quotation.serviceCount} services`,
                        `Quote type: ${quotation.quoteCategory || "Standard"}`,
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs tracking-wide font-medium min-w-0" style={{ color: "rgba(255,255,255,0.72)" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,242,61,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Last update {quotation.updatedAtLabel || quotation.createdAtLabel || "-"}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditQuotation(quotation)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                        style={{
                          background: "rgba(212,242,61,0.95)",
                          color: "#162033",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toast("Preview action coming soon")}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.82)",
                          borderColor: "rgba(255,255,255,0.14)",
                        }}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function AllTeamQueries() {
  const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [queries, setQueries] = useState([]);
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedQueryToEdit, setSelectedQueryToEdit] = useState(null);

  const loadQueries = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/ops/manager/queries");
      setQueries(data?.data?.queries || []);
      setDateLabel(data?.data?.dateLabel || "");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load team queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const handleSubmitReport = async () => {
    try {
      setReportSubmitting(true);
      const { data } = await API.post("/ops/manager/report");
      setSubmitted(true);
      toast.success(data?.message || "Report submitted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const statuses = useMemo(
    () => ["All", ...new Set(queries.map((item) => item.status).filter(Boolean))],
    [queries],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return queries.filter((query) => {
      const matchSearch =
        query.id.toLowerCase().includes(normalizedSearch) ||
        query.client.toLowerCase().includes(normalizedSearch) ||
        query.destination.toLowerCase().includes(normalizedSearch) ||
        query.assignedTo.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === "All" || query.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [queries, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs text-gray-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-700">All Team Queries</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-gray-500">Loading...</span>
          </div>
          <div className="text-[11px] sm:text-xs">
            Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span>
          </div>
        </div>
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <div className="h-7 w-48 rounded bg-gray-200" />
                <div className="h-4 w-72 rounded bg-gray-200" />
              </div>
              <div className="h-10 w-40 rounded-lg bg-gray-200" />
            </div>
            <div className="h-[480px] rounded-xl border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <div className="bg-white border-b border-gray-200 px- sm:px- lg:px- py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs text-gray-500">

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-700">All Team Queries</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-gray-500">{dateLabel || "Operations Manager View"}</span>
        </div>
        <div className="text-[11px] sm:text-xs">
          Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px- sm:px- lg:px- mt-4 sm:mt-5 pb-10 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-black bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent tracking-tight leading-tight">
              All Team Queries
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2 shrink-0" />
              Filtered view of all queries assigned to your team
            </p>
          </div>
          <button
            onClick={handleSubmitReport}
            disabled={reportSubmitting}
            className={`flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 transform active:scale-[0.98] shadow-md w-full sm:w-auto shrink-0 cursor-pointer ${
              submitted
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 cursor-default"
                : "bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#2563eb] hover:from-[#1e3a8a] hover:via-[#2563eb] hover:to-[#3b82f6] text-white hover:shadow-lg hover:shadow-blue-500/15"
            } ${reportSubmitting ? "opacity-70 cursor-wait" : ""}`}
          >
            <IconSend />
            {reportSubmitting ? "Submitting..." : submitted ? "Report Submitted!" : "Submit Team Report"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl  mt-4 sm:mt-5">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/50 to-white px- sm:px- py- sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90">
                <IconInbox size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-[16px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Query Tracker
                </h2>
                <p className="text-xs sm:text-[12px] text-slate-500 font-medium">Live operational queries and quotation tracker</p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-black via-slate-900 to-blue-950 px-3.5 py-1 text-xs font-extrabold text-white border border-slate-800/30 self-start sm:self-auto shrink-0">
              {filtered.length} total queries
            </span>
          </div>

          {error && (
            <div className="m-4 sm:m-6 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-600 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={loadQueries}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div className="px- sm:px- pt- sm:pt-4 pb-2 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2.5 border border-slate-200 bg-slate-50/30 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 rounded-full px-4 py-2 transition duration-200 flex-1 min-w-0">
              <IconSearch />
              <input
                type="text"
                placeholder="Search queries..."
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="outline-none bg-transparent text-slate-700 placeholder-slate-400 w-full text-xs sm:text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/30 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 rounded-full px-4 py-2 transition duration-200 cursor-pointer w-full sm:w-auto shrink-0">
              <IconFilter />
              <select
                value={statusFilter}
                onChange={(event) => handleFilterChange(event.target.value)}
                className="outline-none bg-transparent text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer py-0.5 w-full sm:w-auto"
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block thin-scrollbar overflow-x-auto min-h-[200px]">
            <table className="min-w-[1050px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "115px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "125px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "170px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 ">
                  <th className="px- py-3.5 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Query ID
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Client
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Destination
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Assigned To
                  </th>
                  <th className="px-2 py-3.5 text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Deadline
                  </th>
                  <th className="px-4 py-3.5 text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Est. Amount
                  </th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#35507a] whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-sm text-slate-400 py-10">
                      No queries match your search.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((query) => (
                    <tr
                      key={query.queryObjectId || query.id}
                      className="border-b border-slate-200/90 hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/30 hover:to-transparent transition-all duration-200"
                    >
                      <td className="px- py-2 text-left align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-slate-800 font-mono tracking-tight whitespace-nowrap">{query.id}</span>
                          {query.hasReminder && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Reminder set" />
                          )}
                          {query.hasNote && (
                            <span className="flex h-2 w-2 rounded-full bg-amber-400" title="Internal Note Added" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2 text-left align-middle">
                        <span className="text-[12px] text-slate-700 font-semibold">{query.client}</span>
                      </td>
                      <td className="px-5 py-3 text-left align-middle">
                        <span className="text-[12px] text-slate-650 font-medium">{query.destination}</span>
                      </td>
                      <td className="px-5 py-3 text-left align-middle">
                        <span className="text-[12px] text-slate-700 font-semibold truncate block">{query.assignedTo}</span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <span className={`inline-flex items-center justify-center text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusStyles[query.status] || statusStyles["In Progress"]}`}>
                          {query.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center align-middle">
                        <span className={`inline-flex items-center justify-center text-[11.5px] font-extrabold tracking-tight px-2.5 py-0.5 rounded-lg whitespace-nowrap ${query.deadlineRed ? "text-rose-600 bg-rose-50 border border-rose-100 animate-pulse" : "text-slate-650 bg-slate-50 border border-slate-100"}`}>
                          {query.deadline}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle font-mono">
                        <span className="text-[13.5px] font-bold text-slate-800 whitespace-nowrap">{query.amount}</span>
                      </td>
                      <td className="px-6 py-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelected(query)}
                            className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white shadow-xs hover:shadow border border-slate-800/40 active:scale-[0.98] transition duration-150 font-extrabold cursor-pointer"
                            title="View quotation tracker"
                          >
                            <IconEye size={12} />
                            View
                          </button>

                          <button
                            onClick={() => {
                              const isConfirmed = ["Confirmed", "Vouchered", "Invoice_Requested"].includes(query.opsStatus) || query.agentStatus === "Confirmed";
                              if (isConfirmed) {
                                toast.custom((t) => (
                                  <div
                                    className={`${
                                      t.visible ? 'animate-in fade-in duration-200' : 'animate-out fade-out duration-200'
                                    } bg-white border-l-[4px] border-[#2563eb] px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-start gap-3 pointer-events-auto w-full max-w-[420px] rounded-r-lg`}
                                  >
                                    <div className="mt-0.5 text-[#2563eb] shrink-0">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-[13px] font-bold text-slate-800 leading-none">Info</h4>
                                        <button
                                          onClick={() => toast.dismiss(t.id)}
                                          className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer bg-transparent border-none outline-none p-0 transition-colors flex items-center justify-center"
                                          aria-label="Close notification"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                          </svg>
                                        </button>
                                      </div>
                                      <p className="text-[11px] text-slate-600 leading-snug font-medium">
                                        Booking has been confirmed. This query cannot be edited.
                                      </p>
                                    </div>
                                  </div>
                                ), {
                                  duration: 4000,
                                  position: 'top-right'
                                });
                              } else {
                                setSelectedQueryToEdit(query);
                                setOpenEditModal(true);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#78350f] hover:from-[#78350f] hover:to-[#b45309] text-white shadow-xs hover:shadow border border-slate-800/40 active:scale-[0.98] transition duration-150 font-extrabold cursor-pointer"
                            title="Edit query details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden px-4 pb-4 space-y-3">
            {pageRows.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl">
                No queries match your search.
              </div>
            ) : (
              pageRows.map((query) => (
                <div
                  key={query.queryObjectId || query.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition duration-150 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono tracking-tight text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {query.id}
                      </span>
                      {query.hasReminder && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Reminder set" />
                      )}
                      {query.hasNote && (
                        <span className="flex h-2 w-2 rounded-full bg-amber-400" title="Internal Note Added" />
                      )}
                    </div>
                    <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${statusStyles[query.status] || statusStyles["In Progress"]}`}>
                      {query.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client</span>
                      <span className="font-semibold text-slate-800 truncate block">{query.client}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
                      <span className="font-semibold text-slate-700 truncate block">{query.destination}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned To</span>
                      <span className="font-medium text-slate-700 truncate block">{query.assignedTo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Amount</span>
                      <span className="font-bold text-slate-900 font-mono block">{query.amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Deadline</span>
                      <span className={`inline-flex items-center justify-center text-[10.5px] font-bold px-2 py-0.5 rounded-md ${query.deadlineRed ? "text-rose-600 bg-rose-50 border border-rose-100 animate-pulse" : "text-slate-600 bg-slate-50 border border-slate-100"}`}>
                        {query.deadline}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelected(query)}
                        className="inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#1e3a8a] text-white shadow-xs font-bold active:scale-[0.98] transition cursor-pointer"
                      >
                        <IconEye size={12} />
                        View
                      </button>

                      <button
                        onClick={() => {
                          const isConfirmed = ["Confirmed", "Vouchered", "Invoice_Requested"].includes(query.opsStatus) || query.agentStatus === "Confirmed";
                          if (isConfirmed) {
                            toast.custom((t) => (
                              <div
                                className={`${
                                  t.visible ? 'animate-in fade-in duration-200' : 'animate-out fade-out duration-200'
                                } bg-white border-l-[4px] border-[#2563eb] px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-start gap-3 pointer-events-auto w-full max-w-[360px] rounded-lg`}
                              >
                                <div className="mt-0.5 text-[#2563eb] shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                  </svg>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-bold text-slate-800 leading-none">Info</h4>
                                    <button
                                      onClick={() => toast.dismiss(t.id)}
                                      className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer bg-transparent border-none outline-none p-0 flex items-center justify-center"
                                      aria-label="Close notification"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-snug font-medium">
                                    Booking has been confirmed. This query cannot be edited.
                                  </p>
                                </div>
                              </div>
                            ), { duration: 4000, position: 'top-right' });
                          } else {
                            setSelectedQueryToEdit(query);
                            setOpenEditModal(true);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-[#78350f] text-white shadow-xs font-bold active:scale-[0.98] transition cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/20">
              <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} queries
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={safePage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <IconChevronLeft />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                      pageNumber === safePage
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={safePage >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <IconChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && <DetailModal query={selected} onClose={() => setSelected(null)} />}
        {openEditModal && (
          <CreateNewQueries
            queryToEdit={selectedQueryToEdit}
            isOpsView={true}
            onCreated={() => {
              loadQueries();
            }}
            onClose={() => {
              setOpenEditModal(false);
              setSelectedQueryToEdit(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
