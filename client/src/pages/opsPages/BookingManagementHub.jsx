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

export default function BookingManagementHub() {
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDocumentBooking, setSelectedDocumentBooking] = useState(null);
  const itemsPerPage = 8;

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

    return matchesSearch && matchesStatus && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, rows.length]);

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

        <motion.div
          whileHover={{ scale: 1.002 }}
          className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-[#F8FAFC] p-4 lg:flex-row lg:items-center lg:justify-between"
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

          <select
            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-2 py-2 text-xs outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Received_Query">Received Query</option>
            <option value="Pending_Accept">Pending</option>
            <option value="Revision_Requested">Quotation Rejected</option>
            <option value="Booking_Accepted">Query Accepted</option>
            <option value="Invoice_Requested">Amount/Docs Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Vouchered">Vouchered</option>
          </select>

          <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="cursor-pointer text-xs outline-none"
            />
          </div>

          <button className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </motion.div>

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
                        whileHover={{ x: 1 }} className="border-t border-gray-300 align-middle hover:bg-gray-100"
                      >
                        <td className="whitespace-nowrap px-4 py-4 align-middle font-semibold text-slate-800 text-left">
                          {row.id}
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
