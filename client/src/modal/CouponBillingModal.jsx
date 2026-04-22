import { useState } from "react";
import { Info, X, BadgePercent } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function CouponBillingModal({ open = true, onClose }) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCode, setAppliedCode] = useState(null);
  const [error, setError] = useState("");
  const [infoDismissed, setInfoDismissed] = useState(false);

  const VALID_CODES = {
    "SAVE10": 10,
    "25TODAYONLY": 25,
    "FLAT5": 5,
  };

  const subtotal = 0;
  const taxes = 0;
  const discount = appliedCode ? (subtotal * VALID_CODES[appliedCode]) / 100 : 0;
  const total = subtotal + taxes - discount;
  const formatPrice = (amount) => Number(amount || 0).toLocaleString("en-IN");

  const handleApply = () => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a coupon code.");
      return;
    }
    if (VALID_CODES[trimmed]) {
      setAppliedCode(trimmed);
      setError("");
    } else {
      setError("Invalid coupon code. Please try again.");
      setAppliedCode(null);
    }
  };

  const handleRemove = () => {
    setAppliedCode(null);
    setCouponCode("");
    setError("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.40)", backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer gradient border glow */}
            <div className="absolute -inset-[2px] rounded-[28px] z-0"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #6366f1)",
                opacity: 0.7,
                borderRadius: "28px",
              }} />

            {/* Card */}
            <div className="relative z-10 rounded-[26px] bg-white overflow-hidden px-5 py-5"
              style={{ background: "linear-gradient(160deg, #fafafa 0%, #f5f3ff 100%)" }}>

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Coupon & Discount</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Apply your code to unlock savings</p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "#c4b5fd", color: "#7c3aed", background: "#faf5ff" }}>
                  Active Offer
                </span>
              </div>

              {/* Info banner */}
              <AnimatePresence>
                {!infoDismissed && (
                  <motion.div
                    className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-4"
                    style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Info size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {appliedCode ? `Code "${appliedCode}" applied!` : "Enter your coupon code below"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-5">
                        Discount will be applied automatically. Cancel anytime, hassle-free.
                      </p>
                    </div>
                    <button onClick={() => setInfoDismissed(true)}
                      className="text-slate-300 hover:text-slate-500 transition-all flex-shrink-0 mt-0.5">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Billing breakdown */}
              <div className="mb-4 space-y-2.5">
                {[
                  { label: "Subtotal", value: `INR ${formatPrice(subtotal)}`, bold: false },
                  { label: "Taxes",    value: `INR ${formatPrice(taxes)}`,    bold: false },
                  {
                    label: appliedCode ? `Discount (${VALID_CODES[appliedCode]}%)` : "Discount",
                    value: `- INR ${formatPrice(discount)}`,
                    bold: false,
                    green: true,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{row.label}</span>
                    <span className={`text-sm font-medium ${row.green ? "text-emerald-600" : "text-slate-800"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}

                {/* Dashed divider */}
                <div className="border-t border-dashed border-slate-200 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Total to pay</span>
                    <span className="text-base font-bold text-slate-900">INR {formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Coupon input */}
              <div className="mb-2">
                <AnimatePresence mode="wait">
                  {appliedCode ? (
                    <motion.div
                      key="applied"
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-2">
                        <BadgePercent size={15} className="text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700 tracking-wider">{appliedCode}</span>
                        <span className="text-xs text-emerald-500">applied ✓</span>
                      </div>
                      <button onClick={handleRemove}
                        className="text-xs font-semibold text-red-400 hover:text-red-600 transition-all">
                        Remove
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="input"
                      className="flex items-center gap-2 rounded-2xl px-3 py-2"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BadgePercent size={15} className="text-slate-300 flex-shrink-0" />
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApply()}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-300 outline-none"
                      />
                      <button
                        onClick={handleApply}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200"
                        style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
                      >
                        Apply code
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="mt-1.5 text-xs text-red-500 px-1"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA */}
              <motion.button
                className="mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%)",
                  boxShadow: "0 6px 20px rgba(139,92,246,0.35)",
                }}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(139,92,246,0.48)" }}
                whileTap={{ scale: 0.97 }}
              >
                Proceed to payment
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
