import React from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import {
  summaryCardStyles,
  defaultSummaryStyle,
  summaryCardIcons,
} from "../utils/formatter";

export default function ReportSummaryCard({ item, loading }) {
  const labelUpper = (item.styleKey || item.label || "").toUpperCase();
  const style = summaryCardStyles[labelUpper] || defaultSummaryStyle;
  const IconComponent = summaryCardIcons[labelUpper] || FileText;

  return (
    <motion.div
      whileHover={{
        y: -2,
        scale: 1.003,
        boxShadow:
          "0 8px 20px -6px rgba(0, 0, 0, 0.05), 0 6px 8px -8px rgba(0, 0, 0, 0.05)",
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`bg-gradient-to-br ${style.bg} border ${style.border} ${style.accent} rounded-xl p-3 sm:p-3.5 shadow-sm ${style.shadow} flex h-[108px] flex-col justify-between cursor-default group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start gap-1.5 select-none">
        <p className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors leading-tight truncate">
          {item.label}
        </p>
        <span className="text-slate-400 group-hover:text-indigo-600 group-hover:rotate-12 transition-all duration-300 transform shrink-0">
          <IconComponent size={13} />
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline">
        <p
          className={`text-lg sm:text-xl font-black ${style.valColor} tracking-tight leading-none`}
        >
          {loading ? "..." : item.value}
        </p>
      </div>
      <div className="mt-0.5 overflow-hidden">
        <p className="text-[8.5px] sm:text-[9px] font-semibold text-slate-400 leading-tight">
          {loading ? "Loading..." : item.sub}
        </p>
      </div>
    </motion.div>
  );
}
