import React from "react";
import { Box, Truck, CheckCircle, AlertCircle } from "lucide-react";

export const ContractedRatesStatsCards = () => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-7">
      <div className="group relative bg-gradient-to-br from-purple-50/60 to-white hover:from-purple-100/40 hover:to-purple-50/20 rounded-2xl p-5 flex justify-between items-center border border-purple-100/70 border-b-[3.5px] border-b-purple-500/80 hover:border-purple-300 hover:border-b-purple-600 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 transition-all duration-300">
        <div className="space-y-1 min-w-0">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Total Hotels</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-purple-900 transition-colors duration-300">1,248</p>
        </div>
        <div className="bg-purple-50/80 border border-purple-100/50 p-2.5 rounded-xl text-purple-650 shadow-[0_2px_8px_rgba(147,51,234,0.05)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
          <Box size={20} className="stroke-[2.2px] text-purple-650" />
        </div>
      </div>

      <div className="group relative bg-gradient-to-br from-blue-50/60 to-white hover:from-blue-100/40 hover:to-blue-50/20 rounded-2xl p-5 flex justify-between items-center border border-blue-100/70 border-b-[3.5px] border-b-blue-500/80 hover:border-blue-300 hover:border-b-blue-600 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300">
        <div className="space-y-1 min-w-0">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Transport Options</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-blue-900 transition-colors duration-300">456</p>
        </div>
        <div className="bg-blue-50/80 border border-blue-100/50 p-2.5 rounded-xl text-blue-650 shadow-[0_2px_8px_rgba(59,130,246,0.05)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
          <Truck size={20} className="stroke-[2.2px] text-blue-650" />
        </div>
      </div>

      <div className="group relative bg-gradient-to-br from-emerald-50/60 to-white hover:from-emerald-100/40 hover:to-emerald-50/20 rounded-2xl p-5 flex justify-between items-center border border-emerald-100/70 border-b-[3.5px] border-b-emerald-500/80 hover:border-emerald-300 hover:border-b-emerald-600 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
        <div className="space-y-1 min-w-0">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Active Contracts</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-emerald-900 transition-colors duration-300">892</p>
        </div>
        <div className="bg-emerald-50/80 border border-emerald-100/50 p-2.5 rounded-xl text-emerald-650 shadow-[0_2px_8px_rgba(16,185,129,0.05)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
          <CheckCircle size={20} className="stroke-[2.2px] text-emerald-650" />
        </div>
      </div>

      <div className="group relative bg-gradient-to-br from-amber-50/60 to-white hover:from-amber-100/40 hover:to-amber-50/20 rounded-2xl p-5 flex justify-between items-center border border-amber-100/70 border-b-[3.5px] border-b-amber-500/80 hover:border-amber-300 hover:border-b-amber-600 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all duration-300">
        <div className="space-y-1 min-w-0">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Expiring Soon</p>
          <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-amber-900 transition-colors duration-300">34</p>
        </div>
        <div className="bg-amber-50/80 border border-amber-100/50 p-2.5 rounded-xl text-amber-650 shadow-[0_2px_8px_rgba(245,158,11,0.05)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
          <AlertCircle size={20} className="stroke-[2.2px] text-amber-655" />
        </div>
      </div>
    </div>
  );
};
