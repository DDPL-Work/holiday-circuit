import {
  Search,
  Calendar,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  FileText,
  MapPin,
  User,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import BookingDetailsModal from "../../modal/BookingDetails";
import API from "../../utils/Api.js";

const getTravelerDocumentReviewMeta = (query = {}) => {
  const verificationStatus = String(query?.travelerDocumentVerification?.status || "Draft").trim();
  const auditTrail = Array.isArray(query?.travelerDocumentAuditTrail)
    ? query.travelerDocumentAuditTrail
    : [];
  const hasPreviousRejection = auditTrail.some(
    (entry) => String(entry?.status || "").trim() === "Rejected",
  );

  if (verificationStatus === "Verified") {
    return {
      status: "Verified",
      label: "Documents Verified",
      tone: "bg-emerald-100 text-emerald-700",
    };
  }

  if (verificationStatus === "Rejected") {
    return {
      status: "Rejected",
      label: "Correction Required",
      tone: "bg-red-100 text-red-600",
    };
  }

  if (verificationStatus === "Pending") {
    return {
      status: "Pending",
      label: hasPreviousRejection ? "Resubmitted for Review" : "Pending First Review",
      tone: "bg-blue-100 text-blue-700",
    };
  }

  return {
    status: "Draft",
    label: "Docs Not Submitted",
    tone: "bg-slate-100 text-slate-600",
  };
};

const getRowBgColor = (row) => {
  const q = row._raw;
  if (!q) return "";

  const TERMINAL_OPS_STATUSES = new Set(["Rejected", "Vouchered", "Payment_Completed"]);
  const TERMINAL_AGENT_STATUSES = new Set(["Rejected"]);

  const opsStatus = q.opsStatus || "";
  const agentStatus = q.agentStatus || "";
  if (TERMINAL_OPS_STATUSES.has(opsStatus) || TERMINAL_AGENT_STATUSES.has(agentStatus)) {
    return "";
  }

  const isQuoteSent =
    q.quotationStatus === "Sent_To_Agent" ||
    (Array.isArray(q.activityLog) &&
      q.activityLog.some((log) => String(log?.action).trim() === "Quote Sent"));

  if (isQuoteSent) {
    return "";
  }

  if (!q.createdAt) return "";
  const createdAt = new Date(q.createdAt);
  if (Number.isNaN(createdAt.getTime())) return "";

  const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed > 48) {
    return "bg-red-50/70 hover:bg-red-100/60";
  } else if (hoursElapsed >= 24) {
    return "bg-amber-50/70 hover:bg-amber-100/60";
  }

  return "";
};

const getRowDot = (row) => {
  const q = row._raw;
  if (!q) return null;

  const TERMINAL_OPS_STATUSES = new Set(["Rejected", "Vouchered", "Payment_Completed"]);
  const TERMINAL_AGENT_STATUSES = new Set(["Rejected"]);

  const opsStatus = q.opsStatus || "";
  const agentStatus = q.agentStatus || "";
  if (TERMINAL_OPS_STATUSES.has(opsStatus) || TERMINAL_AGENT_STATUSES.has(agentStatus)) {
    return null;
  }

  const isQuoteSent =
    q.quotationStatus === "Sent_To_Agent" ||
    (Array.isArray(q.activityLog) &&
      q.activityLog.some((log) => String(log?.action).trim() === "Quote Sent"));

  if (isQuoteSent) {
    return null;
  }

  if (!q.createdAt) return null;
  const createdAt = new Date(q.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed > 48) {
    return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Exceeded 48h deadline" />;
  } else if (hoursElapsed >= 24) {
    return <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Exceeded 24h warning" />;
  }

  return null;
};

export default function BookingManagementHub() {
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [docReviewFilter, setDocReviewFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [paxFilter, setPaxFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDocumentBooking, setSelectedDocumentBooking] = useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const itemsPerPage = 8;
  
  const statusTabs = [
    { id: "All", label: "All Status" },
    { id: "New_Query", label: "New Query" },
    { id: "Received_Query", label: "Received Query" },
    { id: "Pending_Accept", label: "Pending" },
    { id: "Booking_Accepted", label: "Query Accepted" },
    { id: "Invoice_Requested", label: "Amount/Docs Pending" },
    { id: "Confirmed", label: "Confirmed" },
    { id: "Vouchered", label: "Vouchered" },
    { id: "Revision_Requested", label: "Quotation Rejected" },
  ];

  const activeAdvancedFiltersCount =
    (docReviewFilter !== "All" ? 1 : 0) +
    (urgencyFilter !== "All" ? 1 : 0) +
    (paxFilter !== "All" ? 1 : 0);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await API.get("/ops/queries");
      const queries = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.queries)
            ? res.data.queries
            : [];

      setRows(
        queries.map((q) => {
          const formatDate = (date) =>
            new Date(date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

          const totalPax = (q.numberOfAdults || 0) + (q.numberOfChildren || 0);
          const latestReassignment = Array.isArray(q.reassignmentHistory)
            ? q.reassignmentHistory[q.reassignmentHistory.length - 1]
            : null;
          const wasMovedToCurrentUser =
            String(latestReassignment?.toUser || latestReassignment?.toUser?._id || "") === currentUserId;
          const isReceivedNewQuery =
            wasMovedToCurrentUser && ["New_Query", "Pending_Accept"].includes(String(q.opsStatus || ""));
          const travelerDocumentReview = getTravelerDocumentReviewMeta(q);

          return {
            id: q.queryId,
            agent: q.agent?.name || "-",
            assignedToId: String(q.assignedTo?._id || q.assignedTo?.id || ""),
            assignedTo: q.assignedTo?.name || q.assignedTo?.email || "Unassigned",
            receivedFrom: wasMovedToCurrentUser ? latestReassignment?.fromName || "" : "",
            destination: q.destination,
            date: `${formatDate(q.startDate)} - ${formatDate(q.endDate)}`,
            startDate: q.startDate,
            adults: Number(q.numberOfAdults || 0),
            children: Number(q.numberOfChildren || 0),
            pax: totalPax,
            status:
              isReceivedNewQuery
                ? "Received_Query"
                : q.agentStatus === "Revision Requested" || q.opsStatus === "Revision_Query"
                ? "Revision_Requested"
                : q.opsStatus === "Rejected"
                  ? "Pending_Accept"
                  : q.opsStatus || "New_Query",
            travelerDocumentReview,
            _raw: q,
          };
        }),
      );
    } catch (error) {
      console.error("Error fetching queries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const statusConfig = {
    New_Query: {
      color: "bg-purple-100 text-purple-600",
      label: "New_Query",
      icon: <Clock className="h-3 w-3" />,
    },
    Received_Query: {
      color: "bg-amber-100 text-amber-700",
      label: "Received Query",
      icon: <FileText className="h-3 w-3" />,
    },
    Pending_Accept: {
      color: "bg-orange-100 text-orange-600",
      label: "Pending Accept",
      icon: <Clock className="h-3 w-3" />,
    },
    Revision_Requested: {
      color: "bg-rose-100 text-rose-700",
      label: "Quotation Rejected",
      icon: <FileText className="h-3 w-3" />,
    },
    Booking_Accepted: {
      color: "bg-blue-100 text-blue-600",
      label: "Query_Accepted",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    Invoice_Requested: {
      color: "bg-indigo-100 text-indigo-700",
      label: "Amount/Docs Pending",
      icon: <FileText className="h-3 w-3" />,
    },
    Confirmed: {
      color: "bg-cyan-100 text-cyan-600",
      label: "Confirmed",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    Vouchered: {
      color: "bg-green-100 text-green-600",
      label: "Vouchered",
      icon: <FileText className="h-3 w-3" />,
    },
  };

  const filteredRows = rows.filter((row) => {
    const term = search.toLowerCase();
    const matchesSearch =
      row.id.toLowerCase().includes(term) ||
      row.agent.toLowerCase().includes(term) ||
      row.receivedFrom.toLowerCase().includes(term) ||
      row.destination.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "All" || row.status === statusFilter;

    const matchesDate =
      !dateFilter || new Date(row.startDate).toISOString().slice(0, 10) === dateFilter;

    const matchesDocReview =
      docReviewFilter === "All" || row.travelerDocumentReview.status === docReviewFilter;

    const matchesUrgency = (() => {
      if (urgencyFilter === "All") return true;
      const q = row._raw;
      if (!q || !q.createdAt) return false;
      const hoursElapsed = (Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60);
      if (urgencyFilter === "Overdue") return hoursElapsed > 48;
      if (urgencyFilter === "Warning") return hoursElapsed >= 24 && hoursElapsed <= 48;
      return true;
    })();

    const matchesPax = (() => {
      if (paxFilter === "All") return true;
      if (paxFilter === "1-2") return row.pax >= 1 && row.pax <= 2;
      if (paxFilter === "3-5") return row.pax >= 3 && row.pax <= 5;
      if (paxFilter === "6+") return row.pax >= 6;
      return true;
    })();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDate &&
      matchesDocReview &&
      matchesUrgency &&
      matchesPax
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, docReviewFilter, urgencyFilter, paxFilter, rows.length]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`bg-white transition-opacity duration-150 ${selectedBooking || selectedDocumentBooking ? "pointer-events-none opacity-95" : "opacity-100"}`}
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#0F172A]">Booking Management Hub</h2>
          <p className="text-sm text-gray-500">Central hub for all agent requests and bookings</p>
        </div>

        <div className="mb-4">
          <div className="md:hidden relative">
            <button
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <span>{statusTabs.find(t => t.id === statusFilter)?.label || "All Status"}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${mobileDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {mobileDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden py-1 max-h-64 overflow-y-auto custom-scroll">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setMobileDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      statusFilter === tab.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden md:flex gap-6 overflow-x-auto border-b border-gray-200 pb-px thin-scrollbar">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.002 }}
          className="mb-3 flex flex-col gap-3 rounded-xl border border-gray-200 bg-[#F8FAFC] p-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex w-full items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-500 lg:max-w-md lg:flex-1">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search by Query ID, Agent, or Destination..."
              className="w-full outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="cursor-pointer text-xs outline-none"
              />
            </div>

            <button
              onClick={() => setShowMoreFilters((prev) => !prev)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                showMoreFilters || activeAdvancedFiltersCount > 0
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              More Filters
              {activeAdvancedFiltersCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {activeAdvancedFiltersCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {showMoreFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4"
          >
            <div className="flex items-center justify-between mb-3 border-b border-blue-100/70 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-blue-600" />
                Advanced Filters
              </span>
              {(activeAdvancedFiltersCount > 0 || statusFilter !== "All" || search || dateFilter) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                    setDateFilter("");
                    setDocReviewFilter("All");
                    setUrgencyFilter("All");
                    setPaxFilter("All");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Document Review Status
                </label>
                <select
                  value={docReviewFilter}
                  onChange={(e) => setDocReviewFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none cursor-pointer"
                >
                  <option value="All">All Documents Status</option>
                  <option value="Verified">Verified Docs</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Rejected">Correction Required</option>
                  <option value="Draft">Docs Not Submitted</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Deadline & Urgency
                </label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none cursor-pointer"
                >
                  <option value="All">All Deadlines</option>
                  <option value="Overdue">Overdue (&gt;48h)</option>
                  <option value="Warning">Warning (24h - 48h)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  PAX / Group Size
                </label>
                <select
                  value={paxFilter}
                  onChange={(e) => setPaxFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none cursor-pointer"
                >
                  <option value="All">All PAX Sizes</option>
                  <option value="1-2">1 - 2 PAX (Solo/Couple)</option>
                  <option value="3-5">3 - 5 PAX (Small Group)</option>
                  <option value="6+">6+ PAX (Large Group)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading agent queries...</div>
          ) : (
            <div className="thin-scrollbar overflow-x-auto overflow-y-hidden pb-2">
              <table className="min-w-[1100px] w-full text-[13px]">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="w-[90px] px-4 py-3 text-left font-medium">Query ID</th>
                    <th className="w-[140px] px-4 py-3 text-left font-medium whitespace-nowrap">Agent Name</th>
                    <th className="w-[120px] px-4 py-3 text-left font-medium">Destination</th>
                    <th className="w-[160px] px-4 py-3 text-left font-medium">Travel Date</th>
                    <th className="w-[140px] px-4 py-3 text-center font-medium">Pax</th>
                    <th className="w-[160px] px-4 py-3 text-center font-medium">Ops Status</th>
                    <th className="w-[160px] px-4 py-3 text-center font-medium">Document Review</th>
                    <th className="w-[140px] px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>

                <motion.tbody
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: {
                      transition: { staggerChildren: 0.08 },
                    },
                  }}
                >
                  {paginatedRows.length > 0 ? paginatedRows.map((row) => {
                    const status = statusConfig[row.status] || statusConfig.New_Query;
                    const isAssignedToCurrentUser =
                      currentUserId && row.assignedToId && row.assignedToId === currentUserId;
                    const isReceivedQuery = Boolean(isAssignedToCurrentUser && row.receivedFrom);

                    return (
                      <motion.tr
                        key={row.id}
                        variants={{
                          hidden: {
                            opacity: 0,
                            x: 120,
                            scale: 0.97,
                          },
                          show: {
                            opacity: 1,
                            x: 0,
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 100,
                              damping: 16,
                            },
                          },
                        }}
                        whileHover={{ x: 1 }}
                        className={`border-t border-gray-300 align-middle transition-colors ${getRowBgColor(row) || "hover:bg-gray-100"}`}
                      >
                        <td className="whitespace-nowrap px-4 py-4 align-middle font-semibold text-slate-800 text-left">
                          <div className="flex items-center gap-1.5">
                            <span>{row.id}</span>
                            {getRowDot(row)}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-left">
                          <div className="min-w-0 space-y-2 text-gray-600 ">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 shrink-0 text-yellow-500" />
                              <span className="truncate font-medium text-slate-700">{row.agent}</span>
                            </div>
                            {isReceivedQuery ? (
                              <div className="flex items-center">
                                <span className="inline-flex max-w-full whitespace-nowrap rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold leading-4 text-amber-700">
                                  Received from {row.receivedFrom}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-left">
                          <div className="flex min-w-0 items-center gap-2 text-gray-600">
                            <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                            <span className="truncate">{row.destination}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-left">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3 shrink-0 text-orange-700" />
                            <span className="whitespace-nowrap leading-5">{row.date}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-center">
                          <div className="leading-5">
                            <p className="font-medium text-slate-700">{row.pax} Pax</p>
                            <p className="text-[10px] text-gray-500 whitespace-nowrap">
                              Adults: {row.adults} | Children: {row.children}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-center">
                          <span className={`inline-flex h-8 min-w-[156px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-sm leading-none ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle text-center">
                          <span
                            className={`inline-flex min-w-[148px] items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium ${row.travelerDocumentReview.tone}`}
                          >
                            {row.travelerDocumentReview.label}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedBooking(row._raw)}
                              className="inline-flex whitespace-nowrap shrink-0 cursor-pointer items-center gap-1 rounded-2xl border px-2 py-1 text-sm text-blue-600 hover:bg-green-500 hover:text-white"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedDocumentBooking(row._raw)}
                              className="inline-flex whitespace-nowrap shrink-0 cursor-pointer items-center gap-1 rounded-2xl border border-violet-200 bg-violet-50 px-2 py-1 text-sm text-violet-700 transition-colors hover:bg-violet-600 hover:text-white"
                            >
                              <FileText className="h-3 w-3" />
                              Docs View
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-400">
                        No bookings found for the current filters.
                      </td>
                    </tr>
                  )}
                </motion.tbody>
              </table>
            </div>
          )}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row">
              <span className="text-xs font-medium text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRows.length)} of {filteredRows.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    if (
                      totalPages > 5 &&
                      index !== 0 &&
                      index !== totalPages - 1 &&
                      Math.abs(currentPage - 1 - index) > 1
                    ) {
                      if (index === 1 && currentPage > 3) {
                        return <span key={index} className="px-1 text-gray-400">...</span>;
                      }
                      if (index === totalPages - 2 && currentPage < totalPages - 2) {
                        return <span key={index} className="px-1 text-gray-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          currentPage === index + 1
                            ? "bg-slate-900 text-white"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          refresh={fetchQueries}
          viewMode="details"
          onClose={() => setSelectedBooking(null)}
        />
      )}
      {selectedDocumentBooking && (
        <BookingDetailsModal
          booking={selectedDocumentBooking}
          refresh={fetchQueries}
          viewMode="documents"
          onClose={() => setSelectedDocumentBooking(null)}
        />
      )}
    </>
  );
}
