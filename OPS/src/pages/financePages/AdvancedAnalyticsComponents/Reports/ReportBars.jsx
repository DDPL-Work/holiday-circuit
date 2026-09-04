import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  shineStyle,
  formatCompactCurrency,
  formatPlainNumber,
} from "../utils/formatter";

export default function ReportBars({
  rows = [],
  valueKey,
  labelKey = "label",
  loading,
}) {
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (label) => {
    setExpandedRows((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div className="space-y-2.5">
      <style dangerouslySetInnerHTML={{ __html: shineStyle }} />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          {loading ? "Loading report..." : "No report data available"}
        </div>
      ) : (
        rows.map((row, index) => {
          const value = Number(row[valueKey] || 0);
          const isRevenue = valueKey === "revenue";
          const receivedPayment = Number(row.receivedPayment || 0);
          const fillWidth = isRevenue
            ? value > 0
              ? Math.min(
                  100,
                  Math.max(
                    receivedPayment > 0 ? 4 : 0,
                    (receivedPayment / value) * 100
                  )
                )
              : 0
            : Math.max(4, Math.round((value / maxValue) * 100));

          const compactRevenueValue = formatCompactCurrency(receivedPayment || value);
          const tooltipValue = isRevenue
            ? formatCompactCurrency(receivedPayment)
            : `${formatPlainNumber(value)}`;
          const rightBadgeValue = isRevenue
            ? formatCompactCurrency(value)
            : `${formatPlainNumber(value)}`;
          const displayValue = formatPlainNumber(value);

          let comparisonText = "";
          let comparisonColor = "text-slate-400";

          if (index > 0) {
            const prevValue = Number(rows[index - 1][valueKey] || 0);
            const diff = Math.abs(value - prevValue);
            const formattedDiff =
              valueKey === "revenue" ? formatCompactCurrency(diff) : diff;

            if (value > prevValue) {
              comparisonText = `+${formattedDiff} MoM`;
              comparisonColor =
                "text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 shadow-sm";
            } else if (value < prevValue) {
              comparisonText = `-${formattedDiff} MoM`;
              comparisonColor =
                "text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 shadow-sm";
            } else {
              comparisonText = "Flat";
              comparisonColor =
                "text-[10px] font-extrabold text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 shadow-sm";
            }
          }

          const hasDestinations = row.destinations && row.destinations.length > 0;

          return (
            <div
              key={row[labelKey]}
              className={`border border-slate-100 rounded-2xl bg-gradient-to-r from-slate-50/40 via-white to-slate-50/10 p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-2 group relative ${
                hasDestinations ? "cursor-pointer" : "cursor-default"
              } ${expandedRows[row[labelKey]] ? "z-30" : "z-10"}`}
              onClick={() => {
                if (hasDestinations) {
                  toggleExpand(row[labelKey]);
                }
              }}
            >
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {row[labelKey]}
                  </span>
                  {comparisonText && <span className={comparisonColor}>{comparisonText}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  {!isRevenue && (
                    <span className="font-black text-slate-800">
                      {loading ? "..." : displayValue}
                    </span>
                  )}
                  {!loading && hasDestinations && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(row[labelKey]);
                      }}
                      className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all cursor-pointer"
                    >
                      <ChevronDown
                        size={14}
                        className={`transform transition-transform duration-200 ${
                          expandedRows[row[labelKey]] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
              {/* Progress Line and Badges/Tooltips */}
              <div
                className={`relative flex items-center w-full ${
                  isRevenue ? "pr-[72px]" : "pr-[50px]"
                } mt-6 mb-2.5`}
              >
                {/* Tooltip Popup */}
                <motion.div
                  className="absolute bottom-full mb-3 -translate-x-1/2 bg-slate-900/95 border border-slate-700/50 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.75 rounded-md shadow-[0_4px_12px_rgba(15,23,42,0.15)] flex flex-col items-center z-20 pointer-events-none font-mono whitespace-nowrap"
                  initial={{ left: 0, opacity: 0, scale: 0.8 }}
                  animate={{ left: `${fillWidth}%`, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.85, ease: "easeOut", delay: index * 0.04 }}
                >
                  <span>{tooltipValue}</span>
                  {/* Tooltip triangle indicator pointing down */}
                  <div className="w-1.5 h-1.5 bg-slate-900/95 border-r border-b border-slate-700/50 rotate-45 absolute -bottom-[3.5px] left-1/2 -translate-x-1/2" />
                </motion.div>

                <div
                  className={`w-full overflow-hidden rounded-full shadow-inner relative p-[0.5px] flex items-center h-2 ${
                    isRevenue
                      ? "bg-rose-500/10 border border-rose-100/50"
                      : "bg-blue-500/10 border border-blue-100/50"
                  }`}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${fillWidth}%` }}
                    transition={{ duration: 0.85, ease: "easeOut", delay: index * 0.04 }}
                  />
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-200 px-2 py-0.75 shadow-sm z-10 font-mono">
                  {rightBadgeValue}
                </div>
              </div>
              {isRevenue && (
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
                  <span>Received {formatCompactCurrency(receivedPayment)}</span>
                  <span>Total {formatCompactCurrency(value)}</span>
                </div>
              )}

              <AnimatePresence>
                {expandedRows[row[labelKey]] && hasDestinations && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-full mt-2 z-40 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-left">
                      Query Destinations
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {row.destinations.map((dest) => (
                        <div
                          key={dest.name}
                          className="flex justify-between items-center bg-slate-50/70 hover:bg-slate-100/50 rounded-xl px-3 py-1.5 border border-slate-100/60 transition-colors"
                        >
                          <span className="font-bold text-slate-700">{dest.name}</span>
                          <span className="font-black text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-lg text-[10px]">
                            {dest.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}
