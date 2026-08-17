import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  DollarSign,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Layers3,
  UploadCloud,
  Receipt,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../utils/Api";

const WELCOME_POPUP_KEY = "dmc_welcome_popup_seen";

const formatHeaderDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const defaultDashboard = {
  dateLabel: formatHeaderDate(),
  summary: {
    pendingQueries: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
    activeBookings: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
    vouchersGenerated: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
    pendingActions: {
      value: 0,
      text: "0% from last week",
      tone: "positive",
    },
  },
  recentActivity: [],
  uploadTrendData: [],
  trends: {
    records: {
      change: 0,
      direction: "flat",
    },
  },
};

const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const popupBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const popupModal = {
  hidden: { opacity: 0, y: -30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const getTrendClass = (tone, invert = false) => {
  if (invert) {
    return tone === "negative" ? "text-green-600" : "text-red-500";
  }

  return tone === "negative" ? "text-red-500" : "text-green-600";
};

function DmcHeaderArtwork() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-[radial-gradient(circle_at_top,_#dcfce7,_#bbf7d0_55%,_#6ee7b7)] shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
      <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
        <defs>
          <linearGradient id="dmc-dashboard-mark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect x="11" y="14" width="26" height="19" rx="6" fill="#f0fdf4" stroke="url(#dmc-dashboard-mark)" strokeWidth="1.6" />
        <path d="M16 22h16M16 27h10" stroke="#34d399" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M18 35l6-5 6 5" fill="none" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        <path d="M24 11v6" stroke="#f59e0b" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="24" cy="9.5" r="2.2" fill="#f59e0b" />
        <circle cx="16" cy="17" r="1.8" fill="#10b981" />
        <circle cx="32" cy="17" r="1.8" fill="#60a5fa" />
      </svg>
      <div className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-white/25 blur-sm" />
    </div>
  );
}

function DmcWelcomePopup({ open, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={popupBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[9500] flex items-start justify-center pt-20 px-4"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              variants={popupModal}
              className="relative w-full max-w-lg bg-white rounded-[22px] border border-gray-100 shadow-[0_25px_60px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#dcfce7_0%,_transparent_50%)] opacity-40" />

              <div className="relative p-6 sm:p-7">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Shield size={20} className="text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-gray-950">Welcome to Your Workspace</h2>
                    <p className="text-xs text-gray-500">Your access configuration as a DMC Partner</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                    DMC Partner
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] font-extrabold text-gray-400 mb-2.5 tracking-wider uppercase">Permissions & Scope</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11.5px] font-medium text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                      <span>Bulk Service Upload</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                      <span>Enter confirmation numbers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                      <span>Update confirmation status</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                      <span>View assigned bookings only</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 mb-4">
                  <span className="font-semibold text-slate-600">Active DMC Operator Workspace</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    System Operational
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-sm font-medium text-white hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                >
                  Skip — Go to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function DMCDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(defaultDashboard);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);


  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const { data } = await API.get("/dmc/dashboard");
        if (isMounted) {
          setDashboard(data?.data || defaultDashboard);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load DMC dashboard",
        );
      }
    };


    loadDashboard();


    return () => {
      isMounted = false;
    };
  }, []);

  

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem(WELCOME_POPUP_KEY);
    if (!hasSeenPopup) {
      setShowWelcomePopup(true);
    }
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowWelcomePopup(false);
    sessionStorage.setItem(WELCOME_POPUP_KEY, "true");
  }, []);

  const summary = dashboard?.summary || defaultDashboard.summary;

  return (
    <>
      <DmcWelcomePopup open={showWelcomePopup} onClose={handleClosePopup} />

      <motion.div
        variants={containerVariant}
        initial="hidden"
        animate="visible"
        className="bg-gray-50 space-y-3.5 p-0"
      >
        {/* Header */}
        <motion.div variants={cardVariant}>
          <div className="flex items-center gap-3">
            <DmcHeaderArtwork />
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">DMC Dashboard</h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {dashboard?.dateLabel || defaultDashboard.dateLabel}
              </p>
            </div>
          </div>
        </motion.div>

        {/*=================================== Stats Cards ============================================== */}
        <motion.div variants={cardVariant} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div 
            style={{ background: "linear-gradient(135deg, rgba(243, 232, 255, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #a855f7" }}
            className="border-0 shadow-xs rounded-[18px] py-3 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">Pending Confirmations</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {summary.pendingQueries?.value ?? 0}
              </h3>
              <p
                className={`text-[11px] mt-1 font-semibold whitespace-nowrap ${getTrendClass(summary.pendingQueries?.tone, true)}`}
              >
                {summary.pendingQueries?.text || "0% from last week"}
              </p>
            </div>

            <div className="bg-purple-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
              <Clock className="text-purple-600 h-5 w-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div 
            style={{ background: "linear-gradient(135deg, rgba(219, 234, 254, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #3b82f6" }}
            className="border-0 shadow-xs rounded-[18px] py-3 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">Assigned Active Bookings</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {summary.activeBookings?.value ?? 0}
              </h3>
              <p className={`text-[11px] mt-1 font-semibold whitespace-nowrap ${getTrendClass(summary.activeBookings?.tone)}`}>
                {summary.activeBookings?.text || "0% from last week"}
              </p>
            </div>

            <div className="bg-blue-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
              <CheckCircle className="text-blue-600 h-5 w-5" />
            </div>
          </div>

          {/* Card 3 */}
          <div 
            style={{ background: "linear-gradient(135deg, rgba(220, 252, 231, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #10b981" }}
            className="border-0 shadow-xs rounded-[18px] py-3 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">Completed Vouchers</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {summary.vouchersGenerated?.value ?? 0}
              </h3>
              <p
                className={`text-[11px] mt-1 font-semibold whitespace-nowrap ${getTrendClass(summary.vouchersGenerated?.tone)}`}
              >
                {summary.vouchersGenerated?.text || "0% from last week"}
              </p>
            </div>

            <div className="bg-green-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
              <FileText className="text-green-600 h-5 w-5" />
            </div>
          </div>

          {/* Card 4 */}
          <div 
            style={{ background: "linear-gradient(135deg, rgba(254, 243, 199, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #f59e0b" }}
            className="border-0 shadow-xs rounded-[18px] py-3 px-4 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">Unfinished Action Items</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {summary.pendingActions?.value ?? 0}
              </h3>
              <p
                className={`text-[11px] mt-1 font-semibold whitespace-nowrap ${getTrendClass(summary.pendingActions?.tone, true)}`}
              >
                {summary.pendingActions?.text || "0% from last week"}
              </p>
            </div>

            <div className="bg-orange-100/80 p-2 rounded-xl flex-shrink-0 ml-3">
              <AlertCircle className="text-orange-600 h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/*================================ Payment Overview + Quick Fulfillment Shortcuts =========================== */}
        <motion.div variants={cardVariant} className="grid grid-cols-1 gap-3 lg:grid-cols-5 items-stretch">
          {/* Left Column: Payment Overview Cards (2x2 Grid) */}
          <div className="flex flex-col gap-1.5 lg:col-span-3">
            <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">
              Payment Overview
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 h-full">
              {/* Total Expected Amount */}
              <div
                style={{ background: "linear-gradient(135deg, rgba(219, 234, 254, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #3b82f6" }}
                className="border-0 shadow-xs rounded-[16px] py-2.5 px-3.5 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 font-medium truncate">Total Expected Amount</p>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5 tracking-tight">
                    ₹{Math.round(Number(dashboard?.financials?.totalExpectedAmount || 0)).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5 whitespace-nowrap">Total value of assigned bookings</p>
                </div>
                <div className="bg-blue-100/80 p-1.5 rounded-xl flex-shrink-0 ml-2">
                  <TrendingUp className="text-blue-600 h-4.5 w-4.5" />
                </div>
              </div>

              {/* Payment Received */}
              <div
                style={{ background: "linear-gradient(135deg, rgba(220, 252, 231, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #10b981" }}
                className="border-0 shadow-xs rounded-[16px] py-2.5 px-3.5 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 font-medium truncate">Payment Received</p>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5 tracking-tight">
                    ₹{Math.round(Number(dashboard?.financials?.paymentReceived || 0)).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[10px] text-green-600 font-semibold mt-0.5 whitespace-nowrap">From completed settlements</p>
                </div>
                <div className="bg-green-100/80 p-1.5 rounded-xl flex-shrink-0 ml-2">
                  <DollarSign className="text-green-600 h-4.5 w-4.5" />
                </div>
              </div>

              {/* Payment Pending */}
              <div
                style={{ background: "linear-gradient(135deg, rgba(254, 243, 199, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #f59e0b" }}
                className="border-0 shadow-xs rounded-[16px] py-2.5 px-3.5 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 font-medium truncate">Payment Pending</p>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5 tracking-tight">
                    ₹{Math.round(Number(dashboard?.financials?.paymentPending || 0)).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[10px] text-orange-600 font-semibold mt-0.5 whitespace-nowrap">Approved, awaiting receipt</p>
                </div>
                <div className="bg-orange-100/80 p-1.5 rounded-xl flex-shrink-0 ml-2">
                  <ArrowDownRight className="text-orange-600 h-4.5 w-4.5" />
                </div>
              </div>

              {/* Remaining Balance */}
              <div
                style={{ background: "linear-gradient(135deg, rgba(254, 226, 226, 0.45) 0%, rgba(255, 255, 255, 0.98) 100%)", borderBottom: "3px solid #ef4444" }}
                className="border-0 shadow-xs rounded-[16px] py-2.5 px-3.5 flex justify-between items-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 font-medium truncate">Remaining Balance</p>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5 tracking-tight">
                    ₹{Math.round(Number(dashboard?.financials?.remainingBalance || 0)).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5 whitespace-nowrap">Outstanding unpaid amount</p>
                </div>
                <div className="bg-red-100/80 p-1.5 rounded-xl flex-shrink-0 ml-2">
                  <Wallet className="text-red-500 h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Fulfillment Shortcuts */}
          <div className="lg:col-span-2 bg-white rounded-[18px] border border-gray-200 shadow-xs p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Layers3 size={15} />
                  </div>
                  <h3 className="font-bold text-xs text-gray-900">Quick Fulfillment Shortcuts</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Direct Navigation</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Shortcut 1 */}
                <button
                  type="button"
                  onClick={() => navigate("/dmc/confirmation")}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 rounded-md bg-blue-100/80 text-blue-700">
                      <CheckCircle size={13} />
                    </span>
                    <div>
                      <h4 className="font-bold text-[11px] text-slate-800 group-hover:text-blue-700">Booking Confirmations</h4>
                      <p className="text-[9.5px] text-slate-500">View & lock service CNF</p>
                    </div>
                  </div>
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>

                {/* Shortcut 2 */}
                <button
                  type="button"
                  onClick={() => navigate("/dmc/contractedRates")}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50/60 hover:border-purple-200 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 rounded-md bg-purple-100/80 text-purple-700">
                      <UploadCloud size={13} />
                    </span>
                    <div>
                      <h4 className="font-bold text-[11px] text-slate-800 group-hover:text-purple-700">Bulk Service Upload</h4>
                      <p className="text-[9.5px] text-slate-500">Upload CNF via Excel / Batch</p>
                    </div>
                  </div>
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                </button>

                {/* Shortcut 3 */}
                <button
                  type="button"
                  onClick={() => navigate("/dmc/settlement")}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 rounded-md bg-emerald-100/80 text-emerald-700">
                      <Receipt size={13} />
                    </span>
                    <div>
                      <h4 className="font-bold text-[11px] text-slate-800 group-hover:text-emerald-700">Bulk Settlement</h4>
                      <p className="text-[9.5px] text-slate-500">Track Finance payout status</p>
                    </div>
                  </div>
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-400">
              <span>Quick access to core workflows</span>
              <span className="font-bold text-blue-600">Holiday Circuit B2B</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
