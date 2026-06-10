import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
  ChevronDown,
  Eye,
  FileDown,
  Image as ImageIcon,
  Download,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Building2,
  Send,
  User,
  Mail,
  History,
  PieChart,
  IndianRupee
} from "lucide-react";
import API from "../../utils/Api";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";

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

const rejectionReasons = [
  "Incorrect UTR Number",
  "Short Payment",
  "Amount Mismatch",
  "Incorrect Bank Name",
  "Receipt Missing or Invalid",
  "UTR Not Found in Bank Statement",
  "Duplicate Payment Entry",
  "Other",
];

const createEmptyData = () => ({
  summary: {
    totalPayments: 0,
    pendingReview: 0,
    sentToManager: 0,
    verified: 0,
    rejected: 0,
    totalAmount: 0,
  },
  payments: [],
});

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const getApiOrigin = () => {
  const baseUrl = API?.defaults?.baseURL || "";
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "";
  }
};

const triggerFileDownload = async (url, fileName = "Payment_Receipt.pdf") => {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const getPaymentComparisonMeta = (payment = {}) => {
  const expectedAmount = Math.round(Number(payment?.expectedAmount ?? payment?.amount ?? 0));
  const opsInvoiceAmount = Math.round(Number(payment?.opsInvoiceAmount ?? expectedAmount ?? 0));
  const receivedAmount = Math.round(Number(payment?.receivedAmount || 0));
  const hasReceivedAmount = receivedAmount > 0;
  const couponApplied = Boolean(payment?.couponApplied);
  const verificationVariance = hasReceivedAmount ? receivedAmount - expectedAmount : 0;
  const displayVariance = hasReceivedAmount
    ? couponApplied
      ? receivedAmount - opsInvoiceAmount
      : verificationVariance
    : 0;
  const isMatched = hasReceivedAmount && verificationVariance === 0;
  const expectedAmountLabel = couponApplied ? "Payable after coupon" : "Expected invoice amount";

  if (!hasReceivedAmount) {
    return {
      expectedAmount, opsInvoiceAmount, receivedAmount,
      variance: displayVariance, verificationVariance, hasReceivedAmount, isMatched, couponApplied, expectedAmountLabel,
      label: "Pending Amount",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      varianceClass: "text-slate-400",
      note: couponApplied
        ? "Agent has not declared the transferred amount yet. Coupon-adjusted payable amount should be used for verification."
        : "Agent has not declared the transferred amount yet.",
    };
  }

  if (isMatched) {
    return {
      expectedAmount, opsInvoiceAmount, receivedAmount,
      variance: displayVariance, verificationVariance, hasReceivedAmount, isMatched, couponApplied, expectedAmountLabel,
      label: "Fully Paid",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      varianceClass: couponApplied ? "text-rose-700" : "text-emerald-700",
      note: couponApplied
        ? "The amount shared by the agent matches the discounted payable amount. The variance card below still shows the gap against the full ops invoice."
        : "Declared amount matches the ops invoice total exactly.",
    };
  }

  if (verificationVariance < 0) {
    return {
      expectedAmount, opsInvoiceAmount, receivedAmount,
      variance: displayVariance, verificationVariance, hasReceivedAmount, isMatched, couponApplied, expectedAmountLabel,
      label: "Partially Paid",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      varianceClass: "text-rose-700",
      note: couponApplied
        ? "Declared amount is lower than the coupon-adjusted payable amount."
        : "Declared amount is lower than the expected invoice total.",
    };
  }

  return {
    expectedAmount, opsInvoiceAmount, receivedAmount,
    variance: displayVariance, verificationVariance, hasReceivedAmount, isMatched, couponApplied, expectedAmountLabel,
    label: "Excess Amount",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    varianceClass: "text-orange-700",
    note: couponApplied
      ? "Declared amount is higher than the coupon-adjusted payable amount."
      : "Declared amount is higher than the expected invoice total.",
  };
};

const getTimeAgo = (value) => {
  if (!value) return "Just now";
  const now = new Date();
  const date = new Date(value);
  const diffInMinutes = Math.floor((now - date) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

const withinDateFilter = (value, dateFilter) => {
  if (!value || dateFilter === "All Time") return true;
  const recordDate = new Date(value);
  if (Number.isNaN(recordDate.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  recordDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((today - recordDate) / (1000 * 60 * 60 * 24));
  if (dateFilter === "Last 7 Days") return diffDays >= 0 && diffDays <= 7;
  if (dateFilter === "Last 30 Days") return diffDays >= 0 && diffDays <= 30;
  if (dateFilter === "This Month") {
    return (
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    );
  }
  return true;
};

const isImageReceipt = (payment) => {
  const mimeType = String(payment?.receiptMimeType || "").toLowerCase();
  const receiptUrl = String(payment?.receiptUrl || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) => receiptUrl.endsWith(ext))
  );
};

const AUDIT_AMOUNT_LABEL_PATTERN = /(amount|invoice total|difference|variance|discount|payable)/i;

const formatAuditAmountToken = (rawValue = "") => {
  const normalized = String(rawValue || "").replace(/INR|₹/gi, "").replace(/\s+/g, "").trim();
  const isNegative = normalized.startsWith("-");
  const isPositive = normalized.startsWith("+");
  const digitsOnly = normalized.replace(/^[+-]/, "").replace(/,/g, "");

  if (!/^\d+$/.test(digitsOnly)) {
    return String(rawValue || "").trim();
  }

  const formattedAmount = formatCurrency(Number(digitsOnly));
  if (isNegative) return `-${formattedAmount}`;
  if (isPositive) return `+${formattedAmount}`;
  return formattedAmount;
};

const formatAuditValue = (label = "", value = "") => {
  const normalizedLabel = String(label || "").trim();
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) return "";

  if (AUDIT_AMOUNT_LABEL_PATTERN.test(normalizedLabel)) {
    return formatAuditAmountToken(trimmedValue);
  }

  return trimmedValue.replace(/INR\s*([+-]?\s*[\d,]+)/gi, (_, amount) => formatAuditAmountToken(amount));
};

const parseAuditDetailItems = (value = "") =>
  String(value || "")
    .split("|")
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item, index) => {
      const separatorIndex = item.indexOf(":");
      if (separatorIndex === -1) {
        return {
          id: `${index}-${item}`,
          label: "",
          value: formatAuditValue("", item),
          isAmount: false,
        };
      }

      const label = item.slice(0, separatorIndex).trim();
      const rawValue = item.slice(separatorIndex + 1).trim();
      return {
        id: `${index}-${label}`,
        label,
        value: formatAuditValue(label, rawValue),
        isAmount: AUDIT_AMOUNT_LABEL_PATTERN.test(label),
      };
    });

const AuditDetailGroup = ({ title, value }) => {
  const items = parseAuditDetailItems(value);
  if (!items.length) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
          >
            {item.label ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {item.label}
              </p>
            ) : null}
            <p
              className={`text-xs font-semibold ${
                item.isAmount
                  ? item.value.startsWith("-")
                    ? "text-rose-700"
                    : item.value.startsWith("+")
                      ? "text-orange-700"
                      : "text-emerald-700"
                  : "text-slate-700"
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatAuditText = (value = "") =>
  String(value || "").replace(/INR\s*([+-]?\s*[\d,]+)/gi, (_, amount) => {
    const normalized = String(amount || "").replace(/\s+/g, "").trim();
    const sign = normalized.startsWith("-") ? "-" : normalized.startsWith("+") ? "+" : "";
    const digitsOnly = normalized.replace(/^[+-]/, "").replace(/,/g, "");

    if (!/^\d+$/.test(digitsOnly)) {
      return `₹${normalized}`;
    }

    return `${sign}${formatCurrency(Number(digitsOnly))}`;
  });

const AmountCheckBadge = ({ payment }) => {
  const meta = getPaymentComparisonMeta(payment);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    "Manager Review": "bg-blue-50 text-blue-600 border-blue-200",
    Verified: "bg-green-50 text-green-600 border-green-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
  };
  const icons = {
    Pending: <Clock className="h-3 w-3 mr-1" />,
    "Manager Review": <ShieldCheck className="h-3 w-3 mr-1" />,
    Verified: <CheckCircle2 className="h-3 w-3 mr-1" />,
    Rejected: <XCircle className="h-3 w-3 mr-1" />,
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {icons[status]}
      {status}
    </span>
  );
};



const PaymentTrackerModal = ({
  payment,
  onClose,
  onSendAgentReceipt,
  onVerifyInstallment,
  sendingAgentReceipt = false,
  verifyingInstallmentIndex = null,
  canSendAgentReceipt = false,
  canVerifyInstallments = false,
}) => {
  const totalAmount = Math.round(
    Number(payment?.paymentTrackerTotal || payment?.expectedAmount || 0),
  );
  const trackerPayments = Array.isArray(payment?.paymentTrackerEntries)
    ? payment.paymentTrackerEntries
    : [];
  const paidAmount = trackerPayments.reduce(
    (sum, entry) => sum + Math.round(Number(entry?.amount || 0)),
    0,
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
  const isComplete = totalAmount > 0 && remainingAmount === 0;
  const installmentCount = trackerPayments.length;
  const ringRadius = 62;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const paidStrokeOffset = ringCircumference - (ringCircumference * progress) / 100;
  const progressDotPosition = totalAmount > 0 ? Math.max(2, Math.min(98, progress)) : 2;
  const lastInstallmentIndex = installmentCount > 0 ? installmentCount - 1 : -1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-[78rem] flex-col overflow-hidden rounded-[19px] bg-white shadow-[0_40px_100px_rgba(15,23,42,0.28)]"
      >
        <div className="flex items-start justify-between bg-gradient-to-r from-slate-900 via-[#163B72] to-[#1e3a8a] px-6 py-4">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-white/16 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
              Payment Tracker
            </span>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h3 className="text-[1.3rem] font-bold leading-none text-white">
                {payment?.bookingReference || "Booking Payment"}
              </h3>
              <p className="text-[0.9rem] font-medium text-blue-50">
                {payment?.invoiceNumber || "-"} • {payment?.agentName || "Agent"}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-xl bg-white/12 px-3 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                  Installments
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-white">
                  {installmentCount || 0} recorded
                </p>
              </div>
              <div className="rounded-xl bg-white/12 px-3 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                  Status
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-white">
                  {isComplete ? "Fully Paid" : "Partially Paid"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16 text-white transition hover:bg-white/24"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 text-slate-400">
                <DollarSign className="h-3.5 w-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Total</p>
              </div>
              <p className="text-[1.08rem] font-semibold leading-none text-slate-800">{formatCurrency(totalAmount)}</p>
              <div className="absolute bottom-0 left-0 h-[3px] w-0 rounded-full bg-slate-700 transition-all duration-300 group-hover:w-full" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Paid</p>
              </div>
              <p className="text-[1.08rem] font-semibold leading-none text-emerald-600">{formatCurrency(paidAmount)}</p>
              <div className="absolute bottom-0 left-0 h-[3px] w-0 rounded-full bg-emerald-500 transition-all duration-300 group-hover:w-full" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white px-4 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 text-amber-500">
                <Clock className="h-3.5 w-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Remaining</p>
              </div>
              <p className="text-[1.08rem] font-semibold leading-none text-amber-600">{formatCurrency(remainingAmount)}</p>
              <div className="absolute bottom-0 left-0 h-[3px] w-0 rounded-full bg-amber-500 transition-all duration-300 group-hover:w-full" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-4 lg:grid-cols-[1.18fr_0.9fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <History className="h-3.5 w-3.5 text-indigo-500" /> Payment History
                </p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                  {installmentCount || 0} instalment{installmentCount === 1 ? "" : "s"}
                </span>
              </div>

              {!trackerPayments.length ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
                  No payment entries have been recorded by the agent yet.
                </div>
              ) : (
                <div className="relative pl-10">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-3">
                    {trackerPayments.map((entry, index) => {
                      const isInstallmentVerified = entry?.verificationStatus === "Verified";
                      const isVerifyingThisInstallment = verifyingInstallmentIndex === index;

                      return (
                        <div key={entry.id || `${entry.amount}-${index}`} className="relative">
                          <div className="absolute left-[-34.5px] top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#163B72] shadow-sm">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-semibold text-slate-700">Instalment {index + 1}</p>
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                  <Check className="h-3 w-3" /> Paid
                                </span>
                                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isInstallmentVerified
                                    ? "bg-teal-50 text-teal-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}>
                                  {isInstallmentVerified ? (
                                    <>
                                      <Check className="h-3 w-3" /> Verified
                                    </>
                                  ) : (
                                    "Pending verification"
                                  )}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {!isInstallmentVerified ? (
                                  <button
                                    type="button"
                                    onClick={() => onVerifyInstallment(index)}
                                    disabled={isVerifyingThisInstallment || !canVerifyInstallments}
                                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                                      isVerifyingThisInstallment || !canVerifyInstallments
                                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                        : "bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.22)] hover:bg-emerald-700"
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isVerifyingThisInstallment ? "Verifying..." : "Verify payment"}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => onSendAgentReceipt(index)}
                                  disabled={sendingAgentReceipt}
                                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                                    sendingAgentReceipt
                                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                      : isInstallmentVerified
                                        ? "bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.24)] hover:bg-indigo-700"
                                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  }`}
                                >
                                  <Send className="h-3 w-3" />
                                  Send receipt
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 flex items-end justify-between gap-3">
                              <p className="text-[1.05rem] font-semibold leading-none text-slate-900">{formatCurrency(entry.amount)}</p>
                              <span className="flex items-center gap-1 text-[12px] text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {entry.date || formatDateLabel(entry.rawDate)}
                              </span>
                            </div>
                            {entry?.verifiedAtLabel || entry?.verifiedByName ? (
                              <p className="mt-2 text-[10px] text-slate-500">
                                Verified {entry?.verifiedAtLabel ? `on ${entry.verifiedAtLabel}` : ""}{entry?.verifiedByName ? ` by ${entry.verifiedByName}` : ""}
                              </p>
                            ) : null}
                            {entry.note && (
                              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[12px] leading-5 text-slate-500">
                                {entry.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="relative">
                      <div
                    className={`absolute left-[-34.5px] top-3.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm ${
                          isComplete ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                      >
                        {isComplete ? (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div
                        className={`ml-3 rounded-2xl border px-4 py-3 ${
                          isComplete
                            ? "border-emerald-100 bg-emerald-50"
                            : "border-dashed border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className={`text-[14px] font-semibold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}>
                            {isComplete ? "Payment complete" : "Remaining balance"}
                          </p>
                          <p className={`text-[1.05rem] font-semibold leading-none ${isComplete ? "text-emerald-700" : "text-amber-600"}`}>
                            {isComplete ? formatCurrency(totalAmount) : formatCurrency(remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {trackerPayments.length ? (
                      <div className="relative">
                        <div className="absolute left-[-34.5px] top-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#5b5ff8] shadow-sm">
                          <Send className="h-2.5 w-2.5 translate-x-[1px] translate-y-[0.5px] text-white" />
                        </div>
                        <div className="group relative ml-3 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[14px] font-semibold text-indigo-700">Send latest payment receipt</p>
                              <p className="mt-1 text-[12px] text-slate-600">
                                Share the latest instalment receipt with the agent after finance verification.
                              </p>
                            </div>
                            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                              Latest
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSendAgentReceipt(lastInstallmentIndex)}
                            disabled={sendingAgentReceipt}
                            className={`mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                              sendingAgentReceipt
                                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                : canSendAgentReceipt
                                  ? "border border-indigo-200 bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)] hover:bg-indigo-700 hover:shadow-[0_12px_28px_rgba(79,70,229,0.35)]"
                                  : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            <Send className={`h-3.5 w-3.5 ${sendingAgentReceipt ? "animate-pulse" : ""}`} />
                            {sendingAgentReceipt
                              ? "Sending..."
                              : "Send Latest Receipt"}
                          </button>
                          {!canSendAgentReceipt ? (
                            <p className="mt-2 text-[10px] text-slate-400">
                           Once the latest installment is verified, the receipt modal will open automatically. You can add the agent’s email in the email modal.
                            </p>
                          ) : null}
                          <div className="absolute bottom-0 left-0 h-[3px] w-0 rounded-full bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>



            <div>
              <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/50 px-4 py-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    <PieChart className="h-3.5 w-3.5 text-emerald-500" /> Payment Progress
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{progress}%</span>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="group relative flex h-[154px] w-[154px] cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
                    <svg className="h-full w-full -rotate-90 transition-transform duration-700 ease-out group-hover:rotate-[270deg]" viewBox="0 0 160 160">
                      <defs>
                        <linearGradient id="paymentTrackerRing" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="52%" stopColor="#615fff" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                      </defs>
                      <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="#E2E8F0" strokeWidth="9" />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r={ringRadius}
                        fill="none"
                        stroke="url(#paymentTrackerRing)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        initial={{ strokeDashoffset: ringCircumference }}
                        animate={{ strokeDashoffset: paidStrokeOffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:scale-95 group-hover:opacity-0">
                      <p className="text-[1.1rem] font-semibold leading-none text-slate-900">{formatCurrency(totalAmount)}</p>
                      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Total amount
                      </p>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 scale-105">
                      <p className="text-3xl font-bold bg-gradient-to-r from-[#163B72] to-[#5b5ff8] bg-clip-text text-transparent">{progress}%</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                        Paid
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-7 w-full">
                    {/* Vertical dashed line */}
                    <div className="absolute left-[11px] top-8 bottom-5 border-l-2 border-dashed border-slate-200" />

                    <div className="grid w-full gap-3">
                      {/* Total paid */}
                      <div className="relative">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#5b5ff8] ring-[3px] ring-slate-50" />
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <p className="text-[12px] font-semibold text-slate-500">Total paid</p>
                          <p className="mt-0.5 text-[1.05rem] font-semibold text-slate-900">{formatCurrency(paidAmount)}</p>
                          <div className="absolute bottom-0 left-0 h-[3px] w-0 rounded-full bg-[#5b5ff8] transition-all duration-300 group-hover:w-full" />
                        </div>
                      </div>

                      {/* Remaining */}
                      <div className="relative">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <p className="text-[12px] font-semibold text-slate-500">Remaining</p>
                          <p className="mt-0.5 text-[1.05rem] font-semibold text-slate-900">{formatCurrency(remainingAmount)}</p>
                          <div className="absolute bottom-0 left-0 h-[3px] w-0 rounded-full bg-slate-400 transition-all duration-300 group-hover:w-full" />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="relative">
                        <div className={`absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ring-[3px] ring-slate-50 ${isComplete ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <p className="text-[12px] font-semibold text-slate-500">Status</p>
                          <p className={`mt-0.5 text-[1.05rem] font-semibold ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
                            {isComplete ? "Fully Paid" : "Partially Paid"}
                          </p>
                          <div className={`absolute bottom-0 left-0 h-[3px] w-0 rounded-full transition-all duration-300 group-hover:w-full ${isComplete ? "bg-emerald-500" : "bg-amber-400"}`} />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="w-full rounded-2xl bg-white/90 px-3 py-2.5 shadow-sm">
                    <div className="mb-3 flex items-end justify-between gap-3 text-[12px]">
                      <span className="font-semibold text-slate-400">{formatCurrency(0)}</span>
                      <span className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm">
                        <span className="text-[#5b5ff8]">{formatCurrency(paidAmount)}</span>
                        <span className="text-indigo-300">/</span>
                        <span className="text-slate-700">{formatCurrency(totalAmount)}</span>
                      </span>
                    </div>
                    <div className="relative h-2.5 overflow-visible rounded-full bg-slate-200">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#163B72] to-[#5b5ff8]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      <motion.div
                        className="group absolute top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full border-[4px] border-indigo-600 bg-white shadow-[0_2px_10px_rgba(79,70,229,0.28)]"
                        initial={{ left: "calc(2% - 8px)", opacity: 0 }}
                        animate={{ left: `calc(${progressDotPosition}% - 8px)`, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
                          <div className="flex flex-col items-center gap-0.5 text-center">
                            <p className="text-sm font-bold text-white">{progress}% Paid</p>
                            <p className="text-[10px] text-slate-300">{payment?.agentName || "Agent"}</p>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400">{payment?.paymentDate || "N/A"}</p>
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-slate-900"></div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};const FeedbackToast = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };
  const Icon = feedback.type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className="fixed right-4 top-4 z-[200] w-full max-w-sm sm:right-6 sm:top-6">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${styles[feedback.type] || styles.success}`}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-white/80 p-1.5"><Icon className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{feedback.title}</p>
            <p className="mt-1 text-sm leading-5">{feedback.message}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewActionModal = ({ mode, payment, submitting, userRole, onClose, onConfirm }) => {
  const isVerifyMode = mode === "verify";
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reviewTarget, setReviewTarget] = useState("agent");
  const [submitted, setSubmitted] = useState(false);
  const showTargetOptions = userRole === "finance_partner";
  const targetOptions = isVerifyMode
    ? [
        { value: "agent", title: "Agent", description: "Complete the verification at team level and notify the agent directly." },
        { value: "manager", title: "Manager", description: "Escalate this verified payment to the finance manager for final approval." },
      ]
    : [
        { value: "agent", title: "Agent", description: "Agent will correct payment details and resubmit directly." },
        { value: "manager", title: "Manager", description: "This payment will move to finance manager for final review." },
      ];

  const handleSubmit = () => {
    if (!isVerifyMode && !reason) { setSubmitted(true); return; }
    onConfirm(
      isVerifyMode
        ? { remarks, reviewTarget }
        : { reason, remarks, rejectionTarget: reviewTarget },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex max-h-[90vh] w-full max-w-[420px] flex-col rounded-2xl border bg-white shadow-2xl ${isVerifyMode ? "border-emerald-100" : "border-red-100"}`}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              {isVerifyMode ? "Verify Payment And Send" : "Reject Payment And Send"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">{payment?.bookingReference} | {payment?.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scroll space-y-3 overflow-y-auto px-6 py-4">
          {!isVerifyMode && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Rejection Reason <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={`w-full appearance-none rounded-lg border px-3.5 py-2 text-[13px] outline-none transition-colors ${submitted && !reason ? "border-red-300 bg-red-50/40 text-slate-500" : "border-slate-200 bg-white text-slate-700 focus:border-blue-300"}`}>
                  <option value="">Select rejection reason</option>
                  {rejectionReasons.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {submitted && !reason && <p className="mt-1 text-[11px] text-red-500">A rejection reason is required.</p>}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
              {isVerifyMode ? "Verification Remarks" : "Remarks"}
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isVerifyMode ? "Add remarks for the agent or finance manager before sending..." : "Add optional remarks for the agent and finance audit trail..."}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-300"
            />
          </div>
          {showTargetOptions && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                {isVerifyMode ? "Send Verification To" : "Send Rejection To"}
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {targetOptions.map((option) => {
                  const isActive = reviewTarget === option.value;
                  return (
                      <button key={option.value} type="button" onClick={() => setReviewTarget(option.value)}
                      className={`rounded-lg border px-3.5 py-2 text-left transition-colors ${isActive ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <p className="text-[13px] font-semibold">{option.title}</p>
                          <p className="mt-0.5 text-[11px] leading-snug">{option.description}</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[0px] ${isActive ? "border-blue-400 bg-white text-blue-600" : "border-slate-300 text-transparent"}`}>
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-snug text-amber-800">
                {showTargetOptions
                  ? isVerifyMode
                    ? "This action records reviewer, timestamp, remarks, and routes the verification to the selected owner."
                    : "This action records reviewer, timestamp, rejection reason, and routes the payment to the selected correction owner."
                  : isVerifyMode
                    ? "This action records reviewer, timestamp, and verification remarks before notifying the agent."
                    : "This action records reviewer, timestamp, rejection reason, and notifies the agent."}
              </p>
            </div>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors ${submitting ? isVerifyMode ? "cursor-not-allowed bg-emerald-300" : "cursor-not-allowed bg-red-300" : isVerifyMode ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
          >
            {submitting ? isVerifyMode ? "Sending..." : "Rejecting..." : isVerifyMode ? "Verify and Send" : "Reject and Send"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const VerifyInstallmentConfirmationModal = ({
  installmentIndex,
  payment,
  onClose,
  onConfirm,
  submitting = false,
}) => {
  const installment = Array.isArray(payment?.paymentTrackerEntries)
    ? payment.paymentTrackerEntries[installmentIndex] || {}
    : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex max-h-[90vh] w-full max-w-[420px] flex-col rounded-2xl border border-emerald-100 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              Confirm Payment Verification
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {payment?.bookingReference} | {payment?.invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-emerald-800">Review & Confirmation</p>
              <p className="mt-0.5 text-[11.5px] text-emerald-600/90 leading-normal font-medium">
                I have reviewed the payment submitted by the agent and verified it against the bank records. All details are correct.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Payment Amount:</span>
              <span className="font-bold text-slate-800">
                {`₹${Math.round(Number(installment?.amount || 0)).toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Payment Date:</span>
              <span className="font-bold text-slate-800">
                {installment?.date || "Pending"}
              </span>
            </div>
            {installment?.note && (
              <div className="pt-2 border-t border-slate-100/80">
                <span className="block text-[11px] text-slate-400 font-bold mb-1">Remarks:</span>
                <p className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200/60 text-[11.5px] leading-relaxed text-slate-650 font-medium">
                  {installment.note}
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-normal text-center font-medium">
            By confirming, this installment will be marked as <strong className="text-slate-500 font-bold">Verified</strong> and locked from further edits by the agent.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-[12px] font-semibold text-slate-600 transition active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-white shadow-sm shadow-emerald-600/10 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Confirm Verification
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SendAgentReceiptModal = ({
  payment,
  trackerEntry = null,
  installmentIndex = null,
  recipientEmail,
  recipientPhone,
  dispatchChannel,
  onRecipientEmailChange,
  onRecipientPhoneChange,
  onDispatchChannelChange,
  sending = false,
  onClose,
  onSend,
}) => {
  const installmentAmount = Math.round(Number(trackerEntry?.amount || 0));
  const allTrackerEntries = Array.isArray(payment?.paymentTrackerEntries) ? payment.paymentTrackerEntries : [];
  const cumulativePaid = trackerEntry && installmentIndex !== null
    ? allTrackerEntries
        .slice(0, installmentIndex + 1)
        .reduce((sum, entry) => sum + Math.round(Number(entry?.amount || 0)), 0)
    : Math.round(Number(payment?.paymentTrackerPaidAmount || payment?.receivedAmount || 0));
  const remainingBalance = Math.max(
    0,
    Math.round(Number(payment?.paymentTrackerTotal || payment?.expectedAmount || 0)) - cumulativePaid,
  );

  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/65 px-4 py-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={(event) => event.stopPropagation()}
      className="flex w-full max-w-[410px] min-h-[490px] max-h-[85vh] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
    >
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#ecfeff_100%)] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#163B72] text-white shadow-sm">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Send Receipt</p>
              <h3 className="text-[15px] font-semibold leading-tight text-slate-900">Share with agent</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll space-y-4 px-5 py-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Receipt Summary</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 text-slate-700">
            {/* Left Column */}
            <div className="space-y-2.5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Query</p>
                <p className="text-[11px] font-semibold text-slate-800 mt-0.5">{payment?.bookingReference || "-"}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Invoice</p>
                <p className="text-[11px] font-semibold text-slate-800 mt-0.5">{payment?.invoiceNumber || "-"}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Instalment</p>
                <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                  {trackerEntry ? `Instalment ${Number(installmentIndex) + 1}` : "-"}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2.5 pl-4 border-l border-slate-200/80">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Receipt Amount</p>
                <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                  {formatCurrency(installmentAmount || payment?.paymentTrackerPaidAmount || payment?.receivedAmount || 0)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Received So Far</p>
                <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                  {formatCurrency(cumulativePaid)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Remaining</p>
                <p className={`text-[11px] font-extrabold mt-0.5 ${remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {formatCurrency(remainingBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          {[
            { key: "EMAIL", label: "Email", iconElement: <Mail className="h-3.5 w-3.5" /> },
            { key: "WHATSAPP", label: "WhatsApp", iconElement: <Send className="h-3.5 w-3.5" /> },
            { key: "PDF", label: "PDF", iconElement: <Download className="h-3.5 w-3.5" /> },
          ].map(({ key, label, iconElement }) => (
            <button
              key={key}
              type="button"
              onClick={() => onDispatchChannelChange(key)}
              className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                dispatchChannel === key
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-500 hover:bg-white hover:text-slate-800"
              }`}
            >
              {iconElement}
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {dispatchChannel === "EMAIL" && (
            <motion.div
              key="email-field"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm shadow-indigo-200/70">
                  <Mail className="h-3 w-3" />
                </span>
                <span>Agent Email</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => onRecipientEmailChange(e.target.value)}
                placeholder="Enter agent email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </motion.div>
          )}

          {dispatchChannel === "WHATSAPP" && (
            <motion.div
              key="whatsapp-field"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-500 text-white shadow-sm shadow-emerald-200/70">
                  <Send className="h-3 w-3" />
                </span>
                <span>Agent WhatsApp Number</span>
              </label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => onRecipientPhoneChange(e.target.value)}
                placeholder="Enter WhatsApp number"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
              <Send className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">What will happen</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                {dispatchChannel === "EMAIL"
                  ? "A Holiday Circuit branded payment receipt PDF will be generated and sent to the agent on this email."
                  : dispatchChannel === "WHATSAPP"
                    ? "A branded receipt PDF will be generated and WhatsApp will open with a ready-to-share message."
                    : "A branded receipt PDF will be generated and downloaded to your system."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="cursor-pointer rounded-full bg-slate-900 px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {sending
            ? "Processing..."
            : dispatchChannel === "PDF"
              ? "Download Receipt"
              : dispatchChannel === "WHATSAPP"
                ? "Open WhatsApp"
                : trackerEntry
                  ? "Send Instalment Receipt"
                  : "Send Receipt"}
        </button>
      </div>
    </motion.div>
  </motion.div>
  );
};

const PaymentVerification = () => {
  const user = useSelector((state) => state.auth.user);
  const [paymentData, setPaymentData] = useState(createEmptyData());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openPaymentTrackerModal, setOpenPaymentTrackerModal] = useState(false);
  const [openSendAgentReceiptModal, setOpenSendAgentReceiptModal] = useState(false);
  const [openReceiptPreview, setOpenReceiptPreview] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [sendingFinalInvoice, setSendingFinalInvoice] = useState(false);
  const [sendingAgentReceipt, setSendingAgentReceipt] = useState(false);
  const [verifyingInstallmentIndex, setVerifyingInstallmentIndex] = useState(null);
  const [agentReceiptEmail, setAgentReceiptEmail] = useState("");
  const [agentReceiptPhone, setAgentReceiptPhone] = useState("");
  const [agentReceiptChannel, setAgentReceiptChannel] = useState("EMAIL");
  const [selectedReceiptInstallmentIndex, setSelectedReceiptInstallmentIndex] = useState(null);
  const [installmentToVerifyConfirmIndex, setInstallmentToVerifyConfirmIndex] = useState(null);
  const itemsPerPage = 8;
  const selectedWorkflowStatus = selectedPayment?.workflowStatus || selectedPayment?.status || "Pending";
  const isAwaitingManager = selectedWorkflowStatus === "Manager Review";
  const isFinalVerified = selectedWorkflowStatus === "Verified";
  const isFinalRejected = selectedWorkflowStatus === "Rejected";
  const canCurrentUserReview =
    selectedPayment &&
    (user?.role === "admin"
      ? selectedPayment.status === "Pending"
      : user?.role === "finance_partner"
        ? selectedPayment.status === "Pending" && !selectedPayment.teamDecisionStatus
        : false);
  const selectedPaymentComparison = useMemo(() => getPaymentComparisonMeta(selectedPayment || {}), [selectedPayment]);
  const hasSelectedPaymentContext = Boolean(String(selectedPayment?.paymentOnBehalfOf || "").trim());
  const isPartialPayment =
    selectedPaymentComparison.hasReceivedAmount &&
    selectedPaymentComparison.verificationVariance < 0;
  const isExcessPayment =
    selectedPaymentComparison.hasReceivedAmount &&
    selectedPaymentComparison.verificationVariance > 0;
  const isPaymentFullyPaid = selectedPayment?.invoicePaymentStatus === "Paid";
  const canVerifySelectedPayment =
    canCurrentUserReview &&
    hasSelectedPaymentContext &&
    (selectedPaymentComparison.isMatched || isPartialPayment);
  const canSendFinalInvoice =
    isFinalVerified &&
    isPaymentFullyPaid &&
    selectedPayment?.canSendFinalInvoice === true &&
    Boolean(String(selectedPayment?.agentEmail || "").trim());
  const canSendPaymentReceipt =
    Math.round(Number(selectedPayment?.paymentTrackerPaidAmount || selectedPayment?.receivedAmount || 0)) > 0;
  const canVerifyInstallments =
    Boolean(selectedPayment) &&
    !isAwaitingManager &&
    !isFinalRejected &&
    (canCurrentUserReview || isFinalVerified);
  const selectedReceiptTrackerEntry =
    selectedReceiptInstallmentIndex !== null &&
    Array.isArray(selectedPayment?.paymentTrackerEntries)
      ? selectedPayment.paymentTrackerEntries[selectedReceiptInstallmentIndex] || null
      : null;

  useEffect(() => {
    setOpenReceiptPreview(false);
    setOpenPaymentTrackerModal(false);
    setOpenSendAgentReceiptModal(false);
    setAgentReceiptEmail(String(selectedPayment?.paymentReceiptRecipientEmail || selectedPayment?.agentEmail || "").trim());
    setAgentReceiptPhone("");
    setAgentReceiptChannel("EMAIL");
    setSelectedReceiptInstallmentIndex(null);
    setVerifyingInstallmentIndex(null);
    setInstallmentToVerifyConfirmIndex(null);
  }, [selectedPayment?.id, selectedPayment?.receiptUrl]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/admin/payment-verifications");
        setPaymentData(data?.data || createEmptyData());
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError?.response?.data?.message || "Failed to load payment verification data");
        setPaymentData(createEmptyData());
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const statsData = useMemo(
    () => [
      {
        title: "Total Payments",
        value: paymentData.summary.totalPayments,
        icon: FileText,
        color: "text-blue-600",
        accentColor: "border-b-blue-500",
        cardBg: "from-blue-50/90 via-white to-blue-50/20",
        borderColor: "border-blue-100 hover:border-blue-300",
        iconBg: "bg-blue-100/80 text-blue-600",
        shadowColor: "shadow-blue-500/5",
      },
      {
        title: "Pending Review",
        value: paymentData.summary.pendingReview,
        icon: Clock,
        color: "text-amber-600",
        accentColor: "border-b-amber-500",
        cardBg: "from-amber-50/90 via-white to-amber-50/20",
        borderColor: "border-amber-100 hover:border-amber-300",
        iconBg: "bg-amber-100/80 text-amber-600",
        shadowColor: "shadow-amber-500/5",
      },
      {
        title: "Awaiting Manager",
        value: paymentData.summary.sentToManager,
        icon: ShieldCheck,
        color: "text-indigo-600",
        accentColor: "border-b-indigo-500",
        cardBg: "from-indigo-50/90 via-white to-indigo-50/20",
        borderColor: "border-indigo-100 hover:border-indigo-300",
        iconBg: "bg-indigo-100/80 text-indigo-600",
        shadowColor: "shadow-indigo-500/5",
      },
      {
        title: "Verified",
        value: paymentData.summary.verified,
        icon: CheckCircle2,
        color: "text-emerald-600",
        accentColor: "border-b-emerald-500",
        cardBg: "from-emerald-50/90 via-white to-emerald-50/20",
        borderColor: "border-emerald-100 hover:border-emerald-300",
        iconBg: "bg-emerald-100/80 text-emerald-600",
        shadowColor: "shadow-emerald-500/5",
      },
      {
        title: "Rejected",
        value: paymentData.summary.rejected,
        icon: XCircle,
        color: "text-rose-600",
        accentColor: "border-b-rose-500",
        cardBg: "from-rose-50/90 via-white to-rose-50/20",
        borderColor: "border-rose-100 hover:border-rose-300",
        iconBg: "bg-rose-100/80 text-rose-600",
        shadowColor: "shadow-rose-500/5",
      },
      {
        title: "Total Amount",
        value: formatCurrency(paymentData.summary.totalAmount),
        icon: IndianRupee,
        color: "text-yellow-600",
        accentColor: "border-b-yellow-500",
        cardBg: "from-yellow-50/90 via-white to-yellow-50/20",
        borderColor: "border-yellow-100 hover:border-yellow-300",
        iconBg: "bg-yellow-100/80 text-yellow-600",
        shadowColor: "shadow-yellow-500/5",
      },
    ],
    [paymentData.summary],
  );

  const filteredPayments = useMemo(() => {
    return (paymentData.payments || []).filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        String(payment.bookingReference || "").toLowerCase().includes(searchLower) ||
        String(payment.agentName || "").toLowerCase().includes(searchLower) ||
        String(payment.paymentOnBehalfOf || "").toLowerCase().includes(searchLower) ||
        String(payment.utrNumber || "").toLowerCase().includes(searchLower) ||
        String(payment.invoiceNumber || "").toLowerCase().includes(searchLower);
      const workflowStatus = payment.workflowStatus || payment.status;
      const matchesStatus = statusFilter === "All Status" || workflowStatus === statusFilter;
      const matchesDate = withinDateFilter(payment.paymentDateValue || payment.submittedAtValue, dateFilter);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, paymentData.payments, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, paymentData.payments.length]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const refreshPaymentRecord = (updatedPayment) => {
    setPaymentData((prev) => {
      const nextPayments = (prev.payments || []).map((payment) =>
        payment.id === updatedPayment.id ? updatedPayment : payment,
      );
      return {
        payments: nextPayments,
        summary: {
          totalPayments: nextPayments.length,
          pendingReview: nextPayments.filter((p) => (p.workflowStatus || p.status) === "Pending").length,
          sentToManager: nextPayments.filter((p) => (p.workflowStatus || p.status) === "Manager Review").length,
          verified: nextPayments.filter((p) => (p.workflowStatus || p.status) === "Verified").length,
          rejected: nextPayments.filter((p) => (p.workflowStatus || p.status) === "Rejected").length,
          totalAmount: nextPayments.reduce((sum, p) => sum + Number(p.expectedAmount ?? p.amount ?? 0), 0),
        },
      };
    });
    setSelectedPayment(updatedPayment);
  };

  const handleDownloadReceipt = async () => {
    if (!selectedPayment?.receiptUrl) {
      setFeedback({ type: "warning", title: "Receipt Missing", message: "No receipt file is available for this payment submission yet." });
      return;
    }
    
    try {
      const fileUrl = selectedPayment.receiptUrl;
      const fileName = selectedPayment.receiptName || `receipt-${selectedPayment.transactionId || Date.now()}`;
      
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed, falling back to new tab:", error);
      window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handlePreviewReceipt = () => {
    if (!selectedPayment?.receiptUrl) {
      setFeedback({ type: "warning", title: "Receipt Missing", message: "No receipt file is available for preview yet." });
      return;
    }

    if (isImageReceipt(selectedPayment)) {
      setOpenReceiptPreview(true);
      return;
    }

    window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer");
  };

  const handleVerify = async ({ remarks = "", reviewTarget = "" } = {}) => {
    if (!selectedPayment || submittingAction) return;
    if (!selectedPaymentComparison.hasReceivedAmount) {
      setFeedback({ type: "warning", title: "Amount Missing", message: "Agent must submit the transferred amount before finance can verify this payment." });
      return;
    }
    if (!selectedPaymentComparison.isMatched && !isPartialPayment) {
      setFeedback({
        type: "warning",
        title: isExcessPayment ? "Excess Amount" : "Amount Mismatch",
        message: isExcessPayment
          ? "Declared payment is higher than the expected invoice amount. Reject or ask for correction before verifying."
          : "Declared payment does not match the expected invoice amount. Reject or ask for correction before verifying.",
      });
      return;
    }
    if (!hasSelectedPaymentContext) {
      setFeedback({ type: "warning", title: "Behalf Details Missing", message: "Payment on behalf of is required before finance can verify this payment." });
      return;
    }
    try {
      setSubmittingAction(true);
      const { data } = await API.patch(`/admin/payment-verifications/${selectedPayment.id}/status`, { status: "Verified", reviewRemarks: remarks, reviewTarget });
      refreshPaymentRecord(data?.data);
      setOpenVerifyModal(false);
      const isFinanceMember = user?.role === "finance_partner";
      const sentToManager = isFinanceMember && reviewTarget === "manager";
      setFeedback({
        type: "success",
        title: sentToManager ? "Sent To Manager" : "Payment Verified",
        message: sentToManager
          ? "Your verification remarks have been sent to the finance manager for final approval."
            : isFinanceMember
              ? isPartialPayment
                ? "Partial payment has been verified at team level. Service confirmation workflow can continue."
                : "Payment has been verified at team level and sent forward to the agent."
              : isPartialPayment
                ? "Partial payment proof has been verified. Voucher generation is now available for service confirmations."
                : "UTR and payment proof have been verified. Invoice workflow is now unlocked.",
      });
    } catch (actionError) {
      setFeedback({ type: "error", title: "Verification Failed", message: actionError?.response?.data?.message || actionError?.response?.data?.error || "Unable to verify this payment right now." });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async ({ reason, remarks, rejectionTarget }) => {
    if (!selectedPayment || submittingAction) return;
    try {
      setSubmittingAction(true);
      const { data } = await API.patch(`/admin/payment-verifications/${selectedPayment.id}/status`, { status: "Rejected", rejectionReason: reason, rejectionRemarks: remarks, rejectionTarget });
      refreshPaymentRecord(data?.data);
      setOpenRejectModal(false);
      const isFinanceMember = user?.role === "finance_partner";
      const sentToAgent = rejectionTarget === "agent";
      setFeedback({
        type: "warning",
        title: isFinanceMember ? sentToAgent ? "Returned To Agent" : "Sent To Manager" : "Payment Rejected",
        message: isFinanceMember
          ? sentToAgent
            ? "Payment was sent back to the agent for correction. Once resubmitted, it will return to your queue."
            : "Your rejection recommendation has been sent to the finance manager for final review."
          : "Finance marked this payment as rejected and the agent has been notified.",
      });
    } catch (actionError) {
      setFeedback({ type: "error", title: "Rejection Failed", message: actionError?.response?.data?.message || actionError?.response?.data?.error || "Unable to reject this payment right now." });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendFinalInvoice = async () => {
    if (!selectedPayment || sendingFinalInvoice) return;
    if (!canSendFinalInvoice) {
      setFeedback({
        type: "warning",
        title: "Final Invoice Locked",
        message: "Final invoice dispatch unlocks only after the full remaining payment is verified.",
      });
      return;
    }
    if (!selectedPayment.agentEmail) {
      setFeedback({ type: "warning", title: "Agent Email Missing", message: "This final invoice cannot be sent because the agent email is not available." });
      return;
    }
    try {
      setSendingFinalInvoice(true);
      const { data } = await API.post(`/admin/payment-verifications/${selectedPayment.id}/send-final-invoice`);
      refreshPaymentRecord(data?.data);
      setFeedback({ type: "success", title: "Final Invoice Sent", message: data?.message || "Finance has shared the final invoice with the agent successfully." });
    } catch (actionError) {
      setFeedback({ type: "error", title: "Send Failed", message: actionError?.response?.data?.message || actionError?.response?.data?.error || "Unable to send the final invoice right now." });
    } finally {
      setSendingFinalInvoice(false);
    }
  };

  const handleVerifyInstallment = async (installmentIndex) => {
    if (!selectedPayment || verifyingInstallmentIndex !== null) return;

    try {
      setVerifyingInstallmentIndex(installmentIndex);
      const { data } = await API.post(
        `/admin/payment-verifications/${selectedPayment.id}/tracker-installments/${installmentIndex}/verify`,
      );
      refreshPaymentRecord(data?.data);
      setFeedback({
        type: "success",
        title: "Installment Verified",
        message: data?.message || `Instalment ${Number(installmentIndex) + 1} verified successfully.`,
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Verification Failed",
        message: actionError?.response?.data?.message || actionError?.response?.data?.error || "Unable to verify this installment right now.",
      });
    } finally {
      setVerifyingInstallmentIndex(null);
    }
  };

  const handleOpenAgentReceiptModal = (installmentIndex = null) => {
    if (!selectedPayment) return;
    const targetedEntry =
      Number.isInteger(installmentIndex) && Array.isArray(selectedPayment?.paymentTrackerEntries)
        ? selectedPayment.paymentTrackerEntries[installmentIndex] || null
        : null;
    const isInstallmentVerified =
      targetedEntry?.verificationStatus === "Verified" ||
      (targetedEntry === null && isFinalVerified);

    if (!isInstallmentVerified) {
      setFeedback({
        type: "warning",
        title: "Verify Installment First",
        message: "The finance team must verify the payment before sending the installment receipt.",
      });
      return;
    }
    setSelectedReceiptInstallmentIndex(
      Number.isInteger(installmentIndex) ? installmentIndex : null,
    );
    setAgentReceiptEmail(String(selectedPayment.paymentReceiptRecipientEmail || selectedPayment.agentEmail || "").trim());
    setAgentReceiptPhone("");
    setAgentReceiptChannel("EMAIL");
    setOpenSendAgentReceiptModal(true);
  };

  const handleSendAgentReceipt = async () => {
    if (!selectedPayment || sendingAgentReceipt) return;
    if (agentReceiptChannel === "EMAIL" && !agentReceiptEmail.trim()) {
      setFeedback({ type: "warning", title: "Agent Email Missing", message: "Please enter the agent email before sending the receipt." });
      return;
    }
    if (agentReceiptChannel === "WHATSAPP" && !normalizeWhatsAppPhoneNumber(agentReceiptPhone)) {
      setFeedback({ type: "warning", title: "WhatsApp Number Missing", message: "Please enter a valid agent WhatsApp number before sharing the receipt." });
      return;
    }

    try {
      setSendingAgentReceipt(true);
      const { data } = await API.post(`/admin/payment-verifications/${selectedPayment.id}/send-payment-receipt`, {
        dispatchChannel: agentReceiptChannel,
        recipientEmail: agentReceiptEmail.trim(),
        recipientPhone: agentReceiptPhone.trim(),
        ...(selectedReceiptInstallmentIndex !== null ? { installmentIndex: selectedReceiptInstallmentIndex } : {}),
      });

      const receiptPath = data?.receiptDocument?.filePath || "";
      const receiptUrl = receiptPath
        ? `${getApiOrigin()}${receiptPath}`
        : "";
      if (agentReceiptChannel === "PDF" && receiptUrl) {
        await triggerFileDownload(receiptUrl, data?.receiptDocument?.name || "Agent_Payment_Receipt.pdf");
      }
      if (agentReceiptChannel === "WHATSAPP") {
        const normalizedPhone = normalizeWhatsAppPhoneNumber(agentReceiptPhone);
        const message = data?.dispatch?.whatsappMessage || "";
        if (normalizedPhone && message) {
          window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        }
      }

      refreshPaymentRecord(data?.data);
      setOpenSendAgentReceiptModal(false);
      setSelectedReceiptInstallmentIndex(null);
      setFeedback({
        type: "success",
        title: agentReceiptChannel === "PDF" ? "Receipt Downloaded" : agentReceiptChannel === "WHATSAPP" ? "WhatsApp Ready" : "Receipt Sent",
        message: data?.message || "Holiday Circuit payment receipt has been shared successfully.",
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Send Failed",
        message: actionError?.response?.data?.message || actionError?.response?.data?.error || "Unable to send the payment receipt right now.",
      });
    } finally {
      setSendingAgentReceipt(false);
    }
  };
  return (
    <>
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-1 text-slate-800">
        {!selectedPayment && (
          <>
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
                <p className="mt-1 text-sm text-slate-500">Review and verify agent payment submissions before invoice workflow continues</p>
              </div>
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-650 to-emerald-500 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-600 active:scale-95 active:translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out text-white px-4.5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20">
                <FileDown className="h-4 w-4" />
                Export Finance Report
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
              {statsData.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className={`bg-gradient-to-br ${stat.cardBg} border ${stat.borderColor} border-b-4 ${stat.accentColor} rounded-xl p-3.5 shadow-sm hover:shadow-md ${stat.shadowColor} flex items-center justify-between hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out group`}>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p className="mb-2 text-[10px] font-semibold leading-4 uppercase tracking-wider text-slate-500">{stat.title}</p>
                      <p className={`text-lg font-extrabold tracking-tight leading-none ${stat.color}`}>{loading ? "..." : stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 ease-out shadow-inner`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
          </>
        )}

        <AnimatePresence mode="wait">
          {!selectedPayment ? (
            <motion.div
              key="payment-list"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Filters */}
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by booking ref, agent name, UTR, or invoice number..."
                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="All Status">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Manager Review">Awaiting Manager</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="All Time">All Time</option>
                      <option value="Last 7 Days">Last 7 Days</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="This Month">This Month</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mt-3">
                <div className="custom-scroll overflow-x-auto pb-2">
                  <table className="w-full min-w-[1240px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Booking Reference</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Agent Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Amount Check</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">UTR Number</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Payment Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Bank</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr><td colSpan="9" className="py-12 text-center text-sm text-slate-400">Loading payment submissions...</td></tr>
                      ) : paginatedPayments.length > 0 ? (
                        paginatedPayments.map((payment) => (
                          <tr key={payment.id} className="transition-colors hover:bg-slate-50">
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{payment.bookingReference}</p>
                                  <p className="text-[10px] text-slate-400">{payment.invoiceNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">{payment.agentName}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div>
                                <p className="text-xs font-bold text-slate-800">{formatCurrency(payment.expectedAmount || payment.amount)}</p>
                                <p className="mt-1 text-[10px] text-slate-400">Paid: {payment.receivedAmount ? formatCurrency(payment.receivedAmount) : "Pending"}</p>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4"><AmountCheckBadge payment={payment} /></td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {!payment.utrNumber || payment.utrNumber === "Pending" ? (
                                <span className="inline-flex w-fit items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-600 whitespace-nowrap">
                                  Pending
                                </span>
                              ) : (
                                <span className="inline-flex w-fit items-center rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 whitespace-nowrap" title={payment.utrNumber}>
                                  {payment.utrNumber}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4"><div className="flex items-center gap-1.5 text-xs text-slate-600"><Clock className="h-3.5 w-3.5 text-slate-400" />{payment.paymentDate}</div></td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {payment.bankName && payment.bankName !== "Pending" ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {BANK_LOGOS[payment.bankName] || (
                                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-[11px] font-semibold text-slate-700 truncate min-w-0">{payment.bankName}</span>
                                </div>
                              ) : (
                                <span className="inline-flex w-fit items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-600 whitespace-nowrap">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={payment.workflowStatus || payment.status} /></td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <button
                                onClick={() => setSelectedPayment(payment)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 hover:from-blue-950 hover:via-slate-900 hover:to-slate-950 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:shadow shadow-blue-950/10 cursor-pointer group"
                              >
                                <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="9" className="py-12 text-center text-sm text-slate-500">No payment records match your current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-3 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
                  <span className="text-xs font-medium text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {Array.from({ length: totalPages }).map((_, index) => {
                        if (totalPages > 5 && index !== 0 && index !== totalPages - 1 && Math.abs(currentPage - 1 - index) > 1) {
                          if (index === 1 && currentPage > 3) return <span key={index} className="px-1 text-gray-400">...</span>;
                          if (index === totalPages - 2 && currentPage < totalPages - 2) return <span key={index} className="px-1 text-gray-400">...</span>;
                          return null;
                        }
                        return (
                          <button key={index} onClick={() => setCurrentPage(index + 1)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${currentPage === index + 1 ? "bg-slate-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                          >{index + 1}</button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (

            <motion.div
              key="payment-details"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className=" p-1"
            >
              {/* Detail Header */}
              <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Payment Verification Details</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedPayment.bookingReference} | {selectedPayment.invoiceNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenPaymentTrackerModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-b-[4px] border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 hover:border-b-[4px] hover:border-emerald-300 active:translate-y-[2px] active:border-b-[2px]"
                  >
                    <Clock className="h-4 w-4" />
                    Payment Tracker
                  </button>
                  <button onClick={() => { setSelectedPayment(null); setOpenRejectModal(false); setOpenPaymentTrackerModal(false); }} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium transition-colors bg-[#000000e3] text-white hover:bg-gray-20 cursor-pointer">Back to List</button>
                </div>
              </div>

              {/* Status Cards Row */}
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className={`rounded-xl border px-4 py-3 ${isFinalVerified ? "border-emerald-200 bg-emerald-50" : isFinalRejected ? "border-red-200 bg-red-50" : isAwaitingManager ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Verification Status</p>
                  <div className="mt-2"><StatusBadge status={selectedWorkflowStatus} /></div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {isAwaitingManager ? "Recommended By" : selectedPayment.status === "Pending" ? "Assigned To" : "Reviewed By"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {isAwaitingManager
                      ? selectedPayment.teamDecisionByName || selectedPayment.assignedFinanceName || "Finance Executive"
                      : selectedPayment.status === "Pending"
                        ? selectedPayment.assignedFinanceName || "Awaiting assignment"
                        : selectedPayment.reviewedByName || selectedPayment.assignedFinanceName || "Awaiting finance review"}
                  </p>
                  {selectedPayment.assignedFinanceEmail && <p className="mt-1 text-xs text-slate-400">{selectedPayment.assignedFinanceEmail}</p>}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {isAwaitingManager ? "Sent To Manager On" : selectedPayment.status === "Pending" ? "Assigned On" : "Reviewed On"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {isAwaitingManager
                      ? selectedPayment.sentToManagerAt || selectedPayment.teamDecisionAt || "Pending"
                      : selectedPayment.status === "Pending"
                        ? selectedPayment.assignedAt || "Pending"
                        : selectedPayment.reviewedAt || "Pending"}
                  </p>
                </div>
              </div>

              {/* Match Deck */}
              <div className="mb-6 rounded-[18px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_rgba(255,255,255,1)_42%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_50%,_#eef8f2_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Verification Match Deck</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">Compare the expected invoice amount with the payment shared by the agent</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{selectedPaymentComparison.note}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <AmountCheckBadge payment={selectedPayment} />
                    {selectedPayment.couponApplied && (
                      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">Coupon Applied</span>
                    )}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-sky-700">{selectedPaymentComparison.expectedAmountLabel}</p>
                    <p className="mt-2 text-xl font-bold text-sky-950">{formatCurrency(selectedPaymentComparison.expectedAmount)}</p>
                    {selectedPayment.couponApplied && (
                      <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">Ops Invoice Before Discount</span>
                        <span className="text-[11px] font-bold text-amber-900">{formatCurrency(selectedPaymentComparison.opsInvoiceAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">Agent Declared Amount</p>
                    <p className={`mt-2 text-xl font-bold ${selectedPaymentComparison.hasReceivedAmount ? "text-emerald-950" : "text-slate-400"}`}>
                      {selectedPaymentComparison.hasReceivedAmount ? formatCurrency(selectedPaymentComparison.receivedAmount) : "Pending"}
                    </p>
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 ${selectedPayment.couponApplied ? "border-violet-200 bg-violet-50/70" : "border-white/70 bg-white/90"}`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Variance</p>
                    <p className={`mt-2 text-xl font-bold ${selectedPaymentComparison.varianceClass}`}>
                      {selectedPaymentComparison.hasReceivedAmount
                        ? `${selectedPaymentComparison.variance > 0 ? "+" : ""}${formatCurrency(selectedPaymentComparison.variance)}`
                        : "Pending"}
                    </p>
                    {selectedPayment.couponApplied && <p className="mt-1 text-[11px] text-slate-500">Difference against the full ops invoice before coupon discount</p>}
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Payment Reference Shared By Agent</p>
                    <p className={`mt-2 text-sm font-semibold leading-5 ${hasSelectedPaymentContext ? "text-slate-900" : "text-slate-400"}`}>
                      {selectedPayment.paymentOnBehalfOf || "Agent has not shared the payment reference yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Column Detail */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* LEFT: Payment Details + Actions */}
                <div className="flex flex-col min-w-0">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800">Agent Payment Details</h3>
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4">
                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                          <User className="h-3 w-3 text-sky-500" /> Agent Name
                        </p>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <Building2 className="h-4 w-4 text-[#5b5ff8]" /> {selectedPayment.agentName}
                        </p>
                        {selectedPayment.agentEmail && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="h-3 w-3 text-violet-500" /> {selectedPayment.agentEmail}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={selectedWorkflowStatus} />
                    </div>
                    <div className="relative pl-7 space-y-4 mt-2">
                      <div className="absolute left-[11px] top-1.5 bottom-1.5 border-l-2 border-dashed border-slate-200" />

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Booking Reference</p>
                        <p className="text-sm font-bold text-slate-900">{selectedPayment.bookingReference}</p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Invoice Number</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedPayment.invoiceNumber}</p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-sky-400 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">{selectedPayment.couponApplied ? "Expected Payable Amount" : "Expected Invoice Amount"}</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedPaymentComparison.expectedAmount)}</p>
                      </div>

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs font-semibold text-amber-700">Ops Invoice Total</p>
                          <p className="text-sm font-bold text-amber-900">{formatCurrency(selectedPaymentComparison.opsInvoiceAmount)}</p>
                        </div>
                      )}

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-violet-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs text-slate-500">Coupon Code</p>
                          <p className="text-right text-sm font-semibold text-violet-700">{selectedPayment.couponCode || "Applied"}</p>
                        </div>
                      )}

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs text-slate-500">Coupon Discount</p>
                          <p className="text-right text-sm font-semibold text-emerald-700">{selectedPayment.couponDiscountLabel || formatCurrency(selectedPayment.couponDiscountAmount)}</p>
                        </div>
                      )}

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs text-slate-500">Discount Amount</p>
                          <p className="text-right text-sm font-semibold text-emerald-700">- {formatCurrency(selectedPayment.couponDiscountAmount)}</p>
                        </div>
                      )}

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Declared Paid Amount</p>
                        <p className={`text-sm font-bold ${selectedPaymentComparison.hasReceivedAmount ? "text-emerald-700" : "text-slate-400"}`}>{selectedPaymentComparison.hasReceivedAmount ? formatCurrency(selectedPaymentComparison.receivedAmount) : "Pending"}</p>
                      </div>

                      <div className={`relative flex items-center justify-between ${selectedPayment.couponApplied ? "rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2" : ""}`}>
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-rose-400 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">{selectedPayment.couponApplied ? "Variance From Ops Total" : "Payment Difference"}</p>
                        <p className={`text-sm font-bold ${selectedPaymentComparison.varianceClass}`}>{selectedPaymentComparison.hasReceivedAmount ? `${selectedPaymentComparison.variance > 0 ? "+" : ""}${formatCurrency(selectedPaymentComparison.variance)}` : "Pending"}</p>
                      </div>

                      <div className="relative flex items-center justify-between gap-4">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Payment On Behalf Of</p>
                        <p className="text-right text-sm font-semibold text-slate-800">{selectedPayment.paymentOnBehalfOf || "Not shared"}</p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">UTR Number</p>
                        <p className="font-mono text-[10px] font-semibold text-amber-500">{selectedPayment.utrNumber || "Pending"}</p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Bank Name</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedPayment.bankName || "Pending"}</p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Payment Date</p>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Calendar className="h-3.5 w-3.5 text-slate-400" />{selectedPayment.paymentDate}</p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Submitted</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedPayment.submittedAt || "Pending"}</p>
                      </div>

                      <div className="relative flex items-center justify-between gap-4">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Assigned Finance</p>
                        <p className="text-right text-sm font-semibold text-slate-800">{selectedPayment.assignedFinanceName || "Awaiting assignment"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Finance Review Note */}
                  {(selectedPayment.remarks || !hasSelectedPaymentContext || !selectedPaymentComparison.isMatched || selectedPayment.couponApplied) && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 ${!hasSelectedPaymentContext || isExcessPayment ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${!hasSelectedPaymentContext || isExcessPayment ? "text-amber-700" : "text-slate-500"}`}>Finance Review Note</p>
                      {!hasSelectedPaymentContext && <p className="mt-2 text-xs leading-5 text-amber-800">Agent has not shared who this payment is for. Verification should wait until the behalf detail is submitted.</p>}
                      {hasSelectedPaymentContext && isPartialPayment && <p className="mt-2 text-xs leading-5 text-slate-700">This is a partial payment. Verifying it will keep the invoice partially paid and unlock provisional voucher generation for service confirmations.</p>}
                      {hasSelectedPaymentContext && isExcessPayment && <p className="mt-2 text-xs leading-5 text-amber-800">The declared amount is higher than the expected invoice total. Use rejection or ask for corrected resubmission.</p>}
                      {selectedPayment.remarks && <p className="mt-2 text-xs leading-5 text-slate-700"><span className="font-semibold">Agent note:</span> {selectedPayment.remarks}</p>}
                      {selectedPayment.couponApplied && <p className="mt-2 text-xs leading-5 text-slate-700"><span className="font-semibold">Coupon context:</span> {selectedPayment.couponSummary || `${selectedPayment.couponCode} reduced the payable amount for this invoice.`}</p>}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {isFinalRejected && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">Rejection Reason</p>
                      <p className="mt-2 text-sm font-semibold text-red-700">{selectedPayment.rejectionReason || "Rejected by finance"}</p>
                      {selectedPayment.rejectionRemarks && <p className="mt-1 text-xs leading-5 text-red-600">{selectedPayment.rejectionRemarks}</p>}
                    </div>
                  )}

                  {/* Manager Recommendation */}
                  {isAwaitingManager && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Team Recommendation</p>
                      <p className="mt-2 text-sm font-semibold text-blue-700">{selectedPayment.teamDecisionStatus === "Rejected" ? "Recommend Rejection" : "Recommend Verification"}</p>
                      {selectedPayment.teamDecisionReason && <p className="mt-1 text-xs leading-5 text-blue-700"><span className="font-semibold">Reason:</span> {selectedPayment.teamDecisionReason}</p>}
                      {selectedPayment.teamDecisionRemarks && <p className="mt-1 text-xs leading-5 text-blue-700"><span className="font-semibold">Remarks:</span> {selectedPayment.teamDecisionRemarks}</p>}
                    </div>
                  )}

                  {/* Action Area */}
                  {isFinalVerified ? null : isFinalRejected ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">Awaiting corrected resubmission</p>
                          <p className="mt-1 text-xs leading-5 text-red-700">Agent has been notified. Finance review buttons will become relevant again once updated payment details are submitted.</p>
                        </div>
                      </div>
                    </div>
                  ) : isAwaitingManager ? (
                    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-700">Awaiting finance manager approval</p>
                          <p className="mt-1 text-xs leading-5 text-blue-700">Your review has been submitted. Final verification or return-to-agent action will be completed by the finance manager.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6">
                      {canCurrentUserReview && !canVerifySelectedPayment && (
                        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-xs leading-5 text-amber-800">Verification unlocks when the payment behalf detail is available and the submitted amount is either partial or exactly matched. Excess payment must be corrected first.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <button
                          onClick={() => setOpenVerifyModal(true)}
                          disabled={submittingAction || !canVerifySelectedPayment}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl py-2 text-[12px] font-medium text-white transition-colors ${(submittingAction || !canVerifySelectedPayment) ? "cursor-not-allowed bg-green-300" : "bg-green-500 hover:bg-green-600"}`}
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                          </span>
                          {submittingAction ? "Sending..." : "Verify and Send"}
                        </button>
                        <button
                          onClick={() => setOpenRejectModal(true)}
                          disabled={submittingAction || !canCurrentUserReview}
                          className={`inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-3 text-[12px] font-medium text-white transition-colors ${(submittingAction || !canCurrentUserReview) ? "cursor-not-allowed bg-red-300" : "bg-red-500 hover:bg-red-600"}`}
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                          </span>
                          {submittingAction ? "Sending..." : "Reject and Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Receipt + Audit Trail */}
                <div className="flex flex-col gap-5">
                  {/* Receipt */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-slate-600" />
                      <h3 className="text-sm font-bold text-slate-800">Payment Receipt</h3>
                    </div>
                    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white p-2">
                      {selectedPayment.receiptUrl ? (
                        isImageReceipt(selectedPayment) ? (
                          <div className="relative overflow-hidden rounded-lg">
                            <img src={selectedPayment.receiptUrl} alt="Payment Receipt" className="h-72 w-full rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={handlePreviewReceipt}
                              className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white opacity-100 shadow-lg transition hover:bg-slate-800 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Preview
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                            <FileText className="mb-3 h-10 w-10 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-700">{selectedPayment.receiptName || "Payment receipt available"}</p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">Preview is not available for this file type. Finance can still download and verify the receipt.</p>
                          </div>
                        )
                      ) : (
                        <div className="flex h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                          <AlertCircle className="mb-3 h-10 w-10 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-500">No receipt uploaded</p>
                          <p className="mt-1 text-xs text-slate-400">Agent payment proof is not available yet.</p>
                        </div>
                      )}
                      <div className="mt-5 flex">
                        <button onClick={handleDownloadReceipt} className="flex h-11 w-full items-center justify-center gap-2 rounded-3xl cursor-pointer bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-900">
                          <Download className="h-4 w-4" />
                          Download Receipt
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail â€” fixed height, internal scroll only */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <h3 className="text-sm font-bold text-slate-800">Audit Trail</h3>
                    </div>
                    <div className="custom-scroll h-[400px] space-y-3 overflow-y-auto pr-1">
                      {(selectedPayment.auditTrail || []).length > 0 ? (
                        selectedPayment.auditTrail.slice().reverse().map((entry, index) => (
                          <div key={`${entry.action}-${entry.performedAtValue || index}`} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{entry.action} by {entry.performedByName || "System"}</p>
                                <p className="mt-1 text-xs text-slate-400">{formatDateLabel(entry.performedAtValue)} | {getTimeAgo(entry.performedAtValue)}</p>
                              </div>
                              <StatusBadge status={entry.status} />
                            </div>
                            {(entry.reason || entry.remarks) && (
                              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                {entry.reason && <p><span className="font-semibold">Reason:</span> {formatAuditText(entry.reason)}</p>}
                                {entry.remarks && <p className="mt-1"><span className="font-semibold">Remarks:</span> {formatAuditText(entry.remarks)}</p>}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
                          Audit trail will appear here after payment submission or finance review.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width Final Invoice Dispatch â€” only when Verified */}
              {isFinalVerified && !isPaymentFullyPaid && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Partial payment verified</p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Voucher generation is available for service confirmations. Final invoice dispatch and final voucher send will unlock after the remaining payment is verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isFinalVerified && isPaymentFullyPaid && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/60">
                  {/* Top status strip */}
                  <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/80 px-6 py-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700">Invoice workflow unlocked</p>
                    <span className="ml-auto inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                      Verified
                    </span>
                  </div>

                  {/* Main body â€” full width, info left + button right */}
                  <div className="flex items-center gap-6 px-6 py-5">
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Send className="h-5 w-5" />
                    </div>

                    {/* Info â€” takes all remaining space */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Final Invoice Dispatch</p>
                      <p className="mt-0.5 text-sm font-semibold leading-5 text-slate-900">
                        {selectedPayment.finalInvoiceStatus === "Sent"
                          ? "Final invoice already shared with the agent"
                          : "Finance can now send the final invoice to the agent"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                        <p className="text-xs text-slate-500">
                          To: <span className="font-medium text-slate-700">{selectedPayment.finalInvoiceRecipientEmail || selectedPayment.agentEmail || "No email available"}</span>
                        </p>
                        {selectedPayment.finalInvoiceSentAt && (
                          <p className="text-xs text-slate-400">
                            Sent {selectedPayment.finalInvoiceSentAt} • {selectedPayment.finalInvoiceSentByName || "Finance Team"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Button â€” right edge */}
                    <button
                      type="button"
                      onClick={handleSendFinalInvoice}
                      disabled={sendingFinalInvoice || !canSendFinalInvoice}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm cursor-pointer transition-all ${
                        sendingFinalInvoice || !canSendFinalInvoice
                          ? "cursor-not-allowed bg-slate-300"
                          : selectedPayment.finalInvoiceStatus === "Sent"
                            ? "bg-blue-500 hover:bg-blue-600 hover:shadow-md"
                            : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md"
                      }`}
                    >
                      <Send className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">
                        {sendingFinalInvoice
                          ? "Sending..."
                          : selectedPayment.finalInvoiceStatus === "Sent"
                            ? "Resend Invoice"
                            : "Send Final Invoice"}
                      </span>
                    </button>
                  </div>

                  {/* Bottom note */}
                  <div className="border-t border-emerald-100 bg-white/60 px-6 py-2.5">
                    <p className="text-[11px] leading-4 text-slate-400">
                      This payment has been verified by finance. Downstream invoice workflow can continue from here.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openPaymentTrackerModal && selectedPayment && (
          <PaymentTrackerModal
            payment={selectedPayment}
            onClose={() => setOpenPaymentTrackerModal(false)}
            onSendAgentReceipt={handleOpenAgentReceiptModal}
            onVerifyInstallment={(index) => setInstallmentToVerifyConfirmIndex(index)}
            sendingAgentReceipt={sendingAgentReceipt}
            verifyingInstallmentIndex={verifyingInstallmentIndex}
            canSendAgentReceipt={canSendPaymentReceipt}
            canVerifyInstallments={canVerifyInstallments}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {installmentToVerifyConfirmIndex !== null && selectedPayment && (
          <VerifyInstallmentConfirmationModal
            installmentIndex={installmentToVerifyConfirmIndex}
            payment={selectedPayment}
            submitting={verifyingInstallmentIndex !== null}
            onClose={() => setInstallmentToVerifyConfirmIndex(null)}
            onConfirm={async () => {
              await handleVerifyInstallment(installmentToVerifyConfirmIndex);
              setInstallmentToVerifyConfirmIndex(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openSendAgentReceiptModal && selectedPayment && (
          <SendAgentReceiptModal
            payment={selectedPayment}
            trackerEntry={selectedReceiptTrackerEntry}
            installmentIndex={selectedReceiptInstallmentIndex}
            recipientEmail={agentReceiptEmail}
            recipientPhone={agentReceiptPhone}
            dispatchChannel={agentReceiptChannel}
            onRecipientEmailChange={setAgentReceiptEmail}
            onRecipientPhoneChange={setAgentReceiptPhone}
            onDispatchChannelChange={setAgentReceiptChannel}
            sending={sendingAgentReceipt}
            onClose={() => {
              setOpenSendAgentReceiptModal(false);
              setSelectedReceiptInstallmentIndex(null);
            }}
            onSend={handleSendAgentReceipt}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openVerifyModal && selectedPayment && (
          <ReviewActionModal mode="verify" payment={selectedPayment} submitting={submittingAction} userRole={user?.role} onClose={() => setOpenVerifyModal(false)} onConfirm={handleVerify} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openRejectModal && selectedPayment && (
          <ReviewActionModal mode="reject" payment={selectedPayment} submitting={submittingAction} userRole={user?.role} onClose={() => setOpenRejectModal(false)} onConfirm={handleReject} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openReceiptPreview && selectedPayment?.receiptUrl && isImageReceipt(selectedPayment) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setOpenReceiptPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpenReceiptPreview(false)}
                className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={selectedPayment.receiptUrl}
                alt={selectedPayment.receiptName || "Payment Receipt"}
                className="max-h-[86vh] w-auto max-w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PaymentVerification;
