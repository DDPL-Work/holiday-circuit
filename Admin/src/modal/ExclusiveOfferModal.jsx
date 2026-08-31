import { useEffect, useMemo, useState } from "react";
import { Copy, Check, BadgePercent, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../utils/Api.js";
import AgentCouponModal from "./AgentCouponModal.jsx";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.cos((i / 18) * Math.PI * 2) * (55 + Math.random() * 30),
  y: Math.sin((i / 18) * Math.PI * 2) * (55 + Math.random() * 30),
  color: ["#2563eb", "#1d4ed8", "#16a34a", "#0284c7", "#059669", "#3b82f6", "#0ea5e9"][i % 7],
  size: 5 + Math.random() * 5,
  rotate: Math.random() * 360,
  shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "rect" : "star",
}));

function Particle({ particle, burst }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        width: particle.size,
        height: particle.shape === "rect" ? particle.size * 0.5 : particle.size,
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
          ? { x: particle.x, y: particle.y, opacity: [1, 1, 0], scale: [0, 1.2, 0.8], rotate: particle.rotate }
          : {}
      }
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
    />
  );
}

const formatDate = (value, fallback = "anytime") => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const pickFeaturedCoupon = (coupons = []) =>
  coupons.find((c) => c?.isActive) ||
  coupons.find((c) => !c?.isExpired) ||
  coupons[0] ||
  null;

export default function ExclusiveOfferModal({ open = false, onClose }) {
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCouponInbox, setShowCouponInbox] = useState(false);

  useEffect(() => {
    if (!open) {
      setBurst(false);
      setShowCouponInbox(false);
      return;
    }
    const timer = window.setTimeout(() => setBurst(true), 100);
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/agent/coupons");
        setCoupons(data?.data?.coupons || []);
      } catch (fetchError) {
        setCoupons([]);
        setError(fetchError?.response?.data?.message || "Unable to load your latest offer right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
    return () => window.clearTimeout(timer);
  }, [open]);

  const featuredCoupon = useMemo(() => pickFeaturedCoupon(coupons), [coupons]);
  const offerTitle = featuredCoupon?.isExpired ? "Offer expired" : "Unlock exclusive offer";
  const offerBadge = featuredCoupon?.discount || "Offer";
  const primaryDisabled = !featuredCoupon?.code || featuredCoupon?.isExpired;

  const validityItems = [
    featuredCoupon?.startDate
      ? `Valid from ${featuredCoupon.startDate}`
      : "Valid immediately on your account",
    featuredCoupon?.endDate && featuredCoupon.endDate !== "Never"
      ? `Use before ${featuredCoupon.endDate}`
      : "No expiry date configured",
    featuredCoupon?.usageLimit
      ? `${featuredCoupon.remainingUses ?? 0} use${featuredCoupon.remainingUses === 1 ? "" : "s"} left`
      : "Unlimited usage available",
  ];

  const handleCopy = async () => {
    if (!featuredCoupon?.code) return;
    try {
      await navigator.clipboard.writeText(featuredCoupon.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handlePrimaryAction = async () => {
    if (primaryDisabled) return;
    try {
      await navigator.clipboard.writeText(featuredCoupon.code);
      setCopied(true);
    } catch (e) {
      console.error("Failed to copy", e);
    }
    setShowCouponInbox(true);
  };

  return (
    <>
      <AnimatePresence>
        {open && !showCouponInbox && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.50)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          >
            <motion.div
              className="relative w-full max-w-[390px] overflow-visible"
              initial={{ opacity: 0, scaleY: 0.05, scaleX: 0.7, y: -40 }}
              animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30, rotate: -3 }}
              transition={{
                opacity: { duration: 0.18 },
                scaleY: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
                scaleX: { duration: 0.35, ease: [0.34, 1.4, 0.64, 1] },
                y: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confetti */}
              <div className="absolute" style={{ top: 50, left: "50%", zIndex: 60 }}>
                {PARTICLES.map((p) => (
                  <Particle key={p.id} particle={p} burst={burst} />
                ))}
              </div>

              <div
                className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 border-t-4 border-t-[#3252C3] shadow-2xl shadow-blue-950/15"
              >
                {/* Header banner zone */}
                <div
                  className="absolute inset-x-0 top-0 rounded-t-2xl border-b border-blue-100/70"
                  style={{
                    height: "100px",
                    background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 45%, #e0f2fe 100%)",
                  }}
                />

                {/* Close Button */}
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3.5 right-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 transition-all bg-white/90 border border-slate-200/90 shadow-xs"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.55, duration: 0.25 }}
                >
                  <X size={13} />
                </motion.button>

                <div className="relative px-5 pt-5 pb-5">

                  {/* Icon — 40×40px */}
                  <motion.div
                    className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl shadow-md shadow-emerald-600/20"
                    style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.7, 0.64, 1] }}
                  >
                    <BadgePercent size={20} className="text-white" strokeWidth={2} />
                  </motion.div>

                  {/* Title + badge */}
                  <motion.div
                    className="mb-4 flex items-center gap-2"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.42, duration: 0.3, ease: "easeOut" }}
                  >
                    <h2 className="text-[17px] font-bold text-slate-900">{offerTitle}</h2>
                    <span
                      className="rounded-md px-2.5 py-0.5 text-[12px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80"
                    >
                      {offerBadge}
                    </span>
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    className="mb-3.5 rounded-xl px-3.5 py-2.5 bg-blue-50/70 border border-blue-100/80"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.28, ease: "easeOut" }}
                  >
                    {loading ? (
                      <p className="text-[12px] leading-5 text-slate-400">Loading your latest shared coupon...</p>
                    ) : (
                      <p className="text-[12px] leading-[1.55] text-slate-600">
                        🎁{" "}
                        <span className="font-semibold text-blue-700">Exclusive for you</span>
                        {" — "}
                        {featuredCoupon?.description
                          ? featuredCoupon.description
                          : "This coupon was personally shared with your agent account as a special reward. Apply it during payment to save instantly."}
                      </p>
                    )}
                  </motion.div>

                  {/* Code row */}
                  <motion.div
                    className="mb-3.5 flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-slate-50 border border-slate-200/90"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.56, duration: 0.28, ease: "easeOut" }}
                  >
                    <p className="text-[13.5px] text-slate-500">
                      Code:{" "}
                      <span className="font-bold text-slate-900 tracking-wider font-mono text-[14.5px]">
                        {featuredCoupon?.code ? featuredCoupon.code : loading ? "Loading..." : "—"}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!featuredCoupon?.code}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        background: copied ? "#dcfce7" : "#ffffff",
                        border: `1px solid ${copied ? "#bbf7d0" : "#e2e8f0"}`,
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
                            <Check size={13} className="text-emerald-600" />
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                            <Copy size={13} className="text-slate-400" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>

                  {/* Validity */}
                  <div className="mb-4.5 flex flex-col gap-2">
                    {validityItems.map((item, index) => (
                      <motion.div
                        key={`${item}-${index}`}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.62 + index * 0.08, duration: 0.25, ease: "easeOut" }}
                      >
                        <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white shadow-xs">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[13px] text-slate-700 font-medium">{item}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <motion.button
                    type="button"
                    onClick={handlePrimaryAction}
                    disabled={primaryDisabled}
                    className="w-full rounded-xl py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      boxShadow: "0 4px 14px rgba(37,99,235,0.30)",
                    }}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.72, duration: 0.32, ease: [0.34, 1.3, 0.64, 1] }}
                    whileHover={primaryDisabled ? undefined : { scale: 1.015, boxShadow: "0 6px 20px rgba(37,99,235,0.42)" }}
                    whileTap={primaryDisabled ? undefined : { scale: 0.98 }}
                  >
                    {primaryDisabled ? "Offer Not Available" : "All Coupon Inbox"}
                  </motion.button>

                  {/* Footer notes */}
                  {!primaryDisabled && featuredCoupon && (
                    <p className="mt-2 text-center text-[11px] leading-5 text-slate-400">
                      Clicking this button opens your full coupon inbox and copies coupon code `{featuredCoupon.code}`.
                    </p>
                  )}
                  {!loading && !featuredCoupon && (
                    <p className="mt-2 text-center text-[11px] leading-5 text-rose-500">
                      No active coupon is available on your account right now.
                    </p>
                  )}
                  {featuredCoupon?.isExpired && (
                    <p className="mt-2 text-center text-[11px] leading-5 text-amber-600">
                      This shared coupon expired on {formatDate(featuredCoupon.endDateValue, featuredCoupon.endDate)}.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AgentCouponModal
        open={open && showCouponInbox}
        onClose={() => {
          setShowCouponInbox(false);
          onClose?.();
        }}
        mode="dashboard"
      />
    </>
  );
}