import { useEffect, useState } from "react";
import { Info, X, BadgePercent, LoaderCircle, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../utils/Api";

const formatPrice = (amount) => Number(amount || 0).toLocaleString("en-IN");

const normalizeCouponCode = (value = "") => String(value || "").trim().toUpperCase();

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: Math.cos((index / 18) * Math.PI * 2) * (50 + Math.random() * 28),
  y: Math.sin((index / 18) * Math.PI * 2) * (50 + Math.random() * 28),
  color: ["#6366f1", "#a855f7", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6"][index % 7],
  size: 5 + Math.random() * 5,
  rotate: Math.random() * 360,
  shape: index % 3 === 0 ? "circle" : index % 3 === 1 ? "rect" : "star",
}));

function Particle({ particle, burst }) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: "50%",
        top: "50%",
        width: particle.size,
        height: particle.shape === "rect" ? particle.size * 0.55 : particle.size,
        borderRadius: particle.shape === "circle" ? "50%" : "2px",
        background: particle.color,
        clipPath:
          particle.shape === "star"
            ? "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
            : "none",
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
      animate={
        burst
          ? { x: particle.x, y: particle.y, opacity: [1, 1, 0], scale: [0, 1.15, 0.82], rotate: particle.rotate }
          : {}
      }
      transition={{ duration: 0.72, ease: "easeOut" }}
    />
  );
}

const deriveDiscountPercentLabel = (coupon = null) => {
  if (!coupon) return "-";
  if (coupon.discountType === "percentage") return `${Number(coupon.discountValue || 0)}%`;
  return coupon.discount || "Flat Offer";
};

export default function CouponBillingModal({
  open = true,
  onClose,
  invoiceId = "",
  subtotalAmount = 0,
  currency = "INR",
  existingCouponApplication = null,
  onApplyCoupon,
}) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedSummary, setAppliedSummary] = useState(null);
  const [appliedInvoice, setAppliedInvoice] = useState(null);
  const [error, setError] = useState("");
  const [infoDismissed, setInfoDismissed] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);
  const [burst, setBurst] = useState(false);
  const [burstCycle, setBurstCycle] = useState(0);

  useEffect(() => {
    if (!open) return;

    if (existingCouponApplication?.couponId) {
      setCouponCode(existingCouponApplication.code || "");
      setAppliedCoupon({
        id: existingCouponApplication.couponId,
        code: existingCouponApplication.code || "",
        discount: existingCouponApplication.discountLabel || "",
        discountType: existingCouponApplication.discountType || "",
        discountValue: Number(existingCouponApplication.discountValue || 0),
      });
      setAppliedSummary({
        subtotalAmount: Math.round(Number(existingCouponApplication.subtotalAmount || subtotalAmount || 0)),
        discountAmount: Math.round(Number(existingCouponApplication.discountAmount || 0)),
        payableAmount: Math.round(Number(existingCouponApplication.payableAmount || subtotalAmount || 0)),
      });
    } else {
      setCouponCode("");
      setAppliedCoupon(null);
      setAppliedSummary(null);
    }

    setAppliedInvoice(null);
    setError("");
    setInfoDismissed(false);
    setBurst(false);
  }, [existingCouponApplication, open, subtotalAmount]);

  useEffect(() => {
    if (!burst) return undefined;

    const timer = window.setTimeout(() => setBurst(false), 900);
    return () => window.clearTimeout(timer);
  }, [burst]);

  const subtotal = Math.round(Number(appliedSummary?.subtotalAmount ?? subtotalAmount ?? 0));
  const discountAmount = Math.round(Number(appliedSummary?.discountAmount || 0));
  const totalToPay = Math.round(Number(appliedSummary?.payableAmount ?? subtotalAmount ?? 0));

  const handleApply = async () => {
    const trimmed = normalizeCouponCode(couponCode);
    if (!trimmed) {
      setError("Please enter a coupon code.");
      return;
    }

    if (!invoiceId) {
      setError("Invoice is not available for this booking.");
      return;
    }

    try {
      setApplyingCode(true);
      setError("");
      const { data } = await API.post(`/agent/invoices/${invoiceId}/apply-coupon`, {
        couponCode: trimmed,
        subtotalAmount: subtotal,
      });

      setAppliedCoupon(data?.data?.coupon || null);
      setAppliedSummary({
        subtotalAmount: Math.round(Number(data?.data?.subtotalAmount || subtotal)),
        discountAmount: Math.round(Number(data?.data?.discountAmount || 0)),
        payableAmount: Math.round(Number(data?.data?.payableAmount || subtotal)),
      });
      setAppliedInvoice(data?.data?.invoice || null);
      setCouponCode(trimmed);
      setInfoDismissed(false);
      setBurst(false);
      setBurstCycle((current) => current + 1);
      window.setTimeout(() => setBurst(true), 40);
    } catch (applyError) {
      setAppliedCoupon(null);
      setAppliedSummary(null);
      setAppliedInvoice(null);
      setError(applyError?.response?.data?.message || "Unable to apply coupon right now.");
    } finally {
      setApplyingCode(false);
    }
  };

  const handleProceed = () => {
    if (!appliedCoupon || !appliedSummary) {
      setError("Apply a valid coupon before continuing.");
      return;
    }

    onApplyCoupon?.({
      coupon: appliedCoupon,
      subtotal: subtotal,
      discountAmount,
      payableAmount: totalToPay,
      invoice: appliedInvoice,
    });
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
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="absolute -inset-[2px] z-0 rounded-[28px]"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #6366f1)",
                opacity: 0.7,
                borderRadius: "28px",
              }}
            />

            <div
              className="relative z-10 overflow-hidden rounded-[26px] bg-white px-5 py-5"
              style={{ background: "linear-gradient(160deg, #fafafa 0%, #f5f3ff 100%)" }}
            >
              <div className="pointer-events-none absolute left-1/2 top-[112px] z-20 -translate-x-1/2">
                {PARTICLES.map((particle) => (
                  <Particle key={`${burstCycle}-${particle.id}`} particle={particle} burst={burst} />
                ))}
              </div>

              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Coupon & Discount</h2>
                  <p className="mt-0.5 text-sm text-slate-400">Apply your code to unlock savings</p>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "#c4b5fd", color: "#7c3aed", background: "#faf5ff" }}
                >
                  Active Offer
                </span>
              </div>

              <AnimatePresence>
                {!infoDismissed && (
                  <motion.div
                    className="mb-4 flex items-start gap-3 rounded-2xl px-4 py-3"
                    style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {appliedCoupon ? (
                      <Lock size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    ) : (
                      <Info size={16} className="mt-0.5 flex-shrink-0 text-violet-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {appliedCoupon ? `Code "${appliedCoupon.code}" locked for this payment` : "Enter your coupon code below"}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {appliedCoupon
                          ? "This coupon is now reserved for this invoice and cannot be reused on any other payment."
                          : "Subtotal already reflects the quotation amount received from operations. Wrong attempts will also consume usage."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInfoDismissed(true)}
                      className="mt-0.5 flex-shrink-0 text-slate-300 transition-all hover:text-slate-500"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-4 space-y-2.5">
                {[
                  { label: "Subtotal", value: `${currency} ${formatPrice(subtotal)}` },
                  { label: "Discount Percent", value: deriveDiscountPercentLabel(appliedCoupon) },
                  {
                    label: "Discount",
                    value: appliedCoupon ? `- ${currency} ${formatPrice(discountAmount)}` : "-",
                    green: Boolean(appliedCoupon),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">{row.label}</span>
                    <span className={`text-sm font-medium ${row.green ? "text-emerald-600" : "text-slate-800"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}

                <div className="border-t border-dashed border-slate-200 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Total to pay</span>
                    <span className="text-base font-bold text-slate-900">
                      {currency} {formatPrice(totalToPay)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <AnimatePresence mode="wait">
                  {appliedCoupon ? (
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
                        <span className="text-sm font-bold tracking-wider text-emerald-700">{appliedCoupon.code}</span>
                        <span className="text-xs text-emerald-500">{appliedCoupon.discount}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600">Locked</span>
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
                      <BadgePercent size={15} className="flex-shrink-0 text-slate-300" />
                      <input
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value);
                          setError("");
                        }}
                        onKeyDown={(event) => event.key === "Enter" && handleApply()}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={applyingCode}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
                      >
                        {applyingCode ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                        Apply code
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="mt-1.5 px-1 text-xs text-red-500"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="button"
                onClick={handleProceed}
                disabled={!appliedCoupon || !appliedSummary}
                className="mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%)",
                  boxShadow: "0 6px 20px rgba(139,92,246,0.35)",
                }}
                whileHover={appliedCoupon ? { scale: 1.02, boxShadow: "0 8px 28px rgba(139,92,246,0.48)" } : undefined}
                whileTap={appliedCoupon ? { scale: 0.97 } : undefined}
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
