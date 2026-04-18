import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import API from "../../../utils/Api";

function IconInfo({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconFlag({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function IconCheckCircle({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconAlertTriangle({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconBolt({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const createEmptyState = () => ({
  payments: [],
});

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getTimeAgo = (value) => {
  if (!value) return "Just now";
  const now = new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffInMinutes = Math.floor((now - date) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

const isImageReceipt = (payment) => {
  const mimeType = String(payment?.receiptMimeType || "").toLowerCase();
  const receiptUrl = String(payment?.receiptUrl || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) => receiptUrl.endsWith(ext))
  );
};

const getPaymentComparisonMeta = (payment = {}) => {
  const expectedAmount = Math.round(Number(payment?.expectedAmount ?? payment?.amount ?? 0));
  const receivedAmount = Math.round(Number(payment?.receivedAmount || 0));
  const hasReceivedAmount = receivedAmount > 0;
  const variance = hasReceivedAmount ? receivedAmount - expectedAmount : 0;
  const isMatched = hasReceivedAmount && variance === 0;

  if (!hasReceivedAmount) {
    return {
      expectedAmount,
      receivedAmount,
      variance,
      hasReceivedAmount,
      isMatched,
      label: "Amount Needed",
      badgeClass: "border border-amber-200 bg-amber-50 text-amber-700",
      note: "Agent declared amount is still missing.",
      varianceClass: "text-slate-400",
    };
  }

  if (isMatched) {
    return {
      expectedAmount,
      receivedAmount,
      variance,
      hasReceivedAmount,
      isMatched,
      label: "Perfect Match",
      badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      note: "Declared amount matches the invoice total.",
      varianceClass: "text-emerald-400",
    };
  }

  if (variance < 0) {
    return {
      expectedAmount,
      receivedAmount,
      variance,
      hasReceivedAmount,
      isMatched,
      label: "Short Payment",
      badgeClass: "border border-rose-200 bg-rose-50 text-rose-700",
      note: "Declared amount is lower than the invoice total.",
      varianceClass: "text-rose-400",
    };
  }

  return {
    expectedAmount,
    receivedAmount,
    variance,
    hasReceivedAmount,
    isMatched,
    label: "Excess Payment",
    badgeClass: "border border-orange-200 bg-orange-50 text-orange-700",
    note: "Declared amount is higher than the invoice total.",
    varianceClass: "text-orange-400",
  };
};

const getWorkflowLabel = (payment) => payment?.workflowStatus || payment?.status || "Pending";

const statusStyles = {
  Pending: "border border-amber-300 bg-amber-50 text-amber-600",
  "Manager Review": "border border-blue-200 bg-blue-50 text-blue-600",
  Verified: "border border-emerald-200 bg-emerald-50 text-emerald-600",
  Rejected: "border border-rose-200 bg-rose-50 text-rose-600",
};

const actionStyles = {
  Pending: {
    label: "Await Team Review",
    cls: "border border-slate-200 bg-slate-50 text-slate-500",
  },
  "Manager Review": {
    label: "Review Now",
    cls: "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  Verified: {
    label: "View Details",
    cls: "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  },
  Rejected: {
    label: "View Details",
    cls: "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",
  },
};

function StatusBadge({ status }) {
  const normalizedStatus = statusStyles[status] ? status : "Pending";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusStyles[normalizedStatus]}`}
    >
      {status}
    </span>
  );
}

function FeedbackToast({ feedback, onClose }) {
  if (!feedback) return null;

  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="fixed right-4 top-4 z-[70] w-full max-w-sm sm:right-6 sm:top-6">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${styles[feedback.type] || styles.success}`}>
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
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ txn, onClick }) {
  const workflowStatus = getWorkflowLabel(txn);
  const { label, cls } = actionStyles[workflowStatus] || actionStyles.Pending;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick(txn);
      }}
      className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap ${cls}`}
    >
      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24">
        <path
          d="M2.75 12s3.35-5.5 9.25-5.5 9.25 5.5 9.25 5.5-3.35 5.5-9.25 5.5S2.75 12 2.75 12z"
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
      {label}
    </button>
  );
}

function AmountCheckBadge({ txn }) {
  const paymentComparison = getPaymentComparisonMeta(txn);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${paymentComparison.badgeClass}`}>
      {paymentComparison.label}
    </span>
  );
}

function TransactionReviewPanel({
  txn,
  workflowStatus,
  isAwaitingManager,
  isFinalVerified,
  isFinalRejected,
  paymentComparison,
  hasPaymentContext,
  receiptAvailable,
  reversedAuditTrail,
  onDownloadReceipt,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="hidden min-w-0 flex-1 overflow-hidden lg:flex lg:max-w-[min(830px,calc(100vw-470px))] xl:max-w-[900px]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex h-full w-full overflow-hidden border border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_52%,#f7fbff_100%)] shadow-none">
        <div className="hide-scrollbar flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
          <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/92 px-7 py-6 backdrop-blur">
            <div className="mx-auto w-full max-w-[760px]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <IconBolt size={18} color="#d97706" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">Transaction Details v2</h3>
                      <p className="mt-0.5 text-[13px] text-slate-500">{txn.transactionId || txn.invoiceNumber || txn.id}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge status={workflowStatus} />
                    <AmountCheckBadge txn={txn} />
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${
                      hasPaymentContext
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      {hasPaymentContext ? "Behalf captured" : "Behalf missing"}
                    </span>
                  </div>
                </div>

                <div className="hidden rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 shadow-sm xl:flex xl:items-center xl:gap-2">
                  {[1, 2, 3, 4, 5, 6].map((dot) => (
                    <span key={dot} className="h-2 w-2 rounded-full bg-slate-300" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-7 py-6">
            <div className="mx-auto max-w-[760px] space-y-6">
          <section className="border-b border-slate-200 pb-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Review Flow</p>
                <h4 className="mt-2 text-[19px] font-bold leading-tight text-slate-900">
                  Manager review panel for declared payment and invoice match verification
                </h4>
                <p className="mt-3 max-w-[560px] text-[14px] leading-7 text-slate-500">
                  Use this detail sheet to review the payment trail, cross-check the declared amount,
                  and confirm whether the executive recommendation is safe to approve.
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f8fbff_100%)] p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Review Snapshot</p>
                <div className="mt-4 space-y-3 text-[13px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Workflow</span>
                    <StatusBadge status={workflowStatus} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">{isAwaitingManager ? "Recommended By" : "Assigned To"}</span>
                    <span className="text-right font-semibold text-slate-900">
                      {txn.teamDecisionByName || txn.assignedFinanceName || "Finance Team"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">{isAwaitingManager ? "Sent To Manager" : "Submitted On"}</span>
                    <span className="text-right font-semibold text-slate-900">
                      {txn.sentToManagerAt || txn.teamDecisionAt || txn.submittedAt || "-"}
                    </span>
                  </div>
                  {txn.assignedFinanceEmail ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      {txn.assignedFinanceEmail}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_rgba(255,255,255,0.98)_38%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_50%,_#effaf4_100%)] p-6 shadow-[0_20px_50px_rgba(148,163,184,0.15)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Verification Match Deck</p>
                <h4 className="mt-2 text-[18px] font-bold leading-tight text-slate-900">Cross-check invoice amount, declared payment, and behalf context</h4>
                <p className="mt-2 text-[14px] leading-6 text-slate-500">{paymentComparison.note}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AmountCheckBadge txn={txn} />
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  hasPaymentContext
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  {hasPaymentContext ? "Behalf captured" : "Behalf missing"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/92 px-4 py-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Ops Invoice Amount</p>
                <p className="mt-2 text-[21px] font-bold tracking-[-0.02em] text-slate-900">{formatCurrency(paymentComparison.expectedAmount)}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/92 px-4 py-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Declared Paid Amount</p>
                <p className={`mt-2 text-[21px] font-bold tracking-[-0.02em] ${paymentComparison.hasReceivedAmount ? "text-slate-900" : "text-slate-400"}`}>
                  {paymentComparison.hasReceivedAmount ? formatCurrency(paymentComparison.receivedAmount) : "Pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/92 px-4 py-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Variance</p>
                <p className={`mt-2 text-[21px] font-bold tracking-[-0.02em] ${paymentComparison.varianceClass}`}>
                  {paymentComparison.hasReceivedAmount
                    ? `${paymentComparison.variance > 0 ? "+" : ""}${formatCurrency(paymentComparison.variance)}`
                    : "Pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/92 px-4 py-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Payment On Behalf Of</p>
                <p className={`mt-2 text-sm font-semibold leading-6 ${hasPaymentContext ? "text-slate-900" : "text-slate-400"}`}>
                  {txn.paymentOnBehalfOf || "Not shared by agent"}
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200 pb-6">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(250px,0.92fr)]">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <IconInfo color="#2563eb" /> Agent Payment Details
                </div>
                <div className="grid gap-x-8 gap-y-3 text-[13px] sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">Booking Ref</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.bookingReference || "-"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">Invoice Number</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.invoiceNumber || "-"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">Agent</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.agentName || "-"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">Bank</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.bankName || "Pending"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">UTR Number</span>
                    <p className="mt-1 text-right font-mono text-[11px] font-semibold text-amber-600 sm:text-left">{txn.utrNumber || "Pending"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">Payment Date</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.paymentDate || "-"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 sm:block sm:border-b-0 sm:py-0">
                    <span className="text-slate-500">Submitted</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.submittedAt || "-"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2 sm:block sm:py-0">
                    <span className="text-slate-500">Assigned Finance</span>
                    <p className="mt-1 text-right font-semibold text-slate-900 sm:text-left">{txn.assignedFinanceName || "Unassigned"}</p>
                  </div>
                </div>

                {(txn.remarks || !hasPaymentContext || !paymentComparison.isMatched) && (
                  <div className={`mt-5 rounded-[22px] border px-4 py-4 ${
                    !hasPaymentContext || !paymentComparison.isMatched
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                      !hasPaymentContext || !paymentComparison.isMatched
                        ? "text-amber-700"
                        : "text-slate-500"
                    }`}>
                      Manager Check Note
                    </p>
                    {!hasPaymentContext && (
                      <p className="mt-2 text-xs leading-6 text-amber-800">
                        Agent has not shared who this payment belongs to. Verification should wait until this context is available.
                      </p>
                    )}
                    {hasPaymentContext && !paymentComparison.isMatched && (
                      <p className="mt-2 text-xs leading-6 text-amber-800">
                        Declared amount does not match the invoice total. Escalate or wait for corrected resubmission.
                      </p>
                    )}
                    {txn.remarks && (
                      <p className="mt-2 text-xs leading-6 text-slate-700">
                        <span className="font-semibold">Remarks:</span> {txn.remarks}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <IconInfo color="#0f766e" /> Payment Receipt
                </div>
                <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  {receiptAvailable ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-4 p-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-sky-50 text-sky-600">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold text-slate-800">{txn.receiptName || "Payment_Receipt_Scan"}</p>
                          <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Valid Attachment
                          </p>
                        </div>
                        {isImageReceipt(txn) && (
                          <div className="h-[48px] w-[64px] shrink-0 overflow-hidden rounded-xl border border-slate-200">
                            <img src={txn.receiptUrl} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50/50 p-3 pt-0">
                        <button
                          type="button"
                          onClick={onDownloadReceipt}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                        >
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                          Download Receipt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center px-5 py-8 text-center text-slate-400">
                      <svg className="mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                      </svg>
                      <h4 className="text-[14px] font-semibold text-slate-700">No Receipt Found</h4>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Payment proof wasn't uploaded.</p>
                      <button
                        type="button"
                        disabled
                        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-2.5 text-[13px] font-medium text-slate-400"
                      >
                        Download Disabled
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200 pb-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(250px,0.95fr)]">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <IconBolt color="#8b5cf6" /> Executive Recommendation
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-[#fbfcff] p-5 shadow-sm">
                  <div className="space-y-3 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Recommended By</span>
                      <span className="text-right font-semibold text-slate-900">{txn.teamDecisionByName || txn.assignedFinanceName || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Recommendation</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                        txn.teamDecisionStatus === "Rejected"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}>
                        {txn.teamDecisionStatus === "Rejected" ? "Recommend Rejection" : "Recommend Verification"}
                      </span>
                    </div>
                    {txn.teamDecisionAt && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Shared On</span>
                        <span className="text-right font-semibold text-slate-900">{txn.teamDecisionAt}</span>
                      </div>
                    )}
                    {txn.teamDecisionReason && (
                      <div className="rounded-xl bg-white px-3 py-2 text-xs leading-6 text-slate-600">
                        <span className="font-semibold text-slate-700">Reason:</span> {txn.teamDecisionReason}
                      </div>
                    )}
                    {txn.teamDecisionRemarks && (
                      <div className="rounded-xl bg-white px-3 py-2 text-xs leading-6 text-slate-600">
                        <span className="font-semibold text-slate-700">Remarks:</span> {txn.teamDecisionRemarks}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <IconFlag color="#ca8a04" /> Flag History
                </div>
                {reversedAuditTrail.length > 0 ? (
                  <div className="space-y-3">
                    {reversedAuditTrail.map((entry, idx) => (
                      <div key={`${entry.action}-${entry.performedAtValue || idx}`} className="rounded-[22px] border border-slate-200 bg-[#fbfcff] px-4 py-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{entry.action} by {entry.performedByName || "System"}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateLabel(entry.performedAtValue)} {entry.performedAtValue ? `| ${getTimeAgo(entry.performedAtValue)}` : ""}
                            </p>
                          </div>
                          {entry.status ? <StatusBadge status={entry.status} /> : null}
                        </div>
                        {(entry.reason || entry.remarks) && (
                          <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-6 text-slate-600">
                            {entry.reason && <p><span className="font-semibold text-slate-700">Reason:</span> {entry.reason}</p>}
                            {entry.remarks && <p className="mt-1"><span className="font-semibold text-slate-700">Remarks:</span> {entry.remarks}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-[#fbfcff] px-4 py-5 text-sm text-slate-500">
                    No flags recorded yet.
                  </div>
                )}
              </div>
            </div>
          </section>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function DetailDrawer({ txn, onClose, onApprove, onReject, actionLoading }) {
  const [comment, setComment] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  if (!txn) return null;

  const paymentComparison = getPaymentComparisonMeta(txn);
  const hasPaymentContext = Boolean(String(txn?.paymentOnBehalfOf || "").trim());
  const workflowStatus = getWorkflowLabel(txn);
  const isAwaitingManager = workflowStatus === "Manager Review";
  const isFinalVerified = workflowStatus === "Verified";
  const isFinalRejected = workflowStatus === "Rejected";
  const canTakeAction = !isFinalVerified && !isFinalRejected;
  const canVerifyTxn = canTakeAction && paymentComparison.isMatched && hasPaymentContext;
  const receiptAvailable = Boolean(txn?.receiptUrl);
  const reversedAuditTrail = [...(txn.auditTrail || [])].reverse();

  const handleDownloadReceipt = async () => {
    if (!txn?.receiptUrl) return;
    try {
      const response = await fetch(txn.receiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = txn.receiptName || "Transaction_Receipt";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      window.open(txn.receiptUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex h-full w-full items-stretch justify-end overflow-hidden px-0 py-3 sm:py-4 lg:py-5">
        <TransactionReviewPanel
          txn={txn}
          workflowStatus={workflowStatus}
          isAwaitingManager={isAwaitingManager}
          isFinalVerified={isFinalVerified}
          isFinalRejected={isFinalRejected}
          paymentComparison={paymentComparison}
          hasPaymentContext={hasPaymentContext}
          receiptAvailable={receiptAvailable}
          reversedAuditTrail={reversedAuditTrail}
          onDownloadReceipt={handleDownloadReceipt}
        />

        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full w-full max-w-[420px] flex-col overflow-hidden border-l border-white/10 bg-[#111827] shadow-none z-20"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#161b22] px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-yellow-500/20">
                    <IconBolt size={14} color="#eab308" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white">Transaction Details v2</h3>
                </div>
                <p className="mt-1 text-[13px] text-slate-400">{txn.transactionId || txn.invoiceNumber || txn.id}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>

          <div className="dark-scrollbar flex-1 space-y-7 overflow-y-auto overflow-x-hidden px-6 py-5">
            <section>
              <h4 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-white">
                <IconInfo color="#3b82f6" /> Booking Reference
              </h4>
              <div className="flex flex-col gap-3 text-[13px]">
                <div className="flex items-center justify-between"><span className="text-slate-400">Booking Ref:</span><span className="font-medium text-white">{txn.bookingReference || "-"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Agent:</span><span className="font-medium text-white">{txn.agentName || "-"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Ops Invoice:</span><span className="font-bold text-white">{formatCurrency(paymentComparison.expectedAmount)}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Declared Paid:</span><span className={`font-bold ${paymentComparison.hasReceivedAmount ? "text-emerald-400" : "text-slate-500"}`}>{paymentComparison.hasReceivedAmount ? formatCurrency(paymentComparison.receivedAmount) : "Pending"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Difference:</span><span className={`font-bold ${paymentComparison.varianceClass}`}>{paymentComparison.hasReceivedAmount ? `${paymentComparison.variance > 0 ? "+" : ""}${formatCurrency(paymentComparison.variance)}` : "Pending"}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-400">On Behalf Of:</span><span className="max-w-[180px] text-right font-medium text-white">{txn.paymentOnBehalfOf || "-"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Amount Check:</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${paymentComparison.badgeClass}`}>{paymentComparison.label}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Assigned To:</span><span className="font-medium text-white">{txn.assignedFinanceName || "-"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Date:</span><span className="font-medium text-white">{txn.paymentDate || txn.date || txn.submittedAt || "-"}</span></div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Manager Check Note</p>
                <p className="mt-2 text-[12px] leading-5 text-slate-300">{paymentComparison.note}</p>
                {!hasPaymentContext && (
                  <p className="mt-2 text-[12px] leading-5 text-amber-300">
                    Agent has not shared who this payment was made for. Manager verification should wait until this context is available.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-white">
                <IconBolt color="#a78bfa" /> Executive Recommendation
              </h4>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Recommended By</span>
                  <span className="font-medium text-white">{txn.teamDecisionByName || txn.assignedFinanceName || "-"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-slate-400">Recommendation</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    txn.teamDecisionStatus === "Rejected"
                      ? "border border-rose-200 bg-rose-50 text-rose-700"
                      : "border border-blue-200 bg-blue-50 text-blue-700"
                  }`}>
                    {txn.teamDecisionStatus === "Rejected" ? "Recommend Rejection" : "Recommend Verification"}
                  </span>
                </div>
                {txn.teamDecisionReason && (
                  <p className="mt-3 text-slate-300">
                    <span className="text-slate-400">Reason:</span> {txn.teamDecisionReason}
                  </p>
                )}
                {txn.teamDecisionRemarks && (
                  <p className="mt-2 text-slate-300">
                    <span className="text-slate-400">Remarks:</span> {txn.teamDecisionRemarks}
                  </p>
                )}
                {txn.teamDecisionAt && (
                  <p className="mt-2 text-slate-300">
                    <span className="text-slate-400">Shared On:</span> {txn.teamDecisionAt}
                  </p>
                )}
              </div>
            </section>

            <section>
              <h4 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-white">
                <IconFlag color="#eab308" /> Flag History
              </h4>
              {txn.auditTrail && txn.auditTrail.length > 0 ? (
                <div className="space-y-2">
                  {txn.auditTrail.map((entry, idx) => (
                    <div key={idx} className="rounded-lg bg-white/5 px-3 py-2 text-[12px]">
                      <p className="text-white"><span className="font-medium">{entry.action}</span> by {entry.performedByName}</p>
                      {entry.reason && <p className="mt-1 text-slate-400">Reason: {entry.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-500">No flags recorded.</p>
              )}
            </section>

            <section className="rounded-xl border border-white/10 bg-[#161b22] p-4">
              <h4 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-white">
                <IconCheckCircle color="#22c55e" /> Action Center
              </h4>
              {!canVerifyTxn && (
                <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-[12px] leading-5 text-amber-200">
                  Manager verification unlocks only when declared amount matches the invoice total and `On Behalf Of` is available.
                </div>
              )}
              <label className="mb-2 block text-[13px] font-medium text-white">Add Comment for Agent</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter the correction note that should go back to the agent..."
                rows={3}
                className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-[13px] text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={actionLoading || !canVerifyTxn}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <IconCheckCircle size={15} /> {canVerifyTxn ? "Mark as Verified" : "Resolve Before Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => onReject(txn, {
                    reason: txn.teamDecisionReason || comment || "Mismatch found by finance manager",
                    remarks: comment || txn.teamDecisionRemarks || "",
                  })}
                  disabled={actionLoading || !canTakeAction}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-amber-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <IconAlertTriangle size={15} /> Return To Agent
                </button>
              </div>
            </section>
          </div>
        </motion.aside>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-transparent px-4 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-[340px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <h3 className="text-[15px] font-semibold text-slate-900">Confirm Verification</h3>
              <p className="mb-5 mt-2 text-[13px] leading-relaxed text-slate-500">
                Are you sure you want to verify this transaction? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl px-4 py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    onApprove(txn, comment);
                  }}
                  disabled={!canVerifyTxn}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-400"
                >
                  Yes, Verify
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AllTeamTransactions() {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(createEmptyState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTransactions = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const { data: response } = await API.get("/finance-manager/team-transactions");
      setData({ payments: response?.data?.payments || [] });
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Failed to load team transactions");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!selectedTxn) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === "Escape") setSelectedTxn(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedTxn]);

  const summary = useMemo(() => {
    const payments = data.payments || [];
    return {
      total: payments.length,
      pending: payments.filter((payment) => getWorkflowLabel(payment) === "Pending").length,
      managerReview: payments.filter((payment) => getWorkflowLabel(payment) === "Manager Review").length,
      verified: payments.filter((payment) => getWorkflowLabel(payment) === "Verified").length,
      rejected: payments.filter((payment) => getWorkflowLabel(payment) === "Rejected").length,
    };
  }, [data.payments]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return (data.payments || []).filter((payment) => {
      const workflowStatus = getWorkflowLabel(payment);
      const matchesFilter = statusFilter === "All" || workflowStatus === statusFilter;
      const matchesSearch =
        !query ||
        String(payment.transactionId || payment.invoiceNumber || "").toLowerCase().includes(query) ||
        String(payment.bookingReference || "").toLowerCase().includes(query) ||
        String(payment.agentName || "").toLowerCase().includes(query) ||
        String(payment.paymentOnBehalfOf || "").toLowerCase().includes(query) ||
        String(payment.assignedFinanceName || "").toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [data.payments, searchTerm, statusFilter]);

  const refreshPayment = (updatedPayment) => {
    setData((prev) => ({
      ...prev,
      payments: (prev.payments || []).map((payment) =>
        payment.id === updatedPayment.id ? updatedPayment : payment,
      ),
    }));
  };

  const handleApprove = async (txn, comment) => {
    setSelectedTxn(null);
    try {
      setActionLoading(true);
      const { data: response } = await API.patch(`/finance-manager/team-transactions/${txn.id}/status`, {
        status: "Verified",
        reviewRemarks: comment,
      });
      refreshPayment(response?.data);
      setFeedback({
        type: "success",
        title: "Payment Approved",
        message: "Finance manager approved this payment and unlocked the invoice flow.",
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Approval Failed",
        message: actionError?.response?.data?.message || "Unable to approve this payment right now.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (txn, { reason, remarks }) => {
    setSelectedTxn(null);
    try {
      setActionLoading(true);
      const { data: response } = await API.patch(`/finance-manager/team-transactions/${txn.id}/status`, {
        status: "Rejected",
        rejectionReason: reason,
        rejectionRemarks: remarks,
      });
      refreshPayment(response?.data);
      setFeedback({
        type: "warning",
        title: "Returned To Agent",
        message: "Finance manager sent this payment back to the agent with review notes.",
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Action Failed",
        message: actionError?.response?.data?.message || "Unable to reject this payment right now.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between px- py-2.5">
          <div>
            <p className="text-[15px] font-semibold text-slate-800">All Team Transactions</p>
            <p className="mt-0.5 text-xs text-slate-500">Manager approval queue for finance team payment reviews</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-slate-800">{user?.name || "Finance Manager"}</p>
          </div>
        </div>
      </div>

      <div className="px- py- pt-6">
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-slate-900">Agent Transactions</h1>
          <p className="mt-1 text-[13px] text-slate-500">Final approval queue for every finance executive under this manager</p>
        </div>

        <div className="mb-5 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,_#eff6ff_0%,_#ffffff_52%,_#f0fdf4_100%)] px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">Live UI Marker</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Finance Manager Review UI v2 is loaded</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Updated transaction drawer active
            </span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { label: "Team Pending", value: summary.pending, tone: "text-amber-500" },
            { label: "Awaiting Manager", value: summary.managerReview, tone: "text-blue-600" },
            { label: "Verified", value: summary.verified, tone: "text-emerald-600" },
            { label: "Returned", value: summary.rejected, tone: "text-rose-500" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{loading ? "..." : card.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by transaction ID, booking ref, agent, or executive..."
            className="w-full max-w-md rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-300"
          />
          <div className="flex flex-wrap gap-2">
            {[
              { key: "All", label: `All (${summary.total})` },
              { key: "Manager Review", label: `Awaiting Manager (${summary.managerReview})` },
              { key: "Verified", label: `Verified (${summary.verified})` },
              { key: "Rejected", label: `Returned (${summary.rejected})` },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-full px-3 py-1.5 text-[9px] font-semibold transition-colors  ${statusFilter === filter.key ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>{error}</span>
            <button type="button" onClick={() => loadTransactions()} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100">
              Retry
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-[15px] font-bold text-slate-900">Payment Verification Queue</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">{filteredTransactions.length} transactions</span>
          </div>

          <div className="finance-transparent-scrollbar overflow-x-auto overflow-y-hidden pb-2">
            <div className="min-w-305">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Transaction ID", "Booking Ref", "Agent", "Amount", "Assigned To", "Status", "Date", "Action"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Loading team transactions...</td></tr>
                ) : filteredTransactions.length ? (
                  filteredTransactions.map((txn) => {
                    const workflowStatus = getWorkflowLabel(txn);
                    const rowTone = selectedTxn?.id === txn.id
                      ? "border-sky-200 bg-blue-50"
                      : "border-slate-200 bg-white";
                    const rowCellClass = `border-y ${rowTone} px-4 py-3.5`;
                    return (
                      <tr
                        key={txn.id}
                        onClick={() => setSelectedTxn(txn)}
                        className="cursor-pointer transition-transform duration-150 hover:-translate-y-[1px]"
                      >
                        <td className={`${rowCellClass} rounded-l-xl border-l whitespace-nowrap text-[12px] font-bold text-slate-800`}>{txn.transactionId || txn.invoiceNumber}</td>
                        <td className={`${rowCellClass} whitespace-nowrap text-[12px] text-slate-500`}>{txn.bookingReference}</td>
                        <td className={`${rowCellClass} whitespace-nowrap text-[13px] font-medium text-slate-700`}>{txn.agentName}</td>
                        <td className={`${rowCellClass} whitespace-nowrap text-[13px] font-semibold text-slate-900`}>{formatCurrency(txn.amount)}</td>
                        <td className={`${rowCellClass} whitespace-nowrap text-[13px] text-slate-700`}>{txn.assignedFinanceName || "Unassigned"}</td>
                        <td className={`${rowCellClass} whitespace-nowrap`}><StatusBadge status={workflowStatus} /></td>
                        <td className={`${rowCellClass} whitespace-nowrap text-[12px] text-slate-500`}>{txn.paymentDate || txn.date || txn.submittedAt || "04 Apr 2026"}</td>
                        <td className={`${rowCellClass} rounded-r-xl border-r whitespace-nowrap`} onClick={(event) => event.stopPropagation()}>
                          <ActionButton txn={txn} onClick={setSelectedTxn} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No transactions match your current filters.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedTxn ? <DetailDrawer key={selectedTxn.id} txn={selectedTxn} onClose={() => setSelectedTxn(null)} onApprove={handleApprove} onReject={handleReject} actionLoading={actionLoading} /> : null}
      </AnimatePresence>
    </div>
  );
}
