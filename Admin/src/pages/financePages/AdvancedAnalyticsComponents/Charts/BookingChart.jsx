import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react";
import PeriodDropdownTab from "../Buttons/PeriodDropdownTab";

const CHART_TYPES = [
  { label: "Agent",        value: "agent" },
  { label: "DMC",          value: "dmc" },
  { label: "OPS",          value: "ops" },
  { label: "Destinations", value: "destination" },
];

// Visually distinct, high-contrast palette
const PALETTE = [
  { border: "#16a34a", fill0: "rgba(22,163,74,0.20)",   fill1: "rgba(22,163,74,0)" },
  { border: "#dc2626", fill0: "rgba(220,38,38,0.18)",   fill1: "rgba(220,38,38,0)" },
  { border: "#2563eb", fill0: "rgba(37,99,235,0.18)",   fill1: "rgba(37,99,235,0)" },
  { border: "#d97706", fill0: "rgba(217,119,6,0.20)",   fill1: "rgba(217,119,6,0)" },
  { border: "#7c3aed", fill0: "rgba(124,58,237,0.18)",  fill1: "rgba(124,58,237,0)" },
  { border: "#0891b2", fill0: "rgba(8,145,178,0.18)",   fill1: "rgba(8,145,178,0)" },
  { border: "#db2777", fill0: "rgba(219,39,119,0.18)",  fill1: "rgba(219,39,119,0)" },
  { border: "#65a30d", fill0: "rgba(101,163,13,0.18)",  fill1: "rgba(101,163,13,0)" },
  { border: "#ea580c", fill0: "rgba(234,88,12,0.18)",   fill1: "rgba(234,88,12,0)" },
  { border: "#475569", fill0: "rgba(71,85,105,0.18)",   fill1: "rgba(71,85,105,0)" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
export function formatYM(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatTaxMonth(date) {
  const d = date instanceof Date ? date : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date) {
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

export function dayLabel(year, month, day) {
  return new Date(year, month - 1, day).toLocaleString("default", { month: "short", day: "numeric" });
}

// Filter + group bookings for given period/selection
export function buildChartData(bookings = [], groupKey = "agent", period = "monthly", selMonth, selQuarter, selYear, customFrom, customTo) {
  let filtered = bookings || [];

  // Date bounds from selection
  let minDate = null, maxDate = null;
  let granularity = "month"; // "day" | "month"

  if (period === "monthly") {
    const [yr, mn] = (selMonth || "").split("-").map(Number);
    if (yr && mn) {
      minDate = new Date(yr, mn - 1, 1);
      maxDate = new Date(yr, mn, 0, 23, 59, 59, 999); // last day of month
      granularity = "day";
    }
  } else if (period === "quarterly") {
    const [yrStr, qStr] = (selQuarter || "").split("-Q");
    const yr = Number(yrStr);
    const q = Number(qStr);
    if (yr && q) {
      const startMonth = (q - 1) * 3;
      minDate = new Date(yr, startMonth, 1);
      maxDate = new Date(yr, startMonth + 3, 0, 23, 59, 59, 999);
      granularity = "month";
    }
  } else if (period === "yearly") {
    const yr = Number(selYear);
    if (yr) {
      minDate = new Date(yr, 0, 1);
      maxDate = new Date(yr, 11, 31, 23, 59, 59, 999);
      granularity = "month";
    }
  } else if (period === "custom") {
    if (customFrom) minDate = new Date(customFrom);
    if (customTo) {
      const toD = new Date(customTo);
      toD.setHours(23, 59, 59, 999);
      maxDate = toD;
    }
    granularity = "month";
  }

  // Filter
  filtered = (bookings || []).filter((row) => {
    const d = new Date(row.travelDate);
    if (isNaN(d.getTime())) return false;
    if (minDate && d < minDate) return false;
    if (maxDate && d > maxDate) return false;
    return true;
  });

  // Build date labels
  let dates = [];
  if (granularity === "day" && period === "monthly" && selMonth) {
    const [yr, mn] = selMonth.split("-").map(Number);
    if (yr && mn) {
      const daysInMonth = new Date(yr, mn, 0).getDate();
      dates = Array.from({ length: daysInMonth }, (_, i) => dayLabel(yr, mn, i + 1));
    }
  } else if (granularity === "month") {
    // Collect all month labels from filtered data
    const set = new Set();
    filtered.forEach((row) => {
      const d = new Date(row.travelDate);
      if (!isNaN(d.getTime())) set.add(monthLabel(d));
    });
    dates = [...set].sort((a, b) => new Date(`01 ${a}`) - new Date(`01 ${b}`));
  }

  // Build entity map
  const entityMap = {};
  filtered.forEach((row) => {
    const d = new Date(row.travelDate);
    if (isNaN(d.getTime())) return;

    let label;
    if (granularity === "day" && selMonth) {
      const [yr, mn] = selMonth.split("-").map(Number);
      label = dayLabel(yr, mn, d.getDate());
    } else {
      label = monthLabel(d);
    }

    let entities = [];
    if      (groupKey === "agent")       entities = [row.agent || "Unassigned"];
    else if (groupKey === "dmc")         entities = (row.dmc && row.dmc !== "N/A") ? row.dmc.split(",").map(s => s.trim()) : ["N/A"];
    else if (groupKey === "ops")         entities = [row.ops || "Unassigned"];
    else if (groupKey === "destination") entities = [row.destination || "Unknown"];

    entities.forEach((entity) => {
      if (!entityMap[entity]) entityMap[entity] = {};
      entityMap[entity][label] = (entityMap[entity][label] || 0) + 1;
    });
  });

  return {
    entities: Object.keys(entityMap),
    dates,
    entityMap,
    count: filtered.length,
    filteredBookings: filtered
  };
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  // Wave path data — two decorative area shapes that pulse
  const wave1 = "M0,200 C40,160 80,80 130,90 C180,100 200,50 260,60 C320,70 340,130 400,110 C460,90 480,40 540,55 C600,70 620,130 680,115 C740,100 760,60 800,70 L800,260 L0,260 Z";
  const wave2 = "M0,230 C50,200 90,150 150,160 C210,170 230,120 290,130 C350,140 370,180 430,165 C490,150 510,110 570,120 C630,130 650,170 710,155 C770,140 790,110 800,120 L800,260 L0,260 Z";

  return (
    <div className="relative w-full h-full overflow-hidden select-none">

      {/* Shimmer keyframes injected once */}
      <style>{`
        @keyframes bc-shimmer {
          0%   { background-position: -800px 0 }
          100% { background-position:  800px 0 }
        }
        @keyframes bc-wave {
          0%,100% { d: path("M0,200 C40,160 80,80 130,90 C180,100 200,50 260,60 C320,70 340,130 400,110 C460,90 480,40 540,55 C600,70 620,130 680,115 C740,100 760,60 800,70 L800,260 L0,260 Z"); }
          50%      { d: path("M0,220 C40,180 80,100 130,110 C180,120 200,70 260,80 C320,90 340,150 400,130 C460,110 480,60 540,75 C600,90 620,150 680,135 C740,120 760,80 800,90 L800,260 L0,260 Z"); }
        }
      `}</style>

      {/* Y-axis ghost lines */}
      <div className="absolute inset-0 flex flex-col justify-between pb-6 pt-2 pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            {/* tick label */}
            <div className="w-6 h-2.5 rounded-full flex-shrink-0"
              style={{ background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "800px 100%", animation: "bc-shimmer 1.6s infinite linear", animationDelay: `${i * 0.1}s` }} />
            {/* grid line */}
            <div className="flex-1 h-px" style={{ background: "rgba(226,232,240,0.8)" }} />
          </div>
        ))}
      </div>

      {/* SVG area waves */}
      <svg
        viewBox="0 0 800 260"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full"
        style={{ height: "calc(100% - 24px)" }}
      >
        <defs>
          <linearGradient id="sk-g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sk-g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10b981" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          {/* shimmer mask that sweeps left → right */}
          <linearGradient id="sk-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="45%"  stopColor="white" stopOpacity="0.18" />
            <stop offset="55%"  stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
            <animateTransform attributeName="gradientTransform" type="translate" values="-1 0; 2 0; -1 0" dur="2s" repeatCount="indefinite" />
          </linearGradient>
        </defs>

        {/* Area 1 — indigo */}
        <path d={wave1} fill="url(#sk-g1)">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values={`${wave1};M0,215 C40,175 80,95 130,105 C180,115 200,65 260,75 C320,85 340,145 400,125 C460,105 480,55 540,70 C600,85 620,145 680,130 C740,115 760,75 800,85 L800,260 L0,260 Z;${wave1}`}
          />
        </path>
        <path d={wave1} fill="none" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.35">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values={`${wave1};M0,215 C40,175 80,95 130,105 C180,115 200,65 260,75 C320,85 340,145 400,125 C460,105 480,55 540,70 C600,85 620,145 680,130 C740,115 760,75 800,85 L800,260 L0,260 Z;${wave1}`}
          />
        </path>

        {/* Area 2 — emerald */}
        <path d={wave2} fill="url(#sk-g2)">
          <animate attributeName="d" dur="3.8s" repeatCount="indefinite"
            values={`${wave2};M0,240 C50,210 90,160 150,170 C210,180 230,130 290,140 C350,150 370,190 430,175 C490,160 510,120 570,130 C630,140 650,180 710,165 C770,150 790,120 800,130 L800,260 L0,260 Z;${wave2}`}
          />
        </path>
        <path d={wave2} fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.3">
          <animate attributeName="d" dur="3.8s" repeatCount="indefinite"
            values={`${wave2};M0,240 C50,210 90,160 150,170 C210,180 230,130 290,140 C350,150 370,190 430,175 C490,160 510,120 570,130 C630,140 650,180 710,165 C770,150 790,120 800,130 L800,260 L0,260 Z;${wave2}`}
          />
        </path>

        {/* Shimmer overlay sweep */}
        <rect x="0" y="0" width="800" height="260" fill="url(#sk-sweep)" />
      </svg>

      {/* X-axis shimmer labels */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-2 rounded-full"
            style={{ width: `${28 + (i % 3) * 8}px`, background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "800px 100%", animation: "bc-shimmer 1.6s infinite linear", animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
        <div className="h-3 w-44 rounded-full" style={{ background: "linear-gradient(90deg, #f1f5f9 25%, #e8edf4 50%, #f1f5f9 75%)", backgroundSize: "800px 100%", animation: "bc-shimmer 1.6s infinite linear" }} />
        <div className="h-2.5 w-32 rounded-full" style={{ background: "linear-gradient(90deg, #f1f5f9 25%, #e8edf4 50%, #f1f5f9 75%)", backgroundSize: "800px 100%", animation: "bc-shimmer 1.6s infinite linear", animationDelay: "0.15s" }} />
        <p className="text-[10px] text-slate-300 font-medium mt-1 tracking-wide">No data for this period</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BookingChart({
  bookingData,
  chartType: propChartType,
  setChartType: propSetChartType,
  period: propPeriod,
  setPeriod: propSetPeriod,
  selectedTaxMonth: propMonth,
  setSelectedTaxMonth: propSetMonth,
  selectedTaxQuarter: propQuarter,
  setSelectedTaxQuarter: propSetQuarter,
  selectedTaxYear: propYear,
  setSelectedTaxYear: propSetYear,
  customFrom: propCustomFrom,
  setCustomFrom: propSetCustomFrom,
  customTo: propCustomTo,
  setCustomTo: propSetCustomTo,
  onExportChart,
}) {
  const canvasRef     = useRef(null);
  const chartRef      = useRef(null);
  const buildChartRef = useRef(() => {});
  const scriptLoaded  = useRef(false);
  const dropdownRef   = useRef(null);

  const [localChartType, setLocalChartType] = useState("agent");
  const chartType = propChartType !== undefined ? propChartType : localChartType;
  const setChartType = propSetChartType || setLocalChartType;

  // Period state — mirrors AdvancedAnalytics exactly
  const [localPeriod, setLocalPeriod] = useState("monthly");
  const period = propPeriod !== undefined ? propPeriod : localPeriod;
  const setPeriod = propSetPeriod || setLocalPeriod;

  const [monthMenuOpen,   setMonthMenuOpen]   = useState(false);
  const [quarterMenuOpen, setQuarterMenuOpen] = useState(false);
  const [yearMenuOpen,    setYearMenuOpen]    = useState(false);

  const now = new Date();
  const [localMonth, setLocalMonth] = useState(formatTaxMonth(now));
  const selectedTaxMonth = propMonth !== undefined ? propMonth : localMonth;
  const setSelectedTaxMonth = propSetMonth || setLocalMonth;

  const [localQuarter, setLocalQuarter] = useState(`${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`);
  const selectedTaxQuarter = propQuarter !== undefined ? propQuarter : localQuarter;
  const setSelectedTaxQuarter = propSetQuarter || setLocalQuarter;

  const [localYear, setLocalYear] = useState(String(now.getFullYear()));
  const selectedTaxYear = propYear !== undefined ? propYear : localYear;
  const setSelectedTaxYear = propSetYear || setLocalYear;

  const [pickerQuarterYear,  setPickerQuarterYear]  = useState(now.getFullYear());
  const [pickerYearStart,    setPickerYearStart]    = useState(Math.floor(now.getFullYear() / 12) * 12);

  const [localCustomFrom, setLocalCustomFrom] = useState("");
  const customFrom = propCustomFrom !== undefined ? propCustomFrom : localCustomFrom;
  const setCustomFrom = propSetCustomFrom || setLocalCustomFrom;

  const [localCustomTo, setLocalCustomTo] = useState("");
  const customTo = propCustomTo !== undefined ? propCustomTo : localCustomTo;
  const setCustomTo = propSetCustomTo || setLocalCustomTo;

  const [customRangeError, setCustomRangeError] = useState("");

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMonthMenuOpen(false); setQuarterMenuOpen(false); setYearMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Derived labels for PeriodDropdownTab
  const selectedMonthLabel = useMemo(() => {
    const [yr, mn] = selectedTaxMonth.split("-").map(Number);
    return new Date(yr, mn - 1, 1).toLocaleString("default", { month: "short", year: "numeric" });
  }, [selectedTaxMonth]);

  const selectedQuarterLabel = useMemo(() => {
    const [yr, q] = selectedTaxQuarter.split("-");
    return `${q} ${yr}`;
  }, [selectedTaxQuarter]);

  const selectedYearLabel = selectedTaxYear;

  // ── Data ────────────────────────────────────────────────────────────────────
  const chartPayload = useMemo(() =>
    buildChartData(bookingData, chartType, period, selectedTaxMonth, selectedTaxQuarter, selectedTaxYear, customFrom, customTo),
    [bookingData, chartType, period, selectedTaxMonth, selectedTaxQuarter, selectedTaxYear, customFrom, customTo]
  );

  // ── Chart.js — exact same settings as AnimatedChart ─────────────────────────
  const buildChart = useCallback(() => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const { entities, dates, entityMap } = chartPayload;
    if (!dates.length || !entities.length) return;

    const ctx = canvasRef.current.getContext("2d");

    const datasets = entities.slice(0, 10).map((entity, i) => {
      const p    = PALETTE[i % PALETTE.length];
      const grad = ctx.createLinearGradient(0, 0, 0, 260);
      grad.addColorStop(0, p.fill0);
      grad.addColorStop(1, p.fill1);
      return {
        label:                entity,
        data:                 dates.map((d) => entityMap[entity]?.[d] || 0),
        borderColor:          p.border,
        backgroundColor:      grad,
        borderWidth:          2.5,
        pointRadius:          5,
        pointBackgroundColor: p.border,
        pointBorderColor:     "#fff",
        pointBorderWidth:     2,
        pointHoverRadius:     8,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: "#fff",
        tension:              0.42,
        fill:                 true,
      };
    });

    chartRef.current = new window.Chart(ctx, {
      type: "line",
      data: { labels: dates, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing:   "easeInOutCubic",
          y: { from: (ctx) => ctx.chart.scales.y.bottom },
        },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#fff",
            borderColor:     "#e2e8f0",
            borderWidth:     1,
            titleColor:      "#1e293b",
            bodyColor:       "#475569",
            titleFont:       { size: 12, weight: "700" },
            bodyFont:        { size: 12 },
            padding:         14,
            cornerRadius:    10,
            boxPadding:      6,
            callbacks: {
              title:  (items) => items[0]?.label || "",
              label:  (ctx)   => {
                const v = ctx.parsed.y;
                return `  ${ctx.dataset.label}:  ${v} booking${v !== 1 ? "s" : ""}`;
              },
              labelColor: (ctx) => ({
                borderColor:     PALETTE[ctx.datasetIndex % PALETTE.length].border,
                backgroundColor: PALETTE[ctx.datasetIndex % PALETTE.length].border,
                borderRadius:    4,
              }),
            },
          },
        },
        scales: {
          x: {
            grid:   { display: false },
            border: { display: false },
            ticks:  { font: { size: 11 }, color: "#94a3b8", maxTicksLimit: 14 },
          },
          y: {
            beginAtZero: true,
            grid:   { color: "rgba(148,163,184,0.12)" },
            border: { display: false },
            ticks: {
              stepSize: 1,
              font:     { size: 11 },
              color:    "#94a3b8",
              callback: (v) => Number.isInteger(v) ? v : "",
            },
          },
        },
      },
    });
  }, [chartPayload]);

  useEffect(() => { buildChartRef.current = buildChart; }, [buildChart]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Chart && !scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement("script");
      script.src    = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = () => buildChartRef.current();
      document.head.appendChild(script);
    }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, []);

  useEffect(() => { if (typeof window !== "undefined" && window.Chart) buildChart(); }, [buildChart]);

  const { entities, count } = chartPayload;
  const activeLabel = CHART_TYPES.find(t => t.value === chartType)?.label;

  return (
    <div className="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-6 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">Bookings by {activeLabel}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Travel date distribution &middot; {count} record{count !== 1 ? "s" : ""} in selected period
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* ── Period selector — exact same UI as AdvancedAnalytics ── */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1 flex-nowrap whitespace-nowrap">

            <PeriodDropdownTab
              active={period === "monthly"}
              label="Monthly"
              selectedLabel={selectedMonthLabel}
              menuOpen={monthMenuOpen}
              onSelectTab={() => { setQuarterMenuOpen(false); setYearMenuOpen(false); setPeriod("monthly"); }}
              onToggleMenu={() => { setQuarterMenuOpen(false); setYearMenuOpen(false); setPeriod("monthly"); setMonthMenuOpen(v => !v); }}
            />
            <PeriodDropdownTab
              active={period === "quarterly"}
              label="Quarterly"
              selectedLabel={selectedQuarterLabel}
              menuOpen={quarterMenuOpen}
              onSelectTab={() => { setMonthMenuOpen(false); setYearMenuOpen(false); setPeriod("quarterly"); }}
              onToggleMenu={() => { setMonthMenuOpen(false); setYearMenuOpen(false); setPeriod("quarterly"); setQuarterMenuOpen(v => !v); }}
            />
            <PeriodDropdownTab
              active={period === "yearly"}
              label="Yearly"
              selectedLabel={selectedYearLabel}
              menuOpen={yearMenuOpen}
              onSelectTab={() => { setMonthMenuOpen(false); setQuarterMenuOpen(false); setPeriod("yearly"); }}
              onToggleMenu={() => { setMonthMenuOpen(false); setQuarterMenuOpen(false); setPeriod("yearly"); setYearMenuOpen(v => !v); }}
            />

            <button
              type="button"
              onClick={() => { setMonthMenuOpen(false); setYearMenuOpen(false); setQuarterMenuOpen(false); setPeriod(p => p === "custom" ? "monthly" : "custom"); }}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out cursor-pointer relative z-10 whitespace-nowrap shrink-0 ${period === "custom" ? "text-white font-bold" : "text-slate-500 hover:text-slate-800"}`}
            >
              {period === "custom" && (
                <motion.div layoutId="bcActivePeriodTab" className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-full shadow -z-10" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <Calendar className="w-3.5 h-3.5" />
              Custom Date
            </button>
          </div>

          {/* Month picker */}
          {period === "monthly" && monthMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            >
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Month</label>
              <input
                type="month"
                value={selectedTaxMonth}
                onChange={(e) => setSelectedTaxMonth(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              />
            </motion.div>
          )}

          {/* Quarter picker */}
          {period === "quarterly" && quarterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 select-none">
                <button type="button" onClick={() => setPickerQuarterYear(p => p - 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"><ChevronLeft size={16} /></button>
                <span className="text-sm font-bold text-slate-700">{pickerQuarterYear}</span>
                <button type="button" onClick={() => setPickerQuarterYear(p => p + 1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((q) => {
                  const val = `${pickerQuarterYear}-Q${q}`;
                  const isSelected = selectedTaxQuarter === val;
                  return (
                    <button key={val} type="button"
                      onClick={() => { setSelectedTaxQuarter(val); setQuarterMenuOpen(false); }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSelected ? "bg-slate-900 text-white shadow" : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900"}`}
                    >
                      Q{q} {pickerQuarterYear}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Year picker */}
          {period === "yearly" && yearMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 select-none">
                <button type="button" onClick={() => setPickerYearStart(p => p - 12)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"><ChevronLeft size={16} /></button>
                <span className="text-xs font-bold text-slate-700">{pickerYearStart} - {pickerYearStart + 11}</span>
                <button type="button" onClick={() => setPickerYearStart(p => p + 12)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Array.from({ length: 12 }, (_, i) => pickerYearStart + i).map((year) => (
                  <button key={year} type="button"
                    onClick={() => { setSelectedTaxYear(String(year)); setYearMenuOpen(false); }}
                    className={`rounded-lg py-2 text-center text-xs font-semibold transition cursor-pointer ${selectedTaxYear === String(year) ? "bg-slate-900 text-white font-bold shadow-sm" : "bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Custom date dropdown */}
          <AnimatePresence>
            {period === "custom" && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Date Range</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => { setCustomFrom(e.target.value); setCustomRangeError(""); }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => { setCustomTo(e.target.value); setCustomRangeError(""); }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                    />
                  </div>
                  {customRangeError && <p className="text-xs font-semibold text-red-500">{customRangeError}</p>}
                  {customFrom && customTo && (
                    <button
                      type="button"
                      onClick={() => dropdownRef.current?.click?.() || setMonthMenuOpen(false)}
                      className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Apply Range
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onExportChart && (
          <button
            type="button"
            onClick={onExportChart}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all font-semibold text-xs shadow-sm cursor-pointer whitespace-nowrap"
            title="Export chart data and time-series analytics to Excel"
          >
            <Download size={13} />
            Export Chart Data
          </button>
        )}
      </div>
      </div>

      {/* placeholder to keep spacing consistent */}


      {/* ── Chart canvas ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-2" style={{ position: "relative", width: "100%", height: 280 }}>
        {count === 0 ? (
          <ChartSkeleton />
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>

      {/* ── Custom legend ─────────────────────────────────────────────────────── */}
      {entities.length > 0 && count > 0 && (
        <div className="flex items-center justify-center gap-5 flex-wrap px-6 py-3">
          {entities.slice(0, 10).map((entity, i) => (
            <span key={entity} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: PALETTE[i % PALETTE.length].border }} />
              {entity}
            </span>
          ))}
        </div>
      )}

      {/* ── View-by buttons ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">View By</span>
        {CHART_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setChartType(t.value)}
            className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden ${chartType === t.value ? "text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
          >
            {chartType === t.value && (
              <motion.span layoutId="bcViewBy" className="absolute inset-0 bg-indigo-600 rounded-full -z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
