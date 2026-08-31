import { useEffect, useState } from "react";
import { X, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../utils/Api";

export default function OpsOverdueReminderWidget() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    // 5 minutes interval (repeats every 5 mins)
    const delayMs = 5 * 60 * 1000; 

    const checkOverdue = async () => {
      try {
        const res = await API.get("/ops/queries");
        const queries = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.queries)
              ? res.data.queries
              : [];

        // Terminal statuses mapping
        const TERMINAL_OPS_STATUSES = new Set(["Rejected", "Vouchered", "Payment_Completed"]);
        const TERMINAL_AGENT_STATUSES = new Set(["Rejected"]);

        const count = queries.filter((query) => {
          // 1. Must be active (not terminal)
          const opsStatus = query?.opsStatus || "";
          const agentStatus = query?.agentStatus || "";
          if (TERMINAL_OPS_STATUSES.has(opsStatus) || TERMINAL_AGENT_STATUSES.has(agentStatus)) {
            return false;
          }

          // 2. Quote must NOT be sent
          const isQuoteSent =
            query?.quotationStatus === "Sent_To_Agent" ||
            (Array.isArray(query?.activityLog) &&
              query.activityLog.some((log) => String(log?.action).trim() === "Quote Sent"));

          if (isQuoteSent) {
            return false;
          }

          // 3. Must be older than 48 hours (2 days)
          if (!query?.createdAt) return false;
          const createdAt = new Date(query.createdAt);
          if (Number.isNaN(createdAt.getTime())) return false;

          const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          return hoursElapsed > 48;
        }).length;

        if (count > 0) {
          setOverdueCount(count);
          setVisible(true);
        } else {
          setVisible(false);
        }
      } catch (error) {
        console.error("Failed to check overdue queries for ops widget:", error);
      }
    };

    const interval = setInterval(checkOverdue, delayMs);

    return () => clearInterval(interval);
  }, []);

  const handleGoToQueries = () => {
    navigate("/ops/bookings-management");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 right-4 z-[9999] w-76 bg-gradient-to-br from-amber-50/95 via-white/95 to-slate-50/95 backdrop-blur-md rounded-2xl shadow-[0_24px_50px_rgba(245,158,11,0.18)] border border-slate-200/50 border-l-4 border-l-amber-500 p-4 pr-8 flex flex-col gap-2.5"
        >
          {/* Close button */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100/80 cursor-pointer"
            aria-label="Close reminder"
          >
            <X size={14} />
          </button>

          {/* Heading info */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-amber-50 p-1.5 text-amber-600 border border-amber-100">
              <Clock size={14} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600">
              Overdue Query Alert
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-black text-slate-800 tracking-tight leading-none">
              {overdueCount} {overdueCount === 1 ? "Query requires" : "Queries require"} Action
            </h3>
            <p className="text-[10px] leading-normal text-slate-500 font-medium">
              You have pending queries that have exceeded the 48-hour operational deadline. Please send quotes immediately.
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={handleGoToQueries}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-xl text-[10px] font-extrabold text-white bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 hover:from-blue-950 hover:to-blue-900 shadow-sm hover:shadow transition duration-200 cursor-pointer w-full"
          >
            <span>Resolve Queries</span>
            <ArrowRight size={11} className="stroke-[3px]" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
