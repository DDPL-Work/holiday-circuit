import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
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
  Download,
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
  const [baseDestinationProfit, setBaseDestinationProfit] = useState(null);
  const [baseLoading,      setBaseLoading]       = useState(false);
  const [comparisonPeriod, setComparisonPeriod]  = useState("");
  const [comparedData,     setComparedData]      = useState(null);
  const [comparedDestinationProfit, setComparedDestinationProfit] = useState(null);
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
      setBaseDestinationProfit(null);
      return;
    }
    const fetch = async () => {
      try {
        setBaseLoading(true);
        const { data } = await API.get("/admin/advanced-analytics", { params: periodToParams(period, basePeriod) });
        const rev = data?.data?.customReports?.revenue || data?.data?.reports?.revenue || {};
        setBaseData(rev.summaryCards || []);
        setBaseDestinationProfit(rev.destinationProfitability || []);
      } catch { 
        setBaseData([]); 
        setBaseDestinationProfit([]);
      }
      finally { setBaseLoading(false); }
    };
    fetch();
  }, [basePeriod, period, defaultBase]);

  // Fetch comparison-side data
  useEffect(() => {
    if (!comparisonPeriod) { 
      setComparedData(null); 
      setComparedDestinationProfit(null);
      return; 
    }
    const fetch = async () => {
      try {
        setComparisonLoading(true);
        const { data } = await API.get("/admin/advanced-analytics", { params: periodToParams(period, comparisonPeriod) });
        const rev = data?.data?.customReports?.revenue || data?.data?.reports?.revenue || {};
        setComparedData(rev.summaryCards || []);
        setComparedDestinationProfit(rev.destinationProfitability || []);
      } catch { 
        setComparedData([]); 
        setComparedDestinationProfit([]);
      }
      finally { setComparisonLoading(false); }
    };
    fetch();
  }, [comparisonPeriod, period]);

  // Which card array is the "current" (left) side
  const effectiveBaseCards = baseData ?? revenueSummaryCards;
  const effectiveBaseLoading = basePeriod !== defaultBase ? baseLoading : loading;
  const effectiveDestinationProfitRows = baseDestinationProfit ?? destinationProfitRows;

  const displayProfitRows = useMemo(() => {
    if (baseDestinationProfit) {
      return baseDestinationProfit.slice(startProfitIdx, endProfitIdx);
    }
    return paginatedProfitRows;
  }, [baseDestinationProfit, paginatedProfitRows, startProfitIdx, endProfitIdx]);

  const handleExcelExport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Resolve period strings and display labels
      let currentPeriodStr = "";
      let pastPeriodStrDefault = "";
      let upcomingPeriodStrDefault = "";

      if (period === "monthly") {
        const [selectedYear, selectedMonth] = (effectiveSelectedTaxMonth || "").split("-").map(Number);
        currentPeriodStr = effectiveSelectedTaxMonth;
        if (selectedYear && selectedMonth) {
          const pastMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
          const upcomingMonthDate = new Date(selectedYear, selectedMonth, 1);
          pastPeriodStrDefault = `${pastMonthDate.getFullYear()}-${String(pastMonthDate.getMonth() + 1).padStart(2, "0")}`;
          upcomingPeriodStrDefault = `${upcomingMonthDate.getFullYear()}-${String(upcomingMonthDate.getMonth() + 1).padStart(2, "0")}`;
        }
      } else if (period === "quarterly") {
        currentPeriodStr = effectiveSelectedTaxQuarter;
        const [yStr, qStr] = (effectiveSelectedTaxQuarter || "").split("-Q");
        const y = Number(yStr);
        const q = Number(qStr);
        if (y && q) {
          const pQ = q === 1 ? 4 : q - 1;
          const pY = q === 1 ? y - 1 : y;
          pastPeriodStrDefault = `${pY}-Q${pQ}`;
          const uQ = q === 4 ? 1 : q + 1;
          const uY = q === 4 ? y + 1 : y;
          upcomingPeriodStrDefault = `${uY}-Q${uQ}`;
        }
      } else if (period === "yearly") {
        currentPeriodStr = String(effectiveSelectedTaxYear);
        const y = Number(currentPeriodStr);
        if (y) {
          pastPeriodStrDefault = String(y - 1);
          upcomingPeriodStrDefault = String(y + 1);
        }
      }

      const pastPeriodStr = selectedPastMonthOverride || pastPeriodStrDefault;
      const upcomingPeriodStr = selectedUpcomingMonthOverride || upcomingPeriodStrDefault;

      const formatPeriodLabel = (str) => {
        if (!str) return "-";
        if (period === "monthly") {
          const [y, m] = str.split("-").map(Number);
          if (y && m) return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } else if (period === "quarterly") {
          const [y, q] = str.split("-");
          return `${q} ${y}`;
        } else if (period === "yearly") {
          return `Year ${str}`;
        }
        return str;
      };

      const activePeriodLabel = formatPeriodLabel(basePeriod || defaultBase);

      const calculateGroupTotals = (list = []) => {
        return (list || []).reduce(
          (acc, invoice) => {
            const m = invoice.computedMetrics || {};
            acc.incoming += Number(m.incoming || 0);
            acc.incomingPaid += Number(m.incomingPaid || 0);
            acc.dueAgent += Number(m.dueAgent || 0);
            acc.outgoing += Number(m.outgoing || 0);
            acc.outgoingPaid += Number(m.outgoingPaid || 0);
            acc.upcomingDmc += Number(m.upcomingDmc || 0);
            acc.grossProfit += Number(m.grossProfit || 0);
            return acc;
          },
          {
            incoming: 0,
            incomingPaid: 0,
            dueAgent: 0,
            outgoing: 0,
            outgoingPaid: 0,
            upcomingDmc: 0,
            grossProfit: 0,
          }
        );
      };

      const autoFitColumns = (rows) => {
        const colWidths = [];
        rows.forEach((r) => {
          if (Array.isArray(r)) {
            r.forEach((cell, idx) => {
              const len = cell !== null && cell !== undefined ? String(cell).length : 0;
              colWidths[idx] = Math.max(colWidths[idx] || 10, Math.min(len + 3, 45));
            });
          }
        });
        return colWidths.map((w) => ({ wch: w }));
      };

      // ───────────────────────────────────────────
      // 1. Overview Sheet
      // ───────────────────────────────────────────
      const overviewRows = [
        ["REVENUE ANALYTICS OVERVIEW"],
        ["DATA FOR PERIOD", activePeriodLabel],
        ["Applied Base Period Filter", activePeriodLabel + ` (${basePeriod || defaultBase || "All"})`],
        ["Comparison Period Filter", comparisonPeriod ? formatPeriodLabel(comparisonPeriod) + ` (${comparisonPeriod})` : "None"],
        ["Report Generated On", new Date().toLocaleString()],
        [],
        [`OVERVIEW METRICS (DATA FOR: ${activePeriodLabel})`],
        [
          "Applied Filter Period",
          "Metric",
          `Base Value (${activePeriodLabel})`,
          comparisonPeriod ? `Comparison Value (${formatPeriodLabel(comparisonPeriod)})` : "Comparison Value",
          "Status / Note"
        ]
      ];

      if (effectiveBaseCards && effectiveBaseCards.length > 0) {
        effectiveBaseCards.forEach((item) => {
          const labelUpper = (item.styleKey || item.label || "").toUpperCase();
          const comparedItem = comparedData?.find((c) => (c.styleKey || c.label || "").toUpperCase() === labelUpper);
          overviewRows.push([
            activePeriodLabel,
            item.label || "",
            item.value || "0",
            comparedItem ? comparedItem.value || "0" : "-",
            comparedItem && comparedItem.sub ? comparedItem.sub : (item.sub || "")
          ]);
        });
      }
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
      overviewSheet["!cols"] = autoFitColumns(overviewRows);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

      // ───────────────────────────────────────────
      // 2. Verified Payment Revenue Sheet (Full Summary & All Filtered Bookings)
      // ───────────────────────────────────────────
      const periodBuckets = [
        { key: "past", label: "Past", periodVal: pastPeriodStr },
        { key: "current", label: "Present", periodVal: currentPeriodStr },
        { key: "upcoming", label: "Upcoming", periodVal: upcomingPeriodStr },
      ];

      const bucketTotals = {
        past: calculateGroupTotals(checklistData?.past || []),
        current: calculateGroupTotals(checklistData?.current || []),
        upcoming: calculateGroupTotals(checklistData?.upcoming || []),
      };

      const checklistRows = [
        ["VERIFIED PAYMENT REVENUE REPORT"],
        ["DATA FOR PERIOD", activePeriodLabel],
        ["Applied Base Filter", `${activePeriodLabel} (${currentPeriodStr})`],
        ["Period Filter Type", (period || "monthly").toUpperCase()],
        ["Present Period Filter", `${formatPeriodLabel(currentPeriodStr)} (${currentPeriodStr})`],
        ["Past Period Filter", `${formatPeriodLabel(pastPeriodStr)} (${pastPeriodStr})`],
        ["Upcoming Period Filter", `${formatPeriodLabel(upcomingPeriodStr)} (${upcomingPeriodStr})`],
        ["Report Generated On", new Date().toLocaleString()],
        [],
        [`SECTION 1: PERIOD LEVEL FINANCIAL SUMMARY (DATA FOR: ${activePeriodLabel})`],
        [
          "Applied Filter Period",
          "Period Bucket",
          "Target Period",
          "Total Bookings",
          "Total Billed / Revenue (₹)",
          "Payment Received (₹)",
          "Pending Payment to Collect (₹)",
          "Total DMC Cost (₹)",
          "Paid to DMC (₹)",
          "Pending Payment to DMC (₹)",
          "Gross Profit (₹)",
          "Profit Margin (%)"
        ]
      ];

      let grandTotalBookings = 0;
      let grandIncoming = 0;
      let grandIncomingPaid = 0;
      let grandDueAgent = 0;
      let grandOutgoing = 0;
      let grandOutgoingPaid = 0;
      let grandUpcomingDmc = 0;
      let grandGrossProfit = 0;

      periodBuckets.forEach((b) => {
        const count = checklistData?.[b.key]?.length || 0;
        const tot = bucketTotals[b.key];
        const margin = tot.incoming > 0 ? ((tot.grossProfit / tot.incoming) * 100).toFixed(1) + "%" : "0.0%";

        grandTotalBookings += count;
        grandIncoming += tot.incoming;
        grandIncomingPaid += tot.incomingPaid;
        grandDueAgent += tot.dueAgent;
        grandOutgoing += tot.outgoing;
        grandOutgoingPaid += tot.outgoingPaid;
        grandUpcomingDmc += tot.upcomingDmc;
        grandGrossProfit += tot.grossProfit;

        checklistRows.push([
          formatPeriodLabel(b.periodVal) || b.periodVal || "-",
          b.label,
          b.periodVal || "-",
          count,
          tot.incoming,
          tot.incomingPaid,
          tot.dueAgent,
          tot.outgoing,
          tot.outgoingPaid,
          tot.upcomingDmc,
          tot.grossProfit,
          margin
        ]);
      });

      const grandMargin = grandIncoming > 0 ? ((grandGrossProfit / grandIncoming) * 100).toFixed(1) + "%" : "0.0%";
      checklistRows.push([
        "All Combined",
        "Grand Total",
        "All Combined Periods",
        grandTotalBookings,
        grandIncoming,
        grandIncomingPaid,
        grandDueAgent,
        grandOutgoing,
        grandOutgoingPaid,
        grandUpcomingDmc,
        grandGrossProfit,
        grandMargin
      ]);

      checklistRows.push([]);
      checklistRows.push([`SECTION 2: DETAILED BOOKINGS & INVOICES (DATA FOR: ${activePeriodLabel})`]);
      checklistRows.push([
        "Applied Filter Period",
        "Period Bucket",
        "Target Period",
        "Booking / Query ID",
        "Invoice / Quotation #",
        "Client / Agent Name",
        "Destination",
        "Travel Date",
        "Payment Status",
        "Total Billed (₹)",
        "Payment Received (₹)",
        "Pending Collection (₹)",
        "Total DMC Cost (₹)",
        "Paid to DMC (₹)",
        "Pending to DMC (₹)",
        "Gross Profit (₹)",
        "Profit Margin (%)"
      ]);

      let hasBookings = false;
      periodBuckets.forEach((b) => {
        const list = checklistData?.[b.key] || [];
        if (list.length > 0) {
          hasBookings = true;
          list.forEach((inv) => {
            const m = inv.computedMetrics || {};
            const queryId =
              inv.queryId?.queryId ||
              inv.query?.queryId ||
              inv.tripSnapshot?.queryId ||
              (typeof inv.query === "string" ? inv.query : "") ||
              inv.queryCode ||
              "-";
            const invNumber = inv.invoiceNumber || inv.quotationNumber || inv.id || inv._id || "-";
            const clientOrAgent =
              inv.agency?.name ||
              inv.agencyName ||
              inv.clientName ||
              inv.client?.name ||
              inv.query?.agentName ||
              inv.query?.clientName ||
              inv.guestName ||
              "-";
            const destination = inv.tripSnapshot?.destination || inv.destination || inv.query?.destination || "-";
            const travelDate = inv.tripSnapshot?.startDate
              ? new Date(inv.tripSnapshot.startDate).toLocaleDateString()
              : (inv.travelDate || inv.date || "-");
            const status = inv.paymentStatus || inv.status || (inv.isVerified ? "Verified" : "Pending");

            const incoming = Number(m.incoming ?? inv.totalAmount ?? 0);
            const incomingPaid = Number(m.incomingPaid ?? 0);
            const dueAgent = Number(m.dueAgent ?? Math.max(0, incoming - incomingPaid));
            const outgoing = Number(m.outgoing ?? 0);
            const outgoingPaid = Number(m.outgoingPaid ?? 0);
            const upcomingDmc = Number(m.upcomingDmc ?? Math.max(0, outgoing - outgoingPaid));
            const grossProfit = Number(m.grossProfit ?? (incoming - outgoing));
            const margin = incoming > 0 ? Number(((grossProfit / incoming) * 100).toFixed(1)) : 0;

            checklistRows.push([
              formatPeriodLabel(b.periodVal) || b.periodVal || "-",
              b.label,
              b.periodVal || "-",
              queryId,
              invNumber,
              clientOrAgent,
              destination,
              travelDate,
              status,
              incoming,
              incomingPaid,
              dueAgent,
              outgoing,
              outgoingPaid,
              upcomingDmc,
              grossProfit,
              `${margin}%`
            ]);
          });
        }
      });

      if (!hasBookings) {
        checklistRows.push([activePeriodLabel, "No booking records found for the applied period filters."]);
      }

      const checklistSheet = XLSX.utils.aoa_to_sheet(checklistRows);
      checklistSheet["!cols"] = autoFitColumns(checklistRows);
      XLSX.utils.book_append_sheet(workbook, checklistSheet, "Verified Payment Revenue");

      // ───────────────────────────────────────────
      // 3. Destination Profitability Sheet
      // ───────────────────────────────────────────
      const profitRows = [
        ["DESTINATION PROFITABILITY REPORT"],
        ["DATA FOR PERIOD", activePeriodLabel],
        ["Applied Base Period Filter", activePeriodLabel + ` (${basePeriod || defaultBase || "All"})`],
        ["Comparison Period Filter", comparisonPeriod ? formatPeriodLabel(comparisonPeriod) + ` (${comparisonPeriod})` : "None"],
        ["Report Generated On", new Date().toLocaleString()],
        [],
        [`SECTION 1: BASE PERIOD DESTINATION PROFITABILITY (DATA FOR: ${activePeriodLabel})`],
        [
          "Applied Filter Period",
          "Destination",
          "Total Amount / Gross Revenue (₹)",
          "Realized Revenue (₹)",
          "Pending Review (₹)",
          "Offer / Discount (₹)",
          "Offer Details / Promo",
          "DMC Cost (₹)",
          "Gross Profit (₹)",
          "Profit Margin (%)",
          "Bookings Count"
        ]
      ];

      const effectiveRows = effectiveDestinationProfitRows || [];
      if (effectiveRows.length > 0) {
        effectiveRows.forEach((row) => {
          const grossRev = Number(row.grossRevenue || row.revenue || 0);
          const rev = Number(row.revenue || 0);
          const pending = Number(row.pendingRevenue || 0);
          const discount = Number(row.offerDiscount || 0);
          const promo = row.offerLabel || "-";
          const cost = Number(row.cost || 0);
          const profit = Number(row.profit !== undefined ? row.profit : (rev - cost));
          const margin = Number(row.marginPercent !== undefined ? row.marginPercent : (grossRev > 0 ? (profit / grossRev) * 100 : 0));
          const bookings = Number(row.bookings || row.packageCount || row.totalPackages || 0);

          profitRows.push([
            activePeriodLabel,
            row.destination || "Unknown",
            grossRev,
            rev,
            pending,
            discount,
            promo,
            cost,
            profit,
            `${margin.toFixed(1)}%`,
            bookings
          ]);
        });
      } else {
        profitRows.push([activePeriodLabel, "No destination profitability data available for the selected period."]);
      }

      if (comparisonPeriod && comparedDestinationProfit && comparedDestinationProfit.length > 0) {
        const compLabel = formatPeriodLabel(comparisonPeriod);
        profitRows.push([]);
        profitRows.push([`SECTION 2: COMPARISON PERIOD DESTINATION PROFITABILITY (DATA FOR: ${compLabel})`]);
        profitRows.push([
          "Applied Filter Period",
          "Destination",
          "Total Amount / Gross Revenue (₹)",
          "Realized Revenue (₹)",
          "Pending Review (₹)",
          "Offer / Discount (₹)",
          "Offer Details / Promo",
          "DMC Cost (₹)",
          "Gross Profit (₹)",
          "Profit Margin (%)",
          "Bookings Count"
        ]);
        comparedDestinationProfit.forEach((row) => {
          const grossRev = Number(row.grossRevenue || row.revenue || 0);
          const rev = Number(row.revenue || 0);
          const pending = Number(row.pendingRevenue || 0);
          const discount = Number(row.offerDiscount || 0);
          const promo = row.offerLabel || "-";
          const cost = Number(row.cost || 0);
          const profit = Number(row.profit !== undefined ? row.profit : (rev - cost));
          const margin = Number(row.marginPercent !== undefined ? row.marginPercent : (grossRev > 0 ? (profit / grossRev) * 100 : 0));
          const bookings = Number(row.bookings || row.packageCount || row.totalPackages || 0);

          profitRows.push([
            compLabel,
            row.destination || "Unknown",
            grossRev,
            rev,
            pending,
            discount,
            promo,
            cost,
            profit,
            `${margin.toFixed(1)}%`,
            bookings
          ]);
        });
      }

      const profitSheet = XLSX.utils.aoa_to_sheet(profitRows);
      profitSheet["!cols"] = autoFitColumns(profitRows);
      XLSX.utils.book_append_sheet(workbook, profitSheet, "Destination Profitability");

      const exportFileName = `Revenue_Analytics_Report_${basePeriod || defaultBase || "export"}.xlsx`;
      XLSX.writeFile(workbook, exportFileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

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
          
          {/* Comparison Filter and Export Button */}
          {(period === "monthly" || period === "quarterly" || period === "yearly") && (
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Compare:</span>
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
              
              {/* EXPORT BUTTON */}
              <button
                type="button"
                onClick={handleExcelExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer text-xs font-bold shadow-sm shrink-0"
              >
                <Download size={14} />
                Export Data
              </button>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5 pb-2 border-b border-slate-105">
                <h3 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Receipt size={14} className="text-emerald-500 shrink-0" />
                  Verified Payment Revenue
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRevenueChecklist(!showRevenueChecklist)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all duration-200 shadow-sm border border-slate-200 cursor-pointer w-full sm:w-auto"
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
                <ReportTable columns={destinationProfitColumns} rows={displayProfitRows} loading={effectiveBaseLoading} />
              </div>

              {/* Pagination */}
              {!effectiveBaseLoading && effectiveDestinationProfitRows.length > itemsPerPage && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                  <span>
                    Showing <span className="text-slate-800 font-bold">{startProfitIdx + 1}</span> to{' '}
                    <span className="text-slate-800 font-bold">{Math.min(endProfitIdx, effectiveDestinationProfitRows.length)}</span> of{' '}
                    <span className="text-slate-800 font-bold">{effectiveDestinationProfitRows.length}</span> entries
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
