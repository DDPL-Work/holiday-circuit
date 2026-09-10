import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  X,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Percent,
  SlidersHorizontal,
} from "lucide-react";
import {
  formatCompactCurrency,
  formatTruncatedCompactDecimal,
} from "../utils/formatter";

const MiniSparkline = ({ data = [], color = '#3b82f6', fillId, className = "w-16 h-8" }) => {
  if (!Array.isArray(data) || data.length === 0) return null;

  // Sanitize data: prevent trailing zero drop in cumulative trends
  const cleanData = [...data];
  if (cleanData.length > 1) {
    const lastIdx = cleanData.length - 1;
    if (cleanData[lastIdx] === 0 && cleanData[lastIdx - 1] !== 0) {
      cleanData[lastIdx] = cleanData[lastIdx - 1];
    }
  }

  const max = Math.max(...cleanData, 1);
  const min = Math.min(...cleanData, 0);
  const range = max - min;

  const width = 80;
  const height = 30;
  const points = cleanData.map((val, idx) => {
    const x = (idx / (cleanData.length - 1 || 1)) * width;
    const y = height - ((val - min) / (range || 1)) * (height - 6) - 3;
    return { x, y };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg className={`${className} overflow-visible`} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={fillPath} fill={`url(#${fillId})`} stroke="none" />
      <path d={linePath} stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const ModalDailyChart = ({ daysCount, dailyData, mode, monthLabel, labelsOverride = [], labelType = 'date', tooltipDetails = [] }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext('2d');
    const label = mode === 'agent' ? 'Inward Payment (Agent)' : 'Outward Payout (DMC)';

    // Define sequential gradients (Blue, Purple, Gray, Pink) from the reference image
    const blueGrad = ctx.createLinearGradient(0, 0, 0, 240);
    blueGrad.addColorStop(0, '#60a5fa');
    blueGrad.addColorStop(1, '#2563eb');

    const purpleGrad = ctx.createLinearGradient(0, 0, 0, 240);
    purpleGrad.addColorStop(0, '#c084fc');
    purpleGrad.addColorStop(1, '#7c3aed');

    const grayGrad = ctx.createLinearGradient(0, 0, 0, 240);
    grayGrad.addColorStop(0, '#94a3b8');
    grayGrad.addColorStop(1, '#475569');

    const pinkGrad = ctx.createLinearGradient(0, 0, 0, 240);
    pinkGrad.addColorStop(0, '#f472b6');
    pinkGrad.addColorStop(1, '#db2777');

    const hoverBlue = ctx.createLinearGradient(0, 0, 0, 240);
    hoverBlue.addColorStop(0, '#3b82f6');
    hoverBlue.addColorStop(1, '#1d4ed8');

    const hoverPurple = ctx.createLinearGradient(0, 0, 0, 240);
    hoverPurple.addColorStop(0, '#a855f7');
    hoverPurple.addColorStop(1, '#6b21a8');

    const hoverGray = ctx.createLinearGradient(0, 0, 0, 240);
    hoverGray.addColorStop(0, '#64748b');
    hoverGray.addColorStop(1, '#334155');

    const hoverPink = ctx.createLinearGradient(0, 0, 0, 240);
    hoverPink.addColorStop(0, '#ec4899');
    hoverPink.addColorStop(1, '#be185d');

    const colorSequence = [blueGrad, purpleGrad, grayGrad, pinkGrad];
    const hoverSequence = [hoverBlue, hoverPurple, hoverGray, hoverPink];
    const labels = Array.isArray(labelsOverride) && labelsOverride.length > 0
      ? labelsOverride
      : Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, '0'));
    const barCount = labels.length;

    let visibleBarIndex = 0;
    const backgroundColors = [];
    const hoverBackgroundColors = [];

    for (let i = 0; i < barCount; i++) {
      if (Number(dailyData[i] || 0) > 0) {
        backgroundColors.push(colorSequence[visibleBarIndex % colorSequence.length]);
        hoverBackgroundColors.push(hoverSequence[visibleBarIndex % hoverSequence.length]);
        visibleBarIndex++;
      } else {
        backgroundColors.push(blueGrad);
        hoverBackgroundColors.push(hoverBlue);
      }
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label,
            data: dailyData,
            backgroundColor: backgroundColors,
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
            hoverBackgroundColor: hoverBackgroundColors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            bottom: 12,
            left: 5,
            right: 5,
            top: 5
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            padding: 10,
            callbacks: {
              title: (items) => {
                const dayNum = items[0].label;
                if (Array.isArray(labelsOverride) && labelsOverride.length > 0) {
                  return `${labelType === 'month' ? 'Month' : 'Date'}: ${dayNum}`;
                }
                const shortMonth = monthLabel ? ` ${monthLabel.slice(0, 3)}` : '';
                return `Date: ${dayNum}${shortMonth}`;
              },
              label: (context) => {
                const lines = [` Amount: ₹${Number(context.parsed.y).toLocaleString('en-IN')}`];
                const details = tooltipDetails[context.dataIndex]?.items || [];

                details.slice(0, 3).forEach((item) => {
                  const queryLine = [item.queryId, item.destination].filter(Boolean).join(' • ');
                  if (queryLine) lines.push(` ${queryLine}`);
                  if (item.travelDate) lines.push(` Travel: ${item.travelDate}`);
                  if (item.status) lines.push(` Status: ${item.status}`);
                });

                if (details.length > 3) {
                  lines.push(` +${details.length - 3} more payment(s)`);
                }

                return lines;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: 'rgba(148,163,184,0.3)', width: 1.5 },
            ticks: {
              font: { size: 9, weight: '600' },
              color: '#64748b',
              autoSkip: true,
              maxTicksLimit: Math.min(barCount, 31),
            },
          },
          y: {
            grid: { color: 'rgba(148,163,184,0.22)' },
            border: { color: 'rgba(148,163,184,0.3)', width: 1.5 },
            ticks: {
              font: { size: 10 },
              color: '#64748b',
              callback: (value) => formatCompactCurrency(value),
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [daysCount, dailyData, mode, monthLabel, labelsOverride, labelType, tooltipDetails]);

  return (
    <div className="absolute inset-5">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default function StatsModal({
  showStatsModal,
  setShowStatsModal,
  isStatsYearlyView,
  statsModalPeriodLabel,
  statsModalMode,
  setStatsModalMode,
  statsSelectedAgent,
  setStatsSelectedAgent,
  statsSelectedDmc,
  setStatsSelectedDmc,
  setStatsSelectedQueries,
  statsSelectedQueries,
  availableAgents,
  availableDmcs,
  statsSummary,
  statsModalCardText,
  statsDailyCardTrends,
  statsProfitSummary,
  filteredTravelStatsInvoices,
  filteredTravelStatsInternalInvoices,
  statsModalYear,
  statsPaymentYearMonth,
  statsModalMonth,
  statsDailyData,
  statsDailyLabels,
  statsDailyDetails,
  formatPlainNumber,
  getAgentPaymentEntries,
  getInvoiceTotalAmount,
  getPaymentAmountInYear,
  getPaymentAmountInMonth,
  getInvoicePaidAmount,
  getTravelDateLabel,
  getDmcPaymentEntries,
  getDmcPaidAmount,
  getDaysInMonth,
}) {
  if (!showStatsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-[1250px] w-[95vw] h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-inner">
              <TrendingUp size={16} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">Revenue stats</h2>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                {isStatsYearlyView ? 'Year View' : 'Month View'}: {statsModalPeriodLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto mr-4">
            {statsModalMode === 'agent' ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Agent:</span>
                <select
                  value={statsSelectedAgent}
                  onChange={(e) => {
                    setStatsSelectedAgent(e.target.value);
                    setStatsSelectedQueries([]);
                  }}
                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm cursor-pointer min-w-[160px]"
                >
                  <option value="all">All Agents</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id || agent.value} value={agent.value}>{agent.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">DMC:</span>
                <select
                  value={statsSelectedDmc}
                  onChange={(e) => {
                    setStatsSelectedDmc(e.target.value);
                    setStatsSelectedQueries([]);
                  }}
                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm cursor-pointer min-w-[160px]"
                >
                  <option value="all">All DMCs</option>
                  {availableDmcs.map((dmc) => (
                    <option key={dmc.id || dmc.value} value={dmc.value}>{dmc.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowStatsModal(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col p-3.5 gap-3 overflow-y-auto thin-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Card 1: Total Contract */}
            <div className="relative overflow-hidden h-[105px] bg-gradient-to-br from-blue-50/30 via-white to-blue-50/10 border border-blue-100 hover:border-blue-300 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <IndianRupee size={13} />
                    </span>
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-wider bg-blue-50/80 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Total Contract
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1 whitespace-nowrap">Total Value</p>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                    ₹{formatPlainNumber(statsSummary.total)}
                  </h4>
                  <div className={`flex items-center gap-1 mt-1 text-[8px] font-bold ${statsModalCardText.totalTrendTone} whitespace-nowrap`}>
                    <span>{statsModalCardText.totalTrend}</span>
                    <span className="text-slate-400 font-medium">from last period</span>
                  </div>
                </div>
              </div>
              {/* Sparkline background */}
              <div className="absolute right-2 bottom-3 pointer-events-none">
                <MiniSparkline data={statsDailyCardTrends.totalVal} color="#3b82f6" fillId="sparkline-total" className="w-10 h-5" />
              </div>
              {/* Bottom gradient border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 rounded-b-2xl shadow-[0_-1px_10px_rgba(59,130,246,0.3)]" />
            </div>

            {/* Card 2: Paid / Settled */}
            <div className="relative overflow-hidden h-[105px] bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/10 border border-emerald-100 hover:border-emerald-300 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle2 size={13} />
                    </span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider bg-emerald-50/80 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Received
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1 whitespace-nowrap">Paid / Settled</p>
                  <h4 className="text-lg font-black text-emerald-600 tracking-tight leading-none">
                    ₹{formatPlainNumber(statsSummary.paid)}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-emerald-600 whitespace-nowrap">
                    <span>{statsModalCardText.collectionRate}</span>
                    <span className="text-slate-400 font-medium">collection rate</span>
                  </div>
                </div>
              </div>
              {/* Sparkline background */}
              <div className="absolute right-2 bottom-3 pointer-events-none">
                <MiniSparkline data={statsDailyCardTrends.receivedVal} color="#10b981" fillId="sparkline-received" className="w-10 h-5" />
              </div>
              {/* Bottom gradient border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600 rounded-b-2xl shadow-[0_-1px_10px_rgba(16,185,129,0.3)]" />
            </div>

            {/* Card 3: Pending Balance */}
            <div className={`relative overflow-hidden h-[105px] bg-gradient-to-br ${statsSummary.pending === 0
              ? 'from-emerald-50/20 via-white to-emerald-50/5 border-emerald-100 hover:border-emerald-300'
              : 'from-rose-50/30 via-white to-rose-50/10 border-rose-100 hover:border-rose-300'
              } rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-lg ${statsSummary.pending === 0
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                      } shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <AlertCircle size={13} />
                    </span>
                    <span className={`text-[8px] font-black ${statsSummary.pending === 0 ? 'text-emerald-500 bg-emerald-50/80 border-emerald-100/40' : 'text-rose-500 bg-rose-50/80 border-rose-100/40'
                      } uppercase tracking-wider px-1.5 py-0.5 rounded-md border whitespace-nowrap`}>
                      {statsSummary.pending === 0 ? 'Settled' : 'Outstanding'}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1 whitespace-nowrap">Pending Balance</p>
                  <h4 className={`text-lg font-black ${statsSummary.pending === 0 ? 'text-slate-800' : 'text-rose-600'} tracking-tight leading-none`}>
                    ₹{formatPlainNumber(statsSummary.pending)}
                  </h4>
                  <div className={`flex items-center gap-1 mt-1 text-[8px] font-bold ${statsSummary.pending === 0 ? 'text-emerald-600' : 'text-rose-600'} whitespace-nowrap`}>
                    <span>{statsModalCardText.pendingStatus}</span>
                  </div>
                </div>
              </div>
              {/* Sparkline background */}
              <div className="absolute right-2 bottom-3 pointer-events-none">
                <MiniSparkline
                  data={statsDailyCardTrends.pendingVal}
                  color={statsSummary.pending === 0 ? "#10b981" : "#f43f5e"}
                  fillId="sparkline-pending"
                  className="w-10 h-5"
                />
              </div>
              {/* Bottom gradient border */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${statsSummary.pending === 0
                ? 'from-emerald-400 via-teal-500 to-green-600 shadow-[0_-1px_10px_rgba(16,185,129,0.3)]'
                : 'from-rose-400 via-red-500 to-orange-500 shadow-[0_-1px_10px_rgba(239,68,68,0.3)]'
                } rounded-b-2xl`} />
            </div>

            {/* Card 4: Completion Rate */}
            <div className="relative overflow-hidden h-[105px] bg-gradient-to-br from-purple-50/30 via-white to-purple-50/10 border border-purple-100 hover:border-purple-300 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Percent size={13} />
                    </span>
                    <span className="text-[8px] font-black text-purple-500 uppercase tracking-wider bg-purple-50/80 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Fulfillment
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1 whitespace-nowrap">Completion Rate</p>
                  <h4 className="text-lg font-black text-purple-600 tracking-tight leading-none">
                    {statsSummary.rate.toFixed(1).replace(/\.0$/, '')}%
                  </h4>
                  <div className="w-[58%] bg-slate-100 rounded-full h-1 mt-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1 rounded-full shadow-[0_1px_4px_rgba(147,51,234,0.3)] transition-all duration-500"
                      style={{ width: `${statsSummary.rate}%` }}
                    />
                  </div>
                </div>
              </div>
              {/* Sparkline background */}
              <div className="absolute right-2 bottom-3 pointer-events-none">
                <MiniSparkline data={statsDailyCardTrends.rateVal} color="#8b5cf6" fillId="sparkline-rate" className="w-10 h-5" />
              </div>
              {/* Bottom gradient border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600 rounded-b-2xl shadow-[0_-1px_10px_rgba(168,85,247,0.3)]" />
            </div>

            {/* Card 5: Net Profit */}
            <div className={`relative overflow-hidden h-[105px] bg-gradient-to-br ${statsProfitSummary.profit >= 0
              ? 'from-emerald-50/30 via-white to-emerald-50/10 border-emerald-100 hover:border-emerald-300'
              : 'from-rose-50/30 via-white to-rose-50/10 border-rose-100 hover:border-rose-300'
              } rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-lg ${statsProfitSummary.profit >= 0
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                      } shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <IndianRupee size={13} />
                    </span>
                    <span className={`text-[8px] font-black ${statsProfitSummary.profit >= 0 ? 'text-emerald-500 bg-emerald-50/80 border-emerald-100/40' : 'text-rose-500 bg-rose-50/80 border-rose-100/40'
                      } uppercase tracking-wider px-1.5 py-0.5 rounded-md border whitespace-nowrap`}>
                      Net Profit
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1 whitespace-nowrap">Estimated Profit</p>
                  <h4 className={`text-lg font-black ${statsProfitSummary.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'} tracking-tight leading-none`}>
                    {statsProfitSummary.profit < 0 ? '-' : ''}₹{formatPlainNumber(Math.abs(statsProfitSummary.profit))}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-slate-400 whitespace-nowrap">
                    <span>Agent Rev - DMC Cost</span>
                  </div>
                </div>
              </div>
              {/* Sparkline background */}
              <div className="absolute right-2 bottom-3 pointer-events-none">
                <MiniSparkline
                  data={statsDailyCardTrends.profitVal}
                  color={statsProfitSummary.profit >= 0 ? "#10b981" : "#f43f5e"}
                  fillId="sparkline-profit"
                  className="w-10 h-5"
                />
              </div>
              {/* Bottom gradient border */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${statsProfitSummary.profit >= 0
                ? 'from-emerald-400 via-teal-500 to-green-600 shadow-[0_-1px_10px_rgba(16,185,129,0.3)]'
                : 'from-rose-400 via-red-500 to-orange-500 shadow-[0_-1px_10px_rgba(239,68,68,0.3)]'
                } rounded-b-2xl`} />
            </div>

            {/* Card 6: Profit Margin */}
            <div className={`relative overflow-hidden h-[105px] bg-gradient-to-br ${statsProfitSummary.margin >= 0
              ? 'from-indigo-50/30 via-white to-indigo-50/10 border-indigo-100 hover:border-indigo-300'
              : 'from-rose-50/30 via-white to-rose-50/10 border-rose-100 hover:border-rose-300'
              } rounded-2xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-lg ${statsProfitSummary.margin >= 0 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      } shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Percent size={13} />
                    </span>
                    <span className={`text-[8px] font-black ${statsProfitSummary.margin >= 0 ? 'text-indigo-500 bg-indigo-50/80 border-indigo-100/40' : 'text-rose-500 bg-rose-50/80 border-rose-100/40'
                      } uppercase tracking-wider px-1.5 py-0.5 rounded-md border whitespace-nowrap`}>
                      Profit Margin
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1 whitespace-nowrap">Margin Rate</p>
                  <h4 className={`text-lg font-black ${statsProfitSummary.margin >= 0 ? 'text-indigo-600' : 'text-rose-600'} tracking-tight leading-none`}>
                    {statsProfitSummary.margin.toFixed(1).replace(/\.0$/, '')}%
                  </h4>
                  <div className="w-[58%] bg-slate-100 rounded-full h-1 mt-2">
                    <div
                      className={`bg-gradient-to-r ${statsProfitSummary.margin >= 0 ? 'from-indigo-500 to-blue-600' : 'from-rose-500 to-red-600'
                        } h-1 rounded-full shadow-[0_1px_4px_rgba(79,70,229,0.3)] transition-all duration-500`}
                      style={{ width: `${Math.max(0, Math.min(100, Math.abs(statsProfitSummary.margin)))}%` }}
                    />
                  </div>
                </div>
              </div>
              {/* Sparkline background */}
              <div className="absolute right-2 bottom-3 pointer-events-none">
                <MiniSparkline
                  data={statsDailyCardTrends.marginVal}
                  color={statsProfitSummary.margin >= 0 ? "#6366f1" : "#f43f5e"}
                  fillId="sparkline-margin"
                  className="w-10 h-5"
                />
              </div>
              {/* Bottom gradient border */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${statsProfitSummary.margin >= 0
                ? 'from-indigo-400 via-blue-500 to-indigo-600 shadow-[0_-1px_10px_rgba(99,102,241,0.3)]'
                : 'from-rose-400 via-red-500 to-orange-500 shadow-[0_-1px_10px_rgba(239,68,68,0.3)]'
                } rounded-b-2xl`} />
            </div>
          </div>

          {/* Grid Layout: Left Query List, Right Installment Graph */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-5 mt-1">

            {/* Left Column: Switch Controls and Scrollable Query List */}
            <div className="md:col-span-1 border-r border-slate-200/80 pr-6 flex flex-col h-full min-h-0">
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2 text-slate-400">
                  <SlidersHorizontal size={11} className="shrink-0 text-slate-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Filter Scope</span>
                </div>
                <div className="relative flex items-center bg-slate-100 rounded-xl p-1 select-none w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setStatsModalMode('agent');
                      setStatsSelectedQueries([]);
                      setStatsSelectedAgent('all');
                    }}
                    className={`relative flex-1 py-1.5 px-4 text-xs font-bold transition-colors duration-300 cursor-pointer text-center whitespace-nowrap z-10 ${statsModalMode === 'agent'
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {statsModalMode === 'agent' && (
                      <motion.div
                        layoutId="statsModalActiveModeTab"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 shadow-sm -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    Agent Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatsModalMode('dmc');
                      setStatsSelectedQueries([]);
                      setStatsSelectedDmc('all');
                    }}
                    className={`relative flex-1 py-1.5 px-4 text-xs font-bold transition-colors duration-300 cursor-pointer text-center whitespace-nowrap z-10 ${statsModalMode === 'dmc'
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {statsModalMode === 'dmc' && (
                      <motion.div
                        layoutId="statsModalActiveModeTab"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-sm -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    DMC Payable
                  </button>
                </div>
              </div>

              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-2 mb-2.5">
                Queries / Bookings
              </h4>

              {/* Scrollable list of items */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 [scrollbar-width:thin]">
                {statsModalMode === 'agent' ? (
                  filteredTravelStatsInvoices.length === 0 ? (
                    <div className="text-center text-xs font-semibold text-slate-400 py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      No agent bookings in {statsModalPeriodLabel}
                    </div>
                  ) : (
                    filteredTravelStatsInvoices.map((invoice) => {
                      const queryId = invoice.query?.queryId || invoice._id;
                      const isChecked = statsSelectedQueries.includes(queryId);
                      const paymentEntries = getAgentPaymentEntries(invoice);
                      const totalAmount = getInvoiceTotalAmount(invoice);
                      const periodPaidAmount = isStatsYearlyView
                        ? getPaymentAmountInYear(paymentEntries, statsModalYear)
                        : getPaymentAmountInMonth(paymentEntries, statsPaymentYearMonth);
                      const paidAmount = Math.min(totalAmount, getInvoicePaidAmount(invoice) || periodPaidAmount);
                      const showPartialAmount = paidAmount > 0 && paidAmount < totalAmount;
                      const amount = showPartialAmount ? paidAmount : totalAmount;
                      const destination = invoice.tripSnapshot?.destination || invoice.query?.destination || "Unknown Destination";
                      const travelDateLabel = getTravelDateLabel(invoice);
                      const status = invoice.paymentStatus || "Unpaid";

                      let statusBadge = "bg-rose-50 text-rose-700 border-rose-100";
                      if (status === "Paid") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      else if (status === "Partially_Paid" || status === "Partially Paid") statusBadge = "bg-amber-50 text-amber-700 border-amber-100";

                      return (
                        <motion.div
                          key={invoice._id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setStatsSelectedQueries(isChecked ? [] : [queryId]);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${isChecked
                            ? 'bg-blue-50/60 border-blue-300 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              setStatsSelectedQueries(isChecked ? [] : [queryId]);
                            }}
                            className="w-3 h-3 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">
                                {invoice.query?.queryId || "Draft Invoice"}
                              </p>
                              <p className="text-[9px] text-slate-450 font-semibold truncate leading-none mt-0.5">
                                {destination}
                              </p>
                              {travelDateLabel && (
                                <p className="text-[8px] text-slate-400 font-bold truncate leading-none mt-1">
                                  Travel: {travelDateLabel}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {showPartialAmount ? (
                                <p className="text-[10px] font-black leading-tight whitespace-nowrap">
                                  <span className="text-emerald-700">₹{formatPlainNumber(amount)}</span>
                                  <span className="mx-0.5 text-slate-350">/</span>
                                  <span className="text-slate-850">₹{formatPlainNumber(totalAmount)}</span>
                                </p>
                              ) : (
                                <p className="text-[11px] font-black text-slate-850 leading-tight">
                                  ₹{formatPlainNumber(amount)}
                                </p>
                              )}
                              <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border leading-none mt-0.5 ${statusBadge}`}>
                                {status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )
                ) : (
                  filteredTravelStatsInternalInvoices.length === 0 ? (
                    <div className="text-center text-xs font-semibold text-slate-400 py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      No DMC bookings in {statsModalPeriodLabel}
                    </div>
                  ) : (
                    filteredTravelStatsInternalInvoices.map((invoice) => {
                      const queryId = invoice.query?.queryId || invoice.queryCode || invoice._id;
                      const isChecked = statsSelectedQueries.includes(queryId);
                      const paymentEntries = getDmcPaymentEntries(invoice);
                      const totalAmount = Number(invoice.summary?.grandTotal || invoice.claimedSummary?.grandTotal || invoice.payoutAmount || 0);
                      const periodPaidAmount = (
                        isStatsYearlyView
                          ? getPaymentAmountInYear(paymentEntries, statsModalYear)
                          : getPaymentAmountInMonth(paymentEntries, statsPaymentYearMonth)
                      );
                      const paidAmount = Math.min(totalAmount, getDmcPaidAmount(invoice) || periodPaidAmount);
                      const showPartialAmount = paidAmount > 0 && paidAmount < totalAmount;
                      const amount = showPartialAmount ? paidAmount : (periodPaidAmount || totalAmount);
                      const destination = invoice.query?.destination || invoice.destination || "Bulk Settlement";
                      const travelDateLabel = getTravelDateLabel(invoice);
                      const status = invoice.status || "Submitted";

                      let statusBadge = "bg-rose-50 text-rose-700 border-rose-100";
                      if (status === "Paid" || status === "Settled") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      else if (status === "Approved") statusBadge = "bg-blue-50 text-blue-700 border-blue-100";
                      else if (status === "In Review") statusBadge = "bg-amber-50 text-amber-700 border-amber-100";

                      return (
                        <motion.div
                          key={invoice._id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            setStatsSelectedQueries(isChecked ? [] : [queryId]);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${isChecked
                            ? 'bg-red-50/45 border-red-300 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              setStatsSelectedQueries(isChecked ? [] : [queryId]);
                            }}
                            className="w-3 h-3 rounded border-slate-350 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">
                                {invoice.query?.queryId || invoice.queryCode || "Bulk Batch"}
                              </p>
                              <p className="text-[9px] text-slate-455 font-semibold truncate leading-none mt-0.5">
                                {destination}
                              </p>
                              {travelDateLabel && (
                                <p className="text-[8px] text-slate-400 font-bold truncate leading-none mt-1">
                                  Travel: {travelDateLabel}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {showPartialAmount ? (
                                <p className="text-[10px] font-black leading-tight whitespace-nowrap">
                                  <span className="text-emerald-700">₹{formatPlainNumber(amount)}</span>
                                  <span className="mx-0.5 text-slate-350">/</span>
                                  <span className="text-slate-850">₹{formatPlainNumber(totalAmount)}</span>
                                </p>
                              ) : (
                                <p className="text-[11px] font-black text-slate-850 leading-tight">
                                  ₹{formatPlainNumber(amount)}
                                </p>
                              )}
                              <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border leading-none mt-0.5 ${statusBadge}`}>
                                {status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )
                )}
              </div>
            </div>

            {/* Right Column: Interactive Installments Graph */}
            <div className="md:col-span-2 flex flex-col h-full min-h-0 pl-4">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3">
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-850 uppercase tracking-wide">
                    <TrendingUp size={13} className="text-indigo-500 shrink-0" />
                    Installment Trend by {isStatsYearlyView ? 'Month' : 'Day'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {statsSelectedQueries.length > 0
                      ? `Showing specific ${isStatsYearlyView ? 'monthly' : 'daily'} installments for selected query: ${statsSelectedQueries[0]}`
                      : `Showing aggregated ${isStatsYearlyView ? 'monthly' : 'daily'} payments for ${statsModalPeriodLabel}`}
                  </p>
                </div>
              </div>

              <div className={`relative flex-1 border rounded-3xl p-4 min-h-[235px] w-full transition-all duration-300 ${statsModalMode === 'agent'
                ? 'border-blue-300/80 bg-gradient-to-br from-blue-100/50 via-indigo-50/40 to-slate-50/50 shadow-[0_4px_20px_rgba(37,99,235,0.04)]'
                : 'border-purple-300/80 bg-gradient-to-br from-purple-100/50 via-pink-50/40 to-slate-50/50 shadow-[0_4px_20px_rgba(168,85,247,0.04)]'
                }`}>
                <ModalDailyChart
                  daysCount={isStatsYearlyView ? 12 : getDaysInMonth(statsModalMonth)}
                  dailyData={statsDailyData}
                  mode={statsModalMode}
                  monthLabel={statsModalMonth}
                  labelsOverride={statsDailyLabels}
                  labelType={isStatsYearlyView ? 'month' : 'date'}
                  tooltipDetails={statsDailyDetails}
                />
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
