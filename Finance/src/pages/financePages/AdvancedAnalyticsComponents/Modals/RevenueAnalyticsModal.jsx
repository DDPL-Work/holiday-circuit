import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  X,
  Sparkles,
  Receipt,
  TrendingUp,
  FileText,
  MapPin,
} from "lucide-react";

export default function RevenueAnalyticsModal({
  showRevenueModal,
  setShowRevenueModal,
  revenueSummaryCards,
  loading,
  showRevenueChecklist,
  setShowRevenueChecklist,
  checklistData,
  effectiveSelectedTaxMonth,
  effectiveSelectedTaxYear,
  selectedPastMonthOverride,
  setSelectedPastMonthOverride,
  selectedUpcomingMonthOverride,
  setSelectedUpcomingMonthOverride,
  pastMonthsList,
  period,
  appliedCustomRange,
  travelDateEntries,
  previousMonthRevenueTotal,
  destinationProfitColumns,
  paginatedProfitRows,
  destinationProfitRows,
  itemsPerPage,
  startProfitIdx,
  endProfitIdx,
  profitabilityPage,
  setProfitabilityPage,
  totalProfitPages,
  ReportSummaryCard,
  RevenueChecklistTable,
  RevenueAnalyticsChart,
  ReportTable,
}) {
  if (!showRevenueModal) return null;

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 text-white select-none">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
              <IndianRupee size={18} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-extrabold tracking-tight leading-tight">Revenue Analytics</h2>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
                Earnings, Costs & Profitability Insights
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRevenueModal(false)}
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
              <Sparkles size={12} className="text-emerald-500 animate-pulse" />
              Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full">
              {revenueSummaryCards.length ? (
                revenueSummaryCards.map((item) => <ReportSummaryCard key={item.label} item={item} loading={loading} />)
              ) : (
                Array.from({ length: 5 }).map((_, index) => (
                  <ReportSummaryCard key={`revenue-empty-${index}`} item={{ label: 'Report', value: '0', sub: 'No data' }} loading={loading} />
                ))
              )}
            </div>
          </div>

          {/* Charts and Tables - Stacked vertically (Full Width) */}
          <div className="flex flex-col gap-6 w-full">
            {/* Verified Payment Revenue (Top Section) */}
            <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm w-full">
              <div className="flex items-center justify-between mb-3.5 pb-1 border-b border-slate-105">
                <h3 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Receipt size={14} className="text-emerald-500" />
                  Verified Payment Revenue
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRevenueChecklist(!showRevenueChecklist)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all duration-200 shadow-sm border border-slate-200 cursor-pointer"
                >
                  {showRevenueChecklist ? (
                    <>
                      <TrendingUp size={11} className="text-indigo-500" />
                      Show Chart
                    </>
                  ) : (
                    <>
                      <FileText size={11} className="text-emerald-500" />
                      Check List
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {showRevenueChecklist ? (
                  <motion.div
                    key="checklist"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RevenueChecklistTable
                      groups={checklistData}
                      effectiveSelectedTaxMonth={effectiveSelectedTaxMonth}
                      loading={loading}
                      selectedPastMonth={selectedPastMonthOverride}
                      onSelectPastMonth={setSelectedPastMonthOverride}
                      selectedUpcomingMonth={selectedUpcomingMonthOverride}
                      onSelectUpcomingMonth={setSelectedUpcomingMonthOverride}
                      pastMonthsList={pastMonthsList}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chart"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RevenueAnalyticsChart
                      loading={loading}
                      period={period}
                      effectiveSelectedTaxMonth={effectiveSelectedTaxMonth}
                      effectiveSelectedTaxYear={effectiveSelectedTaxYear}
                      appliedCustomRange={appliedCustomRange}
                      travelDateEntries={travelDateEntries}
                      groups={checklistData}
                      previousMonthRevenueTotal={previousMonthRevenueTotal}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Destination Profitability (Bottom Section) */}
            <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between w-full">
              <div>
                <h3 className="flex items-center gap-2 mb-3 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <MapPin size={14} className="text-teal-500" />
                  Destination Profitability
                </h3>
                <ReportTable columns={destinationProfitColumns} rows={paginatedProfitRows} loading={loading} />
              </div>

              {/* Pagination */}
              {!loading && destinationProfitRows.length > itemsPerPage && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                  <span>
                    Showing <span className="text-slate-800 font-bold">{startProfitIdx + 1}</span> to{' '}
                    <span className="text-slate-800 font-bold">{Math.min(endProfitIdx, destinationProfitRows.length)}</span> of{' '}
                    <span className="text-slate-800 font-bold">{destinationProfitRows.length}</span> entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setProfitabilityPage((prev) => Math.max(prev - 1, 1))}
                      disabled={profitabilityPage === 1}
                      className="flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalProfitPages }, (_, i) => i + 1).map((p) => {
                      const isCurrent = p === profitabilityPage;
                      return (
                        <button
                          key={p}
                          onClick={() => setProfitabilityPage(p)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border font-bold transition-all cursor-pointer ${isCurrent
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setProfitabilityPage((prev) => Math.min(prev + 1, totalProfitPages))}
                      disabled={profitabilityPage === totalProfitPages}
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
