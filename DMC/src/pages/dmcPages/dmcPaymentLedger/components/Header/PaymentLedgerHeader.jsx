import React from "react";
import { Layers3, RefreshCw } from "lucide-react";

export const PaymentLedgerHeader = ({
  creditPeriodDays,
  setCreditPeriodDays,
  loadLedger,
  loading,
}) => {
  return (
    <div className="mb-4 border border-slate-200 bg-white px-5 py-4 shadow-sm rounded-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1e3a8a] via-[#111827] to-slate-900 text-white shadow-lg ring-4 ring-blue-50 shrink-0">
            <Layers3 size={22} className="animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-white">
              ✓
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">
              DMC PAYABLE LEDGER
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-800 tracking-tight">
              Bulk Settlement
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 font-medium">
              View booked services by 7-day or 15-day credit cycle, then select services and send one combined settlement invoice to finance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {[7, 15].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setCreditPeriodDays(days)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
                creditPeriodDays === days
                  ? "border-slate-900 bg-gradient-to-br from-[#1e3a8a] via-[#111827] to-black shadow-[0_10px_24px_rgba(15,23,42,0.22)]"
                  : "border-slate-700/20 bg-gradient-to-br from-[#243b75] via-[#172033] to-black/90 opacity-80 hover:opacity-100"
              }`}
            >
              {days}-day credit
            </button>
          ))}
          <button
            type="button"
            onClick={loadLedger}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
