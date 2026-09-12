import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download } from "lucide-react";
import {
  formatAmountInput,
  getTodayInputDate,
  normalizeReceipt,
} from "../utils/bookingDetailsHelpers";

export function PaymentTracker({ totalAmount, payments, onAddPayment, onUpdatePayment, onDownloadReceipt, onValidationError }) {
  const [inputAmt, setInputAmt] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const amountInputRef = useRef(null);

  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalAmount - paid);
  const pct = totalAmount > 0 ? Math.min(100, Math.round((paid / totalAmount) * 100)) : 0;
  const isComplete = remaining === 0 && totalAmount > 0;

  function handleStartEdit(p) {
    setEditingId(p.id);
    setInputAmt(p.amount.toLocaleString("en-IN"));
    setInputDate(p.rawDate || "");
    setInputNote(p.note || "");
    setError("");
    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setInputAmt("");
    setInputNote("");
    setInputDate("");
    setError("");
  }

  function handleAddOrUpdate() {
    const amt = parseInt(inputAmt.replace(/,/g, ""), 10);
    if (!amt || amt < 1) { setError("Please enter a valid amount."); return; }
    if (!inputDate) { setError("Please select a payment date."); return; }
    if (inputDate > getTodayInputDate()) {
      const message = "Future payment date is not allowed. Please select today or a past date.";
      setError(message);
      onValidationError?.(message);
      return;
    }

    const originalPayment = payments.find(x => x.id === editingId);
    const originalAmt = originalPayment ? originalPayment.amount : 0;
    const remainingForEdit = totalAmount - (paid - originalAmt);

    if (editingId) {
      if (amt > remainingForEdit) {
        setError(`Amount exceeds remaining balance of ₹${remainingForEdit.toLocaleString("en-IN")}.`);
        return;
      }
    } else {
      if (amt > remaining) {
        setError(`Amount exceeds remaining balance of ₹${remaining.toLocaleString("en-IN")}.`);
        return;
      }
    }

    setError("");
    const dateLabel = new Date(inputDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (editingId) {
      onUpdatePayment({
        id: editingId,
        amount: amt,
        date: dateLabel,
        rawDate: inputDate,
        note: inputNote.trim()
      });
      setEditingId(null);
    } else {
      onAddPayment({
        amount: amt,
        date: dateLabel,
        rawDate: inputDate,
        note: inputNote.trim(),
        createdAt: new Date().toISOString(),
        receipt: normalizeReceipt(),
      });
    }

    setInputAmt("");
    setInputNote("");
    setInputDate("");
  }

  if (totalAmount <= 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Add Payment form */}
      <AnimatePresence initial={false}>
        {(!isComplete || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`transition-all duration-300 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs ${editingId ? "ring-1 ring-teal-200" : ""}`}>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {editingId ? "Edit Payment Entry" : "Add Payment Entry"}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[110px] flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">₹</span>
                  <input
                    ref={amountInputRef}
                    value={inputAmt}
                    onChange={(e) => setInputAmt(formatAmountInput(e.target.value))}
                    inputMode="numeric"
                    placeholder="Amount"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-4 text-[12px] font-semibold text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
                <input
                  type="date"
                  value={inputDate}
                  max={getTodayInputDate()}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    if (nextDate && nextDate > getTodayInputDate()) {
                      const message = "Future payment date is not allowed. Please select today or a past date.";
                      setInputDate("");
                      setError(message);
                      onValidationError?.(message);
                      return;
                    }
                    setInputDate(nextDate);
                  }}
                  className="h-9 w-32 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[12px] text-slate-600 outline-none transition focus:border-indigo-500 cursor-pointer"
                />
                <input
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="h-9 min-w-[80px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 text-[12px] text-slate-600 outline-none transition focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddOrUpdate}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#3E63DD] hover:bg-[#3151C2] shadow-sm hover:shadow-md text-[12px] font-bold text-white transition active:scale-95 px-4.5"
                >
                  {editingId ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4.5 text-[12px] font-semibold text-slate-600 transition active:scale-95"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
