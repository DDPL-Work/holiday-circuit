import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Search, ChevronDown, Eye, Cloud, CheckCircle,
  FileDown, Calendar, X, AlertCircle, ArrowUpRight, Check, RefreshCw,
  Clock, AlertTriangle, TrendingUp, IndianRupee, Upload
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import API from '../../utils/Api';
import InvoiceDocumentModal from '../../modal/InvoiceDocumentModal';
import ManualBulkInvoiceUploadModal from '../../modal/ManualBulkInvoiceUploadModal';

const BANK_LOGOS = {
  'HDFC Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-blue-900/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" fill="#004C8F" />
      <rect x="3" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="3" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
    </svg>
  ),
  'ICICI Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-full border border-orange-500/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#F58220" />
      <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM10.5 7H13.5V9H10.5V7ZM10.5 10.5H13.5V17H10.5V10.5Z" fill="#7A1C1C" />
    </svg>
  ),
  'State Bank of India': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-full border border-sky-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#00B3E3" />
      <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      <rect x="11" y="12" width="2" height="9" fill="#FFFFFF" />
    </svg>
  ),
  'Axis Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-red-950/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" fill="#841A41" />
      <path d="M12 4L4 18H8.5L12 11L15.5L18 18H22.5L12 4Z" fill="#FFFFFF" />
      <path d="M12 14.5L10 18H14L12 14.5Z" fill="#841A41" />
    </svg>
  ),
  'Kotak Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-full border border-red-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#EE1C25" />
      <path d="M8 7H10V11L14 7H16.5L12.5 11.5L17 17H14.5L11 12.8V17H8V7Z" fill="#FFFFFF" />
    </svg>
  ),
};

const amountColor = {
  Pending: "text-amber-500",
  Overdue: "text-red-500",
  Paid: "text-green-500",
  Submitted: "text-amber-500",
  "In Review": "text-blue-500",
  Approved: "text-green-500",
  Rejected: "text-red-500",
  "Partially Paid": "text-amber-500",
};

const formatCurrency = (value, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const statsCardConfig = [
  {
    key: "totalInvoices",
    title: "Total Invoices",
    color: "text-blue-600",
    accentColor: "border-b-blue-500",
    cardBg: "from-blue-50/90 via-white to-blue-50/20",
    borderColor: "border-blue-100 hover:border-blue-300",
    iconBg: "bg-blue-100/80 text-blue-600",
    shadowColor: "shadow-blue-500/5",
    icon: FileText,
  },
  {
    key: "pending",
    title: "Pending",
    color: "text-amber-600",
    accentColor: "border-b-amber-500",
    cardBg: "from-amber-50/90 via-white to-amber-50/20",
    borderColor: "border-amber-100 hover:border-amber-300",
    iconBg: "bg-amber-100/80 text-amber-600",
    shadowColor: "shadow-amber-500/5",
    icon: Clock,
  },
  {
    key: "paid",
    title: "Paid",
    color: "text-emerald-600",
    accentColor: "border-b-emerald-500",
    cardBg: "from-emerald-50/90 via-white to-emerald-50/20",
    borderColor: "border-emerald-100 hover:border-emerald-300",
    iconBg: "bg-emerald-100/80 text-emerald-600",
    shadowColor: "shadow-emerald-500/5",
    icon: CheckCircle,
  },
  {
    key: "overdue",
    title: "Overdue",
    color: "text-rose-600",
    accentColor: "border-b-rose-500",
    cardBg: "from-rose-50/90 via-white to-rose-50/20",
    borderColor: "border-rose-100 hover:border-rose-300",
    iconBg: "bg-rose-100/80 text-rose-600",
    shadowColor: "shadow-rose-500/5",
    icon: AlertTriangle,
  },
  {
    key: "totalAmount",
    title: "Total Revenue",
    color: "text-yellow-600",
    accentColor: "border-b-yellow-500",
    cardBg: "from-yellow-50/90 via-white to-yellow-50/20",
    borderColor: "border-yellow-100 hover:border-yellow-300",
    iconBg: "bg-yellow-100/80 text-yellow-600",
    shadowColor: "shadow-yellow-500/5",
    money: true,
    icon: TrendingUp,
  },
  {
    key: "pendingAmount",
    title: "Pending Amount",
    color: "text-orange-600",
    accentColor: "border-b-orange-500",
    cardBg: "from-orange-50/90 via-white to-orange-50/20",
    borderColor: "border-orange-100 hover:border-orange-300",
    iconBg: "bg-orange-100/80 text-orange-600",
    shadowColor: "shadow-orange-500/5",
    money: true,
    icon: IndianRupee,
  },
];

const StatusBadge = ({ status, method }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    Overdue: "bg-red-50 text-red-600 border-red-200 animate-pulse",
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Submitted: "bg-amber-50 text-amber-600 border-amber-200",
    "In Review": "bg-blue-50 text-blue-600 border-blue-200",
    Approved: "bg-green-50 text-green-600 border-green-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
    "Partially Paid": "bg-orange-50 text-orange-600 border-orange-200",
  };
  return (
    <div className="flex flex-col items-start">
      <span className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
        {status}
      </span>
      {method && (
        <span className="mt-px block whitespace-nowrap text-[8px] font-medium leading-3 text-slate-400">
          {method}
        </span>
      )}
    </div>
  );
};

const withinDateFilter = (value, dateFilter) => {
  if (!value || dateFilter === "All Time") return true;

  const invoiceDate = new Date(value);
  if (Number.isNaN(invoiceDate.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  invoiceDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((today - invoiceDate) / (1000 * 60 * 60 * 24));

  if (dateFilter === "Last 7 Days") return diffDays >= 0 && diffDays <= 7;
  if (dateFilter === "Last 30 Days") return diffDays >= 0 && diffDays <= 30;
  if (dateFilter === "This Month") {
    return (
      invoiceDate.getMonth() === today.getMonth() &&
      invoiceDate.getFullYear() === today.getFullYear()
    );
  }

  return true;
};

const isDatePast = (value) => {
  if (!value) return false;

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate < today;
};

const getInvoiceDisplayStatus = (status, dueDateValue) => {
  if (status === "Paid") return "Paid";
  if (status === "Partially Paid") return "Partially Paid";
  if (status === "Rejected") return "Rejected";
  return isDatePast(dueDateValue) ? "Overdue" : "Pending";
};

const InternalInvoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedTrackerInvoice, setSelectedTrackerInvoice] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ summary: {}, invoices: [] });
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const { data: invoiceResponse } = await API.get("/admin/internal-invoices");

      setInvoiceData(invoiceResponse?.data || { summary: {}, invoices: [] });
    } catch (error) {
      console.error("Failed to fetch finance internal invoice data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const invoicesData = useMemo(
    () =>
      (invoiceData.invoices || []).map((invoice) => {
        const payoutInstallments = invoice.payoutInstallments || [];
        const cumulativePaid = payoutInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
        const remainingAmount = Math.max(0, Number(invoice.amount || 0) - cumulativePaid);

        return {
          _id: invoice.id,
          id: invoice.invoiceNumber,
          isDmc: true,
          ref: invoice.queryId,
          party: invoice.dmcName,
          utr:
            invoice.utrNumber ||
            invoice.utr ||
            invoice.transactionReference ||
            invoice.payoutReference ||
            "Pending",
          bank: invoice.bankName || invoice.sourceBank || invoice.payoutBank || "Pending",
          hasBank: Boolean(invoice.bankName || invoice.sourceBank || invoice.payoutBank),
          date: invoice.dueDate || invoice.invoiceDate,
          amountValue: Number(invoice.amount || 0),
          amount: formatCurrency(invoice.amount, invoice.currency),
          remainingAmountValue: remainingAmount,
          remainingAmount: formatCurrency(remainingAmount, invoice.currency),
          payoutInstallments: payoutInstallments,
          cumulativePaid: cumulativePaid,
          agreedRate: formatCurrency(invoice.opsServicesTotal || 0, invoice.currency),
          agreedRateValue: Number(invoice.opsServicesTotal || 0),
          dmcInvoiceAmount: formatCurrency(invoice.dmcServicesTotal || 0, invoice.currency),
          dmcInvoiceAmountValue: Number(invoice.dmcServicesTotal || 0),
          taxValue: Number(invoice.tax || 0),
          tax: formatCurrency(invoice.tax, invoice.currency),
          dmcEmail: invoice.dmcEmail || "",
          dmcPhone: invoice.dmcPhone || "",
          startDate: invoice.startDate || "",
          endDate: invoice.endDate || "",
          adults: Number(invoice.adults || 0),
          children: Number(invoice.children || 0),
          destination: invoice.destination || "",
          status: getInvoiceDisplayStatus(invoice.status, invoice.dueDateValue || invoice.invoiceDateValue),
          method:
            invoice.invoiceSource === "uploaded_invoice"
              ? "Uploaded Invoice"
              : invoice.templateVariant,
          invoiceSource: invoice.invoiceSource || "system_template",
          uploadedInvoice: invoice.uploadedInvoice || {},
          claimedSummary: invoice.claimedSummary || {},
          taxConfig: invoice.taxConfig || {},
          summary: invoice.summary || {},
          dateValue: invoice.dueDateValue || invoice.invoiceDateValue,
          creditPeriodDays: Number(invoice.creditPeriodDays || 7),
          creditTermLabel: invoice.creditTermLabel || `${Number(invoice.creditPeriodDays || 7)}-day credit`,
          quotationNumber: invoice.quotationNumber,
          items: invoice.items || [],
          documents: invoice.documents || [],
        };
      }),
    [invoiceData.invoices],
  );

  const statsData = useMemo(() => {
    const totals = invoicesData.reduce(
      (acc, invoice) => {
        acc.totalInvoices += 1;
        acc.totalAmount += invoice.amountValue;

        if (invoice.status === "Pending") {
          acc.pending += 1;
          acc.pendingAmount += invoice.remainingAmountValue;
        }

        if (invoice.status === "Overdue") {
          acc.overdue += 1;
          acc.pendingAmount += invoice.remainingAmountValue;
        }

        if (invoice.status === "Partially Paid") {
          acc.pending += 1;
          acc.pendingAmount += invoice.remainingAmountValue;
        }

        if (invoice.status === "Paid") {
          acc.paid += 1;
        }

        return acc;
      },
      {
        totalInvoices: 0,
        pending: 0,
        paid: 0,
        overdue: 0,
        totalAmount: 0,
        pendingAmount: 0,
      },
    );

    return statsCardConfig.map((stat) => ({
      ...stat,
      value: stat.money ? formatCurrency(totals[stat.key] || 0) : totals[stat.key] || 0,
    }));
  }, [invoicesData]);

  const openModal = (invoice) => setSelectedInvoice(invoice);
  const closeModal = () => setSelectedInvoice(null);
  const handleInvoiceUpdated = (updatedInvoice) => {
    if (!updatedInvoice?.id) return;

    setInvoiceData((prev) => ({
      ...prev,
      invoices: (prev.invoices || []).map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
      ),
    }));
    setSelectedInvoice((prev) =>
      prev?._id === updatedInvoice.id
        ? {
            ...prev,
            _id: updatedInvoice.id,
            utr:
              updatedInvoice.utrNumber ||
              updatedInvoice.utr ||
              updatedInvoice.transactionReference ||
              updatedInvoice.payoutReference ||
              "Pending",
            bank:
              updatedInvoice.bankName ||
              updatedInvoice.sourceBank ||
              updatedInvoice.payoutBank ||
              "Pending",
            hasBank: Boolean(
              updatedInvoice.bankName || updatedInvoice.sourceBank || updatedInvoice.payoutBank,
            ),
            date: updatedInvoice.dueDate || updatedInvoice.invoiceDate,
            amountValue: Number(updatedInvoice.amount || 0),
            amount: formatCurrency(updatedInvoice.amount, updatedInvoice.currency),
            agreedRate: formatCurrency(updatedInvoice.opsServicesTotal || 0, updatedInvoice.currency),
            agreedRateValue: Number(updatedInvoice.opsServicesTotal || 0),
            dmcInvoiceAmount: formatCurrency(
              updatedInvoice.dmcServicesTotal || 0,
              updatedInvoice.currency,
            ),
            dmcInvoiceAmountValue: Number(updatedInvoice.dmcServicesTotal || 0),
            taxValue: Number(updatedInvoice.tax || 0),
            tax: formatCurrency(updatedInvoice.tax, updatedInvoice.currency),
            dmcEmail: updatedInvoice.dmcEmail || prev?.dmcEmail || "",
            dmcPhone: updatedInvoice.dmcPhone || prev?.dmcPhone || "",
            startDate: updatedInvoice.startDate || prev?.startDate || "",
            endDate: updatedInvoice.endDate || prev?.endDate || "",
            adults: Number(updatedInvoice.adults ?? prev?.adults ?? 0),
            children: Number(updatedInvoice.children ?? prev?.children ?? 0),
            destination: updatedInvoice.destination || prev?.destination || "",
            status: getInvoiceDisplayStatus(
              updatedInvoice.status,
              updatedInvoice.dueDateValue || updatedInvoice.invoiceDateValue,
            ),
            method:
              updatedInvoice.invoiceSource === "uploaded_invoice"
                ? "Uploaded Invoice"
                : updatedInvoice.templateVariant,
            invoiceSource: updatedInvoice.invoiceSource || prev?.invoiceSource || "system_template",
            uploadedInvoice: updatedInvoice.uploadedInvoice || prev?.uploadedInvoice || {},
            claimedSummary: updatedInvoice.claimedSummary || prev?.claimedSummary || {},
            taxConfig: updatedInvoice.taxConfig || prev?.taxConfig || {},
            summary: updatedInvoice.summary || prev?.summary || {},
            dateValue: updatedInvoice.dueDateValue || updatedInvoice.invoiceDateValue,
            quotationNumber: updatedInvoice.quotationNumber,
            items: updatedInvoice.items || [],
            documents: updatedInvoice.documents || [],
            payoutReference: updatedInvoice.payoutReference || "",
            payoutDate: updatedInvoice.payoutDate || "",
            payoutDateValue: updatedInvoice.payoutDateValue || updatedInvoice.payoutDate || "",
            payoutBank: updatedInvoice.payoutBank || "",
            payoutAmount: Number(updatedInvoice.payoutAmount || 0),
          }
        : prev,
    );
  };

  const filteredInvoices = useMemo(() => {
    return invoicesData.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        String(invoice.id || "").toLowerCase().includes(searchLower) ||
        String(invoice.ref || "").toLowerCase().includes(searchLower) ||
        String(invoice.party || "").toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "All Status" || invoice.status === statusFilter;

      const matchesDate = withinDateFilter(invoice.dateValue, dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, invoicesData, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, invoicesData.length]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-full flex flex-col gap-4 max-w-400 mx-auto text-slate-800 w-full overflow-x-hidden sm:p- ">

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Internal Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track all internal invoices</p>
        </div>

        <div className="flex items-start gap-3 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-blue-700 hover:from-slate-950 hover:to-blue-800 active:scale-95 active:translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out text-white px-4.5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md"
          >
            <Upload className="w-4 h-4" />
            Upload Bulk Invoice
          </button>
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-600 active:scale-95 active:translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out text-white px-4.5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20">
            <FileDown className="w-4 h-4" />
            Export Finance Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
        {statsData.map((stat, idx) => {
          const IconComponent = stat.icon || FileText;
          return (
            <div key={idx} className={`bg-gradient-to-br ${stat.cardBg} border ${stat.borderColor} border-b-4 ${stat.accentColor} rounded-xl p-3.5 shadow-sm hover:shadow-md ${stat.shadowColor} flex items-center justify-between hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out group`}>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                <p className={`text-lg font-extrabold tracking-tight ${stat.color}`}>{loading ? "..." : stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 ease-out shadow-inner`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col lg:flex-row justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, booking ref, or party name..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Rejected">Rejected</option>
              <option value="Paid">Paid</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="finance-transparent-scrollbar overflow-x-auto overflow-y-hidden pb-2">
          <div className="min-w-305">
            <table className="w-full table-fixed border-separate border-spacing-y-2">
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>

            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Invoice No.</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Booking Ref</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Party Name</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">UTR Number</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bank Name</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Payment Due Date</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-3 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-sm">
                    Loading internal invoices...
                  </td>
                </tr>
              ) : paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice, idx) => {
                  const rowCellClass = "border-y border-slate-200 bg-white px-3 py-2.5 align-middle";
                  return (
                  <tr key={idx} className="transition-transform duration-150 hover:-translate-y-[1px]">
                    <td className={`${rowCellClass} rounded-l-xl border-l`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-800 truncate min-w-0">{invoice.id}</span>
                        {invoice.isDmc && (
                          <span className="shrink-0 bg-purple-50 text-purple-600 border border-purple-200 text-[8px] font-bold px-1 py-px rounded uppercase">DMC</span>
                        )}
                      </div>
                    </td>

                    <td className={rowCellClass}>
                      <span className="text-[11px] text-slate-500 block whitespace-nowrap">{invoice.ref}</span>
                    </td>

                    <td className={rowCellClass}>
                      <span className="text-[11px] text-slate-800 font-medium truncate block">{invoice.party}</span>
                    </td>

                    <td className={rowCellClass}>
                      {invoice.utr === "Pending" ? (
                        <span className="inline-flex w-fit items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-600 whitespace-nowrap">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex w-fit items-center rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 whitespace-nowrap" title={invoice.utr}>
                          {invoice.utr}
                        </span>
                      )}
                    </td>

                    <td className={rowCellClass}>
                      {invoice.hasBank ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          {BANK_LOGOS[invoice.bank]}
                          <span className="text-[11px] font-semibold text-slate-700 truncate min-w-0">{invoice.bank}</span>
                        </div>
                      ) : (
                        <span className="inline-flex w-fit items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-600 whitespace-nowrap">
                          {invoice.bank}
                        </span>
                      )}
                    </td>

                    <td className={rowCellClass}>
                      <div className="flex items-center gap-1 min-w-0 whitespace-nowrap">
                        <Calendar className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="text-[11px] text-slate-500 truncate">{invoice.date}</span>
                      </div>
                      <span className="mt-px block text-[9px] leading-3 text-slate-400">{invoice.creditTermLabel}</span>
                    </td>

                    <td className={rowCellClass}>
                      <span className={`text-[11px] font-bold block whitespace-nowrap ${amountColor[invoice.status] || "text-slate-700"}`}>{invoice.amount}</span>
                      <span className="mt-px block text-[9px] leading-3 text-slate-400">Tax: {invoice.tax}</span>
                    </td>

                    <td className={rowCellClass}>
                      <StatusBadge status={invoice.status} method={invoice.method} />
                    </td>

                    <td className={`${rowCellClass} rounded-r-xl border-r`}>
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openModal(invoice)}
                          className="rounded-full p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedTrackerInvoice(invoice)}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Finance Queue"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={invoice.status === 'Paid'}
                          className={invoice.status === 'Paid' ? 'rounded-full p-1 text-green-400/40 cursor-not-allowed' : 'rounded-full p-1 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer'}
                          title="Review Ready"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-sm">
                    No invoices match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
          <span className="text-xs font-medium text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              {Array.from({ length: totalPages }).map((_, index) => {
                if (
                  totalPages > 5 &&
                  index !== 0 &&
                  index !== totalPages - 1 &&
                  Math.abs(currentPage - 1 - index) > 1
                ) {
                  if (index === 1 && currentPage > 3) {
                    return <span key={index} className="px-1 text-gray-400">...</span>;
                  }
                  if (index === totalPages - 2 && currentPage < totalPages - 2) {
                    return <span key={index} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      currentPage === index + 1
                        ? "bg-slate-900 text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDocumentModal
          invoice={selectedInvoice}
          onClose={closeModal}
          onInvoiceUpdated={handleInvoiceUpdated}
        />
      )}

      <AnimatePresence>
        {showBulkUpload && (
          <ManualBulkInvoiceUploadModal
            onClose={() => setShowBulkUpload(false)}
            onUploaded={() => fetchPageData()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTrackerInvoice && (
          <PaymentTrackerModal
            invoice={selectedTrackerInvoice}
            onClose={() => setSelectedTrackerInvoice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentTrackerModal = ({ invoice, onClose }) => {
  const total = Number(invoice.amountValue || 0);
  const paid = Number(invoice.cumulativePaid || 0);
  const remaining = Number(invoice.remainingAmountValue || 0);
  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

  const R = 40;
  const C = 2 * Math.PI * R;
  const strokeDashoffset = C - (C * paidPercent) / 100;

  const installments = invoice.payoutInstallments || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]"
      >
        {/* Glowing header banner with brand colors */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 px-5 py-4 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-400">
                Payment Tracker System
              </p>
              <h2 className="mt-1 text-base font-bold tracking-tight">
                {invoice.party} <span className="text-slate-400">|</span> {invoice.id}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Booking Ref: {invoice.ref} • Credit Term: {invoice.creditTermLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal content body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 hide-scrollbar">

          {/* Visual Progress ring and Stat block */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">

            {/* Custom SVG Progress Donut Ring */}
            <div className="flex flex-col items-center justify-center p-1">
              <div className="relative h-28 w-28">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    className="stroke-slate-200"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    className="stroke-emerald-500 transition-all duration-500 ease-out"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={C}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-slate-800 leading-none">{paidPercent}%</span>
                  <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">Settled</span>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                Payout Progress Tracker
              </p>
            </div>

            {/* Side summary values */}
            <div className="flex flex-col justify-center space-y-2.5">
              <div className="rounded-lg bg-white p-2 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">Agreed Ops Services Total</p>
                <p className="text-sm font-bold text-slate-800">{invoice.agreedRate}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-2 border border-emerald-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-600">Paid to DMC</p>
                  <p className="text-xs font-bold text-emerald-600">{formatCurrency(paid)}</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-amber-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-amber-600">Remaining Due</p>
                  <p className="text-xs font-bold text-amber-600">{invoice.remainingAmount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline workflow of Milestones */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Payout Settlement Timeline</h3>
            <div className="relative border-l-2 border-slate-100 pl-4 ml-2.5 space-y-4">

              {/* Milestone 1: Invoice Submission */}
              <div className="relative">
                <div className="absolute -left-[22.5px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white">
                  <Check className="h-2.5 w-2.5 stroke-[3px]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">DMC Invoice Verified</h4>
                  <p className="text-[10px] text-slate-500">Ops Total: {invoice.agreedRate} • Subtotal + Tax fully verified</p>
                </div>
              </div>

              {/* Milestone 2: Installments Paid List */}
              {installments.length > 0 ? (
                installments.map((inst, index) => (
                  <div key={inst.id || index} className="relative">
                    <div className="absolute -left-[22.5px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white">
                      <Check className="h-2.5 w-2.5 stroke-[3px]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800">Installment {index + 1} Paid</h4>
                        <span className="rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-bold uppercase text-emerald-700">Success</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Paid: <strong className="text-emerald-600">{formatCurrency(inst.amount)}</strong> on {inst.paymentDate || inst.date}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        Ref: {inst.utrNumber || 'N/A'} • Bank: {inst.bankName || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  <div className="absolute -left-[22.5px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-4 ring-white">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-600">Awaiting First Payout Installment</h4>
                    <p className="text-[10px] text-slate-500">No installments settled yet. Payout is currently pending.</p>
                  </div>
                </div>
              )}

              {/* Milestone 3: Remaining balance and Due Date */}
              {remaining > 0 ? (
                <div className="relative">
                  <div className="absolute -left-[22.5px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-4 ring-white">
                    <AlertCircle className="h-2.5 w-2.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-amber-600">Outstanding Balance Due</h4>
                      <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">Due</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Amount: <strong className="text-amber-600">{invoice.remainingAmount}</strong>
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Payment due by {invoice.date} ({invoice.creditTermLabel})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -left-[22.5px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white">
                    <Check className="h-2.5 w-2.5 stroke-[3px]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600">Payout Fully Settled</h4>
                    <p className="text-[10px] text-slate-500">The total amount of {invoice.amount} has been paid. Outstanding balance is nil.</p>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900 shadow-sm cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InternalInvoices;
