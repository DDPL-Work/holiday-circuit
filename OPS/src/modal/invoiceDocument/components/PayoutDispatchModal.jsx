import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { payoutDispatchOptions } from '../utils/invoiceHelpers.jsx';

export const PayoutDispatchModal = ({
  selectedChannel,
  recipientEmail,
  recipientPhone,
  onSelectChannel,
  onEmailChange,
  onPhoneChange,
  onClose,
  onConfirm,
  isSubmitting,
  dmcName,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-[5px] p-4"
  >
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.975 }}
      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
      className="w-full max-w-[450px] rounded-[24px] bg-white border border-slate-100/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] overflow-hidden relative"
    >
      <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-[#0b1e36] via-[#10b981] to-[#107c41]" />

      <div className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] bg-gradient-to-r from-[#0b1e36] to-[#10b981] bg-clip-text text-transparent">
            Send Payout Receipt
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-800 leading-tight">
            Share with <span className="text-slate-900 underline decoration-emerald-400 decoration-2 underline-offset-4">{dmcName || 'DMC Partner'}</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-90 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 px-6 py-5">
        {payoutDispatchOptions.map((option) => {
          const Icon = option.icon;
          const isActive = selectedChannel === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelectChannel(option.key)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left transition-all duration-300 relative group overflow-hidden cursor-pointer ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/30 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.12)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 transition-all duration-300 ${
                  isActive
                    ? option.key === 'WHATSAPP'
                      ? 'bg-[#25D366] text-white shadow-sm shadow-[#25D366]/20 rotate-3 scale-105'
                      : 'bg-gradient-to-br from-[#0b1e36] to-[#10b981] text-white shadow-sm shadow-emerald-500/10 rotate-3 scale-105'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-sm font-bold transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}

        <AnimatePresence mode="wait">
          {selectedChannel === 'EMAIL' && (
            <motion.div
              key="email-field"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 mt-1 shadow-[inset_0_1px_2px_rgba(241,245,249,0.5)]">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.2 h-1.2 rounded-full bg-emerald-500" />
                  DMC Email Address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="Enter DMC email address"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-950 shadow-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          )}
          {selectedChannel === 'WHATSAPP' && (
            <motion.div
              key="phone-field"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 mt-1 shadow-[inset_0_1px_2px_rgba(241,245,249,0.5)]">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.2 h-1.2 rounded-full bg-emerald-500" />
                  DMC WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(event) => onPhoneChange(event.target.value)}
                  placeholder="Enter DMC WhatsApp number (e.g. 9876543210)"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-950 shadow-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4">
        <button
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 active:scale-[0.98] cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className={`inline-flex h-10 items-center justify-center rounded-xl text-xs font-bold text-white transition-all duration-200 active:scale-95 shadow-md cursor-pointer ${
            isSubmitting
              ? 'cursor-not-allowed bg-slate-300 shadow-none'
              : 'bg-gradient-to-r from-[#0b1e36] to-[#1d3d63] hover:from-[#132d52] hover:to-[#234b7a] hover:shadow-lg hover:shadow-slate-900/12'
          }`}
        >
          {isSubmitting
            ? 'Processing...'
            : selectedChannel === 'PDF'
            ? 'Confirm & Download'
            : selectedChannel === 'WHATSAPP'
            ? 'Confirm & Open'
            : 'Confirm & Send'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default PayoutDispatchModal;
