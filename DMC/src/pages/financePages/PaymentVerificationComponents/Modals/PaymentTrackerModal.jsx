import React from "react";
import { motion } from "framer-motion";
import {
  X,
  IndianRupee,
  CheckCircle2,
  Clock,
  History,
  Check,
  Send,
  Calendar,
  PieChart,
} from "lucide-react";
import { formatCurrency, formatDateLabel } from "../utils/formatter";

const PaymentTrackerModal = ({
  payment,
  onClose,
  onSendAgentReceipt,
  onVerifyInstallment,
  sendingAgentReceipt = false,
  verifyingInstallmentIndex = null,
  canSendAgentReceipt = false,
  canVerifyInstallments = false,
}) => {
  const totalAmount = Math.round(
    Number(payment?.paymentTrackerTotal || payment?.expectedAmount || 0),
  );
  const trackerPayments = Array.isArray(payment?.paymentTrackerEntries)
    ? payment.paymentTrackerEntries
    : [];
  const paidAmount = trackerPayments.reduce(
    (sum, entry) => sum + Math.round(Number(entry?.amount || 0)),
    0,
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const progress =
    totalAmount > 0
      ? Math.min(100, Math.round((paidAmount / totalAmount) * 100))
      : 0;
  const isComplete = totalAmount > 0 && remainingAmount === 0;
  const installmentCount = trackerPayments.length;
  const ringRadius = 62;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const paidStrokeOffset =
    ringCircumference - (ringCircumference * progress) / 100;
  const progressDotPosition =
    totalAmount > 0 ? Math.max(2, Math.min(98, progress)) : 2;
  const lastInstallmentIndex = installmentCount > 0 ? installmentCount - 1 : -1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-[78rem] flex-col overflow-hidden rounded-[19px] bg-white border border-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.3)]"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#415a77] px-6 py-3.5 border-b border-white/10">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-white/16 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
              Payment Tracker
            </span>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h3 className="text-[1.3rem] font-bold leading-none text-white">
                {payment?.bookingReference || "Booking Payment"}
              </h3>
              <p className="text-[0.9rem] font-medium text-blue-50">
                {payment?.invoiceNumber || "-"} •{" "}
                {payment?.agentName || "Agent"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-2">
              <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-white/10 px-3 py-1.5 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                  Installments
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-white">
                  {installmentCount || 0} recorded
                </p>
              </div>
              <div
                className={`rounded-xl border border-white/10 px-3 py-1.5 shadow-sm bg-gradient-to-br ${
                  isComplete
                    ? "from-emerald-500/20 to-teal-500/10"
                    : "from-amber-500/20 to-orange-500/10"
                }`}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                  Status
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-white">
                  {isComplete ? "Fully Paid" : "Partially Paid"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/16 text-white transition hover:bg-white/24"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-indigo-200 border-b-4 border-b-indigo-500 bg-gradient-to-br from-indigo-100 to-indigo-50/50 px-3 py-2.5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 text-indigo-650">
                <IndianRupee className="h-3.5 w-3.5" />
                <p className="text-[9px] font-bold uppercase tracking-[0.14em]">
                  Total
                </p>
              </div>
              <p className="text-[1.08rem] font-bold leading-none text-indigo-950">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-emerald-200 border-b-4 border-b-emerald-500 bg-gradient-to-br from-emerald-100 to-emerald-50/50 px-3 py-2.5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-1.5 flex items-center justify-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-[9px] font-bold uppercase tracking-[0.14em]">
                  Paid
                </p>
              </div>
              <p className="text-[1.08rem] font-bold leading-none text-emerald-800">
                {formatCurrency(paidAmount)}
              </p>
            </div>
            <div
              className={`group relative overflow-hidden rounded-xl border px-3 py-2.5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isComplete
                  ? "border-slate-300 border-b-4 border-b-slate-400 bg-gradient-to-br from-slate-100 to-slate-50/50"
                  : "border-amber-200 border-b-4 border-b-amber-500 bg-gradient-to-br from-amber-100 to-amber-50/50"
              }`}
            >
              <div
                className={`mb-1.5 flex items-center justify-center gap-1.5 ${isComplete ? "text-slate-500" : "text-amber-600"}`}
              >
                <Clock className="h-3.5 w-3.5" />
                <p className="text-[9px] font-bold uppercase tracking-[0.14em]">
                  Remaining
                </p>
              </div>
              <p
                className={`text-[1.08rem] font-bold leading-none ${isComplete ? "text-slate-600" : "text-amber-700"}`}
              >
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-4 lg:grid-cols-[1.18fr_0.9fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <History className="h-3.5 w-3.5 text-indigo-500" /> Payment
                  History
                </p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                  {installmentCount || 0} instalment
                  {installmentCount === 1 ? "" : "s"}
                </span>
              </div>

              {!trackerPayments.length ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
                  No payment entries have been recorded by the agent yet.
                </div>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-[15px] top-1.5 bottom-1.5 w-px bg-slate-200" />
                  <div className="space-y-2.5">
                    {trackerPayments.map((entry, index) => {
                      const isInstallmentVerified =
                        entry?.verificationStatus === "Verified";
                      const isVerifyingThisInstallment =
                        verifyingInstallmentIndex === index;

                      return (
                        <div
                          key={entry.id || `${entry.amount}-${index}`}
                          className="relative"
                        >
                          <div className="absolute left-[-25px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#163B72] shadow-sm">
                            <svg
                              className="h-2.5 w-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <div
                            className={`rounded-xl border px-3.5 py-2.5 shadow-sm transition-all duration-300 ${
                              isInstallmentVerified
                                ? "border-emerald-200 bg-gradient-to-br from-emerald-100/70 to-emerald-50/30"
                                : "border-amber-200 bg-gradient-to-br from-amber-100/70 to-amber-50/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-semibold text-slate-700">
                                  Instalment {index + 1}
                                </p>
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
                                  <Check className="h-3 w-3 text-emerald-500" />{" "}
                                  Paid
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm ${
                                    isInstallmentVerified
                                      ? "border-teal-200 bg-teal-50/70 text-teal-700"
                                      : "border-amber-200 bg-amber-50/70 text-amber-700"
                                  }`}
                                >
                                  {isInstallmentVerified ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-teal-500" />{" "}
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 text-amber-500" />{" "}
                                      Pending verification
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {!isInstallmentVerified ? (
                                  <button
                                    type="button"
                                    onClick={() => onVerifyInstallment(index)}
                                    disabled={
                                      isVerifyingThisInstallment ||
                                      !canVerifyInstallments
                                    }
                                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition disabled:cursor-not-allowed ${
                                      isVerifyingThisInstallment ||
                                      !canVerifyInstallments
                                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                        : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_4px_10px_rgba(16,185,129,0.15)] hover:from-emerald-600 hover:to-teal-700"
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    {isVerifyingThisInstallment
                                      ? "Verifying..."
                                      : "Verify payment"}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => onSendAgentReceipt(index)}
                                  disabled={sendingAgentReceipt}
                                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition disabled:cursor-not-allowed ${
                                    sendingAgentReceipt
                                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                      : isInstallmentVerified
                                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-[0_4px_10px_rgba(79,70,229,0.15)] hover:from-indigo-600 hover:to-violet-700"
                                        : "bg-gradient-to-r from-amber-100 to-orange-100/90 text-amber-800 shadow-[0_2px_8px_rgba(245,158,11,0.08)] hover:from-amber-200 hover:to-orange-200/90"
                                  }`}
                                >
                                  <Send className="h-2.5 w-2.5" />
                                  Send receipt
                                </button>
                              </div>
                            </div>
                            <div className="mt-1 flex items-end justify-between gap-3">
                              <p className="text-[0.95rem] font-semibold leading-none text-slate-900">
                                {formatCurrency(entry.amount)}
                              </p>
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Calendar className="h-2.5 w-2.5" />
                                {entry.date || formatDateLabel(entry.rawDate)}
                              </span>
                            </div>
                            {entry?.verifiedAtLabel || entry?.verifiedByName ? (
                              <p className="mt-1 text-[9px] text-slate-500">
                                Verified{" "}
                                {entry?.verifiedAtLabel
                                  ? `on ${entry.verifiedAtLabel}`
                                  : ""}
                                {entry?.verifiedByName
                                  ? ` by ${entry.verifiedByName}`
                                  : ""}
                              </p>
                            ) : null}
                            {entry.note && (
                              <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] leading-relaxed text-slate-500">
                                {entry.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="relative">
                      <div
                        className={`absolute left-[-25px] top-2 flex h-4 w-4 items-center justify-center rounded-full shadow-sm ${
                          isComplete ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                      >
                        {isComplete ? (
                          <svg
                            className="h-2.5 w-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div
                        className={`ml-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
                          isComplete
                            ? "border-emerald-250 bg-gradient-to-br from-emerald-50 to-teal-50/60"
                            : "border-dashed border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={`text-[12.5px] font-semibold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}
                          >
                            {isComplete
                              ? "Payment complete"
                              : "Remaining balance"}
                          </p>
                          <p
                            className={`text-[0.95rem] font-semibold leading-none ${isComplete ? "text-emerald-700" : "text-amber-600"}`}
                          >
                            {isComplete
                              ? formatCurrency(totalAmount)
                              : formatCurrency(remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {trackerPayments.length ? (
                      <div className="relative">
                        <div className="absolute left-[-25px] top-16 flex h-4 w-4 items-center justify-center rounded-full bg-[#5b5ff8] shadow-sm">
                          <Send className="h-2 w-2 translate-x-[0.5px] translate-y-[0.5px] text-white" />
                        </div>
                        <div className="group relative ml-3 overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 px-3.5 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[12.5px] font-semibold text-indigo-700">
                                Send latest payment receipt
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                                Share the latest instalment receipt with the
                                agent after finance verification.
                              </p>
                            </div>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                              Latest
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onSendAgentReceipt(lastInstallmentIndex)
                            }
                            disabled={sendingAgentReceipt}
                            className={`mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                              sendingAgentReceipt
                                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                : canSendAgentReceipt
                                  ? "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-[0_6px_15px_rgba(79,70,229,0.22)] hover:from-indigo-600 hover:via-indigo-700 hover:to-violet-700"
                                  : "border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/80 text-amber-700 hover:from-amber-100 hover:to-orange-100/80 shadow-sm"
                            }`}
                          >
                            <Send
                              className={`h-3 w-3 ${sendingAgentReceipt ? "animate-pulse" : ""}`}
                            />
                            {sendingAgentReceipt
                              ? "Sending..."
                              : "Send Latest Receipt"}
                          </button>
                          {!canSendAgentReceipt ? (
                            <p className="mt-1.5 text-[9px] text-slate-400 leading-tight">
                              Once the latest installment is verified, the
                              receipt modal will open automatically. You can add
                              the agent’s email in the email modal.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100/80 via-indigo-50/40 to-blue-50/80 px-4 py-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    <PieChart className="h-3.5 w-3.5 text-emerald-500" />{" "}
                    Payment Progress
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    {progress}%
                  </span>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="group relative flex h-[154px] w-[154px] cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
                    <svg
                      className="h-full w-full -rotate-90 transition-transform duration-700 ease-out group-hover:rotate-[270deg]"
                      viewBox="0 0 160 160"
                    >
                      <defs>
                        <linearGradient
                          id="paymentTrackerRing"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="52%" stopColor="#615fff" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="80"
                        cy="80"
                        r={ringRadius}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="9"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r={ringRadius}
                        fill="none"
                        stroke="url(#paymentTrackerRing)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        initial={{ strokeDashoffset: ringCircumference }}
                        animate={{ strokeDashoffset: paidStrokeOffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:scale-95 group-hover:opacity-0">
                      <p className="text-[1.25rem] font-bold leading-none text-slate-900">
                        {formatCurrency(totalAmount)}
                      </p>
                      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Total amount
                      </p>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 scale-105">
                      <p className="text-3xl font-bold bg-gradient-to-r from-[#163B72] to-[#5b5ff8] bg-clip-text text-transparent">
                        {progress}%
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                        Paid
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-7 w-full">
                    {/* Vertical dashed line */}
                    <div className="absolute left-[11px] top-6 bottom-4 border-l-2 border-dashed border-slate-200" />

                    <div className="grid w-full gap-2.5">
                      {/* Total paid */}
                      <div className="relative">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#5b5ff8] ring-[2.5px] ring-slate-50" />
                        <div className="group relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-100 to-indigo-50/50 px-3.5 py-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <p className="text-[11px] font-semibold text-slate-500">
                            Total paid
                          </p>
                          <p className="mt-0.5 text-[0.95rem] font-semibold text-slate-900">
                            {formatCurrency(paidAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Remaining */}
                      <div className="relative">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-slate-300 ring-[2.5px] ring-slate-50" />
                        <div className="group relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-100 to-amber-50/50 px-3.5 py-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                          <p className="text-[11px] font-semibold text-slate-500">
                            Remaining
                          </p>
                          <p className="mt-0.5 text-[0.95rem] font-semibold text-slate-900">
                            {formatCurrency(remainingAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="relative">
                        <div
                          className={`absolute left-[-21px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ring-[2.5px] ring-slate-50 ${isComplete ? "bg-emerald-500" : "bg-amber-400"}`}
                        />
                        <div
                          className={`group relative overflow-hidden rounded-xl border px-3.5 py-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            isComplete
                              ? "border-emerald-200 bg-gradient-to-br from-emerald-100 to-emerald-50/50"
                              : "border-amber-200 bg-gradient-to-br from-amber-100 to-amber-50/50"
                          }`}
                        >
                          <p className="text-[11px] font-semibold text-slate-500">
                            Status
                          </p>
                          <p
                            className={`mt-0.5 text-[0.95rem] font-semibold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}
                          >
                            {isComplete ? "Fully Paid" : "Partially Paid"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full rounded-2xl bg-white/90 px-3 py-2.5 shadow-sm">
                    <div className="mb-3 flex items-end justify-between gap-3 text-[12px]">
                      <span className="font-semibold text-slate-400">
                        {formatCurrency(0)}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm">
                        <span className="text-[#5b5ff8]">
                          {formatCurrency(paidAmount)}
                        </span>
                        <span className="text-indigo-300">/</span>
                        <span className="text-slate-700">
                          {formatCurrency(totalAmount)}
                        </span>
                      </span>
                    </div>
                    <div className="relative h-2.5 overflow-visible rounded-full bg-slate-200">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#163B72] to-[#5b5ff8]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      <motion.div
                        className="group absolute top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full border-[4px] border-indigo-600 bg-white shadow-[0_2px_10px_rgba(79,70,229,0.28)]"
                        initial={{ left: "calc(2% - 8px)", opacity: 0 }}
                        animate={{
                          left: `calc(${progressDotPosition}% - 8px)`,
                          opacity: 1,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
                          <div className="flex flex-col items-center gap-0.5 text-center">
                            <p className="text-sm font-bold text-white">
                              {progress}% Paid
                            </p>
                            <p className="text-[10px] text-slate-300">
                              {payment?.agentName || "Agent"}
                            </p>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400">
                              {payment?.paymentDate || "N/A"}
                            </p>
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-slate-900"></div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentTrackerModal;
