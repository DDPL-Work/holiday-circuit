import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../../../utils/Api";

const statusStyles = {
  "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
  Quoted: "bg-green-50 text-green-700 border border-green-200",
  Overdue: "bg-red-50 text-red-600 border border-red-200",
  New: "bg-sky-50 text-sky-700 border border-sky-200",
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
      className="finance-transparent-scrollbar fixed inset-0 z-[60] flex items-start justify-center px-4 pt-8 pb-6 overflow-y-auto"
      style={{ background: "rgba(10, 15, 35, 0.6)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 18 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-[1320px]"
      >
        <div className="max-w-[1040px] mx-auto mb-2 px-1 pr-12">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {query.id}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "16px" }}>.</span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-lg"
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
          className="absolute top-0 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all text-base leading-none shrink-0"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.2)";
            event.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.1)";
            event.currentTarget.style.color = "rgba(255,255,255,0.7)";
          }}
        >
          &times;
        </button>

        {loading ? (
          <div
            className="rounded-2xl px-6 py-10 min-h-[60vh] flex flex-col items-center justify-center text-center"
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
            className="rounded-2xl p-6 flex items-center justify-between gap-4"
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
              className="rounded-xl px-4 py-2 text-sm font-semibold bg-[#d4f23d] text-gray-900 hover:bg-[#c5e535] transition"
            >
              Retry
            </button>
          </div>
        ) : quotationHistory.length === 0 ? (
          <div
            className="rounded-2xl p-8 min-h-[60vh] flex flex-col items-center justify-center text-center"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <p className="text-base font-semibold text-white">No quotation attempts yet</p>
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Is query ke liye abhi tak koi quotation create ya send nahi hua hai.
            </p>
          </div>
        ) : (
          <div
            className={`flex flex-wrap gap-4 max-w-[1040px] mx-auto ${shouldCenterSingleCard ? "min-h-[calc(100vh-220px)] items-center justify-center" : "items-start"}`}
          >
            {quotationHistory.map((quotation, index) => (
              <motion.div
                key={quotation.id || quotation.attemptNumber}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut", delay: index * 0.04 }}
                className="w-full md:w-[calc(50%-0.5rem)] max-w-[512px] rounded-2xl px-5 py-4 flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
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
                    <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-[#d4f23d]/90 text-gray-900">
                      Latest
                    </span>
                  )}
                </div>

                <div className="mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-semibold leading-tight text-white">
                      {quotation.quotationNumber || `Quotation ${quotation.attemptNumber}`}
                    </h3>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${quotationStatusStyles[quotation.status] || quotationStatusStyles.Pending}`}>
                      {quotation.displayStatus || quotation.status || "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.52)" }}>
                    Created {quotation.createdAtLabel || formatDateTimeLabel(quotation.createdAt) || "-"}
                  </p>
                </div>

                <div className="mb-2">
                  <p className="text-2xl font-semibold text-white">{quotation.amount}</p>
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

                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                  {[
                    `Valid till: ${quotation.validTill || "Not shared"}`,
                    `Contents: ${quotation.serviceCount} services`,
                    `Quote type: ${quotation.quoteCategory || "Standard"}`,
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs tracking-wide font-medium min-w-0" style={{ color: "rgba(255,255,255,0.72)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,242,61,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Last update {quotation.updatedAtLabel || quotation.createdAtLabel || "-"}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditQuotation(quotation)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
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
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border"
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
        <div className="bg-white border-b border-gray-200 px-2 py-3 flex justify-between items-center text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-700">All Team Queries</span>
            <span className="mx-2 text-gray-300">|</span>
            Loading...
          </div>
          <div>
            Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-2 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
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
      <div className="bg-white border-b border-gray-200 px-1 py-2 flex justify-between items-center text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">All Team Queries</span>
          <span className="mx-2 text-gray-300">|</span>
          {dateLabel || "Operations Manager View"}
        </div>
        <div>
          Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-[2px] mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-medium text-gray-900">All Team Queries</h1>
            <p className="text-sm text-gray-500 mt-1">Filtered view of all queries assigned to your team</p>
          </div>
          <button
            onClick={handleSubmitReport}
            disabled={reportSubmitting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              submitted ? "bg-green-600 text-white cursor-default" : "bg-gray-900 text-white hover:bg-gray-700"
            } ${reportSubmitting ? "opacity-70 cursor-wait" : ""}`}
          >
            <IconSend />
            {reportSubmitting ? "Submitting..." : submitted ? "Report Submitted!" : "Submit Team Report"}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 mt-3">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <IconInbox />
              <span className="text-base font-medium text-gray-900">Query Tracker</span>
            </div>
            <span className="text-xs text-gray-400">{filtered.length} total queries</span>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={loadQueries}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 flex-1 min-w-48">
              <IconSearch />
              <input
                type="text"
                placeholder="Search queries..."
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="outline-none bg-transparent text-gray-700 placeholder-gray-400 w-full text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500">
              <IconFilter />
              <select
                value={statusFilter}
                onChange={(event) => handleFilterChange(event.target.value)}
                className="outline-none bg-transparent text-gray-600 text-sm cursor-pointer"
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="thin-scrollbar overflow-x-auto min-h-[200px]">
            <table className="min-w-[1050px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "130px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "80px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200">
                  {["Query ID", "Client", "Destination", "Assigned To", "Status", "Deadline", "Est. Amount", ""].map((header) => (
                    <th key={header} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide py-2.5 pr-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-sm text-gray-400 py-10">
                      No queries match your search.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((query) => (
                    <tr
                      key={query.queryObjectId || query.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{query.id}</span>
                          {query.hasReminder && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Reminder set" />
                          )}
                          {query.hasNote && (
                            <span className="flex h-2 w-2 rounded-full bg-amber-400" title="Internal Note Added" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-sm text-gray-700">{query.client}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-sm text-gray-700">{query.destination}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-sm text-gray-700 truncate">{query.assignedTo}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[query.status] || statusStyles["In Progress"]}`}>
                          {query.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-sm font-medium ${query.deadlineRed ? "text-red-500" : "text-gray-700"}`}>
                          {query.deadline}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-sm font-medium text-gray-800">{query.amount}</span>
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => setSelected(query)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition text-xs font-medium"
                          title="View quotation tracker">
                          <IconEye />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={safePage <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <IconChevronLeft />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-medium transition ${
                      pageNumber === safePage
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={safePage >= totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
      </AnimatePresence>
    </div>
  );
}
