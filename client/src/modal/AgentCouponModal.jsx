import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  Mail,
  RefreshCw,
  Sparkles,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../utils/Api.js";

const statusConfig = {
  active: {
    label: "Active",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconWrap: "bg-emerald-500",
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_34%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_60%,#f0fdf4_100%)]",
  },
  scheduled: {
    label: "Scheduled",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    iconWrap: "bg-amber-500",
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34%),linear-gradient(135deg,#fffbeb_0%,#ffffff_60%,#fff7ed_100%)]",
  },
  expired: {
    label: "Expired",
    pill: "border-rose-200 bg-rose-50 text-rose-700",
    iconWrap: "bg-rose-500",
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_34%),linear-gradient(135deg,#fff1f2_0%,#ffffff_60%,#fff7f7_100%)]",
  },
  used: {
    label: "Used",
    pill: "border-slate-200 bg-slate-100 text-slate-700",
    iconWrap: "bg-slate-500",
    surface:
      "bg-[radial-gradient(circle_at_top_left,rgba(100,116,139,0.16),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#ffffff_60%,#f1f5f9_100%)]",
  },
};

const modeConfig = {
  dashboard: {
    heading: "Coupon Inbox",
    subheading: "All coupons shared to your account are available here.",
    primaryLabel: "Open Active Bookings",
  },
  payment: {
    heading: "Available Coupons",
    subheading: "Review the live coupon details before you continue with payment submission.",
    primaryLabel: "Copy Coupon Code",
  },
};

const formatDate = (value, fallback = "Not set") => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getUsageLabel = (coupon) => {
  if (!coupon?.usageLimit) return "Unlimited usage";
  return `${coupon.usageCount || 0} of ${coupon.usageLimit} used`;
};

const getRemainingLabel = (coupon) => {
  if (coupon?.isRedeemed) return "Already used";
  if (coupon?.remainingUses == null) return "No limit";
  if (coupon.remainingUses <= 0) return "Usage exhausted";
  return `${coupon.remainingUses} use${coupon.remainingUses === 1 ? "" : "s"} left`;
};

const getCouponMessage = (coupon) => {
  if (!coupon) return "";
  if (coupon.isRedeemed) {
    return `This coupon was already locked on ${coupon.redeemedAt || "an earlier date"}${coupon.redeemedInvoiceNumber ? ` for ${coupon.redeemedInvoiceNumber}` : ""}.`;
  }
  if (coupon.isUsageExhausted) {
    return "This coupon exhausted all allowed attempts and can no longer be used.";
  }
  if (coupon.isExpired) {
    return `This coupon expired on ${coupon.endDate || formatDate(coupon.endDateValue, "the configured end date")}.`;
  }
  if (coupon.isScheduled) {
    return `This coupon will become active from ${coupon.startDate || formatDate(coupon.startDateValue, "the configured start date")}.`;
  }
  if (coupon.remainingUses === 0) {
    return "This coupon has reached its usage limit. Contact admin if you need a fresh issue.";
  }
  return "This coupon is active on your account and ready to use during payment follow-up.";
};

const getCouponSortTime = (coupon) => {
  const value = coupon?.lastSentAtValue || coupon?.createdAt || "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const isFrequentlyUsedCoupon = (coupon) => Number(coupon?.usageCount || 0) > 3;

const buildCouponSignals = (coupon, latestCouponId) => {
  if (!coupon) return [];

  const signals = [];

  if (coupon.id === latestCouponId) {
    signals.push({
      key: "latest",
      label: "Latest",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    });
  }

  if (coupon.isExpired) {
    signals.push({
      key: "expired",
      label: "Expired",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    });
  }

  if (isFrequentlyUsedCoupon(coupon)) {
    signals.push({
      key: "used-3-plus",
      label: "Used 3+ times",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    });
  }

  return signals;
};

export default function AgentCouponModal({ open = false, onClose, mode = "dashboard" }) {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const config = modeConfig[mode] || modeConfig.dashboard;

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/agent/coupons");
      const nextCoupons = data?.data?.coupons || [];
      setCoupons(nextCoupons);
      setSelectedId((current) => {
        if (current && nextCoupons.some((coupon) => coupon.id === current)) return current;
        return nextCoupons[0]?.id || "";
      });
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Unable to load coupons right now.");
      setCoupons([]);
      setSelectedId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchCoupons();
  }, [open]);

  useEffect(() => {
    if (!copiedId) return undefined;
    const timer = window.setTimeout(() => setCopiedId(""), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => coupon.id === selectedId) || coupons[0] || null,
    [coupons, selectedId],
  );

  const latestCouponId = useMemo(() => {
    if (!coupons.length) return "";
    return [...coupons]
      .sort((left, right) => getCouponSortTime(right) - getCouponSortTime(left))[0]?.id || "";
  }, [coupons]);

  const selectedStatus = statusConfig[selectedCoupon?.status] || statusConfig.active;
  const selectedSignals = useMemo(
    () => buildCouponSignals(selectedCoupon, latestCouponId),
    [latestCouponId, selectedCoupon],
  );

  const handleCopy = async (coupon) => {
    if (!coupon?.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
    } catch (copyError) {
      console.error("Failed to copy coupon code", copyError);
    }
  };

  const handlePrimaryAction = async () => {
    if (!selectedCoupon) return;

    if (mode === "payment") {
      await handleCopy(selectedCoupon);
      return;
    }

    onClose?.();
    navigate("/agent/bookings");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.48)", backdropFilter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_55%,#f8fafc_100%)] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">{config.heading}</h2>
                    <p className="mt-1 text-sm text-slate-500">{config.subheading}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Close coupon modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="finance-transparent-scrollbar max-h-[calc(100vh-8rem)] overflow-y-auto">
              {loading ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Loading coupon inbox</p>
                    <p className="mt-1 text-sm text-slate-500">We are pulling the latest coupons shared to your account.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <TicketPercent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Unable to load coupons</p>
                    <p className="mt-1 max-w-md text-sm text-slate-500">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCoupons}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </div>
              ) : coupons.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">No coupons have been shared yet</p>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                      Once admin sends a coupon to your registered email account, it will appear here with full validity and usage details.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <aside className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Shared Coupons</p>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                          {coupons.length}
                        </span>
                      </div>
                    </div>
                    <div className="finance-transparent-scrollbar max-h-[420px] overflow-y-auto p-3">
                      <div className="space-y-3">
                        {coupons.map((coupon) => {
                          const isSelected = selectedCoupon?.id === coupon.id;
                          const couponStatus = statusConfig[coupon.status] || statusConfig.active;
                          const couponSignals = buildCouponSignals(coupon, latestCouponId);

                          return (
                            <button
                              key={coupon.id}
                              type="button"
                              onClick={() => setSelectedId(coupon.id)}
                              className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                                isSelected
                                  ? "border-slate-900 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                                  : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-[15px] font-bold text-slate-900">{coupon.code}</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-700">{coupon.discount}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${couponStatus.pill}`}>
                                  {couponStatus.label}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                {coupon.description || "Coupon details are ready for this offer."}
                              </p>
                              {couponSignals.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {couponSignals.map((signal) => (
                                    <span
                                      key={`${coupon.id}-${signal.key}`}
                                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${signal.className}`}
                                    >
                                      {signal.label}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                <span>
                                  {isFrequentlyUsedCoupon(coupon)
                                    ? `${coupon.usageCount || 0} times used`
                                    : getRemainingLabel(coupon)}
                                </span>
                                <span>{coupon.lastSentAt ? `Shared ${coupon.lastSentAt}` : `Created ${formatDate(coupon.createdAt)}`}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </aside>

                  <section className="p-5 sm:p-6">
                    {selectedCoupon ? (
                      <div className="space-y-5">
                        <div className={`overflow-hidden rounded-[28px] border border-slate-200 p-5 sm:p-6 ${selectedStatus.surface}`}>
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${selectedStatus.iconWrap}`}>
                                <BadgePercent className="h-7 w-7" />
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-[28px] font-bold tracking-[-0.04em] text-slate-900">{selectedCoupon.discount}</h3>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${selectedStatus.pill}`}>
                                  {selectedStatus.label}
                                </span>
                                {selectedSignals.map((signal) => (
                                  <span
                                    key={`selected-${signal.key}`}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${signal.className}`}
                                  >
                                    {signal.label}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                                {selectedCoupon.description || "This coupon has been shared to your account for your next payment cycle."}
                              </p>
                            </div>

                            <div className="w-full max-w-sm rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Coupon Code</p>
                              <div className="mt-3 flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <span className="truncate text-lg font-bold tracking-[0.16em] text-slate-900">{selectedCoupon.code}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedCoupon)}
                                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                                    copiedId === selectedCoupon.id
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title="Copy coupon code"
                                >
                                  {copiedId === selectedCoupon.id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                              <p className="mt-3 text-xs leading-5 text-slate-500">
                                {copiedId === selectedCoupon.id
                                  ? "Coupon code copied successfully."
                                  : "Copy this code and keep it ready while submitting the booking payment."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <CalendarDays className="h-4 w-4" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Valid From</p>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{selectedCoupon.startDate || "Immediate"}</p>
                          </div>

                          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock3 className="h-4 w-4" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Valid Till</p>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{selectedCoupon.endDate || "No expiry"}</p>
                          </div>

                          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Users className="h-4 w-4" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Usage Policy</p>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{selectedCoupon.users || "Unlimited"}</p>
                            <p className="mt-1 text-xs text-slate-500">{getUsageLabel(selectedCoupon)}</p>
                          </div>

                          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Sparkles className="h-4 w-4" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Remaining Uses</p>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{getRemainingLabel(selectedCoupon)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {Number(selectedCoupon.usageCount || 0)} time{Number(selectedCoupon.usageCount || 0) === 1 ? "" : "s"} used so far
                            </p>
                          </div>

                          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Mail className="h-4 w-4" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Assigned Email</p>
                            </div>
                            <p className="mt-3 break-all text-sm font-semibold text-slate-900">{selectedCoupon.email || "Registered account email"}</p>
                          </div>

                          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <TicketPercent className="h-4 w-4" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Shared On</p>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{selectedCoupon.lastSentAt || formatDate(selectedCoupon.createdAt)}</p>
                            <p className="mt-1 text-xs text-slate-500">Sent {selectedCoupon.sentCount || 1} time{selectedCoupon.sentCount === 1 ? "" : "s"} by admin</p>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Inbox Signals</p>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Latest Status</p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedCoupon.id === latestCouponId ? "This is your latest coupon" : "Older shared coupon"}
                              </p>
                            </div>
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Expiry Status</p>
                              <p className={`mt-2 text-sm font-semibold ${selectedCoupon.isExpired ? "text-rose-600" : "text-slate-900"}`}>
                                {selectedCoupon.isExpired ? `Expired on ${selectedCoupon.endDate || "configured end date"}` : "Not expired"}
                              </p>
                            </div>
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Usage Alert</p>
                              <p className={`mt-2 text-sm font-semibold ${isFrequentlyUsedCoupon(selectedCoupon) ? "text-amber-700" : "text-slate-900"}`}>
                                {isFrequentlyUsedCoupon(selectedCoupon)
                                  ? `Used ${selectedCoupon.usageCount || 0} times`
                                  : `Used ${selectedCoupon.usageCount || 0} times`}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {isFrequentlyUsedCoupon(selectedCoupon)
                                  ? "This coupon has already been used more than 3 times."
                                  : "This coupon has not crossed the 3-use alert threshold."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Coupon Guidance</p>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{getCouponMessage(selectedCoupon)}</p>
                          <div className="mt-4 grid gap-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Coupon is mapped to your registered agent account.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Review the validity window before using it on a booking payment.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Usage limits are tracked centrally, so the latest availability is shown here.</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs w-100 text-slate-500">
                            {mode === "payment"
                              ? "You can copy the coupon code from here and keep it handy while you continue the booking payment process."
                              : "Ready to use this coupon on a booking? Head to Active Bookings and open the relevant payment card."}
                          </p>
                          <button
                            type="button"
                            onClick={handlePrimaryAction}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
                          >
                            {mode === "payment" ? <Copy className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                            {config.primaryLabel}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
