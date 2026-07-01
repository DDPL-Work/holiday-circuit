import {
  Briefcase,
  Calendar,
  CalendarDays,
  ChevronDown,
  CheckCircle,
  CheckCircle2,
  Clock,
  Clock3,
  Coins,
  Download,
  DollarSign,
  FileText,
  Hash,
  IndianRupee,
  Layers3,
  Receipt,
  RefreshCw,
  Send,
  Upload,
  X,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { createElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotatingLines } from "react-loader-spinner";
import toast from "react-hot-toast";
import API from "../../utils/Api";

const FieldShell = ({
  icon,
  children,
  iconWrapClassName = "bg-slate-100 text-slate-600",
}) => (
  <div className="relative">
    <div
      className={`pointer-events-none absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md ${iconWrapClassName}`}
    >
      {icon ? createElement(icon, { size: 14 }) : null}
    </div>
    {children}
  </div>
);

const todayInput = () => new Date().toISOString().slice(0, 10);

const formatMoney = (value, currency = "INR") =>
  `${String(currency || "INR").toUpperCase() === "INR" ? "₹" : currency} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const EMPTY_CLAIMED_SUMMARY = {
  subtotal: "",
  taxAmount: "",
  grandTotal: "",
};

const normalizeClaimedInputValue = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : "";
};

const buildClaimedSummaryFromFields = (fields = {}) => ({
  subtotal: normalizeClaimedInputValue(fields.subtotal),
  taxAmount: normalizeClaimedInputValue(fields.taxAmount),
  grandTotal: normalizeClaimedInputValue(fields.grandTotal),
});

const getSortDateValue = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
};

const sortPayableServices = (services = []) =>
  [...services].sort((left, right) => {
    if (Boolean(left.isClaimed) !== Boolean(right.isClaimed)) {
      return left.isClaimed ? 1 : -1;
    }
    const leftDue = getSortDateValue(left.dueDate);
    const rightDue = getSortDateValue(right.dueDate);
    if (leftDue !== rightDue) return leftDue - rightDue;
    return String(left.queryId || "").localeCompare(String(right.queryId || ""));
  });

const getFileUrl = (filePath = "") => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const apiBaseUrl = API.defaults.baseURL || "";
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${serverBaseUrl}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};

const statusBadgeClass = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "partially paid") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "approved") return "border-blue-200 bg-blue-50 text-blue-700";
  if (normalized === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const addDaysToDate = (value, daysToAdd = 0) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
};

const TEMPLATE_OPTIONS = [
  { value: "aurora-ledger", label: "Aurora Ledger" },
  { value: "classic-ledger", label: "Classic Ledger" },
  { value: "compact-ledger", label: "Compact Ledger" },
  { value: "finance-ledger", label: "Finance Ledger" },
];

const readStoredUser = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const createInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `BULK-INV-${dateStr}-${timeStr}`;
};

const SERVICES_PER_PAGE = 6;

export default function DmcPaymentLedger() {
  const storedUser = useMemo(readStoredUser, []);
  const resolvedCreditDays = useMemo(() => {
    if (storedUser && Array.isArray(storedUser.creditDays) && storedUser.creditDays.length > 0) {
      return storedUser.creditDays.map(Number);
    }
    if (storedUser && storedUser.creditDays !== undefined) {
      const parsed = Number(storedUser.creditDays);
      if (!Number.isNaN(parsed)) return [parsed];
    }
    return [7, 15];
  }, [storedUser]);

  const [creditPeriodDays, setCreditPeriodDays] = useState(7);
  const [ledger, setLedger] = useState({ summary: {}, services: [] });
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceSource, setInvoiceSource] = useState("system_template");
  const [uploadedInvoiceFile, setUploadedInvoiceFile] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [invoiceExtraction, setInvoiceExtraction] = useState(null);
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setUploadedInvoiceFile(file);
    setIsFileUploading(true);
    setInvoiceExtraction(null);
    setIsExtractionOpen(false);

    try {
      const formData = new FormData();
      formData.append("uploadedInvoice", file);
      formData.append("claimedSummary", JSON.stringify(claimedSummary));
      formData.append("expectedSummary", JSON.stringify({
        subtotal: selectedSubtotal,
        taxAmount: selectedGst + selectedTcs + Number(taxConfig.otherTax || 0),
        totalTax: selectedGst + selectedTcs + Number(taxConfig.otherTax || 0),
        grandTotal: selectedTotal,
        currency: selectedCurrency,
      }));

      const { data } = await API.post("/dmc/internal-invoice/parse-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extraction = data?.data || null;
      const fields = extraction?.fields || {};
      setInvoiceExtraction(extraction);
      setIsExtractionOpen(true);
      setInvoiceMeta((prev) => ({
        ...prev,
        supplierName: fields.supplierName || prev.supplierName,
        invoiceNumber: fields.invoiceNumber || prev.invoiceNumber,
        invoiceDate: fields.invoiceDate || prev.invoiceDate,
        dueDate: fields.dueDate || (fields.invoiceDate ? addDaysToDate(fields.invoiceDate, prev.creditPeriodDays) : prev.dueDate),
      }));

      setClaimedSummary(buildClaimedSummaryFromFields(fields));

      if (extraction?.status === "parsed") {
        toast.success("Invoice parsed and values filled");
      } else {
        toast("Invoice uploaded. Please review fields manually.");
      }
    } catch (error) {
      setInvoiceExtraction({
        status: "failed",
        source: "upload",
        error: error?.response?.data?.message || "Unable to parse this invoice automatically.",
      });
      setIsExtractionOpen(true);
      toast.error(error?.response?.data?.message || "Invoice parser needs manual review");
    } finally {
      setIsFileUploading(false);
      event.target.value = "";
    }
  };
  const [invoiceMeta, setInvoiceMeta] = useState({
    supplierName: storedUser?.companyName || storedUser?.name || "",
    invoiceNumber: createInvoiceNumber(),
    invoiceDate: todayInput(),
    creditPeriodDays: 7,
    dueDate: addDaysToDate(todayInput(), 7),
    templateVariant: "aurora-ledger",
  });

  const handleMetaChange = (field, value) => {
    setInvoiceMeta((prev) => {
      if (field === "invoiceDate") {
        return {
          ...prev,
          invoiceDate: value,
          dueDate: addDaysToDate(value, prev.creditPeriodDays),
        };
      }

      if (field === "creditPeriodDays") {
        const numericVal = Number(value);
        return {
          ...prev,
          creditPeriodDays: numericVal,
          dueDate: addDaysToDate(prev.invoiceDate, numericVal),
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };
  const [taxConfig, setTaxConfig] = useState({ gstRate: 0, tcsRate: 0, otherTax: 0 });
  const [claimedSummary, setClaimedSummary] = useState(EMPTY_CLAIMED_SUMMARY);

  const selectedRows = useMemo(
    () => (ledger.services || []).filter((service) => selectedRefs.includes(service.serviceRef)),
    [ledger.services, selectedRefs],
  );
  const selectedCurrency = selectedRows[0]?.currency || "INR";

  const selectedSubtotal = selectedRows.reduce(
    (sum, service) => sum + Number(service.amount || 0),
    0,
  );
  const selectedGst = (selectedSubtotal * Number(taxConfig.gstRate || 0)) / 100;
  const selectedTcs = (selectedSubtotal * Number(taxConfig.tcsRate || 0)) / 100;
  const selectedTotal =
    selectedSubtotal + selectedGst + selectedTcs + Number(taxConfig.otherTax || 0);
  const selectableServices = (ledger.services || []).filter((service) => !service.isClaimed);
  const dueServices = selectableServices.filter((service) => service.isDue);
  const ledgerServices = useMemo(
    () => sortPayableServices(ledger.services || []),
    [ledger.services],
  );
  const financeUploadedInvoices = ledger.financeUploadedInvoices || [];
  const totalPages = Math.max(1, Math.ceil(ledgerServices.length / SERVICES_PER_PAGE));
  const paginatedServices = ledgerServices.slice(
    (currentPage - 1) * SERVICES_PER_PAGE,
    currentPage * SERVICES_PER_PAGE,
  );
  const pageStart = ledgerServices.length ? (currentPage - 1) * SERVICES_PER_PAGE + 1 : 0;
  const pageEnd = Math.min(currentPage * SERVICES_PER_PAGE, ledgerServices.length);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/dmc/payment-ledger", {
        params: { creditPeriodDays },
      });
      setLedger(data?.data || { summary: {}, services: [] });
      setSelectedRefs((prev) => {
        const availableRefs = new Set(
          (data?.data?.services || [])
            .filter((service) => !service.isClaimed)
            .map((service) => service.serviceRef),
        );
        return prev.filter((serviceRef) => availableRefs.has(serviceRef));
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load payment ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [creditPeriodDays]);

  useEffect(() => {
    setCurrentPage(1);
  }, [creditPeriodDays]);

  useEffect(() => {
    handleMetaChange("creditPeriodDays", creditPeriodDays);
  }, [creditPeriodDays]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleService = (serviceRef) => {
    setSelectedRefs((prev) =>
      prev.includes(serviceRef)
        ? prev.filter((item) => item !== serviceRef)
        : [...prev, serviceRef],
    );
  };

  const selectDueServices = () => {
    setSelectedRefs(dueServices.map((service) => service.serviceRef));
  };

  const submitBatch = async () => {
    if (!selectedRefs.length) {
      toast.error("Select services before submitting a bulk settlement");
      return;
    }

    const needsTemplate = invoiceSource === "system_template";
    if (
      !invoiceMeta.supplierName ||
      !invoiceMeta.invoiceNumber ||
      !invoiceMeta.invoiceDate ||
      !invoiceMeta.dueDate ||
      (needsTemplate && !invoiceMeta.templateVariant)
    ) {
      toast.error("Please fill all invoice header fields");
      return;
    }

    if (invoiceSource === "uploaded_invoice") {
      if (!uploadedInvoiceFile) {
        toast.error("Please upload your invoice PDF or Word document");
        return;
      }

      if (Number(claimedSummary.grandTotal || 0) <= 0) {
        toast.error("Please enter claimed invoice total");
        return;
      }
    }

    try {
      setSubmitting(true);
      if (invoiceSource === "uploaded_invoice") {
        const formData = new FormData();
        formData.append("serviceRefs", JSON.stringify(selectedRefs));
        formData.append("invoiceSource", invoiceSource);
        formData.append("invoiceMeta", JSON.stringify({
          ...invoiceMeta,
          dueDate: invoiceMeta.dueDate,
          invoiceSource,
        }));
        formData.append("taxConfig", JSON.stringify(taxConfig));
        formData.append("claimedSummary", JSON.stringify(claimedSummary));
        formData.append("templateVariant", invoiceMeta.templateVariant);
        formData.append("uploadedInvoice", uploadedInvoiceFile);
        await API.post("/dmc/settlement-batches", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/dmc/settlement-batches", {
          serviceRefs: selectedRefs,
          invoiceSource,
          invoiceMeta: {
            ...invoiceMeta,
            dueDate: invoiceMeta.dueDate,
            invoiceSource,
          },
          taxConfig,
          claimedSummary,
          templateVariant: invoiceMeta.templateVariant,
        });
      }
      toast.success("Bulk settlement sent to finance");
      setSelectedRefs([]);
      setUploadedInvoiceFile(null);
      setInvoiceExtraction(null);
      setInvoiceMeta((prev) => ({
        ...prev,
        invoiceNumber: createInvoiceNumber(),
      }));
      await loadLedger();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to submit bulk settlement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1e3a8a] via-[#111827] to-slate-900 text-white shadow-lg ring-4 ring-blue-50 shrink-0">
              <Layers3 size={22} className="animate-pulse" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-white">
                ✓
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">
                DMC PAYABLE LEDGER
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-slate-800 tracking-tight">
                Bulk Settlement
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 font-medium">
                View booked services by 7-day or 15-day credit cycle, then select services and send one combined settlement invoice to finance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            {[7, 15].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setCreditPeriodDays(days)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
                  creditPeriodDays === days
                    ? "border-slate-900 bg-gradient-to-br from-[#1e3a8a] via-[#111827] to-black shadow-[0_10px_24px_rgba(15,23,42,0.22)]"
                    : "border-slate-700/20 bg-gradient-to-br from-[#243b75] via-[#172033] to-black/90 opacity-80 hover:opacity-100"
                }`}
              >
                {days}-day credit
              </button>
            ))}
            <button
              type="button"
              onClick={loadLedger}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ["Eligible", ledger.summary?.eligibleServices || 0, formatMoney(ledger.summary?.eligibleAmount || 0), {
              bg: "bg-gradient-to-br from-blue-50/90 via-blue-50/20 to-white",
              border: "border-slate-200 border-b-4 border-b-blue-600",
              text: "text-blue-700"
            }],
            ["Due Now", ledger.summary?.dueServices || 0, formatMoney(ledger.summary?.dueAmount || 0), {
              bg: "bg-gradient-to-br from-amber-50/90 via-amber-50/20 to-white",
              border: "border-slate-200 border-b-4 border-b-amber-600",
              text: "text-amber-700"
            }],
            ["Overdue", ledger.summary?.overdueServices || 0, "Needs attention", {
              bg: "bg-gradient-to-br from-rose-50/90 via-rose-50/20 to-white",
              border: "border-slate-200 border-b-4 border-b-rose-600",
              text: "text-rose-700"
            }],
            ["Selected", selectedRefs.length, formatMoney(selectedTotal)],
          ].map(([label, value, helper, theme]) => {
            const cardTheme = theme || {
              bg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/20 to-white",
              border: "border-slate-200 border-b-4 border-b-emerald-600",
              text: "text-emerald-700"
            };
            return (
              <div
                key={label}
                className={`rounded-xl border ${cardTheme.border} ${cardTheme.bg} px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${cardTheme.text}`}>{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Booked Services</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectDueServices}
                className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black hover:opacity-90 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-sm hover:scale-[1.02] transform active:scale-95"
              >
                Select due services
              </button>
              <button
                type="button"
                onClick={() => setSelectedRefs([])}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="min-w-[830px] w-full text-left text-xs">
              <thead className="bg-white text-[10px] uppercase tracking-[0.12em] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2 w-[40px]">Pick</th>
                  <th className="px-3 py-2 w-[90px]">Booking</th>
                  <th className="px-3 py-2 w-[220px]">Service</th>
                  <th className="w-[120px] whitespace-nowrap px-3 py-2 text-center">Credit Start</th>
                  <th className="px-3 py-2 w-[140px]">Due Date</th>
                  <th className="px-3 py-2 text-right w-[80px]">Amount</th>
                  <th className="px-3 py-2 w-[160px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center">
                          <div className="absolute h-10 w-10 animate-ping rounded-full bg-blue-100 opacity-75"></div>
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 animate-pulse mt-1">Loading Ledger Details...</p>
                      </div>
                    </td>
                  </tr>
                ) : ledgerServices.length ? (
                  paginatedServices.map((service) => {
                    const selected = selectedRefs.includes(service.serviceRef);
                    return (
                      <tr key={service.serviceRef} className={selected ? "bg-blue-50/50" : "bg-white"}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={service.isClaimed}
                            onChange={() => toggleService(service.serviceRef)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{service.queryId}</p>
                          <p className="text-[11px] text-slate-400">{service.destination || "-"}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{service.serviceName}</p>
                          <p className="text-[11px] text-slate-400">{service.type}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center text-slate-600">{formatDate(service.creditStartDate)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap ${
                            service.isOverdue
                              ? "bg-rose-50 text-rose-700"
                              : service.isDue
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-50 text-slate-600"
                          }`}>
                            <CalendarDays size={12} />
                            {formatDate(service.dueDate)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatMoney(service.amount, service.currency)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap ${
                            service.isClaimed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {service.isClaimed ? <CheckCircle size={12} /> : <Clock3 size={12} />}
                            {service.isClaimed
                              ? `${service.status} (${service.claimInvoiceNumber})`
                              : "Unbilled"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-slate-400">
                      No booked services found for this credit period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing {pageStart}-{pageEnd} of {ledgerServices.length} booked services
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1 || loading}
                className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-300 transform active:scale-95 disabled:scale-100 ${
                  currentPage === 1 || loading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black hover:opacity-90 hover:scale-[1.02]"
                }`}
              >
                Previous
              </button>
              <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages || loading}
                className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-300 transform active:scale-95 disabled:scale-100 ${
                  currentPage === totalPages || loading
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black hover:opacity-90 hover:scale-[1.02]"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-emerald-600"></div>
          
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm animate-pulse">
              <FileText size={16} />
            </span>
            Bulk Invoice Details
          </h3>

          <div className="relative mt-4 flex items-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 p-1 text-[11px] font-semibold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => setInvoiceSource("system_template")}
              className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-300 ${
                invoiceSource === "system_template"
                  ? "font-bold text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {invoiceSource === "system_template" && (
                <motion.span
                  layoutId="bulk-invoice-source-tab-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#1e3a8a] to-[#107c41] shadow-[0_2px_8px_rgba(30,58,138,0.25)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <FileText size={12} />
                Company Template
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInvoiceSource("uploaded_invoice")}
              className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-300 ${
                invoiceSource === "uploaded_invoice"
                  ? "font-bold text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {invoiceSource === "uploaded_invoice" && (
                <motion.span
                  layoutId="bulk-invoice-source-tab-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#1e3a8a] to-[#107c41] shadow-[0_2px_8px_rgba(30,58,138,0.25)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Upload size={12} />
                Upload Invoice
              </span>
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Supplier Name <span className="text-red-600">*</span>
                </label>
                <FieldShell icon={Briefcase} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
                  <input
                    value={invoiceMeta.supplierName}
                    onChange={(e) => handleMetaChange("supplierName", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-blue-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="DMC Company Name"
                  />
                </FieldShell>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Invoice Number <span className="text-red-600">*</span>
                </label>
                <FieldShell icon={Hash} iconWrapClassName="bg-gradient-to-tr from-sky-50 to-cyan-50 border border-sky-100 text-sky-600 shadow-sm">
                  <input
                    value={invoiceMeta.invoiceNumber}
                    onChange={(e) => handleMetaChange("invoiceNumber", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-sky-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="INV-2026-0001"
                  />
                </FieldShell>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Invoice Date <span className="text-red-600">*</span>
                </label>
                <FieldShell icon={Calendar} iconWrapClassName="bg-gradient-to-tr from-orange-50 to-amber-50 border border-orange-100 text-orange-600 shadow-sm">
                  <input
                    type="date"
                    value={invoiceMeta.invoiceDate}
                    onChange={(e) => handleMetaChange("invoiceDate", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-orange-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </FieldShell>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Credit Period <span className="text-red-600">*</span>
                </label>
                <FieldShell icon={Clock} iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm">
                  <select
                    value={invoiceMeta.creditPeriodDays}
                    onChange={(e) => handleMetaChange("creditPeriodDays", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-emerald-50/15 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                  >
                    {resolvedCreditDays.map((days) => (
                      <option key={days} value={days}>
                        {Number(days) === 0 ? "Immediate (0-day credit)" : `${days}-day credit`}
                      </option>
                    ))}
                  </select>
                </FieldShell>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Due Date <span className="text-red-600">*</span>
                </label>
                <FieldShell icon={CalendarDays} iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm">
                  <input
                    type="date"
                    value={invoiceMeta.dueDate}
                    readOnly
                    className="w-full rounded-xl border border-gray-300 bg-rose-50/15 py-2 pl-11 pr-3 text-sm text-slate-700 shadow-sm outline-none cursor-not-allowed"
                  />
                </FieldShell>
              </div>

              {invoiceSource === "system_template" ? (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Template <span className="text-red-600">*</span>
                  </label>
                  <FieldShell icon={FileText} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-indigo-50 border border-violet-100 text-violet-600 shadow-sm">
                    <select
                      value={invoiceMeta.templateVariant}
                      onChange={(e) => handleMetaChange("templateVariant", e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-violet-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                    >
                      {TEMPLATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FieldShell>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">GST %</label>
                <FieldShell icon={DollarSign} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
                  <input
                    type="number"
                    value={taxConfig.gstRate}
                    onChange={(event) =>
                      setTaxConfig((prev) => ({ ...prev, gstRate: Number(event.target.value || 0) }))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-blue-50/20 py-2 pl-11 pr-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2"
                  />
                </FieldShell>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">TCS %</label>
                <FieldShell icon={Receipt} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-purple-50 border border-violet-100 text-violet-600 shadow-sm">
                  <input
                    type="number"
                    value={taxConfig.tcsRate}
                    onChange={(event) =>
                      setTaxConfig((prev) => ({ ...prev, tcsRate: Number(event.target.value || 0) }))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-violet-50/20 py-2 pl-11 pr-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2"
                  />
                </FieldShell>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Other</label>
                <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-100 text-amber-600 shadow-sm">
                  <input
                    type="number"
                    value={taxConfig.otherTax}
                    onChange={(event) =>
                      setTaxConfig((prev) => ({ ...prev, otherTax: Number(event.target.value || 0) }))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-amber-50/20 py-2 pl-11 pr-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2"
                  />
                </FieldShell>
              </div>
            </div>
          </div>

          {invoiceSource === "uploaded_invoice" ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-3 shadow-inner animate-fade-in">
              <div className="mb-3">
                {isFileUploading ? (
                  <div className="flex min-h-[80px] flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-white/95 p-3 text-center shadow-inner">
                    <RotatingLines
                      width="22"
                      strokeColor="#2563eb"
                      strokeWidth="4"
                      animationDuration="0.75"
                    />
                    <span className="mt-1.5 text-[11px] font-semibold text-blue-600 animate-pulse">
                      Uploading & Scanning...
                    </span>
                  </div>
                ) : uploadedInvoiceFile ? (
                  <div className="relative flex min-h-[80px] flex-col items-center justify-center rounded-xl border border-emerald-250 bg-emerald-50/80 p-3 text-center shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedInvoiceFile(null);
                        setInvoiceExtraction(null);
                        setIsExtractionOpen(false);
                        setClaimedSummary(EMPTY_CLAIMED_SUMMARY);
                      }}
                      className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm border border-emerald-100 hover:bg-rose-50 hover:text-rose-700 transition"
                      title="Remove Invoice"
                    >
                      <X size={10} />
                    </button>
                    <CheckCircle2 size={18} className="mb-1 text-emerald-600 animate-scale-in" />
                    <span className="max-w-[200px] truncate text-[11px] font-bold text-slate-800">
                      {uploadedInvoiceFile.name}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-semibold animate-pulse">
                      Scanned and ready
                    </span>
                  </div>
                ) : (
                  <label className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/30 group">
                    <Upload size={16} className="mb-1 text-blue-500 transition-transform group-hover:-translate-y-0.5 duration-200" />
                    <span className="text-[11px] font-bold text-slate-700">Choose Invoice</span>
                    <span className="text-[9px] font-normal text-slate-400">PDF, DOCX, JPG, PNG up to 10MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              {invoiceExtraction ? (
                (() => {
                  const extractionPassed =
                    invoiceExtraction.status === "parsed" &&
                    invoiceExtraction.verification?.passed !== false &&
                    !invoiceExtraction.verification?.warnings?.length;
                  const extractionFailed =
                    invoiceExtraction.status === "parsed" && !extractionPassed;
                  const fields = invoiceExtraction.fields || {};
                  const expectedTax = selectedGst + selectedTcs + Number(taxConfig.otherTax || 0);
                  const amountMatches = (extracted, expected) =>
                    Number(expected || 0) === 0
                      ? Math.round(Number(extracted || 0)) === 0
                      : Number(extracted || 0) > 0 &&
                        Math.round(Number(extracted || 0)) === Math.round(Number(expected || 0));
                  const getCurrencySymbol = (currency) => {
                    const cur = String(currency || '').trim().toUpperCase();
                    if (cur === 'INR') return '₹';
                    if (cur === 'USD') return '$';
                    if (cur === 'EUR') return '€';
                    if (cur === 'GBP') return '£';
                    if (cur === 'THB') return '฿';
                    return cur;
                  };

                  const getFieldCheckDetails = (label, key, expectedValue, isAmount = false) => {
                    const matched = isAmount 
                      ? amountMatches(fields[key], expectedValue) 
                      : Boolean(fields[key]);
                    
                    let primaryValue = fields[key] || "-";
                    let secondaryValue = null;

                    if (isAmount) {
                      const amount = Number(fields[key] || 0).toLocaleString("en-IN");
                      const currency = fields.currency || selectedCurrency || "INR";
                      primaryValue = `${getCurrencySymbol(currency)} ${amount}`;
                      
                      const originalValue = fields.originalAmounts?.[key];
                      if (fields.conversionApplied && Number(originalValue || 0) > 0) {
                        secondaryValue = `from ${getCurrencySymbol(fields.originalCurrency)} ${Number(originalValue || 0).toLocaleString("en-IN")}`;
                      }
                    }

                    return { label, primaryValue, secondaryValue, matched };
                  };

                  const fieldChecks = [
                    { label: "Invoice", primaryValue: fields.invoiceNumber || "-", secondaryValue: null, matched: Boolean(fields.invoiceNumber) },
                    { label: "Date", primaryValue: fields.invoiceDate || "-", secondaryValue: null, matched: Boolean(fields.invoiceDate) },
                    getFieldCheckDetails("Subtotal", "subtotal", selectedSubtotal, true),
                    getFieldCheckDetails("Tax", "taxAmount", expectedTax, true),
                    getFieldCheckDetails("Total", "grandTotal", selectedTotal, true),
                  ];
                  return (
                <div className={`mb-3 overflow-hidden rounded-2xl border text-xs shadow-sm ${
                  extractionPassed
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                    : extractionFailed
                      ? "border-rose-200 bg-rose-50/80 text-rose-900"
                    : "border-amber-200 bg-amber-50/80 text-amber-900"
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsExtractionOpen((prev) => !prev)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/30"
                    aria-expanded={isExtractionOpen}
                  >
                    <p className="font-bold uppercase tracking-[0.16em]">
                      Parser / OCR Check
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 font-semibold">
                      {(invoiceExtraction.source || "parser").replace(/_/g, " ")} · {invoiceExtraction.confidence || 0}% confidence
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isExtractionOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExtractionOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                  <div className="border-t border-white/70 px-4 pb-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {fieldChecks.map((field) => (
                        <div
                          key={field.label}
                          className={`flex flex-col justify-between p-3 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md cursor-default ${
                            field.matched 
                              ? "bg-emerald-500/10 border-emerald-250/60 text-emerald-950" 
                              : "bg-rose-500/10 border-rose-250/60 text-rose-950"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                              {field.label}
                            </span>
                            {field.matched ? (
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle size={14} className="text-rose-600 shrink-0" />
                            )}
                          </div>
                          <span className="font-extrabold text-[12.5px] leading-tight">
                            {field.primaryValue}
                          </span>
                          {field.secondaryValue && (
                            <span className="mt-1 text-[10px] font-medium text-slate-500/80 leading-normal">
                              {field.secondaryValue}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {invoiceExtraction.verification?.warnings?.length ? (
                      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-200/50 p-3.5 text-xs leading-relaxed text-rose-950 shadow-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                        <span>{invoiceExtraction.verification.warnings.join(" ")}</span>
                      </div>
                    ) : null}

                    {invoiceExtraction.verification?.notes?.length ? (
                      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-blue-500/10 border border-blue-200/50 p-3.5 text-xs leading-relaxed text-blue-950 shadow-sm">
                        <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
                        <span>{invoiceExtraction.verification.notes.join(" ")}</span>
                      </div>
                    ) : null}

                    {invoiceExtraction.error ? (
                      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-200/50 p-3.5 text-xs leading-relaxed text-rose-950 shadow-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-700" />
                        <span>{invoiceExtraction.error}</span>
                      </div>
                    ) : null}
                  </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                  );
                })()
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Subtotal</label>
                  <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
                    <input
                      type="number"
                      value={claimedSummary.subtotal ?? ""}
                      onChange={(event) =>
                        setClaimedSummary((prev) => ({
                          ...prev,
                          subtotal: event.target.value === "" ? "" : Number(event.target.value),
                        }))
                      }
                      placeholder="Enter subtotal"
                      className="w-full rounded-xl border border-gray-300 bg-blue-50/20 py-2 pl-11 pr-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </FieldShell>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Tax</label>
                  <FieldShell icon={Receipt} iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm">
                    <input
                      type="number"
                      value={claimedSummary.taxAmount ?? ""}
                      onChange={(event) =>
                        setClaimedSummary((prev) => ({
                          ...prev,
                          taxAmount: event.target.value === "" ? "" : Number(event.target.value),
                        }))
                      }
                      placeholder="Enter tax"
                      className="w-full rounded-xl border border-gray-300 bg-rose-50/20 py-2 pl-11 pr-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </FieldShell>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total</label>
                  <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm">
                    <input
                      type="number"
                      value={claimedSummary.grandTotal ?? ""}
                      onChange={(event) =>
                        setClaimedSummary((prev) => ({
                          ...prev,
                          grandTotal: event.target.value === "" ? "" : Number(event.target.value),
                        }))
                      }
                      placeholder="Enter total"
                      className="w-full rounded-xl border border-gray-300 bg-emerald-50/20 py-2 pl-11 pr-2 text-xs text-slate-900 outline-none font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </FieldShell>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-blue-100 bg-sky-50/40 p-4 text-xs shadow-inner">
            {invoiceSource === "uploaded_invoice" ? (
              <p className="mb-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">System Reference Summary</p>
            ) : null}
            <div className="flex justify-between text-slate-500">
              <span>Selected services</span>
              <span className="font-semibold text-slate-800">{selectedRefs.length}</span>
            </div>
            <div className="mt-2 flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{formatMoney(selectedSubtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-slate-500">
              <span>Tax</span>
              <span className="font-semibold text-slate-800">{formatMoney(selectedGst + selectedTcs + Number(taxConfig.otherTax || 0))}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
              <span>Total</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800">{formatMoney(selectedTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={submitBatch}
            disabled={submitting || !selectedRefs.length}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-500 ease-in-out ${
              submitting || !selectedRefs.length
                ? "cursor-not-allowed bg-slate-200 text-slate-400 border border-slate-200"
                : "bg-gradient-to-r from-blue-900 to-emerald-600 hover:from-blue-950 hover:to-emerald-700 hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)] active:scale-[0.98] transform"
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Bulk Settlement
              </>
            )}
          </button>

          <div className="mt-4 rounded-xl bg-blue-50/60 border border-blue-100/50 px-3.5 py-3 text-xs leading-5 text-blue-800 flex items-start gap-2">
            <IndianRupee size={15} className="mt-0.5 shrink-0 text-blue-600" />
            <span>Finance will see this as a bulk internal invoice and can pay it in one or multiple payout installments.</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Finance Uploaded Invoices
              </p>
              <h3 className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Receipt size={16} />
                Vendor invoices uploaded by finance
              </h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {financeUploadedInvoices.length} invoice{financeUploadedInvoices.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-32 items-center justify-center text-xs font-semibold text-slate-400">
              Loading finance uploaded invoices...
            </div>
          ) : financeUploadedInvoices.length ? (
            <div className="overflow-x-auto pb-3 thin-scrollbar">
              <style>{`
                .thin-scrollbar::-webkit-scrollbar {
                  height: 5px;
                }
                .thin-scrollbar::-webkit-scrollbar-track {
                  background: #f8fafc;
                  border-radius: 9px;
                }
                .thin-scrollbar::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 9px;
                }
                .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}</style>
              <table className="min-w-[980px] w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-white text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Invoice No.</th>
                    <th className="px-3 py-2">Uploaded File</th>
                    <th className="px-3 py-2">Credit</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Payout Details</th>
                    <th className="px-3 py-2 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financeUploadedInvoices.map((invoice) => {
                    const invoiceUrl = getFileUrl(invoice.invoiceDocument?.filePath);
                    const receiptUrl = getFileUrl(invoice.receiptDocument?.filePath);
                    return (
                      <tr key={invoice.id || invoice.invoiceNumber} className="bg-white align-top">
                        <td className="px-3 py-3">
                          <p className="font-bold text-slate-900 whitespace-nowrap">{invoice.invoiceNumber}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400 whitespace-nowrap">
                            Uploaded by {invoice.uploadedByName || "Finance Team"}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {invoiceUrl ? (
                            <button
                              type="button"
                              onClick={() => window.open(invoiceUrl, "_blank", "noopener,noreferrer")}
                              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                            >
                              <Download size={12} />
                              <span className="truncate">{invoice.invoiceDocument?.name || "Download invoice"}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">No file</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 whitespace-nowrap">
                            {invoice.creditPeriodDays}-day credit
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-slate-700">
                            <CalendarDays size={12} />
                            {formatDate(invoice.dueDate)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-bold text-slate-900 whitespace-nowrap">{formatMoney(invoice.amount, invoice.currency)}</p>
                          {Number(invoice.remainingAmount || 0) > 0 ? (
                            <p className="mt-0.5 text-[10px] font-semibold text-amber-600 whitespace-nowrap">
                              Remaining {formatMoney(invoice.remainingAmount, invoice.currency)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 font-bold whitespace-nowrap ${statusBadgeClass(invoice.status)}`}>
                            {invoice.status || "Submitted"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {invoice.payoutInstallments?.length ? (
                            <div className="space-y-1.5">
                              {invoice.payoutInstallments.map((payment, index) => (
                                <div key={`${payment.utrNumber}-${index}`} className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-2.5 py-1.5 min-w-[185px]">
                                  <p className="font-bold text-emerald-700 whitespace-nowrap">
                                    {formatMoney(payment.amount, invoice.currency)} paid
                                  </p>
                                  <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5 whitespace-nowrap">
                                    <p>UTR: {payment.utrNumber || "-"}</p>
                                    <p>Bank: {payment.bankName || "-"}</p>
                                    <p>Date: {formatDate(payment.paymentDate)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">No payout recorded</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => window.open(receiptUrl, "_blank", "noopener,noreferrer")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              <Download size={12} />
                              Receipt
                            </button>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-32 flex-col items-center justify-center px-4 py-8 text-center">
              <FileText size={22} className="text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-500">No finance uploaded invoices yet</p>
              <p className="mt-1 text-xs text-slate-400">
                When finance uploads a vendor invoice for your account, it will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
