import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText } from "lucide-react";

export const SubmitDocsConfirmModal = ({
  isOpen,
  onClose,
  requiredDocCount,
  totalRequiredDocSlots,
  submittingDocs,
  onSubmit,
}) => {
  return (
    <AnimatePresence>
      {isOpen ? (
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
              <button type="button" onClick={onClose} className="flex-1 rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button
                type="button"
                onClick={onSubmit}
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
  );
};
