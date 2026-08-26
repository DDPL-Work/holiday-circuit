import React from "react";
import { Mail, X, Send } from "lucide-react";
import { motion } from "framer-motion";

export const SendEmailModal = ({
  isOpen,
  onClose,
  targetEmailInput,
  setTargetEmailInput,
  emailSubjectInput,
  setEmailSubjectInput,
  handleConfirmSendEmail,
  isSendingEmail,
  isVoucherMode,
  isPackageMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Send {isVoucherMode ? "Travel Voucher" : isPackageMode ? "Package Details" : "Quotation"} Email
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Enter recipient details to dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleConfirmSendEmail} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Recipient Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={targetEmailInput}
              onChange={(e) => setTargetEmailInput(e.target.value)}
              placeholder="e.g. client@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              value={emailSubjectInput}
              onChange={(e) => setEmailSubjectInput(e.target.value)}
              placeholder="Enter subject line..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSendingEmail}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSendingEmail ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SendEmailModal;
