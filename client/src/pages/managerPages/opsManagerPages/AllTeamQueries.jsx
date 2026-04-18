import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../utils/Api";

const statusStyles = {
  "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
  Quoted: "bg-green-50 text-green-700 border border-green-200",
  Overdue: "bg-red-50 text-red-600 border border-red-200",
  New: "bg-sky-50 text-sky-700 border border-sky-200",
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

function IconChevronDown({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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

function IconDots({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function DetailModal({ query, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-xl"
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-1">{query.id}</p>
            <h3 className="text-base font-medium text-gray-900">{query.client}</h3>
            <p className="text-sm text-gray-500">{query.destination}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ["Assigned To", query.assignedTo],
            ["Status", query.status],
            ["Deadline", query.deadline],
            ["Est. Amount", query.amount],
            ["Travel Window", [query.startDate, query.endDate].filter(Boolean).join(" - ") || "Not set"],
            ["Ops Status", query.opsStatus || "Not available"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-gray-100 pb-2">
              <span className="text-gray-400">{label}</span>
              <span className="text-right font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function StatusModal({ query, onClose, onUpdate }) {
  const [status, setStatus] = useState(query.status);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-base font-medium text-gray-900">Update Query Status</h3>
            <p className="text-sm text-gray-500 mt-1">{query.id} | {query.client}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 text-sm mt-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">New Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500">
              <option>New</option>
              <option>In Progress</option>
              <option>Quoted</option>
              <option>Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Reason / Remarks</label>
            <textarea rows="2" className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="Optional remarks..."></textarea>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
          <button onClick={() => { onUpdate(status); toast.success(`Status updated to ${status}`); onClose(); }} className="flex-1 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition">Update Status</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReminderModal({ query, onClose, onSave }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-base font-medium text-gray-900">Set Reminder</h3>
            <p className="text-sm text-gray-500 mt-1">For {query.client} ({query.id})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 text-sm mt-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Reminder Date & Time</label>
            <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Note</label>
            <textarea rows="3" className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="Follow up regarding..."></textarea>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
          <button onClick={() => { onSave(); toast.success("Reminder scheduled"); onClose(); }} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save Reminder</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoteModal({ query, onClose, onSaveNote }) {
  const [note, setNote] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-base font-medium text-gray-900">Add Internal Note</h3>
            <p className="text-sm text-gray-500 mt-1">For {query.client} ({query.id})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-4 text-sm mt-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Note Details</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="4"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Write your observations or updates here..."
            ></textarea>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
          <button 
            onClick={() => { 
              if (!note.trim()) { toast.error("Please enter a note"); return; }
              onSaveNote(note); toast.success("Internal note added securely"); onClose(); 
            }} 
            className="flex-1 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
          >
            Save Note
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AllTeamQueries() {
  const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [reminderOpen, setReminderOpen] = useState(null);
  const [statusOpen, setStatusOpen] = useState(null);
  const [noteOpen, setNoteOpen] = useState(null);
  const [queries, setQueries] = useState([]);
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

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
    () => ["All", ...new Set(queries.map((query) => query.status).filter(Boolean))],
    [queries],
  );

  const filtered = useMemo(
    () =>
      queries.filter((query) => {
        const q = search.toLowerCase();
        const matchSearch =
          query.id.toLowerCase().includes(q) ||
          query.client.toLowerCase().includes(q) ||
          query.destination.toLowerCase().includes(q) ||
          query.assignedTo.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || query.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [queries, search, statusFilter],
  );

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
      <div className="bg-white border-b border-gray-200 px-1 py-2  flex justify-between items-center text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">All Team Queries</span>
          <span className="mx-2 text-gray-300">|</span>
          {dateLabel || "Operations Manager View"}
        </div>
        <div>
          Logged in as <span className="font-medium text-gray-700">{user?.name || "Operations Manager"}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py- mt-12 ">
        <div className="flex justify-between items-center mb-7">
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

        <div className="bg-white border border-gray-200 rounded-xl p-3" onClick={() => menuOpenId && setMenuOpenId(null)}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <IconInbox />
              <span className="text-base font-medium text-gray-900">Query Tracker</span>
            </div>
            <span className="text-xs text-gray-400">{filtered.length} total queries</span>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadQueries}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 flex-1 min-w-48">
              <IconSearch />
              <input
                type="text"
                placeholder="Search queries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none bg-transparent text-gray-700 placeholder-gray-400 w-full text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500">
              <IconFilter />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="outline-none bg-transparent text-gray-600 text-sm cursor-pointer"
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="thin-scrollbar overflow-x-auto min-h-[250px]">
            <table className="min-w-[1100px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "130px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "60px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100">
                  {["Query ID", "Client", "Destination", "Assigned To", "Status", "Deadline", "Est. Amount", ""].map((header) => (
                    <th key={header} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-sm text-gray-400 py-10">
                      No queries match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((query, index) => (
                    <tr key={query.queryObjectId || query.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{query.id}</span>
                          {query.hasReminder && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500" title="Reminder set"></span>
                          )}
                          {query.hasNote && (
                            <span className="flex h-2 w-2 rounded-full bg-amber-400" title="Internal Note Added"></span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <span className="text-sm
                         text-gray-700">{query.client}</span>
                      </td>
                      <td className="py-4 pr-3">
                        <span className="text-sm
                         text-gray-700">{query.destination}</span>
                      </td>
                      <td className="py-4 pr-3">
                        <span className="text-sm
                         text-gray-700 truncate">{query.assignedTo}</span>
                      </td>
                      <td className="py-4 pr-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[query.status] || statusStyles["In Progress"]}`}>
                          {query.status}
                        </span>
                      </td>
                      <td className="py-4 pr-3">
                        <span className={`text-sm font-medium ${query.deadlineRed ? "text-red-500" : "text-gray-700"}`}>
                          {query.deadline}
                        </span>
                      </td>
                      <td className="py-4 pr-3">
                        <span className="text-sm font-medium text-gray-800">{query.amount}</span>
                      </td>
                      <td className="py-4">
                        <div className="relative flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(query); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            title="View details"
                          >
                            <IconEye />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === query.id ? null : query.id); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            title="More options"
                          >
                            <IconDots />
                          </button>
                          <AnimatePresence>
                            {menuOpenId === query.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={`absolute right-4 w-36 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 overflow-hidden ${
                                  index >= filtered.length - 2 && filtered.length > 3
                                    ? "bottom-[90%] origin-bottom-right"
                                    : "top-[90%] origin-top-right"
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => { setMenuOpenId(null); setNoteOpen(query); }}
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                                >
                                  Add Internal Note
                                </button>
                                <button
                                  onClick={() => { setMenuOpenId(null); setStatusOpen(query); }}
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                                >
                                  Update Status
                                </button>
                                {query.hasReminder ? (
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      setQueries((prev) => prev.map((q) => (q.id === query.id ? { ...q, hasReminder: false } : q)));
                                      toast.success("Reminder cleared");
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                                  >
                                    Clear Reminder
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      setReminderOpen(query);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                                  >
                                    Set Reminder
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span>Showing {filtered.length} of {queries.length} queries</span>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-500">
                <IconChevronDown size={11} />
                Export
              </button>
            </div>
          </div> */}
        </div>
      </div>

      <AnimatePresence>
        {selected && <DetailModal query={selected} onClose={() => setSelected(null)} />}
        {statusOpen && <StatusModal query={statusOpen} onClose={() => setStatusOpen(null)} onUpdate={(newStatus) => {
          setQueries(prev => prev.map(q => q.id === statusOpen.id ? { ...q, status: newStatus } : q));
        }} />}
        {reminderOpen && <ReminderModal query={reminderOpen} onClose={() => setReminderOpen(null)} onSave={() => {
          setQueries(prev => prev.map(q => q.id === reminderOpen.id ? { ...q, hasReminder: true } : q));
        }} />}
        {noteOpen && <NoteModal query={noteOpen} onClose={() => setNoteOpen(null)} onSaveNote={(noteText) => {
          setQueries(prev => prev.map(q => q.id === noteOpen.id ? { ...q, hasNote: true } : q));
        }} />}
      </AnimatePresence>
    </div>
  );
}
