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

export default function BookingManagementHub() {
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

          return {
            id: q.queryId,
            agent: q.agent?.name || "-",
            assignedToId: String(q.assignedTo?._id || q.assignedTo?.id || ""),
            assignedTo: q.assignedTo?.name || q.assignedTo?.email || "Unassigned",
            receivedFrom: wasMovedToCurrentUser ? latestReassignment?.fromName || "" : "",
            destination: q.destination,
            date: `${formatDate(q.startDate)} - ${formatDate(q.endDate)}`,
            startDate: q.startDate,
            pax: totalPax,
            status:
              isReceivedNewQuery
                ? "Received_Query"
                : q.agentStatus === "Revision Requested" || q.opsStatus === "Revision_Query"
                ? "Revision_Requested"
                : q.opsStatus === "Rejected"
                  ? "Pending_Accept"
                  : q.opsStatus || "New_Query",
            travelerDocumentStatus: q.travelerDocumentVerification?.status || "Draft",
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
      label: "New Query",
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
      label: "Booking Accepted",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    Invoice_Requested: {
      color: "bg-indigo-100 text-indigo-700",
      label: "Amount Pending",
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-white ${selectedBooking ? "blur-lg" : ""}`}
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
            <option value="Booking_Accepted">Booking Accepted</option>
            <option value="Invoice_Requested">Amount Pending</option>
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
                    <th className="w-[90px] px-3 py-3 text-left">Query ID</th>
                    <th className="w-[130px] px-3 py-3 text-center">Agent Name</th>
                    <th className="w-[90px] px-3 py-3 text-center">Destination</th>
                    <th className="w-[90px] px-3 py-3 text-center">Travel Date</th>
                    <th className="w-[90px] px-3 py-3 text-center">Pax</th>
                    <th className="w-[90px] px-3 py-3 text-center">Ops Status</th>
                    <th className="w-[130px] px-3 py-3 text-center">Document Review</th>
                    <th className="w-[90px] px-3 py-3 text-center">Actions</th>
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
                  {filteredRows.map((row) => {
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
                              stiffness: 120,
                              damping: 16,
                            },
                          },
                        }}
                        whileHover={{ x: 2 }} className="border-t border-gray-300 align-middle hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-3 py-4 align-center font-semibold text-slate-800">
                          {row.id}
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="min-w-0 space-y-2 text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 shrink-0 text-gray-400" />
                              <span className="truncate font-medium text-slate-700">{row.agent}</span>
                            </div>
                            {isReceivedQuery ? (
                              <div className="flex items-center">
                                <span className="inline-flex max-w-full rounded-full bg-amber-50 px-2.5 py-1 text-[8px] font-semibold leading-4 text-amber-700">
                                  Received from {row.receivedFrom}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="flex min-w-0 items-center gap-2 text-gray-600">
                            <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate">{row.destination}</span>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="whitespace-nowrap leading-5">{row.date}</span>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle text-center text-gray-400">{row.pax}</td>

                        <td className="px-3 py-4 align-middle text-center">
                          <span className={`inline-flex h-9 min-w-[156px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium leading-none ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        <td className="px-3 py-4 align-middle text-center">
                          <span
                            className={`inline-flex min-w-[78px] items-center justify-center rounded-full px-2 py-1 text-[11px] font-medium ${
                              row.travelerDocumentStatus === "Verified"
                                ? "bg-emerald-100 text-emerald-700"
                                : row.travelerDocumentStatus === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : row.travelerDocumentStatus === "Pending"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {row.travelerDocumentStatus}
                          </span>
                        </td>

                        <td className="px-3 py-4 align-middle text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedBooking(row._raw)}
                            className="inline-flex cursor-pointer items-center gap-1 text-sm text-blue-600"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          refresh={fetchQueries}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </>
  );
}
