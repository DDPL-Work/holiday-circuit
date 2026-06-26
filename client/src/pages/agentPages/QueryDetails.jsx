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
  Download,
  Send,
  X,
  RotateCcw,
  ThumbsUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { updateUserProfileLocal } from "../../redux/slices/authSlice.js";

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
  `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

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

const buildPublicAssetUrl = (assetPath = "") => {
  const normalizedPath = String(assetPath || "").trim();
  if (!normalizedPath) return "";

  const apiBaseUrl = String(API.defaults.baseURL || window.location.origin);
  const originBase = apiBaseUrl.replace(/\/api\/?$/, "");
  return new URL(normalizedPath.replace(/^\//, ""), `${originBase}/`).toString();
};

const getOrdinalSuffix = (value) => {
  const normalized = Math.abs(Number(value || 0));
  const remainder100 = normalized % 100;

  if (remainder100 >= 11 && remainder100 <= 13) return "th";

  switch (normalized % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const buildItineraryDayLabel = (dayNumber, startDate) => {
  const numericDay = Math.max(1, Number(dayNumber || 1));
  const prefix = `${numericDay}${getOrdinalSuffix(numericDay)} Day`;

  if (!startDate) return prefix;

  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) return prefix;

  parsed.setDate(parsed.getDate() + numericDay - 1);
  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "short" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });
  const day = parsed.getDate();

  return `${prefix} (${weekday} ${day}${getOrdinalSuffix(day)} ${month})`;
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

const SELLER_BANK_DETAILS = [
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Leela Travels" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
];

const QUOTATION_TERMS = [
  "Balance payment to be cleared before travel",
  "Cancellation as per supplier policy; service charges non-refundable",
  "Amendments subject to availability & extra cost",
  "No refund for no-show / unused services",
  "Guests must carry valid travel documents",
  "Not liable for delays, cancellations, or unforeseen events",
  "All disputes are subject to Delhi jurisdiction only",
];

const CLIENT_SHARE_TERMS = [
  "Rates are subject to availability and confirmation at the time of booking.",
  "Only the services listed in this quotation are included in the shared amount.",
  "Any amendment after confirmation may affect availability and final pricing.",
  "Hotel check-in, check-out, and supplier-specific policies will apply as per service rules.",
  "Please review and confirm within the validity period to avoid fare or rate changes.",
];

const formatAmountValue = (value) =>
  Math.round(Number(value || 0)).toLocaleString("en-IN");

const parseShareDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatShareDate = (
  value,
  { month = "short", weekday = undefined, includeYear = true } = {},
) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "-";

  const day = parsed.getDate();
  const monthLabel = parsed.toLocaleDateString("en-GB", { month });
  const weekdayLabel = weekday
    ? `${parsed.toLocaleDateString("en-GB", { weekday })}, `
    : "";
  const baseLabel = `${day} ${monthLabel}`;

  return includeYear
    ? `${weekdayLabel}${baseLabel}, ${parsed.getFullYear()}`
    : `${weekdayLabel}${baseLabel}`;
};

const formatShareActivityDate = (value) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "";

  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "short" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });
  const year = String(parsed.getFullYear()).slice(-2);

  return `${weekday}, ${parsed.getDate()}${getOrdinalSuffix(parsed.getDate())} ${month}'${year}`;
};

const formatShareItineraryDate = (value) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "";

  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "long" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });

  return `${weekday} ${parsed.getDate()}${getOrdinalSuffix(parsed.getDate())} ${month}, ${parsed.getFullYear()}`;
};

const addDaysToShareDate = (value, daysToAdd = 0) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "";

  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString();
};

const getShareDateDiff = (startDate, endDate) => {
  const start = parseShareDate(startDate);
  const end = parseShareDate(endDate);

  if (!start || !end) return 0;

  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.max(
    0,
    Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

const getDurationMeta = (query = {}) => {
  const start = parseShareDate(query?.startDate);
  const end = parseShareDate(query?.endDate);

  if (!start || !end) {
    return { totalDays: 0, totalNights: 0 };
  }

  const timeDiff = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1);
  const totalNights = Math.max(0, totalDays - 1);

  return { totalDays, totalNights };
};

const getClientRecipientName = (query = {}) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const primaryAdultTraveler = travelers.find(
    (traveler) =>
      String(traveler?.travelerType || "").trim().toLowerCase() === "adult" &&
      String(traveler?.fullName || "").trim(),
  );
  const fallbackTraveler = travelers.find((traveler) => String(traveler?.fullName || "").trim());

  return (
    query?.name ||
    query?.clientName ||
    query?.customerName ||
    query?.guestName ||
    primaryAdultTraveler?.fullName ||
    fallbackTraveler?.fullName ||
    "Guest"
  );
};

const getQueryTravelerCounts = (query = {}) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const adultFallbackCount = travelers.filter(
    (traveler) => String(traveler?.travelerType || "").trim().toLowerCase() !== "child",
  ).length;
  const childFallbackCount = travelers.filter(
    (traveler) => String(traveler?.travelerType || "").trim().toLowerCase() === "child",
  ).length;
  const adults = Number(query?.numberOfAdults ?? query?.adults ?? 0);
  const children = Number(query?.numberOfChildren ?? query?.children ?? 0);
  const infants = Number(query?.numberOfInfants ?? query?.infants ?? 0);

  return {
    adults: adults > 0 ? adults : adultFallbackCount,
    children: children > 0 ? children : childFallbackCount,
    infants: infants > 0 ? infants : 0,
  };
};

const buildClientTravelerSummary = (query = {}) => {
  const { adults, children } = getQueryTravelerCounts(query);
  const travelers = [];

  if (adults > 0) travelers.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
  if (children > 0) travelers.push(`${children} ${children === 1 ? "Child" : "Children"}`);

  return travelers.join(", ") || "Traveler details pending";
};

const normalizeShareServiceType = (value = "") => {
  const normalizedType = String(value || "").trim().toLowerCase();
  if (normalizedType === "car" || normalizedType === "transport") return "transfer";
  return normalizedType;
};

const inferSharingLabel = (services = []) => {
  const primaryHotel = services.find(
    (service) => normalizeShareServiceType(service?.type) === "hotel",
  );

  const rawLabel = `${primaryHotel?.bedType || ""} ${primaryHotel?.roomType || ""}`.toLowerCase();

  if (rawLabel.includes("triple")) return "Triple Sharing";
  if (rawLabel.includes("double")) return "Double Sharing";
  if (rawLabel.includes("twin")) return "Twin Sharing";
  if (rawLabel.includes("single")) return "Single Sharing";

  return "Per Person";
};

const buildClientServiceQuantityLabel = (service = {}) => {
  const normalizedType = normalizeShareServiceType(service?.type);
  const details = [];

  if (normalizedType === "hotel") {
    if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
    if (Number(service?.rooms || 0) > 0) {
      details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
    }
    if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
    return details.join(" | ");
  }

  if (normalizedType === "transfer") {
    if (service?.usageType) details.push(String(service.usageType).replace(/-/g, " "));
    if (Number(service?.passengerCapacity || 0) > 0) {
      details.push(`${service.passengerCapacity} Pax`);
    } else if (Number(service?.pax || 0) > 0) {
      details.push(`${service.pax} Pax`);
    }
    if (service?.vehicleType) details.push(service.vehicleType);
    return details.join(" | ");
  }

  if (Number(service?.days || 0) > 0) details.push(`${service.days}D`);
  if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
  if (Number(service?.passengerCapacity || 0) > 0) details.push(`${service.passengerCapacity} Pax`);
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildHotelNightLabel = (serviceDate, nights, tripStartDate) => {
  const totalNights = Math.max(1, Number(nights || 1));
  const startNightNumber = getShareDateDiff(tripStartDate, serviceDate) + 1;
  const nightLabels = Array.from({ length: totalNights }, (_, index) => {
    const value = startNightNumber + index;
    return `${value}${getOrdinalSuffix(value)}`;
  });

  if (nightLabels.length === 1) {
    return `${nightLabels[0]} Night`;
  }

  if (nightLabels.length <= 3) {
    return `${nightLabels.join(", ")} Nights`;
  }

  return `${nightLabels[0]} - ${nightLabels[nightLabels.length - 1]} Nights`;
};

const buildHotelMeta = (service = {}, fallbackPax = 0) => {
  const hotelPax =
    Number(service?.pax || 0) ||
    Number(service?.adults || 0) + Number(service?.children || 0) + Number(service?.infants || 0) ||
    fallbackPax;
  const parts = [];
  const description = String(service?.description || "").replace(/\s+/g, " ").trim();

  if (description) {
    parts.push(description);
  }

  const roomBits = [];
  if (Number(service?.rooms || 0) > 0) {
    roomBits.push(
      `${service.rooms} ${service?.roomType || "Room"}${Number(service.rooms) > 1 ? "s" : ""}`,
    );
  } else if (service?.roomType) {
    roomBits.push(service.roomType);
  }

  if (hotelPax > 0) {
    roomBits.push(`(${hotelPax} Pax)`);
  }

  if (roomBits.length) {
    parts.push(roomBits.join(" "));
  }

  return parts.join(" | ") || "Stay included";
};

const buildClientWhatsAppQuotationMessage = ({ query, quote }) => {
  const services = Array.isArray(quote?.services) ? quote.services : [];
  const { adults, children, infants } = getQueryTravelerCounts(query);
  const totalPax = adults + children + infants;
  const totalAmount = Math.round(
    Number(quote?.clientTotalAmount ?? quote?.pricing?.totalAmount ?? quote?.totalAmount ?? 0),
  );
  const perPersonAmount = totalPax > 0 ? Math.round(totalAmount / totalPax) : 0;
  const destinationLabel = query?.destination ? `${query.destination} Trip` : "Trip";
  const recipientName = getClientRecipientName(query);
  const { totalDays, totalNights } = getDurationMeta(query);
  const notes = Array.isArray(quote?.additionalNotes) ? quote.additionalNotes.filter(Boolean) : [];
  const inclusions = Array.isArray(quote?.inclusions) ? quote.inclusions.filter(Boolean) : [];
  const exclusions = Array.isArray(quote?.exclusions) ? quote.exclusions.filter(Boolean) : [];
  const itinerary = Array.isArray(quote?.dayWiseItinerary)
    ? quote.dayWiseItinerary.filter((item) => item?.title || item?.description)
    : [];

  const hotels = services
    .filter((service) => normalizeShareServiceType(service?.type) === "hotel")
    .sort(
      (left, right) =>
        new Date(left?.serviceDate || 0).getTime() - new Date(right?.serviceDate || 0).getTime(),
    );

  const transportAndActivities = services
    .filter((service) => normalizeShareServiceType(service?.type) !== "hotel")
    .sort(
      (left, right) =>
        new Date(left?.serviceDate || 0).getTime() - new Date(right?.serviceDate || 0).getTime(),
    );

  const lines = [
    `Hi ${recipientName},`,
    "",
    quote?.agentBrandingName ? `Greetings from ${quote.agentBrandingName}.` : "Greetings from Holiday Circuit.",
    "",
    "Thank you for your query with us. As per your requirements, following are the package details.",
    "",
    `Trip ID ${query?.queryId || quote?.quotationNumber || "-"}`,
    "----------",
    destinationLabel,
    `* ${formatShareDate(query?.startDate)} for *${totalNights} Nights,`,
    `  ${totalDays} Days*`,
    `* ${buildClientTravelerSummary(query)}`,
    "",
    "Price (₹):",
    perPersonAmount > 0
      ? `* ₹${formatAmountValue(perPersonAmount)} / Person (${inferSharingLabel(services)}) x ${totalPax}`
      : "* Price on request",
    perPersonAmount > 0 ? "  Pax" : "",
    `Total: ₹${formatAmountValue(totalAmount)} /-`,
  ];

  if (notes.length) {
    lines.push("");
    lines.push("Notes");
    lines.push("-------");
    notes.forEach((note, index) => {
      lines.push(`${index + 1}. ${note}`);
    });
    lines.push("-------");
  }

  if (hotels.length) {
    lines.push("");
    lines.push("Hotels");
    lines.push("----------");

    hotels.forEach((hotel) => {
      const checkInDate = hotel?.serviceDate || query?.startDate || "";
      const checkOutDate = addDaysToShareDate(checkInDate, Number(hotel?.nights || 1));
      const locationLabel = hotel?.city || query?.destination || "Destination";
      const hotelTitle = hotel?.hotelCategory
        ? `${hotel.title} (${hotel.hotelCategory})`
        : hotel.title || "Hotel stay";

      lines.push(`${buildHotelNightLabel(checkInDate, hotel?.nights, query?.startDate)} at ${locationLabel}`);
      lines.push(`Check-in: ${formatShareDate(checkInDate, { includeYear: false })} & _Check-out:`);
      lines.push(`  ${formatShareDate(checkOutDate, { includeYear: false })}_`);
      lines.push(hotelTitle);
      lines.push(buildHotelMeta(hotel, totalPax));
      lines.push("");
    });
  }

  if (transportAndActivities.length) {
    const groupedServices = transportAndActivities.reduce((accumulator, service) => {
      const parsedDate = parseShareDate(service?.serviceDate);
      const groupKey = parsedDate ? parsedDate.toISOString().slice(0, 10) : "undated";

      if (!accumulator[groupKey]) {
        accumulator[groupKey] = [];
      }

      accumulator[groupKey].push(service);
      return accumulator;
    }, {});

    lines.push("Transportation and Activities");
    lines.push("----------");

    Object.entries(groupedServices).forEach(([groupDate, items], index) => {
      const serviceDate = groupDate === "undated" ? "" : groupDate;
      const dayNumber = serviceDate
        ? getShareDateDiff(query?.startDate, serviceDate) + 1
        : index + 1;

      lines.push(`${dayNumber}${getOrdinalSuffix(dayNumber)} Day - ${formatShareActivityDate(serviceDate)}`);

      items.forEach((service) => {
        const quantityLabel = buildClientServiceQuantityLabel(service);
        const description =
          service?.description &&
          String(service.description).trim().toLowerCase() !== String(service.title || "").trim().toLowerCase()
            ? ` - ${String(service.description).trim()}`
            : "";
        lines.push(`* ${service?.title || "Service"}${description}${quantityLabel ? ` (${quantityLabel})` : ""}`);
      });

      lines.push("");
    });
  }

  if (inclusions.length) {
    lines.push("Inclusions");
    lines.push("----------");
    inclusions.forEach((item) => {
      lines.push(`+ ${item}`);
    });
    lines.push("");
  }

  if (exclusions.length) {
    lines.push("Exclusions");
    lines.push("----------");
    exclusions.forEach((item) => {
      lines.push(`- ${item}`);
    });
    lines.push("");
    lines.push("NOTE: Anything not mentioned in the inclusions is excluded");
    lines.push("");
  }

  if (itinerary.length) {
    lines.push("Day Wise Itinerary");
    lines.push("----------");

    itinerary.forEach((item, index) => {
      const dayNumber = Number(item?.dayNumber || index + 1);
      const itemDate = item?.date || addDaysToShareDate(query?.startDate, dayNumber - 1);

      lines.push(`${dayNumber}${getOrdinalSuffix(dayNumber)} Day - ${formatShareItineraryDate(itemDate)}`);
      lines.push("----");
      if (item?.title) lines.push(item.title);
      if (item?.description) lines.push(String(item.description).trim());
      lines.push("");
      lines.push("----------");
      lines.push("");
    });
  }

  if (CLIENT_SHARE_TERMS.length) {
    lines.push("Terms and Conditions");
    lines.push("----------");
    CLIENT_SHARE_TERMS.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
    });
  }

  return lines
    .filter((line, index, array) => {
      if (line !== "") return true;
      return array[index - 1] !== "";
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const getQuoteAttemptNumber = (index, totalQuotes) =>
  Math.max(1, Number(totalQuotes || 1) - Number(index || 0));

const validateAgentMarkupInput = ({ markupType, markupValue }) => {
  const normalizedType = String(markupType || "").trim().toUpperCase();
  const normalizedValue = Number(markupValue);

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return "Please enter a valid markup value.";
  }

  if (["PERCENT", "AMOUNT"].includes(normalizedType)) return "";

  return "Please select a valid markup type.";
};

const calculateAgentMarkupPreview = ({ markupType, markupValue, opsTotal }) => {
  const normalizedType = String(markupType || "").trim().toUpperCase();
  const normalizedValue = Number(markupValue);
  const normalizedOpsTotal = Math.max(0, Number(opsTotal) || 0);

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return {
      markupAmount: 0,
      finalAmount: normalizedOpsTotal,
    };
  }

  const markupAmount =
    normalizedType === "PERCENT"
      ? Math.round((normalizedOpsTotal * normalizedValue) / 100)
      : Math.round(normalizedValue);

  return {
    markupAmount,
    finalAmount: normalizedOpsTotal + Math.max(0, markupAmount),
  };
};

const fetchQuotationsByQuery = async (queryId) => {
  const res = await API.get(`/agent/quotations/query/${queryId}`);
  return (res.data.quotations || []).filter(
    (quotation) => String(quotation?.status || "").trim() !== "Pending",
  );
};

const getSavedAgentBranding = ({ quote = {}, user = null }) => ({
  name: String(
    quote?.agentBrandingName ||
    user?.brandingName ||
    user?.companyName ||
    "",
  ).trim(),
  logo: String(
    quote?.agentLogo ||
    user?.brandingLogo ||
    "",
  ).trim(),
});

const ActionPillButton = ({
  label,
  icon,
  onClick,
  disabled = false,
  tone = "slate",
  className = "",
}) => {
  const tones = {
    sky: "bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
    rose: "bg-gradient-to-r from-[#f43f5e] to-[#ec4899] hover:from-[#e11d48] hover:to-[#db2777] shadow-[0_4px_14px_rgba(244,63,94,0.35)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
    emerald: "bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
    slate: "bg-gradient-to-r from-[#475569] to-[#334155] hover:from-[#334155] hover:to-[#1e293b] shadow-[0_4px_14px_rgba(71,85,105,0.35)] hover:shadow-[0_6px_20px_rgba(71,85,105,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
  };

  const shellStyle = tones[tone] || tones.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 shadow-2xl text-white transition-all duration-200 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${shellStyle} ${className}`}
    >
      <span className="flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

const QuoteInfoListCard = ({
  title,
  items = [],
  tone = "slate",
  emptyLabel = "No items provided",
  icon = null,
}) => {
  const tones = {
    emerald: {
      border: "border-emerald-200",
      shell: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      itemBorder: "border-l-[3px] border-emerald-500",
    },
    rose: {
      border: "border-rose-200",
      shell: "bg-rose-50",
      iconBg: "bg-rose-100",
      iconText: "text-rose-700",
      badge: "bg-rose-100 text-rose-700 border border-rose-200",
      itemBorder: "border-l-[3px] border-rose-500",
    },
    sky: {
      border: "border-sky-200",
      shell: "bg-sky-50",
      iconBg: "bg-sky-100",
      iconText: "text-sky-700",
      badge: "bg-sky-100 text-sky-700 border border-sky-200",
      itemBorder: "border-l-[3px] border-sky-500",
    },
    slate: {
      border: "border-gray-200",
      shell: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconText: "text-gray-700",
      badge: "bg-gray-100 text-gray-700 border border-gray-200",
      itemBorder: "border-l-[3px] border-gray-400",
    },
  };

  const currentTone = tones[tone] || tones.slate;
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className={`mb-4 rounded-xl border bg-white p-3 ${currentTone.border}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${currentTone.iconBg} ${currentTone.iconText}`}>
          {icon}
        </div>
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${currentTone.badge}`}>
          {normalizedItems.length} item{normalizedItems.length === 1 ? "" : "s"}
        </span>
      </div>

      {normalizedItems.length ? (
        <ul className="space-y-2">
          {normalizedItems.map((item, idx) => (
            <li
              key={`${title}-${idx}`}
              className={`rounded-xl border border-gray-200 bg-gray-50 p-3 ${currentTone.itemBorder}`}
            >
              <span className="text-[13px] leading-relaxed text-slate-800">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={`rounded-xl border border-dashed p-3 text-sm italic ${currentTone.shell} ${currentTone.border} text-gray-500`}>
          {emptyLabel}
        </div>
      )}
    </div>
  );
};

const QuoteDayWiseItineraryCard = ({ items = [], startDate = "" }) => {
  const normalizedItems = Array.isArray(items)
    ? items.filter((item) => item && (item.heading || item.title || item.description))
    : [];

  if (!normalizedItems.length) return null;

  return (
    <div className="mb-4 rounded-xl border border-orange-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Clock3 size={14} />
        </div>
        <h4 className="font-semibold text-sm text-gray-900">Day Wise Itinerary</h4>
        <span className="ml-auto rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
          {normalizedItems.length} day{normalizedItems.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-3">
        {normalizedItems.map((item, index) => {
          const dayLabel =
            String(item?.dayLabel || "").trim() ||
            buildItineraryDayLabel(item?.dayNumber || index + 1, startDate);
          const heading = String(item?.heading || "").trim() || (item?.title ? `${dayLabel} : ${item.title}` : dayLabel);
          const description = String(item?.description || "").trim();

          return (
            <div key={`quote-itinerary-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-3" style={{ borderLeft: "3px solid #f59e0b" }}>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                  {item?.dayNumber || index + 1}
                </div>
                <p className="text-[13px] font-semibold text-[#92400E]">{heading}</p>
              </div>
              {description ? (
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">{description}</p>
              ) : (
                <p className="mt-1 text-xs italic text-slate-400">Description pending.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuoteSellerBankDetailsCard = () => (
  <div className="mb-4 rounded-xl border border-orange-200 bg-white p-3">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
        <CreditCard size={14} />
      </div>
      <h4 className="font-semibold text-sm text-gray-900">Seller&apos;s Bank Details</h4>
    </div>

    <div className="space-y-2">
      {SELLER_BANK_DETAILS.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3" style={{ borderLeft: "3px solid #f97316" }}>
          <p className="text-[13px] leading-relaxed text-slate-800">
            <span className="font-semibold text-slate-900">{item.label}:</span>{" "}
            <span>{item.value}</span>
          </p>
        </div>
      ))}
    </div>
  </div>
);

const QuoteTermsAndConditionsCard = () => (
  <div className="mb-4 rounded-xl border border-violet-200 bg-white p-3">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
        <ShieldAlert size={14} />
      </div>
      <h4 className="font-semibold text-sm text-gray-900">Terms and Conditions</h4>
      <span className="ml-auto rounded-full border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
        {QUOTATION_TERMS.length} points
      </span>
    </div>

    <ol className="space-y-2">
      {QUOTATION_TERMS.map((item, index) => (
        <li
          key={item}
          className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
          style={{ borderLeft: "3px solid #8b5cf6" }}
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
            {index + 1}
          </span>
          <span className="text-[13px] leading-relaxed text-slate-700">{item}</span>
        </li>
      ))}
    </ol>
  </div>
);

const QuoteServiceListCard = ({ services = [] }) => (
  <div className="mb-4 rounded-xl border border-[#BEDBFF] bg-white p-3">
    <div className="mb-3 flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h4 className="font-semibold text-sm text-gray-900">Selected Services</h4>
      <span className="ml-auto bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
        {services.length} item{services.length === 1 ? "" : "s"}
      </span>
    </div>

    <ul className="space-y-2">
      {services.length > 0 ? (
        services.map((service, idx) => {
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

          if (service.type === "hotel") metaBadges.push("Stay included");
          if (service.type === "transfer") metaBadges.push("Transfer included");
          if (service.type === "activity" || service.type === "sightseeing") metaBadges.push("Experience included");

          return (
            <li key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3" style={{ borderLeft: `3px solid ${serviceTheme.borderColor}` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg ${serviceTheme.iconBg} flex items-center justify-center flex-shrink-0`}>
                    {service.type === "hotel" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    ) : service.type === "transfer" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
                      </svg>
                    ) : service.type === "activity" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20" /><path d="M2 12h20" /><circle cx="12" cy="12" r="9" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01L3.27 9.35l6.03-.88L12 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-gray-900 break-words">{service.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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
        <li className="text-center py-4 text-xs text-gray-400">No services provided</li>
      )}
    </ul>
  </div>
);

const QueryDetails = ({ query, onClose, onRefresh }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [quotes, setQuotes] = useState([]);
  const [expandedQuoteIds, setExpandedQuoteIds] = useState({});
  const [showQuoteHistory, setShowQuoteHistory] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [markupType, setMarkupType] = useState("PERCENT");
  const [markupValue, setMarkupValue] = useState("");
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionQuoteId, setRevisionQuoteId] = useState(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [acceptQuoteId, setAcceptQuoteId] = useState(null);
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);
  const [isClientApprovalModalOpen, setIsClientApprovalModalOpen] = useState(false);
  const [clientApprovalQuoteId, setClientApprovalQuoteId] = useState(null);
  const [clientApprovalSubmitting, setClientApprovalSubmitting] = useState(false);
  const [markupSubmittingId, setMarkupSubmittingId] = useState(null);
  const [sendSubmittingId, setSendSubmittingId] = useState(null);
  const [sendSuccessMeta, setSendSuccessMeta] = useState(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendQuoteId, setSendQuoteId] = useState(null);
  const [sendRecipientEmail, setSendRecipientEmail] = useState("");
  const [sendChannel, setSendChannel] = useState("EMAIL");
  const [sendRecipientPhone, setSendRecipientPhone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const nextQuotes = await fetchQuotationsByQuery(query._id);
        setQuotes(nextQuotes);
      } catch (err) {
        console.error("Error fetching quotations:", err);
      }
    };

    fetchQuotations();
  }, [query._id]);

  useEffect(() => {
    setExpandedQuoteIds((prev) => {
      const nextState = {};

      quotes.forEach((quote, index) => {
        if (!quote?._id) return;

        nextState[quote._id] =
          typeof prev[quote._id] === "boolean" ? prev[quote._id] : index === 0;
      });

      return nextState;
    });
  }, [quotes]);

  const updateQuote = (updatedQuote) => {
    setQuotes((prev) =>
      prev.map((q) => (q._id === updatedQuote._id ? updatedQuote : q)),
    );
  };

  const openMarkupModal = (quote) => {
    setActiveQuoteId(quote?._id || null);
    setMarkupType(quote?.agentMarkup?.type || "PERCENT");
    setMarkupValue(
      quote?.agentMarkup?.value ? String(quote.agentMarkup.value) : "",
    );
    setIsMarkupModalOpen(true);
  };

  const closeMarkupModal = () => {
    if (markupSubmittingId) return;
    setIsMarkupModalOpen(false);
    setActiveQuoteId(null);
    setMarkupType("PERCENT");
    setMarkupValue("");
  };

  const toggleQuoteVisibility = (quoteId) => {
    if (!quoteId) return;

    setExpandedQuoteIds((prev) => ({
      ...prev,
      [quoteId]: !prev[quoteId],
    }));
  };

  const openAcceptModal = (quoteId) => {
    setAcceptQuoteId(quoteId || null);
    setIsAcceptModalOpen(true);
  };

  const closeAcceptModal = () => {
    if (acceptSubmitting) return;
    setIsAcceptModalOpen(false);
    setAcceptQuoteId(null);
  };

  const openClientApprovalModal = (quoteId) => {
    setClientApprovalQuoteId(quoteId || null);
    setIsClientApprovalModalOpen(true);
  };

  const closeClientApprovalModal = () => {
    if (clientApprovalSubmitting) return;
    setIsClientApprovalModalOpen(false);
    setClientApprovalQuoteId(null);
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      setAcceptSubmitting(true);
      const res = await API.patch(`/agent/quotations/${quoteId}/accept`, {
        action: "ACCEPT",
      });
      toast.success("Quote accepted");
      updateQuote(res.data.quotation);
      setActiveQuoteId(quoteId);
      setIsAcceptModalOpen(false);
      setAcceptQuoteId(null);
    } catch (err) {

      toast.error(err.response?.data?.message || "Error");
    } finally {
      setAcceptSubmitting(false);
    }
  };

  const handleApplyMarkup = async (quote) => {
    const validationMessage = validateAgentMarkupInput({
      markupType,
      markupValue,
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      setMarkupSubmittingId(quote._id);
      const hadExistingMarkup =
        Number(quote?.agentMarkup?.markupAmount || 0) > 0 ||
        Number(quote?.agentMarkup?.value || 0) > 0;

      const res = await API.patch(`/agent/quotations/${quote._id}/accept`, {
        action: "APPLY_MARKUP",
        markupType,
        markupValue: Number(markupValue),
      });
      toast.success(hadExistingMarkup ? "Markup updated" : "Markup applied");
      updateQuote(res.data.quotation);
      const nextQuotes = await fetchQuotationsByQuery(query._id);
      setQuotes(nextQuotes);
      await onRefresh?.();
      setMarkupSubmittingId(null);
      closeMarkupModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to apply markup");
    } finally {
      setMarkupSubmittingId(null);
    }
  };

  const handleOpenSendModal = (quote) => {
    const savedBranding = getSavedAgentBranding({
      quote,
      user: currentUser,
    });

    setSendQuoteId(quote?._id || null);
    setSendRecipientEmail(String(query?.clientEmail || "").trim());
    setSendRecipientPhone(String(query?.clientPhone || "").trim());
    setSendChannel("EMAIL");
    setBrandName(savedBranding.name);
    setBrandLogoUrl(savedBranding.logo);
    setBrandLogoFile(null);
    setIsSendModalOpen(true);
  };

  const handleCloseSendModal = () => {
    setIsSendModalOpen(false);
    setSendQuoteId(null);
    setSendRecipientEmail("");
    setSendRecipientPhone("");
    setSendChannel("EMAIL");
    setBrandName("");
    setBrandLogoUrl("");
    setBrandLogoFile(null);
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

  const markQuoteSharedToClient = async (quote) => {
    const res = await API.patch(`/agent/quotations/${quote._id}/accept`, {
      action: "MARK_SHARED_TO_CLIENT",
    });

    if (res.data?.quotation) {
      updateQuote(res.data.quotation);
    }

    await onRefresh?.();
    return res.data;
  };

  const handleClientApproved = async (id) => {
    try {
      setClientApprovalSubmitting(true);
      const res = await API.put(`/agent/quotations/${id}/confirm`);
      toast.success("Client approval sent to operations");
      updateQuote(res.data.quotation);
      setIsClientApprovalModalOpen(false);
      setClientApprovalQuoteId(null);
      await onRefresh?.();
      onClose();
    } catch (err) {
      if (["SUPPLIER_RATE_CHANGED", "OUTDATED_QUOTATION"].includes(err.response?.data?.code)) {
        toast.error(
          err.response?.data?.message ||
          "Supplier rates have changed. Please review the quotation again.",
          { duration: 7000 },
        );
      } else {
        toast.error(err.response?.data?.message || "Unable to process booking");
      }
    } finally {
      setClientApprovalSubmitting(false);
    }
  };

  const getClientPdfUrl = async (quoteId) => {
    const { data } = await API.get(`/agent/quotations/${quoteId}/client-pdf`);
    const publicUrl = buildPublicAssetUrl(data?.pdf?.publicFilePath);

    if (!publicUrl) {
      throw new Error("Unable to prepare client PDF");
    }

    const separator = publicUrl.includes("?") ? "&" : "?";
    return `${publicUrl}${separator}v=${Date.now()}`;
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

  const activeQuote = selectedQuoteId
    ? quotes.find((q) => q._id === selectedQuoteId) || latestQuote
    : latestQuote;

  const bookingConfirmedAt =
    query.activityLog
      ?.slice()
      .reverse()
      .find((log) => log?.action === "Booking Confirmed")?.timestamp || null;

  const isQueryRejected =
    query.agentStatus === "Rejected" || query.opsStatus === "Rejected";
  const rejectionReason = String(query.rejectionNote || "").trim();

  const getDisplayAction = (action) => {
    if (action === "Query Received") return "Query Created";
    if (action === "Client Approved") return "Booking Processed";
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
      "Booking Processed": {
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
            className="rounded-xl px-3 py-2 hover:bg-gray-200 cursor-pointer "
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

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2 relative">
          {query.agentStatus === "Quote Sent" && quotes.length > 0 && (
            <span className="w-fit bg-green-200 text-green-700 px-3 py-2 rounded-full text-xs font-semibold">
              Quote Received
            </span>
          )}
          {query.agentStatus === "Client Approved" && (
            <span className="w-fit bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              Booking Processed
            </span>
          )}
          {query.agentStatus === "Pending" && (
            <span className="w-fit bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              Pending
            </span>
          )}
          {query.agentStatus === "Revision Requested" && (
            <span className="w-fit bg-red-400 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
              Revision Requested
            </span>
          )}
          {isQueryRejected && (
            <span className="w-fit rounded-full border border-rose-200 bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700">
              Rejected
            </span>
          )}
          {query.agentStatus === "Confirmed" && (
            <span className="w-fit bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              Booking Confirmed
            </span>
          )}

{/* History Toggle Trigger next to status badges */}
          {quotes.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuoteHistory(!showQuoteHistory)}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 shadow-sm hover:shadow-md ${
                  showQuoteHistory
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent text-white"
                    : "bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 border-transparent text-white"
                }`}
                title="Quotation History"
              >
                <Clock3 size={14} />
              </button>

              {/* Floating popover/dropdown history list */}
              <AnimatePresence>
                {showQuoteHistory && (
                  <>
                    {/* Invisible overlay backdrop to close dropdown when clicked outside */}
                    <div 
                      className="fixed inset-0 z-[998]"
                      onClick={() => setShowQuoteHistory(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-[24px] border border-sky-300/80 bg-gradient-to-b from-[#e0f2fe]/45 via-[#f0f9ff]/30 to-white/20 backdrop-blur-2xl p-4 shadow-[0_20px_50px_rgba(14,165,233,0.18)] z-[999] origin-top-right text-sky-950"
                    >
                      <div className="mb-3 pb-2 border-b border-sky-300/40 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900/80">
                          Quotation History
                        </span>
                        {selectedQuoteId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuoteId(null);
                              setShowQuoteHistory(false);
                            }}
                            className="px-2.5 py-1 rounded-full bg-sky-600/10 hover:bg-sky-600/25 border border-sky-400/30 text-sky-800 text-[9px] font-bold tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                          >
                            Reset to Latest
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5 no-scrollbar">
                        <style>{`
                          .no-scrollbar::-webkit-scrollbar {
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                            background: transparent !important;
                          }
                          .no-scrollbar {
                            -ms-overflow-style: none !important;
                            scrollbar-width: none !important;
                          }
                        `}</style>
                        {quotes.map((q, idx) => {
                          const qAttempt = quotes.length - idx;
                          const isCurrentActive = q._id === activeQuote._id;
                          return (
                            <button
                              key={q._id}
                              type="button"
                              onClick={() => {
                                setSelectedQuoteId(q._id);
                                setShowQuoteHistory(false);
                              }}
                              className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                                isCurrentActive
                                  ? "bg-emerald-500/12 hover:bg-emerald-500/18 border-emerald-400/40 text-emerald-950 font-semibold shadow-sm backdrop-blur-md"
                                  : "bg-white/45 hover:bg-white/70 border-white/40 hover:border-white/60 text-sky-950 shadow-sm hover:shadow backdrop-blur-sm"
                              }`}
                            >
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                                isCurrentActive
                                  ? "bg-emerald-200/60 text-emerald-800 border border-emerald-300/30"
                                  : "bg-sky-100/60 text-sky-800 border border-sky-200/30"
                              }`}>
                                {qAttempt}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[12px] font-bold text-sky-950">
                                    {q.quotationNumber || `QT-${1000 + qAttempt}`}
                                  </p>
                                  {idx === 0 && (
                                    <span className="rounded-full bg-emerald-200/60 border border-emerald-300/25 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-800 tracking-wider">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-sky-900/70 mt-0.5 leading-normal">
                                  {idx === 0
                                    ? "Most recent quotation"
                                    : idx === quotes.length - 1
                                      ? "Initial quotation"
                                      : `Revision Attempt ${qAttempt}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 p-2 sm:p-1 xl:grid-cols-3">
        {/* LEFT MAIN SECTION */}
        <div className="space-y-4 xl:col-span-2">
          {/* REJECTED UI */}
          {isQueryRejected && (
            <motion.div
              variants={itemVariant}
              className="relative overflow-hidden rounded-[28px] border border-rose-200 bg-gradient-to-br from-white via-rose-50/60 to-red-50 shadow-[0_12px_32px_rgba(244,63,94,0.08)]"
            >
              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                      <ShieldAlert size={12} />
                      Rejected by Operations
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      This query has been rejected by the operations team.
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                      Please review the rejection reason below before creating a new query or discussing changes with operations.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200/70">
                    <X size={24} />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-rose-100 bg-white/85 p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">
                    Rejection Reason
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                    {rejectionReason || "No rejection reason shared by operations."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* QUOTE SENT UI */}
          {["Quote Sent", "Client Approved"].includes(query.agentStatus) &&
            quotes.length > 0 && (() => {
              const activeIndex = selectedQuoteId
                ? quotes.findIndex((q) => q._id === selectedQuoteId)
                : 0;
              const index = activeIndex !== -1 ? activeIndex : 0;
              const quote = activeQuote;
              const normalizedQuoteStatus = String(quote?.status || "").trim();
              const isLatestQuote = index === 0;
              const showApprovedSummaryCard = query.agentStatus === "Client Approved";
              const showAcceptActions =
                isLatestQuote &&
                (normalizedQuoteStatus === "Quote Sent" ||
                  (!normalizedQuoteStatus && query.agentStatus === "Quote Sent"));
              const showMarkupActions = isLatestQuote && ["Quote Accepted", "Markup Applied"].includes(
                normalizedQuoteStatus,
              );
              const opsQuoteAmount = Number(
                quote?.pricing?.totalAmount ?? quote?.totalAmount ?? 0,
              );
              const markupAmount = Number(quote?.agentMarkup?.markupAmount || 0);
              const markupValueAmount = Number(quote?.agentMarkup?.value || 0);
              const finalQuoteAmount = Number(
                quote?.clientTotalAmount ?? opsQuoteAmount,
              );
              const quoteAttemptNumber = getQuoteAttemptNumber(index, quotes.length);
              const isFirstQuote = index === quotes.length - 1;
              const isQuoteExpanded =
                typeof expandedQuoteIds[quote._id] === "boolean"
                  ? expandedQuoteIds[quote._id]
                  : index === 0;
              const hasMarkup =
                markupAmount > 0 ||
                markupValueAmount > 0 ||
                finalQuoteAmount > opsQuoteAmount;
              const liveMarkupPreview = calculateAgentMarkupPreview({
                markupType,
                markupValue,
                opsTotal: opsQuoteAmount,
              });
              const markupRuleLabel = hasMarkup
                ? quote?.agentMarkup?.type === "PERCENT"
                  ? `${markupValueAmount}% added`
                  : `${formatMoney(markupValueAmount)} fixed markup`
                : "No markup added yet";

              return (
                <motion.div
                  key="quotation-panel-wrapper"
                  variants={itemVariant}
                  initial="hidden"
                  animate="visible"
                  className="rounded-[24px] p-5 bg-gradient-to-br from-white/12 via-white/5 to-sky-500/8 backdrop-blur-xl border border-white/20 shadow-md"
                >
                  {selectedQuoteId && (
                    <div className="mb-4 flex items-center justify-between rounded-xl bg-sky-50/90 border border-sky-200/80 px-4 py-2.5 shadow-sm">
                      <span className="text-xs font-medium text-sky-900">
                        Viewing quotation revision: <span className="font-bold text-sky-950">{quote.quotationNumber || `Attempt ${quotes.length - index}`}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteId(null)}
                        className="rounded-full bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 shadow-sm transition hover:shadow-md cursor-pointer"
                      >
                        Reset to Latest
                      </button>
                    </div>
                  )}
                  {showApprovedSummaryCard ? (
                    isLatestQuote ? (
                    <div className="overflow-hidden rounded-[24px] border border-indigo-200 bg-[linear-gradient(135deg,#eef2ff_0%,#f8faff_48%,#ffffff_100%)] shadow-[0_18px_45px_rgba(79,70,229,0.12)]">
                      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#4f46e5_0%,#6366f1_45%,#38bdf8_100%)]" />
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.28)]">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 ring-1 ring-indigo-100">
                                Booking Processed
                              </div>
                              <h3 className="mt-3 text-lg font-semibold leading-tight text-slate-900">
                                Booking processed. Amount and documents are next.
                              </h3>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                The quotation is approved. Please complete the payment amount and upload traveler documents to move this booking ahead smoothly.
                              </p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-indigo-100 bg-white/90 px-4 py-3 text-left shadow-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Next Stage
                            </p>
                            <p className="mt-1 text-sm font-semibold text-indigo-700">
                              Amount + Docs Pending
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <CreditCard size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Complete Amount</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  Proceed with the payment amount step when it becomes available in your booking workflow.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                                <FileCheck2 size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Upload Documents</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  Keep traveler documents ready so you can upload and finish the next compliance step quickly.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : null
                  ) : quote.status === "Confirmed" ? (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
                      <p className="text-sm font-medium text-indigo-700">
                        Booking confirmed successfully
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        The booking has moved ahead in the workflow. Track the next updates from your dashboard and active bookings.
                      </p>
                    </div>
                  ) : quote.status === "Sent to Client" ? (
                    <div className="overflow-hidden rounded-2xl border border-emerald-200 border-b-[5px] border-b-emerald-300/80 bg-white shadow-[0_15px_30px_-5px_rgba(0,0,0,0.18),_0_10px_20px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.22)]">
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
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
                              {isLatestQuote ? "Quote Sent" : "Previous Quote"}
                            </span>
                            {isLatestQuote && (
                              <button
                                type="button"
                                onClick={() => handleOpenSendModal(quote)}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black bg-black px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-900"
                              >
                                <Send size={13} className="text-white" />
                                Share Again
                              </button>
                            )}
                          </div>
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

                        {/* ✅ FIX: Action buttons — icons added */}
                        {isLatestQuote ? (
                          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center items-center mt-2">
                            <button
                              onClick={() => openRevisionModal(quote._id)}
                              className="w-full sm:w-48 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md hover:shadow-lg text-white text-xs font-semibold py-2.5 px-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                              <RotateCcw size={13} />
                              Request Revision
                            </button>
                            <button
                              onClick={() => openClientApprovalModal(quote._id)}
                              className="w-full sm:w-48 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg text-white text-xs font-semibold py-2.5 px-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                              <ThumbsUp size={13} />
                              Booking Processed
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-500">
                            Previous quotation
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                      <div className="mb-4 rounded-2xl bg-white/90 p-1">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {quote.quotationNumber || `Quotation ${quoteAttemptNumber}`}
                              </h3>
                              {isLatestQuote && (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                  Latest Quote
                                </span>
                              )}
                              {isFirstQuote && quotes.length > 1 && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  First Quote
                                </span>
                              )}
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                Attempt {quoteAttemptNumber} of {quotes.length}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {isLatestQuote
                                ? "Most recent quotation shared by operations."
                                : isFirstQuote
                                  ? "Initial quotation shared by operations."
                                  : "Previous quotation revision from operations."}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleQuoteVisibility(quote._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            {isQuoteExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                            {isQuoteExpanded ? "Hide Details" : "Show Details"}
                          </button>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-out ${
                            isQuoteExpanded
                              ? "mt-4 max-h-[6000px] translate-y-0 opacity-100"
                              : "max-h-0 -translate-y-2 opacity-0 pointer-events-none"
                          }`}
                        >
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-slate-50 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Ops Quote Amount
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-900">
                                {formatMoney(opsQuoteAmount)}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                Base quotation before markup
                              </p>
                            </div>

                            <div className="rounded-2xl border border-sky-200 border-l-4 border-l-sky-500 bg-sky-50 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
                                Agent Markup
                              </p>
                              <p className="mt-1 text-lg font-semibold text-sky-900">
                                {formatMoney(markupAmount)}
                              </p>
                              <p className="mt-1 text-[11px] text-sky-700">
                                {markupRuleLabel}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                                Final Quote Amount
                              </p>
                              <p className="mt-1 text-lg font-semibold text-emerald-900">
                                {formatMoney(finalQuoteAmount)}
                              </p>
                              <p className="mt-1 text-[11px] text-emerald-700">
                                Amount after agent pricing
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
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

                            <QuoteServiceListCard services={quote.services || []} />

                            <div className="mb-4 grid gap-4 lg:grid-cols-2 text-xs">
                              <QuoteInfoListCard
                                title="Inclusions"
                                items={quote.inclusions}
                                tone="emerald"
                                emptyLabel="No inclusions provided"
                                icon={<CheckCircle2 size={14} />}
                              />
                              <QuoteInfoListCard
                                title="Exclusions"
                                items={quote.exclusions}
                                tone="rose"
                                emptyLabel="No exclusions provided"
                                icon={<X size={14} />}
                              />
                            </div>

                            {quote.dayWiseItinerary?.length > 0 && (
                              <QuoteDayWiseItineraryCard
                                items={quote.dayWiseItinerary}
                                startDate={query.startDate}
                              />
                            )}

                            {quote.additionalNotes?.length > 0 && (
                              <div className="mb-4">
                                <QuoteInfoListCard
                                  title="Important Notes"
                                  items={quote.additionalNotes}
                                  tone="sky"
                                  emptyLabel="No important notes provided"
                                  icon={<FileCheck2 size={14} />}
                                />
                              </div>
                            )}
                            <QuoteSellerBankDetailsCard />
                            <QuoteTermsAndConditionsCard />
                            <div className="flex flex-col items-center gap-3 pt-2">
                             {/* ✅ FIX: Accept / Request Revision buttons — icons added */}
                             {showAcceptActions && (
                               <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3 justify-center items-center">
                                 <button
                                   onClick={() => openAcceptModal(quote._id)}
                                   className="w-full sm:w-48 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                 >
                                   <CheckCircle2 size={13} />
                                   Accept Quote
                                 </button>
                                 <button
                                   onClick={() => openRevisionModal(quote._id)}
                                   className="w-full sm:w-48 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                                 >
                                   <RotateCcw size={13} />
                                   Request Revision
                                 </button>
                               </div>
                             )}

                             {showMarkupActions && (
                               <div className="mt-3 flex w-[600px] flex-col gap-3 sm:flex-row">
                                 <ActionPillButton
                                   label="Add Markup"
                                   icon={<Sparkles size={14} />}
                                   tone="sky"
                                   className="flex-1"
                                   onClick={() => openMarkupModal(quote)}
                                 />
                                 <ActionPillButton
                                   label={
                                     sendSubmittingId === quote._id
                                       ? "Preparing email..."
                                       : "Send to Client"
                                   }
                                   icon={<Mail size={14} />}
                                   tone="rose"
                                   className="flex-1"
                                   onClick={() => handleOpenSendModal(quote)}
                                   disabled={sendSubmittingId === quote._id}
                                 />
                               </div>
                             )}
                           </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MARKUP MODAL */}
                    {isMarkupModalOpen &&
                      activeQuoteId === quote._id &&
                      showMarkupActions &&
                      createPortal(
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px]"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative border border-slate-200"
                          >
                            <button
                              onClick={closeMarkupModal}
                              className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>

                            <div className="mb-4">
                              <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                                  <Sparkles size={18} />
                                </span>
                                <h2 className="text-lg font-semibold text-slate-900">
                                  Apply Agent Markup
                                </h2>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Agent markup is optional. If you prefer, you can also send the ops quote directly to the client.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="grid gap-3 grid-cols-3">
                                <div className="flex min-h-[70px] flex-col rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-slate-50 px-3 py-2.5">
                                  <p className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                    Ops Amount
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {formatMoney(opsQuoteAmount)}
                                  </p>
                                </div>
                                <div className="flex min-h-[70px] flex-col rounded-2xl border border-sky-200 border-l-4 border-l-sky-500 bg-sky-50 px-3 py-2.5">
                                  <p className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.1em] text-sky-600">
                                    Markup Added
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-sky-900">
                                    {formatMoney(liveMarkupPreview.markupAmount)}
                                  </p>
                                </div>
                                <div className="flex min-h-[70px] flex-col rounded-2xl border border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50 px-3 py-2.5">
                                  <p className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-600">
                                    Final Amount
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                                    {formatMoney(liveMarkupPreview.finalAmount)}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-700">
                                  Markup Type
                                </label>
                                <select
                                  value={markupType}
                                  onChange={(e) => {
                                    setMarkupType(e.target.value);
                                    setMarkupValue("");
                                  }}
                                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                >
                                  <option value="PERCENT">Percentage (%)</option>
                                  <option value="AMOUNT">Fixed Amount (INR)</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-medium text-slate-700">
                                  Markup Value
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step={markupType === "PERCENT" ? "0.01" : "1"}
                                  value={markupValue}
                                  onChange={(e) => setMarkupValue(e.target.value)}
                                  placeholder={
                                    markupType === "PERCENT"
                                      ? "Enter markup percentage"
                                      : "Enter fixed markup amount"
                                  }
                                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed">
                                This will add <span className="font-semibold text-slate-900">{formatMoney(liveMarkupPreview.markupAmount)}</span> and
                                update the client-facing amount to{" "}
                                <span className="font-semibold text-slate-900">
                                  {formatMoney(liveMarkupPreview.finalAmount)}
                                </span>
                                .
                              </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={closeMarkupModal}
                                disabled={markupSubmittingId === quote._id}
                                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyMarkup(quote)}
                                disabled={markupSubmittingId === quote._id}
                                className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                              >
                                {markupSubmittingId === quote._id ? "Applying..." : "Apply Markup"}
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>,
                        document.body
                      )}

                </motion.div>
              );
            })()}

          {/* PENDING UI */}
          {query.agentStatus === "Pending" && (
            <motion.div
              variants={itemVariant}
              className="relative overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-50 shadow-sm"
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-amber-200/30 blur-2xl" />
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

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

          {/* REVISION REQUESTED UI */}
          {query.agentStatus === "Revision Requested" && (
            <motion.div
              variants={itemVariant}
              className="relative overflow-hidden rounded-[28px] border border-rose-200 bg-gradient-to-br from-white via-rose-50/40 to-orange-50/20 shadow-[0_12px_32px_rgba(244,63,94,0.06)]"
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-rose-200/30 blur-2xl pointer-events-none" />
              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                      <RotateCcw size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
                      Revision In Progress
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Quotation sent back to operations for revision
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                      Operations team has received the change request. A revised version of the travel quotation will appear here immediately once they update it.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-200/70">
                    <RotateCcw size={24} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.5fr_1.1fr]">
                  <div className="rounded-2xl border border-rose-100/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">
                      Revision Instructions
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-700 leading-relaxed italic">
                      "{query.rejectionNote || "Awaiting the revised quotation details from operations."}"
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Ops Action Status
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-xs font-semibold text-slate-700">Rebuilding Quotation...</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-100/50 bg-rose-50/30 px-4 py-3 text-xs leading-relaxed text-slate-600">
                  <ShieldAlert size={16} className="mt-0.5 text-rose-500 shrink-0" />
                  <p>
                    No immediate action is required from you. The operations team is working on this quotation, and it will be updated shortly.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* IN PROGRESS UI */}
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

          {/* CONFIRMED UI */}
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
                        ? `₹${(latestQuote.clientTotalAmount ?? latestQuote.pricing?.totalAmount ?? 0).toLocaleString("en-IN")}`
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

          {/* REQUIREMENTS */}
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
              <p className="text-gray-700 mb-2">Preferences</p>
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


        {/* RIGHT ACTIVITY LOG */}
        <motion.div
          variants={itemVariant}
          className="border border-gray-200 shadow-sm rounded-2xl p-5 h-fit"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
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



      {/* ACCEPT MODAL */}
      <AnimatePresence>
        {isAcceptModalOpen && acceptQuoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm rounded-[24px] border border-emerald-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Accept Quote
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    Confirm this quotation?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This will mark the ops quotation as accepted so you can continue with markup or client sharing.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAcceptModal}
                  disabled={acceptSubmitting}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptQuote(acceptQuoteId)}
                  disabled={acceptSubmitting}
                  className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {acceptSubmitting ? "Accepting..." : "Yes, Accept"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* CLIENT APPROVAL MODAL */}
      <AnimatePresence>
        {isClientApprovalModalOpen && clientApprovalQuoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm rounded-[24px] border border-slate-100 bg-white p-5 shadow-2xl"
            >
              {(() => {
                const approvedQuote = quotes.find((item) => item._id === clientApprovalQuoteId);
                const approvedAmount =
                  approvedQuote?.clientTotalAmount ??
                  approvedQuote?.pricing?.totalAmount ??
                  0;
                const travelerCounts = getQueryTravelerCounts(query);

                return (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50/70 text-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
                        <ThumbsUp size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          Booking Processed
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-900 leading-tight">
                          Confirm booking processed?
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                          Operations will be notified to transition this booking to the next stage.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Destination
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                          {query.destination || "Trip"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Travelers
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                          {travelerCounts.adults} Adults, {travelerCounts.children} Kids
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 col-span-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Travel Dates
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-800 whitespace-nowrap">
                          {formatDisplayDate(query.startDate) || "-"} - {formatDisplayDate(query.endDate) || "-"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 col-span-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Approved Amount
                        </p>
                        <p className="mt-0.5 text-base font-extrabold bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {formatMoney(approvedAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/30 p-2.5 text-center">
                      <p className="text-[10px] leading-relaxed text-slate-500">
                        Ops & finance will continue the booking workflow. Confirm only if approved.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closeClientApprovalModal}
                        disabled={clientApprovalSubmitting}
                        className="rounded-full bg-gradient-to-r from-[#1e293b] to-[#0f172a] hover:from-[#0f172a] hover:to-black text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientApproved(clientApprovalQuoteId)}
                        disabled={clientApprovalSubmitting}
                        className="rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-5 py-2 text-xs font-bold shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {clientApprovalSubmitting ? "Sending..." : "Yes, Booking Processed"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* SEND MODAL */}
      <AnimatePresence>
        {isSendModalOpen && sendQuoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-8 md:py-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-[400px] max-h-[85vh] md:max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-[#d9e5f2] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            >
              <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_52%,#ffffff_100%)] px-5 py-3.5 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#162033] text-white shadow-sm">
                      <Mail size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Send Quotation
                      </p>
                      <h3 className="mt-0.5 text-[17px] font-semibold leading-none text-slate-900">
                        Share with client
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseSendModal}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="px-5 py-4 overflow-y-auto flex-1 hide-scrollbar space-y-4">
                {/* BRANDING SECTION */}
                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-blue-600 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-800">
                      Agent Branding
                    </span>
                  </div>
                  <p className="mb-3 text-[11px] leading-5 text-slate-500">
                   Save your branding here for the first time. After that, it will be automatically used in every quotation, email, and PDF.

                  </p>
                  
                  <div className="space-y-3">
                    {/* Branding Name Input */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Branding Name
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Enter your branding/company name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-400"
                      />
                    </div>

                    {/* Brand Logo File Upload */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Brand Logo
                      </label>
                      
                      {brandLogoFile || brandLogoUrl ? (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                            <img
                              src={brandLogoFile ? URL.createObjectURL(brandLogoFile) : brandLogoUrl}
                              alt="Brand Logo Preview"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">
                              {brandLogoFile ? brandLogoFile.name : "Saved Logo"}
                            </p>
                            <p className="text-[10px] text-slate-400">Ready to use</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBrandLogoFile(null);
                              setBrandLogoUrl("");
                            }}
                            className="rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center hover:bg-slate-50 hover:border-blue-300 transition duration-150">
                          <span className="mb-1 rounded-full bg-slate-50 p-1.5 text-slate-500">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              ></path>
                            </svg>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            Click to upload logo
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">
                            Max size 5MB
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setBrandLogoFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSendChannel("EMAIL")}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-2 text-left transition ${
                      sendChannel === "EMAIL"
                        ? "border-[#162033] bg-[#162033] text-white shadow-[0_12px_30px_rgba(15,23,42,0.24)]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${
                        sendChannel === "EMAIL"
                          ? "border-white/15 bg-white/10 text-white"
                          : "bg-[#2563eb] text-white shadow-[0_4px_10px_rgba(37,99,235,0.18)]"
                      }`}
                    >
                      <Mail size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${sendChannel === "EMAIL" ? "text-white" : "text-slate-900"}`}>Email</span>
                      <span className={`mt-0.5 block text-[11px] leading-4 ${sendChannel === "EMAIL" ? "text-slate-300" : "text-slate-500"}`}>Send quotation directly to client inbox</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendChannel("WHATSAPP")}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-2 text-left transition ${
                      sendChannel === "WHATSAPP"
                        ? "border-[#162033] bg-[#162033] text-white shadow-[0_12px_30px_rgba(15,23,42,0.24)]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${
                        sendChannel === "WHATSAPP"
                          ? "border border-white/15 bg-white/10 text-white"
                          : "bg-[#16a34a] text-white"
                      }`}
                    >
                      <FaWhatsapp size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${sendChannel === "WHATSAPP" ? "text-white" : "text-slate-900"}`}>WhatsApp</span>
                      <span className={`mt-0.5 block text-[11px] leading-4 ${sendChannel === "WHATSAPP" ? "text-slate-300" : "text-slate-500"}`}>Open WhatsApp with quotation text ready to share</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendChannel("PDF")}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-2 text-left transition ${
                      sendChannel === "PDF"
                        ? "border-[#162033] bg-[#162033] text-white shadow-[0_12px_30px_rgba(15,23,42,0.24)]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${
                        sendChannel === "PDF"
                          ? "border-white/15 bg-white/10 text-white"
                          : "bg-[#f59e0b] text-white shadow-[0_4px_10px_rgba(245,158,11,0.2)]"
                      }`}
                    >
                      <Download size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${sendChannel === "PDF" ? "text-white" : "text-slate-900"}`}>PDF Download</span>
                      <span className={`mt-0.5 block text-[11px] leading-4 ${sendChannel === "PDF" ? "text-slate-300" : "text-slate-500"}`}>Download the quotation PDF in the same client format</span>
                    </span>
                  </button>
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {sendChannel === "EMAIL" ? (
                    <motion.div
                      key="send-email-input"
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2.5">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#2563eb] text-white shadow-[0_4px_10px_rgba(37,99,235,0.18)]">
                            <Mail size={12} />
                          </span>
                          Client Email
                        </label>
                        <input
                          type="email"
                          value={sendRecipientEmail}
                          onChange={(e) => setSendRecipientEmail(e.target.value)}
                          placeholder="Enter client email"
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                      </div>
                    </motion.div>
                  ) : sendChannel === "WHATSAPP" ? (
                    <motion.div
                      key="send-whatsapp-input"
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2.5">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#22c55e] text-white shadow-[0_4px_10px_rgba(34,197,94,0.18)]">
                            <FaWhatsapp size={12} />
                          </span>
                          WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          value={sendRecipientPhone}
                          onChange={(e) => setSendRecipientPhone(e.target.value)}
                          placeholder="Enter WhatsApp number"
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="mt-2.5 rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600">
                      {sendChannel === "EMAIL" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#2563eb] text-white shadow-[0_4px_10px_rgba(37,99,235,0.18)]">
                          <Mail size={12} />
                        </span>
                      ) : sendChannel === "WHATSAPP" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#00C65B] text-white shadow-[0_4px_10px_rgba(34,197,94,0.18)]">
                          <FaWhatsapp size={12} />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#f59e0b] text-white shadow-[0_4px_10px_rgba(245,158,11,0.2)]">
                          <Download size={12} />
                        </span>
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">What will happen</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        {sendChannel === "EMAIL"
                          ? "Travel services, inclusions, validity, and final quotation amount will be sent in a clean email summary."
                          : sendChannel === "WHATSAPP"
                            ? "WhatsApp will open with the quotation text ready to share with the client."
                            : "A clean quotation PDF will be downloaded in the same client format for manual sharing."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/90 backdrop-blur-sm px-5 py-3.5 shrink-0 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCloseSendModal}
                    className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const selectedQuote = quotes.find((item) => item._id === sendQuoteId);
                      if (selectedQuote) {
                        const savedBranding = getSavedAgentBranding({
                          quote: selectedQuote,
                          user: currentUser,
                        });
                        const effectiveBrandName = String(
                          brandName || savedBranding.name || currentUser?.companyName || "",
                        ).trim();
                        const effectiveBrandLogo = String(
                          brandLogoUrl || savedBranding.logo || "",
                        ).trim();
                        const shouldPersistBranding =
                          Boolean(brandLogoFile) ||
                          effectiveBrandName !== String(selectedQuote?.agentBrandingName || "").trim() ||
                          effectiveBrandLogo !== String(selectedQuote?.agentLogo || "").trim();

                        if (!effectiveBrandName) {
                          return toast.error("Please enter your Branding Name");
                        }
                        if (!brandLogoFile && !effectiveBrandLogo) {
                          return toast.error("Please upload your Brand Logo once");
                        }

                        try {
                          setIsSavingBranding(true);
                          setSendSubmittingId(selectedQuote._id);
                          let updatedQuote = {
                            ...selectedQuote,
                            agentBrandingName: effectiveBrandName,
                            agentLogo: brandLogoFile ? selectedQuote?.agentLogo || "" : effectiveBrandLogo,
                          };

                          if (shouldPersistBranding) {
                            const formData = new FormData();
                            formData.append("agentBrandingName", effectiveBrandName);
                            if (brandLogoFile) {
                              formData.append("agentLogo", brandLogoFile);
                            } else {
                              formData.append("agentLogoUrl", effectiveBrandLogo);
                            }

                            const brandRes = await API.patch(
                              `/agent/quotations/${selectedQuote._id}/branding`,
                              formData,
                              {
                                headers: { "Content-Type": "multipart/form-data" },
                              }
                            );

                            updateQuote(brandRes.data.quotation);
                            if (brandRes.data?.user) {
                              dispatch(updateUserProfileLocal(brandRes.data.user));
                            }
                            updatedQuote = brandRes.data.quotation;
                          } else {
                            updateQuote(updatedQuote);
                          }

                          if (sendChannel === "EMAIL") {
                            await handleSendToClient(updatedQuote, sendRecipientEmail);
                          } else if (sendChannel === "WHATSAPP") {
                            const num = String(sendRecipientPhone).replace(/\D/g, "");
                            if (!num) return toast.error("Enter a valid number");
                            
                            const msg = buildClientWhatsAppQuotationMessage({
                              query,
                              quote: updatedQuote,
                            });
                            window.open(
                              `https://wa.me/${num.length === 10 ? `91${num}` : num}?text=${encodeURIComponent(msg)}`,
                              "_blank",
                            );
                            await markQuoteSharedToClient(updatedQuote);
                            setIsSendModalOpen(false);
                          } else if (sendChannel === "PDF") {
                            const pdfWindow = window.open("", "_blank");
                            try {
                              const pdfUrl = await getClientPdfUrl(updatedQuote._id);
                              pdfWindow?.location?.replace(pdfUrl);
                              await markQuoteSharedToClient(updatedQuote);
                              setIsSendModalOpen(false);
                            } catch (error) {
                              pdfWindow?.close();
                              throw error;
                            }
                          }
                        } catch (error) {
                          toast.error(
                            error?.response?.data?.message ||
                              error?.message ||
                              "Unable to save branding or share quotation"
                          );
                        } finally {
                          setIsSavingBranding(false);
                          setSendSubmittingId(null);
                        }
                      }
                    }}
                    disabled={sendSubmittingId === sendQuoteId || isSavingBranding}
                    className="rounded-full bg-[#162033] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sendSubmittingId === sendQuoteId ? "Sharing..." : "Share"}
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>




      {/*-------------------- SEND SUCCESS MODAL------------------------------ */}
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
              className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-2xl"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />
              <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-sky-200/30 blur-3xl" />

              <div className="relative border-b border-emerald-50 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_45%,#eff6ff_100%)] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md">
                      <Send size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Delivered
                      </p>
                      <h3 className="mt-0.5 text-base font-bold text-slate-900 leading-tight">
                        Quotation Shared!
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendSuccessMeta(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  A dynamic quotation summary has been shared with travel dates, services, and final amount.
                </p>
              </div>

              <div className="relative px-5 py-4">
                <div className="grid gap-2 grid-cols-3">
                  {/* Recipient Email Row (Full width) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 col-span-3 text-left">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recipient</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 break-all select-all">
                      {sendSuccessMeta.recipientEmail || "Registered email"}
                    </p>
                  </div>
                  
                  {/* 3 cards side-by-side */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-1 py-2 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Quotation</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                      {sendSuccessMeta.quotationNumber || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-1 py-2 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Destination</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800 truncate">
                      {sendSuccessMeta.destination || query.destination}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-1 py-2 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Client Total</p>
                    <p className="mt-0.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                      {formatMoney(sendSuccessMeta.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 rounded-xl border border-emerald-50 bg-emerald-50/30 px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-emerald-700 bg-emerald-100/60 rounded px-1.5 py-0.5">
                      {sendSuccessMeta.serviceCount} services
                    </span>
                    <span>•</span>
                    <span>Valid till {sendSuccessMeta.validTill || "-"}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSendSuccessMeta(null)}
                    className="rounded-full bg-gradient-to-r from-[#1e293b] to-[#0f172a] hover:from-[#0f172a] hover:to-black text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Stay Here
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSendSuccessMeta(null);
                      onClose?.();
                    }}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Back to Queries
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* REVISION MODAL */}
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
              className="w-full max-w-sm rounded-[24px] border border-slate-100 bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-500 to-[#ea580c] bg-clip-text text-transparent">
                    Revision Request
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900 leading-tight">
                    Send back to operations
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    Add the client's requested changes below. Operations will be notified to revise the quotation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsRevisionModalOpen(false);
                    setRevisionReason("");
                    setRevisionQuoteId(null);
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                >
                  Close
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-700">
                  Revision details
                </label>
                <textarea
                  rows={3}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="Example: Client wants hotel option near city center, lower total budget, and airport transfer included."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setIsRevisionModalOpen(false);
                    setRevisionReason("");
                    setRevisionQuoteId(null);
                  }}
                  className="rounded-full bg-gradient-to-r from-[#1e293b] to-[#0f172a] hover:from-[#0f172a] hover:to-black text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestRevision}
                  disabled={revisionSubmitting}
                  className="rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white px-5 py-2 text-xs font-bold shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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
