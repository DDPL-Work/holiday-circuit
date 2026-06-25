import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import API from '../../utils/Api';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Download, FileText, FileSpreadsheet, CheckCircle2, Calendar, AlertCircle, Receipt, Coins, Percent, ChevronDown, ChevronLeft, ChevronRight, X, SlidersHorizontal, IndianRupee, Star, Sparkles, MapPin, Flag, User } from 'lucide-react';

const MONTH_SEQUENCE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CONFIRMED_STATS_PAYMENT_STATUSES = new Set(['Partially Paid', 'Partially_Paid', 'Paid']);

const parseValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatYearMonthFromDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const isDateInYearMonth = (date, yearMonth) =>
  Boolean(date && yearMonth && formatYearMonthFromDate(date) === yearMonth);

const isDateInYear = (date, year) =>
  Boolean(date && year && date.getFullYear() === Number(year));

const formatDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatInstallmentDateLabel = (date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

const getPrimaryTravelDate = (record = {}) =>
  parseValidDate(record.query?.startDate || record.queryId?.startDate || record.tripSnapshot?.startDate) ||
  parseValidDate((record.items || []).find((item) => item.query?.startDate)?.query?.startDate);

const hasTravelInMonth = (record = {}, targetYearMonth = '') => {
  const directTravelDate = getPrimaryTravelDate(record);
  if (isDateInYearMonth(directTravelDate, targetYearMonth)) return true;

  return (record.items || []).some((item) => {
    const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
    return isDateInYearMonth(itemTravelDate, targetYearMonth);
  });
};

const hasTravelInYear = (record = {}, targetYear = '') => {
  const directTravelDate = getPrimaryTravelDate(record);
  if (isDateInYear(directTravelDate, targetYear)) return true;

  return (record.items || []).some((item) => {
    const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
    return isDateInYear(itemTravelDate, targetYear);
  });
};

const formatShortDate = (value) => {
  const date = parseValidDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTravelDateLabel = (record = {}) => {
  const start =
    record.query?.startDate ||
    record.queryId?.startDate ||
    record.tripSnapshot?.startDate ||
    record.startDate ||
    (record.items || []).find((item) => item.query?.startDate)?.query?.startDate;
  const end =
    record.query?.endDate ||
    record.queryId?.endDate ||
    record.tripSnapshot?.endDate ||
    record.endDate ||
    (record.items || []).find((item) => item.query?.endDate)?.query?.endDate;
  const startLabel = formatShortDate(start);
  const endLabel = formatShortDate(end);

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  return startLabel || endLabel || '';
};

const parseInvoiceDate = (invoice) => {
  const source =
    invoice?.paymentSubmission?.paymentDate ||
    invoice?.paymentSubmission?.submittedAt ||
    invoice?.createdAt;
  return parseValidDate(source);
};

const parseInvoiceCreateDate = (invoice = {}) =>
  parseValidDate(invoice.createdAt);

const parseInvoiceTravelDate = (invoice = {}) =>
  getPrimaryTravelDate(invoice) || parseInvoiceDate(invoice);

const parseAgentInstallmentDate = (entry = {}) =>
  parseValidDate(
    entry.paymentDateValue ||
    entry.paymentDate ||
    entry.date ||
    entry.createdAt
  );

const getInvoiceTotalAmount = (invoice = {}) => {
  const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
    : [];
  const trackerTotal = trackerPayments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const servicesTotal = Array.isArray(invoice.services)
    ? invoice.services.reduce((sum, service) => sum + Number(service?.totalInInr || service?.total || 0), 0)
    : 0;

  if (invoice.isQuotationChecklistRow) {
    return Math.max(
      Number(invoice.totalAmount || 0),
      Number(invoice.pricing?.totalAmount || 0),
      servicesTotal,
    );
  }

  return Math.max(
    Number(invoice.totalAmount || 0),
    Number(invoice.clientTotalAmount || 0),
    Number(invoice.pricingSnapshot?.grandTotal || 0),
    Number(invoice.pricing?.totalAmount || 0),
    Number(invoice.paymentSubmission?.amount || 0),
    trackerTotal,
    servicesTotal,
  );
};

const getQuotationOpsPayableAmount = (quotation = {}) => {
  const servicesTotal = Array.isArray(quotation.services)
    ? quotation.services.reduce((sum, service) => sum + Number(service?.totalInInr || service?.total || 0), 0)
    : 0;

  return Math.max(
    Number(quotation.pricing?.totalAmount || 0),
    Number(quotation.totalAmount || 0),
    servicesTotal,
  );
};

const getAgentPaymentEntries = (invoice = {}) => {
  const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
    ? invoice.paymentSubmission.trackerPayments
    : [];

  if (trackerPayments.length > 0) {
    return trackerPayments
      .map((entry) => ({
        date: parseAgentInstallmentDate(entry),
        amount: Number(entry.amount || 0),
        status: entry.verificationStatus || entry.status || '',
      }))
      .filter((entry) => entry.amount > 0);
  }

  const submittedAmount = Number(invoice.paymentSubmission?.amount || 0);
  if (submittedAmount > 0) {
    return [{
      date: parseInvoiceDate(invoice),
      amount: submittedAmount,
      status: invoice.paymentVerification?.status || '',
    }];
  }

  const totalAmount = getInvoiceTotalAmount(invoice);
  if (totalAmount > 0 && CONFIRMED_STATS_PAYMENT_STATUSES.has(String(invoice.paymentStatus || ''))) {
    return [{
      date: parseInvoiceDate(invoice),
      amount: totalAmount,
      status: invoice.paymentStatus || '',
    }];
  }

  return [];
};

const isVerifiedPaymentEntry = (entry = {}) => {
  const status = String(entry.status || entry.verificationStatus || '').toLowerCase();
  if (!status) return true;
  return ['verified', 'approved', 'accepted', 'paid', 'settled', 'completed'].some((term) =>
    status.includes(term)
  );
};

const getInvoicePaymentDate = (invoice = {}) => {
  const entries = getAgentPaymentEntries(invoice);
  if (entries.length > 0) {
    const verified = entries.find(isVerifiedPaymentEntry);
    if (verified && verified.date) return verified.date;
    if (entries[0] && entries[0].date) return entries[0].date;
  }
  if (invoice.paymentStatus === 'Unpaid') return null;
  return parseInvoiceDate(invoice);
};

const isDateOnOrBeforeDay = (date, cutoffDate) => {
  if (!date || !cutoffDate) return false;
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  const normalizedCutoff = new Date(cutoffDate);
  normalizedCutoff.setHours(23, 59, 59, 999);
  return normalizedDate <= normalizedCutoff;
};

const getPaymentAmountInMonth = (entries = [], targetYearMonth = '') =>
  entries.reduce((sum, entry) => (
    isDateInYearMonth(entry.date, targetYearMonth)
      ? sum + Number(entry.amount || 0)
      : sum
  ), 0);

const getPaymentAmountInYear = (entries = [], targetYear = '') =>
  entries.reduce((sum, entry) => (
    isDateInYear(entry.date, targetYear)
      ? sum + Number(entry.amount || 0)
      : sum
  ), 0);

const hasAgentPaymentInMonth = (invoice = {}, targetYearMonth = '') =>
  getAgentPaymentEntries(invoice).some((entry) => isDateInYearMonth(entry.date, targetYearMonth));

const hasAgentPaymentInYear = (invoice = {}, targetYear = '') =>
  getAgentPaymentEntries(invoice).some((entry) => isDateInYear(entry.date, targetYear));

const parseInternalInvoiceDate = (invoice) => {
  const source =
    invoice?.payoutDateValue ||
    invoice?.payoutDate ||
    invoice?.submittedAt ||
    invoice?.invoiceDate ||
    invoice?.createdAt;
  return parseValidDate(source);
};

const parseDmcInstallmentDate = (entry = {}) =>
  parseValidDate(
    entry.paymentDateValue ||
    entry.payoutDateValue ||
    entry.paymentDate ||
    entry.payoutDate ||
    entry.date ||
    entry.createdAt
  );

const getDmcPaymentEntries = (invoice = {}) => {
  const installments = Array.isArray(invoice.payoutInstallments)
    ? invoice.payoutInstallments
    : [];

  if (installments.length > 0) {
    return installments
      .map((entry) => ({
        date: parseDmcInstallmentDate(entry),
        amount: Number(entry.amount || 0),
      }))
      .filter((entry) => entry.amount > 0);
  }

  const amount = getDmcPaidAmount(invoice);
  if (amount > 0) {
    return [{
      date: parseInternalInvoiceDate(invoice),
      amount,
    }];
  }

  return [];
};

const hasDmcPaymentInMonth = (invoice = {}, targetYearMonth = '') =>
  getDmcPaymentEntries(invoice).some((entry) => isDateInYearMonth(entry.date, targetYearMonth));

const hasDmcPaymentInYear = (invoice = {}, targetYear = '') =>
  getDmcPaymentEntries(invoice).some((entry) => isDateInYear(entry.date, targetYear));

const getInvoicePaidAmount = (invoice) => {
  const trackerPayments = invoice.paymentSubmission?.trackerPayments || [];
  if (Array.isArray(trackerPayments) && trackerPayments.length > 0) {
    return trackerPayments.reduce((sum, entry) => (
      isVerifiedPaymentEntry(entry)
        ? sum + Number(entry.amount || 0)
        : sum
    ), 0);
  }
  const submittedAmount = Number(invoice.paymentSubmission?.amount || 0);
  if (invoice.paymentStatus === 'Paid') return Number(invoice.totalAmount || 0);
  if (invoice.paymentStatus === 'Partially_Paid' || invoice.paymentStatus === 'Partially Paid') {
    return submittedAmount || Number(invoice.totalAmount || 0) * 0.5;
  }
  if (isVerifiedPaymentEntry(invoice.paymentVerification) && submittedAmount > 0) return submittedAmount;
  return 0;
};

const getInvoicePreTravelPaidAmount = (invoice = {}) => {
  const travelDate = parseInvoiceTravelDate(invoice);
  if (!travelDate) return 0;

  const entries = getAgentPaymentEntries(invoice).filter(
    (entry) => isVerifiedPaymentEntry(entry) && isDateOnOrBeforeDay(entry.date, travelDate),
  );

  if (entries.length > 0) {
    return entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }

  const paymentDate = getInvoicePaymentDate(invoice);
  if (!isDateOnOrBeforeDay(paymentDate, travelDate)) return 0;
  return getInvoicePaidAmount(invoice);
};

const getInvoicePreTravelPaymentDate = (invoice = {}) => {
  const travelDate = parseInvoiceTravelDate(invoice);
  if (!travelDate) return null;

  const entries = getAgentPaymentEntries(invoice)
    .filter((entry) => isVerifiedPaymentEntry(entry) && isDateOnOrBeforeDay(entry.date, travelDate))
    .sort((left, right) => (left.date?.getTime?.() || 0) - (right.date?.getTime?.() || 0));

  if (entries[0]?.date) return entries[0].date;

  const paymentDate = getInvoicePaymentDate(invoice);
  return isDateOnOrBeforeDay(paymentDate, travelDate) ? paymentDate : null;
};

const getChecklistQueryKey = (record = {}) =>
  String(
    record.query?._id ||
    record.query?.queryId ||
    record.query ||
    record.queryId?._id ||
    record.queryId?.queryId ||
    record.queryId ||
    record.tripSnapshot?.queryId ||
    '',
  ).trim();

const isClientApprovedChecklistRecord = (record = {}) => {
  const query = record.query || record.queryId || {};
  return (
    record.isQuotationChecklistRow ||
    String(record.status || '').trim() === 'Confirmed' ||
    String(record.paymentStatus || '').trim() === 'Client Approved' ||
    String(query.agentStatus || '').trim() === 'Client Approved'
  );
};

const normalizeQuotationChecklistRow = (quotation = {}) => {
  const query = quotation.queryId || {};
  const totalAmount = getQuotationOpsPayableAmount(quotation);

  return {
    ...quotation,
    _id: quotation._id || `quotation-${quotation.quotationNumber || query.queryId || quotation.createdAt}`,
    isQuotationChecklistRow: true,
    invoiceNumber: quotation.quotationNumber || 'Approved Quotation',
    totalAmount,
    paymentStatus: 'Client Approved',
    query,
    tripSnapshot: {
      destination: query.destination || '',
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      queryId: query.queryId || '',
    },
    paymentSubmission: {
      trackerPayments: [],
      amount: 0,
    },
    paymentVerification: {
      status: 'Client Approved',
    },
  };
};

const getDmcPaidAmount = (invoice) => {
  const installments = invoice.payoutInstallments || [];
  if (Array.isArray(installments) && installments.length > 0) {
    return installments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }
  if (invoice.status === 'Paid' || invoice.status === 'Settled') return Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
  return 0;
};

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

const formatTruncatedCompactDecimal = (value) => {
  const truncated = Math.trunc(Number(value || 0) * 100) / 100;
  return truncated.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absolute >= 10000000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 10000000)}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 100000)}L`;
  }

  return `${sign}\u20B9${absolute.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const parseReportCurrencyValue = (value) => {
  const raw = String(value || '').trim();
  const numeric = Number(raw.replace(/[^0-9.-]/g, '')) || 0;
  const lower = raw.toLowerCase();
  if (lower.includes('cr')) return numeric * 10000000;
  if (lower.includes('l')) return numeric * 100000;
  return numeric;
};

const getRevenueReportTotal = (report = {}) => {
  const revenueCard = (Array.isArray(report.summaryCards) ? report.summaryCards : [])
    .find((card) => {
      const label = String(card.label || '').toLowerCase();
      return label === 'monthly revenue' || label === 'yearly revenue';
    });

  if (revenueCard) return parseReportCurrencyValue(revenueCard.value);

  const travelRevenueRows = Array.isArray(report.travelDateRevenue) ? report.travelDateRevenue : [];
  const travelTotal = travelRevenueRows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  if (travelTotal > 0) return travelTotal;

  const monthlyRevenueRows = Array.isArray(report.monthlyRevenue) ? report.monthlyRevenue : [];
  return monthlyRevenueRows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
};

const describeSvgPieArc = (cx, cy, radius, startAngle, endAngle) => {
  const startRadians = ((startAngle - 90) * Math.PI) / 180;
  const endRadians = ((endAngle - 90) * Math.PI) / 180;
  const startX = cx + radius * Math.cos(startRadians);
  const startY = cy + radius * Math.sin(startRadians);
  const endX = cx + radius * Math.cos(endRadians);
  const endY = cy + radius * Math.sin(endRadians);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    'Z',
  ].join(' ');
};

const getPiePoint = (cx, cy, radius, angle) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const yearlyPieColors = [
  '#2563eb',
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#64748b',
];

const yearlyPieLabelSlots = [
  { x: 70, y: 10, anchor: 'middle', dotAngle: 0, valueOffset: -5 },
  { x: 111, y: 24, anchor: 'start', dotAngle: 34, valueOffset: 6 },
  { x: 132, y: 52, anchor: 'start', dotAngle: 64, valueOffset: 6 },
  { x: 137, y: 80, anchor: 'start', dotAngle: 96, valueOffset: 6 },
  { x: 119, y: 119, anchor: 'start', dotAngle: 135, valueOffset: 6 },
  { x: 74, y: 130, anchor: 'middle', dotAngle: 170, valueOffset: 6 },
  { x: 41, y: 128, anchor: 'end', dotAngle: 202, valueOffset: 6 },
  { x: 17, y: 112, anchor: 'end', dotAngle: 230, valueOffset: 6 },
  { x: 14, y: 82, anchor: 'end', dotAngle: 260, valueOffset: -5 },
  { x: 16, y: 54, anchor: 'end', dotAngle: 290, valueOffset: -5 },
  { x: 29, y: 29, anchor: 'end', dotAngle: 320, valueOffset: -5 },
  { x: 50, y: 12, anchor: 'end', dotAngle: 342, valueOffset: -5 },
];

const RevenueAnalyticsChart = ({
  loading,
  period,
  effectiveSelectedTaxMonth,
  effectiveSelectedTaxYear,
  appliedCustomRange,
  travelDateEntries,
  groups = {},
  previousMonthRevenueTotal = 0,
}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const pastTotal = useMemo(() => (groups?.past || []).reduce((sum, inv) => sum + getInvoiceTotalAmount(inv), 0), [groups]);
  const currentTotal = useMemo(() => (groups?.current || []).reduce((sum, inv) => sum + getInvoiceTotalAmount(inv), 0), [groups]);
  const upcomingTotal = useMemo(() => (groups?.upcoming || []).reduce((sum, inv) => sum + getInvoiceTotalAmount(inv), 0), [groups]);
  const totalSum = pastTotal + currentTotal + upcomingTotal;
  const comparisonPreviousTotal = Number(previousMonthRevenueTotal || 0);

  const comparison = useMemo(() => {
    const diff = currentTotal - comparisonPreviousTotal;
    const isUp = diff >= 0;
    const absDiff = Math.abs(diff);
    const percentage = comparisonPreviousTotal > 0 ? ((diff / comparisonPreviousTotal) * 100).toFixed(1) : (diff > 0 ? '100' : '0');
    return { isUp, absDiff, percentage };
  }, [currentTotal, comparisonPreviousTotal]);

  const donutData = useMemo(() => {
    const rPast = 39;
    const rCurrent = 45;
    const rUpcoming = 33;

    const cPast = 2 * Math.PI * rPast;
    const cCurrent = 2 * Math.PI * rCurrent;
    const cUpcoming = 2 * Math.PI * rUpcoming;

    const gapAngle = totalSum === 0 ? 0 : 6;
    const activeSegmentsCount = (pastTotal > 0 ? 1 : 0) + (currentTotal > 0 ? 1 : 0) + (upcomingTotal > 0 ? 1 : 0);
    const activeAngleSpace = 360 - (activeSegmentsCount * gapAngle);

    const pastAngle = pastTotal > 0 ? (pastTotal / totalSum) * activeAngleSpace : 0;
    const currentAngle = currentTotal > 0 ? (currentTotal / totalSum) * activeAngleSpace : 0;
    const upcomingAngle = upcomingTotal > 0 ? (upcomingTotal / totalSum) * activeAngleSpace : 0;

    let currentAngleOffset = 0;

    let pastStartAngle = 0;
    if (pastTotal > 0) {
      pastStartAngle = currentAngleOffset;
      currentAngleOffset += (pastAngle + gapAngle);
    }

    let currentStartAngle = 0;
    if (currentTotal > 0) {
      currentStartAngle = currentAngleOffset;
      currentAngleOffset += (currentAngle + gapAngle);
    }

    let upcomingStartAngle = 0;
    if (upcomingTotal > 0) {
      upcomingStartAngle = currentAngleOffset;
      currentAngleOffset += (upcomingAngle + gapAngle);
    }

    const pastDash = (pastAngle / 360) * cPast;
    const pastDashArray = `${pastDash} ${cPast - pastDash}`;
    const pastOffset = (0.25 - (pastStartAngle / 360)) * cPast;

    const currentDash = (currentAngle / 360) * cCurrent;
    const currentDashArray = `${currentDash} ${cCurrent - currentDash}`;
    const currentOffset = (0.25 - (currentStartAngle / 360)) * cCurrent;

    const upcomingDash = (upcomingAngle / 360) * cUpcoming;
    const upcomingDashArray = `${upcomingDash} ${cUpcoming - upcomingDash}`;
    const upcomingOffset = (0.25 - (upcomingStartAngle / 360)) * cUpcoming;

    return {
      cPast,
      cCurrent,
      cUpcoming,
      rPast,
      rCurrent,
      rUpcoming,
      pastDashArray,
      pastOffset,
      currentDashArray,
      currentOffset,
      upcomingDashArray,
      upcomingOffset,
    };
  }, [pastTotal, currentTotal, upcomingTotal, totalSum]);

  const chartDataCombined = useMemo(() => {
    let labels = [];
    let revenueData = [];
    let receivedData = [];
    let upcomingData = [];

    if (period === 'yearly') {
      labels = MONTH_SEQUENCE;
      revenueData = Array(12).fill(0);
      receivedData = Array(12).fill(0);
      upcomingData = Array(12).fill(0);

      travelDateEntries.forEach((entry) => {
        if (!entry.date) return;
        const parts = entry.date.split('-');
        if (parts.length >= 2) {
          const monthIdx = Number(parts[1]) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            revenueData[monthIdx] += Number(entry.revenue || 0);
            receivedData[monthIdx] += Number(entry.receivedPayment || 0);
          }
        }
      });

      (groups.upcoming || []).forEach((invoice) => {
        const createDate = parseInvoiceCreateDate(invoice);
        if (!createDate) return;
        const monthIdx = createDate.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          upcomingData[monthIdx] += getInvoiceTotalAmount(invoice);
        }
      });
    } else if (period === 'monthly') {
      const monthStr = effectiveSelectedTaxMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const [yearNum, monthNum] = monthStr.split('-').map(Number);
      const daysCount = new Date(yearNum, monthNum, 0).getDate();

      labels = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, '0'));
      revenueData = Array(daysCount).fill(0);
      receivedData = Array(daysCount).fill(0);
      upcomingData = Array(daysCount).fill(0);

      travelDateEntries.forEach((entry) => {
        if (!entry.date) return;
        const day = Number(entry.date.split('-')[2]);
        if (day >= 1 && day <= daysCount) {
          revenueData[day - 1] = Number(entry.revenue || 0);
          receivedData[day - 1] = Number(entry.receivedPayment || 0);
        }
      });

      (groups.upcoming || []).forEach((invoice) => {
        const createDate = parseInvoiceCreateDate(invoice);
        if (!createDate) return;
        const day = createDate.getDate();
        if (day >= 1 && day <= daysCount) {
          upcomingData[day - 1] += getInvoiceTotalAmount(invoice);
        }
      });
    } else {
      const start = appliedCustomRange.start ? new Date(appliedCustomRange.start) : new Date();
      const end = appliedCustomRange.end ? new Date(appliedCustomRange.end) : new Date();

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const dates = [];
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }

      labels = dates.map((d) => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }));
      revenueData = Array(diffDays).fill(0);
      receivedData = Array(diffDays).fill(0);
      upcomingData = Array(diffDays).fill(0);

      travelDateEntries.forEach((entry) => {
        if (!entry.date) return;
        const entryParts = entry.date.split('-').map(Number);
        const entryTime = new Date(entryParts[0], entryParts[1] - 1, entryParts[2]).toDateString();

        const idx = dates.findIndex((d) => d.toDateString() === entryTime);
        if (idx !== -1) {
          revenueData[idx] = Number(entry.revenue || 0);
          receivedData[idx] = Number(entry.receivedPayment || 0);
        }
      });

      (groups.upcoming || []).forEach((invoice) => {
        const createDate = parseInvoiceCreateDate(invoice);
        if (!createDate) return;
        const idx = dates.findIndex((d) => d.toDateString() === createDate.toDateString());
        if (idx !== -1) {
          upcomingData[idx] += getInvoiceTotalAmount(invoice);
        }
      });
    }

    return { labels, revenueData, receivedData, upcomingData };
  }, [period, effectiveSelectedTaxMonth, travelDateEntries, appliedCustomRange, groups.upcoming]);

  const yearlyPieData = useMemo(() => {
    if (period !== 'yearly') return { months: [], total: 0, bestMonth: null };

    const revenueValues = chartDataCombined.revenueData.map((value) => Number(value || 0));
    const total = revenueValues.reduce((sum, value) => sum + value, 0);
    let cursor = 0;

    const months = MONTH_SEQUENCE.map((label, index) => {
      const labelSlot = yearlyPieLabelSlots[index] || yearlyPieLabelSlots[0];
      const revenue = revenueValues[index] || 0;
      const previousRevenue = index > 0 ? revenueValues[index - 1] || 0 : 0;
      const revenueDiff = revenue - previousRevenue;
      const profit = Math.max(revenueDiff, 0);
      const loss = Math.max(-revenueDiff, 0);
      const margin = previousRevenue > 0
        ? (revenueDiff / previousRevenue) * 100
        : revenue > 0 ? 100 : 0;
      const percentage = total > 0 ? (revenue / total) * 100 : 0;
      const startAngle = cursor;
      const endAngle = total > 0 ? cursor + (percentage / 100) * 360 : cursor;
      const midAngle = startAngle + ((endAngle - startAngle) / 2);
      cursor = endAngle;

      return {
        key: `${label}-${index}`,
        label,
        revenue,
        previousRevenue,
        profit,
        loss,
        margin,
        percentage,
        color: yearlyPieColors[index % yearlyPieColors.length],
        startAngle,
        endAngle,
        midAngle,
        path: revenue > 0 ? describeSvgPieArc(70, 70, 52, startAngle, Math.min(endAngle, 359.99)) : '',
        labelPoint: getPiePoint(70, 70, 34, midAngle),
        tooltipPoint: getPiePoint(70, 70, 47, midAngle),
        leaderStartPoint: getPiePoint(70, 70, 54, revenue > 0 ? midAngle : labelSlot.dotAngle),
        leaderEndPoint: getPiePoint(70, 70, 63, labelSlot.dotAngle),
        outerLabelPoint: {
          x: labelSlot.x,
          y: labelSlot.y,
          anchor: labelSlot.anchor,
          valueOffset: labelSlot.valueOffset,
        },
      };
    });

    return {
      months,
      total,
      bestMonth: months.reduce((best, item) => (item.revenue > (best?.revenue || 0) ? item : best), null),
    };
  }, [period, chartDataCombined.revenueData]);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext('2d');

    const revenueGrad = ctx.createLinearGradient(0, 0, 0, 200);
    revenueGrad.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
    revenueGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

    const receivedGrad = ctx.createLinearGradient(0, 0, 0, 200);
    receivedGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
    receivedGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

    const upcomingGrad = ctx.createLinearGradient(0, 0, 0, 200);
    upcomingGrad.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
    upcomingGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: chartDataCombined.labels,
        datasets: [
          {
            label: 'Total Revenue',
            data: chartDataCombined.revenueData,
            borderColor: '#6366f1',
            borderWidth: 2.5,
            backgroundColor: revenueGrad,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5.5,
            pointHoverBorderWidth: 2.5,
            pointHoverBackgroundColor: '#6366f1',
            pointHoverBorderColor: '#ffffff',
          },
          {
            label: 'Verified Payment',
            data: chartDataCombined.receivedData,
            borderColor: '#10b981',
            borderWidth: 2.5,
            backgroundColor: receivedGrad,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5.5,
            pointHoverBorderWidth: 2.5,
            pointHoverBackgroundColor: '#10b981',
            pointHoverBorderColor: '#ffffff',
          },
          {
            label: 'Upcoming Month',
            data: chartDataCombined.upcomingData,
            borderColor: '#f97316',
            borderWidth: 2.5,
            backgroundColor: upcomingGrad,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5.5,
            pointHoverBorderWidth: 2.5,
            pointHoverBackgroundColor: '#f97316',
            pointHoverBorderColor: '#ffffff',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        layout: {
          padding: {
            top: 5,
            bottom: period === 'monthly' ? 12 : 5,
            left: 5,
            right: 15,
          }
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            titleFont: {
              size: 11,
              weight: 'bold',
            },
            bodyColor: '#e2e8f0',
            bodyFont: {
              size: 11,
            },
            padding: 10,
            cornerRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            callbacks: {
              title: (items) => {
                const label = items[0].label;
                if (period === 'yearly') {
                  return `Month: ${label} ${effectiveSelectedTaxYear || new Date().getFullYear()}`;
                } else if (period === 'monthly') {
                  const monthName = new Date(effectiveSelectedTaxMonth + '-01').toLocaleDateString('en-US', { month: 'short' });
                  const dayNum = parseInt(label, 10);
                  const monthStr = effectiveSelectedTaxMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                  const [yearNum, monthNum] = monthStr.split('-').map(Number);
                  const date = new Date(yearNum, monthNum - 1, dayNum);
                  let weekdayFull = '';
                  if (!isNaN(date.getTime())) {
                    weekdayFull = ` (${date.toLocaleDateString('en-US', { weekday: 'long' })})`;
                  }
                  return `Day: ${label} ${monthName} ${yearNum}${weekdayFull}`;
                }
                return `Date: ${label}`;
              },
              label: (context) => {
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y;
                return ` ${datasetLabel}: ₹${value.toLocaleString('en-IN')}`;
              },
              footer: (items) => {
                const rev = items[0].parsed.y;
                const rec = items[1] ? items[1].parsed.y : 0;
                if (rev > 0) {
                  const rate = ((rec / rev) * 100).toFixed(1);
                  return ` Collection Rate: ${rate}%`;
                }
                return null;
              }
            },
            footerColor: '#34d399',
            footerFont: {
              size: 10,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              color: 'rgba(148,163,184,0.15)',
              width: 1.5,
            },
            ticks: {
              font: {
                size: 9,
                weight: '600',
              },
              color: (context) => {
                const chart = context.chart;
                const x = chart.scales.x;
                if (!x || x.left === undefined || x.right === undefined) {
                  return '#94a3b8';
                }
                const ctx = chart.ctx;
                const gradient = ctx.createLinearGradient(x.left, 0, x.right, 0);
                gradient.addColorStop(0, '#38bdf8'); // Sky blue
                gradient.addColorStop(0.5, '#6366f1'); // Indigo
                gradient.addColorStop(1, '#ec4899'); // Pink
                return gradient;
              },
              callback: function (val) {
                const label = this.getLabelForValue(val);
                if (period === 'monthly' && typeof label === 'string' && /^\d+$/.test(label)) {
                  const dayNum = parseInt(label, 10);
                  const monthStr = effectiveSelectedTaxMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                  const [yearNum, monthNum] = monthStr.split('-').map(Number);
                  const date = new Date(yearNum, monthNum - 1, dayNum);
                  if (!isNaN(date.getTime())) {
                    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
                    return `${label} ${weekday}`;
                  }
                }
                return label;
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(148,163,184,0.12)',
              drawTicks: false,
              borderDash: [4, 4],
            },
            border: {
              display: false,
            },
            min: 0,
            ticks: {
              stepSize: 10000,
              font: (context) => {
                const val = context.tick ? context.tick.value : 0;
                if (val === 50000 || val === 100000) {
                  return { size: 10.5, weight: 'bold' };
                }
                if (val === 60000) {
                  return { size: 7.5 };
                }
                return { size: 9 };
              },
              color: (context) => {
                const val = context.tick ? context.tick.value : 0;
                if (val === 50000 || val === 100000) {
                  return '#64748b';
                }
                return '#94a3b8';
              },
              callback: (value) => formatCompactCurrency(value),
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartDataCombined, period, effectiveSelectedTaxMonth, effectiveSelectedTaxYear]);

  const [hoveredYearlyMonth, setHoveredYearlyMonth] = useState(null);
  const activeYearlyMonth = hoveredYearlyMonth;
  const summaryYearlyMonth = hoveredYearlyMonth || yearlyPieData.bestMonth;
  const summaryYearlyChange = summaryYearlyMonth?.previousRevenue > 0
    ? ((summaryYearlyMonth.revenue - summaryYearlyMonth.previousRevenue) / summaryYearlyMonth.previousRevenue) * 100
    : summaryYearlyMonth?.revenue > 0 ? 100 : 0;
  const visibleYearlyMonths = yearlyPieData.months.filter((item) => item.revenue > 0);
  const hoveredYearlyCallout = hoveredYearlyMonth ? (() => {
    const boxWidth = 58;
    const boxHeight = 42;
    const isRightSide = hoveredYearlyMonth.leaderEndPoint.x >= 70;
    const boxX = isRightSide ? 105 : -24;
    const boxY = Math.max(4, Math.min(94, hoveredYearlyMonth.leaderEndPoint.y - 21));
    const lineEndX = isRightSide ? boxX : boxX + boxWidth;
    const lineEndY = boxY + 10;
    const previousRevenue = Number(hoveredYearlyMonth.previousRevenue || 0);
    const thisRevenue = Number(hoveredYearlyMonth.revenue || 0);
    const revenueDelta = thisRevenue - previousRevenue;
    const profit = Math.max(revenueDelta, 0);
    const loss = Math.max(-revenueDelta, 0);
    const margin = previousRevenue > 0
      ? (revenueDelta / previousRevenue) * 100
      : thisRevenue > 0 ? 100 : 0;

    return {
      boxX,
      boxY,
      boxWidth,
      boxHeight,
      lineEndX,
      lineEndY,
      margin,
      rows: [
        ['Prev', formatCompactCurrency(previousRevenue)],
        ['This', formatCompactCurrency(thisRevenue)],
        ['Profit', formatCompactCurrency(profit)],
        ['Loss', formatCompactCurrency(loss)],
        ['Margin', `${formatOneDecimalPercent(margin)}%`],
      ],
    };
  })() : null;

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div
        style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, rgba(224, 242, 254, 0.45) 100%)" }}
        className="flex min-w-0 flex-col rounded-2xl border border-sky-100/80 p-3.5 select-none shadow-[0_10px_25px_rgba(186,230,253,0.12)] text-slate-800"
      >
        <div className="flex items-center justify-between mb-2.5 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider">
              {period === 'yearly' ? 'Monthly Trend' : 'Daily Trend (Days)'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9.5px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
              <span>Total Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span>Verified Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
              <span>Upcoming Month</span>
            </div>
          </div>
        </div>

        <div className="relative h-[220px] w-full sm:h-[235px] lg:h-[245px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px] rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-650" />
                <span className="text-[10px] font-semibold text-slate-400">Loading chart data...</span>
              </div>
            </div>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
      </div>

      <div
        style={{ background: "linear-gradient(135deg, #ffffff 0%, rgba(219, 234, 254, 0.55) 50%, rgba(238, 242, 255, 0.7) 100%)" }}
        className="flex min-w-0 flex-col rounded-2xl border border-blue-100/80 p-3.5 select-none shadow-[0_10px_25px_rgba(148,163,184,0.12)] text-slate-800"
      >
        <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-slate-450 uppercase tracking-wider mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
          <span>Sales Reports</span>
        </div>

        {period === 'yearly' ? (

          <>
            <div className="relative my-1.5 flex h-[245px] w-full items-center justify-center">
              {loading ? (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                </div>
              ) : yearlyPieData.total > 0 ? (
                <div className="relative h-full w-full max-w-[380px]">
                  <svg viewBox="-20 -6 190 158" className="h-full w-full overflow-visible drop-shadow-sm">
                    <defs>
                      <filter id="yearly-pie-shadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.16" />
                      </filter>
                    </defs>
                    <circle cx="70" cy="70" r="53" fill="#eef2ff" />
                    {visibleYearlyMonths.map((month) => {
                      const isActive = activeYearlyMonth?.key === month.key;
                      return (
                        <motion.path
                          key={month.key}
                          d={month.path}
                          fill={month.color}
                          stroke="#f8fafc"
                          strokeWidth="0.9"
                          filter={isActive ? 'url(#yearly-pie-shadow)' : undefined}
                          initial={{ opacity: 0.65, scale: 0.94 }}
                          animate={{ opacity: isActive ? 1 : 0.86, scale: isActive ? 1.06 : 1 }}
                          transition={{ duration: 0.18 }}
                          style={{ transformOrigin: '70px 70px', cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredYearlyMonth(month)}
                          onMouseLeave={() => setHoveredYearlyMonth(null)}
                        />
                      );
                    })}
                    {yearlyPieData.months.map((month) => {
                      const isActive = activeYearlyMonth?.key === month.key;
                      return (
                        <g
                          key={`${month.key}-outer-label`}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredYearlyMonth(month)}
                          onMouseLeave={() => setHoveredYearlyMonth(null)}
                        >
                          <line
                            x1={month.leaderStartPoint.x}
                            y1={month.leaderStartPoint.y}
                            x2={month.leaderEndPoint.x}
                            y2={month.leaderEndPoint.y}
                            stroke={month.revenue > 0 ? month.color : '#cbd5e1'}
                            strokeWidth={isActive ? 0.9 : 0.55}
                            strokeLinecap="round"
                            opacity={month.revenue > 0 ? 0.72 : 0.38}
                          />
                          <circle
                            cx={month.leaderEndPoint.x}
                            cy={month.leaderEndPoint.y}
                            r={isActive ? 1.6 : 1.15}
                            fill={month.revenue > 0 ? month.color : '#94a3b8'}
                            opacity={month.revenue > 0 ? 0.95 : 0.5}
                          />
                          <text
                            x={month.outerLabelPoint.x}
                            y={month.outerLabelPoint.y}
                            textAnchor={month.outerLabelPoint.anchor}
                            dominantBaseline="middle"
                            fill={isActive ? '#0f172a' : '#64748b'}
                            className="text-[6.4px] font-black"
                          >
                          {month.label}
                          </text>
                          <text
                            x={month.outerLabelPoint.x}
                            y={month.outerLabelPoint.y + month.outerLabelPoint.valueOffset}
                            textAnchor={month.outerLabelPoint.anchor}
                            dominantBaseline="middle"
                            fill={month.revenue > 0 ? month.color : '#94a3b8'}
                            className="text-[4.9px] font-extrabold"
                          >
                            {formatCompactCurrency(month.revenue)}
                          </text>
                        </g>
                      );
                    })}
                    {visibleYearlyMonths
                      .filter((month) => month.percentage >= 7)
                      .map((month) => (
                        <text
                          key={`${month.key}-label`}
                          x={month.labelPoint.x}
                          y={month.labelPoint.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="pointer-events-none fill-white text-[6px] font-black"
                        >
                          {Math.round(month.percentage)}%
                        </text>
                      ))}
                    {hoveredYearlyMonth && hoveredYearlyCallout && (
                      <g className="pointer-events-none">
                        <line
                          x1={hoveredYearlyMonth.leaderEndPoint.x}
                          y1={hoveredYearlyMonth.leaderEndPoint.y}
                          x2={hoveredYearlyCallout.lineEndX}
                          y2={hoveredYearlyCallout.lineEndY}
                          stroke="#020617"
                          strokeWidth="0.85"
                          strokeLinecap="round"
                        />
                        <circle
                          cx={hoveredYearlyMonth.leaderEndPoint.x}
                          cy={hoveredYearlyMonth.leaderEndPoint.y}
                          r="1.7"
                          fill="#020617"
                        />
                        <rect
                          x={hoveredYearlyCallout.boxX}
                          y={hoveredYearlyCallout.boxY}
                          width={hoveredYearlyCallout.boxWidth}
                          height={hoveredYearlyCallout.boxHeight}
                          rx="3.5"
                          fill="#020617"
                          filter="url(#yearly-pie-shadow)"
                        />
                        <text
                          x={hoveredYearlyCallout.boxX + 4}
                          y={hoveredYearlyCallout.boxY + 7}
                          fill="#ffffff"
                          fontSize="4.9"
                          fontWeight="900"
                        >
                          {hoveredYearlyMonth.label} {effectiveSelectedTaxYear || new Date().getFullYear()}
                        </text>
                        <text
                          x={hoveredYearlyCallout.boxX + hoveredYearlyCallout.boxWidth - 4}
                          y={hoveredYearlyCallout.boxY + 7}
                          fill="#ffffff"
                          fontSize="4.8"
                          fontWeight="900"
                          textAnchor="end"
                        >
                          {hoveredYearlyMonth.percentage.toFixed(1)}%
                        </text>
                        {hoveredYearlyCallout.rows.map(([label, value], rowIndex) => {
                          const isProfit = label === 'Profit';
                          const isLoss = label === 'Loss';
                          const isMargin = label === 'Margin';
                          return (
                            <g key={label}>
                              <text
                                x={hoveredYearlyCallout.boxX + 4}
                                y={hoveredYearlyCallout.boxY + 16 + (rowIndex * 4.8)}
                                fill="#cbd5e1"
                                fontSize="4.15"
                                fontWeight="800"
                              >
                                {label}
                              </text>
                              <text
                                x={hoveredYearlyCallout.boxX + hoveredYearlyCallout.boxWidth - 4}
                                y={hoveredYearlyCallout.boxY + 16 + (rowIndex * 4.8)}
                                fill={isMargin ? (hoveredYearlyCallout.margin >= 0 ? '#34d399' : '#fb7185') : isProfit ? '#34d399' : isLoss ? '#fb7185' : '#ffffff'}
                                fontSize="4.15"
                                fontWeight="900"
                                textAnchor="end"
                              >
                                {value}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </svg>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/45 text-center">
                  <span className="text-[11px] font-black text-slate-500">No yearly revenue</span>
                  <span className="text-[9px] font-semibold text-slate-400">Select another year to view month-wise split</span>
                </div>
              )}
            </div>

            <div className="mt-2 border-t border-slate-200/60 pt-3">
              <div className="flex items-center justify-between text-[9.5px] font-black text-slate-500">
                <span>Total Yearly Sales</span>
                <span className="font-mono text-slate-850">{formatCompactCurrency(yearlyPieData.total)}</span>
              </div>
              {summaryYearlyMonth && (
                <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>{hoveredYearlyMonth ? 'Hovered Month' : 'Best Month'}: <span className="text-slate-700">{summaryYearlyMonth.label}</span></span>
                  <span className={summaryYearlyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {summaryYearlyChange >= 0 ? '+' : ''}{formatOneDecimalPercent(summaryYearlyChange)}%
                  </span>
                </div>
              )}
            </div>

          </>

        ) : (
          <>
            <div className="relative my-3 flex w-full items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90 transform overflow-visible">
                <defs>
                  <filter id="donut-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodColor="#1e1b4b" floodOpacity="0.16" />
                  </filter>
                  <linearGradient id="past-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                  <linearGradient id="current-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="upcoming-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* Inactive backings/tracks for all active radii */}
                {totalSum > 0 ? (
                  <>
                    <circle cx="50" cy="50" r={donutData.rPast} stroke="rgba(148, 163, 184, 0.08)" strokeWidth="6.5" fill="transparent" />
                    <circle cx="50" cy="50" r={donutData.rCurrent} stroke="rgba(148, 163, 184, 0.08)" strokeWidth="8.5" fill="transparent" />
                    <circle cx="50" cy="50" r={donutData.rUpcoming} stroke="rgba(148, 163, 184, 0.08)" strokeWidth="5" fill="transparent" />
                  </>
                ) : (
                  <circle cx="50" cy="50" r={38} stroke="rgba(148, 163, 184, 0.12)" strokeWidth="7" fill="transparent" />
                )}

                {totalSum > 0 && (
                  <>
                    {pastTotal > 0 && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={donutData.rPast}
                        stroke="url(#past-gradient)"
                        strokeWidth={hoveredSegment === 'past' ? 9.5 : 6.5}
                        fill="transparent"
                        strokeDasharray={donutData.pastDashArray}
                        initial={{ strokeDashoffset: donutData.cPast }}
                        animate={{
                          strokeDashoffset: donutData.pastOffset,
                          strokeWidth: hoveredSegment === 'past' ? 9.5 : 6.5
                        }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        strokeLinecap="round"
                        filter="url(#donut-shadow)"
                        style={{ transformOrigin: 'center', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSegment('past')}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    )}
                    {currentTotal > 0 && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={donutData.rCurrent}
                        stroke="url(#current-gradient)"
                        strokeWidth={hoveredSegment === 'current' ? 11.5 : 8.5}
                        fill="transparent"
                        strokeDasharray={donutData.currentDashArray}
                        initial={{ strokeDashoffset: donutData.cCurrent }}
                        animate={{
                          strokeDashoffset: donutData.currentOffset,
                          strokeWidth: hoveredSegment === 'current' ? 11.5 : 8.5
                        }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        strokeLinecap="round"
                        filter="url(#donut-shadow)"
                        style={{ transformOrigin: 'center', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSegment('current')}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    )}
                    {upcomingTotal > 0 && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={donutData.rUpcoming}
                        stroke="url(#upcoming-gradient)"
                        strokeWidth={hoveredSegment === 'upcoming' ? 8 : 5}
                        fill="transparent"
                        strokeDasharray={donutData.upcomingDashArray}
                        initial={{ strokeDashoffset: donutData.cUpcoming }}
                        animate={{
                          strokeDashoffset: donutData.upcomingOffset,
                          strokeWidth: hoveredSegment === 'upcoming' ? 8 : 5
                        }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        strokeLinecap="round"
                        filter="url(#donut-shadow)"
                        style={{ transformOrigin: 'center', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSegment('upcoming')}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    )}
                  </>
                )}
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[13px] font-black tracking-tight text-slate-850 leading-none">{formatCompactCurrency(totalSum)}</span>
                <span className="mt-0.5 text-[6.5px] font-black uppercase tracking-widest text-slate-400">Total Amount</span>
              </div>
            </div>

            <div className="mt-4 flex w-full flex-col gap-1.5 border-t border-slate-200/60 pt-3">
              <div
                onMouseEnter={() => setHoveredSegment('past')}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex items-center justify-between text-[9px] font-bold p-1 rounded-lg transition-all duration-200 cursor-pointer ${hoveredSegment === 'past' ? 'bg-slate-100/70' : ''}`}
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.4)]" />
                  <span className={hoveredSegment === 'past' ? 'text-slate-850 font-black' : ''}>Past Month</span>
                </div>
                <span className={`font-extrabold text-slate-700 font-mono ${hoveredSegment === 'past' ? 'text-purple-650' : ''}`}>{formatCompactCurrency(pastTotal)}</span>
              </div>
              <div
                onMouseEnter={() => setHoveredSegment('current')}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex items-center justify-between text-[9px] font-bold p-1 rounded-lg transition-all duration-200 cursor-pointer ${hoveredSegment === 'current' ? 'bg-slate-100/70' : ''}`}
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_4px_rgba(14,165,233,0.4)]" />
                  <span className={hoveredSegment === 'current' ? 'text-slate-850 font-black' : ''}>Current Month</span>
                </div>
                <span className={`font-extrabold text-slate-700 font-mono ${hoveredSegment === 'current' ? 'text-sky-650' : ''}`}>{formatCompactCurrency(currentTotal)}</span>
              </div>
              <div
                onMouseEnter={() => setHoveredSegment('upcoming')}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex items-center justify-between text-[9px] font-bold p-1 rounded-lg transition-all duration-200 cursor-pointer ${hoveredSegment === 'upcoming' ? 'bg-slate-100/70' : ''}`}
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.4)]" />
                  <span className={hoveredSegment === 'upcoming' ? 'text-slate-850 font-black' : ''}>Upcoming Month</span>
                </div>
                <span className={`font-extrabold text-slate-700 font-mono ${hoveredSegment === 'upcoming' ? 'text-orange-600' : ''}`}>{formatCompactCurrency(upcomingTotal)}</span>
              </div>
            </div>

            <div className="mt-3 flex w-full items-center justify-center gap-1 border-t border-slate-200/60 pt-2.5 text-[9.5px] font-bold text-slate-450">
              <span className={`inline-flex items-center gap-0.5 font-black ${comparison.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comparison.percentage}% {comparison.isUp ? '▲' : '▼'}
              </span>
              <span>vs previous month</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Premium checklist component mimicking the ClickUp design
const RevenueChecklistTable = ({
  groups,
  effectiveSelectedTaxMonth,
  loading,
  selectedPastMonth,
  onSelectPastMonth,
  selectedUpcomingMonth,
  onSelectUpcomingMonth,
  pastMonthsList
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState({
    past: false,
    current: false,
    upcoming: false,
  });

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getMonthYearLabel = (monthStr) => {
    if (!monthStr) return '';
    const [yr, mn] = monthStr.split('-').map(Number);
    const date = new Date(yr, mn - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth.split('-').map(Number);
  const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const pastMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
  const upcomingMonthDate = new Date(selectedYear, selectedMonth, 1);

  const pastMonthStrDefault = `${pastMonthDate.getFullYear()}-${String(pastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const pastMonthStr = selectedPastMonth || pastMonthStrDefault;
  const currentMonthStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const upcomingMonthStrDefault = `${upcomingMonthDate.getFullYear()}-${String(upcomingMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const upcomingMonthStr = selectedUpcomingMonth || upcomingMonthStrDefault;

  const renderGroup = (key, title, list, colorClass, borderLeftColor) => {
    const isCollapsed = collapsedGroups[key];
    return (
      <div className="flex flex-col">
        {/* Group Header Accordion Control */}
        <div
          onClick={() => toggleGroup(key)}
          className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/75 border-y border-slate-150 cursor-pointer select-none transition-all duration-150"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform duration-200 transform ${isCollapsed ? '-rotate-90' : ''}`}
            />

            <span className={`text-[10px] font-black tracking-wider uppercase ${colorClass}`}>
              {title}
            </span>
            <span className="inline-flex items-center justify-center h-4.5 min-w-[20px] px-1 rounded-full text-[9.5px] font-extrabold bg-slate-200/85 text-slate-600 font-mono shadow-inner">
              {list.length}
            </span>
          </div>

          {/* Right side controls in the header */}
          <div className="flex items-center gap-2">
            {key === 'past' && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select Month:</span>
                <input
                  type="month"
                  value={pastMonthStr}
                  onChange={(e) => {
                    onSelectPastMonth(e.target.value);
                    if (collapsedGroups.past) {
                      setCollapsedGroups((prev) => ({ ...prev, past: false }));
                    }
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer outline-none transition focus:border-indigo-300"
                />
              </div>
            )}
            {key === 'upcoming' && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select Month:</span>
                <input
                  type="month"
                  value={upcomingMonthStr}
                  onChange={(e) => {
                    onSelectUpcomingMonth(e.target.value);
                    if (collapsedGroups.upcoming) {
                      setCollapsedGroups((prev) => ({ ...prev, upcoming: false }));
                    }
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer outline-none transition focus:border-orange-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Group Rows Container */}
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden bg-white"
              >
                {list.length === 0 ? (
                  <div className="px-6 py-5 text-center text-xs text-slate-455 font-semibold border-b border-slate-100 bg-slate-50/20">
                    No items in this month.
                  </div>
                ) : (
                  list.map((invoice, idx) => {
                    const destination = invoice.tripSnapshot?.destination || invoice.query?.destination || "Unknown Destination";
                    const preTravelPaidAmount = getInvoicePreTravelPaidAmount(invoice);
                    const isClientApprovedWithoutPayment = preTravelPaidAmount <= 0 && isClientApprovedChecklistRecord(invoice);
                    const statusLabel = isClientApprovedWithoutPayment ? 'Client Approved' : invoice.paymentStatus;

                    // Generate tags
                    const tags = [];
                    if (statusLabel) {
                      const isPaidState = statusLabel === 'Paid';
                      const isPartialState = statusLabel.includes('Partial');
                      tags.push({
                        label: isPaidState ? 'FULL PAID' : statusLabel.replace('_', ' '),
                        isFullPaid: isPaidState,
                        className: isPaidState
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isPartialState
                            ? 'bg-amber-50 text-amber-750 border border-amber-100'
                            : statusLabel === 'Unpaid'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                      });
                    }

                    return (
                      <motion.div
                        key={invoice._id || idx}
                        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.55)' }}
                        className="flex gap-4 px-4 py-3 border-b border-slate-100 items-center text-xs text-slate-700 select-none relative"
                      >
                        {/* Status border accent on the left of each row */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${borderLeftColor}`} />

                        {/* Query ID Column */}
                        <div className="w-[18%] pl-1 flex flex-col gap-0.5 min-w-0">
                          <span className="font-extrabold text-slate-900 truncate">
                            {invoice.query?.queryId || invoice.invoiceNumber || "Draft Query"}
                          </span>
                          <span className="text-[10px] text-slate-450 font-bold truncate">
                            {destination}
                          </span>
                        </div>

                        {/* Create Date Column */}
                        <div className="w-[13%] text-slate-600 font-medium truncate">
                          {formatShortDate(invoice.createdAt)}
                        </div>

                        {/* Travel Date Column */}
                        <div className="w-[13%] text-slate-600 font-medium truncate">
                          {formatShortDate(invoice.tripSnapshot?.startDate || getPrimaryTravelDate(invoice))}
                        </div>

                        {/* Payment Date Column */}
                        <div className="w-[13%] text-slate-600 font-medium truncate">
                          {formatShortDate(getInvoicePreTravelPaymentDate(invoice)) || '-'}
                        </div>

                        {/* Partially Paid Column */}
                        <div className="w-[13%] font-bold text-slate-800 font-mono">
                          {formatCompactCurrency(preTravelPaidAmount)}
                        </div>

                        {/* Status Column */}
                        <div className="w-[12%] flex justify-center items-center min-w-0">
                          {tags.slice(0, 1).map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md flex items-center gap-1 ${tag.className}`}
                            >
                              {tag.isFullPaid && <CheckCircle2 size={10} className="text-emerald-500 fill-emerald-50/50 shrink-0" />}
                              <span>{tag.label}</span>
                            </span>
                          ))}
                        </div>

                        {/* Total Amount Column */}
                        <div className="w-[18%] text-right pr-2 font-black text-slate-900 font-mono">
                          {formatCompactCurrency(getInvoiceTotalAmount(invoice))}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden select-none finance-transparent-scrollbar">
      {/* Table Headers */}
      <div className="flex gap-4 items-center px-4 py-3 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white border-b border-slate-200/85 text-[10px] font-extrabold uppercase text-slate-650 tracking-wider">
        <div className="w-[18%] pl-1">Query ID</div>
        <div className="w-[13%]">Create Date</div>
        <div className="w-[13%]">Travel Date</div>
        <div className="w-[13%]">Payment Date</div>
        <div className="w-[13%]">Partially Paid</div>
        <div className="w-[12%] text-center">Status</div>
        <div className="w-[18%] text-right pr-2">Total Amount</div>
      </div>

      {/* Accordions */}
      <div className="flex flex-col">
        {renderGroup('past', `Past Month (${getMonthYearLabel(pastMonthStr)})`, groups.past, 'text-purple-600', 'bg-purple-500')}
        {renderGroup('current', `Current Month (${getMonthYearLabel(currentMonthStr)})`, groups.current, 'text-sky-600', 'bg-sky-500')}
        {renderGroup('upcoming', `Upcoming Month (${getMonthYearLabel(upcomingMonthStr)})`, groups.upcoming, 'text-orange-500', 'bg-orange-500')}
      </div>
    </div>
  );
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
    inward: createEmptyMetric('Total Inward', 'Total amount from Agents', '#16a34a', '#f0fdf4', '#16a34a', 'positive'),
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
    tds: {
      total: '₹0',
      rateLabel: 'Tax deducted at source',
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

const createDefaultReports = () => ({
  query: {
    summaryCards: [],
    monthlyQueries: [],
    destinationWiseQueries: [],
    confirmationTrends: [],
  },
  revenue: {
    summaryCards: [],
    monthlyRevenue: [],
    monthlyBookings: [],
    destinationProfitability: [],
    travelDateRevenue: [],
    travelDateEntries: [],
  },
  monthly: {
    query: {
      summaryCards: [],
      monthlyQueries: [],
      destinationWiseQueries: [],
      confirmationTrends: [],
    },
    revenue: {
      summaryCards: [],
      monthlyRevenue: [],
      monthlyBookings: [],
      destinationProfitability: [],
      travelDateRevenue: [],
      travelDateEntries: [],
    },
  },
  yearly: {
    query: {
      summaryCards: [],
      monthlyQueries: [],
      destinationWiseQueries: [],
      confirmationTrends: [],
    },
    revenue: {
      summaryCards: [],
      monthlyRevenue: [],
      monthlyBookings: [],
      destinationProfitability: [],
      travelDateRevenue: [],
      travelDateEntries: [],
    },
  },
});

const defaultAnalytics = {
  generatedOn: '',
  monthly: createDefaultPeriodData(),
  yearly: createDefaultPeriodData(),
  reports: createDefaultReports(),
  participants: {
    agents: [],
    dmcs: [],
  },
  invoices: [],
  quotations: [],
  internalInvoices: [],
};

const getParticipantDisplayName = (participant = {}) =>
  participant.companyName || participant.name || participant.email || '';

const buildParticipantOption = (participant = {}, fallbackApproved = true) => {
  const value = getParticipantDisplayName(participant);
  const isApproved = participant.adminApproved ?? fallbackApproved;

  return {
    id: participant.id || participant._id || value,
    value,
    label: `${value}${isApproved ? '' : ' (Admin not approved)'}`,
    approved: Boolean(isApproved),
  };
};

const sortParticipantOptions = (options = []) =>
  options
    .filter((option) => option.value && option.value !== '-')
    .sort((left, right) => left.value.localeCompare(right.value));

const PeriodDropdownTab = ({
  active,
  label,
  selectedLabel,
  onToggleMenu,
}) => (
  <button
    type="button"
    onClick={onToggleMenu}
    className={`relative flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out cursor-pointer whitespace-nowrap z-10 shrink-0 ${active ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-800'
      }`}
  >
    {active && (
      <motion.div
        layoutId="activePeriodTab"
        className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-full shadow -z-10"
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )}
    <Calendar className="w-3.5 h-3.5 shrink-0" />
    <span>{active && selectedLabel ? selectedLabel : label}</span>
  </button>
);

const ExportButton = ({ icon, label, color, onClick, disabled, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-all duration-350 ease-out transform whitespace-nowrap shrink-0 ${disabled
      ? 'cursor-not-allowed opacity-50 shadow-none'
      : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
      } ${color}`}
  >
    {React.createElement(icon, { className: 'w-3.5 h-3.5 shrink-0' })}
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
  [summary?.gst?.total, summary?.tcs?.total, summary?.tds?.total || summary?.tdf?.total, summary?.summaryBar?.totalTaxCollected].some(
    (value) => Number(String(value || '').replace(/[^0-9.-]/g, '')) > 0,
  );

const formatTaxMonthValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatTaxYearValue = (date) => String(date.getFullYear());

const createReportWindow = (title, bodyMarkup) => {
  const reportWindow = window.open('', '_blank', 'width=1040,height=780');
  if (!reportWindow) return null;

  const reportMarkup = `
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
  `;

  reportWindow.document.open();
  reportWindow.document.write(reportMarkup);
  reportWindow.document.close();
  return reportWindow;
};

const cardStyles = {
  'Total Inward': {
    cardBg: 'from-emerald-50/90 via-white to-emerald-50/20',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
    accentColor: 'border-b-4 border-b-emerald-500',
    iconBg: 'bg-emerald-100/80 text-emerald-600',
    shadowColor: 'shadow-emerald-500/5',
    valueColor: 'text-emerald-600',
  },
  'Total Outward': {
    cardBg: 'from-rose-50/90 via-white to-rose-50/20',
    borderColor: 'border-rose-100 hover:border-rose-300',
    accentColor: 'border-b-4 border-b-rose-500',
    iconBg: 'bg-rose-100/80 text-rose-600',
    shadowColor: 'shadow-rose-500/5',
    valueColor: 'text-rose-600',
  },
  'Net Profit': {
    cardBg: 'from-blue-50/90 via-white to-blue-50/20',
    borderColor: 'border-blue-100 hover:border-blue-300',
    accentColor: 'border-b-4 border-b-blue-500',
    iconBg: 'bg-blue-100/80 text-blue-600',
    shadowColor: 'shadow-blue-500/5',
    valueColor: 'text-blue-600',
  },
  'Profit Margin': {
    cardBg: 'from-purple-50/90 via-white to-purple-50/20',
    borderColor: 'border-purple-100 hover:border-purple-300',
    accentColor: 'border-b-4 border-b-purple-500',
    iconBg: 'bg-purple-100/80 text-purple-600',
    shadowColor: 'shadow-purple-500/5',
    valueColor: 'text-purple-600',
  },
};

const MetricCard = ({ data, icon, loading }) => {
  const style = cardStyles[data.label] || {
    cardBg: 'from-slate-50/90 via-white to-slate-50/20',
    borderColor: 'border-slate-100 hover:border-slate-300',
    accentColor: 'border-b-4 border-b-slate-500',
    iconBg: 'bg-slate-100/80 text-slate-600',
    shadowColor: 'shadow-slate-500/5',
    valueColor: 'text-slate-850',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`bg-gradient-to-br ${style.cardBg} border ${style.borderColor} ${style.accentColor} rounded-2xl p-4 shadow-sm hover:shadow-md ${style.shadowColor} flex justify-between items-start hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out group`}
    >
      <div>
        <p className="text-sm font-bold text-slate-800">{data.label}</p>
        <p className="text-xs text-slate-400 mb-3">{data.sub}</p>
        <p className={`text-2xl font-extrabold tracking-tight ${style.valueColor}`}>
          {loading ? '...' : data.val}
        </p>
        <p className={`text-xs font-semibold mt-2 ${data.changeTone === 'negative' ? 'text-rose-600' : 'text-emerald-600'}`}>
          {data.up ? '↑' : '↓'} {loading ? 'Loading...' : data.change}
        </p>
      </div>
      <div className={`p-2 rounded-lg ${style.iconBg} group-hover:scale-110 transition-transform duration-300 ease-out shadow-inner`}>
        {React.createElement(icon, { className: 'w-5 h-5' })}
      </div>
    </motion.div>
  );
};

const AnimatedChart = ({ chartData, onPointClick }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const scriptLoaded = useRef(false);
  const buildChartRef = useRef(() => { });

  const buildChart = useCallback(() => { // Clean build chart memoization helper
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
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && onPointClick) {
            const clickY = event.y;
            let nearestElement = elements[0];
            let minDist = Infinity;
            elements.forEach(el => {
              const meta = chartRef.current.getDatasetMeta(el.datasetIndex);
              const view = meta.data[el.index];
              if (view) {
                const dist = Math.abs(view.y - clickY);
                if (dist < minDist) {
                  minDist = dist;
                  nearestElement = el;
                }
              }
            });
            onPointClick(chartData.labels[nearestElement.index], nearestElement.datasetIndex);
          }
        },
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
  }, [chartData, onPointClick]);

  useEffect(() => {
    buildChartRef.current = buildChart;
  }, [buildChart]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Chart && !scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = () => buildChartRef.current();
      document.head.appendChild(script);
    }

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
  }, [buildChart]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 260 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

const TaxCard = ({
  title,
  subtitle,
  total,
  totalColor = 'from-blue-600 to-indigo-600',
  gradientClass = 'from-blue-50/60 via-white to-blue-50/10',
  borderClass = 'border-blue-100/70 hover:border-blue-300/80 hover:shadow-blue-500/5',
  icon = DollarSign,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-500',
  rateLabel,
  status,
  breakdown,
  loading
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ type: "spring", stiffness: 350, damping: 25 }}
    className={`bg-gradient-to-br ${gradientClass} border ${borderClass} rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group cursor-default`}
  >
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">{subtitle}</span>
          <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{title}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
          {React.createElement(icon, { className: `w-4 h-4 ${iconColor}` })}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-medium text-slate-400 block">{rateLabel}</span>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`text-2xl font-black tracking-tight bg-gradient-to-r ${totalColor} bg-clip-text text-transparent`}>
            {loading ? '...' : total}
          </p>
          <span className="inline-flex items-center bg-emerald-50/90 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 shadow-sm">
            {loading ? 'Loading' : status}
          </span>
        </div>
      </div>
    </div>

    <div className="border-t border-slate-100/90 pt-4 mt-5 space-y-2">
      {breakdown.map((item) => (
        <div key={item.label} className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">{item.label}</span>
          <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/50">{loading ? '...' : item.value}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const formatPlainNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatOneDecimalPercent = (value) =>
  Number(value || 0).toFixed(1).replace(/\.0$/, '');

const summaryCardIcons = {
  'MONTHLY QUERIES': FileText,
  'CONFIRMED QUERIES': CheckCircle2,
  'CANCELLED QUERIES': AlertCircle,
  'CONVERSION %': Percent,
  'MONTHLY REVENUE': IndianRupee,
  'MONTHLY BOOKINGS': TrendingUp,
  'VERIFIED PAYMENT REVENUE': CheckCircle2,
  'PENDING REVENUE': AlertCircle,
  'CONFIRMED BOOKINGS': CheckCircle2
};

const summaryCardStyles = {
  'MONTHLY QUERIES': {
    bg: 'from-blue-50/70 via-white to-blue-50/15',
    border: 'border-blue-100 hover:border-blue-300',
    accent: 'border-b-4 border-b-blue-500',
    valColor: 'text-blue-700',
    shadow: 'shadow-blue-500/5'
  },
  'CONFIRMED QUERIES': {
    bg: 'from-emerald-50/70 via-white to-emerald-50/15',
    border: 'border-emerald-100 hover:border-emerald-300',
    accent: 'border-b-4 border-b-emerald-500',
    valColor: 'text-emerald-700',
    shadow: 'shadow-emerald-500/5'
  },
  'CANCELLED QUERIES': {
    bg: 'from-rose-50/70 via-white to-rose-50/15',
    border: 'border-rose-100 hover:border-rose-300',
    accent: 'border-b-4 border-b-rose-500',
    valColor: 'text-rose-700',
    shadow: 'shadow-rose-500/5'
  },
  'CONVERSION %': {
    bg: 'from-violet-50/70 via-white to-violet-50/15',
    border: 'border-violet-100 hover:border-violet-300',
    accent: 'border-b-4 border-b-violet-500',
    valColor: 'text-violet-700',
    shadow: 'shadow-violet-500/5'
  },
  'MONTHLY REVENUE': {
    bg: 'from-indigo-50/70 via-white to-indigo-50/15',
    border: 'border-indigo-100 hover:border-indigo-300',
    accent: 'border-b-4 border-b-indigo-500',
    valColor: 'text-indigo-700',
    shadow: 'shadow-indigo-500/5'
  },
  'MONTHLY BOOKINGS': {
    bg: 'from-sky-50/70 via-white to-sky-50/15',
    border: 'border-sky-100 hover:border-sky-300',
    accent: 'border-b-4 border-b-sky-500',
    valColor: 'text-sky-700',
    shadow: 'shadow-sky-500/5'
  },
  'VERIFIED PAYMENT REVENUE': {
    bg: 'from-amber-50/70 via-white to-amber-50/15',
    border: 'border-amber-100 hover:border-amber-300',
    accent: 'border-b-4 border-b-amber-500',
    valColor: 'text-amber-700',
    shadow: 'shadow-amber-500/5'
  },
  'PENDING REVENUE': {
    bg: 'from-orange-50/75 via-white to-amber-50/20',
    border: 'border-orange-100 hover:border-orange-300',
    accent: 'border-b-4 border-b-orange-500',
    valColor: 'text-orange-700',
    shadow: 'shadow-orange-500/5'
  },
  'CONFIRMED BOOKINGS': {
    bg: 'from-teal-50/70 via-white to-teal-50/15',
    border: 'border-teal-100 hover:border-teal-300',
    accent: 'border-b-4 border-b-teal-500',
    valColor: 'text-teal-700',
    shadow: 'shadow-teal-500/5'
  }
};

const defaultSummaryStyle = {
  bg: 'from-slate-50/70 via-white to-slate-50/15',
  border: 'border-slate-100 hover:border-slate-300',
  accent: 'border-b-4 border-b-slate-400',
  valColor: 'text-slate-800',
  shadow: 'shadow-slate-500/5'
};

const ReportSummaryCard = ({ item, loading }) => {
  const labelUpper = (item.styleKey || item.label || '').toUpperCase();
  const style = summaryCardStyles[labelUpper] || defaultSummaryStyle;
  const IconComponent = summaryCardIcons[labelUpper] || FileText;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.003, boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.05), 0 6px 8px -8px rgba(0, 0, 0, 0.05)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`bg-gradient-to-br ${style.bg} border ${style.border} ${style.accent} rounded-xl p-3 sm:p-3.5 shadow-sm ${style.shadow} flex h-[108px] flex-col justify-between cursor-default group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start gap-1.5 select-none">
        <p className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors leading-tight truncate">
          {item.label}
        </p>
        <span className="text-slate-400 group-hover:text-indigo-600 group-hover:rotate-12 transition-all duration-300 transform shrink-0">
          <IconComponent size={13} />
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline">
        <p className={`text-lg sm:text-xl font-black ${style.valColor} tracking-tight leading-none`}>
          {loading ? '...' : item.value}
        </p>
      </div>
      <div className="mt-0.5 overflow-hidden">
        <p className="text-[8.5px] sm:text-[9px] font-semibold text-slate-400 leading-tight">
          {loading ? 'Loading...' : item.sub}
        </p>
      </div>
    </motion.div>
  );
};

const shineStyle = `
@keyframes shine-slide {
  0% { transform: translateX(-100%); }
  60% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
.shine-effect {
  position: relative;
  overflow: hidden;
}
.shine-effect::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-100%);
  animation: shine-slide 3s infinite ease-in-out;
}
`;

const ReportBars = ({ rows = [], valueKey, labelKey = 'label', loading }) => {
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (label) => {
    setExpandedRows((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div className="space-y-2.5">
      <style dangerouslySetInnerHTML={{ __html: shineStyle }} />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          {loading ? 'Loading report...' : 'No report data available'}
        </div>
      ) : (
        rows.map((row, index) => {
          const value = Number(row[valueKey] || 0);
          const isRevenue = valueKey === 'revenue';
          const receivedPayment = Number(row.receivedPayment || 0);
          const fillWidth = isRevenue
            ? (value > 0 ? Math.min(100, Math.max(receivedPayment > 0 ? 4 : 0, (receivedPayment / value) * 100)) : 0)
            : Math.max(4, Math.round((value / maxValue) * 100));

          const compactRevenueValue = formatCompactCurrency(receivedPayment || value);
          const tooltipValue = isRevenue
            ? formatCompactCurrency(receivedPayment)
            : `${formatPlainNumber(value)}`;
          const rightBadgeValue = isRevenue
            ? formatCompactCurrency(value)
            : `${formatPlainNumber(value)}`;
          const displayValue = formatPlainNumber(value);

          let comparisonText = '';
          let comparisonColor = 'text-slate-400';

          if (index > 0) {
            const prevValue = Number(rows[index - 1][valueKey] || 0);
            const diff = Math.abs(value - prevValue);
            const formattedDiff = valueKey === 'revenue' ? formatCompactCurrency(diff) : diff;

            if (value > prevValue) {
              comparisonText = `+${formattedDiff} MoM`;
              comparisonColor = 'text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 shadow-sm';
            } else if (value < prevValue) {
              comparisonText = `-${formattedDiff} MoM`;
              comparisonColor = 'text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 shadow-sm';
            } else {
              comparisonText = 'Flat';
              comparisonColor = 'text-[10px] font-extrabold text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 shadow-sm';
            }
          }

          const hasDestinations = row.destinations && row.destinations.length > 0;

          return (
            <div
              key={row[labelKey]}
              className={`border border-slate-100 rounded-2xl bg-gradient-to-r from-slate-50/40 via-white to-slate-50/10 p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-2 group relative ${hasDestinations ? 'cursor-pointer' : 'cursor-default'
                } ${expandedRows[row[labelKey]] ? 'z-30' : 'z-10'}`}
              onClick={() => {
                if (hasDestinations) {
                  toggleExpand(row[labelKey]);
                }
              }}
            >
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">{row[labelKey]}</span>
                  {comparisonText && (
                    <span className={comparisonColor}>{comparisonText}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!isRevenue && (
                    <span className="font-black text-slate-800">
                      {loading ? '...' : displayValue}
                    </span>
                  )}
                  {!loading && hasDestinations && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(row[labelKey]);
                      }}
                      className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all cursor-pointer"
                    >
                      <ChevronDown
                        size={14}
                        className={`transform transition-transform duration-200 ${expandedRows[row[labelKey]] ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  )}
                </div>
              </div>
              {/* Progress Line and Badges/Tooltips */}
              <div className={`relative flex items-center w-full ${isRevenue ? 'pr-[72px]' : 'pr-[50px]'} mt-6 mb-2.5`}>
                {/* Tooltip Popup */}
                <motion.div
                  className="absolute bottom-full mb-3 -translate-x-1/2 bg-slate-900/95 border border-slate-700/50 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.75 rounded-md shadow-[0_4px_12px_rgba(15,23,42,0.15)] flex flex-col items-center z-20 pointer-events-none font-mono whitespace-nowrap"
                  initial={{ left: 0, opacity: 0, scale: 0.8 }}
                  animate={{ left: `${fillWidth}%`, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.85, ease: 'easeOut', delay: index * 0.04 }}
                >
                  <span>{tooltipValue}</span>
                  {/* Tooltip triangle indicator pointing down */}
                  <div className="w-1.5 h-1.5 bg-slate-900/95 border-r border-b border-slate-700/50 rotate-45 absolute -bottom-[3.5px] left-1/2 -translate-x-1/2" />
                </motion.div>

                <div className={`w-full overflow-hidden rounded-full shadow-inner relative p-[0.5px] flex items-center h-2 ${isRevenue ? 'bg-rose-500/10 border border-rose-100/50' : 'bg-blue-500/10 border border-blue-100/50'
                  }`}>
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${fillWidth}%` }}
                    transition={{ duration: 0.85, ease: 'easeOut', delay: index * 0.04 }}
                  />
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-200 px-2 py-0.75 shadow-sm z-10 font-mono">
                  {rightBadgeValue}
                </div>
              </div>
              {isRevenue && (
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
                  <span>Received {formatCompactCurrency(receivedPayment)}</span>
                  <span>Total {formatCompactCurrency(value)}</span>
                </div>
              )}

              <AnimatePresence>
                {expandedRows[row[labelKey]] && hasDestinations && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full mt-2 z-40 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-left">
                      Query Destinations
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {row.destinations.map((dest) => (
                        <div
                          key={dest.name}
                          className="flex justify-between items-center bg-slate-50/70 hover:bg-slate-100/50 rounded-xl px-3 py-1.5 border border-slate-100/60 transition-colors"
                        >
                          <span className="font-bold text-slate-700">{dest.name}</span>
                          <span className="font-black text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-lg text-[10px]">
                            {dest.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
};

const ReportTable = ({ columns = [], rows = [], loading }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
    <div className="overflow-x-auto finance-transparent-scrollbar">
      <table className="min-w-full divide-y divide-slate-150 text-xs">
        <thead className="bg-gradient-to-r from-slate-50 via-slate-50/50 to-white">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 font-extrabold uppercase tracking-wider text-slate-600 text-[10px] border-b border-slate-200/60 whitespace-nowrap`}
                style={{ textAlign: column.align || 'left' }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
                {loading ? 'Loading report...' : 'No report data available'}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={`${row.destination || row.label || rowIndex}-${rowIndex}`}
                className="hover:bg-gradient-to-r hover:from-blue-50/20 hover:to-transparent transition-all duration-150"
              >
                {columns.map((column) => {
                  const val = row[column.key];

                  // Add some highlight styles to specific columns like Conversion or Margin
                  let textClass = 'text-slate-700 font-semibold';
                  if (column.align === 'right') {
                    textClass = 'text-slate-800 font-bold font-mono';
                  } else if (column.align === 'center') {
                    textClass = 'text-slate-800 font-bold font-mono';
                  }

                  // Let's color-code non-zero values beautifully
                  const isMarginOrConversion = column.key === 'conversionPercent' || column.key === 'marginPercent';
                  const numericVal = Number(val || 0);

                  if (isMarginOrConversion) {
                    if (numericVal > 50) {
                      textClass = 'text-emerald-600 font-black';
                    } else if (numericVal > 0) {
                      textClass = 'text-blue-600 font-black';
                    } else {
                      textClass = 'text-slate-400 font-medium';
                    }
                  }

                  return (
                    <td
                      key={column.key}
                      className={`px-4 py-3 align-middle whitespace-nowrap ${textClass}`}
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {loading ? (
                        <span className="text-slate-300">...</span>
                      ) : column.render ? (
                        column.render(row)
                      ) : (
                        row[column.key]
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const AdvancedAnalytics = () => {
  const [period, setPeriod] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeExport, setActiveExport] = useState('');
  const [selectedTaxMonth, setSelectedTaxMonth] = useState('');
  const [selectedTaxYear, setSelectedTaxYear] = useState('');
  const [selectedTaxDate, setSelectedTaxDate] = useState('');
  const [destinationPage, setDestinationPage] = useState(1);
  const [profitabilityPage, setProfitabilityPage] = useState(1);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [pickerYearStart, setPickerYearStart] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Math.floor(currentYear / 12) * 12;
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showRevenueChecklist, setShowRevenueChecklist] = useState(false);
  const [selectedPastMonthOverride, setSelectedPastMonthOverride] = useState('');
  const [selectedUpcomingMonthOverride, setSelectedUpcomingMonthOverride] = useState('');
  const [statsModalMonth, setStatsModalMonth] = useState('');
  const [statsModalMode, setStatsModalMode] = useState('agent');
  const [statsSelectedQueries, setStatsSelectedQueries] = useState([]);
  const [statsSelectedAgent, setStatsSelectedAgent] = useState('all');
  const [statsSelectedDmc, setStatsSelectedDmc] = useState('all');

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMonthMenuOpen(false);
        setYearMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Custom global date range state variables
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customRangeError, setCustomRangeError] = useState('');
  const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });

  const defaultTaxMonthValue = useMemo(() => {
    const generatedDate = analyticsData?.generatedOn ? new Date(analyticsData.generatedOn) : new Date();
    return formatTaxMonthValue(generatedDate);
  }, [analyticsData?.generatedOn]);

  const defaultTaxYearValue = useMemo(() => {
    const generatedDate = analyticsData?.generatedOn ? new Date(analyticsData.generatedOn) : new Date();
    return formatTaxYearValue(generatedDate);
  }, [analyticsData?.generatedOn]);

  const effectiveSelectedTaxMonth = selectedTaxMonth || defaultTaxMonthValue;
  const effectiveSelectedTaxYear = selectedTaxYear || defaultTaxYearValue;

  useEffect(() => {
    setSelectedPastMonthOverride('');
    setSelectedUpcomingMonthOverride('');
  }, [effectiveSelectedTaxMonth]);

  const checklistData = useMemo(() => {
    const invoices = Array.isArray(analyticsData.invoices) ? analyticsData.invoices : [];
    const invoiceQueryKeys = invoices.reduce((set, invoice) => {
      const key = getChecklistQueryKey(invoice);
      if (key) set.add(key);
      return set;
    }, new Set());
    const quotations = Array.isArray(analyticsData.quotations) ? analyticsData.quotations : [];
    const checklistRows = [
      ...invoices,
      ...quotations
        .filter((quotation) => {
          const key = getChecklistQueryKey(quotation);
          return !key || !invoiceQueryKeys.has(key);
        })
        .map(normalizeQuotationChecklistRow),
    ];

    const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth.split('-').map(Number);
    const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
    const currentMonthEndDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    const pastMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
    const upcomingMonthDate = new Date(selectedYear, selectedMonth, 1);

    const pastMonthStrDefault = `${pastMonthDate.getFullYear()}-${String(pastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const pastMonthStr = selectedPastMonthOverride || pastMonthStrDefault;

    const currentMonthStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const upcomingMonthStrDefault = `${upcomingMonthDate.getFullYear()}-${String(upcomingMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const upcomingMonthStr = selectedUpcomingMonthOverride || upcomingMonthStrDefault;

    const groups = {
      past: [],
      current: [],
      upcoming: []
    };

    checklistRows.forEach((invoice) => {
      const travelDate = parseInvoiceTravelDate(invoice);
      const createDate = parseInvoiceCreateDate(invoice);
      if (!travelDate || !createDate) return;

      const createYrMn = formatYearMonthFromDate(createDate);
      const travelYrMn = formatYearMonthFromDate(travelDate);
      const preTravelPaidAmount = getInvoicePreTravelPaidAmount(invoice);

      if (travelYrMn === currentMonthStr) {
        if (preTravelPaidAmount <= 0 && !isClientApprovedChecklistRecord(invoice)) return;

        if (createYrMn === pastMonthStr) {
          groups.past.push(invoice);
        } else if (createYrMn === currentMonthStr) {
          groups.current.push(invoice);
        }
      } else if (
        createYrMn === currentMonthStr &&
        travelYrMn === upcomingMonthStr &&
        preTravelPaidAmount > 0
      ) {
        groups.upcoming.push(invoice);
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((left, right) => {
        const leftDate = key === 'upcoming'
          ? parseInvoiceTravelDate(left)?.getTime() || 0
          : parseInvoiceCreateDate(left)?.getTime() || 0;
        const rightDate = key === 'upcoming'
          ? parseInvoiceTravelDate(right)?.getTime() || 0
          : parseInvoiceCreateDate(right)?.getTime() || 0;
        return leftDate - rightDate;
      });
    });

    return groups;
  }, [analyticsData.invoices, analyticsData.quotations, effectiveSelectedTaxMonth, selectedPastMonthOverride, selectedUpcomingMonthOverride]);

  const pastMonthsList = useMemo(() => {
    const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth.split('-').map(Number);
    const list = [];
    for (let i = 2; i <= 6; i++) {
      const date = new Date(selectedYear, selectedMonth - i, 1);
      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      list.push({ val, label });
    }
    return list;
  }, [effectiveSelectedTaxMonth]);

  useEffect(() => {
    if (yearMenuOpen) {
      const selectedYear = Number(effectiveSelectedTaxYear) || new Date().getFullYear();
      const startDecade = Math.floor(selectedYear / 12) * 12;
      setPickerYearStart(startDecade);
    }
  }, [yearMenuOpen, effectiveSelectedTaxYear]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {};
        if (period === 'custom' && appliedCustomRange.start && appliedCustomRange.end) {
          params.startDate = appliedCustomRange.start;
          params.endDate = appliedCustomRange.end;
        } else if (period === 'monthly') {
          if (selectedTaxDate) {
            params.startDate = selectedTaxDate;
            params.endDate = selectedTaxDate;
          } else if (effectiveSelectedTaxMonth) {
            const [yr, mn] = effectiveSelectedTaxMonth.split('-');
            params.startDate = `${yr}-${mn}-01`;
            const lastDay = new Date(Number(yr), Number(mn), 0).getDate();
            params.endDate = `${yr}-${mn}-${String(lastDay).padStart(2, '0')}`;
          }
        } else if (period === 'yearly' && effectiveSelectedTaxYear) {
          params.startDate = `${effectiveSelectedTaxYear}-01-01`;
          params.endDate = `${effectiveSelectedTaxYear}-12-31`;
        }

        const { data } = await API.get('/admin/advanced-analytics', { params });
        setAnalyticsData(data?.data || defaultAnalytics);
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError?.response?.data?.message || 'Failed to load advanced analytics');
        setAnalyticsData(defaultAnalytics);
      } finally {
        setLoading(false);
      }
    };

    if (period === 'custom' && (!appliedCustomRange.start || !appliedCustomRange.end)) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [period, appliedCustomRange, effectiveSelectedTaxMonth, effectiveSelectedTaxYear, selectedTaxDate]);

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      setCustomRangeError("Start date and End date dono select karo.");
      return;
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      setCustomRangeError("Start date End date se badi nahi ho sakti.");
      return;
    }

    setCustomRangeError("");
    setAppliedCustomRange({ start: customStartDate, end: customEndDate });
  };

  const handleChartPointClick = useCallback((monthLabel, datasetIndex) => {
    setStatsModalMonth(monthLabel);
    setStatsModalMode(datasetIndex === 0 ? 'agent' : 'dmc');
    setStatsSelectedQueries([]);
    setStatsSelectedAgent('all');
    setStatsSelectedDmc('all');
    setShowStatsModal(true);
  }, []);

  const getYearMonthFromLabel = useCallback((monthLabel) => {
    const yearStr = effectiveSelectedTaxMonth ? effectiveSelectedTaxMonth.split('-')[0] : String(new Date().getFullYear());
    const monthIndex = MONTH_SEQUENCE.findIndex(m => m.toLowerCase() === monthLabel.toLowerCase());
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    return `${yearStr}-${monthStr}`;
  }, [effectiveSelectedTaxMonth]);

  const getDaysInMonth = useCallback((monthLabel) => {
    const year = effectiveSelectedTaxMonth ? Number(effectiveSelectedTaxMonth.split('-')[0]) : new Date().getFullYear();
    const monthIndex = MONTH_SEQUENCE.findIndex(m => m.toLowerCase() === monthLabel.toLowerCase());
    return new Date(year, monthIndex + 1, 0).getDate();
  }, [effectiveSelectedTaxMonth]);

  const isStatsYearlyView = period === 'yearly';
  const statsModalYear = useMemo(() => {
    if (isStatsYearlyView) {
      return String(Number(statsModalMonth) || Number(effectiveSelectedTaxYear) || new Date().getFullYear());
    }
    return effectiveSelectedTaxMonth ? effectiveSelectedTaxMonth.split('-')[0] : String(new Date().getFullYear());
  }, [isStatsYearlyView, statsModalMonth, effectiveSelectedTaxYear, effectiveSelectedTaxMonth]);

  const statsModalPeriodLabel = isStatsYearlyView
    ? statsModalYear
    : `${statsModalMonth}${statsModalYear ? ` ${statsModalYear}` : ''}`.trim();

  const statsPaymentYearMonth = useMemo(
    () => (!isStatsYearlyView && statsModalMonth ? getYearMonthFromLabel(statsModalMonth) : ''),
    [isStatsYearlyView, statsModalMonth, getYearMonthFromLabel]
  );

  const statsInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.invoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.invoices.filter((invoice) =>
        hasAgentPaymentInYear(invoice, statsModalYear)
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.invoices.filter((invoice) =>
      hasAgentPaymentInMonth(invoice, targetYearMonth)
    );
  }, [statsModalMonth, analyticsData.invoices, isStatsYearlyView, statsModalYear, getYearMonthFromLabel]);

  const statsInternalInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.internalInvoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.internalInvoices.filter((invoice) =>
        hasDmcPaymentInYear(invoice, statsModalYear)
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.internalInvoices.filter((invoice) =>
      hasDmcPaymentInMonth(invoice, targetYearMonth)
    );
  }, [statsModalMonth, analyticsData.internalInvoices, isStatsYearlyView, statsModalYear, getYearMonthFromLabel]);

  const statsTravelInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.invoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.invoices.filter((invoice) =>
        hasTravelInYear(invoice, statsModalYear)
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.invoices.filter((invoice) =>
      hasTravelInMonth(invoice, targetYearMonth)
    );
  }, [statsModalMonth, analyticsData.invoices, isStatsYearlyView, statsModalYear, getYearMonthFromLabel]);

  const statsTravelInternalInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.internalInvoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.internalInvoices.filter((invoice) =>
        hasTravelInYear(invoice, statsModalYear)
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.internalInvoices.filter((invoice) =>
      hasTravelInMonth(invoice, targetYearMonth)
    );
  }, [statsModalMonth, analyticsData.internalInvoices, isStatsYearlyView, statsModalYear, getYearMonthFromLabel]);

  const availableAgents = useMemo(() => {
    const participants = analyticsData.participants?.agents || [];
    if (participants.length > 0) {
      return sortParticipantOptions(
        participants.map((participant) => buildParticipantOption(participant, true))
      );
    }

    const agentsSet = new Set();
    (analyticsData.invoices || []).forEach((invoice) => {
      const agentName = invoice.agent?.companyName || invoice.agent?.name || invoice.agentName;
      if (agentName && agentName !== "-") {
        agentsSet.add(agentName);
      }
    });
    return sortParticipantOptions(
      Array.from(agentsSet).map((agentName) => buildParticipantOption({ name: agentName }, true))
    );
  }, [analyticsData.invoices, analyticsData.participants?.agents]);

  const availableDmcs = useMemo(() => {
    const participants = analyticsData.participants?.dmcs || [];
    if (participants.length > 0) {
      return sortParticipantOptions(
        participants.map((participant) => buildParticipantOption(participant, true))
      );
    }

    const dmcsSet = new Set();
    (analyticsData.internalInvoices || []).forEach((invoice) => {
      const dmcName = invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName;
      if (dmcName && dmcName !== "-") {
        dmcsSet.add(dmcName);
      }
    });
    return sortParticipantOptions(
      Array.from(dmcsSet).map((dmcName) => buildParticipantOption({ name: dmcName }, true))
    );
  }, [analyticsData.internalInvoices, analyticsData.participants?.dmcs]);

  useEffect(() => {
    if (statsSelectedAgent !== 'all' && !availableAgents.some((agent) => agent.value === statsSelectedAgent)) {
      setStatsSelectedAgent('all');
      setStatsSelectedQueries([]);
    }
  }, [availableAgents, statsSelectedAgent]);

  useEffect(() => {
    if (statsSelectedDmc !== 'all' && !availableDmcs.some((dmc) => dmc.value === statsSelectedDmc)) {
      setStatsSelectedDmc('all');
      setStatsSelectedQueries([]);
    }
  }, [availableDmcs, statsSelectedDmc]);

  const filteredStatsInvoices = useMemo(() => {
    if (statsModalMode === 'agent') {
      if (statsSelectedAgent === 'all') return statsInvoices;
      return statsInvoices.filter((invoice) => {
        const agentName = invoice.agent?.companyName || invoice.agent?.name || invoice.agentName;
        return agentName === statsSelectedAgent;
      });
    } else {
      if (statsSelectedDmc === 'all') return statsInvoices;
      const dmcInvoices = statsInternalInvoices.filter((inv) => {
        const dmcName = inv.dmc?.companyName || inv.dmc?.name || inv.dmcName;
        return dmcName === statsSelectedDmc;
      });
      const dmcQueryIds = new Set();
      dmcInvoices.forEach((inv) => {
        const qId = inv.query?.queryId || inv.queryCode || inv._id;
        if (qId) dmcQueryIds.add(qId);
        (inv.coveredQueries || []).forEach((q) => {
          const coveredQId = q.query?.queryId || q.queryCode || q.query || String(q.query);
          if (coveredQId) dmcQueryIds.add(coveredQId);
        });
      });
      return statsInvoices.filter((invoice) => {
        const qId = invoice.query?.queryId || invoice._id;
        return dmcQueryIds.has(qId);
      });
    }
  }, [statsModalMode, statsSelectedAgent, statsSelectedDmc, statsInvoices, statsInternalInvoices]);

  const filteredStatsInternalInvoices = useMemo(() => {
    if (statsModalMode === 'agent') {
      if (statsSelectedAgent === 'all') return statsInternalInvoices;
      const agentInvoices = statsInvoices.filter((invoice) => {
        const agentName = invoice.agent?.companyName || invoice.agent?.name || invoice.agentName;
        return agentName === statsSelectedAgent;
      });
      const agentQueryIds = new Set(agentInvoices.map((inv) => inv.query?.queryId || inv._id));
      return statsInternalInvoices.filter((inv) => {
        const isSingleMatch = agentQueryIds.has(inv.query?.queryId || inv.queryCode || inv._id);
        const isBulkMatch = (inv.coveredQueries || []).some((q) =>
          agentQueryIds.has(q.query?.queryId || q.queryCode || q.query || String(q.query))
        );
        return isSingleMatch || isBulkMatch;
      });
    } else {
      if (statsSelectedDmc === 'all') return statsInternalInvoices;
      return statsInternalInvoices.filter((invoice) => {
        const dmcName = invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName;
        return dmcName === statsSelectedDmc;
      });
    }
  }, [statsModalMode, statsSelectedAgent, statsSelectedDmc, statsInvoices, statsInternalInvoices]);

  const filteredTravelStatsInvoices = useMemo(() => {
    if (statsModalMode === 'agent') {
      if (statsSelectedAgent === 'all') return statsTravelInvoices;
      return statsTravelInvoices.filter((invoice) => {
        const agentName = invoice.agent?.companyName || invoice.agent?.name || invoice.agentName;
        return agentName === statsSelectedAgent;
      });
    } else {
      if (statsSelectedDmc === 'all') return statsTravelInvoices;
      const dmcInvoices = statsTravelInternalInvoices.filter((inv) => {
        const dmcName = inv.dmc?.companyName || inv.dmc?.name || inv.dmcName;
        return dmcName === statsSelectedDmc;
      });
      const dmcQueryIds = new Set();
      dmcInvoices.forEach((inv) => {
        const qId = inv.query?.queryId || inv.queryCode || inv._id;
        if (qId) dmcQueryIds.add(qId);
        (inv.coveredQueries || []).forEach((q) => {
          const coveredQId = q.query?.queryId || q.queryCode || q.query || String(q.query);
          if (coveredQId) dmcQueryIds.add(coveredQId);
        });
      });
      return statsTravelInvoices.filter((invoice) => {
        const qId = invoice.query?.queryId || invoice._id;
        return dmcQueryIds.has(qId);
      });
    }
  }, [statsModalMode, statsSelectedAgent, statsSelectedDmc, statsTravelInvoices, statsTravelInternalInvoices]);

  const filteredTravelStatsInternalInvoices = useMemo(() => {
    if (statsModalMode === 'agent') {
      if (statsSelectedAgent === 'all') return statsTravelInternalInvoices;
      const agentInvoices = statsTravelInvoices.filter((invoice) => {
        const agentName = invoice.agent?.companyName || invoice.agent?.name || invoice.agentName;
        return agentName === statsSelectedAgent;
      });
      const agentQueryIds = new Set(agentInvoices.map((inv) => inv.query?.queryId || inv._id));
      return statsTravelInternalInvoices.filter((inv) => {
        const isSingleMatch = agentQueryIds.has(inv.query?.queryId || inv.queryCode || inv._id);
        const isBulkMatch = (inv.coveredQueries || []).some((q) =>
          agentQueryIds.has(q.query?.queryId || q.queryCode || q.query || String(q.query))
        );
        return isSingleMatch || isBulkMatch;
      });
    } else {
      if (statsSelectedDmc === 'all') return statsTravelInternalInvoices;
      return statsTravelInternalInvoices.filter((invoice) => {
        const dmcName = invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName;
        return dmcName === statsSelectedDmc;
      });
    }
  }, [statsModalMode, statsSelectedAgent, statsSelectedDmc, statsTravelInvoices, statsTravelInternalInvoices]);

  const statsSummary = useMemo(() => {
    if (statsSelectedQueries.length > 0) {
      const activeId = statsSelectedQueries[0];
      if (statsModalMode === 'agent') {
        const invoice = filteredTravelStatsInvoices.find(inv => (inv.query?.queryId || inv._id) === activeId);
        if (invoice) {
          const total = getInvoiceTotalAmount(invoice);
          const paid = getInvoicePaidAmount(invoice);
          const pending = Math.max(0, total - paid);
          const rate = total ? (paid / total) * 100 : 0;
          return { total, paid, pending, rate };
        }
      } else {
        const invoice = filteredTravelStatsInternalInvoices.find(inv => (inv.query?.queryId || inv.queryCode || inv._id) === activeId);
        if (invoice) {
          const total = Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
          const paid = getDmcPaidAmount(invoice);
          const pending = Math.max(0, total - paid);
          const rate = total ? (paid / total) * 100 : 0;
          return { total, paid, pending, rate };
        }
      }

      return { total: 0, paid: 0, pending: 0, rate: 0 };
    }

    let total = 0;
    let paid = 0;
    if (statsModalMode === 'agent') {
      filteredTravelStatsInvoices.forEach(inv => {
        total += getInvoiceTotalAmount(inv);
        paid += getInvoicePaidAmount(inv);
      });
    } else {
      filteredTravelStatsInternalInvoices.forEach(inv => {
        total += Number(inv.payoutAmount || inv.summary?.grandTotal || 0);
        paid += getDmcPaidAmount(inv);
      });
    }
    const pending = Math.max(0, total - paid);
    const rate = total ? (paid / total) * 100 : 0;
    const finalRate = rate > 100 ? 100 : rate;
    return { total, paid, pending, rate: finalRate };
  }, [statsModalMode, statsSelectedQueries, filteredTravelStatsInvoices, filteredTravelStatsInternalInvoices]);

  const statsProfitSummary = useMemo(() => {
    const activeId = statsSelectedQueries.length > 0 ? statsSelectedQueries[0] : null;

    let revenueVal = 0;
    let costVal = 0;

    if (activeId) {
      const agentInvoice = filteredTravelStatsInvoices.find(inv => (inv.query?.queryId || inv._id) === activeId);
      if (agentInvoice) {
        revenueVal = getInvoiceTotalAmount(agentInvoice);
      }

      const dmcInvoices = filteredTravelStatsInternalInvoices.filter(inv => {
        const isSingleMatch = (inv.query?.queryId || inv.queryCode || inv._id) === activeId;
        const isBulkMatch = (inv.coveredQueries || []).some(q =>
          (q.query?.queryId || q.queryCode || q.query) === activeId || String(q.query) === String(activeId)
        );
        return isSingleMatch || isBulkMatch;
      });

      dmcInvoices.forEach(inv => {
        if (inv.settlementType === "bulk" || (inv.coveredQueries && inv.coveredQueries.length > 0)) {
          const queryItems = (inv.items || []).filter(item =>
            (item.query?.queryId || item.queryCode || item.query) === activeId || String(item.query) === String(activeId)
          );
          const sub = queryItems.reduce((s, item) => s + Number(item.subtotal || 0), 0);
          const tax = queryItems.reduce((s, item) => s + Number(item.tax || 0), 0);
          costVal += (sub + tax);
        } else {
          costVal += Number(
            inv.summary?.grandTotal ||
            inv.claimedSummary?.grandTotal ||
            inv.payoutAmount ||
            0
          );
        }
      });
    } else {
      filteredTravelStatsInvoices.forEach(inv => {
        revenueVal += getInvoiceTotalAmount(inv);
      });
      filteredTravelStatsInternalInvoices.forEach(inv => {
        costVal += Number(
          inv.summary?.grandTotal ||
          inv.claimedSummary?.grandTotal ||
          inv.payoutAmount ||
          0
        );
      });
    }

    const profitVal = revenueVal - costVal;
    const marginPercent = revenueVal > 0 ? (profitVal / revenueVal) * 100 : 0;

    return {
      revenue: revenueVal,
      cost: costVal,
      profit: profitVal,
      margin: marginPercent
    };
  }, [statsSelectedQueries, filteredTravelStatsInvoices, filteredTravelStatsInternalInvoices]);



  const statsDailyChart = useMemo(() => {
    if (!statsModalMonth) return { data: [], labels: [], details: [] };
    const daysCount = isStatsYearlyView ? 12 : getDaysInMonth(statsModalMonth);
    const targetYearMonth = isStatsYearlyView ? '' : getYearMonthFromLabel(statsModalMonth);
    const dailyData = Array(daysCount).fill(0);
    const dailyDetails = Array.from({ length: daysCount }, () => ({ items: [] }));

    const activeId = statsSelectedQueries.length > 0 ? statsSelectedQueries[0] : null;

    const buildPaymentDetail = (record = {}, status = '') => ({
      queryId: record.query?.queryId || record.queryCode || record.tripSnapshot?.queryId || record._id || '',
      destination:
        record.tripSnapshot?.destination ||
        record.query?.destination ||
        record.destination ||
        record.city ||
        'Unknown Destination',
      travelDate: getTravelDateLabel(record),
      status,
    });

    const addMonthlyPoint = (monthlyData, monthlyDetails, date, amount, detail) => {
      const numericAmount = Number(amount || 0);
      if (numericAmount <= 0 || !isDateInYear(date, statsModalYear)) return;

      const monthIndex = date.getMonth();
      monthlyData[monthIndex] += numericAmount;
      if (detail) monthlyDetails[monthIndex].items.push(detail);
    };

    if (isStatsYearlyView) {
      const monthlyData = Array(12).fill(0);
      const monthlyDetails = Array.from({ length: 12 }, () => ({ items: [] }));

      if (statsModalMode === 'agent') {
        filteredTravelStatsInvoices.forEach(invoice => {
          if (activeId && (invoice.query?.queryId || invoice._id) !== activeId) return;

          const paymentEntries = getAgentPaymentEntries(invoice);
          if (paymentEntries.length > 0) {
            paymentEntries.forEach(entry => {
              addMonthlyPoint(
                monthlyData,
                monthlyDetails,
                entry.date || parseInvoiceDate(invoice),
                entry.amount,
                buildPaymentDetail(invoice, entry.status)
              );
            });
          } else {
            addMonthlyPoint(
              monthlyData,
              monthlyDetails,
              parseInvoiceDate(invoice),
              getInvoicePaidAmount(invoice),
              buildPaymentDetail(invoice, invoice.paymentStatus)
            );
          }
        });
      } else {
        filteredTravelStatsInternalInvoices.forEach(invoice => {
          if (activeId && (invoice.query?.queryId || invoice.queryCode || invoice._id) !== activeId) return;

          getDmcPaymentEntries(invoice).forEach((entry) => {
            addMonthlyPoint(
              monthlyData,
              monthlyDetails,
              entry.date || parseInternalInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status)
            );
          });
        });
      }

      return { data: monthlyData, labels: MONTH_SEQUENCE, details: monthlyDetails };
    }

    const addSelectedPoint = (buckets, date, amount, detail) => {
      const numericAmount = Number(amount || 0);
      if (numericAmount <= 0) return;

      if (!date) {
        const existing = buckets.get('undated') || {
          label: 'Undated',
          sort: Number.MAX_SAFE_INTEGER,
          amount: 0,
          items: [],
        };
        existing.amount += numericAmount;
        if (detail) existing.items.push(detail);
        buckets.set('undated', existing);
        return;
      }

      const key = formatDateKey(date);
      const existing = buckets.get(key) || {
        label: formatInstallmentDateLabel(date),
        sort: date.getTime(),
        amount: 0,
        items: [],
      };
      existing.amount += numericAmount;
      if (detail) existing.items.push(detail);
      buckets.set(key, existing);
    };

    const addDailyPoint = (date, amount, detail) => {
      if (!isDateInYearMonth(date, targetYearMonth)) return;
      const day = date.getDate();
      if (day >= 1 && day <= daysCount) {
        dailyData[day - 1] += Number(amount || 0);
        if (detail) dailyDetails[day - 1].items.push(detail);
      }
    };

    if (activeId) {
      const selectedBuckets = new Map();

      if (statsModalMode === 'agent') {
        filteredTravelStatsInvoices.forEach(invoice => {
          if ((invoice.query?.queryId || invoice._id) !== activeId) return;

          getAgentPaymentEntries(invoice).forEach((entry) => {
            addSelectedPoint(
              selectedBuckets,
              entry.date || parseInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status)
            );
          });
        });
      } else {
        filteredTravelStatsInternalInvoices.forEach(invoice => {
          const isSingleMatch = (invoice.query?.queryId || invoice.queryCode || invoice._id) === activeId;
          const isBulkMatch = (invoice.coveredQueries || []).some(q =>
            (q.query?.queryId || q.queryCode || q.query) === activeId || String(q.query) === String(activeId)
          );
          if (!isSingleMatch && !isBulkMatch) return;

          getDmcPaymentEntries(invoice).forEach((entry) => {
            addSelectedPoint(
              selectedBuckets,
              entry.date || parseInternalInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status)
            );
          });
        });
      }

      const selectedRows = Array.from(selectedBuckets.values())
        .filter((row) => Number(row.amount || 0) > 0)
        .sort((left, right) => left.sort - right.sort);

      if (selectedRows.length > 0) {
        return {
          data: selectedRows.map((row) => Number(row.amount || 0)),
          labels: selectedRows.map((row) => row.label),
          details: selectedRows.map((row) => ({ items: row.items || [] })),
        };
      }
    }

    if (statsModalMode === 'agent') {
      filteredTravelStatsInvoices.forEach(invoice => {
        if (activeId && (invoice.query?.queryId || invoice._id) !== activeId) return;

        const paymentEntries = getAgentPaymentEntries(invoice);
        if (paymentEntries.length > 0) {
          paymentEntries.forEach(entry => {
            addDailyPoint(
              entry.date || parseInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status)
            );
          });
        } else {
          addDailyPoint(
            parseInvoiceDate(invoice),
            getInvoicePaidAmount(invoice),
            buildPaymentDetail(invoice, invoice.paymentStatus)
          );
        }
      });
    } else {
      filteredTravelStatsInternalInvoices.forEach(invoice => {
        if (activeId && (invoice.query?.queryId || invoice.queryCode || invoice._id) !== activeId) return;

        getDmcPaymentEntries(invoice).forEach((entry) => {
          addDailyPoint(
            entry.date || parseInternalInvoiceDate(invoice),
            entry.amount,
            buildPaymentDetail(invoice, entry.status)
          );
        });
      });
    }

    return { data: dailyData, labels: [], details: dailyDetails };
  }, [statsModalMonth, statsModalMode, statsSelectedQueries, filteredTravelStatsInvoices, filteredTravelStatsInternalInvoices, isStatsYearlyView, statsModalYear, getDaysInMonth, getYearMonthFromLabel]);

  const statsDailyData = statsDailyChart.data;
  const statsDailyLabels = statsDailyChart.labels;
  const statsDailyDetails = statsDailyChart.details;

  const statsDailyCardTrends = useMemo(() => {
    if (!statsModalMonth) return { totalVal: [], receivedVal: [], pendingVal: [], rateVal: [], profitVal: [], marginVal: [] };
    const daysCount = isStatsYearlyView ? 12 : getDaysInMonth(statsModalMonth);
    const targetYearMonth = isStatsYearlyView ? '' : getYearMonthFromLabel(statsModalMonth);

    const dailyInvoices = Array(daysCount).fill(0);
    const dailyReceived = Array(daysCount).fill(0);
    const dailyDmcCosts = Array(daysCount).fill(0);

    const activeId = statsSelectedQueries.length > 0 ? statsSelectedQueries[0] : null;

    const invoiceMatchesQuery = (invoice) => {
      if (!activeId) return true;
      return (invoice.query?.queryId || invoice._id) === activeId;
    };

    const internalInvoiceMatchesQuery = (invoice) => {
      if (!activeId) return true;
      const isSingleMatch = (invoice.query?.queryId || invoice.queryCode || invoice._id) === activeId;
      const isBulkMatch = (invoice.coveredQueries || []).some(q =>
        (q.query?.queryId || q.queryCode || q.query) === activeId || String(q.query) === String(activeId)
      );
      return isSingleMatch || isBulkMatch;
    };

    const addTrendPoint = (date, targetArray, amount) => {
      const numericAmount = Number(amount || 0);
      if (numericAmount <= 0 || !date) return;

      if (isStatsYearlyView) {
        if (!isDateInYear(date, statsModalYear)) return;
        targetArray[date.getMonth()] += numericAmount;
        return;
      }

      if (isDateInYearMonth(date, targetYearMonth)) {
        const day = date.getDate();
        if (day >= 1 && day <= daysCount) {
          targetArray[day - 1] += numericAmount;
        }
      }
    };

    filteredTravelStatsInvoices.forEach(invoice => {
      if (!invoiceMatchesQuery(invoice)) return;
      const date = getPrimaryTravelDate(invoice);
      addTrendPoint(date, dailyInvoices, getInvoiceTotalAmount(invoice));
    });

    filteredTravelStatsInvoices.forEach(invoice => {
      if (!invoiceMatchesQuery(invoice)) return;
      const date = getPrimaryTravelDate(invoice);
      addTrendPoint(date, dailyReceived, getInvoicePaidAmount(invoice));
    });

    filteredTravelStatsInternalInvoices.forEach(inv => {
      if (!internalInvoiceMatchesQuery(inv)) return;
      if (inv.settlementType === "bulk" || (inv.coveredQueries && inv.coveredQueries.length > 0)) {
        const queryItems = (inv.items || []).filter(item => {
          if (!activeId) return true;
          return (item.query?.queryId || item.queryCode || item.query) === activeId || String(item.query) === String(activeId);
        });
        const sub = queryItems.reduce((s, item) => s + Number(item.subtotal || 0), 0);
        const tax = queryItems.reduce((s, item) => s + Number(item.tax || 0), 0);
        const amount = sub + tax;
        const date = getPrimaryTravelDate({ items: queryItems });
        addTrendPoint(date, dailyDmcCosts, amount);
      } else {
        const amt = Number(inv.summary?.grandTotal || inv.claimedSummary?.grandTotal || inv.payoutAmount || 0);
        const date = getPrimaryTravelDate(inv);
        addTrendPoint(date, dailyDmcCosts, amt);
      }
    });

    const totalVal = Array(daysCount).fill(0);
    const receivedVal = Array(daysCount).fill(0);
    const pendingVal = Array(daysCount).fill(0);
    const rateVal = Array(daysCount).fill(0);
    const profitVal = Array(daysCount).fill(0);
    const marginVal = Array(daysCount).fill(0);

    let runningTotal = 0;
    let runningReceived = 0;
    let runningDmcCost = 0;

    for (let day = 1; day <= daysCount; day++) {
      runningTotal += dailyInvoices[day - 1];
      runningReceived += dailyReceived[day - 1];
      runningDmcCost += dailyDmcCosts[day - 1];

      totalVal[day - 1] = runningTotal;
      receivedVal[day - 1] = runningReceived;
      pendingVal[day - 1] = Math.max(0, runningTotal - runningReceived);

      const rawRate = runningTotal > 0 ? (runningReceived / runningTotal) * 100 : 0;
      rateVal[day - 1] = rawRate > 100 ? 100 : rawRate;

      profitVal[day - 1] = runningTotal - runningDmcCost;
      marginVal[day - 1] = runningTotal > 0 ? (profitVal[day - 1] / runningTotal) * 100 : 0;
    }

    return { totalVal, receivedVal, pendingVal, rateVal, profitVal, marginVal };
  }, [statsModalMonth, statsSelectedQueries, statsModalMode, filteredTravelStatsInvoices, filteredTravelStatsInternalInvoices, isStatsYearlyView, statsModalYear, getDaysInMonth, getYearMonthFromLabel]);

  const statsModalCardText = useMemo(() => {
    const values = Array.isArray(statsDailyCardTrends.totalVal)
      ? statsDailyCardTrends.totalVal.map((value) => Number(value || 0))
      : [];
    const current = values.length ? values[values.length - 1] : Number(statsSummary.total || 0);
    const previous = values.length > 1 ? values[values.length - 2] : 0;
    const change = previous > 0
      ? ((current - previous) / previous) * 100
      : (current > 0 ? 100 : 0);
    const trendArrow = change > 0 ? '\u2191' : change < 0 ? '\u2193' : '\u2192';
    const trendPrefix = change > 0 ? '+' : change < 0 ? '-' : '';

    return {
      totalTrend: `${trendArrow} ${trendPrefix}${formatOneDecimalPercent(Math.abs(change))}%`,
      totalTrendTone: change >= 0 ? 'text-emerald-600' : 'text-rose-600',
      collectionRate: `${formatOneDecimalPercent(statsSummary.rate)}%`,
      pendingStatus: statsSummary.pending === 0
        ? '\u2713 No risk'
        : `\u2193 ${formatCompactCurrency(statsSummary.pending)} pending`,
    };
  }, [statsDailyCardTrends.totalVal, statsSummary.total, statsSummary.rate, statsSummary.pending]);

  const periodData = period === 'custom' ? defaultAnalytics.monthly : (analyticsData?.[period] || defaultAnalytics[period]);
  const reportsData = analyticsData?.reports || defaultAnalytics.reports;
  const taxPeriodOptions = useMemo(
    () => (Array.isArray(periodData.taxPeriods) ? periodData.taxPeriods : []),
    [periodData.taxPeriods],
  );
  const yearPeriodOptions = useMemo(
    () => (Array.isArray(periodData.yearPeriods) ? periodData.yearPeriods : []),
    [periodData.yearPeriods],
  );
  const selectedTaxPeriod = period === 'monthly'
    ? taxPeriodOptions.find((option) => option.value === effectiveSelectedTaxMonth) || taxPeriodOptions[0]
    : null;
  const previousTaxMonthValue = useMemo(() => {
    if (!effectiveSelectedTaxMonth) return '';
    const [year, month] = effectiveSelectedTaxMonth.split('-').map(Number);
    return formatTaxMonthValue(new Date(year, month - 2, 1));
  }, [effectiveSelectedTaxMonth]);
  const previousMonthRevenueTotal = useMemo(() => {
    const previousTaxPeriod = taxPeriodOptions.find((option) => option.value === previousTaxMonthValue);
    return getRevenueReportTotal(previousTaxPeriod?.reports?.revenue);
  }, [taxPeriodOptions, previousTaxMonthValue]);
  const selectedYearPeriod = period === 'yearly'
    ? yearPeriodOptions.find((option) => option.value === effectiveSelectedTaxYear) || yearPeriodOptions[yearPeriodOptions.length - 1]
    : null;
  const activePeriodOption = period === 'monthly' ? selectedTaxPeriod : selectedYearPeriod;
  const activeTaxSummary = useMemo(() => {
    if (analyticsData.custom?.taxSummary && (period === 'custom' || selectedTaxDate || (period === 'monthly' && selectedTaxMonth) || (period === 'yearly' && selectedTaxYear))) {
      return analyticsData.custom.taxSummary;
    }
    return activePeriodOption?.taxSummary || periodData.taxSummary || defaultAnalytics[period].taxSummary;
  }, [period, effectiveSelectedTaxMonth, effectiveSelectedTaxYear, taxPeriodOptions, analyticsData, selectedTaxDate, selectedTaxMonth, selectedTaxYear, activePeriodOption, periodData.taxSummary]);

  const activeMetrics = useMemo(() => {
    if (analyticsData.custom?.metrics && (period === 'custom' || selectedTaxDate || (period === 'monthly' && selectedTaxMonth) || (period === 'yearly' && selectedTaxYear))) {
      return analyticsData.custom.metrics;
    }
    return activePeriodOption?.metrics || periodData.metrics || defaultAnalytics[period].metrics;
  }, [period, effectiveSelectedTaxMonth, effectiveSelectedTaxYear, taxPeriodOptions, analyticsData, selectedTaxDate, selectedTaxMonth, selectedTaxYear, activePeriodOption, periodData.metrics]);

  const activeReports = useMemo(() => {
    if (analyticsData.customReports && (period === 'custom' || selectedTaxDate || (period === 'monthly' && selectedTaxMonth) || (period === 'yearly' && selectedTaxYear))) {
      return analyticsData.customReports;
    }
    return activePeriodOption?.reports ||
      reportsData?.[period] ||
    {
      query: reportsData.query || defaultAnalytics.reports.query,
      revenue: reportsData.revenue || defaultAnalytics.reports.revenue,
    };
  }, [period, effectiveSelectedTaxMonth, effectiveSelectedTaxYear, taxPeriodOptions, analyticsData, selectedTaxDate, selectedTaxMonth, selectedTaxYear, activePeriodOption, reportsData]);

  const queryReports = activeReports.query || defaultAnalytics.reports.query;
  const revenueReports = activeReports.revenue || defaultAnalytics.reports.revenue;
  const tdsSummary = activeTaxSummary?.tds || activeTaxSummary?.tdf || defaultAnalytics[period === 'custom' ? 'monthly' : period].taxSummary.tds;
  const chartData = useMemo(() => {
    if (period === 'custom' || selectedTaxDate) {
      if (analyticsData.custom?.chart) return analyticsData.custom.chart;
    }
    return period === 'monthly'
      ? reorderChartByCalendar(analyticsData.monthly?.chart || periodData.chart)
      : (analyticsData.yearly?.chart || periodData.chart);
  }, [period, periodData.chart, analyticsData.custom, analyticsData.monthly?.chart, analyticsData.yearly?.chart, selectedTaxDate]);
  const generatedOnLabel = useMemo(() => {
    const sourceDate = analyticsData?.generatedOn ? new Date(analyticsData.generatedOn) : new Date();
    return sourceDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [analyticsData?.generatedOn]);

  useEffect(() => {
    if (period !== 'monthly' || taxPeriodOptions.length === 0) return;

    setSelectedTaxMonth((currentMonth) => {
      const isValidSelection = taxPeriodOptions.some((option) => option.value === currentMonth);
      if (isValidSelection) return currentMonth;

      const currentMonthOption = taxPeriodOptions.find((option) => option.value === defaultTaxMonthValue);

      return currentMonthOption?.value || taxPeriodOptions[0].value;
    });
  }, [defaultTaxMonthValue, period, taxPeriodOptions]);

  useEffect(() => {
    if (period !== 'yearly' || yearPeriodOptions.length === 0) return;

    setSelectedTaxYear((currentYear) => {
      const isValidSelection = yearPeriodOptions.some((option) => option.value === currentYear);
      if (isValidSelection) return currentYear;

      const currentYearOption = yearPeriodOptions.find((option) => option.value === defaultTaxYearValue);

      return currentYearOption?.value || yearPeriodOptions[yearPeriodOptions.length - 1].value;
    });
  }, [defaultTaxYearValue, period, yearPeriodOptions]);

  useEffect(() => {
    setSelectedTaxDate('');
    if (period === 'monthly') {
      setYearMenuOpen(false);
      return;
    }

    setMonthMenuOpen(false);
  }, [period]);

  const metricCards = [
    { key: 'inward', icon: TrendingUp },
    { key: 'outward', icon: TrendingDown },
    { key: 'profit', icon: DollarSign },
    { key: 'margin', icon: TrendingUp },
  ];

  const complianceIsHealthy = activeTaxSummary.summaryBar.complianceTone === 'success';
  const hasChartData = useMemo(() => hasMeaningfulChartData(chartData), [chartData]);
  const hasTaxData = useMemo(() => hasMeaningfulTaxData(activeTaxSummary), [activeTaxSummary]);
  const canExportOverview = !loading && !error && hasChartData;
  const canExportTax = !loading && !error && hasTaxData;
  const canExportAudit = !loading && !error && (hasChartData || hasTaxData);
  const periodLabel = period === 'monthly' ? 'Monthly' : period === 'yearly' ? 'Yearly' : 'Custom';
  const selectedMonthLabel = useMemo(() => {
    if (selectedTaxDate) {
      const date = new Date(selectedTaxDate);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (selectedTaxPeriod?.label) return selectedTaxPeriod.label;
    if (!effectiveSelectedTaxMonth) return '';
    const parts = effectiveSelectedTaxMonth.split('-');
    if (parts.length < 2) return effectiveSelectedTaxMonth;
    const [yr, mn] = parts;
    const date = new Date(Number(yr), Number(mn) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [selectedTaxPeriod, effectiveSelectedTaxMonth, selectedTaxDate]);

  const selectedYearLabel = useMemo(() => {
    if (selectedYearPeriod?.label) return selectedYearPeriod.label;
    return effectiveSelectedTaxYear || '';
  }, [selectedYearPeriod, effectiveSelectedTaxYear]);
  const applyPeriodSummaryLabels = useCallback((cards = []) => {
    const titlePrefix = periodLabel.toUpperCase();
    const lowerPrefix = periodLabel.toLowerCase();

    return cards.map((card) => {
      const originalLabel = String(card.label || '');
      const periodLabelText = originalLabel.replace(/^MONTHLY\b/i, titlePrefix);
      const periodSubText = String(card.sub || '')
        .replace(/\bmonthly\b/gi, lowerPrefix)
        .replace(/\bmonth\b/gi, lowerPrefix === 'yearly' ? 'year' : lowerPrefix === 'custom' ? 'period' : 'month');

      return {
        ...card,
        label: periodLabelText,
        sub: periodSubText,
        styleKey: card.styleKey || originalLabel,
      };
    });
  }, [periodLabel]);
  const querySummaryCards = useMemo(
    () => applyPeriodSummaryLabels(Array.isArray(queryReports.summaryCards) ? queryReports.summaryCards : []),
    [applyPeriodSummaryLabels, queryReports.summaryCards],
  );
  const revenueSummaryCards = useMemo(
    () => applyPeriodSummaryLabels(Array.isArray(revenueReports.summaryCards) ? revenueReports.summaryCards : []),
    [applyPeriodSummaryLabels, revenueReports.summaryCards],
  );
  const monthlyQueryRows = Array.isArray(queryReports.monthlyQueries) ? queryReports.monthlyQueries : [];
  const destinationQueryRows = Array.isArray(queryReports.destinationWiseQueries) ? queryReports.destinationWiseQueries : [];
  const itemsPerPage = 5;
  const totalPages = Math.ceil(destinationQueryRows.length / itemsPerPage) || 1;
  const startIdx = (destinationPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;

  useEffect(() => {
    setDestinationPage(1);
  }, [destinationQueryRows]);

  const paginatedDestinationRows = useMemo(() => {
    return destinationQueryRows.slice(startIdx, endIdx);
  }, [destinationQueryRows, startIdx, endIdx]);

  const confirmationTrendRows = Array.isArray(queryReports.confirmationTrends) ? queryReports.confirmationTrends : [];
  const travelDateRevenueRows = Array.isArray(revenueReports.travelDateRevenue) ? revenueReports.travelDateRevenue : [];
  const travelDateEntries = Array.isArray(revenueReports.travelDateEntries) ? revenueReports.travelDateEntries : [];
  const destinationProfitRows = Array.isArray(revenueReports.destinationProfitability) ? revenueReports.destinationProfitability : [];

  const totalProfitPages = Math.ceil(destinationProfitRows.length / itemsPerPage) || 1;
  const startProfitIdx = (profitabilityPage - 1) * itemsPerPage;
  const endProfitIdx = startProfitIdx + itemsPerPage;

  useEffect(() => {
    setProfitabilityPage(1);
  }, [destinationProfitRows]);

  const paginatedProfitRows = useMemo(() => {
    return destinationProfitRows.slice(startProfitIdx, endProfitIdx);
  }, [destinationProfitRows, startProfitIdx, endProfitIdx]);
  const destinationQueryColumns = [
    {
      key: 'destination',
      label: 'Destination',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-black text-white shadow-sm uppercase">
            {row.destination ? row.destination.charAt(0) : '?'}
          </span>
          <span className="font-bold text-slate-800 tracking-wide text-xs">{row.destination}</span>
        </div>
      ),
    },
    {
      key: 'queries',
      label: 'Queries',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center justify-center min-w-[44px] px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100/70 shadow-sm font-mono">
          {row.queries}
        </span>
      ),
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      align: 'center',
      render: (row) => (
        <span className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm font-mono ${row.confirmed > 0
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          : 'bg-slate-50 text-slate-400 border border-slate-200/50'
          }`}>
          {row.confirmed}
        </span>
      ),
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      align: 'center',
      render: (row) => (
        <span className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm font-mono ${row.cancelled > 0
          ? 'bg-rose-50 text-rose-700 border border-rose-100'
          : 'bg-slate-50 text-slate-400 border border-slate-200/50'
          }`}>
          {row.cancelled}
        </span>
      ),
    },
    {
      key: 'conversionPercent',
      label: 'Conversion',
      align: 'center',
      render: (row) => {
        const val = Number(row.conversionPercent || 0);
        let colorClass = 'bg-slate-50 text-slate-500 border border-slate-200/50';
        if (val > 50) {
          colorClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
        } else if (val > 0) {
          colorClass = 'bg-blue-50 text-blue-700 border border-blue-100';
        }
        return (
          <span className={`inline-flex items-center justify-center min-w-[50px] px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm font-mono ${colorClass}`}>
            {val.toFixed(1).replace(/\.0$/, '')}%
          </span>
        );
      },
    },
  ];
  const confirmationColumns = [
    { key: 'label', label: 'Month' },
    { key: 'confirmed', label: 'Confirmed', align: 'right' },
    { key: 'cancelled', label: 'Cancelled', align: 'right' },
    {
      key: 'conversionPercent',
      label: 'Conversion',
      align: 'right',
      render: (row) => `${Number(row.conversionPercent || 0).toFixed(1).replace(/\.0$/, '')}%`,
    },
  ];
  const destinationProfitColumns = [
    { key: 'destination', label: 'Destination' },
    {
      key: 'grossRevenueLabel',
      label: 'Total Amount',
      align: 'right',
      render: (row) => `₹${formatPlainNumber(row.grossRevenue || row.revenue)}`,
    },
    {
      key: 'revenueLabel',
      label: 'Revenue',
      align: 'right',
      render: (row) => `₹${formatPlainNumber(row.revenue)}`,
    },
    {
      key: 'pendingRevenueLabel',
      label: 'Pending Revenue',
      align: 'right',
      render: (row) => {
        const pending = Number(row.pendingRevenue || 0);
        if (pending <= 0) return '-';
        return <span className="font-black text-amber-600">₹{formatPlainNumber(pending)}</span>;
      },
    },
    {
      key: 'offerDiscountLabel',
      label: 'Offer / Discount',
      align: 'right',
      render: (row) => {
        const discount = Number(row.offerDiscount || 0);
        if (discount <= 0) return '-';
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-black text-emerald-600">-₹{formatPlainNumber(discount)}</span>
            {row.offerLabel && (
              <span className="max-w-[140px] truncate text-[10px] font-bold text-violet-600">
                {row.offerLabel}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'costLabel',
      label: 'DMC Cost',
      align: 'right',
      render: (row) => `₹${formatPlainNumber(row.cost)}`,
    },
    {
      key: 'profitLabel',
      label: 'Profit',
      align: 'right',
      render: (row) => {
        const profit = Number(row.profit || 0);
        return (
          <span className={profit < 0 ? 'font-black text-rose-600' : 'font-black text-slate-800'}>
            {profit < 0 ? '-' : ''}₹{formatPlainNumber(Math.abs(profit))}
          </span>
        );
      },
    },
    {
      key: 'marginPercent',
      label: 'Margin',
      align: 'right',
      render: (row) => {
        const margin = Number(row.marginPercent || 0);
        return (
          <span className={margin < 0 ? 'font-black text-rose-600' : 'font-black text-emerald-600'}>
            {margin.toFixed(1).replace(/\.0$/, '')}%
          </span>
        );
      },
    },
  ];
  const monthlyBookingRows = Array.isArray(revenueReports.monthlyBookings) ? revenueReports.monthlyBookings : [];
  const metricReportRows = metricCards.map(({ key }) => ({
    metric: activeMetrics[key].label,
    value: activeMetrics[key].val,
    change: activeMetrics[key].change,
  }));
  const revenueTrendRows = chartData.labels.map((label, index) => ({
    period: label,
    inward: Number(chartData.inward[index] || 0),
    inwardLabel: formatCompactCurrency(chartData.inward[index]),
    outward: Number(chartData.outward[index] || 0),
    outwardLabel: formatCompactCurrency(chartData.outward[index]),
  }));
  const taxSummaryRows = [
    {
      section: 'GST',
      total: activeTaxSummary.gst.total,
      status: activeTaxSummary.gst.status,
      rateLabel: activeTaxSummary.gst.rateLabel,
    },
    {
      section: 'TCS',
      total: activeTaxSummary.tcs.total,
      status: activeTaxSummary.tcs.status,
      rateLabel: activeTaxSummary.tcs.rateLabel,
    },
    {
      section: 'TDS',
      total: tdsSummary.total,
      status: tdsSummary.status,
      rateLabel: tdsSummary.rateLabel,
    },
    {
      section: 'Compliance',
      total: activeTaxSummary.summaryBar.totalTaxCollected,
      status: activeTaxSummary.summaryBar.complianceStatus,
      rateLabel: `Next filing: ${activeTaxSummary.summaryBar.nextFilingDue}`,
    },
  ];
  const escapeReportHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const buildReportCardsHtml = (cards = []) =>
    cards
      .map(
        (item) => `
          <div class="card">
            <div class="meta">${escapeReportHtml(item.label)}</div>
            <div style="font-size: 22px; font-weight: 700;">${escapeReportHtml(item.value)}</div>
            <div>${escapeReportHtml(item.sub || '')}</div>
          </div>
        `,
      )
      .join('');
  const buildReportTableHtml = (columns = [], rows = []) => `
    <table>
      <thead>
        <tr>
          ${columns.map((column) => `<th>${escapeReportHtml(column.label)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.length
      ? rows
        .map(
          (row) => `
                  <tr>
                    ${columns
              .map((column) => `<td>${escapeReportHtml(column.value(row))}</td>`)
              .join('')}
                  </tr>
                `,
        )
        .join('')
      : `<tr><td colspan="${columns.length}">No report data available</td></tr>`
    }
      </tbody>
    </table>
  `;
  const addJsonSheet = (workbook, sheetName, rows, headers = null) => {
    const safeRows = rows.length ? rows : [{}];
    const worksheet = headers
      ? XLSX.utils.json_to_sheet(safeRows, { header: headers })
      : XLSX.utils.json_to_sheet(safeRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

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

          <h2>Financial Metrics</h2>
          <div class="grid">
            ${buildReportCardsHtml(
          metricReportRows.map((row) => ({
            label: row.metric,
            value: row.value,
            sub: row.change,
          })),
        )}
          </div>

          <h2>Trend Overview</h2>
          ${buildReportTableHtml(
          [
            { label: 'Period', value: (row) => row.period },
            { label: 'Inward', value: (row) => row.inwardLabel },
            { label: 'Outward', value: (row) => row.outwardLabel },
          ],
          revenueTrendRows,
        )}

          <h2>Query Analytics</h2>
          <div class="grid">
            ${buildReportCardsHtml(querySummaryCards)}
          </div>

          <h2>Monthly Queries</h2>
          ${buildReportTableHtml(
          [
            { label: 'Month', value: (row) => row.label },
            { label: 'Queries', value: (row) => row.queries || 0 },
            { label: 'Confirmed', value: (row) => row.confirmed || 0 },
            { label: 'Cancelled', value: (row) => row.cancelled || 0 },
          ],
          monthlyQueryRows,
        )}

          <h2>Destination Wise Queries</h2>
          ${buildReportTableHtml(
          [
            { label: 'Destination', value: (row) => row.destination },
            { label: 'Queries', value: (row) => row.queries || 0 },
            { label: 'Confirmed', value: (row) => row.confirmed || 0 },
            { label: 'Cancelled', value: (row) => row.cancelled || 0 },
            { label: 'Conversion', value: (row) => `${Number(row.conversionPercent || 0).toFixed(1).replace(/\.0$/, '')}%` },
          ],
          destinationQueryRows,
        )}

          <h2>Confirmation Trends</h2>
          ${buildReportTableHtml(
          [
            { label: 'Month', value: (row) => row.label },
            { label: 'Confirmed', value: (row) => row.confirmed || 0 },
            { label: 'Cancelled', value: (row) => row.cancelled || 0 },
            { label: 'Conversion', value: (row) => `${Number(row.conversionPercent || 0).toFixed(1).replace(/\.0$/, '')}%` },
          ],
          confirmationTrendRows,
        )}

          <h2>Revenue Analytics</h2>
          <div class="grid">
            ${buildReportCardsHtml(revenueSummaryCards)}
          </div>

          <h2>Verified Payment Revenue</h2>
          ${buildReportTableHtml(
          [
            { label: 'Month', value: (row) => row.label },
            { label: 'Revenue', value: (row) => row.revenueLabel || formatCompactCurrency(row.revenue) },
            { label: 'Bookings', value: (row) => row.bookings || 0 },
          ],
          travelDateRevenueRows,
        )}

          <h2>Monthly Bookings</h2>
          ${buildReportTableHtml(
          [
            { label: 'Month', value: (row) => row.label },
            { label: 'Bookings', value: (row) => row.bookings || 0 },
          ],
          monthlyBookingRows,
        )}

          <h2>Destination Profitability</h2>
          ${buildReportTableHtml(
          [
            { label: 'Destination', value: (row) => row.destination },
            { label: 'Total Amount', value: (row) => `₹${formatPlainNumber(row.grossRevenue || row.revenue)}` },
            { label: 'Revenue', value: (row) => `₹${formatPlainNumber(row.revenue)}` },
            {
              label: 'Pending Review',
              value: (row) => Number(row.pendingRevenue || 0) > 0
                ? `₹${formatPlainNumber(row.pendingRevenue)}`
                : '-',
            },
            {
              label: 'Offer / Discount',
              value: (row) => Number(row.offerDiscount || 0) > 0
                ? `-₹${formatPlainNumber(row.offerDiscount)}${row.offerLabel ? ` (${row.offerLabel})` : ''}`
                : '-',
            },
            { label: 'DMC Cost', value: (row) => row.costLabel },
            { label: 'Profit', value: (row) => row.profitLabel },
            { label: 'Margin', value: (row) => `${Number(row.marginPercent || 0).toFixed(1).replace(/\.0$/, '')}%` },
            { label: 'Bookings', value: (row) => row.bookings || 0 },
          ],
          destinationProfitRows,
        )}

          <h2>Tax Summary</h2>
          ${buildReportTableHtml(
          [
            { label: 'Section', value: (row) => row.section },
            { label: 'Total', value: (row) => row.total },
            { label: 'Status', value: (row) => row.status },
            { label: 'Note', value: (row) => row.rateLabel },
          ],
          taxSummaryRows,
        )}
        `,
      );

      if (reportWindow) {
        reportWindow.focus();
        window.setTimeout(() => {
          reportWindow.print();
        }, 250);
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
      const summaryRows = [
        ['Holiday Circuit Analytics Report'],
        ['Report Type', `${periodLabel} ${mode === 'audit' ? 'Audit' : 'Analytics'}`],
        ['Generated On', generatedOnLabel],
        [],
        ['Financial Metrics'],
        ['Metric', 'Value', 'Change'],
        ...metricReportRows.map((row) => [row.metric, row.value, row.change]),
        [],
        ['Query Summary'],
        ['Metric', 'Value', 'Note'],
        ...querySummaryCards.map((item) => [item.label, item.value, item.sub || '']),
        [],
        ['Revenue Summary'],
        ['Metric', 'Value', 'Note'],
        ...revenueSummaryCards.map((item) => [item.label, item.value, item.sub || '']),
        [],
        ['Tax Summary'],
        ['Section', 'Total', 'Status', 'Note'],
        ...taxSummaryRows.map((row) => [row.section, row.total, row.status, row.rateLabel]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      addJsonSheet(
        workbook,
        'Financial Metrics',
        metricReportRows.map((row) => ({
          Metric: row.metric,
          Value: row.value,
          Change: row.change,
        })),
      );
      addJsonSheet(
        workbook,
        'Revenue Trend',
        revenueTrendRows.map((row) => ({
          Period: row.period,
          Inward: row.inward,
          InwardLabel: row.inwardLabel,
          Outward: row.outward,
          OutwardLabel: row.outwardLabel,
        })),
      );
      addJsonSheet(
        workbook,
        'Query Summary',
        querySummaryCards.map((item) => ({
          Metric: item.label,
          Value: item.value,
          Note: item.sub || '',
        })),
      );
      addJsonSheet(
        workbook,
        'Monthly Queries',
        monthlyQueryRows.map((row) => ({
          Month: row.label,
          Queries: Number(row.queries || 0),
          Confirmed: Number(row.confirmed || 0),
          Cancelled: Number(row.cancelled || 0),
        })),
      );
      addJsonSheet(
        workbook,
        'Destination Queries',
        destinationQueryRows.map((row) => ({
          Destination: row.destination,
          Queries: Number(row.queries || 0),
          Confirmed: Number(row.confirmed || 0),
          Cancelled: Number(row.cancelled || 0),
          ConversionPercent: Number(row.conversionPercent || 0),
        })),
      );
      addJsonSheet(
        workbook,
        'Confirmation Trends',
        confirmationTrendRows.map((row) => ({
          Month: row.label,
          Confirmed: Number(row.confirmed || 0),
          Cancelled: Number(row.cancelled || 0),
          ConversionPercent: Number(row.conversionPercent || 0),
        })),
      );
      addJsonSheet(
        workbook,
        'Revenue Summary',
        revenueSummaryCards.map((item) => ({
          Metric: item.label,
          Value: item.value,
          Note: item.sub || '',
        })),
      );
      addJsonSheet(
        workbook,
        'Verified Payment Revenue',
        travelDateRevenueRows.map((row) => ({
          Month: row.label,
          Revenue: Number(row.revenue || 0),
          RevenueLabel: row.revenueLabel || formatCompactCurrency(row.revenue),
          Bookings: Number(row.bookings || 0),
        })),
      );
      addJsonSheet(
        workbook,
        'Monthly Bookings',
        monthlyBookingRows.map((row) => ({
          Month: row.label,
          Bookings: Number(row.bookings || 0),
        })),
      );
      addJsonSheet(
        workbook,
        'Destination Profit',
        destinationProfitRows.map((row) => ({
          Destination: row.destination,
          TotalAmount: Number(row.grossRevenue || row.revenue || 0),
          TotalAmountLabel: row.grossRevenueLabel || `₹${formatPlainNumber(row.grossRevenue || row.revenue)}`,
          Revenue: Number(row.revenue || 0),
          RevenueLabel: row.revenueLabel,
          PendingReview: Number(row.pendingRevenue || 0),
          PendingReviewLabel: Number(row.pendingRevenue || 0) > 0
            ? formatPlainNumber(row.pendingRevenue)
            : '-',
          OfferDiscount: Number(row.offerDiscount || 0),
          OfferDiscountLabel: Number(row.offerDiscount || 0) > 0
            ? `-${formatPlainNumber(row.offerDiscount)}`
            : '-',
          OfferDetails: row.offerLabel || '',
          DMCCost: Number(row.cost || 0),
          DMCCostLabel: row.costLabel,
          Profit: Number(row.profit || 0),
          ProfitLabel: row.profitLabel,
          MarginPercent: Number(row.marginPercent || 0),
          Bookings: Number(row.bookings || 0),
        })),
      );
      addJsonSheet(
        workbook,
        'Tax Summary',
        taxSummaryRows.map((row) => ({
          Section: row.section,
          Total: row.total,
          Status: row.status,
          Note: row.rateLabel,
        })),
      );

      XLSX.writeFile(workbook, `holiday-circuit-${period}-${mode}-report.xlsx`);
    } finally {
      window.setTimeout(() => setActiveExport(''), 300);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col gap-6  max-w-7xl mx-auto text-slate-800 pb-1 bg-slate-50 min-h-screen"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Advanced Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive financial insights and tax reporting</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1 flex-nowrap whitespace-nowrap">
              <PeriodDropdownTab
                active={period === 'monthly'}
                label="Monthly"
                selectedLabel={selectedMonthLabel}
                menuOpen={monthMenuOpen}
                onSelectTab={() => setPeriod('monthly')}
                onToggleMenu={() => {
                  setPeriod('monthly');
                  setMonthMenuOpen((isOpen) => !isOpen);
                }}
              />
              <PeriodDropdownTab
                active={period === 'yearly'}
                label="Yearly"
                selectedLabel={selectedYearLabel}
                menuOpen={yearMenuOpen}
                onSelectTab={() => {
                  setMonthMenuOpen(false);
                  setPeriod('yearly');
                }}
                onToggleMenu={() => {
                  setMonthMenuOpen(false);
                  setPeriod('yearly');
                  setYearMenuOpen((isOpen) => !isOpen);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setMonthMenuOpen(false);
                  setYearMenuOpen(false);
                  setPeriod((prev) => (prev === 'custom' ? 'monthly' : 'custom'));
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out cursor-pointer relative z-10 whitespace-nowrap shrink-0 ${period === 'custom'
                  ? 'text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {period === 'custom' && (
                  <motion.div
                    layoutId="activePeriodTab"
                    className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-full shadow -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Calendar className="w-3.5 h-3.5" />
                Custom Date
              </button>
            </div>
            {period === 'monthly' && monthMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Month</label>
                  <input
                    type="month"
                    value={effectiveSelectedTaxMonth}
                    onChange={(e) => {
                      setSelectedTaxDate('');
                      setSelectedTaxMonth(e.target.value);
                    }}
                    className="mt-1 w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
            {period === 'yearly' && yearMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2 mb-2 select-none">
                    <button
                      type="button"
                      onClick={() => setPickerYearStart((prev) => prev - 12)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {pickerYearStart} - {pickerYearStart + 11}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickerYearStart((prev) => prev + 12)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Array.from({ length: 12 }, (_, idx) => pickerYearStart + idx).map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setSelectedTaxYear(String(year));
                        }}
                        className={`rounded-lg py-2 text-center text-xs font-semibold transition cursor-pointer ${effectiveSelectedTaxYear === String(year)
                          ? 'bg-slate-900 text-white font-bold shadow-sm'
                          : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <ExportButton
              icon={FileText}
              label={`${periodLabel} PDF`}
              color="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5"
              onClick={() => handlePrintReport('overview')}
              disabled={!canExportOverview}
              loading={activeExport === 'overview-pdf'}
            />
            <ExportButton
              icon={FileSpreadsheet}
              label={`${periodLabel} Excel`}
              color="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
              onClick={() => handleExcelExport('overview')}
              disabled={!canExportOverview}
              loading={activeExport === 'overview-excel'}
            />
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {period === 'custom' && (
          <motion.div
            key="custom-range-panel"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Custom Date Range</h3>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      if (customRangeError) setCustomRangeError("");
                    }}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-inner outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      if (customRangeError) setCustomRangeError("");
                    }}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-inner outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  className="h-10 cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-850 px-6 text-xs font-bold text-white transition-all shadow-sm hover:shadow active:scale-95 duration-200"
                >
                  Apply
                </button>
              </div>
              {customRangeError && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  {customRangeError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            data={activeMetrics[key]}
            icon={icon}
            loading={loading}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 shadow-md border border-slate-800">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-wide">Detailed Analytics Reports</h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Explore detailed query trends and revenue insights by category.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={() => setShowQueryModal(true)}
            className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.25)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            Query Analytics
          </button>
          <button
            type="button"
            onClick={() => setShowRevenueModal(true)}
            className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-750 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <IndianRupee className="w-3.5 h-3.5 shrink-0" />
            Revenue Analytics
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
      >
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

        <AnimatedChart key={period} chartData={chartData} onPointClick={handleChartPointClick} />

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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200/85 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-transparent gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Tax Summary</h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Period: {loading ? 'Loading...' : activeTaxSummary.periodLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => handleExcelExport('tax')}
              disabled={!canExportTax}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 duration-200 cursor-pointer ${canExportTax
                ? 'bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white hover:opacity-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100'
                }`}
            >
              <Download className="w-3.5 h-3.5" />
              {activeExport === 'tax-excel' ? 'Preparing report...' : `Download ${periodLabel} Tax Report`}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50/30">
          <TaxCard
            title="Total GST Collected"
            subtitle="Goods & Services Tax"
            total={activeTaxSummary.gst.total}
            totalColor="from-blue-600 to-indigo-600"
            gradientClass="from-blue-50/60 via-white to-blue-50/10"
            borderClass="border-blue-100/70 hover:border-blue-300/80 hover:shadow-blue-500/5"
            icon={Receipt}
            iconBg="bg-blue-50 text-blue-500 border border-blue-100/30"
            iconColor="text-blue-500"
            rateLabel={activeTaxSummary.gst.rateLabel}
            status={activeTaxSummary.gst.status}
            breakdown={activeTaxSummary.gst.breakdown}
            loading={loading}
          />

          <TaxCard
            title="Total TCS"
            subtitle="Tax Collected at Source"
            total={activeTaxSummary.tcs.total}
            totalColor="from-amber-600 to-orange-500"
            gradientClass="from-amber-50/60 via-white to-amber-50/10"
            borderClass="border-amber-100/70 hover:border-amber-300/80 hover:shadow-amber-500/5"
            icon={Coins}
            iconBg="bg-amber-50 text-amber-500 border border-amber-100/30"
            iconColor="text-amber-500"
            rateLabel={activeTaxSummary.tcs.rateLabel}
            status={activeTaxSummary.tcs.status}
            breakdown={activeTaxSummary.tcs.breakdown}
            loading={loading}
          />

          <TaxCard
            title="Total TDS"
            subtitle="Tax Deducted at Source"
            total={tdsSummary.total}
            totalColor="from-emerald-600 to-teal-500"
            gradientClass="from-emerald-50/60 via-white to-emerald-50/10"
            borderClass="border-emerald-100/70 hover:border-emerald-300/80 hover:shadow-emerald-500/5"
            icon={Percent}
            iconBg="bg-emerald-50 text-emerald-500 border border-emerald-100/30"
            iconColor="text-emerald-500"
            rateLabel={tdsSummary.rateLabel}
            status={tdsSummary.status}
            breakdown={tdsSummary.breakdown}
            loading={loading}
          />
        </div>

        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-800/80">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Total Tax Collected</p>
            <p className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              {loading ? '...' : activeTaxSummary.summaryBar.totalTaxCollected}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Tax as % of Revenue</p>
            <p className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {loading ? '...' : activeTaxSummary.summaryBar.taxAsPercent}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Compliance Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${complianceIsHealthy ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
              <span className={`text-sm font-bold tracking-wide ${complianceIsHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                {loading ? 'Loading...' : activeTaxSummary.summaryBar.complianceStatus}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Next Filing Due</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400 tracking-wide">
                {loading ? generatedOnLabel : activeTaxSummary.summaryBar.nextFilingDue}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-base font-bold text-slate-800">Download Complete Audit Report</h2>
          <p className="text-xs text-slate-400 mt-1">Generate comprehensive financial audit report including all transactions, tax summaries, and analytics</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ExportButton
            icon={FileText}
            label={`${periodLabel} Audit PDF`}
            color="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5"
            onClick={() => handlePrintReport('audit')}
            disabled={!canExportAudit}
            loading={activeExport === 'audit-pdf'}
          />
          <ExportButton
            icon={FileSpreadsheet}
            label={`${periodLabel} Audit Excel`}
            color="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
            onClick={() => handleExcelExport('audit')}
            disabled={!canExportAudit}
            loading={activeExport === 'audit-excel'}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {showStatsModal && (
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
                            const amount = (
                              isStatsYearlyView
                                ? getPaymentAmountInYear(paymentEntries, statsModalYear)
                                : getPaymentAmountInMonth(paymentEntries, statsPaymentYearMonth)
                            ) || Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
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
                                    <p className="text-[11px] font-black text-slate-850 leading-tight">
                                      ₹{formatPlainNumber(amount)}
                                    </p>
                                    <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border leading-none mt-0.5 ${statusBadge}`}>
                                      {status}
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
        )}

        {/* Query Analytics Modal */}
        {showQueryModal && (
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
                        <div className="flex items-center gap-1.5">
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
        )}

        {/* Revenue Analytics Modal */}
        {showRevenueModal && (
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedAnalytics;
