import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as XLSX from "xlsx";
import API from "../../utils/Api";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import gsap from "gsap";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Receipt,
  ReceiptIndianRupee,
  Coins,
  Percent,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  IndianRupee,
  Star,
  Sparkles,
  MapPin,
  Flag,
  User,
  Info,
  Briefcase,
} from "lucide-react";
import StatsModal from "./AdvancedAnalyticsComponents/Modals/StatsModal";
import QueryAnalyticsModal from "./AdvancedAnalyticsComponents/Modals/QueryAnalyticsModal";
import RevenueAnalyticsModal from "./AdvancedAnalyticsComponents/Modals/RevenueAnalyticsModal";
import RevenueAnalyticsChart from "./AdvancedAnalyticsComponents/Charts/RevenueAnalyticsChart";
import AnimatedChart from "./AdvancedAnalyticsComponents/Charts/AnimatedChart";
import RevenueChecklistTable from "./AdvancedAnalyticsComponents/Tables/RevenueChecklistTable";
import ReportTable from "./AdvancedAnalyticsComponents/Tables/ReportTable";
import MetricCard from "./AdvancedAnalyticsComponents/Cards/MetricCard";
import TaxCard from "./AdvancedAnalyticsComponents/Cards/TaxCard";
import ReportSummaryCard from "./AdvancedAnalyticsComponents/Cards/ReportSummaryCard";
import PeriodDropdownTab from "./AdvancedAnalyticsComponents/Buttons/PeriodDropdownTab";
import ExportButton from "./AdvancedAnalyticsComponents/Buttons/ExportButton";
import PayoutBreakdownDropdown from "./AdvancedAnalyticsComponents/Dropdowns/PayoutBreakdownDropdown";
import ReportBars from "./AdvancedAnalyticsComponents/Reports/ReportBars";
import {
  MONTH_SEQUENCE,
  CONFIRMED_STATS_PAYMENT_STATUSES,
  parseValidDate,
  formatYearMonthFromDate,
  isDateInYearMonth,
  isDateInYear,
  formatDateKey,
  formatInstallmentDateLabel,
  getPrimaryTravelDate,
  hasTravelInMonth,
  hasTravelInYear,
  hasTravelInMonthForProfit,
  hasTravelInYearForProfit,
  formatShortDate,
  getTravelDateLabel,
  parseInvoiceDate,
  parseInvoiceCreateDate,
  parseInvoiceTravelDate,
  parseAgentInstallmentDate,
  getInvoiceTotalAmount,
  getQuotationOpsPayableAmount,
  getAgentPaymentEntries,
  isVerifiedPaymentEntry,
  getInvoicePaymentDate,
  isDateOnOrBeforeDay,
  getPaymentAmountInMonth,
  getPaymentAmountInYear,
  hasAgentPaymentInMonth,
  hasAgentPaymentInYear,
  parseInternalInvoiceDate,
  parseDmcInstallmentDate,
  getDmcPaymentEntries,
  hasDmcPaymentInMonth,
  hasDmcPaymentInYear,
  getInvoicePaidAmount,
  getInvoiceMonthVerifiedPayment,
  getInvoiceMonthVerifiedPaymentDate,
  getInvoicePreTravelPaidAmount,
  getInvoicePreTravelPaymentDate,
  getChecklistQueryKey,
  normalizeStatsQueryKey,
  addStatsQueryKey,
  addStatsItemQueryKeys,
  getStatsRecordQueryKeys,
  getStatsBulkChildQueryKeys,
  statsRecordMatchesQueryKeys,
  isClientApprovedChecklistRecord,
  normalizeQuotationChecklistRow,
  getDmcPaidAmount,
  formatTruncatedCompactDecimal,
  formatCompactCurrency,
  parseReportCurrencyValue,
  getRevenueReportTotal,
  describeSvgPieArc,
  getPiePoint,
  yearlyPieColors,
  yearlyPieLabelSlots,
  createEmptyMetric,
  createDefaultPeriodData,
  createDefaultReports,
  defaultAnalytics,
  getParticipantDisplayName,
  buildParticipantOption,
  sortParticipantOptions,
  normalizeMonthLabel,
  reorderChartByCalendar,
  hasMeaningfulChartData,
  hasMeaningfulTaxData,
  formatTaxMonthValue,
  formatTaxYearValue,
  createReportWindow,
  cardStyles,
  formatCurrency,
  formatPlainNumber,
  formatOneDecimalPercent,
  summaryCardIcons,
  summaryCardStyles,
  defaultSummaryStyle,
  shineStyle,
} from "./AdvancedAnalyticsComponents/utils/formatter";

const AdvancedAnalytics = () => {
  const [period, setPeriod] = useState("monthly");
  const [analyticsData, setAnalyticsData] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeExport, setActiveExport] = useState("");
  const [selectedTaxMonth, setSelectedTaxMonth] = useState("");
  const [selectedTaxYear, setSelectedTaxYear] = useState("");
  const [selectedTaxDate, setSelectedTaxDate] = useState("");
  const [destinationPage, setDestinationPage] = useState(1);
  const [profitabilityPage, setProfitabilityPage] = useState(1);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [quarterMenuOpen, setQuarterMenuOpen] = useState(false);
  const [selectedTaxQuarter, setSelectedTaxQuarter] = useState("");
  const [pickerQuarterYear, setPickerQuarterYear] = useState(() =>
    new Date().getFullYear()
  );
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [pickerYearStart, setPickerYearStart] = useState(() => {
    const currentYear = new Date().getFullYear();
    return Math.floor(currentYear / 12) * 12;
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showRevenueChecklist, setShowRevenueChecklist] = useState(true);
  const [selectedPastMonthOverride, setSelectedPastMonthOverride] =
    useState("");
  const [selectedUpcomingMonthOverride, setSelectedUpcomingMonthOverride] =
    useState("");
  const [statsModalMonth, setStatsModalMonth] = useState("");
  const [statsModalMode, setStatsModalMode] = useState("agent");
  const [statsSelectedQueries, setStatsSelectedQueries] = useState([]);
  const [statsSelectedAgent, setStatsSelectedAgent] = useState("all");
  const [statsSelectedDmc, setStatsSelectedDmc] = useState("all");
  const [showPayoutDropdown, setShowPayoutDropdown] = useState(false);
  const payoutDropdownRef = useRef(null);

  const { user } = useSelector((state) => state.auth || {});

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMonthMenuOpen(false);
        setQuarterMenuOpen(false);
        setYearMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPayoutDropdown &&
        payoutDropdownRef.current &&
        !payoutDropdownRef.current.contains(event.target)
      ) {
        if (!event.target.closest(".group\\/payout")) {
          setShowPayoutDropdown(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPayoutDropdown]);

  // Custom global date range state variables
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customRangeError, setCustomRangeError] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });

  const defaultTaxMonthValue = useMemo(() => {
    const generatedDate = analyticsData?.generatedOn
      ? new Date(analyticsData.generatedOn)
      : new Date();
    return formatTaxMonthValue(generatedDate);
  }, [analyticsData?.generatedOn]);

  const defaultTaxYearValue = useMemo(() => {
    const generatedDate = analyticsData?.generatedOn
      ? new Date(analyticsData.generatedOn)
      : new Date();
    return formatTaxYearValue(generatedDate);
  }, [analyticsData?.generatedOn]);

  const defaultTaxQuarterValue = useMemo(() => {
    const generatedDate = analyticsData?.generatedOn
      ? new Date(analyticsData.generatedOn)
      : new Date();
    const q = Math.floor(generatedDate.getMonth() / 3) + 1;
    return `${generatedDate.getFullYear()}-Q${q}`;
  }, [analyticsData?.generatedOn]);

  const effectiveSelectedTaxMonth = selectedTaxMonth || defaultTaxMonthValue;
  const effectiveSelectedTaxQuarter = selectedTaxQuarter || defaultTaxQuarterValue;
  const effectiveSelectedTaxYear = selectedTaxYear || defaultTaxYearValue;

  useEffect(() => {
    setSelectedPastMonthOverride("");
    setSelectedUpcomingMonthOverride("");
  }, [
    period,
    effectiveSelectedTaxMonth,
    effectiveSelectedTaxQuarter,
    effectiveSelectedTaxYear,
  ]);

  const checklistData = useMemo(() => {
    const invoices = Array.isArray(analyticsData.invoices)
      ? analyticsData.invoices
      : [];
    const internalInvoices = Array.isArray(analyticsData.internalInvoices)
      ? analyticsData.internalInvoices
      : [];
    const bulkProfitSummaries = Array.isArray(analyticsData.bulkProfitSummaries)
      ? analyticsData.bulkProfitSummaries
      : [];

    const getBulkProfitSummary = (inv = {}) =>
      bulkProfitSummaries.find(
        (summary) =>
          summary.id === inv._id ||
          summary.id === inv.id ||
          summary.batchNumber === inv.batchNumber ||
          summary.invoiceNumber === inv.invoiceNumber,
      );

    const getBulkInvoiceCost = (inv = {}, queryKey = null) => {
      const totalExpected = Number(
        inv.summary?.grandTotal ||
          inv.claimedSummary?.grandTotal ||
          inv.payoutAmount ||
          0,
      );
      const items = Array.isArray(inv.items) ? inv.items : [];
      if (!queryKey || !items.length) return totalExpected;

      const queryKeys =
        queryKey instanceof Set ? queryKey : new Set([queryKey]);
      if (!queryKeys.size) return totalExpected;

      const queryItems = items.filter((item) =>
        statsRecordMatchesQueryKeys(item, queryKeys),
      );
      const rawItemTotal = queryItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0) + Number(item.tax || 0),
        0,
      );
      const itemsTotal = items.reduce(
        (sum, item) => sum + Number(item.subtotal || 0) + Number(item.tax || 0),
        0,
      );

      return itemsTotal > 0
        ? rawItemTotal * (totalExpected / itemsTotal)
        : rawItemTotal;
    };

    const invoiceQueryKeys = invoices.reduce((set, invoice) => {
      const key = getChecklistQueryKey(invoice);
      if (key) set.add(key);
      return set;
    }, new Set());
    const quotations = Array.isArray(analyticsData.quotations)
      ? analyticsData.quotations
      : [];
    const checklistRows = [
      ...invoices.map((inv) => ({ ...inv })),
      ...quotations
        .filter((quotation) => {
          const key = getChecklistQueryKey(quotation);
          return !key || !invoiceQueryKeys.has(key);
        })
        .map(normalizeQuotationChecklistRow),
    ];

    checklistRows.forEach((invoice) => {
      const agentTotal = getInvoiceTotalAmount(invoice);
      const agentPaid = getInvoicePaidAmount(invoice);
      const agentKeys = getStatsRecordQueryKeys(invoice);

      let dmcCost = 0;
      let dmcPaid = 0;

      const matchingDmcInvoices = internalInvoices.filter((inv) =>
        statsRecordMatchesQueryKeys(inv, agentKeys),
      );

      matchingDmcInvoices.forEach((inv) => {
        const isBulk =
          inv.settlementType === "bulk" ||
          (inv.coveredQueries && inv.coveredQueries.length > 0);
        if (isBulk) {
          const queryCost = getBulkInvoiceCost(inv, agentKeys);
          dmcCost += queryCost;
          const totalExpected = Number(
            inv.summary?.grandTotal ||
              inv.claimedSummary?.grandTotal ||
              inv.payoutAmount ||
              0,
          );
          const totalDmcPaid = getDmcPaidAmount(inv);
          dmcPaid +=
            totalExpected > 0 ? queryCost * (totalDmcPaid / totalExpected) : 0;
        } else {
          dmcCost += Number(
            inv.summary?.grandTotal ||
              inv.claimedSummary?.grandTotal ||
              inv.payoutAmount ||
              0,
          );
          dmcPaid += getDmcPaidAmount(inv);
        }
      });

      invoice.computedMetrics = {
        incoming: agentTotal,
        incomingPaid: agentPaid,
        dueAgent: Math.max(0, agentTotal - agentPaid),
        outgoing: dmcCost,
        outgoingPaid: dmcPaid,
        upcomingDmc: Math.max(0, dmcCost - dmcPaid),
        grossProfit: agentTotal - dmcCost,
      };
    });

    let currentPeriodStr = "";
    let pastPeriodStr = selectedPastMonthOverride;
    let upcomingPeriodStr = selectedUpcomingMonthOverride;

    if (period === "monthly") {
      const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth.split("-").map(Number);
      currentPeriodStr = effectiveSelectedTaxMonth;
      
      if (!pastPeriodStr) {
        const pastDate = new Date(selectedYear, selectedMonth - 2, 1);
        pastPeriodStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, "0")}`;
      }
      if (!upcomingPeriodStr) {
        const upcomingDate = new Date(selectedYear, selectedMonth, 1);
        upcomingPeriodStr = `${upcomingDate.getFullYear()}-${String(upcomingDate.getMonth() + 1).padStart(2, "0")}`;
      }
    } else if (period === "quarterly") {
      currentPeriodStr = effectiveSelectedTaxQuarter;
      const [yStr, qStr] = effectiveSelectedTaxQuarter.split("-Q");
      const y = Number(yStr);
      const q = Number(qStr);
      
      if (!pastPeriodStr) {
        const pQ = q === 1 ? 4 : q - 1;
        const pY = q === 1 ? y - 1 : y;
        pastPeriodStr = `${pY}-Q${pQ}`;
      }
      if (!upcomingPeriodStr) {
        const uQ = q === 4 ? 1 : q + 1;
        const uY = q === 4 ? y + 1 : y;
        upcomingPeriodStr = `${uY}-Q${uQ}`;
      }
    } else if (period === "yearly") {
      currentPeriodStr = String(effectiveSelectedTaxYear);
      const y = Number(currentPeriodStr);
      
      if (!pastPeriodStr) {
        pastPeriodStr = String(y - 1);
      }
      if (!upcomingPeriodStr) {
        upcomingPeriodStr = String(y + 1);
      }
    }

    const groups = {
      past: [],
      current: [],
      upcoming: [],
    };

    checklistRows.forEach((invoice) => {
      // Use travel date if available; fall back to create date for grouping
      const travelDate = parseInvoiceTravelDate(invoice);
      const createDate = parseInvoiceCreateDate(invoice);
      const referenceDate = travelDate || createDate;
      if (!referenceDate) return;

      let referenceStr = "";
      if (period === "monthly") {
        referenceStr = formatYearMonthFromDate(referenceDate);
      } else if (period === "quarterly") {
        const q = Math.floor(referenceDate.getMonth() / 3) + 1;
        referenceStr = `${referenceDate.getFullYear()}-Q${q}`;
      } else if (period === "yearly") {
        referenceStr = String(referenceDate.getFullYear());
      }

      if (referenceStr === pastPeriodStr) {
        groups.past.push(invoice);
      } else if (referenceStr === currentPeriodStr) {
        groups.current.push(invoice);
      } else if (referenceStr === upcomingPeriodStr) {
        groups.upcoming.push(invoice);
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((left, right) => {
        const leftDate =
          key === "upcoming"
            ? parseInvoiceTravelDate(left)?.getTime() || 0
            : parseInvoiceCreateDate(left)?.getTime() || 0;
        const rightDate =
          key === "upcoming"
            ? parseInvoiceTravelDate(right)?.getTime() || 0
            : parseInvoiceCreateDate(right)?.getTime() || 0;
        return leftDate - rightDate;
      });
    });

    return groups;
  }, [
    analyticsData.invoices,
    analyticsData.quotations,
    analyticsData.internalInvoices,
    analyticsData.bulkProfitSummaries,
    period,
    effectiveSelectedTaxMonth,
    effectiveSelectedTaxQuarter,
    effectiveSelectedTaxYear,
    selectedPastMonthOverride,
    selectedUpcomingMonthOverride,
  ]);

  const pastMonthsList = useMemo(() => {
    const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth
      .split("-")
      .map(Number);
    const list = [];
    for (let i = 2; i <= 6; i++) {
      const date = new Date(selectedYear, selectedMonth - i, 1);
      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      list.push({ val, label });
    }
    return list;
  }, [effectiveSelectedTaxMonth]);

  useEffect(() => {
    if (yearMenuOpen) {
      const selectedYear =
        Number(effectiveSelectedTaxYear) || new Date().getFullYear();
      const startDecade = Math.floor(selectedYear / 12) * 12;
      setPickerYearStart(startDecade);
    }
  }, [yearMenuOpen, effectiveSelectedTaxYear]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (
          period === "custom" &&
          appliedCustomRange.start &&
          appliedCustomRange.end
        ) {
          params.startDate = appliedCustomRange.start;
          params.endDate = appliedCustomRange.end;
        } else if (period === "monthly") {
          if (selectedTaxDate) {
            params.startDate = selectedTaxDate;
            params.endDate = selectedTaxDate;
          } else if (effectiveSelectedTaxMonth) {
            const [yr, mn] = effectiveSelectedTaxMonth.split("-");
            params.startDate = `${yr}-${mn}-01`;
            const lastDay = new Date(Number(yr), Number(mn), 0).getDate();
            params.endDate = `${yr}-${mn}-${String(lastDay).padStart(2, "0")}`;
          }
        } else if (period === "quarterly" && effectiveSelectedTaxQuarter) {
          const [yr, q] = effectiveSelectedTaxQuarter.split("-Q");
          let startMonth, endMonth;
          if (q === "1") { startMonth = "01"; endMonth = "03"; }
          else if (q === "2") { startMonth = "04"; endMonth = "06"; }
          else if (q === "3") { startMonth = "07"; endMonth = "09"; }
          else if (q === "4") { startMonth = "10"; endMonth = "12"; }
          params.startDate = `${yr}-${startMonth}-01`;
          const lastDay = new Date(Number(yr), Number(endMonth), 0).getDate();
          params.endDate = `${yr}-${endMonth}-${String(lastDay).padStart(2, "0")}`;
        } else if (period === "yearly" && effectiveSelectedTaxYear) {
          params.startDate = `${effectiveSelectedTaxYear}-01-01`;
          params.endDate = `${effectiveSelectedTaxYear}-12-31`;
        }

        const { data } = await API.get("/admin/advanced-analytics", { params });
        setAnalyticsData(data?.data || defaultAnalytics);
      } catch (fetchError) {
        console.error(fetchError);
        setError(
          fetchError?.response?.data?.message ||
            "Failed to load advanced analytics",
        );
        setAnalyticsData(defaultAnalytics);
      } finally {
        setLoading(false);
      }
    };

    if (
      period === "custom" &&
      (!appliedCustomRange.start || !appliedCustomRange.end)
    ) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [
    period,
    appliedCustomRange,
    effectiveSelectedTaxMonth,
    effectiveSelectedTaxQuarter,
    effectiveSelectedTaxYear,
    selectedTaxDate,
  ]);

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
    setStatsModalMode(datasetIndex === 0 ? "agent" : "dmc");
    setStatsSelectedQueries([]);
    setStatsSelectedAgent("all");
    setStatsSelectedDmc("all");
    setShowStatsModal(true);
  }, []);

  const getYearMonthFromLabel = useCallback(
    (monthLabel) => {
      const yearStr = effectiveSelectedTaxMonth
        ? effectiveSelectedTaxMonth.split("-")[0]
        : String(new Date().getFullYear());
      const monthIndex = MONTH_SEQUENCE.findIndex(
        (m) => m.toLowerCase() === monthLabel.toLowerCase(),
      );
      const monthStr = String(monthIndex + 1).padStart(2, "0");
      return `${yearStr}-${monthStr}`;
    },
    [effectiveSelectedTaxMonth],
  );

  const getDaysInMonth = useCallback(
    (monthLabel) => {
      const year = effectiveSelectedTaxMonth
        ? Number(effectiveSelectedTaxMonth.split("-")[0])
        : new Date().getFullYear();
      const monthIndex = MONTH_SEQUENCE.findIndex(
        (m) => m.toLowerCase() === monthLabel.toLowerCase(),
      );
      return new Date(year, monthIndex + 1, 0).getDate();
    },
    [effectiveSelectedTaxMonth],
  );

  const isStatsYearlyView = period === "yearly";
  const statsModalYear = useMemo(() => {
    if (isStatsYearlyView) {
      return String(
        Number(statsModalMonth) ||
          Number(effectiveSelectedTaxYear) ||
          new Date().getFullYear(),
      );
    }
    return effectiveSelectedTaxMonth
      ? effectiveSelectedTaxMonth.split("-")[0]
      : String(new Date().getFullYear());
  }, [
    isStatsYearlyView,
    statsModalMonth,
    effectiveSelectedTaxYear,
    effectiveSelectedTaxMonth,
  ]);

  const statsModalPeriodLabel = isStatsYearlyView
    ? statsModalYear
    : `${statsModalMonth}${statsModalYear ? ` ${statsModalYear}` : ""}`.trim();

  const statsPaymentYearMonth = useMemo(
    () =>
      !isStatsYearlyView && statsModalMonth
        ? getYearMonthFromLabel(statsModalMonth)
        : "",
    [isStatsYearlyView, statsModalMonth, getYearMonthFromLabel],
  );

  const statsInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.invoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.invoices.filter((invoice) =>
        hasAgentPaymentInYear(invoice, statsModalYear),
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.invoices.filter((invoice) =>
      hasAgentPaymentInMonth(invoice, targetYearMonth),
    );
  }, [
    statsModalMonth,
    analyticsData.invoices,
    isStatsYearlyView,
    statsModalYear,
    getYearMonthFromLabel,
  ]);

  const statsInternalInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.internalInvoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.internalInvoices.filter((invoice) =>
        hasDmcPaymentInYear(invoice, statsModalYear),
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.internalInvoices.filter((invoice) =>
      hasDmcPaymentInMonth(invoice, targetYearMonth),
    );
  }, [
    statsModalMonth,
    analyticsData.internalInvoices,
    isStatsYearlyView,
    statsModalYear,
    getYearMonthFromLabel,
  ]);

  const statsTravelInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.invoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.invoices.filter((invoice) =>
        hasTravelInYear(invoice, statsModalYear),
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.invoices.filter((invoice) =>
      hasTravelInMonth(invoice, targetYearMonth),
    );
  }, [
    statsModalMonth,
    analyticsData.invoices,
    isStatsYearlyView,
    statsModalYear,
    getYearMonthFromLabel,
  ]);

  const statsProfitTravelInvoices = useMemo(() => {
    const profitInvoices = Array.isArray(analyticsData.profitAgentInvoices)
      ? analyticsData.profitAgentInvoices
      : [];
    const merged = new Map();

    [...(analyticsData.invoices || []), ...profitInvoices].forEach(
      (invoice) => {
        const key =
          invoice._id ||
          invoice.invoiceNumber ||
          invoice.query?.queryId ||
          JSON.stringify(invoice);
        merged.set(key, invoice);
      },
    );

    const invoices = Array.from(merged.values());
    if (!statsModalMonth) return [];
    if (isStatsYearlyView) {
      return invoices.filter((invoice) =>
        hasTravelInYear(invoice, statsModalYear),
      );
    }

    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return invoices.filter((invoice) =>
      hasTravelInMonth(invoice, targetYearMonth),
    );
  }, [
    statsModalMonth,
    analyticsData.invoices,
    analyticsData.profitAgentInvoices,
    isStatsYearlyView,
    statsModalYear,
    getYearMonthFromLabel,
  ]);

  const statsTravelInternalInvoices = useMemo(() => {
    if (!statsModalMonth || !analyticsData.internalInvoices) return [];
    if (isStatsYearlyView) {
      return analyticsData.internalInvoices.filter((invoice) =>
        hasTravelInYear(invoice, statsModalYear),
      );
    }
    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return analyticsData.internalInvoices.filter((invoice) =>
      hasTravelInMonth(invoice, targetYearMonth),
    );
  }, [
    statsModalMonth,
    analyticsData.internalInvoices,
    isStatsYearlyView,
    statsModalYear,
    getYearMonthFromLabel,
  ]);

  const statsProfitTravelInternalInvoices = useMemo(() => {
    const profitInternalInvoices = Array.isArray(
      analyticsData.profitInternalInvoices,
    )
      ? analyticsData.profitInternalInvoices
      : [];
    const source = profitInternalInvoices.length
      ? profitInternalInvoices
      : analyticsData.internalInvoices || [];

    if (!statsModalMonth) return [];
    if (isStatsYearlyView) {
      return source.filter((invoice) =>
        hasTravelInYearForProfit(invoice, statsModalYear),
      );
    }

    const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
    return source.filter((invoice) =>
      hasTravelInMonthForProfit(invoice, targetYearMonth),
    );
  }, [
    statsModalMonth,
    analyticsData.internalInvoices,
    analyticsData.profitInternalInvoices,
    isStatsYearlyView,
    statsModalYear,
    getYearMonthFromLabel,
  ]);

  const availableAgents = useMemo(() => {
    const participants = analyticsData.participants?.agents || [];
    if (participants.length > 0) {
      return sortParticipantOptions(
        participants.map((participant) =>
          buildParticipantOption(participant, true),
        ),
      );
    }

    const agentsSet = new Set();
    (analyticsData.invoices || []).forEach((invoice) => {
      const agentName =
        invoice.agent?.companyName || invoice.agent?.name || invoice.agentName;
      if (agentName && agentName !== "-") {
        agentsSet.add(agentName);
      }
    });
    return sortParticipantOptions(
      Array.from(agentsSet).map((agentName) =>
        buildParticipantOption({ name: agentName }, true),
      ),
    );
  }, [analyticsData.invoices, analyticsData.participants?.agents]);

  const availableDmcs = useMemo(() => {
    const participants = analyticsData.participants?.dmcs || [];
    if (participants.length > 0) {
      return sortParticipantOptions(
        participants.map((participant) =>
          buildParticipantOption(participant, true),
        ),
      );
    }

    const dmcsSet = new Set();
    (analyticsData.internalInvoices || []).forEach((invoice) => {
      const dmcName =
        invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName;
      if (dmcName && dmcName !== "-") {
        dmcsSet.add(dmcName);
      }
    });
    return sortParticipantOptions(
      Array.from(dmcsSet).map((dmcName) =>
        buildParticipantOption({ name: dmcName }, true),
      ),
    );
  }, [analyticsData.internalInvoices, analyticsData.participants?.dmcs]);

  useEffect(() => {
    if (
      statsSelectedAgent !== "all" &&
      !availableAgents.some((agent) => agent.value === statsSelectedAgent)
    ) {
      setStatsSelectedAgent("all");
      setStatsSelectedQueries([]);
    }
  }, [availableAgents, statsSelectedAgent]);

  useEffect(() => {
    if (
      statsSelectedDmc !== "all" &&
      !availableDmcs.some((dmc) => dmc.value === statsSelectedDmc)
    ) {
      setStatsSelectedDmc("all");
      setStatsSelectedQueries([]);
    }
  }, [availableDmcs, statsSelectedDmc]);

  const filteredStatsInvoices = useMemo(() => {
    if (statsModalMode === "agent") {
      if (statsSelectedAgent === "all") return statsInvoices;
      return statsInvoices.filter((invoice) => {
        const agentName =
          invoice.agent?.companyName ||
          invoice.agent?.name ||
          invoice.agentName;
        return agentName === statsSelectedAgent;
      });
    } else {
      if (statsSelectedDmc === "all") return statsInvoices;
      const dmcInvoices = statsInternalInvoices.filter((inv) => {
        const dmcName = inv.dmc?.companyName || inv.dmc?.name || inv.dmcName;
        return dmcName === statsSelectedDmc;
      });
      const dmcQueryIds = new Set();
      dmcInvoices.forEach((inv) => {
        const qId = inv.query?.queryId || inv.queryCode || inv._id;
        if (qId) dmcQueryIds.add(qId);
        (inv.coveredQueries || []).forEach((q) => {
          const coveredQId =
            q.query?.queryId || q.queryCode || q.query || String(q.query);
          if (coveredQId) dmcQueryIds.add(coveredQId);
        });
      });
      return statsInvoices.filter((invoice) => {
        const qId = invoice.query?.queryId || invoice._id;
        return dmcQueryIds.has(qId);
      });
    }
  }, [
    statsModalMode,
    statsSelectedAgent,
    statsSelectedDmc,
    statsInvoices,
    statsInternalInvoices,
  ]);

  const filteredStatsInternalInvoices = useMemo(() => {
    if (statsModalMode === "agent") {
      if (statsSelectedAgent === "all") return statsInternalInvoices;
      const agentInvoices = statsInvoices.filter((invoice) => {
        const agentName =
          invoice.agent?.companyName ||
          invoice.agent?.name ||
          invoice.agentName;
        return agentName === statsSelectedAgent;
      });
      const agentQueryIds = new Set(
        agentInvoices.map((inv) => inv.query?.queryId || inv._id),
      );
      return statsInternalInvoices.filter((inv) => {
        const isSingleMatch = agentQueryIds.has(
          inv.query?.queryId || inv.queryCode || inv._id,
        );
        const isBulkMatch = (inv.coveredQueries || []).some((q) =>
          agentQueryIds.has(
            q.query?.queryId || q.queryCode || q.query || String(q.query),
          ),
        );
        return isSingleMatch || isBulkMatch;
      });
    } else {
      if (statsSelectedDmc === "all") return statsInternalInvoices;
      return statsInternalInvoices.filter((invoice) => {
        const dmcName =
          invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName;
        return dmcName === statsSelectedDmc;
      });
    }
  }, [
    statsModalMode,
    statsSelectedAgent,
    statsSelectedDmc,
    statsInvoices,
    statsInternalInvoices,
  ]);

  const filteredTravelStatsInvoices = useMemo(() => {
    if (statsModalMode === "agent") {
      if (statsSelectedAgent === "all") return statsTravelInvoices;
      return statsTravelInvoices.filter((invoice) => {
        const agentName =
          invoice.agent?.companyName ||
          invoice.agent?.name ||
          invoice.agentName;
        return agentName === statsSelectedAgent;
      });
    } else {
      if (statsSelectedDmc === "all") return statsTravelInvoices;
      const dmcInvoices = statsTravelInternalInvoices.filter((inv) => {
        const dmcName = inv.dmc?.companyName || inv.dmc?.name || inv.dmcName;
        return dmcName === statsSelectedDmc;
      });
      const dmcQueryIds = new Set();
      dmcInvoices.forEach((inv) => {
        const qId = inv.query?.queryId || inv.queryCode || inv._id;
        if (qId) dmcQueryIds.add(qId);
        (inv.coveredQueries || []).forEach((q) => {
          const coveredQId =
            q.query?.queryId || q.queryCode || q.query || String(q.query);
          if (coveredQId) dmcQueryIds.add(coveredQId);
        });
      });
      return statsTravelInvoices.filter((invoice) => {
        const qId = invoice.query?.queryId || invoice._id;
        return dmcQueryIds.has(qId);
      });
    }
  }, [
    statsModalMode,
    statsSelectedAgent,
    statsSelectedDmc,
    statsTravelInvoices,
    statsTravelInternalInvoices,
  ]);

  const filteredTravelStatsInternalInvoices = useMemo(() => {
    if (statsModalMode === "agent") {
      if (statsSelectedAgent === "all") return statsTravelInternalInvoices;
      const agentInvoices = statsTravelInvoices.filter((invoice) => {
        const agentName =
          invoice.agent?.companyName ||
          invoice.agent?.name ||
          invoice.agentName;
        return agentName === statsSelectedAgent;
      });
      const agentQueryIds = new Set(
        agentInvoices.map((inv) => inv.query?.queryId || inv._id),
      );
      return statsTravelInternalInvoices.filter((inv) => {
        const isSingleMatch = agentQueryIds.has(
          inv.query?.queryId || inv.queryCode || inv._id,
        );
        const isBulkMatch = (inv.coveredQueries || []).some((q) =>
          agentQueryIds.has(
            q.query?.queryId || q.queryCode || q.query || String(q.query),
          ),
        );
        return isSingleMatch || isBulkMatch;
      });
    } else {
      if (statsSelectedDmc === "all") return statsTravelInternalInvoices;
      return statsTravelInternalInvoices.filter((invoice) => {
        const dmcName =
          invoice.dmc?.companyName || invoice.dmc?.name || invoice.dmcName;
        return dmcName === statsSelectedDmc;
      });
    }
  }, [
    statsModalMode,
    statsSelectedAgent,
    statsSelectedDmc,
    statsTravelInvoices,
    statsTravelInternalInvoices,
  ]);

  const statsSummary = useMemo(() => {
    if (statsSelectedQueries.length > 0) {
      const activeId = statsSelectedQueries[0];
      if (statsModalMode === "agent") {
        const invoice = filteredTravelStatsInvoices.find(
          (inv) => (inv.query?.queryId || inv._id) === activeId,
        );
        if (invoice) {
          const total = getInvoiceTotalAmount(invoice);
          const paid = getInvoicePaidAmount(invoice);
          const pending = Math.max(0, total - paid);
          const rate = total ? (paid / total) * 100 : 0;
          return { total, paid, pending, rate };
        }
      } else {
        // Check if the activeId is a bulk invoice ID
        const selectedBulkInvoice = filteredTravelStatsInternalInvoices.find(
          (inv) =>
            inv._id === activeId &&
            (inv.settlementType === "bulk" ||
              (inv.coveredQueries && inv.coveredQueries.length > 0)),
        );

        if (selectedBulkInvoice) {
          const total = Number(
            selectedBulkInvoice.summary?.grandTotal ||
              selectedBulkInvoice.claimedSummary?.grandTotal ||
              selectedBulkInvoice.payoutAmount ||
              0,
          );
          const paid = getDmcPaidAmount(selectedBulkInvoice);
          const pending = Math.max(0, total - paid);
          const rate = total ? (paid / total) * 100 : 0;
          return { total, paid, pending, rate };
        } else {
          const invoice = filteredTravelStatsInternalInvoices.find(
            (inv) =>
              (inv.query?.queryId || inv.queryCode || inv._id) === activeId,
          );
          if (invoice) {
            if (
              invoice.settlementType === "bulk" ||
              (invoice.coveredQueries && invoice.coveredQueries.length > 0)
            ) {
              const queryItems = (invoice.items || []).filter(
                (item) =>
                  (item.query?.queryId || item.queryCode || item.query) ===
                    activeId || String(item.query) === String(activeId),
              );
              const sub = queryItems.reduce(
                (s, item) => s + Number(item.subtotal || 0),
                0,
              );
              const tax = queryItems.reduce(
                (s, item) => s + Number(item.tax || 0),
                0,
              );
              const rawItemTotal = sub + tax;

              const totalExpected = Number(
                invoice.summary?.grandTotal ||
                  invoice.claimedSummary?.grandTotal ||
                  invoice.payoutAmount ||
                  0,
              );
              const itemsTotal = (invoice.items || []).reduce(
                (s, it) => s + Number(it.subtotal || 0) + Number(it.tax || 0),
                0,
              );

              let total = rawItemTotal;
              if (itemsTotal > 0) {
                total = rawItemTotal * (totalExpected / itemsTotal);
              }
              const dmcPaid = getDmcPaidAmount(invoice);
              const paid =
                totalExpected > 0 ? total * (dmcPaid / totalExpected) : 0;
              const pending = Math.max(0, total - paid);
              const rate = total ? (paid / total) * 100 : 0;
              return { total, paid, pending, rate };
            } else {
              const total = Number(
                invoice.summary?.grandTotal ||
                  invoice.claimedSummary?.grandTotal ||
                  invoice.payoutAmount ||
                  0,
              );
              const paid = getDmcPaidAmount(invoice);
              const pending = Math.max(0, total - paid);
              const rate = total ? (paid / total) * 100 : 0;
              return { total, paid, pending, rate };
            }
          }
        }
      }

      return { total: 0, paid: 0, pending: 0, rate: 0 };
    }

    let total = 0;
    let paid = 0;
    if (statsModalMode === "agent") {
      filteredTravelStatsInvoices.forEach((inv) => {
        total += getInvoiceTotalAmount(inv);
        paid += getInvoicePaidAmount(inv);
      });
    } else {
      filteredTravelStatsInternalInvoices.forEach((inv) => {
        total += Number(
          inv.summary?.grandTotal ||
            inv.claimedSummary?.grandTotal ||
            inv.payoutAmount ||
            0,
        );
        paid += getDmcPaidAmount(inv);
      });
    }
    const pending = Math.max(0, total - paid);
    const rate = total ? (paid / total) * 100 : 0;
    const finalRate = rate > 100 ? 100 : rate;
    return { total, paid, pending, rate: finalRate };
  }, [
    statsModalMode,
    statsSelectedQueries,
    filteredTravelStatsInvoices,
    filteredTravelStatsInternalInvoices,
    isStatsYearlyView,
    statsModalYear,
    statsModalMonth,
    getYearMonthFromLabel,
  ]);

  const statsProfitSummary = useMemo(() => {
    const activeId =
      statsSelectedQueries.length > 0 ? statsSelectedQueries[0] : null;

    let revenueVal = 0;
    let costVal = 0;

    const agentProfitQueryKeys = filteredTravelStatsInvoices.reduce(
      (keys, invoice) => {
        getStatsRecordQueryKeys(invoice).forEach((key) => keys.add(key));
        return keys;
      },
      new Set(),
    );

    const profitInternalInvoicesForCalc =
      statsModalMode === "dmc"
        ? statsSelectedDmc === "all"
          ? statsProfitTravelInternalInvoices
          : statsProfitTravelInternalInvoices.filter((invoice) => {
              const dmcName =
                invoice.dmc?.companyName ||
                invoice.dmc?.name ||
                invoice.dmcName;
              return dmcName === statsSelectedDmc;
            })
        : statsProfitTravelInternalInvoices.filter((invoice) =>
            statsRecordMatchesQueryKeys(invoice, agentProfitQueryKeys),
          );

    const bulkProfitSummaries = Array.isArray(analyticsData.bulkProfitSummaries)
      ? analyticsData.bulkProfitSummaries
      : [];

    const getBulkProfitSummary = (invoice = {}) =>
      bulkProfitSummaries.find(
        (summary) =>
          summary.id === invoice._id ||
          summary.id === invoice.id ||
          summary.batchNumber === invoice.batchNumber ||
          summary.invoiceNumber === invoice.invoiceNumber,
      );

    const getBulkInvoiceCost = (invoice = {}, queryKey = null) => {
      const totalExpected = Number(
        invoice.summary?.grandTotal ||
          invoice.claimedSummary?.grandTotal ||
          invoice.payoutAmount ||
          0,
      );
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      if (!queryKey || !items.length) return totalExpected;

      const queryKeys =
        queryKey instanceof Set ? queryKey : new Set([queryKey]);
      if (!queryKeys.size) return totalExpected;

      const queryItems = items.filter((item) =>
        statsRecordMatchesQueryKeys(item, queryKeys),
      );
      const rawItemTotal = queryItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0) + Number(item.tax || 0),
        0,
      );
      const itemsTotal = items.reduce(
        (sum, item) => sum + Number(item.subtotal || 0) + Number(item.tax || 0),
        0,
      );

      return itemsTotal > 0
        ? rawItemTotal * (totalExpected / itemsTotal)
        : rawItemTotal;
    };

    const addAgentRevenueForKeys = (queryKeys = new Set()) => {
      statsProfitTravelInvoices.forEach((invoice) => {
        if (statsRecordMatchesQueryKeys(invoice, queryKeys)) {
          revenueVal += getInvoiceTotalAmount(invoice);
        }
      });
    };

    if (activeId) {
      const activeKeySet = new Set([activeId]);
      const selectedBulkInvoice = profitInternalInvoicesForCalc.find(
        (invoice) =>
          invoice._id === activeId &&
          (invoice.settlementType === "bulk" ||
            (invoice.coveredQueries && invoice.coveredQueries.length > 0)),
      );

      if (selectedBulkInvoice) {
        const directSummary = getBulkProfitSummary(selectedBulkInvoice);
        if (directSummary) {
          revenueVal = Number(directSummary.agentRevenue || 0);
          costVal = Number(directSummary.dmcCost || 0);
        } else {
          const bulkQueryKeys = getStatsBulkChildQueryKeys(selectedBulkInvoice);
          addAgentRevenueForKeys(bulkQueryKeys);
          costVal = getBulkInvoiceCost(selectedBulkInvoice);
        }
      } else {
        const agentInvoice = statsProfitTravelInvoices.find((invoice) =>
          statsRecordMatchesQueryKeys(invoice, activeKeySet),
        );
        if (agentInvoice) {
          revenueVal = getInvoiceTotalAmount(agentInvoice);
        }

        const dmcInvoices = profitInternalInvoicesForCalc.filter((invoice) =>
          statsRecordMatchesQueryKeys(invoice, activeKeySet),
        );
        dmcInvoices.forEach((invoice) => {
          const isBulk =
            invoice.settlementType === "bulk" ||
            (invoice.coveredQueries && invoice.coveredQueries.length > 0);
          costVal += isBulk
            ? getBulkInvoiceCost(invoice, activeId)
            : Number(
                invoice.summary?.grandTotal ||
                  invoice.claimedSummary?.grandTotal ||
                  invoice.payoutAmount ||
                  0,
              );
        });
      }
    } else if (statsModalMode === "dmc") {
      const revenueQueryKeys = new Set();

      profitInternalInvoicesForCalc.forEach((invoice) => {
        const isBulk =
          invoice.settlementType === "bulk" ||
          (invoice.coveredQueries && invoice.coveredQueries.length > 0);
        const directSummary = isBulk ? getBulkProfitSummary(invoice) : null;

        if (directSummary) {
          revenueVal += Number(directSummary.agentRevenue || 0);
          costVal += Number(directSummary.dmcCost || 0);
          return;
        }

        getStatsRecordQueryKeys(invoice).forEach((key) =>
          revenueQueryKeys.add(key),
        );
        costVal += isBulk
          ? getBulkInvoiceCost(invoice)
          : Number(
              invoice.summary?.grandTotal ||
                invoice.claimedSummary?.grandTotal ||
                invoice.payoutAmount ||
                0,
            );
      });

      addAgentRevenueForKeys(revenueQueryKeys);
    } else {
      filteredTravelStatsInvoices.forEach((invoice) => {
        revenueVal += getInvoiceTotalAmount(invoice);
      });

      profitInternalInvoicesForCalc.forEach((invoice) => {
        const isBulk =
          invoice.settlementType === "bulk" ||
          (invoice.coveredQueries && invoice.coveredQueries.length > 0);
        costVal += isBulk
          ? getBulkInvoiceCost(invoice, agentProfitQueryKeys)
          : Number(
              invoice.summary?.grandTotal ||
                invoice.claimedSummary?.grandTotal ||
                invoice.payoutAmount ||
                0,
            );
      });
    }

    const profitVal = revenueVal - costVal;
    const marginPercent = revenueVal > 0 ? (profitVal / revenueVal) * 100 : 0;

    return {
      revenue: revenueVal,
      cost: costVal,
      profit: profitVal,
      margin: marginPercent,
    };
  }, [
    analyticsData.bulkProfitSummaries,
    statsSelectedQueries,
    statsModalMode,
    statsSelectedDmc,
    statsProfitTravelInvoices,
    statsProfitTravelInternalInvoices,
    filteredTravelStatsInvoices,
    filteredTravelStatsInternalInvoices,
  ]);

  const statsDailyChart = useMemo(() => {
    if (!statsModalMonth) return { data: [], labels: [], details: [] };
    const daysCount = isStatsYearlyView ? 12 : getDaysInMonth(statsModalMonth);
    const targetYearMonth = isStatsYearlyView
      ? ""
      : getYearMonthFromLabel(statsModalMonth);
    const dailyData = Array(daysCount).fill(0);
    const dailyDetails = Array.from({ length: daysCount }, () => ({
      items: [],
    }));

    const activeId =
      statsSelectedQueries.length > 0 ? statsSelectedQueries[0] : null;

    const buildPaymentDetail = (record = {}, status = "") => ({
      queryId:
        record.query?.queryId ||
        record.queryCode ||
        record.tripSnapshot?.queryId ||
        record._id ||
        "",
      destination:
        record.tripSnapshot?.destination ||
        record.query?.destination ||
        record.destination ||
        record.city ||
        "Unknown Destination",
      travelDate: getTravelDateLabel(record),
      status,
    });

    const addMonthlyPoint = (
      monthlyData,
      monthlyDetails,
      date,
      amount,
      detail,
    ) => {
      const numericAmount = Number(amount || 0);
      if (numericAmount <= 0 || !isDateInYear(date, statsModalYear)) return;

      const monthIndex = date.getMonth();
      monthlyData[monthIndex] += numericAmount;
      if (detail) monthlyDetails[monthIndex].items.push(detail);
    };

    if (isStatsYearlyView) {
      const monthlyData = Array(12).fill(0);
      const monthlyDetails = Array.from({ length: 12 }, () => ({ items: [] }));

      if (statsModalMode === "agent") {
        filteredTravelStatsInvoices.forEach((invoice) => {
          if (activeId && (invoice.query?.queryId || invoice._id) !== activeId)
            return;

          const paymentEntries = getAgentPaymentEntries(invoice);
          if (paymentEntries.length > 0) {
            paymentEntries.forEach((entry) => {
              addMonthlyPoint(
                monthlyData,
                monthlyDetails,
                entry.date || parseInvoiceDate(invoice),
                entry.amount,
                buildPaymentDetail(invoice, entry.status),
              );
            });
          } else {
            addMonthlyPoint(
              monthlyData,
              monthlyDetails,
              parseInvoiceDate(invoice),
              getInvoicePaidAmount(invoice),
              buildPaymentDetail(invoice, invoice.paymentStatus),
            );
          }
        });
      } else {
        filteredTravelStatsInternalInvoices.forEach((invoice) => {
          if (
            activeId &&
            (invoice.query?.queryId || invoice.queryCode || invoice._id) !==
              activeId
          )
            return;

          getDmcPaymentEntries(invoice).forEach((entry) => {
            addMonthlyPoint(
              monthlyData,
              monthlyDetails,
              entry.date || parseInternalInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status),
            );
          });
        });
      }

      return {
        data: monthlyData,
        labels: MONTH_SEQUENCE,
        details: monthlyDetails,
      };
    }

    const addSelectedPoint = (buckets, date, amount, detail) => {
      const numericAmount = Number(amount || 0);
      if (numericAmount <= 0) return;

      if (!date) {
        const existing = buckets.get("undated") || {
          label: "Undated",
          sort: Number.MAX_SAFE_INTEGER,
          amount: 0,
          items: [],
        };
        existing.amount += numericAmount;
        if (detail) existing.items.push(detail);
        buckets.set("undated", existing);
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

      if (statsModalMode === "agent") {
        filteredTravelStatsInvoices.forEach((invoice) => {
          if ((invoice.query?.queryId || invoice._id) !== activeId) return;

          getAgentPaymentEntries(invoice).forEach((entry) => {
            addSelectedPoint(
              selectedBuckets,
              entry.date || parseInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status),
            );
          });
        });
      } else {
        filteredTravelStatsInternalInvoices.forEach((invoice) => {
          const isSingleMatch =
            (invoice.query?.queryId || invoice.queryCode || invoice._id) ===
            activeId;
          const isBulkMatch = (invoice.coveredQueries || []).some(
            (q) =>
              (q.query?.queryId || q.queryCode || q.query) === activeId ||
              String(q.query) === String(activeId),
          );
          if (!isSingleMatch && !isBulkMatch) return;

          const isBulk =
            invoice.settlementType === "bulk" ||
            (invoice.coveredQueries && invoice.coveredQueries.length > 0);

          let proportion = 1;
          if (isBulk && !isSingleMatch) {
            const queryItems = (invoice.items || []).filter(
              (item) =>
                (item.query?.queryId || item.queryCode || item.query) ===
                  activeId || String(item.query) === String(activeId),
            );
            const sub = queryItems.reduce(
              (s, item) => s + Number(item.subtotal || 0),
              0,
            );
            const tax = queryItems.reduce(
              (s, item) => s + Number(item.tax || 0),
              0,
            );
            const rawItemTotal = sub + tax;

            const totalExpected = Number(
              invoice.summary?.grandTotal ||
                invoice.claimedSummary?.grandTotal ||
                invoice.payoutAmount ||
                0,
            );
            const itemsTotal = (invoice.items || []).reduce(
              (s, it) => s + Number(it.subtotal || 0) + Number(it.tax || 0),
              0,
            );

            let queryTotal = rawItemTotal;
            if (itemsTotal > 0) {
              queryTotal = rawItemTotal * (totalExpected / itemsTotal);
            }
            if (totalExpected > 0) {
              proportion = queryTotal / totalExpected;
            }
          }

          getDmcPaymentEntries(invoice).forEach((entry) => {
            addSelectedPoint(
              selectedBuckets,
              entry.date || parseInternalInvoiceDate(invoice),
              entry.amount * proportion,
              buildPaymentDetail(invoice, entry.status),
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

    if (statsModalMode === "agent") {
      filteredTravelStatsInvoices.forEach((invoice) => {
        if (activeId && (invoice.query?.queryId || invoice._id) !== activeId)
          return;

        const paymentEntries = getAgentPaymentEntries(invoice);
        if (paymentEntries.length > 0) {
          paymentEntries.forEach((entry) => {
            addDailyPoint(
              entry.date || parseInvoiceDate(invoice),
              entry.amount,
              buildPaymentDetail(invoice, entry.status),
            );
          });
        } else {
          addDailyPoint(
            parseInvoiceDate(invoice),
            getInvoicePaidAmount(invoice),
            buildPaymentDetail(invoice, invoice.paymentStatus),
          );
        }
      });
    } else {
      filteredTravelStatsInternalInvoices.forEach((invoice) => {
        if (
          activeId &&
          (invoice.query?.queryId || invoice.queryCode || invoice._id) !==
            activeId
        )
          return;

        const isBulk =
          invoice.settlementType === "bulk" ||
          (invoice.coveredQueries && invoice.coveredQueries.length > 0);

        getDmcPaymentEntries(invoice).forEach((entry) => {
          let amount = entry.amount;
          if (isBulk) {
            const queryItems = (invoice.items || []).filter((item) => {
              const itemTravelDate = parseValidDate(
                item.query?.startDate ||
                  item.serviceDate ||
                  item.creditStartDate,
              );
              if (!itemTravelDate) return false;
              if (isStatsYearlyView) {
                return isDateInYear(itemTravelDate, statsModalYear);
              } else {
                const targetYearMonth = getYearMonthFromLabel(statsModalMonth);
                return isDateInYearMonth(itemTravelDate, targetYearMonth);
              }
            });
            const sub = queryItems.reduce(
              (s, item) => s + Number(item.subtotal || 0),
              0,
            );
            const tax = queryItems.reduce(
              (s, item) => s + Number(item.tax || 0),
              0,
            );
            const rawItemTotal = sub + tax;

            const totalExpected = Number(
              invoice.summary?.grandTotal ||
                invoice.claimedSummary?.grandTotal ||
                invoice.payoutAmount ||
                0,
            );
            const itemsTotal = (invoice.items || []).reduce(
              (s, it) => s + Number(it.subtotal || 0) + Number(it.tax || 0),
              0,
            );

            let queryTotal = rawItemTotal;
            if (itemsTotal > 0) {
              queryTotal = rawItemTotal * (totalExpected / itemsTotal);
            }
            if (totalExpected > 0) {
              amount = entry.amount * (queryTotal / totalExpected);
            }
          }

          addDailyPoint(
            entry.date || parseInternalInvoiceDate(invoice),
            amount,
            buildPaymentDetail(invoice, entry.status),
          );
        });
      });
    }

    return { data: dailyData, labels: [], details: dailyDetails };
  }, [
    statsModalMonth,
    statsModalMode,
    statsSelectedQueries,
    filteredTravelStatsInvoices,
    filteredTravelStatsInternalInvoices,
    isStatsYearlyView,
    statsModalYear,
    getDaysInMonth,
    getYearMonthFromLabel,
  ]);

  const statsDailyData = statsDailyChart.data;
  const statsDailyLabels = statsDailyChart.labels;
  const statsDailyDetails = statsDailyChart.details;

  const statsDailyCardTrends = useMemo(() => {
    if (!statsModalMonth)
      return {
        totalVal: [],
        receivedVal: [],
        pendingVal: [],
        rateVal: [],
        profitVal: [],
        marginVal: [],
      };
    const daysCount = isStatsYearlyView ? 12 : getDaysInMonth(statsModalMonth);
    const targetYearMonth = isStatsYearlyView
      ? ""
      : getYearMonthFromLabel(statsModalMonth);

    const dailyInvoices = Array(daysCount).fill(0);
    const dailyReceived = Array(daysCount).fill(0);
    const dailyDmcCosts = Array(daysCount).fill(0);

    const activeId =
      statsSelectedQueries.length > 0 ? statsSelectedQueries[0] : null;

    const invoiceMatchesQuery = (invoice) => {
      if (!activeId) return true;
      return (invoice.query?.queryId || invoice._id) === activeId;
    };

    const internalInvoiceMatchesQuery = (invoice) => {
      if (!activeId) return true;
      const isSingleMatch =
        (invoice.query?.queryId || invoice.queryCode || invoice._id) ===
        activeId;
      const isBulkMatch = (invoice.coveredQueries || []).some(
        (q) =>
          (q.query?.queryId || q.queryCode || q.query) === activeId ||
          String(q.query) === String(activeId),
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

    filteredTravelStatsInvoices.forEach((invoice) => {
      if (!invoiceMatchesQuery(invoice)) return;
      const date = getPrimaryTravelDate(invoice);
      addTrendPoint(date, dailyInvoices, getInvoiceTotalAmount(invoice));
    });

    filteredTravelStatsInvoices.forEach((invoice) => {
      if (!invoiceMatchesQuery(invoice)) return;
      const date = getPrimaryTravelDate(invoice);
      addTrendPoint(date, dailyReceived, getInvoicePaidAmount(invoice));
    });

    filteredTravelStatsInternalInvoices.forEach((inv) => {
      if (!internalInvoiceMatchesQuery(inv)) return;
      if (
        inv.settlementType === "bulk" ||
        (inv.coveredQueries && inv.coveredQueries.length > 0)
      ) {
        const totalExpected = Number(
          inv.summary?.grandTotal ||
            inv.claimedSummary?.grandTotal ||
            inv.payoutAmount ||
            0,
        );
        const itemsTotal = (inv.items || []).reduce(
          (s, it) => s + Number(it.subtotal || 0) + Number(it.tax || 0),
          0,
        );

        (inv.items || []).forEach((item) => {
          if (activeId) {
            const isMatch =
              (item.query?.queryId || item.queryCode || item.query) ===
                activeId || String(item.query) === String(activeId);
            if (!isMatch) return;
          }
          const amt = Number(item.subtotal || 0) + Number(item.tax || 0);
          const scaledAmt =
            itemsTotal > 0 ? amt * (totalExpected / itemsTotal) : amt;
          const date = parseValidDate(
            item.query?.startDate || item.serviceDate || item.creditStartDate,
          );
          addTrendPoint(date, dailyDmcCosts, scaledAmt);
        });
      } else {
        const amt = Number(
          inv.summary?.grandTotal ||
            inv.claimedSummary?.grandTotal ||
            inv.payoutAmount ||
            0,
        );
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

      const rawRate =
        runningTotal > 0 ? (runningReceived / runningTotal) * 100 : 0;
      rateVal[day - 1] = rawRate > 100 ? 100 : rawRate;

      profitVal[day - 1] = runningTotal - runningDmcCost;
      marginVal[day - 1] =
        runningTotal > 0 ? (profitVal[day - 1] / runningTotal) * 100 : 0;
    }

    return { totalVal, receivedVal, pendingVal, rateVal, profitVal, marginVal };
  }, [
    statsModalMonth,
    statsSelectedQueries,
    statsModalMode,
    filteredTravelStatsInvoices,
    filteredTravelStatsInternalInvoices,
    isStatsYearlyView,
    statsModalYear,
    getDaysInMonth,
    getYearMonthFromLabel,
  ]);

  const statsModalCardText = useMemo(() => {
    const values = Array.isArray(statsDailyCardTrends.totalVal)
      ? statsDailyCardTrends.totalVal.map((value) => Number(value || 0))
      : [];
    const current = values.length
      ? values[values.length - 1]
      : Number(statsSummary.total || 0);
    const previous = values.length > 1 ? values[values.length - 2] : 0;
    const change =
      previous > 0
        ? ((current - previous) / previous) * 100
        : current > 0
          ? 100
          : 0;
    const trendArrow = change > 0 ? "\u2191" : change < 0 ? "\u2193" : "\u2192";
    const trendPrefix = change > 0 ? "+" : change < 0 ? "-" : "";

    return {
      totalTrend: `${trendArrow} ${trendPrefix}${formatOneDecimalPercent(Math.abs(change))}%`,
      totalTrendTone: change >= 0 ? "text-emerald-600" : "text-rose-600",
      collectionRate: `${formatOneDecimalPercent(statsSummary.rate)}%`,
      pendingStatus:
        statsSummary.pending === 0
          ? "\u2713 No risk"
          : `\u2193 ${formatCompactCurrency(statsSummary.pending)} pending`,
    };
  }, [
    statsDailyCardTrends.totalVal,
    statsSummary.total,
    statsSummary.rate,
    statsSummary.pending,
  ]);

  const periodData =
    period === "custom" || period === "quarterly"
      ? defaultAnalytics.monthly
      : analyticsData?.[period] || defaultAnalytics[period];
  const reportsData = analyticsData?.reports || defaultAnalytics.reports;
  const taxPeriodOptions = useMemo(
    () => (Array.isArray(periodData.taxPeriods) ? periodData.taxPeriods : []),
    [periodData.taxPeriods],
  );
  const yearPeriodOptions = useMemo(
    () => (Array.isArray(periodData.yearPeriods) ? periodData.yearPeriods : []),
    [periodData.yearPeriods],
  );
  const selectedTaxPeriod =
    period === "monthly"
      ? taxPeriodOptions.find(
          (option) => option.value === effectiveSelectedTaxMonth,
        ) || taxPeriodOptions[0]
      : null;
  const previousTaxMonthValue = useMemo(() => {
    if (!effectiveSelectedTaxMonth) return "";
    const [year, month] = effectiveSelectedTaxMonth.split("-").map(Number);
    return formatTaxMonthValue(new Date(year, month - 2, 1));
  }, [effectiveSelectedTaxMonth]);
  const previousMonthRevenueTotal = useMemo(() => {
    const previousTaxPeriod = taxPeriodOptions.find(
      (option) => option.value === previousTaxMonthValue,
    );
    return getRevenueReportTotal(previousTaxPeriod?.reports?.revenue);
  }, [taxPeriodOptions, previousTaxMonthValue]);
  const selectedYearPeriod =
    period === "yearly"
      ? yearPeriodOptions.find(
          (option) => option.value === effectiveSelectedTaxYear,
        ) || yearPeriodOptions[yearPeriodOptions.length - 1]
      : null;
  const activePeriodOption =
    period === "monthly" ? selectedTaxPeriod : selectedYearPeriod;
  const activeTaxSummary = useMemo(() => {
    if (
      analyticsData.custom?.taxSummary &&
      (period === "custom" ||
        selectedTaxDate ||
        (period === "monthly" && selectedTaxMonth) ||
        (period === "quarterly" && selectedTaxQuarter) ||
        (period === "yearly" && selectedTaxYear))
    ) {
      return analyticsData.custom.taxSummary;
    }
    return (
      activePeriodOption?.taxSummary ||
      periodData.taxSummary ||
      defaultAnalytics[period].taxSummary
    );
  }, [
    period,
    effectiveSelectedTaxMonth,
    effectiveSelectedTaxYear,
    taxPeriodOptions,
    analyticsData,
    selectedTaxDate,
    selectedTaxMonth,
    selectedTaxYear,
    activePeriodOption,
    periodData.taxSummary,
  ]);

  const activeMetrics = useMemo(() => {
    if (
      analyticsData.custom?.metrics &&
      (period === "custom" ||
        selectedTaxDate ||
        (period === "monthly" && selectedTaxMonth) ||
        (period === "quarterly" && selectedTaxQuarter) ||
        (period === "yearly" && selectedTaxYear))
    ) {
      return analyticsData.custom.metrics;
    }
    return (
      activePeriodOption?.metrics ||
      periodData.metrics ||
      defaultAnalytics[period].metrics
    );
  }, [
    period,
    effectiveSelectedTaxMonth,
    effectiveSelectedTaxYear,
    taxPeriodOptions,
    analyticsData,
    selectedTaxDate,
    selectedTaxMonth,
    selectedTaxYear,
    activePeriodOption,
    periodData.metrics,
  ]);
  const isDmcEntryInSelectedPeriod = useCallback(
    (date) => {
      if (!date) return false;
      const d = new Date(date);
      if (isNaN(d.getTime())) return false;

      if (selectedTaxDate) {
        const targetDate = new Date(selectedTaxDate);
        return (
          d.getFullYear() === targetDate.getFullYear() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getDate() === targetDate.getDate()
        );
      }

      if (period === "monthly") {
        if (!effectiveSelectedTaxMonth) return false;
        const [yr, mn] = effectiveSelectedTaxMonth.split("-").map(Number);
        return d.getFullYear() === yr && d.getMonth() + 1 === mn;
      }

      if (period === "quarterly") {
        if (!effectiveSelectedTaxQuarter) return false;
        const [yr, q] = effectiveSelectedTaxQuarter.split("-Q").map(Number);
        const qStartMonth = (q - 1) * 3;
        const qEndMonth = qStartMonth + 2;
        return d.getFullYear() === yr && d.getMonth() >= qStartMonth && d.getMonth() <= qEndMonth;
      }

      if (period === "yearly") {
        if (!effectiveSelectedTaxYear) return false;
        const yr = Number(effectiveSelectedTaxYear);
        return d.getFullYear() === yr;
      }

      if (period === "custom") {
        if (!appliedCustomRange.start || !appliedCustomRange.end) return false;
        const start = new Date(appliedCustomRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(appliedCustomRange.end);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }

      return false;
    },
    [
      period,
      selectedTaxDate,
      effectiveSelectedTaxMonth,
      effectiveSelectedTaxQuarter,
      effectiveSelectedTaxYear,
      appliedCustomRange,
    ],
  );

  const contributingPayouts = useMemo(() => {
    const list = [];
    const invoices = Array.isArray(analyticsData.internalInvoices)
      ? analyticsData.internalInvoices
      : [];

    // Filter invoices by user relationship for finance members
    const filteredInvoices = invoices.filter((inv) => {
      if (!user || !(user._id || user.id)) return false;
      const roles = Array.isArray(user.role)
        ? user.role
        : user.role
          ? [user.role]
          : [];

      // Admin, Finance Manager, and Finance Partner can see all payouts
      if (
        roles.includes("admin") ||
        roles.includes("finance_manager") ||
        roles.includes("super_admin") ||
        roles.includes("finance_partner")
      ) {
        return true;
      }

      // Bulk settlement batches are already filtered by the backend to only return the current user's assigned batches
      const isBulk =
        inv.settlementType === "bulk" ||
        (inv.coveredQueries && inv.coveredQueries.length > 0);
      if (isBulk) return true;

      // For single invoices, check if this user paid any installment by matching the name
      const userName = user.name || user.companyName || "";
      const installments = Array.isArray(inv.payoutInstallments)
        ? inv.payoutInstallments
        : [];
      if (userName && installments.some((inst) => inst.paidByName === userName))
        return true;

      return false;
    });

    filteredInvoices.forEach((inv) => {
      const entries = getDmcPaymentEntries(inv);
      let periodPayout = 0;
      const matchingEntries = [];

      entries.forEach((entry) => {
        if (isDmcEntryInSelectedPeriod(entry.date)) {
          periodPayout += entry.amount;
          matchingEntries.push(entry);
        }
      });

      if (periodPayout > 0) {
        // Group services inside the invoice
        const items = Array.isArray(inv.items) ? inv.items : [];
        const cqList = Array.isArray(inv.coveredQueries)
          ? inv.coveredQueries
          : [];

        const groups = {};
        let totalBaseSubtotal = 0;
        let totalItemsTax = 0;

        items.forEach((item) => {
          const qCode =
            item.queryCode ||
            item.query?.queryId ||
            inv.queryCode ||
            inv.query?.queryId ||
            "General";
          if (!groups[qCode]) {
            groups[qCode] = {
              queryCode: qCode,
              query: item.query || null,
              destination: item.destination || item.query?.destination || "",
              services: [],
              baseSubtotal: 0,
              itemTax: 0,
              totalCost: 0,
            };
          }
          const subtotal = Number(item.subtotal || 0);
          const tax = Number(item.tax || 0);
          const cost = subtotal + tax;

          groups[qCode].services.push({
            ...item,
            cost,
          });
          groups[qCode].baseSubtotal += subtotal;
          groups[qCode].itemTax += tax;
          groups[qCode].totalCost += cost;
          totalBaseSubtotal += subtotal;
          totalItemsTax += tax;
        });

        cqList.forEach((cq) => {
          const qCode = cq.queryCode || cq.query?.queryId || cq.queryCode;
          if (qCode && !groups[qCode]) {
            groups[qCode] = {
              queryCode: qCode,
              query: cq.query || null,
              destination: cq.destination || "",
              services: [],
              baseSubtotal: 0,
              itemTax: 0,
              totalCost: 0,
              isCoveredOnly: true,
            };
          }
        });

        // Retrieve batch/invoice level taxes
        const gstAmount = Number(
          inv.summary?.gstAmount || inv.claimedSummary?.taxAmount || 0,
        );
        const tcsAmount = Number(inv.summary?.tcsAmount || 0);
        const otherTaxAmount = Number(inv.summary?.otherTaxAmount || 0);

        const hasItemTaxes = totalItemsTax > 0;
        const gstToAllocate = hasItemTaxes ? 0 : gstAmount;

        const divisor = totalBaseSubtotal || inv.summary?.subtotal || 1;

        Object.keys(groups).forEach((qCode) => {
          const group = groups[qCode];
          const ratio = group.baseSubtotal / divisor;

          group.gstShare = hasItemTaxes ? group.itemTax : gstToAllocate * ratio;
          group.tcsShare = tcsAmount * ratio;
          group.otherTaxShare = otherTaxAmount * ratio;
          group.totalCostWithTaxes =
            group.baseSubtotal +
            group.gstShare +
            group.tcsShare +
            group.otherTaxShare;
        });

        list.push({
          invoice: inv,
          payoutAmount: periodPayout,
          entries: matchingEntries,
          isBulk: inv.settlementType === "bulk" || cqList.length > 0,
          queryGroups: Object.values(groups),
          summary: {
            subtotal: inv.summary?.subtotal || totalBaseSubtotal,
            gstAmount: hasItemTaxes ? totalItemsTax : gstAmount,
            tcsAmount,
            otherTaxAmount,
            totalTax:
              (hasItemTaxes ? totalItemsTax : gstAmount) +
              tcsAmount +
              otherTaxAmount,
            grandTotal:
              inv.summary?.grandTotal ||
              inv.claimedSummary?.grandTotal ||
              totalBaseSubtotal +
                (hasItemTaxes ? totalItemsTax : gstAmount) +
                tcsAmount +
                otherTaxAmount,
          },
        });
      }
    });

    return list.sort((a, b) => b.payoutAmount - a.payoutAmount);
  }, [analyticsData.internalInvoices, isDmcEntryInSelectedPeriod, user]);

  const showPayoutAction = contributingPayouts.length > 0;

  const activeReports = useMemo(() => {
    if (
      analyticsData.customReports &&
      (period === "custom" ||
        selectedTaxDate ||
        (period === "monthly" && effectiveSelectedTaxMonth) ||
        (period === "quarterly" && effectiveSelectedTaxQuarter) ||
        (period === "yearly" && effectiveSelectedTaxYear))
    ) {
      return analyticsData.customReports;
    }
    return (
      activePeriodOption?.reports ||
      reportsData?.[period] || {
        query: reportsData.query || defaultAnalytics.reports.query,
        revenue: reportsData.revenue || defaultAnalytics.reports.revenue,
      }
    );
  }, [
    period,
    effectiveSelectedTaxMonth,
    effectiveSelectedTaxYear,
    taxPeriodOptions,
    analyticsData,
    selectedTaxDate,
    selectedTaxMonth,
    selectedTaxYear,
    activePeriodOption,
    reportsData,
  ]);

  const queryReports = activeReports.query || defaultAnalytics.reports.query;
  const revenueReports =
    activeReports.revenue || defaultAnalytics.reports.revenue;
  const tdsSummary =
    activeTaxSummary?.tds ||
    activeTaxSummary?.tdf ||
    defaultAnalytics[period === "custom" || period === "quarterly" ? "monthly" : period].taxSummary.tds;
  const chartData = useMemo(() => {
    if (period === "custom" || period === "quarterly" || selectedTaxDate) {
      if (analyticsData.custom?.chart) return analyticsData.custom.chart;
    }
    return period === "monthly"
      ? reorderChartByCalendar(analyticsData.monthly?.chart || periodData.chart)
      : analyticsData.yearly?.chart || periodData.chart;
  }, [
    period,
    periodData.chart,
    analyticsData.custom,
    analyticsData.monthly?.chart,
    analyticsData.yearly?.chart,
    selectedTaxDate,
  ]);
  const generatedOnLabel = useMemo(() => {
    const sourceDate = analyticsData?.generatedOn
      ? new Date(analyticsData.generatedOn)
      : new Date();
    return sourceDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [analyticsData?.generatedOn]);

  useEffect(() => {
    if (period !== "monthly" || taxPeriodOptions.length === 0) return;

    setSelectedTaxMonth((currentMonth) => {
      const isValidSelection = taxPeriodOptions.some(
        (option) => option.value === currentMonth,
      );
      if (isValidSelection) return currentMonth;

      const currentMonthOption = taxPeriodOptions.find(
        (option) => option.value === defaultTaxMonthValue,
      );

      return currentMonthOption?.value || taxPeriodOptions[0].value;
    });
  }, [defaultTaxMonthValue, period, taxPeriodOptions]);

  useEffect(() => {
    if (period !== "yearly" || yearPeriodOptions.length === 0) return;

    setSelectedTaxYear((currentYear) => {
      const isValidSelection = yearPeriodOptions.some(
        (option) => option.value === currentYear,
      );
      if (isValidSelection) return currentYear;

      const currentYearOption = yearPeriodOptions.find(
        (option) => option.value === defaultTaxYearValue,
      );

      return (
        currentYearOption?.value ||
        yearPeriodOptions[yearPeriodOptions.length - 1].value
      );
    });
  }, [defaultTaxYearValue, period, yearPeriodOptions]);

  useEffect(() => {
    setSelectedTaxDate("");
    if (period === "monthly") {
      setYearMenuOpen(false);
      return;
    }

    setMonthMenuOpen(false);
  }, [period]);

  const metricCards = [
    { key: "inward", icon: TrendingUp },
    { key: "outward", icon: TrendingDown },
    { key: "profit", icon: IndianRupee },
    { key: "margin", icon: TrendingUp },
  ];

  const complianceIsHealthy =
    activeTaxSummary.summaryBar.complianceTone === "success";
  const hasChartData = useMemo(
    () => hasMeaningfulChartData(chartData),
    [chartData],
  );
  const hasTaxData = useMemo(
    () => hasMeaningfulTaxData(activeTaxSummary),
    [activeTaxSummary],
  );
  const canExportOverview = !loading && !error && hasChartData;
  const canExportTax = !loading && !error && hasTaxData;
  const canExportAudit = !loading && !error && (hasChartData || hasTaxData);
  const periodLabel =
    period === "monthly"
      ? "Monthly"
      : period === "yearly"
        ? "Yearly"
        : "Custom";
  const selectedMonthLabel = useMemo(() => {
    if (selectedTaxDate) {
      const date = new Date(selectedTaxDate);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    if (selectedTaxPeriod?.label) return selectedTaxPeriod.label;
    if (!effectiveSelectedTaxMonth) return "";
    const parts = effectiveSelectedTaxMonth.split("-");
    if (parts.length < 2) return effectiveSelectedTaxMonth;
    const [yr, mn] = parts;
    const date = new Date(Number(yr), Number(mn) - 1, 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [selectedTaxPeriod, effectiveSelectedTaxMonth, selectedTaxDate]);

  const selectedYearLabel = useMemo(() => {
    if (selectedYearPeriod?.label) return selectedYearPeriod.label;
    return effectiveSelectedTaxYear || "";
  }, [selectedYearPeriod, effectiveSelectedTaxYear]);

  const selectedQuarterLabel = useMemo(() => {
    if (!effectiveSelectedTaxQuarter) return "";
    const [yr, q] = effectiveSelectedTaxQuarter.split("-");
    return `${q} ${yr}`;
  }, [effectiveSelectedTaxQuarter]);
  const applyPeriodSummaryLabels = useCallback(
    (cards = []) => {
      const titlePrefix = periodLabel.toUpperCase();
      const lowerPrefix = periodLabel.toLowerCase();

      return cards.map((card) => {
        const originalLabel = String(card.label || "");
        const periodLabelText = originalLabel.replace(
          /^MONTHLY\b/i,
          titlePrefix,
        );
        const periodSubText = String(card.sub || "")
          .replace(/\bmonthly\b/gi, lowerPrefix)
          .replace(
            /\bmonth\b/gi,
            lowerPrefix === "yearly"
              ? "year"
              : lowerPrefix === "custom"
                ? "period"
                : "month",
          );

        return {
          ...card,
          label: periodLabelText,
          sub: periodSubText,
          styleKey: card.styleKey || originalLabel,
        };
      });
    },
    [periodLabel],
  );
  const querySummaryCards = useMemo(
    () =>
      applyPeriodSummaryLabels(
        Array.isArray(queryReports.summaryCards)
          ? queryReports.summaryCards
          : [],
      ),
    [applyPeriodSummaryLabels, queryReports.summaryCards],
  );
  const revenueSummaryCards = useMemo(
    () =>
      applyPeriodSummaryLabels(
        Array.isArray(revenueReports.summaryCards)
          ? revenueReports.summaryCards
          : [],
      ),
    [applyPeriodSummaryLabels, revenueReports.summaryCards],
  );
  const monthlyQueryRows = Array.isArray(queryReports.monthlyQueries)
    ? queryReports.monthlyQueries
    : [];
  const destinationQueryRows = Array.isArray(
    queryReports.destinationWiseQueries,
  )
    ? queryReports.destinationWiseQueries
    : [];
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

  const confirmationTrendRows = Array.isArray(queryReports.confirmationTrends)
    ? queryReports.confirmationTrends
    : [];
  const travelDateRevenueRows = Array.isArray(revenueReports.travelDateRevenue)
    ? revenueReports.travelDateRevenue
    : [];
  const travelDateEntries = Array.isArray(revenueReports.travelDateEntries)
    ? revenueReports.travelDateEntries
    : [];
  const destinationProfitRows = Array.isArray(
    revenueReports.destinationProfitability,
  )
    ? revenueReports.destinationProfitability
    : [];

  const totalProfitPages =
    Math.ceil(destinationProfitRows.length / itemsPerPage) || 1;
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
      key: "destination",
      label: "Destination",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-black text-white shadow-sm uppercase">
            {row.destination ? row.destination.charAt(0) : "?"}
          </span>
          <span className="font-bold text-slate-800 tracking-wide text-xs">
            {row.destination}
          </span>
        </div>
      ),
    },
    {
      key: "queries",
      label: "Queries",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center justify-center min-w-[44px] px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100/70 shadow-sm font-mono">
          {row.queries}
        </span>
      ),
    },
    {
      key: "confirmed",
      label: "Confirmed",
      align: "center",
      render: (row) => (
        <span
          className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm font-mono ${
            row.confirmed > 0
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-slate-50 text-slate-400 border border-slate-200/50"
          }`}
        >
          {row.confirmed}
        </span>
      ),
    },
    {
      key: "cancelled",
      label: "Cancelled",
      align: "center",
      render: (row) => (
        <span
          className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm font-mono ${
            row.cancelled > 0
              ? "bg-rose-50 text-rose-700 border border-rose-100"
              : "bg-slate-50 text-slate-400 border border-slate-200/50"
          }`}
        >
          {row.cancelled}
        </span>
      ),
    },
    {
      key: "conversionPercent",
      label: "Conversion",
      align: "center",
      render: (row) => {
        const val = Number(row.conversionPercent || 0);
        let colorClass =
          "bg-slate-50 text-slate-500 border border-slate-200/50";
        if (val > 50) {
          colorClass =
            "bg-emerald-50 text-emerald-700 border border-emerald-100";
        } else if (val > 0) {
          colorClass = "bg-blue-50 text-blue-700 border border-blue-100";
        }
        return (
          <span
            className={`inline-flex items-center justify-center min-w-[50px] px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm font-mono ${colorClass}`}
          >
            {val.toFixed(1).replace(/\.0$/, "")}%
          </span>
        );
      },
    },
  ];
  const confirmationColumns = [
    { key: "label", label: "Month" },
    { key: "confirmed", label: "Confirmed", align: "right" },
    { key: "cancelled", label: "Cancelled", align: "right" },
    {
      key: "conversionPercent",
      label: "Conversion",
      align: "right",
      render: (row) =>
        `${Number(row.conversionPercent || 0)
          .toFixed(1)
          .replace(/\.0$/, "")}%`,
    },
  ];
  const destinationProfitColumns = [
    { key: "destination", label: "Destination" },
    {
      key: "grossRevenueLabel",
      label: "Total Amount",
      align: "right",
      render: (row) => `₹${formatPlainNumber(row.grossRevenue || row.revenue)}`,
    },
    {
      key: "revenueLabel",
      label: "Revenue",
      align: "right",
      render: (row) => `₹${formatPlainNumber(row.revenue)}`,
    },
    {
      key: "pendingRevenueLabel",
      label: "Pending Revenue",
      align: "right",
      render: (row) => {
        const pending = Number(row.pendingRevenue || 0);
        if (pending <= 0) return "-";
        return (
          <span className="font-black text-amber-600">
            ₹{formatPlainNumber(pending)}
          </span>
        );
      },
    },
    {
      key: "offerDiscountLabel",
      label: "Offer / Discount",
      align: "right",
      render: (row) => {
        const discount = Number(row.offerDiscount || 0);
        if (discount <= 0) return "-";
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-black text-emerald-600">
              -₹{formatPlainNumber(discount)}
            </span>
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
      key: "costLabel",
      label: "DMC Cost",
      align: "right",
      render: (row) => `₹${formatPlainNumber(row.cost)}`,
    },
    {
      key: "profitLabel",
      label: "Profit",
      align: "right",
      render: (row) => {
        const profit = Number(row.profit || 0);
        return (
          <span
            className={
              profit < 0
                ? "font-black text-rose-600"
                : "font-black text-slate-800"
            }
          >
            {profit < 0 ? "-" : ""}₹{formatPlainNumber(Math.abs(profit))}
          </span>
        );
      },
    },
    {
      key: "marginPercent",
      label: "Margin",
      align: "right",
      render: (row) => {
        const margin = Number(row.marginPercent || 0);
        return (
          <span
            className={
              margin < 0
                ? "font-black text-rose-600"
                : "font-black text-emerald-600"
            }
          >
            {margin.toFixed(1).replace(/\.0$/, "")}%
          </span>
        );
      },
    },
  ];
  const monthlyBookingRows = Array.isArray(revenueReports.monthlyBookings)
    ? revenueReports.monthlyBookings
    : [];
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
      section: "GST",
      total: activeTaxSummary.gst.total,
      status: activeTaxSummary.gst.status,
      rateLabel: activeTaxSummary.gst.rateLabel,
    },
    {
      section: "TCS",
      total: activeTaxSummary.tcs.total,
      status: activeTaxSummary.tcs.status,
      rateLabel: activeTaxSummary.tcs.rateLabel,
    },
    {
      section: "TDS",
      total: tdsSummary.total,
      status: tdsSummary.status,
      rateLabel: tdsSummary.rateLabel,
    },
    {
      section: "Compliance",
      total: activeTaxSummary.summaryBar.totalTaxCollected,
      status: activeTaxSummary.summaryBar.complianceStatus,
      rateLabel: `Next filing: ${activeTaxSummary.summaryBar.nextFilingDue}`,
    },
  ];
  const escapeReportHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const buildReportCardsHtml = (cards = []) =>
    cards
      .map(
        (item) => `
          <div class="card">
            <div class="meta">${escapeReportHtml(item.label)}</div>
            <div style="font-size: 22px; font-weight: 700;">${escapeReportHtml(item.value)}</div>
            <div>${escapeReportHtml(item.sub || "")}</div>
          </div>
        `,
      )
      .join("");
  const buildReportTableHtml = (columns = [], rows = []) => `
    <table>
      <thead>
        <tr>
          ${columns.map((column) => `<th>${escapeReportHtml(column.label)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                  <tr>
                    ${columns
                      .map(
                        (column) =>
                          `<td>${escapeReportHtml(column.value(row))}</td>`,
                      )
                      .join("")}
                  </tr>
                `,
                )
                .join("")
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
      const title =
        mode === "audit"
          ? `${periodLabel} Audit Report`
          : `${periodLabel} Analytics Report`;
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
              { label: "Period", value: (row) => row.period },
              { label: "Inward", value: (row) => row.inwardLabel },
              { label: "Outward", value: (row) => row.outwardLabel },
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
              { label: "Month", value: (row) => row.label },
              { label: "Queries", value: (row) => row.queries || 0 },
              { label: "Confirmed", value: (row) => row.confirmed || 0 },
              { label: "Cancelled", value: (row) => row.cancelled || 0 },
            ],
            monthlyQueryRows,
          )}

          <h2>Destination Wise Queries</h2>
          ${buildReportTableHtml(
            [
              { label: "Destination", value: (row) => row.destination },
              { label: "Queries", value: (row) => row.queries || 0 },
              { label: "Confirmed", value: (row) => row.confirmed || 0 },
              { label: "Cancelled", value: (row) => row.cancelled || 0 },
              {
                label: "Conversion",
                value: (row) =>
                  `${Number(row.conversionPercent || 0)
                    .toFixed(1)
                    .replace(/\.0$/, "")}%`,
              },
            ],
            destinationQueryRows,
          )}

          <h2>Confirmation Trends</h2>
          ${buildReportTableHtml(
            [
              { label: "Month", value: (row) => row.label },
              { label: "Confirmed", value: (row) => row.confirmed || 0 },
              { label: "Cancelled", value: (row) => row.cancelled || 0 },
              {
                label: "Conversion",
                value: (row) =>
                  `${Number(row.conversionPercent || 0)
                    .toFixed(1)
                    .replace(/\.0$/, "")}%`,
              },
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
              { label: "Month", value: (row) => row.label },
              {
                label: "Revenue",
                value: (row) =>
                  row.revenueLabel || formatCompactCurrency(row.revenue),
              },
              { label: "Bookings", value: (row) => row.bookings || 0 },
            ],
            travelDateRevenueRows,
          )}

          <h2>Monthly Bookings</h2>
          ${buildReportTableHtml(
            [
              { label: "Month", value: (row) => row.label },
              { label: "Bookings", value: (row) => row.bookings || 0 },
            ],
            monthlyBookingRows,
          )}

          <h2>Destination Profitability</h2>
          ${buildReportTableHtml(
            [
              { label: "Destination", value: (row) => row.destination },
              {
                label: "Total Amount",
                value: (row) =>
                  `₹${formatPlainNumber(row.grossRevenue || row.revenue)}`,
              },
              {
                label: "Revenue",
                value: (row) => `₹${formatPlainNumber(row.revenue)}`,
              },
              {
                label: "Pending Review",
                value: (row) =>
                  Number(row.pendingRevenue || 0) > 0
                    ? `₹${formatPlainNumber(row.pendingRevenue)}`
                    : "-",
              },
              {
                label: "Offer / Discount",
                value: (row) =>
                  Number(row.offerDiscount || 0) > 0
                    ? `-₹${formatPlainNumber(row.offerDiscount)}${row.offerLabel ? ` (${row.offerLabel})` : ""}`
                    : "-",
              },
              { label: "DMC Cost", value: (row) => row.costLabel },
              { label: "Profit", value: (row) => row.profitLabel },
              {
                label: "Margin",
                value: (row) =>
                  `${Number(row.marginPercent || 0)
                    .toFixed(1)
                    .replace(/\.0$/, "")}%`,
              },
              { label: "Bookings", value: (row) => row.bookings || 0 },
            ],
            destinationProfitRows,
          )}

          <h2>Tax Summary</h2>
          ${buildReportTableHtml(
            [
              { label: "Section", value: (row) => row.section },
              { label: "Total", value: (row) => row.total },
              { label: "Status", value: (row) => row.status },
              { label: "Note", value: (row) => row.rateLabel },
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
      window.setTimeout(() => setActiveExport(""), 300);
    }
  };

  const handleExcelExport = (mode) => {
    const exportKey = `${mode}-excel`;
    setActiveExport(exportKey);
    try {
      const workbook = XLSX.utils.book_new();
      const summaryRows = [
        ["Holiday Circuit Analytics Report"],
        [
          "Report Type",
          `${periodLabel} ${mode === "audit" ? "Audit" : "Analytics"}`,
        ],
        ["Generated On", generatedOnLabel],
        [],
        ["Financial Metrics"],
        ["Metric", "Value", "Change"],
        ...metricReportRows.map((row) => [row.metric, row.value, row.change]),
        [],
        ["Query Summary"],
        ["Metric", "Value", "Note"],
        ...querySummaryCards.map((item) => [
          item.label,
          item.value,
          item.sub || "",
        ]),
        [],
        ["Revenue Summary"],
        ["Metric", "Value", "Note"],
        ...revenueSummaryCards.map((item) => [
          item.label,
          item.value,
          item.sub || "",
        ]),
        [],
        ["Tax Summary"],
        ["Section", "Total", "Status", "Note"],
        ...taxSummaryRows.map((row) => [
          row.section,
          row.total,
          row.status,
          row.rateLabel,
        ]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      addJsonSheet(
        workbook,
        "Financial Metrics",
        metricReportRows.map((row) => ({
          Metric: row.metric,
          Value: row.value,
          Change: row.change,
        })),
      );
      addJsonSheet(
        workbook,
        "Revenue Trend",
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
        "Query Summary",
        querySummaryCards.map((item) => ({
          Metric: item.label,
          Value: item.value,
          Note: item.sub || "",
        })),
      );
      addJsonSheet(
        workbook,
        "Monthly Queries",
        monthlyQueryRows.map((row) => ({
          Month: row.label,
          Queries: Number(row.queries || 0),
          Confirmed: Number(row.confirmed || 0),
          Cancelled: Number(row.cancelled || 0),
        })),
      );
      addJsonSheet(
        workbook,
        "Destination Queries",
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
        "Confirmation Trends",
        confirmationTrendRows.map((row) => ({
          Month: row.label,
          Confirmed: Number(row.confirmed || 0),
          Cancelled: Number(row.cancelled || 0),
          ConversionPercent: Number(row.conversionPercent || 0),
        })),
      );
      addJsonSheet(
        workbook,
        "Revenue Summary",
        revenueSummaryCards.map((item) => ({
          Metric: item.label,
          Value: item.value,
          Note: item.sub || "",
        })),
      );
      addJsonSheet(
        workbook,
        "Verified Payment Revenue",
        travelDateRevenueRows.map((row) => ({
          Month: row.label,
          Revenue: Number(row.revenue || 0),
          RevenueLabel: row.revenueLabel || formatCompactCurrency(row.revenue),
          Bookings: Number(row.bookings || 0),
        })),
      );
      addJsonSheet(
        workbook,
        "Monthly Bookings",
        monthlyBookingRows.map((row) => ({
          Month: row.label,
          Bookings: Number(row.bookings || 0),
        })),
      );
      addJsonSheet(
        workbook,
        "Destination Profit",
        destinationProfitRows.map((row) => ({
          Destination: row.destination,
          TotalAmount: Number(row.grossRevenue || row.revenue || 0),
          TotalAmountLabel:
            row.grossRevenueLabel ||
            `₹${formatPlainNumber(row.grossRevenue || row.revenue)}`,
          Revenue: Number(row.revenue || 0),
          RevenueLabel: row.revenueLabel,
          PendingReview: Number(row.pendingRevenue || 0),
          PendingReviewLabel:
            Number(row.pendingRevenue || 0) > 0
              ? formatPlainNumber(row.pendingRevenue)
              : "-",
          OfferDiscount: Number(row.offerDiscount || 0),
          OfferDiscountLabel:
            Number(row.offerDiscount || 0) > 0
              ? `-${formatPlainNumber(row.offerDiscount)}`
              : "-",
          OfferDetails: row.offerLabel || "",
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
        "Tax Summary",
        taxSummaryRows.map((row) => ({
          Section: row.section,
          Total: row.total,
          Status: row.status,
          Note: row.rateLabel,
        })),
      );

      XLSX.writeFile(workbook, `holiday-circuit-${period}-${mode}-report.xlsx`);
    } finally {
      window.setTimeout(() => setActiveExport(""), 300);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-6  max-w-7xl mx-auto text-slate-800 pb-1 bg-slate-50 min-h-screen"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Advanced Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive financial insights and tax reporting
          </p>
        </div>
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <div className="flex flex-wrap xl:flex-nowrap justify-center items-center gap-1 bg-gray-100 rounded-2xl xl:rounded-full px-1 py-1">
              <PeriodDropdownTab
                active={period === "monthly"}
                label="Monthly"
                selectedLabel={selectedMonthLabel}
                menuOpen={monthMenuOpen}
                onSelectTab={() => {
                  setQuarterMenuOpen(false);
                  setYearMenuOpen(false);
                  setPeriod("monthly");
                }}
                onToggleMenu={() => {
                  setQuarterMenuOpen(false);
                  setYearMenuOpen(false);
                  setPeriod("monthly");
                  setMonthMenuOpen((isOpen) => !isOpen);
                }}
              />
              <PeriodDropdownTab
                active={period === "quarterly"}
                label="Quarterly"
                selectedLabel={selectedQuarterLabel}
                menuOpen={quarterMenuOpen}
                onSelectTab={() => {
                  setMonthMenuOpen(false);
                  setYearMenuOpen(false);
                  setPeriod("quarterly");
                }}
                onToggleMenu={() => {
                  setMonthMenuOpen(false);
                  setYearMenuOpen(false);
                  setPeriod("quarterly");
                  setQuarterMenuOpen((isOpen) => !isOpen);
                }}
              />
              <PeriodDropdownTab
                active={period === "yearly"}
                label="Yearly"
                selectedLabel={selectedYearLabel}
                menuOpen={yearMenuOpen}
                onSelectTab={() => {
                  setMonthMenuOpen(false);
                  setQuarterMenuOpen(false);
                  setPeriod("yearly");
                }}
                onToggleMenu={() => {
                  setMonthMenuOpen(false);
                  setQuarterMenuOpen(false);
                  setPeriod("yearly");
                  setYearMenuOpen((isOpen) => !isOpen);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setMonthMenuOpen(false);
                  setYearMenuOpen(false);
                  setPeriod((prev) =>
                    prev === "custom" ? "monthly" : "custom",
                  );
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ease-out cursor-pointer relative z-10 whitespace-nowrap shrink-0 ${
                  period === "custom"
                    ? "text-white font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {period === "custom" && (
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
            {period === "monthly" && monthMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={effectiveSelectedTaxMonth}
                    onChange={(e) => {
                      setSelectedTaxDate("");
                      setSelectedTaxMonth(e.target.value);
                    }}
                    className="mt-1 w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
            {period === "quarterly" && quarterMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2 mb-3 select-none">
                    <button
                      type="button"
                      onClick={() => setPickerQuarterYear((prev) => prev - 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-bold text-slate-700">
                      {pickerQuarterYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickerQuarterYear((prev) => prev + 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((q) => {
                      const val = `${pickerQuarterYear}-Q${q}`;
                      const isSelected = effectiveSelectedTaxQuarter === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setSelectedTaxDate("");
                            setSelectedTaxQuarter(val);
                            setQuarterMenuOpen(false);
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white shadow"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                          } cursor-pointer`}
                        >
                          Q{q} {pickerQuarterYear}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            {period === "yearly" && yearMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
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
                    {Array.from(
                      { length: 12 },
                      (_, idx) => pickerYearStart + idx,
                    ).map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setSelectedTaxYear(String(year));
                        }}
                        className={`rounded-lg py-2 text-center text-xs font-semibold transition cursor-pointer ${
                          effectiveSelectedTaxYear === String(year)
                            ? "bg-slate-900 text-white font-bold shadow-sm"
                            : "bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto mt-2 xl:mt-0">
            <ExportButton
              icon={FileText}
              label={`${periodLabel} PDF`}
              color="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5"
              onClick={() => handlePrintReport("overview")}
              disabled={!canExportOverview}
              loading={activeExport === "overview-pdf"}
            />
            <ExportButton
              icon={FileSpreadsheet}
              label={`${periodLabel} Excel`}
              color="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
              onClick={() => handleExcelExport("overview")}
              disabled={!canExportOverview}
              loading={activeExport === "overview-excel"}
            />
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {period === "custom" && (
          <motion.div
            key="custom-range-panel"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Custom Date Range
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Start Date
                  </label>
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
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    End Date
                  </label>
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

      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ">
          {metricCards.map(({ key, icon }) => (
            <MetricCard
              key={key}
              data={activeMetrics[key]}
              icon={icon}
              loading={loading}
              onPayoutClick={
                key === "outward"
                  ? () => setShowPayoutDropdown(!showPayoutDropdown)
                  : undefined
              }
              showPayoutAction={showPayoutAction}
            />
          ))}
        </div>

        <AnimatePresence>
          {showPayoutAction && showPayoutDropdown && (
            <>
              {/* Blurred Backdrop overlay */}
              <motion.div
                key="payout-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-slate-900/15 backdrop-blur-xs pointer-events-none"
              />
              <PayoutBreakdownDropdown
                ref={payoutDropdownRef}
                key="payout-dropdown"
                isOpen={showPayoutDropdown}
                onClose={() => setShowPayoutDropdown(false)}
                contributingPayouts={contributingPayouts}
                periodLabel={
                  selectedMonthLabel || selectedYearLabel || periodLabel
                }
                loading={loading}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 shadow-md border border-slate-800">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-wide">
            Detailed Analytics Reports
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
            Explore detailed query trends and revenue insights by category.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0 sm:justify-end">
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
          <button
            type="button"
            onClick={() => window.open('/finance/bookingStatistics', '_blank')}
            className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(168,85,247,0.25)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            Booking Statistics
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">
                Revenue vs. Payable Trend
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">
              Inward Money (Agents) vs Outward Money (DMC) —{" "}
              {period === "monthly" ? "12 Month View" : "6 Year View"}
            </p>
          </div>
          <div className="flex items-center gap-5 ml-6 sm:ml-0">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className="inline-block w-8 h-0.5 rounded"
                style={{ background: "#16a34a" }}
              />
              Inward (Agents)
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className="inline-block w-8 h-0.5 rounded"
                style={{ background: "#dc2626" }}
              />
              Outward (DMC)
            </span>
          </div>
        </div>

        <AnimatedChart
          key={period}
          chartData={chartData}
          onPointClick={handleChartPointClick}
        />

        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: "#16a34a" }}
            />
            Inward (Agents)
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: "#dc2626" }}
            />
            Outward (DMC)
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200/85 rounded-2xl shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-transparent gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Tax Summary
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Period: {loading ? "Loading..." : activeTaxSummary.periodLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => handleExcelExport("tax")}
              disabled={!canExportTax}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 duration-200 cursor-pointer ${
                canExportTax
                  ? "bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white hover:opacity-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {activeExport === "tax-excel"
                ? "Preparing report..."
                : `Download ${periodLabel} Tax Report`}
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
            icon={ReceiptIndianRupee}
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
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Total Tax Collected
            </p>
            <p className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              {loading ? "..." : activeTaxSummary.summaryBar.totalTaxCollected}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Tax as % of Revenue
            </p>
            <p className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {loading ? "..." : activeTaxSummary.summaryBar.taxAsPercent}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Compliance Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${complianceIsHealthy ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"}`}
              />
              <span
                className={`text-sm font-bold tracking-wide ${complianceIsHealthy ? "text-emerald-400" : "text-amber-400"}`}
              >
                {loading
                  ? "Loading..."
                  : activeTaxSummary.summaryBar.complianceStatus}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Next Filing Due
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400 tracking-wide">
                {loading
                  ? generatedOnLabel
                  : activeTaxSummary.summaryBar.nextFilingDue}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Download Complete Audit Report
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate comprehensive financial audit report including all
            transactions, tax summaries, and analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <ExportButton
            icon={FileText}
            label={`${periodLabel} Audit PDF`}
            color="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5"
            onClick={() => handlePrintReport("audit")}
            disabled={!canExportAudit}
            loading={activeExport === "audit-pdf"}
          />
          <ExportButton
            icon={FileSpreadsheet}
            label={`${periodLabel} Audit Excel`}
            color="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
            onClick={() => handleExcelExport("audit")}
            disabled={!canExportAudit}
            loading={activeExport === "audit-excel"}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        <StatsModal
          showStatsModal={showStatsModal}
          setShowStatsModal={setShowStatsModal}
          isStatsYearlyView={isStatsYearlyView}
          statsModalPeriodLabel={statsModalPeriodLabel}
          statsModalMode={statsModalMode}
          setStatsModalMode={setStatsModalMode}
          statsSelectedAgent={statsSelectedAgent}
          setStatsSelectedAgent={setStatsSelectedAgent}
          statsSelectedDmc={statsSelectedDmc}
          setStatsSelectedDmc={setStatsSelectedDmc}
          setStatsSelectedQueries={setStatsSelectedQueries}
          statsSelectedQueries={statsSelectedQueries}
          availableAgents={availableAgents}
          availableDmcs={availableDmcs}
          statsSummary={statsSummary}
          statsModalCardText={statsModalCardText}
          statsDailyCardTrends={statsDailyCardTrends}
          statsProfitSummary={statsProfitSummary}
          filteredTravelStatsInvoices={filteredTravelStatsInvoices}
          filteredTravelStatsInternalInvoices={
            filteredTravelStatsInternalInvoices
          }
          statsModalYear={statsModalYear}
          statsPaymentYearMonth={statsPaymentYearMonth}
          statsModalMonth={statsModalMonth}
          statsDailyData={statsDailyData}
          statsDailyLabels={statsDailyLabels}
          statsDailyDetails={statsDailyDetails}
          formatPlainNumber={formatPlainNumber}
          getAgentPaymentEntries={getAgentPaymentEntries}
          getInvoiceTotalAmount={getInvoiceTotalAmount}
          getPaymentAmountInYear={getPaymentAmountInYear}
          getPaymentAmountInMonth={getPaymentAmountInMonth}
          getInvoicePaidAmount={getInvoicePaidAmount}
          getTravelDateLabel={getTravelDateLabel}
          getDmcPaymentEntries={getDmcPaymentEntries}
          getDmcPaidAmount={getDmcPaidAmount}
          getDaysInMonth={getDaysInMonth}
        />

        {/* Query Analytics Modal */}
        <QueryAnalyticsModal
          showQueryModal={showQueryModal}
          setShowQueryModal={setShowQueryModal}
          querySummaryCards={querySummaryCards}
          loading={loading}
          monthlyQueryRows={monthlyQueryRows}
          confirmationColumns={confirmationColumns}
          confirmationTrendRows={confirmationTrendRows}
          destinationQueryColumns={destinationQueryColumns}
          paginatedDestinationRows={paginatedDestinationRows}
          destinationQueryRows={destinationQueryRows}
          itemsPerPage={itemsPerPage}
          startIdx={startIdx}
          endIdx={endIdx}
          destinationPage={destinationPage}
          setDestinationPage={setDestinationPage}
          totalPages={totalPages}
          ReportSummaryCard={ReportSummaryCard}
          ReportBars={ReportBars}
          ReportTable={ReportTable}
        />

        {/* Revenue Analytics Modal */}
        <RevenueAnalyticsModal
          showRevenueModal={showRevenueModal}
          setShowRevenueModal={setShowRevenueModal}
          revenueSummaryCards={revenueSummaryCards}
          loading={loading}
          showRevenueChecklist={showRevenueChecklist}
          setShowRevenueChecklist={setShowRevenueChecklist}
          checklistData={checklistData}
          effectiveSelectedTaxMonth={effectiveSelectedTaxMonth}
          effectiveSelectedTaxQuarter={effectiveSelectedTaxQuarter}
          effectiveSelectedTaxYear={effectiveSelectedTaxYear}
          selectedPastMonthOverride={selectedPastMonthOverride}
          setSelectedPastMonthOverride={setSelectedPastMonthOverride}
          selectedUpcomingMonthOverride={selectedUpcomingMonthOverride}
          setSelectedUpcomingMonthOverride={setSelectedUpcomingMonthOverride}
          pastMonthsList={pastMonthsList}
          period={period}
          appliedCustomRange={appliedCustomRange}
          travelDateEntries={travelDateEntries}
          previousMonthRevenueTotal={previousMonthRevenueTotal}
          destinationProfitColumns={destinationProfitColumns}
          paginatedProfitRows={paginatedProfitRows}
          destinationProfitRows={destinationProfitRows}
          itemsPerPage={itemsPerPage}
          startProfitIdx={startProfitIdx}
          endProfitIdx={endProfitIdx}
          profitabilityPage={profitabilityPage}
          setProfitabilityPage={setProfitabilityPage}
          totalProfitPages={totalProfitPages}
          ReportSummaryCard={ReportSummaryCard}
          RevenueChecklistTable={RevenueChecklistTable}
          RevenueAnalyticsChart={RevenueAnalyticsChart}
          ReportTable={ReportTable}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedAnalytics;
