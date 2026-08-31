import React from "react";
import {
  Building2,
  CarFront,
  Sparkles,
  Camera,
  Plane,
  Layers3,
  CheckCircle,
  FileText,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";

export const createEmptyService = () => ({
  referenceServiceKey: "",
  type: "Hotel",
  serviceName: "",
  serviceDate: "",
  status: "Confirmed",
  confirmationNumber: "",
  voucherNumber: "",
  emergency: "",
});

export const serviceTypeLabel = (type) => {
  const normalized = (type || "").toLowerCase();
  if (normalized === "hotel") return "Hotel";
  if (
    normalized === "transfer" ||
    normalized === "transport" ||
    normalized === "car"
  )
    return "Transport";
  if (normalized === "activity") return "Activity";
  if (normalized === "sightseeing") return "Sightseeing";
  if (normalized === "flight") return "Flight";
  return type || "Service";
};

export const getReferenceServiceName = (service = {}, index = 0) => {
  const candidates = [
    service.serviceName,
    service.title,
    service.name,
    service.hotelName,
    service.activityName,
    service.sightseeingName,
    service.transferName,
    service.description,
  ];
  const resolvedName = candidates
    .map((item) => String(item || "").trim())
    .find(Boolean);
  return (
    resolvedName || `${serviceTypeLabel(service.type)} Service ${index + 1}`
  );
};

export const getServiceTypeSortRank = (type) => {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "hotel") return 0;
  if (
    normalized === "transfer" ||
    normalized === "transport" ||
    normalized === "car"
  )
    return 1;
  if (normalized === "activity") return 2;
  if (normalized === "sightseeing") return 3;
  return 4;
};

export const getServiceTypeIcon = (type, className = "h-4 w-4") => {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "hotel") return <Building2 className={className} />;
  if (
    normalized === "transfer" ||
    normalized === "transport" ||
    normalized === "car"
  ) {
    return <CarFront className={className} />;
  }
  if (normalized === "activity") return <Sparkles className={className} />;
  if (normalized === "sightseeing") return <Camera className={className} />;
  if (normalized === "flight") return <Plane className={className} />;
  return <Layers3 className={className} />;
};

export const getServiceTypeGradient = (type) => {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "hotel") {
    return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_2px_8px_-3px_rgba(59,130,246,0.5)] font-semibold";
  }
  if (
    normalized === "transfer" ||
    normalized === "transport" ||
    normalized === "car"
  ) {
    return "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-[0_2px_8px_-3px_rgba(139,92,246,0.5)] font-semibold";
  }
  if (normalized === "activity") {
    return "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_2px_8px_-3px_rgba(236,72,153,0.5)] font-semibold";
  }
  if (normalized === "sightseeing") {
    return "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_2px_8px_-3px_rgba(245,158,11,0.5)] font-semibold";
  }
  if (normalized === "flight") {
    return "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_2px_8px_-3px_rgba(14,165,233,0.5)] font-semibold";
  }
  return "bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-sm font-semibold";
};

export const formatServiceMoney = (currency, amount) => {
  const value = Number(amount || 0);
  const normalizedCurrency = String(currency || "INR")
    .trim()
    .toUpperCase();
  const currencyLabel = normalizedCurrency === "INR" ? "₹" : normalizedCurrency;
  return `${currencyLabel} ${value.toLocaleString("en-IN")}`;
};

export const getResolvedServiceDisplayTotal = (service = {}) => {
  const normalizedType = String(service?.type || "")
    .trim()
    .toLowerCase();
  const rawTotal = Number(service?.total || 0);
  if (normalizedType !== "hotel") {
    return rawTotal;
  }
  return rawTotal;
};

export const replaceInrWithRupee = (value = "") =>
  String(value || "").replace(/\bINR\b\s*/gi, "₹ ");

export const formatServiceDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "Recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays <= 0) return "Today";
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
};

export const getStarRatingDisplay = (service, selectedQuery) => {
  const raw =
    service?.starRating ||
    service?.stars ||
    service?.rating ||
    service?.hotelCategory ||
    service?.category ||
    selectedQuery?.hotelCategory ||
    "";
  if (!raw) return null;
  const str = String(raw).trim();
  const match = str.match(/(\d+)/);
  const numStars = match ? parseInt(match[1], 10) : 0;
  if (numStars > 0 && numStars <= 5) {
    return "★".repeat(numStars);
  }
  if (str.toLowerCase().includes("luxury")) {
    return "★★★★★";
  }
  if (str) {
    return str;
  }
  return null;
};

export const DEFAULT_HOTEL_CHECK_IN_TIME = "14:00";
export const DEFAULT_HOTEL_CHECK_OUT_TIME = "11:00";

export const travelerDocumentOptions = [
  {
    key: "passport",
    label: "Passport",
  },
  {
    key: "governmentId",
    label: "PAN Card",
  },
];

export const formatServiceTime = (value) => {
  if (!value) return "";
  const trimmedValue = String(value).trim();
  const normalizedValue = trimmedValue.toUpperCase();
  if (/[AP]M$/.test(normalizedValue)) {
    return normalizedValue.replace(/\s+/g, " ");
  }
  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmedValue;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours) || hours > 23) return trimmedValue;
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;
  return `${twelveHour}:${minutes} ${period}`;
};

export const formatServiceDateTime = (
  dateValue,
  timeValue,
  fallbackTimeValue = "",
) => {
  if (!dateValue) return "-";
  const dateLabel = formatServiceDate(dateValue);
  const timeLabel = formatServiceTime(timeValue || fallbackTimeValue);
  return timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
};

export const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt || null,
});

export const getTravelerDocumentKey = (documentType = "Passport") => {
  const normalizedType = String(documentType || "")
    .trim()
    .toLowerCase();
  return normalizedType.includes("gov") ||
    normalizedType.includes("id") ||
    normalizedType.includes("aad") ||
    normalizedType.includes("pan")
    ? "governmentId"
    : "passport";
};

export const resolveTravelerDocuments = (traveler = {}) => {
  const documents = {
    passport: normalizeTravelerDocument(traveler?.documents?.passport),
    governmentId: normalizeTravelerDocument(
      traveler?.documents?.governmentId || traveler?.documents?.govtId,
    ),
  };
  const legacyDocument = normalizeTravelerDocument(traveler?.document);
  if (
    legacyDocument.url &&
    !documents.passport.url &&
    !documents.governmentId.url
  ) {
    documents[getTravelerDocumentKey(traveler?.documentType)] = legacyDocument;
  }
  return documents;
};

export const buildCloudinaryPdfPreviewUrl = (url) => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl || !normalizedUrl.includes("/res.cloudinary.com/"))
    return normalizedUrl;
  if (!normalizedUrl.includes("/image/upload/")) return normalizedUrl;
  return normalizedUrl.replace("/image/upload/", "/image/upload/pg_1,f_jpg/");
};

export const buildCloudinaryAttachmentUrl = (url, fileName = "document") => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl || !normalizedUrl.includes("/res.cloudinary.com/"))
    return normalizedUrl;
  if (!normalizedUrl.includes("/upload/")) return normalizedUrl;
  const encodedFileName = encodeURIComponent(String(fileName || "document"));
  return normalizedUrl.replace(
    "/upload/",
    `/upload/fl_attachment:${encodedFileName}/`,
  );
};

export const getDocumentOpenTarget = (document = {}) => {
  const normalizedUrl = String(document?.url || "").trim();
  const normalizedMimeType = String(document?.mimeType || "").toLowerCase();
  const normalizedFileName = String(document?.fileName || "").toLowerCase();
  const isPdf =
    normalizedMimeType.includes("pdf") ||
    normalizedFileName.endsWith(".pdf") ||
    normalizedUrl.toLowerCase().includes(".pdf");
  return {
    url: isPdf ? buildCloudinaryPdfPreviewUrl(normalizedUrl) : normalizedUrl,
    isPdf,
  };
};

export const formatDocumentDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDocumentSize = (value) => {
  const size = Number(value || 0);
  if (!size) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const ServiceFieldLabel = ({
  icon,
  label,
  iconClassName = "text-slate-400",
}) => (
  <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-slate-500">
    <span className={iconClassName}>{icon}</span> <span>{label}</span>
  </span>
);

export const STATUS_TABS = [
  {
    key: "Confirmed",
    label: "New Booking",
    icon: CheckCircle,
  },
  {
    key: "Invoice_Requested",
    label: "Invoice Sent",
    icon: FileText,
  },
  {
    key: "Payment_Completed",
    label: "Payment Booking",
    icon: IndianRupee,
  },
  {
    key: "Vouchered",
    label: "Voucher Sent",
    icon: ShieldCheck,
  },
  {
    key: "ALL",
    label: "All Bookings",
    icon: Layers3,
  },
];

export const getQueryCalculatedTotal = (query) => {
  const visibleServicesTotal = (query?.services || []).reduce((sum, s) => {
    return (
      sum +
      Number(
        s.total || s.cost || s.price || getResolvedServiceDisplayTotal(s) || 0,
      )
    );
  }, 0);
  if (visibleServicesTotal > 0) return visibleServicesTotal;
  return Number(
    query?.packagePrice ||
      query?.quotationTaxableAmount ||
      query?.clientTotalAmount ||
      query?.totalAmount ||
      0,
  );
};

export const getQueryCalculatedPaid = (query) => {
  const visibleServicesPaid = (query?.services || []).reduce((sum, s) => {
    const total = Number(
      s.total || s.cost || s.price || getResolvedServiceDisplayTotal(s) || 0,
    );
    const paid = Number(
      s?.amountPaid ??
        s?.paidAmount ??
        s?.payoutAmount ??
        (query?.opsStatus === "Payment_Completed"
          ? (query?.paidAmount ?? total)
          : 0),
    );
    return sum + Math.min(paid, total > 0 ? total : paid);
  }, 0);
  const directPaid = Number(
    query?.paidAmount ?? query?.amountPaid ?? query?.payoutAmount ?? 0,
  );
  return Math.max(directPaid, visibleServicesPaid);
};

export const getOpsStatusBadge = (status, query = null) => {
  const norm = String(status || "").trim();
  if (norm === "Confirmed") {
    return {
      label: "New Booking",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold",
      icon: "✓ New Booking",
    };
  }
  if (norm === "Vouchered") {
    return {
      label: "Voucher Sent",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold",
      icon: "✓ Voucher Sent",
    };
  }
  if (norm === "Payment_Completed") {
    const total = getQueryCalculatedTotal(query);
    const paid = getQueryCalculatedPaid(query);
    if (paid > 0 && total > 0 && paid < total && total - paid > 10) {
      const percentage = Math.min(99, Math.round((paid / total) * 100));
      return {
        label: "Partial Paid",
        bgClass:
          "bg-amber-100 text-amber-900 border-amber-400 font-extrabold shadow-2xs",
        icon: `⏳ Partial Paid (${percentage}%)`,
      };
    }
    return {
      label: "Full Paid",
      bgClass:
        "bg-emerald-100 text-emerald-800 border-emerald-400 font-extrabold shadow-2xs",
      icon: "✓ Full Paid",
    };
  }
  if (norm === "Invoice_Requested") {
    return {
      label: "Invoice Sent",
      bgClass: "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold",
      icon: "✓ Invoice Sent",
    };
  }
  return {
    label: norm || "New Booking",
    bgClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "• " + (norm || "New Booking"),
  };
};

export const getServicePaymentStatusDisplay = (service, selectedQuery) => {
  const total = Number(getResolvedServiceDisplayTotal(service) || 0);
  const paid = Number(
    service?.amountPaid ??
      service?.paidAmount ??
      service?.payoutAmount ??
      (selectedQuery?.opsStatus === "Payment_Completed"
        ? (selectedQuery?.paidAmount ?? total)
        : 0),
  );
  if (paid > 0 && total > 0 && paid < total) {
    return {
      paidText: formatServiceMoney("INR", paid).replace(/[^0-9,.]/g, ""),
      statusBadge: "Partial Paid",
      colorClass: "text-amber-600 font-bold",
    };
  }
  if (paid >= total && total > 0) {
    return {
      paidText: formatServiceMoney("INR", total).replace(/[^0-9,.]/g, ""),
      statusBadge: "Full Paid",
      colorClass: "text-emerald-600 font-bold",
    };
  }
  return {
    paidText: "0",
    statusBadge: "Pending",
    colorClass: "text-slate-500 font-medium",
  };
};

export const getServiceVoucherStatusInfo = (service, selectedQuery) => {
  const hasServiceVoucher = Boolean(
    service?.voucherNumber || service?.isVoucherGenerated,
  );
  if (hasServiceVoucher) {
    return {
      isVouchered: true,
      label: service?.voucherNumber
        ? `Vouchered (${service.voucherNumber})`
        : "Voucher Generated",
      bgClass:
        "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100",
      iconClass: "text-emerald-600",
      textClass: "text-emerald-800",
    };
  }
  return {
    isVouchered: false,
    label: "Voucher Pending",
    bgClass:
      "bg-[#fffbeb] text-amber-900 border-amber-200/80 hover:bg-amber-100/80",
    iconClass: "text-amber-600",
    textClass: "text-amber-800",
  };
};
