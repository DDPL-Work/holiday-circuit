import React from "react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Percent,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

export const MONTH_SEQUENCE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const CONFIRMED_STATS_PAYMENT_STATUSES = new Set(['Partially Paid', 'Partially_Paid', 'Paid']);

export const parseValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatYearMonthFromDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const isDateInYearMonth = (date, yearMonth) =>
  Boolean(date && yearMonth && formatYearMonthFromDate(date) === yearMonth);

export const isDateInYear = (date, year) =>
  Boolean(date && year && date.getFullYear() === Number(year));

export const formatDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const formatInstallmentDateLabel = (date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export const getPrimaryTravelDate = (record = {}) =>
  parseValidDate(record.query?.startDate || record.queryId?.startDate || record.tripSnapshot?.startDate) ||
  parseValidDate((record.items || []).find((item) => item.query?.startDate)?.query?.startDate);

export const hasTravelInMonth = (record = {}, targetYearMonth = '') => {
  if (record.batchNumber || record.settlementType === 'bulk') {
    const batchDate = parseValidDate(record.invoiceDate || record.submittedAt || record.createdAt);
    return isDateInYearMonth(batchDate, targetYearMonth);
  }

  const directTravelDate = getPrimaryTravelDate(record);
  if (isDateInYearMonth(directTravelDate, targetYearMonth)) return true;

  return (record.items || []).some((item) => {
    const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
    return isDateInYearMonth(itemTravelDate, targetYearMonth);
  });
};

export const hasTravelInYear = (record = {}, targetYear = '') => {
  if (record.batchNumber || record.settlementType === 'bulk') {
    const batchDate = parseValidDate(record.invoiceDate || record.submittedAt || record.createdAt);
    return isDateInYear(batchDate, targetYear);
  }

  const directTravelDate = getPrimaryTravelDate(record);
  if (isDateInYear(directTravelDate, targetYear)) return true;

  return (record.items || []).some((item) => {
    const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
    return isDateInYear(itemTravelDate, targetYear);
  });
};

export const hasTravelInMonthForProfit = (record = {}, targetYearMonth = '') => {
  const directTravelDate = getPrimaryTravelDate(record);
  if (isDateInYearMonth(directTravelDate, targetYearMonth)) return true;

  return (record.items || []).some((item) => {
    const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
    return isDateInYearMonth(itemTravelDate, targetYearMonth);
  });
};

export const hasTravelInYearForProfit = (record = {}, targetYear = '') => {
  const directTravelDate = getPrimaryTravelDate(record);
  if (isDateInYear(directTravelDate, targetYear)) return true;

  return (record.items || []).some((item) => {
    const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
    return isDateInYear(itemTravelDate, targetYear);
  });
};

export const formatShortDate = (value) => {
  const date = parseValidDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getTravelDateLabel = (record = {}) => {
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

export const parseInvoiceDate = (invoice) => {
  const source =
    invoice?.paymentSubmission?.paymentDate ||
    invoice?.paymentSubmission?.submittedAt ||
    invoice?.createdAt;
  return parseValidDate(source);
};

export const parseInvoiceCreateDate = (invoice = {}) =>
  parseValidDate(invoice.createdAt);

export const parseInvoiceTravelDate = (invoice = {}) =>
  getPrimaryTravelDate(invoice) || parseInvoiceDate(invoice);

export const parseAgentInstallmentDate = (entry = {}) =>
  parseValidDate(
    entry.paymentDateValue ||
    entry.paymentDate ||
    entry.date ||
    entry.createdAt
  );

export const getInvoiceTotalAmount = (invoice = {}) => {
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

export const getQuotationOpsPayableAmount = (quotation = {}) => {
  const servicesTotal = Array.isArray(quotation.services)
    ? quotation.services.reduce((sum, service) => sum + Number(service?.totalInInr || service?.total || 0), 0)
    : 0;

  return Math.max(
    Number(quotation.pricing?.totalAmount || 0),
    Number(quotation.totalAmount || 0),
    servicesTotal,
  );
};

export const getAgentPaymentEntries = (invoice = {}) => {
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

export const isVerifiedPaymentEntry = (entry = {}) => {
  const status = String(entry.status || entry.verificationStatus || '').toLowerCase();
  if (!status) return true;
  return ['verified', 'approved', 'accepted', 'paid', 'settled', 'completed'].some((term) =>
    status.includes(term)
  );
};

export const getInvoicePaymentDate = (invoice = {}) => {
  const entries = getAgentPaymentEntries(invoice);
  if (entries.length > 0) {
    const verified = entries.find(isVerifiedPaymentEntry);
    if (verified && verified.date) return verified.date;
    if (entries[0] && entries[0].date) return entries[0].date;
  }
  if (invoice.paymentStatus === 'Unpaid') return null;
  return parseInvoiceDate(invoice);
};

export const isDateOnOrBeforeDay = (date, cutoffDate) => {
  if (!date || !cutoffDate) return false;
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  const normalizedCutoff = new Date(cutoffDate);
  normalizedCutoff.setHours(23, 59, 59, 999);
  return normalizedDate <= normalizedCutoff;
};

export const getPaymentAmountInMonth = (entries = [], targetYearMonth = '') =>
  entries.reduce((sum, entry) => (
    isDateInYearMonth(entry.date, targetYearMonth)
      ? sum + Number(entry.amount || 0)
      : sum
  ), 0);

export const getPaymentAmountInYear = (entries = [], targetYear = '') =>
  entries.reduce((sum, entry) => (
    isDateInYear(entry.date, targetYear)
      ? sum + Number(entry.amount || 0)
      : sum
  ), 0);

export const hasAgentPaymentInMonth = (invoice = {}, targetYearMonth = '') =>
  getAgentPaymentEntries(invoice).some((entry) => isDateInYearMonth(entry.date, targetYearMonth));

export const hasAgentPaymentInYear = (invoice = {}, targetYear = '') =>
  getAgentPaymentEntries(invoice).some((entry) => isDateInYear(entry.date, targetYear));

export const parseInternalInvoiceDate = (invoice) => {
  const source =
    invoice?.payoutDateValue ||
    invoice?.payoutDate ||
    invoice?.submittedAt ||
    invoice?.invoiceDate ||
    invoice?.createdAt;
  return parseValidDate(source);
};

export const parseDmcInstallmentDate = (entry = {}) =>
  parseValidDate(
    entry.paymentDateValue ||
    entry.payoutDateValue ||
    entry.paymentDate ||
    entry.payoutDate ||
    entry.date ||
    entry.createdAt
  );

export const getDmcPaymentEntries = (invoice = {}) => {
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

export const hasDmcPaymentInMonth = (invoice = {}, targetYearMonth = '') =>
  getDmcPaymentEntries(invoice).some((entry) => isDateInYearMonth(entry.date, targetYearMonth));

export const hasDmcPaymentInYear = (invoice = {}, targetYear = '') =>
  getDmcPaymentEntries(invoice).some((entry) => isDateInYear(entry.date, targetYear));

export const getInvoicePaidAmount = (invoice) => {
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

export const getInvoiceMonthVerifiedPayment = (invoice = {}, targetYearMonth = '') => {
  const entries = getAgentPaymentEntries(invoice);
  if (entries.length > 0) {
    return entries.reduce((sum, entry) => (
      isVerifiedPaymentEntry(entry) && isDateInYearMonth(entry.date, targetYearMonth)
        ? sum + Number(entry.amount || 0)
        : sum
    ), 0);
  }
  return 0;
};

export const getInvoiceMonthVerifiedPaymentDate = (invoice = {}, targetYearMonth = '') => {
  const entries = getAgentPaymentEntries(invoice);
  const verifiedInMonth = entries.filter(
    (entry) => isVerifiedPaymentEntry(entry) && isDateInYearMonth(entry.date, targetYearMonth)
  );
  if (verifiedInMonth.length > 0) {
    const sorted = [...verifiedInMonth].sort((left, right) => (left.date?.getTime?.() || 0) - (right.date?.getTime?.() || 0));
    return sorted[0]?.date || null;
  }
  return null;
};

export const getInvoicePreTravelPaidAmount = (invoice = {}) => {
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

export const getInvoicePreTravelPaymentDate = (invoice = {}) => {
  const travelDate = parseInvoiceTravelDate(invoice);
  if (!travelDate) return null;

  const entries = getAgentPaymentEntries(invoice)
    .filter((entry) => isVerifiedPaymentEntry(entry) && isDateOnOrBeforeDay(entry.date, travelDate))
    .sort((left, right) => (left.date?.getTime?.() || 0) - (right.date?.getTime?.() || 0));

  if (entries[0]?.date) return entries[0].date;

  const paymentDate = getInvoicePaymentDate(invoice);
  return isDateOnOrBeforeDay(paymentDate, travelDate) ? paymentDate : null;
};

export const getChecklistQueryKey = (record = {}) =>
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

export const normalizeStatsQueryKey = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return normalizeStatsQueryKey(value._id || value.id || value.queryId || value.queryCode || '');
  }

  const key = String(value).trim();
  return key && key !== '[object Object]' ? key : '';
};

export const addStatsQueryKey = (set, value) => {
  const key = normalizeStatsQueryKey(value);
  if (key) set.add(key);
};

export const addStatsItemQueryKeys = (set, item = {}) => {
  addStatsQueryKey(set, item.query);
  addStatsQueryKey(set, item.query?._id);
  addStatsQueryKey(set, item.query?.queryId);
  addStatsQueryKey(set, item.queryCode);
  addStatsQueryKey(set, item.queryId);
};

export const getStatsRecordQueryKeys = (record = {}) => {
  const keys = new Set();

  addStatsQueryKey(keys, record.query);
  addStatsQueryKey(keys, record.query?._id);
  addStatsQueryKey(keys, record.query?.queryId);
  addStatsQueryKey(keys, record.queryCode);
  addStatsQueryKey(keys, record.queryId);
  addStatsQueryKey(keys, record.queryId?._id);
  addStatsQueryKey(keys, record.queryId?.queryId);
  addStatsQueryKey(keys, record.tripSnapshot?.queryId);

  (record.coveredQueries || []).forEach((covered) => addStatsItemQueryKeys(keys, covered));
  (record.items || []).forEach((item) => addStatsItemQueryKeys(keys, item));

  return keys;
};

export const getStatsBulkChildQueryKeys = (invoice = {}) => {
  const keys = new Set();
  (invoice.coveredQueries || []).forEach((covered) => addStatsItemQueryKeys(keys, covered));
  (invoice.items || []).forEach((item) => addStatsItemQueryKeys(keys, item));

  if (!keys.size) {
    getStatsRecordQueryKeys(invoice).forEach((key) => keys.add(key));
  }

  return keys;
};

export const statsRecordMatchesQueryKeys = (record = {}, allowedKeys = new Set()) => {
  if (!allowedKeys.size) return false;
  return Array.from(getStatsRecordQueryKeys(record)).some((key) => allowedKeys.has(key));
};

export const isClientApprovedChecklistRecord = (record = {}) => {
  const query = record.query || record.queryId || {};
  return (
    record.isQuotationChecklistRow ||
    String(record.status || '').trim() === 'Confirmed' ||
    String(record.paymentStatus || '').trim() === 'Client Approved' ||
    String(query.agentStatus || '').trim() === 'Client Approved'
  );
};

export const normalizeQuotationChecklistRow = (quotation = {}) => {
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

export const getDmcPaidAmount = (invoice) => {
  const installments = invoice.payoutInstallments || [];
  if (Array.isArray(installments) && installments.length > 0) {
    return installments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }
  if (invoice.status === 'Paid' || invoice.status === 'Settled') return Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
  return 0;
};

export const formatTruncatedCompactDecimal = (value) => {
  const truncated = Math.trunc(Number(value || 0) * 100) / 100;
  return truncated.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};

export const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.floor(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';

  if (absolute >= 10000000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 10000000)}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}\u20B9${formatTruncatedCompactDecimal(absolute / 100000)}L`;
  }

  return `${sign}\u20B9${absolute.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const parseReportCurrencyValue = (value) => {
  const raw = String(value || '').trim();
  const numeric = Number(raw.replace(/[^0-9.-]/g, '')) || 0;
  const lower = raw.toLowerCase();
  if (lower.includes('cr')) return numeric * 10000000;
  if (lower.includes('l')) return numeric * 100000;
  return numeric;
};

export const getRevenueReportTotal = (report = {}) => {
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

export const describeSvgPieArc = (cx, cy, radius, startAngle, endAngle) => {
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

export const getPiePoint = (cx, cy, radius, angle) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

export const yearlyPieColors = [
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

export const yearlyPieLabelSlots = [
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

export const createEmptyMetric = (label, sub, color, bg, iconColor, changeTone = 'positive') => ({
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

export const createDefaultPeriodData = () => ({
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

export const createDefaultReports = () => ({
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

export const defaultAnalytics = {
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
  profitAgentInvoices: [],
  profitInternalInvoices: [],
  bulkProfitSummaries: [],
};

export const getParticipantDisplayName = (participant = {}) =>
  participant.companyName || participant.name || participant.email || '';

export const buildParticipantOption = (participant = {}, fallbackApproved = true) => {
  const value = getParticipantDisplayName(participant);
  const isApproved = participant.adminApproved ?? fallbackApproved;

  return {
    id: participant.id || participant._id || value,
    value,
    label: `${value}${isApproved ? '' : ' (Admin not approved)'}`,
    approved: Boolean(isApproved),
  };
};

export const sortParticipantOptions = (options = []) =>
  options
    .filter((option) => option.value && option.value !== '-')
    .sort((left, right) => left.value.localeCompare(right.value));

export const normalizeMonthLabel = (label) => {
  const normalized = String(label || '').trim().slice(0, 3).toLowerCase();
  const match = MONTH_SEQUENCE.find((month) => month.toLowerCase() === normalized);
  return match || String(label || '').trim();
};

export const reorderChartByCalendar = (chart = {}) => {
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

export const hasMeaningfulChartData = (chart = {}) =>
  ['inward', 'outward'].some((key) => Array.isArray(chart[key]) && chart[key].some((value) => Number(value || 0) > 0));

export const hasMeaningfulTaxData = (summary = {}) =>
  [summary?.gst?.total, summary?.tcs?.total, summary?.tds?.total || summary?.tdf?.total, summary?.summaryBar?.totalTaxCollected].some(
    (value) => Number(String(value || '').replace(/[^0-9.-]/g, '')) > 0,
  );

export const formatTaxMonthValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const formatTaxYearValue = (date) => String(date.getFullYear());

export const createReportWindow = (title, bodyMarkup) => {
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

export const cardStyles = {
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

export const formatCurrency = (val, currency = 'INR') => {
  const number = Number(val || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatPlainNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const formatOneDecimalPercent = (value) =>
  Number(value || 0).toFixed(1).replace(/\.0$/, '');

export const summaryCardIcons = {
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

export const summaryCardStyles = {
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

export const defaultSummaryStyle = {
  bg: 'from-slate-50/70 via-white to-slate-50/15',
  border: 'border-slate-100 hover:border-slate-300',
  accent: 'border-b-4 border-b-slate-400',
  valColor: 'text-slate-800',
  shadow: 'shadow-slate-500/5'
};

export const shineStyle = `
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
