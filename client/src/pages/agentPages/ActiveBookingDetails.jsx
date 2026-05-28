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
  Eye,
  EyeOff,
  FileBadge2,
  FileText,
  IdCard,
  LoaderCircle,
  MapPin,
  Upload,
  Users,
  UserSquare2,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/Api";
import CouponBillingModal from "../../modal/CouponBillingModal";

const bankOptions = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank"];
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const BankLogo = ({ bank, className = "h-8 w-8" }) => {
  const frameClass = `${className} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`;

  if (bank === "HDFC Bank") {
    return (
      <div className={frameClass}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#E21C2A" />
          <rect x="10" y="10" width="44" height="44" rx="10" fill="#FFFFFF" />
          <rect x="18" y="18" width="28" height="28" rx="6" fill="#0F3B87" />
          <rect x="29" y="18" width="6" height="28" fill="#FFFFFF" />
          <rect x="18" y="29" width="28" height="6" fill="#FFFFFF" />
          <rect x="26" y="26" width="12" height="12" rx="2" fill="#E21C2A" />
        </svg>
      </div>
    );
  }

  if (bank === "ICICI Bank") {
    return (
      <div className={frameClass}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#FFFFFF" />
          <path d="M18 10C36 12 49 23 54 32C49 41 36 52 18 54C26 46 30 39 30 32C30 25 26 18 18 10Z" fill="#8E1537" />
          <path d="M27 8C41 11 53 22 58 32C53 42 41 53 27 56C34 48 38 40 38 32C38 24 34 16 27 8Z" fill="#F58220" />
          <ellipse cx="33" cy="32" rx="7" ry="18" fill="#FFFFFF" />
          <ellipse cx="33" cy="32" rx="2.6" ry="12" fill="#F3D7B6" />
        </svg>
      </div>
    );
  }

  if (bank === "State Bank of India") {
    return (
      <div className={frameClass}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="24" fill="#1F6BD6" />
          <circle cx="32" cy="25" r="6.5" fill="#FFFFFF" />
          <rect x="29" y="30" width="6" height="18" rx="3" fill="#FFFFFF" />
          <rect x="22" y="46" width="20" height="4" rx="2" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  if (bank === "Axis Bank") {
    return (
      <div className={frameClass}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#FFFFFF" />
          <path d="M33 10L49 52H38.5L34.2 41.8H27.8L23.5 52H14L31 10H33Z" fill="#97144D" />
          <path d="M31.1 20L26.6 33.2H35.4L31.1 20Z" fill="#FFFFFF" />
          <path d="M40.5 20.5H50V30H40.5L44.7 25.2L40.5 20.5Z" fill="#97144D" />
        </svg>
      </div>
    );
  }

  if (bank === "Kotak Bank") {
    return (
      <div className={frameClass}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="22" fill="#1658D3" />
          <path d="M19 24.5C22.5 20.8 27 19 32 19C37 19 41.5 20.8 45 24.5" fill="none" stroke="#E11D48" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M19 39.5C22.5 43.2 27 45 32 45C37 45 41.5 43.2 45 39.5" fill="none" stroke="#E11D48" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="7" fill="#FFFFFF" />
          <path d="M29.5 28.5L35.5 35.5M35.5 28.5L29.5 35.5" stroke="#1658D3" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${frameClass} flex items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600`}>
      {getBankShortCode(bank)}
    </div>
  );
};
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
const formatCurrency = (v, c = "INR") => `${c} ${Math.round(Number(v || 0)).toLocaleString("en-IN")}`;
const normalizeAmountDigits = (v = "") => String(v || "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const formatAmountInput = (v = "") => {
  const digits = normalizeAmountDigits(v);
  return digits ? Number(digits).toLocaleString("en-IN") : "";
};
const parseAmountInput = (v = "") => Number(normalizeAmountDigits(v) || 0);
const getFileExtension = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  const extension = normalized.split(".").pop();
  return extension && extension !== normalized ? extension : "";
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
        return {
          id: `${paymentSubmission?.submittedAt || "tracker"}-${index}`,
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
      receiptStatus: "",
      receiptSentAt: null,
      receiptSentByName: "",
    },
  ];
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

// ─── Payment Tracker ────────────────────────────────────────────────────────

function PaymentTracker({ totalAmount, payments, onAddPayment, onUpdatePayment }) {
  const [inputAmt, setInputAmt] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [inputDate, setInputDate] = useState(() => new Date().toISOString().slice(0, 10));
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
    setInputDate(p.rawDate || new Date().toISOString().slice(0, 10));
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
    setInputDate(new Date().toISOString().slice(0, 10));
    setError("");
  }

  function handleAddOrUpdate() {
    const amt = parseInt(inputAmt.replace(/,/g, ""), 10);
    if (!amt || amt < 1) { setError("Please enter a valid amount."); return; }

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
    const dateLabel = inputDate
      ? new Date(inputDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (editingId) {
      onUpdatePayment({
        id: editingId,
        amount: amt,
        date: dateLabel,
        rawDate: inputDate || new Date().toISOString().slice(0, 10),
        note: inputNote.trim()
      });
      setEditingId(null);
    } else {
      onAddPayment({
        amount: amt,
        date: dateLabel,
        rawDate: inputDate || new Date().toISOString().slice(0, 10),
        note: inputNote.trim()
      });
    }

    setInputAmt("");
    setInputNote("");
    setInputDate(new Date().toISOString().slice(0, 10));
  }

  if (totalAmount <= 0) return null;

  return (
    <div className="mt-3 space-y-3">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 border-l-4 border-l-slate-400 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Total
          </p>
          <p className="mt-1 text-[14px] font-bold text-slate-800">₹{totalAmount.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl bg-teal-50 px-4 py-3 border border-teal-100 border-l-4 border-l-teal-500 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] text-teal-600 font-bold uppercase tracking-wider">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Paid
          </p>
          <p className="mt-1 text-[14px] font-bold text-teal-800">₹{paid.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-3 border border-amber-100 border-l-4 border-l-amber-500 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] text-amber-600 font-bold uppercase tracking-wider">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
        <div className="relative h-2.5 overflow-visible rounded-full bg-slate-200">
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
            <div className={`pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 opacity-0 shadow-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100 z-20 ${pct > 85 ? "right-[-10px]" : pct < 15 ? "left-[-10px]" : "left-1/2 -translate-x-1/2"}`}>
              <div className="flex flex-col items-start gap-1.5 text-left text-xs font-semibold text-white">
                <div className="flex items-center gap-1.5">
                  {pct === 100 ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  )}
                  <span className="font-bold text-white tracking-wide">
                    {pct === 100 ? "All Payments Done ✓" : `${pct}% Paid`}
                  </span>
                </div>
                <div className="h-px w-full bg-slate-700 my-0.5" />
                <p className="text-[10.5px] text-slate-300">
                  <span className="text-slate-400 font-bold">Total Paid: </span>
                  ₹{paid.toLocaleString("en-IN")} / ₹{totalAmount.toLocaleString("en-IN")}
                  {currentOrLastPaymentAmount > 0 && ` (₹${currentOrLastPaymentAmount.toLocaleString("en-IN")})`}
                </p>
                <p className="text-[10.5px] text-slate-300">
                  <span className="text-slate-400 font-bold">Date: </span>
                  {(() => {
                    if (inputDate) {
                      const d = new Date(inputDate);
                      if (!isNaN(d.getTime())) {
                        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                      }
                    }
                    return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  })()}
                </p>
              </div>
              <div className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-slate-700 bg-slate-900 ${pct > 85 ? "right-[14px]" : pct < 15 ? "left-[14px]" : "left-1/2 -translate-x-1/2"}`}></div>
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

              return (
              <div key={p.id} className="group flex items-start gap-3">
                {/* Check dot */}
                <div className={`relative z-10 flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-sm transition-transform group-hover:scale-110 ${
                  isInstallmentVerified ? "bg-teal-500" : "bg-amber-400"
                }`}>
                  {isInstallmentVerified ? (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                </div>
                {/* Card */}
                <div className="flex-1 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all group-hover:shadow-md">
                  <div className="px-3 py-2.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instalment {i + 1}</span>
                      <div className="flex items-center gap-1.5">
                        {p.receiptStatus === "Sent" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50/85 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 shadow-sm">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Receipt Shared
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${
                          isInstallmentVerified
                            ? "border border-teal-100 bg-teal-50/80 text-teal-700"
                            : "border border-amber-100 bg-amber-50 text-amber-700"
                        }`}>
                          <CheckCircle2 className={`h-3 w-3 ${isInstallmentVerified ? "text-teal-500" : "text-amber-500"}`} />
                          {isInstallmentVerified ? "Verified" : "Pending"}
                        </span>
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
                      <p className="mt-2 text-[10px] text-slate-500">
                        Verified {p?.verifiedAt ? `on ${formatDateTime(p.verifiedAt)}` : ""}{p?.verifiedByName ? ` by ${p.verifiedByName}` : ""}
                      </p>
                    ) : null}
                    {p.note && (
                      <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100 text-[10px] text-slate-500">
                        {p.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}

            {/* Pending / Complete node */}
            <div className="flex items-start gap-3">
              <div className={`relative z-10 flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-white ${isComplete ? "bg-emerald-500 shadow-sm" : "bg-slate-100"
                }`}>
                {isComplete ? (
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2.5 transition-all ${isComplete
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "border border-dashed border-slate-200 bg-slate-50"
                }`}>
                {isComplete ? (
                  <>
                    <p className="text-[12px] font-bold tracking-wide">All Payments Complete 🎉</p>
                    <p className="mt-0.5 text-[10px] font-medium text-teal-50/90">Full amount of ₹{totalAmount.toLocaleString("en-IN")} received</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold text-slate-500">Remaining balance</p>
                    <div className="mt-0.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-bold text-slate-700">₹{remaining.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] font-medium text-slate-400">Pending payment</span>
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
            <div className={`pt-3 transition-all duration-300 ${editingId ? "border border-teal-400 bg-teal-50/20 rounded-2xl p-3" : "border-t border-slate-100"}`}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                {editingId ? "Edit Payment" : "Add Payment"}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[110px] flex-1">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">₹</span>
                  <input
                    ref={amountInputRef}
                    value={inputAmt}
                    onChange={(e) => setInputAmt(formatAmountInput(e.target.value))}
                    inputMode="numeric"
                    placeholder="Amount"
                    className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-6 pr-3 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="h-9 w-32 rounded-xl border border-slate-300 bg-white px-2 text-[12px] text-slate-600 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                />
                <input
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="h-9 min-w-[80px] flex-1 rounded-xl border border-slate-300 bg-white px-3 text-[12px] text-slate-600 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={handleAddOrUpdate}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-teal-500 px-3 text-[12px] font-semibold text-white transition hover:bg-teal-600 active:scale-95"
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
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 text-[12px] font-semibold text-slate-600 transition active:scale-95"
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

// ─── Toast / Label / SnapshotRow / helpers (unchanged) ──────────────────────

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

function DocCard({
  traveler,
  option,
  document,
  disabled,
  loadingKey,
  uploadError,
  onUpload,
  onView,
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
  const uploaded = Boolean(document?.url);
  const hasIssue = Boolean(issue);
  const isVerified = Boolean(verified);
  const slotStatus = hasIssue ? "REJECTED" : isVerified ? "VERIFIED" : uploaded ? "READY" : isRequired ? "REQUIRED" : "OPTIONAL";
  const slotStatusClassName = hasIssue
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

          <div className="mt-4 flex flex-wrap gap-2">
            {uploaded ? <button type="button" onClick={() => onView(document)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">View File</button> : null}
            <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || uploading} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:bg-slate-300 ${theme.cta}`}>
              {uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploaded ? "Replace Upload" : "Upload Now"}
            </button>
          </div>
          {uploadError ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-xs font-semibold">File size is too large</p>
              <p className="mt-1 text-xs leading-5">{uploadError}</p>
            </div>
          ) : null}
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => onUpload(e, traveler, option)} />
        </div>
      </div>
      {uploading ? <div className="absolute inset-0 flex items-center justify-center bg-white/70"><div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"><LoaderCircle className="h-4 w-4 animate-spin" />Uploading...</div></div> : null}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const isPaymentVerified = paymentStatus === "Verified" || booking?.paymentStatus === "Paid";
  const hasSubmittedPayment = Boolean(paymentSubmission?.submittedAt);
  const currentReceipt = isRejectedPayment ? {} : paymentSubmission?.receipt || {};
  const docsUnlocked = true;
  const bookingConfirmationReady = isPaymentVerified;

  const [feedback, setFeedback] = useState(null);
  const [bankName, setBankName] = useState(isRejectedPayment ? "" : paymentSubmission?.bankName || "");
  const [bankMenuOpen, setBankMenuOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
  const [quotationAmount, setQuotationAmount] = useState("");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(isRejectedPayment ? "" : formatInputDate(paymentSubmission?.paymentDate));
  const [remarks, setRemarks] = useState(isRejectedPayment ? "" : booking?.remarks || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [preparingInvoice, setPreparingInvoice] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [documentUploadErrors, setDocumentUploadErrors] = useState({});
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [isSubmitDocsConfirmOpen, setIsSubmitDocsConfirmOpen] = useState(false);
  const [isPaymentUpdateOpen, setIsPaymentUpdateOpen] = useState(false);
  const [payableQuotationAmount, setPayableQuotationAmount] = useState(0);
  const bankDropdownRef = useRef(null);

  // ── Payment tracker state ──
  const [trackerPayments, setTrackerPayments] = useState([]);
  const [trackerIdCounter, setTrackerIdCounter] = useState(1);

  const approvedQuotationAmount = useMemo(
    () =>
      Math.round(
        Number(
          booking?.quotation?.clientTotalAmount ||
          booking?.quotation?.pricingTotalAmount ||
          booking?.invoice?.totalAmount ||
          booking?.totalAmount ||
          0,
        ),
      ),
    [
      booking?.invoice?.totalAmount,
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
  const trackerPaidAmount = useMemo(
    () =>
      trackerPayments.reduce(
        (sum, payment) => sum + Math.round(Number(payment?.amount || 0)),
        0,
      ),
    [trackerPayments],
  );
  const resolvedQuotationAmount = expectedPaymentAmount;
  const hasExactPaymentMismatch = false;
  const paymentAmountWarningMessage = "";

  const activeReceiptMimeType = receiptFile?.type || currentReceipt?.mimeType || "";
  const activeReceiptFileName = receiptFile?.name || currentReceipt?.fileName || "";
  const activeReceiptExtension = getFileExtension(activeReceiptFileName);
  const isPdfReceiptPreview = activeReceiptMimeType === "application/pdf" || activeReceiptExtension === "pdf";
  const isImageReceiptPreview = String(activeReceiptMimeType || "").startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(activeReceiptExtension);
  const canInlinePreviewReceipt = Boolean(receiptPreviewUrl) && (isPdfReceiptPreview || isImageReceiptPreview);

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
        return {
          ...traveler,
          requiredReadyCount,
          uploadedDocCount,
          isDocDeskComplete: requiredReadyCount === requiredDocKeys.length,
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
  const latestTrackerPayment = trackerPayments.length ? trackerPayments[trackerPayments.length - 1] : null;
  const effectivePaymentDate =
    latestTrackerPayment?.rawDate ||
    paymentDate ||
    (!isRejectedPayment ? formatInputDate(paymentSubmission?.paymentDate) : "");
  const effectiveRemarks =
    remarks.trim() ||
    latestTrackerPayment?.note ||
    (!isRejectedPayment ? booking?.remarks || "" : "");
  const snapshotBank = bankName || (!isRejectedPayment ? paymentSubmission?.bankName || "" : "");
  const snapshotUtr = utrNumber || (!isRejectedPayment ? paymentSubmission?.utrNumber || "" : "");
  const snapshotPaymentAmount = Math.round(
    Number(
      latestTrackerPayment?.amount ||
      paymentSubmission?.amount ||
      0,
    ),
  );
  const snapshotPaymentDate = effectivePaymentDate;
  const snapshotReceiptName = receiptFile?.name || currentReceipt?.fileName || "";
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
        ? { tone: "border-blue-200 bg-blue-50 text-blue-700", title: "Finance review in progress", msg: "Finance will verify your bank, UTR, receipt, and payment date." }
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
    setBankName(isRejectedPayment ? "" : paymentSubmission?.bankName || "");
    setBankMenuOpen(false);
    setUtrNumber(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
    setPayableQuotationAmount(initialQuotationAmount);
    setPaymentDate(isRejectedPayment ? "" : formatInputDate(paymentSubmission?.paymentDate));
    setRemarks(isRejectedPayment ? "" : booking?.remarks || "");
    const hydratedTrackerPayments = buildTrackerPaymentsFromSubmission(paymentSubmission);
    setTrackerPayments(hydratedTrackerPayments);
    setTrackerIdCounter(hydratedTrackerPayments.length + 1);
    setReceiptFile(null);
    setReceiptPreviewUrl("");
    setIsReceiptPreviewOpen(false);
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
    paymentSubmission?.submittedAt,
    paymentSubmission?.trackerPayments,
    paymentSubmission?.utrNumber,
  ]);

  useEffect(() => {
    if (receiptFile) {
      const objectUrl = URL.createObjectURL(receiptFile);
      setReceiptPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setReceiptPreviewUrl(currentReceipt?.url || "");
    return undefined;
  }, [currentReceipt?.url, receiptFile]);

  useEffect(() => {
    if (!canInlinePreviewReceipt && isReceiptPreviewOpen) {
      setIsReceiptPreviewOpen(false);
    }
  }, [canInlinePreviewReceipt, isReceiptPreviewOpen]);

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

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!bankDropdownRef.current?.contains(event.target)) {
        setBankMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setBankMenuOpen(false);
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

  const handleAddTrackerPayment = (p) => {
    setTrackerPayments((prev) => [...prev, { id: trackerIdCounter, ...p }]);
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
    if (!trackerPayments.length || trackerPaidAmount <= 0) {
      return notify("warning", "Add Payment First", "Please add the payment amount in the payment tracker before submitting.");
    }
    if (!isTravelerDocumentsVerifiedComplete) {
      return notify(
        "warning",
        "Traveler Documents Pending",
        "Payment submit tabhi unlock hoga jab operations sabhi required traveler documents verify kar dein aur kisi document me koi issue pending na ho.",
      );
    }
    if (!bankName.trim() || !utrNumber.trim() || !effectivePaymentDate || !expectedPaymentAmount) return notify("error", "Missing Fields", "Bank name, UTR, payment date, and payable amount are required.");
    if (!receiptFile && !currentReceipt?.url) return notify("error", "Receipt Missing", isRejectedPayment ? "Please upload the corrected payment receipt before resubmitting." : "Please upload the payment receipt before submitting.");
    try {
      setSubmittingPayment(true);
      const fd = new FormData();
      fd.append("bankName", bankName.trim());
      fd.append("utrNumber", utrNumber.trim().toUpperCase());
      fd.append("paymentDate", effectivePaymentDate);
      fd.append("remarks", effectiveRemarks);
      fd.append("paymentAmount", String(trackerPaidAmount));
      fd.append("trackerPayments", JSON.stringify(trackerPayments));
      fd.append("onBehalfOf", booking?.invoiceNumber || booking?.bookingReference || "Booking Payment");
      if (receiptFile) fd.append("paymentReceipt", receiptFile);
      const { data } = await API.put(`/agent/invoices/${invoiceId}/payment-status`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onBookingUpdated?.({ type: "payment", invoice: data?.invoice });
      setReceiptFile(null);
      setBankMenuOpen(false);
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

  const handleSubmitDocs = async () => {
    if (isTravelerDocumentsVerifiedComplete) {
      notify(
        "info",
        "Already Verified",
        "All required traveler documents have already been verified and marked as correct by operations. No further submission is required."
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
                    {/* Row 1: Bank | UTR | Amount */}
                    <div className="grid gap-3 xl:grid-cols-3">

                      {/* Bank Name */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ring-1 ring-slate-100/60">
                        <div className="mb-2.5 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Bank Name</span>
                        </div>
                        <div
                          ref={bankDropdownRef}
                          className={`relative rounded-[14px] border bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-2 transition-all duration-200 ${bankMenuOpen ? "border-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]" : "border-slate-300 focus-within:border-emerald-300"}`}
                        >
                          <button
                            type="button"
                            onClick={() => setBankMenuOpen((prev) => !prev)}
                            className={`group flex h-10 w-full items-center gap-2.5 rounded-xl border bg-white pl-3 pr-2.5 text-left transition-all duration-200 ${bankMenuOpen ? "border-emerald-200 shadow-sm" : "border-slate-300 hover:border-slate-400"}`}
                            aria-haspopup="listbox"
                            aria-expanded={bankMenuOpen}
                          >
                            {bankName ? (
                              <BankLogo bank={bankName} className="h-7 w-7" />
                            ) : (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" />
                                </svg>
                              </div>
                            )}
                            <p className={`flex-1 truncate text-[13px] font-medium ${bankName ? "text-slate-800" : "text-slate-400"}`}>{bankName || "Choose your bank"}</p>
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${bankMenuOpen ? "bg-emerald-100 text-emerald-700 rotate-180" : "bg-slate-100 text-slate-400"}`}>
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
                                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${isSelected ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"}`}
                                      role="option"
                                      aria-selected={isSelected}
                                    >
                                      <BankLogo bank={bank} className="h-8 w-8" />
                                      <div className="min-w-0 flex-1">
                                        <p className={`truncate text-[13px] font-semibold ${isSelected ? "text-emerald-900" : "text-slate-700"}`}>{bank}</p>
                                      </div>
                                      {isSelected && <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          ) : null}
                        </div>
                        <p className="mt-2 px-0.5 text-[11px] leading-4 text-emerald-700">Select the bank from which the payment was transferred.</p>
                      </div>

                      {/* UTR */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs ring-1 ring-slate-100/60">
                        <div className="mb-2.5 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">UTR / Transaction ID</span>
                        </div>
                        <div className="relative [&>span]:hidden">
                          <svg className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
                          </svg>
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
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/60 xl:col-span-3">
                        {/* Card header */}
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
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
                            <div className="mt-4 mb-1 flex items-center gap-2">
                              <div className="h-px flex-1 bg-slate-100" />
                              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Payment Tracker</span>
                              <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <PaymentTracker
                              totalAmount={trackerTotalAmount}
                              payments={trackerPayments}
                              onAddPayment={handleAddTrackerPayment}
                              onUpdatePayment={handleEditTrackerPayment}
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
                            {canInlinePreviewReceipt ? (
                              <button
                                type="button"
                                onClick={() => setIsReceiptPreviewOpen((prev) => !prev)}
                                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-4 text-[12px] font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 sm:opacity-0 sm:translate-y-1 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
                              >
                                {isReceiptPreviewOpen ? <><EyeOff className="h-3.5 w-3.5" />Hide preview</> : <><Eye className="h-3.5 w-3.5" />Preview receipt</>}
                              </button>
                            ) : null}
                            {currentReceipt?.url ? (
                              <button type="button" onClick={handleDownloadReceipt} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-[12px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 4v12" /></svg>
                                Download current receipt
                              </button>
                            ) : null}
                            <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98]">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                              {currentReceipt?.url ? "Replace receipt" : "Upload receipt"}
                              <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {canInlinePreviewReceipt && isReceiptPreviewOpen ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Receipt Preview</p>
                                    <p className="truncate text-sm font-medium text-slate-800">{activeReceiptFileName || "Payment receipt"}</p>
                                  </div>
                                  <button type="button" onClick={() => setIsReceiptPreviewOpen(false)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100">
                                    <EyeOff className="h-3.5 w-3.5" />Close
                                  </button>
                                </div>
                                {isPdfReceiptPreview ? (
                                  <iframe src={receiptPreviewUrl} title="Payment receipt preview" className="h-[460px] w-full bg-white" />
                                ) : (
                                  <div className="bg-slate-50 p-4">
                                    <img src={receiptPreviewUrl} alt={activeReceiptFileName || "Payment receipt preview"} className="max-h-[460px] w-full rounded-xl border border-slate-200 bg-white object-contain" />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
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
                          ? "Payment submit ke liye booking amount prepare kiya ja raha hai."
                          : "Booking amount ready hote hi verification submit unlock ho jayega."}
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
                        { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" /></svg>, label: "Bank", value: snapshotBank, ok: Boolean(snapshotBank), color: "text-blue-500" },
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
          {!allDocsReady ? <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">Upload all required traveler documents first. Payment update should be completed only after this desk is ready.</div> : null}

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
                          uploadError={documentUploadErrors[`${traveler?._id}-${option.key}`] || ""}
                          onUpload={handleUploadDoc}
                          onView={handleView}
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
