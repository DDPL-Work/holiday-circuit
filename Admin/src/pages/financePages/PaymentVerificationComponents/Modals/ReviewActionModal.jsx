import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronDown, Check, ShieldCheck } from "lucide-react";
import { rejectionReasons } from "../utils/formatter";

const ReviewActionModal = ({
  mode,
  payment,
  submitting,
  userRole,
  onClose,
  onConfirm,
}) => {
  const isVerifyMode = mode === "verify";
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reviewTarget, setReviewTarget] = useState("agent");
  const [submitted, setSubmitted] = useState(false);
  const showTargetOptions = ["finance_partner", "finance_manager"].includes(
    userRole,
  );
  const targetOptions = isVerifyMode
    ? userRole === "finance_manager"
      ? [
          {
            value: "agent",
            title: "Agent",
            description:
              "Complete the verification and notify the agent directly.",
          },
          {
            value: "admin",
            title: "Admin",
            description:
              "Escalate this payment verification to the Super Admin for overriding decision.",
          },
        ]
      : [
          {
            value: "agent",
            title: "Agent",
            description:
              "Complete the verification at team level and notify the agent directly.",
          },
          {
            value: "manager",
            title: "Manager",
            description:
              "Escalate this verified payment to the finance manager for final approval.",
          },
        ]
    : userRole === "finance_manager"
      ? [
          {
            value: "agent",
            title: "Agent",
            description:
              "Agent will correct payment details and resubmit directly.",
          },
          {
            value: "admin",
            title: "Admin",
            description:
              "This payment dispute will move to the Super Admin for override review.",
          },
        ]
      : [
          {
            value: "agent",
            title: "Agent",
            description:
              "Agent will correct payment details and resubmit directly.",
          },
          {
            value: "manager",
            title: "Manager",
            description:
              "This payment will move to finance manager for final review.",
          },
        ];

  const handleSubmit = () => {
    if (!isVerifyMode && !reason) {
      setSubmitted(true);
      return;
    }
    onConfirm(
      isVerifyMode
        ? { remarks, reviewTarget }
        : { reason, remarks, rejectionTarget: reviewTarget },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex max-h-[90vh] w-full max-w-[420px] flex-col rounded-2xl border bg-white shadow-2xl ${isVerifyMode ? "border-emerald-100" : "border-red-100"}`}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              {isVerifyMode
                ? "Verify Payment And Send"
                : "Reject Payment And Send"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {payment?.bookingReference} | {payment?.invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scroll space-y-3 overflow-y-auto px-6 py-4">
          {!isVerifyMode && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full appearance-none rounded-lg border px-3.5 py-2 text-[13px] outline-none transition-colors ${submitted && !reason ? "border-red-300 bg-red-50/40 text-slate-500" : "border-slate-200 bg-white text-slate-700 focus:border-blue-300"}`}
                >
                  <option value="">Select rejection reason</option>
                  {rejectionReasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {submitted && !reason && (
                <p className="mt-1 text-[11px] text-red-500">
                  A rejection reason is required.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
              {isVerifyMode ? "Verification Remarks" : "Remarks"}
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                isVerifyMode
                  ? "Add remarks for the agent or finance manager before sending..."
                  : "Add optional remarks for the agent and finance audit trail..."
              }
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-300"
            />
          </div>
          {showTargetOptions && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                {isVerifyMode ? "Send Verification To" : "Send Rejection To"}
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {targetOptions.map((option) => {
                  const isActive = reviewTarget === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReviewTarget(option.value)}
                      className={`rounded-lg border px-3.5 py-2 text-left transition-colors ${isActive ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <p className="text-[13px] font-semibold">
                            {option.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug">
                            {option.description}
                          </p>
                        </div>
                        <span
                          className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[0px] ${isActive ? "border-blue-400 bg-white text-blue-600" : "border-slate-300 text-transparent"}`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-snug text-amber-800">
                {showTargetOptions
                  ? isVerifyMode
                    ? "This action records reviewer, timestamp, remarks, and routes the verification to the selected owner."
                    : "This action records reviewer, timestamp, rejection reason, and routes the payment to the selected correction owner."
                  : isVerifyMode
                    ? "This action records reviewer, timestamp, and verification remarks before notifying the agent."
                    : "This action records reviewer, timestamp, rejection reason, and notifies the agent."}
              </p>
            </div>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors ${submitting ? (isVerifyMode ? "cursor-not-allowed bg-emerald-300" : "cursor-not-allowed bg-red-300") : isVerifyMode ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
          >
            {submitting
              ? isVerifyMode
                ? "Sending..."
                : "Rejecting..."
              : isVerifyMode
                ? "Verify and Send"
                : "Reject and Send"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


export default ReviewActionModal;
