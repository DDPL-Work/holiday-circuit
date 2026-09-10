import React from "react";
import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";

export default function TaxCard({
  title,
  subtitle,
  total,
  totalColor = "from-blue-600 to-indigo-600",
  gradientClass = "from-blue-50/60 via-white to-blue-50/10",
  borderClass = "border-blue-100/70 hover:border-blue-300/80 hover:shadow-blue-500/5",
  icon = IndianRupee,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-500",
  rateLabel,
  status,
  breakdown,
  loading,
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`bg-gradient-to-br ${gradientClass} border ${borderClass} rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group cursor-default`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">
              {subtitle}
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{title}</h3>
          </div>
          <div
            className={`p-2.5 rounded-xl ${iconBg} shadow-inner group-hover:scale-110 transition-transform duration-300`}
          >
            {React.createElement(icon, { className: `w-4 h-4 ${iconColor}` })}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-medium text-slate-400 block">{rateLabel}</span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p
              className={`text-2xl font-black tracking-tight bg-gradient-to-r ${totalColor} bg-clip-text text-transparent`}
            >
              {loading ? "..." : total}
            </p>
            <span className="inline-flex items-center bg-emerald-50/90 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 shadow-sm">
              {loading ? "Loading" : status}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100/90 pt-4 mt-5 space-y-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">{item.label}</span>
            <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/50">
              {loading ? "..." : item.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
