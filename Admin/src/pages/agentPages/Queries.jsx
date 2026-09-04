import { Search, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import CreateNewQueries from "../../modal/CreateNewQueries.Modal";
import QueryDetails from "./QueryDetails.jsx";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";

/* ===== Page Animation (one time only) ===== */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const statusTabs = [
  { label: "New Query", statusKey: "Pending", param: "Pending" },
  { label: "Quote Received", statusKey: "Quote Sent", param: "Quote Sent" },
  { label: "Booking Processed", statusKey: "Client Approved", param: "Client Approved" },
  { label: "Booking Confirmed", statusKey: "Confirmed", param: "Confirmed" },
  { label: "All Queries", statusKey: "All", param: "All" },
];

const Queries = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const statusFilter = searchParams.get("status") || "Pending";
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openQueryDetails, setOpenQueryDetails] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [queries, setQueries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dueTasks, setDueTasks] = useState([]);
  const [showDueTasksPopup, setShowDueTasksPopup] = useState(false);
  const itemsPerPage = 8;

  // Close query details view when location changes or custom sidebar click event is fired
  useEffect(() => {
    const handleCloseDetails = () => {
      setOpenQueryDetails(false);
      setSelectedQuery(null);
    };

    window.addEventListener("closeQueryDetails", handleCloseDetails);
    return () => {
      window.removeEventListener("closeQueryDetails", handleCloseDetails);
    };
  }, []);

  useEffect(() => {
    setOpenQueryDetails(false);
    setSelectedQuery(null);
  }, [location.pathname, location.search, location.key]);

  // Auto-open Create New Query modal when navigated from Quick Actions (?create=true)
  useEffect(() => {
    if (searchParams.get("create") === "true" || searchParams.get("openModal") === "true") {
      setOpenModal(true);
    }
  }, [searchParams]);

  // Auto-open specific query details when id param or location.state is present
  useEffect(() => {
    const queryIdParam = searchParams.get("id") || location.state?.openQueryId || location.state?.queryId;
    if (queryIdParam && queries.length > 0 && !openQueryDetails) {
      const match = queries.find(
        (q) =>
          q._id === queryIdParam ||
          q.queryId === queryIdParam ||
          q.queryId?.replace(/^#\s*/, "") === String(queryIdParam).replace(/^#\s*/, "") ||
          q.invoice?._id === queryIdParam
      );
      if (match) {
        setSelectedQuery(match);
        setOpenQueryDetails(true);
      }
    }
  }, [searchParams, location.state, queries, openQueryDetails]);

  // ================= API =================

  const fetchQueries = async () => {
    try {
      const res = await API.get("/agent/getAllQueries");
      setQueries(res.data.queries || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQueryCreated = (createdQuery) => {
    if (!createdQuery?._id) return;

    setQueries((prevQueries) => [
      createdQuery,
      ...prevQueries.filter((query) => query._id !== createdQuery._id),
    ]);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    const loadDueTasks = async () => {
      try {
        const { data } = await API.get("/agent/query-tasks/due-today");
        const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
        setDueTasks(tasks);
        setShowDueTasksPopup(tasks.length > 0);
      } catch (error) {
        console.error("Unable to load due tasks", error);
      }
    };

    loadDueTasks();
  }, []);

  const dismissDueTasksPopup = async () => {
    const taskIds = dueTasks.map((task) => task.id).filter(Boolean);
    setShowDueTasksPopup(false);

    try {
      await API.patch("/agent/query-tasks/due-today/dismiss", { taskIds });
    } catch (error) {
      console.error("Unable to dismiss due tasks", error);
    }
  };

  const queryCounts = useMemo(() => ({
    All: queries.length,
    Pending: queries.filter((q) => q.agentStatus === "Pending" || q.agentStatus === "In Progress").length,
    "Quote Sent": queries.filter((q) => q.agentStatus === "Quote Sent").length,
    "Client Approved": queries.filter((q) => q.agentStatus === "Client Approved").length,
    Confirmed: queries.filter((q) => q.agentStatus === "Confirmed").length,
  }), [queries]);

  const handleStatusTabClick = (tab) => {
    if (tab.param && tab.param !== "Pending") {
      setSearchParams({ status: tab.param }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // ================= Helpers =================
  const getStatusBadge = (status) => {
    if (status === "Quote Sent" || status === "Quote Received") {
      return {
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        label: "Quote Received",
      };
    }

    if (status === "Pending") {
      return {
        className: "bg-amber-50 text-amber-700 border border-amber-200",
        label: "New Query",
      };
    }

    if (status === "In Progress") {
      return {
        className: "bg-sky-50 text-sky-700 border border-sky-200",
        label: "In Progress",
      };
    }

    if (status === "Revision Requested") {
      return {
        className: "bg-orange-50 text-orange-700 border border-orange-200",
        label: "Revision Requested",
      };
    }

    if (status === "Rejected") {
      return {
        className: "bg-rose-50 text-rose-700 border border-rose-200",
        label: "Rejected",
      };
    }

    if (status === "Client Approved") {
      return {
        className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
        label: "Booking Processed",
      };
    }

    if (status === "Confirmed") {
      return {
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
        label: "Booking Confirmed",
      };
    }

    return {
      className: "bg-slate-50 text-slate-700 border border-slate-200",
      label: status || "New Query",
    };
  };

  

  const formatDates = (start, end) => {
    const options = { day: "2-digit", month: "short" };
    return `${new Date(start).toLocaleDateString("en-IN", options)} - ${new Date(end).toLocaleDateString("en-IN", options)}`;
  };

  const formatPax = (adults, children) =>
    children > 0 ? `${adults} Adults, ${children} Kids` : `${adults} Adults`;

  const filteredQueries = queries.filter((query) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      query.queryId?.toLowerCase().includes(search) ||
      query.destination?.toLowerCase().includes(search) ||
      query.agentStatus?.toLowerCase().includes(search);

    if (!matchesSearch) return false;

    if (!statusFilter || statusFilter === "All") return true;

    if (statusFilter === "Pending" || statusFilter === "In Progress") {
      return query.agentStatus === "Pending" || query.agentStatus === "In Progress";
    }

    return query.agentStatus === statusFilter;
  });

  // Reset to first page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQueries = filteredQueries.slice(startIndex, startIndex + itemsPerPage);

  // ================= Details View =================
  if (openQueryDetails) {
    return (
      <QueryDetails
        onClose={() => setOpenQueryDetails(false)}
        onRefresh={fetchQueries}
        query={selectedQuery}
      />
    );
  }

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <>
        {/* Header */}
        <motion.header variants={itemVariant}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Queries</h1>
              <p className="text-sm text-gray-500">
                Manage your travel requirements and quotes.
              </p>
            </div>

            {/* Search + Create Query */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-white shadow-xs"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenModal(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#3E63DD] hover:bg-[#3252c4] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                Create Query
              </motion.button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.statusKey;
              const count = queryCounts[tab.statusKey] ?? 0;
              return (
                <button
                  key={tab.label}
                  onClick={() => handleStatusTabClick(tab)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#3E63DD] text-white shadow-[0_2px_8px_rgba(62,99,221,0.3)]"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.header>

        {/* Table */}
        <motion.div
          variants={itemVariant}
          className="bg-white shadow-xs rounded-xl overflow-hidden"
        >
          <div className="thin-scrollbar overflow-x-auto">
          
            <table className="min-w-225 w-full table-fixed text-xs">
             
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[17%]" />
              </colgroup>
              <thead className="bg-gray-50 text-gray-500 border-b-gray-200 border-b">
                <tr>
                  <th className="text-left px-6 py-2">Query ID</th>
                  <th className="text-left px-6 py-3">Destination</th>
                  <th className="text-left px-6 py-3">Dates</th>
                  <th className="text-left px-6 py-3">Pax</th>
                  <th className="text-left px-6 py-3">Status</th>
                  {/* FIX: whitespace-nowrap add kiya — "Quote Price" ek line mein rahega */}
                  <th className="text-right px-6 py-3 whitespace-nowrap">Quote Price</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {paginatedQueries.length > 0 ? (
                  paginatedQueries.map((query) => (
                    <tr
                      key={query._id}
                      className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                    >
                      <td className="px-5 py-4 align-middle">
                        <div className="leading-tight">
                          <p className="whitespace-nowrap font-semibold text-slate-900">
                            {query.queryId}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="leading-tight text-slate-700">{query.destination}</p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="leading-snug text-slate-700 whitespace-nowrap">
                          {formatDates(query.startDate, query.endDate)}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="leading-snug text-slate-700 whitespace-nowrap">
                          {formatPax(query.numberOfAdults, query.numberOfChildren)}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex w-[140px] items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium leading-none ${getStatusBadge(query.agentStatus).className}`}
                        >
                          {getStatusBadge(query.agentStatus).label}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle text-right font-medium whitespace-nowrap">
                        {query.customerBudget ? query.customerBudget : "N/A"}
                      </td>

                      {/* FIX: View & Edit buttons — padding balanced, no overflow */}
                      <td className="px-4 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition-colors whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuery(query);
                              setOpenQueryDetails(true);
                            }}
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
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </span>

                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 hover:border-amber-300 cursor-pointer transition-colors whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isConfirmed = ["Confirmed", "Vouchered", "Payment_Completed", "Invoice_Requested"].includes(query.opsStatus) || query.agentStatus === "Confirmed";
                              if (isConfirmed) {
                                toast.custom((t) => (
                                  <div
                                    className={`${
                                      t.visible ? 'animate-in fade-in duration-200' : 'animate-out fade-out duration-200'
                                    } bg-white border-l-[4px] border-[#2563eb] px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-start gap-3 pointer-events-auto`}
                                    style={{ width: '420px', minWidth: '420px', borderRadius: '0px', pointerEvents: 'auto' }}
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
                                      <p
                                        className="text-[11px] text-slate-600 leading-snug font-medium whitespace-nowrap"
                                        style={{ whiteSpace: 'nowrap' }}
                                      >
                                        Booking has been confirmed. This query cannot be edited.
                                      </p>
                                    </div>
                                  </div>
                                ), {
                                  duration: 4000,
                                  position: 'top-right'
                                });
                              } else {
                                setSelectedQuery(query);
                                setOpenEditModal(true);
                              }
                            }}
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
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                      No queries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row">
              <span className="text-xs font-medium text-gray-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredQueries.length)} of{" "}
                {filteredQueries.length} entries
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
                      if (index === 1 && currentPage > 3)
                        return (
                          <span key={index} className="px-1 text-gray-400">
                            ...
                          </span>
                        );
                      if (index === totalPages - 2 && currentPage < totalPages - 2)
                        return (
                          <span key={index} className="px-1 text-gray-400">
                            ...
                          </span>
                        );
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </>

      <AnimatePresence>
        {showDueTasksPopup && dueTasks.length > 0 && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/20 px-4 pt-20 sm:items-center sm:pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label="Today's tasks"
            >
              <button
                type="button"
                onClick={dismissDueTasksPopup}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close today's tasks"
              >
                <X size={18} />
              </button>

              <h2 className="pr-8 text-lg font-bold text-slate-900">Today's Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">
                These tasks are due today.
              </p>

              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {dueTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <p className="text-sm font-semibold text-slate-800 whitespace-pre-line">{task.text}</p>
                    <p className="mt-1 text-xs font-medium text-[#3E63DD]">
                      Query ID: {task.queryId || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {openModal && (
          <CreateNewQueries
            onCreated={handleQueryCreated}
            onClose={() => {
              setOpenModal(false);
              if (searchParams.get("create") === "true" || searchParams.get("openModal") === "true") {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("create");
                newParams.delete("openModal");
                setSearchParams(newParams, { replace: true });
              }
            }}
          />
        )}
        {openEditModal && (
          <CreateNewQueries
            queryToEdit={selectedQuery}
            onCreated={handleQueryCreated}
            onClose={() => {
              setOpenEditModal(false);
              setSelectedQuery(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default Queries;
