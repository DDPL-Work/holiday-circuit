import { FileBadge2, IdCard } from "lucide-react";

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const docOptions = [
  { key: "passport", label: "Passport", icon: FileBadge2, tone: "sky" },
  { key: "governmentId", label: "PAN Card", icon: IdCard, tone: "violet" },
];

export const INDIAN_DESTINATION_KEYWORDS = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

export const normalizeDoc = (d = {}) => ({ url: String(d?.url || ""), fileName: String(d?.fileName || "") });

export const normalizeReceipt = (d = {}) => ({
  url: String(d?.url || ""),
  fileName: String(d?.fileName || ""),
  mimeType: String(d?.mimeType || ""),
  size: Number(d?.size || 0),
});

export const formatCurrency = (v, c = "INR") => `${c} ${Math.round(Number(v || 0)).toLocaleString("en-IN")}`;

export const normalizeAmountDigits = (v = "") => String(v || "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");

export const formatAmountInput = (v = "") => {
  const digits = normalizeAmountDigits(v);
  return digits ? Number(digits).toLocaleString("en-IN") : "";
};

export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Dates pending";
  const format = (value) => value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${format(start)} - ${format(end)}`;
};

export const formatPax = (adults, children) =>
  children > 0 ? `${adults} Adults, ${children} Kids` : `${adults} Adults`;

export const getTripDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (Number.isNaN(diffDays) || diffDays <= 0) return "";
  const nights = diffDays;
  const days = diffDays + 1;
  return `${nights}N, ${days}D`;
};

export const formatDate = (v) => {
  if (!v) return "Pending";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDateTime = (v) => {
  if (!v) return "Pending";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
};

export const formatInputDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildTrackerPaymentsFromSubmission = (paymentSubmission = {}) => {
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
          utrNumber: String(entry?.utrNumber || (trackerEntries.length === 1 ? paymentSubmission?.utrNumber : "")).trim(),
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
      utrNumber: String(paymentSubmission?.utrNumber || "").trim(),
    },
  ];
};

export const statusTone = (s) => s === "Verified"
  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
  : s === "Pending"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : s === "Rejected"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

export const resolveDocs = (traveler = {}) => {
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

export const getDocumentTypeMismatchMessage = (documentKey = "", document = {}) => {
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

export const getOpsPayableAmountFromInvoice = (invoice = {}) => {
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

export const isValidPaymentTrackerEntry = (payment = {}) => {
  const amount = Math.round(Number(payment?.amount || 0));
  const rawDate = String(payment?.rawDate || payment?.paymentDate || "").trim();
  const parsedDate = rawDate ? new Date(rawDate) : null;
  return Number.isFinite(amount) && amount > 0 && parsedDate && !Number.isNaN(parsedDate.getTime());
};

export const getInitials = (value = "") =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TR";

export const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;
  return INDIAN_DESTINATION_KEYWORDS.some((keyword) => normalizedDestination.includes(keyword));
};

export const getRequiredDocumentKeys = (isInternationalTrip) =>
  isInternationalTrip ? ["passport", "governmentId"] : ["governmentId"];
