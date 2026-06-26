import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgePercent,
  Building2,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Check,
  CreditCard,
  Download,
  FileBadge2,
  FileText,
  Fingerprint,
  IdCard,
  LoaderCircle,
  MapPin,
  Trash2,
  Upload,
  Users,
  UserSquare2,
  Wallet,
  Coins,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/Api";
import CouponBillingModal from "../../modal/CouponBillingModal";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const docOptions = [
  { key: "passport", label: "Passport", icon: FileBadge2, tone: "sky" },
  { key: "governmentId", label: "PAN Card", icon: IdCard, tone: "violet" },
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
const normalizeReceipt = (d = {}) => ({
  url: String(d?.url || ""),
  fileName: String(d?.fileName || ""),
  mimeType: String(d?.mimeType || ""),
  size: Number(d?.size || 0),
});
const formatCurrency = (v, c = "INR") => `${c} ${Math.round(Number(v || 0)).toLocaleString("en-IN")}`;
const normalizeAmountDigits = (v = "") => String(v || "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const formatAmountInput = (v = "") => {
  const digits = normalizeAmountDigits(v);
  return digits ? Number(digits).toLocaleString("en-IN") : "";
};
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
const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const buildTrackerPaymentsFromSubmission = (paymentSubmission = {}) => {
  const trackerEntries = Array.isArray(paymentSubmission?.trackerPayments)
    ? paymentSubmission.trackerPayments
    : [];

  if (trackerEntries.length) {
    return trackerEntries
      .map((entry, index) => {
        const amount = Math.round(Number(entry?.amount || 0));
        if (!Number.isFinite(amount) || amount <= 0) return null;

        const normalizedDate = formatInputDate(entry?.paymentDate || entry?.createdAt || "");
        const receipt = normalizeReceipt(entry?.receipt?.url ? entry.receipt : index === 0 ? paymentSubmission?.receipt : {});
        const financeReceipt = normalizeReceipt(entry?.financeReceipt);
        return {
          id: `${paymentSubmission?.submittedAt || "tracker"}-${index}`,
          persisted: true,
          amount,
          date:
            String(entry?.displayDate || "").trim() ||
            (normalizedDate
              ? new Date(normalizedDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              : "Pending"),
          rawDate: normalizedDate,
          note: String(entry?.note || "").trim(),
          createdAt: entry?.createdAt || null,
          verificationStatus:
            String(entry?.verificationStatus || "").trim() === "Verified"
              ? "Verified"
              : "Pending",
          verifiedAt: entry?.verifiedAt || null,
          verifiedByName: String(entry?.verifiedByName || "").trim(),
          receipt,
          financeReceipt,
          receiptStatus: String(entry?.receiptStatus || "").trim(),
          receiptSentAt: entry?.receiptSentAt || null,
          receiptSentByName: String(entry?.receiptSentByName || "").trim(),
        };
      })
      .filter(Boolean);
  }

  const fallbackAmount = Math.round(Number(paymentSubmission?.amount || 0));
  if (fallbackAmount <= 0) return [];

  const fallbackDate = formatInputDate(
    paymentSubmission?.paymentDate || paymentSubmission?.submittedAt || "",
  );

  return [
    {
      id: `${paymentSubmission?.submittedAt || "tracker"}-fallback`,
      persisted: true,
      amount: fallbackAmount,
      date: fallbackDate
        ? new Date(fallbackDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : "Pending",
      rawDate: fallbackDate,
      note: String(paymentSubmission?.remarks || "").trim(),
      createdAt: paymentSubmission?.submittedAt || null,
      verificationStatus:
        String(paymentSubmission?.verificationStatus || "").trim() === "Verified"
          ? "Verified"
          : "Pending",
      verifiedAt: paymentSubmission?.reviewedAt || null,
      verifiedByName: String(paymentSubmission?.reviewedByName || "").trim(),
      receipt: normalizeReceipt(paymentSubmission?.receipt),
      financeReceipt: normalizeReceipt(),
      receiptStatus: "",
      receiptSentAt: null,
      receiptSentByName: "",
    },
  ];
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

const getDocumentTypeMismatchMessage = (documentKey = "", document = {}) => {
  const fileName = String(document?.fileName || "").trim().toLowerCase();
  if (!fileName) return "";
  const looksLikePan = /\bpan\b|pan[-_\s]?card|aadhaar|aadhar|government[-_\s]?id|govt[-_\s]?id/.test(fileName);
  const looksLikePassport = /passport|pass[-_\s]?port/.test(fileName);
  if (documentKey === "passport" && looksLikePan) {
    return "This file looks like a PAN/Government ID. Remove it from Passport or upload the correct passport file.";
  }
  if (documentKey === "governmentId" && looksLikePassport) {
    return "This file looks like a passport. Remove it from PAN Card or upload the correct PAN Card file.";
  }
  return "";
};

const getOpsPayableAmountFromInvoice = (invoice = {}) => {
  const snapshot = invoice?.pricingSnapshot || {};
  const computedOpsAmount = Math.round(
    Number(snapshot.servicesTotal || 0) +
    Number(snapshot.packageTemplateAmount || 0) +
    Number(snapshot.opsMarkupAmount || 0) +
    Number(snapshot.serviceCharge || 0) +
    Number(snapshot.handlingFee || 0) +
    Number(snapshot.totalTax || 0),
  );
  return computedOpsAmount > 0 ? computedOpsAmount : Math.round(Number(invoice?.totalAmount || 0));
};


// ─── Payment Tracker ────────────────────────────────────────────────────────

const isValidPaymentTrackerEntry = (payment = {}) => {
  const amount = Math.round(Number(payment?.amount || 0));
  const rawDate = String(payment?.rawDate || payment?.paymentDate || "").trim();
  const parsedDate = rawDate ? new Date(rawDate) : null;
  return Number.isFinite(amount) && amount > 0 && parsedDate && !Number.isNaN(parsedDate.getTime());
};

function PaymentTracker({ totalAmount, payments, onAddPayment, onUpdatePayment, onDownloadReceipt, onValidationError }) {
  const [inputAmt, setInputAmt] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const amountInputRef = useRef(null);

  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalAmount - paid);
  const pct = totalAmount > 0 ? Math.min(100, Math.round((paid / totalAmount) * 100)) : 0;
  const isComplete = remaining === 0 && totalAmount > 0;

  const currentOrLastPaymentAmount = (() => {
    const parsedInput = parseInt(inputAmt.replace(/,/g, ""), 10);
    if (!isNaN(parsedInput) && parsedInput > 0) {
      return parsedInput;
    }
    if (payments.length > 0) {
      return payments[payments.length - 1].amount;
    }
    return 0;
  })();

  function handleStartEdit(p) {
    setEditingId(p.id);
    setInputAmt(p.amount.toLocaleString("en-IN"));
    setInputDate(p.rawDate || "");
    setInputNote(p.note || "");
    setError("");
    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setInputAmt("");
    setInputNote("");
    setInputDate("");
    setError("");
  }

  function handleAddOrUpdate() {
    const amt = parseInt(inputAmt.replace(/,/g, ""), 10);
    if (!amt || amt < 1) { setError("Please enter a valid amount."); return; }
    if (!inputDate) { setError("Please select a payment date."); return; }
    if (inputDate > getTodayInputDate()) {
      const message = "Future payment date is not allowed. Please select today or a past date.";
      setError(message);
      onValidationError?.(message);
      return;
    }

    const originalPayment = payments.find(x => x.id === editingId);
    const originalAmt = originalPayment ? originalPayment.amount : 0;
    const remainingForEdit = totalAmount - (paid - originalAmt);

    if (editingId) {
      if (amt > remainingForEdit) {
        setError(`Amount exceeds remaining balance of ₹${remainingForEdit.toLocaleString("en-IN")}.`);
        return;
      }
    } else {
      if (amt > remaining) {
        setError(`Amount exceeds remaining balance of ₹${remaining.toLocaleString("en-IN")}.`);
        return;
      }
    }

    setError("");
    const dateLabel = new Date(inputDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (editingId) {
      onUpdatePayment({
        id: editingId,
        amount: amt,
        date: dateLabel,
        rawDate: inputDate,
        note: inputNote.trim()
      });
      setEditingId(null);
    } else {
      onAddPayment({
        amount: amt,
        date: dateLabel,
        rawDate: inputDate,
        note: inputNote.trim(),
        createdAt: new Date().toISOString(),
        receipt: normalizeReceipt(),
      });
    }

    setInputAmt("");
    setInputNote("");
    setInputDate("");
  }

  if (totalAmount <= 0) return null;

  return (
    <div className="mt-3 space-y-3">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/60 px-4 py-3 border border-slate-200 border-l-4 border-l-slate-500 shadow-xs hover:shadow-sm transition-all duration-300">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Total
          </p>
          <p className="mt-1 text-[14px] font-bold text-slate-800">₹{totalAmount.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/45 px-4 py-3 border border-teal-100/80 border-l-4 border-l-teal-500 shadow-xs hover:shadow-sm transition-all duration-300">
          <p className="flex items-center gap-1.5 text-[11px] text-teal-600 font-bold uppercase tracking-wider">
            <svg className="h-3.5 w-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Paid
          </p>
          <p className="mt-1 text-[14px] font-bold text-teal-800">₹{paid.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/45 px-4 py-3 border border-amber-100/80 border-l-4 border-l-amber-500 shadow-xs hover:shadow-sm transition-all duration-300">
          <p className="flex items-center gap-1.5 text-[11px] text-amber-600 font-bold uppercase tracking-wider">
            <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Remaining
          </p>
          <p className="mt-1 text-[14px] font-bold text-amber-800">₹{remaining.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full rounded-2xl bg-white px-3 py-3 shadow-sm border border-slate-100">
        <div className="mb-3 flex items-end justify-between gap-3 text-[12px]">
          <span className="font-semibold text-slate-400">₹0</span>
          <span className="flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/80 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm">
            <span className="text-teal-600">₹{paid.toLocaleString("en-IN")}</span>
            <span className="text-teal-300">/</span>
            <span className="text-slate-700">₹{totalAmount.toLocaleString("en-IN")}</span>
          </span>
        </div>
        <div className="relative h-1.5 overflow-visible rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div
            className="group absolute top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full border-[4px] border-teal-500 bg-white shadow-[0_2px_10px_rgba(20,184,166,0.28)]"
            initial={{ left: "calc(2% - 8px)", opacity: 0 }}
            animate={{ left: `calc(${Math.max(2, pct)}% - 8px)`, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className={`pointer-events-none absolute bottom-full mb-2.5 whitespace-nowrap rounded-xl border border-slate-800/90 bg-slate-950/95 backdrop-blur-md px-3.5 py-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:-translate-y-1.5 group-hover:opacity-100 z-20 ${pct > 85 ? "right-[-10px]" : pct < 15 ? "left-[-10px]" : "left-1/2 -translate-x-1/2"}`}>
              <div className="flex flex-col gap-1 text-left text-[11px] text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 font-bold text-white tracking-wide">
                    {pct === 100 ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    )}
                    {pct === 100 ? "Fully Paid" : "Progress"}
                  </span>
                  <span className="font-extrabold text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded-md border border-teal-800/40">
                    {pct}%
                  </span>
                </div>
                <div className="h-px bg-slate-800/80 my-1" />
                <div>
                  <span className="text-slate-400 font-medium">Total Paid: </span>
                  <span className="font-bold text-white">₹{paid.toLocaleString("en-IN")}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-slate-400 font-semibold">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">As of: </span>
                  <span className="font-medium text-slate-300">
                    {(() => {
                      if (inputDate) {
                        const d = new Date(inputDate);
                        if (!isNaN(d.getTime())) {
                          return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                        }
                      }
                      return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    })()}
                  </span>
                </div>
              </div>
              <div className={`absolute -bottom-1 h-2 w-2 rotate-45 border-b border-r border-slate-800 bg-slate-950/95 ${pct > 85 ? "right-[14px]" : pct < 15 ? "left-[14px]" : "left-1/2 -translate-x-1/2"}`}></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-2">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          Payment History
        </p>

        <div className="relative">
          {/* Vertical connector line */}
          {payments.length > 0 && (
            <div className="absolute left-[15px] top-8 w-[2px] bg-slate-200" style={{ height: `calc(100% - 56px)` }} />
          )}

          <div className="space-y-3">
            {payments.map((p, i) => {
              const isInstallmentVerified = p?.verificationStatus === "Verified";
              const downloadableReceipt = isInstallmentVerified ? p?.financeReceipt : p?.receipt;
              const hasReceipt = isInstallmentVerified || Boolean(downloadableReceipt?.url);

              return (
                <div key={p.id} className="group flex items-start gap-3">
                  {/* Check dot */}
                  <div className={`relative z-10 flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-110 ${isInstallmentVerified ? "bg-teal-500 text-white" : "bg-amber-400 text-white"
                    }`}>
                    {isInstallmentVerified ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                  </div>
                  {/* Card */}
                  <div className={`flex-1 overflow-hidden rounded-xl border shadow-sm transition-all group-hover:shadow-md ${isInstallmentVerified
                      ? "border-emerald-100/70 bg-gradient-to-br from-white via-slate-50/10 to-emerald-50/20"
                      : "border-amber-100/70 bg-gradient-to-br from-white via-slate-50/10 to-amber-50/25"
                    }`}>
                    <div className="px-3 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isInstallmentVerified ? "text-teal-600/90" : "text-amber-600/90"
                          }`}>
                          Instalment {i + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {p.receiptStatus === "Sent" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/85 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 shadow-sm">
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Receipt Shared
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${isInstallmentVerified
                            ? "border border-teal-100 bg-teal-50/80 text-teal-700"
                            : "border border-amber-100 bg-amber-50 text-amber-700"
                            }`}>
                            <CheckCircle2 className={`h-3 w-3 ${isInstallmentVerified ? "text-teal-500" : "text-amber-500"}`} />
                            {isInstallmentVerified ? "Verified" : "Pending"}
                          </span>
                          {hasReceipt ? (
                            <button
                              type="button"
                              onClick={() => onDownloadReceipt?.(downloadableReceipt, i, { isInstallmentVerified })}
                              className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700 shadow-sm transition hover:bg-sky-100 active:scale-95"
                              title={`Download instalment ${i + 1} ${isInstallmentVerified ? "finance receipt" : "payment proof"}`}
                              aria-label={`Download instalment ${i + 1} ${isInstallmentVerified ? "finance receipt" : "payment proof"}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {!isInstallmentVerified && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(p)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-transparent bg-slate-900 hover:bg-blue-900 px-2.5 py-0.5 text-[10px] font-semibold text-white transition shadow-xs active:scale-95"
                            >
                              <svg className="h-3 w-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-[14px] font-bold text-slate-800">₹{p.amount.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] font-medium text-slate-400">{p.date}</span>
                      </div>
                      {p?.verifiedAt || p?.verifiedByName ? (
                        <p className="mt-2 text-[10px] text-teal-700/95 font-medium flex items-center gap-1 bg-teal-50/60 w-fit px-2 py-0.5 rounded-md border border-teal-100/40">
                          <svg className="h-3 w-3 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Verified {p?.verifiedAt ? `on ${formatDateTime(p.verifiedAt)}` : ""}{p?.verifiedByName ? ` by ${p.verifiedByName}` : ""}
                        </p>
                      ) : null}
                      {p.note && (
                        <div className={`mt-2 rounded-lg px-2.5 py-1.5 border text-[10px] text-slate-600 ${isInstallmentVerified
                            ? "bg-teal-50/20 border-teal-100/30"
                            : "bg-amber-50/20 border-amber-100/30"
                          }`}>
                          <span className="font-semibold text-slate-400 mr-1">Note:</span>
                          {p.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pending / Complete node */}
            <div className="group flex items-start gap-3">
              <div className={`relative z-10 flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-110 ${isComplete ? "bg-emerald-500 text-white" : "bg-indigo-50 border border-indigo-200 text-indigo-500"
                }`}>
                {isComplete ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2.5 transition-all shadow-sm group-hover:shadow-md ${isComplete
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "border border-indigo-100/70 bg-gradient-to-br from-indigo-50/20 via-white to-blue-50/30"
                }`}>
                {isComplete ? (
                  <>
                    <p className="text-[12px] font-bold tracking-wide">All Payments Complete 🎉</p>
                    <p className="mt-0.5 text-[10px] font-medium text-teal-50/90">Full amount of ₹{totalAmount.toLocaleString("en-IN")} received</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold text-indigo-700/85">Remaining balance</p>
                    <div className="mt-0.5 flex items-baseline justify-between">
                      <span className="text-[14px] font-extrabold text-slate-800">₹{remaining.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] font-semibold text-indigo-600/85 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">Pending payment</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment form */}
      <AnimatePresence initial={false}>
        {(!isComplete || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`transition-all duration-300 rounded-2xl p-3.5 border ${editingId
                ? "border-teal-300 bg-gradient-to-br from-teal-50/20 to-emerald-50/5 shadow-xs"
                : "border-slate-200/60 bg-gradient-to-br from-slate-50/30 via-white to-slate-100/10 shadow-xs"
              }`}>
              <p className={`mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] ${editingId ? "text-teal-600" : "text-slate-400"
                }`}>
                {editingId ? "Edit Payment Entry" : "Add Payment Entry"}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[110px] flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">₹</span>
                  <input
                    ref={amountInputRef}
                    value={inputAmt}
                    onChange={(e) => setInputAmt(formatAmountInput(e.target.value))}
                    inputMode="numeric"
                    placeholder="Amount"
                    className="h-9 w-full rounded-full border border-slate-300 bg-gradient-to-br from-slate-50 to-white pl-7 pr-4 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100/50"
                  />
                </div>
                <input
                  type="date"
                  value={inputDate}
                  max={getTodayInputDate()}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    if (nextDate && nextDate > getTodayInputDate()) {
                      const message = "Future payment date is not allowed. Please select today or a past date.";
                      setInputDate("");
                      setError(message);
                      onValidationError?.(message);
                      return;
                    }
                    setInputDate(nextDate);
                  }}
                  className="h-9 w-32 rounded-full border border-slate-300 bg-gradient-to-br from-slate-50 to-white px-3.5 text-[12px] text-slate-600 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100/50 cursor-pointer"
                />
                <input
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="h-9 min-w-[80px] flex-1 rounded-full border border-slate-300 bg-gradient-to-br from-slate-50 to-white px-4 text-[12px] text-slate-600 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100/50"
                />
                <button
                  type="button"
                  onClick={handleAddOrUpdate}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-600 hover:via-emerald-600 hover:to-teal-700 shadow-sm hover:shadow-md text-[12px] font-bold text-white transition active:scale-95 px-4.5"
                >
                  {editingId ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-4.5 text-[12px] font-semibold text-slate-600 transition active:scale-95"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───================================= Toast / Label / SnapshotRow / helpers (unchanged)============ ──────────────────────

const Toast = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const tone = feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : feedback.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const Icon = feedback.type === "error" || feedback.type === "warning" ? AlertCircle : CheckCircle2;
  return (
    <div className="fixed right-4 top-4 z-[70] w-full max-w-sm">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${tone}`}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/80 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-none">{feedback.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current flex items-center justify-center shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {feedback.message && (
            <div className="pl-10">
              <p className="text-[10px] leading-normal font-medium">{feedback.message}</p>
            </div>
          )}
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

function DocCard({
  traveler,
  option,
  document,
  disabled,
  loadingKey,
  removingKey,
  uploadError,
  onUpload,
  onView,
  onRemove,
  isRequired,
  tripTypeLabel,
  issue,
  verified,
  issueTitle,
  issueMessage,
}) {
  const Icon = option.icon;
  const inputRef = useRef(null);
  const uploadKey = `${traveler?._id}-${option.key}`;
  const uploading = loadingKey === uploadKey;
  const removing = removingKey === uploadKey;
  const uploaded = Boolean(document?.url);
  const hasIssue = Boolean(issue);
  const isVerified = Boolean(verified);
  const mismatchMessage = uploaded ? getDocumentTypeMismatchMessage(option.key, document) : "";
  const hasMismatch = Boolean(mismatchMessage);
  const slotStatus = hasMismatch ? "WRONG FILE" : hasIssue ? "REJECTED" : isVerified ? "VERIFIED" : uploaded ? "READY" : isRequired ? "REQUIRED" : "OPTIONAL";
  const slotStatusClassName = hasIssue
    ? "bg-red-100 text-red-700"
    : hasMismatch
      ? "bg-red-100 text-red-700"
      : isVerified
        ? "bg-emerald-100 text-emerald-700"
        : uploaded
          ? "bg-emerald-100 text-emerald-700"
          : isRequired
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-600";
  const theme = option.tone === "sky"
    ? {
      shell: "border-sky-200/80 bg-[linear-gradient(160deg,#f0f9ff_0%,#ffffff_48%,#eef6ff_100%)]",
      badge: "bg-sky-100 text-sky-700",
      iconWrap: "bg-sky-100 text-sky-700 ring-sky-200/70",
      panel: uploaded ? "border-sky-300 bg-white/90" : "border-sky-300/80 bg-sky-50/70",
      accent: "bg-sky-500",
      text: "text-sky-700",
      cta: "bg-sky-600 hover:bg-sky-700",
    }
    : {
      shell: "border-violet-200/80 bg-[linear-gradient(160deg,#f7f5ff_0%,#ffffff_48%,#fff4f7_100%)]",
      badge: "bg-violet-100 text-violet-700",
      iconWrap: "bg-violet-100 text-violet-700 ring-violet-200/70",
      panel: uploaded ? "border-violet-300 bg-white/90" : "border-violet-300/80 bg-violet-50/70",
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
              {isVerified
                ? "Operations verified this document and marked it as correct."
                : uploaded
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
          {hasIssue ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              <p className="text-xs font-semibold">{issueTitle || "Document correction requested"}</p>
              <p className="mt-1 text-xs leading-5">
                {issueMessage || "Operations highlighted this document for correction. Please replace it and submit again."}
              </p>
            </div>
          ) : null}
          {hasMismatch ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-xs font-semibold">Wrong document slot</p>
              <p className="mt-1 text-xs leading-5">{mismatchMessage}</p>
            </div>
          ) : null}
          {!hasIssue && isVerified ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <p className="text-xs font-semibold">Document verified by operations</p>
              <p className="mt-1 text-xs leading-5">
                This file has been reviewed and marked as correct on the ops side.
              </p>
            </div>
          ) : null}
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
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${slotStatusClassName}`}>{slotStatus}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isRequired ? "bg-amber-100 text-amber-700" : "border border-slate-200 bg-white text-slate-500"}`}>
                {isRequired ? "Mandatory" : "Optional"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-nowrap items-center gap-1.5 sm:gap-2">
            {uploaded ? (
              <button
                type="button"
                onClick={() => onView(document)}
                className="flex-1 min-w-0 justify-center text-center rounded-full border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 truncate"
              >
                View File
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading || removing}
              className={`flex-[1.2] min-w-0 inline-flex items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold text-white transition-colors disabled:bg-slate-300 ${theme.cta}`}
            >
              {uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Upload className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{uploaded ? "Replace Upload" : "Upload Now"}</span>
            </button>
            {uploaded && !isVerified ? (
              <button
                type="button"
                onClick={() => onRemove(traveler, option)}
                disabled={disabled || uploading || removing}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-2 py-2 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                {removing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Trash2 className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">Remove</span>
              </button>
            ) : null}
          </div>
          {uploadError ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-xs font-semibold">Upload needs attention</p>
              <p className="mt-1 text-xs leading-5">{uploadError}</p>
            </div>
          ) : null}
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => onUpload(e, traveler, option)} />
        </div>
      </div>
      {uploading || removing ? <div className="absolute inset-0 flex items-center justify-center bg-white/70"><div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"><LoaderCircle className="h-4 w-4 animate-spin" />{uploading ? "Uploading..." : "Removing..."}</div></div> : null}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ActiveBookingDetails({ onClose, booking, onBookingUpdated, documentPortalContext }) {
  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };
  const paymentSubmission = useMemo(() => booking?.paymentSubmission || {}, [booking?.paymentSubmission]);
  const paymentVerification = booking?.paymentVerification || {};
  const travelerVerification = booking?.travelerDocumentVerification || { status: "Draft" };
  const invoiceId = booking?.invoiceId || booking?.invoice?._id || "";
  const queryId = booking?._id || booking?.query?._id || "";
  const currency = booking?.currency || booking?.invoice?.currency || "INR";
  const paymentStatus = paymentVerification?.status || (paymentSubmission?.submittedAt ? "Pending" : "Draft");
  const isRejectedPayment = paymentStatus === "Rejected";
  const isPaymentVerified = paymentStatus === "Verified" || booking?.paymentStatus === "Paid";
  const currentReceipt = isRejectedPayment || paymentSubmission?.submittedAt ? {} : paymentSubmission?.receipt || {};
  const docsUnlocked = true;
  const bookingConfirmationReady = isPaymentVerified;

  const [feedback, setFeedback] = useState(null);
  const [utrNumber, setUtrNumber] = useState(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
  const [quotationAmount, setQuotationAmount] = useState("");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [remarks, setRemarks] = useState(isRejectedPayment ? "" : booking?.remarks || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [preparingInvoice, setPreparingInvoice] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [removingKey, setRemovingKey] = useState("");
  const [documentUploadErrors, setDocumentUploadErrors] = useState({});
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [isSubmitDocsConfirmOpen, setIsSubmitDocsConfirmOpen] = useState(false);
  const [isPaymentUpdateOpen, setIsPaymentUpdateOpen] = useState(false);
  const [payableQuotationAmount, setPayableQuotationAmount] = useState(0);

  // ── Payment tracker state ──
  const [trackerPayments, setTrackerPayments] = useState([]);
  const [trackerIdCounter, setTrackerIdCounter] = useState(1);

  const approvedQuotationAmount = useMemo(
    () => {
      const opsQuotationAmount = Math.round(Number(booking?.quotation?.pricingTotalAmount || 0));
      if (opsQuotationAmount > 0) return opsQuotationAmount;

      const invoiceOpsAmount = getOpsPayableAmountFromInvoice(booking?.invoice);
      if (invoiceOpsAmount > 0) return invoiceOpsAmount;

      return Math.round(Number(booking?.quotation?.clientTotalAmount || booking?.totalAmount || 0));
    },
    [
      booking?.invoice,
      booking?.quotation?.clientTotalAmount,
      booking?.quotation?.pricingTotalAmount,
      booking?.totalAmount,
    ],
  );

  const travelers = useMemo(() => (Array.isArray(booking?.travelerDetails) ? booking.travelerDetails : []).map((t) => ({ ...t, docs: resolveDocs(t) })), [booking?.travelerDetails]);
  const initialQuotationAmount = useMemo(
    () =>
      Math.round(
        Number(
          paymentSubmission?.couponApplication?.payableAmount ||
          approvedQuotationAmount ||
          0,
        ),
      ),
    [
      approvedQuotationAmount,
      paymentSubmission?.couponApplication?.payableAmount,
    ],
  );
  const expectedPaymentAmount = useMemo(
    () => Math.round(Number(payableQuotationAmount || initialQuotationAmount || 0)),
    [initialQuotationAmount, payableQuotationAmount],
  );
  const validTrackerPayments = useMemo(
    () => trackerPayments.filter((payment) => isValidPaymentTrackerEntry(payment)),
    [trackerPayments],
  );
  const newTrackerPayments = useMemo(
    () => validTrackerPayments.filter((payment) => !payment?.persisted),
    [validTrackerPayments],
  );
  const hasExactPaymentMismatch = false;
  const paymentAmountWarningMessage = "";

  const isInternationalTrip = useMemo(() => {
    const explicitQuoteCategory = String(
      booking?.quotation?.quoteCategory || booking?.pricingSnapshot?.quoteCategory || booking?.invoice?.pricingSnapshot?.quoteCategory || "",
    ).trim().toLowerCase();
    if (explicitQuoteCategory === "international") return true;
    if (explicitQuoteCategory === "domestic") return false;
    return Boolean(booking?.destination) && !isIndianDestination(booking.destination);
  }, [booking?.destination, booking?.invoice?.pricingSnapshot?.quoteCategory, booking?.pricingSnapshot?.quoteCategory, booking?.quotation?.quoteCategory]);

  const tripTypeLabel = isInternationalTrip ? "International" : "Domestic";
  const requiredDocKeys = useMemo(() => getRequiredDocumentKeys(isInternationalTrip), [isInternationalTrip]);
  const documentIssues = useMemo(
    () =>
      Array.isArray(documentPortalContext?.issues) && documentPortalContext.issues.length
        ? documentPortalContext.issues
        : Array.isArray(travelerVerification?.issues)
          ? travelerVerification.issues
          : [],
    [documentPortalContext?.issues, travelerVerification?.issues],
  );
  const hasStructuredDocumentIssues = documentIssues.length > 0;
  const verifiedDocuments = useMemo(
    () =>
      Array.isArray(travelerVerification?.verifiedDocuments)
        ? travelerVerification.verifiedDocuments
        : [],
    [travelerVerification?.verifiedDocuments],
  );
  const documentIssueTitle = String(travelerVerification?.rejectionReason || "").trim() || "Document corrections requested";
  const documentIssueMessage =
    String(travelerVerification?.rejectionRemarks || "").trim() ||
    "Operations highlighted this document for correction. Please replace it and submit again.";

  const travelersWithStatus = useMemo(
    () =>
      travelers.map((traveler) => {
        const requiredReadyCount = requiredDocKeys.filter((key) => {
          const hasUrl = Boolean(traveler.docs?.[key]?.url);
          if (!hasUrl) return false;

          // A required document is NOT ready/verified if it has an active issue from operations side
          const hasIssue = documentIssues.some((issue) => {
            const issueTravelerId = String(issue?.travelerId || "").trim();
            const issueTravelerName = String(issue?.travelerName || "").trim().toLowerCase();
            const issueDocumentKey = String(issue?.documentKey || "").trim();
            const travelerId = String(traveler?._id || "").trim();
            const travelerName = String(traveler?.fullName || "").trim().toLowerCase();
            return issueDocumentKey === key && (
              (issueTravelerId && travelerId && issueTravelerId === travelerId) ||
              (issueTravelerName && travelerName && issueTravelerName === travelerName)
            );
          });
          return !hasIssue;
        }).length;
        const uploadedDocCount = docOptions.filter((option) => Boolean(traveler.docs?.[option.key]?.url)).length;
        const mismatchedDocuments = docOptions
          .map((option) => ({
            key: option.key,
            label: option.label,
            message: getDocumentTypeMismatchMessage(option.key, traveler.docs?.[option.key]),
          }))
          .filter((item) => item.message);
        return {
          ...traveler,
          requiredReadyCount,
          uploadedDocCount,
          mismatchedDocuments,
          isDocDeskComplete: requiredReadyCount === requiredDocKeys.length && mismatchedDocuments.length === 0,
        };
      }),
    [requiredDocKeys, travelers, documentIssues],
  );
  const requiredDocCount = useMemo(
    () => travelersWithStatus.reduce((sum, traveler) => sum + traveler.requiredReadyCount, 0),
    [travelersWithStatus],
  );
  const totalRequiredDocSlots = travelers.length * requiredDocKeys.length;
  const allDocsReady = travelers.length > 0 && travelersWithStatus.every((traveler) => traveler.isDocDeskComplete);
  const documentMismatchRows = useMemo(
    () =>
      travelersWithStatus.flatMap((traveler) =>
        (traveler.mismatchedDocuments || []).map((document) => ({
          travelerName: traveler.fullName || "Traveler",
          documentLabel: document.label,
          message: document.message,
        })),
      ),
    [travelersWithStatus],
  );
  const hasDocumentTypeMismatch = documentMismatchRows.length > 0;
  const docProgress = totalRequiredDocSlots ? Math.round((requiredDocCount / totalRequiredDocSlots) * 100) : 0;

  const travelerIssuesList = useMemo(() => {
    return travelersWithStatus.map((t) => {
      const issues = requiredDocKeys.map((key) => {
        const hasUrl = Boolean(t.docs?.[key]?.url);
        if (!hasUrl) return null;
        const matchedIssue = documentIssues.find((issue) => {
          const issueTravelerId = String(issue?.travelerId || "").trim();
          const issueTravelerName = String(issue?.travelerName || "").trim().toLowerCase();
          const issueDocumentKey = String(issue?.documentKey || "").trim();
          const travelerId = String(t?._id || "").trim();
          const travelerName = String(t?.fullName || "").trim().toLowerCase();
          return issueDocumentKey === key && (
            (issueTravelerId && travelerId && issueTravelerId === travelerId) ||
            (issueTravelerName && travelerName && issueTravelerName === travelerName)
          );
        });
        if (matchedIssue) {
          return key === "passport" ? "Passport" : "PAN Card";
        }
        return null;
      }).filter(Boolean);

      if (issues.length > 0) {
        return {
          name: t.fullName || "Traveler",
          issues: issues.join(", ")
        };
      }
      return null;
    }).filter(Boolean);
  }, [travelersWithStatus, requiredDocKeys, documentIssues]);
  const verifiedRequiredDocumentCount = useMemo(() => {
    if (!verifiedDocuments.length) return 0;

    return travelersWithStatus.reduce((count, traveler) => (
      count + requiredDocKeys.filter((documentKey) => (
        verifiedDocuments.some((verifiedDocument) => {
          const verifiedTravelerId = String(verifiedDocument?.travelerId || "").trim();
          const verifiedTravelerName = String(verifiedDocument?.travelerName || "").trim().toLowerCase();
          const currentTravelerId = String(traveler?._id || "").trim();
          const currentTravelerName = String(traveler?.fullName || "").trim().toLowerCase();

          if (String(verifiedDocument?.documentKey || "").trim() !== documentKey) return false;

          return (
            (verifiedTravelerId && currentTravelerId && verifiedTravelerId === currentTravelerId) ||
            (verifiedTravelerName && currentTravelerName && verifiedTravelerName === currentTravelerName)
          );
        })
      )).length
    ), 0);
  }, [requiredDocKeys, travelersWithStatus, verifiedDocuments]);
  const hasVerifiedAllRequiredDocuments = verifiedDocuments.length
    ? verifiedRequiredDocumentCount >= totalRequiredDocSlots && totalRequiredDocSlots > 0
    : allDocsReady;
  const isTravelerDocumentsVerifiedComplete = (
    travelerVerification?.status === "Verified" &&
    allDocsReady &&
    !hasStructuredDocumentIssues &&
    hasVerifiedAllRequiredDocuments
  );
  const notify = (type, title, message) => setFeedback({ type, title, message });
  const currentSubmissionPayments = isRejectedPayment ? validTrackerPayments : newTrackerPayments;
  const latestCurrentSubmissionPayment = currentSubmissionPayments.length ? currentSubmissionPayments[currentSubmissionPayments.length - 1] : null;
  const latestInstallmentNeedsReceipt = Boolean(latestCurrentSubmissionPayment) && !receiptFile;
  const effectivePaymentDate = latestCurrentSubmissionPayment?.rawDate || "";
  const effectiveRemarks =
    remarks.trim() ||
    latestCurrentSubmissionPayment?.note ||
    "";
  const snapshotUtr = utrNumber;
  const snapshotPaymentAmount = Math.round(
    Number(
      latestCurrentSubmissionPayment?.amount ||
      0,
    ),
  );
  const snapshotPaymentDate = effectivePaymentDate;
  const snapshotReceiptName = receiptFile?.name || "";
  const receiptRequiredMessage = latestInstallmentNeedsReceipt
    ? "Please upload a receipt for this installment before submitting."
    : isRejectedPayment
      ? "Please upload the corrected payment receipt before resubmitting."
      : "Please upload the payment receipt before submitting.";
  const canSubmitPayment =
    Boolean(invoiceId) &&
    !preparingInvoice &&
    !submittingPayment &&
    !hasExactPaymentMismatch &&
    isTravelerDocumentsVerifiedComplete;
  const submitButtonLabel = !invoiceId
    ? preparingInvoice
      ? "Preparing Amount..."
      : "Amount Awaited"
    : paymentStatus === "Rejected"
      ? "Correct & Resubmit"
      : "Submit for Verification";
  const reviewBanner = paymentStatus === "Rejected"
    ? { tone: "border-red-200 bg-red-50 text-red-700", title: paymentVerification?.reviewedByName ? `Rejected by ${paymentVerification.reviewedByName}` : "Rejected by Finance", msg: paymentVerification?.rejectionReason || "Corrections were requested by finance." }
    : paymentStatus === "Verified"
      ? { tone: "border-emerald-200 bg-emerald-50 text-emerald-700", title: "Payment verified by finance", msg: "Payment is cleared. Traveler document uploads are unlocked now." }
      : paymentSubmission?.submittedAt
        ? { tone: "border-blue-200 bg-blue-50 text-blue-700", title: "Finance review in progress", msg: "Finance will verify your UTR and payment date." }
        : null;

  const trackerTotalAmount = payableQuotationAmount || initialQuotationAmount || 0;

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setUtrNumber(isRejectedPayment ? paymentSubmission?.utrNumber || "" : "");
    setPayableQuotationAmount(initialQuotationAmount);
    setRemarks(isRejectedPayment ? booking?.remarks || "" : "");
    const hydratedTrackerPayments = buildTrackerPaymentsFromSubmission(paymentSubmission);
    setTrackerPayments(hydratedTrackerPayments);
    setTrackerIdCounter(hydratedTrackerPayments.length + 1);
    setReceiptFile(null);
  }, [
    booking?.invoiceId,
    initialQuotationAmount,
    booking?.remarks,
    isRejectedPayment,
    paymentSubmission?.amount,
    paymentSubmission?.paymentDate,
    paymentSubmission?.receipt?.fileName,
    paymentSubmission?.receipt?.url,
    paymentSubmission?.submittedAt,
    paymentSubmission?.trackerPayments,
    paymentSubmission?.utrNumber,
    paymentSubmission,
  ]);

  useEffect(() => {
    let cancelled = false;

    const prepareInvoiceForActiveBooking = async () => {
      if (invoiceId || !booking?.quotation?._id) return;

      try {
        setPreparingInvoice(true);
        const { data } = await API.post(`/agent/quotations/${booking.quotation._id}/ensure-invoice`);
        if (cancelled) return;

        if (data?.invoice) {
          onBookingUpdated?.({
            type: "payment",
            invoice: data.invoice,
            query: data.query,
          });
        }
      } catch (error) {
        if (cancelled) return;
        notify(
          "error",
          "Amount Setup Failed",
          error?.response?.data?.message || "Unable to prepare booking amount right now.",
        );
      } finally {
        if (!cancelled) {
          setPreparingInvoice(false);
        }
      }
    };

    prepareInvoiceForActiveBooking();

    return () => {
      cancelled = true;
    };
  }, [booking?.quotation?._id, invoiceId, onBookingUpdated]);

  useEffect(() => {
    setIsPaymentUpdateOpen(isTravelerDocumentsVerifiedComplete);
  }, [isTravelerDocumentsVerifiedComplete]);

  const handleView = (doc) => doc?.url && window.open(doc.url, "_blank", "noopener,noreferrer");
  const handleDownloadInstallmentReceipt = async (receipt, installmentIndex, options = {}) => {
    if (receipt?.url) {
      window.open(receipt.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!options?.isInstallmentVerified || !invoiceId) return;

    try {
      const { data } = await API.post(`/agent/invoices/${invoiceId}/payment-receipts/${installmentIndex}/generate`);
      const financeReceipt = normalizeReceipt(data?.receipt);

      if (!financeReceipt.url) {
        notify("warning", "Receipt Missing", "Finance receipt is not available for this installment yet.");
        return;
      }

      setTrackerPayments((prev) =>
        prev.map((entry, index) => (
          index === installmentIndex
            ? { ...entry, financeReceipt }
            : entry
        )),
      );
      window.open(financeReceipt.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      notify("error", "Download Failed", error?.response?.data?.message || "Unable to download finance receipt right now.");
    }
  };

  const handleAddTrackerPayment = (p) => {
    setTrackerPayments((prev) => [...prev, { id: trackerIdCounter, persisted: false, ...p }]);
    setTrackerIdCounter((c) => c + 1);
  };

  const handleEditTrackerPayment = (updatedP) => {
    setTrackerPayments((prev) =>
      prev.map((item) => (item.id === updatedP.id ? { ...item, ...updatedP } : item))
    );
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceId) return notify("error", "Invoice Missing", "This booking does not have an invoice ready for payment submission.");
    const submissionTrackerPayments = isRejectedPayment ? validTrackerPayments : newTrackerPayments;
    const submissionPaidAmount = submissionTrackerPayments.reduce(
      (sum, payment) => sum + Math.round(Number(payment?.amount || 0)),
      0,
    );
    if (!submissionTrackerPayments.length || submissionPaidAmount <= 0) {
      return notify(
        "warning",
        "Add Payment First",
        "Please enter amount and payment date, then click Add so the new instalment appears in Payment History before submitting.",
      );
    }
    if (!isTravelerDocumentsVerifiedComplete) {
      return notify(
        "warning",
        "Traveler Documents Pending",
        "The Payment Submit option will be enabled only after the Operations team has verified all required traveler documents and no document has any pending issues.",
      );
    }
    if (!utrNumber.trim() || !effectivePaymentDate || !expectedPaymentAmount) return notify("error", "Missing Fields", "UTR, payment date, and payable amount are required.");
    if (!receiptFile && (!currentReceipt?.url || latestInstallmentNeedsReceipt)) return notify("error", "Receipt Missing", receiptRequiredMessage);
    try {
      setSubmittingPayment(true);
      const fd = new FormData();
      fd.append("utrNumber", utrNumber.trim().toUpperCase());
      fd.append("paymentDate", effectivePaymentDate);
      fd.append("remarks", effectiveRemarks);
      fd.append("paymentAmount", String(submissionPaidAmount));
      fd.append("trackerPayments", JSON.stringify(submissionTrackerPayments));
      fd.append("onBehalfOf", booking?.invoiceNumber || booking?.bookingReference || "Booking Payment");
      if (receiptFile) fd.append("paymentReceipt", receiptFile);
      const { data } = await API.put(`/agent/invoices/${invoiceId}/payment-status`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onBookingUpdated?.({ type: "payment", invoice: data?.invoice });
      setReceiptFile(null);
      setIsPaymentUpdateOpen(false);
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
    const key = `${traveler?._id}-${option.key}`;
    const mismatchMessage = getDocumentTypeMismatchMessage(option.key, { fileName: file.name });
    if (mismatchMessage) {
      setDocumentUploadErrors((prev) => ({
        ...prev,
        [key]: mismatchMessage,
      }));
      notify("error", "Wrong Document Slot", mismatchMessage);
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setDocumentUploadErrors((prev) => ({
        ...prev,
        [key]: "Please upload a file smaller than 5 MB for this document.",
      }));
      return;
    }
    try {
      setDocumentUploadErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
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

  const handleRemoveDoc = async (traveler, option) => {
    const documentKey = option?.key;
    const travelerId = traveler?._id;
    if (!queryId || !travelerId || !documentKey) return;
    const key = `${travelerId}-${documentKey}`;
    try {
      setRemovingKey(key);
      const { data } = await API.delete(`/agent/queries/${queryId}/travelers/${travelerId}/document/${documentKey}`);
      setDocumentUploadErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      onBookingUpdated?.({ type: "traveler-document", query: data?.query });
      notify("success", "Document Removed", data?.message || `${option.label} removed successfully.`);
    } catch (error) {
      notify("error", "Remove Failed", error?.response?.data?.message || "Unable to remove traveler document right now.");
    } finally {
      setRemovingKey("");
    }
  };

  const handleSubmitDocs = async () => {
    if (isTravelerDocumentsVerifiedComplete) {
      notify(
        "info",
        "Already Verified",
        "All required traveler documents have already been verified and marked as correct by operations. No further submission is required."
      );
      return;
    }
    if (hasDocumentTypeMismatch) {
      notify(
        "error",
        "Wrong Document Slot",
        "Please remove or replace documents uploaded in the wrong slot before submitting.",
      );
      return;
    }
    if (!allDocsReady) {
      notify(
        "warning",
        "Required Documents Missing",
        isInternationalTrip
          ? "For international trips, every traveler must upload both a Passport and a PAN Card."
          : "For domestic trips, every traveler must upload at least one PAN Card. Passport is optional.",
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

  const handleOpenSubmitDocsConfirm = () => {
    if (isTravelerDocumentsVerifiedComplete) {
      notify(
        "info",
        "Already Verified",
        "All required traveler documents have already been verified and marked as correct by operations. No further submission is required."
      );
      return;
    }
    if (hasDocumentTypeMismatch) {
      notify(
        "error",
        "Wrong Document Slot",
        "Please remove or replace documents uploaded in the wrong slot before submitting.",
      );
      return;
    }
    if (!allDocsReady) {
      notify(
        "warning",
        "Required Documents Missing",
        isInternationalTrip
          ? "For international trips, every traveler must upload both a Passport and a PAN Card."
          : "For domestic trips, every traveler must upload at least one PAN Card. Passport is optional.",
      );
      return;
    }
    setIsSubmitDocsConfirmOpen(true);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="min-h-screen bg-[#f5f8fc] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <Toast feedback={feedback} onClose={() => setFeedback(null)} />
      <AnimatePresence>
        {isSubmitDocsConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.22)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">Confirm Submission</p>
                  <h3 className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-slate-900">Submit traveler documents?</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This will send the uploaded traveler documents to operations for review. You can update them again only if ops requests corrections.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>Required files ready: <span className="font-semibold text-slate-900">{requiredDocCount}/{totalRequiredDocSlots || 0}</span></p>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setIsSubmitDocsConfirmOpen(false)} className="flex-1 rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                <button
                  type="button"
                  onClick={async () => { await handleSubmitDocs(); setIsSubmitDocsConfirmOpen(false); }}
                  disabled={submittingDocs}
                  className="flex-1 rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submittingDocs ? "Submitting..." : "Yes, Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Header */}
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

      {/* Payment Update Section */}
      <motion.section variants={item} className="overflow-hidden rounded-[20px] bg-white">

        {/* Header */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 pr-24 sm:pr-28 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_8px_24px_rgba(16,185,129,0.35)]">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <rect x="2" y="6" width="20" height="13" rx="2.5" strokeLinejoin="round" />
                  <circle cx="12" cy="12.5" r="2.5" />
                  <path d="M6 9.5h.01M18 15.5h.01" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ${isTravelerDocumentsVerifiedComplete ? "bg-emerald-500/20 ring-emerald-400/30" : "bg-white/5 ring-white/10"}`}>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${isTravelerDocumentsVerifiedComplete ? "bg-emerald-400 text-white" : "bg-white/10 text-white/65"}`}>
                      {isTravelerDocumentsVerifiedComplete ? (
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : "1"}
                    </div>
                    <span className={`text-[10px] ${isTravelerDocumentsVerifiedComplete ? "font-semibold text-emerald-300" : "font-medium text-white/65"}`}>Traveler Documents</span>
                  </div>
                  <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ${bookingConfirmationReady ? "bg-emerald-500/20 ring-emerald-400/30" : "bg-white/5 ring-white/10"}`}>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${bookingConfirmationReady ? "bg-emerald-400 text-white" : isTravelerDocumentsVerifiedComplete ? "bg-white/15 text-white/80" : "bg-white/10 text-white/40"}`}>
                      {bookingConfirmationReady ? (
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : "2"}
                    </div>
                    <span className={`text-[10px] ${bookingConfirmationReady ? "font-semibold text-emerald-300" : isTravelerDocumentsVerifiedComplete ? "font-semibold text-white/80" : "font-medium text-white/40"}`}>Payment Update</span>
                  </div>
                </div>
                <h2 className="text-[20px] font-bold tracking-tight text-white">Agent Payment Details</h2>
                <p className="mt-0.5 max-w-[600px] text-[12px] leading-5 text-slate-400">
                  {isTravelerDocumentsVerifiedComplete
                    ? "Traveler documents are verified. You can now submit payment details for finance verification."
                    : "Payment details unlock only after operations verifies all required traveler documents without any issue."}
                </p>
              </div>
            </div>
            {isTravelerDocumentsVerifiedComplete ? (
              <button
                type="button"
                onClick={() => setIsPaymentUpdateOpen((prev) => !prev)}
                className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
                aria-expanded={isPaymentUpdateOpen}
              >
                <span>{isPaymentUpdateOpen ? "Hide" : "Show"}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPaymentUpdateOpen ? "rotate-180" : ""}`} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {isTravelerDocumentsVerifiedComplete && isPaymentUpdateOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid gap-6 bg-slate-50/40 py-6 xl:grid-cols-[minmax(0,1.3fr)_368px]">

                {/* LEFT: form */}
                <div className="space-y-4">
                  {!invoiceId ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
                      <p className="text-[13px] font-semibold">Amount details are being prepared</p>
                      <p className="mt-1 text-[13px] opacity-90">
                        You can upload traveler documents now. Payment submission will unlock after the final amount is shared for this booking.
                      </p>
                    </div>
                  ) : null}
                  {reviewBanner ? (
                    <div className={`rounded-2xl border px-5 py-4 ${reviewBanner.tone}`}>
                      <p className="text-[13px] font-semibold">{reviewBanner.title}</p>
                      <p className="mt-1 text-[13px] opacity-90">{reviewBanner.msg}</p>
                    </div>
                  ) : null}

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className={!invoiceId ? "pointer-events-none opacity-60" : ""}>
                      {/* Row 1: UTR | Amount */}
                      <div className="grid gap-3 xl:grid-cols-2">

                        {/* UTR */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ring-1 ring-slate-100/60">
                          <div className="mb-2.5 flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.08, 1] }}
                              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-600"
                            >
                              <Fingerprint className="h-3.5 w-3.5" />
                            </motion.div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">UTR / Transaction ID</span>
                          </div>
                          <div className="relative [&>span]:hidden">
                            <Fingerprint className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                            <input
                              value={utrNumber}
                              onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                              placeholder="SBINR52012345678"
                              className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-4 text-[13px] font-mono text-slate-700 outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                            />
                          </div>
                          <p className="mt-2 px-0.5 text-[11px] leading-4 text-amber-700">e.g. 312345678901, HDFC1234567890</p>
                        </div>

                        {/* ── Quotation Amount + Payment Tracker ── */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/60 xl:col-span-2">
                          {/* Card header */}
                          <div className="mb-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 0.95, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
                              >
                                <Coins className="h-3.5 w-3.5" />
                              </motion.div>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Payable Quotation Amount</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCouponModalOpen(true)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
                            >
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11.586V6a1 1 0 011-1h5.586a1 1 0 01.707.293l8.414 8.414a2 2 0 010 2.829l-4.172 4.171a2 2 0 01-2.828 0L3.707 12.293A1 1 0 013 11.586z" />
                              </svg>
                              Apply Coupon
                            </button>
                          </div>

                          {/* Amount input */}
                          <div className="hidden">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">₹</span>
                            <input
                              value={quotationAmount}
                              onChange={(e) => setQuotationAmount(formatAmountInput(e.target.value))}
                              inputMode="numeric"
                              placeholder="Enter amount"
                              className={`h-10 w-full rounded-xl border bg-slate-50 px-4 text-[13px] font-semibold text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 ${hasExactPaymentMismatch
                                ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
                                : "border-slate-300 focus:border-amber-300 focus:ring-amber-100"
                                }`}
                            />
                          </div>
                          {hasExactPaymentMismatch && (
                            <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium leading-5 text-rose-700">
                              {paymentAmountWarningMessage}
                            </div>
                          )}

                          {/* ── Payment Tracker sits here ── */}
                          {trackerTotalAmount > 0 && (
                            <>
                              <div className="mt-4 mb-2 flex items-center gap-2">
                                <div className="h-px flex-1 bg-indigo-200/80" />
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-950 bg-gradient-to-r from-indigo-50 via-purple-50/50 to-pink-50/30 border border-indigo-200/60 rounded-full px-4.5 py-1.5 shadow-sm">
                                  Payment Tracker
                                </span>
                                <div className="h-px flex-1 bg-indigo-200/80" />
                              </div>
                              <PaymentTracker
                                totalAmount={trackerTotalAmount}
                                payments={trackerPayments}
                                onAddPayment={handleAddTrackerPayment}
                                onUpdatePayment={handleEditTrackerPayment}
                                onDownloadReceipt={handleDownloadInstallmentReceipt}
                                onValidationError={(message) => notify("warning", "Invalid Payment Date", message)}
                              />
                            </>
                          )}
                        </div>

                      </div>

                      {/* Receipt Upload */}
                      <div>
                        <div className="mb-2.5 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Payment Receipt</span>
                        </div>

                        <div className="group overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-3.5">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_6px_16px_rgba(16,185,129,0.3)]">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.96 11.96 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-2.056-.503-3.996-1.398-5.709A11.96 11.96 0 0112 2.964z" />
                                </svg>
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[13px] font-semibold text-slate-900">
                                    {receiptFile?.name || "Upload receipt for this payment"}
                                  </p>
                                  {receiptFile?.name ? (
                                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">Attached</span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                                  {receiptFile?.name
                                    ? "New receipt selected. Submit now to send it for finance review."
                                    : latestInstallmentNeedsReceipt
                                      ? "Upload the payment proof for this installment. Previous receipts are available in Payment History."
                                      : isRejectedPayment
                                        ? "Previous receipt was reset for correction. Upload the updated proof again."
                                        : paymentSubmission?.submittedAt
                                          ? "Previous receipt is in Payment History. Add a new installment and upload its proof before submitting again."
                                          : "Upload your payment proof here. JPG, PNG, WEBP and PDF supported."}
                                </p>
                                {latestInstallmentNeedsReceipt && !receiptFile ? (
                                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                                    Receipt is mandatory for this installment.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
                              <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98]">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                {receiptFile?.name ? "Change receipt" : "Upload receipt"}
                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    {!isTravelerDocumentsVerifiedComplete ? (
                      <div className="mx-auto max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[12px] font-medium text-amber-800">
                        Payment verification unlocks only after operations verifies all required traveler documents without any issue.
                      </div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={!canSubmitPayment}
                      className="group mx-auto flex h-11 w-full max-w-sm cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)] transition-all hover:shadow-[0_6px_24px_rgba(15,23,42,0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                      title={!invoiceId ? "Submit for verification will unlock once the booking amount is prepared for this booking." : undefined}
                    >
                      {submittingPayment ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></svg>
                      ) : (
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                      )}
                      {submitButtonLabel}
                    </button>
                    {!invoiceId ? (
                      <p className="text-center text-[12px] text-slate-500">
                        {preparingInvoice
                        ? "The booking amount is being prepared for payment submission."
                        : "Once the booking amount is ready, verification submission will be unlocked."}
                      </p>
                    ) : null}
                  </form>
                </div>

                {/* RIGHT: snapshot + finance */}
                <div className="space-y-4">
                  {/* Submission Snapshot */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="border-b border-slate-300 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Current Submission Snapshot</p>
                      </div>
                    </div>
                    <div className="px-5 py-1.5">
                      {[
                        { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9 8h6M9 11h6M9 8a3 3 0 010 6H9l4 5" /></svg>, label: "Payment Amount", value: formatCurrency(snapshotPaymentAmount, currency), ok: snapshotPaymentAmount > 0, color: "text-amber-500" },
                        { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" /></svg>, label: "UTR", value: snapshotUtr, ok: Boolean(snapshotUtr), color: "text-violet-500" },
                        { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="17" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>, label: "Payment Date", value: formatDate(snapshotPaymentDate), ok: Boolean(snapshotPaymentDate), color: "text-sky-500" },
                        { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" /></svg>, label: "Receipt", value: snapshotReceiptName, ok: Boolean(snapshotReceiptName), color: "text-teal-500" },
                      ].map(({ icon, label, value, ok, color }) => (
                        <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
                          <span className={`flex items-center gap-2 text-[12px] text-slate-500 ${color}`}>{icon}<span className="text-slate-500">{label}</span></span>
                          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                            {ok ? (
                              <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.35)]">
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
                    <div className="flex items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">Finance Ownership</p>
                          <p className="text-[11px] text-slate-400">Current reviewer & audit timing</p>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${statusTone(paymentStatus)}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>
                        {paymentStatus}
                      </span>
                    </div>
                    <div className="px-5 py-1.5">
                      {[
                        { label: "Assigned Finance", value: booking?.assignedFinanceName || "Awaiting assignment", icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                        { label: "Reviewed By", value: booking?.reviewedByName || "Pending", icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
                        { label: "Submitted", value: formatDateTime(paymentSubmission?.submittedAt), icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg> },
                        { label: "Last Finance Update", value: formatDateTime(paymentVerification?.reviewedAt), icon: <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
                          <span className="flex items-center gap-1.5 text-[12px] text-slate-500">{icon}{label}</span>
                          <span className="text-right text-[12px] font-semibold text-slate-900">{value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>

      {/* Traveler Documentation Section — unchanged below */}
      <motion.section variants={item} className="mt-6 overflow-hidden rounded-[10px]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_rgba(255,255,255,0.96)_38%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#f6fffb_100%)] px-3 py-6">
          <div className="flex flex-col gap-5">
            <div className="w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Step 1 of 2</p>
                  <h2 className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-slate-900">Traveler Documentation Desk</h2>
                </div>
              </div>
              <p className="mt-4 max-w-[800px] text-xs leading-7 text-slate-800">
                {isInternationalTrip
                  ? "This is an international trip, so every traveler must upload both Passport and PAN Card before submission."
                  : "This is a domestic trip, so every traveler must upload at least one PAN Card. Passport is optional, and you can still upload both if available."}
              </p>
              <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Travelers", value: travelers.length, icon: <Users className="h-3.5 w-3.5" />, color: "border-sky-400 text-sky-700 bg-sky-100 text-sky-600", bar: "bg-sky-400" },
                  { label: "Trip Type", value: tripTypeLabel, icon: <MapPin className="h-3.5 w-3.5" />, color: "border-violet-400 text-violet-700 bg-violet-100 text-violet-600", bar: "bg-violet-400" },
                  { label: "Required Docs", value: `${requiredDocCount}/${totalRequiredDocSlots || 0}`, icon: <FileBadge2 className="h-3.5 w-3.5" />, color: "border-amber-400 text-amber-700 bg-amber-100 text-amber-600", bar: "bg-amber-400" },
                  { label: "Completion", value: `${docProgress}%`, icon: <BadgePercent className="h-3.5 w-3.5" />, color: "border-emerald-400 text-emerald-700 bg-emerald-100 text-emerald-600", bar: "bg-emerald-400" },
                ].map(({ label, value, icon, color, bar }) => (
                  <div key={label} className="group relative flex min-h-[120px] flex-col overflow-hidden rounded-[22px] border border-white/70 bg-white/90 px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <div className={`flex min-h-[42px] items-center gap-2 border-l-4 ${color.split(" ")[0]} pl-3`}>
                      <span className={`flex h-7 w-7 items-center justify-center rounded-2xl ${color.split(" ").slice(2).join(" ")}`}>{icon}</span>
                      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${color.split(" ")[1]}`}>{label}</p>
                    </div>
                    <p className="mt-auto pt-4 text-[24px] font-bold leading-none text-slate-900 lg:text-[26px]">{value}</p>
                    <div className={`absolute bottom-0 left-4 right-4 h-1 origin-left scale-x-0 rounded-full ${bar} transition-transform duration-300 group-hover:scale-x-100`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
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
                <div className="relative h-2.5 overflow-visible rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1e3a8a_0%,#6366f1_100%)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${docProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <motion.div
                    className="group absolute top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full border-[3px] border-indigo-600 bg-white shadow-[0_0_12px_rgba(99,102,241,0.6)] hover:scale-110 transition-transform duration-200"
                    initial={{ left: "calc(2% - 8px)", opacity: 0 }}
                    animate={{ left: `calc(${Math.max(2, docProgress)}% - 8px)`, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    {/* Tooltip on hovering the circle */}
                    <div className={`pointer-events-none absolute bottom-full mb-2.5 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100 z-20 ${docProgress > 85 ? "right-[-10px]" : docProgress < 15 ? "left-[-10px]" : "left-1/2 -translate-x-1/2"}`}>
                      <div className="flex flex-col items-start gap-1.5 text-left text-xs font-semibold text-white">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1 w-full">
                          <div className="flex items-center gap-1.5">
                            {isTravelerDocumentsVerifiedComplete ? (
                              <Check className="h-3 w-3 text-emerald-400 stroke-[3] shrink-0" />
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full ${travelerIssuesList.length > 0 ? "bg-rose-500 animate-ping" : "bg-indigo-400 animate-pulse"}`} />
                            )}
                            <span className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">Traveler Desk</span>
                          </div>
                          {isTravelerDocumentsVerifiedComplete && (
                            <span className="text-[8px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/30">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-white mt-0.5">Client: <span className="font-semibold text-slate-200">{booking?.customerName || booking?.clientName || booking?.travelerDetails?.[0]?.fullName || "Traveler"}</span></p>
                        <p className="text-[10px] text-slate-300">Uploads: <span className="font-bold text-indigo-300">{requiredDocCount}</span> of <span className="font-bold text-slate-400">{totalRequiredDocSlots || 0}</span></p>

                        {/* Display traveler document issues in vivid red/rose color inside popover */}
                        {travelerIssuesList.length > 0 && (
                          <div className="mt-1.5 border-t border-slate-800 pt-1.5 w-full flex flex-col gap-1 font-sans">
                            <span className="text-[9px] font-extrabold uppercase tracking-wide text-rose-400 flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Active Document Issues
                            </span>
                            {travelerIssuesList.map((ti) => (
                              <p key={ti.name} className="text-[10px] leading-4 text-rose-300 font-medium whitespace-normal max-w-[200px]">
                                • <span className="font-bold text-rose-400">{ti.name}</span>: Rejected <span className="font-bold text-white underline decoration-rose-500/60">{ti.issues}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-slate-700 bg-slate-900 ${docProgress > 85 ? "right-[14px]" : docProgress < 15 ? "left-[14px]" : "left-1/2 -translate-x-1/2"}`}></div>
                    </div>
                  </motion.div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-[12px] leading-6 text-slate-500">
                <p>1. Complete traveler document uploads first for this booking.</p>
                <p>2. {isInternationalTrip ? "Passport and PAN Card are both mandatory for each traveler." : "PAN Card is mandatory for each traveler. Passport remains optional."}</p>
                <p>3. Once uploads are ready, continue with payment update for finance verification.</p>
                {!isInternationalTrip ? <p>4. Optional passports can still be uploaded for a more complete traveler file set.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 py-6">
          {!hasStructuredDocumentIssues && (documentPortalContext?.issueSummary || travelerVerification?.rejectionReason) ? <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"><p className="font-semibold">{travelerVerification?.rejectionReason || "Document corrections requested"}</p><p className="mt-1 leading-6">{documentPortalContext?.issueSummary || travelerVerification?.rejectionRemarks || "Please update the highlighted files and submit again."}</p></div> : null}
          {hasDocumentTypeMismatch ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-semibold">Wrong document slot detected</p>
              <p className="mt-1 leading-6">Remove or replace the highlighted file before submitting traveler documents.</p>
            </div>
          ) : !allDocsReady ? <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">Upload all required traveler documents first. Payment update should be completed only after this desk is ready.</div> : null}

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
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">{traveler.requiredReadyCount}/{requiredDocKeys.length} required ready</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${traveler.isDocDeskComplete ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
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
                        <span key={`${traveler?._id}-${option.key}-summary`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${ready ? "bg-emerald-100 text-emerald-700" : isRequired ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-white text-slate-500 border border-slate-200"}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-emerald-500" : "bg-slate-300"}`} />
                          {option.label} {isRequired ? "(Required)" : "(Optional)"}
                        </span>
                      );
                    })}
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    {docOptions.map((option) => {
                      const matchedIssue = documentIssues.find((issue) => {
                        const issueTravelerId = String(issue?.travelerId || "").trim();
                        const issueTravelerName = String(issue?.travelerName || "").trim().toLowerCase();
                        const issueDocumentKey = String(issue?.documentKey || "").trim();
                        const travelerId = String(traveler?._id || "").trim();
                        const travelerName = String(traveler?.fullName || "").trim().toLowerCase();
                        return issueDocumentKey === option.key && ((issueTravelerId && travelerId && issueTravelerId === travelerId) || (issueTravelerName && travelerName && issueTravelerName === travelerName));
                      });
                      const matchedVerifiedDocument = verifiedDocuments.find((verifiedDocument) => {
                        const verifiedTravelerId = String(verifiedDocument?.travelerId || "").trim();
                        const verifiedTravelerName = String(verifiedDocument?.travelerName || "").trim().toLowerCase();
                        const verifiedDocumentKey = String(verifiedDocument?.documentKey || "").trim();
                        const travelerId = String(traveler?._id || "").trim();
                        const travelerName = String(traveler?.fullName || "").trim().toLowerCase();
                        return verifiedDocumentKey === option.key && ((verifiedTravelerId && travelerId && verifiedTravelerId === travelerId) || (verifiedTravelerName && travelerName && verifiedTravelerName === travelerName));
                      });
                      return (
                        <DocCard
                          key={`${traveler?._id}-${option.key}`}
                          traveler={traveler}
                          option={option}
                          document={traveler.docs?.[option.key]}
                          disabled={!docsUnlocked}
                          loadingKey={uploadingKey}
                          removingKey={removingKey}
                          uploadError={documentUploadErrors[`${traveler?._id}-${option.key}`] || ""}
                          onUpload={handleUploadDoc}
                          onView={handleView}
                          onRemove={handleRemoveDoc}
                          isRequired={requiredDocKeys.includes(option.key)}
                          tripTypeLabel={tripTypeLabel}
                          issue={matchedIssue}
                          verified={matchedVerifiedDocument}
                          issueTitle={documentIssueTitle}
                          issueMessage={documentIssueMessage}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )) : <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">No traveler records are available for this booking yet.</div>}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[9px] text-red-700 shadow-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="leading-5">
                <span className="font-semibold uppercase tracking-[0.14em] text-red-600">Note:</span>{" "}
                {isInternationalTrip
                  ? "Submit to operations only after every traveler has both Passport and PAN Card uploaded."
                  : "Submit to operations only after every traveler has a PAN Card uploaded. Passport remains optional for domestic trips."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenSubmitDocsConfirm}
              disabled={!docsUnlocked || !allDocsReady || hasDocumentTypeMismatch || submittingDocs || travelers.length === 0}
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
        subtotalAmount={Number(approvedQuotationAmount || 0)}
        currency={currency}
        existingCouponApplication={booking?.paymentSubmission?.couponApplication || null}
        onApplyCoupon={({ payableAmount, invoice }) => {
          setPayableQuotationAmount(Math.round(Number(payableAmount || 0)));
          if (invoice) onBookingUpdated?.({ type: "payment", invoice });
          setCouponModalOpen(false);
          notify("success", "Coupon Applied", "Discounted quotation amount has been added to the payment form.");
        }}
      />
    </motion.div>
  );
}
