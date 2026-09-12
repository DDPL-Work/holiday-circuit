import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, ChevronDown, UserCheck } from 'lucide-react';
import { rejectionReasons } from '../utils/invoiceHelpers.jsx';

export const RejectInvoiceModal = ({ invoice, onClose, onConfirm, onPassToManager, isSubmitting = false }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);

  const handleConfirm = () => {
    if (!selectedReason || isSubmitting) return;
    onConfirm(selectedReason);
  };

  const handlePass = () => {
    if (!selectedReason || isSubmitting) return;
    if (onPassToManager) {
      onPassToManager(selectedReason);
    } else {
      onConfirm(`[Passed to Manager]: ${selectedReason}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-[5px] p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
        className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)] overflow-visible relative"
      >
        <div className="absolute top-0 inset-x-0 h-[3.5px] rounded-t-xl bg-gradient-to-r from-slate-900 via-rose-500 to-rose-600" />

        <div className="flex items-start justify-between border-b border-slate-100 px-5 pb-3.5 pt-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 p-2 text-rose-500 ring-4 ring-rose-50">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-600">
                Reject Invoice
              </p>
              <h2 className="mt-0.5 text-base font-bold text-slate-800 leading-tight">
                Reason for <span className="text-rose-600 underline decoration-rose-400 decoration-2 underline-offset-4">Rejection</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-90 shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Invoice Number
              </label>
              <span className="text-[11px] font-mono font-bold text-rose-500">{invoice?.id}</span>
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 text-xs text-slate-700 outline-none focus:border-rose-400 transition-all shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedReason ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{selectedReason}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">-- Select rejection reason --</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isReasonDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90] bg-transparent"
                    onClick={() => setIsReasonDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl hide-scrollbar">
                    {rejectionReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason);
                          setIsReasonDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-rose-50/70 cursor-pointer"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedReason === reason ? "bg-rose-500" : "bg-slate-300"}`} />
                        <span className={selectedReason === reason ? "font-bold text-rose-600" : "font-semibold text-slate-700"}>
                          {reason}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <p className="text-[10px] leading-relaxed text-amber-700">
              <span className="font-bold">Note:</span> DMC will be notified of the rejection
              reason on their dashboard immediately. Please ensure accuracy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handlePass}
              disabled={!selectedReason || isSubmitting}
              className={`rounded-lg border px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedReason && !isSubmitting
                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              Pass to Manager
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedReason || isSubmitting}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                selectedReason && !isSubmitting
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 hover:shadow-md hover:shadow-red-500/15'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              }`}
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RejectInvoiceModal;
