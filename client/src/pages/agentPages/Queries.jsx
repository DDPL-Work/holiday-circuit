import { Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import CreateNewQueries from "../../modal/CreateNewQueries.Modal";
import QueryDetails from "./QueryDetails.jsx";
import API from "../../utils/Api.js";

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

useEffect(() => {
  fetchQueries();
}, []);

  // ================= Helpers =================
  const getStatusBadge = (status) => {
    if (status === "Quote Sent") {
      return {
        className: "bg-green-200 text-green-700",
        label: "Quote Sent",
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

    if (status === "In Progress") {
      return {
        className: "bg-sky-300 text-white",
        label: "In Progress",
      };
    }

    if (status === "Client Approved") {
      return {
        className: "bg-indigo-100 text-indigo-700",
        label: "Client Approved",
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
    return `${new Date(start).toLocaleDateString("en-IN", options)} - 
            ${new Date(end).toLocaleDateString("en-IN", options)}`;
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
            <div className="thin-scrollbar overflow-x-auto overflow-y-hidden pb-2">
            <table className="min-w-[870px] w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-gray-50 text-gray-500 border-b-gray-200 border-b">
                <tr>
                  <th className="text-left px-6 py-2">Query ID</th>
                  <th className="text-left px-6 py-3">Destination</th>
                  <th className="text-left px-6 py-3">Dates</th>
                  <th className="text-left px-6 py-3">Pax</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Quote Price</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>

              {/* IMPORTANT FIX: normal tbody */}
              <tbody className="divide-y divide-gray-200">
                {paginatedQueries.length > 0 ? (
                  paginatedQueries.map((query) => (
                  <tr
                    key={query._id}
                    className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="leading-tight">
                        <p className="whitespace-nowrap font-semibold text-slate-900">
                          {query.queryId}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="leading-tight text-slate-700">{query.destination}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="leading-snug text-slate-700">
                        {formatDates(query.startDate, query.endDate)}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="leading-snug text-slate-700">
                        {formatPax(
                          query.numberOfAdults,
                          query.numberOfChildren
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex w-[140px] items-center justify-center whitespace-nowrap rounded-full px-2.5 py-2 text-[11px] font-medium leading-none ${getStatusBadge(query.agentStatus).className}`}
                      >
                        {getStatusBadge(query.agentStatus).label}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-right font-medium whitespace-nowrap">
                      {query.customerBudget || "-"}
                    </td>
                    <td
                      className="px-5 py-4 align-top text-right"
                     onClick={(e) => {  e.stopPropagation(); setSelectedQuery(query); setOpenQueryDetails(true);}}
                    >
                      <span className="text-sm text-blue-600 px-2 py-2 rounded-lg hover:bg-gray-100">
                        View
                      </span>
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
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredQueries.length)} of {filteredQueries.length} entries
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
                      // Optional: simple ellipsis logic if many pages exist
                      if (
                        totalPages > 5 &&
                        index !== 0 &&
                        index !== totalPages - 1 &&
                        Math.abs(currentPage - 1 - index) > 1
                      ) {
                        // Only show one ellipsis
                        if (index === 1 && currentPage > 3) return <span key={index} className="px-1 text-gray-400">...</span>;
                        if (index === totalPages - 2 && currentPage < totalPages - 2) return <span key={index} className="px-1 text-gray-400">...</span>;
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
          </motion.div>
        </>
    
<AnimatePresence>
  {openModal && (<CreateNewQueries onClose={() => { setOpenModal(false); // fetchQueries();
}}
/>
  )}
</AnimatePresence>
</motion.section>
  );
};

export default Queries;
