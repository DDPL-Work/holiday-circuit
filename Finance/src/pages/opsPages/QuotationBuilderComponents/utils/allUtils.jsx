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

const INDIAN_DESTINATION_KEYWORDS = [
  "india",
  "delhi",
  "jaipur",
  "udaipur",
  "goa",
  "kerala",
  "kashmir",
  "agra",
  "mumbai",
  "pune",
  "bengaluru",
  "bangalore",
  "chennai",
  "kolkata",
  "hyderabad",
  "shimla",
  "manali",
  "darjeeling",
  "rajasthan",
  "himachal",
  "andaman",
  "sikkim",
  "varanasi",
  "amritsar",
  "rishikesh",
  "ooty",
  "mysore",
  "coorg",
  "nainital",
  "mussoorie",
  "jaisalmer",
  "jodhpur",
  "pushkar",
  "kochi",
  "munnar",
  "alleppey",
  "leh",
  "ladakh",
  "ahmedabad",
  "surat",
  "bhopal",
  "indore",
  "dehradun",
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
  INR: "â‚¹",
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
  String(currency || "INR")
    .trim()
    .toUpperCase() || "INR";

const DESTINATION_ALIAS_GROUPS = [
  [
    "dharamshala",
    "dharamsala",
    "mcleod ganj",
    "mcleodganj",
    "mc leod ganj",
    "mcleodgunj",
  ],
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

const roundCurrencyAmount = (value) => Math.round(Number(value || 0));

const roundExchangeRateValue = (value) => Number(Number(value || 0).toFixed(4));

const getCurrencyLabel = (currency = "INR") =>
  CURRENCY_LABELS[normalizeCurrencyCode(currency)] ||
  normalizeCurrencyCode(currency);

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
  if (children > 0)
    parts.push(`${children} Child${children === 1 ? "" : "ren"}`);
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
    if (Number(service?.rooms || 0) > 0)
      details.push(
        `${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`,
      );
    if (hotelPax > 0) details.push(`${hotelPax} Pax`);
    return details.join(" | ");
  }

  if (normalizedType === "transfer") {
    const usageLabel =
      service?.transportUsageLabel ||
      getSelectedTransportUsageOptionLabels(service)[0];
    const limitLabel = getSelectedTransportUsageLimitLabels(
      service,
      getTransportUsageLimitOptionsForKeys(
        getSelectedTransportUsageOptionKeys(service),
      ),
    )[0];
    if (usageLabel || service?.usageType)
      details.push(usageLabel || String(service.usageType).replace(/-/g, " "));
    if (limitLabel) details.push(limitLabel);
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
  if (Number(service?.passengerCapacity || 0) > 0)
    details.push(`${service.passengerCapacity} Pax`);
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildShareServiceLocationLabel = (service = {}) =>
  [service?.city, service?.country].filter(Boolean).join(", ");

const buildPlainTextQuotationSummary = (quotation = {}) => {
  const dayWiseItineraryText = sanitizeDayWiseItineraryItems(
    quotation?.dayWiseItinerary,
  )
    .filter((item) => item.title || item.description)
    .map((item) => {
      const heading = [item.dayLabel, item.title].filter(Boolean).join(": ");
      return [heading, item.description].filter(Boolean).join("\n");
    })
    .join("\n\n");
  const servicesText =
    Array.isArray(quotation?.services) && quotation.services.length
      ? quotation.services
          .map((service, index) => {
            const serviceLines = [
              `${index + 1}. ${service?.title || "Service"} (${service?.typeLabel || "Travel Service"})`,
              service?.location ? ` Location: ${service.location}` : "",
              service?.serviceDateLabel
                ? ` Date: ${service.serviceDateLabel}`
                : "",
              service?.quantityLabel ? ` Qty: ${service.quantityLabel}` : "",
              service?.description ? ` Notes: ${service.description}` : "",
            ].filter(Boolean);

            return serviceLines.join("\n");
          })
          .join("\n\n")
      : "No service details available.";

  const inclusionsText =
    Array.isArray(quotation?.inclusions) && quotation.inclusions.length
      ? quotation.inclusions
          .map((item, index) => `${index + 1}. ${item}`)
          .join("\n")
      : "None";

  const exclusionsText =
    Array.isArray(quotation?.exclusions) && quotation.exclusions.length
      ? quotation.exclusions
          .map((item, index) => `${index + 1}. ${item}`)
          .join("\n")
      : "None";

  const additionalNotesText =
    Array.isArray(quotation?.additionalNotes) &&
    quotation.additionalNotes.length
      ? quotation.additionalNotes
          .map((item, index) => `${index + 1}. ${item}`)
          .join("\n")
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
  "Welcome to Leela Travels. These Terms & Conditions govern your travel booking and services.",
  "Services include travel planning, packages, transfers (Private & Shared - wait up to 30 mins), hotels & visa assistance.",
  "Booking & Payment: 25% non-refundable advance to confirm. Full payment required 30 days before departure.",
  "Cancellations: 25% (30 days before), 50% (29-16 days), 75% (15-8 days), 100% (within 7 days). Refunds in 15 days.",
  "Changes & Modifications: Administrative/service fees apply for client-requested itinerary changes.",
  "Travel Documents: Passport, visa & health documentation compliance is the client's sole responsibility.",
  "Health & Safety: Medical conditions must be declared in advance; compliance with safety rules is mandatory.",
  "Liability: Leela Travels acts as an intermediary for airlines, hotels & transporters.",
  "Accommodation Policies: Standard check-in 14:00-15:00 Hrs, check-out 11:00-12:00 Hrs.",
  "Travel Insurance: Highly recommended for medical, cancellation & personal loss coverage.",
  "Intellectual Property & Privacy: Personal data is protected and used solely for booking purposes.",
  "Governing Law: All disputes subject to New Delhi Jurisdiction only.",
  "Force Majeure: Not liable for delays/cancellations due to natural disasters, weather, or emergencies.",
  "Contact: Leela Travels, KG 3/101, Vikas Puri, New Delhi | ops@leelatravels.com | +91 8851346665.",
  "By booking with DDLC Company, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
]);

const SHOW_SELECTED_HISTORY_COMPARISON = false;

const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (
    String(value || "")
      .trim()
      .startsWith("+")
  )
    return digits;

  return digits;
};

const parseWhatsAppDate = (value) => {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatWhatsAppDate = (
  value,
  { month = "short", weekday = undefined, includeYear = true } = {},
) => {
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

  const normalizedStart = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const normalizedEnd = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );

  return Math.max(
    0,
    Math.round(
      (normalizedEnd.getTime() - normalizedStart.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
};

const inferSharingLabel = (services = []) => {
  const primaryHotel = services.find(
    (service) => normalizeServiceFilterType(service?.type) === "hotel",
  );

  const rawLabel =
    `${primaryHotel?.bedType || ""} ${primaryHotel?.roomType || ""}`.toLowerCase();

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
  if (children > 0)
    travelers.push(`${children} ${children === 1 ? "Child" : "Children"}`);
  if (infants > 0)
    travelers.push(`${infants} Infant${infants === 1 ? "" : "s"}`);

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

  if (nightLabels.length <= 3) {
    return `${nightLabels.join(", ")} Nights`;
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
  const description = String(service?.description || "")
    .replace(/\s+/g, " ")
    .trim();

  if (description) {
    parts.push(description);
  }

  const roomBits = [];
  if (Number(service?.rooms || 0) > 0) {
    roomBits.push(
      `${service.rooms} ${service?.roomType || " Room"}${Number(service.rooms) > 1 ? "s" : ""}`,
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

  return parts.join(" â€¢ ") || "Stay included";
};

const buildWhatsAppHotelsSection = (quotation = {}) => {
  const hotels = Array.isArray(quotation?.services)
    ? quotation.services
        .filter(
          (service) => normalizeServiceFilterType(service?.type) === "hotel",
        )
        .sort(
          (left, right) =>
            new Date(left?.serviceDate || 0).getTime() -
            new Date(right?.serviceDate || 0).getTime(),
        )
    : [];

  if (!hotels.length) return "";

  const totalPax =
    Number(quotation?.numberOfAdults || 0) +
    Number(quotation?.numberOfChildren || 0) +
    Number(quotation?.numberOfInfants || 0);

  const lines = ["ðŸ¨ *_Hotels_*", WHATSAPP_SECTION_DIVIDER];

  hotels.forEach((hotel) => {
    const checkInDate = hotel?.serviceDate || quotation?.startDate || "";
    const checkOutDate = addDaysForWhatsApp(
      checkInDate,
      Number(hotel?.nights || 1),
    );
    const locationLabel =
      hotel?.city || quotation?.destination || "Destination";
    const hotelTitle = hotel?.hotelCategory
      ? `${hotel.title} (${hotel.hotelCategory})`
      : hotel.title || "Hotel stay";

    lines.push(
      `*${buildWhatsAppNightLabel(checkInDate, hotel?.nights, quotation?.startDate)}* _at_ *${locationLabel}*`,
    );
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
        .filter(
          (service) => normalizeServiceFilterType(service?.type) !== "hotel",
        )
        .sort(
          (left, right) =>
            new Date(left?.serviceDate || 0).getTime() -
            new Date(right?.serviceDate || 0).getTime(),
        )
    : [];

  if (!services.length) return "";

  const groupedServices = services.reduce((accumulator, service) => {
    const serviceDate = service?.serviceDate || "";
    const groupKey =
      normalizeDateInputValue(serviceDate) || String(serviceDate || "undated");

    if (!accumulator[groupKey]) {
      accumulator[groupKey] = [];
    }

    accumulator[groupKey].push(service);
    return accumulator;
  }, {});

  const lines = [
    "ðŸš– *Transportation and Activities*",
    WHATSAPP_SECTION_DIVIDER,
  ];

  Object.entries(groupedServices).forEach(([groupDate, items], index) => {
    const serviceDate = groupDate === "undated" ? "" : groupDate;
    const dayNumber = serviceDate
      ? getWhatsAppDateDiff(quotation?.startDate, serviceDate) + 1
      : index + 1;

    lines.push(
      `*${getOrdinalValue(dayNumber)} Day - ${formatWhatsAppActivityDate(serviceDate)}*`,
    );

    items.forEach((service) => {
      const quantityLabel = service?.quantityLabel
        ? ` _(${service.quantityLabel})_`
        : "";
      const timeLabel =
        service?.pickupTime || service?.time
          ? ` [${service.pickupTime || service.time}]`
          : "";
      const description =
        service?.description &&
        String(service.description).trim().toLowerCase() !==
          String(service.title || "")
            .trim()
            .toLowerCase()
          ? ` - ${service.description}`
          : "";

      lines.push(
        `â€¢ ${service?.title || "Service"}${timeLabel}${description}${quantityLabel}`,
      );
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
  const terms = normalizedItems.length
    ? normalizedItems
    : [...DEFAULT_WHATSAPP_TERMS];

  if (!terms.length) return "";

  return [
    "*_Terms and Conditions_*",
    WHATSAPP_SECTION_DIVIDER,
    ...terms.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
};

const buildWhatsAppDayWiseItinerary = (quotation = {}) => {
  const itinerary = Array.isArray(quotation?.dayWiseItinerary)
    ? quotation.dayWiseItinerary.filter(
        (item) => item?.title || item?.description,
      )
    : [];

  if (!itinerary.length) return "";

  const lines = ["ðŸ—“ï¸ *_Day Wise Itinerary_*", WHATSAPP_SECTION_DIVIDER];

  itinerary.forEach((item, index) => {
    const dayNumber = Number(item?.dayNumber || index + 1);
    const itemDate =
      item?.date || addDaysForWhatsApp(quotation?.startDate, dayNumber - 1);

    lines.push(
      `*${getOrdinalValue(dayNumber)} Day - ${formatWhatsAppItineraryDate(itemDate)}*`,
    );
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

  return lines
    .join("\n")
    .replace(/\n+\s*----------\s*$/, "")
    .trim();
};

const buildWhatsAppQuotationMessage = (quotation = {}) => {
  const totalPax =
    Number(quotation?.numberOfAdults || 0) +
    Number(quotation?.numberOfChildren || 0) +
    Number(quotation?.numberOfInfants || 0);
  const totalAmount = Math.round(Number(quotation?.totalAmount || 0));
  const perPersonAmount = totalPax > 0 ? Math.round(totalAmount / totalPax) : 0;
  const destinationLabel = quotation?.destination
    ? `${quotation.destination} Trip`
    : "Trip";
  const notes = Array.isArray(quotation?.additionalNotes)
    ? quotation.additionalNotes
    : [];
  const inclusions = Array.isArray(quotation?.inclusions)
    ? quotation.inclusions
    : [];
  const exclusions = Array.isArray(quotation?.exclusions)
    ? quotation.exclusions
    : [];
  const recipientName =
    quotation?.recipientName || quotation?.recipientCompanyName || "Partner";
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
    `â€¢ *${formatWhatsAppDate(quotation?.startDate || "")}* _for_ *${quotation?.tripNights || 0} Nights,
  ${quotation?.tripDays || 0} Days*`,
    `â€¢ *${buildWhatsAppTravelerSummary(quotation)}*`,
    "",
    "*Price (INR):*",
    perPersonAmount > 0
      ? `â€¢ *${formatAmountValue(perPersonAmount)} / Person (${inferSharingLabel(quotation?.services || [])})* x ${totalPax}
  Pax`
      : "â€¢ Price on request",
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
    lines.push(
      "_*NOTE*: Anything not mentioned in the inclusions is excluded_",
    );
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

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const sanitizeDynamicListItems = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) =>
          String(item || "")
            .replace(/\s+/g, " ")
            .trim(),
        )
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
  })} ${getOrdinalValue(parsed.getDate())} ${parsed.toLocaleDateString(
    "en-GB",
    {
      month: "short",
    },
  )}`;
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
          dayLabel: String(
            item?.dayLabel || buildItineraryDayLabel(dayNumber, date),
          ).trim(),
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

const reconcileDayWiseItineraryItems = (
  items = [],
  totalDays = 0,
  startDate = "",
) => {
  const normalizedItems = sanitizeDayWiseItineraryItems(items);
  const itemsByDay = new Map(
    normalizedItems.map((item, index) => [
      Math.max(1, Number(item?.dayNumber || index + 1)),
      item,
    ]),
  );
  const fallbackCount = normalizedItems.reduce(
    (maxCount, item, index) =>
      Math.max(maxCount, Number(item?.dayNumber || index + 1)),
    0,
  );
  const resolvedDayCount = Math.max(Number(totalDays || 0), fallbackCount);

  if (!resolvedDayCount) {
    return normalizedItems;
  }

  return Array.from({ length: resolvedDayCount }, (_, index) => {
    const dayNumber = index + 1;
    const existingItem = itemsByDay.get(dayNumber) || {};
    const date = startDate
      ? addDaysToNormalizedDate(startDate, index)
      : String(existingItem?.date || "");

    return {
      dayNumber,
      dayLabel: buildItineraryDayLabel(
        dayNumber,
        date || existingItem?.date || "",
      ),
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
  const browserOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
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
    .map(
      (service, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeWordHtml(service.title || "Service")}</td>
      <td>${escapeWordHtml(service.typeLabel || "Service")}</td>
      <td>${escapeWordHtml(service.location || "-")}</td>
      <td>${escapeWordHtml(service.serviceDateLabel || "-")}</td>
      <td>${escapeWordHtml(service.quantityLabel || "-")}</td>
      <td>${escapeWordHtml(service.description || "-")}</td>
    </tr>
  `,
    )
    .join("");

  const itineraryMarkup = (quotation.dayWiseItinerary || [])
    .map(
      (item) => `
    <div class="block">
      <h4>${escapeWordHtml(item.heading || item.dayLabel || "Day Plan")}</h4>
      <p>${escapeWordHtml(item.description || "-")}</p>
    </div>
  `,
    )
    .join("");

  const listMarkup = (items = []) =>
    items.length
      ? `<ul>${items.map((item) => `<li>${escapeWordHtml(item)}</li>`).join("")}</ul>`
      : `<p class="muted">Not specified</p>`;

  const normalizedTerms =
    Array.isArray(quotation.termsAndConditions) &&
    quotation.termsAndConditions.length
      ? quotation.termsAndConditions
      : [...DEFAULT_WHATSAPP_TERMS];

  const bankMarkup = (quotation.sellerBankDetails || [])
    .map(
      (item) => `
    <tr>
      <td>${escapeWordHtml(item.label || "")}</td>
      <td>${escapeWordHtml(item.value || "-")}</td>
    </tr>
  `,
    )
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
  {
    value: "one-way-airport-transfer",
    usageType: "point-to-point",
    label: "One Way / Airport Transfer",
    price: 2500,
  },
  {
    value: "inter-hotel-transfer",
    usageType: "point-to-point",
    label: "Inter Hotel Transfer",
    price: 2200,
  },
  { value: "full-day", usageType: "full-day", label: "Full Day", price: 7000 },
  { value: "half-day", usageType: "half-day", label: "Half Day", price: 4000 },
]);

const TRANSPORT_USAGE_LIMIT_OPTIONS = Object.freeze({
  "full-day": [
    { value: "full-day-80-km", label: "80 km" },
    { value: "full-day-8-hours", label: "8 hours" },
  ],
  "half-day": [
    { value: "half-day-40-km", label: "40 km" },
    { value: "half-day-4-hours", label: "4 hours" },
  ],
});

const TRANSPORT_USAGE_FIXED_PRICES = Object.freeze(
  TRANSPORT_USAGE_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.value] = option.price;
    if (!accumulator[option.usageType]) {
      accumulator[option.usageType] = option.price;
    }
    return accumulator;
  }, {}),
);

const TRANSPORT_USAGE_OPTION_LABELS = Object.freeze(
  TRANSPORT_USAGE_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.value] = option.label;
    return accumulator;
  }, {}),
);

const normalizeServiceFilterType = (type = "") => {
  const normalizedType = String(type || "")
    .toLowerCase()
    .trim();
  if (normalizedType === "car" || normalizedType === "transport") {
    return "transfer";
  }

  return normalizedType;
};

const normalizeBedTypeValue = (value = "") => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

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
  if (
    normalizedValue.includes("rollaway") ||
    normalizedValue.includes("extra bed")
  ) {
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
  HOTEL_BED_TYPE_OPTIONS.find(
    (option) => option.value === normalizeBedTypeValue(value),
  )?.label || formatHotelOptionLabel(String(value || "").replace(/-/g, " "));

const formatHotelOptionLabel = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());


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
      buildHotelVariantGroupKey(candidate) ===
        buildHotelVariantGroupKey(service),
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
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeHotelRoomTypeLookupKey = (value = "") => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

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
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalizedValue) return "";
  if (TRANSPORT_USAGE_FIXED_PRICES[normalizedValue]) {
    return normalizedValue;
  }
  if (
    normalizedValue.includes("round") ||
    normalizedValue.includes("two way")
  ) {
    return "round-trip";
  }
  if (
    normalizedValue.includes("one-way") ||
    normalizedValue.includes("one way") ||
    normalizedValue.includes("airport")
  ) {
    return "point-to-point";
  }
  if (
    normalizedValue.includes("inter hotel") ||
    normalizedValue.includes("inter-hotel")
  ) {
    return "point-to-point";
  }
  if (normalizedValue.includes("full")) {
    return "full-day";
  }
  if (normalizedValue.includes("half")) {
    return "half-day";
  }
  if (
    normalizedValue.includes("point") ||
    normalizedValue.includes("one way")
  ) {
    return "point-to-point";
  }

  return normalizedValue;
};

const normalizeTransportUsageOptionKey = (value = "") => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalizedValue) return "";
  if (
    normalizedValue.includes("one way") ||
    normalizedValue.includes("airport") ||
    normalizedValue.includes("one-way")
  ) {
    return "one-way-airport-transfer";
  }
  if (
    normalizedValue.includes("inter hotel") ||
    normalizedValue.includes("inter-hotel")
  ) {
    return "inter-hotel-transfer";
  }
  if (
    normalizedValue.includes("full day") ||
    normalizedValue.includes("full-day") ||
    normalizedValue === "full-day"
  ) {
    return "full-day";
  }
  if (
    normalizedValue.includes("half day") ||
    normalizedValue.includes("half-day") ||
    normalizedValue === "half-day"
  ) {
    return "half-day";
  }
  if (
    normalizedValue.includes("point") ||
    normalizedValue === "point-to-point"
  ) {
    return "one-way-airport-transfer";
  }
  return "";
};

const getTransportUsageOptionMeta = (value = "") => {
  const normalizedKey =
    normalizeTransportUsageOptionKey(value) || "one-way-airport-transfer";
  return (
    TRANSPORT_USAGE_OPTIONS.find((option) => option.value === normalizedKey) ||
    TRANSPORT_USAGE_OPTIONS[0]
  );
};

const getTransportUsageOptionKey = (service = {}) => {
  const explicitKey = normalizeTransportUsageOptionKey(
    service?.transportUsageOptionKey,
  );
  if (explicitKey) return explicitKey;

  const text = [
    service?.transportUsageLabel,
    service?.title,
    service?.serviceName,
    service?.description,
    service?.desc,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    normalizeTransportUsageOptionKey(text) ||
    normalizeTransportUsageOptionKey(service?.usageType) ||
    "one-way-airport-transfer"
  );
};

const getSelectedTransportUsageOptionKeys = (service = {}) =>
  [getTransportUsageOptionKey(service)].filter(Boolean);

const getSelectedTransportUsageOptionLabels = (service = {}) =>
  getSelectedTransportUsageOptionKeys(service)
    .map(
      (key) =>
        TRANSPORT_USAGE_OPTION_LABELS[key] ||
        getTransportUsageOptionMeta(key).label,
    )
    .filter(Boolean);

const getTransportUsageLimitOptionsForKeys = (usageKeys = []) =>
  usageKeys.flatMap((key) => TRANSPORT_USAGE_LIMIT_OPTIONS[key] || []);

const getDefaultTransportUsageLimitKeyValue = () => "";

const getSelectedTransportUsageLimitLabels = (...args) => {
  const availableLimitOptions = Array.isArray(args[1])
    ? args[1]
    : Array.isArray(args[0])
      ? args[0]
      : [];
  if (!availableLimitOptions.length) return [];
  return [
    availableLimitOptions
      .map((option) => option.label)
      .filter(Boolean)
      .join(" / "),
  ].filter(Boolean);
};

const getTransportUsageLimitText = (usageKey = "", separator = " / ") =>
  getTransportUsageLimitOptionsForKeys([usageKey])
    .map((option) => option.label)
    .join(separator);

const stripTransportUsageSuffix = (title = "") => {
  let nextTitle = String(title || "").trim();
  const suffixes = TRANSPORT_USAGE_OPTIONS.flatMap((option) => {
    const limitText = getTransportUsageLimitText(option.value);
    return [
      option.label,
      limitText ? `${option.label} - ${limitText}` : "",
      limitText ? `${option.label} ${limitText}` : "",
    ].filter(Boolean);
  });

  suffixes
    .sort((left, right) => right.length - left.length)
    .forEach((suffix) => {
      const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      nextTitle = nextTitle
        .replace(new RegExp(`\\s*-\\s*${escapedSuffix}\\s*$`, "i"), "")
        .trim();
    });

  return nextTitle || String(title || "").trim();
};

const getFixedHotelRoomTypePrice = (roomType = "") =>
  HOTEL_ROOM_TYPE_FIXED_PRICES[normalizeHotelRoomTypeLookupKey(roomType)] || 0;

const inferHotelRoomTypeValue = (service = {}) => {
  const explicitRoomType = String(service?.roomType || "").trim();
  if (explicitRoomType) {
    return (
      HOTEL_ROOM_TYPE_OPTIONS.find(
        (option) =>
          normalizeHotelRoomTypeLookupKey(option) ===
          normalizeHotelRoomTypeLookupKey(explicitRoomType),
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
  const explicitRate = Number(
    fallbackRate ?? service?.rate ?? service?.price ?? 0,
  );
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

const normalizeDateOnlyString = (value) => {
  if (!value) return "";
  const text = String(value || "").trim();
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const isDateInRange = (targetDate, fromVal, toVal) => {
  if (!targetDate || !fromVal || !toVal) return false;
  const target = normalizeDateOnlyString(targetDate);
  const from = normalizeDateOnlyString(fromVal);
  const to = normalizeDateOnlyString(toVal);
  if (!target || !from || !to) return false;
  return target >= from && target <= to;
};

const checkBlackoutMatch = (blackoutDates = [], targetDate = "") => {
  if (!targetDate || !Array.isArray(blackoutDates) || !blackoutDates.length)
    return null;
  const target = normalizeDateOnlyString(targetDate);
  if (!target) return null;
  return (
    blackoutDates.find((b) => {
      const bStart = normalizeDateOnlyString(
        b.startDate || b.startDateKey || b.rawPeriod,
      );
      const bEnd = normalizeDateOnlyString(
        b.endDate || b.endDateKey || b.startDate || b.startDateKey,
      );
      if (!bStart || !bEnd) return false;
      return target >= bStart && target <= bEnd;
    }) || null
  );
};

const resolveSmartSeasonAndBlackoutPrice = (
  basePrice = 0,
  seasons = [],
  blackoutDates = [],
  targetDate = "",
) => {
  const defaultRate = Number(basePrice || 0);
  const matchedBlackout = checkBlackoutMatch(blackoutDates, targetDate);

  if (!targetDate || !Array.isArray(seasons) || !seasons.length) {
    return {
      rate: defaultRate,
      tier: matchedBlackout ? "Blackout (Base Rate)" : "Base Rate",
      seasonName: null,
      isBlackout: Boolean(matchedBlackout),
      blackoutLabel: matchedBlackout
        ? matchedBlackout.blackoutName ||
          matchedBlackout.occasion ||
          "Blackout Event"
        : "",
      appliedPricingType: "base",
    };
  }

  const matchedSeason = seasons.find((s) =>
    isDateInRange(targetDate, s.validFrom, s.validTo),
  );

  if (matchedSeason) {
    const sName = String(matchedSeason.seasonName || "Season").toUpperCase();
    const sNormalPrice = Number(matchedSeason.price || 0);
    const sBlackoutPrice = Number(matchedSeason.blackoutPrice || 0);

    if (matchedBlackout) {
      const effectiveBlackoutRate =
        sBlackoutPrice > 0
          ? sBlackoutPrice
          : sNormalPrice > 0
            ? sNormalPrice
            : defaultRate;
      return {
        rate: effectiveBlackoutRate,
        tier: `${sName} Blackout`,
        seasonName: sName,
        isBlackout: true,
        blackoutLabel:
          matchedBlackout.blackoutName ||
          matchedBlackout.occasion ||
          `${sName} Blackout Event`,
        appliedPricingType: "season_blackout",
      };
    }

    const effectiveSeasonRate = sNormalPrice > 0 ? sNormalPrice : defaultRate;
    return {
      rate: effectiveSeasonRate,
      tier: `${sName} Rate`,
      seasonName: sName,
      isBlackout: false,
      blackoutLabel: "",
      appliedPricingType: "season_normal",
    };
  }

  if (matchedBlackout) {
    return {
      rate: defaultRate,
      tier: "Blackout (Standard Rate)",
      seasonName: null,
      isBlackout: true,
      blackoutLabel:
        matchedBlackout.blackoutName ||
        matchedBlackout.occasion ||
        "Blackout Event",
      appliedPricingType: "base_blackout",
    };
  }

  return {
    rate: defaultRate,
    tier: "Standard Rate",
    seasonName: null,
    isBlackout: false,
    blackoutLabel: "",
    appliedPricingType: "base",
  };
};

const resolveHotelSmartRate = (service = {}, targetDate = "") => {
  const hotelsList = Array.isArray(service.hotels) ? service.hotels : [];
  const selectedHotel =
    hotelsList.find((h) => h.hotelName === service.hotelName) ||
    hotelsList[0] ||
    {};
  const roomsList = Array.isArray(selectedHotel.rooms)
    ? selectedHotel.rooms
    : [];
  const matchedRoom =
    roomsList.find(
      (r) =>
        normalizeComparisonTextValue(r.roomType) ===
          normalizeComparisonTextValue(service.roomType) &&
        normalizeComparisonTextValue(r.roomCategory) ===
          normalizeComparisonTextValue(service.roomCategory),
    ) ||
    roomsList.find(
      (r) =>
        normalizeComparisonTextValue(r.roomType) ===
        normalizeComparisonTextValue(service.roomType),
    ) ||
    roomsList.find(
      (r) =>
        normalizeComparisonTextValue(r.roomCategory) ===
        normalizeComparisonTextValue(service.roomCategory),
    ) ||
    roomsList[0] ||
    {};

  const basePrice =
    matchedRoom.price !== undefined
      ? Number(matchedRoom.price)
      : Number(service.price || service.rate || 0);
  const seasons = Array.isArray(matchedRoom.seasons) ? matchedRoom.seasons : [];
  const blackoutDates = Array.isArray(service.blackoutDates)
    ? service.blackoutDates
    : [];

  return resolveSmartSeasonAndBlackoutPrice(
    basePrice,
    seasons,
    blackoutDates,
    targetDate,
  );
};

const resolveTransportSmartRate = (service = {}, targetDate = "") => {
  const vehiclesList = Array.isArray(service.vehicles) ? service.vehicles : [];
  const selectedVehicle =
    vehiclesList.find(
      (v) =>
        normalizeComparisonTextValue(v.vehicleType) ===
        normalizeComparisonTextValue(service.vehicleType),
    ) ||
    vehiclesList[0] ||
    {};
  const pointToPoint = selectedVehicle.usageTypes?.pointToPoint || [];
  const hourly = selectedVehicle.usageTypes?.hourly || [];
  const allOptions = [...pointToPoint, ...hourly];

  const usageKey =
    service.transportUsageOptionKey || "one-way-airport-transfer";
  let matchedOption = null;
  if (usageKey === "one-way-airport-transfer") {
    matchedOption =
      pointToPoint.find((p) =>
        /one\s*way|airport/i.test(p.name || p.usageType || ""),
      ) || pointToPoint[0];
  } else if (usageKey === "inter-hotel-transfer") {
    matchedOption =
      pointToPoint.find((p) =>
        /inter\s*hotel/i.test(p.name || p.usageType || ""),
      ) || pointToPoint[1];
  } else if (usageKey === "full-day") {
    matchedOption =
      hourly.find((h) => /full/i.test(h.name || h.usageType || "")) ||
      hourly[0];
  } else if (usageKey === "half-day") {
    matchedOption =
      hourly.find((h) => /half/i.test(h.name || h.usageType || "")) ||
      hourly[1];
  }
  if (!matchedOption) {
    matchedOption = allOptions[0] || {};
  }

  const basePrice =
    matchedOption.price !== undefined
      ? Number(matchedOption.price)
      : Number(service.price || service.rate || 0);
  const seasons = Array.isArray(matchedOption.seasons)
    ? matchedOption.seasons
    : [];
  const blackoutDates = Array.isArray(service.blackoutDates)
    ? service.blackoutDates
    : [];

  return resolveSmartSeasonAndBlackoutPrice(
    basePrice,
    seasons,
    blackoutDates,
    targetDate,
  );
};

const resolveActivitySmartRate = (
  service = {},
  targetDate = "",
  tourTypeName = "",
) => {
  const tourList = Array.isArray(service.tourTypes) ? service.tourTypes : [];
  const selectedTour =
    tourList.find((t) => t.tourType === (tourTypeName || service.tourType)) ||
    tourList[0] ||
    {};
  const basePrice =
    selectedTour.adultPrice !== undefined
      ? Number(selectedTour.adultPrice)
      : selectedTour.price !== undefined
        ? Number(selectedTour.price)
        : Number(service.price || service.rate || 0);
  const childPrice =
    selectedTour.childPrice !== undefined
      ? Number(selectedTour.childPrice)
      : Number(service.childPrice || 0);
  const seasons = Array.isArray(selectedTour.seasons)
    ? selectedTour.seasons
    : [];
  const blackoutDates = Array.isArray(service.blackoutDates)
    ? service.blackoutDates
    : [];

  const smartAdult = resolveSmartSeasonAndBlackoutPrice(
    basePrice,
    seasons,
    blackoutDates,
    targetDate,
  );
  const matchedSeason = seasons.find((s) =>
    isDateInRange(targetDate, s.validFrom, s.validTo),
  );
  const matchedBlackout = checkBlackoutMatch(blackoutDates, targetDate);
  let resolvedChildPrice = childPrice;
  if (matchedSeason) {
    if (matchedBlackout && matchedSeason.childBlackoutPrice > 0) {
      resolvedChildPrice = matchedSeason.childBlackoutPrice;
    } else if (matchedSeason.childPrice > 0) {
      resolvedChildPrice = matchedSeason.childPrice;
    }
  }

  return {
    ...smartAdult,
    adultPrice: smartAdult.rate,
    childPrice: resolvedChildPrice,
  };
};

const getTransportVehicleUsagePrices = (
  vehicle = {},
  service = {},
  targetDate = "",
) => {
  const pointToPoint = vehicle?.usageTypes?.pointToPoint || [];
  const hourly = vehicle?.usageTypes?.hourly || [];
  const dateToUse = targetDate || service?.serviceDate || "";
  const blackoutDates = Array.isArray(service?.blackoutDates)
    ? service.blackoutDates
    : [];

  const oneWay =
    pointToPoint.find(
      (p) =>
        String(p.name || p.usageType || "")
          .toLowerCase()
          .includes("one way") ||
        String(p.name || "")
          .toLowerCase()
          .includes("airport"),
    ) || pointToPoint[0];

  const interHotel =
    pointToPoint.find(
      (p) =>
        String(p.name || p.usageType || "")
          .toLowerCase()
          .includes("inter hotel") ||
        String(p.name || "")
          .toLowerCase()
          .includes("inter-hotel"),
    ) || pointToPoint[1];

  const fullDay =
    hourly.find((h) =>
      String(h.name || h.usageType || "")
        .toLowerCase()
        .includes("full"),
    ) || hourly[0];

  const halfDay =
    hourly.find((h) =>
      String(h.name || h.usageType || "")
        .toLowerCase()
        .includes("half"),
    ) || hourly[1];

  const defaultPrice = Number(service?.price || service?.rate || 0);

  const oneWayBase = Number(
    oneWay?.price !== undefined ? oneWay.price : defaultPrice,
  );
  const interHotelBase = Number(
    interHotel?.price !== undefined ? interHotel.price : defaultPrice,
  );
  const fullDayBase = Number(
    fullDay?.price !== undefined ? fullDay.price : defaultPrice,
  );
  const halfDayBase = Number(
    halfDay?.price !== undefined ? halfDay.price : defaultPrice,
  );

  const oneWaySmart = resolveSmartSeasonAndBlackoutPrice(
    oneWayBase,
    oneWay?.seasons,
    blackoutDates,
    dateToUse,
  );
  const interHotelSmart = resolveSmartSeasonAndBlackoutPrice(
    interHotelBase,
    interHotel?.seasons,
    blackoutDates,
    dateToUse,
  );
  const fullDaySmart = resolveSmartSeasonAndBlackoutPrice(
    fullDayBase,
    fullDay?.seasons,
    blackoutDates,
    dateToUse,
  );
  const halfDaySmart = resolveSmartSeasonAndBlackoutPrice(
    halfDayBase,
    halfDay?.seasons,
    blackoutDates,
    dateToUse,
  );

  const fullDayExtraPerKmRate = Number(
    fullDay?.extraPerKmRate !== undefined
      ? fullDay.extraPerKmRate
      : service?.fullDayExtraPerKmRate || 0,
  );
  const halfDayExtraPerKmRate = Number(
    halfDay?.extraPerKmRate !== undefined
      ? halfDay.extraPerKmRate
      : service?.halfDayExtraPerKmRate || 0,
  );

  return {
    "one-way-airport-transfer": oneWaySmart.rate,
    "inter-hotel-transfer": interHotelSmart.rate,
    "full-day": fullDaySmart.rate,
    "half-day": halfDaySmart.rate,
    fullDayExtraPerKmRate,
    halfDayExtraPerKmRate,
    oneWayTier: oneWaySmart.tier,
    interHotelTier: interHotelSmart.tier,
    fullDayTier: fullDaySmart.tier,
    halfDayTier: halfDaySmart.tier,
  };
};

const resolveTransportVehicleSelection = (
  services = [],
  service = {},
  nextVehicleType = "",
  targetDate = "",
) => {
  const vehiclesList =
    Array.isArray(service.vehicles) && service.vehicles.length > 0
      ? service.vehicles
      : [];
  let matchedVehicle =
    vehiclesList.find(
      (v) =>
        normalizeComparisonTextValue(v.vehicleType) ===
        normalizeComparisonTextValue(nextVehicleType),
    ) ||
    vehiclesList.find((v) =>
      String(v.vehicleType || "")
        .toLowerCase()
        .includes(String(nextVehicleType || "").toLowerCase()),
    );

  if (!matchedVehicle && Array.isArray(services)) {
    const siblingTransfer = services.find(
      (s) =>
        normalizeServiceFilterType(s.type) === "transfer" &&
        (normalizeComparisonTextValue(s.serviceName || s.title) ===
          normalizeComparisonTextValue(service.serviceName || service.title) ||
          normalizeComparisonTextValue(s.city) ===
            normalizeComparisonTextValue(service.city)) &&
        Array.isArray(s.vehicles) &&
        s.vehicles.some(
          (v) =>
            normalizeComparisonTextValue(v.vehicleType) ===
            normalizeComparisonTextValue(nextVehicleType),
        ),
    );
    if (siblingTransfer) {
      matchedVehicle = siblingTransfer.vehicles.find(
        (v) =>
          normalizeComparisonTextValue(v.vehicleType) ===
          normalizeComparisonTextValue(nextVehicleType),
      );
    }
  }

  const dateToUse = targetDate || service.serviceDate || "";
  const usagePrices = getTransportVehicleUsagePrices(
    matchedVehicle || {},
    service,
    dateToUse,
  );
  const currentUsageKey =
    getTransportUsageOptionKey(service) || "one-way-airport-transfer";
  const nextPrice =
    usagePrices[currentUsageKey] !== undefined
      ? Number(usagePrices[currentUsageKey])
      : Number(service.price || service.rate || 0);

  const nextPassengerCapacity =
    matchedVehicle?.passengerCapacity !== undefined
      ? Number(matchedVehicle.passengerCapacity)
      : service.passengerCapacity || 4;

  const nextLuggageCapacity =
    matchedVehicle?.luggageCapacity !== undefined
      ? Number(matchedVehicle.luggageCapacity)
      : service.luggageCapacity || 2;

  const nextDescription =
    matchedVehicle?.description || service.description || "";
  const tierKey =
    currentUsageKey === "full-day"
      ? usagePrices.fullDayTier
      : currentUsageKey === "half-day"
        ? usagePrices.halfDayTier
        : currentUsageKey === "inter-hotel-transfer"
          ? usagePrices.interHotelTier
          : usagePrices.oneWayTier;

  return {
    ...service,
    vehicleType:
      matchedVehicle?.vehicleType || nextVehicleType || service.vehicleType,
    passengerCapacity: nextPassengerCapacity,
    luggageCapacity: nextLuggageCapacity,
    description: nextDescription,
    transportUsagePrices: usagePrices,
    fullDayExtraPerKmRate: usagePrices.fullDayExtraPerKmRate,
    halfDayExtraPerKmRate: usagePrices.halfDayExtraPerKmRate,
    rate: nextPrice,
    price: nextPrice,
    quoteBaseRate: nextPrice,
    pricingTier: tierKey || "Standard Rate",
    extraPerKmRate:
      currentUsageKey === "full-day"
        ? usagePrices.fullDayExtraPerKmRate
        : currentUsageKey === "half-day"
          ? usagePrices.halfDayExtraPerKmRate
          : 0,
    useStoredPricing: false,
    manualRateOverride: true,
  };
};

const getTransportUsageOptionDisplayPrice = (service = {}, usageType = "") => {
  const selectedOption = getTransportUsageOptionMeta(usageType);
  const selectedPriceFromService = Number(
    service?.transportUsagePrices?.[selectedOption.value],
  );

  if (
    selectedPriceFromService !== undefined &&
    !isNaN(selectedPriceFromService) &&
    selectedPriceFromService > 0
  ) {
    return roundCurrencyAmount(selectedPriceFromService);
  }

  if (Array.isArray(service?.vehicles) && service.vehicles.length > 0) {
    const currentVehicle =
      service.vehicles.find(
        (v) =>
          normalizeComparisonTextValue(v.vehicleType) ===
          normalizeComparisonTextValue(service.vehicleType),
      ) || service.vehicles[0];
    if (currentVehicle) {
      const vehiclePrices = getTransportVehicleUsagePrices(
        currentVehicle,
        service,
      );
      if (vehiclePrices[selectedOption.value] > 0) {
        return roundCurrencyAmount(vehiclePrices[selectedOption.value]);
      }
    }
  }

  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineOption = getTransportUsageOptionMeta(
    baseline.transportUsageOptionKey ||
      baseline.transportUsageLabel ||
      baseline.usageType,
  );
  const baselineRate = roundCurrencyAmount(baseline.rate ?? service.rate ?? 0);
  const baselineFixedPrice =
    baselineOption?.price || getFixedTransportUsagePrice(baseline.usageType);
  const selectedFixedPrice =
    selectedOption?.price ||
    getFixedTransportUsagePrice(selectedOption?.usageType);

  if (baselineRate > 0 && baselineFixedPrice > 0 && selectedFixedPrice > 0) {
    return Math.max(
      0,
      roundCurrencyAmount(
        baselineRate + (selectedFixedPrice - baselineFixedPrice),
      ),
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

const applyFixedHotelOptionPricing = (
  service = {},
  fallbackRate = 0,
  fallbackCurrency = "INR",
) => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineRate = Number(
    baseline.rate ?? fallbackRate ?? service.rate ?? 0,
  );
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
    currency: normalizeCurrencyCode(
      fallbackCurrency || service.currency || "INR",
    ),
  };
};

const applyFixedTransportUsagePricing = (
  service = {},
  fallbackRate = 0,
  fallbackCurrency = "INR",
) => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const baselineRate = Number(
    baseline.rate ?? fallbackRate ?? service.rate ?? 0,
  );
  const usageDelta = getFixedHotelOptionDelta(
    baseline.usageType,
    service.usageType,
    getFixedTransportUsagePrice,
  );

  return {
    ...service,
    usageType: normalizeTransportUsageValue(service.usageType),
    rate: Math.max(0, roundCurrencyAmount(baselineRate + usageDelta)),
    currency: normalizeCurrencyCode(
      fallbackCurrency || service.currency || "INR",
    ),
  };
};

const applyTransportUsageOptionPricing = (
  service = {},
  optionKey = "",
  fallbackRate = 0,
  fallbackCurrency = "INR",
) => {
  const option = getTransportUsageOptionMeta(optionKey);
  const availableLimitOptions = getTransportUsageLimitOptionsForKeys([
    option.value,
  ]);
  const validLimitKeySet = new Set(
    availableLimitOptions.map((item) => item.value),
  );
  const transportUsageLimitOptionKey = String(
    service.transportUsageLimitOptionKey || "",
  )
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key && validLimitKeySet.has(key))
    .slice(0, 1)
    .join("");

  const nextPrice =
    getTransportUsageOptionDisplayPrice(service, option.value) ||
    option.price ||
    fallbackRate;
  const extraKmRate =
    option.value === "full-day"
      ? Number(service.fullDayExtraPerKmRate || service.extraPerKmRate || 0)
      : option.value === "half-day"
        ? Number(service.halfDayExtraPerKmRate || service.extraPerKmRate || 0)
        : 0;

  return {
    ...service,
    usageType: option.usageType,
    transportUsageOptionKey: option.value,
    transportUsageLabel: option.label,
    transportUsageLimitOptionKey,
    rate: nextPrice,
    price: nextPrice,
    quoteBaseRate: nextPrice,
    extraPerKmRate: extraKmRate,
    currency: normalizeCurrencyCode(
      fallbackCurrency || service.currency || "INR",
    ),
    useStoredPricing: false,
    manualRateOverride: true,
    originalTotal: 0,
    totalInInr: 0,
    priceInInr: 0,
  };
};

const doesHotelVariantMatchField = (variant = {}, field = "", value = "") => {
  if (!field) return false;

  if (field === "bedType") {
    return (
      normalizeBedTypeValue(variant.bedType) === normalizeBedTypeValue(value)
    );
  }

  return (
    normalizeComparisonTextValue(variant[field]) ===
    normalizeComparisonTextValue(value)
  );
};

const getHotelVariantForOption = (
  hotelVariants = [],
  service = {},
  field = "",
  value = "",
) => {
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

const getHotelRoomTypeOptionRate = (
  hotelVariants = [],
  service = {},
  roomType = "",
) => {
  const bestVariant = getHotelVariantForOption(
    hotelVariants,
    service,
    "roomType",
    roomType,
  );
  const variantRate = Number(bestVariant?.rate ?? bestVariant?.price ?? 0);
  const fixedPrice = getFixedHotelRoomTypePrice(roomType);

  if (variantRate > 0) {
    return {
      amount: roundCurrencyAmount(variantRate),
      currency: normalizeCurrencyCode(
        bestVariant?.currency || service.currency || "INR",
      ),
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

const getAdjustedHotelRoomTypeRate = (
  hotelVariants = [],
  service = {},
  selectedRoomType = "",
) => {
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
    normalizeHotelRoomTypeLookupKey(selectedRoomType) ===
    normalizeHotelRoomTypeLookupKey(baselineRoomType);
  const baselineOptionRate = Number(baseline.roomTypeOptionRate || 0);
  const baselineOptionCurrency = normalizeCurrencyCode(
    baseline.roomTypeOptionCurrency || service.currency || "INR",
  );
  const baselineOption =
    baselineOptionRate > 0
      ? {
          amount: roundCurrencyAmount(baselineOptionRate),
          currency: baselineOptionCurrency,
          variant: null,
        }
      : getHotelRoomTypeOptionRate(hotelVariants, service, baselineRoomType);
  const selectedOption = getHotelRoomTypeOptionRate(
    hotelVariants,
    service,
    selectedRoomType,
  );

  if (selectedMatchesBaseline && baselineRate > 0) {
    return {
      amount: baselineRate,
      currency:
        baselineOption.currency ||
        normalizeCurrencyCode(service.currency || "INR"),
      variant: selectedOption.variant,
    };
  }

  if (
    baselineRate > 0 &&
    baselineOption.amount > 0 &&
    selectedOption.amount > 0
  ) {
    return {
      amount: Math.max(
        0,
        roundCurrencyAmount(
          baselineRate + (selectedOption.amount - baselineOption.amount),
        ),
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

const getInferredHotelMaxOccupancy = (room = {}, service = {}) => {
  const roomCat = String(room.roomCategory || service.roomCategory || "")
    .toLowerCase()
    .trim();
  const roomTyp = String(room.roomType || service.roomType || "")
    .toLowerCase()
    .trim();

  let defaultAdults = 2;
  let defaultChildren = 1;

  if (roomCat.includes("single") || roomTyp.includes("single")) {
    defaultAdults = 1;
    defaultChildren = 0;
  } else if (roomCat.includes("triple") || roomTyp.includes("triple")) {
    defaultAdults = 3;
    defaultChildren = 1;
  } else if (
    roomCat.includes("quad") ||
    roomCat.includes("family") ||
    roomTyp.includes("family") ||
    roomTyp.includes("quad") ||
    roomTyp.includes("suite")
  ) {
    defaultAdults = 4;
    defaultChildren = 2;
  }

  const rawAdults =
    room.maxAdults !== undefined
      ? Number(room.maxAdults)
      : service.maxAdults !== undefined
        ? Number(service.maxAdults)
        : undefined;
  const rawChildren =
    room.maxChildren !== undefined
      ? Number(room.maxChildren)
      : service.maxChildren !== undefined
        ? Number(service.maxChildren)
        : undefined;

  const finalAdults =
    rawAdults !== undefined &&
    rawAdults > 0 &&
    !(rawAdults === 2 && defaultAdults > 2)
      ? rawAdults
      : defaultAdults;

  const finalChildren =
    rawChildren !== undefined &&
    rawChildren >= 0 &&
    !(rawChildren === 1 && defaultChildren > 1)
      ? rawChildren
      : defaultChildren;

  return {
    maxAdults: finalAdults,
    maxChildren: finalChildren,
    childAgeLimit:
      room.childAgeLimit || service.childAgeLimit || "As per hotel policy",
  };
};


const scoreHotelVariantMatch = (
  variant = {},
  nextService = {},
  changedField = "",
) => {
  let score = 0;

  const roomCategory = normalizeComparisonTextValue(nextService.roomCategory);
  const roomType = normalizeComparisonTextValue(nextService.roomType);
  const bedType = normalizeBedTypeValue(nextService.bedType);
  const variantRoomCategory = normalizeComparisonTextValue(
    variant.roomCategory,
  );
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

const resolveHotelVariantSelection = (
  services = [],
  service = {},
  changedField = "",
  value = "",
) => {
  const selectedHotelObj = Array.isArray(service.hotels)
    ? service.hotels.find((h) => h.hotelName === service.hotelName) ||
      service.hotels[0]
    : null;
  const hotelDocRooms = selectedHotelObj?.rooms || [];

  if (hotelDocRooms.length > 0) {
    const targetRoomType =
      changedField === "roomType" ? value : service.roomType || "";
    const targetRoomCategory =
      changedField === "roomCategory" ? value : service.roomCategory || "";
    const targetBedType =
      changedField === "bedType"
        ? normalizeBedTypeValue(value)
        : normalizeBedTypeValue(service.bedType);

    const matchedRoom =
      hotelDocRooms.find(
        (r) =>
          normalizeComparisonTextValue(r.roomType) ===
            normalizeComparisonTextValue(targetRoomType) &&
          normalizeComparisonTextValue(r.roomCategory) ===
            normalizeComparisonTextValue(targetRoomCategory) &&
          normalizeBedTypeValue(r.bedType) === targetBedType,
      ) ||
      hotelDocRooms.find(
        (r) =>
          normalizeComparisonTextValue(r.roomType) ===
            normalizeComparisonTextValue(targetRoomType) &&
          normalizeComparisonTextValue(r.roomCategory) ===
            normalizeComparisonTextValue(targetRoomCategory),
      ) ||
      hotelDocRooms.find((r) =>
        changedField === "roomType"
          ? normalizeComparisonTextValue(r.roomType) ===
            normalizeComparisonTextValue(targetRoomType)
          : changedField === "roomCategory"
            ? normalizeComparisonTextValue(r.roomCategory) ===
              normalizeComparisonTextValue(targetRoomCategory)
            : normalizeBedTypeValue(r.bedType) === targetBedType,
      ) ||
      hotelDocRooms[0];

    if (matchedRoom) {
      const baseRoomPrice =
        matchedRoom.price !== undefined
          ? Number(matchedRoom.price)
          : Number(service.price || service.rate || 0);
      const targetDate =
        service.serviceDate || formatDateInput(order?.startDate);
      const smart = resolveSmartSeasonAndBlackoutPrice(
        baseRoomPrice,
        matchedRoom.seasons,
        service.blackoutDates,
        targetDate,
      );
      const nextPrice = smart.rate;
      const occupancy = getInferredHotelMaxOccupancy(matchedRoom, {
        ...service,
        roomType: matchedRoom.roomType || targetRoomType || service.roomType,
        roomCategory:
          matchedRoom.roomCategory ||
          targetRoomCategory ||
          service.roomCategory,
      });
      return {
        ...service,
        hotelName: selectedHotelObj.hotelName || service.hotelName,
        hotelCategory: selectedHotelObj.hotelCategory || service.hotelCategory,
        starCategory: selectedHotelObj.hotelCategory || service.hotelCategory,
        supplierName: selectedHotelObj.supplierName || service.supplierName,
        roomType: matchedRoom.roomType || targetRoomType || service.roomType,
        roomCategory:
          matchedRoom.roomCategory ||
          targetRoomCategory ||
          service.roomCategory,
        bedType:
          normalizeBedTypeValue(matchedRoom.bedType) ||
          targetBedType ||
          service.bedType,
        extraBedType:
          matchedRoom.extraBedType ||
          (changedField === "extraBedType" ? value : service.extraBedType) ||
          "None",
        maxAdults: occupancy.maxAdults,
        maxChildren: occupancy.maxChildren,
        childAgeLimit: occupancy.childAgeLimit,
        mealPlan: matchedRoom.mealPlan || service.mealPlan || "EP",
        desc:
          matchedRoom.description ||
          `${matchedRoom.roomType || ""} | ${matchedRoom.mealPlan || ""} | ${selectedHotelObj.hotelName}`,
        rate: nextPrice,
        price: nextPrice,
        quoteBaseRate: nextPrice,
        roomTypeOptionRate: nextPrice,
        pricingTier: smart.tier || "Standard Rate",
        blackout: smart.isBlackout
          ? { isBlackout: true, label: smart.blackoutLabel }
          : { isBlackout: false },
        awebRate: Number(matchedRoom.awebRate || 0),
        cwebRate: Number(matchedRoom.cwebRate || 0),
        cwoebRate: Number(matchedRoom.cwoebRate || 0),
        hotelRateMode: "unit-rate",
        useStoredPricing: false,
        manualRateOverride: true,
        originalTotal: 0,
        totalInInr: 0,
        priceInInr: 0,
      };
    }
  }

  const nextService = {
    ...service,
    [changedField]:
      changedField === "bedType" ? normalizeBedTypeValue(value) : value,
  };
  const hotelVariants = getHotelVariantServices(services, service);

  if (!hotelVariants.length) {
    return applyFixedHotelOptionPricing(
      nextService,
      nextService.rate,
      nextService.currency,
    );
  }

  const bestVariant = getHotelVariantForOption(
    hotelVariants,
    nextService,
    changedField,
    value,
  );

  if (!bestVariant) {
    if (changedField === "roomType") {
      const adjustedRoomTypeRate = getAdjustedHotelRoomTypeRate(
        hotelVariants,
        nextService,
        value,
      );
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

    return applyFixedHotelOptionPricing(
      nextService,
      nextService.rate,
      nextService.currency,
    );
  }

  const adjustedRoomTypeRate =
    changedField === "roomType"
      ? getAdjustedHotelRoomTypeRate(hotelVariants, nextService, value)
      : null;
  const matchedVariantRate = Number(bestVariant.rate ?? bestVariant.price ?? 0);
  const matchedVariantCurrency = normalizeCurrencyCode(
    adjustedRoomTypeRate?.currency ||
      bestVariant.currency ||
      nextService.currency ||
      "INR",
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

  if (
    matchedVariantRate > 0 &&
    matchedVariantService.hotelRateMode !== "service-total"
  ) {
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
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    )
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
  if (!rawDestination) return { cityTerms: [], fallbackTerms: [] };

  const normalizedParts = rawDestination
    .split(/[,/|&+>-]+/)
    .map((part) => normalizeDestinationMatchText(part))
    .filter((part) => part && part.length >= 3);

  const cityTerms =
    normalizedParts.length > 1 ? normalizedParts.slice(0, -1) : [];
  const fallbackTerms = normalizedParts.length
    ? normalizedParts
    : [normalizeDestinationMatchText(rawDestination)].filter(Boolean);

  return {
    cityTerms: expandDestinationAliases(cityTerms),
    fallbackTerms: expandDestinationAliases(fallbackTerms),
  };
};

const doesServiceMatchDestination = (service = {}, destination = "") => {
  const { cityTerms, fallbackTerms } = getDestinationMatchTerms(destination);
  const destinationTerms = cityTerms.length ? cityTerms : fallbackTerms;
  if (!destinationTerms.length) return true;

  const serviceCityText = normalizeDestinationMatchText(service.city);
  const serviceCountryText = normalizeDestinationMatchText(service.country);

  if (cityTerms.length) {
    return cityTerms.some((term) => serviceCityText.includes(term));
  }

  const serviceLocationText = [serviceCityText, serviceCountryText]
    .filter(Boolean)
    .join(" ");

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
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-semibold text-white
    ${iconTone}`}
    >
      {String(service.icon || service.title || "S")
        .trim()
        .charAt(0)
        .toUpperCase()}
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

const getServiceCardDomId = (serviceId) =>
  `quotation-service-card-${serviceId}`;
const getSelectedServiceSummaryDomId = (serviceId) =>
  `quotation-selected-service-${serviceId}`;

const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "")
    .trim()
    .toLowerCase();
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
    return roundCurrencyAmount(
      Number(service?.rate || 0) * Number(service?.days || 1),
    );
  }

  if (normalizedType === "activity" || normalizedType === "sightseeing") {
    const adultPrice = Number(
      service?.adultPrice !== undefined
        ? service.adultPrice
        : (service?.rate ?? service?.price ?? 0),
    );
    const childPrice = Number(service?.childPrice || 0);
    const adultCount = Number(
      service?.adults !== undefined ? service.adults : service?.pax || 1,
    );
    const childCount = Number(service?.children || 0);

    if (childCount > 0 && childPrice > 0) {
      return roundCurrencyAmount(
        adultPrice * adultCount + childPrice * childCount,
      );
    }
    return roundCurrencyAmount(adultPrice * adultCount);
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
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeComparisonCountValue = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  return Number(value || fallback);
};

const buildServiceEditBaseline = (service = {}) => {
  const normalizedType = normalizeServiceFilterType(service.type);
  const normalizedRoomCategory =
    normalizedType === "hotel"
      ? service.roomCategory || "Double"
      : service.roomCategory;
  const resolvedRoomType =
    normalizedType === "hotel"
      ? inferHotelRoomTypeValue(service)
      : String(service.roomType || "");
  const normalizedBedType =
    normalizedType === "hotel"
      ? normalizeBedTypeValue(service.bedType) || "double-bed"
      : normalizeBedTypeValue(service.bedType) ||
        normalizeComparisonTextValue(service.bedType);
  const isHotelServiceTotal =
    normalizedType === "hotel" && service?.hotelRateMode === "service-total";

  return {
    quoteBaseRate: roundCurrencyAmount(
      service.quoteBaseRate ??
        service.originalTotal ??
        service.total ??
        service.rate ??
        0,
    ),
    originalTotal: roundCurrencyAmount(
      service.originalTotal ?? service.total ?? 0,
    ),
    total: roundCurrencyAmount(service.total ?? service.originalTotal ?? 0),
    rate: roundCurrencyAmount(
      isHotelServiceTotal
        ? (service.originalTotal ??
            service.total ??
            service.rate ??
            service.price ??
            0)
        : (service.price ?? service.rate ?? 0),
    ),
    serviceDate: normalizeComparisonDateValue(service.serviceDate),
    nights: normalizeComparisonCountValue(service.nights),
    days: Number(service.days || 1),
    pax: Number(service.pax || 1),
    tourType: String(service.tourType || ""),
    pricingBasis: String(service.pricingBasis || ""),
    maxPax: String(service.maxPax || ""),
    rooms: Number(service.rooms || 1),
    usageType: normalizeTransportUsageValue(service.usageType),
    transportUsageOptionKey: getTransportUsageOptionKey(service),
    transportUsageLimitOptionKey: String(
      service.transportUsageLimitOptionKey || "",
    ),
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
  };
};

const getSelectedServiceQuotationEdits = (service = {}) => {
  const baseline = service.editBaseline || buildServiceEditBaseline(service);
  const edits = [];
  const serviceType = normalizeServiceFilterType(service.type);
  const currencyCode = normalizeCurrencyCode(service.currency || "INR");

  const pushEdit = (key, label, value, variant = "info") => {
    edits.push({ key, label, value, variant });
  };

  if (
    roundCurrencyAmount(service.rate || 0) !==
    roundCurrencyAmount(baseline.rate || 0)
  ) {
    pushEdit(
      "rate",
      "Rate",
      formatCurrencyValue(service.rate || 0, currencyCode),
      "warning",
    );
  }

  if (
    normalizeComparisonDateValue(service.serviceDate) !==
    normalizeComparisonDateValue(baseline.serviceDate)
  ) {
    pushEdit(
      "serviceDate",
      "Date",
      formatServiceDateLabel(service.serviceDate),
      "info",
    );
  }

  if (serviceType === "hotel") {
    if (
      normalizeComparisonCountValue(service.nights) !==
      normalizeComparisonCountValue(baseline.nights)
    ) {
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

    if (
      normalizeComparisonTextValue(service.roomType) !==
      normalizeComparisonTextValue(baseline.roomType)
    ) {
      pushEdit("roomType", "Room", service.roomType || "Updated", "info");
    }

    if (
      normalizeComparisonTextValue(service.roomCategory) !==
      normalizeComparisonTextValue(baseline.roomCategory)
    ) {
      pushEdit(
        "roomCategory",
        "Category",
        service.roomCategory || "Updated",
        "info",
      );
    }

    if (
      normalizeComparisonTextValue(service.bedType) !==
      normalizeComparisonTextValue(baseline.bedType)
    ) {
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

    if (
      normalizeComparisonTextValue(service.usageType) !==
      normalizeComparisonTextValue(baseline.usageType)
    ) {
      pushEdit(
        "usageType",
        "Usage",
        getSelectedTransportUsageOptionLabels(service)[0] ||
          String(service.usageType || "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()) ||
          "Updated",
        "info",
      );
    }

    const activeLimitOptions = getTransportUsageLimitOptionsForKeys(
      getSelectedTransportUsageOptionKeys(service),
    );
    const activeLimitLabel = getSelectedTransportUsageLimitLabels(
      service,
      activeLimitOptions,
    )[0];
    const baselineLimitLabel = getSelectedTransportUsageLimitLabels(
      baseline,
      activeLimitOptions,
    )[0];

    if (activeLimitLabel && activeLimitLabel !== baselineLimitLabel) {
      pushEdit(
        "transportUsageLimitOptionKey",
        "Limit",
        activeLimitLabel,
        "info",
      );
    }
  }

  if (serviceType === "activity" || serviceType === "sightseeing") {
    if (
      service.tourType &&
      baseline.tourType &&
      service.tourType !== baseline.tourType
    ) {
      pushEdit("tourType", "Tour Type", service.tourType, "info");
    }
    if (Number(service.pax || 1) !== Number(baseline.pax || 1)) {
      pushEdit("pax", "Pax", `${Number(service.pax || 0)} pax`, "info");
    }
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
