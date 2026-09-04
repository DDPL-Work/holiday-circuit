import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { cardStyles } from "../utils/formatter";

export default function MetricCard({
  data,
  icon,
  loading,
  onPayoutClick,
  showPayoutAction = true,
}) {
  const style = cardStyles[data.label] || {
    cardBg: "from-slate-50/90 via-white to-slate-50/20",
    borderColor: "border-slate-100 hover:border-slate-300",
    accentColor: "border-b-4 border-b-slate-500",
    iconBg: "bg-slate-100/80 text-slate-600",
    shadowColor: "shadow-slate-500/5",
    valueColor: "text-slate-850",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-gradient-to-br ${style.cardBg} border ${style.borderColor} ${style.accentColor} rounded-2xl p-4 shadow-sm hover:shadow-md ${style.shadowColor} flex justify-between items-start hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out group relative`}
    >
      <div className="flex-1 pr-10">
        <p className="text-sm font-bold text-slate-800">{data.label}</p>
        <p className="text-xs text-slate-400 mb-3">{data.sub}</p>
        <p className={`text-2xl font-extrabold tracking-tight ${style.valueColor}`}>
          {loading ? "..." : data.val}
        </p>
        <p
          className={`text-xs font-semibold mt-2 ${
            data.changeTone === "negative" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {data.up ? "↑" : "↓"} {loading ? "Loading..." : data.change}
        </p>
        {showPayoutAction && data.payoutVal && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPayoutClick?.();
            }}
            className="mt-2 pt-2 border-t border-slate-100/80 w-full flex items-center justify-between gap-2 hover:bg-slate-50/80 active:bg-slate-100/50 p-1 -mx-1 rounded-lg transition-colors cursor-pointer text-left focus:outline-none group/payout"
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider whitespace-nowrap flex items-center gap-1 group-hover/payout:text-slate-800 transition-colors">
              Actual Payout
              <Info size={11} className="text-slate-400 group-hover/payout:text-slate-600" />
            </span>
            <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/50 transition-colors flex items-center gap-1 shrink-0 group-hover/payout:bg-rose-100">
              {loading ? "..." : data.payoutVal}
              <ChevronDown
                size={11}
                className="text-rose-400 group-hover/payout:translate-y-0.5 transition-transform duration-200"
              />
            </span>
          </button>
        )}
      </div>
      <div
        className={`absolute top-4 right-4 p-2 rounded-lg ${style.iconBg} group-hover:scale-110 transition-transform duration-300 ease-out shadow-inner`}
      >
        {React.createElement(icon, { className: "w-5 h-5" })}
      </div>
    </motion.div>
  );
}
