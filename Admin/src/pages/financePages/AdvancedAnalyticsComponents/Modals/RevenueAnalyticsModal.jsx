import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../../utils/Api";
import {
  IndianRupee,
  X,
  Sparkles,
  Receipt,
  TrendingUp,
  FileText,
  MapPin,
  ChevronDown,
} from "lucide-react";


const ComparisonDropdown = ({ period, value, onChange }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When dropdown opens, initialise the year navigator to the value already selected (if any)
  useEffect(() => {
    if (isOpen && value) {
      const yr = parseInt(value.split("-")[0], 10);
      if (!isNaN(yr)) setPickerYear(yr);
    }
  }, [isOpen]);

  // Options change with pickerYear — fully independent of the active period year
  const options = useMemo(() => {
    if (period === "monthly") {
      return Array.from({ length: 12 }, (_, i) => {
        const d   = new Date(pickerYear, i, 1);
        const val = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
        return { val, label: d.toLocaleString("en-US", { month: "short", year: "numeric" }) };
      });
    }
    if (period === "quarterly") {
      return [1, 2, 3, 4].map((q) => ({
        val:   `${pickerYear}-Q${q}`,
        label: `Q${q} ${pickerYear}`,
      }));
    }
    if (period === "yearly") {
      // Show 12 years around pickerYear
      return Array.from({ length: 12 }, (_, i) => {
        const yr = pickerYear - 5 + i;
        return { val: String(yr), label: String(yr) };
      });
    }
    return [];
  }, [period, pickerYear]);

  // Resolve display label for the trigger button (value may be from a different year than pickerYear)
  const selectedLabel = useMemo(() => {
    if (!value) return "Select";
    if (period === "monthly") {
      const [y, m] = value.split("-");
      return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
    }
    if (period === "quarterly") {
      const [y, q] = value.split("-");
      return `${q} ${y}`;
    }
    return value;
  }, [value, period]);

  const yearStep = period === "monthly" ? 1 : period === "quarterly" ? 1 : 12;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen((v) => !v)}
        className={`w-36 sm:w-40 h-9 flex items-center justify-between rounded-lg border px-2.5 text-xs font-bold cursor-pointer transition-all shadow-sm ${
          isOpen
            ? "border-indigo-300 ring-2 ring-indigo-100 bg-white text-slate-800"
            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-30 mt-1.5 w-52 rounded-xl border border-slate-100 bg-white shadow-2xl overflow-hidden"
          >
            {/* Year navigator */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50 select-none">
              <button
                type="button"
                onClick={() => setPickerYear((y) => y - yearStep)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ChevronDown size={13} className="rotate-90" />
              </button>
              <span className="text-xs font-extrabold text-slate-700">
                {period === "yearly"
                  ? `${pickerYear - 5} – ${pickerYear + 6}`
                  : pickerYear}
              </span>
              <button
                type="button"
                onClick={() => setPickerYear((y) => y + yearStep)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ChevronDown size={13} className="-rotate-90" />
              </button>
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto thin-scrollbar">
              {options.map((opt) => (
                <div
                  key={opt.val}
                  onClick={() => { onChange(opt.val); setIsOpen(false); }}
                  className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between ${
                    value === opt.val
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.val && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RevenueAnalyticsModal({
  showRevenueModal,
  setShowRevenueModal,
  revenueSummaryCards,
  loading,
  showRevenueChecklist,
  setShowRevenueChecklist,
  checklistData,
  effectiveSelectedTaxMonth,
  effectiveSelectedTaxQuarter,
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
  // ── Derive the default base value from whichever period is active on the page ──
  const defaultBase = useMemo(() => {
    if (period === "monthly")   return effectiveSelectedTaxMonth;
    if (period === "quarterly") return effectiveSelectedTaxQuarter;
    if (period === "yearly")    return effectiveSelectedTaxYear;
    return "";
  }, [period, effectiveSelectedTaxMonth, effectiveSelectedTaxQuarter, effectiveSelectedTaxYear]);

  const [basePeriod,       setBasePeriod]       = useState("");
  const [baseData,         setBaseData]          = useState(null);
  const [baseLoading,      setBaseLoading]       = useState(false);
  const [comparisonPeriod, setComparisonPeriod]  = useState("");
  const [comparedData,     setComparedData]      = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Keep basePeriod in sync with active page period when modal opens
  useEffect(() => { setBasePeriod(defaultBase); }, [defaultBase]);

  // Helper: convert any period value → API date params
  const periodToParams = (pType, pValue) => {
    const params = {};
    if (pType === "monthly") {
      const [yr, mn] = pValue.split("-");
      params.startDate = `${yr}-${mn}-01`;
      const lastDay = new Date(Number(yr), Number(mn), 0).getDate();
      params.endDate = `${yr}-${mn}-${String(lastDay).padStart(2, "0")}`;
    } else if (pType === "quarterly") {
      const [yr, q] = pValue.split("-Q");
      const sm = String((Number(q) - 1) * 3 + 1).padStart(2, "0");
      const em = String(Number(q) * 3).padStart(2, "0");
      params.startDate = `${yr}-${sm}-01`;
      const lastDay = new Date(Number(yr), Number(em), 0).getDate();
      params.endDate = `${yr}-${em}-${String(lastDay).padStart(2, "0")}`;
    } else if (pType === "yearly") {
      params.startDate = `${pValue}-01-01`;
      params.endDate   = `${pValue}-12-31`;
    }
    return params;
  };

  // Fetch base-side data whenever basePeriod differs from the page default
  useEffect(() => {
    if (!basePeriod || basePeriod === defaultBase) {
      setBaseData(null);   // use revenueSummaryCards from props (page already fetched it)
      return;
    }
    const fetch = async () => {
      try {
        setBaseLoading(true);
        const { data } = await API.get("/admin/advanced-analytics", { params: periodToParams(period, basePeriod) });
        setBaseData(data?.data?.customReports?.revenue?.summaryCards || []);
      } catch { setBaseData([]); }
      finally { setBaseLoading(false); }
    };
    fetch();
  }, [basePeriod, period]);

  // Fetch comparison-side data
  useEffect(() => {
    if (!comparisonPeriod) { setComparedData(null); return; }
    const fetch = async () => {
      try {
        setComparisonLoading(true);
        const { data } = await API.get("/admin/advanced-analytics", { params: periodToParams(period, comparisonPeriod) });
        setComparedData(data?.data?.customReports?.revenue?.summaryCards || []);
      } catch { setComparedData([]); }
      finally { setComparisonLoading(false); }
    };
    fetch();
  }, [comparisonPeriod, period]);

  // Which card array is the "current" (left) side
  const effectiveBaseCards = baseData ?? revenueSummaryCards;
  const effectiveBaseLoading = basePeriod !== defaultBase ? baseLoading : loading;

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
          
          {/* Comparison Filter */}
          {(period === "monthly" || period === "quarterly" || period === "yearly") && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Compare:</span>
              <div className="flex flex-wrap items-center gap-2">
                {/* LEFT side — editable base period */}
                <div className="flex items-center gap-1.5">
                  <ComparisonDropdown
                    period={period}
                    value={basePeriod}
                    onChange={setBasePeriod}
                  />
                  {basePeriod !== defaultBase && (
                    <button
                      onClick={() => setBasePeriod(defaultBase)}
                      title="Reset to current period"
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-400 hover:text-amber-600 transition cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-black text-slate-300 uppercase px-1">VS</span>

                {/* RIGHT side — comparison period */}
                <div className="flex items-center gap-1.5">
                  <ComparisonDropdown
                    period={period}
                    value={comparisonPeriod}
                    onChange={setComparisonPeriod}
                  />
                  {comparisonPeriod && (
                    <button
                      onClick={() => setComparisonPeriod("")}
                      title="Clear comparison"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div>
            <h3 className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles size={12} className="text-emerald-500 animate-pulse" />
              Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full">
              {effectiveBaseCards.length ? (
                effectiveBaseCards.map((item) => {
                  const labelUpper = (item.styleKey || item.label || "").toUpperCase();
                  const comparedItem = comparedData?.find(c => (c.styleKey || c.label || "").toUpperCase() === labelUpper);
                  return (
                    <ReportSummaryCard
                      key={item.label}
                      item={item}
                      comparedItem={comparedItem}
                      loading={effectiveBaseLoading}
                      comparedLoading={comparisonLoading}
                    />
                  );
                })
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
                      period={period}
                      effectiveSelectedTaxMonth={effectiveSelectedTaxMonth}
                      effectiveSelectedTaxQuarter={effectiveSelectedTaxQuarter}
                      effectiveSelectedTaxYear={effectiveSelectedTaxYear}
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
