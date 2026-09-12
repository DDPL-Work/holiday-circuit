import { useEffect, useState } from "react";
import { X, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../utils/Api";

export default function FinanceOverdueReminderWidget() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    // 5 minutes interval (repeats every 5 mins)
    const delayMs = 5 * 60 * 1000; 

    const checkOverdue = async () => {
      try {
        const { data } = await API.get("/admin/internal-invoices");
        const invoices = data?.data?.invoices || [];

        const count = invoices.filter((inv) => {
          const status = inv.status;
          if (status === "Paid" || status === "Settled" || status === "Rejected") return false;

          const dueDateValue = inv.dueDateValue || inv.invoiceDateValue;
          if (!dueDateValue) return false;

          const targetDate = new Date(dueDateValue);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          targetDate.setHours(0, 0, 0, 0);

          return targetDate < today; // Overdue
        }).length;

        if (count > 0) {
          setOverdueCount(count);
          setVisible(true);
        }
      } catch (error) {
        console.error("Failed to fetch invoices for overdue reminder widget:", error);
      }
    };

    const interval = setInterval(checkOverdue, delayMs);

    return () => clearInterval(interval);
  }, []);

  const handleGoToInvoices = () => {
    navigate("/finance/internalInvoice");
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
          className="fixed bottom-4 right-4 z-[9999] w-72 bg-gradient-to-br from-rose-50/95 via-white/95 to-slate-50/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-100 border-l-4 border-l-red-500 p-3 pr-8 flex flex-col gap-1.5"
        >
          {/* Close button */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100"
            aria-label="Close reminder"
          >
            <X size={14} />
          </button>

          {/* Heading info */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-50 p-1 text-red-500">
              <AlertCircle size={15} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Overdue Payment Alert
            </span>
          </div>

          {/* Content */}
          <div className="text-[11px] text-slate-600 leading-relaxed">
            You have <span className="font-bold text-red-600">{overdueCount} invoice{overdueCount > 1 ? "s" : ""}</span> overdue for payment. Please review and process settlement.
          </div>

          {/* Action Link */}
          <button
            onClick={handleGoToInvoices}
            className="cursor-pointer text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 mt-1 text-left w-fit"
          >
            View Invoices
            <ArrowRight size={11} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
