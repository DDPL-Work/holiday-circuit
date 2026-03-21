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

  // ================= API =================

useEffect(() => {
  const fetchQueries = async () => {
    try {
      const res = await API.get("/agent/getAllQueries");
      setQueries(res.data.queries);
    } catch (err) {
      console.error(err);
    }
  };

  fetchQueries();
}, []);

  // ================= Helpers =================
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
      query.status?.toLowerCase().includes(search)
    );
  });

  // ================= Details View =================
  if (openQueryDetails) {
    return (
      <QueryDetails
        onClose={() => setOpenQueryDetails(false)}
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
            className="flex items-center justify-between"
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
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm cursor-pointer"
            >
              <Plus size={16} />
              Create Query
            </motion.button>
          </motion.header>

          {/* Search */}
          <motion.div variants={itemVariant} className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-2xl text-sm border-gray-300 focus:outline-none"
            />
          </motion.div>

          {/* Table */}
          <motion.div
            variants={itemVariant}
            className="bg-white shadow-sm rounded-xl overflow-hidden"
          >
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b-gray-200 border-b">
                <tr>
                  <th className="text-left px-6 py-3">Query ID</th>
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
                {filteredQueries.map((query, index) => (
                  <motion.tr
                    key={query._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.03,
                      ease: "easeOut",
                    }}
                    whileHover={{ backgroundColor: "#F9FAFB" }}
                    className="cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium">
                      {query.queryId}
                    </td>
                    <td className="px-6 py-4">{query.destination}</td>
                    <td className="px-6 py-4">
                      {formatDates(query.startDate, query.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      {formatPax(
                        query.numberOfAdults,
                        query.numberOfChildren
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {query.agentStatus === "Quote Sent" && (
                        <span className="bg-green-200 text-green-700 px-3 border py-1 rounded-full text-xs">
                         {query.agentStatus?.replace("_", " ")}
                        </span>
                      )}
                      {query.agentStatus === "Pending" && (
                        <span className="bg-yellow-100  text-yellow-700 px-3 py-1 rounded-full text-xs">
                       {query.agentStatus?.replace("_", " ")}
                        </span>
                      )}
                      {query.agentStatus === "Revision Requested" && (
                        <span className="bg-red-400 text-white px-3 py-1 rounded-full text-xs">
                          {query.agentStatus?.replace("_", " ")}
                        </span>
                      )}
                       {query.agentStatus === "In Progress" && (
                        <span className="bg-sky-300 text-white px-3 py-1 rounded-full text-xs">
                          {query.agentStatus?.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {query.customerBudget || "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                     onClick={(e) => {  e.stopPropagation(); setSelectedQuery(query); setOpenQueryDetails(true);}}
                    >
                      <span className="text-sm text-blue-600 px-2 py-2 rounded-lg hover:bg-gray-100">
                        View
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </>
     

<AnimatePresence>
  {openModal && (
    <CreateNewQueries
      onClose={() => {
        setOpenModal(false);
        fetchQueries();
      }}
    />
  )}
</AnimatePresence>
    </motion.section>
  );
};

export default Queries;