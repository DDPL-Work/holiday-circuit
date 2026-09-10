import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, X, Check } from "lucide-react";

const VerifyInstallmentConfirmationModal = ({
  installmentIndex,
  payment,
  onClose,
  onConfirm,
  submitting = false,
}) => {
  const installment = Array.isArray(payment?.paymentTrackerEntries)
    ? payment.paymentTrackerEntries[installmentIndex] || {}
    : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex max-h-[90vh] w-full max-w-[420px] flex-col rounded-2xl border border-emerald-100 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              Confirm Payment Verification
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

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-emerald-800">
                Review & Confirmation
              </p>
              <p className="mt-0.5 text-[11.5px] text-emerald-600/90 leading-normal font-medium">
                I have reviewed the payment submitted by the agent and verified
                it against the bank records. All details are correct.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">
                Payment Amount:
              </span>
              <span className="font-bold text-slate-800">
                {`₹${Math.round(Number(installment?.amount || 0)).toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">
                Payment Date:
              </span>
              <span className="font-bold text-slate-800">
                {installment?.date || "Pending"}
              </span>
            </div>
            {installment?.note && (
              <div className="pt-2 border-t border-slate-100/80">
                <span className="block text-[11px] text-slate-400 font-bold mb-1">
                  Remarks:
                </span>
                <p className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200/60 text-[11.5px] leading-relaxed text-slate-650 font-medium">
                  {installment.note}
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-normal text-center font-medium">
            By confirming, this installment will be marked as{" "}
            <strong className="text-slate-500 font-bold">Verified</strong> and
            locked from further edits by the agent.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-[12px] font-semibold text-slate-600 transition active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-white shadow-sm shadow-emerald-600/10 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Confirm Verification
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


export default VerifyInstallmentConfirmationModal;
