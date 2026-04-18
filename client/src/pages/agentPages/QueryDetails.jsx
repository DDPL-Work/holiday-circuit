import {
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Clock3,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  BadgeCheck,
  Mail,
  Send,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const formatMoney = (value) =>
  `INR ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

const formatDisplayDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatUsageLabel = (value = "") =>
  String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatServiceTypeLabel = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getServiceDescriptionBits = (description = "") =>
  String(description || "")
    .split(/[|,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const ActionPillButton = ({
  label,
  hint,
  icon,
  onClick,
  disabled = false,
  tone = "slate",
}) => {
  const tones = {
    sky: {
      shell: "border-sky-200 bg-[linear-gradient(135deg,#38bdf8_0%,#2563eb_100%)] text-white shadow-[0_16px_30px_rgba(37,99,235,0.18)] hover:shadow-[0_20px_36px_rgba(37,99,235,0.24)]",
      iconWrap: "bg-white text-sky-600",
      hint: "text-white/75",
    },
    rose: {
      shell: "border-rose-200 bg-[linear-gradient(135deg,#fb7185_0%,#ef4444_100%)] text-white shadow-[0_16px_30px_rgba(239,68,68,0.18)] hover:shadow-[0_20px_36px_rgba(239,68,68,0.24)]",
      iconWrap: "bg-white text-rose-500",
      hint: "text-white/75",
    },
    emerald: {
      shell: "border-emerald-200 bg-[linear-gradient(135deg,#34d399_0%,#059669_100%)] text-white shadow-[0_16px_30px_rgba(5,150,105,0.18)] hover:shadow-[0_20px_36px_rgba(5,150,105,0.24)]",
      iconWrap: "bg-white text-emerald-600",
      hint: "text-white/75",
    },
    slate: {
      shell: "border-slate-200 bg-slate-100 text-slate-500",
      iconWrap: "bg-white text-slate-400",
      hint: "text-slate-400",
    },
  };

  const style = tones[tone] || tones.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex w-full items-center overflow-hidden rounded-full border transition duration-200 ${
        disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"
      } ${style.shell}`}
    >
      <span className={`m-1 flex h-12 w-14 flex-shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 px-3 py-3 text-left">
        <span className="block text-[15px] font-semibold tracking-[0.24em] uppercase leading-none">
          {label}
        </span>
        {hint ? (
          <span className={`mt-1 block text-[10px] font-medium ${style.hint}`}>
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
};

const QueryDetails = ({ query, onClose, onRefresh }) => {
  const [quotes, setQuotes] = useState([]);
  const [markupType, setMarkupType] = useState("PERCENT");
  const [markupValue, setMarkupValue] = useState("");
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionQuoteId, setRevisionQuoteId] = useState(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [sendSubmittingId, setSendSubmittingId] = useState(null);
  const [sendSuccessMeta, setSendSuccessMeta] = useState(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendQuoteId, setSendQuoteId] = useState(null);
  const [sendRecipientEmail, setSendRecipientEmail] = useState("");

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await API.get(`/agent/quotations/query/${query._id}`);
        setQuotes(res.data.quotations || []);
      } catch (err) {
        console.error("Error fetching quotations:", err);
      }
    };
    fetchQuotations();
  }, [query._id]);

  const updateQuote = (updatedQuote) => {
    setQuotes((prev) =>
      prev.map((q) => (q._id === updatedQuote._id ? updatedQuote : q)),
    );
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      const res = await API.patch(`/agent/quotations/${quoteId}/accept`, {
        action: "ACCEPT",
      });
      toast.success("Quote accepted");
      updateQuote(res.data.quotation);
      setActiveQuoteId(quoteId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  const handleApplyMarkup = async (id) => {
    try {
      const res = await API.patch(`/agent/quotations/${id}/accept`, {
        action: "APPLY_MARKUP",
        markupType,
        markupValue: Number(markupValue),
      });
      toast.success("Markup applied");
      updateQuote(res.data.quotation);
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  const handleOpenSendModal = (quote) => {
    setSendQuoteId(quote?._id || null);
    setSendRecipientEmail(String(query?.clientEmail || "").trim());
    setIsSendModalOpen(true);
  };

  const handleCloseSendModal = () => {
    setIsSendModalOpen(false);
    setSendQuoteId(null);
    setSendRecipientEmail("");
  };

  const handleSendToClient = async (quote, recipientEmail) => {
    const normalizedRecipientEmail = String(recipientEmail || "").trim().toLowerCase();

    if (!normalizedRecipientEmail) {
      toast.error("Please enter client email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipientEmail)) {
      toast.error("Please enter a valid client email");
      return;
    }

    try {
      setSendSubmittingId(quote._id);
      const res = await API.patch(`/agent/quotations/${quote._id}/accept`, {
        action: "SEND_TO_CLIENT",
        recipientEmail: normalizedRecipientEmail,
      });
      updateQuote(res.data.quotation);
      setSendSuccessMeta({
        recipientEmail: res.data?.recipientEmail || "",
        quotationNumber: res.data?.summary?.quotationNumber || quote?.quotationNumber || "",
        destination: res.data?.summary?.destination || query.destination,
        totalAmount:
          res.data?.summary?.totalAmount ??
          quote?.clientTotalAmount ??
          quote?.pricing?.totalAmount ??
          0,
        serviceCount: res.data?.summary?.serviceCount ?? quote?.services?.length ?? 0,
        validTill:
          res.data?.summary?.validTill ||
          (quote?.validTill
            ? new Date(quote.validTill).toLocaleDateString("en-IN")
            : "-"),
      });
      handleCloseSendModal();
      await onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send quotation email");
    } finally {
      setSendSubmittingId(null);
    }
  };

  const handleClientApproved = async (id) => {
    try {
      const res = await API.put(`/agent/quotations/${id}/confirm`);
      toast.success("Client approval sent to operations");
      updateQuote(res.data.quotation);
      await onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update client approval");
    }
  };

  const openRevisionModal = (quoteId) => {
    setRevisionQuoteId(quoteId);
    setRevisionReason("");
    setIsRevisionModalOpen(true);
  };

  const handleRequestRevision = async () => {
    if (!revisionQuoteId) return;

    const trimmedReason = revisionReason.trim();
    if (!trimmedReason) {
      toast.error("Please add the revision reason for operations.");
      return;
    }

    try {
      setRevisionSubmitting(true);
      const res = await API.put(`/agent/quotations/${revisionQuoteId}/revision`, {
        reason: trimmedReason,
      });
      toast.success("Revision request sent to operations");
      if (res.data?.quotation) {
        updateQuote(res.data.quotation);
      }
      setIsRevisionModalOpen(false);
      setRevisionReason("");
      await onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to request revision");
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const handleClose = () => onClose();

  const latestQuote =
    quotes.find((quote) =>
      ["Confirmed", "Sent to Client", "Markup Applied", "Quote Accepted", "Quote Sent"].includes(
        quote?.status,
      ),
    ) || quotes[0] || null;

  const bookingConfirmedAt =
    query.activityLog
      ?.slice()
      .reverse()
      .find((log) => log?.action === "Booking Confirmed")?.timestamp || null;

  const getDisplayAction = (action) => {
    if (action === "Query Received") return "Query Created";
    return action;
  };

  const getActivityTheme = (action) => {
    const normalizedAction = getDisplayAction(action);

    const activityThemes = {
      "Query Created": {
        dot: "bg-cyan-500",
        line: "bg-cyan-100",
        surface: "border-cyan-200 bg-cyan-50/70",
        badge: "bg-cyan-100 text-cyan-700",
        Icon: Sparkles,
      },
      "Query Accepted": {
        dot: "bg-amber-500",
        line: "bg-amber-100",
        surface: "border-amber-200 bg-amber-50/80",
        badge: "bg-amber-100 text-amber-700",
        Icon: BadgeCheck,
      },
      "Query Rejected": {
        dot: "bg-rose-500",
        line: "bg-rose-100",
        surface: "border-rose-200 bg-rose-50/80",
        badge: "bg-rose-100 text-rose-700",
        Icon: ShieldAlert,
      },
      "Revision Requested": {
        dot: "bg-orange-500",
        line: "bg-orange-100",
        surface: "border-orange-200 bg-orange-50/80",
        badge: "bg-orange-100 text-orange-700",
        Icon: ShieldAlert,
      },
      "Quote Sent": {
        dot: "bg-blue-600",
        line: "bg-blue-100",
        surface: "border-blue-200 bg-blue-50/80",
        badge: "bg-blue-100 text-blue-700",
        Icon: FileCheck2,
      },
      "Client Approved": {
        dot: "bg-indigo-600",
        line: "bg-indigo-100",
        surface: "border-indigo-200 bg-indigo-50/80",
        badge: "bg-indigo-100 text-indigo-700",
        Icon: CheckCircle2,
      },
      "Booking Confirmed": {
        dot: "bg-emerald-600",
        line: "bg-emerald-100",
        surface: "border-emerald-200 bg-emerald-50/80",
        badge: "bg-emerald-100 text-emerald-700",
        Icon: CheckCircle2,
      },
      "Invoice Generated": {
        dot: "bg-violet-600",
        line: "bg-violet-100",
        surface: "border-violet-200 bg-violet-50/80",
        badge: "bg-violet-100 text-violet-700",
        Icon: CreditCard,
      },
      "Traveler Documents Submitted": {
        dot: "bg-fuchsia-600",
        line: "bg-fuchsia-100",
        surface: "border-fuchsia-200 bg-fuchsia-50/80",
        badge: "bg-fuchsia-100 text-fuchsia-700",
        Icon: FileCheck2,
      },
      "Traveler Documents Verified": {
        dot: "bg-teal-600",
        line: "bg-teal-100",
        surface: "border-teal-200 bg-teal-50/80",
        badge: "bg-teal-100 text-teal-700",
        Icon: CheckCircle2,
      },
      "Payment Submitted": {
        dot: "bg-sky-600",
        line: "bg-sky-100",
        surface: "border-sky-200 bg-sky-50/80",
        badge: "bg-sky-100 text-sky-700",
        Icon: CreditCard,
      },
      "Payment Verified": {
        dot: "bg-lime-600",
        line: "bg-lime-100",
        surface: "border-lime-200 bg-lime-50/80",
        badge: "bg-lime-100 text-lime-700",
        Icon: BadgeCheck,
      },
    };

    return (
      activityThemes[normalizedAction] || {
        dot: "bg-slate-400",
        line: "bg-slate-100",
        surface: "border-slate-200 bg-slate-50",
        badge: "bg-slate-100 text-slate-700",
        Icon: Clock3,
      }
    );
  };

  return (
    <motion.div
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="p-"
    >
      {/* Header */}
      <motion.div
        variants={itemVariant}
        className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-2 sm:items-center">
          <button
            onClick={handleClose}
            className="rounded-xl px-3 py-2 hover:bg-gray-100 cursor-pointer "
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.8] text-black" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold break-words sm:text-xl">{query.destination}</h2>
            <p className="text-xs leading-5 text-gray-500">
              ID: {query.queryId} • Created on{" "}
              {new Date(query.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/*========================================= Status ============================== */}

        {query.agentStatus === "Quote Sent" && (
          <span className="w-fit bg-green-100 text-green-700 px-3 py-2 rounded-full text-xs">
            Quote Sent
          </span>
        )}
        {query.agentStatus === "Client Approved" && (
          <span className="w-fit bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">
            Client Approved
          </span>
        )}
        {query.agentStatus === "Pending" && (
          <span className="w-fit bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
            Pending
          </span>
        )}
        {query.agentStatus === "Revision Requested" && (
          <span className="w-fit bg-red-400 text-white px-3 py-1 rounded-full text-xs">
            Revision Requested
          </span>
        )}
        {query.agentStatus === "Confirmed" && (
          <span className="w-fit bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
            Booking Confirmed
          </span>
        )}

      </motion.div>

      <div className="grid gap-4 p-2 sm:p-4 xl:grid-cols-3">
        {/* LEFT MAIN SECTION */}
        <div className="space-y-4 xl:col-span-2">
          {/* QUOTE SENT UI */}
          {["Quote Sent", "Client Approved"].includes(query.agentStatus) &&
            quotes.length > 0 &&
            quotes.map((quote, index) => (
              <motion.div
                key={quote._id}
                variants={itemVariant}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl p-4 bg-[#F6F9FD] shadow-sm border border-[#BEDBFF]"
              >
                {quote.status === "Confirmed" || query.agentStatus === "Client Approved" ? (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
                    <p className="text-sm font-medium text-indigo-700">
                      Client approval has been shared with operations
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Finance team will share the final invoice with you after the internal finance handoff is completed.
                    </p>
                  </div>
               ) : quote.status === "Sent to Client" ? (
  <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white">
    {/* Green accent top bar */}
    <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />

    <div className="p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-emerald-300 bg-emerald-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900 leading-tight">
              Quotation sent to client
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Awaiting their confirmation</p>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
          Quote Sent
        </span>
      </div>

      {/* Status row */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs text-gray-500">Pending client response</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-800">Waiting</span>
        </div>
      </div>

      {/* Info hint */}
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 mb-5">
        <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <p className="text-xs leading-[1.6] text-emerald-900">
          You'll be notified here as soon as the client confirms or sends feedback.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => openRevisionModal(quote._id)}
          className="flex-1 rounded-full border border-gray-200 bg-white px-6 py-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          Request Revision
        </button>
        <button
          onClick={() => handleClientApproved(quote._id)}
          className="flex-1 rounded-full bg-indigo-600 px-6 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          Client Approved
        </button>
      </div>
    </div>
  </div>
                ) : (
                  <>
                    {/* PRICE */}
                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-lg">
                        Quotation Received
                      </h3>
                      <span className="text-blue-600 font-bold text-lg">
                       ₹{(quote.clientTotalAmount ?? quote.pricing?.totalAmount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Valid until{" "}
                      {quote.validTill
                        ? new Date(quote.validTill).toLocaleDateString()
                        : "-"}
                    </p>

  {/* ==============================  Inclusions Card Section  ========================================*/}

 <div className="border border-[#BEDBFF] rounded-xl p-3 bg-white mb-4">
  <div className="flex items-center gap-2 mb-3">
    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    </div>
    <h4 className="font-semibold text-sm text-gray-900">Inclusions</h4>
    {(quote.services?.length > 0 || quote.inclusions?.length > 0) && (
      <span className="ml-auto bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
        {quote.services?.length || quote.inclusions?.length} items
      </span>
    )}
  </div>

  <ul className="space-y-2">
    {quote.inclusions?.length > 0 ? (
      quote.inclusions.map((item, idx) => (
        <li key={idx} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
          {item}
        </li>
      ))
    ) : quote.services?.length > 0 ? (
      quote.services.map((service, idx) => {
        const descriptionBits = getServiceDescriptionBits(service.description);
        const serviceDateLabel = formatDisplayDate(service.serviceDate);
        const typeLabel = formatServiceTypeLabel(service.type);
        const serviceTheme =
          service.type === "hotel"
            ? {
                borderColor: "#3b82f6",
                iconBg: "bg-blue-100",
                iconStroke: "#2563eb",
                badgeClass: "bg-blue-100 text-blue-700",
                metaClass: "bg-blue-50 text-blue-700 border border-blue-200",
              }
            : service.type === "transfer"
              ? {
                  borderColor: "#10b981",
                  iconBg: "bg-green-100",
                  iconStroke: "#15803d",
                  badgeClass: "bg-green-100 text-green-800",
                  metaClass: "bg-green-50 text-green-700 border border-green-200",
                }
              : service.type === "activity"
                ? {
                    borderColor: "#f59e0b",
                    iconBg: "bg-amber-100",
                    iconStroke: "#d97706",
                    badgeClass: "bg-amber-100 text-amber-800",
                    metaClass: "bg-amber-50 text-amber-700 border border-amber-200",
                  }
                : {
                    borderColor: "#8b5cf6",
                    iconBg: "bg-violet-100",
                    iconStroke: "#7c3aed",
                    badgeClass: "bg-violet-100 text-violet-800",
                    metaClass: "bg-violet-50 text-violet-700 border border-violet-200",
                  };

        const detailBadges = [];
        const metaBadges = [typeLabel];

        if (service.type === "hotel") {
          if (Number(service.nights || 0) > 0) detailBadges.push(`${service.nights}N`);
          if (Number(service.rooms || 0) > 0) detailBadges.push(`${service.rooms}R`);
          if (service.roomType) detailBadges.push(service.roomType);
          if (service.bedType) detailBadges.push(`${service.bedType} bed`);
          if (Number(service.adults || 0) > 0) detailBadges.push(`${service.adults} Adult`);
          if (Number(service.children || 0) > 0) detailBadges.push(`${service.children} Child`);
        }

        if (service.type === "transfer") {
          if (service.vehicleType) detailBadges.push(service.vehicleType);
          if (Number(service.passengerCapacity || 0) > 0) detailBadges.push(`${service.passengerCapacity} Pax`);
          if (Number(service.luggageCapacity || 0) > 0) detailBadges.push(`${service.luggageCapacity} Luggage`);
          if (service.usageType) detailBadges.push(formatUsageLabel(service.usageType));
          if (Number(service.days || 0) > 0) detailBadges.push(`${service.days} Day${Number(service.days) > 1 ? "s" : ""}`);
        }

        if (service.type === "activity" || service.type === "sightseeing") {
          if (Number(service.pax || 0) > 0) detailBadges.push(`${service.pax} Pax`);
          if (Number(service.days || 0) > 0) detailBadges.push(`${service.days} Day${Number(service.days) > 1 ? "s" : ""}`);
        }

        if (serviceDateLabel) metaBadges.push(serviceDateLabel);

        if (service.type === "hotel") {
          metaBadges.push("Stay included");
        }

        if (service.type === "transfer") {
          metaBadges.push("Transfer included");
        }

        if (service.type === "activity" || service.type === "sightseeing") {
          metaBadges.push("Experience included");
        }

        return (
          <li key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3" style={{ borderLeft: `3px solid ${serviceTheme.borderColor}` }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg ${serviceTheme.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {service.type === "hotel" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  ) : service.type === "transfer" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
                    </svg>
                  ) : service.type === "activity" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20"/><path d="M2 12h20"/><circle cx="12" cy="12" r="9"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01L3.27 9.35l6.03-.88L12 3z"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-gray-900 break-words">{service.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-[11px] text-gray-400 break-words">
                      {[service.city, service.country].filter(Boolean).join(", ") || "Location shared in quotation"}
                    </span>
                  </div>
                </div>
              </div>
              {detailBadges.length > 0 && (
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                  {detailBadges.slice(0, 3).map((badge, badgeIndex) => (
                    <span key={`${badge}-${badgeIndex}`} className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${serviceTheme.badgeClass}`}>
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {detailBadges.length > 3 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {detailBadges.slice(3).map((badge, badgeIndex) => (
                  <span key={`${badge}-${badgeIndex}`} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${serviceTheme.badgeClass}`}>
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {metaBadges.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {metaBadges.map((badge, badgeIndex) => (
                  <span key={`${badge}-${badgeIndex}`} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${serviceTheme.metaClass}`}>
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {descriptionBits.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {descriptionBits.map((bit, bitIndex) => (
                  <span key={`${bit}-${bitIndex}`} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-500">
                    {bit}
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })
    ) : (
      <li className="text-center py-4 text-xs text-gray-400">No inclusions provided</li>
    )}
  </ul>
</div>
 </>
)}

                <div className="flex flex-col items-center gap-3">
                  {/* STEP 1: ACCEPT */}
                  {quote.status === "Quote Sent" && (
                    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-10">
                      <button
                        onClick={() => handleAcceptQuote(quote._id)}
                        className="bg-green-600 text-white text-[10px] px-8 py-2 rounded-full cursor-pointer"
                      >
                        Accept Quote
                      </button>
                      <button
                        onClick={() => openRevisionModal(quote._id)}
                        className="border border-[#BEDBFF] text-[10px] px-8 py-2 rounded-full cursor-pointer"
                      >
                        Request Revision
                      </button>
                    </div>
                  )}
                  {quote.status === "Quote Accepted" && (
                    <div className="w-[800px] flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <ActionPillButton
                        label="Markup"
                        hint="Optional: set your final client margin"
                        icon={<Sparkles size={16} />}
                        tone="sky"
                        onClick={() => {
                          setActiveQuoteId(quote._id);
                          setIsMarkupModalOpen(true);
                        }}
                      />
                      <ActionPillButton
                        label="E-Mail"
                        hint={
                          sendSubmittingId === quote._id
                            ? "Preparing quotation email..."
                            : "Send now, markup is optional"
                        }
                        icon={<Mail size={18} />}
                        tone="rose"
                        onClick={() => handleOpenSendModal(quote)}
                        disabled={sendSubmittingId === quote._id}
                      />
                    </div>
                  )}

                  {/* STEP 2:------------------- MARKUP MODAL--------------------------------------- */}

                  {isMarkupModalOpen &&
                    activeQuoteId === quote._id &&
                    quote.status === "Quote Accepted" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                      >
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
                          <div className="mb-4">
                            <h2 className="text-lg font-semibold">
                              Apply Agent Markup
                            </h2>
                            <p className="text-xs text-gray-500">
                              Agent markup optional hai. Agar chaho to direct client ko ops quote bhi bhej sakte ho.
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-medium text-gray-600">
                                Markup Type
                              </label>
                              <select
                                value={markupType}
                                onChange={(e) => setMarkupType(e.target.value)}
                                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="PERCENT">Percentage (%)</option>
                                <option value="AMOUNT">Fixed Amount (₹)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">
                                Markup Value
                              </label>
                              <input
                                type="number"
                                placeholder="Enter value"
                                value={markupValue}
                                onChange={(e) => setMarkupValue(e.target.value)}
                                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-6">
                            <button
                              onClick={() => setIsMarkupModalOpen(false)}
                              className="px-5 py-1.5 rounded-full border text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                await handleApplyMarkup(activeQuoteId);
                                setIsMarkupModalOpen(false);
                              }}
                              className="px-6 py-1.5 rounded-full bg-blue-600 text-white text-sm cursor-pointer"
                            >
                              Apply Markup
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  {/* STEP 3:-------------------------- SEND TO CLIENT------------------- */}
                  {quote.status === "Markup Applied" && (
                    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <ActionPillButton
                        label="Markup"
                        hint="Client pricing is ready"
                        icon={<CheckCircle2 size={18} />}
                        tone="sky"
                        disabled
                      />
                      <ActionPillButton
                        label="E-Mail"
                        hint={
                          sendSubmittingId === quote._id
                            ? "Preparing quotation email..."
                            : "Choose recipient email and send"
                        }
                        icon={<Mail size={18} />}
                        tone="rose"
                        onClick={() => handleOpenSendModal(quote)}
                        disabled={sendSubmittingId === quote._id}
                      />
                    </div>
                  )}

                  {/* {quote.status === "Sent to Client" && (
                    <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <button
                        onClick={() => openRevisionModal(quote._id)}
                        className="rounded-full border border-[#BEDBFF] bg-white px-8 py-1.5 text-slate-700 cursor-pointer"
                      >
                        Request Revision
                      </button>
                      <button
                        onClick={() => handleClientApproved(quote._id)}
                        className="bg-indigo-600 text-white px-8 py-1.5 rounded-full cursor-pointer"
                      >
                        Client Approved
                      </button>
                    </div>
                  )} */}
                </div>
              </motion.div>
            ))}

{/*============================================== PENDING UI ===================================================I */}
          {query.agentStatus === "Pending" && (
            <motion.div
              variants={itemVariant}
              className="relative overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-50 shadow-sm"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />
              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                      <Clock3 size={12} />
                      Awaiting Ops
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Waiting for quotation from operations team
                    </h3>
                    <p className="mt-2 max-w-lg text-sm text-slate-600">
                      Your request is under review. Operations is checking availability,
                      service combinations, and pricing before sharing the quotation.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200/70">
                    <Sparkles size={24} />
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Current Stage
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Quote Preparation in Progress
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Expected Update
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Within 24 hours
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-white/80 px-4 py-3">
                  <ShieldAlert size={18} className="mt-0.5 text-amber-600" />
                  <p className="text-xs leading-5 text-slate-600">
                    You will be notified here as soon as the operations team sends the quotation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
 {/*======================================= REVISION REQUESTED UI =========================================== */}

          {query.agentStatus === "Revision Requested" && (
            <motion.div
              variants={itemVariant}
              className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm"
            >
              <h3 className="mb-2 text-lg font-semibold text-red-600">
                Revision Requested
              </h3>
              <p className="mb-4 text-sm text-slate-700">
                The quotation change request has been sent to operations. This same query is back with the ops team and a revised quotation will appear here after they rebuild it.
              </p>
              <div className="rounded-2xl border border-red-200 bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">
                  Revision Note
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {query.rejectionNote || "Awaiting the revised quotation from operations."}
                </p>
              </div>
            </motion.div>
          )}
          
{/*======================================= IN PROGRESS UI =========================================== */}

{query.agentStatus === "In Progress" && (
  <motion.div
    variants={itemVariant}
    className="rounded-2xl p-6 border border-blue-200 shadow-sm flex flex-col items-center justify-center text-center gap-2 bg-blue-50"
  >
    <div className="w-10 h-10 rounded-full border-2 border-blue-400 flex items-center justify-center">
      ⚙️
    </div>
    <h3 className="font-semibold text-sm text-blue-700">
      Your quotation is being prepared
    </h3>
    <p className="text-xs text-gray-600">
      Our operations team is currently working on your travel plan.
    </p>
    <p className="text-xs text-gray-500">
      You will be notified once the quotation is ready.
    </p>
  </motion.div>
)}

{/*==================================== REQUIREMENTS ================================================== */}
          {query.agentStatus === "Confirmed" && (
            <motion.div
              variants={itemVariant}
              className="relative overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-teal-50 shadow-sm"
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-200/30 blur-2xl" />
              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      <CheckCircle2 size={12} />
                      Booking Confirmed
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Your booking is now locked in and ready for traveler servicing
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                      Operations has confirmed the booking. Payment, traveler documents, and voucher-related updates will continue from the booking workflow.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/70">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Confirmation Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {bookingConfirmedAt
                        ? new Date(bookingConfirmedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Recently confirmed"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Trip Value
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {latestQuote
                        ? `INR ${(latestQuote.clientTotalAmount ?? latestQuote.pricing?.totalAmount ?? 0).toLocaleString("en-IN")}`
                        : "Shared in quotation"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Next Step
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Track progress from Active Bookings
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/85 px-4 py-3">
                  <BadgeCheck size={18} className="mt-0.5 text-emerald-600" />
                  <p className="text-xs leading-5 text-slate-600">
                    Payment review, traveler document submission, and voucher visibility will now move booking-wise. Use this page mainly to review the final requirement snapshot and history.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={itemVariant}
            className="border border-gray-200 shadow-sm rounded-2xl p-4 bg-white"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Requirements</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Final trip requirements and preference notes shared for this booking.
                </p>
              </div>
              {query.agentStatus === "Confirmed" && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  Final Snapshot
                </span>
              )}
            </div>
            <div className="grid gap-4 text-xs sm:grid-cols-2 sm:gap-6">
              <div>
                <p className="text-gray-500">Dates</p>
                <p className="font-medium">
                  {new Date(query.startDate).toLocaleDateString("en-IN")} –{" "}
                  {new Date(query.endDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Travelers</p>
                <p className="font-medium">
                  {query.numberOfAdults} Adults
                  {query.numberOfChildren > 0 &&
                    `, ${query.numberOfChildren} Kids`}
                </p>
              </div>
            </div>

   <div className="mt-2 text-xs">
   <p className="text-gray-700 mb-2 ">Preferences</p>
  {query.specialRequirements ? (
    <div className="flex flex-wrap gap-2">
      {query.specialRequirements
       .split(/[.,;\n]/)
        .filter((item) => item.trim() !== "")
        .map((item, index) => (
          <span
            key={index}
            className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-900 border border-blue-300 rounded-full"
          >
            {item.trim()}
          </span>
        ))}
    </div>
  ) : (
    <p className="font-medium">No special preferences</p>
  )}
</div>
</motion.div>


</div>

{/*============================================ RIGHT ACTIVITY LOG ===================================*/}
<motion.div
  variants={itemVariant}
  className="border border-gray-200 shadow-sm rounded-2xl p-5 h-fit"
>
  {/* Header */}
  <div className="flex items-center gap-2 mb-5">
    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    </div>
    <h3 className="font-semibold text-sm text-gray-900">Activity Log</h3>
    {query.activityLog?.length > 0 && (
      <span className="ml-auto bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {query.activityLog.length} events
      </span>
    )}
  </div>

  <div className="space-y-1 relative">
    {query.activityLog?.slice().reverse().map((log, index) => (
      <div key={index} className="flex gap-3 relative">
        {(() => {
          const theme = getActivityTheme(log.action);
          const LogIcon = theme.Icon;

          return (
            <>

        {/* Vertical Line */}
              {index !== query.activityLog.length - 1 && (
                <span className={`absolute left-[9px] top-6 w-0.5 h-full ${theme.line} z-0`} />
              )}

        {/* Dot */}
              <span
                className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full z-10 flex-shrink-0 ring-4 ring-white ${theme.dot}`}
              >
                <LogIcon className="h-3 w-3 text-white" />
              </span>

        {/* Content */}
              <div className={`mb-3 flex-1 rounded-2xl border px-3 py-3 ${theme.surface}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {getDisplayAction(log.action)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${theme.badge}`}>
                    {getDisplayAction(log.action)}
                  </span>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    ))}
  </div>
</motion.div>
</div>
<AnimatePresence>
  {isSendModalOpen && sendQuoteId && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
      >
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#ecfeff_100%)] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Send Quotation
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Email quotation to client
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseSendModal}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Confirm the client email below. The quotation summary will be sent directly to this inbox.
          </p>
        </div>

        <div className="px-6 py-5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Client Email
          </label>
          <input
            type="email"
            value={sendRecipientEmail}
            onChange={(e) => setSendRecipientEmail(e.target.value)}
            placeholder="Enter client email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          />

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <Send size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">What will be sent</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Travel services, inclusions, validity, and final quotation amount in a clean email summary.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseSendModal}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const selectedQuote = quotes.find((item) => item._id === sendQuoteId);
                if (selectedQuote) {
                  handleSendToClient(selectedQuote, sendRecipientEmail);
                }
              }}
              disabled={sendSubmittingId === sendQuoteId}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sendSubmittingId === sendQuoteId ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
<AnimatePresence>
  {sendSuccessMeta && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-emerald-200 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative border-b border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_45%,#eff6ff_100%)] px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_14px_28px_rgba(16,185,129,0.28)]">
                <Send size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Delivered</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Quotation sent successfully</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSendSuccessMeta(null)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            A dynamic quotation summary has been emailed with service-wise details, travel dates, inclusions, and the final client amount.
          </p>
        </div>

        <div className="relative px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recipient</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-900">{sendSuccessMeta.recipientEmail || "Registered email"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quotation</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{sendSuccessMeta.quotationNumber || "Quotation Shared"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Destination</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{sendSuccessMeta.destination || query.destination}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Client Total</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{formatMoney(sendSuccessMeta.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-700">
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">
                {sendSuccessMeta.serviceCount} services
              </span>
              <span>Valid till {sendSuccessMeta.validTill || "-"}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSendSuccessMeta(null)}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Stay Here
            </button>
            <button
              type="button"
              onClick={() => {
                setSendSuccessMeta(null);
                onClose?.();
              }}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Back to Queries
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
<AnimatePresence>
  {isRevisionModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">
              Revision Request
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Send quotation back to operations
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add the client's requested changes here. Ops will be notified, the same query will reopen for quotation work, and the revised quote will come back to you on this page.
            </p>
          </div>
          <button
            onClick={() => {
              setIsRevisionModalOpen(false);
              setRevisionReason("");
              setRevisionQuoteId(null);
            }}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
            What happens next
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Ops gets a notification, the query moves into revision mode, and a fresh quotation can be prepared again for this same booking request.
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-slate-800">
            Revision details
          </label>
          <textarea
            rows={5}
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            placeholder="Example: Client wants hotel option near city center, lower total budget, and airport transfer included."
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => {
              setIsRevisionModalOpen(false);
              setRevisionReason("");
              setRevisionQuoteId(null);
            }}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestRevision}
            disabled={revisionSubmitting}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {revisionSubmitting ? "Sending..." : "Notify Ops Team"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </motion.div>
  );
};

export default QueryDetails;
