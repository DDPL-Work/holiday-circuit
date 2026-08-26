import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, X, Send, Download } from "lucide-react";
import { formatCurrency } from "../utils/formatter";

const SendAgentReceiptModal = ({
  payment,
  trackerEntry = null,
  installmentIndex = null,
  recipientEmail,
  recipientPhone,
  dispatchChannel,
  onRecipientEmailChange,
  onRecipientPhoneChange,
  onDispatchChannelChange,
  sending = false,
  onClose,
  onSend,
}) => {
  const installmentAmount = Math.round(Number(trackerEntry?.amount || 0));
  const allTrackerEntries = Array.isArray(payment?.paymentTrackerEntries)
    ? payment.paymentTrackerEntries
    : [];
  const cumulativePaid =
    trackerEntry && installmentIndex !== null
      ? allTrackerEntries
          .slice(0, installmentIndex + 1)
          .reduce(
            (sum, entry) => sum + Math.round(Number(entry?.amount || 0)),
            0,
          )
      : Math.round(
          Number(
            payment?.paymentTrackerPaidAmount || payment?.receivedAmount || 0,
          ),
        );
  const remainingBalance = Math.max(
    0,
    Math.round(
      Number(payment?.paymentTrackerTotal || payment?.expectedAmount || 0),
    ) - cumulativePaid,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/65 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[410px] min-h-[490px] max-h-[85vh] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#ecfeff_100%)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#163B72] text-white shadow-sm">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Send Receipt
                </p>
                <h3 className="text-[15px] font-semibold leading-tight text-slate-900">
                  Share with agent
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll space-y-4 px-5 py-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Receipt Summary
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 text-slate-700">
              {/* Left Column */}
              <div className="space-y-2.5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Query
                  </p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {payment?.bookingReference || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Invoice
                  </p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {payment?.invoiceNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Instalment
                  </p>
                  <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                    {trackerEntry
                      ? `Instalment ${Number(installmentIndex) + 1}`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2.5 pl-4 border-l border-slate-200/80">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Receipt Amount
                  </p>
                  <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                    {formatCurrency(
                      installmentAmount ||
                        payment?.paymentTrackerPaidAmount ||
                        payment?.receivedAmount ||
                        0,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Received So Far
                  </p>
                  <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                    {formatCurrency(cumulativePaid)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Remaining
                  </p>
                  <p
                    className={`text-[11px] font-extrabold mt-0.5 ${remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {formatCurrency(remainingBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
            {[
              {
                key: "EMAIL",
                label: "Email",
                iconElement: <Mail className="h-3.5 w-3.5" />,
              },
              {
                key: "WHATSAPP",
                label: "WhatsApp",
                iconElement: <Send className="h-3.5 w-3.5" />,
              },
              {
                key: "PDF",
                label: "PDF",
                iconElement: <Download className="h-3.5 w-3.5" />,
              },
            ].map(({ key, label, iconElement }) => (
              <button
                key={key}
                type="button"
                onClick={() => onDispatchChannelChange(key)}
                className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                  dispatchChannel === key
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-500 hover:bg-white hover:text-slate-800"
                }`}
              >
                {iconElement}
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {dispatchChannel === "EMAIL" && (
              <motion.div
                key="email-field"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm shadow-indigo-200/70">
                    <Mail className="h-3 w-3" />
                  </span>
                  <span>Agent Email</span>
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => onRecipientEmailChange(e.target.value)}
                  placeholder="Enter agent email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </motion.div>
            )}

            {dispatchChannel === "WHATSAPP" && (
              <motion.div
                key="whatsapp-field"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-500 text-white shadow-sm shadow-emerald-200/70">
                    <Send className="h-3 w-3" />
                  </span>
                  <span>Agent WhatsApp Number</span>
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => onRecipientPhoneChange(e.target.value)}
                  placeholder="Enter WhatsApp number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                <Send className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  What will happen
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                  {dispatchChannel === "EMAIL"
                    ? "A Holiday Circuit branded payment receipt PDF will be generated and sent to the agent on this email."
                    : dispatchChannel === "WHATSAPP"
                      ? "A branded receipt PDF will be generated and WhatsApp will open with a ready-to-share message."
                      : "A branded receipt PDF will be generated and downloaded to your system."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="cursor-pointer rounded-full bg-slate-900 px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending
              ? "Processing..."
              : dispatchChannel === "PDF"
                ? "Download Receipt"
                : dispatchChannel === "WHATSAPP"
                  ? "Open WhatsApp"
                  : trackerEntry
                    ? "Send Instalment Receipt"
                    : "Send Receipt"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


export default SendAgentReceiptModal;
