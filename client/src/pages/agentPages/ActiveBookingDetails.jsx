import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
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

          <div className="mt-4 grid gap-2 rounded-[20px] border border-white/80 bg-white/80 p-3 text-[11px] text-slate-500 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${uploaded ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span>{uploaded ? "File attached" : isRequired ? "Required upload pending" : "Optional upload slot"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${disabled ? "bg-slate-300" : "bg-blue-500"}`} />
              <span>{disabled ? "Unlock after payment verify" : "Upload enabled"}</span>
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
  const [utrNumber, setUtrNumber] = useState(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
  const [quotationAmount, setQuotationAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(isRejectedPayment ? "" : formatInputDate(paymentSubmission?.paymentDate));
  const [remarks, setRemarks] = useState(isRejectedPayment ? "" : booking?.remarks || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [submittingDocs, setSubmittingDocs] = useState(false);

  const travelers = useMemo(() => (Array.isArray(booking?.travelerDetails) ? booking.travelerDetails : []).map((t) => ({ ...t, docs: resolveDocs(t) })), [booking?.travelerDetails]);
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
    setUtrNumber(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
    setQuotationAmount("");
    setPaymentDate(isRejectedPayment ? "" : formatInputDate(paymentSubmission?.paymentDate));
    setRemarks(isRejectedPayment ? "" : booking?.remarks || "");
    setReceiptFile(null);
  }, [
    booking?.invoiceId,
    booking?.remarks,
    isRejectedPayment,
    paymentSubmission?.amount,
    paymentSubmission?.bankName,
    paymentSubmission?.paymentDate,
    paymentSubmission?.receipt?.fileName,
    paymentSubmission?.receipt?.url,
    paymentSubmission?.utrNumber,
  ]);

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
    <motion.div variants={container} initial="hidden" animate="visible" className="min-h-screen bg-[#f5f8fc]">
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

      <motion.section variants={item} className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CreditCard className="h-6 w-6" /></div>
              <div>
                <h2 className="text-[18px] font-bold text-slate-900">Payment Update</h2>
                <p className="mt-1 max-w-[680px] text-sm text-slate-500">Step 1 of 2. Submit payment details here before booking confirmation and traveler document verification.</p>
              </div>
            </div>
            <div className="min-w-[170px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Finance Desk</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{booking?.assignedFinanceName || "Awaiting Assignment"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <div className="space-y-5">
            {reviewBanner ? <div className={`rounded-[24px] border px-5 py-4 ${reviewBanner.tone}`}><p className="text-sm font-semibold">{reviewBanner.title}</p><p className="mt-1 text-sm opacity-90">{reviewBanner.msg}</p></div> : null}
            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <Label label="Bank Name" />
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[14px] text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white">
                      <option value="">Select Bank</option>
                      {bankOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <Label label="UTR / Transaction ID" />
                  <div className="relative">
                    <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.toUpperCase())} placeholder="SBINR52012345678" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[14px] text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white" />
                  </div>
                  <p className="mt-2 min-h-[32px] px-1 text-[9px] leading-4 text-blue-700">
                    Accepted examples: 312345678901, HDFC1234567890, SBINR52023012345678.
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <Label label="Quotation Amount" />
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={quotationAmount}
                      onChange={(e) => setQuotationAmount(formatAmountInput(e.target.value))}
                      inputMode="numeric"
                      placeholder="1,25,000"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[14px] text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white"
                    />
                  </div>
                  <p className="mt-2 min-h-[32px] px-1 text-[9px] leading-4 text-blue-700">
                    Enter whole amount only. Decimals are not allowed; commas will be added automatically.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <Label label="Payment Date" />
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[14px] text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white" />
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <Label label="Remarks" />
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Add a quick note for finance if needed" className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-[14px] text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">Payment Receipt</label>
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{receiptFile?.name || currentReceipt?.fileName || "Receipt ready for upload"}</p>
                          {(receiptFile?.name || currentReceipt?.url) ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">READY</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {receiptFile?.name
                            ? "New receipt selected. Submit now to send it for finance review."
                            : currentReceipt?.url
                              ? "Receipt file is attached and highlighted for quick review."
                              : isRejectedPayment
                                ? "Previous receipt was reset for correction. Upload the updated proof again."
                                : "Upload your payment proof here. JPG, PNG, WEBP and PDF are supported."}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[250px]">
                      {currentReceipt?.url ? <button type="button" onClick={handleDownloadReceipt} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"><Download className="h-3.5 w-3.5" />Download current receipt</button> : null}
                      <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-slate-800">
                        <Upload className="h-3.5 w-3.5" />{currentReceipt?.url ? "Replace receipt" : "Upload receipt"}
                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submittingPayment} className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-[#0f172a] px-8 py-4 text-sm font-semibold text-white disabled:bg-slate-400">
                {submittingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {paymentStatus === "Rejected" ? "Correct & Resubmit" : "Submit for Verification"}
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <div className="rounded-[26px] border border-slate-200 bg-[#f8fbff] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Current Submission Snapshot</p>
              <div className="mt-5 space-y-2">
                <SnapshotRow label="Quotation Amount" value={formatCurrency(parseAmountInput(snapshotQuotationAmount), currency)} ok={parseAmountInput(snapshotQuotationAmount) > 0} />
                <SnapshotRow label="Bank" value={snapshotBank} ok={Boolean(snapshotBank)} />
                <SnapshotRow label="UTR" value={snapshotUtr} ok={Boolean(snapshotUtr)} />
                <SnapshotRow label="Payment Date" value={formatDate(snapshotPaymentDate)} ok={Boolean(snapshotPaymentDate)} />
                <SnapshotRow label="Receipt" value={snapshotReceiptName} ok={Boolean(snapshotReceiptName)} />
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><UserSquare2 className="h-5 w-5 text-green-700" /></div>
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">Finance Ownership</p>
                  <p className="text-sm text-slate-500">Current reviewer and audit timing</p>
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Assigned Finance</span><span className="text-right font-semibold text-slate-900">{booking?.assignedFinanceName || "Awaiting assignment"}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Reviewed By</span><span className="text-right font-semibold text-slate-900">{booking?.reviewedByName || "Pending"}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Submitted</span><span className="text-right font-semibold text-slate-900">{formatDateTime(paymentSubmission?.submittedAt)}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Last Finance Update</span><span className="text-right font-semibold text-slate-900">{formatDateTime(paymentVerification?.reviewedAt)}</span></div>
                <div className="pt-2"><span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold ${statusTone(paymentStatus)}`}>{paymentStatus}</span></div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={item} className="mt-6 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_rgba(255,255,255,0.96)_38%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#f6fffb_100%)] px-6 py-6">
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
              <p className="mt-4 max-w-[720px] text-sm leading-7 text-slate-600">
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

        <div className="px-6 py-6">

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
          <p className="text-sm text-slate-500">
            {isInternationalTrip
              ? "Submit to operations only after every traveler has both Passport and Govt ID uploaded."
              : "Submit to operations only after every traveler has a Govt ID uploaded. Passport remains optional for domestic trips."}
          </p>
          <button type="button" onClick={handleSubmitDocs} disabled={!docsUnlocked || !allDocsReady || submittingDocs || travelers.length === 0} className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
            {submittingDocs ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Submit Traveler Documents
          </button>
        </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
