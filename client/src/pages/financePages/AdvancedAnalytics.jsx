import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import API from '../../utils/Api';
import {TrendingUp, TrendingDown, DollarSign, Download, FileText, FileSpreadsheet, CheckCircle2, Calendar, AlertCircle,} from 'lucide-react';

const MONTH_SEQUENCE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);

  if (absolute >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  }

  if (absolute >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')}L`;
  }

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const createEmptyMetric = (label, sub, color, bg, iconColor, changeTone = 'positive') => ({
  label,
  sub,
  val: '₹0',
  change: '0% vs last period',
  up: true,
  color,
  bg,
  iconColor,
  changeTone,
});

const createDefaultPeriodData = () => ({
  chart: {
    labels: [],
    inward: [],
    outward: [],
  },
  metrics: {
    inward: createEmptyMetric('Total Inward', 'Money from Agents', '#16a34a', '#f0fdf4', '#16a34a', 'positive'),
    outward: createEmptyMetric('Total Outward', 'Money to DMCs', '#dc2626', '#fef2f2', '#dc2626', 'negative'),
    profit: createEmptyMetric('Net Profit', 'After all expenses', '#2563eb', '#eff6ff', '#2563eb', 'positive'),
    margin: {
      label: 'Profit Margin',
      sub: 'Percentage of revenue',
      val: '0%',
      change: '0% vs last period',
      up: true,
      color: '#7c3aed',
      bg: '#f5f3ff',
      iconColor: '#7c3aed',
      changeTone: 'positive',
    },
  },
  taxSummary: {
    periodLabel: '-',
    gst: {
      total: '₹0',
      rateLabel: '@ 18% on taxable amount',
      status: 'No activity',
      breakdown: [
        { label: 'CGST (9%)', value: '₹0' },
        { label: 'SGST (9%)', value: '₹0' },
      ],
    },
    tcs: {
      total: '₹0',
      rateLabel: '@ 5% on package cost',
      status: 'No activity',
      breakdown: [
        { label: 'Domestic Tours', value: '₹0' },
        { label: 'International Tours', value: '₹0' },
      ],
    },
    tdf: {
      total: '₹0',
      rateLabel: 'Tax per hotel levy',
      status: 'No activity',
      breakdown: [
        { label: 'Total Transactions', value: '0' },
        { label: 'Avg Per Invoice', value: '₹0' },
      ],
    },
    summaryBar: {
      totalTaxCollected: '₹0',
      taxAsPercent: '0%',
      complianceStatus: 'All Taxes Filed',
      complianceTone: 'success',
      nextFilingDue: '-',
    },
  },
});

const defaultAnalytics = {
  generatedOn: '',
  monthly: createDefaultPeriodData(),
  yearly: createDefaultPeriodData(),
};

const TabButton = ({ id, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
      active ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
    }`}>
    {label}
  </button>
);

const ExportButton = ({ icon: Icon, label, color, onClick, disabled, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-sm font-semibold transition-all ${
      disabled ? 'cursor-not-allowed opacity-55' : 'hover:opacity-90 active:scale-95'
    } ${color}`}
  >
    <Icon className="w-4 h-4" />
    {loading ? 'Preparing...' : label}
  </button>
);

const normalizeMonthLabel = (label) => {
  const normalized = String(label || '').trim().slice(0, 3).toLowerCase();
  const match = MONTH_SEQUENCE.find((month) => month.toLowerCase() === normalized);
  return match || String(label || '').trim();
};

const reorderChartByCalendar = (chart = {}) => {
  const labels = Array.isArray(chart.labels) ? chart.labels : [];
  const inward = Array.isArray(chart.inward) ? chart.inward : [];
  const outward = Array.isArray(chart.outward) ? chart.outward : [];
  const monthMap = new Map();

  labels.forEach((label, index) => {
    const monthKey = normalizeMonthLabel(label);
    monthMap.set(monthKey, {
      inward: Number(inward[index] || 0),
      outward: Number(outward[index] || 0),
    });
  });

  return {
    labels: MONTH_SEQUENCE,
    inward: MONTH_SEQUENCE.map((month) => monthMap.get(month)?.inward || 0),
    outward: MONTH_SEQUENCE.map((month) => monthMap.get(month)?.outward || 0),
  };
};

const hasMeaningfulChartData = (chart = {}) =>
  ['inward', 'outward'].some((key) => Array.isArray(chart[key]) && chart[key].some((value) => Number(value || 0) > 0));

const hasMeaningfulTaxData = (summary = {}) =>
  [summary?.gst?.total, summary?.tcs?.total, summary?.tdf?.total, summary?.summaryBar?.totalTaxCollected].some(
    (value) => Number(String(value || '').replace(/[^0-9.-]/g, '')) > 0,
  );

const createReportWindow = (title, bodyMarkup) => {
  const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1040,height=780');
  if (!reportWindow) return null;

  reportWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          h2 { margin: 24px 0 8px; font-size: 16px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
          .chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        ${bodyMarkup}
      </body>
    </html>
  `);
  reportWindow.document.close();
  return reportWindow;
};

const MetricCard = ({ data, icon: Icon, loading }) => (
  <div className="bg-white border border-gray-200 rounded-4xl p-4 shadow-xs flex justify-between items-start">
    <div>
      <p className="text-sm font-bold text-slate-700">{data.label}</p>
      <p className="text-xs text-slate-400 mb-3">{data.sub}</p>
      <p className="text-2xl font-bold" style={{ color: data.color }}>
        {loading ? '...' : data.val}
      </p>
      <p className={`text-xs font-medium mt-2 ${data.changeTone === 'negative' ? 'text-red-500' : 'text-green-500'}`}>
        {data.up ? '↑' : '↓'} {loading ? 'Loading...' : data.change}
      </p>
    </div>
    <div className="p-2 rounded-lg" style={{ background: data.bg }}>
      <Icon className="w-5 h-5" style={{ color: data.iconColor }} />
    </div>
  </div>
);

const AnimatedChart = ({ chartData }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const scriptLoaded = useRef(false);

  const buildChart = () => {
    if (!canvasRef.current || !window.Chart) return;

    const labels = chartData?.labels?.length ? chartData.labels : [];
    const inward = chartData?.inward?.length ? chartData.inward : labels.map(() => 0);
    const outward = chartData?.outward?.length ? chartData.outward : labels.map(() => 0);
    const ctx = canvasRef.current.getContext('2d');

    const inGrad = ctx.createLinearGradient(0, 0, 0, 260);
    inGrad.addColorStop(0, 'rgba(22,163,74,0.20)');
    inGrad.addColorStop(1, 'rgba(22,163,74,0)');

    const outGrad = ctx.createLinearGradient(0, 0, 0, 260);
    outGrad.addColorStop(0, 'rgba(220,38,38,0.15)');
    outGrad.addColorStop(1, 'rgba(220,38,38,0)');

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Inward (Agents)',
            data: inward,
            borderColor: '#16a34a',
            backgroundColor: inGrad,
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: '#16a34a',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            tension: 0.42,
            fill: true,
          },
          {
            label: 'Outward (DMC)',
            data: outward,
            borderColor: '#dc2626',
            backgroundColor: outGrad,
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: '#dc2626',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            tension: 0.42,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing: 'easeInOutCubic',
          y: { from: (context) => context.chart.scales.y.bottom },
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            titleColor: '#1e293b',
            bodyColor: '#64748b',
            titleFont: { size: 12, weight: '600' },
            bodyFont: { size: 12 },
            padding: 12,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCompactCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, color: '#94a3b8' },
          },
          y: {
            grid: { color: 'rgba(148,163,184,0.12)' },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              color: '#94a3b8',
              callback: (value) => formatCompactCurrency(value),
            },
          },
        },
      },
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      buildChart();
      return undefined;
    }

    if (scriptLoaded.current) {
      return undefined;
    }

    scriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = buildChart;
    document.head.appendChild(script);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      buildChart();
    }
  }, [chartData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 260 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

const TaxCard = ({ title, subtitle, total, totalColor, bgColor, iconColor, rateLabel, status, breakdown, loading }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-600">{title}</p>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <DollarSign className={`w-4 h-4 ${iconColor}`} />
      </div>
    </div>
    <p className={`text-2xl font-bold ${totalColor}`}>{loading ? '...' : total}</p>
    <p className="text-[10px] text-slate-400">{rateLabel}</p>
    <span className="self-start bg-green-50 text-green-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
      {loading ? 'Loading' : status}
    </span>
    <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
      {breakdown.map((item) => (
        <div key={item.label} className="flex justify-between text-slate-500">
          <span>{item.label}</span>
          <span className="font-semibold text-slate-700">{loading ? '...' : item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const AdvancedAnalytics = () => {
  const [period, setPeriod] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeExport, setActiveExport] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await API.get('/admin/advanced-analytics');
        setAnalyticsData(data?.data || defaultAnalytics);
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError?.response?.data?.message || 'Failed to load advanced analytics');
        setAnalyticsData(defaultAnalytics);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const periodData = analyticsData?.[period] || defaultAnalytics[period];
  const chartData = useMemo(
    () => (period === 'monthly' ? reorderChartByCalendar(periodData.chart) : periodData.chart),
    [period, periodData.chart],
  );
  const generatedOnLabel = useMemo(() => {
    const sourceDate = analyticsData?.generatedOn ? new Date(analyticsData.generatedOn) : new Date();
    return sourceDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [analyticsData?.generatedOn]);

  const metricCards = [
    { key: 'inward', icon: TrendingUp },
    { key: 'outward', icon: TrendingDown },
    { key: 'profit', icon: DollarSign },
    { key: 'margin', icon: TrendingUp },
  ];

  const complianceIsHealthy = periodData.taxSummary.summaryBar.complianceTone === 'success';
  const hasChartData = useMemo(() => hasMeaningfulChartData(chartData), [chartData]);
  const hasTaxData = useMemo(() => hasMeaningfulTaxData(periodData.taxSummary), [periodData.taxSummary]);
  const canExportOverview = !loading && !error && hasChartData;
  const canExportTax = !loading && !error && hasTaxData;
  const canExportAudit = !loading && !error && (hasChartData || hasTaxData);
  const periodLabel = period === 'monthly' ? 'Monthly' : 'Yearly';

  const handlePrintReport = (mode) => {
    const exportKey = `${mode}-pdf`;
    setActiveExport(exportKey);
    try {
      const title = mode === 'audit' ? `${periodLabel} Audit Report` : `${periodLabel} Analytics Report`;
      const reportWindow = createReportWindow(
        title,
        `
          <h1>${title}</h1>
          <p class="meta">Generated on ${generatedOnLabel}</p>
          <div class="grid">
            ${metricCards
              .map(({ key }) => {
                const metric = periodData.metrics[key];
                return `
                  <div class="card">
                    <div class="meta">${metric.label}</div>
                    <div style="font-size: 24px; font-weight: 700; margin-bottom: 6px;">${metric.val}</div>
                    <div class="chip">${metric.change}</div>
                  </div>
                `;
              })
              .join('')}
          </div>
          <h2>Trend Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Inward</th>
                <th>Outward</th>
              </tr>
            </thead>
            <tbody>
              ${chartData.labels
                .map(
                  (label, index) => `
                    <tr>
                      <td>${label}</td>
                      <td>${formatCompactCurrency(chartData.inward[index])}</td>
                      <td>${formatCompactCurrency(chartData.outward[index])}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
          ${
            mode === 'audit'
              ? `
                <h2>Tax Summary</h2>
                <div class="grid">
                  <div class="card">
                    <div class="meta">GST</div>
                    <div style="font-size: 22px; font-weight: 700;">${periodData.taxSummary.gst.total}</div>
                    <div>${periodData.taxSummary.gst.status}</div>
                  </div>
                  <div class="card">
                    <div class="meta">TCS</div>
                    <div style="font-size: 22px; font-weight: 700;">${periodData.taxSummary.tcs.total}</div>
                    <div>${periodData.taxSummary.tcs.status}</div>
                  </div>
                  <div class="card">
                    <div class="meta">TDF</div>
                    <div style="font-size: 22px; font-weight: 700;">${periodData.taxSummary.tdf.total}</div>
                    <div>${periodData.taxSummary.tdf.status}</div>
                  </div>
                  <div class="card">
                    <div class="meta">Compliance</div>
                    <div style="font-size: 22px; font-weight: 700;">${periodData.taxSummary.summaryBar.complianceStatus}</div>
                    <div>Next filing due ${periodData.taxSummary.summaryBar.nextFilingDue}</div>
                  </div>
                </div>
              `
              : ''
          }
        `,
      );

      if (reportWindow) {
        reportWindow.focus();
        reportWindow.print();
      }
    } finally {
      window.setTimeout(() => setActiveExport(''), 300);
    }
  };

  const handleExcelExport = (mode) => {
    const exportKey = `${mode}-excel`;
    setActiveExport(exportKey);
    try {
      const workbook = XLSX.utils.book_new();
      const overviewRows = chartData.labels.map((label, index) => ({
        Period: label,
        Inward: Number(chartData.inward[index] || 0),
        Outward: Number(chartData.outward[index] || 0),
      }));

      const metricsSheet = XLSX.utils.json_to_sheet(
        metricCards.map(({ key }) => ({
          Metric: periodData.metrics[key].label,
          Value: periodData.metrics[key].val,
          Change: periodData.metrics[key].change,
        })),
      );
      const overviewSheet = XLSX.utils.json_to_sheet(overviewRows);

      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

      if (mode !== 'overview') {
        const taxSheet = XLSX.utils.json_to_sheet([
          {
            Section: 'GST',
            Total: periodData.taxSummary.gst.total,
            Status: periodData.taxSummary.gst.status,
            RateLabel: periodData.taxSummary.gst.rateLabel,
          },
          {
            Section: 'TCS',
            Total: periodData.taxSummary.tcs.total,
            Status: periodData.taxSummary.tcs.status,
            RateLabel: periodData.taxSummary.tcs.rateLabel,
          },
          {
            Section: 'TDF',
            Total: periodData.taxSummary.tdf.total,
            Status: periodData.taxSummary.tdf.status,
            RateLabel: periodData.taxSummary.tdf.rateLabel,
          },
        ]);
        XLSX.utils.book_append_sheet(workbook, taxSheet, 'Tax Summary');
      }

      XLSX.writeFile(workbook, `holiday-circuit-${period}-${mode}-report.xlsx`);
    } finally {
      window.setTimeout(() => setActiveExport(''), 300);
    }
  };

  return (
    <div className="flex flex-col gap-6  max-w-7xl mx-auto text-slate-800 pb-1 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive financial insights and tax reporting</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1">
            <TabButton id="monthly" label="Monthly" active={period === 'monthly'} onClick={setPeriod} />
            <TabButton id="yearly" label="Yearly" active={period === 'yearly'} onClick={setPeriod} />
          </div>
          <ExportButton
            icon={FileText}
            label={`${periodLabel} PDF`}
            color="bg-red-500"
            onClick={() => handlePrintReport('overview')}
            disabled={!canExportOverview}
            loading={activeExport === 'overview-pdf'}
          />
          <ExportButton
            icon={FileSpreadsheet}
            label={`${periodLabel} Excel`}
            color="bg-green-600"
            onClick={() => handleExcelExport('overview')}
            disabled={!canExportOverview}
            loading={activeExport === 'overview-excel'}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ">
        {metricCards.map(({ key, icon }) => (
          <MetricCard
            key={key}
            data={periodData.metrics[key]}
            icon={icon}
            loading={loading}
          />
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">Revenue vs. Payable Trend</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">
              Inward Money (Agents) vs Outward Money (DMC) — {period === 'monthly' ? '12 Month View' : '6 Year View'}
            </p>
          </div>
          <div className="flex items-center gap-5 ml-6 sm:ml-0">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-8 h-0.5 rounded" style={{ background: '#16a34a' }} />
              Inward (Agents)
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-8 h-0.5 rounded" style={{ background: '#dc2626' }} />
              Outward (DMC)
            </span>
          </div>
        </div>

        <AnimatedChart key={period} chartData={chartData} />

        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#16a34a' }} />
            Inward (Agents)
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#dc2626' }} />
            Outward (DMC)
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-orange-500 text-lg"><FileText/></span>
              <h2 className="text-base font-bold text-slate-800">Tax Summary</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-8">
              Period: {loading ? 'Loading...' : periodData.taxSummary.periodLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleExcelExport('tax')}
            disabled={!canExportTax}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              canExportTax ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            {activeExport === 'tax-excel' ? 'Preparing report...' : `Download ${periodLabel} Tax Report`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 p-4 gap-3">
          <TaxCard
            title="Total GST Collected"
            subtitle="Goods & Services Tax"
            total={periodData.taxSummary.gst.total}
            totalColor="text-blue-600"
            bgColor="bg-blue-50"
            iconColor="text-blue-500"
            rateLabel={periodData.taxSummary.gst.rateLabel}
            status={periodData.taxSummary.gst.status}
            breakdown={periodData.taxSummary.gst.breakdown}
            loading={loading}
          />

          <div className="md:px-5">
            <TaxCard
              title="Total TCS"
              subtitle="Tax Collected at Source"
              total={periodData.taxSummary.tcs.total}
              totalColor="text-yellow-600"
              bgColor="bg-yellow-50"
              iconColor="text-yellow-500"
              rateLabel={periodData.taxSummary.tcs.rateLabel}
              status={periodData.taxSummary.tcs.status}
              breakdown={periodData.taxSummary.tcs.breakdown}
              loading={loading}
            />
          </div>

          <TaxCard
            title="Total TDF"
            subtitle="Tourism Development Tax"
            total={periodData.taxSummary.tdf.total}
            totalColor="text-green-600"
            bgColor="bg-green-50"
            iconColor="text-green-500"
            rateLabel={periodData.taxSummary.tdf.rateLabel}
            status={periodData.taxSummary.tdf.status}
            breakdown={periodData.taxSummary.tdf.breakdown}
            loading={loading}
          />
        </div>

        <div className="bg-slate-900 text-white px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Total Tax Collected</p>
            <p className="text-lg font-bold text-white">
              {loading ? '...' : periodData.taxSummary.summaryBar.totalTaxCollected}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Tax as % of Revenue</p>
            <p className="text-lg font-bold text-white">
              {loading ? '...' : periodData.taxSummary.summaryBar.taxAsPercent}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Compliance Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className={`w-4 h-4 ${complianceIsHealthy ? 'text-green-400' : 'text-yellow-400'}`} />
              <span className={`text-sm font-semibold ${complianceIsHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
                {loading ? 'Loading...' : periodData.taxSummary.summaryBar.complianceStatus}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Next Filing Due</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">
                {loading ? generatedOnLabel : periodData.taxSummary.summaryBar.nextFilingDue}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Download Complete Audit Report</h2>
          <p className="text-xs text-slate-400 mt-1">Generate comprehensive financial audit report including all transactions, tax summaries, and analytics</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ExportButton
            icon={FileText}
            label={`${periodLabel} Audit PDF`}
            color="bg-red-500"
            onClick={() => handlePrintReport('audit')}
            disabled={!canExportAudit}
            loading={activeExport === 'audit-pdf'}
          />
          <ExportButton
            icon={FileSpreadsheet}
            label={`${periodLabel} Audit Excel`}
            color="bg-green-600"
            onClick={() => handleExcelExport('audit')}
            disabled={!canExportAudit}
            loading={activeExport === 'audit-excel'}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
