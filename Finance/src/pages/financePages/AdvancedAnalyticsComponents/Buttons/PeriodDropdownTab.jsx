import React from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export default function PeriodDropdownTab({
  active,
  label,
  selectedLabel,
  onToggleMenu,
}) {
  return (
    <button
      type="button"
      onClick={onToggleMenu}
      className={`relative flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out cursor-pointer whitespace-nowrap z-10 shrink-0 ${
        active ? "text-white font-bold" : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activePeriodTab"
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-full shadow -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Calendar className="w-3.5 h-3.5 shrink-0" />
      <span>{active && selectedLabel ? selectedLabel : label}</span>
    </button>
  );
}
