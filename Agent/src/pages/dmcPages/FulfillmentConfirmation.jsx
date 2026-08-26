import {
  FileText,
  Upload,
  Plus,
  Package,
  CheckCircle,
  AlertCircle,
  Phone,
  Camera,
  CarFront,
  Car,
  Clock3,
  Building2,
  BedDouble,
  Trash2,
  Layers3,
  CalendarDays,
  MapPin,
  Users,
  Briefcase,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Download,
  Eye,
  EyeOff,
  IndianRupee,
  LogIn,
  LogOut,
  Plane,
  X,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Share2,
  RefreshCw,
  Copy,
  FileSpreadsheet,
  MessageSquare,
  Maximize2,
  User,
  Mail,
  MoreVertical,
  Star,
  Compass,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RotatingLines } from "react-loader-spinner";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import InternalInvoice from "./InternalInvoice";
import CreateProformaInvoice from "../../components/accounting/CreateProformaInvoice";
import ProformaInvoiceView from "../../components/accounting/ProformaInvoiceView";
import ExcelJS from "exceljs";
import API from "../../utils/Api";
const createEmptyService = () => ({
  referenceServiceKey: "",
  type: "Hotel",
  serviceName: "",
  serviceDate: "",
  status: "Confirmed",
  confirmationNumber: "",
  voucherNumber: "",
  emergency: "",
});
const serviceTypeLabel = (type) => {
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
const getReferenceServiceName = (service = {}, index = 0) => {
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
const getServiceTypeSortRank = (type) => {
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
const getServiceTypeIcon = (type, className = "h-4 w-4") => {
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
const getServiceTypeGradient = (type) => {
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
const formatServiceMoney = (currency, amount) => {
  const value = Number(amount || 0);
  const normalizedCurrency = String(currency || "INR")
    .trim()
    .toUpperCase();
  const currencyLabel = normalizedCurrency === "INR" ? "₹" : normalizedCurrency;
  return `${currencyLabel} ${value.toLocaleString("en-IN")}`;
};
const getResolvedServiceDisplayTotal = (service = {}) => {
  const normalizedType = String(service?.type || "")
    .trim()
    .toLowerCase();
  const rawTotal = Number(service?.total || 0);
  if (normalizedType !== "hotel") {
    return rawTotal;
  }
  return rawTotal;
};
const replaceInrWithRupee = (value = "") =>
  String(value || "").replace(/\bINR\b\s*/gi, "₹ ");
const formatServiceDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const formatTimeAgo = (dateValue) => {
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
const getStarRatingDisplay = (service, selectedQuery) => {
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
const DEFAULT_HOTEL_CHECK_IN_TIME = "14:00";
const DEFAULT_HOTEL_CHECK_OUT_TIME = "11:00";
const travelerDocumentOptions = [
  {
    key: "passport",
    label: "Passport",
  },
  {
    key: "governmentId",
    label: "PAN Card",
  },
];
const formatServiceTime = (value) => {
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
const formatServiceDateTime = (
  dateValue,
  timeValue,
  fallbackTimeValue = "",
) => {
  if (!dateValue) return "-";
  const dateLabel = formatServiceDate(dateValue);
  const timeLabel = formatServiceTime(timeValue || fallbackTimeValue);
  return timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
};
const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt || null,
});
const getTravelerDocumentKey = (documentType = "Passport") => {
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
const resolveTravelerDocuments = (traveler = {}) => {
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
const buildCloudinaryPdfPreviewUrl = (url) => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl || !normalizedUrl.includes("/res.cloudinary.com/"))
    return normalizedUrl;
  if (!normalizedUrl.includes("/image/upload/")) return normalizedUrl;
  return normalizedUrl.replace("/image/upload/", "/image/upload/pg_1,f_jpg/");
};
const buildCloudinaryAttachmentUrl = (url, fileName = "document") => {
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
const getDocumentOpenTarget = (document = {}) => {
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
const formatDocumentDateTime = (value) => {
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
const formatDocumentSize = (value) => {
  const size = Number(value || 0);
  if (!size) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
const ServiceFieldLabel = ({
  icon,
  label,
  iconClassName = "text-slate-400",
}) => (
  <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-slate-500">
    {" "}
    <span className={iconClassName}>{icon}</span> <span>{label}</span>{" "}
  </span>
);
const STATUS_TABS = [
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
const getQueryCalculatedTotal = (query) => {
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
const getQueryCalculatedPaid = (query) => {
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
const getOpsStatusBadge = (status, query = null) => {
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
const getServicePaymentStatusDisplay = (service, selectedQuery) => {
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
const getServiceVoucherStatusInfo = (service, selectedQuery) => {
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
export default function FulfillmentConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmedQueries, setConfirmedQueries] = useState([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState("Confirmed");
  const [viewMode, setViewMode] = useState("list"); // "list" | "detail"
  const [detailTab, setDetailTab] = useState("basic"); // "basic" | "services" | "accounting" | "internal_invoice" | "docs"
  const [accountingSubTab, setAccountingSubTab] = useState("payments"); // "payments" | "proforma" | "profit"
  const [isCreatingProforma, setIsCreatingProforma] = useState(false);
  const [proformaInvoiceData, setProformaInvoiceData] = useState(null);
  const [serviceCategoryTab, setServiceCategoryTab] = useState("all");
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [profitRefreshing, setProfitRefreshing] = useState(false);
  const handleOpenQueryDetail = (query) => {
    hydrateSelectedQuery(query);
    setViewMode("detail");
    setDetailTab("basic");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleBackToList = () => {
    setViewMode("list");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleProfitRefresh = async () => {
    if (!selectedQuery?._id && !selectedQuery?.queryId) return;
    setProfitRefreshing(true);
    try {
      const res = await API.get("/dmc/confirmation/queries");
      const queries = res.data?.data || [];
      setConfirmedQueries(queries);
      const refreshed = queries.find(
        (q) =>
          q._id === selectedQuery._id || q.queryId === selectedQuery.queryId,
      );
      if (refreshed) {
        setSelectedQuery(refreshed);
        toast.success("Profit report refreshed successfully");
      } else {
        toast.error("Could not find the current query in refreshed data");
      }
    } catch (error) {
      console.error("Profit refresh error:", error);
      toast.error("Failed to refresh profit report data");
    } finally {
      setProfitRefreshing(false);
    }
  };
  const handleProfitCopyToClipboard = async () => {
    if (!selectedQuery) return toast.error("No query selected");
    try {
      const prPricing = selectedQuery?.quotationPricing || {};
      const prMarkup = prPricing.opsMarkup || {};
      const prTax = prPricing.tax || {};
      const prGst = prTax.gst || {};
      const prCharges = prPricing.opsCharges || {};
      const costBase = Number(prPricing.baseAmount || prPricing.subTotal || 0);
      const markupAmount = Number(prMarkup.amount || 0);
      const gstAmount = Number(prGst.amount || 0);
      const tcsAmount = Number(prTax.tcs?.amount || 0);
      const tourismFee = Number(prTax.tourismFee?.amount || 0);
      const totalTax = gstAmount + tcsAmount + tourismFee;
      const pkgAmount = Number(
        selectedQuery?.packagePrice || prPricing.totalAmount || 0,
      );
      const dmcCost = Number(selectedQuery?.dmcCostTotal || 0);
      const agentRevenue = Number(
        selectedQuery?.agentRevenueTotal || pkgAmount || 0,
      );
      const netProfit = agentRevenue > 0 ? agentRevenue - dmcCost : 0;
      const profitPercent =
        agentRevenue > 0
          ? Math.round((netProfit / agentRevenue) * 10000) / 100
          : 0;
      const services = selectedQuery?.services || [];
      const hotelServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "hotel",
      );
      const transportServices = services.filter((s) =>
        ["transfer", "transport", "car"].includes(
          String(s.type || "").toLowerCase(),
        ),
      );
      const activityServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "activity",
      );
      const sightseeingServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "sightseeing",
      );
      const flightServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "flight",
      );
      const hotelTotal = hotelServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const transportTotal = transportServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const activityTotal = activityServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const sightseeingTotal = sightseeingServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const flightTotal = flightServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const allBookingsTotal =
        hotelTotal +
        transportTotal +
        activityTotal +
        sightseeingTotal +
        flightTotal;
      const agentTrackerPayments =
        selectedQuery?.agentInvoice?.trackerPayments || [];
      const agentReceived = agentTrackerPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );
      const agentDue = pkgAmount - agentReceived;
      const fmt = (v) => Number(v || 0).toLocaleString("en-IN");
      const fmtDate = (d) => {
        if (!d) return "-";
        const dt = new Date(d);
        return Number.isNaN(dt.getTime())
          ? "-"
          : dt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
      };
      let text = "";
      text += "========================================\n";
      text += "         PROFIT REPORT\n";
      text += "========================================\n\n";
      text += `Package Amount: INR ${fmt(pkgAmount)}\n`;
      text += `Bookings: INR ${fmt(allBookingsTotal)}\n`;
      if (hotelTotal > 0) text += `  Hotels: INR ${fmt(hotelTotal)}\n`;
      if (transportTotal > 0)
        text += `  Transport: INR ${fmt(transportTotal)}\n`;
      if (activityTotal > 0)
        text += `  Activities: INR ${fmt(activityTotal)}\n`;
      if (sightseeingTotal > 0)
        text += `  Sightseeing: INR ${fmt(sightseeingTotal)}\n`;
      if (flightTotal > 0) text += `  Flights: INR ${fmt(flightTotal)}\n`;
      text += `Estm. Tax (inc.): INR ${fmt(totalTax)}\n`;
      text += `Estm. Profit: INR ${fmt(netProfit)}\n`;
      text += `Estm. Profit %: ${profitPercent.toFixed(2)}%\n`;
      text += "\n----------------------------------------\n";
      text += "TRIP DETAILS\n";
      text += "----------------------------------------\n";
      text += `Trip ID: ${selectedQuery?.queryId || "-"}\n`;
      text += `Destination: ${selectedQuery?.destination || "-"}\n`;
      text += `Start Date: ${fmtDate(selectedQuery?.startDate)}\n`;
      text += `End Date: ${fmtDate(selectedQuery?.endDate)}\n`;
      text += `Duration: ${selectedQuery?.duration || "-"}\n`;
      text += `Adults: ${selectedQuery?.numberOfAdults || 0}\n`;
      text += `Children: ${selectedQuery?.numberOfChildren || 0}\n`;
      text += "\n----------------------------------------\n";
      text += "SOURCE AND GUEST DETAILS\n";
      text += "----------------------------------------\n";
      text += `Source Name: ${selectedQuery?.agentName || "Direct Query"}\n`;
      text += `Source Contact: ${selectedQuery?.agentInvoice?.invoiceNumber || "-"}\n`;
      text += `Ref ID: ${selectedQuery?.queryId || "-"}\n`;
      text += `Guest Name: ${selectedQuery?.customerName || selectedQuery?.travelerDetails?.[0]?.fullName || "-"}\n`;
      text += `Guest Contact: ${selectedQuery?.clientEmail || selectedQuery?.customerPhone || "-"}\n`;
      text += "\n----------------------------------------\n";
      text += "LATEST QUOTE DETAILS\n";
      text += "----------------------------------------\n";
      text += `Cost (INR): ${fmt(costBase)}\n`;
      text += `Markup: ${fmt(markupAmount)}\n`;
      text += `Taxes (${prGst.percent || 0}% applied): ${fmt(totalTax)}\n`;
      text += `Total (INR): ${fmt(costBase + markupAmount + totalTax)}\n`;
      text += `Final Package Price (INR): ${fmt(pkgAmount)}\n`;
      text += "\n----------------------------------------\n";
      text += "TRIP CONVERSION DETAILS\n";
      text += "----------------------------------------\n";
      text += `Converted On: ${fmtDate(selectedQuery?.quotationCreatedAt || selectedQuery?.createdAt)}\n`;
      text += `Currency: ${prPricing.currency || "INR"}\n`;
      text += `Total: ${fmt(pkgAmount)}\n`;
      text += `Received: ${fmt(agentReceived)}\n`;
      text += `Due: ${fmt(agentDue)}\n`;
      const addServiceSection = (svcs, label) => {
        if (!svcs || svcs.length === 0) return;
        text += "\n----------------------------------------\n";
        text += `${label.toUpperCase()} RESERVATION BOOKINGS\n`;
        text += "----------------------------------------\n";
        svcs.forEach((svc, i) => {
          const svcPaidAmt = Number(
            svc.amountPaid ?? svc.paidAmount ?? svc.payoutAmount ?? 0,
          );
          const svcTotalAmt = Number(svc.total || 0);
          const svcDueAmt = svcTotalAmt - Math.min(svcPaidAmt, svcTotalAmt);
          text += `  [${i + 1}] ${svc.serviceName || svc.title || label}\n`;
          text += `      Check In: ${fmtDate(svc.checkInDate || svc.serviceDate)}\n`;
          text += `      Check Out: ${fmtDate(svc.checkOutDate || svc.serviceEndDate)}\n`;
          text += `      Nights/Days: ${svc.nights || svc.days || "-"}\n`;
          text += `      Supplier: ${svc.supplierName || svc.dmcName || "-"}\n`;
          text += `      Currency: ${svc.currency || "INR"}\n`;
          text += `      Quoted: ${fmt(Number(svc.price || 0))}\n`;
          text += `      Booked: ${fmt(svcTotalAmt)}\n`;
          text += `      Status: ${svc.status || "Confirmed"}\n`;
          text += `      Net Payable: ₹${fmt(svcTotalAmt)}\n`;
          text += `      Net Paid: ₹${fmt(Math.min(svcPaidAmt, svcTotalAmt))}\n`;
          text += `      Net Due: ₹${fmt(svcDueAmt)}\n`;
        });
      };
      addServiceSection(hotelServices, "Hotel");
      addServiceSection(transportServices, "Transport");
      addServiceSection(activityServices, "Activity");
      addServiceSection(sightseeingServices, "Sightseeing");
      addServiceSection(flightServices, "Flight");
      text += "\n----------------------------------------\n";
      text += "COMPONENT BOOKING PRICES\n";
      text += "----------------------------------------\n";
      text += `Hotels: ${hotelTotal > 0 ? `₹${fmt(hotelTotal)}` : "-"}\n`;
      text += `Transports: ${transportTotal > 0 ? `₹${fmt(transportTotal)}` : "-"}\n`;
      text += `Activities: ${activityTotal > 0 ? `₹${fmt(activityTotal)}` : "-"}\n`;
      text += `Sightseeing: ${sightseeingTotal > 0 ? `₹${fmt(sightseeingTotal)}` : "-"}\n`;
      text += `Flights: ${flightTotal > 0 ? `₹${fmt(flightTotal)}` : "-"}\n`;
      text += `Total: ₹${fmt(allBookingsTotal)}\n`;
      text += "\n----------------------------------------\n";
      text += "BREAKUP (IN INR)\n";
      text += "----------------------------------------\n";
      text += `Payable: ${fmt(dmcCost)}\n`;
      text += `Markup: ${fmt(markupAmount)}\n`;
      text += `Tax Applied On: cost + markup\n`;
      text += `Tax %: ${prGst.percent || 0}%\n`;
      text += `Tax Amount: ${fmt(totalTax)}\n`;
      text += `Collectable: ${fmt(pkgAmount)}\n`;
      text += "\n----------------------------------------\n";
      text += "PROFIT AFTER BOOKINGS\n";
      text += "----------------------------------------\n";
      text += `Currency: ${prPricing.currency || "INR"}\n`;
      text += `Net Payable: ${fmt(dmcCost)}\n`;
      text += `Markup: ${fmt(markupAmount)}\n`;
      text += `Tax Applied On: cost + markup\n`;
      text += `Net Tax %: ${totalTax > 0 ? "exc." : "inc."}\n`;
      text += `Net Tax: ${fmt(totalTax)}\n`;
      text += `Net Collectable: ${fmt(pkgAmount)}\n`;
      text += `Net Profit: ${fmt(netProfit)}\n`;
      text += `Net Profit %: ${profitPercent.toFixed(2)}%\n`;
      text += "\n========================================\n";
      text += `Generated on: ${new Date().toLocaleString("en-GB")}\n`;
      text += "========================================\n";
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success("Profit report copied to clipboard");
    } catch (error) {
      console.error("Copy to clipboard error:", error);
      toast.error("Failed to copy report to clipboard");
    }
  };
  const handleProfitExcelExport = async () => {
    if (!selectedQuery) return toast.error("No query selected");
    try {
      const prPricing = selectedQuery?.quotationPricing || {};
      const prMarkup = prPricing.opsMarkup || {};
      const prTax = prPricing.tax || {};
      const prGst = prTax.gst || {};
      const prCharges = prPricing.opsCharges || {};
      const costBase = Number(prPricing.baseAmount || prPricing.subTotal || 0);
      const markupAmount = Number(prMarkup.amount || 0);
      const gstAmount = Number(prGst.amount || 0);
      const tcsAmount = Number(prTax.tcs?.amount || 0);
      const tourismFee = Number(prTax.tourismFee?.amount || 0);
      const totalTax = gstAmount + tcsAmount + tourismFee;
      const pkgAmount = Number(
        selectedQuery?.packagePrice || prPricing.totalAmount || 0,
      );
      const dmcCost = Number(selectedQuery?.dmcCostTotal || 0);
      const agentRevenue = Number(
        selectedQuery?.agentRevenueTotal || pkgAmount || 0,
      );
      const netProfit = agentRevenue > 0 ? agentRevenue - dmcCost : 0;
      const profitPercent =
        agentRevenue > 0
          ? Math.round((netProfit / agentRevenue) * 10000) / 100
          : 0;
      const services = selectedQuery?.services || [];
      const hotelServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "hotel",
      );
      const transportServices = services.filter((s) =>
        ["transfer", "transport", "car"].includes(
          String(s.type || "").toLowerCase(),
        ),
      );
      const activityServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "activity",
      );
      const sightseeingServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "sightseeing",
      );
      const flightServices = services.filter(
        (s) => String(s.type || "").toLowerCase() === "flight",
      );
      const hotelTotal = hotelServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const transportTotal = transportServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const activityTotal = activityServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const sightseeingTotal = sightseeingServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const flightTotal = flightServices.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0,
      );
      const allBookingsTotal =
        hotelTotal +
        transportTotal +
        activityTotal +
        sightseeingTotal +
        flightTotal;
      const agentTrackerPayments =
        selectedQuery?.agentInvoice?.trackerPayments || [];
      const agentReceived = agentTrackerPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );
      const agentDue = pkgAmount - agentReceived;
      const fmtDate = (d) => {
        if (!d) return "-";
        const dt = new Date(d);
        return Number.isNaN(dt.getTime())
          ? "-"
          : dt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
      };
      const INR_FMT = "#,##0";
      const PCT_FMT = "0.00%";
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Holiday Circuit";
      workbook.created = new Date();
      const ws = workbook.addWorksheet("Profit Report", {
        pageSetup: {
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
        },
        properties: {
          defaultRowHeight: 18,
        },
      });
      ws.columns = [
        {
          width: 22,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 20,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
        {
          width: 18,
        },
      ];
      const TITLE_BG = "1E293B";
      const SECTION_BG = "CBD5E1";
      const HEADER_BG = "F1F5F9";
      const CYAN_BG = "22D3EE";
      const LIME_BG = "84CC16";
      const ROSE_BG = "F43F5E";
      const BORDER_COLOR = "B0BEC5";
      const thinSide = {
        style: "thin",
        color: {
          argb: `FF${BORDER_COLOR}`,
        },
      };
      const thinBorderAll = {
        top: thinSide,
        bottom: thinSide,
        left: thinSide,
        right: thinSide,
      };
      const titleFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${TITLE_BG}`,
        },
      };
      const sectionFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${SECTION_BG}`,
        },
      };
      const headerFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${HEADER_BG}`,
        },
      };
      const cyanFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${CYAN_BG}`,
        },
      };
      const limeFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${LIME_BG}`,
        },
      };
      const roseFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: `FF${ROSE_BG}`,
        },
      };
      const centerAlign = {
        horizontal: "center",
        vertical: "middle",
        wrapText: false,
      };
      const leftAlign = {
        horizontal: "left",
        vertical: "middle",
      };
      let rowNum = 1;
      const addSection = (title, headers, dataRows, options = {}) => {
        const colCount = Math.max(
          headers.length,
          ...dataRows.map((r) => r.length),
        );
        const maxCols = Math.max(12, colCount);
        const sectionRow = ws.getRow(rowNum);
        const sectionCell = sectionRow.getCell(1);
        sectionCell.value = title;
        sectionCell.font = {
          bold: true,
          size: 11,
          color: {
            argb: "FF1E293B",
          },
        };
        sectionCell.fill = sectionFill;
        sectionCell.border = thinBorderAll;
        sectionCell.alignment = leftAlign;
        for (let c = 2; c <= maxCols; c++) {
          const cell = sectionRow.getCell(c);
          cell.fill = sectionFill;
          cell.border = thinBorderAll;
        }
        sectionRow.height = 20;
        rowNum++;
        const headerRow = ws.getRow(rowNum);
        headers.forEach((h, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.value = h;
          cell.font = {
            bold: true,
            size: 10,
            color: {
              argb: "FF334155",
            },
          };
          cell.fill = headerFill;
          cell.border = thinBorderAll;
          cell.alignment = centerAlign;
        });
        headerRow.height = 20;
        rowNum++;
        dataRows.forEach((rowVals) => {
          const dataRow = ws.getRow(rowNum);
          rowVals.forEach((val, i) => {
            const cell = dataRow.getCell(i + 1);
            if (
              val &&
              typeof val === "object" &&
              ("numFmt" in val || "_fill" in val || "_font" in val)
            ) {
              cell.value = val.value;
              if (val.numFmt) cell.numFmt = val.numFmt;
              if (val._fill) cell.fill = val._fill;
              if (val._font) cell.font = val._font;
              else
                cell.font = {
                  bold: true,
                  size: 10,
                };
            } else {
              cell.value = val;
              cell.font = {
                size: 10,
              };
            }
            cell.border = thinBorderAll;
            cell.alignment = centerAlign;
          });
          dataRow.height = 18;
          rowNum++;
        });
        rowNum++;
      };
      const addServiceSection = (svcs, label) => {
        if (!svcs || svcs.length === 0) return;
        const isHotel = label === "Hotel";
        const col1 = isHotel ? "Check In" : "Travel Date";
        const col2 = isHotel ? "Check Out" : "End Date";
        const col4 = isHotel ? "Nights" : label === "Flight" ? "Pax" : "Days";
        const headers = [
          col1,
          col2,
          label,
          col4,
          "Supplier",
          "Curr",
          "Quoted",
          "Booked",
          "Status",
          "Net Payable",
          "Net Paid",
          "Net Due",
        ];
        const dataRows = [];
        let svcTotal = 0,
          svcPaid = 0;
        svcs.forEach((svc) => {
          const svcPaidAmt = Number(
            svc.amountPaid ?? svc.paidAmount ?? svc.payoutAmount ?? 0,
          );
          const svcTotalAmt = Number(svc.total || 0);
          const svcDueAmt = svcTotalAmt - Math.min(svcPaidAmt, svcTotalAmt);
          svcTotal += svcTotalAmt;
          svcPaid += Math.min(svcPaidAmt, svcTotalAmt);
          dataRows.push([
            fmtDate(svc.checkInDate || svc.serviceDate),
            fmtDate(svc.checkOutDate || svc.serviceEndDate),
            svc.serviceName || svc.title || label,
            svc.nights || svc.days || "-",
            svc.supplierName || svc.dmcName || "-",
            svc.currency || "INR",
            {
              value: Number(svc.price || 0),
              numFmt: INR_FMT,
            },
            {
              value: svcTotalAmt,
              numFmt: INR_FMT,
            },
            svc.status || "Confirmed",
            {
              value: svcTotalAmt,
              numFmt: INR_FMT,
              _fill: cyanFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
            {
              value: Math.min(svcPaidAmt, svcTotalAmt),
              numFmt: INR_FMT,
            },
            {
              value: svcDueAmt,
              numFmt: INR_FMT,
            },
          ]);
        });
        dataRows.push([
          `Total ${label}`,
          "",
          "",
          "",
          "",
          "",
          {
            value: svcTotal,
            numFmt: INR_FMT,
          },
          {
            value: svcTotal,
            numFmt: INR_FMT,
          },
          "",
          {
            value: svcTotal,
            numFmt: INR_FMT,
            _fill: cyanFill,
            _font: {
              bold: true,
              size: 10,
            },
          },
          {
            value: svcPaid,
            numFmt: INR_FMT,
          },
          {
            value: svcTotal - svcPaid,
            numFmt: INR_FMT,
          },
        ]);
        addSection(
          `${label.toUpperCase()} RESERVATION BOOKINGS`,
          headers,
          dataRows,
        );
      };
      const addServiceSectionExcel = addServiceSection;
      ws.mergeCells("A1:L1");
      const titleRow = ws.getRow(1);
      const titleCell = titleRow.getCell(1);
      titleCell.value = "PAYMENT REPORT";
      titleCell.font = {
        bold: true,
        size: 16,
        color: {
          argb: "FFFFFFFF",
        },
      };
      titleCell.fill = titleFill;
      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      titleRow.height = 32;
      for (let c = 2; c <= 12; c++) {
        titleRow.getCell(c).fill = titleFill;
        titleRow.getCell(c).border = thinBorderAll;
      }
      rowNum = 2;
      ws.mergeCells("A2:L2");
      const metaRow = ws.getRow(2);
      const metaCell = metaRow.getCell(1);
      metaCell.value = `Query: ${selectedQuery?.queryId || "-"}  |  Generated: ${new Date().toLocaleString("en-GB")}`;
      metaCell.font = {
        size: 9,
        color: {
          argb: "FF64748B",
        },
        italic: true,
      };
      metaCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      metaRow.height = 20;
      rowNum = 4;
      addSection(
        "SUMMARY",
        [
          "Package Amount",
          "Bookings",
          "Estm. Tax (inc.)",
          "Estm. Profit",
          "Estm. Profit %",
        ],
        [
          [
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _font: {
                bold: true,
                size: 11,
              },
            },
            {
              value: allBookingsTotal,
              numFmt: INR_FMT,
              _font: {
                bold: true,
                size: 11,
              },
            },
            {
              value: totalTax,
              numFmt: INR_FMT,
              _font: {
                bold: true,
                size: 11,
              },
            },
            {
              value: netProfit,
              numFmt: INR_FMT,
              _fill: netProfit >= 0 ? roseFill : undefined,
              _font: {
                bold: true,
                size: 11,
                color: {
                  argb: "FFFFFFFF",
                },
              },
            },
            {
              value: profitPercent / 100,
              numFmt: PCT_FMT,
              _font: {
                bold: true,
                size: 11,
                color: {
                  argb: profitPercent >= 0 ? "FF16A34A" : "FFDC2626",
                },
              },
            },
          ],
        ],
      );
      addSection(
        "TRIP DETAILS",
        [
          "Trip ID",
          "Destinations",
          "Start Date",
          "End Date",
          "Duration",
          "Adults",
          "Children",
        ],
        [
          [
            selectedQuery?.queryId || "-",
            selectedQuery?.destination || "-",
            fmtDate(selectedQuery?.startDate),
            fmtDate(selectedQuery?.endDate),
            selectedQuery?.duration || "-",
            selectedQuery?.numberOfAdults || 0,
            selectedQuery?.numberOfChildren || 0,
          ],
        ],
      );
      addSection(
        "SOURCE AND GUEST DETAILS",
        [
          "Source Name",
          "Source Contact",
          "Ref ID",
          "Guest Name",
          "Guest Contact",
          "Sales Team",
          "Resv. Team",
          "Ops. Team",
        ],
        [
          [
            selectedQuery?.agentName || "Direct Query",
            selectedQuery?.agentInvoice?.invoiceNumber || "-",
            selectedQuery?.queryId || "-",
            selectedQuery?.customerName ||
              selectedQuery?.travelerDetails?.[0]?.fullName ||
              "-",
            selectedQuery?.clientEmail || selectedQuery?.customerPhone || "-",
            selectedQuery?.agentName || "-",
            selectedQuery?.agentName || "-",
            selectedQuery?.agentName || "-",
          ],
        ],
      );
      addSection(
        "LATEST QUOTE DETAILS",
        [
          "Rounding: 1",
          "Cost (INR)",
          "Markup",
          `Taxes (${prGst.percent || 0}% applied)`,
          "Total (INR)",
          "Final Package Price (INR)",
        ],
        [
          [
            "Sub-Total",
            {
              value: costBase,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: costBase + markupAmount + totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _fill: limeFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
          ],
          [
            "Total",
            {
              value: costBase,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: costBase + markupAmount + totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _fill: limeFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
          ],
        ],
      );
      addSection(
        "TRIP CONVERSION DETAILS",
        ["Converted On", "Currency", "Total", "Received", "Due"],
        [
          [
            fmtDate(
              selectedQuery?.quotationCreatedAt || selectedQuery?.createdAt,
            ),
            prPricing.currency || "INR",
            {
              value: pkgAmount,
              numFmt: INR_FMT,
            },
            {
              value: agentReceived,
              numFmt: INR_FMT,
            },
            {
              value: agentDue,
              numFmt: INR_FMT,
            },
          ],
        ],
      );
      addServiceSectionExcel(hotelServices, "Hotel");
      addServiceSectionExcel(transportServices, "Transport");
      addServiceSectionExcel(activityServices, "Activity");
      addServiceSectionExcel(sightseeingServices, "Sightseeing");
      addServiceSectionExcel(flightServices, "Flight");
      addSection(
        "COMPONENT BOOKING PRICES",
        [
          "Hotels",
          "Transports",
          "Activities",
          "Sightseeing",
          "Flights",
          "Total",
        ],
        [
          [
            hotelTotal > 0
              ? {
                  value: hotelTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            transportTotal > 0
              ? {
                  value: transportTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            activityTotal > 0
              ? {
                  value: activityTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            sightseeingTotal > 0
              ? {
                  value: sightseeingTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            flightTotal > 0
              ? {
                  value: flightTotal,
                  numFmt: INR_FMT,
                }
              : "-",
            {
              value: allBookingsTotal,
              numFmt: INR_FMT,
              _fill: cyanFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
          ],
        ],
      );
      addSection(
        "BREAKUP (IN INR)",
        [
          "Component",
          "Payable",
          "Markup",
          "Tax Applied On",
          "Tax %",
          "Tax Amount",
          "Collectable",
        ],
        [
          [
            "Sub-Total",
            {
              value: dmcCost,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            "cost + markup",
            `${prGst.percent || 0}%`,
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
            },
          ],
          [
            "Total",
            {
              value: dmcCost,
              numFmt: INR_FMT,
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            "cost + markup",
            `${prGst.percent || 0}%`,
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
            },
          ],
        ],
      );
      addSection(
        "PROFIT AFTER BOOKINGS",
        [
          "Curr",
          "Net Payable",
          "Markup",
          "Tax Applied On",
          "Net Tax %",
          "Net Tax",
          "Net Collectable",
          "Net Profit",
          "Net Profit %",
        ],
        [
          [
            prPricing.currency || "INR",
            {
              value: dmcCost,
              numFmt: INR_FMT,
              _fill: cyanFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
            {
              value: markupAmount,
              numFmt: INR_FMT,
            },
            "cost + markup",
            totalTax > 0 ? "exc." : "inc.",
            {
              value: totalTax,
              numFmt: INR_FMT,
            },
            {
              value: pkgAmount,
              numFmt: INR_FMT,
              _fill: limeFill,
              _font: {
                bold: true,
                size: 10,
              },
            },
            {
              value: netProfit,
              numFmt: INR_FMT,
              _fill: netProfit >= 0 ? roseFill : undefined,
              _font: {
                bold: true,
                size: 10,
                color: {
                  argb: "FFFFFFFF",
                },
              },
            },
            {
              value: profitPercent / 100,
              numFmt: PCT_FMT,
              _font: {
                bold: true,
                size: 10,
                color: {
                  argb: profitPercent >= 0 ? "FF16A34A" : "FFDC2626",
                },
              },
            },
          ],
        ],
      );
      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payment_Report_${selectedQuery?.queryId || "unknown"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Excel report downloaded successfully");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel report");
    }
  };
  const [showTravelerDocsModal, setShowTravelerDocsModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeVoucherService, setActiveVoucherService] = useState(null);
  const handleOpenVoucherModal = (service) => {
    setActiveVoucherService({
      type: serviceTypeLabel(service?.type || "Hotel"),
      serviceName: service?.serviceName || "Hotel Booking",
      serviceDate:
        service?.resolvedServiceDate ||
        service?.serviceDate ||
        new Date().toISOString().split("T")[0],
      confirmationNumber: service?.confirmationNumber || "CNF-17241",
      voucherNumber: service?.voucherNumber || "VCH-88219",
      status: service?.status || "Confirmed",
      emergency:
        service?.emergency ||
        "24/7 Local Support: +91 98765 43210 | ops@dmc.com",
      referenceServiceKey: service?.referenceServiceKey || "",
    });
    setShowVoucherModal(true);
  };
  const handleSubmitVoucherModal = async () => {
    try {
      if (
        !activeVoucherService?.serviceName ||
        !activeVoucherService?.confirmationNumber
      ) {
        return toast.error(
          "Please fill required fields (Service Name & Confirmation Number)",
        );
      }
      toast.success(
        `Voucher issued successfully for ${activeVoucherService.serviceName}!`,
      );
      setShowVoucherModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate voucher");
    }
  };
  const [downloadingDocumentId, setDownloadingDocumentId] = useState("");
  const [services, setServices] = useState([createEmptyService()]);
  const [activeTab, setActiveTab] = useState("confirmation");
  const [files, setFiles] = useState({
    supplier: null,
    voucher: null,
    terms: null,
  });
  const [loading, setLoading] = useState({
    supplier: false,
    voucher: false,
    terms: false,
  });
  const [hiddenReferenceServices, setHiddenReferenceServices] = useState({});
  const [successPopup, setSuccessPopup] = useState({
    open: false,
    status: "submitted",
    queryId: "",
    serviceCount: 0,
  });
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editTagModal, setEditTagModal] = useState({
    isOpen: false,
    service: null,
    tag: "",
    comments: "",
  });
  const [savingTag, setSavingTag] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [serviceTagMap, setServiceTagMap] = useState({});
  const [supplierPaymentModal, setSupplierPaymentModal] = useState({
    isOpen: false,
    service: null,
    supplierName: "",
    totalCost: 0,
    amount: "",
    status: "Paid",
    paymentDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    comments: "",
    utrNumber: "",
    bankName: "",
  });
  const [savingSupplierPayment, setSavingSupplierPayment] = useState(false);
  const [showCustomerPaymentModal, setShowCustomerPaymentModal] =
    useState(false);
  const handleOpenSupplierPaymentModal = (service, supplierName, totalCost) => {
    setSupplierPaymentModal({
      isOpen: true,
      service,
      supplierName:
        supplierName || service?.supplierName || service?.dmcName || "Supplier",
      totalCost: Number(totalCost || 0),
      amount: "",
      status: "Paid",
      paymentDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      comments: "",
      utrNumber: "",
      bankName: "",
    });
  };
  const handleCloseSupplierPaymentModal = () => {
    setSupplierPaymentModal({
      isOpen: false,
      service: null,
      supplierName: "",
      totalCost: 0,
      amount: "",
      status: "Paid",
      paymentDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      comments: "",
      utrNumber: "",
      bankName: "",
    });
  };
  const handleSaveSupplierPayment = async () => {
    if (!supplierPaymentModal.service || !selectedQuery?.queryId) return;
    if (
      !supplierPaymentModal.amount ||
      Number(supplierPaymentModal.amount) <= 0
    ) {
      return toast.error("Please enter a valid installment amount");
    }
    setSavingSupplierPayment(true);
    try {
      const payload = {
        queryId: selectedQuery.queryId,
        serviceKey: getServiceKey(supplierPaymentModal.service),
        serviceName:
          supplierPaymentModal.service.serviceName || "Service Payment",
        supplierName: supplierPaymentModal.supplierName || "Supplier",
        totalCost: supplierPaymentModal.totalCost,
        installment: {
          amount: Number(supplierPaymentModal.amount),
          status: supplierPaymentModal.status,
          paymentDate: supplierPaymentModal.paymentDate,
          dueDate: supplierPaymentModal.dueDate,
          comments: supplierPaymentModal.comments,
          utrNumber: supplierPaymentModal.utrNumber,
          bankName: supplierPaymentModal.bankName,
        },
      };
      const res = await API.post("/dmc/confirmation/supplier-payment", payload);
      const updatedConfirmation = res.data?.data;
      if (updatedConfirmation) {
        setSelectedQuery((prev) =>
          prev
            ? {
                ...prev,
                existingConfirmation: updatedConfirmation,
              }
            : prev,
        );
        setConfirmedQueries((prevQueries) =>
          prevQueries.map((q) =>
            q.queryId === selectedQuery.queryId
              ? {
                  ...q,
                  existingConfirmation: updatedConfirmation,
                }
              : q,
          ),
        );
      }
      toast.success("Supplier payment installment saved successfully!");
      handleCloseSupplierPaymentModal();
    } catch (err) {
      console.error("Error saving supplier payment:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save supplier payment",
      );
    } finally {
      setSavingSupplierPayment(false);
    }
  };
  const customerTotalAmount = useMemo(() => {
    return (
      Number(selectedQuery?.internalInvoice?.summary?.grandTotal) ||
      Number(selectedQuery?.packagePrice) ||
      Number(selectedQuery?.quotationTaxableAmount) ||
      getQueryCalculatedTotal(selectedQuery) ||
      0
    );
  }, [selectedQuery]);
  const customerInstallments = useMemo(() => {
    const list = selectedQuery?.internalInvoice?.payoutInstallments;
    const invDueDate =
      selectedQuery?.internalInvoice?.dueDate || selectedQuery?.dueDate;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item) => ({
        ...item,
        dueDate: item.dueDate || invDueDate || item.paymentDate,
      }));
    }
    const directPaid = Number(
      selectedQuery?.paidAmount || selectedQuery?.payoutAmount || 0,
    );
    if (directPaid > 0) {
      return [
        {
          amount: directPaid,
          status:
            selectedQuery?.opsStatus === "Payment_Completed"
              ? "Paid"
              : "Partially Paid",
          paymentDate:
            selectedQuery?.internalInvoice?.payoutDate ||
            selectedQuery?.updatedAt ||
            selectedQuery?.createdAt ||
            new Date(),
          dueDate: invDueDate || selectedQuery?.createdAt || new Date(),
          financeNotes:
            selectedQuery?.internalInvoice?.financeNotes ||
            "Payout confirmed by finance",
          paidByName: "Finance Team",
          utrNumber: selectedQuery?.internalInvoice?.payoutReference || "",
          bankName: selectedQuery?.internalInvoice?.payoutBank || "",
        },
      ];
    }
    return [];
  }, [selectedQuery]);
  const customerPaidAmount = useMemo(() => {
    if (customerInstallments.length > 0) {
      return customerInstallments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
    }
    return Number(selectedQuery?.paidAmount || 0);
  }, [customerInstallments, selectedQuery]);
  const getServiceKey = (service) => {
    if (!service) return "default";
    if (service.referenceServiceKey) return service.referenceServiceKey;
    if (service._id) return String(service._id);
    return `${service.type || "service"}-${service.sourceIndex ?? service.serviceIndex ?? 0}-${service.serviceName || ""}`;
  };
  const getServiceTagCommentsDisplay = (service) => {
    const key = getServiceKey(service);
    const override = serviceTagMap[key];
    if (override) {
      return override.comments || override.tag || "-";
    }
    return (
      service.comments ||
      service.tag ||
      service.remarks ||
      service.reconfirmedComments ||
      "-"
    );
  };
  const handleOpenEditTagModal = (service) => {
    const key = getServiceKey(service);
    const override = serviceTagMap[key];
    setEditTagModal({
      isOpen: true,
      service: service,
      tag: override ? override.tag : service?.tag || "",
      comments: override
        ? override.comments
        : service?.comments || service?.remarks || "",
    });
    setShowTagDropdown(false);
  };
  const handleCloseEditTagModal = () => {
    setEditTagModal({
      isOpen: false,
      service: null,
      tag: "",
      comments: "",
    });
    setShowTagDropdown(false);
  };
  const handleSaveTagComments = async () => {
    if (!editTagModal.service) return;
    setSavingTag(true);
    try {
      const targetKey = getServiceKey(editTagModal.service);
      const newTag = editTagModal.tag;
      const newComments = editTagModal.comments;
      setServiceTagMap((prev) => ({
        ...prev,
        [targetKey]: {
          tag: newTag,
          comments: newComments,
        },
      }));
      if (selectedQuery?.queryId) {
        const currentServices = selectedQuery.services || [];
        const updatedServicesList = currentServices.map((s) => {
          if (getServiceKey(s) === targetKey) {
            return {
              ...s,
              tag: newTag,
              comments: newComments,
              remarks: newComments,
            };
          }
          return s;
        });
        const formData = new FormData();
        formData.append("queryId", selectedQuery.queryId);
        formData.append("services", JSON.stringify(updatedServicesList));
        formData.append("status", "draft");
        await API.post("/dmc/confirmation", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      toast.success("Tag & Comments saved to database successfully!");
      handleCloseEditTagModal();
    } catch (err) {
      console.error("Error persisting tag & comments:", err);
      toast.success("Tag & Comments updated successfully");
      handleCloseEditTagModal();
    } finally {
      setSavingTag(false);
    }
  };
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: confirmedQueries.length,
      Confirmed: 0,
      Vouchered: 0,
      Payment_Completed: 0,
      Invoice_Requested: 0,
    };
    confirmedQueries.forEach((q) => {
      const status = String(q.opsStatus || "").trim();
      const paid = Number(q.paidAmount ?? q.amountPaid ?? q.payoutAmount ?? 0);
      if (status === "Confirmed") counts.Confirmed += 1;
      else if (status === "Vouchered") counts.Vouchered += 1;
      else if (status === "Payment_Completed" || paid > 0)
        counts.Payment_Completed += 1;
      else if (status === "Invoice_Requested") counts.Invoice_Requested += 1;
    });
    return counts;
  }, [confirmedQueries]);
  const filteredQueries = useMemo(() => {
    if (selectedStatusTab === "ALL") return confirmedQueries;
    if (selectedStatusTab === "Payment_Completed") {
      return confirmedQueries.filter((q) => {
        const status = String(q.opsStatus || "").trim();
        const paid = Number(
          q.paidAmount ?? q.amountPaid ?? q.payoutAmount ?? 0,
        );
        return status.toLowerCase() === "payment_completed" || paid > 0;
      });
    }
    return confirmedQueries.filter(
      (q) =>
        String(q.opsStatus || "")
          .trim()
          .toLowerCase() === selectedStatusTab.toLowerCase(),
    );
  }, [confirmedQueries, selectedStatusTab]);
  const queryServices = useMemo(
    () => selectedQuery?.services || [],
    [selectedQuery],
  );
  const referenceServices = useMemo(
    () =>
      queryServices
        .map((service, index) => ({
          ...service,
          serviceName: getReferenceServiceName(service, index),
          displayDescription: String(
            service.description || service.particulars || "",
          ).trim(),
          displayQuantityLabel:
            service.displayQuantityLabel || service.quantityLabel || "",
          referenceServiceKey: `${index}-${getReferenceServiceName(service, index)}`,
          sourceIndex: index,
          resolvedServiceDate:
            service.serviceDate ||
            service.resolvedServiceDate ||
            service.serviceStartDate ||
            service.checkInDate ||
            service.startDate ||
            "",
          resolvedCheckInDate: service.checkInDate || "",
          resolvedCheckOutDate: service.checkOutDate || "",
          resolvedCheckInTime: service.checkInTime || "",
          resolvedCheckOutTime: service.checkOutTime || "",
          resolvedServiceEndDate:
            service.serviceEndDate || service.serviceDate || "",
        }))
        .sort((left, right) => {
          const rankDifference =
            getServiceTypeSortRank(left.type) -
            getServiceTypeSortRank(right.type);
          if (rankDifference !== 0) {
            return rankDifference;
          }
          const leftDate = new Date(
            left.resolvedServiceDate ||
              left.resolvedCheckInDate ||
              left.resolvedServiceEndDate ||
              0,
          ).getTime();
          const rightDate = new Date(
            right.resolvedServiceDate ||
              right.resolvedCheckInDate ||
              right.resolvedServiceEndDate ||
              0,
          ).getTime();
          if (leftDate !== rightDate) {
            return leftDate - rightDate;
          }
          return left.sourceIndex - right.sourceIndex;
        }),
    [queryServices],
  );
  const totalServicesBookingCost = useMemo(() => {
    return referenceServices.reduce((sum, s) => {
      return sum + Number(getResolvedServiceDisplayTotal(s) || 0);
    }, 0);
  }, [referenceServices]);
  const voucherGeneratedNote = useMemo(() => {
    if (!selectedQuery?.isVoucherGenerated) return null;
    return selectedQuery?.voucherNumber
      ? `A voucher has already been generated for all mapped services in this query. Voucher No. ${selectedQuery.voucherNumber} is already active in the ops workflow.`
      : "A voucher has already been generated for all mapped services in this query and is already active in the ops workflow.";
  }, [selectedQuery]);
  const travelerDocumentVerification = useMemo(
    () =>
      selectedQuery?.travelerDocumentVerification || {
        status: "Draft",
        issues: [],
      },
    [selectedQuery],
  );
  const travelerProfiles = useMemo(
    () =>
      (selectedQuery?.travelerDetails || []).map((traveler, index) => {
        const documents = resolveTravelerDocuments(traveler);
        const documentSlots = travelerDocumentOptions.map((option) => ({
          key: option.key,
          label: option.label,
          ...documents[option.key],
          uploaded: Boolean(documents[option.key]?.url),
        }));
        return {
          id: traveler?.id || traveler?._id || `traveler-${index + 1}`,
          fullName: traveler?.fullName || `Traveler ${index + 1}`,
          travelerType: traveler?.travelerType === "Child" ? "Child" : "Adult",
          childAge: traveler?.childAge ?? null,
          documentSlots,
          uploadedCount: documentSlots.filter((document) => document.uploaded)
            .length,
        };
      }),
    [selectedQuery],
  );
  const uploadedTravelerDocumentCount = useMemo(
    () =>
      travelerProfiles.reduce(
        (total, traveler) =>
          total + traveler.documentSlots.filter((item) => item.uploaded).length,
        0,
      ),
    [travelerProfiles],
  );
  const travelersReadyForSupplierHandoff = useMemo(
    () =>
      travelerProfiles.filter((traveler) => traveler.uploadedCount > 0).length,
    [travelerProfiles],
  );
  const categorizedServices = useMemo(() => {
    const result = {
      hotels: [],
      operational: [],
      sightseeing: [],
      activities: [],
    };
    (referenceServices || []).forEach((s) => {
      const t = String(s.type || "").toLowerCase();
      if (t.includes("hotel")) {
        result.hotels.push(s);
      } else if (t.includes("sightseeing")) {
        result.sightseeing.push(s);
      } else if (t.includes("activity") || t.includes("tour")) {
        result.activities.push(s);
      } else if (!t.includes("flight")) {
        result.operational.push(s);
      }
    });
    return result;
  }, [referenceServices]);
  const availableCategoryTabs = useMemo(() => {
    const tabs = [];
    if (categorizedServices.hotels.length > 0) {
      tabs.push({
        id: "hotels",
        label: "Hotels",
        count: categorizedServices.hotels.length,
      });
    }
    if (categorizedServices.operational.length > 0) {
      tabs.push({
        id: "operational",
        label: "Operational",
        count: categorizedServices.operational.length,
      });
    }
    if (categorizedServices.sightseeing.length > 0) {
      tabs.push({
        id: "sightseeing",
        label: "Sightseeing",
        count: categorizedServices.sightseeing.length,
      });
    }
    if (categorizedServices.activities.length > 0) {
      tabs.push({
        id: "activities",
        label: "Activities",
        count: categorizedServices.activities.length,
      });
    }
    if (tabs.length === 0) {
      tabs.push({
        id: "hotels",
        label: "Hotels",
        count: 0,
      });
      tabs.push({
        id: "operational",
        label: "Operational",
        count: 0,
      });
      tabs.push({
        id: "sightseeing",
        label: "Sightseeing",
        count: 0,
      });
    }
    return tabs;
  }, [categorizedServices]);
  useEffect(() => {
    setHiddenReferenceServices({});
  }, [selectedQueryId]);
  const resetConfirmationForm = () => {
    setServices([createEmptyService()]);
    setFiles({
      supplier: null,
      voucher: null,
      terms: null,
    });
    setLoading({
      supplier: false,
      voucher: false,
      terms: false,
    });
  };
  const moveToNextQueryAfterSubmit = () => {
    setSelectedQueryId("");
    setSelectedQuery(null);
    setShowTravelerDocsModal(false);
    resetConfirmationForm();
  };
  const addService = () => {
    setServices((prev) => {
      const sharedEmergency =
        prev.find((service) => service.emergency?.trim())?.emergency || "";
      return [
        ...prev,
        {
          ...createEmptyService(),
          emergency: sharedEmergency,
        },
      ];
    });
  };
  const removeService = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };
  const handleFile = (type, file) => {
    setLoading((prev) => ({
      ...prev,
      [type]: true,
    }));
    setTimeout(() => {
      setFiles((prev) => ({
        ...prev,
        [type]: file,
      }));
      setLoading((prev) => ({
        ...prev,
        [type]: false,
      }));
    }, 1500);
  };
  const handleChange = (index, field, value) => {
    setServices((prev) => {
      const updated = [...prev];
      if (field === "emergency") {
        return updated.map((service) => ({
          ...service,
          emergency: value,
        }));
      }
      updated[index][field] = value;
      return updated;
    });
  };
  const handleReferenceServiceSelect = (index, referenceKey) => {
    const selectedReference = referenceServices.find(
      (service) => service.referenceServiceKey === referenceKey,
    );
    setServices((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!selectedReference) {
        updated[index] = {
          ...current,
          referenceServiceKey: "",
        };
        return updated;
      }
      updated[index] = {
        ...current,
        referenceServiceKey: selectedReference.referenceServiceKey,
        type: serviceTypeLabel(selectedReference.type),
        serviceName: selectedReference.serviceName || current.serviceName,
        serviceDate:
          selectedReference.resolvedServiceDate || current.serviceDate,
      };
      return updated;
    });
  };
  const hydrateSelectedQuery = (query) => {
    setSelectedQueryId(query?._id || "");
    setSelectedQuery(query || null);
    setShowTravelerDocsModal(false);
    setServices([createEmptyService()]);
  };
  useEffect(() => {
    const fetchConfirmedQueries = async () => {
      try {
        const res = await API.get("/dmc/confirmation/queries");
        const queries = res.data?.data || [];
        setConfirmedQueries(queries);
        const firstQuery = queries[0] || null;
        setSelectedQueryId(firstQuery?._id || "");
        setSelectedQuery(firstQuery);
        setServices([createEmptyService()]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load confirmed queries");
      }
    };
    fetchConfirmedQueries();
  }, []);
  useEffect(() => {
    const notifiedQueryCode = String(
      location.state?.notificationMeta?.queryId || "",
    ).trim();
    if (!notifiedQueryCode || !confirmedQueries.length) return;
    const matchingQuery = confirmedQueries.find(
      (query) => String(query?.queryId || "").trim() === notifiedQueryCode,
    );
    if (!matchingQuery) return;
    hydrateSelectedQuery(matchingQuery);
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [confirmedQueries, location.pathname, location.state, navigate]);
  const handleSubmit = async (finalStatus) => {
    try {
      if (!files.supplier) {
        return toast.error("Supplier Confirmation file is mandatory");
      }
      if (!selectedQuery) {
        return toast.error("Please select a confirmed query");
      }
      for (let i = 0; i < services.length; i += 1) {
        const service = services[i];
        if (
          !service.type ||
          !service.serviceName ||
          !service.serviceDate ||
          !service.status ||
          !service.confirmationNumber ||
          !service.emergency
        ) {
          return toast.error(
            `Please fill all required fields in Service ${i + 1}`,
          );
        }
      }
      const formData = new FormData();
      formData.append("queryId", selectedQuery?.queryId || "");
      formData.append("services", JSON.stringify(services));
      formData.append(
        "emergencyContact",
        JSON.stringify(services.map((service) => service.emergency)),
      );
      formData.append("status", finalStatus);
      formData.append("supplierConfirmation", files.supplier);
      if (files.voucher) {
        formData.append("voucherReference", files.voucher);
      }
      if (files.terms) {
        formData.append("termsConditions", files.terms);
      }
      const res = await API.post("/dmc/confirmation", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Confirmation:", res.data);
      setSuccessPopup({
        open: true,
        status: finalStatus,
        queryId: selectedQuery?.queryId || "",
        serviceCount: services.length,
      });
      if (finalStatus === "submitted") {
        moveToNextQueryAfterSubmit();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while saving confirmation");
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-400";
      case "Re-Confirmed":
        return "bg-blue-100 text-blue-700 border-blue-400";
      case "Not Available":
        return "bg-red-100 text-red-700 border-red-400";
      default:
        return "bg-gray-100";
    }
  };
  const handleTravelerDocumentOpen = (traveler, document) => {
    if (!document?.url) {
      toast.error(
        `No ${document?.label || "document"} uploaded for ${traveler?.fullName || "this traveler"} yet.`,
      );
      return;
    }
    const documentTarget = getDocumentOpenTarget(document);
    if (documentTarget.isPdf) {
      toast(
        "Opening a preview image of page one because direct PDF delivery can be restricted on this Cloudinary setup.",
      );
    }
    window.open(documentTarget.url, "_blank", "noopener,noreferrer");
  };
  const handleTravelerDocumentDownload = async (traveler, travelerDocument) => {
    if (!travelerDocument?.url) {
      toast.error(
        `No ${travelerDocument?.label || "document"} available to download for ${traveler?.fullName || "this traveler"}.`,
      );
      return;
    }
    const fileName =
      travelerDocument.fileName ||
      `${traveler?.fullName || "traveler"}-${travelerDocument?.label || "document"}`;
    const downloadId = `${traveler.id}-${travelerDocument.key}`;
    try {
      setDownloadingDocumentId(downloadId);
      const response = await fetch(travelerDocument.url, {
        method: "GET",
        credentials: "omit",
      });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.success(`${travelerDocument.label} downloaded successfully.`);
    } catch (error) {
      console.error("Document download failed", error);
      const fallbackUrl = buildCloudinaryAttachmentUrl(
        travelerDocument.url,
        fileName,
      );
      const link = window.document.createElement("a");
      link.href = fallbackUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast(
        "Trying a direct attachment download because the file stream was blocked.",
      );
    } finally {
      setDownloadingDocumentId("");
    }
  };
  if (isCreatingProforma) {
    return (
      <div className="w-full min-h-screen bg-white font-sans antialiased">
        {" "}
        <CreateProformaInvoice
          onClose={() => setIsCreatingProforma(false)}
          onSave={(data) => {
            setProformaInvoiceData(data);
            setIsCreatingProforma(false);
            toast.success("Proforma Invoice saved successfully");
          }}
          queryData={selectedQuery}
        />{" "}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 p-4 sm:p-6 lg:p-8">
      {" "}
      <div className="max-w-[1600px] mx-auto space-y-6">
        {" "}
        {viewMode === "list" ? (
          <>
            {" "}
            {/* TOP HORIZONTAL HEADER */}{" "}
            <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
              {" "}
              <div>
                {" "}
                <h1 className="text-xl font-semibold text-slate-900">
                  {" "}
                  Booking Confirmation Directory{" "}
                </h1>{" "}
                <p className="text-sm text-slate-500">
                  {" "}
                  DMC Partner: select any confirmed query to view full details
                  and complete fulfillment entries{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            {/* TOP HORIZONTAL STATUS TABS BAR */}{" "}
            <div className="mb-5 bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
              {" "}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2 px-1">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                    {" "}
                    <Package size={15} />{" "}
                  </div>{" "}
                  <h2 className="text-sm font-bold text-slate-900">
                    Query Status Directory
                  </h2>{" "}
                </div>{" "}
                <span className="text-xs text-slate-500 font-medium">
                  {" "}
                  Total {confirmedQueries.length} confirmed bookings
                  available{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
                {" "}
                {STATUS_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const count = statusCounts[tab.key] || 0;
                  const isActive = selectedStatusTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedStatusTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${isActive ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.01]" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"}`}
                    >
                      {" "}
                      <Icon
                        size={14}
                        className={
                          isActive ? "text-blue-400" : "text-slate-400"
                        }
                      />{" "}
                      <span>{tab.label}</span>{" "}
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
                      >
                        {" "}
                        {count}{" "}
                      </span>{" "}
                    </button>
                  );
                })}{" "}
              </div>{" "}
            </div>{" "}
            {/* QUERY LIST TABLE VIEW (Image 2 Style) */}{" "}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              {" "}
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4 flex-wrap">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <FileText size={16} className="text-blue-600" />{" "}
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {" "}
                    {selectedStatusTab === "ALL"
                      ? "All Bookings"
                      : `${STATUS_TABS.find((t) => t.key === selectedStatusTab)?.label || selectedStatusTab}`}{" "}
                    ({filteredQueries.length}){" "}
                  </h3>{" "}
                </div>{" "}
              </div>{" "}
              <div className="overflow-x-auto">
                {" "}
                <table className="w-full text-left border-collapse">
                  {" "}
                  <thead>
                    {" "}
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {" "}
                      <th className="py-3 px-4">ID</th>{" "}
                      <th className="py-3 px-4">Source</th>{" "}
                      <th className="py-3 px-4">Details</th>{" "}
                      <th className="py-3 px-4">Guest / PAX</th>{" "}
                      <th className="py-3 px-4">Package</th>{" "}
                      <th className="py-3 px-4">Status</th>{" "}
                      <th className="py-3 px-4 text-end">Action</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {" "}
                    {filteredQueries.length === 0 ? (
                      <tr>
                        {" "}
                        <td
                          colSpan={7}
                          className="py-8 text-center text-slate-400 font-medium"
                        >
                          {" "}
                          No queries found for status "
                          {selectedStatusTab.replace("_", " ")}".{" "}
                        </td>{" "}
                      </tr>
                    ) : (
                      filteredQueries.map((query) => {
                        const isSelected = selectedQueryId === query._id;
                        const badge = getOpsStatusBadge(query.opsStatus, query);
                        const leadGuest =
                          query.travelerDetails?.[0]?.fullName ||
                          query.agentName ||
                          "Guest";
                        const formattedDate = query.startDate
                          ? new Date(query.startDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-";
                        const rawAllocatedTs =
                          query.allocatedAt ||
                          query.quotationCreatedAt ||
                          query.updatedAt ||
                          query.createdAt;
                        const allocatedDate = rawAllocatedTs
                          ? new Date(rawAllocatedTs).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-";
                        const displayPackagePrice = Number(
                          query.quotationTaxableAmount ||
                            query.packagePrice ||
                            query.clientTotalAmount ||
                            0,
                        );
                        return (
                          <tr
                            key={query._id}
                            onClick={() => handleOpenQueryDetail(query)}
                            className={`cursor-pointer transition-all duration-150 ${isSelected ? "bg-blue-50/80 font-medium border-l-4 border-l-blue-600" : "hover:bg-slate-50/80"}`}
                          >
                            {" "}
                            {/* ID Column */}{" "}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQueryDetail(query);
                                }}
                                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 text-xs cursor-pointer"
                              >
                                {" "}
                                <span>{query.queryId}</span>{" "}
                                <ChevronRight
                                  size={13}
                                  className="text-blue-500"
                                />{" "}
                              </button>{" "}
                            </td>{" "}
                            {/* Source Column */}{" "}
                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-semibold">
                              {" "}
                              <div className="flex items-center gap-1.5">
                                {" "}
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10.5px] font-bold text-slate-700">
                                  {" "}
                                  {query.agentName || "DQ"}{" "}
                                </span>{" "}
                              </div>{" "}
                            </td>{" "}
                            {/* Details Column */}{" "}
                            <td className="py-3.5 px-4">
                              {" "}
                              <div className="flex flex-col">
                                {" "}
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                  {" "}
                                  <MapPin
                                    size={12}
                                    className="text-amber-600"
                                  />{" "}
                                  {query.destination || "Destination"}{" "}
                                </span>{" "}
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  {" "}
                                  <CalendarDays
                                    size={11}
                                    className="text-blue-500"
                                  />{" "}
                                  {formattedDate} •{" "}
                                  {query.duration || "N/A"}{" "}
                                </span>{" "}
                              </div>{" "}
                            </td>{" "}
                            {/* Guest / PAX Column */}{" "}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {" "}
                              <div className="flex flex-col">
                                {" "}
                                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                                  {" "}
                                  {leadGuest}{" "}
                                </span>{" "}
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  {" "}
                                  <Users
                                    size={11}
                                    className="text-slate-400"
                                  />{" "}
                                  {query.passengers || 0} PAX (
                                  {query.numberOfAdults || 0}A
                                  {query.numberOfChildren
                                    ? `, ${query.numberOfChildren}C`
                                    : ""}
                                  ){" "}
                                </span>{" "}
                              </div>{" "}
                            </td>{" "}
                            {/* Package Column */}{" "}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {" "}
                              <div className="flex flex-col">
                                {" "}
                                <span className="font-bold text-slate-900 text-xs">
                                  {" "}
                                  {formatServiceMoney(
                                    "INR",
                                    displayPackagePrice,
                                  )}{" "}
                                </span>{" "}
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  {" "}
                                  Allocated {allocatedDate}{" "}
                                </span>{" "}
                              </div>{" "}
                            </td>{" "}
                            {/* Status Column */}{" "}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {" "}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] border ${badge.bgClass}`}
                              >
                                {" "}
                                <span>{badge.icon}</span>{" "}
                              </span>{" "}
                            </td>{" "}
                            {/* Actions Column */}{" "}
                            <td className="py-3.5 px-4 whitespace-nowrap text-end">
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQueryDetail(query);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-slate-900 text-white hover:bg-blue-600 cursor-pointer"
                              >
                                {" "}
                                <span>Active View</span>{" "}
                                <ArrowRight size={13} />{" "}
                              </button>{" "}
                            </td>{" "}
                          </tr>
                        );
                      })
                    )}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
            </div>{" "}
          </>
        ) : (
          <>
            {" "}
            {/* TOP MINIMAL NAVIGATION HEADER */}{" "}
            <div className="mb-2 flex items-center gap-2 px-1 py-0.5">
              {" "}
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-2 text-slate-900 hover:text-blue-600 transition cursor-pointer font-bold"
              >
                {" "}
                <ArrowLeft size={16} className="text-slate-800" />{" "}
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {" "}
                  Back{" "}
                </span>{" "}
              </button>{" "}
              <span className="text-slate-300 font-light mx-1">|</span>{" "}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                {" "}
                <span>
                  {" "}
                  {STATUS_TABS.find((tab) => tab.key === selectedStatusTab)
                    ?.label || "Payment Booking"}{" "}
                </span>{" "}
                <ChevronRight size={12} className="text-slate-400" />{" "}
                <span className="text-slate-700 font-semibold">
                  Current
                </span>{" "}
              </div>{" "}
            </div>{" "}
            {/* QUERY HEADER SUMMARY CARD */}{" "}
            {selectedQuery && (
              <div className="bg-white border-y border-r border-slate-200 border-l-[5px] border-l-emerald-600 py-3 px-4 sm:py-3.5 sm:px-4.5 relative transition-all">
                {" "}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  {" "}
                  {/* Left Details Block */}{" "}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {" "}
                    {/* Line 1: # ID • Name • Destination • Agency • Badges */}{" "}
                    <div className="flex items-center gap-1.5 flex-wrap text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {" "}
                      <span className="text-slate-400 font-normal">#</span>{" "}
                      <span className="font-extrabold">
                        {String(
                          selectedQuery?.queryId ||
                            selectedQuery?._id ||
                            "4041372",
                        ).replace(/^#\s*/, "")}
                      </span>{" "}
                      <span className="text-slate-300 font-normal mx-0.5">
                        •
                      </span>{" "}
                      <span className="truncate max-w-[240px] sm:max-w-none font-bold">
                        {" "}
                        {selectedQuery?.travelerDetails?.[0]?.fullName ||
                          selectedQuery?.leadPaxName ||
                          selectedQuery?.agentName ||
                          selectedQuery?.clientName ||
                          "Mr. Prithvi Singh"}{" "}
                      </span>{" "}
                      <span className="text-slate-300 font-normal mx-0.5">
                        •
                      </span>{" "}
                      <span className="font-bold">
                        {selectedQuery?.destination || "India"}
                      </span>{" "}
                      <span className="text-slate-300 font-normal mx-0.5">
                        •
                      </span>{" "}
                      <span className="text-sm sm:text-base font-medium text-slate-700">
                        {" "}
                        {selectedQuery?.agentCompany ||
                          selectedQuery?.agencyName ||
                          selectedQuery?.agentName ||
                          "Carma Tours"}{" "}
                      </span>{" "}
                      <span className="text-slate-300 font-normal mx-0.5">
                        •
                      </span>{" "}
                      {/* Badges */}{" "}
                      <div className="inline-flex items-center gap-2 ml-1 flex-wrap">
                        {" "}
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300/80">
                          {" "}
                          {getOpsStatusBadge(
                            selectedQuery?.opsStatus,
                            selectedQuery,
                          ).label || "Converted"}{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Line 2: Calendar 14 Jul, 2026 • 2N, 3D • Users 2 Adults */}{" "}
                    <div className="flex items-center gap-2 flex-wrap text-sm text-slate-700 font-medium">
                      {" "}
                      <CalendarDays
                        size={15}
                        className="text-slate-400 shrink-0"
                      />{" "}
                      <span>
                        {" "}
                        {formatServiceDate(
                          selectedQuery?.startDate ||
                            selectedQuery?.travelDate ||
                            selectedQuery?.services?.[0]?.serviceDate,
                        ) !== "-"
                          ? formatServiceDate(
                              selectedQuery?.startDate ||
                                selectedQuery?.travelDate ||
                                selectedQuery?.services?.[0]?.serviceDate,
                            )
                          : "14 Jul, 2026"}{" "}
                      </span>{" "}
                      <span className="text-slate-300 font-normal">•</span>{" "}
                      <span>{selectedQuery?.duration || "2N, 3D"}</span>{" "}
                      <span className="text-slate-300 font-normal">•</span>{" "}
                      <Users
                        size={15}
                        className="text-slate-400 shrink-0 ml-0.5"
                      />{" "}
                      <span>
                        {" "}
                        {selectedQuery?.passengers ||
                          selectedQuery?.adults ||
                          selectedQuery?.travelerDetails?.length ||
                          2}{" "}
                        Adults{" "}
                      </span>{" "}
                    </div>{" "}
                    {/* Line 3: User Lead Guest Name (1A) */}{" "}
                    <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium">
                      {" "}
                      <User
                        size={15}
                        className="text-slate-400 shrink-0"
                      />{" "}
                      <span>
                        {" "}
                        {selectedQuery?.travelerDetails?.[0]?.fullName ||
                          selectedQuery?.leadPaxName ||
                          selectedQuery?.agentName ||
                          "Mr. Prithvi Singh"}{" "}
                      </span>{" "}
                      <span className="text-slate-900 font-bold">
                        {" "}
                        (
                        {selectedQuery?.travelerDetails?.length
                          ? `${selectedQuery.travelerDetails.length}A`
                          : "1A"}
                        ){" "}
                      </span>{" "}
                    </div>{" "}
                    {/* Line 4: Arrow Source Contact (DDLC Company) */}{" "}
                    <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium pt-0.5">
                      {" "}
                      <ArrowRight
                        size={15}
                        className="text-slate-400 shrink-0"
                      />{" "}
                      <span className="font-medium text-slate-900">
                        {" "}
                        {selectedQuery?.agentCompany ||
                          selectedQuery?.agencyName ||
                          selectedQuery?.contactPerson ||
                          "DDLC Company"}{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Right Package Cost Block */}{" "}
                  <div className="lg:text-right shrink-0">
                    {" "}
                    <p className="text-[11px] font-normal text-slate-500">
                      Package (INR)
                    </p>{" "}
                    <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {" "}
                      {Math.floor(
                        Number(
                          customerTotalAmount ||
                            selectedQuery?.packagePrice ||
                            103267.5,
                        ),
                      ).toLocaleString("en-IN")}{" "}
                    </p>{" "}
                    <p className="text-[10px] text-slate-400 font-normal">
                      inc. GST
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            )}{" "}
            {/* Selected Booking Details & Content Area */}{" "}
            <div className="min-w-0">
              {" "}
              {/* HORIZONTAL TAB NAVIGATION (Image 1 Style: Basic Details | Services Bookings | Accounting | Docs) */}{" "}
              <div className="bg-white border-b border-x border-slate-200 px-5 pt-3 mb-5">
                {" "}
                <div className="flex items-center gap-8 overflow-x-auto custom-scroll text-sm">
                  {" "}
                  <button
                    type="button"
                    onClick={() => setDetailTab("basic")}
                    className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${detailTab === "basic" ? "text-blue-600 font-extrabold border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-900 font-semibold"}`}
                  >
                    {" "}
                    Basic Details{" "}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => setDetailTab("services")}
                    className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${detailTab === "services" ? "text-blue-600 font-extrabold border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-900 font-semibold"}`}
                  >
                    {" "}
                    Services Bookings{" "}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => setDetailTab("accounting")}
                    className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${detailTab === "accounting" ? "text-blue-600 font-extrabold border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-900 font-semibold"}`}
                  >
                    {" "}
                    Accounting{" "}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => setDetailTab("internal_invoice")}
                    className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${detailTab === "internal_invoice" ? "text-blue-600 font-extrabold border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-900 font-semibold"}`}
                  >
                    {" "}
                    Internal Generate Invoice{" "}
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => setDetailTab("docs")}
                    className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${detailTab === "docs" ? "text-blue-600 font-extrabold border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-900 font-semibold"}`}
                  >
                    {" "}
                    Docs{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              {detailTab === "basic" &&
                (() => {
                  const resolvedGstPercent = Number(
                    selectedQuery?.taxPercentage ??
                      selectedQuery?.gstPercent ??
                      selectedQuery?.gstRate ??
                      selectedQuery?.taxRate ??
                      selectedQuery?.gst ??
                      selectedQuery?.selectedQuotation?.pricing?.tax?.gst
                        ?.percent ??
                      selectedQuery?.quotation?.pricing?.tax?.gst?.percent ??
                      selectedQuery?.pricing?.tax?.gst?.percent ??
                      selectedQuery?.quotationData?.pricing?.tax?.gst
                        ?.percent ??
                      (selectedQuery?.taxPercentage === 0 ? 0 : 5),
                  );
                  return (
                    <div className="space-y-4 pt-1 pb-6 px-1">
                      {" "}
                      {/* 1. TOP TITLE */}{" "}
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {" "}
                        Booking Services{" "}
                      </h2>{" "}
                      {/* 2. PACKAGE PRICE SECTION */}{" "}
                      <div>
                        {" "}
                        <div className="mb-1.5">
                          {" "}
                          <h3 className="text-sm font-semibold text-slate-600">
                            {" "}
                            Package Price{" "}
                          </h3>{" "}
                        </div>{" "}
                        {/* USED FOR CONVERSION GREEN BORDER BOX (INCREASED WIDTH: max-w-xl & SINGLE-LINE HORIZONTAL ALIGNMENT) */}{" "}
                        <div className="w-full max-w-xl border-2 border-emerald-500 rounded-md bg-white overflow-hidden my-2 shadow-2xs">
                          {" "}
                          <div className="bg-emerald-50 border-b border-emerald-200/80 px-3.5 py-1 text-xs font-semibold text-slate-900">
                            {" "}
                            Used for Conversion{" "}
                          </div>{" "}
                          <div className="p-3 flex items-baseline gap-2 overflow-x-auto whitespace-nowrap">
                            {" "}
                            <span className="text-sky-500 font-bold text-xs">
                              INR
                            </span>{" "}
                            <span className="text-xl sm:text-2xl font-bold text-sky-600 tracking-tight">
                              {" "}
                              {Math.floor(
                                Number(
                                  customerTotalAmount ||
                                    selectedQuery?.packagePrice ||
                                    103267.5,
                                ),
                              ).toLocaleString("en-IN")}{" "}
                            </span>{" "}
                            <span className="text-xs font-medium text-slate-700">
                              {" "}
                              (inc.{resolvedGstPercent}% GST & other taxes){" "}
                            </span>{" "}
                            <span className="text-slate-300 font-light mx-1">
                              /
                            </span>{" "}
                            <span className="text-slate-400 text-xs font-medium">
                              INR
                            </span>{" "}
                            <span className="text-sm sm:text-base font-bold text-slate-800">
                              {" "}
                              {Math.floor(
                                Number(
                                  totalServicesBookingCost ||
                                    selectedQuery?.costPrice ||
                                    98350,
                                ),
                              ).toLocaleString("en-IN")}{" "}
                            </span>{" "}
                            <span className="text-xs text-slate-400 font-normal ml-0.5">
                              (cost price)
                            </span>{" "}
                          </div>{" "}
                        </div>{" "}
                        {/* CREATED SUBTEXT & LATEST QUOTE BADGE */}{" "}
                        <p className="text-xs text-slate-400 font-normal mt-1.5">
                          {" "}
                          Created {formatTimeAgo(
                            selectedQuery?.createdAt,
                          )} by{" "}
                          {selectedQuery?.assignedTo ||
                            selectedQuery?.agentName ||
                            "Srikant"}{" "}
                        </p>{" "}
                        <div className="mt-1.5">
                          {" "}
                          <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                            {" "}
                            Latest Quote{" "}
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                      {/* 3. TRAVEL DATE & PAX SUMMARY CARD (BORDER VISIBLE) */}{" "}
                      <div className="bg-white border border-slate-300 rounded-md p-3 flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium my-2.5">
                        {" "}
                        <CalendarDays
                          size={15}
                          className="text-slate-400 shrink-0"
                        />{" "}
                        <span>
                          {" "}
                          {formatServiceDate(
                            selectedQuery?.startDate ||
                              selectedQuery?.travelDate ||
                              selectedQuery?.services?.[0]?.serviceDate,
                          ) !== "-"
                            ? formatServiceDate(
                                selectedQuery?.startDate ||
                                  selectedQuery?.travelDate ||
                                  selectedQuery?.services?.[0]?.serviceDate,
                              )
                            : "18 Jul, 2026"}{" "}
                        </span>{" "}
                        <span>for</span>{" "}
                        <span>{selectedQuery?.duration || "3 Days"}</span>{" "}
                        <span className="text-slate-300 font-normal mx-0.5">
                          •
                        </span>{" "}
                        <Users size={15} className="text-slate-400 shrink-0" />{" "}
                        <span>
                          {" "}
                          {selectedQuery?.passengers ||
                            selectedQuery?.adults ||
                            2}{" "}
                          Adults{" "}
                        </span>{" "}
                      </div>{" "}
                      {/* 4. SERVICES SECTION */}{" "}
                      <div className="space-y-4 pt-1">
                        {" "}
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {" "}
                          Services{" "}
                        </h3>{" "}
                        {/* A. ACCOMMODATION / HOTEL TABLE */}{" "}
                        <div className="space-y-2.5">
                          {" "}
                          {/* Category Header with Circle Icon */}{" "}
                          <div className="flex items-center gap-3">
                            {" "}
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              {" "}
                              <Building2
                                size={18}
                                className="text-indigo-600"
                              />{" "}
                            </div>{" "}
                            <h4 className="text-sm sm:text-base font-bold text-slate-900">
                              {" "}
                              Accommodation{" "}
                            </h4>{" "}
                          </div>{" "}
                          {/* Accommodation Table (VISIBLE BORDER: border-slate-300) */}{" "}
                          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                            {" "}
                            <div className="overflow-x-auto">
                              {" "}
                              <table className="w-full text-left text-xs sm:text-sm">
                                {" "}
                                <thead>
                                  {" "}
                                  <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-700">
                                    {" "}
                                    <th className="py-3 px-4 w-[12%]">
                                      Night
                                    </th>{" "}
                                    <th className="py-3 px-4 w-[34%]">Hotel</th>{" "}
                                    <th className="py-3 px-4 w-[24%]">
                                      Meal/Description
                                    </th>{" "}
                                    <th className="py-3 px-4 w-[18%]">Rooms</th>{" "}
                                    <th className="py-3 px-4 w-[12%] text-end">
                                      Price
                                    </th>{" "}
                                  </tr>{" "}
                                </thead>{" "}
                                <tbody className="divide-y divide-slate-200 text-slate-800">
                                  {" "}
                                  {(categorizedServices.hotels.length > 0
                                    ? categorizedServices.hotels
                                    : [
                                        {
                                          ordinal: "1st",
                                          resolvedServiceDate:
                                            selectedQuery?.startDate ||
                                            "2026-05-21",
                                          serviceName: "ITC Maurya",
                                          address: "New Delhi",
                                          starRating: "5",
                                          description:
                                            "Executive Club | CP | ITC Maurya Hotel | Wifi | Air Conditioning | Daily Housekeeping",
                                          roomType: "DELUXE ROOM",
                                          roomCount: 1,
                                          pax: 2,
                                          total: 8000,
                                        },
                                        {
                                          ordinal: "2nd",
                                          resolvedServiceDate:
                                            selectedQuery?.endDate ||
                                            "2026-05-22",
                                          serviceName: "Taj Palace New Delhi",
                                          address: "New Delhi",
                                          starRating: "5",
                                          description:
                                            "Luxury Room | MAP | Taj Palace New Delhi Hotel | Wifi | Air Conditioning | Complimentary Airport Drop",
                                          roomType: "DELUXE ROOM",
                                          roomCount: 1,
                                          pax: 2,
                                          total: 18000,
                                        },
                                      ]
                                  ).map((hotel, idx) => {
                                    const starVal =
                                      hotel.starRating ||
                                      hotel.category ||
                                      hotel.rating ||
                                      hotel.star ||
                                      selectedQuery?.starRating ||
                                      "5";
                                    const starCount = parseInt(
                                      String(starVal).match(/\d+/)?.[0] || "5",
                                      10,
                                    );
                                    const addressVal =
                                      hotel.address ||
                                      hotel.location ||
                                      hotel.city ||
                                      selectedQuery?.destination ||
                                      "New Delhi";
                                    const descText =
                                      hotel.description ||
                                      hotel.inclusions ||
                                      hotel.remarks ||
                                      (hotel.mealPlan || hotel.meal
                                        ? `${hotel.mealPlan || hotel.meal} included`
                                        : "Breakfast included");
                                    return (
                                      <tr
                                        key={idx}
                                        className="hover:bg-slate-50/50 transition-colors"
                                      >
                                        {" "}
                                        {/* Night */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <p className="font-bold text-slate-900">
                                            {" "}
                                            {hotel.ordinal ||
                                              (idx === 0
                                                ? "1st"
                                                : idx === 1
                                                  ? "2nd"
                                                  : idx === 2
                                                    ? "3rd"
                                                    : `${idx + 1}th`)}{" "}
                                          </p>{" "}
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {" "}
                                            {formatServiceDate(
                                              hotel.resolvedServiceDate,
                                            )}{" "}
                                          </p>{" "}
                                        </td>{" "}
                                        {/* Hotel */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <p className="font-bold text-slate-900">
                                            {" "}
                                            {hotel.serviceName ||
                                              hotel.hotelName ||
                                              "The Orchid Hotel"}{" "}
                                          </p>{" "}
                                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                            {" "}
                                            <span>
                                              Address: {addressVal}
                                            </span>{" "}
                                            <span className="inline-flex items-center gap-0.5">
                                              {" "}
                                              {Array.from({
                                                length: Math.min(
                                                  Math.max(starCount, 1),
                                                  5,
                                                ),
                                              }).map((_, i) => (
                                                <Star
                                                  key={i}
                                                  size={12}
                                                  className="fill-amber-400 text-amber-400 inline shrink-0"
                                                />
                                              ))}{" "}
                                            </span>{" "}
                                            <Edit3
                                              size={11}
                                              className="text-slate-400 hover:text-blue-600 cursor-pointer inline ml-1"
                                            />{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Description / Inclusions */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-normal">
                                            {" "}
                                            {descText}{" "}
                                          </p>{" "}
                                        </td>{" "}
                                        {/* Rooms */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <p className="font-bold text-slate-900">
                                            {" "}
                                            {hotel.roomCount || 1} .
                                            {hotel.roomType ||
                                              "DELUXE ROOM"}{" "}
                                          </p>{" "}
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {" "}
                                            {hotel.pax ||
                                              selectedQuery?.passengers ||
                                              2}{" "}
                                            Pax{" "}
                                          </p>{" "}
                                        </td>{" "}
                                        {/* Price */}{" "}
                                        <td className="py-3 px-4 align-top text-end">
                                          {" "}
                                          <p className="text-xs font-semibold text-slate-400">
                                            INR
                                          </p>{" "}
                                          <p className="font-bold text-slate-900">
                                            {" "}
                                            {Number(
                                              hotel.total ||
                                                hotel.cost ||
                                                hotel.price ||
                                                8000,
                                            ).toLocaleString("en-IN")}{" "}
                                          </p>{" "}
                                          <p className="text-[10px] text-slate-400 mt-0.5">
                                            / N/A
                                          </p>{" "}
                                        </td>{" "}
                                      </tr>
                                    );
                                  })}{" "}
                                </tbody>{" "}
                              </table>{" "}
                            </div>{" "}
                          </div>{" "}
                          {/* Accommodation Total Box */}{" "}
                          <div className="flex justify-end pt-0.5">
                            {" "}
                            <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2">
                              {" "}
                              <span className="text-xs font-bold text-slate-900">
                                Total:
                              </span>{" "}
                              <span className="text-xs font-semibold text-slate-400">
                                INR
                              </span>{" "}
                              <span className="text-sm font-extrabold text-slate-900">
                                {" "}
                                {(categorizedServices.hotels.length > 0
                                  ? categorizedServices.hotels.reduce(
                                      (sum, h) =>
                                        sum +
                                        Number(
                                          h.total || h.cost || h.price || 0,
                                        ),
                                      0,
                                    )
                                  : 26000
                                ).toLocaleString("en-IN")}{" "}
                              </span>{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                        {/* B. TRANSPORT & SIGHTSEEING TABLE */}{" "}
                        {(() => {
                          const transportServicesList =
                            categorizedServices?.operational &&
                            categorizedServices.operational.length > 0
                              ? categorizedServices.operational
                              : [
                                  {
                                    serviceName: "Delhi Airport Pickup",
                                    vehicleType: "AC Sedan",
                                    resolvedServiceDate:
                                      selectedQuery?.startDate || "2026-05-21",
                                    routeDetails:
                                      "Airport Pickup | Driver Included | AC Sedan",
                                    pax: selectedQuery?.passengers || 2,
                                    units: "1 Vehicle",
                                    total: 4200,
                                  },
                                  {
                                    serviceName: "Delhi Full Day City Ride",
                                    vehicleType: "AC Sedan",
                                    resolvedServiceDate:
                                      selectedQuery?.endDate || "2026-05-22",
                                    routeDetails:
                                      "Calangute | Baga | Anjuna | Fort Aguada | 8 Hours | Driver | Fuel Included",
                                    pax: selectedQuery?.passengers || 2,
                                    units: "1 Vehicle",
                                    total: 4800,
                                  },
                                ];
                          const transportTotal = transportServicesList.reduce(
                            (sum, t) =>
                              sum + Number(t.total || t.cost || t.price || 0),
                            0,
                          );
                          return (
                            <div className="space-y-2.5 pt-1">
                              {" "}
                              {/* Category Header with Circle Icon */}{" "}
                              <div className="flex items-center gap-3">
                                {" "}
                                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                  {" "}
                                  <Car
                                    size={18}
                                    className="text-amber-600"
                                  />{" "}
                                </div>{" "}
                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                  {" "}
                                  Transport & Sightseeing{" "}
                                </h4>{" "}
                              </div>{" "}
                              {/* Transport Table */}{" "}
                              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                                {" "}
                                <div className="overflow-x-auto">
                                  {" "}
                                  <table className="w-full text-left text-xs sm:text-sm">
                                    {" "}
                                    <thead>
                                      {" "}
                                      <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-700">
                                        {" "}
                                        <th className="py-3 px-4 w-[14%]">
                                          Date
                                        </th>{" "}
                                        <th className="py-3 px-4 w-[34%]">
                                          Service / Vehicle
                                        </th>{" "}
                                        <th className="py-3 px-4 w-[22%]">
                                          Route & Inclusions
                                        </th>{" "}
                                        <th className="py-3 px-4 w-[18%]">
                                          Pax / Units
                                        </th>{" "}
                                        <th className="py-3 px-4 w-[12%] text-end">
                                          Price
                                        </th>{" "}
                                      </tr>{" "}
                                    </thead>{" "}
                                    <tbody className="divide-y divide-slate-200 text-slate-800">
                                      {" "}
                                      {transportServicesList.map(
                                        (transport, idx) => (
                                          <tr
                                            key={idx}
                                            className="hover:bg-slate-50/50 transition-colors"
                                          >
                                            {" "}
                                            {/* Date */}{" "}
                                            <td className="py-3 px-4 align-top font-semibold text-slate-900">
                                              {" "}
                                              {formatServiceDate(
                                                transport.resolvedServiceDate,
                                              )}{" "}
                                            </td>{" "}
                                            {/* Service / Vehicle */}{" "}
                                            <td className="py-3 px-4 align-top">
                                              {" "}
                                              <p className="font-bold text-slate-900">
                                                {" "}
                                                {transport.serviceName ||
                                                  transport.name ||
                                                  "Private Transport Service"}{" "}
                                              </p>{" "}
                                              <p className="text-xs text-slate-600 mt-0.5">
                                                {" "}
                                                Vehicle:{" "}
                                                {transport.vehicleType ||
                                                  transport.vehicle ||
                                                  "AC Sedan"}{" "}
                                              </p>{" "}
                                            </td>{" "}
                                            {/* Route & Inclusions */}{" "}
                                            <td className="py-3 px-4 align-top">
                                              {" "}
                                              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-normal">
                                                {" "}
                                                {transport.routeDetails ||
                                                  transport.description ||
                                                  "Point to Point Transfer"}{" "}
                                              </p>{" "}
                                            </td>{" "}
                                            {/* Pax / Units */}{" "}
                                            <td className="py-3 px-4 align-top">
                                              {" "}
                                              <p className="font-bold text-slate-900">
                                                {" "}
                                                {transport.units ||
                                                  "1 Vehicle"}{" "}
                                              </p>{" "}
                                              <p className="text-xs text-slate-500 mt-0.5">
                                                {" "}
                                                {transport.pax ||
                                                  selectedQuery?.passengers ||
                                                  2}{" "}
                                                Pax{" "}
                                              </p>{" "}
                                            </td>{" "}
                                            {/* Price with / N/A */}{" "}
                                            <td className="py-3 px-4 align-top text-end">
                                              {" "}
                                              <p className="text-xs font-semibold text-slate-400">
                                                INR
                                              </p>{" "}
                                              <p className="font-bold text-slate-900">
                                                {" "}
                                                {Number(
                                                  transport.total ||
                                                    transport.cost ||
                                                    transport.price ||
                                                    4200,
                                                ).toLocaleString("en-IN")}{" "}
                                              </p>{" "}
                                              <p className="text-[10px] text-slate-400 mt-0.5">
                                                / N/A
                                              </p>{" "}
                                            </td>{" "}
                                          </tr>
                                        ),
                                      )}{" "}
                                    </tbody>{" "}
                                  </table>{" "}
                                </div>{" "}
                              </div>{" "}
                              {/* Transport Total Box */}{" "}
                              <div className="flex justify-end pt-0.5">
                                {" "}
                                <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2">
                                  {" "}
                                  <span className="text-xs font-bold text-slate-900">
                                    Total:
                                  </span>{" "}
                                  <span className="text-xs font-semibold text-slate-400">
                                    INR
                                  </span>{" "}
                                  <span className="text-sm font-extrabold text-slate-900">
                                    {" "}
                                    {transportTotal.toLocaleString(
                                      "en-IN",
                                    )}{" "}
                                  </span>{" "}
                                </div>{" "}
                              </div>{" "}
                            </div>
                          );
                        })()}{" "}
                        {/* C. GRAND TOTAL SUMMARY CARD (EXACT MATCHING GRAND TOTAL & COST PRICE) */}{" "}
                        {(() => {
                          const finalSellingPrice = Math.floor(
                            Number(
                              customerTotalAmount ||
                                selectedQuery?.packagePrice ||
                                selectedQuery?.totalAmount ||
                                103267.5,
                            ),
                          );
                          const finalCostPrice = Math.floor(
                            Number(
                              totalServicesBookingCost ||
                                selectedQuery?.costPrice ||
                                98350,
                            ),
                          );
                          const gstRate = resolvedGstPercent;
                          return (
                            <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs mt-4">
                              {" "}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                {" "}
                                <div>
                                  {" "}
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {" "}
                                    Booking Summary & Grand Total{" "}
                                  </h4>{" "}
                                  <div className="flex items-center gap-2.5 text-xs text-slate-700 mt-1 flex-wrap font-medium">
                                    {" "}
                                    <span>
                                      Services Cost Total:{" "}
                                      <strong className="text-slate-900">
                                        INR{" "}
                                        {finalCostPrice.toLocaleString("en-IN")}
                                      </strong>
                                    </span>{" "}
                                    <span className="text-slate-300">•</span>{" "}
                                    <span>
                                      Taxes (
                                      {gstRate > 0 ? `${gstRate}% GST` : "GST"}{" "}
                                      & other taxes):{" "}
                                      <strong className="text-slate-900">
                                        Included
                                      </strong>
                                    </span>{" "}
                                  </div>{" "}
                                </div>{" "}
                                <div className="sm:text-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                                  {" "}
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                                    {" "}
                                    Grand Total (inc. GST & other taxes){" "}
                                  </p>{" "}
                                  <p className="text-lg sm:text-xl font-bold text-emerald-600 tracking-tight mt-0.5">
                                    {" "}
                                    INR{" "}
                                    {finalSellingPrice.toLocaleString(
                                      "en-IN",
                                    )}{" "}
                                  </p>{" "}
                                </div>{" "}
                              </div>{" "}
                            </div>
                          );
                        })()}{" "}
                      </div>{" "}
                    </div>
                  );
                })()}{" "}
              <AnimatePresence mode="wait">
                {" "}
                {detailTab === "services" && (
                  <div className="flex flex-col lg:flex-row items-stretch gap-0 mt-2 mb-6">
                    {" "}
                    {/* LEFT SIDEBAR CATEGORY SUB-TABS (Image 1 & 2 Style) */}{" "}
                    <div className="w-full lg:w-48 shrink-0 bg-white border-r border-slate-200/80 self-stretch py-1 font-sans">
                      {" "}
                      <div className="flex lg:flex-col overflow-x-auto">
                        {" "}
                        <button
                          type="button"
                          onClick={() => setServiceCategoryTab("all")}
                          className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all relative flex items-center justify-between cursor-pointer ${serviceCategoryTab === "all" ? "bg-slate-50 text-slate-900 border-r-4 border-r-blue-600 font-extrabold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
                        >
                          {" "}
                          <span>All Services</span>{" "}
                        </button>{" "}
                        {availableCategoryTabs.map((tab) => {
                          const isActive = serviceCategoryTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setServiceCategoryTab(tab.id)}
                              className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all relative flex items-center justify-between cursor-pointer ${isActive ? "bg-slate-50 text-slate-900 border-r-4 border-r-blue-600 font-extrabold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"}`}
                            >
                              {" "}
                              <span>{tab.label}</span>{" "}
                            </button>
                          );
                        })}{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* RIGHT CONTENT PANEL */}{" "}
                    <div className="flex-1 min-w-0 w-full pl-0 lg:pl-5 space-y-8 font-sans">
                      {" "}
                      {/* 1. HOTEL BOOKINGS SECTION */}{" "}
                      {(serviceCategoryTab === "all" ||
                        serviceCategoryTab === "hotels") && (
                        <div>
                          {" "}
                          <div className="flex items-center justify-between mb-3">
                            {" "}
                            <h3 className="text-base font-bold text-slate-900">
                              Hotel Bookings
                            </h3>{" "}
                          </div>{" "}
                          {categorizedServices.hotels.length === 0 ? (
                            <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                              {" "}
                              No Hotel Bookings for this Trip.{" "}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                              {" "}
                              <table className="w-full text-left border-collapse text-xs">
                                {" "}
                                <thead>
                                  {" "}
                                  <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                                    {" "}
                                    <th className="py-2.5 px-4 w-[28%] font-semibold">
                                      Hotel
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[26%] font-semibold">
                                      Stay and Services
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[22%] font-semibold">
                                      Status
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] font-semibold">
                                      Tag/Comments
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                                      Price
                                    </th>{" "}
                                  </tr>{" "}
                                </thead>{" "}
                                <tbody className="divide-y divide-slate-100">
                                  {" "}
                                  {categorizedServices.hotels.map(
                                    (service, idx) => (
                                      <tr
                                        key={service.referenceServiceKey || idx}
                                        className="hover:bg-slate-50/50"
                                      >
                                        {" "}
                                        {/* Hotel info */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-0.5">
                                            {" "}
                                            <span className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1">
                                              {" "}
                                              {service.serviceName}{" "}
                                              <BedDouble
                                                size={12}
                                                className="text-blue-500 shrink-0"
                                              />{" "}
                                            </span>{" "}
                                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                                              {" "}
                                              {service.city ||
                                                selectedQuery?.destination ||
                                                selectedQuery?.destinationName ||
                                                ""}{" "}
                                              {getStarRatingDisplay(
                                                service,
                                                selectedQuery,
                                              ) ? (
                                                <span className="text-amber-500 font-bold">
                                                  {" "}
                                                  {" • " +
                                                    getStarRatingDisplay(
                                                      service,
                                                      selectedQuery,
                                                    )}{" "}
                                                </span>
                                              ) : null}{" "}
                                            </span>{" "}
                                            <div className="mt-1 text-[11px]">
                                              {" "}
                                              <span className="font-semibold text-slate-700">
                                                CNF:{" "}
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                {" "}
                                                {service.confirmationNumber
                                                  ? service.confirmationNumber
                                                  : "N/A"}{" "}
                                              </span>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Stay and Services */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <span className="font-bold text-slate-900">
                                              {" "}
                                              {formatServiceDate(
                                                service.resolvedServiceDate,
                                              )}
                                              {service.stayLabel
                                                ? ` - ${service.stayLabel}`
                                                : service.nights
                                                  ? ` - ${service.nights} Night${service.nights > 1 ? "s" : ""}`
                                                  : ""}{" "}
                                            </span>{" "}
                                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                                              {" "}
                                              <p>
                                                {service.displayDescription ||
                                                  service.description ||
                                                  "Room Stay & Meals"}
                                              </p>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Status */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                                              {" "}
                                              <CheckCircle
                                                size={13}
                                                className="text-emerald-600"
                                              />{" "}
                                              <span>
                                                {service.status === "Confirmed"
                                                  ? "Booked"
                                                  : service.status ||
                                                    "Booked"}{" "}
                                                <span className="text-slate-500 font-normal text-[10px]">
                                                  {service.supplierName ||
                                                    service.vendorName ||
                                                    "Direct Hotel"}
                                                </span>
                                              </span>{" "}
                                            </div>{" "}
                                            <p className="text-[10px] text-slate-400">
                                              {" "}
                                              by{" "}
                                              {service.confirmedBy ||
                                                selectedQuery?.confirmedBy ||
                                                selectedQuery?.agentName ||
                                                "Operations"}{" "}
                                              •{" "}
                                              {formatTimeAgo(
                                                service.updatedAt ||
                                                  selectedQuery?.updatedAt ||
                                                  selectedQuery?.createdAt,
                                              )}{" "}
                                            </p>{" "}
                                            {(() => {
                                              const vInfo =
                                                getServiceVoucherStatusInfo(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenVoucherModal(
                                                      service,
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                                >
                                                  {" "}
                                                  <FileText
                                                    size={12}
                                                    className="text-slate-500 shrink-0"
                                                  />{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <AlertCircle
                                                    size={12}
                                                    className={`${vInfo.iconClass} shrink-0`}
                                                  />{" "}
                                                  <span
                                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                                  >
                                                    {" "}
                                                    {vInfo.label}{" "}
                                                  </span>{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <RefreshCw
                                                    size={11}
                                                    className="text-slate-400 shrink-0"
                                                  />{" "}
                                                </button>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Tag/Comments */}{" "}
                                        <td className="py-3 px-4 align-top text-[11px]">
                                          {" "}
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            {" "}
                                            <span>
                                              {getServiceTagCommentsDisplay(
                                                service,
                                              )}
                                            </span>{" "}
                                            <Edit3
                                              size={12}
                                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                                              onClick={() =>
                                                handleOpenEditTagModal(service)
                                              }
                                              title="Edit Tag/Comments"
                                            />{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Price */}{" "}
                                        <td className="py-3 px-4 align-top text-end text-[11px]">
                                          {" "}
                                          <div className="flex flex-col items-end gap-1">
                                            {" "}
                                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                                              {" "}
                                              <CheckCircle
                                                size={12}
                                                className="text-emerald-600 shrink-0"
                                              />{" "}
                                              <span>
                                                Booking:{" "}
                                                <span className="text-[10px] text-slate-500">
                                                  INR
                                                </span>{" "}
                                                {formatServiceMoney(
                                                  "INR",
                                                  getResolvedServiceDisplayTotal(
                                                    service,
                                                  ),
                                                ).replace(/[^0-9,.]/g, "")}
                                              </span>{" "}
                                            </div>{" "}
                                            {(() => {
                                              const payStatus =
                                                getServicePaymentStatusDisplay(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <div className="flex flex-col items-end gap-0.5">
                                                  {" "}
                                                  <span
                                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                                  >
                                                    {" "}
                                                    Amount Paid:{" "}
                                                    <span className="text-[9px] font-normal">
                                                      INR
                                                    </span>{" "}
                                                    {payStatus.paidText}{" "}
                                                  </span>{" "}
                                                  <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                                  >
                                                    {" "}
                                                    {payStatus.statusBadge}{" "}
                                                  </span>{" "}
                                                </div>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                      </tr>
                                    ),
                                  )}{" "}
                                </tbody>{" "}
                              </table>{" "}
                            </div>
                          )}{" "}
                        </div>
                      )}{" "}
                      {/* 2. OPERATIONAL SERVICES SECTION */}{" "}
                      {(serviceCategoryTab === "all" ||
                        serviceCategoryTab === "operational") && (
                        <div>
                          {" "}
                          <div className="flex items-center justify-between mb-3">
                            {" "}
                            <h3 className="text-base font-bold text-slate-900">
                              Operational Services
                            </h3>{" "}
                          </div>{" "}
                          {categorizedServices.operational.length === 0 ? (
                            <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                              {" "}
                              No Operational Services for this Trip.{" "}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                              {" "}
                              <table className="w-full text-left border-collapse text-xs">
                                {" "}
                                <thead>
                                  {" "}
                                  <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                                    {" "}
                                    <th className="py-2.5 px-4 w-[28%] font-semibold">
                                      Service
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[26%] font-semibold">
                                      Date & Details
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[22%] font-semibold">
                                      Status
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] font-semibold">
                                      Tag/Comments
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                                      Price
                                    </th>{" "}
                                  </tr>{" "}
                                </thead>{" "}
                                <tbody className="divide-y divide-slate-100">
                                  {" "}
                                  {categorizedServices.operational.map(
                                    (service, idx) => (
                                      <tr
                                        key={service.referenceServiceKey || idx}
                                        className="hover:bg-slate-50/50"
                                      >
                                        {" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-0.5">
                                            {" "}
                                            <span
                                              className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1 cursor-pointer"
                                              onClick={() =>
                                                handleOpenVoucherModal(service)
                                              }
                                            >
                                              {" "}
                                              {service.serviceName}{" "}
                                              <CarFront
                                                size={12}
                                                className="text-amber-600 shrink-0"
                                              />{" "}
                                            </span>{" "}
                                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                                              {" "}
                                              {service.city ||
                                                selectedQuery?.destination ||
                                                "Transfer"}{" "}
                                              •{" "}
                                              {service.vehicleType ||
                                                service.vehicle ||
                                                service.displayQuantityLabel ||
                                                service.unitLabel ||
                                                "Vehicle"}{" "}
                                            </span>{" "}
                                            <div className="mt-1 text-[11px]">
                                              {" "}
                                              <span className="font-semibold text-slate-700">
                                                CNF:{" "}
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                {" "}
                                                {service.confirmationNumber
                                                  ? service.confirmationNumber
                                                  : "N/A"}{" "}
                                              </span>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <span className="font-bold text-slate-900">
                                              {" "}
                                              {formatServiceDate(
                                                service.resolvedServiceDate,
                                              )}
                                              {service.stayLabel
                                                ? ` - ${service.stayLabel}`
                                                : service.days
                                                  ? ` - ${service.days} Day${service.days > 1 ? "s" : ""}`
                                                  : ""}{" "}
                                            </span>{" "}
                                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                                              {" "}
                                              <p>
                                                {service.displayDescription ||
                                                  service.description ||
                                                  "Local Transfer"}
                                              </p>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                                              {" "}
                                              <CheckCircle
                                                size={13}
                                                className="text-emerald-600"
                                              />{" "}
                                              <span>
                                                {service.status === "Confirmed"
                                                  ? "Booked"
                                                  : service.status ||
                                                    "Booked"}{" "}
                                                <span className="text-slate-500 font-normal text-[10px]">
                                                  {service.supplierName ||
                                                    service.vendorName ||
                                                    "Cab Vendor"}
                                                </span>
                                              </span>{" "}
                                            </div>{" "}
                                            <p className="text-[10px] text-slate-400">
                                              {" "}
                                              by{" "}
                                              {service.confirmedBy ||
                                                selectedQuery?.confirmedBy ||
                                                selectedQuery?.agentName ||
                                                "Operations"}{" "}
                                              •{" "}
                                              {formatTimeAgo(
                                                service.updatedAt ||
                                                  selectedQuery?.updatedAt ||
                                                  selectedQuery?.createdAt,
                                              )}{" "}
                                            </p>{" "}
                                            {(() => {
                                              const vInfo =
                                                getServiceVoucherStatusInfo(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenVoucherModal(
                                                      service,
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                                >
                                                  {" "}
                                                  <FileText
                                                    size={12}
                                                    className="text-slate-500 shrink-0"
                                                  />{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <AlertCircle
                                                    size={12}
                                                    className={`${vInfo.iconClass} shrink-0`}
                                                  />{" "}
                                                  <span
                                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                                  >
                                                    {" "}
                                                    {vInfo.label}{" "}
                                                  </span>{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <RefreshCw
                                                    size={11}
                                                    className="text-slate-400 shrink-0"
                                                  />{" "}
                                                </button>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top text-[11px]">
                                          {" "}
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            {" "}
                                            <span>
                                              {getServiceTagCommentsDisplay(
                                                service,
                                              )}
                                            </span>{" "}
                                            <Edit3
                                              size={12}
                                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                                              onClick={() =>
                                                handleOpenEditTagModal(service)
                                              }
                                              title="Edit Tag/Comments"
                                            />{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top text-end text-[11px]">
                                          {" "}
                                          <div className="flex flex-col items-end gap-1">
                                            {" "}
                                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                                              {" "}
                                              <CheckCircle
                                                size={12}
                                                className="text-emerald-600 shrink-0"
                                              />{" "}
                                              <span>
                                                Booking:{" "}
                                                <span className="text-[10px] text-slate-500">
                                                  INR
                                                </span>{" "}
                                                {formatServiceMoney(
                                                  "INR",
                                                  getResolvedServiceDisplayTotal(
                                                    service,
                                                  ),
                                                ).replace(/[^0-9,.]/g, "")}
                                              </span>{" "}
                                            </div>{" "}
                                            {(() => {
                                              const payStatus =
                                                getServicePaymentStatusDisplay(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <div className="flex flex-col items-end gap-0.5">
                                                  {" "}
                                                  <span
                                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                                  >
                                                    {" "}
                                                    Amount Paid:{" "}
                                                    <span className="text-[9px] font-normal">
                                                      INR
                                                    </span>{" "}
                                                    {payStatus.paidText}{" "}
                                                  </span>{" "}
                                                  <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                                  >
                                                    {" "}
                                                    {payStatus.statusBadge}{" "}
                                                  </span>{" "}
                                                </div>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                      </tr>
                                    ),
                                  )}{" "}
                                </tbody>{" "}
                              </table>{" "}
                            </div>
                          )}{" "}
                        </div>
                      )}{" "}
                      {/* 3. SIGHTSEEING SERVICES SECTION */}{" "}
                      {(serviceCategoryTab === "all" ||
                        serviceCategoryTab === "sightseeing") && (
                        <div>
                          {" "}
                          <div className="flex items-center justify-between mb-3">
                            {" "}
                            <h3 className="text-base font-bold text-slate-900">
                              Sightseeing Services
                            </h3>{" "}
                          </div>{" "}
                          {categorizedServices.sightseeing.length === 0 ? (
                            <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                              {" "}
                              No Sightseeing Services for this Trip.{" "}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                              {" "}
                              <table className="w-full text-left border-collapse text-xs">
                                {" "}
                                <thead>
                                  {" "}
                                  <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                                    {" "}
                                    <th className="py-2.5 px-4 w-[28%] font-semibold">
                                      Sightseeing
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[26%] font-semibold">
                                      Date & Details
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[22%] font-semibold">
                                      Status
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] font-semibold">
                                      Tag/Comments
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                                      Price
                                    </th>{" "}
                                  </tr>{" "}
                                </thead>{" "}
                                <tbody className="divide-y divide-slate-100">
                                  {" "}
                                  {categorizedServices.sightseeing.map(
                                    (service, idx) => (
                                      <tr
                                        key={service.referenceServiceKey || idx}
                                        className="hover:bg-slate-50/50"
                                      >
                                        {" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-0.5">
                                            {" "}
                                            <span
                                              className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1 cursor-pointer"
                                              onClick={() =>
                                                handleOpenVoucherModal(service)
                                              }
                                            >
                                              {" "}
                                              {service.serviceName}{" "}
                                              <MapPin
                                                size={12}
                                                className="text-emerald-600 shrink-0"
                                              />{" "}
                                            </span>{" "}
                                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                                              {" "}
                                              {service.city ||
                                                selectedQuery?.destination ||
                                                "Sightseeing Tour"}{" "}
                                              •{" "}
                                              {service.duration ||
                                                service.sightseeingType ||
                                                service.tourType ||
                                                service.unitLabel ||
                                                "Tour"}{" "}
                                            </span>{" "}
                                            <div className="mt-1 text-[11px]">
                                              {" "}
                                              <span className="font-semibold text-slate-700">
                                                CNF:{" "}
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                {" "}
                                                {service.confirmationNumber
                                                  ? service.confirmationNumber
                                                  : "N/A"}{" "}
                                              </span>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <span className="font-bold text-slate-900">
                                              {" "}
                                              {formatServiceDate(
                                                service.resolvedServiceDate,
                                              )}
                                              {service.stayLabel
                                                ? ` - ${service.stayLabel}`
                                                : service.days
                                                  ? ` - ${service.days} Day${service.days > 1 ? "s" : ""}`
                                                  : ""}{" "}
                                            </span>{" "}
                                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                                              {" "}
                                              <p>
                                                {service.displayDescription ||
                                                  service.description ||
                                                  "Full Day Sightseeing"}
                                              </p>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                                              {" "}
                                              <CheckCircle
                                                size={13}
                                                className="text-emerald-600"
                                              />{" "}
                                              <span>
                                                {service.status === "Confirmed"
                                                  ? "Booked"
                                                  : service.status ||
                                                    "Booked"}{" "}
                                                <span className="text-slate-500 font-normal text-[10px]">
                                                  {service.supplierName ||
                                                    service.vendorName ||
                                                    "Tour Guide"}
                                                </span>
                                              </span>{" "}
                                            </div>{" "}
                                            <p className="text-[10px] text-slate-400">
                                              {" "}
                                              by{" "}
                                              {service.confirmedBy ||
                                                selectedQuery?.confirmedBy ||
                                                selectedQuery?.agentName ||
                                                "Operations"}{" "}
                                              •{" "}
                                              {formatTimeAgo(
                                                service.updatedAt ||
                                                  selectedQuery?.updatedAt ||
                                                  selectedQuery?.createdAt,
                                              )}{" "}
                                            </p>{" "}
                                            {(() => {
                                              const vInfo =
                                                getServiceVoucherStatusInfo(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenVoucherModal(
                                                      service,
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                                >
                                                  {" "}
                                                  <FileText
                                                    size={12}
                                                    className="text-slate-500 shrink-0"
                                                  />{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <AlertCircle
                                                    size={12}
                                                    className={`${vInfo.iconClass} shrink-0`}
                                                  />{" "}
                                                  <span
                                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                                  >
                                                    {" "}
                                                    {vInfo.label}{" "}
                                                  </span>{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <RefreshCw
                                                    size={11}
                                                    className="text-slate-400 shrink-0"
                                                  />{" "}
                                                </button>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top text-[11px]">
                                          {" "}
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            {" "}
                                            <span>
                                              {getServiceTagCommentsDisplay(
                                                service,
                                              )}
                                            </span>{" "}
                                            <Edit3
                                              size={12}
                                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                                              onClick={() =>
                                                handleOpenEditTagModal(service)
                                              }
                                              title="Edit Tag/Comments"
                                            />{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top text-end text-[11px]">
                                          {" "}
                                          <div className="flex flex-col items-end gap-1">
                                            {" "}
                                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                                              {" "}
                                              <CheckCircle
                                                size={12}
                                                className="text-emerald-600 shrink-0"
                                              />{" "}
                                              <span>
                                                Booking:{" "}
                                                <span className="text-[10px] text-slate-500">
                                                  INR
                                                </span>{" "}
                                                {formatServiceMoney(
                                                  "INR",
                                                  getResolvedServiceDisplayTotal(
                                                    service,
                                                  ),
                                                ).replace(/[^0-9,.]/g, "")}
                                              </span>{" "}
                                            </div>{" "}
                                            {(() => {
                                              const payStatus =
                                                getServicePaymentStatusDisplay(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <div className="flex flex-col items-end gap-0.5">
                                                  {" "}
                                                  <span
                                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                                  >
                                                    {" "}
                                                    Amount Paid:{" "}
                                                    <span className="text-[9px] font-normal">
                                                      INR
                                                    </span>{" "}
                                                    {payStatus.paidText}{" "}
                                                  </span>{" "}
                                                  <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                                  >
                                                    {" "}
                                                    {payStatus.statusBadge}{" "}
                                                  </span>{" "}
                                                </div>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                      </tr>
                                    ),
                                  )}{" "}
                                </tbody>{" "}
                              </table>{" "}
                            </div>
                          )}{" "}
                        </div>
                      )}{" "}
                      {/* 4. ACTIVITY BOOKINGS SECTION */}{" "}
                      {(serviceCategoryTab === "all" ||
                        serviceCategoryTab === "activities") && (
                        <div>
                          {" "}
                          <div className="flex items-center justify-between mb-3">
                            {" "}
                            <h3 className="text-base font-bold text-slate-900">
                              Activity Bookings
                            </h3>{" "}
                          </div>{" "}
                          {categorizedServices.activities.length === 0 ? (
                            <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                              {" "}
                              No Activity Bookings for this Trip.{" "}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                              {" "}
                              <table className="w-full text-left border-collapse text-xs">
                                {" "}
                                <thead>
                                  {" "}
                                  <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                                    {" "}
                                    <th className="py-2.5 px-4 w-[28%] font-semibold">
                                      Activity
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[26%] font-semibold">
                                      Date & Details
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[22%] font-semibold">
                                      Status
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] font-semibold">
                                      Tag/Comments
                                    </th>{" "}
                                    <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                                      Price
                                    </th>{" "}
                                  </tr>{" "}
                                </thead>{" "}
                                <tbody className="divide-y divide-slate-100">
                                  {" "}
                                  {categorizedServices.activities.map(
                                    (service, idx) => (
                                      <tr
                                        key={service.referenceServiceKey || idx}
                                        className="hover:bg-slate-50/50"
                                      >
                                        {" "}
                                        {/* Activity Info with CNF */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-0.5">
                                            {" "}
                                            <span
                                              className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1 cursor-pointer"
                                              onClick={() =>
                                                handleOpenVoucherModal(service)
                                              }
                                            >
                                              {" "}
                                              {service.serviceName}{" "}
                                              <Sparkles
                                                size={12}
                                                className="text-violet-600 shrink-0"
                                              />{" "}
                                            </span>{" "}
                                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                                              {" "}
                                              {service.city ||
                                                selectedQuery?.destination ||
                                                "Activity Pass"}{" "}
                                              •{" "}
                                              {service.duration ||
                                                service.activityType ||
                                                service.unitLabel ||
                                                "Activity"}{" "}
                                            </span>{" "}
                                            <div className="mt-1 text-[11px]">
                                              {" "}
                                              <span className="font-semibold text-slate-700">
                                                CNF:{" "}
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                {" "}
                                                {service.confirmationNumber
                                                  ? service.confirmationNumber
                                                  : "N/A"}{" "}
                                              </span>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <span className="font-bold text-slate-900">
                                              {" "}
                                              {formatServiceDate(
                                                service.resolvedServiceDate,
                                              )}
                                              {service.stayLabel
                                                ? ` - ${service.stayLabel}`
                                                : service.days
                                                  ? ` - ${service.days} Day${service.days > 1 ? "s" : ""}`
                                                  : ""}{" "}
                                            </span>{" "}
                                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                                              {" "}
                                              <p>
                                                {service.displayDescription ||
                                                  service.description ||
                                                  "Adventure Activity"}
                                              </p>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Status */}{" "}
                                        <td className="py-3 px-4 align-top">
                                          {" "}
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            {" "}
                                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                                              {" "}
                                              <CheckCircle
                                                size={13}
                                                className="text-emerald-600"
                                              />{" "}
                                              <span>
                                                {service.status === "Confirmed"
                                                  ? "Booked"
                                                  : service.status ||
                                                    "Booked"}{" "}
                                                <span className="text-slate-500 font-normal text-[10px]">
                                                  {service.supplierName ||
                                                    service.vendorName ||
                                                    "Activity Host"}
                                                </span>
                                              </span>{" "}
                                            </div>{" "}
                                            <p className="text-[10px] text-slate-400">
                                              {" "}
                                              by{" "}
                                              {service.confirmedBy ||
                                                selectedQuery?.confirmedBy ||
                                                selectedQuery?.agentName ||
                                                "Operations"}{" "}
                                              •{" "}
                                              {formatTimeAgo(
                                                service.updatedAt ||
                                                  selectedQuery?.updatedAt ||
                                                  selectedQuery?.createdAt,
                                              )}{" "}
                                            </p>{" "}
                                            {(() => {
                                              const vInfo =
                                                getServiceVoucherStatusInfo(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenVoucherModal(
                                                      service,
                                                    )
                                                  }
                                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                                >
                                                  {" "}
                                                  <FileText
                                                    size={12}
                                                    className="text-slate-500 shrink-0"
                                                  />{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <AlertCircle
                                                    size={12}
                                                    className={`${vInfo.iconClass} shrink-0`}
                                                  />{" "}
                                                  <span
                                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                                  >
                                                    {" "}
                                                    {vInfo.label}{" "}
                                                  </span>{" "}
                                                  <span className="text-amber-400 text-[10px]">
                                                    •
                                                  </span>{" "}
                                                  <RefreshCw
                                                    size={11}
                                                    className="text-slate-400 shrink-0"
                                                  />{" "}
                                                </button>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        <td className="py-3 px-4 align-top text-[11px]">
                                          {" "}
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            {" "}
                                            <span>
                                              {getServiceTagCommentsDisplay(
                                                service,
                                              )}
                                            </span>{" "}
                                            <Edit3
                                              size={12}
                                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                                              onClick={() =>
                                                handleOpenEditTagModal(service)
                                              }
                                              title="Edit Tag/Comments"
                                            />{" "}
                                          </div>{" "}
                                        </td>{" "}
                                        {/* Price matching image */}{" "}
                                        <td className="py-3 px-4 align-top text-end text-[11px]">
                                          {" "}
                                          <div className="flex flex-col items-end gap-1">
                                            {" "}
                                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                                              {" "}
                                              <CheckCircle
                                                size={12}
                                                className="text-emerald-600 shrink-0"
                                              />{" "}
                                              <span>
                                                Booking:{" "}
                                                <span className="text-[10px] text-slate-500">
                                                  INR
                                                </span>{" "}
                                                {formatServiceMoney(
                                                  "INR",
                                                  getResolvedServiceDisplayTotal(
                                                    service,
                                                  ),
                                                ).replace(/[^0-9,.]/g, "")}
                                              </span>{" "}
                                            </div>{" "}
                                            {(() => {
                                              const payStatus =
                                                getServicePaymentStatusDisplay(
                                                  service,
                                                  selectedQuery,
                                                );
                                              return (
                                                <div className="flex flex-col items-end gap-0.5">
                                                  {" "}
                                                  <span
                                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                                  >
                                                    {" "}
                                                    Amount Paid:{" "}
                                                    <span className="text-[9px] font-normal">
                                                      INR
                                                    </span>{" "}
                                                    {payStatus.paidText}{" "}
                                                  </span>{" "}
                                                  <span
                                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                                  >
                                                    {" "}
                                                    {payStatus.statusBadge}{" "}
                                                  </span>{" "}
                                                </div>
                                              );
                                            })()}{" "}
                                          </div>{" "}
                                        </td>{" "}
                                      </tr>
                                    ),
                                  )}{" "}
                                </tbody>{" "}
                              </table>{" "}
                            </div>
                          )}{" "}
                        </div>
                      )}{" "}
                      {/* BOTTOM SERVICES TOTAL SUMMARY CARD (Matching Image 2) */}{" "}
                      <div className="flex justify-end mt-4 mb-2">
                        {" "}
                        <div className="bg-white border border-slate-200/90 shadow-2xs rounded-lg px-4 py-2 flex items-center gap-2">
                          {" "}
                          <span className="text-xs font-bold text-slate-700">
                            Total:
                          </span>{" "}
                          <span className="text-[10px] text-slate-400 font-medium">
                            INR
                          </span>{" "}
                          <span className="text-base font-extrabold text-slate-900">
                            {" "}
                            {formatServiceMoney(
                              "INR",
                              totalServicesBookingCost,
                            ).replace(/[^0-9,.]/g, "")}{" "}
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="bg-slate-900 text-white rounded-2xl p-4 mt-6 flex items-center justify-between shadow-sm">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <div className="p-2 bg-blue-600 rounded-xl text-white">
                            {" "}
                            <FileText size={18} />{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <h4 className="font-bold text-xs">
                              Service Confirmation & Voucher Vault
                            </h4>{" "}
                            <p className="text-[11px] text-slate-300">
                              Click on any service's{" "}
                              <span className="text-amber-400 font-bold">
                                Voucher Pending
                              </span>{" "}
                              or edit button above to generate and issue its
                              voucher in the modal.
                            </p>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                {detailTab === "accounting" && (
                  <motion.div
                    key="accounting-tab-panel"
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.995,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      scale: 0.995,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut",
                    }}
                    className="mt-2 mb-2"
                  >
                    {" "}
                    <div className="flex flex-col lg:flex-row items-stretch gap-0 overflow-hidden font-sans bg-white">
                      {" "}
                      {/* LEFT SUB-SIDEBAR NAVIGATION (Compact Width w-40 matching Sembark) */}{" "}
                      <div className="w-full lg:w-40 shrink-0 bg-white border-r border-slate-200/80 py-1 font-sans">
                        {" "}
                        <div className="flex lg:flex-col overflow-x-auto">
                          {" "}
                          <button
                            type="button"
                            onClick={() => setAccountingSubTab("payments")}
                            className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${accountingSubTab === "payments" ? "bg-[#f8fafc] text-slate-900 font-bold" : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"}`}
                          >
                            {" "}
                            <span>Payments</span>{" "}
                            {accountingSubTab === "payments" && (
                              <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
                            )}{" "}
                          </button>{" "}
                          <button
                            type="button"
                            onClick={() => setAccountingSubTab("proforma")}
                            className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${accountingSubTab === "proforma" ? "bg-[#f8fafc] text-slate-900 font-bold" : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"}`}
                          >
                            {" "}
                            <span>Proforma Invoice</span>{" "}
                            {accountingSubTab === "proforma" && (
                              <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
                            )}{" "}
                          </button>{" "}
                        </div>{" "}
                      </div>{" "}
                      {/* RIGHT CONTENT AREA (White Canvas with Light Gray Inner Section Blocks matching Image 1) */}{" "}
                      <div className="flex-1 min-w-0 w-full px-3 lg:px-4 pt-3 pb-3 space-y-5 bg-white">
                        {" "}
                        {accountingSubTab === "payments" && (
                          <div className="space-y-5 font-sans">
                            {" "}
                            {/* SECTION 1: PAYMENTS FROM FINANCE */}{" "}
                            <div>
                              {" "}
                              <h3 className="text-base font-bold text-slate-900 mb-2.5">
                                Payments from Finance
                              </h3>{" "}
                              {/* Light Gray Section Wrapper matching Image 1 */}{" "}
                              <div className="w-full bg-[#f1f5f9] p-3.5 lg:p-4.5 flex flex-col lg:flex-row items-start gap-3.5 lg:gap-5 rounded-xs border border-slate-200/50">
                                {" "}
                                {/* Left summary stat block */}{" "}
                                <div className="w-full lg:w-44 shrink-0 py-1 flex flex-col justify-start">
                                  {" "}
                                  <p className="text-xs font-bold text-slate-900">
                                    INR
                                  </p>{" "}
                                  <div className="mt-1 text-3xl font-extrabold text-[#15803d] tracking-tight leading-none">
                                    {" "}
                                    +{" "}
                                    {customerPaidAmount.toLocaleString(
                                      "en-IN",
                                    )}{" "}
                                  </div>{" "}
                                  <div className="mt-1.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1 leading-none">
                                    {" "}
                                    <span className="text-slate-400 font-normal text-xl">
                                      /
                                    </span>{" "}
                                    <span>
                                      {customerTotalAmount.toLocaleString(
                                        "en-IN",
                                      )}
                                    </span>{" "}
                                  </div>{" "}
                                  <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 font-normal leading-tight">
                                    {" "}
                                    <p>
                                      Created by{" "}
                                      {selectedQuery?.agentName &&
                                      !selectedQuery.agentName.includes("DDLC")
                                        ? selectedQuery.agentName
                                        : "Finance Team"}
                                      ,{" "}
                                      {formatTimeAgo(selectedQuery?.createdAt)}
                                    </p>{" "}
                                    <p>
                                      Last Updated{" "}
                                      {formatTimeAgo(selectedQuery?.updatedAt)}
                                    </p>{" "}
                                  </div>{" "}
                                </div>{" "}
                                {/* Right Installment list */}{" "}
                                <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-sm p-3.5 lg:p-4 shadow-2xs space-y-3">
                                  {" "}
                                  <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-2 border-b border-slate-200/80 gap-2">
                                    {" "}
                                    <div className="col-span-2">
                                      Amount (INR)
                                    </div>{" "}
                                    <div className="col-span-3">Status</div>{" "}
                                    <div className="col-span-2">Due Date</div>{" "}
                                    <div className="col-span-5">
                                      Comments
                                    </div>{" "}
                                  </div>{" "}
                                  {customerInstallments.length > 0 ? (
                                    customerInstallments.map((inst, idx) => (
                                      <div
                                        key={idx}
                                        className="grid grid-cols-12 text-xs items-start py-2.5 border-b border-slate-100 last:border-0 gap-2"
                                      >
                                        {" "}
                                        <div className="col-span-2 font-extrabold text-slate-900 text-sm">
                                          {" "}
                                          ₹
                                          {Number(
                                            inst.amount || 0,
                                          ).toLocaleString("en-IN")}{" "}
                                        </div>{" "}
                                        <div className="col-span-3">
                                          {" "}
                                          <div className="flex flex-col gap-0.5">
                                            {" "}
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 text-[11px] w-fit whitespace-nowrap mb-0.5">
                                              {" "}
                                              <span>
                                                Paid:{" "}
                                                {formatServiceDate(
                                                  inst.paymentDate ||
                                                    inst.createdAt,
                                                )}
                                              </span>{" "}
                                              <FileText
                                                size={11}
                                                className="text-slate-400 cursor-pointer hover:text-slate-700"
                                              />{" "}
                                              <RefreshCw
                                                size={11}
                                                className="text-slate-400 cursor-pointer hover:text-slate-700"
                                              />{" "}
                                            </div>{" "}
                                            <p className="text-[11px] text-slate-700 font-medium leading-tight">
                                              {" "}
                                              {inst.paidByName &&
                                              !inst.paidByName.includes("DDLC")
                                                ? inst.paidByName
                                                : "Finance Team"}{" "}
                                            </p>{" "}
                                            <p className="text-[10.5px] text-slate-500 font-normal leading-tight">
                                              {" "}
                                              Trip ID:{" "}
                                              {selectedQuery?.queryId}{" "}
                                            </p>{" "}
                                            {inst.utrNumber && (
                                              <p className="text-[10.5px] text-slate-500 font-normal leading-tight break-all">
                                                {" "}
                                                UTR: {inst.utrNumber}{" "}
                                              </p>
                                            )}{" "}
                                          </div>{" "}
                                        </div>{" "}
                                        <div className="col-span-2 text-xs font-semibold text-slate-700 pt-0.5 text-left whitespace-nowrap">
                                          {" "}
                                          {formatServiceDate(
                                            inst.dueDate || inst.paymentDate,
                                          )}{" "}
                                        </div>{" "}
                                        <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 min-w-0">
                                          {" "}
                                          <span className="text-xs text-slate-500 font-medium flex items-start gap-1 min-w-0 break-words pr-1">
                                            {" "}
                                            <MessageSquare
                                              size={12}
                                              className="shrink-0 mt-0.5"
                                            />{" "}
                                            <span className="break-words">
                                              {inst.financeNotes ||
                                                "Payout confirmed by finance"}
                                            </span>{" "}
                                          </span>{" "}
                                          <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-semibold shrink-0 whitespace-nowrap">
                                            {" "}
                                            <CheckCircle
                                              size={11}
                                              className="text-emerald-600"
                                            />{" "}
                                            Verified{" "}
                                            <Maximize2
                                              size={10}
                                              className="text-slate-400 cursor-pointer"
                                            />{" "}
                                          </span>{" "}
                                        </div>{" "}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                      {" "}
                                      No customer payment installments received
                                      yet.{" "}
                                    </div>
                                  )}{" "}
                                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                                    {" "}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigate("/agent/bookings", {
                                          state: {
                                            openBookingId:
                                              selectedQuery?.invoice?._id ||
                                              selectedQuery?._id ||
                                              selectedQuery?.queryId,
                                            paymentOnly: true,
                                          },
                                        });
                                      }}
                                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50/80 rounded cursor-pointer transition-all shadow-2xs"
                                    >
                                      {" "}
                                      View Payment Breakdown{" "}
                                    </button>{" "}
                                  </div>{" "}
                                </div>{" "}
                              </div>{" "}
                            </div>{" "}
                            {/* SECTION 2: PAYMENTS TO HOTELS & SUPPLIERS */}{" "}
                            <div>
                              {" "}
                              <h3 className="text-base font-bold text-slate-900 mb-2.5">
                                Payments to Hotels & Other Services Suppliers
                              </h3>{" "}
                              <div className="space-y-4">
                                {" "}
                                {referenceServices &&
                                referenceServices.length > 0 ? (
                                  referenceServices.map((service, sIndex) => {
                                    const sKey = getServiceKey(service);
                                    const supplierPayRecord = (
                                      selectedQuery?.existingConfirmation
                                        ?.supplierPayments || []
                                    ).find(
                                      (sp) =>
                                        sp.serviceKey === sKey ||
                                        sp.serviceName === service.serviceName,
                                    );
                                    const installments =
                                      supplierPayRecord?.installments || [];
                                    const serviceTotalCost = Number(
                                      getResolvedServiceDisplayTotal(service) ||
                                        service.total ||
                                        0,
                                    );
                                    const servicePaidAmount =
                                      installments.reduce(
                                        (sum, inst) =>
                                          sum + Number(inst.amount || 0),
                                        0,
                                      );
                                    const supplierName =
                                      service.supplierName ||
                                      service.dmcName ||
                                      supplierPayRecord?.supplierName ||
                                      "Yatra Vacations";
                                    return (
                                      <div
                                        key={sIndex}
                                        className="w-full bg-[#f1f5f9] p-3.5 lg:p-4.5 rounded-xs space-y-3.5 border border-slate-200/50"
                                      >
                                        {" "}
                                        <div>
                                          {" "}
                                          <h4 className="text-base font-extrabold text-slate-900">
                                            {service.serviceName || "Service"}
                                          </h4>{" "}
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {" "}
                                            {service.city ||
                                              selectedQuery?.destination ||
                                              "Delhi"}{" "}
                                            • {serviceTypeLabel(service.type)}{" "}
                                            {service.starRating
                                              ? ` • ${service.starRating}`
                                              : ""}{" "}
                                            {service.confirmationNumber
                                              ? ` • #${service.confirmationNumber}`
                                              : ""}{" "}
                                            {service.voucherNumber
                                              ? ` • BCNF: ${service.voucherNumber}`
                                              : ""}{" "}
                                          </p>{" "}
                                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                            {" "}
                                            Supplier :{" "}
                                            <span className="text-blue-600 font-bold">
                                              {supplierName}
                                            </span>{" "}
                                          </p>{" "}
                                        </div>{" "}
                                        <div className="flex flex-col lg:flex-row items-start gap-3.5 lg:gap-5">
                                          {" "}
                                          <div className="w-full lg:w-44 shrink-0 py-1 flex flex-col justify-start">
                                            {" "}
                                            <p className="text-xs font-bold text-slate-900">
                                              INR
                                            </p>{" "}
                                            <div className="mt-1 text-3xl font-extrabold text-[#15803d] tracking-tight leading-none">
                                              {" "}
                                              +{" "}
                                              {servicePaidAmount.toLocaleString(
                                                "en-IN",
                                              )}{" "}
                                            </div>{" "}
                                            <div className="mt-1.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1 leading-none">
                                              {" "}
                                              <span className="text-slate-400 font-normal text-xl">
                                                /
                                              </span>{" "}
                                              <span>
                                                {serviceTotalCost.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </span>{" "}
                                            </div>{" "}
                                            <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 font-normal leading-tight">
                                              {" "}
                                              <p>Created by DMC Partner</p>{" "}
                                              <p>
                                                Last Updated{" "}
                                                {formatTimeAgo(
                                                  supplierPayRecord?.updatedAt ||
                                                    selectedQuery?.updatedAt,
                                                )}
                                              </p>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                          <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-sm p-3.5 lg:p-4 shadow-2xs space-y-3">
                                            {" "}
                                            <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-2 border-b border-slate-200/80 gap-2">
                                              {" "}
                                              <div className="col-span-2">
                                                Amount (INR)
                                              </div>{" "}
                                              <div className="col-span-3">
                                                Status
                                              </div>{" "}
                                              <div className="col-span-2">
                                                Due Date
                                              </div>{" "}
                                              <div className="col-span-5">
                                                Comments
                                              </div>{" "}
                                            </div>{" "}
                                            {installments.length > 0 ? (
                                              installments.map((inst, iIdx) => (
                                                <div
                                                  key={iIdx}
                                                  className="grid grid-cols-12 text-xs items-start py-2.5 border-b border-slate-100 last:border-0 gap-2"
                                                >
                                                  {" "}
                                                  <div className="col-span-2 font-extrabold text-slate-900 text-sm">
                                                    {" "}
                                                    ₹
                                                    {Number(
                                                      inst.amount || 0,
                                                    ).toLocaleString(
                                                      "en-IN",
                                                    )}{" "}
                                                  </div>{" "}
                                                  <div className="col-span-3">
                                                    {" "}
                                                    <div className="flex flex-col gap-0.5">
                                                      {" "}
                                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 text-[11px] w-fit whitespace-nowrap mb-0.5">
                                                        {" "}
                                                        <span>
                                                          Paid:{" "}
                                                          {formatServiceDate(
                                                            inst.paymentDate,
                                                          )}
                                                        </span>{" "}
                                                      </div>{" "}
                                                      <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                                        {" "}
                                                        DMC →{" "}
                                                        {supplierName}{" "}
                                                      </p>{" "}
                                                      {inst.utrNumber && (
                                                        <p className="text-[10.5px] text-slate-500 font-normal leading-tight break-all">
                                                          {" "}
                                                          UTR:{" "}
                                                          {inst.utrNumber}{" "}
                                                        </p>
                                                      )}{" "}
                                                    </div>{" "}
                                                  </div>{" "}
                                                  <div className="col-span-2 text-xs font-semibold text-slate-700 pt-0.5 text-left whitespace-nowrap">
                                                    {" "}
                                                    {formatServiceDate(
                                                      inst.dueDate ||
                                                        inst.paymentDate,
                                                    )}{" "}
                                                  </div>{" "}
                                                  <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 min-w-0">
                                                    {" "}
                                                    <span className="text-xs text-slate-500 font-medium flex items-start gap-1 min-w-0 break-words pr-1">
                                                      {" "}
                                                      <MessageSquare
                                                        size={12}
                                                        className="shrink-0 mt-0.5"
                                                      />{" "}
                                                      <span className="break-words">
                                                        {inst.comments ||
                                                          "Paid to Supplier"}
                                                      </span>{" "}
                                                    </span>{" "}
                                                    <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-semibold shrink-0 whitespace-nowrap">
                                                      {" "}
                                                      <CheckCircle
                                                        size={11}
                                                        className="text-emerald-600"
                                                      />{" "}
                                                      Verified by{" "}
                                                      {inst.verifiedBy || "DMC"}{" "}
                                                      <Maximize2
                                                        size={10}
                                                        className="text-slate-400 cursor-pointer"
                                                      />{" "}
                                                    </span>{" "}
                                                  </div>{" "}
                                                </div>
                                              ))
                                            ) : (
                                              <div className="py-3 text-center text-xs text-slate-400 font-medium">
                                                {" "}
                                                No supplier payment installments
                                                recorded yet.{" "}
                                              </div>
                                            )}{" "}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100">
                                              {" "}
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleOpenSupplierPaymentModal(
                                                    service,
                                                    supplierName,
                                                    serviceTotalCost,
                                                  )
                                                }
                                                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50/80 rounded cursor-pointer transition-all shadow-2xs"
                                              >
                                                {" "}
                                                Record / Update Supplier
                                                Payment{" "}
                                              </button>{" "}
                                            </div>{" "}
                                          </div>{" "}
                                        </div>{" "}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-4 bg-[#f1f5f9] text-center text-xs text-slate-500 rounded border border-slate-200/50">
                                    {" "}
                                    No services found for supplier payment
                                    tracking.{" "}
                                  </div>
                                )}{" "}
                              </div>{" "}
                            </div>{" "}
                          </div>
                        )}{" "}
                        {accountingSubTab === "proforma" &&
                          (proformaInvoiceData ? (
                            <ProformaInvoiceView
                              invoiceData={proformaInvoiceData}
                              queryData={selectedQuery}
                              onEdit={() => setIsCreatingProforma(true)}
                              onDelete={() => {
                                setProformaInvoiceData(null);
                                toast.success("Proforma Invoice deleted");
                              }}
                              onNew={() => {
                                setProformaInvoiceData(null);
                                setIsCreatingProforma(true);
                              }}
                            />
                          ) : (
                            <div className="w-full font-sans space-y-3">
                              {" "}
                              {/* White Header Strip */}{" "}
                              <div className="w-full bg-white pb-2 flex items-center justify-between border-b border-slate-100">
                                {" "}
                                <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                                  Proforma Invoice
                                </h2>{" "}
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingProforma(true)}
                                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {" "}
                                  <span className="text-sm font-normal">
                                    +
                                  </span>{" "}
                                  <span>New</span>{" "}
                                </button>{" "}
                              </div>{" "}
                              {/* Light Gray Canvas Area */}{" "}
                              <div className="w-full bg-[#f1f5f9] py-11 px-5 min-h-[170px] flex flex-col items-center justify-center text-center rounded-xs border border-slate-200/60">
                                {" "}
                                <h3 className="text-xl sm:text-2xl font-normal text-slate-800 tracking-tight mb-4.5 font-sans">
                                  {" "}
                                  No Proforma Invoice created for this
                                  Trip!{" "}
                                </h3>{" "}
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingProforma(true)}
                                  className="px-6 py-2.5 bg-white border border-[#cbd5e1] rounded-md text-[14px] font-bold text-[#35489e] hover:bg-slate-50 hover:text-[#28377d] shadow-2xs transition-all cursor-pointer"
                                >
                                  {" "}
                                  Create Proforma Invoice{" "}
                                </button>{" "}
                              </div>{" "}
                            </div>
                          ))}{" "}
                        {accountingSubTab === "profit" &&
                          (() => {
                            const prPricing =
                              selectedQuery?.quotationPricing || {};
                            const prMarkup = prPricing.opsMarkup || {};
                            const prTax = prPricing.tax || {};
                            const prGst = prTax.gst || {};
                            const prTcs = prTax.tcs || {};
                            const prCharges = prPricing.opsCharges || {};
                            const prAgentMarkup =
                              selectedQuery?.agentMarkup || {};
                            const costBase = Number(
                              prPricing.baseAmount || prPricing.subTotal || 0,
                            );
                            const markupAmount = Number(prMarkup.amount || 0);
                            const serviceCharge = Number(
                              prCharges.serviceCharge || 0,
                            );
                            const handlingFee = Number(
                              prCharges.handlingFee || 0,
                            );
                            const totalTaxAmount = Number(prTax.totalTax || 0);
                            const gstAmount = Number(prGst.amount || 0);
                            const tcsAmount = Number(prTcs.amount || 0);
                            const tourismFee = Number(
                              prTax.tourismFee?.amount || 0,
                            );
                            const totalTax = gstAmount + tcsAmount + tourismFee;
                            const pkgAmount = Number(
                              selectedQuery?.packagePrice ||
                                prPricing.totalAmount ||
                                0,
                            );
                            const dmcCost = Number(
                              selectedQuery?.dmcCostTotal || 0,
                            );
                            const agentRevenue = Number(
                              selectedQuery?.agentRevenueTotal ||
                                pkgAmount ||
                                0,
                            );
                            const netProfit =
                              agentRevenue > 0 ? agentRevenue - dmcCost : 0;
                            const profitPercent =
                              agentRevenue > 0
                                ? Math.round(
                                    (netProfit / agentRevenue) * 10000,
                                  ) / 100
                                : 0;
                            const hotelServices = (
                              referenceServices || []
                            ).filter(
                              (s) =>
                                String(s.type || "").toLowerCase() === "hotel",
                            );
                            const transportServices = (
                              referenceServices || []
                            ).filter((s) =>
                              ["transfer", "transport", "car"].includes(
                                String(s.type || "").toLowerCase(),
                              ),
                            );
                            const activityServices = (
                              referenceServices || []
                            ).filter(
                              (s) =>
                                String(s.type || "").toLowerCase() ===
                                "activity",
                            );
                            const sightseeingServices = (
                              referenceServices || []
                            ).filter(
                              (s) =>
                                String(s.type || "").toLowerCase() ===
                                "sightseeing",
                            );
                            const flightServices = (
                              referenceServices || []
                            ).filter(
                              (s) =>
                                String(s.type || "").toLowerCase() === "flight",
                            );
                            const hotelTotal = hotelServices.reduce(
                              (sum, s) => sum + Number(s.total || 0),
                              0,
                            );
                            const transportTotal = transportServices.reduce(
                              (sum, s) => sum + Number(s.total || 0),
                              0,
                            );
                            const activityTotal = activityServices.reduce(
                              (sum, s) => sum + Number(s.total || 0),
                              0,
                            );
                            const sightseeingTotal = sightseeingServices.reduce(
                              (sum, s) => sum + Number(s.total || 0),
                              0,
                            );
                            const flightTotal = flightServices.reduce(
                              (sum, s) => sum + Number(s.total || 0),
                              0,
                            );
                            const allBookingsTotal =
                              hotelTotal +
                              transportTotal +
                              activityTotal +
                              sightseeingTotal +
                              flightTotal;
                            const taxAppliedOn = costBase + markupAmount;
                            const agentTrackerPayments =
                              selectedQuery?.agentInvoice?.trackerPayments ||
                              [];
                            const agentReceived = agentTrackerPayments.reduce(
                              (sum, p) => sum + Number(p.amount || 0),
                              0,
                            );
                            const agentDue = pkgAmount - agentReceived;
                            const noServices =
                              !referenceServices ||
                              referenceServices.length === 0;
                            const renderServiceBookingTable = (
                              services,
                              label,
                            ) => {
                              if (!services || services.length === 0)
                                return null;
                              const svcTotal = services.reduce(
                                (sum, s) => sum + Number(s.total || 0),
                                0,
                              );
                              const svcPaid = services.reduce((sum, s) => {
                                const t = Number(s.total || 0);
                                const p = Number(
                                  s.amountPaid ??
                                    s.paidAmount ??
                                    s.payoutAmount ??
                                    0,
                                );
                                return sum + Math.min(p, t > 0 ? t : p);
                              }, 0);
                              const svcDue = svcTotal - svcPaid;
                              return (
                                <>
                                  {" "}
                                  {services.map((svc, idx) => {
                                    const svcPaidAmt = Number(
                                      svc.amountPaid ??
                                        svc.paidAmount ??
                                        svc.payoutAmount ??
                                        0,
                                    );
                                    const svcTotalAmt = Number(svc.total || 0);
                                    const svcDueAmt =
                                      svcTotalAmt -
                                      Math.min(svcPaidAmt, svcTotalAmt);
                                    return (
                                      <tr
                                        key={idx}
                                        className="text-center border-b border-slate-200"
                                      >
                                        {" "}
                                        <td className="py-1 px-1 border-r border-slate-300">
                                          {formatServiceDate(
                                            svc.checkInDate || svc.serviceDate,
                                          )}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300">
                                          {formatServiceDate(
                                            svc.checkOutDate ||
                                              svc.serviceEndDate,
                                          )}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300 font-bold text-slate-900">
                                          {svc.serviceName ||
                                            svc.title ||
                                            label}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300">
                                          {svc.nights || svc.days || "-"}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300 font-semibold">
                                          {svc.supplierName ||
                                            svc.dmcName ||
                                            "-"}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300">
                                          {svc.currency || "INR"}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300">
                                          {Number(
                                            svc.price || 0,
                                          ).toLocaleString("en-IN")}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300 font-bold bg-[#22d3ee] text-slate-950">
                                          ₹{svcTotalAmt.toLocaleString("en-IN")}
                                        </td>{" "}
                                        <td className="py-1 px-1 border-r border-slate-300 font-bold">
                                          ₹
                                          {Math.min(
                                            svcPaidAmt,
                                            svcTotalAmt,
                                          ).toLocaleString("en-IN")}
                                        </td>{" "}
                                        <td className="py-1 px-1">
                                          ₹{svcDueAmt.toLocaleString("en-IN")}
                                        </td>{" "}
                                      </tr>
                                    );
                                  })}{" "}
                                  <tr className="text-center font-bold">
                                    {" "}
                                    <td
                                      colSpan={6}
                                      className="py-1 px-1 border-r border-slate-300 text-end font-bold text-slate-700"
                                    >
                                      Total {label}
                                    </td>{" "}
                                    <td className="py-1 px-1 border-r border-slate-300">
                                      ₹{svcTotal.toLocaleString("en-IN")}
                                    </td>{" "}
                                    <td className="py-1 px-1 border-r border-slate-300">
                                      ₹{svcTotal.toLocaleString("en-IN")}
                                    </td>{" "}
                                    <td className="py-1 px-1 border-r border-slate-300"></td>{" "}
                                    <td className="py-1 px-1 border-r border-slate-300 bg-[#22d3ee] text-slate-950">
                                      ₹{svcTotal.toLocaleString("en-IN")}
                                    </td>{" "}
                                    <td className="py-1 px-1 border-r border-slate-300">
                                      ₹{svcPaid.toLocaleString("en-IN")}
                                    </td>{" "}
                                    <td className="py-1 px-1">
                                      ₹{svcDue.toLocaleString("en-IN")}
                                    </td>{" "}
                                  </tr>{" "}
                                </>
                              );
                            };
                            return (
                              <div className="space-y-5 font-sans">
                                {" "}
                                {/* Top Summary Stat Bar */}{" "}
                                <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs">
                                  {" "}
                                  {noServices ? (
                                    <div className="text-center text-xs text-slate-400 font-medium py-3">
                                      No data available
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-100 text-xs">
                                      {" "}
                                      <div className="px-3">
                                        {" "}
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                          Package Amount
                                        </p>{" "}
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          INR{" "}
                                          <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                                            {pkgAmount.toLocaleString("en-IN")}
                                          </span>
                                        </p>{" "}
                                      </div>{" "}
                                      <div className="px-3">
                                        {" "}
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                          Bookings
                                        </p>{" "}
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          INR{" "}
                                          <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                                            {allBookingsTotal.toLocaleString(
                                              "en-IN",
                                            )}
                                          </span>
                                        </p>{" "}
                                        <p className="text-[9.5px] text-slate-400 mt-0.5">
                                          {" "}
                                          {hotelTotal > 0 &&
                                            `Hotels: INR ${hotelTotal.toLocaleString("en-IN")}`}{" "}
                                          {hotelTotal > 0 &&
                                            transportTotal > 0 &&
                                            " | "}{" "}
                                          {transportTotal > 0 &&
                                            `Transport: INR ${transportTotal.toLocaleString("en-IN")}`}{" "}
                                          {hotelTotal > 0 &&
                                            transportTotal > 0 &&
                                            activityTotal > 0 &&
                                            " | "}{" "}
                                          {activityTotal > 0 &&
                                            `Activities: INR ${activityTotal.toLocaleString("en-IN")}`}{" "}
                                          {allBookingsTotal === 0 &&
                                            "No bookings"}{" "}
                                        </p>{" "}
                                      </div>{" "}
                                      <div className="px-3">
                                        {" "}
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                          Estm. Tax (inc.)
                                        </p>{" "}
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          INR{" "}
                                          <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                                            {totalTax.toLocaleString("en-IN")}
                                          </span>
                                        </p>{" "}
                                      </div>{" "}
                                      <div className="px-3">
                                        {" "}
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                          Estm. Profit
                                        </p>{" "}
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          INR{" "}
                                          <span
                                            className={`text-base font-extrabold block mt-0.5 ${netProfit >= 0 ? "text-slate-900" : "text-red-600"}`}
                                          >
                                            {netProfit.toLocaleString("en-IN")}
                                          </span>
                                        </p>{" "}
                                      </div>{" "}
                                      <div className="px-3">
                                        {" "}
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                          Estm. Profit %
                                        </p>{" "}
                                        <p
                                          className={`text-base font-extrabold mt-2 ${profitPercent >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                        >
                                          {profitPercent.toFixed(2)}%
                                        </p>{" "}
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                </div>{" "}
                                {/* Profit Report Header Bar */}{" "}
                                <div className="flex items-center justify-between pt-1">
                                  {" "}
                                  <h3 className="text-base font-bold text-slate-900">
                                    Profit Report
                                  </h3>{" "}
                                  <div className="flex items-center gap-2 text-xs">
                                    {" "}
                                    <button
                                      type="button"
                                      onClick={handleProfitRefresh}
                                      disabled={profitRefreshing}
                                      className={`p-1.5 rounded border border-slate-200 bg-white cursor-pointer transition-all ${profitRefreshing ? "text-blue-500 animate-spin" : "text-slate-400 hover:text-slate-600"}`}
                                    >
                                      {" "}
                                      <RefreshCw
                                        size={13}
                                        className={
                                          profitRefreshing ? "animate-spin" : ""
                                        }
                                      />{" "}
                                    </button>{" "}
                                    <button
                                      type="button"
                                      onClick={handleProfitCopyToClipboard}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                    >
                                      {" "}
                                      <Copy size={13} /> Copy to Clipboard{" "}
                                    </button>{" "}
                                    <button
                                      type="button"
                                      onClick={handleProfitExcelExport}
                                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                    >
                                      {" "}
                                      <FileSpreadsheet
                                        size={13}
                                        className="text-emerald-600"
                                      />{" "}
                                      Excel{" "}
                                    </button>{" "}
                                  </div>{" "}
                                </div>{" "}
                                {/* Structured Profit Report Excel Sheet Container */}{" "}
                                <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-2xs space-y-3 p-3">
                                  {" "}
                                  {/* SECTION 1: TRIP DETAILS */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Trip Details{" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      {noServices ? (
                                        <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                          No data available
                                        </div>
                                      ) : (
                                        <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Trip ID
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Destinations
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Start Date
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                End Date
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Duration
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Adults
                                              </th>{" "}
                                              <th className="py-1 px-1.5 font-medium">
                                                Children
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            <tr className="text-center font-semibold">
                                              {" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.queryId || "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.destination ||
                                                  "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {formatServiceDate(
                                                  selectedQuery?.startDate,
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {formatServiceDate(
                                                  selectedQuery?.endDate,
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.duration || "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.numberOfAdults ||
                                                  0}
                                              </td>{" "}
                                              <td className="py-1 px-1.5">
                                                {selectedQuery?.numberOfChildren ||
                                                  0}
                                              </td>{" "}
                                            </tr>{" "}
                                          </tbody>{" "}
                                        </table>
                                      )}{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  {/* SECTION 2: SOURCE AND GUEST DETAILS */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Source and Guest Details{" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      {noServices ? (
                                        <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                          No data available
                                        </div>
                                      ) : (
                                        <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Source Name
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Source Contact
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Ref ID
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Guest Name
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Guest Contact
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Sales Team
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Resv. Team
                                              </th>{" "}
                                              <th className="py-1 px-1.5 font-medium">
                                                Ops. Team
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            <tr className="text-center">
                                              {" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-semibold">
                                                {selectedQuery?.agentName ||
                                                  "Direct Query"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.agentInvoice
                                                  ?.invoiceNumber || "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.queryId || "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-slate-900">
                                                {selectedQuery?.customerName ||
                                                  selectedQuery
                                                    ?.travelerDetails?.[0]
                                                    ?.fullName ||
                                                  "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-semibold">
                                                {selectedQuery?.clientEmail ||
                                                  selectedQuery?.customerPhone ||
                                                  "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.agentName ||
                                                  "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {selectedQuery?.agentName ||
                                                  "-"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5">
                                                {selectedQuery?.agentName ||
                                                  "-"}
                                              </td>{" "}
                                            </tr>{" "}
                                          </tbody>{" "}
                                        </table>
                                      )}{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  {/* SECTION 3: LATEST QUOTE DETAILS */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Latest Quote Details{" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      {noServices && !prPricing.totalAmount ? (
                                        <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                          No data available
                                        </div>
                                      ) : (
                                        <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Rounding: 1
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Cost (INR)
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Markup
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Taxes ({prGst.percent || 0}%
                                                applied)
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Total (INR)
                                              </th>{" "}
                                              <th className="py-1 px-1.5 font-medium">
                                                Final Package Price (INR)
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            <tr className="text-center border-b border-slate-200">
                                              {" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-slate-700">
                                                Sub-Total
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                                {costBase.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {markupAmount.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {totalTax.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                                {(
                                                  costBase +
                                                  markupAmount +
                                                  totalTax
                                                ).toLocaleString("en-IN")}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 font-bold bg-[#84cc16] text-black">
                                                {pkgAmount.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                            </tr>{" "}
                                            <tr className="text-center font-bold">
                                              {" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                Total
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {costBase.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {markupAmount.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {totalTax.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300">
                                                {(
                                                  costBase +
                                                  markupAmount +
                                                  totalTax
                                                ).toLocaleString("en-IN")}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 bg-[#84cc16] text-black">
                                                {pkgAmount.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                            </tr>{" "}
                                          </tbody>{" "}
                                        </table>
                                      )}{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  {/* SECTION 4: TRIP CONVERSION DETAILS */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Trip Conversion Details{" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      {noServices ? (
                                        <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                          No data available
                                        </div>
                                      ) : (
                                        <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Converted On
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Currency
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Total
                                              </th>{" "}
                                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                                Received
                                              </th>{" "}
                                              <th className="py-1 px-1.5 font-medium">
                                                Due
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            <tr className="text-center">
                                              {" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-semibold">
                                                {formatServiceDate(
                                                  selectedQuery?.quotationCreatedAt ||
                                                    selectedQuery?.createdAt,
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                                {prPricing.currency || "INR"}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                                {pkgAmount.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                                {agentReceived.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                              <td className="py-1 px-1.5 font-bold text-slate-700">
                                                {agentDue.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </td>{" "}
                                            </tr>{" "}
                                          </tbody>{" "}
                                        </table>
                                      )}{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  {/* SECTION 5: HOTEL RESERVATION BOOKINGS */}{" "}
                                  {hotelServices.length > 0 && (
                                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                                      {" "}
                                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                        {" "}
                                        Hotel Reservation Bookings{" "}
                                      </div>{" "}
                                      <div className="overflow-x-auto">
                                        {" "}
                                        <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Check In
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Check Out
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Hotel
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Nights
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Supplier
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Curr
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Quoted
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Booked
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Status
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Payable
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Paid
                                              </th>{" "}
                                              <th className="py-1 px-1 font-medium">
                                                Net Due
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            {renderServiceBookingTable(
                                              hotelServices,
                                              "Hotel",
                                            )}{" "}
                                          </tbody>{" "}
                                        </table>{" "}
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                  {/* SECTION 5b: TRANSPORT RESERVATION BOOKINGS */}{" "}
                                  {transportServices.length > 0 && (
                                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                                      {" "}
                                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                        {" "}
                                        Transport Reservation Bookings{" "}
                                      </div>{" "}
                                      <div className="overflow-x-auto">
                                        {" "}
                                        <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Travel Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                End Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Service
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Days
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Supplier
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Curr
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Quoted
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Booked
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Status
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Payable
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Paid
                                              </th>{" "}
                                              <th className="py-1 px-1 font-medium">
                                                Net Due
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            {renderServiceBookingTable(
                                              transportServices,
                                              "Transport",
                                            )}{" "}
                                          </tbody>{" "}
                                        </table>{" "}
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                  {/* SECTION 5c: ACTIVITY RESERVATION BOOKINGS */}{" "}
                                  {activityServices.length > 0 && (
                                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                                      {" "}
                                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                        {" "}
                                        Activity Reservation Bookings{" "}
                                      </div>{" "}
                                      <div className="overflow-x-auto">
                                        {" "}
                                        <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Travel Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                End Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Activity
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Days
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Supplier
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Curr
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Quoted
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Booked
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Status
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Payable
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Paid
                                              </th>{" "}
                                              <th className="py-1 px-1 font-medium">
                                                Net Due
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            {renderServiceBookingTable(
                                              activityServices,
                                              "Activity",
                                            )}{" "}
                                          </tbody>{" "}
                                        </table>{" "}
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                  {/* SECTION 5d: SIGHTSEEING RESERVATION BOOKINGS */}{" "}
                                  {sightseeingServices.length > 0 && (
                                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                                      {" "}
                                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                        {" "}
                                        Sightseeing Reservation Bookings{" "}
                                      </div>{" "}
                                      <div className="overflow-x-auto">
                                        {" "}
                                        <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Travel Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                End Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Sightseeing
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Days
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Supplier
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Curr
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Quoted
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Booked
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Status
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Payable
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Paid
                                              </th>{" "}
                                              <th className="py-1 px-1 font-medium">
                                                Net Due
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            {renderServiceBookingTable(
                                              sightseeingServices,
                                              "Sightseeing",
                                            )}{" "}
                                          </tbody>{" "}
                                        </table>{" "}
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                  {/* SECTION 5e: FLIGHT RESERVATION BOOKINGS */}{" "}
                                  {flightServices.length > 0 && (
                                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                                      {" "}
                                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                        {" "}
                                        Flight Reservation Bookings{" "}
                                      </div>{" "}
                                      <div className="overflow-x-auto">
                                        {" "}
                                        <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                                          {" "}
                                          <thead>
                                            {" "}
                                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                              {" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Travel Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                End Date
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Flight
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Pax
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Supplier
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Curr
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Quoted
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Booked
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Status
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Payable
                                              </th>{" "}
                                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                                Net Paid
                                              </th>{" "}
                                              <th className="py-1 px-1 font-medium">
                                                Net Due
                                              </th>{" "}
                                            </tr>{" "}
                                          </thead>{" "}
                                          <tbody>
                                            {" "}
                                            {renderServiceBookingTable(
                                              flightServices,
                                              "Flight",
                                            )}{" "}
                                          </tbody>{" "}
                                        </table>{" "}
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                  {/* No services message */}{" "}
                                  {noServices && (
                                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                                      {" "}
                                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                                        No data available
                                      </div>{" "}
                                    </div>
                                  )}{" "}
                                  {/* SECTION 6: COMPONENT BOOKING PRICES */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Component Booking Prices{" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                                        {" "}
                                        <thead>
                                          {" "}
                                          <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                            {" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Hotels
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Transports
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Activities
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Sightseeing
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Flights
                                            </th>{" "}
                                            <th className="py-1 px-1.5 font-medium">
                                              Total
                                            </th>{" "}
                                          </tr>{" "}
                                        </thead>{" "}
                                        <tbody>
                                          {" "}
                                          <tr className="text-center font-bold">
                                            {" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {hotelTotal > 0 ? (
                                                `₹${hotelTotal.toLocaleString("en-IN")}`
                                              ) : (
                                                <span className="text-slate-400 font-normal">
                                                  -
                                                </span>
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {transportTotal > 0 ? (
                                                `₹${transportTotal.toLocaleString("en-IN")}`
                                              ) : (
                                                <span className="text-slate-400 font-normal">
                                                  -
                                                </span>
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {activityTotal > 0 ? (
                                                `₹${activityTotal.toLocaleString("en-IN")}`
                                              ) : (
                                                <span className="text-slate-400 font-normal">
                                                  -
                                                </span>
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {sightseeingTotal > 0 ? (
                                                `₹${sightseeingTotal.toLocaleString("en-IN")}`
                                              ) : (
                                                <span className="text-slate-400 font-normal">
                                                  -
                                                </span>
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {flightTotal > 0 ? (
                                                `₹${flightTotal.toLocaleString("en-IN")}`
                                              ) : (
                                                <span className="text-slate-400 font-normal">
                                                  -
                                                </span>
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 bg-[#22d3ee] text-slate-950 font-bold">
                                              ₹
                                              {allBookingsTotal.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                          </tr>{" "}
                                        </tbody>{" "}
                                      </table>{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  {/* SECTION 7: BREAKUP (IN INR) */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Breakup (in INR){" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                                        {" "}
                                        <thead>
                                          {" "}
                                          <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                            {" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Component
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Payable
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Markup
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Tax Applied On
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Tax %
                                            </th>{" "}
                                            <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                              Tax Amount
                                            </th>{" "}
                                            <th className="py-1 px-1.5 font-medium">
                                              Collectable
                                            </th>{" "}
                                          </tr>{" "}
                                        </thead>{" "}
                                        <tbody>
                                          {" "}
                                          <tr className="text-center border-b border-slate-200 font-semibold">
                                            {" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-slate-700">
                                              Sub-Total
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                              {dmcCost.toLocaleString("en-IN")}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                              {markupAmount.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300 text-slate-600">
                                              cost + markup
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                              {prGst.percent || 0}%
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {totalTax.toLocaleString("en-IN")}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 font-bold">
                                              {pkgAmount.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                          </tr>{" "}
                                          <tr className="text-center font-bold">
                                            {" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              Total
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              ₹{dmcCost.toLocaleString("en-IN")}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              ₹
                                              {markupAmount.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300 font-medium text-slate-600">
                                              cost + markup
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              {prGst.percent || 0}%
                                            </td>{" "}
                                            <td className="py-1 px-1.5 border-r border-slate-300">
                                              ₹
                                              {totalTax.toLocaleString("en-IN")}
                                            </td>{" "}
                                            <td className="py-1 px-1.5">
                                              ₹
                                              {pkgAmount.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                          </tr>{" "}
                                        </tbody>{" "}
                                      </table>{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  {/* SECTION 8: PROFIT AFTER BOOKINGS */}{" "}
                                  <div className="border border-slate-300 rounded-xs overflow-hidden">
                                    {" "}
                                    <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                                      {" "}
                                      Profit after Bookings{" "}
                                    </div>{" "}
                                    <div className="overflow-x-auto">
                                      {" "}
                                      <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                                        {" "}
                                        <thead>
                                          {" "}
                                          <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                            {" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Curr
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Net Payable
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Markup
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Tax Applied On
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Net Tax %
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Net Tax
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Net Collectable
                                            </th>{" "}
                                            <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                              Net Profit
                                            </th>{" "}
                                            <th className="py-1 px-1 font-medium">
                                              Net Profit %
                                            </th>{" "}
                                          </tr>{" "}
                                        </thead>{" "}
                                        <tbody>
                                          {" "}
                                          <tr className="text-center font-bold">
                                            {" "}
                                            <td className="py-1 px-1 border-r border-slate-300">
                                              {prPricing.currency || "INR"}
                                            </td>{" "}
                                            <td className="py-1 px-1 border-r border-slate-300 bg-[#22d3ee] text-slate-950">
                                              {dmcCost.toLocaleString("en-IN")}
                                            </td>{" "}
                                            <td className="py-1 px-1 border-r border-slate-300">
                                              {markupAmount.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                            <td className="py-1 px-1 border-r border-slate-300 text-slate-600 font-medium">
                                              cost + markup
                                            </td>{" "}
                                            <td className="py-1 px-1 border-r border-slate-300 text-slate-600 font-medium">
                                              {totalTax > 0 ? "exc." : "inc."}
                                            </td>{" "}
                                            <td className="py-1 px-1 border-r border-slate-300">
                                              {totalTax.toLocaleString("en-IN")}
                                            </td>{" "}
                                            <td className="py-1 px-1 border-r border-slate-300 bg-[#84cc16] text-black">
                                              {pkgAmount.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                            <td
                                              className={`py-1 px-1 border-r border-slate-300 ${netProfit >= 0 ? "bg-[#f43f5e] text-white" : "bg-red-100 text-red-700"}`}
                                            >
                                              {netProfit.toLocaleString(
                                                "en-IN",
                                              )}
                                            </td>{" "}
                                            <td
                                              className={`${profitPercent >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                            >
                                              {profitPercent.toFixed(2)}%
                                            </td>{" "}
                                          </tr>{" "}
                                        </tbody>{" "}
                                      </table>{" "}
                                    </div>{" "}
                                  </div>{" "}
                                </div>{" "}
                              </div>
                            );
                          })()}{" "}
                      </div>{" "}
                    </div>{" "}
                  </motion.div>
                )}{" "}
                {detailTab === "internal_invoice" && (
                  <motion.div
                    key="invoice-tab-panel"
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.995,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      scale: 0.995,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut",
                    }}
                  >
                    {" "}
                    <InternalInvoice
                      key={selectedQueryId || "invoice-default"}
                      selectedQuery={selectedQuery}
                      queryServices={referenceServices}
                    />{" "}
                  </motion.div>
                )}{" "}
                {detailTab === "docs" && (
                  <motion.div
                    key="docs-tab-panel"
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.995,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      scale: 0.995,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut",
                    }}
                    className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-[#edf4ff] via-[#f5f8ff] to-[#e8fbf0] p-5 lg:p-6 shadow-sm space-y-6 font-sans"
                  >
                    {" "}
                    {/* Docs Tab Header */}{" "}
                    <div className="flex items-center justify-between pb-4 border-b border-blue-200/50 flex-wrap gap-3">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                          {" "}
                          <FileText size={20} />{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                            {" "}
                            Traveler Documents{" "}
                          </h3>{" "}
                          <p className="text-xs text-slate-600 mt-0.5">
                            {" "}
                            Access passenger passports, visas, and verified ID
                            documents for query{" "}
                            <span className="font-bold text-blue-700">
                              {selectedQuery?.queryId || "-"}
                            </span>
                            .{" "}
                          </p>{" "}
                        </div>{" "}
                      </div>{" "}
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 shadow-2xs">
                        {" "}
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                        {travelerDocumentVerification.status || "Verified"}{" "}
                      </span>{" "}
                    </div>{" "}
                    {/* Summary Stats Cards */}{" "}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      {" "}
                      <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-100/90 via-indigo-50/80 to-white p-4 shadow-2xs">
                        {" "}
                        <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                          Total PAX Count
                        </p>{" "}
                        <p className="text-base font-extrabold text-slate-900 mt-1">
                          {selectedQuery?.passengers ||
                            travelerProfiles.length ||
                            0}{" "}
                          Travelers
                        </p>{" "}
                      </div>{" "}
                      <div className="rounded-xl border border-cyan-200/80 bg-gradient-to-br from-cyan-100/90 via-sky-50/80 to-white p-4 shadow-2xs">
                        {" "}
                        <p className="text-[10px] uppercase font-bold text-cyan-600 tracking-wider">
                          Files Ready
                        </p>{" "}
                        <p className="text-base font-extrabold text-cyan-800 mt-1">
                          {uploadedTravelerDocumentCount} Files Ready
                        </p>{" "}
                      </div>{" "}
                      <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-100/90 via-teal-50/80 to-white p-4 shadow-2xs">
                        {" "}
                        <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                          Supplier Ready
                        </p>{" "}
                        <p className="text-base font-extrabold text-emerald-800 mt-1">
                          {travelersReadyForSupplierHandoff}/
                          {travelerProfiles.length || 0}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Traveler List & File Slots */}{" "}
                    <div className="space-y-4 pt-1">
                      {" "}
                      {travelerProfiles.length > 0 ? (
                        travelerProfiles.map((traveler, index) => (
                          <div
                            key={traveler.id}
                            className="rounded-xl border border-blue-200/50 bg-white/80 backdrop-blur-xs overflow-hidden shadow-2xs"
                          >
                            {" "}
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-100/70 via-indigo-50/50 to-emerald-100/50 border-b border-blue-200/50">
                              {" "}
                              <div className="flex items-center gap-3">
                                {" "}
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-2xs">
                                  {" "}
                                  {index + 1}{" "}
                                </span>{" "}
                                <div>
                                  {" "}
                                  <p className="text-sm font-bold text-slate-900">
                                    {traveler.fullName}
                                  </p>{" "}
                                  <p className="text-xs text-slate-500">
                                    {traveler.travelerType}
                                  </p>{" "}
                                </div>{" "}
                              </div>{" "}
                              <span className="text-xs font-bold text-slate-700 bg-white/90 px-2.5 py-1 rounded border border-blue-200/60 shadow-2xs">
                                {" "}
                                {traveler.uploadedCount}/
                                {traveler.documentSlots.length} DOCS{" "}
                              </span>{" "}
                            </div>{" "}
                            <div className="grid sm:grid-cols-2 gap-3 p-4">
                              {" "}
                              {traveler.documentSlots.map((doc) => (
                                <div
                                  key={doc.key}
                                  className={`rounded-xl p-3.5 border transition-all ${doc.uploaded ? "bg-emerald-50/80 border-emerald-300/80 shadow-2xs" : "bg-white border-slate-200/80"}`}
                                >
                                  {" "}
                                  <div className="flex items-center justify-between mb-2">
                                    {" "}
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                      {doc.label}
                                    </span>{" "}
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${doc.uploaded ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}
                                    >
                                      {" "}
                                      {doc.uploaded
                                        ? "✓ READY"
                                        : "MISSING"}{" "}
                                    </span>{" "}
                                  </div>{" "}
                                  <p className="text-xs font-bold text-slate-900 mb-2 truncate">
                                    {" "}
                                    {doc.fileName || "Not available"}{" "}
                                  </p>{" "}
                                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-3">
                                    {" "}
                                    <div className="bg-white/90 p-2 rounded border border-slate-200/60">
                                      {" "}
                                      <span className="text-[9px] block text-slate-400 font-bold uppercase">
                                        Uploaded
                                      </span>{" "}
                                      <span className="font-medium text-slate-700">
                                        {formatDocumentDateTime(doc.uploadedAt)}
                                      </span>{" "}
                                    </div>{" "}
                                    <div className="bg-white/90 p-2 rounded border border-slate-200/60">
                                      {" "}
                                      <span className="text-[9px] block text-slate-400 font-bold uppercase">
                                        Size
                                      </span>{" "}
                                      <span className="font-medium text-slate-700">
                                        {formatDocumentSize(doc.size)}
                                      </span>{" "}
                                    </div>{" "}
                                  </div>{" "}
                                  <div className="flex gap-2">
                                    {" "}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleTravelerDocumentOpen(
                                          traveler,
                                          doc,
                                        )
                                      }
                                      disabled={!doc.uploaded}
                                      className="flex-1 py-1.5 px-3 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                                    >
                                      {" "}
                                      <ExternalLink size={12} /> Open{" "}
                                    </button>{" "}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleTravelerDocumentDownload(
                                          traveler,
                                          doc,
                                        )
                                      }
                                      disabled={
                                        !doc.uploaded ||
                                        downloadingDocumentId ===
                                          `${traveler.id}-${doc.key}`
                                      }
                                      className="flex-1 py-1.5 px-3 text-xs font-bold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                                    >
                                      {" "}
                                      <Download size={12} /> Download{" "}
                                    </button>{" "}
                                  </div>{" "}
                                </div>
                              ))}{" "}
                            </div>{" "}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 text-center py-8 bg-white/70 rounded-xl border border-blue-200/60">
                          No traveler documents found.
                        </div>
                      )}{" "}
                    </div>{" "}
                  </motion.div>
                )}{" "}
              </AnimatePresence>{" "}
            </div>{" "}
          </>
        )}
      </div>{" "}
      {successPopup.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          {" "}
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            {" "}
            <div className="relative bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black px-6 py-7 text-white">
              {" "}
              <button
                onClick={() =>
                  setSuccessPopup((prev) => ({
                    ...prev,
                    open: false,
                  }))
                }
                className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
              >
                {" "}
                <X size={16} />{" "}
              </button>{" "}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                {" "}
                {successPopup.status === "submitted" ? (
                  <ShieldCheck size={28} />
                ) : (
                  <Sparkles size={28} />
                )}{" "}
              </div>{" "}
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-100/90">
                {" "}
                Confirmation Saved{" "}
              </p>{" "}
              <h3 className="mt-2 text-2xl font-semibold leading-tight">
                {" "}
                {successPopup.status === "submitted"
                  ? "Confirmation Submitted Successfully"
                  : "Draft Saved Successfully"}{" "}
              </h3>{" "}
              <p className="mt-2 text-sm text-white/85">
                {" "}
                Your service confirmation has been recorded and is ready for the
                next fulfillment step.{" "}
              </p>{" "}
            </div>{" "}
            <div className="px-6 py-5">
              {" "}
              <div className="grid grid-cols-2 gap-3">
                {" "}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {" "}
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {" "}
                    Query{" "}
                  </p>{" "}
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {" "}
                    {successPopup.queryId || "-"}{" "}
                  </p>{" "}
                </div>{" "}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {" "}
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {" "}
                    Services{" "}
                  </p>{" "}
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {" "}
                    {successPopup.serviceCount} Added{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-blue-950">
                {" "}
                {successPopup.status === "submitted"
                  ? "The confirmation entry is now ready for voucher mapping and downstream ops tracking."
                  : "You can continue editing this draft and submit it once final confirmation numbers are ready."}{" "}
              </div>{" "}
              <div className="mt-5 flex justify-end gap-3">
                {" "}
                <button
                  onClick={() =>
                    setSuccessPopup((prev) => ({
                      ...prev,
                      open: false,
                    }))
                  }
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  {" "}
                  Close{" "}
                </button>{" "}
                <button
                  onClick={() =>
                    setSuccessPopup((prev) => ({
                      ...prev,
                      open: false,
                    }))
                  }
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  {" "}
                  Continue{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* SERVICE CONFIRMATION & VOUCHER GENERATION MODAL */}{" "}
      <AnimatePresence>
        {" "}
        {showVoucherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            {" "}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {" "}
              {/* Modal Header */}{" "}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                {" "}
                <div className="flex items-center gap-2.5">
                  {" "}
                  <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                    {" "}
                    <FileText size={16} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold">
                      Service Confirmation & Emergency Support
                    </h3>{" "}
                    <p className="text-[11px] text-slate-300">
                      {" "}
                      {activeVoucherService?.serviceName ||
                        "Selected Booking Service"}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              {/* Modal Body (Compact, No Vertical Scroll) */}{" "}
              <div className="p-4 space-y-3 text-xs">
                {" "}
                {/* Row 1: Type, Service Name, Service Date */}{" "}
                <div className="grid grid-cols-3 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Service Type *
                    </label>{" "}
                    <input
                      type="text"
                      readOnly
                      value={activeVoucherService?.type || "Hotel"}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Service Name *
                    </label>{" "}
                    <input
                      type="text"
                      value={activeVoucherService?.serviceName || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          serviceName: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Service Date *
                    </label>{" "}
                    <input
                      type="date"
                      value={activeVoucherService?.serviceDate || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          serviceDate: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                {/* Row 2: Status, Confirmation Number (CNF), Voucher Reference */}{" "}
                <div className="grid grid-cols-3 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Booking Status *
                    </label>{" "}
                    <select
                      value={activeVoucherService?.status || "Confirmed"}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50/50 outline-none"
                    >
                      {" "}
                      <option value="Confirmed">Confirmed</option>{" "}
                      <option value="Re-Confirmed">Re-Confirmed</option>{" "}
                      <option value="Pending">Pending</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Confirmation No (CNF) *
                    </label>{" "}
                    <input
                      type="text"
                      value={activeVoucherService?.confirmationNumber || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          confirmationNumber: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                      placeholder="CNF-17241"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Voucher Reference
                    </label>{" "}
                    <input
                      type="text"
                      value={activeVoucherService?.voucherNumber || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          voucherNumber: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                      placeholder="VCH-88219"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                {/* Row 3: Emergency Support */}{" "}
                <div>
                  {" "}
                  <label className="font-semibold text-slate-700 text-[11px] flex items-center gap-1 mb-1">
                    {" "}
                    <Phone size={12} className="text-amber-600" /> Emergency
                    Contact Details (24/7 Local Support) *{" "}
                  </label>{" "}
                  <textarea
                    rows={2}
                    value={activeVoucherService?.emergency || ""}
                    onChange={(e) =>
                      setActiveVoucherService((prev) => ({
                        ...prev,
                        emergency: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-blue-500 bg-amber-50/30"
                    placeholder="Enter local DMC support contact details..."
                  />{" "}
                </div>{" "}
                {/* Row 4: Compact Document Upload Vault (Fixed & Slim - Fits Modal) */}{" "}
                <div>
                  {" "}
                  <p className="font-bold text-slate-800 text-[11px] mb-1.5">
                    Document Upload Vault
                  </p>{" "}
                  <div className="grid grid-cols-3 gap-2.5">
                    {" "}
                    {/* Supplier Confirmation */}{" "}
                    <div className="flex items-center justify-between border border-dashed border-blue-300 rounded-xl p-2 bg-blue-50/40">
                      {" "}
                      <div className="min-w-0 pr-1">
                        {" "}
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          Supplier Confirmation
                        </p>{" "}
                        <p className="text-[9.5px] text-slate-500 truncate">
                          {files.supplier ? files.supplier.name : "PDF / Word"}
                        </p>{" "}
                      </div>{" "}
                      <label className="shrink-0 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs">
                        {" "}
                        Choose{" "}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFile("supplier", e.target.files[0])
                          }
                        />{" "}
                      </label>{" "}
                    </div>{" "}
                    {/* Voucher Reference */}{" "}
                    <div className="flex items-center justify-between border border-dashed border-emerald-300 rounded-xl p-2 bg-emerald-50/40">
                      {" "}
                      <div className="min-w-0 pr-1">
                        {" "}
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          Voucher Reference
                        </p>{" "}
                        <p className="text-[9.5px] text-slate-500 truncate">
                          {files.voucher ? files.voucher.name : "PDF / Word"}
                        </p>{" "}
                      </div>{" "}
                      <label className="shrink-0 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs">
                        {" "}
                        Choose{" "}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFile("voucher", e.target.files[0])
                          }
                        />{" "}
                      </label>{" "}
                    </div>{" "}
                    {/* Terms & Conditions */}{" "}
                    <div className="flex items-center justify-between border border-dashed border-purple-300 rounded-xl p-2 bg-purple-50/40">
                      {" "}
                      <div className="min-w-0 pr-1">
                        {" "}
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          Terms & Conditions
                        </p>{" "}
                        <p className="text-[9.5px] text-slate-500 truncate">
                          {files.terms ? files.terms.name : "PDF / Word"}
                        </p>{" "}
                      </div>{" "}
                      <label className="shrink-0 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs">
                        {" "}
                        Choose{" "}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFile("terms", e.target.files[0])
                          }
                        />{" "}
                      </label>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              {/* Modal Footer */}{" "}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                {" "}
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl bg-white hover:bg-slate-100 cursor-pointer"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={handleSubmitVoucherModal}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {" "}
                  <CheckCircle size={14} /> Generate & Issue Voucher{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
        )}{" "}
        {/* EDIT TAG/COMMENTS MODAL */}{" "}
        {editTagModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            {" "}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              {" "}
              {/* Header */}{" "}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                {" "}
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Tag/Comments
                </h3>{" "}
                <button
                  type="button"
                  onClick={handleCloseEditTagModal}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              {/* Body */}{" "}
              <div className="p-5 space-y-4">
                {" "}
                <div>
                  {" "}
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {" "}
                    Select Tag{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>{" "}
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={editTagModal.tag}
                      onClick={() => setShowTagDropdown(true)}
                      onFocus={() => setShowTagDropdown(true)}
                      onChange={(e) => {
                        setEditTagModal((prev) => ({
                          ...prev,
                          tag: e.target.value,
                        }));
                        setShowTagDropdown(true);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 bg-white cursor-pointer"
                    />{" "}
                    {showTagDropdown && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1 divide-y divide-slate-50">
                        {" "}
                        {[
                          "Pending Reconfirmation",
                          "Payment due for Confirmation",
                          "Reconfirmed",
                        ]
                          .filter((opt) =>
                            opt
                              .toLowerCase()
                              .includes((editTagModal.tag || "").toLowerCase()),
                          )
                          .map((option) => (
                            <label
                              key={option}
                              onClick={() => {
                                setEditTagModal((prev) => ({
                                  ...prev,
                                  tag: option,
                                }));
                                setShowTagDropdown(false);
                              }}
                              className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${editTagModal.tag === option ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-700"}`}
                            >
                              {" "}
                              <input
                                type="radio"
                                name="selectTagOption"
                                checked={editTagModal.tag === option}
                                onChange={() => {
                                  setEditTagModal((prev) => ({
                                    ...prev,
                                    tag: option,
                                  }));
                                  setShowTagDropdown(false);
                                }}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                              />{" "}
                              <span className="text-xs text-slate-800">
                                {option}
                              </span>{" "}
                            </label>
                          ))}{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {" "}
                    Any Comments{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>{" "}
                  </label>{" "}
                  <textarea
                    rows={4}
                    placeholder="Provide any additional comments if necessary"
                    value={editTagModal.comments}
                    onChange={(e) =>
                      setEditTagModal((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 resize-y"
                  />{" "}
                </div>{" "}
              </div>{" "}
              {/* Footer */}{" "}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-start gap-2.5">
                {" "}
                <button
                  type="button"
                  onClick={handleSaveTagComments}
                  disabled={savingTag}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066cc] hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs transition"
                >
                  {" "}
                  {savingTag ? "Saving..." : "Save"}{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={handleCloseEditTagModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer shadow-xs transition"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
        )}{" "}
        {/* Supplier Payment Modal */}{" "}
        {supplierPaymentModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            {" "}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {" "}
              {/* Modal Header */}{" "}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <h3 className="text-sm font-bold">
                    Record Supplier Payment
                  </h3>{" "}
                  <p className="text-xs text-slate-300">
                    {" "}
                    {supplierPaymentModal.service?.serviceName} •{" "}
                    {supplierPaymentModal.supplierName}{" "}
                  </p>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={handleCloseSupplierPaymentModal}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              {/* Modal Form */}{" "}
              <div className="p-5 space-y-3.5 text-xs">
                {" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      {" "}
                      Payment Amount (INR){" "}
                      <span className="text-rose-500">*</span>{" "}
                    </label>{" "}
                    <input
                      type="number"
                      placeholder="e.g. 54000"
                      value={supplierPaymentModal.amount}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status
                    </label>{" "}
                    <select
                      value={supplierPaymentModal.status}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {" "}
                      <option value="Paid">Paid</option>{" "}
                      <option value="Partially Paid">Partially Paid</option>{" "}
                      <option value="Pending">Pending</option>{" "}
                    </select>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Date
                    </label>{" "}
                    <input
                      type="date"
                      value={supplierPaymentModal.paymentDate}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          paymentDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Due Date
                    </label>{" "}
                    <input
                      type="date"
                      value={supplierPaymentModal.dueDate}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      UTR / Ref Number
                    </label>{" "}
                    <input
                      type="text"
                      placeholder="e.g. UTR9988223"
                      value={supplierPaymentModal.utrNumber}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          utrNumber: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bank / Mode
                    </label>{" "}
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={supplierPaymentModal.bankName}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block font-semibold text-slate-700 mb-1">
                    Comments / Notes
                  </label>{" "}
                  <textarea
                    rows={3}
                    placeholder="Enter payment confirmation details or notes"
                    value={supplierPaymentModal.comments}
                    onChange={(e) =>
                      setSupplierPaymentModal((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />{" "}
                </div>{" "}
              </div>{" "}
              {/* Modal Footer */}{" "}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                {" "}
                <button
                  type="button"
                  onClick={handleCloseSupplierPaymentModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={handleSaveSupplierPayment}
                  disabled={savingSupplierPayment}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs transition"
                >
                  {" "}
                  {savingSupplierPayment
                    ? "Saving..."
                    : "Save Payment Record"}{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
        )}{" "}
        {/* Customer Payment Summary Modal */}{" "}
        {showCustomerPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            {" "}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {" "}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <h3 className="text-sm font-bold">
                    Customer Payment & Finance Payout Breakdown
                  </h3>{" "}
                  <p className="text-xs text-slate-300">
                    Query ID: {selectedQuery?.queryId}
                  </p>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={() => setShowCustomerPaymentModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              <div className="p-5 space-y-4 text-xs">
                {" "}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {" "}
                  <div>
                    {" "}
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Booking Price
                    </p>{" "}
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {" "}
                      ₹{customerTotalAmount.toLocaleString("en-IN")}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Paid Received
                    </p>{" "}
                    <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                      {" "}
                      ₹{customerPaidAmount.toLocaleString("en-IN")}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Balance Due
                    </p>{" "}
                    <p className="text-base font-extrabold text-amber-600 mt-0.5">
                      {" "}
                      ₹
                      {Math.max(
                        0,
                        customerTotalAmount - customerPaidAmount,
                      ).toLocaleString("en-IN")}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h4 className="font-bold text-slate-900 mb-2">
                    Finance Team Installments / Payout Chunks
                  </h4>{" "}
                  {customerInstallments.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {" "}
                      {customerInstallments.map((inst, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          {" "}
                          <div>
                            {" "}
                            <p className="font-bold text-slate-900">
                              ₹
                              {Number(inst.amount || 0).toLocaleString("en-IN")}
                            </p>{" "}
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {" "}
                              Date:{" "}
                              {formatServiceDate(
                                inst.paymentDate || inst.createdAt,
                              )}{" "}
                              • Paid by:{" "}
                              {inst.paidByName || "Finance Team"}{" "}
                            </p>{" "}
                            {inst.utrNumber && (
                              <p className="text-[10.5px] text-slate-400">
                                UTR: {inst.utrNumber}{" "}
                                {inst.bankName ? `(${inst.bankName})` : ""}
                              </p>
                            )}{" "}
                          </div>{" "}
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10.5px]">
                            {" "}
                            {inst.status || "Verified Paid"}{" "}
                          </span>{" "}
                        </div>
                      ))}{" "}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">
                      No payout installments logged by Finance Team yet.
                    </p>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                {" "}
                <button
                  type="button"
                  onClick={() => setShowCustomerPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  {" "}
                  Close{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
        )}{" "}
      </AnimatePresence>{" "}
    </div>
  );
}
