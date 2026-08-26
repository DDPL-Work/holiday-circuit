import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, ChevronDown } from 'lucide-react';
import { rejectionReasons } from '../utils/invoiceHelpers.jsx';

export const RejectInvoiceModal = ({ invoice, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason);
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
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.975 }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
        className="w-full max-w-[450px] rounded-[24px] bg-white border border-slate-100/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] overflow-hidden relative"
      >
        <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-[#0b1e36] via-[#f43f5e] to-[#be123c]" />

        <div className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 p-2 text-rose-500 ring-4 ring-rose-50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] bg-gradient-to-r from-[#0b1e36] to-rose-600 bg-clip-text text-transparent">
                Reject Invoice
              </p>
              <h2 className="mt-1 text-base font-bold text-slate-800 leading-tight">
                Reason for <span className="text-rose-600 underline decoration-rose-400 decoration-2 underline-offset-4">Rejection</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-90 animate-none shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Invoice Number
              </label>
              <span className="text-[10px] font-mono font-bold text-rose-500">{invoice?.id}</span>
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] text-slate-700 outline-none focus:border-rose-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {selectedReason ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-slate-800">{selectedReason}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">-- Select rejection reason --</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isReasonDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90] bg-transparent"
                    onClick={() => setIsReasonDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] hide-scrollbar">
                    {rejectionReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason);
                          setIsReasonDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-700 transition-colors hover:bg-rose-50/50 cursor-pointer"
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

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] leading-relaxed text-amber-700">
              <span className="font-bold">Note:</span> DMC will be notified of the rejection
              reason on their dashboard immediately. Please ensure accuracy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReason}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm ${selectedReason
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 hover:shadow-md hover:shadow-red-500/10'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
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
