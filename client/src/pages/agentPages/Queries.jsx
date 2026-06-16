import { Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
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

const Queries = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openQueryDetails, setOpenQueryDetails] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [queries, setQueries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // ================= Helpers =================
  const getStatusBadge = (status) => {
    if (status === "Quote Sent") {
      return {
        className: "bg-green-200 text-green-700",
        label: "Quote Received",
      };
    }

    if (status === "Pending") {
      return {
        className: "bg-yellow-100 text-yellow-700",
        label: "Pending",
      };
    }

    if (status === "Revision Requested") {
      return {
        className: "bg-red-400 text-white border",
        label: "Revision Requested",
      };
    }

    if (status === "Rejected") {
      return {
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        label: "Rejected",
      };
    }

    if (status === "In Progress") {
      return {
        className: "bg-sky-300 text-white",
        label: "In Progress",
      };
    }

    if (status === "Client Approved") {
      return {
        className: "bg-indigo-100 text-indigo-700",
        label: "Booking Processed",
      };
    }

    if (status === "Confirmed") {
      return {
        className: "bg-green-100 text-green-700",
        label: "Booking Confirmed",
      };
    }

    return {
      className: "bg-gray-100 text-gray-700",
      label: status || "Pending",
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
    return (
      query.queryId?.toLowerCase().includes(search) ||
      query.destination?.toLowerCase().includes(search) ||
      query.agentStatus?.toLowerCase().includes(search)
    );
  });

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
        <motion.header
          variants={itemVariant}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Queries</h1>
            <p className="text-sm text-gray-500">
              Manage your travel requirements and quotes.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpenModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white cursor-pointer sm:w-auto"
          >
            <Plus size={16} />
            Create Query
          </motion.button>
        </motion.header>

        {/* Search */}
        <motion.div variants={itemVariant} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border rounded-2xl text-sm border-gray-300 focus:outline-none"
          />
        </motion.div>

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
                          className={`inline-flex w-[140px] items-center justify-center whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-medium leading-none ${getStatusBadge(query.agentStatus).className}`}
                        >
                          {getStatusBadge(query.agentStatus).label}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle text-right font-medium whitespace-nowrap">
                        {query.customerBudget || "-"}
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
        {openModal && (
          <CreateNewQueries
            onCreated={handleQueryCreated}
            onClose={() => {
              setOpenModal(false);
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
