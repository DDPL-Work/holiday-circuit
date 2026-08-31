import { useMemo } from "react";
import { X, AlertCircle, Clock, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value) =>
  `\u20B9 ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const getDaysDiff = (dateValue) => {
  if (!dateValue) return 0;
  const targetDate = new Date(dateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function FinanceOverdueAlertModal({ isOpen, onClose, invoices = [] }) {
  const navigate = useNavigate();

  // Filter and prioritize actionable invoices (excluding Paid, Settled, Rejected)
  const alertInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const status = inv.status;
        return status !== "Paid" && status !== "Settled" && status !== "Rejected";
      })
      .map((inv) => {
        const daysDiff = getDaysDiff(inv.dueDateValue || inv.invoiceDateValue);
        const creditPeriod = Number(inv.creditPeriodDays || 7);

        let level = 0; // Safe
        let statusLabel = "";
        let colorClass = "";

        if (daysDiff < 0) {
          level = 4; // Overdue
          statusLabel = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? "s" : ""}`;
          colorClass = "text-red-600 bg-red-50 border-red-200";
        } else if (daysDiff <= 2) {
          level = 3; // Urgent
          statusLabel = daysDiff === 0 ? "Due Today" : daysDiff === 1 ? "Due Tomorrow" : `Due in ${daysDiff} days`;
          colorClass = "text-orange-600 bg-orange-50 border-orange-200";
        } else if (daysDiff <= 7) {
          level = 2; // Moderate
          statusLabel = `Due in ${daysDiff} days`;
          colorClass = "text-amber-600 bg-amber-50 border-amber-200";
        } else if (daysDiff <= creditPeriod) {
          level = 1; // Upcoming
          statusLabel = `Due in ${daysDiff} days`;
          colorClass = "text-blue-600 bg-blue-50 border-blue-200";
        } else {
          level = 0; // Safe
          statusLabel = `Due in ${daysDiff} days`;
          colorClass = "text-slate-500 bg-slate-50 border-slate-200";
        }

        return {
          ...inv,
          daysDiff,
          level,
          statusLabel,
          colorClass,
        };
      })
      .filter((inv) => inv.level > 0 || inv.daysDiff < 0) // Only show invoices that are overdue or within the credit window
      .sort((a, b) => {
        // Sort level descending (Overdue first), then by closest due date (daysDiff ascending)
        if (b.level !== a.level) return b.level - a.level;
        return a.daysDiff - b.daysDiff;
      });
  }, [invoices]);

  // Determine highest severity theme
  const theme = useMemo(() => {
    if (!alertInvoices.length) {
      return {
        level: 0,
        headerBg: "bg-gradient-to-r from-slate-600 via-slate-700 to-slate-500",
        textColor: "text-white",
        closeColor: "text-white/80 hover:text-white hover:bg-white/10",
        title: "All Payments Tracked",
        buttonBg: "bg-slate-900 hover:bg-slate-800 focus:ring-slate-500",
        icon: <Clock className="h-5 w-5" />,
      };
    }

    const maxLevel = Math.max(...alertInvoices.map((inv) => inv.level));

    if (maxLevel === 4) {
      return {
        level: 4,
        headerBg: "bg-gradient-to-r from-red-600 via-rose-600 to-red-500",
        textColor: "text-white",
        closeColor: "text-white/80 hover:text-white hover:bg-white/10",
        title: "CRITICAL PAYMENTS OVERDUE",
        buttonBg: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        icon: <AlertCircle className="h-5 w-5 animate-bounce" />,
      };
    }

    if (maxLevel === 3) {
      return {
        level: 3,
        headerBg: "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400",
        textColor: "text-white",
        closeColor: "text-white/80 hover:text-white hover:bg-white/10",
        title: "URGENT PAYMENT DEADLINES",
        buttonBg: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500",
        icon: <AlertCircle className="h-5 w-5" />,
      };
    }

    if (maxLevel === 2) {
      return {
        level: 2,
        headerBg: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300",
        textColor: "text-slate-900",
        closeColor: "text-slate-800/80 hover:text-slate-900 hover:bg-black/10",
        title: "PAYMENTS DUE SOON",
        buttonBg: "bg-amber-500 hover:bg-amber-600 text-slate-900 focus:ring-amber-500",
        icon: <AlertCircle className="h-5 w-5 text-slate-900" />,
      };
    }

    return {
      level: 1,
      headerBg: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500",
      textColor: "text-white",
      closeColor: "text-white/80 hover:text-white hover:bg-white/10",
      title: "UPCOMING PAYMENT SCHEDULE",
      buttonBg: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: <Calendar className="h-5 w-5" />,
    };
  }, [alertInvoices]);

  const handleGoToInvoices = () => {
    navigate("/finance/internalInvoice");
    onClose();
  };

  const overdueCount = alertInvoices.filter((inv) => inv.level === 4).length;
  const upcomingCount = alertInvoices.length - overdueCount;

  if (!alertInvoices.length) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop overlay with reduced blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        />

        {/* Modal container with reduced spacing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[75vh]"
        >
          {/* Header Banner - reduced padding */}
          <div className={`${theme.headerBg} ${theme.textColor} p-4 pr-10 relative shrink-0`}>
            <button
              onClick={onClose}
              className={`absolute top-3.5 right-3.5 ${theme.closeColor} rounded-full p-1 transition-colors`}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-white/20 p-1.5 text-current">
                {theme.icon}
              </div>
              <div>
                <span className="text-[9px] font-bold tracking-wider uppercase opacity-75 leading-none block">
                  Finance Operations Alert
                </span>
                <h2 className="text-sm font-extrabold tracking-tight mt-0.5 leading-tight">
                  {theme.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Modal content body - reduced padding */}
          <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Hi Finance Team member! You have{" "}
              {overdueCount > 0 && (
                <span className="font-bold text-red-600">
                  {overdueCount} overdue
                </span>
              )}
              {overdueCount > 0 && upcomingCount > 0 && " & "}
              {upcomingCount > 0 && (
                <span className="font-bold text-slate-700">
                  {upcomingCount} upcoming
                </span>
              )}
              {" "}milestones. Please review and process settlement:
            </div>

            {/* List of Invoices - transparent-scrollbar */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[32vh] pr-0.5 transparent-scrollbar">
              {alertInvoices.map((inv) => {
                const isOverdue = inv.level === 4;
                const borderStyle = isOverdue
                  ? "border-l-red-500 shadow-red-50"
                  : inv.level === 3
                  ? "border-l-orange-500 shadow-orange-50"
                  : inv.level === 2
                  ? "border-l-amber-500 shadow-amber-50"
                  : "border-l-blue-500 shadow-blue-50";

                return (
                  <div
                    key={inv.id}
                    className={`flex flex-col gap-1 rounded-md border border-slate-100 border-l ${borderStyle} bg-white p-1.5 shadow-sm transition-all hover:shadow`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 leading-tight">
                        {inv.invoiceNumber || `Inv: ${inv.id.slice(-6)}`}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[8.5px] font-bold leading-none inline-flex items-center justify-center ${inv.colorClass} ${
                          isOverdue ? "animate-pulse" : ""
                        }`}
                      >
                        {inv.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-0.5 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-700">{inv.dmcName}</span>
                        <span className="text-[8px] text-slate-400">
                          (Ref: <span className="font-mono">{inv.queryId}</span> • {inv.creditTermLabel})
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="text-[8px] text-slate-400">
                          Due: {inv.dueDate || "N/A"}
                        </span>
                        <span className="text-[10px] font-black text-slate-950">
                          {formatCurrency(inv.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions - reduced padding */}
          <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              Close
            </button>
            <button
              onClick={handleGoToInvoices}
              className={`cursor-pointer rounded-lg ${theme.buttonBg} px-3 py-1.5 text-[11px] font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              Go to Invoices
              <ArrowRight size={12} />
            </button>
          </div>
        </motion.div>
      </div>
  );
}
