import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { formatCompactCurrency } from "../utils/formatter";

function CustomPeriodDropdown({ period, value, onChange, currentPeriodStr, direction }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = useMemo(() => {
    let opts = [];
    if (period === "monthly") {
      const yr = currentPeriodStr ? Number(currentPeriodStr.split("-")[0]) : new Date().getFullYear();
      for (let y = yr - 3; y <= yr + 3; y++) {
        for (let m = 1; m <= 12; m++) {
          const val = `${y}-${String(m).padStart(2, '0')}`;
          const d = new Date(y, m - 1, 1);
          const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          opts.push({ val, label });
        }
      }
    } else if (period === "quarterly") {
      const yr = currentPeriodStr ? Number(currentPeriodStr.split("-")[0]) : new Date().getFullYear();
      for (let y = yr - 3; y <= yr + 3; y++) {
        for (let q = 1; q <= 4; q++) {
          opts.push({ val: `${y}-Q${q}`, label: `Q${q} ${y}` });
        }
      }
    } else if (period === "yearly") {
      const yr = currentPeriodStr ? Number(currentPeriodStr) : new Date().getFullYear();
      for (let y = yr - 5; y <= yr + 5; y++) {
        opts.push({ val: String(y), label: String(y) });
      }
    }

    if (direction === "past") {
      opts = opts.filter(o => o.val < currentPeriodStr);
      opts.reverse();
    } else if (direction === "upcoming") {
      opts = opts.filter(o => o.val > currentPeriodStr);
    }

    return opts;
  }, [period, currentPeriodStr, direction]);

  const selectedLabel = options.find(o => o.val === value)?.label || value;

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-32 sm:w-36 h-8 flex items-center justify-between rounded-lg border px-2.5 text-[10px] font-bold cursor-pointer transition-all shadow-sm ${isOpen ? 'border-indigo-300 ring-2 ring-indigo-100 bg-white text-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50'}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-10 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-xl max-h-48 overflow-y-auto thin-scrollbar"
          >
            {options.map((opt) => (
              <div 
                key={opt.val}
                onClick={() => {
                  onChange(opt.val);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-[10px] font-medium cursor-pointer transition-colors ${value === opt.val ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                {opt.label}
              </div>
            ))}
            {options.length === 0 && (
               <div className="px-3 py-2 text-[10px] font-medium text-slate-400 italic">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function sumGroup(list) {
  return list.reduce(
    (acc, invoice) => {
      const m = invoice.computedMetrics || {};
      acc.incoming     += m.incoming     || 0;
      acc.incomingPaid += m.incomingPaid || 0;
      acc.dueAgent     += m.dueAgent     || 0;
      acc.outgoing     += m.outgoing     || 0;
      acc.outgoingPaid += m.outgoingPaid || 0;
      acc.upcomingDmc  += m.upcomingDmc  || 0;
      acc.grossProfit  += m.grossProfit  || 0;
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
}

// Per-tense metric labels — plain language, no technical jargon, no party names except DMC
const METRIC_LABELS_BY_PERIOD = {
  past: [
    {
      key: "incoming",
      label: "Total Payment Received",
      subtitle: (t) => `Already received: ${formatCompactCurrency(t.incomingPaid)}`,
      color: "text-sky-700",
      labelColor: "text-sky-500",
    },
    {
      key: "dueAgent",
      label: "Pending Payment to Collect",
      subtitle: (t) => `Outstanding from ${formatCompactCurrency(t.incoming)} billed`,
      color: "text-rose-600",
      labelColor: "text-rose-400",
    },
    {
      key: "outgoing",
      label: "Total Paid to DMC",
      subtitle: (t) => `Settled: ${formatCompactCurrency(t.outgoingPaid)}`,
      color: "text-slate-800",
      labelColor: "text-slate-400",
    },
    {
      key: "upcomingDmc",
      label: "Pending Payment to DMC",
      subtitle: (t) => `Balance from ${formatCompactCurrency(t.outgoing)} total cost`,
      color: "text-orange-600",
      labelColor: "text-orange-400",
    },
    {
      key: "grossProfit",
      label: "Total Profit",
      subtitle: (t) => {
        const margin = t.incoming > 0 ? ((t.grossProfit / t.incoming) * 100).toFixed(1) : "0.0";
        return `Margin: ${margin}%`;
      },
      color: (t) => (t.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"),
      labelColor: (t) => (t.grossProfit >= 0 ? "text-emerald-500" : "text-rose-400"),
      icon: (t) => t.grossProfit >= 0
        ? <TrendingUp size={11} className="text-emerald-500" />
        : <TrendingDown size={11} className="text-rose-500" />,
    },
  ],
  current: [
    {
      key: "incoming",
      label: "Total Payment Received",
      subtitle: (t) => `Received so far: ${formatCompactCurrency(t.incomingPaid)}`,
      color: "text-sky-700",
      labelColor: "text-sky-500",
    },
    {
      key: "dueAgent",
      label: "Pending Payment to Collect",
      subtitle: (t) => `Out of ${formatCompactCurrency(t.incoming)} total billed`,
      color: "text-rose-600",
      labelColor: "text-rose-400",
    },
    {
      key: "outgoing",
      label: "Total Paid to DMC",
      subtitle: (t) => `Paid so far: ${formatCompactCurrency(t.outgoingPaid)}`,
      color: "text-slate-800",
      labelColor: "text-slate-400",
    },
    {
      key: "upcomingDmc",
      label: "Pending Payment to DMC",
      subtitle: (t) => `Balance from ${formatCompactCurrency(t.outgoing)} total cost`,
      color: "text-orange-600",
      labelColor: "text-orange-400",
    },
    {
      key: "grossProfit",
      label: "Total Profit",
      subtitle: (t) => {
        const margin = t.incoming > 0 ? ((t.grossProfit / t.incoming) * 100).toFixed(1) : "0.0";
        return `Margin: ${margin}%`;
      },
      color: (t) => (t.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"),
      labelColor: (t) => (t.grossProfit >= 0 ? "text-emerald-500" : "text-rose-400"),
      icon: (t) => t.grossProfit >= 0
        ? <TrendingUp size={11} className="text-emerald-500" />
        : <TrendingDown size={11} className="text-rose-500" />,
    },
  ],
  upcoming: [
    {
      key: "incoming",
      label: "Total Payment Received",
      subtitle: (t) => `Advance received: ${formatCompactCurrency(t.incomingPaid)}`,
      color: "text-sky-700",
      labelColor: "text-sky-500",
    },
    {
      key: "dueAgent",
      label: "Pending Payment to Collect",
      subtitle: (t) => `From ${formatCompactCurrency(t.incoming)} total expected`,
      color: "text-rose-600",
      labelColor: "text-rose-400",
    },
    {
      key: "outgoing",
      label: "Total Paid to DMC",
      subtitle: (t) => `Advance paid: ${formatCompactCurrency(t.outgoingPaid)}`,
      color: "text-slate-800",
      labelColor: "text-slate-400",
    },
    {
      key: "upcomingDmc",
      label: "Pending Payment to DMC",
      subtitle: (t) => `Balance from ${formatCompactCurrency(t.outgoing)} planned cost`,
      color: "text-orange-600",
      labelColor: "text-orange-400",
    },
    {
      key: "grossProfit",
      label: "Total Profit",
      subtitle: (t) => {
        const margin = t.incoming > 0 ? ((t.grossProfit / t.incoming) * 100).toFixed(1) : "0.0";
        return `Projected margin: ${margin}%`;
      },
      color: (t) => (t.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"),
      labelColor: (t) => (t.grossProfit >= 0 ? "text-emerald-500" : "text-rose-400"),
      icon: (t) => t.grossProfit >= 0
        ? <TrendingUp size={11} className="text-emerald-500" />
        : <TrendingDown size={11} className="text-rose-500" />,
    },
  ],
};

// Grand total uses neutral labels (all periods combined)
const METRIC_CONFIGS_GRAND = [
  { key: "incoming",    label: "Total Revenue",    },
  { key: "dueAgent",   label: "Total Receivable",  },
  { key: "outgoing",   label: "Total Paid to DMC", },
  { key: "upcomingDmc",label: "DMC Balance Due",   },
  {
    key: "grossProfit",
    label: "Net Profit",
    icon: (t) => t.grossProfit >= 0
      ? <TrendingUp size={11} className="text-emerald-400" />
      : <TrendingDown size={11} className="text-rose-400" />,
  },
];


function PeriodSummaryCard({
  title,
  colorClass,
  accentBg,
  totals,
  count,
  delay,
  monthPicker,
  period,
}) {
  const metricConfigs = METRIC_LABELS_BY_PERIOD[period] || METRIC_LABELS_BY_PERIOD.current;
  if (count === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay }}
        className="border border-dashed border-slate-200 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 ${accentBg} border-b border-slate-100`}>
          {/* <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{title}</span>
            <span className="text-[9px] font-bold text-slate-400 bg-white/70 border border-slate-200 px-1.5 py-0.5 rounded-full">
              0 bookings
            </span>
          </div> */}
          {monthPicker && <div onClick={(e) => e.stopPropagation()}>{monthPicker}</div>}
        </div>
        <div className="px-6 py-5 bg-slate-50/40 text-[11px] text-slate-400 font-medium">
          No bookings for this period.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white"
    >
      {/* Card Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 ${accentBg} border-b border-slate-100`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{title}</span>
          {/* <span className="text-[9px] font-bold text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full shadow-inner">
            {count} booking{count !== 1 ? "s" : ""}
          </span> */}
        </div>
        {monthPicker && <div onClick={(e) => e.stopPropagation()}>{monthPicker}</div>}
      </div>

      {/* Metrics Grid */}
      <div className="overflow-x-auto thin-scrollbar">
        <div className="grid grid-cols-5 divide-x divide-slate-100 min-w-[700px] xl:min-w-0">
          {metricConfigs.map((cfg) => {
          const rawColor   = typeof cfg.color     === "function" ? cfg.color(totals)     : cfg.color;
          const rawLabel   = typeof cfg.labelColor === "function" ? cfg.labelColor(totals) : cfg.labelColor;
          const icon       = cfg.icon ? cfg.icon(totals) : null;
          const subtitle   = cfg.subtitle ? cfg.subtitle(totals) : "";
          const value      = totals[cfg.key] || 0;

          return (
            <div key={cfg.key} className="flex flex-col gap-1 px-4 py-4">
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${rawLabel}`}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-1">
                {icon}
                <span className={`text-sm font-black font-mono ${rawColor} leading-tight`}>
                  {formatCompactCurrency(value)}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium truncate">{subtitle}</span>
            </div>
          );
        })}
        </div>
      </div>
    </motion.div>
  );
}

export default function RevenueChecklistTable({
  groups,
  effectiveSelectedTaxMonth,
  effectiveSelectedTaxQuarter,
  effectiveSelectedTaxYear,
  period = "monthly",
  loading,
  selectedPastMonth,
  onSelectPastMonth,
  selectedUpcomingMonth,
  onSelectUpcomingMonth,
}) {
  let currentPeriodStr = "";
  let pastPeriodStrDefault = "";
  let upcomingPeriodStrDefault = "";

  if (period === "monthly") {
    const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth.split("-").map(Number);
    currentPeriodStr = effectiveSelectedTaxMonth;
    const pastMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
    const upcomingMonthDate = new Date(selectedYear, selectedMonth, 1);
    pastPeriodStrDefault = `${pastMonthDate.getFullYear()}-${String(pastMonthDate.getMonth() + 1).padStart(2, "0")}`;
    upcomingPeriodStrDefault = `${upcomingMonthDate.getFullYear()}-${String(upcomingMonthDate.getMonth() + 1).padStart(2, "0")}`;
  } else if (period === "quarterly") {
    currentPeriodStr = effectiveSelectedTaxQuarter;
    const [yStr, qStr] = effectiveSelectedTaxQuarter.split("-Q");
    const y = Number(yStr);
    const q = Number(qStr);
    const pQ = q === 1 ? 4 : q - 1;
    const pY = q === 1 ? y - 1 : y;
    pastPeriodStrDefault = `${pY}-Q${pQ}`;
    
    const uQ = q === 4 ? 1 : q + 1;
    const uY = q === 4 ? y + 1 : y;
    upcomingPeriodStrDefault = `${uY}-Q${uQ}`;
  } else if (period === "yearly") {
    currentPeriodStr = String(effectiveSelectedTaxYear);
    const y = Number(currentPeriodStr);
    pastPeriodStrDefault = String(y - 1);
    upcomingPeriodStrDefault = String(y + 1);
  }

  const pastPeriodStr = selectedPastMonth || pastPeriodStrDefault;
  const upcomingPeriodStr = selectedUpcomingMonth || upcomingPeriodStrDefault;

  const formatPeriodTitle = (str) => {
    if (!str) return "";
    if (period === "monthly") {
      const [y, m] = str.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (period === "quarterly") {
      const [y, q] = str.split("-");
      return `${q} ${y}`;
    } else if (period === "yearly") {
      return str;
    }
  };

  const pastTotals     = sumGroup(groups.past     || []);
  const currentTotals  = sumGroup(groups.current  || []);
  const upcomingTotals = sumGroup(groups.upcoming || []);

  const grandTotals = {
    incoming:     pastTotals.incoming     + currentTotals.incoming     + upcomingTotals.incoming,
    incomingPaid: pastTotals.incomingPaid + currentTotals.incomingPaid + upcomingTotals.incomingPaid,
    dueAgent:     pastTotals.dueAgent     + currentTotals.dueAgent     + upcomingTotals.dueAgent,
    outgoing:     pastTotals.outgoing     + currentTotals.outgoing     + upcomingTotals.outgoing,
    outgoingPaid: pastTotals.outgoingPaid + currentTotals.outgoingPaid + upcomingTotals.outgoingPaid,
    upcomingDmc:  pastTotals.upcomingDmc  + currentTotals.upcomingDmc  + upcomingTotals.upcomingDmc,
    grossProfit:  pastTotals.grossProfit  + currentTotals.grossProfit  + upcomingTotals.grossProfit,
  };
  const grandCount =
    (groups.past?.length || 0) +
    (groups.current?.length || 0) +
    (groups.upcoming?.length || 0);

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-10 text-center text-xs text-slate-400 font-semibold animate-pulse">
        Loading financial data…
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Grand Total Banner */}
      {/* {grandCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 grid grid-cols-5 divide-x divide-white/10 shadow-lg"
        >
          {METRIC_CONFIGS_GRAND.map((cfg) => {
            const icon  = cfg.icon ? cfg.icon(grandTotals) : null;
            const value = grandTotals[cfg.key] || 0;
            return (
              <div key={cfg.key} className="flex flex-col gap-0.5 px-4">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                  {cfg.label}
                </span>
                <div className="flex items-center gap-1">
                  {icon}
                  <span className="text-sm font-black font-mono text-white leading-tight">
                    {formatCompactCurrency(value)}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">{grandCount} bookings total</span>
              </div>
            );
          })}
        </motion.div>
      )} */}

      {/* Per-Period Cards */}
      <PeriodSummaryCard
        title={`Past — ${formatPeriodTitle(pastPeriodStr)}`}
        colorClass="text-purple-600"
        accentBg="bg-purple-50/60"
        totals={pastTotals}
        count={groups.past?.length || 0}
        delay={0}
        monthPicker={
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {period === 'monthly' ? 'Month' : period === 'quarterly' ? 'Quarter' : 'Year'}:
            </span>
            <CustomPeriodDropdown 
              period={period}
              value={pastPeriodStr}
              onChange={(val) => onSelectPastMonth && onSelectPastMonth(val)}
              currentPeriodStr={currentPeriodStr}
              direction="past"
            />
          </div>
        }
        period="past"
      />
      <PeriodSummaryCard
        title={`Present — ${formatPeriodTitle(currentPeriodStr)}`}
        colorClass="text-sky-600"
        accentBg="bg-sky-50/60"
        totals={currentTotals}
        count={groups.current?.length || 0}
        delay={0.05}
        period="current"
      />
      <PeriodSummaryCard
        title={`Upcoming — ${formatPeriodTitle(upcomingPeriodStr)}`}
        colorClass="text-orange-500"
        accentBg="bg-orange-50/60"
        totals={upcomingTotals}
        count={groups.upcoming?.length || 0}
        delay={0.1}
        monthPicker={
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {period === 'monthly' ? 'Month' : period === 'quarterly' ? 'Quarter' : 'Year'}:
            </span>
            <CustomPeriodDropdown 
              period={period}
              value={upcomingPeriodStr}
              onChange={(val) => onSelectUpcomingMonth && onSelectUpcomingMonth(val)}
              currentPeriodStr={currentPeriodStr}
              direction="upcoming"
            />
          </div>
        }
        period="upcoming"
      />
    </div>
  );
}
