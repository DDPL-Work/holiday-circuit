import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import API from "../../../utils/Api";
import InvoiceDocumentModal from "../../../modal/InvoiceDocumentModal";

const mockInvoices = [
  {
    id: "mock-invoice-1",
    invoiceNumber: "BP-2026-041",
    dmcName: "Bali Paradise DMC",
    amount: 480000,
    currency: "INR",
    status: "Submitted",
    dueDate: "2026-04-10",
    dueDateValue: "2026-04-10",
    assignedFinanceName: "Kavitha Suresh",
    submittedAt: "2026-04-04",
    isMock: true,
  },
  {
    id: "mock-invoice-2",
    invoiceNumber: "DL-2026-028",
    dmcName: "Dubai Luxury Partners",
    amount: 320000,
    currency: "INR",
    status: "Approved",
    dueDate: "2026-04-08",
    dueDateValue: "2026-04-08",
    assignedFinanceName: "Meena Sharma",
    submittedAt: "2026-04-03",
    isMock: true,
  },
  {
    id: "mock-invoice-3",
    invoiceNumber: "MD-2026-015",
    dmcName: "Maldives Dream DMC",
    amount: 750000,
    currency: "INR",
    status: "Rejected",
    dueDate: "2026-04-06",
    dueDateValue: "2026-04-06",
    assignedFinanceName: "Rajan Pillai",
    submittedAt: "2026-04-02",
    financeNotes: "Amount mismatch with agreed rate",
    isMock: true,
  },
  {
    id: "mock-invoice-4",
    invoiceNumber: "SE-2026-033",
    dmcName: "Singapore Elite Tours",
    amount: 215000,
    currency: "INR",
    status: "Paid",
    dueDate: "2026-04-05",
    dueDateValue: "2026-04-05",
    assignedFinanceName: "Tarun Gupta",
    submittedAt: "2026-04-01",
    isMock: true,
  },
  {
    id: "mock-invoice-5",
    invoiceNumber: "TP-2026-019",
    dmcName: "Thailand Prestige DMC",
    amount: 390000,
    currency: "INR",
    status: "In Review",
    dueDate: "2026-04-12",
    dueDateValue: "2026-04-12",
    assignedFinanceName: "Kavitha Suresh",
    submittedAt: "2026-04-04",
    isMock: true,
  },
];

const mismatchReasons = [
  "Amount mismatch",
  "Missing supporting documents",
  "Contract rate issue",
  "Duplicate payout request",
  "Other",
];

const avatarThemes = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

const uiStatusStyles = {
  "Under Review": "border border-amber-200 bg-amber-50 text-amber-700",
  Validated: "border border-blue-200 bg-blue-50 text-blue-600",
  Mismatch: "border border-rose-200 bg-rose-50 text-rose-600",
  Settled: "border border-emerald-200 bg-emerald-50 text-emerald-600",
};

const feedbackStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const formatCurrency = (value, currency = "INR") => {
  const amount = Number(value || 0);
  if (currency && currency !== "INR") {
    return `${currency} ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  return `Rs ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isPastDate = (value) => {
  if (!value) return false;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate < today;
};

const mapRawStatusToUi = (status) => {
  if (status === "Paid") return "Settled";
  if (status === "Approved") return "Validated";
  if (status === "Rejected") return "Mismatch";
  return "Under Review";
};

const getInitials = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

const getAvatarTheme = (name = "") => {
  const total = String(name || "")
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return avatarThemes[total % avatarThemes.length];
};

const normalizeInvoice = (invoice, index = 0) => {
  const assignedTo =
    invoice?.assignedFinanceName ||
    invoice?.reviewedByName ||
    mockInvoices[index % mockInvoices.length]?.assignedFinanceName ||
    "Unassigned";
  const uiStatus = mapRawStatusToUi(invoice?.status);
  const dueDateValue = invoice?.dueDateValue || invoice?.dueDate;

  return {
    ...invoice,
    assignedTo,
    avatar: getInitials(assignedTo),
    avatarClass: getAvatarTheme(assignedTo),
    amountDisplay: formatCurrency(invoice?.amount, invoice?.currency),
    dueDateLabel: formatDisplayDate(dueDateValue),
    isDuePast: uiStatus !== "Settled" && isPastDate(dueDateValue),
    uiStatus,
  };
};

const buildInvoiceModalPayload = (invoice = {}) => ({
  _id: invoice?.id || "",
  id: invoice?.invoiceNumber || invoice?.id || "",
  ref: invoice?.queryId || "-",
  party: invoice?.dmcName || invoice?.supplierName || "-",
  date: invoice?.dueDate || invoice?.invoiceDate || "-",
  dateValue: invoice?.dueDateValue || invoice?.invoiceDateValue || "",
  amountValue: Number(invoice?.amount || 0),
  amount: formatCurrency(invoice?.amount, invoice?.currency),
  agreedRate: formatCurrency(invoice?.opsServicesTotal || 0, invoice?.currency),
  agreedRateValue: Number(invoice?.opsServicesTotal || 0),
  dmcInvoiceAmount: formatCurrency(invoice?.dmcServicesTotal || 0, invoice?.currency),
  dmcInvoiceAmountValue: Number(invoice?.dmcServicesTotal || 0),
  taxValue: Number(invoice?.tax || 0),
  tax: formatCurrency(invoice?.tax || 0, invoice?.currency),
  status: invoice?.status || "Submitted",
  method: invoice?.templateVariant || "",
  quotationNumber: invoice?.quotationNumber || "",
  items: invoice?.items || [],
  documents: invoice?.documents || [],
  payoutReference: invoice?.payoutReference || "",
  payoutDate: invoice?.payoutDate || "",
  payoutDateValue: invoice?.payoutDateValue || "",
  payoutBank: invoice?.payoutBank || "",
  payoutAmount: Number(invoice?.payoutAmount || 0),
});

function FileIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 2.5A1.5 1.5 0 0 0 3.5 4v12A1.5 1.5 0 0 0 5 17.5h10A1.5 1.5 0 0 0 16.5 16V7.12a1.5 1.5 0 0 0-.44-1.06l-3.12-3.12A1.5 1.5 0 0 0 11.88 2.5H5Zm6 1.56 3.44 3.44H11V4.06Z" />
    </svg>
  );
}

function EyeIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M2.75 12s3.35-5.5 9.25-5.5 9.25 5.5 9.25 5.5-3.35 5.5-9.25 5.5S2.75 12 2.75 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AlertIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m22 2-7 20-4-9-9-4L22 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 2 11 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 19l9 2-9-18-9 18 9-2Zm0 0v-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${uiStatusStyles[status] || uiStatusStyles["Under Review"]}`}
    >
      {status}
    </span>
  );
}

function ContentLoader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

function FeedbackToast({ feedback, onClose }) {
  if (!feedback) return null;

  return (
    <div className="fixed right-4 top-4 z-[80] w-full max-w-sm sm:right-6 sm:top-6">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${feedbackStyles[feedback.type] || feedbackStyles.success}`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{feedback.title}</p>
            <p className="mt-1 text-sm leading-5">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidateModal({ invoice, submitting, onClose, onConfirm }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(false);
  }, [invoice?.id]);

  if (!invoice) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[365px] overflow-hidden bg-white shadow-[0_26px_60px_rgba(15,23,42,0.28)]"
        style={{ borderRadius: "24px" }}
      >

        {/* Header — #2b67f6 blue */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: "#2b67f6" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ background: "rgba(255,255,255,0.14)" }}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Validate Payout</p>
              <p className="text-xs text-blue-100">Confirm invoice validation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/20"
            style={{ background: "rgba(255,255,255,0.14)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-4" style={{ background: "#fff" }}>
          {/* Info card — light gray bg, NO blue border, slate dividers */}
          <div className="overflow-hidden" style={{ borderRadius: "16px", border: "1px solid #BEDBFE", background: "#EFF5FC" }}>
            {[
              { label: "DMC Partner", value: invoice.partner, highlight: false },
              { label: "Invoice No", value: invoice.id, highlight: false },
              { label: "Payout Amount", value: invoice.amountDisplay, highlight: true },
            ].map(({ label, value, highlight }, index) => (
              <div
                key={label}
                style={{ borderBottom: index !== 2 ? "1px solid #BEDBFF" : "none" }}
                className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm"
              >
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={highlight
                  ? { color: "#00A63E", fontWeight: 700, fontSize: "15px" }
                  : { color: "#636464", fontWeight: 600 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Checkbox */}
          <div className="mt-4 flex items-start gap-3 cursor-pointer" onClick={() => setChecked(prev => !prev)}>
            <div
              className="mt-0.5 shrink-0 flex items-center justify-center transition-colors"
              style={{
                width: 20, height: 20,
                borderRadius: 6,
                border: checked ? "2px solid #2b67f6" : "2px solid #cbd5e1",
                background: checked ? "#2b67f6" : "#fff",
              }}
            >
              {checked && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="m5 13 4 4L19 7" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </svg>
              )}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Verification Checkpoint</p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                I confirm the rate matches the system invoice and all details are accurate.
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 20px" }}>
          {/* Cancel */}
          <button
            onClick={onClose}
            style={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              background: "#fff",
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          {/* Confirm & Validate */}
          <button
            type="button"
            disabled={!checked}
            onClick={() => checked && onClose()}
            style={{
              borderRadius: 14,
              padding: "11px 8px",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              border: "none",
              cursor: checked ? "pointer" : "not-allowed",
              background: checked ? "#9bc6ff" : "#d9e8ff",
              color: checked ? "#1f5fef" : "#8eb3f4",
              transition: "background 0.15s",
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Confirm &amp; Validate
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EscalatePanel({ invoice, submitting, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setReason("");
    setMessage("");
  }, [invoice?.id]);

  if (!invoice) return null;

  const isDisabled = !reason || !message.trim() || submitting;
  const statusTone =
    invoice.uiStatus === "Validated"
      ? "border border-blue-500/20 bg-blue-500/12 text-blue-300"
      : invoice.uiStatus === "Mismatch"
        ? "border border-rose-500/20 bg-rose-500/12 text-rose-300"
        : invoice.uiStatus === "Settled"
          ? "border border-emerald-500/20 bg-emerald-500/12 text-emerald-300"
          : "border border-amber-400/20 bg-amber-300/12 text-amber-200";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%", opacity: 0.98 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[336px] flex-col overflow-hidden border-l border-white/6 bg-[#070707] shadow-[-24px_0_72px_rgba(0,0,0,0.58)]"
      >
        <div className="border-b border-white/8 bg-[linear-gradient(180deg,#8d171d_0%,#4a0f16_46%,#131313_100%)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-rose-100 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                <AlertIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white">Escalate to Admin</h2>
                <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-white/55">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">Invoice Summary</p>
            </div>
            <div className="rounded-[16px] border border-white/8 bg-[#0d1320] px-4 py-3 shadow-[0_16px_30px_rgba(0,0,0,0.22)]">
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-white/40">DMC Partner:</span>
                  <span className="max-w-[150px] text-right text-[13px] font-medium text-white/88">{invoice.dmcName}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-white/40">Amount:</span>
                  <span className="text-right text-[13px] font-semibold text-[#ff4d4f]">{invoice.amountDisplay}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-white/40">Status:</span>
                  <span className={`inline-flex min-w-[112px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone}`}>
                    {invoice.uiStatus}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Reason for Mismatch <span className="text-rose-400">*</span>
              </p>
            </div>
            <div className="relative">
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full appearance-none rounded-[12px] border border-[#273140] bg-[#0c1320] px-4 py-3 text-[13px] text-white/90 outline-none transition placeholder:text-white/30 focus:border-rose-400/45"
              >
                <option value="" className="bg-[#0c1320] text-white/45">
                  Select a reason...
                </option>
                {mismatchReasons.map((item) => (
                  <option key={item} value={item} className="bg-[#0c1320] text-white">
                    {item}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35">
                <ChevronIcon />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Admin Notification <span className="text-rose-400">*</span>
              </p>
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Provide detailed explanation for escalation to admin..."
              className="min-h-[132px] w-full resize-none rounded-[14px] border border-[#273140] bg-[#0c1320] px-4 py-1 text-[13px] leading-6 text-white/90 outline-none transition placeholder:text-white/28 focus:border-rose-400/45"
            />
          </section>

          <div className="mt-auto grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => onConfirm(invoice, reason, message)}
              className={`rounded-[12px] px-4 py-2.5 text-xs font-semibold transition ${isDisabled
                  ? "cursor-not-allowed bg-rose-900/35 text-white/35"
                  : "bg-[#b4171f] text-white hover:bg-[#cb1d27]"
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <SendIcon />
                {submitting ? "Escalating..." : "Escalate Now"}
              </span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default function InternalDMCInvoices() {
  const user = useSelector((state) => state.auth.user);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [validateInvoice, setValidateInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [escalateInvoice, setEscalateInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: response } = await API.get("/admin/internal-invoices");
      const rows = response?.data?.invoices;

      if (Array.isArray(rows) && rows.length) {
        setInvoices(rows);
      } else {
        setInvoices(mockInvoices);
      }
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Unable to load internal DMC invoices right now.");
      setInvoices(mockInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    const isOverlayOpen = Boolean(validateInvoice || selectedInvoice || escalateInvoice);
    if (!isOverlayOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [validateInvoice, selectedInvoice, escalateInvoice]);

  const displayInvoices = useMemo(
    () => invoices.map((invoice, index) => normalizeInvoice(invoice, index)),
    [invoices],
  );

  const summary = useMemo(
    () =>
      displayInvoices.reduce(
        (acc, invoice) => {
          if (invoice.uiStatus === "Under Review") acc.underReview += 1;
          if (invoice.uiStatus === "Validated") acc.validated += 1;
          if (invoice.uiStatus === "Mismatch") acc.mismatch += 1;
          if (invoice.uiStatus === "Settled") acc.settled += 1;
          return acc;
        },
        { underReview: 0, validated: 0, mismatch: 0, settled: 0 },
      ),
    [displayInvoices],
  );

  const updateInvoiceRow = (updatedInvoice) => {
    if (!updatedInvoice?.id) return;

    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) => (invoice.id === updatedInvoice.id ? { ...invoice, ...updatedInvoice } : invoice)),
    );
  };

  const handleInvoiceUpdated = (updatedInvoice) => {
    if (!updatedInvoice?.id) return;

    updateInvoiceRow(updatedInvoice);
    if (selectedInvoice) {
      const normalizedUpdatedInvoice = normalizeInvoice(updatedInvoice);
      setSelectedInvoice(buildInvoiceModalPayload(normalizedUpdatedInvoice));
    }
  };

  const handleValidate = async (invoice) => {
    if (!invoice) return;

    if (invoice.uiStatus === "Validated") {
      setValidateInvoice(null);
      setFeedback({
        type: "success",
        title: "Already Validated",
        message: `${invoice.invoiceNumber} is already validated.`,
      });
      return;
    }

    if (invoice.uiStatus === "Settled") {
      setValidateInvoice(null);
      setFeedback({
        type: "warning",
        title: "Already Settled",
        message: `${invoice.invoiceNumber} is already settled and does not need validation again.`,
      });
      return;
    }

    try {
      setActionLoading(true);

      if (invoice.isMock) {
        const nextInvoice = {
          ...invoice,
          status: "Approved",
          reviewedByName: user?.name || "Finance Manager",
          financeNotes: "Invoice validated by finance manager",
        };
        updateInvoiceRow(nextInvoice);
      } else {
        const { data: response } = await API.patch(`/admin/internal-invoices/${invoice.id}/status`, {
          status: "Approved",
        });
        const updatedInvoice = response?.data;
        updateInvoiceRow(updatedInvoice);
      }

      setValidateInvoice(null);
      setFeedback({
        type: "success",
        title: "Invoice Validated",
        message: `${invoice.invoiceNumber} moved to validated status.`,
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Validation Failed",
        message: actionError?.response?.data?.message || "Unable to validate this invoice right now.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (invoice, reason, message) => {
    if (!invoice) return;

    const financeReason = `${reason}${message.trim() ? ` - ${message.trim()}` : ""}`;

    try {
      setActionLoading(true);

      if (invoice.isMock) {
        updateInvoiceRow({
          ...invoice,
          status: "Rejected",
          reviewedByName: user?.name || "Finance Manager",
          financeNotes: financeReason,
        });
      } else {
        const { data: response } = await API.patch(`/admin/internal-invoices/${invoice.id}/status`, {
          status: "Rejected",
          reason: financeReason,
        });
        updateInvoiceRow(response?.data);
      }

      setSelectedInvoice(null);
      setEscalateInvoice(null);
      setFeedback({
        type: "warning",
        title: "Escalated To Admin",
        message: `${invoice.invoiceNumber} has been flagged for admin review.`,
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Escalation Failed",
        message: actionError?.response?.data?.message || "Unable to escalate this invoice right now.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8fc] font-sans">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between px-2 py-3">
          <div>
            <p className="text-[15px] font-semibold text-slate-800">Internal DMC Invoices</p>
            <p className="mt-0.5 text-xs text-slate-500">Thursday, April 9, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-slate-800">{user?.name || "Finance Manager"}</p>
          </div>
        </div>
      </div>

      <div className="px- py- pt-6  ">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-slate-900">Internal DMC Invoices</h1>
            <p className="mt-1 text-[14px] text-slate-500">Payout validation view - review and settle DMC invoices</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#11192d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1b2642]"
          >
            <ReportIcon />
            Submit Finance Report
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Under Review", value: summary.underReview, color: "text-amber-500" },
            { label: "Validated", value: summary.validated, color: "text-blue-500" },
            { label: "Mismatched", value: summary.mismatch, color: "text-rose-500" },
            { label: "Settled", value: summary.settled, color: "text-emerald-500" },
          ].map((card) => (
            <div key={card.label} className="rounded-[12px] border border-slate-200 bg-white px-5 py-4 shadow-xs">
              <p className="text-xs text-slate-500">{card.label}</p>
              <div className="mt-2 min-h-[28px] flex items-center">
                {loading ? (
                  <ContentLoader label="Loading..." />
                ) : (
                  <p className={`text-[18px] font-bold ${card.color}`}>{card.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadInvoices}
              className="rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <FileIcon />
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900">DMC Invoice Payout Tracker</h2>
          </div>

          <div className="finance-transparent-scrollbar overflow-x-auto overflow-y-hidden pb-2">
            <div className="min-w-305">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Invoice No", "DMC Partner", "Amount", "Assigned To", "Status", "Due Date", "Action"].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                        <ContentLoader label="Loading internal DMC invoices..." />
                      </td>
                    </tr>
                  ) : displayInvoices.length ? (
                    displayInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] font-semibold text-slate-900">{invoice.invoiceNumber}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[14px] font-semibold text-slate-700">{invoice.dmcName}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[14px] font-semibold text-slate-900">{invoice.amountDisplay}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${invoice.avatarClass}`}>
                              {invoice.avatar}
                            </span>
                            <span className="text-[14px] text-slate-700">{invoice.assignedTo}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <StatusBadge status={invoice.uiStatus} />
                        </td>
                        <td className={`whitespace-nowrap px-4 py-4 text-[13px] font-semibold ${invoice.isDuePast ? "text-rose-500" : "text-slate-600"}`}>
                          {invoice.dueDateLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setValidateInvoice(invoice)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100"
                            >
                              <EyeIcon className="h-3 w-3" />
                              Validate
                            </button>

                            {(invoice.uiStatus === "Under Review" || invoice.uiStatus === "Mismatch") ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoice(buildInvoiceModalPayload(invoice));
                                  setEscalateInvoice(invoice);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100"
                              >
                                <AlertIcon className="h-3 w-3" />
                                Escalate
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                        No internal DMC invoices are available right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {validateInvoice ? (
          <ValidateModal
            invoice={validateInvoice}
            submitting={actionLoading}
            onClose={() => setValidateInvoice(null)}
            onConfirm={handleValidate}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {escalateInvoice ? (
          <EscalatePanel
            invoice={escalateInvoice}
            submitting={actionLoading}
            onClose={() => {
              setEscalateInvoice(null);
              setSelectedInvoice(null);
            }}
            onConfirm={handleEscalate}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedInvoice ? (
          <InvoiceDocumentModal
            invoice={selectedInvoice}
            sidePanelOpen={Boolean(escalateInvoice)}
            onClose={() => {
              setSelectedInvoice(null);
              if (escalateInvoice) {
                setEscalateInvoice(null);
              }
            }}
            onInvoiceUpdated={handleInvoiceUpdated}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
