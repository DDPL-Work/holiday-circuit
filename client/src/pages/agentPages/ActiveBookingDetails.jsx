import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgePercent,
  Building2,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  CreditCard,
  Download,
  FileBadge2,
  FileText,
  IdCard,
  LoaderCircle,
  Upload,
  UserSquare2,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import API from "../../utils/Api";
import CouponBillingModal from "../../modal/CouponBillingModal";

const bankOptions = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank"];
const docOptions = [
  { key: "passport", label: "Passport", icon: FileBadge2, tone: "sky" },
  { key: "governmentId", label: "Govt ID", icon: IdCard, tone: "violet" },
];
const INDIAN_DESTINATION_KEYWORDS = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

const normalizeDoc = (d = {}) => ({ url: String(d?.url || ""), fileName: String(d?.fileName || "") });
const formatCurrency = (v, c = "INR") => `${c} ${Math.round(Number(v || 0)).toLocaleString("en-IN")}`;
const normalizeAmountDigits = (v = "") => String(v || "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const formatAmountInput = (v = "") => {
  const digits = normalizeAmountDigits(v);
  return digits ? Number(digits).toLocaleString("en-IN") : "";
};
const parseAmountInput = (v = "") => Number(normalizeAmountDigits(v) || 0);
const formatDate = (v) => {
  if (!v) return "Pending";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const formatDateTime = (v) => {
  if (!v) return "Pending";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
};
const formatInputDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};
const getBankShortCode = (value = "") =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3) || "BNK";
const statusTone = (s) => s === "Verified"
  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
  : s === "Pending"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : s === "Rejected"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-600";
const resolveDocs = (traveler = {}) => {
  const passport = normalizeDoc(traveler?.documents?.passport);
  const governmentId = normalizeDoc(traveler?.documents?.governmentId || traveler?.documents?.govtId);
  const legacy = normalizeDoc(traveler?.document);
  if (!passport.url && !governmentId.url && legacy.url) {
    return String(traveler?.documentType || "").toLowerCase().includes("id")
      ? { passport, governmentId: legacy }
      : { passport: legacy, governmentId };
  }
  return { passport, governmentId };
};

const Toast = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const tone = feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : feedback.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <div className="fixed right-4 top-4 z-[70] w-full max-w-sm">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${tone}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{feedback.title}</p>
            <p className="mt-1 text-sm leading-5">{feedback.message}</p>
          </div>
          <button type="button" onClick={onClose} className="text-current/70">×</button>
        </div>
      </div>
    </div>
  );
};

const Label = ({ label }) => <div className="mb-2 px-1 text-[13px] font-medium text-slate-700">{label}</div>;

const SnapshotRow = ({ label, value, ok }) => (
  <div className="flex items-center justify-between gap-4 text-[13px]">
    <span className="text-slate-500">{label}</span>
    <span className={`flex items-center gap-2 text-right font-semibold ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : null}
      {value || "Pending"}
    </span>
  </div>
);

const getInitials = (value = "") =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TR";

const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;
  return INDIAN_DESTINATION_KEYWORDS.some((keyword) => normalizedDestination.includes(keyword));
};

const getRequiredDocumentKeys = (isInternationalTrip) =>
  isInternationalTrip ? ["passport", "governmentId"] : ["governmentId"];

function DocCard({ traveler, option, document, disabled, loadingKey, onUpload, onView, isRequired, tripTypeLabel }) {
  const Icon = option.icon;
  const inputRef = useRef(null);
  const uploadKey = `${traveler?._id}-${option.key}`;
  const uploading = loadingKey === uploadKey;
  const uploaded = Boolean(document?.url);
  const slotStatus = uploaded ? "READY" : isRequired ? "REQUIRED" : "OPTIONAL";
  const theme = option.tone === "sky"
    ? {
        shell: "border-sky-200/80 bg-[linear-gradient(160deg,#f0f9ff_0%,#ffffff_48%,#eef6ff_100%)]",
        badge: "bg-sky-100 text-sky-700",
        iconWrap: "bg-sky-100 text-sky-700 ring-sky-200/70",
        panel: uploaded ? "border-sky-200 bg-white/90" : "border-sky-200/70 bg-sky-50/70",
        accent: "bg-sky-500",
        text: "text-sky-700",
        cta: "bg-sky-600 hover:bg-sky-700",
      }
    : {
        shell: "border-violet-200/80 bg-[linear-gradient(160deg,#f7f5ff_0%,#ffffff_48%,#fff4f7_100%)]",
        badge: "bg-violet-100 text-violet-700",
        iconWrap: "bg-violet-100 text-violet-700 ring-violet-200/70",
        panel: uploaded ? "border-violet-200 bg-white/90" : "border-violet-200/70 bg-violet-50/70",
        accent: "bg-violet-500",
        text: "text-violet-700",
        cta: "bg-violet-600 hover:bg-violet-700",
      };

  return (
    <div className={`group relative overflow-hidden rounded-[20px] border shadow-[0_18px_35px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-0.5 ${theme.shell}`}>
      <div className={`absolute left-0 top-0 h-full w-1.5 ${theme.accent}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${theme.badge}`}>{option.label}</span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{traveler?.fullName || "Traveler"}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {uploaded
                ? "Document is attached and ready for review."
                : isRequired
                  ? `${option.label} is mandatory for this ${tripTypeLabel.toLowerCase()} trip.`
                  : `${option.label} is optional for this ${tripTypeLabel.toLowerCase()} trip.`}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ring-1 ${theme.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className={`mt-5 rounded-[24px] border px-4 py-4 backdrop-blur ${theme.panel}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Upload Slot</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {uploaded ? document.fileName || `${option.label} uploaded` : `Attach ${option.label}`}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {uploaded
                  ? "Open the file to review or replace it with an updated version."
                  : isRequired
                    ? "Accepted formats: JPG, PNG, WEBP, PDF. This file is required before submission."
                    : "Accepted formats: JPG, PNG, WEBP, PDF. You can upload this if available."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${uploaded ? "bg-emerald-100 text-emerald-700" : isRequired ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{slotStatus}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isRequired ? "bg-amber-100 text-amber-700" : "border border-slate-200 bg-white text-slate-500"}`}>
                {isRequired ? "Mandatory" : "Optional"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {uploaded ? <button type="button" onClick={() => onView(document)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">View File</button> : null}
            <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || uploading} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:bg-slate-300 ${theme.cta}`}>
              {uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploaded ? "Replace Upload" : "Upload Now"}
            </button>
          </div>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => onUpload(e, traveler, option)} />
        </div>
      </div>
      {uploading ? <div className="absolute inset-0 flex items-center justify-center bg-white/70"><div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"><LoaderCircle className="h-4 w-4 animate-spin" />Uploading...</div></div> : null}
    </div>
  );
}

export default function ActiveBookingDetails({ onClose, booking, onBookingUpdated, documentPortalContext }) {
  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };
  const paymentSubmission = booking?.paymentSubmission || {};
  const paymentVerification = booking?.paymentVerification || {};
  const travelerVerification = booking?.travelerDocumentVerification || { status: "Draft" };
  const invoiceId = booking?.invoiceId || booking?.invoice?._id || "";
  const queryId = booking?._id || booking?.query?._id || "";
  const currency = booking?.currency || booking?.invoice?.currency || "INR";
  const paymentStatus = paymentVerification?.status || (paymentSubmission?.submittedAt ? "Pending" : "Draft");
  const isRejectedPayment = paymentStatus === "Rejected";
  const currentReceipt = isRejectedPayment ? {} : paymentSubmission?.receipt || {};
  const docsUnlocked = paymentStatus === "Verified" || booking?.paymentStatus === "Paid";
  const [feedback, setFeedback] = useState(null);
  const [bankName, setBankName] = useState(isRejectedPayment ? "" : paymentSubmission?.bankName || "");
  const [bankMenuOpen, setBankMenuOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
  const [quotationAmount, setQuotationAmount] = useState("");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(isRejectedPayment ? "" : formatInputDate(paymentSubmission?.paymentDate));
  const [remarks, setRemarks] = useState(isRejectedPayment ? "" : booking?.remarks || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [isPaymentUpdateOpen, setIsPaymentUpdateOpen] = useState(true);
  const [payableQuotationAmount, setPayableQuotationAmount] = useState(0);
  const bankDropdownRef = useRef(null);

  const travelers = useMemo(() => (Array.isArray(booking?.travelerDetails) ? booking.travelerDetails : []).map((t) => ({ ...t, docs: resolveDocs(t) })), [booking?.travelerDetails]);
  const initialQuotationAmount = useMemo(
    () =>
      Math.round(
        Number(
          paymentSubmission?.couponApplication?.payableAmount ||
          paymentSubmission?.amount ||
          booking?.totalAmount ||
          booking?.invoice?.totalAmount ||
          booking?.quotation?.clientTotalAmount ||
          booking?.quotation?.pricingTotalAmount ||
          0,
        ),
      ),
    [
      booking?.invoice?.totalAmount,
      booking?.quotation?.clientTotalAmount,
      booking?.quotation?.pricingTotalAmount,
      booking?.totalAmount,
      paymentSubmission?.amount,
      paymentSubmission?.couponApplication?.payableAmount,
    ],
  );
  const isInternationalTrip = useMemo(() => {
    const explicitQuoteCategory = String(
      booking?.quotation?.quoteCategory || booking?.pricingSnapshot?.quoteCategory || booking?.invoice?.pricingSnapshot?.quoteCategory || "",
    )
      .trim()
      .toLowerCase();
    if (explicitQuoteCategory === "international") return true;
    if (explicitQuoteCategory === "domestic") return false;
    return Boolean(booking?.destination) && !isIndianDestination(booking.destination);
  }, [booking?.destination, booking?.invoice?.pricingSnapshot?.quoteCategory, booking?.pricingSnapshot?.quoteCategory, booking?.quotation?.quoteCategory]);
  const tripTypeLabel = isInternationalTrip ? "International" : "Domestic";
  const requiredDocKeys = useMemo(() => getRequiredDocumentKeys(isInternationalTrip), [isInternationalTrip]);
  const travelersWithStatus = useMemo(
    () =>
      travelers.map((traveler) => {
        const requiredReadyCount = requiredDocKeys.filter((key) => Boolean(traveler.docs?.[key]?.url)).length;
        const uploadedDocCount = docOptions.filter((option) => Boolean(traveler.docs?.[option.key]?.url)).length;
        return {
          ...traveler,
          requiredReadyCount,
          uploadedDocCount,
          isDocDeskComplete: requiredReadyCount === requiredDocKeys.length,
        };
      }),
    [requiredDocKeys, travelers],
  );
  const requiredDocCount = useMemo(
    () => travelersWithStatus.reduce((sum, traveler) => sum + traveler.requiredReadyCount, 0),
    [travelersWithStatus],
  );
  const totalRequiredDocSlots = travelers.length * requiredDocKeys.length;
  const allDocsReady = travelers.length > 0 && travelersWithStatus.every((traveler) => traveler.isDocDeskComplete);
  const docProgress = totalRequiredDocSlots ? Math.round((requiredDocCount / totalRequiredDocSlots) * 100) : 0;
  const notify = (type, title, message) => setFeedback({ type, title, message });
  const snapshotBank = bankName || (!isRejectedPayment ? paymentSubmission?.bankName || "" : "");
  const snapshotUtr = utrNumber || (!isRejectedPayment ? paymentSubmission?.utrNumber || "" : "");
  const snapshotQuotationAmount = quotationAmount;
  const snapshotPaymentDate = paymentDate || (!isRejectedPayment ? paymentSubmission?.paymentDate || "" : "");
  const snapshotReceiptName = receiptFile?.name || currentReceipt?.fileName || "";
  const reviewBanner = paymentStatus === "Rejected"
    ? { tone: "border-red-200 bg-red-50 text-red-700", title: paymentVerification?.reviewedByName ? `Rejected by ${paymentVerification.reviewedByName}` : "Rejected by Finance", msg: paymentVerification?.rejectionReason || "Corrections were requested by finance." }
    : paymentStatus === "Verified"
      ? { tone: "border-emerald-200 bg-emerald-50 text-emerald-700", title: "Payment verified by finance", msg: "Payment is cleared. Traveler document uploads are unlocked now." }
      : paymentSubmission?.submittedAt
        ? { tone: "border-blue-200 bg-blue-50 text-blue-700", title: "Finance review in progress", msg: "Finance will verify your bank, UTR, receipt, and payment date." }
        : null;

  useEffect(() => {
    setBankName(isRejectedPayment ? "" : paymentSubmission?.bankName || "");
    setBankMenuOpen(false);
    setUtrNumber(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
    setQuotationAmount("");
    setPayableQuotationAmount(initialQuotationAmount);
    setPaymentDate(isRejectedPayment ? "" : formatInputDate(paymentSubmission?.paymentDate));
    setRemarks(isRejectedPayment ? "" : booking?.remarks || "");
    setReceiptFile(null);
  }, [
    booking?.invoiceId,
    initialQuotationAmount,
    booking?.remarks,
    isRejectedPayment,
    paymentSubmission?.amount,
    paymentSubmission?.bankName,
    paymentSubmission?.paymentDate,
    paymentSubmission?.receipt?.fileName,
    paymentSubmission?.receipt?.url,
    paymentSubmission?.utrNumber,
  ]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!bankDropdownRef.current?.contains(event.target)) {
        setBankMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setBankMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleView = (doc) => doc?.url && window.open(doc.url, "_blank", "noopener,noreferrer");
  const handleDownloadReceipt = () => currentReceipt?.url && window.open(currentReceipt.url, "_blank", "noopener,noreferrer");

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const resolvedQuotationAmount = parseAmountInput(quotationAmount);
    if (!invoiceId) return notify("error", "Invoice Missing", "This booking does not have an invoice ready for payment submission.");
    if (!bankName.trim() || !utrNumber.trim() || !paymentDate || !resolvedQuotationAmount) return notify("error", "Missing Fields", "Quotation amount, bank name, UTR, and payment date are required.");
    if (!receiptFile && !currentReceipt?.url) return notify("error", "Receipt Missing", isRejectedPayment ? "Please upload the corrected payment receipt before resubmitting." : "Please upload the payment receipt before submitting.");
    try {
      setSubmittingPayment(true);
      const fd = new FormData();
      fd.append("bankName", bankName.trim());
      fd.append("utrNumber", utrNumber.trim().toUpperCase());
      fd.append("paymentDate", paymentDate);
      fd.append("remarks", remarks.trim());
      fd.append("paymentAmount", String(resolvedQuotationAmount));
      fd.append("onBehalfOf", booking?.invoiceNumber || booking?.bookingReference || "Booking Payment");
      if (receiptFile) fd.append("paymentReceipt", receiptFile);
      const { data } = await API.put(`/agent/invoices/${invoiceId}/payment-status`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onBookingUpdated?.({ type: "payment", invoice: data?.invoice });
      setReceiptFile(null);
      notify("success", "Payment Submitted", data?.message || "Payment submitted for verification.");
    } catch (error) {
      notify("error", "Submission Failed", error?.response?.data?.message || "Unable to submit payment right now.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUploadDoc = async (e, traveler, option) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!docsUnlocked) return notify("warning", "Payment Review Pending", "Traveler documents unlock only after finance verifies the payment.");
    const key = `${traveler?._id}-${option.key}`;
    try {
      setUploadingKey(key);
      const fd = new FormData();
      fd.append("travelerDocument", file);
      fd.append("documentType", option.label);
      const { data } = await API.put(`/agent/queries/${queryId}/travelers/${traveler?._id}/document`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onBookingUpdated?.({ type: "traveler-document", query: data?.query });
      notify("success", "Document Uploaded", data?.message || `${option.label} uploaded successfully.`);
    } catch (error) {
      notify("error", "Upload Failed", error?.response?.data?.message || "Unable to upload traveler document right now.");
    } finally {
      setUploadingKey("");
    }
  };

  const handleSubmitDocs = async () => {
    if (!allDocsReady) {
      notify(
        "warning",
        "Required Documents Missing",
        isInternationalTrip
          ? "International trip ke liye har traveler ka Passport aur Govt ID upload karna mandatory hai."
          : "Domestic trip ke liye har traveler ka kam se kam Govt ID upload karna mandatory hai. Passport optional hai.",
      );
      return;
    }
    try {
      setSubmittingDocs(true);
      const { data } = await API.patch(`/agent/queries/${queryId}/traveler-documents/submit`);
      onBookingUpdated?.({ type: "traveler-document", query: data?.query });
      notify("success", "Documents Submitted", data?.message || "Traveler documents submitted for ops review.");
    } catch (error) {
      notify("error", "Submission Failed", error?.response?.data?.message || "Unable to submit traveler documents right now.");
    } finally {
      setSubmittingDocs(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="min-h-screen bg-[#f5f8fc] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <Toast feedback={feedback} onClose={() => setFeedback(null)} />
      <motion.div variants={item} className="mb-5 flex flex-col gap-4 rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">{booking?.destination || "Booking Details"}</h1>
            <p className="mt-1 text-sm text-slate-500">{booking?.bookingReference || booking?.invoiceNumber || "Booking Pending"} · {booking?.dates || "Dates pending"}</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${booking?.displayStatus?.className || "bg-slate-100 text-slate-700"}`}>{booking?.displayStatus?.label || "Booking Pending"}</span>
      </motion.div>


{/*------------------------- Payment Update card start here ----------------------------*/}

   <motion.section variants={item} className="overflow-hidden rounded-[20px] bg-white">

  {/* ── HEADER ── */}
  <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-6">
    {/* Decorative background blobs */}
    <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />

    <div className="relative flex flex-col gap-5 pr-24 sm:pr-28 xl:flex-row xl:items-start xl:justify-between">

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_8px_24px_rgba(16,185,129,0.35)]">
          {/* Banknote / Payment icon — unique solid feel */}
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <rect x="2" y="6" width="20" height="13" rx="2.5" strokeLinejoin="round" />
            <circle cx="12" cy="12.5" r="2.5" />
            <path d="M6 9.5h.01M18 15.5h.01" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          {/* Step pill progress */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 ring-1 ring-emerald-400/30">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-bold text-white">1</div>
              <span className="text-[10px] font-semibold text-emerald-300">Payment Details</span>
            </div>
            <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/40">2</div>
              <span className="text-[10px] font-medium text-white/40">Booking Confirmation</span>
            </div>
          </div>

          <h2 className="text-[20px] font-bold tracking-tight text-white">Payment Update</h2>
          <p className="mt-0.5 max-w-[600px] text-[12px] leading-5 text-slate-400">
            Submit payment details before booking confirmation and traveler document verification.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsPaymentUpdateOpen((prev) => !prev)}
        className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
        aria-expanded={isPaymentUpdateOpen}
      >
        <span>{isPaymentUpdateOpen ? "Hide" : "Show"}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPaymentUpdateOpen ? "rotate-180" : ""}`} />
      </button>
    </div>
  </div>

  {/* ── BODY ── */}
  {isPaymentUpdateOpen ? <div className="grid gap-6 bg-slate-50/40 px- py-6 xl:grid-cols-[minmax(0,1.3fr)_368px]">

    {/* LEFT: form */}
    <div className="space-y-4">

      {reviewBanner ? (
        <div className={`rounded-2xl border px-5 py-4 ${reviewBanner.tone}`}>
          <p className="text-[13px] font-semibold">{reviewBanner.title}</p>
          <p className="mt-1 text-[13px] opacity-90">{reviewBanner.msg}</p>
        </div>
      ) : null}

      <form onSubmit={handlePaymentSubmit} className="space-y-4">

        {/* Row 1: Bank | UTR | Amount */}
        <div className="grid gap-3 xl:grid-cols-3">

          {/* Bank Name */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ring-1 ring-slate-100/60">
            <div className="mb-2.5 flex items-center gap-2">
              {/* Bank building icon */}
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Bank Name</span>
            </div>

            <div
              ref={bankDropdownRef}
              className={`relative rounded-[14px] border bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-2 transition-all duration-200 ${
                bankMenuOpen
                  ? "border-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
                  : "border-slate-200 focus-within:border-emerald-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setBankMenuOpen((prev) => !prev)}
                className={`group flex h-10 w-full items-center gap-2.5 rounded-xl border bg-white pl-3 pr-2.5 text-left transition-all duration-200 ${
                  bankMenuOpen ? "border-emerald-200 shadow-sm" : "border-white/80 hover:border-slate-200"
                }`}
                aria-haspopup="listbox"
                aria-expanded={bankMenuOpen}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" />
                  </svg>
                </div>
                <p className={`flex-1 truncate text-[13px] font-medium ${bankName ? "text-slate-800" : "text-slate-400"}`}>
                  {bankName || "Choose your bank"}
                </p>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                  bankMenuOpen ? "bg-emerald-100 text-emerald-700 rotate-180" : "bg-slate-100 text-slate-400"
                }`}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 9l6 6 6-6" /></svg>
                </div>
              </button>

              {bankMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/96 p-2 shadow-[0_24px_56px_rgba(15,23,42,0.16)] backdrop-blur"
                  role="listbox"
                  aria-label="Bank Name"
                >
                  <div className="rounded-[14px] bg-gradient-to-b from-slate-50 to-white p-1">
                    {bankOptions.map((bank) => {
                      const isSelected = bankName === bank;
                      return (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => { setBankName(bank); setBankMenuOpen(false); }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                            isSelected ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1 ${
                            isSelected ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"
                          }`}>
                            {getBankShortCode(bank)}
                          </div>
                          <p className={`flex-1 truncate text-[13px] font-medium ${isSelected ? "text-emerald-900" : "text-slate-700"}`}>{bank}</p>
                          {isSelected && (
                            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </div>
            <p className="mt-2 px-0.5 text-[11px] leading-4 text-emerald-700">
              Select the bank from which the payment was transferred.
            </p>
          </div>

          {/* UTR */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ring-1 ring-slate-100/60">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                {/* Hash / transaction ref icon */}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">UTR / Transaction ID</span>
            </div>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
              </svg>
              <input
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="SBINR52012345678"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[13px] font-mono text-slate-700 outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <p className="mt-2 px-0.5 text-[11px] leading-4 text-amber-700">
              e.g. 312345678901, HDFC1234567890
            </p>
          </div>

          {/* Quotation Amount */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/60">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  {/* Indian rupee coin icon */}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M9 8h6M9 11h6M9 8a3 3 0 010 6H9l4 5" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Payable Quotation Amount</span>
              </div>
              <button
                type="button"
                onClick={() => setCouponModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                {/* Tag/coupon icon */}
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11.586V6a1 1 0 011-1h5.586a1 1 0 01.707.293l8.414 8.414a2 2 0 010 2.829l-4.172 4.171a2 2 0 01-2.828 0L3.707 12.293A1 1 0 013 11.586z" />
                </svg>
                Apply Coupon
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">₹</span>
              <input
                value={quotationAmount}
                onChange={(e) => setQuotationAmount(formatAmountInput(e.target.value))}
                inputMode="numeric"
                placeholder="Enter amount"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-4 text-[13px] font-semibold text-slate-700 outline-none transition-all focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold leading-4 text-amber-800">
              {payableQuotationAmount > 0 ? `Payable quotation amount: \u20B9 ${payableQuotationAmount.toLocaleString("en-IN")}` : "Payable quotation amount will appear here."}
            </p>
          </div>
        </div>

        {/* Row 2: Date | Remarks */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">

          {/* Payment Date */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/60">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                {/* Calendar with checkmark */}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Payment Date</span>
            </div>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="17" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[13px] text-slate-700 outline-none transition-all focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/60">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                {/* Message/note icon */}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M3 6a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H7l-4 4V6z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Remarks</span>
            </div>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M3 6a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H7l-4 4V6z" />
              </svg>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={1}
                placeholder="Add a quick note for finance if needed…"
                className="min-h-10 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-[13px] text-slate-700 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
              >
              </textarea>
            </div>
          </div>
        </div>

        {/* Receipt Upload */}
        <div>
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              {/* Paperclip / attach icon */}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Payment Receipt</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_6px_16px_rgba(16,185,129,0.3)]">
                  {/* Shield check — conveys security/verified */}
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.96 11.96 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-2.056-.503-3.996-1.398-5.709A11.96 11.96 0 0112 2.964z" />
                  </svg>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-slate-900">
                      {receiptFile?.name || currentReceipt?.fileName || "Receipt ready for upload"}
                    </p>
                    {(receiptFile?.name || currentReceipt?.url) ? (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">Attached</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    {receiptFile?.name
                      ? "New receipt selected. Submit now to send it for finance review."
                      : currentReceipt?.url
                        ? "Receipt file is attached and highlighted for quick review."
                        : isRejectedPayment
                          ? "Previous receipt was reset for correction. Upload the updated proof again."
                          : "Upload your payment proof here. JPG, PNG, WEBP and PDF supported."}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
                {currentReceipt?.url ? (
                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-[12px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    {/* Download icon */}
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" /></svg>
                    Download current receipt
                  </button>
                ) : null}
                <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98]">
                  {/* Cloud upload icon */}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  {currentReceipt?.url ? "Replace receipt" : "Upload receipt"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submittingPayment}
          className="group mx-auto flex h-11 w-full max-w-sm cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_6px_24px_rgba(15,23,42,0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {submittingPayment ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></svg>
          ) : (
            /* Send/paper-plane icon */
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          )}
          {paymentStatus === "Rejected" ? "Correct & Resubmit" : "Submit for Verification"}
        </button>
      </form>
    </div>

    {/* RIGHT: snapshot + finance */}
    <div className="space-y-4">

      {/* Submission Snapshot */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-300 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
          <div className="flex items-center gap-2">
            {/* Clipboard list icon */}
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Current Submission Snapshot</p>
          </div>
        </div>

        <div className="px-5 py-1.5">
          {[
            {
              icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9 8h6M9 11h6M9 8a3 3 0 010 6H9l4 5" /></svg>
              ),
              label: "Quotation Amount",
              value: formatCurrency(parseAmountInput(snapshotQuotationAmount), currency),
              ok: parseAmountInput(snapshotQuotationAmount) > 0,
              color: "text-amber-500",
            },
            {
              icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" /></svg>
              ),
              label: "Bank",
              value: snapshotBank,
              ok: Boolean(snapshotBank),
              color: "text-blue-500",
            },
            {
              icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" /></svg>
              ),
              label: "UTR",
              value: snapshotUtr,
              ok: Boolean(snapshotUtr),
              color: "text-violet-500",
            },
            {
              icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="17" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>
              ),
              label: "Payment Date",
              value: formatDate(snapshotPaymentDate),
              ok: Boolean(snapshotPaymentDate),
              color: "text-sky-500",
            },
            {
              icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" /></svg>
              ),
              label: "Receipt",
              value: snapshotReceiptName,
              ok: Boolean(snapshotReceiptName),
              color: "text-teal-500",
            },
          ].map(({ icon, label, value, ok, color }) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
              <span className={`flex items-center gap-2 text-[12px] text-slate-500 ${color}`}>
                {icon}
                <span className="text-slate-500">{label}</span>
              </span>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                {ok ? (
                  <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.35)]">
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                )}
                {value || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Finance Ownership */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-300 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              {/* Person + shield — finance authority */}
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900">Finance Ownership</p>
              <p className="text-[11px] text-slate-400">Current reviewer & audit timing</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-1.5">
          {[
            {
              label: "Assigned Finance",
              value: booking?.assignedFinanceName || "Awaiting assignment",
              icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            },
            {
              label: "Reviewed By",
              value: booking?.reviewedByName || "Pending",
              icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            },
            {
              label: "Submitted",
              value: formatDateTime(paymentSubmission?.submittedAt),
              icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
            },
            {
              label: "Last Finance Update",
              value: formatDateTime(paymentVerification?.reviewedAt),
              icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
              <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                {icon}
                {label}
              </span>
              <span className="text-right text-[12px] font-semibold text-slate-900">{value || "—"}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${statusTone(paymentStatus)}`}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>
            {paymentStatus}
          </span>
        </div>
      </div>

    </div>
  </div> : null}
</motion.section> 



      <motion.section variants={item} className="mt-6 overflow-hidden rounded-[10px] ">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_rgba(255,255,255,0.96)_38%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#f6fffb_100%)] px-3 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-[760px]">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                  <FileText className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Step 2 of 2</p>
                  <h2 className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-slate-900">Traveler Documentation Desk</h2>
                </div>
              </div>
              <p className="mt-4 max-w-[800px] text-xs leading-7 text-slate-800">
                {isInternationalTrip
                  ? "This is an international trip, so every traveler must upload both Passport and Govt ID before submission."
                  : "This is a domestic trip, so every traveler must upload at least one Govt ID. Passport is optional, and you can still upload both if available."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-[22px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Travelers</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{travelers.length}</p>
                </div>
                <div className="rounded-[22px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Trip Type</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{tripTypeLabel}</p>
                </div>
                <div className="rounded-[22px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Required Docs</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{requiredDocCount}/{totalRequiredDocSlots || 0}</p>
                </div>
                <div className="rounded-[22px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Completion</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{docProgress}%</p>
                </div>
              </div>
            </div>

            <div className="min-w-[300px] rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(travelerVerification?.status || "Draft")}`}>{travelerVerification?.status || "Draft"}</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${allDocsReady ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-50 text-slate-600"}`}>
                  {allDocsReady ? "Submission Ready" : "Uploads In Progress"}
                </span>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>Desk Progress</span>
                  <span>{docProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#14b8a6_100%)] transition-all duration-500" style={{ width: `${docProgress}%` }} />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-[12px] leading-6 text-slate-500">
                <p>1. Uploads unlock only after the payment is verified.</p>
                <p>2. {isInternationalTrip ? "Passport and Govt ID are both mandatory for each traveler." : "Govt ID is mandatory for each traveler. Passport remains optional."}</p>
                <p>3. Submit to operations only when the full desk is complete.</p>
                {!isInternationalTrip ? <p>4. Optional passports can still be uploaded for a more complete traveler file set.</p> : null}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-2 py-6">

        {documentPortalContext?.issueSummary || travelerVerification?.rejectionReason ? <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"><p className="font-semibold">{travelerVerification?.rejectionReason || "Document corrections requested"}</p><p className="mt-1 leading-6">{documentPortalContext?.issueSummary || travelerVerification?.rejectionRemarks || "Please update the highlighted files and submit again."}</p></div> : null}
        {!docsUnlocked ? <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">Finance must verify the payment before traveler document uploads unlock.</div> : null}

        <div className="mt-6 space-y-6">
          {travelersWithStatus.length > 0 ? travelersWithStatus.map((traveler) => (
            <div key={traveler?._id || traveler?.fullName} className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] px-5 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-900 text-sm font-bold text-white shadow-[0_14px_26px_rgba(15,23,42,0.16)]">
                      {getInitials(traveler?.fullName)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{traveler?.fullName || "Traveler"}</p>
                      <p className="mt-1 text-sm text-slate-500">{traveler?.travelerType || "Adult"} traveler document desk</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {traveler.requiredReadyCount}/{requiredDocKeys.length} required ready
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      traveler.isDocDeskComplete
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      {traveler.isDocDeskComplete ? "Desk Complete" : "Action Needed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-[12px] text-slate-600">
                  {docOptions.map((option) => {
                    const ready = Boolean(traveler.docs?.[option.key]?.url);
                    const isRequired = requiredDocKeys.includes(option.key);
                    return (
                      <span key={`${traveler?._id}-${option.key}-summary`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
                        ready ? "bg-emerald-100 text-emerald-700" : isRequired ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-white text-slate-500 border border-slate-200"
                      }`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {option.label} {isRequired ? "(Required)" : "(Optional)"}
                      </span>
                    );
                  })}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {docOptions.map((option) => (
                    <DocCard
                      key={`${traveler?._id}-${option.key}`}
                      traveler={traveler}
                      option={option}
                      document={traveler.docs?.[option.key]}
                      disabled={!docsUnlocked}
                      loadingKey={uploadingKey}
                      onUpload={handleUploadDoc}
                      onView={handleView}
                      isRequired={requiredDocKeys.includes(option.key)}
                      tripTypeLabel={tripTypeLabel}
                    />
                  ))}
                </div>
              </div>
            </div>
          )) : <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">No traveler records are available for this booking yet.</div>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-gray-600">
            {isInternationalTrip
              ? "Submit to operations only after every traveler has both Passport and Govt ID uploaded."
              : "Submit to operations only after every traveler has a Govt ID uploaded. Passport remains optional for domestic trips."}
          </p>
          <button
            type="button"
            onClick={handleSubmitDocs}
            disabled={!docsUnlocked || !allDocsReady || submittingDocs || travelers.length === 0}
            className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-[25px] bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.28)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submittingDocs ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />}
            Submit Traveler Documents
          </button>
        </div>
        </div>
      </motion.section>
      <CouponBillingModal
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        invoiceId={invoiceId}
        subtotalAmount={Number(booking?.totalAmount || 0)}
        currency={currency}
        existingCouponApplication={booking?.paymentSubmission?.couponApplication || null}
        onApplyCoupon={({ payableAmount, invoice }) => {
          setPayableQuotationAmount(Math.round(Number(payableAmount || 0)));
          if (invoice) {
            onBookingUpdated?.({ type: "payment", invoice });
          }
          setCouponModalOpen(false);
          notify("success", "Coupon Applied", "Discounted quotation amount has been added to the payment form.");
        }}
      />
    </motion.div>
  );
}
