import React from "react";
import API from "../../../../utils/Api";

export const BANK_LOGOS = {
  "HDFC Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-blue-900/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect width="24" height="24" fill="#004C8F" />
      <rect x="3" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="3" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
    </svg>
  ),
  "ICICI Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-orange-500/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#F58220" />
      <path
        d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM10.5 7H13.5V9H10.5V7ZM10.5 10.5H13.5V17H10.5V10.5Z"
        fill="#7A1C1C"
      />
    </svg>
  ),
  "State Bank of India": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-sky-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#00B3E3" />
      <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      <rect x="11" y="12" width="2" height="9" fill="#FFFFFF" />
    </svg>
  ),
  "Axis Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-red-950/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect width="24" height="24" fill="#841A41" />
      <path d="M12 4L4 18H8.5L12 11L15.5L18 18H22.5L12 4Z" fill="#FFFFFF" />
      <path d="M12 14.5L10 18H14L12 14.5Z" fill="#841A41" />
    </svg>
  ),
  "Kotak Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-red-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#EE1C25" />
      <path
        d="M8 7H10V11L14 7H16.5L12.5 11.5L17 17H14.5L11 12.8V17H8V7Z"
        fill="#FFFFFF"
      />
    </svg>
  ),
};

export const rejectionReasons = [
  "Incorrect UTR Number",
  "Short Payment",
  "Amount Mismatch",
  "Incorrect Bank Name",
  "Receipt Missing or Invalid",
  "UTR Not Found in Bank Statement",
  "Duplicate Payment Entry",
  "Other",
];

export const createEmptyData = () => ({
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

export const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const getApiOrigin = () => {
  const baseUrl = API?.defaults?.baseURL || "";
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "";
  }
};

export const triggerFileDownload = async (url, fileName = "Payment_Receipt.pdf") => {
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

export const getPaymentComparisonMeta = (payment = {}) => {
  const expectedAmount = Math.round(
    Number(payment?.expectedAmount ?? payment?.amount ?? 0),
  );
  const opsInvoiceAmount = Math.round(
    Number(payment?.opsInvoiceAmount ?? expectedAmount ?? 0),
  );
  const receivedAmount = Math.round(Number(payment?.receivedAmount || 0));
  const hasReceivedAmount = receivedAmount > 0;
  const couponApplied = Boolean(payment?.couponApplied);
  const verificationVariance = hasReceivedAmount
    ? receivedAmount - expectedAmount
    : 0;
  const displayVariance = hasReceivedAmount
    ? couponApplied
      ? receivedAmount - opsInvoiceAmount
      : verificationVariance
    : 0;
  const isMatched = hasReceivedAmount && verificationVariance === 0;
  const expectedAmountLabel = couponApplied
    ? "Payable after coupon"
    : "Expected invoice amount";

  if (!hasReceivedAmount) {
    return {
      expectedAmount,
      opsInvoiceAmount,
      receivedAmount,
      variance: displayVariance,
      verificationVariance,
      hasReceivedAmount,
      isMatched,
      couponApplied,
      expectedAmountLabel,
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
      expectedAmount,
      opsInvoiceAmount,
      receivedAmount,
      variance: displayVariance,
      verificationVariance,
      hasReceivedAmount,
      isMatched,
      couponApplied,
      expectedAmountLabel,
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
      expectedAmount,
      opsInvoiceAmount,
      receivedAmount,
      variance: displayVariance,
      verificationVariance,
      hasReceivedAmount,
      isMatched,
      couponApplied,
      expectedAmountLabel,
      label: "Partially Paid",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      varianceClass: "text-rose-700",
      note: couponApplied
        ? "Declared amount is lower than the coupon-adjusted payable amount."
        : "Declared amount is lower than the expected invoice total.",
    };
  }

  return {
    expectedAmount,
    opsInvoiceAmount,
    receivedAmount,
    variance: displayVariance,
    verificationVariance,
    hasReceivedAmount,
    isMatched,
    couponApplied,
    expectedAmountLabel,
    label: "Excess Amount",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    varianceClass: "text-orange-700",
    note: couponApplied
      ? "Declared amount is higher than the coupon-adjusted payable amount."
      : "Declared amount is higher than the expected invoice total.",
  };
};

export const getTimeAgo = (value) => {
  if (!value) return "Just now";
  const now = new Date();
  const date = new Date(value);
  const diffInMinutes = Math.floor((now - date) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

export const withinDateFilter = (value, dateFilter) => {
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

export const isImageReceipt = (payment) => {
  const mimeType = String(payment?.receiptMimeType || "").toLowerCase();
  const receiptUrl = String(payment?.receiptUrl || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) => receiptUrl.endsWith(ext))
  );
};

export const AUDIT_AMOUNT_LABEL_PATTERN =
  /(amount|invoice total|difference|variance|discount|payable)/i;

export const formatAuditAmountToken = (rawValue = "") => {
  const normalized = String(rawValue || "")
    .replace(/INR|₹/gi, "")
    .replace(/\s+/g, "")
    .trim();
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

export const formatAuditValue = (label = "", value = "") => {
  const normalizedLabel = String(label || "").trim();
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) return "";

  if (AUDIT_AMOUNT_LABEL_PATTERN.test(normalizedLabel)) {
    return formatAuditAmountToken(trimmedValue);
  }

  return trimmedValue.replace(/INR\s*([+-]?\s*[\d,]+)/gi, (_, amount) =>
    formatAuditAmountToken(amount),
  );
};

export const parseAuditDetailItems = (value = "") =>
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
