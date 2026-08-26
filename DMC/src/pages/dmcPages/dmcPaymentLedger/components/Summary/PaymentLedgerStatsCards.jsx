import React from "react";
import { formatMoney } from "../../utils/dmcPaymentLedgerHelpers";

export const PaymentLedgerStatsCards = ({ summary = {}, selectedRefsCount = 0, selectedTotal = 0 }) => {
  const cards = [
    ["Eligible", summary?.eligibleServices || 0, formatMoney(summary?.eligibleAmount || 0), {
      bg: "bg-gradient-to-br from-blue-50/90 via-blue-50/20 to-white",
      border: "border-slate-200 border-b-4 border-b-blue-600",
      text: "text-blue-700"
    }],
    ["Due Now", summary?.dueServices || 0, formatMoney(summary?.dueAmount || 0), {
      bg: "bg-gradient-to-br from-amber-50/90 via-amber-50/20 to-white",
      border: "border-slate-200 border-b-4 border-b-amber-600",
      text: "text-amber-700"
    }],
    ["Overdue", summary?.overdueServices || 0, "Needs attention", {
      bg: "bg-gradient-to-br from-rose-50/90 via-rose-50/20 to-white",
      border: "border-slate-200 border-b-4 border-b-rose-600",
      text: "text-rose-700"
    }],
    ["Selected", selectedRefsCount, formatMoney(selectedTotal)],
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
      {cards.map(([label, value, helper, theme]) => {
        const cardTheme = theme || {
          bg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/20 to-white",
          border: "border-slate-200 border-b-4 border-b-emerald-600",
          text: "text-emerald-700"
        };
        return (
          <div
            key={label}
            className={`rounded-xl border ${cardTheme.border} ${cardTheme.bg} px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${cardTheme.text}`}>{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
          </div>
        );
      })}
    </div>
  );
};
