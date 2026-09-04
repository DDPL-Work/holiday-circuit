import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  X,
  Sparkles,
  Calendar,
  TrendingUp,
  MapPin,
} from "lucide-react";

export default function QueryAnalyticsModal({
  showQueryModal,
  setShowQueryModal,
  querySummaryCards,
  loading,
  monthlyQueryRows,
  confirmationColumns,
  confirmationTrendRows,
  destinationQueryColumns,
  paginatedDestinationRows,
  destinationQueryRows,
  itemsPerPage,
  startIdx,
  endIdx,
  destinationPage,
  setDestinationPage,
  totalPages,
  ReportSummaryCard,
  ReportBars,
  ReportTable,
}) {
  if (!showQueryModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-[1250px] w-[95vw] h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white select-none">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
              <FileText size={18} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight leading-tight">Query Analytics</h2>
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mt-0.5">
                Reports & Destination Wise Insights
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQueryModal(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 thin-scrollbar bg-slate-50/50">
          {/* Summary Cards */}
          <div>
            <h3 className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles size={12} className="text-blue-500 animate-pulse" />
              Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
              {querySummaryCards.length ? (
                querySummaryCards.map((item) => <ReportSummaryCard key={item.label} item={item} loading={loading} />)
              ) : (
                Array.from({ length: 4 }).map((_, index) => (
                  <ReportSummaryCard key={`query-empty-${index}`} item={{ label: 'Report', value: '0', sub: 'No data' }} loading={loading} />
                ))
              )}
            </div>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6 bg-white p-5 border border-slate-100 rounded-2xl shadow-sm">
              <div>
                <h3 className="flex items-center gap-2 mb-3 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Calendar size={14} className="text-blue-500" />
                  Monthly Queries
                </h3>
                <ReportBars rows={monthlyQueryRows} valueKey="queries" colorClass="bg-blue-500" loading={loading} />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="flex items-center gap-2 mb-3 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <TrendingUp size={14} className="text-indigo-500" />
                  Confirmation Trends
                </h3>
                <ReportTable columns={confirmationColumns} rows={confirmationTrendRows} loading={loading} />
              </div>
            </div>

            {/* Right Column */}
            <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="flex items-center gap-2 mb-3 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <MapPin size={14} className="text-pink-500" />
                  Destination Wise Queries
                </h3>
                <ReportTable columns={destinationQueryColumns} rows={paginatedDestinationRows} loading={loading} />
              </div>

              {/* Pagination */}
              {!loading && destinationQueryRows.length > itemsPerPage && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                  <span>
                    Showing <span className="text-slate-800 font-bold">{startIdx + 1}</span> to{' '}
                    <span className="text-slate-800 font-bold">{Math.min(endIdx, destinationQueryRows.length)}</span> of{' '}
                    <span className="text-slate-800 font-bold">{destinationQueryRows.length}</span> entries
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setDestinationPage((prev) => Math.max(prev - 1, 1))}
                      disabled={destinationPage === 1}
                      className="flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const isCurrent = p === destinationPage;
                      return (
                        <button
                          key={p}
                          onClick={() => setDestinationPage(p)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border font-bold transition-all cursor-pointer ${isCurrent
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setDestinationPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={destinationPage === totalPages}
                      className="flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
