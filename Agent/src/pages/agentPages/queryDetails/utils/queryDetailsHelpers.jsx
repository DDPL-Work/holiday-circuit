import API from "../../../../utils/Api.js";

export const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export const formatMoney = (value) =>
  `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export const formatDisplayDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const buildPublicAssetUrl = (assetPath = "") => {
  const normalizedPath = String(assetPath || "").trim();
  if (!normalizedPath) return "";

  const apiBaseUrl = String(API.defaults.baseURL || window.location.origin);
  const originBase = apiBaseUrl.replace(/\/api\/?$/, "");
  return new URL(normalizedPath.replace(/^\//, ""), `${originBase}/`).toString();
};

export const getOrdinalSuffix = (value) => {
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

export const getPackageNightCount = (pkg = {}) => {
  const durationMatch = String(pkg?.duration || "").match(/(\d+)\s*nights?/i);
  if (durationMatch) return Math.max(1, Number(durationMatch[1]));

  const totalDays = Number(pkg?.days || 0);
  return totalDays > 1 ? totalDays - 1 : 1;
};

export const buildItineraryDayLabel = (dayNumber, startDate) => {
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

export const getRelativeTimeString = (dateInput) => {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return "Recently";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return `on ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

export const formatUsageLabel = (value = "") =>
  String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatServiceTypeLabel = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getServiceDescriptionBits = (description = "") =>
  String(description || "")
    .split(/[|,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);



export const SELLER_BANK_DETAILS = [
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
];



export const QUOTATION_TERMS = [
  "Welcome to Holiday Circuit. These Terms & Conditions govern your travel booking and services.",
  "Services include travel planning, packages, transfers (Private & Shared - wait up to 30 mins), hotels & visa assistance.",
  "Booking & Payment: 25% non-refundable advance to confirm. Full payment required 30 days before departure.",
  "Cancellations: 25% (30 days before), 50% (29-16 days), 75% (15-8 days), 100% (within 7 days). Refunds in 15 days.",
  "Changes & Modifications: Administrative/service fees apply for client-requested itinerary changes.",
  "Travel Documents: Passport, visa & health documentation compliance is the client's sole responsibility.",
  "Health & Safety: Medical conditions must be declared in advance; compliance with safety rules is mandatory.",
  "Liability: Holiday Circuit acts as an intermediary for airlines, hotels & transporters.",
  "Accommodation Policies: Standard check-in 14:00-15:00 Hrs, check-out 11:00-12:00 Hrs.",
  "Travel Insurance: Highly recommended for medical, cancellation & personal loss coverage.",
  "Intellectual Property & Privacy: Personal data is protected and used solely for booking purposes.",
  "Governing Law: All disputes subject to New Delhi Jurisdiction only.",
  "Force Majeure: Not liable for delays/cancellations due to natural disasters, weather, or emergencies.",
  "Contact: Holiday Circuit, 2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058 | ops@holidaycircuit.com | +91 8851346665.",
  "By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
];





export const formatAmountValue = (value) =>
  Math.round(Number(value || 0)).toLocaleString("en-IN");

export const parseShareDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};



export const formatShareDate = (
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

export const formatShareActivityDate = (value) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "";

  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "short" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });
  const year = String(parsed.getFullYear()).slice(-2);

  return `${weekday}, ${parsed.getDate()}${getOrdinalSuffix(parsed.getDate())} ${month}'${year}`;
};

export const formatShareItineraryDate = (value) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "";

  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "long" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });

  return `${weekday} ${parsed.getDate()}${getOrdinalSuffix(parsed.getDate())} ${month}, ${parsed.getFullYear()}`;
};

export const addDaysToShareDate = (value, daysToAdd = 0) => {
  const parsed = parseShareDate(value);
  if (!parsed) return "";

  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString();
};

export const getShareDateDiff = (startDate, endDate) => {
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

export const getDurationMeta = (query = {}) => {
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

export const getClientRecipientName = (query = {}) => {
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

export const getQueryTravelerCounts = (query = {}) => {
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

export const buildClientTravelerSummary = (query = {}) => {
  const { adults, children } = getQueryTravelerCounts(query);
  const travelers = [];

  if (adults > 0) travelers.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
  if (children > 0) travelers.push(`${children} ${children === 1 ? "Child" : "Children"}`);

  return travelers.join(", ") || "Traveler details pending";
};

export const normalizeShareServiceType = (value = "") => {
  const normalizedType = String(value || "").trim().toLowerCase();
  if (normalizedType === "car" || normalizedType === "transport") return "transfer";
  return normalizedType;
};

export const inferSharingLabel = (services = []) => {
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

export const buildClientServiceQuantityLabel = (service = {}) => {
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

  if (normalizedType === "activity") {
    if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
    if (service?.transferType) details.push(service.transferType);
    return details.join(" | ");
  }

  return "";
};

export const DEFAULT_SELLER_BANK_DETAILS = [
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
];

export const TRANSPORT_USAGE_LABELS = {
  "inter-hotel-transfer": "Inter Hotel Transfer",
  "one-way-airport-transfer": "One Way / Airport Transfer",
  "full-day": "Full Day",
  "half-day": "Half Day",
  "round-trip": "Round Trip",
  "point-to-point": "One Way / Airport Transfer",
  "disposal-full-day": "Full Day Disposal",
  "disposal-half-day": "Half Day Disposal",
  "airport-pick-and-drop": "Airport Pick & Drop",
};

export const TRANSPORT_USAGE_LIMIT_LABELS = {
  "full-day-80-km": "80 km / 8 hours",
  "full-day-100-km": "100 km / 10 hours",
  "half-day-4-hours": "40 km / 4 hours",
  "half-day-40-km": "40 km / 4 hours",
  "disposal-full-day": "8 Hours / 80 Km included",
  "disposal-half-day": "4 Hours / 40 Km included",
  "point-to-point": "Point to point route transfer",
  "airport-pick-and-drop": "One-way airport transfer",
};

export const normalizeTransportUsageOptionKeyForQuote = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return "";
  if (normalizedValue.includes("inter hotel") || normalizedValue.includes("inter-hotel")) return "inter-hotel-transfer";
  if (normalizedValue.includes("airport") || normalizedValue.includes("one way") || normalizedValue.includes("one-way")) return "one-way-airport-transfer";
  if (normalizedValue.includes("full")) return "full-day";
  if (normalizedValue.includes("half")) return "half-day";
  if (normalizedValue.includes("round") || normalizedValue.includes("two way")) return "round-trip";
  if (normalizedValue.includes("point")) return "point-to-point";
  return normalizedValue;
};

export const getTransportUsageDisplayLabelForQuote = (service = {}) => {
  const key = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );

  return (
    service?.transportUsageLabel ||
    TRANSPORT_USAGE_LABELS[key] ||
    String(service?.usageType || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

export const getTransportLimitLabelForQuote = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );
  const limitKeys = String(service?.transportUsageLimitOptionKey || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const explicitLimitLabel = limitKeys
    .map((key) => TRANSPORT_USAGE_LIMIT_LABELS[key])
    .filter(Boolean)[0];

  if (explicitLimitLabel) return explicitLimitLabel;
  if (TRANSPORT_USAGE_LIMIT_LABELS[optionKey]) return TRANSPORT_USAGE_LIMIT_LABELS[optionKey];

  return "";
};

export const validateAgentMarkupInput = ({ markupType, markupValue }) => {
  const normalizedType = String(markupType || "").trim().toUpperCase();
  const normalizedValue = Number(markupValue);

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return "Please enter a valid markup value.";
  }

  if (["PERCENT", "AMOUNT"].includes(normalizedType)) return "";

  return "Please select a valid markup type.";
};

export const calculateAgentMarkupPreview = ({ markupType, markupValue, opsTotal }) => {
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

export const fetchQuotationsByQuery = async (queryId) => {
  const res = await API.get(`/agent/quotations/query/${queryId}`);
  return (res.data.quotations || []).filter(
    (quotation) => String(quotation?.status || "").trim() !== "Pending",
  );
};

export const getSavedAgentBranding = ({ quote = {}, user = null }) => {
  const rawName = String(
    user?.brandingName ||
    user?.companyName ||
    user?.agencyName ||
    quote?.agentBrandingName ||
    quote?.agencyName ||
    ""
  ).trim();

  const name = rawName || "Holiday Circuit";
  const logo = String(
    user?.brandingLogo ||
    user?.brandLogoUrl ||
    user?.logo ||
    quote?.agentLogo ||
    ""
  ).trim();

  return {
    name,
    logo,
    phone: String(user?.phone || user?.companyPhone || quote?.agentPhone || "+91-8851346665").trim(),
    email: String(user?.email || user?.companyEmail || quote?.agentEmail || "ops@holidaycircuit.com").trim(),
    address: String(user?.companyAddress || user?.address || quote?.agentAddress || "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Near UK Nursing Home, New Delhi, Delhi, India - 110018").trim(),
  };
};



