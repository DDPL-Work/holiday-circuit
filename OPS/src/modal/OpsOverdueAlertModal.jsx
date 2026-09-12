import { useMemo } from "react";
import { X, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) =>
  `\u20B9 ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const getHoursElapsed = (createdAtString) => {
  if (!createdAtString) return 0;
  const createdAt = new Date(createdAtString);
  if (Number.isNaN(createdAt.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60)));
};

const formatTimeElapsed = (hours) => {
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} overdue`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days} day${days > 1 ? "s" : ""}${remainingHours > 0 ? ` ${remainingHours}h` : ""} overdue`;
};

export default function OpsOverdueAlertModal({ onClose, queries = [] }) {
  const navigate = useNavigate();

  // Filter and prioritize overdue workload queries
  const alertQueries = useMemo(() => {
    const TERMINAL_OPS_STATUSES = new Set(["Rejected", "Vouchered", "Payment_Completed"]);
    const TERMINAL_AGENT_STATUSES = new Set(["Rejected"]);

    return queries
      .filter((query) => {
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

        // 3. Must be older than 48 hours
        const elapsed = getHoursElapsed(query.createdAt);
        return elapsed > 48;
      })
      .map((query) => {
        const hoursElapsed = getHoursElapsed(query.createdAt);
        return {
          ...query,
          hoursElapsed,
          statusLabel: formatTimeElapsed(hoursElapsed),
        };
      })
      .sort((a, b) => b.hoursElapsed - a.hoursElapsed); // Show oldest first
  }, [queries]);

  const handleGoToQueries = () => {
    navigate("/ops/bookings-management");
    onClose();
  };

  if (!alertQueries.length) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px]"
      />

      {/* Modal container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[75vh]"
      >
        {/* Header Banner - Amber Warning Gradient */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white p-4 pr-10 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/20 p-1.5 text-white border border-white/15">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-bold tracking-wider uppercase opacity-85 leading-none block">
                Operations Deadline Alert
              </span>
              <h2 className="text-sm font-extrabold tracking-tight mt-0.5 leading-tight">
                PENDING QUOTATIONS OVERDUE
              </h2>
            </div>
          </div>
        </div>

        {/* Modal content body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Hi Operations Team member! You have{" "}
            <span className="font-bold text-amber-600">
              {alertQueries.length} query {alertQueries.length === 1 ? "milestone" : "milestones"}
            </span>{" "}
            that have exceeded the 48-hour deadline. Please review and send quotations immediately:
          </div>

          {/* List of Overdue Queries */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[32vh] pr-0.5 transparent-scrollbar">
            {alertQueries.map((query) => (
              <div
                key={query._id}
                className="flex flex-col gap-1 rounded-md border border-slate-100 border-l border-l-amber-500 bg-white p-1.5 shadow-sm transition-all hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-800 leading-tight font-mono">
                    {query.queryId || "Query ID"}
                  </span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[8.5px] font-bold leading-none inline-flex items-center justify-center text-amber-700 animate-pulse">
                    <AlertTriangle size={8} className="mr-0.5" />
                    {query.statusLabel}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-0.5 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-700">
                      {query.destination || "Unknown Destination"}
                    </span>
                    <span className="text-[8px] text-slate-400">
                      (Client: {query.agent?.companyName || query.agent?.name || "Travel Partner"})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-950">
                      Budget: {formatCurrency(query.customerBudget || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            Dismiss
          </button>
          <button
            onClick={handleGoToQueries}
            className="cursor-pointer rounded-lg bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Go to Bookings Hub
            <ArrowRight size={12} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
