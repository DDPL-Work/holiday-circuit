import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { formatMoney } from "../../utils/queryDetailsHelpers";

export const SendSuccessModal = ({
  sendSuccessMeta,
  onCloseModal,
  onCloseQuery,
  query,
}) => {
  return (
    <AnimatePresence>
      {sendSuccessMeta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-2xl"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative border-b border-emerald-50 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_45%,#eff6ff_100%)] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md">
                    <Send size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Delivered
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-slate-900 leading-tight">
                      Quotation Shared!
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                A dynamic quotation summary has been shared with travel dates, services, and final amount.
              </p>
            </div>

            <div className="relative px-5 py-4">
              <div className="grid gap-2 grid-cols-3">
                {/* Recipient Email Row (Full width) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 col-span-3 text-left">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recipient</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 break-all select-all">
                    {sendSuccessMeta.recipientEmail || "Registered email"}
                  </p>
                </div>

                {/* 3 cards side-by-side */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-1 py-2 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Quotation</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                    {sendSuccessMeta.quotationNumber || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-1 py-2 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Destination</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-800 truncate">
                    {sendSuccessMeta.destination || query?.destination}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-1 py-2 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Client Total</p>
                  <p className="mt-0.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                    {formatMoney(sendSuccessMeta.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 rounded-xl border border-emerald-50 bg-emerald-50/30 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-emerald-700 bg-emerald-100/60 rounded px-1.5 py-0.5">
                    {sendSuccessMeta.serviceCount} services
                  </span>
                  <span>•</span>
                  <span>Valid till {sendSuccessMeta.validTill || "-"}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="rounded-full bg-gradient-to-r from-[#1e293b] to-[#0f172a] hover:from-[#0f172a] hover:to-black text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Stay Here
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCloseModal();
                    onCloseQuery?.();
                  }}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Back to Queries
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
