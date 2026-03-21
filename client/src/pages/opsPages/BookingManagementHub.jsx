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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BookingDetailsModal from "../../modal/BookingDetails";
import API from "../../utils/Api.js";

export default function BookingManagementHub() {
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

          return {
            id: q.queryId,
            agent: q.agent?.name || "—",
            destination: q.destination,
            date: `${formatDate(q.startDate)} – ${formatDate(q.endDate)}`,
            startDate: q.startDate,  
            pax: totalPax,
            status: q.opsStatus || "New_Query",
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
      icon: <Clock className="w-3 h-3" />,
    },

    Pending_Accept: {
      color: "bg-orange-100 text-orange-600",
      label: "Pending Accept",
      icon: <Clock className="w-3 h-3" />,
    },

    Booking_Accepted: {
      color: "bg-blue-100 text-blue-600",
      label: "Booking Accepted",
      icon: <CheckCircle className="w-3 h-3" />,
    },

    Confirmed: {
      color: "bg-cyan-100 text-cyan-600",
      label: "Confirmed",
      icon: <CheckCircle className="w-3 h-3" />,
    },

    Vouchered: {
      color: "bg-green-100 text-green-600",
      label: "Vouchered",
      icon: <FileText className="w-3 h-3" />,
    },
  };


const filteredRows = rows.filter((row) => {

  const matchesSearch =
    row.id.toLowerCase().includes(search.toLowerCase()) ||
    row.agent.toLowerCase().includes(search.toLowerCase()) ||
    row.destination.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" || row.status === statusFilter;

  const matchesDate =
    !dateFilter ||
    new Date(row.startDate).toISOString().slice(0,10) === dateFilter;

  return matchesSearch && matchesStatus && matchesDate;

});

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-white p-2.5 ${selectedBooking ? "blur-lg" : ""}`}
      >
        {/* HEADER */}

        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#0F172A]">
            Booking Management Hub
          </h2>

          <p className="text-sm text-gray-500">
            Central hub for all agent requests and bookings
          </p>
        </div>

        {/* SEARCH FILTER CARD */}

        <motion.div
          whileHover={{ scale: 1.002 }}
          className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4 mb-5 flex justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-500 w-72">
            <Search className="w-4 h-4" />

            <input
              placeholder="Search by Query ID, Agent, or Destination..."
              className="outline-none w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-white border border-gray-300 rounded-xl px-2 py-2 text-xs outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending_Accept">Pending</option>
            <option value="Booking_Accepted">Booking Accepted</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Vouchered">Vouchered</option>
          </select>

          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs hover:bg-gray-50">
            {/* <Calendar className="w-4 h-4" /> */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="outline-none text-xs cursor-pointer"
            />
          </div>

          <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </motion.div>

        {/* TABLE */}

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Loading agent queries...
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-center px-4 py-3">Query ID</th>
                  <th className="text-center px-4 py-3">Agent Name</th>
                  <th className="text-center px-4 py-3">Destination</th>
                  <th className="text-center px-4 py-3">Travel Date</th>
                  <th className="text-center px-4 py-3">Pax</th>
                  <th className="text-center px-4 py-3">Ops Status</th>
                  <th className="text-center px-4 py-3">Actions</th>
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
                  const status =
                    statusConfig[row.status] || statusConfig.New_Query;

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
                      whileHover={{ x: 2 }}
                      className="border-t border-gray-300 hover:bg-gray-50 text-center"
                    >
                      <td className="px-4 py-3 font-medium">{row.id}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-3 h-3 text-gray-400" />

                          {row.agent}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400" />

                          {row.destination}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />

                          {row.date}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-400">{row.pax}</td>

                      <td className="px-4 py-3">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </motion.span>
                      </td>

                      <td className="px-4 py-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBooking(row._raw)}
                          className="flex items-center gap-1 text-blue-600 text-sm cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          )}
        </div>
      </motion.div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </>
  );
}
