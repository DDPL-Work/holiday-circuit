import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Mail,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaStar, FaWater } from "react-icons/fa";
import { GiCityCar, GiModernCity, } from "react-icons/gi";
import { FaCarSide } from "react-icons/fa";
import { MdKingBed, MdOutlineTravelExplore } from "react-icons/md";
import { BsPeople } from "react-icons/bs";
import { HiOutlineBriefcase } from "react-icons/hi";
import { IoStarSharp } from "react-icons/io5";
import { LiaHotelSolid } from "react-icons/lia";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation } from "react-router-dom";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import QuickAddServiceModal from "../../modal/QuickAddServiceModal";
import PackageTemplate from "./PackageTemplate";
import { ImLocation2 } from "react-icons/im";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const pageShellVariants = {
hidden: { opacity: 0 },
visible: {
opacity: 1,
transition: {
staggerChildren: 0.12,
delayChildren: 0.06,
},
},
};

const sectionRevealVariants = {
hidden: {
opacity: 0,
x: -28,
},
visible: {
opacity: 1,
x: 0,
transition: {
duration: 0.4,
ease: "easeOut",
},
},
};

const sideStackVariants = {
hidden: {},
visible: {
transition: {
staggerChildren: 0.1,
},
},
};

const rightCardVariants = {
hidden: {
opacity: 0,
x: 28,
},
visible: {
opacity: 1,
x: 0,
transition: {
duration: 0.4,
ease: "easeOut",
},
},
};

const serviceCardVariants = {
hidden: {
opacity: 0,
x: -24,
},
visible: (index = 0) => ({
opacity: 1,
x: 0,
transition: {
duration: 0.32,
delay: Math.min(index * 0.04, 0.28),
ease: "easeOut",
},
}),
};

const FlyingInvoiceIcon = ({ animate = false, busy = false }) => {
const orbitDuration = busy ? 1.15 : 2.2;

return (
<span className="relative flex h-10 w-10 items-center justify-center">
  {animate ? (
  <>
    <motion.span className="absolute inset-[4px] rounded-full border border-black/15 border-dashed"
      animate={{ rotate: 360, opacity: [0.45, 0.75, 0.45] }} transition={{
              rotate: {
                duration: orbitDuration,
                repeat: Infinity,
                ease: "linear",
              },
              opacity: {
                duration: orbitDuration,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }} />
    <motion.span className="absolute inset-[11px] rounded-full bg-black/10"
      animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.24, 0.42, 0.24] }} transition={{
              duration: orbitDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }} />
    <motion.span className="absolute inset-0" animate={{ rotate: 360 }} transition={{
              duration: orbitDuration,
              repeat: Infinity,
              ease: "linear",
            }}>
      <motion.span
        className="absolute left-1/2 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-yellow-300 text-black shadow-[0_3px_8px_rgba(0,0,0,0.16)]"
        animate={{
                rotate: [-10, 10, -10],
                scale: [0.96, 1.04, 0.96],
              }} transition={{
                duration: orbitDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}>
        <Send size={10} strokeWidth={2.4} />
      </motion.span>
    </motion.span>
  </>
  ) : (
  <span
    className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 text-black shadow-[0_3px_8px_rgba(0,0,0,0.16)]">
    <Send size={11} strokeWidth={2.4} />
  </span>
  )}
</span>
);
};

const INDIAN_DESTINATION_KEYWORDS = [
"india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
"mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
"shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
"varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
"mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
"leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

const DEFAULT_EXCHANGE_RATES = Object.freeze({
INR: 1,
USD: 83.5,
EUR: 90.5,
GBP: 105.5,
AED: 22.75,
THB: 2.3,
IDR: 0.0051,
SGD: 61.5,
MYR: 17.7,
EGP: 1.65,
AUD: 54.5,
});

const CURRENCY_LABELS = Object.freeze({
INR: "₹",
USD: "$",
EUR: "EUR",
GBP: "GBP",
AED: "AED",
THB: "THB",
IDR: "IDR",
SGD: "SGD",
MYR: "MYR",
EGP: "EGP",
AUD: "AUD",
});

const normalizeCurrencyCode = (currency = "INR") =>
String(currency || "INR").trim().toUpperCase() || "INR";

const DESTINATION_ALIAS_GROUPS = [
["dharamshala", "dharamsala", "mcleod ganj", "mcleodganj", "mc leod ganj", "mcleodgunj"],
];

const expandDestinationAliases = (values = []) => {
const normalizedValues = values
.map((value) => String(value || "").trim())
.filter(Boolean);
const expanded = new Set(normalizedValues);

normalizedValues.forEach((value) => {
DESTINATION_ALIAS_GROUPS.forEach((group) => {
if (group.includes(value)) {
group.forEach((alias) => expanded.add(alias));
}
});
});

return Array.from(expanded);
};

const roundCurrencyAmount = (value) =>
Math.round(Number(value || 0));

const roundExchangeRateValue = (value) =>
Number(Number(value || 0).toFixed(4));

const getCurrencyLabel = (currency = "INR") =>
CURRENCY_LABELS[normalizeCurrencyCode(currency)] || normalizeCurrencyCode(currency);

const formatAmountValue = (value) =>
Number(value || 0).toLocaleString("en-IN", {
minimumFractionDigits: 0,
maximumFractionDigits: 0,
});

const formatExchangeRateValue = (value) =>
Number(value || 0).toLocaleString("en-IN", {
minimumFractionDigits: 0,
maximumFractionDigits: 4,
});

const formatCurrencyValue = (value, currency = "INR") =>
`${getCurrencyLabel(currency)} ${formatAmountValue(value)}`;

const getCurrentUserRole = () => {
try {
const user = JSON.parse(sessionStorage.getItem("user") || "{}");
return String(user?.role || "").trim();
} catch {
return "";
}
};

const formatShareDate = (value) => {
if (!value) return "-";

const parsed = new Date(value);
if (Number.isNaN(parsed.getTime())) {
return String(value);
}

return parsed.toLocaleDateString("en-GB", {
day: "numeric",
month: "short",
year: "numeric",
});
};

const buildTravelerSummary = (query = {}) => {
const adults = Number(query?.numberOfAdults || 0);
const children = Number(query?.numberOfChildren || 0);
const infants = Number(query?.numberOfInfants || 0);
const parts = [];

if (adults > 0) parts.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
if (children > 0) parts.push(`${children} Child${children === 1 ? "" : "ren"}`);
if (infants > 0) parts.push(`${infants} Infant${infants === 1 ? "" : "s"}`);

return parts.join(", ") || "Traveler details pending";
};

const getQueryPassengerCount = (query = {}) =>
Number(query?.numberOfAdults || 0) + Number(query?.numberOfChildren || 0);

const buildShareServiceQuantityLabel = (service = {}, fallbackPax = 0) => {
const normalizedType = normalizeServiceFilterType(service?.type);
const details = [];

if (normalizedType === "hotel") {
const hotelPax = Number(fallbackPax || 0) || Number(service?.pax || 0);
if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
if (Number(service?.rooms || 0) > 0) details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
if (hotelPax > 0) details.push(`${hotelPax} Pax`);
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

const buildShareServiceLocationLabel = (service = {}) =>
[service?.city, service?.country].filter(Boolean).join(", ");

const buildPlainTextQuotationSummary = (quotation = {}) => {
const dayWiseItineraryText = sanitizeDayWiseItineraryItems(quotation?.dayWiseItinerary)
.filter((item) => item.title || item.description)
.map((item) => {
const heading = [item.dayLabel, item.title].filter(Boolean).join(": ");
return [heading, item.description].filter(Boolean).join("\n");
})
.join("\n\n");
const servicesText = Array.isArray(quotation?.services) && quotation.services.length
? quotation.services
.map((service, index) => {
const serviceLines = [
`${index + 1}. ${service?.title || "Service"} (${service?.typeLabel || "Travel Service"})`,
service?.location ? ` Location: ${service.location}` : "",
service?.serviceDateLabel ? ` Date: ${service.serviceDateLabel}` : "",
service?.quantityLabel ? ` Qty: ${service.quantityLabel}` : "",
service?.description ? ` Notes: ${service.description}` : "",
].filter(Boolean);

return serviceLines.join("\n");
})
.join("\n\n")
: "No service details available.";

const inclusionsText = Array.isArray(quotation?.inclusions) && quotation.inclusions.length
? quotation.inclusions.map((item, index) => `${index + 1}. ${item}`).join("\n")
: "None";

const exclusionsText = Array.isArray(quotation?.exclusions) && quotation.exclusions.length
? quotation.exclusions.map((item, index) => `${index + 1}. ${item}`).join("\n")
: "None";

const additionalNotesText = Array.isArray(quotation?.additionalNotes) && quotation.additionalNotes.length
? quotation.additionalNotes.map((item, index) => `${index + 1}. ${item}`).join("\n")
: "None";

return [
"Holiday Circuit - Quotation Summary",
"",
`Quotation Number: ${quotation?.quotationNumber || "-"}`,
`Query ID: ${quotation?.queryId || "-"}`,
`Destination: ${quotation?.destination || "-"}`,
`Travel Dates: ${quotation?.travelDates || "-"}`,
`Duration: ${quotation?.durationLabel || "-"}`,
`Travelers: ${quotation?.travelerSummary || "-"}`,
`Valid Till: ${quotation?.validTill || "-"}`,
`Total Amount: ${formatCurrencyValue(quotation?.totalAmount || 0, quotation?.currency || "INR")}`,
"",
"Day Wise Itinerary",
dayWiseItineraryText || "None",
"",
"Selected Services",
servicesText,
"",
"Inclusions",
inclusionsText,
"",
"Exclusions",
exclusionsText,
"",
"Additional Notes",
additionalNotesText,
].join("\n");
};

const WHATSAPP_QUOTATION_BRAND = "Holiday Circuit";
const WHATSAPP_SECTION_DIVIDER = "----------";
const WHATSAPP_SUBSECTION_DIVIDER = "-------";
const DEFAULT_WHATSAPP_TERMS = Object.freeze([
  "Rates are subject to availability and confirmation at the time of booking.",
  "Only the services listed in this quotation are included in the shared amount.",
  "Any amendment after confirmation may affect availability and final pricing.",
  "Hotel check-in, check-out, and supplier-specific policies will apply as per service rules.",
  "Please review and confirm within the validity period to avoid fare or rate changes.",
]);

const SHOW_SELECTED_HISTORY_COMPARISON = false;

const normalizeWhatsAppPhoneNumber = (value = "") => {
const digits = String(value || "").replace(/\D/g, "");

if (!digits) return "";
if (digits.length === 10) return `91${digits}`;
if (digits.length === 12 && digits.startsWith("91")) return digits;
if (String(value || "").trim().startsWith("+")) return digits;

return digits;
};

const parseWhatsAppDate = (value) => {
if (!value) return null;

const parsed = new Date(value);
return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatWhatsAppDate = (value, { month = "short", weekday = undefined, includeYear = true } = {}) => {
const parsed = parseWhatsAppDate(value);
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

const formatWhatsAppActivityDate = (value) => {
const parsed = parseWhatsAppDate(value);
if (!parsed) return "";

const weekday = parsed.toLocaleDateString("en-GB", { weekday: "short" });
const month = parsed.toLocaleDateString("en-GB", { month: "short" });
const year = String(parsed.getFullYear()).slice(-2);

return `${weekday}, ${getOrdinalValue(parsed.getDate())} ${month}'${year}`;
};

const formatWhatsAppItineraryDate = (value) => {
const parsed = parseWhatsAppDate(value);
if (!parsed) return "";

const weekday = parsed.toLocaleDateString("en-GB", { weekday: "long" });
const month = parsed.toLocaleDateString("en-GB", { month: "short" });

return `${weekday} ${getOrdinalValue(parsed.getDate())} ${month}, ${parsed.getFullYear()}`;
};

const addDaysForWhatsApp = (value, daysToAdd = 0) => {
const parsed = parseWhatsAppDate(value);
if (!parsed) return "";

parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
return parsed.toISOString();
};

const getWhatsAppDateDiff = (startDate, endDate) => {
const start = parseWhatsAppDate(startDate);
const end = parseWhatsAppDate(endDate);

if (!start || !end) return 0;

const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

return Math.max(
0,
Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)),
);
};

const inferSharingLabel = (services = []) => {
const primaryHotel = services.find(
(service) => normalizeServiceFilterType(service?.type) === "hotel",
);

const rawLabel = `${primaryHotel?.bedType || ""} ${primaryHotel?.roomType || ""}`.toLowerCase();

if (rawLabel.includes("triple")) return "Triple Sharing";
if (rawLabel.includes("double")) return "Double Sharing";
if (rawLabel.includes("twin")) return "Twin Sharing";
if (rawLabel.includes("single")) return "Single Sharing";

return "Per Person";
};

const buildWhatsAppTravelerSummary = (quotation = {}) => {
const adults = Number(quotation?.numberOfAdults || 0);
const children = Number(quotation?.numberOfChildren || 0);
const infants = Number(quotation?.numberOfInfants || 0);
const travelers = [];

if (adults > 0) travelers.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
if (children > 0) travelers.push(`${children} ${children === 1 ? "Child" : "Children"}`);
if (infants > 0) travelers.push(`${infants} Infant${infants === 1 ? "" : "s"}`);

return travelers.join(", ") || "Traveler details pending";
};

const buildWhatsAppNightLabel = (serviceDate, nights, tripStartDate) => {
const totalNights = Math.max(1, Number(nights || 1));
const startNightNumber = getWhatsAppDateDiff(tripStartDate, serviceDate) + 1;
const nightLabels = Array.from({ length: totalNights }, (_, index) =>
getOrdinalValue(startNightNumber + index),
);

if (nightLabels.length === 1) {
return `${nightLabels[0]} Night`;
}

if (nightLabels.length <= 3) { return `${nightLabels.join(", ")} Nights`;
  }

  return `${nightLabels[0]} - ${nightLabels[nightLabels.length - 1]} Nights`;
};

const buildWhatsAppHotelMeta = (service = {}, fallbackPax = 0) => {
  const hotelPax =
    Number(service?.pax || 0) +
      Number(service?.adults || 0) +
      Number(service?.children || 0) +
      Number(service?.infants || 0) || fallbackPax;
  const parts = [];
  const description = String(service?.description || "").replace(/\s+/g, " ").trim();

  if (description) {
    parts.push(description);
  }

  const roomBits = [];
  if (Number(service?.rooms || 0) > 0) {
    roomBits.push(
      `${service.rooms} ${service?.roomType || " Room"}${Number(service.rooms)> 1 ? "s" : ""}`,
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

  return parts.join(" • ") || "Stay included";
  };

  const buildWhatsAppHotelsSection = (quotation = {}) => {
  const hotels = Array.isArray(quotation?.services)
  ? quotation.services
  .filter((service) => normalizeServiceFilterType(service?.type) === "hotel")
  .sort(
  (left, right) =>
  new Date(left?.serviceDate || 0).getTime() - new Date(right?.serviceDate || 0).getTime(),
  )
  : [];

  if (!hotels.length) return "";

  const totalPax =
  Number(quotation?.numberOfAdults || 0) +
  Number(quotation?.numberOfChildren || 0) +
  Number(quotation?.numberOfInfants || 0);

  const lines = ["🏨 *_Hotels_*", WHATSAPP_SECTION_DIVIDER];

  hotels.forEach((hotel) => {
  const checkInDate = hotel?.serviceDate || quotation?.startDate || "";
  const checkOutDate = addDaysForWhatsApp(checkInDate, Number(hotel?.nights || 1));
  const locationLabel = hotel?.city || quotation?.destination || "Destination";
  const hotelTitle = hotel?.hotelCategory
  ? `${hotel.title} (${hotel.hotelCategory})`
  : hotel.title || "Hotel stay";

  lines.push(`*${buildWhatsAppNightLabel(checkInDate, hotel?.nights, quotation?.startDate)}* _at_ *${locationLabel}*`);
  lines.push(
  `_Check-in: ${formatWhatsAppDate(checkInDate, { includeYear: false })}_ & _Check-out:
  ${formatWhatsAppDate(checkOutDate, { includeYear: false })}_`,
  );
  lines.push(`*${hotelTitle}*`);
  lines.push(buildWhatsAppHotelMeta(hotel, totalPax));
  lines.push("");
  });

  return lines.join("\n").trim();
  };

  const buildWhatsAppTransportSection = (quotation = {}) => {
  const services = Array.isArray(quotation?.services)
  ? quotation.services
  .filter((service) => normalizeServiceFilterType(service?.type) !== "hotel")
  .sort(
  (left, right) =>
  new Date(left?.serviceDate || 0).getTime() - new Date(right?.serviceDate || 0).getTime(),
  )
  : [];

  if (!services.length) return "";

  const groupedServices = services.reduce((accumulator, service) => {
  const serviceDate = service?.serviceDate || "";
  const groupKey = normalizeDateInputValue(serviceDate) || String(serviceDate || "undated");

  if (!accumulator[groupKey]) {
  accumulator[groupKey] = [];
  }

  accumulator[groupKey].push(service);
  return accumulator;
  }, {});

  const lines = ["🚖 *Transportation and Activities*", WHATSAPP_SECTION_DIVIDER];

  Object.entries(groupedServices).forEach(([groupDate, items], index) => {
  const serviceDate = groupDate === "undated" ? "" : groupDate;
  const dayNumber = serviceDate
  ? getWhatsAppDateDiff(quotation?.startDate, serviceDate) + 1
  : index + 1;

  lines.push(`*${getOrdinalValue(dayNumber)} Day - ${formatWhatsAppActivityDate(serviceDate)}*`);

  items.forEach((service) => {
  const quantityLabel = service?.quantityLabel ? ` _(${service.quantityLabel})_` : "";
  const description =
  service?.description &&
  String(service.description).trim().toLowerCase() !== String(service.title || "").trim().toLowerCase()
  ? ` - ${service.description}`
  : "";

  lines.push(`• ${service?.title || "Service"}${description}${quantityLabel}`);
  });

  lines.push("");
  });

  return lines.join("\n").trim();
  };

  const buildWhatsAppInclusionsSection = (items = [], prefix = "+") => {
  if (!Array.isArray(items) || !items.length) return "";

  return items.map((item) => `${prefix} ${item}`).join("\n");
  };

const buildWhatsAppExclusionsSection = (items = [], prefix = "-") => {
  if (!Array.isArray(items) || !items.length) return "";

  return items.map((item) => `${prefix} ${item}`).join("\n");
};

const buildWhatsAppSellerBankDetailsSection = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim(),
        }))
        .filter((item) => item.label && item.value)
    : [];

  if (!normalizedItems.length) return "";

  return [
    "*_Seller Bank Details_*",
    WHATSAPP_SECTION_DIVIDER,
    ...normalizedItems.map((item) => `*${item.label}:* ${item.value}`),
  ].join("\n");
};

const buildWhatsAppTermsSection = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const terms = normalizedItems.length ? normalizedItems : [...DEFAULT_WHATSAPP_TERMS];

  if (!terms.length) return "";

  return [
    "*_Terms and Conditions_*",
    WHATSAPP_SECTION_DIVIDER,
    ...terms.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
};

  const buildWhatsAppDayWiseItinerary = (quotation = {}) => {
  const itinerary = Array.isArray(quotation?.dayWiseItinerary)
  ? quotation.dayWiseItinerary.filter((item) => item?.title || item?.description)
  : [];

  if (!itinerary.length) return "";

  const lines = ["🗓️ *_Day Wise Itinerary_*", WHATSAPP_SECTION_DIVIDER];

  itinerary.forEach((item, index) => {
  const dayNumber = Number(item?.dayNumber || index + 1);
  const itemDate = item?.date || addDaysForWhatsApp(quotation?.startDate, dayNumber - 1);

  lines.push(`*${getOrdinalValue(dayNumber)} Day - ${formatWhatsAppItineraryDate(itemDate)}*`);
  lines.push("----");

  if (item?.title) {
  lines.push(`*${item.title}*`);
  }

  if (item?.description) {
  lines.push(String(item.description).trim());
  }

  lines.push("");
  lines.push(WHATSAPP_SECTION_DIVIDER);
  lines.push("");
  });

  return lines.join("\n").replace(/\n+\s*----------\s*$/, "").trim();
  };

  const buildWhatsAppQuotationMessage = (quotation = {}) => {
  const totalPax =
  Number(quotation?.numberOfAdults || 0) +
  Number(quotation?.numberOfChildren || 0) +
  Number(quotation?.numberOfInfants || 0);
  const totalAmount = Math.round(Number(quotation?.totalAmount || 0));
  const perPersonAmount = totalPax > 0 ? Math.round(totalAmount / totalPax) : 0;
  const destinationLabel = quotation?.destination ? `${quotation.destination} Trip` : "Trip";
  const notes = Array.isArray(quotation?.additionalNotes) ? quotation.additionalNotes : [];
  const inclusions = Array.isArray(quotation?.inclusions) ? quotation.inclusions : [];
  const exclusions = Array.isArray(quotation?.exclusions) ? quotation.exclusions : [];
  const recipientName = quotation?.recipientName || quotation?.recipientCompanyName || "Partner";
  const tcsIncludedLine =
  Number(quotation?.tcsAmount || 0) > 0
  ? ` _(inc. Tax Collected At Source)_`
  : "";

  const lines = [
  `Hi ${recipientName},`,
  "",
  `Greetings from ${WHATSAPP_QUOTATION_BRAND}.`,
  "",
  "Thank you for your query with us. As per your requirements, following are the package details.",
  "",
  `*Trip ID ${quotation?.queryId || quotation?.quotationNumber || "-"}*`,
  WHATSAPP_SECTION_DIVIDER,
  `*${destinationLabel}*`,
  `• *${formatWhatsAppDate(quotation?.startDate || "")}* _for_ *${quotation?.tripNights || 0} Nights,
  ${quotation?.tripDays || 0} Days*`,
  `• *${buildWhatsAppTravelerSummary(quotation)}*`,
  "",
  "*Price (INR):*",
  perPersonAmount > 0
  ? `• *${formatAmountValue(perPersonAmount)} / Person (${inferSharingLabel(quotation?.services || [])})* x ${totalPax}
  Pax`
  : "• Price on request",
  `*Total: ${formatAmountValue(totalAmount)} /-*${tcsIncludedLine}`,
  ];

  if (notes.length) {
  lines.push("");
  lines.push("*_Notes_*");
  lines.push(WHATSAPP_SUBSECTION_DIVIDER);
  notes.forEach((note, index) => {
  lines.push(`${index + 1}. ${note}`);
  });
  lines.push(WHATSAPP_SUBSECTION_DIVIDER);
  }

  const hotelsSection = buildWhatsAppHotelsSection(quotation);
  if (hotelsSection) {
  lines.push("");
  lines.push(hotelsSection);
  }

  const transportSection = buildWhatsAppTransportSection(quotation);
  if (transportSection) {
  lines.push("");
  lines.push(transportSection);
  }

  const inclusionsSection = buildWhatsAppInclusionsSection(inclusions, "+");
  if (inclusionsSection) {
  lines.push("");
  lines.push("*_Inclusions_*");
  lines.push(WHATSAPP_SECTION_DIVIDER);
  lines.push(inclusionsSection);
  }

  const exclusionsSection = buildWhatsAppExclusionsSection(exclusions, "-");
  if (exclusionsSection) {
  lines.push("");
  lines.push("*_Exclusions_*");
  lines.push(WHATSAPP_SECTION_DIVIDER);
  lines.push(exclusionsSection);
  lines.push("");
  lines.push("_*NOTE*: Anything not mentioned in the inclusions is excluded_");
  }

  const itinerarySection = buildWhatsAppDayWiseItinerary(quotation);
  if (itinerarySection) {
  lines.push("");
  lines.push(itinerarySection);
  }

  const sellerBankDetailsSection = buildWhatsAppSellerBankDetailsSection(
  quotation?.sellerBankDetails,
  );
  if (sellerBankDetailsSection) {
  lines.push("");
  lines.push(sellerBankDetailsSection);
  }

  const termsSection = buildWhatsAppTermsSection(quotation?.termsAndConditions);
  if (termsSection) {
  lines.push("");
  lines.push(termsSection);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  const sanitizeDynamicListItems = (items = []) =>
  Array.isArray(items)
  ? items
  .map((item) => String(item || "").replace(/\s+/g, " ").trim())
  .filter(Boolean)
  : [];

  const normalizeDateInputValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
  };

  const addDaysToNormalizedDate = (value, daysToAdd = 0) => {
  const normalizedValue = normalizeDateInputValue(value);
  if (!normalizedValue) return "";

  const parsed = new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) return "";

  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
  };

  const getOrdinalValue = (value) => {
  const number = Number(value || 0);
  const remainderTen = number % 10;
  const remainderHundred = number % 100;

  if (remainderTen === 1 && remainderHundred !== 11) return `${number}st`;
  if (remainderTen === 2 && remainderHundred !== 12) return `${number}nd`;
  if (remainderTen === 3 && remainderHundred !== 13) return `${number}rd`;
  return `${number}th`;
  };

  const formatItineraryDateLabel = (value) => {
  const normalizedValue = normalizeDateInputValue(value);
  if (!normalizedValue) return "";

  const parsed = new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) return "";

  return `${parsed.toLocaleDateString("en-GB", {
  weekday: "short",
  })} ${getOrdinalValue(parsed.getDate())} ${parsed.toLocaleDateString("en-GB", {
  month: "short",
  })}`;
  };

  const buildItineraryDayLabel = (dayNumber, dateValue = "") => {
  const ordinalDay = getOrdinalValue(dayNumber);
  const dateLabel = formatItineraryDateLabel(dateValue);
  return dateLabel ? `${ordinalDay} Day (${dateLabel})` : `${ordinalDay} Day`;
  };

  const sanitizeDayWiseItineraryItems = (items = []) =>
  Array.isArray(items)
  ? items.map((item, index) => {
  const dayNumber = Math.max(1, Number(item?.dayNumber || index + 1));
  const date = normalizeDateInputValue(
  item?.date || item?.serviceDate || item?.dayDate || "",
  );

  return {
  dayNumber,
  dayLabel: String(item?.dayLabel || buildItineraryDayLabel(dayNumber, date)).trim(),
  date,
  title: String(item?.title || item?.heading || "")
  .replace(/\s+/g, " ")
  .trim(),
  description: String(item?.description || "")
  .replace(/\r\n/g, "\n")
  .replace(/\n{3,}/g, "\n\n")
  .trim(),
  };
  })
  : [];

  const areDayWiseItineraryItemsEqual = (currentItems = [], nextItems = []) =>
  currentItems.length === nextItems.length &&
  currentItems.every((item, index) => {
  const nextItem = nextItems[index];

  return (
  nextItem &&
  Number(item?.dayNumber || 0) === Number(nextItem?.dayNumber || 0) &&
  String(item?.dayLabel || "") === String(nextItem?.dayLabel || "") &&
  String(item?.date || "") === String(nextItem?.date || "") &&
  String(item?.title || "") === String(nextItem?.title || "") &&
  String(item?.description || "") === String(nextItem?.description || "")
  );
  });

  const reconcileDayWiseItineraryItems = (items = [], totalDays = 0, startDate = "") => {
  const normalizedItems = sanitizeDayWiseItineraryItems(items);
  const itemsByDay = new Map(
  normalizedItems.map((item, index) => [
  Math.max(1, Number(item?.dayNumber || index + 1)),
  item,
  ]),
  );
  const fallbackCount = normalizedItems.reduce(
  (maxCount, item, index) => Math.max(maxCount, Number(item?.dayNumber || index + 1)),
  0,
  );
  const resolvedDayCount = Math.max(Number(totalDays || 0), fallbackCount);

  if (!resolvedDayCount) {
  return normalizedItems;
  }

  return Array.from({ length: resolvedDayCount }, (_, index) => {
  const dayNumber = index + 1;
  const existingItem = itemsByDay.get(dayNumber) || {};
  const date = startDate ? addDaysToNormalizedDate(startDate, index) : String(existingItem?.date || "");

  return {
  dayNumber,
  dayLabel: buildItineraryDayLabel(dayNumber, date || existingItem?.date || ""),
  date: date || existingItem?.date || "",
  title: String(existingItem?.title || "").trim(),
  description: String(existingItem?.description || "").trim(),
  };
  });
  };

  const copyTextToClipboard = async (value) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
  await navigator.clipboard.writeText(value);
  return;
  }

  if (typeof document === "undefined") {
  throw new Error("Clipboard is not available in this environment.");
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) {
  throw new Error("Unable to copy quotation text.");
  }
  };

  const getPublicBaseUrl = () => {
  const browserOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const baseUrl = API.defaults.baseURL || browserOrigin;
  return new URL(baseUrl, browserOrigin).origin;
  };

  const createPublicAssetUrl = (filePath = "") => {
  if (!filePath) return "";
  return new URL(filePath, getPublicBaseUrl()).toString();
  };

  const downloadFileFromUrl = async (fileUrl, fileName = "download") => {
  const response = await fetch(fileUrl);

  if (!response.ok) {
  throw new Error("Unable to download the generated file.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
  };

  const escapeWordHtml = (value = "") =>
  String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

  const buildWordQuotationDocumentHtml = (quotation = {}) => {
  const servicesMarkup = (quotation.services || [])
  .map((service, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeWordHtml(service.title || "Service")}</td>
      <td>${escapeWordHtml(service.typeLabel || "Service")}</td>
      <td>${escapeWordHtml(service.location || "-")}</td>
      <td>${escapeWordHtml(service.serviceDateLabel || "-")}</td>
      <td>${escapeWordHtml(service.quantityLabel || "-")}</td>
      <td>${escapeWordHtml(service.description || "-")}</td>
    </tr>
  `)
  .join("");

  const itineraryMarkup = (quotation.dayWiseItinerary || [])
  .map((item) => `
    <div class="block">
      <h4>${escapeWordHtml(item.heading || item.dayLabel || "Day Plan")}</h4>
      <p>${escapeWordHtml(item.description || "-")}</p>
    </div>
  `)
  .join("");

  const listMarkup = (items = []) =>
  items.length
  ? `<ul>${items.map((item) => `<li>${escapeWordHtml(item)}</li>`).join("")}</ul>`
  : `<p class="muted">Not specified</p>`;

  const normalizedTerms = Array.isArray(quotation.termsAndConditions) &&
  quotation.termsAndConditions.length
  ? quotation.termsAndConditions
  : [...DEFAULT_WHATSAPP_TERMS];

  const bankMarkup = (quotation.sellerBankDetails || [])
  .map((item) => `
    <tr>
      <td>${escapeWordHtml(item.label || "")}</td>
      <td>${escapeWordHtml(item.value || "-")}</td>
    </tr>
  `)
  .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Quotation ${escapeWordHtml(quotation.queryId || "Quote")}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; color: #1f2937; margin: 28px; line-height: 1.5; }
      h1, h2, h3, h4 { margin: 0; }
      h1 { font-size: 26px; margin-bottom: 6px; color: #111827; }
      h2 { font-size: 18px; margin: 22px 0 10px; color: #1d4ed8; }
      h3 { font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
      h4 { font-size: 14px; margin-bottom: 6px; color: #0f172a; }
      p { margin: 0 0 8px; }
      .muted { color: #64748b; }
      .hero { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 18px; }
      .grid { width: 100%; border-collapse: collapse; margin-top: 12px; }
      .grid td { padding: 8px 10px; border: 1px solid #dbeafe; vertical-align: top; }
      .services th, .services td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      .services th { background: #eff6ff; color: #1e3a8a; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-top: 12px; }
      .block { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
      .block:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      li { margin-bottom: 4px; }
      .amount { font-size: 20px; font-weight: 700; color: #15803d; }
    </style>
  </head>
  <body>
    <div class="hero">
      <h1>Holiday Circuit Quotation</h1>
      <p class="muted">Quotation No: ${escapeWordHtml(quotation.quotationNumber || "-")}</p>
      <p class="muted">Query ID: ${escapeWordHtml(quotation.queryId || "-")}</p>
    </div>

    <h2>Trip Overview</h2>
    <table class="grid">
      <tr><td><strong>Agent</strong></td><td>${escapeWordHtml(quotation.recipientCompanyName || quotation.recipientName || "-")}</td></tr>
      <tr><td><strong>Destination</strong></td><td>${escapeWordHtml(quotation.destination || "-")}</td></tr>
      <tr><td><strong>Travel Dates</strong></td><td>${escapeWordHtml(quotation.travelDates || "-")}</td></tr>
      <tr><td><strong>Duration</strong></td><td>${escapeWordHtml(quotation.durationLabel || "-")}</td></tr>
      <tr><td><strong>Travellers</strong></td><td>${escapeWordHtml(quotation.travelerSummary || "-")}</td></tr>
      <tr><td><strong>Valid Till</strong></td><td>${escapeWordHtml(quotation.validTill || "-")}</td></tr>
      <tr><td><strong>Total Amount</strong></td><td class="amount">${escapeWordHtml(quotation.currency || "INR")} ${escapeWordHtml(quotation.totalAmount || 0)}</td></tr>
    </table>

    <h2>Services</h2>
    <table class="services" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>#</th>
          <th>Service</th>
          <th>Type</th>
          <th>Location</th>
          <th>Date</th>
          <th>Quantity</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${servicesMarkup || `<tr><td colspan="7">No services selected</td></tr>`}
      </tbody>
    </table>

    <h2>Inclusions</h2>
    <div class="card">${listMarkup(quotation.inclusions || [])}</div>

    <h2>Exclusions</h2>
    <div class="card">${listMarkup(quotation.exclusions || [])}</div>

    <h2>Additional Notes</h2>
    <div class="card">${listMarkup(quotation.additionalNotes || [])}</div>

    <h2>Day-wise Itinerary</h2>
    <div class="card">${itineraryMarkup || `<p class="muted">No itinerary added</p>`}</div>

    <h2>Bank Details</h2>
    <table class="grid">
      ${bankMarkup}
    </table>

    <h2>Terms and Conditions</h2>
    <div class="card">${listMarkup(normalizedTerms)}</div>
  </body>
</html>`;
  };

  const downloadWordDocument = (quotation = {}, fileName = "quotation.doc") => {
  const html = buildWordQuotationDocumentHtml(quotation);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
  };

  const SERVICE_TYPE_LABELS = Object.freeze({
  hotel: "Hotel",
  transfer: "Transport",
  car: "Transport",
  activity: "Activity",
  sightseeing: "Sightseeing",
  });

  const CONTRACTED_RATE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hotel", label: "Hotels" },
  { value: "transfer", label: "Transport" },
  { value: "activity", label: "Activities" },
  { value: "sightseeing", label: "Sightseeing" },
  ];

  const HOTEL_ROOM_TYPE_OPTIONS = [
  "Standard",
  "Deluxe",
  "Super Deluxe",
  "Premium",
  "Executive",
  "Club",
  "Suite",
  "Family Room",
  "Villa",
  "Cottage",
  ];

  const HOTEL_ROOM_CATEGORY_OPTIONS = [
  "Single",
  "Double",
  "Twin",
  "Triple",
  "Quad",
  "Family",
  "Interconnecting",
  ];

  const HOTEL_BED_TYPE_OPTIONS = [
  { value: "king-bed", label: "King Bed" },
  { value: "queen-bed", label: "Queen Bed" },
  { value: "twin-beds", label: "Twin Beds" },
  { value: "double-bed", label: "Double Bed" },
  { value: "single-bed", label: "Single Bed" },
  { value: "extra-bed-rollaway-bed", label: "Extra Bed / Rollaway Bed" },
  ];

  const HOTEL_ROOM_TYPE_FIXED_PRICES = Object.freeze({
  standard: 5000,
  deluxe: 6000,
  "super deluxe": 9000,
  premium: 7000,
  executive: 8000,
  club: 8500,
  suite: 12000,
  "family room": 9500,
  villa: 15000,
  cottage: 7500,
  });

  const HOTEL_BED_TYPE_FIXED_PRICES = Object.freeze({
  "king-bed": 7000,
  "queen-bed": 6500,
  "twin-beds": 6200,
  "double-bed": 6000,
  "single-bed": 4500,
  "extra-bed-rollaway-bed": 3000,
  });

  const TRANSPORT_USAGE_OPTIONS = Object.freeze([
  { value: "point-to-point", label: "One Way", price: 2500 },
  { value: "round-trip", label: "Two Way", price: 4500 },
  { value: "full-day", label: "Full Day", price: 7000 },
  { value: "half-day", label: "Half Day", price: 4000 },
  ]);

  const TRANSPORT_USAGE_FIXED_PRICES = Object.freeze(
  TRANSPORT_USAGE_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option.price;
  return accumulator;
  }, {}),
  );

  const normalizeServiceFilterType = (type = "") => {
  const normalizedType = String(type || "").toLowerCase().trim();
  if (normalizedType === "car" || normalizedType === "transport") {
  return "transfer";
  }

  return normalizedType;
  };

  const normalizeBedTypeValue = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) return "";
  if (
  [
  "king-bed",
  "queen-bed",
  "twin-beds",
  "double-bed",
  "single-bed",
  "extra-bed-rollaway-bed",
  ].includes(normalizedValue)
  ) {
  return normalizedValue;
  }
  if (normalizedValue.includes("rollaway") || normalizedValue.includes("extra bed")) {
  return "extra-bed-rollaway-bed";
  }
  if (normalizedValue.includes("king")) {
  return "king-bed";
  }
  if (normalizedValue.includes("queen")) {
  return "queen-bed";
  }
  if (normalizedValue.includes("twin")) {
  return "twin-beds";
  }
  if (normalizedValue.includes("double")) {
  return "double-bed";
  }
  if (normalizedValue.includes("single")) {
  return "single-bed";
  }

  return "";
  };

  const getBedTypeOptionLabel = (value = "") =>
  HOTEL_BED_TYPE_OPTIONS.find((option) => option.value === normalizeBedTypeValue(value))?.label ||
  formatHotelOptionLabel(String(value || "").replace(/-/g, " "));

  const formatHotelOptionLabel = (value = "") =>
  String(value || "")
  .trim()
  .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatRoomOccupancyLabel = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (normalizedValue === "single") return "Single (1 person)";
  if (normalizedValue === "double") return "Double (2 persons)";
  if (normalizedValue === "twin") return "Twin (2 persons)";
  if (normalizedValue === "triple") return "Triple (3 persons)";
  if (normalizedValue === "quad") return "Quad (4 persons)";
  if (normalizedValue === "family") return "Family";
  if (normalizedValue === "interconnecting") return "Interconnecting";

  return formatHotelOptionLabel(value);
  };

  const buildHotelVariantGroupKey = (service = {}) =>
  [
  service.supplierId || service.dmcId || "",
  service.supplierName || service.hotelName || service.title || "",
  service.city || "",
  service.country || "",
  ]
  .map((value) => normalizeComparisonTextValue(value))
  .join("::");

  const getHotelVariantServices = (services = [], service = {}) =>
  services.filter(
  (candidate) =>
  normalizeServiceFilterType(candidate.type) === "hotel" &&
  buildHotelVariantGroupKey(candidate) === buildHotelVariantGroupKey(service),
  );

  const buildSelectOptionsWithFallback = (values = [], fallbackValues = []) => {
  const optionSet = new Set();

  fallbackValues.forEach((value) => {
  const normalizedValue = String(value || "").trim();
  if (normalizedValue) {
  optionSet.add(normalizedValue);
  }
  });

  values.forEach((value) => {
  const normalizedValue = String(value || "").trim();
  if (normalizedValue) {
  optionSet.add(normalizedValue);
  }
  });

  return Array.from(optionSet);
  };

  const normalizeHotelOptionLookupKey = (value = "") =>
  String(value || "").trim().toLowerCase();

  const normalizeHotelRoomTypeLookupKey = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
  return "";
  }

  const canonicalMatch = [...HOTEL_ROOM_TYPE_OPTIONS]
  .sort((left, right) => right.length - left.length)
  .find((option) => normalizedValue.includes(String(option).toLowerCase()));

  if (canonicalMatch) {
  return String(canonicalMatch).toLowerCase();
  }

  return normalizedValue.replace(/\s+room$/i, "").trim();
  };

  const normalizeTransportUsageValue = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) return "";
  if (TRANSPORT_USAGE_FIXED_PRICES[normalizedValue]) {
  return normalizedValue;
  }
  if (normalizedValue.includes("round") || normalizedValue.includes("two way")) {
  return "round-trip";
  }
  if (normalizedValue.includes("full")) {
  return "full-day";
  }
  if (normalizedValue.includes("half")) {
  return "half-day";
  }
  if (normalizedValue.includes("point") || normalizedValue.includes("one way")) {
  return "point-to-point";
  }

  return normalizedValue;
  };

  const getFixedHotelRoomTypePrice = (roomType = "") =>
  HOTEL_ROOM_TYPE_FIXED_PRICES[normalizeHotelRoomTypeLookupKey(roomType)] || 0;

  const inferHotelRoomTypeValue = (service = {}) => {
  const explicitRoomType = String(service?.roomType || "").trim();
  if (explicitRoomType) {
  return (
  HOTEL_ROOM_TYPE_OPTIONS.find(
  (option) =>
  normalizeHotelRoomTypeLookupKey(option) === normalizeHotelRoomTypeLookupKey(explicitRoomType),
  ) || explicitRoomType
  );
  }

  const haystack = [
  service?.title,
  service?.hotelName,
  service?.description,
  service?.desc,
  ]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();

  if (!haystack) {
  return "";
  }

  return (
  [...HOTEL_ROOM_TYPE_OPTIONS]
  .sort((left, right) => right.length - left.length)
  .find((option) => haystack.includes(String(option).toLowerCase())) || ""
  );
  };

  const getFixedHotelBedTypePrice = (bedType = "") =>
  HOTEL_BED_TYPE_FIXED_PRICES[normalizeHotelOptionLookupKey(bedType)] || 0;

  const getFixedTransportUsagePrice = (usageType = "") =>
  TRANSPORT_USAGE_FIXED_PRICES[normalizeTransportUsageValue(usageType)] || 0;

  const getResolvedHotelBaseRate = (service = {}, fallbackRate = 0) => {
  const explicitRate = Number(fallbackRate ?? service?.rate ?? service?.price ?? 0);
  if (normalizeServiceFilterType(service?.type) !== "hotel") {
  return roundCurrencyAmount(explicitRate);
  }

  if (service?.hotelRateMode === "service-total") {
  return roundCurrencyAmount(explicitRate);
  }

  if (explicitRate > 0) {
  return roundCurrencyAmount(explicitRate);
  }

  const fixedRoomTypePrice = getFixedHotelRoomTypePrice(service?.roomType);
  if (fixedRoomTypePrice > 0) {
  return roundCurrencyAmount(fixedRoomTypePrice);
  }

  return roundCurrencyAmount(explicitRate);
  };

  const getTransportUsageOptionDisplayPrice = (service = {}, usageType = "") => {
  const normalizedUsageType = normalizeTransportUsageValue(usageType);
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineUsageType = normalizeTransportUsageValue(baseline.usageType);
  const baselineRate = roundCurrencyAmount(baseline.rate ?? service.rate ?? 0);
  const baselineFixedPrice = getFixedTransportUsagePrice(baselineUsageType);
  const selectedFixedPrice = getFixedTransportUsagePrice(normalizedUsageType);

  if (
  normalizedUsageType &&
  baselineUsageType &&
  baselineRate > 0 &&
  baselineFixedPrice > 0 &&
  selectedFixedPrice > 0
  ) {
  return Math.max(
  0,
  roundCurrencyAmount(baselineRate + (selectedFixedPrice - baselineFixedPrice)),
  );
  }

  return selectedFixedPrice;
  };

  const getFixedHotelOptionDelta = (
  baselineValue = "",
  selectedValue = "",
  getPrice = () => 0,
  normalizer = normalizeHotelOptionLookupKey,
  ) => {
  if (normalizer(baselineValue) === normalizer(selectedValue)) {
  return 0;
  }

  const baselinePrice = getPrice(baselineValue);
  const selectedPrice = getPrice(selectedValue);

  if (!baselinePrice || !selectedPrice) {
  return 0;
  }

  return selectedPrice - baselinePrice;
  };

  const applyFixedHotelOptionPricing = (service = {}, fallbackRate = 0, fallbackCurrency = "INR") => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineRate = Number(baseline.rate ?? fallbackRate ?? service.rate ?? 0);
  const roomTypeDelta = getFixedHotelOptionDelta(
  baseline.roomType,
  service.roomType,
  getFixedHotelRoomTypePrice,
  normalizeHotelRoomTypeLookupKey,
  );
  const bedTypeDelta = getFixedHotelOptionDelta(
  baseline.bedType,
  service.bedType,
  getFixedHotelBedTypePrice,
  );
  const totalUnitDelta = roomTypeDelta + bedTypeDelta;
  const adjustedRate =
  service?.hotelRateMode === "service-total"
  ? Math.max(0, roundCurrencyAmount(baselineRate + totalUnitDelta))
  : Math.max(
    0,
    roundCurrencyAmount(
    getResolvedHotelBaseRate(
    service,
    totalUnitDelta ? baselineRate + totalUnitDelta : fallbackRate,
    ),
    ),
    );

  return {
  ...service,
  rate: adjustedRate,
  quoteBaseRate: adjustedRate,
  currency: normalizeCurrencyCode(fallbackCurrency || service.currency || "INR"),
  };
  };

  const applyFixedTransportUsagePricing = (service = {}, fallbackRate = 0, fallbackCurrency = "INR") => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineRate = Number(baseline.rate ?? fallbackRate ?? service.rate ?? 0);
  const usageDelta = getFixedHotelOptionDelta(
  baseline.usageType,
  service.usageType,
  getFixedTransportUsagePrice,
  );

  return {
  ...service,
  usageType: normalizeTransportUsageValue(service.usageType),
  rate: Math.max(0, roundCurrencyAmount(baselineRate + usageDelta)),
  currency: normalizeCurrencyCode(fallbackCurrency || service.currency || "INR"),
  };
  };

  const doesHotelVariantMatchField = (variant = {}, field = "", value = "") => {
  if (!field) return false;

  if (field === "bedType") {
  return normalizeBedTypeValue(variant.bedType) === normalizeBedTypeValue(value);
  }

  return normalizeComparisonTextValue(variant[field]) === normalizeComparisonTextValue(value);
  };

  const getHotelVariantForOption = (hotelVariants = [], service = {}, field = "", value = "") => {
  const exactMatches = hotelVariants.filter((variant) =>
  doesHotelVariantMatchField(variant, field, value),
  );

  if (!exactMatches.length) {
  return null;
  }

  const nextService = {
  ...service,
  [field]: field === "bedType" ? normalizeBedTypeValue(value) : value,
  };

  return (
  exactMatches
  .map((variant) => ({
  variant,
  score: scoreHotelVariantMatch(variant, nextService, field),
  }))
  .sort((left, right) => right.score - left.score)[0]?.variant || null
  );
  };

  const getHotelRoomTypeOptionRate = (hotelVariants = [], service = {}, roomType = "") => {
  const bestVariant = getHotelVariantForOption(hotelVariants, service, "roomType", roomType);
  const variantRate = Number(bestVariant?.rate ?? bestVariant?.price ?? 0);
  const fixedPrice = getFixedHotelRoomTypePrice(roomType);

  if (variantRate > 0) {
  return {
  amount: roundCurrencyAmount(variantRate),
  currency: normalizeCurrencyCode(bestVariant?.currency || service.currency || "INR"),
  variant: bestVariant,
  };
  }

  if (fixedPrice > 0) {
  return {
  amount: roundCurrencyAmount(fixedPrice),
  currency: "INR",
  variant: bestVariant,
  };
  }

  return {
  amount: 0,
  currency: normalizeCurrencyCode(service.currency || "INR"),
  variant: bestVariant,
  };
  };

  const getAdjustedHotelRoomTypeRate = (hotelVariants = [], service = {}, selectedRoomType = "") => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineRate = roundCurrencyAmount(
  baseline.quoteBaseRate ||
  baseline.originalTotal ||
  baseline.total ||
  service.quoteBaseRate ||
  service.originalTotal ||
  service.total ||
  service.rate ||
  baseline.rate ||
  0,
  );
  const baselineRoomType = baseline.roomType || service.roomType || "";
  const selectedMatchesBaseline =
  normalizeHotelRoomTypeLookupKey(selectedRoomType) === normalizeHotelRoomTypeLookupKey(baselineRoomType);
  const baselineOptionRate = Number(baseline.roomTypeOptionRate || 0);
  const baselineOptionCurrency = normalizeCurrencyCode(
  baseline.roomTypeOptionCurrency || service.currency || "INR",
  );
  const baselineOption = baselineOptionRate > 0
  ? {
  amount: roundCurrencyAmount(baselineOptionRate),
  currency: baselineOptionCurrency,
  variant: null,
  }
  : getHotelRoomTypeOptionRate(hotelVariants, service, baselineRoomType);
  const selectedOption = getHotelRoomTypeOptionRate(hotelVariants, service, selectedRoomType);

  if (selectedMatchesBaseline && baselineRate > 0) {
  return {
  amount: baselineRate,
  currency: baselineOption.currency || normalizeCurrencyCode(service.currency || "INR"),
  variant: selectedOption.variant,
  };
  }

  if (baselineRate > 0 && baselineOption.amount > 0 && selectedOption.amount > 0) {
  return {
  amount: Math.max(
  0,
  roundCurrencyAmount(baselineRate + (selectedOption.amount - baselineOption.amount)),
  ),
  currency: selectedOption.currency,
  variant: selectedOption.variant,
  };
  }

  return {
  amount: selectedOption.amount || baselineRate,
  currency: selectedOption.currency,
  variant: selectedOption.variant,
  };
  };

  const getHotelBaseRateDisplayValue = (service = {}) => {
  if (normalizeServiceFilterType(service?.type) !== "hotel") {
  return roundCurrencyAmount(service?.rate || 0);
  }

  return roundCurrencyAmount(
  !service?.manualRateOverride
  ? service?.roomTypeOptionRate ||
  service?.price ||
  service?.rate ||
  service?.quoteBaseRate ||
  service?.originalTotal ||
  service?.total ||
  0
  :
  service?.quoteBaseRate ||
  service?.originalTotal ||
  service?.total ||
  service?.rate ||
  0,
  );
  };

  const getHotelVariantOptions = (services = [], service = {}) => {
  const hotelVariants = getHotelVariantServices(services, service);
  const roomCategories = buildSelectOptionsWithFallback(
  [
  ...hotelVariants.map((variant) => variant.roomCategory),
  service.roomCategory,
  ],
  HOTEL_ROOM_CATEGORY_OPTIONS,
  );
  const roomTypes = buildSelectOptionsWithFallback(
  [
  ...hotelVariants.map((variant) => variant.roomType),
  service.roomType,
  ],
  HOTEL_ROOM_TYPE_OPTIONS,
  );
  const roomTypeOptions = roomTypes.map((value) => {
  const optionRate = getHotelRoomTypeOptionRate(hotelVariants, service, value);
  const hasPrice = optionRate.amount > 0;

  return {
  value,
  label: hasPrice ? `${value} (${formatCurrencyValue(optionRate.amount, optionRate.currency)})` : value,
  };
  });
  const bedTypes = Array.from(
  new Set(
  [
  ...HOTEL_BED_TYPE_OPTIONS.map((option) => option.value),
  ...hotelVariants.map((variant) => normalizeBedTypeValue(variant.bedType)),
  normalizeBedTypeValue(service.bedType),
  ].filter(Boolean),
  ),
  );

  return {
  roomCategories,
  roomTypes: roomTypeOptions,
  bedTypes: bedTypes.map((value) => ({
  value,
  label:
  HOTEL_BED_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
  formatHotelOptionLabel(value),
  })),
  };
  };

  const scoreHotelVariantMatch = (variant = {}, nextService = {}, changedField = "") => {
  let score = 0;

  const roomCategory = normalizeComparisonTextValue(nextService.roomCategory);
  const roomType = normalizeComparisonTextValue(nextService.roomType);
  const bedType = normalizeBedTypeValue(nextService.bedType);
  const variantRoomCategory = normalizeComparisonTextValue(variant.roomCategory);
  const variantRoomType = normalizeComparisonTextValue(variant.roomType);
  const variantBedType = normalizeBedTypeValue(variant.bedType);

  if (roomCategory && variantRoomCategory === roomCategory) {
  score += changedField === "roomCategory" ? 120 : 30;
  }

  if (roomType && variantRoomType === roomType) {
  score += changedField === "roomType" ? 120 : 30;
  }

  if (bedType && variantBedType === bedType) {
  score += changedField === "bedType" ? 120 : 30;
  }

  if (
  String(variant.serviceId || variant.id || "").trim() ===
  String(nextService.serviceId || nextService.id || "").trim()
  ) {
  score += 5;
  }

  return score;
  };

  const resolveHotelVariantSelection = (services = [], service = {}, changedField = "", value = "") => {
  const nextService = {
  ...service,
  [changedField]: changedField === "bedType" ? normalizeBedTypeValue(value) : value,
  };
  const hotelVariants = getHotelVariantServices(services, service);

  if (!hotelVariants.length) {
  return applyFixedHotelOptionPricing(nextService, nextService.rate, nextService.currency);
  }

  const bestVariant = getHotelVariantForOption(
  hotelVariants,
  nextService,
  changedField,
  value,
  );

  if (!bestVariant) {
  if (changedField === "roomType") {
  const adjustedRoomTypeRate = getAdjustedHotelRoomTypeRate(hotelVariants, nextService, value);
  if (adjustedRoomTypeRate.amount > 0) {
  return {
  ...nextService,
  useStoredPricing: false,
  manualRateOverride: true,
  originalTotal: 0,
  totalInInr: 0,
  priceInInr: 0,
  hotelRateMode: "unit-rate",
  rate: roundCurrencyAmount(adjustedRoomTypeRate.amount),
  quoteBaseRate: roundCurrencyAmount(adjustedRoomTypeRate.amount),
  currency: adjustedRoomTypeRate.currency,
  };
  }
  }

  return applyFixedHotelOptionPricing(nextService, nextService.rate, nextService.currency);
  }

  const adjustedRoomTypeRate =
  changedField === "roomType"
  ? getAdjustedHotelRoomTypeRate(hotelVariants, nextService, value)
  : null;
  const matchedVariantRate = Number(bestVariant.rate ?? bestVariant.price ?? 0);
  const matchedVariantCurrency = normalizeCurrencyCode(
  adjustedRoomTypeRate?.currency || bestVariant.currency || nextService.currency || "INR",
  );
  const matchedVariantService = {
  ...nextService,
  useStoredPricing: false,
  manualRateOverride: true,
  originalTotal: 0,
  totalInInr: 0,
  priceInInr: 0,
  serviceId: bestVariant.serviceId || bestVariant.id || nextService.serviceId,
  supplierId: bestVariant.supplierId || nextService.supplierId,
  supplierName: bestVariant.supplierName || nextService.supplierName,
  title: bestVariant.title || nextService.title,
  desc: bestVariant.description || bestVariant.desc || nextService.desc,
  city: bestVariant.city || nextService.city,
  country: bestVariant.country || nextService.country,
  dmcId: bestVariant.dmcId || nextService.dmcId,
  dmcName: bestVariant.dmcName || nextService.dmcName,
  roomCategory: bestVariant.roomCategory || nextService.roomCategory,
  roomType: bestVariant.roomType || nextService.roomType,
  hotelCategory: bestVariant.hotelCategory || nextService.hotelCategory,
  bedType: normalizeBedTypeValue(bestVariant.bedType) || nextService.bedType,
  awebRate: Number(bestVariant.awebRate || 0),
  cwebRate: Number(bestVariant.cwebRate || 0),
  cwoebRate: Number(bestVariant.cwoebRate || 0),
  };

  if (adjustedRoomTypeRate?.amount > 0) {
  return {
  ...matchedVariantService,
  hotelRateMode: "unit-rate",
  rate: roundCurrencyAmount(adjustedRoomTypeRate.amount),
  quoteBaseRate: roundCurrencyAmount(adjustedRoomTypeRate.amount),
  currency: matchedVariantCurrency,
  };
  }

  if (matchedVariantRate > 0 && matchedVariantService.hotelRateMode !== "service-total") {
  return {
  ...matchedVariantService,
  rate: roundCurrencyAmount(matchedVariantRate),
  quoteBaseRate: roundCurrencyAmount(matchedVariantRate),
  currency: matchedVariantCurrency,
  };
  }

  return applyFixedHotelOptionPricing(
  matchedVariantService,
  nextService.rate ?? 0,
  matchedVariantCurrency,
  );
  };

  const getServiceSearchAliases = (type = "") => {
  switch (normalizeServiceFilterType(type)) {
  case "hotel":
  return "hotel stay room";
  case "transfer":
  return "transport transfer car cab vehicle";
  case "activity":
  return "activity experience";
  case "sightseeing":
  return "sightseeing sightsheeting tour";
  default:
  return "";
  }
  };

  const getServiceSearchText = (service = {}) =>
  [
  service.title,
  service.serviceName,
  service.hotelName,
  service.city,
  service.country,
  service.vehicleType,
  service.usageType,
  service.hotelCategory,
  service.roomType,
  service.bedType,
  service.desc,
  normalizeServiceFilterType(service.type),
  getServiceSearchAliases(service.type),
  ]
  .map((value) => String(value || "").trim().toLowerCase())
  .filter(Boolean)
  .join(" ");

  const normalizeDestinationMatchText = (value = "") =>
  String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

  const getDestinationMatchTerms = (destination = "") => {
  const rawDestination = String(destination || "").trim();
  if (!rawDestination) return [];

  const normalizedFull = normalizeDestinationMatchText(rawDestination);
  const normalizedParts = rawDestination
  .split(/[,/|&+>-]+/)
  .map((part) => normalizeDestinationMatchText(part))
  .filter((part) => part && part.length >= 3);

  return expandDestinationAliases([normalizedFull, ...normalizedParts]);
  };

  const doesServiceMatchDestination = (service = {}, destination = "") => {
  const destinationTerms = getDestinationMatchTerms(destination);
  if (!destinationTerms.length) return true;

  const serviceLocationText = normalizeDestinationMatchText([
    service.city,
    service.country,
    service.title,
    service.serviceName,
    service.hotelName,
    service.desc,
    service.description,
  ].join(" "));

  if (!serviceLocationText) {
    return false;
  }

  return destinationTerms.some((term) => serviceLocationText.includes(term));
  };

  const getServiceTypeLabel = (type = "") =>
  SERVICE_TYPE_LABELS[String(type || "").toLowerCase()] || "Service";

  const getSelectedServiceIconTone = (type = "") => {
  switch (normalizeServiceFilterType(type)) {
  case "hotel":
  return "bg-[#2f7cf6]";
  case "activity":
  return "bg-[#00C950]";
  case "transfer":
  return "bg-[#AD46FF]";
  case "sightseeing":
  return "bg-[#4f8bff]";
  default:
  return "bg-slate-500";
  }
  };

  const renderSelectedServiceSummaryIcon = (service = {}) => {
  const iconTone = getSelectedServiceIconTone(service.type);

  if (React.isValidElement(service.icon)) {
  return React.cloneElement(service.icon, {
  className: `h-5 w-5 rounded-lg p-1 text-white ${iconTone}`,
  });
  }

  return (
  <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-semibold text-white
    ${iconTone}`}>
    {String(service.icon || service.title || "S").trim().charAt(0).toUpperCase()}
  </span>
  );
  };

  const getSelectedServiceIncludedItems = (service = {}) => {
  const normalizedItems = String(service?.desc || service?.description || "")
  .split(/,|\||\n/)
  .map((item) => item.trim())
  .filter(Boolean);

  return Array.from(new Set(normalizedItems)).slice(0, 12);
  };

  const formatServiceDateLabel = (value) => {
  if (!value) return "Date pending";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  });
  };

  const getServiceCardDomId = (serviceId) => `quotation-service-card-${serviceId}`;
  const getSelectedServiceSummaryDomId = (serviceId) => `quotation-selected-service-${serviceId}`;

  const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;

  return INDIAN_DESTINATION_KEYWORDS.some((keyword) =>
  normalizedDestination.includes(keyword),
  );
  };

  const getExchangeRateForCurrency = (currency = "INR", exchangeRates = {}) => {
  const code = normalizeCurrencyCode(currency);
  if (code === "INR") return 1;

  const configuredRate = Number(exchangeRates?.[code]);
  if (Number.isFinite(configuredRate) && configuredRate > 0) {
  return configuredRate;
  }

  return Number(DEFAULT_EXCHANGE_RATES[code] || 1);
  };

  const convertAmountToInr = (value, currency = "INR", exchangeRates = {}) =>
  roundCurrencyAmount(
  Number(value || 0) * getExchangeRateForCurrency(currency, exchangeRates),
  );

  const calculateServiceOriginalTotal = (service = {}) => {
  const normalizedType = String(service?.type || "").toLowerCase();

  if (normalizedType === "hotel") {
  const nights = Math.max(Number(service?.nights || 0), 0);
  const rooms = Math.max(Number(service?.rooms || 1), 1);
  const hotelQuantity = (nights || 1) * rooms;
  const hotelBaseAmount = Number(service?.rate || 0) * hotelQuantity;
  const addonMultiplier = hotelQuantity;
  let total = hotelBaseAmount;

  if (service?.extraAdult) {
  total += Number(service?.awebRate || 0) * addonMultiplier;
  }

  if (service?.childWithBed) {
  total += Number(service?.cwebRate || 0) * addonMultiplier;
  }

  if (service?.childWithoutBed) {
  total += Number(service?.cwoebRate || 0) * addonMultiplier;
  }

  return roundCurrencyAmount(total);
  }

  if (normalizedType === "transfer" || normalizedType === "car") {
  return roundCurrencyAmount(Number(service?.rate || 0) * Number(service?.days || 1));
  }

  if (normalizedType === "activity") {
  return roundCurrencyAmount(Number(service?.rate || 0) * Number(service?.pax || 1));
  }

  if (normalizedType === "sightseeing") {
  return roundCurrencyAmount(
  Number(service?.rate || 0) *
  Math.max(Number(service?.pax || 1), Number(service?.days || 1)),
  );
  }

  return roundCurrencyAmount(Number(service?.rate || 0));
  };

  const normalizeComparisonDateValue = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
  return String(value || "").trim();
  }

  return parsed.toISOString().slice(0, 10);
  };

  const normalizeComparisonTextValue = (value = "") =>
  String(value || "").trim().toLowerCase();

  const normalizeComparisonCountValue = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) {
  return "";
  }

  return Number(value || fallback);
  };

  const buildServiceEditBaseline = (service = {}) => {
  const normalizedType = normalizeServiceFilterType(service.type);
  const normalizedRoomCategory =
  normalizedType === "hotel" ? service.roomCategory || "Double" : service.roomCategory;
  const resolvedRoomType =
  normalizedType === "hotel" ? inferHotelRoomTypeValue(service) : String(service.roomType || "");
  const normalizedBedType =
  normalizedType === "hotel"
  ? normalizeBedTypeValue(service.bedType) || "double-bed"
  : normalizeBedTypeValue(service.bedType) || normalizeComparisonTextValue(service.bedType);
  const isHotelServiceTotal =
  normalizedType === "hotel" && service?.hotelRateMode === "service-total";

  return ({
  quoteBaseRate: roundCurrencyAmount(service.quoteBaseRate ?? service.originalTotal ?? service.total ?? service.rate ?? 0),
  originalTotal: roundCurrencyAmount(service.originalTotal ?? service.total ?? 0),
  total: roundCurrencyAmount(service.total ?? service.originalTotal ?? 0),
  rate: roundCurrencyAmount(
  isHotelServiceTotal
  ? service.originalTotal ?? service.total ?? service.rate ?? service.price ?? 0
  : service.price ?? service.rate ?? 0,
  ),
  serviceDate: normalizeComparisonDateValue(service.serviceDate),
  nights: normalizeComparisonCountValue(service.nights),
  days: Number(service.days || 1),
  pax: Number(service.pax || 1),
  rooms: Number(service.rooms || 1),
  usageType: normalizeTransportUsageValue(service.usageType),
  roomCategory: normalizeComparisonTextValue(normalizedRoomCategory),
  roomType: normalizeComparisonTextValue(resolvedRoomType),
  roomTypeOptionRate: roundCurrencyAmount(
  service.roomTypeOptionRate ??
  service.baseRoomTypeRate ??
  service.contractRoomTypeRate ??
  service.price ??
  (isHotelServiceTotal ? 0 : service.rate) ??
  0,
  ),
  roomTypeOptionCurrency: normalizeCurrencyCode(
  service.roomTypeOptionCurrency || service.currency || "INR",
  ),
  bedType: normalizedBedType,
  extraAdult: Boolean(service.extraAdult),
  childWithBed: Boolean(service.childWithBed),
  childWithoutBed: Boolean(service.childWithoutBed),
  awebRate: roundCurrencyAmount(service.awebRate || 0),
  cwebRate: roundCurrencyAmount(service.cwebRate || 0),
  cwoebRate: roundCurrencyAmount(service.cwoebRate || 0),
  });
  };

  const getSelectedServiceQuotationEdits = (service = {}) => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const edits = [];
  const serviceType = normalizeServiceFilterType(service.type);
  const currencyCode = normalizeCurrencyCode(service.currency || "INR");

  const pushEdit = (key, label, value, variant = "info") => {
  edits.push({ key, label, value, variant });
  };

  if (roundCurrencyAmount(service.rate || 0) !== roundCurrencyAmount(baseline.rate || 0)) {
  pushEdit("rate", "Rate", formatCurrencyValue(service.rate || 0, currencyCode), "warning");
  }

  if (normalizeComparisonDateValue(service.serviceDate) !== normalizeComparisonDateValue(baseline.serviceDate)) {
  pushEdit("serviceDate", "Date", formatServiceDateLabel(service.serviceDate), "info");
  }

  if (serviceType === "hotel") {
  if (normalizeComparisonCountValue(service.nights) !== normalizeComparisonCountValue(baseline.nights)) {
  pushEdit(
  "nights",
  "Nights",
  `${Number(service.nights || 0)} night${Number(service.nights || 0) === 1 ? "" : "s"}`,
  "info",
  );
  }

  if (Number(service.rooms || 1) !== Number(baseline.rooms || 1)) {
  pushEdit(
  "rooms",
  "Rooms",
  `${Number(service.rooms || 0)} room${Number(service.rooms || 0) === 1 ? "" : "s"}`,
  "info",
  );
  }

  if (normalizeComparisonTextValue(service.roomType) !== normalizeComparisonTextValue(baseline.roomType)) {
  pushEdit("roomType", "Room", service.roomType || "Updated", "info");
  }

  if (normalizeComparisonTextValue(service.roomCategory) !== normalizeComparisonTextValue(baseline.roomCategory)) {
  pushEdit("roomCategory", "Category", service.roomCategory || "Updated", "info");
  }

  if (normalizeComparisonTextValue(service.bedType) !== normalizeComparisonTextValue(baseline.bedType)) {
  const bedLabel = getBedTypeOptionLabel(service.bedType) || "Updated";
  pushEdit("bedType", "Bed", bedLabel, "info");
  }
  }

  if (serviceType === "transfer") {
  if (Number(service.days || 1) !== Number(baseline.days || 1)) {
  pushEdit(
  "days",
  "Days",
  `${Number(service.days || 0)} day${Number(service.days || 0) === 1 ? "" : "s"}`,
  "info",
  );
  }

  if (normalizeComparisonTextValue(service.usageType) !== normalizeComparisonTextValue(baseline.usageType)) {
  pushEdit(
  "usageType",
  "Usage",
  String(service.usageType || "")
  .replace(/-/g, " ")
  .replace(/\b\w/g, (char) => char.toUpperCase()) || "Updated",
  "info",
  );
  }
  }

  if (serviceType === "activity" || serviceType === "sightseeing") {
  if (Number(service.pax || 1) !== Number(baseline.pax || 1)) {
  pushEdit("pax", "Pax", `${Number(service.pax || 0)} pax`, "info");
  }
  }

  if (serviceType === "sightseeing" && Number(service.days || 1) !== Number(baseline.days || 1)) {
  pushEdit(
  "days",
  "Days",
  `${Number(service.days || 0)} day${Number(service.days || 0) === 1 ? "" : "s"}`,
  "info",
  );
  }

  [
  {
  key: "aweb",
  enabled: Boolean(service.extraAdult),
  baselineEnabled: Boolean(baseline.extraAdult),
  rate: roundCurrencyAmount(service.awebRate || 0),
  baselineRate: roundCurrencyAmount(baseline.awebRate || 0),
  label: "A.W.E.B",
  },
  {
  key: "cweb",
  enabled: Boolean(service.childWithBed),
  baselineEnabled: Boolean(baseline.childWithBed),
  rate: roundCurrencyAmount(service.cwebRate || 0),
  baselineRate: roundCurrencyAmount(baseline.cwebRate || 0),
  label: "C.W.E.B",
  },
  {
  key: "cwoeb",
  enabled: Boolean(service.childWithoutBed),
  baselineEnabled: Boolean(baseline.childWithoutBed),
  rate: roundCurrencyAmount(service.cwoebRate || 0),
  baselineRate: roundCurrencyAmount(baseline.cwoebRate || 0),
  label: "C.Wo.E.B",
  },
  ].forEach((addon) => {
  const enabledChanged = addon.enabled !== addon.baselineEnabled;
  const rateChanged = addon.rate !== addon.baselineRate;

  if (addon.enabled && (enabledChanged || rateChanged)) {
  pushEdit(
  addon.key,
  addon.label,
  `${formatCurrencyValue(addon.rate, currencyCode)}/night`,
  "success",
  );
  return;
  }

  if (!addon.enabled && addon.baselineEnabled) {
  pushEdit(addon.key, addon.label, "Removed", "danger");
  }
  });

  return edits;
  };

  const QuotationBuilder = () => {
  const resolveDmcOwner = (service = {}) => ({
  dmcId: service.dmcId || service.supplierId || "",
  dmcName: service.dmcName || "",
  });

  const formatDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
  };

  const addDaysToDate = (value, daysToAdd = 0) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
  };

  const normalizeQuotationServiceType = (type) => {
  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType === "car" || normalizedType === "transport") {
  return "transfer";
  }

  return normalizedType || type;
  };

  const parsePackageServiceDayNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const match = String(value).match(/(\d+)/);
  if (!match) return null;

  const parsedDay = Number(match[1]);
  if (!Number.isFinite(parsedDay) || parsedDay <= 0) return null; return parsedDay; }; const
    getPackageServiceDate=(serviceDay)=> {
    const dayNumber = parsePackageServiceDayNumber(serviceDay);
    if (!dayNumber || !order?.startDate) return "";

    return addDaysToDate(order.startDate, dayNumber - 1);
    };

    const getPackageServiceQuantity = (item = {}, fallbackKeys = []) => {
    const keys = ["quantity", "qty", ...fallbackKeys];

    for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value) && value > 0) {
    return value;
    }
    }

    return 1;
    };

    const getPackageMatchedServiceDayValue = (item = {}, serviceType = "") => {
    const directDayValue = item.day || item.dayNumber || item.serviceDay || "";
    if (directDayValue) return directDayValue;

    const normalizedType = String(serviceType || "").toLowerCase();
    if (
    (normalizedType === "transfer" || normalizedType === "car") &&
    !item.quantity &&
    !item.qty
    ) {
    return item.days || "";
    }

    return "";
    };

    const normalizeServiceLabel = (value) =>
    (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

    const normalizeLocationLabel = (value) =>
    (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

    const getServiceTokens = (value) =>
    (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

    const getComparableServiceType = (type = "") => {
    const normalizedType = normalizeQuotationServiceType(type);
    return normalizedType === "transport" ? "transfer" : normalizedType;
    };

    const getPackageItemDisplayNames = (item = {}) =>
    [
    item.name,
    item.hotelName,
    item.serviceName,
    item.title,
    ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

    const getContractedServiceDisplayNames = (service = {}) =>
    [
    service.title,
    service.serviceName,
    service.hotelName,
    ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

    const getPackageLocationNames = (pkg = {}) =>
    [
    pkg.destination,
    pkg.city,
    pkg.country,
    ]
    .flatMap((value) => expandDestinationAliases([normalizeLocationLabel(value)]))
    .filter(Boolean);

    const getServiceLocationNames = (service = {}) =>
    [
    service.city,
    service.country,
    ]
    .flatMap((value) => expandDestinationAliases([normalizeLocationLabel(value)]))
    .filter(Boolean);

    const doesServiceMatchPackageLocation = (service = {}, pkg = {}) => {
    const packageLocations = getPackageLocationNames(pkg);
    if (!packageLocations.length) {
    return true;
    }

    const serviceLocations = getServiceLocationNames(service);
    if (!serviceLocations.length) {
    return false;
    }

    return packageLocations.some((packageLocation) =>
    serviceLocations.some((serviceLocation) => {
    if (!packageLocation || !serviceLocation) {
    return false;
    }

    if (
    packageLocation === serviceLocation ||
    packageLocation.includes(serviceLocation) ||
    serviceLocation.includes(packageLocation)
    ) {
    return true;
    }

    const packageTokens = getServiceTokens(packageLocation);
    const serviceTokens = getServiceTokens(serviceLocation);
    const overlappingTokens = packageTokens.filter((token) =>
    serviceTokens.includes(token),
    );

    return overlappingTokens.length > 0;
    }),
    );
    };

    const getPackageItemMatchScore = (item = {}, service = {}) => {
    if (
    getComparableServiceType(item.packageType || item.type) !==
    getComparableServiceType(service.type)
    ) {
    return -1;
    }

    const packageNames = getPackageItemDisplayNames(item);
    const serviceNames = getContractedServiceDisplayNames(service);
    let bestScore = 0;

    for (const packageName of packageNames) {
    const normalizedPackageName = normalizeServiceLabel(packageName);
    const packageTokens = getServiceTokens(packageName);

    for (const serviceName of serviceNames) {
    const normalizedServiceName = normalizeServiceLabel(serviceName);
    const serviceTokens = getServiceTokens(serviceName);

    if (!normalizedPackageName || !normalizedServiceName) {
    continue;
    }

    if (normalizedPackageName === normalizedServiceName) {
    bestScore = Math.max(bestScore, 100);
    continue;
    }

    if (
    normalizedPackageName.includes(normalizedServiceName) ||
    normalizedServiceName.includes(normalizedPackageName)
    ) {
    bestScore = Math.max(bestScore, 88);
    continue;
    }

    const overlappingTokens = packageTokens.filter((token) =>
    serviceTokens.includes(token),
    );

    if (
    packageTokens.length > 0 &&
    serviceTokens.length > 0 &&
    overlappingTokens.length >= Math.min(2, packageTokens.length, serviceTokens.length)
    ) {
    bestScore = Math.max(bestScore, 72 + overlappingTokens.length);
    continue;
    }

    if (
    overlappingTokens.length === 1 &&
    (packageTokens.length <= 2 || serviceTokens.length <= 2)
    ) {
    bestScore = Math.max(bestScore, 58);
    }
    }
    }

    return bestScore;
    };

    const buildPackageServicePatch=(item={}, service={})=> {
      const quantity = getPackageServiceQuantity(
      item,
      service.type === "hotel"
      ? ["nights", "days"]
      : service.type === "transfer" || service.type === "car"
      ? ["days", "duration"]
      : ["pax", "days"],
      );
      const serviceDate =
      getPackageServiceDate(getPackageMatchedServiceDayValue(item, service.type)) ||
      service.serviceDate ||
      formatDateInput(order?.startDate);
      const unit = String(item.unit || "").toLowerCase();

      if (service.type === "hotel") {
      return {
      checked: true,
      serviceDate,
      nights: Math.max(1, quantity),
      };
      }

      if (service.type === "transfer" || service.type === "car") {
      return {
      checked: true,
      serviceDate,
      days: Math.max(1, quantity),
      };
      }

      if (service.type === "activity") {
      return {
      checked: true,
      serviceDate,
      pax: Math.max(1, quantity),
      };
      }

      if (service.type === "sightseeing") {
      return {
      checked: true,
      serviceDate,
      ...(unit.includes("day")
      ? { days: Math.max(1, quantity) }
      : { pax: Math.max(1, quantity) }),
      };
      }

      return {
      checked: true,
      serviceDate,
      };
      };

      const buildPackageMatchedServices = (availableServices = [], pkg) => {
      if (!pkg) {
      return availableServices;
      }

      const packageServices = [
      ...(pkg.hotels || []).map((item) => ({ ...item, packageType: "hotel" })),
      ...(pkg.activities || []).map((item) => ({ ...item, packageType: "activity" })),
      ...(pkg.sightseeing || []).map((item) => ({ ...item, packageType: "sightseeing" })),
      ...(pkg.transfers || []).map((item) => ({ ...item, packageType: "transfer" })),
      ];

      const matchedUpdates = new Map();
      const usedServiceIds = new Set();

      packageServices.forEach((item) => {
      const compatibleServices = availableServices.filter(
      (service) =>
      !usedServiceIds.has(service.id) &&
      getComparableServiceType(service.type) === getComparableServiceType(item.packageType) &&
      doesServiceMatchPackageLocation(service, pkg),
      );

      if (!compatibleServices.length) {
      return;
      }

      const rankedMatches = compatibleServices
      .map((service) => ({
      service,
      score: getPackageItemMatchScore(item, service),
      }))
      .sort((first, second) => second.score - first.score);

      const strongMatch = rankedMatches.find(({ score }) => score >= 58)?.service;
      const selectedService = strongMatch || compatibleServices[0];

      if (!selectedService) {
      return;
      }

      usedServiceIds.add(selectedService.id);
      matchedUpdates.set(
      selectedService.id,
      buildPackageServicePatch(item, selectedService),
      );
      });

      return availableServices.map((service) =>
      matchedUpdates.has(service.id)
      ? { ...service, ...matchedUpdates.get(service.id) }
      : { ...service, checked: false },
      );
      };

      const havePackageSelectionsChanged = (previousServices = [], nextServices = []) =>
      nextServices.some((service, index) => {
      const previous = previousServices[index];

      if (!previous) {
      return true;
      }

      return (
      previous.checked !== service.checked ||
      previous.serviceDate !== service.serviceDate ||
      Number(previous.nights || 0) !== Number(service.nights || 0) ||
      Number(previous.days || 0) !== Number(service.days || 0) ||
      Number(previous.pax || 0) !== Number(service.pax || 0)
      );
      });

      // markup
      const location = useLocation();
      const order = location.state ?? null;
      const hasOrderContext = Boolean(order?._id);
      const orderQueryId = order?.queryId || "";
      const navigate = useNavigate();
      const currentUserRole = useMemo(() => getCurrentUserRole(), []);
      const showLatestSentQuotationCard = currentUserRole === "operations";
      const DEFAULT_GST_PERCENT = 5;
      const DEFAULT_TCS_PERCENT = 0;
      const DEFAULT_TOURISM_AMOUNT = 500;

      const [showOpsPopup, setShowOpsPopup] = useState(false);
      // markup
      const [markup, setMarkup] = useState(5);
      const [showSendOptions, setShowSendOptions] = useState(false);
      const [inclusions, setInclusions] = useState([]);
      const [exclusions, setExclusions] = useState([]);
      const [additionalNotes, setAdditionalNotes] = useState([]);
      const [dayWiseItinerary, setDayWiseItinerary] = useState([]);
      const [dynamicNoteInputs, setDynamicNoteInputs] = useState({
      inclusion: "",
      exclusion: "",
      additionalNote: "",
      });
      // ops charges
      const [serviceCharge, setServiceCharge] = useState(0);
      const [handlingFee, setHandlingFee] = useState(0);

      const [appliedTaxTotal, setAppliedTaxTotal] = useState(0);

      // tax toggle
      const [gstChecked, setGstChecked] = useState(false);
      const [tcsChecked, setTcsChecked] = useState(false);
      const [tourismChecked, setTourismChecked] = useState(false);

      // manual override
      const [gstAmount, setGstAmount] = useState("");
      const [tcsAmount, setTcsAmount] = useState("");
      const [tourismAmount, setTourismAmount] = useState("");

      // quotation
      const [validTill, setValidTill] = useState("");

      const [draftServiceCharge, setDraftServiceCharge] = useState(0);
      const [draftHandlingFee, setDraftHandlingFee] = useState(0);
      const [draftValidTill, setDraftValidTill] = useState("");

      const [draftGstChecked, setDraftGstChecked] = useState(false);
      const [draftTcsChecked, setDraftTcsChecked] = useState(false);
      const [draftTourismChecked, setDraftTourismChecked] = useState(false);
      const [gstPercent, setGstPercent] = useState(DEFAULT_GST_PERCENT);
      const [tcsPercent, setTcsPercent] = useState(DEFAULT_TCS_PERCENT);
      const [draftGstPercent, setDraftGstPercent] = useState(DEFAULT_GST_PERCENT);
      const [draftTcsPercent, setDraftTcsPercent] = useState(DEFAULT_TCS_PERCENT);
      const [draftTourismAmount, setDraftTourismAmount] = useState(0);
      const [taxSetupMode, setTaxSetupMode] = useState("manual");

      const [showQuickServiceModal, setShowQuickServiceModal] = useState(false);
      const [showQueryRequirements, setShowQueryRequirements] = useState(false);
      const [marginType, setMarginType] = useState("percentage");
      const [fixedMargin, setFixedMargin] = useState(0);
      const [successPopup, setSuccessPopup] = useState({
      open: false,
      kind: "quote",
      invoiceNumber: "",
      totalAmount: 0,
      serviceCount: 0,
      agentName: "",
      deliveryWarnings: [],
      });
      const [services, setServices] = useState([]);
      const [servicesLoading, setServicesLoading] = useState(true);
      const [servicesLoadError, setServicesLoadError] = useState("");
      const backgroundRatesRefreshRef = useRef({
      inFlight: false,
      lastStartedAt: 0,
      });
      const [quotationId, setQuotationId] = useState("");
      const [loadedQuotationDraft, setLoadedQuotationDraft] = useState(null);
      const [baseServicesSnapshot, setBaseServicesSnapshot] = useState([]);
      const [quotationHistory, setQuotationHistory] = useState([]);
      const [quotationHistoryLoading, setQuotationHistoryLoading] = useState(false);
      const [quotationHistoryLoadError, setQuotationHistoryLoadError] = useState("");
      const [isQuotationHistoryOpen, setIsQuotationHistoryOpen] = useState(false);
      const [selectedHistoryQuotationId, setSelectedHistoryQuotationId] = useState("");
      const [activeDraftSourceQuotationId, setActiveDraftSourceQuotationId] = useState(
      String(order?.editQuotationId || "").trim(),
      );
      const [editingTargetQuotationId, setEditingTargetQuotationId] = useState(
      String(order?.editQuotationId || "").trim(),
      );
      const [editingSourceQuotationSnapshot, setEditingSourceQuotationSnapshot] = useState(null);
      const editingSourceQuotationSnapshotRef = useRef(null);
      const [isFreshDraftMode, setIsFreshDraftMode] = useState(false);
      const [draftSourceReloadRequest, setDraftSourceReloadRequest] = useState(0);
      const [resolvedAgentPhone, setResolvedAgentPhone] = useState(
      String(order?.agent?.phone || "").trim(),
      );
      const [savingService, setSavingService] = useState(false);
      const [selectedSendOption, setSelectedSendOption] = useState(null);
      const [selectedPackageTemplate, setSelectedPackageTemplate] = useState(null);
      const [exchangeRates, setExchangeRates] = useState(() => ({ ...DEFAULT_EXCHANGE_RATES }));
      const [quickActionPopup, setQuickActionPopup] = useState(null);
      const [contractedRatesSearch, setContractedRatesSearch] = useState("");
      const [contractedRatesFilter, setContractedRatesFilter] = useState("all");
      const [focusedServiceCardId, setFocusedServiceCardId] = useState("");
      const [editingServiceCardId, setEditingServiceCardId] = useState("");
      const [isSelectedServicesModalOpen, setIsSelectedServicesModalOpen] = useState(false);
      const [selectedServicesModalTargetId, setSelectedServicesModalTargetId] = useState("");
      const [selectedServicesModalScope, setSelectedServicesModalScope] = useState("all");
      const [activeWorkspaceModal, setActiveWorkspaceModal] = useState("");
      const [draftHydrated, setDraftHydrated] = useState(false);
      const [savingDraftQuote, setSavingDraftQuote] = useState(false);
      const [showFinanceInvoiceConfirm, setShowFinanceInvoiceConfirm] = useState(false);
      const [transportSelectionConfirm, setTransportSelectionConfirm] = useState({
      open: false,
      serviceId: "",
      serviceTitle: "",
      passengerCapacity: 0,
      passengerCount: 0,
      });
      const [preparingFinanceInvoice, setPreparingFinanceInvoice] = useState(false);
      const isEditingHistoricalQuotation = Boolean(editingTargetQuotationId);
      const isAnyWorkspaceModalOpen =
      isSelectedServicesModalOpen || Boolean(activeWorkspaceModal);
      const isInvoiceRequestedStage = order?.opsStatus === "Invoice_Requested";
      const quoteCategory = isIndianDestination(order?.destination)
      ? "domestic"
      : "international";
      const sendOptions = [
      {
      label: "Dashboard Notification",
      description: "In-app alert to agent",
      icon: Bell,
      },
      {
      label: "Email",
      description: `Send to ${order?.agent?.email || "agent email"}`,
      icon: Mail,
      },
      {
      label: "WhatsApp",
      description: "Direct message link",
      icon: MessageCircle,
      },
      {
      label: "PDF Download",
      description: "Formatted quote document",
      icon: Download,
      },
      {
      label: "Word Format",
      description: "Editable quotation document",
      icon: FileText,
      },
      ];

      const sendOptionsPanelStyle = {
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      };

      const showQuickActionFeedback = (type, title, message) => {
      setQuickActionPopup({ type, title, message });
      };

      const updateDynamicNoteInput = (field, value) => {
      setDynamicNoteInputs((prev) => ({
      ...prev,
      [field]: value,
      }));
      };

      const appendDynamicNoteItem = (field) => {
      const normalizedValue = String(dynamicNoteInputs?.[field] || "")
      .replace(/\s+/g, " ")
      .trim();

      if (!normalizedValue) return;

      const applyUpdate =
      field === "inclusion"
      ? setInclusions
      : field === "exclusion"
      ? setExclusions
      : setAdditionalNotes;

      applyUpdate((prev) => {
      const nextItems = sanitizeDynamicListItems([...prev, normalizedValue]);
      return Array.from(new Set(nextItems));
      });

      setDynamicNoteInputs((prev) => ({
      ...prev,
      [field]: "",
      }));
      };

      const removeDynamicNoteItem = (field, indexToRemove) => {
      const applyUpdate =
      field === "inclusion"
      ? setInclusions
      : field === "exclusion"
      ? setExclusions
      : setAdditionalNotes;

      applyUpdate((prev) => prev.filter((_, index) => index !== indexToRemove));
      };

      const openOpsChargesPopup = () => {
      setShowOpsPopup(true);
      setDraftServiceCharge(roundCurrencyAmount(serviceCharge));
      setDraftHandlingFee(roundCurrencyAmount(handlingFee));
      setDraftValidTill(validTill);
      setDraftGstChecked(gstChecked);
      setDraftTcsChecked(tcsChecked);
      setDraftTourismChecked(tourismChecked);
      setDraftGstPercent(Number(gstPercent || DEFAULT_GST_PERCENT));
      setDraftTcsPercent(Number(tcsPercent || DEFAULT_TCS_PERCENT));
      setDraftTourismAmount(roundCurrencyAmount(tourismAmount || DEFAULT_TOURISM_AMOUNT));
      setTaxSetupMode("manual");
      };

      const applyAutoTaxPreset = () => {
      setTaxSetupMode("auto");
      setDraftGstChecked(true);
      setDraftTcsChecked(true);
      setDraftTourismChecked(true);
      setDraftGstPercent((prev) =>
      Number(prev || DEFAULT_GST_PERCENT) || DEFAULT_GST_PERCENT
      );
      setDraftTcsPercent((prev) => Number(prev || DEFAULT_TCS_PERCENT));
      setDraftTourismAmount((prev) =>
      roundCurrencyAmount(prev || DEFAULT_TOURISM_AMOUNT) || DEFAULT_TOURISM_AMOUNT
      );
      };

      useEffect(() => {
      if (!quickActionPopup) return undefined;

      const timer = setTimeout(() => {
      setQuickActionPopup(null);
      }, 2200);

      return () => clearTimeout(timer);
      }, [quickActionPopup]);

      useEffect(() => {
      if (!focusedServiceCardId) return undefined;

      const timer = setTimeout(() => {
      setFocusedServiceCardId("");
      }, 2200);

      return () => clearTimeout(timer);
      }, [focusedServiceCardId]);

      useEffect(() => {
      if (!editingServiceCardId) return;

      const activeService = services.find((service) => service.id === editingServiceCardId);
      if (!activeService || !activeService.checked) {
      setEditingServiceCardId("");
      }
      }, [editingServiceCardId, services]);

      useEffect(() => {
      if (!isAnyWorkspaceModalOpen || typeof document === "undefined") {
      return undefined;
      }

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
      document.body.style.overflow = previousOverflow;
      };
      }, [isAnyWorkspaceModalOpen]);

      useEffect(() => {
      if (!isAnyWorkspaceModalOpen || typeof window === "undefined") {
      return undefined;
      }

      const handleEscape = (event) => {
      if (event.key === "Escape") {
      if (activeWorkspaceModal) {
      setActiveWorkspaceModal("");
      return;
      }

      closeSelectedServicesModal();
      }
      };

      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
      }, [activeWorkspaceModal, isAnyWorkspaceModalOpen]);

      useEffect(() => {
      if (!isSelectedServicesModalOpen || selectedServicesModalScope !== "single") return;

      const targetExists = services.some(
      (service) => service.checked && service.id === selectedServicesModalTargetId,
      );

      if (!targetExists) {
      closeSelectedServicesModal();
      }
      }, [
      isSelectedServicesModalOpen,
      services,
      selectedServicesModalScope,
      selectedServicesModalTargetId,
      ]);

      useEffect(() => {
      if (!isSelectedServicesModalOpen || !selectedServicesModalTargetId || typeof window === "undefined") {
      return undefined;
      }

      const timer = window.setTimeout(() => {
      const target = document.getElementById(
      getSelectedServiceSummaryDomId(selectedServicesModalTargetId),
      );

      target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 180);

      return () => window.clearTimeout(timer);
      }, [isSelectedServicesModalOpen, selectedServicesModalTargetId, services]);

      useEffect(() => {
      setResolvedAgentPhone(String(order?.agent?.phone || "").trim());
      }, [order?._id, order?.agent?.phone]);

      useEffect(() => {
      let isDisposed = false;

      const loadQuotationHistory = async () => {
      if (!order?._id) {
      setQuotationHistory([]);
      setSelectedHistoryQuotationId("");
      setQuotationHistoryLoadError("");
      return;
      }

      try {
      setQuotationHistoryLoading(true);
      setQuotationHistoryLoadError("");
      const { data } = await API.get(`/ops/queries/${order._id}/quotations`);
      const nextHistory = Array.isArray(data?.data?.quotations) ? data.data.quotations : [];

      if (isDisposed) {
      return;
      }

      setQuotationHistory(nextHistory);
      setSelectedHistoryQuotationId((prev) => {
      if (prev && nextHistory.some((quotation) => quotation.id === prev)) {
      return prev;
      }

      return nextHistory[0]?.id || "";
      });
      } catch (error) {
      if (isDisposed) {
      return;
      }

      console.error("Failed to load quotation history", error);
      setQuotationHistory([]);
      setSelectedHistoryQuotationId("");
      setQuotationHistoryLoadError(
      error?.response?.data?.message || "Unable to load quotation history right now.",
      );
      } finally {
      if (!isDisposed) {
      setQuotationHistoryLoading(false);
      }
      }
      };

      loadQuotationHistory();

      return () => {
      isDisposed = true;
      };
      }, [order?._id]);

      const selectedHistoryQuotation = useMemo(
      () =>
      quotationHistory.find((quotation) => quotation.id === selectedHistoryQuotationId) || null,
      [quotationHistory, selectedHistoryQuotationId],
      );
      const latestSentQuotation = useMemo(
      () =>
      quotationHistory.find((quotation) =>
      ["Quote Sent", "Quote Accepted", "Markup Applied", "Sent to Client", "Confirmed"].includes(
      String(quotation?.status || "").trim(),
      ),
      ) || quotationHistory[0] || null,
      [quotationHistory],
      );

      const resetBuilderWorkspace = () => {
      setQuotationId("");
      setLoadedQuotationDraft(null);
      setValidTill("");
      setDraftValidTill("");
      setMarginType("percentage");
      setMarkup(0);
      setFixedMargin(0);
      setServiceCharge(0);
      setHandlingFee(0);
      setDraftServiceCharge(0);
      setDraftHandlingFee(0);
      setGstChecked(false);
      setTcsChecked(false);
      setTourismChecked(false);
      setDraftGstChecked(false);
      setDraftTcsChecked(false);
      setDraftTourismChecked(false);
      setGstPercent(DEFAULT_GST_PERCENT);
      setTcsPercent(DEFAULT_TCS_PERCENT);
      setDraftGstPercent(DEFAULT_GST_PERCENT);
      setDraftTcsPercent(DEFAULT_TCS_PERCENT);
      setGstAmount("");
      setTcsAmount("");
      setTourismAmount("");
      setDraftTourismAmount(0);
      setAppliedTaxTotal(0);
      setInclusions([]);
      setExclusions([]);
      setAdditionalNotes([]);
      setSelectedPackageTemplate(null);
      setDayWiseItinerary(
      reconcileDayWiseItineraryItems(
      [],
      getTripDuration(order?.startDate, order?.endDate).days,
      formatDateInput(order?.startDate),
      ),
      );
      setDraftHydrated(false);

      if (baseServicesSnapshot.length) {
      setServices(baseServicesSnapshot.map((service) => ({ ...service })));
      }
      };

      const applyQuotationDraftToBuilder = (quotation) => {
      if (!quotation) return;

      setQuotationId(quotation._id || quotation.id || "");
      setLoadedQuotationDraft(quotation);
      setValidTill(formatDateInput(quotation.validTill));
      setDraftValidTill(formatDateInput(quotation.validTill));

      const draftOpsMarkupPercent = Number(quotation?.pricing?.opsMarkup?.percent || 0);
      const draftOpsMarkupAmount = roundCurrencyAmount(quotation?.pricing?.opsMarkup?.amount || 0);
      if (draftOpsMarkupPercent > 0) {
      setMarginType("percentage");
      setMarkup(draftOpsMarkupPercent);
      setFixedMargin(0);
      } else if (draftOpsMarkupAmount > 0) {
      setMarginType("fixed");
      setFixedMargin(draftOpsMarkupAmount);
      setMarkup(0);
      } else {
      setMarginType("percentage");
      setMarkup(0);
      setFixedMargin(0);
      }

      const nextServiceCharge = roundCurrencyAmount(quotation?.pricing?.opsCharges?.serviceCharge || 0);
      const nextHandlingFee = roundCurrencyAmount(quotation?.pricing?.opsCharges?.handlingFee || 0);
      setServiceCharge(nextServiceCharge);
      setHandlingFee(nextHandlingFee);
      setDraftServiceCharge(nextServiceCharge);
      setDraftHandlingFee(nextHandlingFee);

      const nextGstPercent = Number(quotation?.pricing?.tax?.gst?.percent || DEFAULT_GST_PERCENT);
      const nextTcsPercent = Number(quotation?.pricing?.tax?.tcs?.percent || DEFAULT_TCS_PERCENT);
      const nextGstAmount = roundCurrencyAmount(quotation?.pricing?.tax?.gst?.amount || 0);
      const nextTcsAmount = roundCurrencyAmount(quotation?.pricing?.tax?.tcs?.amount || 0);
      const nextTourismAmount = roundCurrencyAmount(quotation?.pricing?.tax?.tourismFee?.amount || 0);
      const nextTotalTax = roundCurrencyAmount(quotation?.pricing?.tax?.totalTax || 0);
      const hasGst = nextGstAmount > 0 || nextGstPercent > 0;
      const hasTcs = nextTcsAmount > 0 || nextTcsPercent > 0;
      const hasTourism = nextTourismAmount > 0;

      setGstChecked(hasGst);
      setTcsChecked(hasTcs);
      setTourismChecked(hasTourism);
      setDraftGstChecked(hasGst);
      setDraftTcsChecked(hasTcs);
      setDraftTourismChecked(hasTourism);
      setGstPercent(nextGstPercent);
      setTcsPercent(nextTcsPercent);
      setDraftGstPercent(nextGstPercent);
      setDraftTcsPercent(nextTcsPercent);
      setGstAmount(nextGstAmount);
      setTcsAmount(nextTcsAmount);
      setTourismAmount(nextTourismAmount);
      setDraftTourismAmount(nextTourismAmount);
      setAppliedTaxTotal(nextTotalTax);
      setInclusions(sanitizeDynamicListItems(quotation?.inclusions));
      setExclusions(sanitizeDynamicListItems(quotation?.exclusions));
      setAdditionalNotes(sanitizeDynamicListItems(quotation?.additionalNotes));
      setDayWiseItinerary(
      reconcileDayWiseItineraryItems(
      quotation?.dayWiseItinerary,
      getTripDuration(order?.startDate, order?.endDate).days,
      formatDateInput(order?.startDate),
      ),
      );
      };

      useEffect(() => {
      const loadQuotationDraft = async () => {
      try {
      if (!order?._id) return;

      resetBuilderWorkspace();

      const requestConfig = isFreshDraftMode
      ? {
      params: {
      freshDraft: true,
      },
      }
      : activeDraftSourceQuotationId
        ? {
        params: {
        sourceQuotationId: activeDraftSourceQuotationId,
        ...(draftSourceReloadRequest ? { refreshFromSource: true } : {}),
        },
        }
        : undefined;

      const { data } = await API.get(`/ops/queries/${order._id}/quotation-draft`, requestConfig);
      const quotation = data?.quotation;
      const latestAgentPhone = String(
      data?.query?.agent?.phone || order?.agent?.phone || "",
      ).trim();

      if (latestAgentPhone) {
      setResolvedAgentPhone(latestAgentPhone);
      }

      if (!quotation) return;
      applyQuotationDraftToBuilder(quotation);
      } catch (error) {
      console.error("Failed to load quotation draft", error);
      } finally {
      if (draftSourceReloadRequest) {
      setDraftSourceReloadRequest(0);
      }
      setDraftHydrated(false);
      }
      };

      loadQuotationDraft();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [order?._id, activeDraftSourceQuotationId, isFreshDraftMode, draftSourceReloadRequest, baseServicesSnapshot.length]);

      const getTripDuration = (start, end) => {
      if (!start || !end) {
      return { nights: 0, days: 0, label: "" };
      }

      const startDate = new Date(start);
      const endDate = new Date(end);
      const diff = endDate - startDate;
      const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      const nights = Math.max(0, days - 1);

      return {
      nights,
      days,
      label: `${nights}N / ${days}D`,
      };
      };

      const getServiceMeta = (type) => {
      switch (type) {
      case "hotel":
      return {
      icon:
      <LiaHotelSolid className="w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />,
      color: "text-blue-400"
      };

      case "activity":
      return {
      icon:
      <FaWater className=" w-6 h-5 bg-[#00C950] text-white rounded-md p-0.5" />,
      color: "text-green-400 text-[18px]"
      };

      case "transfer":
      case "car":
      return {
      icon:
      <GiCityCar className=" w-6 h-5 bg-[#AD46FF] text-white rounded-md p-0.5" />,
      color: "text-blue-400"
      };

      case "sightseeing":
      return {
      icon:
      <GiModernCity className=" w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />,
      color: "text-purple-400"
      };

      default:
      return {
      icon:
      <GiModernCity />,
      color: "text-gray-400"
      };
      }
      };

      const mapDraftServiceToUi = (service = {}, overrides = {}) => {
      const meta = getServiceMeta(service.type);
      const owner = resolveDmcOwner(service);
      const resolvedRoomType = inferHotelRoomTypeValue(service) || overrides.fallbackRoomType || "";
      const resolvedRoomCategory = service.roomCategory || overrides.fallbackRoomCategory || "Double";
      const resolvedBedType =
      normalizeBedTypeValue(service.bedType) ||
      normalizeBedTypeValue(overrides.fallbackBedType) ||
      "double-bed";
      const normalizedServiceType = normalizeServiceFilterType(service.type);
      const overrideFullServiceAmount = roundCurrencyAmount(overrides.fullServiceAmount || 0);
      const overrideBaseServiceAmount = roundCurrencyAmount(overrides.baseServiceAmount || 0);
      const resolvedRate = getResolvedHotelBaseRate(
      {
      ...service,
      roomType: resolvedRoomType,
      roomCategory: resolvedRoomCategory,
      bedType: resolvedBedType,
      },
      Number(service.price ?? service.rate ?? 0),
      );
      const hotelQuantity =
      normalizedServiceType === "hotel"
      ? Math.max(Number(service.nights || 1), 1) * Math.max(Number(service.rooms || 1), 1)
      : 1;
      const resolvedStoredTotal = roundCurrencyAmount(
      overrideFullServiceAmount || service.total || service.originalTotal || service.totalInInr || 0,
      );
      const resolvedBaseRate = normalizedServiceType === "hotel"
      ? roundCurrencyAmount(
      overrideBaseServiceAmount ||
      service.quoteBaseRate ||
      service.price ||
      service.rate ||
      (resolvedStoredTotal > 0 ? resolvedStoredTotal / hotelQuantity : 0) ||
      resolvedRate ||
      0,
      )
      : resolvedRate;
      const quoteBaseRate = resolvedBaseRate;

      return {
      id: overrides.id || service.serviceId || service._id,
      serviceId: service.serviceId || "",
      dbServiceId: service._id || service.dbServiceId || "",
      dmcId: owner.dmcId,
      dmcName: owner.dmcName,
      supplierId: service.supplierId || "",
      supplierName: service.supplierName || "",
      type: service.type,
      title: service.title,
      desc: service.description || service.desc || "",
      city: service.city || "",
      country: service.country || "",
      vehicleType: service.vehicleType || "",
      usageType: service.usageType || "",
      passengerCapacity: service.passengerCapacity || 0,
      luggageCapacity: service.luggageCapacity || 0,
      rate: quoteBaseRate,
      quoteBaseRate,
      roomTypeOptionRate: roundCurrencyAmount(
      service.roomTypeOptionRate ?? service.price ?? service.rate ?? resolvedRate ?? 0,
      ),
      roomTypeOptionCurrency: normalizeCurrencyCode(
      service.roomTypeOptionCurrency || service.currency || "INR",
      ),
      awebRate: Number(service.awebRate || 0),
      cwebRate: Number(service.cwebRate || 0),
      cwoebRate: Number(service.cwoebRate || 0),
      currency: normalizeCurrencyCode(service.currency || "INR"),
      exchangeRate: Number(service.exchangeRate || 1),
      priceInInr: Number(service.priceInInr || 0),
      originalTotal: resolvedStoredTotal,
      totalInInr: Number(service.totalInInr || 0),
      useStoredPricing: overrides.useStoredPricing ?? true,
      manualRateOverride: Boolean(service.manualRateOverride || overrides.manualRateOverride),
      serviceDate: formatDateInput(service.serviceDate),
      nights: service.nights || "",
      days: service.days || 1,
      pax: service.pax || 1,
      roomCategory: resolvedRoomCategory,
      roomType: resolvedRoomType,
      hotelCategory: service.hotelCategory || "",
      bedType: resolvedBedType,
      adults: service.adults || 2,
      children: service.children || 0,
      infants: service.infants || 0,
      rooms: service.rooms || 1,
      extraAdult: Boolean(service.extraAdult),
      childWithBed: Boolean(service.childWithBed),
      childWithoutBed: Boolean(service.childWithoutBed),
      hotelRateMode: "unit-rate",
      checked: overrides.checked ?? true,
      custom: overrides.custom ?? !service.serviceId,
      editBaseline: overrides.editBaseline || buildServiceEditBaseline({
      ...service,
      hotelRateMode: "unit-rate",
      quoteBaseRate,
      originalTotal: resolvedStoredTotal,
      roomTypeOptionRate: service.roomTypeOptionRate ?? service.price ?? service.rate ?? resolvedRate ?? 0,
      roomTypeOptionCurrency: service.roomTypeOptionCurrency || service.currency || "INR",
      }),
      icon: meta.icon,
      color: meta.color,
      };
      };

      const mergeDraftServicesIntoAvailableServices = (availableServices = [], quotation = null) => {
      const draftServices = Array.isArray(quotation?.services) ? quotation.services : [];
      const sourceQuotationSnapshot =
      editingSourceQuotationSnapshotRef.current || editingSourceQuotationSnapshot;
      const sourceSnapshotServices = Array.isArray(sourceQuotationSnapshot?.services)
      ? sourceQuotationSnapshot.services
      : [];

      if (!draftServices.length) {
      return availableServices;
      }

      const usedDraftIndexes = new Set();
      const normalizeDraftMatchValue = (value = "") =>
      String(value || "").trim().toLowerCase();
      const normalizeDraftServiceId = (value = "") => {
      if (!value) return "";
      if (typeof value === "object") {
      return String(value?._id || value?.id || "").trim();
      }
      return String(value || "").trim();
      };

      const getServiceMatchKey = (service = {}) =>
      [
      normalizeServiceFilterType(service?.type),
      normalizeDraftMatchValue(service?.title || service?.hotelName || service?.name),
      normalizeDraftMatchValue(service?.city),
      normalizeDraftMatchValue(service?.country),
      normalizeDraftMatchValue(service?.roomType),
      normalizeDraftMatchValue(service?.roomCategory),
      normalizeDraftMatchValue(normalizeBedTypeValue(service?.bedType)),
      ].join("|");

      const getServiceSourceMatchKey = (service = {}) =>
      [
      normalizeServiceFilterType(service?.type),
      normalizeDraftMatchValue(service?.title || service?.hotelName || service?.name),
      normalizeDraftMatchValue(service?.city),
      normalizeDraftMatchValue(service?.country),
      normalizeDraftServiceId(service?.supplierId || service?.dmcId),
      ].join("|");

      const doServicesRepresentSameSource = (draftService = {}, currentService = {}) => {
      const draftSourceId = normalizeDraftServiceId(draftService?.serviceId || draftService?.dbServiceId);
      const draftDocumentId = normalizeDraftServiceId(draftService?._id || draftService?.draftServiceId);
      const currentSourceId = normalizeDraftServiceId(currentService?.serviceId || currentService?.id);
      const currentDraftId = normalizeDraftServiceId(currentService?.dbServiceId);

      if (draftSourceId && currentSourceId && draftSourceId === currentSourceId) {
      return true;
      }

      if (draftDocumentId && currentDraftId && draftDocumentId === currentDraftId) {
      return true;
      }

      const draftKey = getServiceMatchKey(draftService);
      const currentKey = getServiceMatchKey(currentService);

      if (draftKey && currentKey && draftKey === currentKey) {
      return true;
      }

      const draftSourceKey = getServiceSourceMatchKey(draftService);
      const currentSourceKey = getServiceSourceMatchKey(currentService);

      return Boolean(
      draftSourceKey &&
      currentSourceKey &&
      draftSourceKey === currentSourceKey,
      );
      };

      const mergedBaseServices = availableServices.map((service) => {
      const matchIndex = draftServices.findIndex((draftService, index) => {
      if (usedDraftIndexes.has(index)) return false;

      return doServicesRepresentSameSource(draftService, service);
      });

      if (matchIndex === -1) {
      return service;
      }

      usedDraftIndexes.add(matchIndex);
      const draftService = draftServices[matchIndex];
      const sourceSnapshotService =
      sourceSnapshotServices.find((sourceService) =>
      doServicesRepresentSameSource(sourceService, service) ||
      doServicesRepresentSameSource(sourceService, draftService),
      ) || null;
      const normalizedDraftType = normalizeServiceFilterType(draftService.type || service.type);
      const hotelQuantity = Math.max(Number(draftService.nights || service.nights || 1), 1) *
      Math.max(Number(draftService.rooms || service.rooms || 1), 1);
      const serviceQuantity =
      normalizedDraftType === "hotel"
      ? hotelQuantity
      : normalizedDraftType === "transfer"
      ? Math.max(Number(draftService.days || service.days || 1), 1)
      : normalizedDraftType === "activity"
      ? Math.max(Number(draftService.pax || service.pax || 1), 1)
      : normalizedDraftType === "sightseeing"
      ? Math.max(Number(draftService.pax || service.pax || 1), Number(draftService.days || service.days || 1), 1)
      : 1;
      const liveBaseServiceAmount = roundCurrencyAmount(
      Number(service.roomTypeOptionRate || 0) ||
      Number(service.price || 0) ||
      Number(service.rate || 0) ||
      Number(service.quoteBaseRate || 0) ||
      0,
      );
      const storedBaseServiceAmount = roundCurrencyAmount(
      Number(service.quoteBaseRate || 0) ||
      Number(service.price || 0) ||
      Number(service.rate || 0) ||
      0,
      );
      const shouldRefreshLiveDraftRate =
      liveBaseServiceAmount > 0 &&
      !draftService.manualRateOverride;
      const sourceBaseServiceAmount = roundCurrencyAmount(
      shouldRefreshLiveDraftRate
      ? liveBaseServiceAmount
      :
      Number(sourceSnapshotService?.quoteBaseRate || 0) ||
      Number(sourceSnapshotService?.price || 0) ||
      Number(sourceSnapshotService?.rate || 0) ||
      Number(draftService.quoteBaseRate || 0) ||
      Number(draftService.price || 0) ||
      Number(draftService.rate || 0) ||
      storedBaseServiceAmount ||
      0,
      );
      const refreshedServiceTotal = roundCurrencyAmount(
      (
      sourceBaseServiceAmount +
      (normalizedDraftType === "hotel" && draftService.extraAdult ? Number(service.awebRate || draftService.awebRate || 0) : 0) +
      (normalizedDraftType === "hotel" && draftService.childWithBed ? Number(service.cwebRate || draftService.cwebRate || 0) : 0) +
      (normalizedDraftType === "hotel" && draftService.childWithoutBed ? Number(service.cwoebRate || draftService.cwoebRate || 0) : 0)
      ) * serviceQuantity,
      );
      const sourceStoredTotal = roundCurrencyAmount(
      shouldRefreshLiveDraftRate
      ? refreshedServiceTotal
      :
      Math.max(
      Number(sourceSnapshotService?.total || 0),
      Number(sourceSnapshotService?.originalTotal || 0),
      Number(draftService.total || 0),
      Number(draftService.originalTotal || 0),
      Number(service.total || 0),
      Number(service.originalTotal || 0),
      sourceBaseServiceAmount * hotelQuantity,
      0,
      ),
      );
      const draftMappedService = mapDraftServiceToUi(draftService, {
      id: service.id,
      custom: false,
      useStoredPricing: true,
      fullServiceAmount: sourceStoredTotal,
      baseServiceAmount: sourceBaseServiceAmount,
      fallbackRoomType: service.roomType || "",
      fallbackRoomCategory: service.roomCategory || "Double",
      fallbackBedType: service.bedType || "",
      editBaseline: buildServiceEditBaseline({
      ...(sourceSnapshotService || draftService),
      hotelRateMode: "unit-rate",
      quoteBaseRate: sourceBaseServiceAmount,
      originalTotal: sourceStoredTotal,
      roomType: inferHotelRoomTypeValue(draftService) || service.roomType || "",
      roomCategory: draftService.roomCategory || service.roomCategory || "Double",
      bedType: normalizeBedTypeValue(draftService.bedType) || service.bedType || "",
      roomTypeOptionRate:
      sourceSnapshotService?.roomTypeOptionRate ??
      draftService.roomTypeOptionRate ??
      service.rate ??
      service.price ??
      0,
      roomTypeOptionCurrency:
      sourceSnapshotService?.roomTypeOptionCurrency ||
      draftService.roomTypeOptionCurrency ||
      service.currency ||
      draftService.currency ||
      "INR",
      }),
      });

      return {
      ...service,
      checked: draftMappedService.checked,
      custom: false,
      dbServiceId: draftMappedService.dbServiceId,
      serviceDate: draftMappedService.serviceDate || service.serviceDate,
      nights: draftMappedService.nights || service.nights,
      days: draftMappedService.days || service.days,
      pax: draftMappedService.pax || service.pax,
      adults: draftMappedService.adults ?? service.adults,
      children: draftMappedService.children ?? service.children,
      infants: draftMappedService.infants ?? service.infants,
      rooms: draftMappedService.rooms ?? service.rooms,
      extraAdult: draftMappedService.extraAdult,
      childWithBed: draftMappedService.childWithBed,
      childWithoutBed: draftMappedService.childWithoutBed,
      hotelRateMode: draftMappedService.hotelRateMode || service.hotelRateMode,
      rate: shouldRefreshLiveDraftRate ? sourceBaseServiceAmount : draftMappedService.rate,
      quoteBaseRate: sourceBaseServiceAmount || draftMappedService.quoteBaseRate || draftMappedService.rate,
      currency: draftMappedService.currency,
      roomTypeOptionRate: shouldRefreshLiveDraftRate
      ? sourceBaseServiceAmount
      : draftMappedService.roomTypeOptionRate || service.roomTypeOptionRate,
      roomTypeOptionCurrency: draftMappedService.roomTypeOptionCurrency || service.roomTypeOptionCurrency,
      awebRate: draftMappedService.awebRate,
      cwebRate: draftMappedService.cwebRate,
      cwoebRate: draftMappedService.cwoebRate,
      roomType: draftMappedService.roomType || service.roomType,
      roomCategory: draftMappedService.roomCategory || service.roomCategory,
      bedType: draftMappedService.bedType || service.bedType,
      useStoredPricing: true,
      originalTotal: sourceStoredTotal || draftMappedService.originalTotal || draftMappedService.total || draftMappedService.rate,
      totalInInr: shouldRefreshLiveDraftRate ? sourceStoredTotal : draftMappedService.totalInInr || 0,
      priceInInr: shouldRefreshLiveDraftRate ? sourceBaseServiceAmount : draftMappedService.priceInInr || 0,
      editBaseline: draftMappedService.editBaseline || buildServiceEditBaseline(draftMappedService),
      };
      });

      const customDraftServices = draftServices
      .filter((draftService, index) =>
      !usedDraftIndexes.has(index) &&
      !availableServices.some((service) => doServicesRepresentSameSource(draftService, service)),
      )
      .map((draftService) => mapDraftServiceToUi(draftService, { custom: true, useStoredPricing: true }));

      return [...mergedBaseServices, ...customDraftServices];
      };

      const syncLoadedDraftHotelPricing = (currentServices = [], quotation = null) => {
      const draftServices = Array.isArray(quotation?.services) ? quotation.services : [];
      if (!draftServices.length) return currentServices;

      const normalizeMatchValue = (value = "") => String(value || "").trim().toLowerCase();
      const normalizeMatchId = (value = "") => {
      if (!value) return "";
      if (typeof value === "object") {
      return String(value?._id || value?.id || value?.toString?.() || "").trim();
      }
      return String(value || "").trim();
      };
      const getLooseKey = (service = {}) => [
      normalizeServiceFilterType(service?.type),
      normalizeMatchValue(service?.title || service?.hotelName || service?.name),
      normalizeMatchValue(service?.city),
      normalizeMatchValue(service?.country),
      ].join("|");
      const isSameDraftService = (draftService = {}, service = {}) => {
      const draftId = normalizeMatchId(draftService.serviceId || draftService._id || draftService.dbServiceId);
      const serviceId = normalizeMatchId(service.serviceId || service.id || service.dbServiceId);
      if (draftId && serviceId && draftId === serviceId) return true;
      return getLooseKey(draftService) === getLooseKey(service);
      };

      let changed = false;
      const nextServices = currentServices.map((service) => {
      if (normalizeServiceFilterType(service.type) !== "hotel" || !service.checked || service.manualRateOverride) {
      return service;
      }

      const draftService = draftServices.find((item) => isSameDraftService(item, service));
      if (!draftService) return service;

      const hotelQuantity = Math.max(Number(draftService.nights || service.nights || 1), 1) *
      Math.max(Number(draftService.rooms || service.rooms || 1), 1);
      const storedDraftBaseRate = roundCurrencyAmount(
      Number(draftService.quoteBaseRate || 0) ||
      Number(draftService.price || 0) ||
      Number(draftService.rate || 0) ||
      (Number(draftService.total || draftService.originalTotal || 0) > 0
      ? Number(draftService.total || draftService.originalTotal || 0) / hotelQuantity
      : 0),
      );
      const liveBaseRate = roundCurrencyAmount(
      Number(service.roomTypeOptionRate || 0) ||
      Number(service.price || 0) ||
      Number(service.rate || 0) ||
      Number(service.quoteBaseRate || 0) ||
      0,
      );
      const draftBaseRate = service.manualRateOverride
      ? storedDraftBaseRate
      : liveBaseRate || storedDraftBaseRate;
      if (!draftBaseRate) return service;

      const draftTotal = roundCurrencyAmount(
      service.manualRateOverride
      ? Number(draftService.total || 0) ||
      Number(draftService.originalTotal || 0) ||
      draftBaseRate * hotelQuantity
      : (
      draftBaseRate +
      (draftService.extraAdult ? Number(service.awebRate || draftService.awebRate || 0) : 0) +
      (draftService.childWithBed ? Number(service.cwebRate || draftService.cwebRate || 0) : 0) +
      (draftService.childWithoutBed ? Number(service.cwoebRate || draftService.cwoebRate || 0) : 0)
      ) * hotelQuantity,
      );
      const optionRate = roundCurrencyAmount(
      (service.manualRateOverride ? 0 : draftBaseRate) ||
      service.roomTypeOptionRate ||
      draftService.roomTypeOptionRate ||
      service.rate ||
      service.price ||
      0,
      );

      const nextService = {
      ...service,
      rate: draftBaseRate,
      quoteBaseRate: draftBaseRate,
      originalTotal: draftTotal,
      totalInInr: Number(draftService.totalInInr || service.totalInInr || draftTotal),
      priceInInr: Number(draftService.priceInInr || service.priceInInr || draftBaseRate),
      useStoredPricing: true,
      hotelRateMode: "unit-rate",
      editBaseline: buildServiceEditBaseline({
      ...service,
      ...draftService,
      rate: draftBaseRate,
      quoteBaseRate: draftBaseRate,
      originalTotal: draftTotal,
      total: draftTotal,
      hotelRateMode: "unit-rate",
      roomTypeOptionRate: optionRate,
      roomTypeOptionCurrency: service.roomTypeOptionCurrency || draftService.roomTypeOptionCurrency || service.currency || "INR",
      }),
      };

      if (
      roundCurrencyAmount(service.rate || 0) !== draftBaseRate ||
      roundCurrencyAmount(service.quoteBaseRate || 0) !== draftBaseRate ||
      roundCurrencyAmount(service.originalTotal || 0) !== draftTotal
      ) {
      changed = true;
      }

      return nextService;
      });

      return changed ? nextServices : currentServices;
      };

      const buildDraftServicePayload = (service = {}) => {
      const serviceTotal = service.useStoredPricing && Number(service.originalTotal || 0) > 0
      ? roundCurrencyAmount(service.originalTotal)
      : calculateServiceOriginalTotal(service);
      const serviceTotalInInr = service.useStoredPricing && Number(service.totalInInr || 0) > 0
      ? roundCurrencyAmount(service.totalInInr)
      : convertAmountToInr(
      serviceTotal,
      service.currency,
      exchangeRates,
      );

      const normalizedServiceType = normalizeQuotationServiceType(service.type);
      const servicePax = normalizedServiceType === "hotel"
      ? getQueryPassengerCount(order) || Number(service.pax || 1)
      : Number(service.pax || 1);
      const serviceUnitDivisor = normalizedServiceType === "hotel"
      ? Math.max(Number(service.nights || 1), 1) * Math.max(Number(service.rooms || 1), 1)
      : 1;
      const serviceUnitRate =
      normalizedServiceType === "hotel"
      ? roundCurrencyAmount(
      service.manualRateOverride
      ? service.quoteBaseRate || service.rate || (serviceTotal / serviceUnitDivisor) || 0
      : service.roomTypeOptionRate ||
      service.price ||
      service.rate ||
      service.quoteBaseRate ||
      (serviceTotal / serviceUnitDivisor) ||
      0,
      )
      : roundCurrencyAmount(service.rate || 0);

      return ({
      draftServiceId: service.dbServiceId || "",
      serviceId: service.custom ? service.serviceId || "" : service.serviceId || service.id,
      dmcId: resolveDmcOwner(service).dmcId,
      dmcName: resolveDmcOwner(service).dmcName,
      supplierId: service.supplierId || "",
      supplierName: service.supplierName || "",
      type: normalizedServiceType,
      title: service.title,
      city: service.city || "",
      country: service.country || "",
      description: service.desc || service.description || "",
      serviceDate: service.serviceDate || "",
      roomCategory: service.roomCategory || "",
      roomType: service.roomType || "",
      hotelCategory: service.hotelCategory || "",
      bedType: normalizeBedTypeValue(service.bedType),
      adults: Number(service.adults || 0),
      children: Number(service.children || 0),
      infants: Number(service.infants || 0),
      rooms: Number(service.rooms || 1),
      nights: Number(service.nights || 0),
      vehicleType: service.vehicleType || "",
      passengerCapacity: Number(service.passengerCapacity || 0),
      luggageCapacity: Number(service.luggageCapacity || 0),
      usageType: service.usageType || "",
      days: Number(service.days || 1),
      pax: servicePax,
      currency: normalizeCurrencyCode(service.currency || "INR"),
      price: serviceUnitRate,
      hotelRateMode: "unit-rate",
      manualRateOverride: Boolean(service.manualRateOverride),
      quoteBaseRate: normalizedServiceType === "hotel" ? serviceUnitRate : 0,
      roomTypeOptionRate: normalizedServiceType === "hotel"
      ? roundCurrencyAmount(service.roomTypeOptionRate || serviceUnitRate || 0)
      : 0,
      roomTypeOptionCurrency: normalizedServiceType === "hotel"
      ? normalizeCurrencyCode(service.roomTypeOptionCurrency || service.currency || "INR")
      : "",
      exchangeRate: Number(service.exchangeRate || getExchangeRateForCurrency(service.currency, exchangeRates)),
      priceInInr: roundCurrencyAmount(
      convertAmountToInr(
      serviceUnitRate,
      service.currency,
      exchangeRates,
      ),
      ),
      extraAdult: Boolean(service.extraAdult),
      childWithBed: Boolean(service.childWithBed),
      childWithoutBed: Boolean(service.childWithoutBed),
      awebRate: roundCurrencyAmount(service.awebRate || 0),
      cwebRate: roundCurrencyAmount(service.cwebRate || 0),
      cwoebRate: roundCurrencyAmount(service.cwoebRate || 0),
      blackoutDates: Array.isArray(service.blackoutDates) ? service.blackoutDates : [],
      blackout: service.blackout || { isBlackout: false },
      blackoutOverride: service.blackoutOverride || (service.blackout?.isBlackout
      ? {
      approved: true,
      source: "ops_manager_special_rate",
      reason: service.blackout.label || service.blackout.reason || "Blackout date special pricing",
      }
      : undefined),
      total: serviceTotal,
      totalInInr: serviceTotalInInr,
      });
      };

      const mergeRefreshedContractedServices = (previousServices = [], refreshedServices = []) => {
      if (!previousServices.length) return refreshedServices;

      const previousBySourceId = new Map(
      previousServices.map((service) => [
      String(service.serviceId || service.id || ""),
      service,
      ]),
      );
      const refreshedIds = new Set(
      refreshedServices.map((service) => String(service.serviceId || service.id || "")),
      );

      const mergedServices = refreshedServices.map((service) => {
      const previous = previousBySourceId.get(String(service.serviceId || service.id || ""));
      if (!previous) return service;
      const shouldPreservePricing = Boolean(
      previous.checked ||
      previous.useStoredPricing ||
      previous.manualRateOverride ||
      previous.blackoutOverride?.approved,
      );

      return {
      ...service,
      checked: previous.checked,
      serviceDate: previous.serviceDate || service.serviceDate,
      nights: previous.nights || service.nights,
      days: previous.days || service.days,
      pax: previous.pax || service.pax,
      adults: previous.adults ?? service.adults,
      children: previous.children ?? service.children,
      infants: previous.infants ?? service.infants,
      rooms: previous.rooms ?? service.rooms,
      extraAdult: previous.extraAdult,
      childWithBed: previous.childWithBed,
      childWithoutBed: previous.childWithoutBed,
      hotelRateMode: previous.hotelRateMode || service.hotelRateMode,
      ...(shouldPreservePricing
      ? {
      rate: previous.rate,
      quoteBaseRate: previous.quoteBaseRate,
      roomTypeOptionRate: previous.roomTypeOptionRate,
      roomTypeOptionCurrency: previous.roomTypeOptionCurrency,
      currency: previous.currency,
      exchangeRate: previous.exchangeRate,
      useStoredPricing: previous.useStoredPricing,
      manualRateOverride: previous.manualRateOverride,
      originalTotal: previous.originalTotal,
      totalInInr: previous.totalInInr,
      priceInInr: previous.priceInInr,
      awebRate: previous.awebRate,
      cwebRate: previous.cwebRate,
      cwoebRate: previous.cwoebRate,
      editBaseline: previous.editBaseline || service.editBaseline,
      blackout: previous.blackout || service.blackout,
      blackoutOverride: previous.blackoutOverride || service.blackoutOverride,
      }
      : {}),
      };
      });

      const customServices = previousServices.filter((service) => {
      const sourceId = String(service.serviceId || service.id || "");
      return service.custom && !refreshedIds.has(sourceId);
      });

      return [...mergedServices, ...customServices];
      };

      const formatContractedServicesForUi = useCallback((rawServices = []) =>
      rawServices.map((s) => {
      const meta = getServiceMeta(s.type);
      const owner = resolveDmcOwner(s);
      const normalizedServiceType = normalizeServiceFilterType(s.type);
      const resolvedRoomType = inferHotelRoomTypeValue(s);
      const resolvedRoomCategory = s.roomCategory || "Double";
      const defaultServicePax = normalizedServiceType === "hotel"
      ? getQueryPassengerCount(order) || 1
      : 1;
      const resolvedRate = getResolvedHotelBaseRate(
      { ...s, type: s.type, roomType: resolvedRoomType, roomCategory: resolvedRoomCategory },
      s.price || 0,
      );
      const contractedFullServiceAmount = roundCurrencyAmount(
      Number(s.quoteBaseRate || 0) ||
      Number(s.originalTotal || 0) ||
      Number(s.total || 0),
      );
      const useContractedServiceTotal =
      normalizedServiceType === "hotel" &&
      contractedFullServiceAmount > 0 &&
      contractedFullServiceAmount !== resolvedRate;
      return {
      id: s.id,
      serviceId: s.id,
      dmcId: owner.dmcId,
      dmcName: owner.dmcName,
      supplierId: s.supplierId || "",
      supplierName: s.supplierName || "",
      type: s.type,
      title: s.title,
      desc: s.description || "",
      city: s.city || "",
      country: s.country || "",
      vehicleType: s.vehicleType || "",
      usageType: s.usageType || "",
      passengerCapacity: s.passengerCapacity || 0,
      luggageCapacity: s.luggageCapacity || 0,
      rate: useContractedServiceTotal ? contractedFullServiceAmount : resolvedRate,
      quoteBaseRate: useContractedServiceTotal ? contractedFullServiceAmount : 0,
      roomTypeOptionRate: roundCurrencyAmount(s.roomTypeOptionRate ?? s.price ?? resolvedRate ?? 0),
      roomTypeOptionCurrency: normalizeCurrencyCode(s.roomTypeOptionCurrency || s.currency || "INR"),
      // 🔥 ADD THIS
      awebRate: s.awebRate || 0,
      cwebRate: s.cwebRate || 0,
      cwoebRate: s.cwoebRate || 0,
      currency: normalizeCurrencyCode(s.currency),
      serviceDate: s.serviceDate || "",
      nights: "",
      days: 1,
      pax: defaultServicePax,
      // ================== ADD THIS ==================
      roomCategory: resolvedRoomCategory,
      roomType: resolvedRoomType,
      hotelCategory: s.hotelCategory,
      bedType: normalizeBedTypeValue(s.bedType) || "double-bed",
      adults: 2,
      children: 0,
      infants: 0,
      rooms: s.rooms || 1,
      extraAdult: false,
      childWithBed: false,
      childWithoutBed: false,
      hotelRateMode: useContractedServiceTotal ? "service-total" : "unit-rate",
      originalTotal: useContractedServiceTotal ? contractedFullServiceAmount : 0,
      blackoutDates: Array.isArray(s.blackoutDates) ? s.blackoutDates : [],
      blackout: s.blackout || { isBlackout: false },
      editBaseline: buildServiceEditBaseline({
      ...s,
      price: s.price || 0,
      quoteBaseRate: useContractedServiceTotal ? contractedFullServiceAmount : 0,
      originalTotal: useContractedServiceTotal ? contractedFullServiceAmount : 0,
      total: useContractedServiceTotal ? contractedFullServiceAmount : 0,
      hotelRateMode: useContractedServiceTotal ? "service-total" : "unit-rate",
      roomTypeOptionRate: s.roomTypeOptionRate ?? s.price ?? resolvedRate ?? 0,
      roomTypeOptionCurrency: s.roomTypeOptionCurrency || s.currency || "INR",
      serviceDate: s.serviceDate || "",
      days: 1,
      pax: defaultServicePax,
      }),
      // ============================================
      checked: false,
      custom: false,
      icon: meta.icon,
      color: meta.color
      };
      }), [order?.numberOfAdults, order?.numberOfChildren]);

      const loadServices = useCallback(async ({ preserveCurrent = false, showLoader = !preserveCurrent } = {}) => {
      if (showLoader) {
      setServicesLoading(true);
      }
      setServicesLoadError("");

      try {
      const res = await API.get("/ops/dmcAllGetServices", {
      skipGlobalLoader: true,
      params: { refreshedAt: Date.now(), queryId: order?._id || order?.id || order?.queryId || "" },
      });
      const formatted = formatContractedServicesForUi(res.data.data || []);

      setServices((previous) =>
      preserveCurrent ? mergeRefreshedContractedServices(previous, formatted) : formatted,
      );
      setBaseServicesSnapshot(formatted.map((service) => ({ ...service })));
      } catch (err) {
      console.error(err);
      if (!preserveCurrent) {
      setServices([]);
      setBaseServicesSnapshot([]);
      setServicesLoadError("Unable to load contracted rates right now.");
      }
      } finally {
      if (showLoader) {
      setServicesLoading(false);
      }
      }
      }, [formatContractedServicesForUi, order?._id, order?.id, order?.queryId]);

      useEffect(() => {
      loadServices();
      }, [loadServices]);

      useEffect(() => {
      const canOverrideBlackoutRate = (() => {
      try {
const values = [];
for (let index = 0; index < window.localStorage.length; index += 1) {
const key = window.localStorage.key(index);
if (key) values.push(window.localStorage.getItem(key));
}
const pageRoleText = String(document?.body?.innerText || "").toLowerCase();
if (pageRoleText.includes("ops manager") || pageRoleText.includes("operation manager")) {
return true;
}
for (const value of values) {
const parsed = JSON.parse(value || "null");
const roleText = JSON.stringify(parsed || {}).toLowerCase();
if (
roleText.includes("operation_manager") ||
roleText.includes("operations_manager") ||
roleText.includes("ops_manager") ||
roleText.includes("ops manager") ||
roleText.includes("operation manager") ||
roleText.includes("\"role\":\"admin\"")
) {
return true;
}
}
      } catch {
      return false;
      }
      return false;
      })();
      if (canOverrideBlackoutRate) return;

      const hasCheckedBlackoutService = services.some(
      (service) => service.blackout?.isBlackout && service.checked,
      );
      if (!hasCheckedBlackoutService) return;

      setServices((prev) =>
      prev.map((service) =>
      service.blackout?.isBlackout && service.checked
      ? { ...service, checked: false, nights: "", useStoredPricing: false }
      : service,
      ),
      );
      }, [services]);

      useEffect(() => {
      const refreshContractedRates = async ({ force = false } = {}) => {
      const now = Date.now();

      if (
      backgroundRatesRefreshRef.current.inFlight ||
      (!force && now - backgroundRatesRefreshRef.current.lastStartedAt < 30000)
      ) {
      return;
      }

      backgroundRatesRefreshRef.current = {
      inFlight: true,
      lastStartedAt: now,
      };

      try {
      await loadServices({ preserveCurrent: true, showLoader: false });
      } finally {
      backgroundRatesRefreshRef.current.inFlight = false;
      }
      };
      const handleStorage = (event) => {
      if (event.key === "contractedRates:lastEditedAt") {
      refreshContractedRates({ force: true });
      }
      };
      const handleWindowFocus = () => refreshContractedRates();
      const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
      refreshContractedRates();
      }
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener("focus", handleWindowFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
      }, [loadServices]);

      useEffect(() => {
      if (!loadedQuotationDraft || !services.length || draftHydrated) {
      return;
      }

      setServices((prev) => mergeDraftServicesIntoAvailableServices(prev, loadedQuotationDraft));
      setDraftHydrated(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [draftHydrated, loadedQuotationDraft, services.length, editingSourceQuotationSnapshot]);

      useEffect(() => {
      if (!loadedQuotationDraft || !services.length) {
      return;
      }

      setServices((prev) => syncLoadedDraftHotelPricing(prev, loadedQuotationDraft));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [loadedQuotationDraft, services.length]);

      useEffect(() => {
      if (!selectedPackageTemplate || !services.length) {
      return;
      }

      setServices((prev) => {
      const next = buildPackageMatchedServices(prev, selectedPackageTemplate);
      return havePackageSelectionsChanged(prev, next) ? next : prev;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [selectedPackageTemplate, services.length]);

      const addCustomService = async (data) => {
      try {
      if (!quotationId) {
      toast.error("Quotation draft not ready yet");
      return;
      }

      setSavingService(true);

      const payload = {
      type: data.type,
      title: data.title,
      supplierId: data.supplierId || "",
      supplierName: data.supplierName || "",
      dmcId: data.dmcId || data.supplierId || "",
      dmcName: data.dmcName || "",
      description: data.desc,
      city: data.city || order?.destination || "",
      country: data.country || "",
      serviceDate: data.serviceDate || "",
      nights: data.nights || "",
      days: data.days || 1,
      pax: data.pax || 1,
      vehicleType: data.vehicleType || "",
      usageType: data.usageType || "point-to-point",
      passengerCapacity: data.passengerCapacity || 0,
      luggageCapacity: data.luggageCapacity || 0,
      price: data.rate,
      currency: normalizeCurrencyCode(data.currency || "INR"),
      exchangeRate: getExchangeRateForCurrency(data.currency || "INR", exchangeRates),
      priceInInr: convertAmountToInr(data.rate || 0, data.currency || "INR", exchangeRates),
      totalInInr: convertAmountToInr(
      calculateServiceOriginalTotal({
      type: data.type,
      rate: data.rate,
      nights: data.nights,
      days: data.days,
      pax: data.pax,
      }),
      data.currency || "INR",
      exchangeRates,
      ),
      adults: data.adults || 0,
      children: data.children || 0,
      infants: data.infants || 0,
      rooms: data.rooms || 1,
      bedType: normalizeBedTypeValue(data.bedType) || "double-bed",
      };

      const { data: response } = await API.post(`/ops/quotations/${quotationId}/services`, payload);

      const mappedServices = (response.services || []).map((s) => {
      const meta = getServiceMeta(s.type);
      const owner = resolveDmcOwner(s);
      const resolvedRoomType = inferHotelRoomTypeValue(s);
      const resolvedRoomCategory = s.roomCategory || "Double";
      const resolvedRate = getResolvedHotelBaseRate(
      { ...s, type: s.type, roomType: resolvedRoomType, roomCategory: resolvedRoomCategory },
      s.price || 0,
      );
      return {
      id: s._id,
      serviceId: s.serviceId || "",
      dbServiceId: s._id,
      dmcId: owner.dmcId,
      dmcName: owner.dmcName,
      supplierId: s.supplierId || "",
      supplierName: s.supplierName || "",
      type: s.type,
      title: s.title,
      desc: s.description || "",
      city: s.city || "",
      country: s.country || "",
      vehicleType: s.vehicleType || "",
      usageType: s.usageType || "",
      passengerCapacity: s.passengerCapacity || 0,
      luggageCapacity: s.luggageCapacity || 0,
      rate: resolvedRate,
      currency: normalizeCurrencyCode(s.currency || "INR"),
      exchangeRate: Number(s.exchangeRate || 1),
      priceInInr: Number(s.priceInInr || 0),
      totalInInr: Number(s.totalInInr || 0),
      serviceDate: s.serviceDate || "",
      nights: s.nights || "",
      days: s.days || 1,
      pax: s.pax || 1,
      adults: s.adults || 0,
      children: s.children || 0,
      infants: s.infants || 0,
      rooms: s.rooms || 1,
      bedType: normalizeBedTypeValue(s.bedType) || "double-bed",
      roomCategory: resolvedRoomCategory,
      roomType: resolvedRoomType,
      hotelCategory: s.hotelCategory || "",
      extraAdult: Boolean(s.extraAdult),
      childWithBed: Boolean(s.childWithBed),
      childWithoutBed: Boolean(s.childWithoutBed),
      hotelRateMode:
      normalizeServiceFilterType(s.type) === "hotel"
      ? "service-total"
      : "unit-rate",
      awebRate: Number(s.awebRate || 0),
      cwebRate: Number(s.cwebRate || 0),
      cwoebRate: Number(s.cwoebRate || 0),
      editBaseline: buildServiceEditBaseline(s),
      checked: true,
      custom: true,
      icon: meta.icon,
      color: meta.color,
      };
      });

      setServices((prev) => {
      const normalServices = prev.filter((item) => !item.custom);
      return [...normalServices, ...mappedServices];
      });

      showQuickActionFeedback(
      "success",
      "Service Added",
      `${data.title} has been added to this quotation.`
      );
      } catch (error) {
      console.error("Failed to add custom service", error);
      toast.error(error?.response?.data?.message || "Failed to add service");
      } finally {
      setSavingService(false);
      }
      };

      const deleteService = async (id) => {
      try {
      const target = services.find((item) => item.id === id);

      if (!target?.custom || !target?.dbServiceId) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      return;
      }

      await API.delete(`/ops/quotations/${quotationId}/services/${target.dbServiceId}`);

      setServices((prev) => prev.filter((s) => s.id !== id));
      showQuickActionFeedback(
      "delete",
      "Service Removed",
      `${target.title} has been removed from this quotation.`
      );
      } catch (error) {
      console.error("Failed to delete service", error);
      toast.error(error?.response?.data?.message || "Failed to delete service");
      }
      };

      const selectedServicesWithPricing = useMemo(
      () => {
      return services
      .filter((service) => service.checked === true)
      .map((service) => {
      const currency = normalizeCurrencyCode(service.currency);
      const storedExchangeRate = Number(service.exchangeRate || 1);
      const exchangeRate = service.useStoredPricing
      ? storedExchangeRate
      : getExchangeRateForCurrency(currency, exchangeRates);
      const originalTotal = service.useStoredPricing
      ? roundCurrencyAmount(service.originalTotal || service.quoteBaseRate || service.total || 0)
      : calculateServiceOriginalTotal(service);
      const priceInInr = service.useStoredPricing
      ? roundCurrencyAmount(
      service.priceInInr || convertAmountToInr(
      Number(service.rate || 0),
      currency,
      { ...exchangeRates, [currency]: exchangeRate },
      ),
      )
      : convertAmountToInr(
      Number(service.rate || 0),
      currency,
      exchangeRates,
      );
      const totalInInr = service.useStoredPricing
      ? roundCurrencyAmount(
      service.totalInInr || convertAmountToInr(
      originalTotal,
      currency,
      { ...exchangeRates, [currency]: exchangeRate },
      ),
      )
      : convertAmountToInr(
      originalTotal,
      currency,
      exchangeRates,
      );

      return {
      ...service,
      currency,
      exchangeRate,
      originalTotal,
      priceInInr,
      totalInInr,
      isForeignCurrency: currency !== "INR",
      };
      });
      },
      [exchangeRates, services],
      );

      const contractedRateFilterCounts = useMemo(
      () =>
      services
      .filter((service) => doesServiceMatchDestination(service, order?.destination))
      .reduce(
      (counts, service) => {
      counts.all += 1;
      const type = normalizeServiceFilterType(service.type);
      if (counts[type] !== undefined) {
      counts[type] += 1;
      }
      return counts;
      },
      {
      all: 0,
      hotel: 0,
      transfer: 0,
      activity: 0,
      sightseeing: 0,
      },
      ),
      [order?.destination, services],
      );

      const destinationMatchedServices = useMemo(
      () =>
      services.filter((service) =>
      doesServiceMatchDestination(service, order?.destination),
      ),
      [order?.destination, services],
      );

      const filteredServices = useMemo(() => {
      const normalizedSearch = contractedRatesSearch.trim().toLowerCase();

      return destinationMatchedServices.filter((service) => {
      const matchesType =
      contractedRatesFilter === "all" ||
      normalizeServiceFilterType(service.type) === contractedRatesFilter;

      if (!matchesType) {
      return false;
      }

      if (!normalizedSearch) {
      return true;
      }

      return getServiceSearchText(service).includes(normalizedSearch);
      });
      }, [contractedRatesFilter, contractedRatesSearch, destinationMatchedServices]);

      const servicesTotal = useMemo(
      () =>
      selectedServicesWithPricing.reduce(
      (sum, service) => sum + Number(service.totalInInr || 0),
      0,
      ),
      [selectedServicesWithPricing],
      );

      const foreignCurrencyBreakdown = useMemo(() => {
      const totals = new Map();

      selectedServicesWithPricing.forEach((service) => {
      if (!service.isForeignCurrency) return;

      const existing = totals.get(service.currency) || {
      currency: service.currency,
      exchangeRate: service.exchangeRate,
      originalTotal: 0,
      inrTotal: 0,
      };

      existing.originalTotal += Number(service.originalTotal || 0);
      existing.inrTotal += Number(service.totalInInr || 0);
      existing.exchangeRate = service.exchangeRate;
      totals.set(service.currency, existing);
      });

      return Array.from(totals.values()).map((item) => ({
      ...item,
      originalTotal: roundCurrencyAmount(item.originalTotal),
      inrTotal: roundCurrencyAmount(item.inrTotal),
      exchangeRate: roundExchangeRateValue(item.exchangeRate),
      }));
      }, [selectedServicesWithPricing]);

      const shouldShowDualPricing =
      quoteCategory === "international" && foreignCurrencyBreakdown.length > 0;

      const baseRate = roundCurrencyAmount(order?.customerBudget || 0);

      const serviceFeeAmount = roundCurrencyAmount(serviceCharge || 0);
      const handlingFeeAmount = roundCurrencyAmount(handlingFee || 0);
      const packageTemplateAmount = roundCurrencyAmount(selectedPackageTemplate?.price || 0);

      const opsMarkupBasisAmount = servicesTotal + packageTemplateAmount;

      // OPS markup
      let opsMarkup = 0;

      if (marginType === "percentage") {
      opsMarkup = roundCurrencyAmount((opsMarkupBasisAmount * Number(markup || 0)) / 100);
      } else {
      opsMarkup = roundCurrencyAmount(fixedMargin || 0);
      }

      const taxableAmountForTaxes =
      opsMarkupBasisAmount + opsMarkup + serviceFeeAmount + handlingFeeAmount;
      const draftGstFinal = draftGstChecked
      ? roundCurrencyAmount((taxableAmountForTaxes * Number(draftGstPercent || 0)) / 100)
      : 0;

      const draftTcsFinal = draftTcsChecked
      ? roundCurrencyAmount((taxableAmountForTaxes * Number(draftTcsPercent || 0)) / 100)
      : 0;

      const draftTourismFinal = draftTourismChecked
      ? roundCurrencyAmount(draftTourismAmount || DEFAULT_TOURISM_AMOUNT)
      : 0;

      const draftTaxationTotal = roundCurrencyAmount(
      draftGstFinal + draftTcsFinal + draftTourismFinal,
      );

      useEffect(() => {
      const nextAppliedTaxTotal =
      (gstChecked ? Number(gstAmount || 0) : 0) +
      (tcsChecked ? Number(tcsAmount || 0) : 0) +
      (tourismChecked ? Number(tourismAmount || 0) : 0);

      setAppliedTaxTotal(roundCurrencyAmount(nextAppliedTaxTotal));
      }, [gstAmount, gstChecked, tcsAmount, tcsChecked, tourismAmount, tourismChecked]);

      // OPS charges
      const opsChargesTotal = roundCurrencyAmount(serviceFeeAmount + handlingFeeAmount);
      // markup amount (OPS charges + markup + tax)
      const markupAmount = roundCurrencyAmount(opsChargesTotal + opsMarkup + appliedTaxTotal);

      // total amount
      const totalAmount = roundCurrencyAmount(opsMarkupBasisAmount + markupAmount);
      const selectedServices = selectedServicesWithPricing;
      const visibleSelectedServices = useMemo(() => {
      if (selectedServicesModalScope === "single" && selectedServicesModalTargetId) {
      return selectedServices.filter((service) => service.id === selectedServicesModalTargetId);
      }

      return selectedServices;
      }, [selectedServices, selectedServicesModalScope, selectedServicesModalTargetId]);

      //=========================================== Api call ======================================

      const persistQuotationDraft = async () => {
      if (!quotationId) {
      throw new Error("Quotation draft not ready yet");
      }

      const payload = {
      queryId: orderQueryId,
      validTill: validTill || formatDateInput(loadedQuotationDraft?.validTill),
      inclusions: sanitizeDynamicListItems(inclusions),
      exclusions: sanitizeDynamicListItems(exclusions),
      additionalNotes: sanitizeDynamicListItems(additionalNotes),
      dayWiseItinerary: sanitizeDayWiseItineraryItems(itineraryEntries),
      services: selectedServices.map((service) => buildDraftServicePayload(service)),
      pricing: {
      currency: "INR",
      quoteCategory,
      baseAmount: roundCurrencyAmount(baseRate || 0),
      subTotal: roundCurrencyAmount(servicesTotal || 0),
      packageTemplateAmount,
      totalAmount: roundCurrencyAmount(totalAmount || 0),
      },
      opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
      opsAmount: marginType === "fixed"
      ? roundCurrencyAmount(fixedMargin || 0)
      : roundCurrencyAmount(opsMarkup || 0),
      serviceCharge: roundCurrencyAmount(serviceCharge || 0),
      handlingFee: roundCurrencyAmount(handlingFee || 0),
      tax: {
      gstAmount: gstChecked ? roundCurrencyAmount(gstAmount || draftGstFinal || 0) : 0,
      gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
      tcsAmount: tcsChecked ? roundCurrencyAmount(tcsAmount || draftTcsFinal || 0) : 0,
      tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
      tourismAmount: tourismChecked
      ? roundCurrencyAmount(tourismAmount || draftTourismFinal || 0)
      : 0,
      },
      };

      const { data } = await API.put(`/ops/quotations/${quotationId}/draft`, payload);
      if (data?.quotation) {
      setLoadedQuotationDraft(data.quotation);
      }

      return data?.quotation || null;
      };

      const resolveQuotationQueryId = (quotation) => {
      const quotationQueryId = quotation?.queryId;

      if (quotationQueryId && typeof quotationQueryId === "object") {
      return quotationQueryId?._id || quotationQueryId?.id || "";
      }

      return quotationQueryId || order?._id || "";
      };

      const buildQuotationSharePayload = (quotation) => {
      const servicesSource = Array.isArray(quotation?.services) && quotation.services.length
      ? quotation.services
      : selectedServices;
      const queryPax = getQueryPassengerCount(order);

      return {
      recipientName:
      order?.agent?.name ||
      order?.agentName ||
      order?.agent?.companyName ||
      "Agent",
      recipientCompanyName:
      order?.agent?.companyName ||
      order?.agentName ||
      order?.agent?.name ||
      "",
      phone: resolvedAgentPhone || order?.agent?.phone || "",
      quotationNumber: quotation?.quotationNumber || "",
      queryId: order?.queryId || "",
      destination: order?.destination || "",
      startDate: order?.startDate || "",
      endDate: order?.endDate || "",
      travelDates: `${formatShareDate(order?.startDate)} - ${formatShareDate(order?.endDate)}`,
      durationLabel: tripDuration.label || "-",
      tripNights: Number(tripDuration?.nights || 0),
      tripDays: Number(tripDuration?.days || 0),
      travelerSummary: buildTravelerSummary(order),
      numberOfAdults: Number(order?.numberOfAdults || 0),
      numberOfChildren: Number(order?.numberOfChildren || 0),
      numberOfInfants: Number(order?.numberOfInfants || 0),
      validTill: formatShareDate(quotation?.validTill || validTill),
      totalAmount: Number(quotation?.pricing?.totalAmount || totalAmount || 0),
      currency: quotation?.pricing?.currency || "INR",
      tcsAmount: Number(quotation?.pricing?.tax?.tcs?.amount || 0),
      inclusions: sanitizeDynamicListItems(
      Array.isArray(quotation?.inclusions) ? quotation.inclusions : inclusions,
      ),
      exclusions: sanitizeDynamicListItems(
      Array.isArray(quotation?.exclusions) ? quotation.exclusions : exclusions,
      ),
      additionalNotes: sanitizeDynamicListItems(
      Array.isArray(quotation?.additionalNotes) ? quotation.additionalNotes : additionalNotes,
      ),
      termsAndConditions: Array.isArray(quotation?.termsAndConditions) &&
      quotation.termsAndConditions.length
      ? sanitizeDynamicListItems(quotation.termsAndConditions)
      : [...DEFAULT_WHATSAPP_TERMS],
      dayWiseItinerary: sanitizeDayWiseItineraryItems(
      Array.isArray(quotation?.dayWiseItinerary) ? quotation.dayWiseItinerary : itineraryEntries,
      )
      .filter((entry) => entry.title || entry.description)
      .map((entry) => {
      const dayLabel = entry.dayLabel || buildItineraryDayLabel(entry.dayNumber, entry.date);
      return {
      ...entry,
      dayLabel,
      heading: entry.title ? `${dayLabel}: ${entry.title}` : dayLabel,
      };
      }),
      sellerBankDetails: [
      { label: "Bank Name", value: "HDFC Bank" },
      { label: "A/c Holder Name", value: "Leela Travels" },
      { label: "A/c No.", value: "50200103968171" },
      { label: "IFSC", value: "HDFC0004413" },
      { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
      ],
      services: servicesSource.map((service) => {
      const normalizedType = normalizeQuotationServiceType(service?.type);
      const servicePax = normalizedType === "hotel"
      ? queryPax || Number(service?.pax || 0)
      : Number(service?.pax || 0);

      return {
      title: service?.title || "Service",
      type: normalizedType,
      typeLabel: SERVICE_TYPE_LABELS[normalizedType] || "Travel Service",
      location: buildShareServiceLocationLabel(service),
      city: service?.city || "",
      country: service?.country || "",
      serviceDateLabel: formatShareDate(service?.serviceDate),
      serviceDate: service?.serviceDate || "",
      quantityLabel: buildShareServiceQuantityLabel(service, queryPax),
      description: String(service?.description || service?.desc || "").replace(/\s+/g, " ").trim(),
      nights: Number(service?.nights || 0),
      rooms: Number(service?.rooms || 0),
      roomType: service?.roomType || "",
      bedType: service?.bedType || "",
      hotelCategory: service?.hotelCategory || "",
      adults: Number(service?.adults || 0),
      children: Number(service?.children || 0),
      infants: Number(service?.infants || 0),
      pax: servicePax,
      days: Number(service?.days || 0),
      usageType: service?.usageType || "",
      vehicleType: service?.vehicleType || "",
      passengerCapacity: Number(service?.passengerCapacity || 0),
      };
      }),
      };
      };

      const runPostSendAction = async (selectedAction, quotation) => {
      if (!selectedAction) {
      return "Quotation sent successfully";
      }

      const quoteDetails = buildQuotationSharePayload(quotation);

      if (selectedAction === "Copy Text") {
      await copyTextToClipboard(buildPlainTextQuotationSummary(quoteDetails));
      return "Quotation summary copied";
      }

      if (selectedAction === "PDF Download") {
      const queryDocumentId = resolveQuotationQueryId(quotation);

      if (!queryDocumentId) {
      throw new Error("Query reference missing for PDF generation.");
      }

      const { data } = await API.post("/ops/send", {
      queryId: queryDocumentId,
      channels: ["pdf"],
      quoteDetails,
      agent: {
      email: order?.agent?.email || "",
      phone: order?.agent?.phone || "",
      },
      });

      const pdfMeta = data?.results?.pdf;
      const publicFilePath = pdfMeta?.publicFilePath;

      if (!publicFilePath) {
      throw new Error("Quotation PDF could not be generated.");
      }

      await downloadFileFromUrl(
      createPublicAssetUrl(publicFilePath),
      pdfMeta?.fileName || `quotation_${quoteDetails.queryId || "quote"}.pdf`,
      );

      return "Quotation PDF downloaded";
      }

      if (selectedAction === "Word Format") {
      downloadWordDocument(
      quoteDetails,
      `quotation_${quoteDetails.queryId || "quote"}.doc`,
      );
      return "Quotation Word document downloaded";
      }

      if (selectedAction === "Dashboard Notification") {
      return "Dashboard notification sent to agent";
      }

      if (selectedAction === "Email") {
      return `Quotation sent to ${order?.agent?.email || "agent email"}`;
      }

      if (selectedAction === "WhatsApp") {
      const normalizedPhone = normalizeWhatsAppPhoneNumber(quoteDetails?.phone);

      if (!normalizedPhone) {
      throw new Error("Agent phone number is missing for WhatsApp sharing.");
      }

      const message = buildWhatsAppQuotationMessage(quoteDetails);
      const whatsappURL = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

      if (typeof window === "undefined") {
      throw new Error("WhatsApp sharing is only available in the browser.");
      }

      window.open(whatsappURL, "_blank", "noopener,noreferrer");
      return "WhatsApp quotation is ready to send";
      }

      return "Quotation sent successfully";
      };

      const sendQuotation = async (sendVia = [], selectedAction = "") => {
      if (!validTill) {
      toast.error("Please select Valid Till date");
      return;
      }

      if (!selectedServices.length) {
      toast.error("No services selected");
      return;
      }

      const hotelsWithoutNights = selectedServices.filter(
      (service) => service.type === "hotel" && !Number(service.nights),
      );
      if (hotelsWithoutNights.length) {
      toast.error(
      `Select nights first: ${hotelsWithoutNights
      .map((service) => service.title)
      .join(", ")}`,
      );
      return;
      }

      const servicesWithoutDate = selectedServices.filter((service) => !service.serviceDate);
      if (servicesWithoutDate.length) {
      toast.error(
      `Select service date first: ${servicesWithoutDate
      .map((service) => service.title)
      .join(", ")}`,
      );
      return;
      }

      const unmappedServices = selectedServices.filter(
      (service) => !resolveDmcOwner(service).dmcId,
      );
      if (unmappedServices.length) {
      toast.error(
      `Assign DMC owner first: ${unmappedServices
      .map((service) => service.title)
      .join(", ")}`,
      );
      return;
      }

      const loadingToast = toast.loading("Sending quotation...");

      try {

      // 🔥 MAIN PAYLOAD
      const targetQuotationId = editingTargetQuotationId || quotationId;
      const payload = {
      quotationId: targetQuotationId,
      editExistingQuotation: isEditingHistoricalQuotation,
      queryId: orderQueryId,
      selectedAction,
      validTill,
      baseAmount: baseRate,
      sendVia: sendVia,
      inclusions: sanitizeDynamicListItems(inclusions),
      exclusions: sanitizeDynamicListItems(exclusions),
      additionalNotes: sanitizeDynamicListItems(additionalNotes),
      dayWiseItinerary: sanitizeDayWiseItineraryItems(itineraryEntries),
      services: selectedServices.map((service) => buildDraftServicePayload(service)),

      pricing: {
      currency: "INR",
      quoteCategory,
      baseAmount: baseRate,
      subTotal: roundCurrencyAmount(servicesTotal),
      packageTemplateAmount,
      serviceCurrencyBreakdown: foreignCurrencyBreakdown.map((item) => ({
      currency: item.currency,
      amount: roundCurrencyAmount(item.originalTotal || 0),
      amountInInr: roundCurrencyAmount(item.inrTotal || 0),
      exchangeRate: Number(item.exchangeRate || 1),
      })),
      totalAmount: roundCurrencyAmount(totalAmount)
      },

      opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
      opsAmount: marginType === "fixed"
      ? roundCurrencyAmount(fixedMargin || 0)
      : roundCurrencyAmount(opsMarkup || 0),
      // OPS + TAX
      serviceCharge: roundCurrencyAmount(serviceCharge || 0),
      handlingFee: roundCurrencyAmount(handlingFee || 0),
      tax: {
      gstAmount: gstChecked ? roundCurrencyAmount(gstAmount || draftGstFinal || 0) : 0,
      gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
      tcsAmount: tcsChecked ? roundCurrencyAmount(tcsAmount || draftTcsFinal || 0) : 0,
      tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
      tourismAmount: roundCurrencyAmount(tourismAmount || draftTourismFinal || 0)
      }
      };


      // ✅ STEP 1: Create quotation
      const res = await API.post("/ops/quotations", payload);
      const savedQuotation = res?.data?.quotation;
      const warnings = Array.isArray(res?.data?.warnings) ? [...res.data.warnings] : [];
      const sentToAgent = Boolean(res?.data?.sentToAgent);
      let actionSuccessMessage = sentToAgent
      ? "Quotation sent successfully"
      : "Quotation saved successfully";

      try {
      actionSuccessMessage = await runPostSendAction(selectedAction, savedQuotation);
      } catch (actionError) {
      console.error("Post-send action failed", actionError);
      warnings.push(actionError?.message || "Quotation was saved, but the selected action could not be completed.");
      }

      const hasDeliveryWarnings = warnings.length > 0;

      toast.dismiss(loadingToast);
      toast.success(hasDeliveryWarnings ? "Quotation saved successfully" : actionSuccessMessage);
      warnings.forEach((warning) => toast(warning, { icon: "!" }));
      setSuccessPopup({
      open: true,
      kind: "quote",
      invoiceNumber: "",
      totalAmount: Number(
      savedQuotation?.pricing?.totalAmount ||
      savedQuotation?.clientTotalAmount ||
      totalAmount ||
      0,
      ),
      serviceCount: Number(
      savedQuotation?.services?.length || selectedServices.length || 0,
      ),
      agentName:
      order?.agent?.companyName ||
      order?.agent?.name ||
      order?.agentName ||
      "",
      deliveryWarnings: warnings,
      });

      } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to send quotation");
      }

      };

      const generateFinalInvoice = async () => {
      if (!quotationId) {
      toast.error("Quotation draft not ready yet");
      return;
      }

      if (preparingFinanceInvoice) {
      return;
      }

      setShowFinanceInvoiceConfirm(false);
      setPreparingFinanceInvoice(true);

      const loadingToast = toast.loading("Preparing finance invoice...");

      try {
      const { data } = await API.post("/ops/invoices", { quotationId });

      toast.dismiss(loadingToast);
      toast.success("Finance invoice prepared successfully");
      const generatedInvoice = data?.invoice;
      setSuccessPopup({
      open: true,
      kind: "invoice",
      invoiceNumber: generatedInvoice?.invoiceNumber || "",
      totalAmount: Number(generatedInvoice?.totalAmount || totalAmount || 0),
      serviceCount: Number(generatedInvoice?.lineItems?.length || 0),
      agentName:
      order?.agent?.companyName ||
      order?.agent?.name ||
      order?.agentName ||
      "",
      });
      } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to prepare finance invoice");
      } finally {
      setPreparingFinanceInvoice(false);
      }
      };

      const handleFinalSend = () => {
      if (!selectedSendOption) {
      toast.error("Please select an option");
      return;
      }

      const map = {
      "Email": ["email"],
      "WhatsApp": ["whatsapp"],
      "Dashboard Notification": ["dashboard_notification"],
      "PDF Download": ["pdf"],
      "Word Format": [],
      "Copy Text": ["copy"]
      };

      sendQuotation(map[selectedSendOption], selectedSendOption);

      // optional UX
      setShowSendOptions(false);
      setSelectedSendOption(null);
      };

      const handleSaveDraftQuote = async () => {
      if (!quotationId) {
      toast.error("Quotation draft not ready yet");
      return;
      }

      try {
      setSavingDraftQuote(true);
      await persistQuotationDraft();
      toast.success("Draft saved successfully. Quote not sent yet.");
      } catch (error) {
      console.error("Failed to save quotation draft", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to save draft");
      } finally {
      setSavingDraftQuote(false);
      }
      };

      const tripDuration = useMemo(
      () => getTripDuration(order?.startDate, order?.endDate),
      [order?.startDate, order?.endDate]
      );
      const tripNights = tripDuration.nights;
      const itineraryStartDate = formatDateInput(order?.startDate);
      const itineraryEntries = useMemo(
      () =>
      reconcileDayWiseItineraryItems(
      dayWiseItinerary,
      tripDuration.days,
      itineraryStartDate,
      ),
      [dayWiseItinerary, itineraryStartDate, tripDuration.days],
      );

      const updateDayWiseItineraryEntry = (dayNumber, field, value) => {
      setDayWiseItinerary((prev) =>
      reconcileDayWiseItineraryItems(prev, tripDuration.days, itineraryStartDate).map((entry) =>
      entry.dayNumber === dayNumber
      ? { ...entry, [field]: value }
      : entry,
      ),
      );
      };

      useEffect(() => {
      setDayWiseItinerary((prev) => {
      const nextEntries = reconcileDayWiseItineraryItems(
      prev,
      tripDuration.days,
      itineraryStartDate,
      );

      return areDayWiseItineraryItemsEqual(prev, nextEntries) ? prev : nextEntries;
      });
      }, [itineraryStartDate, tripDuration.days]);

      const queryRequirementTags = [
      order?.transportRequired ? "Transport Required" : null,
      order?.sightseeingRequired ? "Sightseeing Required" : null,
      order?.customerBudget ? `Budget ₹${Number(order.customerBudget).toLocaleString("en-IN")}` : null,
      ].filter(Boolean);

      const getRemainingHotelNights = (allServices, currentId) => {
      const usedByOtherHotels = allServices
      .filter((service) => service.type === "hotel" && service.checked && service.id !== currentId)
      .reduce((sum, service) => sum + Number(service.nights || 0), 0);

      return Math.max(0, tripNights - usedByOtherHotels);
      };

      const getHotelNightStart = (allServices, currentId) => {
      let usedByPreviousHotels = 0;

      for (const service of allServices) {
      if (service.id === currentId) break;

      if (service.type === "hotel" && service.checked) {
      usedByPreviousHotels += Number(service.nights || 0);
      }
      }

      if (!tripNights) return 0;

      return Math.min(tripNights, usedByPreviousHotels + 1);
      };

      const getHotelDefaultStartDate = (allServices, currentId) => {
      if (!order?.startDate) return "";

      const usedByPreviousHotels = Math.max(0, getHotelNightStart(allServices, currentId) - 1);

      return addDaysToDate(order.startDate, usedByPreviousHotels);
      };

      const getAvailableTransportDaysFromDate = (startDateValue) => {
      if (!startDateValue || !order?.endDate) return 1;

      const startDate = new Date(startDateValue);
      const tripEndDate = new Date(order.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(tripEndDate.getTime())) {
      return 1;
      }

      const diff = tripEndDate - startDate;
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      };

      const adultPassengers = Number(order?.numberOfAdults || 0);
      const childPassengers = Number(order?.numberOfChildren || 0);
      const totalPassengers = adultPassengers + childPassengers;
      const costPerPassenger =
      totalPassengers > 0 ? totalAmount / totalPassengers : 0;

const toggleService = (id, force = false) => {
const targetService = services.find((service) => service.id === id);
const normalizedTargetType = normalizeServiceFilterType(targetService?.type);
const nextChecked = !targetService?.checked;
const servicePassengerCapacity = Number(targetService?.passengerCapacity || 0);
const canOverrideBlackoutRate = (() => {
try {
const values = [];
for (let index = 0; index < window.localStorage.length; index += 1) {
const key = window.localStorage.key(index);
if (key) values.push(window.localStorage.getItem(key));
}
const pageRoleText = String(document?.body?.innerText || "").toLowerCase();
if (pageRoleText.includes("ops manager") || pageRoleText.includes("operation manager")) {
return true;
}
for (const value of values) {
const parsed = JSON.parse(value || "null");
const roleText = JSON.stringify(parsed || {}).toLowerCase();
if (
roleText.includes("operation_manager") ||
roleText.includes("operations_manager") ||
roleText.includes("ops_manager") ||
roleText.includes("ops manager") ||
roleText.includes("operation manager") ||
roleText.includes("\"role\":\"admin\"")
        ) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  })();

  if (!force && nextChecked && targetService?.blackout?.isBlackout) {
    if (!canOverrideBlackoutRate) {
      toast.error(
        `Contract rate blocked for blackout date: ${targetService.blackout.label || targetService.blackout.reason || "Blackout date"}. Use manual/special pricing.`,
        {
          id: `blackout-rate-${id}`,
        }
      );
      return;
    } else {
      toast(
        `Contract rate override applied for blackout date: ${targetService.blackout.label || targetService.blackout.reason || "Blackout date"}. Confirm DMC special price, update the rate, then send.`,
        {
          id: `blackout-rate-${id}`,
          icon: "⚠️",
          style: {
            border: "1px solid rgba(245, 158, 11, 0.25)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.45), 0 0 15px rgba(245, 158, 11, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
          }
        }
      );
    }
  }
      if (
      !force &&
      nextChecked &&
      (normalizedTargetType === "transfer" || normalizedTargetType === "car") &&
      servicePassengerCapacity > 0 &&
      totalPassengers > 0 &&
      servicePassengerCapacity > totalPassengers
      ) {
      setTransportSelectionConfirm({
      open: true,
      serviceId: id,
      serviceTitle: targetService?.title || "Selected transport service",
      passengerCapacity: servicePassengerCapacity,
      passengerCount: totalPassengers,
      });
      return;
      }

      if (
      normalizedTargetType === "hotel" &&
      nextChecked &&
      getRemainingHotelNights(services, id) === 0
      ) {
      toast.error("All trip nights are already assigned to other hotels.", {
      id: `hotel-night-limit-${id}`,
      });
      return;
      }

      setServices((prev) =>
      prev.map((service) => {
      if (service.id !== id) {
      return service;
      }

      const nextChecked = !service.checked;

      if (service.type !== "hotel") {
      return {
      ...service,
      checked: nextChecked,
      useStoredPricing: nextChecked ? service.useStoredPricing : false,
      serviceDate: nextChecked
      ? service.serviceDate || formatDateInput(order?.startDate)
      : service.serviceDate,
      };
      }

      if (!nextChecked) {
      return { ...service, checked: false, nights: "", useStoredPricing: false };
      }

      return {
      ...service,
      checked: true,
      useStoredPricing: service.useStoredPricing,
      blackout: service.blackout?.isBlackout && canOverrideBlackoutRate
      ? { ...service.blackout, isBlackout: false, wasBlackout: true, overrideApproved: true }
      : service.blackout,
      blackoutOverride: service.blackout?.isBlackout && canOverrideBlackoutRate
      ? {
      approved: true,
      source: "ops_manager_special_rate",
      reason: service.blackout.label || service.blackout.reason || "Blackout date special pricing",
      }
      : service.blackoutOverride,
      serviceDate:
      service.serviceDate || getHotelDefaultStartDate(prev, id),
      nights: "",
      };
      })
      );
      };

      const updateField = (id, field, value) => {
      setServices((prev) =>
      prev.map((service) => {
      if (service.id !== id) {
      return service;
      }

      if (service.type === "hotel" && field === "nights") {
      const remainingHotelNights = getRemainingHotelNights(prev, id);
      const selectedNights = Number(value);

      if (!selectedNights) {
      return { ...service, nights: "", useStoredPricing: false };
      }

      const safeNights = Math.min(selectedNights, remainingHotelNights);

      return { ...service, nights: safeNights > 0 ? safeNights : "", useStoredPricing: false };
      }

      if (service.type === "hotel" && field === "serviceDate") {
      return { ...service, serviceDate: value, useStoredPricing: false };
      }

      if (field === "rate") {
      const normalizedServiceType = normalizeServiceFilterType(service.type);
      const nextRate = roundCurrencyAmount(value);
      return {
      ...service,
      rate: nextRate,
      quoteBaseRate: normalizedServiceType === "hotel" ? nextRate : service.quoteBaseRate,
      hotelRateMode: normalizedServiceType === "hotel" ? "unit-rate" : service.hotelRateMode,
      useStoredPricing: false,
      manualRateOverride: true,
      originalTotal: 0,
      totalInInr: 0,
      priceInInr: 0,
      };
      }

      if (service.type === "hotel" && field === "rooms") {
      const requestedRooms = Math.max(1, Number(value || 1));
      const maxAllowedRooms = Math.max(1, adultPassengers || 0);

      if (requestedRooms > maxAllowedRooms) {
      toast.error(
      `You can book rooms only according to the number of adults, not more than that.`,
      { id: `room-limit-${id}` },
      );
      return {
      ...service,
      rooms: maxAllowedRooms,
      useStoredPricing: false,
      };
      }

      return {
      ...service,
      rooms: requestedRooms,
      useStoredPricing: false,
      };
      }

      if (
      service.type === "hotel" &&
      ["roomCategory", "roomType", "bedType"].includes(field)
      ) {
      return resolveHotelVariantSelection(prev, service, field, value);
      }

      if ((service.type === "transfer" || service.type === "car") && field === "usageType") {
      return applyFixedTransportUsagePricing(
      { ...service, usageType: normalizeTransportUsageValue(value), useStoredPricing: false },
      service.rate,
      service.currency,
      );
      }

      if ((service.type === "transfer" || service.type === "car") && field === "days") {
      const availableTransportDays = getAvailableTransportDaysFromDate(
      service.serviceDate || formatDateInput(order?.startDate),
      );
      const safeDays = Math.min(Math.max(Number(value || 1), 1), availableTransportDays);
      return { ...service, days: safeDays, useStoredPricing: false };
      }

      if ((service.type === "transfer" || service.type === "car") && field === "serviceDate") {
      const availableTransportDays = getAvailableTransportDaysFromDate(value);
      const safeDays = Math.min(Math.max(Number(service.days || 1), 1), availableTransportDays);
      return { ...service, serviceDate: value, days: safeDays, useStoredPricing: false };
      }

      return { ...service, [field]: value, useStoredPricing: false };
      })
      );
      };

      const focusServiceEditor = (service) => {
      if (!service?.id) return;

      setContractedRatesSearch("");
      setContractedRatesFilter(normalizeServiceFilterType(service.type) || "all");
      setFocusedServiceCardId(service.id);
      setEditingServiceCardId(service.id);

      window.setTimeout(() => {
      const target = document.getElementById(getServiceCardDomId(service.id));
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 180);
      };

      const closeSelectedServicesModal = () => {
      setIsSelectedServicesModalOpen(false);
      setSelectedServicesModalTargetId("");
      setSelectedServicesModalScope("all");
      };

      const openSelectedServicesModal = (serviceId = "", scope = "all") => {
      setActiveWorkspaceModal("");
      setSelectedServicesModalTargetId(serviceId || "");
      setSelectedServicesModalScope(scope);
      setIsSelectedServicesModalOpen(true);
      };

      const openWorkspaceModal = (workspace) => {
      closeSelectedServicesModal();
      setActiveWorkspaceModal(workspace);
      };

      const closeWorkspaceModal = () => {
      setActiveWorkspaceModal("");
      };

      const openSelectedServicesModalForService = (service) => {
      if (!service?.id || !service.checked) return;

      setFocusedServiceCardId(service.id);
      openSelectedServicesModal(service.id, "single");
      };

      const handleSelectedServiceEditAction = async (service) => {
      if (!service?.id) return;

      if (editingServiceCardId !== service.id) {
      closeSelectedServicesModal();
      focusServiceEditor(service);
      return;
      }

      const savingToast = toast.loading("Saving edited service...");

      try {
      await persistQuotationDraft();
      toast.dismiss(savingToast);
      toast.success("Edited service saved");
      showQuickActionFeedback(
      "success",
      "Edit Saved",
      `${service.title} changes have been saved successfully.`,
      );
      setEditingServiceCardId("");
      closeSelectedServicesModal();
      } catch (error) {
      toast.dismiss(savingToast);
      console.error("Failed to save edited service", error);
      toast.error(error?.response?.data?.message || "Failed to save edited service");
      }
      };

      const handleSelectedServiceDelete = async (service) => {
      if (!service?.id) return;

      if (editingServiceCardId === service.id) {
      setEditingServiceCardId("");
      }

      if (service.custom) {
      await deleteService(service.id);
      return;
      }

      toggleService(service.id);
      };

      const applyPackageToServices = (pkg) => {
      setSelectedPackageTemplate(pkg);

      if (!pkg) {
      return;
      }

      setServices((prev) => buildPackageMatchedServices(prev, pkg));
      };

      const renderSelectedServicesList = (servicesToRender = selectedServices) => (
      servicesToRender.length > 0 ? (
      <div className={`dark-scrollbar space-y-3 overflow-y-auto pr-1 ${selectedServicesModalScope==="single"
        ? "mx-auto max-w-2xl" : "" }`}>
        {servicesToRender.map((service) => {
        const serviceEdits = getSelectedServiceQuotationEdits(service);
        const serviceIncludedItems = getSelectedServiceIncludedItems(service);
        const isSingleServiceModalView =
        selectedServicesModalScope === "single" && servicesToRender.length === 1;

        const Chip = ({ icon, label, value, accent = "text-slate-300", iconColor = "text-slate-500" }) => (
        <div
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#212f45] bg-[#0a1018] px-2.5 py-[5px]">
          {icon && (
          <span className={`flex-shrink-0 ${iconColor}`} style={{ lineHeight: 0 }}>
            {icon}
          </span>
          )}
          {label && (
          <span className="flex-shrink-0 text-[10px] font-medium text-slate-500">{label}:</span>
          )}
          <span className={`max-w-[120px] truncate text-[10px] font-semibold leading-none ${accent}`}>
            {value}
          </span>
        </div>
        );

        const typeAccent =
        service.type === "hotel"
        ? { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-200" }
        : service.type === "activity"
        ? { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-200" }
        : service.type === "transfer" || service.type === "car"
        ? { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-200" }
        : { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-200" };
        const isTargetedService = selectedServicesModalTargetId === service.id;

        return (
        <div key={`selected-${service.id}`} id={getSelectedServiceSummaryDomId(service.id)} className={`rounded-[24px]
          border bg-[#050505] p-3 transition-all duration-200 ${ isTargetedService
          ? "border-sky-400/60 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]" : "border-[#22314a]" }
          ${isSingleServiceModalView ? "mx-auto w-full max-w-2xl" : "" }`}>
          <div className="rounded-[18px] border border-[#162233] bg-[#08111c] px-3 py-3">
            <div className={`flex items-start gap-2.5 ${isSingleServiceModalView ? "flex-col" : "" }`}>
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#27436d] bg-[#0b1627]">
                {renderSelectedServiceSummaryIcon(service)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight text-white">
                    {service.title}
                  </p>
                  {isTargetedService && (
                  <span
                    className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-300">
                    Active
                  </span>
                  )}
                </div>
                {(service.city || service.country) && (
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {[service.city, service.country].filter(Boolean).join(", ")}
                </p>
                )}
              </div>

              <div className={`${isSingleServiceModalView ? "w-full pl-[46px] text-left"
                : "flex-shrink-0 pl-1 text-right" }`}>
                <p className="whitespace-nowrap text-[12px] font-semibold leading-tight text-yellow-300">
                  {formatCurrencyValue(service.originalTotal || 0, service.currency)}
                </p>
                {service.isForeignCurrency && (
                <p className="mt-0.5 whitespace-nowrap text-[10px] text-sky-300">
                  ₹ {formatAmountValue(service.totalInInr || 0)}
                </p>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <div className={`inline-flex items-center rounded-lg border px-2.5 py-[5px] ${typeAccent.bg}
                ${typeAccent.border}`}>
                <span className={`text-[10px] font-semibold leading-none ${typeAccent.text}`}>
                  {getServiceTypeLabel(service.type)}
                </span>
              </div>

              {service.serviceDate && (
              <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                )}
                value={formatServiceDateLabel(service.serviceDate)}
                />
                )}

                {service.type === "hotel" && Number(service.nights || 0) > 0 && (
                <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4v16" />
                  <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                  <path d="M2 17h20" />
                  <path d="M6 8v9" />
                  </svg>
                  )}
                  value={`${service.nights} night${Number(service.nights) > 1 ? "s" : ""}`}
                  accent="text-sky-200"
                  />
                  )}

                  {service.type === "hotel" && Number(service.rooms || 0) > 0 && (
                  <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    )}
                    value={`${service.rooms} room${Number(service.rooms) > 1 ? "s" : ""}`}
                    />
                    )}

                    {service.type === "hotel" && service.bedType && (
                    <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" />
                      <path d="M2 20v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" />
                      <path d="M2 14h20" />
                      <path d="M7 14v2" />
                      <path d="M17 14v2" />
                      </svg>
                      )}
                      value={getBedTypeOptionLabel(service.bedType)}
                      accent="text-amber-200"
                      iconColor="text-amber-400"
                      />
                      )}

                      {(service.type === "transfer" || service.type === "car") && Number(service.days || 0) > 0 && (
                      <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                        </svg>
                        )}
                        value={`${service.days} day${Number(service.days) > 1 ? "s" : ""}`}
                        accent="text-violet-200"
                        iconColor="text-violet-400"
                        />
                        )}

                        {service.type === "activity" && Number(service.pax || 0) > 0 && (
                        <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          )}
                          value={`${service.pax} pax`}
                          accent="text-emerald-200"
                          iconColor="text-emerald-400"
                          />
                          )}

                          {service.type === "sightseeing" && (
                          <>
                            {Number(service.pax || 0) > 0 && (
                            <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              </svg>
                              )}
                              value={`${service.pax} pax`}
                              accent="text-blue-200"
                              iconColor="text-blue-400"
                              />
                              )}
                              {Number(service.days || 0) > 0 && (
                              <Chip icon={( <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                                </svg>
                                )}
                                value={`${service.days} day${Number(service.days) > 1 ? "s" : ""}`}
                                accent="text-blue-200"
                                iconColor="text-blue-400"
                                />
                                )}
                          </>
                          )}
            </div>

            {serviceIncludedItems.length > 0 && (
            <div className="mt-3 rounded-[14px] border border-emerald-500/18 bg-[#07150f] px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Included In Service
                </p>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[7px] font-semibold text-emerald-200">
                  {serviceIncludedItems.length} item{serviceIncludedItems.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {serviceIncludedItems.map((item, itemIndex) => (
                <span
                  key={`${service.id}-include-${itemIndex}`}
                  className="inline-flex items-center rounded-[8px] border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-[5px] text-[10px] font-medium leading-none text-emerald-100"
                >
                  {item}
                </span>
                ))}
              </div>
            </div>
            )}

            {serviceEdits.length > 0 && (
            <div className="mt-3 rounded-[14px] border border-sky-500/20 bg-[#071420] px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                  Quotation Edits
                </p>
                <span
                  className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[7px] font-semibold text-sky-200">
                  {serviceEdits.length} update{serviceEdits.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {serviceEdits.map((edit) => {
                const toneClasses =
                edit.variant === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : edit.variant === "warning"
                ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-100"
                : edit.variant === "danger"
                ? "border-red-500/25 bg-red-500/10 text-red-200"
                : "border-sky-500/20 bg-sky-500/10 text-sky-100";
                const iconClasses =
                edit.variant === "success"
                ? "text-emerald-300"
                : edit.variant === "warning"
                ? "text-yellow-300"
                : edit.variant === "danger"
                ? "text-red-300"
                : "text-sky-300";

                return (
                <span key={`${service.id}-${edit.key}-${edit.label}`} className={`inline-flex items-center gap-1
                  rounded-[8px] border px-2.5 py-[5px] text-[10px] font-medium leading-none ${toneClasses}`}>
                  <CheckCircle2 size={11} className={`shrink-0 ${iconClasses}`} />
                  <span className="font-semibold">{edit.label}</span>
                  <span className="opacity-40">:</span>
                  <span>{edit.value}</span>
                </span>
                );
                })}
              </div>
            </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3 px-0.5">
            <p className="text-[10px] font-medium text-slate-400">Quick Actions</p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={()=> handleSelectedServiceEditAction(service)}
                className="cursor-pointer rounded-xl border border-sky-400/35 bg-sky-500/10 px-3.5 py-1.5 text-[11px]
                font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-500/15"
                >
                {editingServiceCardId === service.id ? "Save" : "Edit"}
              </button>
              <button type="button" onClick={()=> handleSelectedServiceDelete(service)}
                className="cursor-pointer rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-1.5 text-[11px]
                font-medium text-red-200 transition hover:border-red-300/50 hover:bg-red-500/15"
                >
                Delete
              </button>
            </div>
          </div>
        </div>
        );
        })}
      </div>
      ) : (
      <div className="rounded-2xl border border-dashed border-[#28303d] bg-[#090909] px-4 py-8 text-center">
        <p className="text-sm font-medium text-white">No services selected yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Pick services from the section above and they will appear here automatically.
        </p>
      </div>
      )
      );

      const renderSelectedServicesModal = () => {
      if (typeof document === "undefined") {
      return null;
      }

      return createPortal(
      <AnimatePresence>
        {isSelectedServicesModalOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[120] flex h-screen w-screen items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm"
          onClick={closeSelectedServicesModal}>
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ duration: 0.24, ease: "easeOut" }} className={`flex
            w-full flex-col overflow-hidden rounded-[28px] border border-[#22314a] bg-[#050505]
            shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${ selectedServicesModalScope==="single" ? "max-h-[90vh] max-w-3xl"
            : "h-[min(90vh,960px)] max-w-5xl" }`} onClick={(event)=> event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Selected services"
            >
            <div className="flex items-start justify-between gap-4 border-b border-[#162233] bg-[#08111c] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedServicesModalScope === "single" ? "Service Editor" : "Selected Services"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedServicesModalScope === "single"
                  ? "This focused view shows only the service you chose to edit."
                  : "All checked services are listed here for quick edit or delete."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                  {visibleSelectedServices.length} {selectedServicesModalScope === "single" ? "service" : "selected"}
                </div>
                <button type="button" onClick={closeSelectedServicesModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#22314a] bg-[#050505] text-slate-300 transition hover:border-sky-400/40 hover:text-white"
                  aria-label="Close selected services modal">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={`dark-scrollbar overflow-y-auto px-5 py-5 ${ selectedServicesModalScope==="single"
              ? "max-h-[calc(90vh-140px)]" : "flex-1" }`}>
              {renderSelectedServicesList(visibleSelectedServices)}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      );
      };

      const renderItineraryWorkspaceContent = () => (
      <div className="space-y-4">
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#232323] bg-[#070707] px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
              <CalendarDays size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Auto Synced With Duration</p>
              <p className="mt-1 text-xs text-slate-500">
                Duration: {tripDuration.label || "Trip dates pending"}{order?.startDate ? ` • Starts
                ${formatShareDate(order.startDate)}` : ""}
              </p>
            </div>
          </div>
          <span
            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            {itineraryEntries.length} Day{itineraryEntries.length === 1 ? "" : "s"}
          </span>
        </div>

        {itineraryEntries.length ? itineraryEntries.map((entry) => {
        const dayLabel = entry.dayLabel || buildItineraryDayLabel(entry.dayNumber, entry.date);
        const fullHeading = entry.title ? `${dayLabel}: ${entry.title}` : dayLabel;

        return (
        <div key={`itinerary-day-${entry.dayNumber}`} className="rounded-2xl border border-[#232323] bg-[#070707] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
                <MdOutlineTravelExplore size={15} />
              </span>
              <p className="truncate text-sm font-semibold text-white">{fullHeading}</p>
            </div>
            <span
              className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-300">
              Day {entry.dayNumber}
            </span>
          </div>

          <div className="space-y-2">
            <input type="text" value={entry.title} onChange={(e)=> updateDayWiseItineraryEntry(entry.dayNumber, "title",
            e.target.value)}
            placeholder="Enter heading e.g. North Phu Quoc Airport to Phu Quoc Hotel - pvt"
            className="w-full rounded-xl border border-gray-700 bg-black px-3 py-2 text-sm text-white outline-none
            transition focus:border-yellow-500"
            />
            <textarea value={entry.description} onChange={(e)=> updateDayWiseItineraryEntry(entry.dayNumber, "description", e.target.value)}
                rows={4}
                placeholder="Add description, timings, activities, transfers, meals, or special notes for this day..."
                className="min-h-[120px] w-full resize-y rounded-xl border border-gray-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-yellow-500"
              />
            </div>
          </div>
        );
      }) : (
        <p className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#070707] px-4 py-6 text-center text-xs text-slate-500">
          Trip duration is not available yet, so itinerary days cannot be generated.
        </p>
      )}
    </div>
  );

  const renderNotesWorkspaceContent = () => (
    <div className="space-y-4">
      {[
        {
          key: "inclusion",
          title: "Inclusions",
          placeholder: "Add included item and press Add",
          items: inclusions,
          accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        },
        {
          key: "exclusion",
          title: "Exclusions",
          placeholder: "Add excluded item and press Add",
          items: exclusions,
          accent: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        },
        {
          key: "additionalNote",
          title: "Important Notes",
          placeholder: "Add special terms or extra information and press Add",
          items: additionalNotes,
          accent: "border-sky-500/30 bg-sky-500/10 text-sky-300",
        },
      ].map((section) => (
        <div key={section.key} className="rounded-2xl border border-[#232323] bg-[#070707] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  section.key === "inclusion"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : section.key === "exclusion"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                }`}
              >
                {section.key === "inclusion" ? (
                  <CheckCircle2 size={15} />
                ) : section.key === "exclusion" ? (
                  <X size={15} />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3h6" />
                    <path d="M10 12h4" />
                    <path d="M10 16h4" />
                    <path d="M9 8h6" />
                    <path d="M5 3h1a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 1 2-2Z" />
                    <path d="M14 3h5a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 0-2-2Z" />
                  </svg>
                )}
              </span>
              <p className="text-sm font-semibold text-white">{section.title}</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${section.accent}`}>
              {section.items.length} item{section.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              value={dynamicNoteInputs[section.key]}
              onChange={(e) => updateDynamicNoteInput(section.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  appendDynamicNoteItem(section.key);
                }
              }}
              placeholder={section.placeholder}
              className="flex-1 rounded-xl border border-gray-700 bg-black px-3 py-2 text-sm text-white outline-none transition focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={() => appendDynamicNoteItem(section.key)}
              className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/20"
            >
              Add
            </button>
          </div>

          {section.items.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {section.items.map((item, index) => (
                <div
                  key={`${section.key}-${index}-${item}`}
                  className="flex items-center gap-2 rounded-xl border border-[#2c2c2c] bg-[#111111] px-3 py-2 text-xs text-slate-200"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeDynamicNoteItem(section.key, index)}
                    className="text-slate-400 transition hover:text-red-300"
                    aria-label={`Remove ${section.title} item`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No {section.title.toLowerCase()} added yet.</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderWorkspaceModal = () => {
    if (typeof document === "undefined") {
      return null;
    }

    const modalConfig = activeWorkspaceModal === "itinerary"
      ? {
          title: "Day Wise Itinerary",
          description: "Add a heading and description for each day in a dedicated itinerary workspace.",
          badge: `${itineraryEntries.length} Day${itineraryEntries.length === 1 ? "" : "s"}`,
          ariaLabel: "Day wise itinerary workspace",
          content: renderItineraryWorkspaceContent(),
        }
      : {
          title: "Additional Notes",
          description: "Manage inclusions, exclusions, and important notes that appear across quotation views.",
          badge: `${inclusions.length + exclusions.length + additionalNotes.length} Items`,
          ariaLabel: "Additional notes workspace",
          content: renderNotesWorkspaceContent(),
        };

    return createPortal(
      <AnimatePresence>
        {activeWorkspaceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[120] flex h-screen w-screen items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm"
            onClick={closeWorkspaceModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            className="flex h-[min(90vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[#22314a] bg-[#050505] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={modalConfig.ariaLabel}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#162233] bg-[#08111c] px-5 py-4">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                      activeWorkspaceModal === "itinerary"
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
                        : "border-sky-500/30 bg-sky-500/10 text-sky-200"
                    }`}
                  >
                    {activeWorkspaceModal === "itinerary" ? (
                      <CalendarDays size={18} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3h6" />
                        <path d="M10 12h4" />
                        <path d="M10 16h4" />
                        <path d="M9 8h6" />
                        <path d="M5 3h1a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 1 2-2Z" />
                        <path d="M14 3h5a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 0-2-2Z" />
                      </svg>
                    )}
                  </span>
                  <h2 className="text-lg font-semibold text-white">{modalConfig.title}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-400">{modalConfig.description}</p>
              </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                    {modalConfig.badge}
                  </div>
                  <button
                    type="button"
                    onClick={closeWorkspaceModal}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#22314a] bg-[#050505] text-slate-300 transition hover:border-sky-400/40 hover:text-white"
                    aria-label={`Close ${modalConfig.title} modal`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="dark-scrollbar flex-1 overflow-y-auto px-5 py-5">
                {modalConfig.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  };

  const renderSelectedServicesSection = (variants = sectionRevealVariants) => (
    <>
      <motion.div variants={variants} className="rounded-xl border border-gray-700 bg-[#0e0e0e] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold text-white">Selected Services</h2>
            <p className="mt-1 whitespace-nowrap text-[11px] leading-relaxed text-slate-400">
              Review, edit, and manage all selected services inside a focused modal workspace.
            </p>
          </div>
          <div className="flex min-w-[88px] items-center justify-center gap-1 rounded-[28px] border border-yellow-500/40 bg-[#2a2208] px-2 py-1.5 text-center text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <span className="text-[11px] font-semibold leading-none">{selectedServices.length}</span>
            <span className="text-[11px] font-semibold leading-none">selected</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#080d14] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Service Desk
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Open the modal to work with the currently selected quotation services.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openSelectedServicesModal(editingServiceCardId || "", "all")}
              className="cursor-pointer rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2 text-[11px] font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-500/15"
            >
              Open All Selected Services
            </button>
          </div>
        </div>
      </motion.div>
      {renderSelectedServicesModal()}
    </>
  );

  const renderQuotationWorkspaceButtons = (variants = sectionRevealVariants) => {
    const totalNoteItems = inclusions.length + exclusions.length + additionalNotes.length;

    return (
      <div className="space-y-3">
        <motion.button
          variants={variants}
          type="button"
          onClick={() => openWorkspaceModal("itinerary")}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-yellow-400 px-4 py-2 text-md font-semibold text-black transition hover:bg-yellow-500"
        >
          <CalendarDays size={18} />
          <span>Day Wise Itinerary</span>
          <span className="rounded-full border border-black/10 bg-black/10 px-2 py-0.5 text-xs font-semibold">
            {itineraryEntries.length}D
          </span>
        </motion.button>

        <motion.button
          variants={variants}
          type="button"
          onClick={() => openWorkspaceModal("notes")}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-white px-4 py-2 text-md font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3h8" />
            <path d="M8 7h8" />
            <path d="M8 11h5" />
            <path d="M6 3h1a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3h4a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 0-2-2Z" />
          </svg>
          <span>Additional Notes</span>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {totalNoteItems}
          </span>
        </motion.button>
      </div>
    );
  };

  if (!hasOrderContext) {
    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={pageShellVariants}
        className="-m-3 min-h-[calc(100vh-24px)] overflow-x-hidden bg-black p-3 text-white font-sans sm:-m-4 sm:min-h-[calc(100vh-32px)] sm:p-4 lg:-m-5 lg:min-h-[calc(100vh-40px)] lg:p-5"
      >
        <motion.div variants={sectionRevealVariants} className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl border border-yellow-500/30 bg-[#0b0f19] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-400">
              Quotation Builder
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">
              Query details are missing
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This page needs query data from Order Acceptance. Open the quotation builder from the previous screen so we can load the right quotation context.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/ops/order-acceptance")}
                className="rounded-full bg-yellow-500 px-6 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
              >
                Go to Order Acceptance
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border border-slate-600 px-6 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
              >
                Go Back
              </button>
            </div>
          </div>
        </motion.div>
      </motion.section>
    );
  }

  
  return (
    <>
      <motion.section
        initial="hidden"
        animate="visible"
        variants={pageShellVariants}
        className="-m-3 min-h-[calc(100vh-24px)] overflow-x-hidden bg-black p-3 text-white font-sans sm:-m-4 sm:min-h-[calc(100vh-32px)] sm:p-4 lg:-m-5 lg:min-h-[calc(100vh-40px)] lg:p-5"
      >
        {/* Header */}
        <motion.div variants={sectionRevealVariants} className="mb-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-yellow-400 text-sm cursor-pointer"
          >
            ← Back to Order Acceptance
          </button>
          <div className="flex items-start gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuotationHistoryOpen((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-yellow-500/35 bg-[#131a28] px-3 py-2 text-xs font-semibold text-yellow-300 transition hover:border-yellow-400/60 hover:bg-[#172033]"
              >
                <FileText size={14} />
                <span>Quotation History</span>
                <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] text-yellow-200">
                  {quotationHistory.length}
                </span>
                {isQuotationHistoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence>
                {isQuotationHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute right-0 top-full z-30 mt-2 w-[320px] origin-top-right overflow-hidden rounded-2xl border border-yellow-500/25 bg-[#0f1522] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                >
                  <div className="border-b border-slate-800 px-4 py-3">
                    <p className="text-sm font-semibold text-white">Previous Quotations</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Select any quotation to review it first, then click edit if you want to load it in the builder.
                    </p>
                  </div>

                  <div className="max-h-[28rem] overflow-y-auto px-2 py-2 [scrollbar-color:transparent_transparent] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent">
                    {quotationHistoryLoading ? (
                      <p className="px-2 py-3 text-xs text-slate-400">Loading quotation history...</p>
                    ) : quotationHistoryLoadError ? (
                      <p className="px-2 py-3 text-xs text-rose-300">{quotationHistoryLoadError}</p>
                    ) : quotationHistory.length ? (
                      quotationHistory.map((quotation) => {
                        const isSelected = quotation.id === selectedHistoryQuotationId;

                        return (
                          <button
                            key={quotation.id}
                            type="button"
                            onClick={() => {
                              setSelectedHistoryQuotationId(quotation.id);
                            }}
                            className={`mb-2 flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                              isSelected
                                ? "border-yellow-400/60 bg-yellow-500/10"
                                : "border-slate-800 bg-[#111827] hover:border-slate-700 hover:bg-[#151f30]"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-yellow-400 bg-yellow-400 text-black"
                                  : "border-slate-600 bg-transparent text-transparent"
                              }`}
                            >
                              <CheckCircle2 size={11} strokeWidth={3} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-white">
                                  {quotation.quotationNumber || `Quotation ${quotation.attemptNumber}`}
                                </span>
                                {quotation.isLatest && (
                                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                                    Latest
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-[11px] text-slate-400">
                                {quotation.status} • {quotation.createdAtLabel || "Date unavailable"}
                              </span>
                              <span className="mt-1 block text-xs font-semibold text-yellow-200">
                                {formatCurrencyValue(quotation.displayAmount || 0, quotation.pricing?.currency || "INR")}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-2 py-3 text-xs text-slate-400">
                        No previous quotations found for this query yet.
                      </p>
                    )}

                    {selectedHistoryQuotation && !quotationHistoryLoading && !quotationHistoryLoadError && (
                      <div className="mt-3 rounded-2xl border border-sky-400/20 bg-[#0b1220] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                              Selected History
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {selectedHistoryQuotation.quotationNumber || `Quotation ${selectedHistoryQuotation.attemptNumber}`}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {selectedHistoryQuotation.status} • {selectedHistoryQuotation.createdAtLabel || "Date unavailable"}
                            </p>
                          </div>
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                            Preview
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">OPS Total</p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {formatCurrencyValue(selectedHistoryQuotation.opsTotalAmount || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Services Total</p>
                            <p className="mt-1 text-xs font-semibold text-sky-300">
                              {formatCurrencyValue(
                                Number(selectedHistoryQuotation.pricing?.subTotal || 0) ||
                                (selectedHistoryQuotation.services || []).reduce(
                                  (sum, service) => sum + Number(service?.totalInInr || service?.total || 0),
                                  0,
                                ),
                                selectedHistoryQuotation.pricing?.currency || "INR",
                              )}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Services</p>
                            <p className="mt-1 text-xs font-semibold text-sky-300">
                              {selectedHistoryQuotation.serviceCount || 0} item{selectedHistoryQuotation.serviceCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Taxes</p>
                            <p className="mt-1 text-xs font-semibold text-emerald-300">
                              {formatCurrencyValue(selectedHistoryQuotation.pricing?.tax?.totalTax || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                            </p>
                          </div>
                        </div>

                        {selectedHistoryQuotation.agentRevisionRemark && (
                          <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/8 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                              Revision Remark
                            </p>
                            <p className="mt-1 text-xs leading-5 text-rose-100">
                              {selectedHistoryQuotation.agentRevisionRemark}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-700 bg-[#111827] px-2.5 py-1 text-[10px] font-medium text-slate-300">
                            Inclusions {selectedHistoryQuotation.inclusions?.length || 0}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-[#111827] px-2.5 py-1 text-[10px] font-medium text-slate-300">
                            Exclusions {selectedHistoryQuotation.exclusions?.length || 0}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-[#111827] px-2.5 py-1 text-[10px] font-medium text-slate-300">
                            Notes {selectedHistoryQuotation.additionalNotes?.length || 0}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsFreshDraftMode(false);
                              setActiveDraftSourceQuotationId(selectedHistoryQuotation.id);
                              setEditingTargetQuotationId(selectedHistoryQuotation.id);
                              editingSourceQuotationSnapshotRef.current = selectedHistoryQuotation;
                              setEditingSourceQuotationSnapshot(selectedHistoryQuotation);
                              setDraftHydrated(false);
                              setDraftSourceReloadRequest((value) => value + 1);
                              setIsQuotationHistoryOpen(false);
                            }}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                              editingTargetQuotationId === selectedHistoryQuotation.id
                                ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                : "border border-sky-400/30 bg-sky-500/10 text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/15"
                            }`}
                          >
                            Edit This Quotation
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              resetBuilderWorkspace();
                              setIsFreshDraftMode(true);
                              setActiveDraftSourceQuotationId("");
                              setEditingTargetQuotationId("");
                              editingSourceQuotationSnapshotRef.current = null;
                              setEditingSourceQuotationSnapshot(null);
                              setDraftHydrated(false);
                              setSelectedHistoryQuotationId("");
                              setIsQuotationHistoryOpen(false);
                            }}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              !isEditingHistoricalQuotation
                                ? "border-yellow-400/40 bg-yellow-500/12 text-yellow-200"
                                : "border-slate-700 bg-[#111827] text-slate-200 hover:border-slate-500 hover:text-white"
                            }`}
                          >
                            Start Fresh Draft
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            <div className="text-right font-semibold text-yellow-400">
              <p className="text-xs text-[#90a1b9]">Query ID</p>
              <span className="font-bold">{orderQueryId || "-"}</span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={sectionRevealVariants} className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quotation Builder</h1>
            <p className="text-gray-400">
              Create a quote from contracted rates
            </p>
            {order?.opsStatus === "Revision_Query" && (
              <p className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Revision builder now starts with a fresh draft
              </p>
            )}
          </div>
        </motion.div>
        {showLatestSentQuotationCard && latestSentQuotation && (
          <motion.div
            variants={sectionRevealVariants}
            className="mb-5 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 shadow-[0_14px_38px_rgba(14,165,233,0.10)]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                  Latest Quotation Sent To Agent
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-white">
                    {latestSentQuotation.quotationNumber || "Quotation"}
                  </span>
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-200">
                    {latestSentQuotation.status || "Quote Sent"}
                  </span>
                  {latestSentQuotation.createdBy?.label && (
                    <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-200">
                      Sent by {latestSentQuotation.createdBy.label}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  This query already has a quotation shared with the agent.
                  {latestSentQuotation.updatedAtLabel ? ` Last updated ${latestSentQuotation.updatedAtLabel}.` : ""}
                </p>
              </div>
              <div className="grid min-w-[220px] grid-cols-2 gap-2">
                <div className="rounded-xl border border-sky-400/20 bg-black/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Total</p>
                  <p className="mt-1 text-sm font-semibold text-sky-200">
                    {formatCurrencyValue(latestSentQuotation.displayAmount || 0, latestSentQuotation.pricing?.currency || "INR")}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-400/20 bg-black/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Services</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {latestSentQuotation.serviceCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {SHOW_SELECTED_HISTORY_COMPARISON && selectedHistoryQuotation && (
          <motion.div
            variants={sectionRevealVariants}
            className="mb-6 rounded-3xl border border-slate-800 bg-[#0d1320] p-5 shadow-[0_16px_44px_rgba(0,0,0,0.24)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                    Reference History
                  </span>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedHistoryQuotation.quotationNumber || `Quotation ${selectedHistoryQuotation.attemptNumber}`}
                  </h2>
                  <span className="rounded-full border border-slate-700 bg-[#111827] px-3 py-1 text-[11px] font-medium text-slate-300">
                    {selectedHistoryQuotation.status}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  This quotation is shown only for comparison. The active revision draft below is fresh and independent from this history entry.
                </p>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Created</p>
                  <p className="mt-1 font-semibold text-white">{selectedHistoryQuotation.createdAtLabel || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Valid Till</p>
                  <p className="mt-1 font-semibold text-white">{selectedHistoryQuotation.validTillLabel || "-"}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Services Total</p>
                <p className="mt-1 text-sm font-semibold text-sky-300">
                  {formatCurrencyValue(selectedHistoryQuotation.pricing?.subTotal || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">OPS Markup</p>
                <p className="mt-1 text-sm font-semibold text-yellow-300">
                  {formatCurrencyValue(selectedHistoryQuotation.pricing?.opsMarkup?.amount || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">OPS Charges</p>
                <p className="mt-1 text-sm font-semibold text-orange-300">
                  {formatCurrencyValue(
                    Number(selectedHistoryQuotation.pricing?.opsCharges?.serviceCharge || 0) +
                    Number(selectedHistoryQuotation.pricing?.opsCharges?.handlingFee || 0),
                    selectedHistoryQuotation.pricing?.currency || "INR",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Taxes</p>
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  {formatCurrencyValue(selectedHistoryQuotation.pricing?.tax?.totalTax || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">OPS Total</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatCurrencyValue(selectedHistoryQuotation.opsTotalAmount || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#111827] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Client Total</p>
                <p className="mt-1 text-sm font-semibold text-violet-300">
                  {selectedHistoryQuotation.clientTotalAmount !== null && selectedHistoryQuotation.clientTotalAmount !== undefined
                    ? formatCurrencyValue(selectedHistoryQuotation.clientTotalAmount, selectedHistoryQuotation.pricing?.currency || "INR")
                    : "Not shared"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Services in this quotation</h3>
                  <span className="rounded-full border border-slate-700 bg-[#0d1320] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    {selectedHistoryQuotation.serviceCount} item{selectedHistoryQuotation.serviceCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedHistoryQuotation.services?.length ? (
                    selectedHistoryQuotation.services.map((service, index) => (
                      <div key={`${selectedHistoryQuotation.id}-service-${index}`} className="rounded-2xl border border-slate-800 bg-[#0d1320] px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{service?.title || "Service"}</p>
                          <span className="text-xs font-medium text-slate-400">
                            {formatCurrencyValue(service?.totalInInr || service?.total || 0, selectedHistoryQuotation.pricing?.currency || "INR")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {service?.type || "service"}{service?.city ? ` • ${service.city}` : ""}{service?.serviceDate ? ` • ${formatShareDate(service.serviceDate)}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No services were saved in this quotation.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedHistoryQuotation.agentRevisionRemark && (
                  <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300">Revision Remark</p>
                    <p className="mt-2 text-sm leading-6 text-rose-100">{selectedHistoryQuotation.agentRevisionRemark}</p>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Inclusions</p>
                  <p className="mt-2 text-sm text-white">{selectedHistoryQuotation.inclusions?.length || 0}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Exclusions</p>
                  <p className="mt-2 text-sm text-white">{selectedHistoryQuotation.exclusions?.length || 0}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Additional Notes</p>
                  <p className="mt-2 text-sm text-white">{selectedHistoryQuotation.additionalNotes?.length || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {renderWorkspaceModal()}

        {/* Layout */}
        <motion.div variants={sectionRevealVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* LEFT SIDE */}
          <motion.div variants={sideStackVariants} className="lg:col-span-2 space-y-8">

            {/* Query Info */}
            <motion.div variants={sectionRevealVariants} className="bg-[#0b0f19] rounded-2xl p-6 border border-yellow-500/50">
              <h2 className="text-md font-semibold text-white mb-6">
                Query Information
              </h2>

              <div className="grid grid-cols-2 gap-x-3 gap-y-4">

                {/* Agent Name */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Agent Name</p>
                  <p className="text-white text-xs font-medium">
                    {order?.agent?.companyName}
                  </p>
                </div>

                {/* Agent Email */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Agent Email</p>
                  <p className="text-white  text-xs font-medium">
                    {order?.agent?.email}
                  </p>
                </div>

                {/* Destination */}
                <div>
                  <p className="text-gray-400 text-xs mb-">Destination</p>
                  <p className="text-white  text-xs font-medium">
                    {order?.destination}
                  </p>
                </div>

                {/* Travel Date */}
                <div>
                  <p className="text-gray-400 text-xs mb-">Travel Date</p>
                  <p className="text-white  text-xs font-medium">
                    {new Date(order?.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-gray-400 text-xs">Duration</p>
                  <p className="text-white  text-xs font-medium">
                    {tripDuration.label}
                  </p>
                </div>

                {/* Passengers */}
                <div>
                  <p className="text-gray-400 text-xs">Passengers</p>
                  <p className="text-white text-xs font-medium">
                    {totalPassengers} PAX
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {adultPassengers} Adult{adultPassengers === 1 ? "" : "s"} | {childPassengers} Child{childPassengers === 1 ? "" : "ren"}
                  </p>
                </div>

              </div>

              <div className="mt-5 rounded-2xl border border-[#232833] bg-[#0f1522] p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-400/80">
                      Query Requirements
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click to view the request context before building the quote.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQueryRequirements((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] text-yellow-300 hover:bg-yellow-500/15 transition-colors cursor-pointer"
                  >
                    {showQueryRequirements ? "Hide Details" : "Show Details"}
                    {showQueryRequirements ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showQueryRequirements && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -8 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4">
                        {queryRequirementTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {queryRequirementTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1.5 rounded-full bg-[#141c2b] border border-[#293244] text-[11px] font-medium text-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mb-3">No structured requirements added.</p>
                        )}

                        <div className="rounded-2xl border border-dashed border-[#2a3448] bg-[#0c111b] px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 mb-2">
                            Special Preferences / Notes
                          </p>
                          {order?.specialRequirements ? (
                            <div className="flex flex-wrap gap-2">
                              {order.specialRequirements
                                .split(/[.,;\n]/)
                                .map((item) => item.trim())
                                .filter(Boolean)
                                .map((item, index) => (
                                  <span
                                    key={`${item}-${index}`}
                                    className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#2b3648] text-xs text-slate-200"
                                  >
                                    {item}
                                  </span>
                                ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No special preferences shared for this query.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {isInvoiceRequestedStage && (
              <motion.div
                variants={sectionRevealVariants}
                className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-[0_16px_35px_rgba(0,0,0,0.18)]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
                  <div>
                    <p className="font-semibold text-white">Client approval is already received for this query</p>
                    <p className="mt-1 text-xs leading-5 text-amber-100/90">
                      This booking has moved ahead from quotation building and is now in the amount and documents workflow.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <>
              <motion.div variants={sectionRevealVariants}>
                <PackageTemplate onApply={applyPackageToServices} />
              </motion.div>


                {/*=================================== Select Contracted Rates Service =============================== */}

                <motion.div variants={sectionRevealVariants} className="dark-scrollbar h-120 overflow-y-auto bg-black pr-1">
                  <div className="sticky top-0 z-10 mb-3 bg-black p-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h2 className="font-semibold">
                          Select Contracted Rates
                        </h2>
                        <p className="max-w-2xl text-[8px] leading-6 text-slate-400">
                          Tune ops charges and tax values from one compact control desk before sharing the quotation.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowQuickServiceModal(true)}
                        className="text-xs bg-yellow-400 text-black px-3 py-2 rounded-lg hover:bg-yellow-500 font-medium cursor-pointer"
                      >
                        + Quick Add Service
                      </button>
                    </div>

                    <div className="mt-3 rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-3">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="text"
                              value={contractedRatesSearch}
                              onChange={(e) => setContractedRatesSearch(e.target.value)}
                              placeholder={servicesLoading ? "Loading contracted rates..." : "Search hotel, transport, activity or sightseeing"}
                              disabled={servicesLoading}
                              className="w-full rounded-xl border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-xs text-white outline-none transition-colors focus:border-yellow-500 disabled:cursor-wait disabled:opacity-60"
                            />
                            {(contractedRatesSearch || contractedRatesFilter !== "all") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setContractedRatesSearch("");
                                  setContractedRatesFilter("all");
                                }}
                                className="rounded-xl border border-[#2a2a2a] px-3 py-2 text-[11px] text-slate-300 transition-colors hover:border-yellow-500/50 hover:text-white cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <p className="mt-2 text-[10px] text-slate-500">
                            {servicesLoading
                              ? "Contracted rates are loading in the background..."
                              : filteredServices.length === destinationMatchedServices.length
                              ? `${destinationMatchedServices.length} services available for ${order?.destination || "this destination"}`
                              : `Showing ${filteredServices.length} of ${destinationMatchedServices.length} services for ${order?.destination || "this destination"}`}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {CONTRACTED_RATE_FILTER_OPTIONS.map((option) => {
                            const isActive = contractedRatesFilter === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                disabled={servicesLoading}
                                onClick={() => setContractedRatesFilter(option.value)}
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${isActive
                                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                                  : "border-[#2a2a2a] bg-[#111111] text-slate-300 hover:border-yellow-500/40 hover:text-white"
                                  } disabled:cursor-wait disabled:opacity-60`}
                              >
                                {option.label} ({contractedRateFilterCounts[option.value] || 0})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Service Card */}
                  {servicesLoading ? (
                    <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0b0b0b] px-4 py-8 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-yellow-500/20 border-t-yellow-400" />
                      <p className="mt-3 text-sm font-medium text-white">Loading contracted services</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Quotation Builder is ready. Rates are being fetched in the background.
                      </p>
                    </div>
                  ) : servicesLoadError ? (
                    <div className="rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-white">{servicesLoadError}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Refresh the page or try again in a moment.
                      </p>
                    </div>
                  ) : filteredServices.length > 0 ? (
                    filteredServices.map((service, index) => (
                      <Service
                        key={service.id}
                        index={index}
                        service={service}
                        cardDomId={getServiceCardDomId(service.id)}
                        isEditorFocused={focusedServiceCardId === service.id}
                        isEditMode={editingServiceCardId === service.id}
                        exchangeRates={exchangeRates}
                        allServices={services}
                        toggleService={toggleService}
                        updateField={updateField}
                        deleteService={deleteService}
                        onStartServiceEdit={focusServiceEditor}
                        onOpenSelectedServices={openSelectedServicesModalForService}
                        tripNights={tripNights}
                        remainingHotelNights={getRemainingHotelNights(services, service.id)}
                        hotelNightStart={getHotelNightStart(services, service.id)}
                        tripStartDate={formatDateInput(order?.startDate)}
                        tripEndDate={formatDateInput(order?.endDate)}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0b0b0b] px-4 py-8 text-center">
                      <p className="text-sm font-medium text-white">No contracted services found</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Try another search term or check whether contracted services exist for {order?.destination || "this destination"}.
                      </p>
                    </div>
                  )}
                </motion.div>
                {!isInvoiceRequestedStage && renderSelectedServicesSection()}
              </>

          </motion.div>

          {/*========================= RIGHT SIDE =================================================== */}

          <motion.div variants={sideStackVariants} className="space-y-6">
            {/*=========================== DMC Margin Section ============================= */}
            <motion.div variants={rightCardVariants} className="bg-[#1a1600] border border-yellow-500 rounded-xl p-6">
              {/* Title */}
              <h2 className="font-semibold mb-4 text-start flex items-center gap-2">
                OPS Margin
              </h2>

              {/* Margin Type */}
              <p className="text-sm text-gray-300 mb-1 text-start">
                Margin Type
              </p>

              <select
                value={marginType}
                onChange={(e) => setMarginType(e.target.value)}
                className="w-full bg-black border text-sm mt-1 border-yellow-500 rounded-2xl pl-4 p-2 mb-4 outline-none text-white cursor-pointer"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>

              {/*========================================= Markup Percentage Section ================================ */}

              <p className="text-sm text-gray-300 mb-2 text-start">
                {marginType === "percentage"
                  ? "Markup Percentage"
                  : "Fixed Margin"}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={marginType === "percentage" ? markup : fixedMargin}
                  onChange={(e) =>
                    marginType === "percentage"
                      ? setMarkup(e.target.value)
                      : setFixedMargin(roundCurrencyAmount(e.target.value))
                  }
                  className="w-full bg-black border border-yellow-500 text-sm font-bold rounded-2xl text-start pl-5 p-2 outline-none"
                />

                <span className="text-yellow-400 text-lg">
                  {marginType === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </motion.div>

            {/* ==================================== Price Breakdown Section ============================================ */}

            {!isInvoiceRequestedStage && selectedSendOption === "__price_breakdown_preview__" && (
              <motion.div variants={rightCardVariants} className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-white">Selected Services</h2>
                  <p className="mt-1 max-w-47.5 text-[8px] leading-relaxed text-slate-400">
                    All checked services are listed here for quick edit or delete.
                  </p>
                </div>
                <div className="flex min-w-20 items-center justify-center gap-1 rounded-[28px] border border-yellow-500/40 bg-[#2a2208] px-1 py-1.5 text-center text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="text-[10px] font-semibold leading-none">
                    {selectedServices.length}
                  </span>
                  <span className="text-[10px] font-semibold leading-none">
                    selected
                  </span>
                </div>
              </div>

              {selectedServices.length > 0 ? (
                <div className="dark-scrollbar mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {/*
                 // ─────────────────────────────────────────────────────────────────────────────
// DROP-IN REPLACEMENT for the selectedServices.map(...) block
// inside the "Selected Services" right-panel card in QuotationBuilder.jsx
//
// Replace the existing:
//   {selectedServices.map((service) => { ... })}
// with this block.
// ─────────────────────────────────────────────────────────────────────────────

                  */}
                  {selectedServices.map((service) => {
  const serviceEdits = getSelectedServiceQuotationEdits(service);

  // ── Chip factory — every chip gets identical height + padding ──────────
  const Chip = ({ icon, label, value, accent = "text-slate-300", iconColor = "text-slate-500" }) => (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#212f45] bg-[#0a1018] px-2.5 py-1.25">
      {icon && (
        <span className={`shrink-0 ${iconColor}`} style={{ lineHeight: 0 }}>
          {icon}
        </span>
      )}
      {label && (
        <span className="text-[10px] font-medium text-slate-500 shrink-0">{label}:</span>
      )}
      <span className={`text-[10px] font-semibold leading-none truncate max-w-30 ${accent}`}>
        {value}
      </span>
    </div>
  );

  // ── service-type accent colour ─────────────────────────────────────────
  const typeAccent =
    service.type === "hotel"
      ? { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-200" }
      : service.type === "activity"
        ? { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-200" }
        : service.type === "transfer" || service.type === "car"
          ? { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-200" }
          : { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-200" };

  return (
    <div
      key={`selected-${service.id}`}
      className="rounded-[24px] border border-[#22314a] bg-[#050505] p-3"
    >
      {/* ── inner glass card ── */}
      <div className="rounded-[18px] border border-[#162233] bg-[#08111c] px-3 py-3">

        {/* ── Row 1: icon · title · price ── */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#27436d] bg-[#0b1627]">
            {renderSelectedServiceSummaryIcon(service)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-white">
              {service.title}
            </p>
            {/* sub: city/country */}
            {(service.city || service.country) && (
              <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                {[service.city, service.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 text-right pl-1">
            <p className="text-[12px] font-semibold text-yellow-300 leading-tight whitespace-nowrap">
              {formatCurrencyValue(service.originalTotal || 0, service.currency)}
            </p>
            {service.isForeignCurrency && (
              <p className="mt-0.5 text-[10px] text-sky-300 whitespace-nowrap">
                ₹ {formatAmountValue(service.totalInInr || 0)}
              </p>
            )}
          </div>
        </div>

        {/* ── Row 2: chips strip ── */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">

          {/* Type chip */}
          <div className={`inline-flex items-center rounded-lg border px-2.5 py-[5px] ${typeAccent.bg} ${typeAccent.border}`}>
            <span className={`text-[10px] font-semibold leading-none ${typeAccent.text}`}>
              {getServiceTypeLabel(service.type)}
            </span>
          </div>

          {/* Date chip */}
          {service.serviceDate && (
            <Chip
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              }
              value={formatServiceDateLabel(service.serviceDate)}
            />
          )}

          {/* Hotel: nights */}
          {service.type === "hotel" && Number(service.nights || 0) > 0 && (
            <Chip
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                </svg>
              }
              value={`${service.nights} night${Number(service.nights) > 1 ? "s" : ""}`}
              accent="text-sky-200"
            />
          )}

          {/* Hotel: rooms */}
          {service.type === "hotel" && Number(service.rooms || 0) > 0 && (
            <Chip
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              }
              value={`${service.rooms} room${Number(service.rooms) > 1 ? "s" : ""}`}
            />
          )}

          {/* Hotel: bed type */}
          {service.type === "hotel" && service.bedType && (
            <Chip
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/><path d="M2 20v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><path d="M2 14h20"/><path d="M7 14v2"/><path d="M17 14v2"/>
                </svg>
              }
              value={getBedTypeOptionLabel(service.bedType)}
              accent="text-amber-200"
              iconColor="text-amber-400"
            />
          )}

          {/* Transfer: days */}
          {(service.type === "transfer" || service.type === "car") && Number(service.days || 0) > 0 && (
            <Chip
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              }
              value={`${service.days} day${Number(service.days) > 1 ? "s" : ""}`}
              accent="text-violet-200"
              iconColor="text-violet-400"
            />
          )}

          {/* Activity: pax */}
          {service.type === "activity" && Number(service.pax || 0) > 0 && (
            <Chip
              icon={
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              value={`${service.pax} pax`}
              accent="text-emerald-200"
              iconColor="text-emerald-400"
            />
          )}

          {/* Sightseeing: pax + days */}
          {service.type === "sightseeing" && (
            <>
              {Number(service.pax || 0) > 0 && (
                <Chip
                  icon={
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                  }
                  value={`${service.pax} pax`}
                  accent="text-blue-200"
                  iconColor="text-blue-400"
                />
              )}
              {Number(service.days || 0) > 0 && (
                <Chip
                  icon={
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  }
                  value={`${service.days} day${Number(service.days) > 1 ? "s" : ""}`}
                  accent="text-blue-200"
                  iconColor="text-blue-400"
                />
              )}
            </>
          )}
        </div>

        {/* ── Row 3: Quotation Edits ── */}
        {serviceEdits.length > 0 && (
          <div className="mt-3 rounded-[14px] border border-sky-500/20 bg-[#071420] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                Quotation Edits
              </p>
              <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[7px] font-semibold text-sky-200">
                {serviceEdits.length} update{serviceEdits.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {serviceEdits.map((edit) => {
                const toneClasses =
                  edit.variant === "success"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                    : edit.variant === "warning"
                      ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-100"
                      : edit.variant === "danger"
                        ? "border-red-500/25 bg-red-500/10 text-red-200"
                        : "border-sky-500/20 bg-sky-500/10 text-sky-100";
                const iconClasses =
                  edit.variant === "success"
                    ? "text-emerald-300"
                    : edit.variant === "warning"
                      ? "text-yellow-300"
                      : edit.variant === "danger"
                        ? "text-red-300"
                        : "text-sky-300";

                return (
                  <span
                    key={`${service.id}-${edit.key}-${edit.label}`}
                    className={`inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-[5px] text-[10px] font-medium leading-none ${toneClasses}`}
                  >
                    <CheckCircle2 size={11} className={`shrink-0 ${iconClasses}`} />
                    <span className="font-semibold">{edit.label}</span>
                    <span className="opacity-40">:</span>
                    <span>{edit.value}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="mt-2.5 flex items-center justify-between gap-3 px-0.5">
        <p className="text-[10px] font-medium text-slate-400">Quick Actions</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectedServiceEditAction(service)}
            className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-3.5 py-1.5 text-[11px] font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-500/15 cursor-pointer"
          >
            {editingServiceCardId === service.id ? "Save" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => handleSelectedServiceDelete(service)}
            className="rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-1.5 text-[11px] font-medium text-red-200 transition hover:border-red-300/50 hover:bg-red-500/15 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
})}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#28303d] bg-[#090909] px-4 py-6 text-center">
                  <p className="text-sm font-medium text-white">No services selected yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Pick services from the left panel and they will appear here automatically.
                  </p>
                </div>
              )}
              </motion.div>
            )}

            <motion.div variants={rightCardVariants} className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4 text-sm space-y-4">
              <div className="flex  gap-3">
                <h2 className="font-semibold mb-2">Price Breakdown</h2>

                <button
                  onClick={openOpsChargesPopup}
                  className="text-xs bg-yellow-400 text-black px-3 py-1 rounded-lg hover:bg-yellow-500 font-medium cursor-pointer"
                >
                  + OPS Charges
                </button>
              </div>
              <p className="flex justify-between border-b border-[#232426] ">
                <span className="text-[#90A1B9] mb-2">Selected Items</span>
                <span>{isInvoiceRequestedStage ? 0 : selectedServices.length} items</span>
              </p>
              {/* <p className="flex justify-between">
                <span className="text-[#90A1B9]">Subtotal (Base Rates)</span>
                <span>₹{baseRate}</span>
              </p> */}
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">
                  OPS Markup (
                  {marginType === "percentage"
                    ? `${markup}%`
                    : `₹ ${formatAmountValue(fixedMargin)}`}
                  )
                </span>
                <span className="text-yellow-400">
                  ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : opsMarkup)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">
                  Taxes (GST + TCS + Other)
                </span>
                <span
                  className={`${(isInvoiceRequestedStage ? 0 : appliedTaxTotal) > 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : appliedTaxTotal)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">Services Total</span>
                <span className={`${(isInvoiceRequestedStage ? 0 : servicesTotal) > 0 ? "text-sky-500" : "text-red-400"}`}>₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : servicesTotal)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">Package Template Add-on</span>
                <span className={`${(isInvoiceRequestedStage ? 0 : packageTemplateAmount) > 0 ? "text-emerald-400" : "text-gray-500"}`}>
                  ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : packageTemplateAmount)}
                </span>
              </p>
              {!isInvoiceRequestedStage && shouldShowDualPricing && (
                <div className="rounded-xl border border-[#20262f] bg-black/30 px-3 py-3 text-xs">
                  <p className="font-medium text-slate-200">Foreign Currency Snapshot</p>
                  <div className="mt-2 space-y-2">
                    {foreignCurrencyBreakdown.map((item) => (
                      <div
                        key={item.currency}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#1d2430] bg-[#0a0f16] px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-slate-100">
                            {formatCurrencyValue(item.originalTotal, item.currency)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            1 {item.currency} = ₹ {formatExchangeRateValue(item.exchangeRate)}
                          </p>
                        </div>
                        <span className="text-sky-300">
                          ₹ {formatAmountValue(item.inrTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!isInvoiceRequestedStage && shouldShowDualPricing && (
                <div className="rounded-xl border border-[#20262f] bg-black/30 px-3 py-3 text-xs">
                  <p className="font-medium text-slate-200">FX to ₹</p>
                  <div className="mt-2 space-y-2">
                    {foreignCurrencyBreakdown.map((item) => (
                      <label
                        key={`${item.currency}-fx`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#1d2430] bg-[#0a0f16] px-3 py-2"
                      >
                        <span className="text-slate-300">1 {item.currency}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">=</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={exchangeRates[item.currency] ?? item.exchangeRate}
                            onChange={(e) =>
                              setExchangeRates((prev) => ({
                                ...prev,
                                [item.currency]: Number(e.target.value || 0),
                              }))
                            }
                            className="w-24 rounded-lg border border-[#374151] bg-[#050505] px-2 py-1.5 text-right text-white outline-none focus:border-yellow-400"
                          />
                          <span className="text-slate-400">₹</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-4  border-t border-t-yellow-400 ">
                <span className="mt-1.5">Total Amount</span>
                <span className="text-yellow-400 mt-1.5">
                  ₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : totalAmount)}
                </span>
              </div>
              <p className="flex justify-between text-gray-400">
                <span>Cost per Passenger</span>
                <span>₹ {formatAmountValue(isInvoiceRequestedStage ? 0 : costPerPassenger)}</span>
              </p>
            </motion.div>

            {/*============================================ Buttons Finalize Button ==================================  */}
            <motion.div variants={rightCardVariants} className="hidden">
              {isInvoiceRequestedStage ? (
                <div className="space-y-2 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-3 text-[11px] leading-5 text-sky-100">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex shrink-0 items-center gap-1 text-sky-300">
                      <AlertCircle size={12} strokeWidth={2.4} />
                    </div>
                    <p>Client approval is already received. This booking now continues in the shared amount and documents workflow.</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSendOptions(!showSendOptions)}
                  className="w-full bg-yellow-400 text-black text-md py-2 rounded-xl font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send />
                  Finalize & Send Quote
                </button>
              )}

              {/*======================== POPUp Send To =================================================== */}
              {/* Popup */}
              <div
                style={sendOptionsPanelStyle}
                className={`absolute bottom-full mb-3 right-0 min-w-[320px] backdrop-blur-xl
      bg-linear-to-br from-[#8787875e] to-[#11111113] border border-gray-700/60
      rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50
      transform transition-all duration-300 ease-out origin-bottom-right
      ${!isInvoiceRequestedStage && showSendOptions ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                  }`}
              >
                {/** Header Info */}
                <div className="px-5 py-3 border-b border-gray-700/60">
                  <p className="text-sm text-gray-400">Agent: {order?.agent?.companyName}</p>
                  <p className="text-xs text-gray-500">Email: {order?.agent?.email}</p>
                  <p className="text-xs text-gray-500">
                    Selected Services: {services.filter(s => s.checked).length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total Amount: {"\u20B9"} {formatAmountValue(totalAmount)}
                  </p>
                </div>

                {/** Options */}
                {sendOptions.map((option, idx) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSendOption(option.label)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b
  ${selectedSendOption === option.label ? "bg-yellow-400/20" : "hover:bg-white/5"}`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-yellow-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{option.label}</p>
                        <p className="text-xs text-gray-400">{option.description}</p>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => handleFinalSend()}
                  className="w-full bg-yellow-400 text-black py-2 font-semibold cursor-pointer"
                >
                  Send Now
                </button>
              </div>
            </motion.div>

            {!isInvoiceRequestedStage && renderQuotationWorkspaceButtons(rightCardVariants)}

            {/*============================================ Buttons Finalize Button ==================================  */}
            <motion.div variants={rightCardVariants} className="relative w-full">
              {!isInvoiceRequestedStage && (
                <button
                  onClick={() => setShowSendOptions(!showSendOptions)}
                  className="w-full bg-yellow-400 text-black text-md py-2 rounded-xl font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send />
                  Finalize & Send Quote
                </button>
              )}

              <div
                style={sendOptionsPanelStyle}
                className={`absolute bottom-full mb-3 right-0 min-w-[320px] backdrop-blur-xl
      bg-linear-to-br from-[#8787875e] to-[#11111113] border border-gray-700/60
      rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50
      transform transition-all duration-300 ease-out origin-bottom-right
      ${!isInvoiceRequestedStage && showSendOptions ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                  }`}
              >
                <div className="px-5 py-3 border-b border-gray-700/60">
                  <p className="text-sm text-gray-400">Agent: {order?.agent?.companyName}</p>
                  <p className="text-xs text-gray-500">Email: {order?.agent?.email}</p>
                  <p className="text-xs text-gray-500">
                    Selected Services: {services.filter((s) => s.checked).length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total Amount: {"\u20B9"} {formatAmountValue(totalAmount)}
                  </p>
                </div>

                {sendOptions.map((option, idx) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSendOption(option.label)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b
  ${selectedSendOption === option.label ? "bg-yellow-400/20" : "hover:bg-white/5"}`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-yellow-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{option.label}</p>
                        <p className="text-xs text-gray-400">{option.description}</p>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => handleFinalSend()}
                  className="w-full bg-yellow-400 text-black py-2 font-semibold cursor-pointer"
                >
                  Send Now
                </button>
              </div>
            </motion.div>

            {!isInvoiceRequestedStage && (
              <motion.button
                variants={rightCardVariants}
                type="button"
                onClick={handleSaveDraftQuote}
                disabled={savingDraftQuote}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-2 text-md font-semibold text-gray-600 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FileText size={18} />
                {savingDraftQuote ? "Saving Draft..." : "Save as Draft"}
              </motion.button>
            )}

            {/* Footer Note */}
            {!isInvoiceRequestedStage && (
              <motion.p variants={rightCardVariants} className="text-xs border p-5 rounded-2xl text-[#8EC5FF] bg-[#2B7FFF1A]">
                {`Note: The quotation will be sent to ${order?.agent?.email || "agent email"}. Once the agent uploads the payment receipt, you can track the verification status in the Booking Hub.`}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </motion.section>

      {/*======================== ✅ POPUP Ops Charges =============================================*/}





    {showOpsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/78 p-3 backdrop-blur-[6px] sm:p-4">
          <div className="relative my-auto flex h-[calc(100vh-16px)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-yellow-500/25 bg-[#101010]/95 shadow-[0_28px_120px_rgba(0,0,0,0.65)] animate-slideDown sm:h-[calc(100vh-24px)]">

            {/* ===== HEADER (title + close only) ===== */}
            <div className="relative border-b border-[#2a2a2a] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_38%),linear-gradient(135deg,#171717_0%,#101010_65%,#0b0b0b_100%)] px-5 py-3 sm:px-6">
              <div className="absolute inset-y-0 right-0 w-48 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),_transparent_68%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-300/80">
                    Premium Controls
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                    Charges & Taxation
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                    Tune ops charges and tax values from one compact control desk before sharing the quotation.
                  </p>
                </div>
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ===== STICKY SUMMARY CARDS (won't scroll) ===== */}
            <div className="border-b border-[#1e1e1e] px-5 pt-3 pb-3 sm:px-6">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ops Charges
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-white">
                    ₹ {formatAmountValue(
                      roundCurrencyAmount(Number(draftServiceCharge || 0) + Number(draftHandlingFee || 0)),
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Service + handling setup</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tax Preview
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-white">
                    ₹ {formatAmountValue(draftTaxationTotal)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Live GST, TCS and tourism total</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Quote Validity
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-white">
                    {draftValidTill || "Not set"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Applied to the current quotation</p>
                </div>
              </div>
            </div>

            {/* ===== SCROLLABLE BODY ===== */}
            <div className="dark-scrollbar flex-1 overflow-y-auto px-5 py-3 sm:px-6">

              {/* Two-column layout */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">

                {/* ======= OPS CHARGES ======= */}
                <div className="rounded-[24px] border border-[#2d3238] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-300/75">
                        Classic Desk
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">OPS Charges</h3>
                    </div>
                    <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-medium text-yellow-200">
                      {taxSetupMode === "auto" ? "Auto Ready" : "Manual Setup"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Service Charge
                    </label>
                    <input
                      type="number"
                      value={draftServiceCharge}
                      onChange={(e) => setDraftServiceCharge(roundCurrencyAmount(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[#31363f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-yellow-400 focus:bg-[#111]"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Handling Fee
                    </label>
                    <input
                      type="number"
                      value={draftHandlingFee}
                      onChange={(e) => setDraftHandlingFee(roundCurrencyAmount(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-[#31363f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-yellow-400 focus:bg-[#111]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Valid Till
                    </label>
                    <input
                      type="date"
                      value={draftValidTill}
                      onChange={(e) => setDraftValidTill(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#31363f] bg-[#0d0d0d] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-yellow-400 focus:bg-[#111] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[3] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-xs leading-5 text-slate-400">
                    These charges stay outside the service cards and shape the final commercial quote only.
                  </div>
                </div>

                {/* ======= TAXATION ======= */}
                <div className="rounded-[24px] border border-[#2d3238] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                        Tax Console
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Taxation</h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Auto se default taxes enable ho jayenge, aur manual mode me aap har value edit kar sakte ho.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={applyAutoTaxPreset}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                          taxSetupMode === "auto"
                            ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                            : "border border-[#3a4456] bg-black/20 text-slate-300 hover:border-emerald-400/30 hover:text-emerald-200"
                        }`}
                      >
                        Auto Taxes
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxSetupMode("manual")}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                          taxSetupMode === "manual"
                            ? "border border-yellow-400/40 bg-yellow-500/12 text-yellow-200"
                            : "border border-[#3a4456] bg-black/20 text-slate-300 hover:border-yellow-400/30 hover:text-yellow-200"
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {/* GST */}
                  <div className="mb-3 flex flex-col justify-between rounded-2xl border border-[#31363f] bg-[#171717] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <input
                          type="checkbox"
                          checked={draftGstChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftGstChecked(!draftGstChecked);
                          }}
                        />
                        GST (Goods & Services Tax)
                      </label>
                      <div className="flex shrink-0 items-center gap-2">
                        <input
                          type="number"
                          value={draftGstPercent}
                          onChange={(e) => {
                            setTaxSetupMode("manual");
                            setDraftGstPercent(Number(e.target.value || 0));
                          }}
                          className="w-18 rounded-2xl border border-[#434a57] bg-black px-3 py-2 text-center text-xs text-white outline-none"
                        />
                        <span className="text-blue-400 text-xs">%</span>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-slate-400">
                      <span>GST amount will be calculated from the taxable quotation value.</span>
                      <span className="text-emerald-300">₹ {formatAmountValue(draftGstFinal)}</span>
                    </p>
                  </div>

                  {/* TCS */}
                  <div className="mb-3 flex flex-col justify-between rounded-2xl border border-[#31363f] bg-[#171717] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <input
                          type="checkbox"
                          checked={draftTcsChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftTcsChecked(!draftTcsChecked);
                          }}
                        />
                        TCS (Tax Collected at Source)
                      </label>
                      <div className="flex shrink-0 items-center gap-2">
                        <input
                          type="number"
                          value={draftTcsPercent}
                          onChange={(e) => {
                            setTaxSetupMode("manual");
                            setDraftTcsPercent(Number(e.target.value || 0));
                          }}
                          className="w-18 rounded-2xl border border-[#434a57] bg-black px-3 py-2 text-center text-xs text-white outline-none"
                        />
                        <span className="text-blue-400 text-xs">%</span>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-slate-400">
                      <span>TCS amount will be calculated from the taxable quotation value.</span>
                      <span className="text-emerald-300">₹ {formatAmountValue(draftTcsFinal)}</span>
                    </p>
                  </div>

                  {/* Tourism Fees */}
                  <div className="mb-3 flex flex-col justify-end rounded-2xl border border-[#31363f] bg-[#171717] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <input
                          type="checkbox"
                          checked={draftTourismChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftTourismChecked(!draftTourismChecked);
                          }}
                        />
                        Tourism Development Fee
                      </label>
                      <span className="text-blue-400 text-sm">₹{DEFAULT_TOURISM_AMOUNT}</span>
                    </div>
                    {draftTourismChecked && (
                      <input
                        type="number"
                        value={draftTourismAmount}
                        onChange={(e) => {
                          setTaxSetupMode("manual");
                          setDraftTourismAmount(roundCurrencyAmount(e.target.value || 0));
                        }}
                        className="mt-3 w-full rounded-2xl border border-[#31363f] bg-black px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 outline-none"
                      />
                    )}
                  </div>

                  {/* Total Tax */}
                  <div className="mt-4 flex justify-between rounded-2xl border border-white/6 bg-black/25 px-4 py-3">
                    <span className="text-sm font-medium text-slate-300">Total Tax Amount</span>
                    <span className="text-lg font-semibold text-white">
                      ₹{formatAmountValue(draftTaxationTotal)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* ===== FOOTER BUTTONS ===== */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a2a2a] bg-black/20 px-5 py-3 sm:px-6">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Quote control panel
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="px-4 py-2 text-sm border border-[#404654] rounded-full text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setServiceCharge(roundCurrencyAmount(draftServiceCharge));
                    setHandlingFee(roundCurrencyAmount(draftHandlingFee));
                    setValidTill(draftValidTill);
                    setGstChecked(draftGstChecked);
                    setTcsChecked(draftTcsChecked);
                    setTourismChecked(draftTourismChecked);
                    setGstPercent(draftGstPercent);
                    setTcsPercent(draftTcsPercent);
                    setGstAmount(roundCurrencyAmount(draftGstFinal));
                    setTcsAmount(roundCurrencyAmount(draftTcsFinal));
                    setTourismAmount(roundCurrencyAmount(draftTourismFinal));
                    setAppliedTaxTotal(draftTaxationTotal);
                    setShowOpsPopup(false);
                    setTimeout(() => {
                      toast.success("Charges & taxation applied");
                    }, 200);
                  }}
                  className="px-5 py-2 text-sm bg-yellow-400 text-black rounded-full font-semibold hover:bg-yellow-500 cursor-pointer shadow-[0_12px_30px_rgba(250,204,21,0.18)]"
                >
                  Apply
                </button>
              </div>
            </div>

          </div>
        </div>
      )}








      <AnimatePresence>
        {transportSelectionConfirm.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[71] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-sm rounded-[28px] border border-yellow-400/20 bg-[#111111] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-300/80">
                  Transport Warning
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Confirm this transport service?
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTransportSelectionConfirm({
                    open: false,
                    serviceId: "",
                    serviceTitle: "",
                    passengerCapacity: 0,
                    passengerCount: 0,
                  })
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              This transport service is for{" "}
              <span className="font-semibold text-yellow-300">{transportSelectionConfirm.passengerCapacity} pax</span>,
              while this booking currently has{" "}
              <span className="font-semibold text-white">
                {transportSelectionConfirm.passengerCount} passenger{transportSelectionConfirm.passengerCount === 1 ? "" : "s"}
              </span>.
              Are you sure you want to continue with{" "}
              <span className="font-semibold text-white">{transportSelectionConfirm.serviceTitle}</span>?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setTransportSelectionConfirm({
                    open: false,
                    serviceId: "",
                    serviceTitle: "",
                    passengerCapacity: 0,
                    passengerCount: 0,
                  })
                }
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const pendingServiceId = transportSelectionConfirm.serviceId;
                  setTransportSelectionConfirm({
                    open: false,
                    serviceId: "",
                    serviceTitle: "",
                    passengerCapacity: 0,
                    passengerCount: 0,
                  });
                  if (pendingServiceId) {
                    toggleService(pendingServiceId, true);
                  }
                }}
                className="flex-1 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-500"
              >
                Yes, Continue
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*======================== ✅ POPUP Success final Charges =============================================*/}
      {showFinanceInvoiceConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-yellow-400/20 bg-[#111111] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-300/80">
                  Finance Invoice
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Continue with approved booking?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFinanceInvoiceConfirm(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              This will continue the approved booking flow and notify the agent that the booking is in the amount and documents stage.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowFinanceInvoiceConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                No
              </button>
              <button
                type="button"
                onClick={generateFinalInvoice}
                className="flex-1 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-500"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {successPopup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">

          <div className="bg-[#111] border border-yellow-500/40 rounded-2xl p-6 w-100 text-center shadow-2xl animate-scaleIn">

            {/* ICON */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-black text-3xl">
                ✓
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-xl font-semibold text-white mb-2">
              {successPopup.kind === "invoice"
                ? "Finance Invoice Prepared"
                : successPopup.deliveryWarnings?.length
                  ? "Quotation Saved"
                  : "Quotation Sent Successfully"}
            </h2>

            {/* SUBTEXT */}
            <p className="text-gray-400 text-sm mb-4">
              {successPopup.kind === "invoice"
                ? "The approved quotation has been converted into a finance-ready invoice. Finance team will share the final invoice with the agent."
                : successPopup.deliveryWarnings?.length
                  ? "Your quotation was saved, but one or more selected delivery channels could not be completed."
                  : "Your quotation has been delivered to the agent via selected channels."}
            </p>

            {/* DETAILS */}
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-left text-xs mb-4">
              {successPopup.kind === "invoice" && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Invoice Number</span>
                  <span className="text-white">{successPopup.invoiceNumber || "-"}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-gray-400">Agent</span>
                <span className="text-white">
                  {successPopup.agentName ||
                    order?.agent?.companyName ||
                    order?.agent?.name ||
                    "-"}
                </span>
              </p>

              <p className="flex justify-between mt-1">
                <span className="text-gray-400">Total Amount</span>
                <span className="text-yellow-400">₹ {formatAmountValue(successPopup.totalAmount || 0)}</span>
              </p>

              <p className="flex justify-between mt-1">
                <span className="text-gray-400">Services</span>
                <span className="text-white">{successPopup.serviceCount}</span>
              </p>
            </div>

            {successPopup.kind === "quote" && successPopup.deliveryWarnings?.length > 0 && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Delivery Issue
                </p>
                <p className="mt-1 text-sm text-amber-100">
                  {successPopup.deliveryWarnings[0]}
                </p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setSuccessPopup((prev) => ({ ...prev, open: false }))}
                className="w-full bg-gray-800 text-white py-2 rounded-xl hover:bg-gray-700"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setSuccessPopup((prev) => ({ ...prev, open: false }));
                  navigate(successPopup.kind === "invoice" ? "/ops/bookings-management" : "/ops/dashboard");
                }}
                className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-500"
              >
                {successPopup.kind === "invoice" ? "Go to Booking Hub" : "Go to Dashboard"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {quickActionPopup && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-[60]"
          >
            <div className="min-w-[280px] max-w-[320px] rounded-2xl border border-yellow-500/25 bg-[#111111]/95 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${quickActionPopup.type === "delete"
                    ? "bg-red-500/12 text-red-300"
                    : "bg-emerald-500/12 text-emerald-300"
                    }`}
                >
                  {quickActionPopup.type === "delete" ? (
                    <Trash2 size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {quickActionPopup.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    {quickActionPopup.message}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickAddServiceModal
        showModal={showQuickServiceModal}
        setShowModal={setShowQuickServiceModal}
        addCustomService={addCustomService}
        savingService={savingService}
      />

    </>
  );
};

/*=======================   ====== Select Contracted Rates =======================================*/

/*
  ─────────────────────────────────────────────────────────────
  Service.jsx  —  Drop-in replacement for the <Service> block
  inside QuotationBuilder.jsx

  HOW TO USE:
    1. Delete the old `const Service = ({ ... }) => { ... }` block
       at the bottom of QuotationBuilder.jsx
    2. Paste this entire file's content in its place
       (or import it and use <Service ... /> as before)
  ─────────────────────────────────────────────────────────────
*/

const Service = ({
  index = 0,
  service,
  cardDomId,
  isEditorFocused = false,
  isEditMode = false,
  exchangeRates,
  allServices,
  toggleService,
  updateField,
  deleteService,
  onStartServiceEdit,
  onOpenSelectedServices,
  tripNights,
  remainingHotelNights,
  hotelNightStart,
  tripStartDate,
  tripEndDate,
}) => {
  const isBlackoutService = Boolean(service?.blackout?.isBlackout);
  const blackoutLabel = service?.blackout?.label || service?.blackout?.reason || "Blackout date";
  const canOverrideBlackoutRate = (() => {
    try {
      const values = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key) values.push(window.localStorage.getItem(key));
      }
      const pageRoleText = String(document?.body?.innerText || "").toLowerCase();
      if (pageRoleText.includes("ops manager") || pageRoleText.includes("operation manager")) {
        return true;
      }
      for (const value of values) {
        const parsed = JSON.parse(value || "null");
        const roleText = JSON.stringify(parsed || {}).toLowerCase();
        if (
          roleText.includes("operation_manager") ||
          roleText.includes("operations_manager") ||
          roleText.includes("ops_manager") ||
          roleText.includes("ops manager") ||
          roleText.includes("operation manager") ||
          roleText.includes("\"role\":\"admin\"")
        ) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  })();
  const currencyCode = normalizeCurrencyCode(service.currency);
  const exchangeRate = getExchangeRateForCurrency(currencyCode, exchangeRates);
  const baseRateDisplayValue = getHotelBaseRateDisplayValue(service);
  const total = service.useStoredPricing && Number(service.originalTotal || 0) > 0
    ? roundCurrencyAmount(service.originalTotal)
    : calculateServiceOriginalTotal(service);
  const totalInInr = service.useStoredPricing && Number(service.totalInInr || 0) > 0
    ? roundCurrencyAmount(service.totalInInr)
    : convertAmountToInr(total, currencyCode, exchangeRates);
  const baseRateInInr = convertAmountToInr(baseRateDisplayValue, currencyCode, exchangeRates);
  const isForeignCurrency = currencyCode !== "INR";
  const hotelVariantOptions = useMemo(
    () => getHotelVariantOptions(allServices, service),
    [allServices, service],
  );

  const getHotelStars = (category) => {
    if (!category) return 3;
    const value = category.toString().toLowerCase().trim();
    const match = value.match(/\d/);
    if (match) return Number(match[0]);
    if (value.includes("luxury") || value.includes("premium")) return 5;
    if (value.includes("deluxe")) return 4;
    if (value.includes("standard")) return 3;
    if (value.includes("budget")) return 2;
    return 3;
  };

  const formatUsage = (val) => {
    if (!val) return "";
    return val.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const amenities = (service.desc || "")
    .split(/,|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  /* ── shared micro-styles ── */
  const selectCls =
    "bg-[#0a0a0a] border border-[#2a2a2a] hover:border-yellow-600/50 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer transition-colors focus:border-yellow-500";

  const inputCls =
    "bg-[#0a0a0a] border border-[#2a2a2a] hover:border-yellow-600/50 text-white text-[11px] rounded-lg px-2.5 py-1.5 w-20 outline-none transition-colors focus:border-yellow-500";

  const dateCls =
    "w-full bg-[#111] border border-[#343434] hover:border-yellow-600/60 text-white text-[11px] rounded-lg px-3 py-2.5 pr-9 outline-none transition-colors focus:border-yellow-500 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

  const openDatePicker = (event) => {
    const input = event.currentTarget
      ?.closest?.("[data-date-picker-wrapper='true']")
      ?.querySelector?.("input[type='date']");

    if (!input) return;

    input.focus();
    input.showPicker?.();
    input.click();
  };

  /* helpers for transport */
  const calculateTripDayCountFromDate = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return 1;
    return Math.max(1, Math.ceil((e - s) / 86400000));
  };

  const addDaysToServiceDate = (value, daysToAdd = 0) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return "";
    d.setDate(d.getDate() + Number(daysToAdd));
    return d.toISOString().slice(0, 10);
  };

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const transportStartDate = service.serviceDate || tripStartDate || "";
  const maxTransportDays = Math.max(1, calculateTripDayCountFromDate(transportStartDate, tripEndDate));
  const selectedTransportDays = Math.min(Math.max(Number(service.days || 1), 1), maxTransportDays);
  const transportEndDate =
    transportStartDate && selectedTransportDays > 0
      ? addDaysToServiceDate(transportStartDate, selectedTransportDays - 1)
      : "";
  const transportDateOptions = useMemo(() => {
    if (!tripStartDate) return transportStartDate ? [transportStartDate] : [];

    const availableDateCount = Math.max(1, calculateTripDayCountFromDate(tripStartDate, tripEndDate));
    return Array.from({ length: availableDateCount }, (_, index) => addDaysToServiceDate(tripStartDate, index)).filter(Boolean);
  }, [tripEndDate, tripStartDate, transportStartDate]);

  const getNightOptionLabel = (count) => {
    const startNight = Number(hotelNightStart || 1);
    const totalTripNights = Number(tripNights || 0);
    const endNight = totalTripNights
      ? Math.min(totalTripNights, startNight + count - 1)
      : startNight + count - 1;
    if (!totalTripNights) return `${count} Night${count > 1 ? "s" : ""}`;
    const slotLabel =
      count === 1 || startNight === endNight
        ? `Night ${startNight}`
        : `Night ${startNight}–${endNight}`;
    return `${count} Night${count > 1 ? "s" : ""} (${slotLabel})`;
  };

  const selectedNightCount = Number(service.nights || 0);
  const selectedNightEnd =
    selectedNightCount > 0
      ? Math.min(Number(tripNights || 0), Number(hotelNightStart || 1) + selectedNightCount - 1)
      : 0;

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <motion.div
      id={cardDomId}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={serviceCardVariants}
      className={`scroll-mt-28 mb-3 rounded-2xl border transition-all duration-200 overflow-hidden
        ${isEditorFocused ? "ring-2 ring-sky-400/60 ring-offset-2 ring-offset-black" : ""}
        ${service.checked
          ? "border-yellow-500/50 bg-[#0d0b00]"
          : "border-[#1f1f1f] bg-[#0b0b0b] hover:border-[#2a2a2a]"
        }`}
    >
      {/* ── TOP ACCENT ── */}
      {service.checked && (
        <div className="h-[1.5px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      )}

      {/* ════════════════════════════════════════════
          SECTION 1 — HEADER  (identity + status)
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-4 pb-3">
        <input
          type="checkbox"
          checked={service.checked}
          disabled={isBlackoutService && !canOverrideBlackoutRate}
          onChange={() => toggleService(service.id)}
          className="accent-yellow-400 mt-1 h-3.5 w-3.5 flex-shrink-0 cursor-pointer"
        />

        <div className="min-w-0">
          <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 gap-y-2">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-lg
              ${service.checked ? "border-yellow-500/20 bg-yellow-500/10" : "border-[#222] bg-[#161616]"}`}>
              <span className={service.color || "text-gray-400"}>{service.icon || "Hotel"}</span>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold leading-tight text-white">{service.title}</p>

                {service.checked ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                    Added to Quote
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-600/30 bg-slate-700/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Not Selected
                  </span>
                )}

                {isEditMode && service.checked && (
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-300">
                    Editing
                  </span>
                )}
                {service.custom && (
                  <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                    Custom
                  </span>
                )}
                {service.checked && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditMode) {
                        onOpenSelectedServices?.(service);
                        return;
                      }

                      onStartServiceEdit?.(service);
                    }}
                    className="cursor-pointer rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-500/15"
                  >
                    {isEditMode ? "Review & Save" : "Click to Edit"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <ImLocation2 className="text-emerald-400" />
                  {[service.city, service.country].filter(Boolean).join(", ")}
                </span>
                {service.hotelCategory && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="text-slate-200">Hotel</span>
                    <span className="flex items-center gap-0.5 ml-0.5">
                      {Array.from({ length: getHotelStars(service.hotelCategory) }).map((_, i) => (
                        <IoStarSharp key={i} className="text-yellow-400 text-[9px]" />
                      ))}
                    </span>
                  </span>
                )}
                {service.type === "transfer" && (
                  <>
                    {service.vehicleType && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <FaCarSide className="text-yellow-400" />{service.vehicleType}
                      </span>
                    )}
                    {service.usageType && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <MdOutlineTravelExplore className="text-blue-400" />{formatUsage(service.usageType)}
                      </span>
                    )}
                    {service.passengerCapacity > 0 && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <BsPeople className="text-emerald-400" />{service.passengerCapacity} pax
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {service.checked && (
          <div className="ml-2 flex flex-shrink-0 flex-col items-end text-right">
            <div>
              <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">Total</p>
              <p className="text-[15px] font-semibold leading-none text-white">
                {formatCurrencyValue(total, currencyCode)}
              </p>
              {isForeignCurrency && (
                <p className="mt-1 text-[10px] text-sky-300">
                  INR {formatAmountValue(totalInInr)}
                </p>
              )}
            </div>
          </div>
        )}

        {amenities.length > 0 && (
          <div className="col-start-2 col-span-2 flex w-full flex-wrap justify-start gap-x-1 gap-y-1.5">
            {amenities.map((item, i) => (
              <span key={i} className="whitespace-nowrap rounded-md border border-[#232323] bg-[#141414] px-1.5 py-0.5 text-[10px] text-slate-300">
                {item}
              </span>
            ))}
          </div>
        )}

        {isBlackoutService && (
          <div className="col-start-2 col-span-2 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-semibold leading-5 text-red-200">
            {canOverrideBlackoutRate
              ? `Blackout date: ${blackoutLabel}. Confirm DMC special price, update the rate, then send.`
              : `Contract rate blocked for ${blackoutLabel}. Use manual/special pricing.`}
          </div>
        )}
      </div>


      {/* ════════════════════════════════════════════
          SECTION 3 — SERVICE CONTROLS
          (only shown when service is checked)
      ════════════════════════════════════════════ */}
      {service.checked && (
        <div className="space-y-3 border-t border-[#1a1a1a] bg-[#080800] px-4 py-4">

          {/* ── label row ── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-400/70">
              Configuration
            </p>
            {service.custom && (
              <button
                onClick={() => deleteService(service.id)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1 text-[10px] font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
              >
                <RiDeleteBin6Line className="text-[11px]" /> Remove
              </button>
            )}
          </div>

          {/* ── BASE RATE ── */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Base Rate</p>
              {isEditMode ? (
                <input
                  type="number"
                  min="0"
                  value={baseRateDisplayValue || ""}
                  onChange={(event) => updateField(service.id, "rate", roundCurrencyAmount(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-yellow-500/30 bg-[#080808] px-2 py-1.5 text-[13px] font-semibold text-yellow-400 outline-none transition-colors focus:border-yellow-400"
                />
              ) : (
                <p className="text-[13px] font-semibold text-yellow-400">
                  {formatCurrencyValue(baseRateDisplayValue || 0, currencyCode)}
                </p>
              )}
              {isForeignCurrency && (
                <>
                  <p className="text-[10px] text-sky-300 mt-0.5">
                    ₹ {formatAmountValue(baseRateInInr)}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-lg border border-sky-500/20 bg-sky-500/8 px-2.5 py-1 text-[10px] text-slate-200">
                    1 {currencyCode} = <span className="ml-1 font-medium text-sky-300">₹ {formatExchangeRateValue(exchangeRate)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Service Date</p>
              <div className="relative" data-date-picker-wrapper="true">
                <input
                  type="date"
                  value={service.serviceDate || ""}
                  onChange={(e) => updateField(service.id, "serviceDate", e.target.value)}
                  min={tripStartDate || undefined}
                  max={transportDateOptions[transportDateOptions.length - 1] || tripEndDate || undefined}
                  tabIndex={-1}
                  className={`${dateCls} pointer-events-none w-full`}
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/5 hover:text-white"
                  aria-label="Open service date picker"
                >
                  <CalendarDays size={14} />
                </button>
              </div>
            </div>

            {isForeignCurrency && (
              <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5 flex items-center">
                <p className="text-[11px] text-slate-300">
                  1 {currencyCode} = <span className="text-sky-300 font-medium">₹ {formatExchangeRateValue(exchangeRate)}</span>
                </p>
              </div>
            )}
          </div>

          {/* ── DATE ── */}
          <div className="hidden rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5 max-w-[280px]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Service Date</p>
            <input
              type="date"
              value={service.serviceDate || ""}
              onChange={(e) => updateField(service.id, "serviceDate", e.target.value)}
              min={tripStartDate || undefined}
              max={transportDateOptions[transportDateOptions.length - 1] || tripEndDate || undefined}
              className={dateCls}
            />
          </div>

          {/* ── HOTEL: NIGHTS ── */}
          {service.type === "hotel" && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 space-y-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nights</p>

              {/* availability info */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-[10px] text-emerald-400">
                  {remainingHotelNights} of {tripNights} nights available
                </span>
                {tripNights > 0 && hotelNightStart > 0 && (
                  <span className="text-[10px] text-yellow-300">
                    Slot: Night {hotelNightStart}
                    {remainingHotelNights > 1
                      ? `–${Math.min(tripNights, hotelNightStart + remainingHotelNights - 1)}`
                      : ""}
                  </span>
                )}
                {selectedNightCount > 0 && selectedNightEnd >= hotelNightStart && (
                  <span className="text-[10px] text-sky-300">
                    Assigned: Night {hotelNightStart}
                    {selectedNightEnd > hotelNightStart ? `–${selectedNightEnd}` : ""}
                  </span>
                )}
              </div>

              <select
                value={service.nights || ""}
                onChange={(e) => updateField(service.id, "nights", e.target.value)}
                className={`${selectCls} w-full max-w-[260px]`}
              >
                <option value="">Select nights</option>
                {[...Array(Math.max(remainingHotelNights, 1))].map((_, i) => (
                  <option key={i} value={i + 1}>{getNightOptionLabel(i + 1)}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── TRANSFER: USAGE + DAYS ── */}
          {(service.type === "transfer" || service.type === "car") && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 space-y-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Transfer Setup</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {transportStartDate && (
                  <span className="text-[10px] text-emerald-400">
                    Up to {maxTransportDays} day{maxTransportDays > 1 ? "s" : ""} from selected date
                  </span>
                )}
                {transportStartDate && transportEndDate && (
                  <span className="text-[10px] text-sky-300">
                    {transportStartDate === transportEndDate
                      ? formatDisplayDate(transportStartDate)
                      : `${formatDisplayDate(transportStartDate)} → ${formatDisplayDate(transportEndDate)}`}
                  </span>
                )}
              </div>

              {transportDateOptions.length > 1 && (
                <div>
                  <p className="mb-1.5 text-[9px] text-slate-500">Start Day</p>
                  <div className="flex flex-wrap gap-2">
                    {transportDateOptions.map((dateValue) => {
                      const isActive = dateValue === transportStartDate;
                      return (
                        <button
                          key={dateValue}
                          type="button"
                          onClick={() => updateField(service.id, "serviceDate", dateValue)}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-medium transition ${
                            isActive
                              ? "border-yellow-500/50 bg-yellow-500/12 text-yellow-300"
                              : "border-[#2c2c2c] bg-[#0b0b0b] text-slate-300 hover:border-yellow-500/35 hover:text-white"
                          }`}
                        >
                          {formatDisplayDate(dateValue)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Choose any trip day first, then select `1 Day`, `2 Days`, or more from that date.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-[9px] text-slate-500 mb-1">Usage</p>
                  <select
                    value={normalizeTransportUsageValue(service.usageType) || "point-to-point"}
                    onChange={(e) => updateField(service.id, "usageType", e.target.value)}
                    className={selectCls}
                  >
                    {TRANSPORT_USAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {`${option.label} (${formatCurrencyValue(
                          getTransportUsageOptionDisplayPrice(service, option.value),
                          currencyCode,
                        )})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 mb-1">Days</p>
                  <select
                    value={selectedTransportDays}
                    onChange={(e) => updateField(service.id, "days", Number(e.target.value))}
                    className={selectCls}
                  >
                    {[...Array(maxTransportDays)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} Day{i > 0 ? "s" : ""}
                        {transportStartDate
                          ? ` (${formatDisplayDate(transportStartDate)}${i > 0 ? ` → ${formatDisplayDate(addDaysToServiceDate(transportStartDate, i))}` : ""})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY: PAX ── */}
          {service.type === "activity" && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 flex items-center gap-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">PAX</p>
              <input
                type="number"
                value={service.pax}
                onChange={(e) => updateField(service.id, "pax", Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}

          {/* ── SIGHTSEEING: PAX + DAYS ── */}
          {service.type === "sightseeing" && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-[9px] text-slate-500 mb-1">PAX</p>
                <input
                  type="number"
                  value={service.pax}
                  onChange={(e) => updateField(service.id, "pax", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 mb-1">Days</p>
                <select
                  value={service.days}
                  onChange={(e) => updateField(service.id, "days", Number(e.target.value))}
                  className={selectCls}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} Day{i > 0 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── HOTEL: ROOM + BED INFO ── */}
          {service.type === "hotel" && (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap gap-2">
                {service.roomType && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#141414] px-2.5 py-1 text-[10px] text-slate-300">
                    <LiaHotelSolid className="text-sky-400" />
                    <span className="text-slate-500">Category:</span> {service.roomType}
                  </span>
                )}
                {Number(service.rooms || 0) > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#141414] px-2.5 py-1 text-[10px] text-slate-300">
                    <BsPeople className="text-emerald-400" />
                    <span className="text-slate-500">Rooms:</span> {service.rooms}
                  </span>
                )}
                {service.roomCategory && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#141414] px-2.5 py-1 text-[10px] text-slate-300">
                    <LiaHotelSolid className="text-blue-400" />
                    <span className="text-slate-500">Room Type:</span> {formatRoomOccupancyLabel(service.roomCategory)}
                  </span>
                )}
                {service.bedType && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#141414] px-2.5 py-1 text-[10px] text-slate-300">
                    <MdKingBed className="text-yellow-400" />
                    <span className="text-slate-500">Bed:</span> {getBedTypeOptionLabel(service.bedType)}
                  </span>
                )}
              </div>

              {isEditMode && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Room Category
                    </label>
                    <select
                      value={service.roomType || ""}
                      onChange={(e) => updateField(service.id, "roomType", e.target.value)}
                      className={`${selectCls} w-full`}
                    >
                      <option value="">Select room category</option>
                      {hotelVariantOptions.roomTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Room Type (Occupancy)
                    </label>
                    <select
                      value={service.roomCategory || ""}
                      onChange={(e) => updateField(service.id, "roomCategory", e.target.value)}
                      className={`${selectCls} w-full`}
                    >
                      <option value="">Select room type</option>
                      {hotelVariantOptions.roomCategories.map((option) => (
                        <option key={option} value={option}>
                          {formatRoomOccupancyLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Rooms
                    </label>
                    <select
                      value={Number(service.rooms || 1)}
                      onChange={(e) => updateField(service.id, "rooms", Math.max(1, Number(e.target.value || 1)))}
                      className={`${selectCls} w-full`}
                    >
                      {[...Array(8)].map((_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1} Room{index === 0 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Bed Type
                    </label>
                    <select
                      value={normalizeBedTypeValue(service.bedType) || ""}
                      onChange={(e) => updateField(service.id, "bedType", e.target.value)}
                      className={`${selectCls} w-full`}
                    >
                      <option value="">Select bed type</option>
                      {hotelVariantOptions.bedTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HOTEL: EXTRA PAX CHECKBOXES ── */}
          {service.type === "hotel" && (
            <div className="space-y-2 pt-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Optional Add-ons
              </p>

              {/* A.W.E.B */}
              <AddonRow
                label="A.W.E.B"
                sublabel="Extra adult with extra bed"
                checked={service.extraAdult || false}
                onChange={(v) => updateField(service.id, "extraAdult", v)}
                rate={service.awebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                accentClass="text-yellow-400"
                borderHover="hover:border-yellow-500/30"
              />

              {/* C.W.E.B */}
              <AddonRow
                label="C.W.E.B"
                sublabel="Child with extra bed"
                checked={service.childWithBed || false}
                onChange={(v) => updateField(service.id, "childWithBed", v)}
                rate={service.cwebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                accentClass="text-emerald-400"
                borderHover="hover:border-emerald-500/30"
              />

              {/* C.Wo.E.B */}
              <AddonRow
                label="C.Wo.E.B"
                sublabel="Child without extra bed"
                checked={service.childWithoutBed || false}
                onChange={(v) => updateField(service.id, "childWithoutBed", v)}
                rate={service.cwoebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                accentClass="text-blue-400"
                borderHover="hover:border-blue-500/30"
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────
   AddonRow — small reusable helper for A.W.E.B etc.
───────────────────────────────────────────────── */
const AddonRow = ({
  label,
  sublabel,
  checked,
  onChange,
  rate,
  currencyCode,
  isForeignCurrency,
  exchangeRates,
  accentClass,
  borderHover,
}) => (
  <div className={`rounded-xl border border-[#222] bg-[#141414] px-3 py-2.5 transition-colors ${borderHover}`}>
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-yellow-400 h-3.5 w-3.5"
        />
        <div>
          <p className="text-[11px] font-semibold text-white">{label}</p>
          <p className="text-[9px] text-slate-500">{sublabel}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-[11px] font-semibold ${accentClass}`}>
          {formatCurrencyValue(rate, currencyCode)}
        </p>
        {isForeignCurrency && (
          <p className="text-[10px] text-sky-300">
            ₹ {formatAmountValue(convertAmountToInr(rate, currencyCode, exchangeRates))}
          </p>
        )}
      </div>
    </label>
  </div>
);

export default QuotationBuilder;



