import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

export const RevisionModal = ({
  isOpen,
  onClose,
  revisionReason,
  setRevisionReason,
  handleRequestRevision,
  revisionSubmitting,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[4px] p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl p-5 relative border border-slate-200 border-t-4 border-t-[#b91c1c] overflow-hidden"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3 mb-3 pr-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#b91c1c]">
                <RotateCcw size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#b91c1c]">
                  Revision Request
                </p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900 leading-tight">
                  Send back to operations
                </h3>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 mb-3">
              Add the client's requested changes below. Operations will be notified to revise the quotation.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revision details
              </label>
              <textarea
                rows={3}
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Example: Client wants hotel option near city center, lower total budget, and airport transfer included."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestRevision}
                disabled={revisionSubmitting}
                className="px-4 py-2 bg-[#b91c1c] hover:bg-[#dc2626] text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
              >
                {revisionSubmitting ? "Sending..." : "Notify Ops Team"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
