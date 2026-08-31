import { pageShellVariants, sectionRevealVariants, sideStackVariants, rightCardVariants, INDIAN_DESTINATION_KEYWORDS, DEFAULT_EXCHANGE_RATES, CURRENCY_LABELS, DESTINATION_ALIAS_GROUPS, WHATSAPP_QUOTATION_BRAND, WHATSAPP_SECTION_DIVIDER, WHATSAPP_SUBSECTION_DIVIDER, DEFAULT_WHATSAPP_TERMS, SHOW_SELECTED_HISTORY_COMPARISON, SERVICE_TYPE_LABELS, CONTRACTED_RATE_FILTER_OPTIONS, HOTEL_ROOM_TYPE_OPTIONS, HOTEL_ROOM_CATEGORY_OPTIONS, HOTEL_BED_TYPE_OPTIONS, HOTEL_ROOM_TYPE_FIXED_PRICES, HOTEL_BED_TYPE_FIXED_PRICES, TRANSPORT_USAGE_OPTIONS, TRANSPORT_USAGE_LIMIT_OPTIONS, TRANSPORT_USAGE_FIXED_PRICES, TRANSPORT_USAGE_OPTION_LABELS } from './constants';
import { normalizeCurrencyCode, roundCurrencyAmount, roundExchangeRateValue, getCurrencyLabel, formatAmountValue, formatExchangeRateValue, formatCurrencyValue, getCurrentUserRole, formatShareDate, buildTravelerSummary, getQueryPassengerCount, buildShareServiceQuantityLabel, buildShareServiceLocationLabel, buildPlainTextQuotationSummary, sanitizeDynamicListItems, normalizeDateInputValue, addDaysToNormalizedDate, getOrdinalValue, formatItineraryDateLabel, buildItineraryDayLabel, sanitizeDayWiseItineraryItems, areDayWiseItineraryItemsEqual, reconcileDayWiseItineraryItems, copyTextToClipboard, normalizeComparisonDateValue, normalizeComparisonTextValue, normalizeComparisonCountValue, formatDateInput, addDaysToDate } from './formatters';
import { getPublicBaseUrl, createPublicAssetUrl, downloadFileFromUrl, escapeWordHtml, buildWordQuotationDocumentHtml, downloadWordDocument } from './documents';
import { normalizeServiceFilterType, normalizeBedTypeValue, getBedTypeOptionLabel, formatHotelOptionLabel, buildHotelVariantGroupKey, getHotelVariantServices, buildSelectOptionsWithFallback, normalizeHotelOptionLookupKey, normalizeHotelRoomTypeLookupKey, normalizeTransportUsageValue, normalizeTransportUsageOptionKey, getTransportUsageOptionMeta, getTransportUsageOptionKey, getSelectedTransportUsageOptionKeys, getSelectedTransportUsageOptionLabels, getTransportUsageLimitOptionsForKeys, getDefaultTransportUsageLimitKeyValue, getSelectedTransportUsageLimitLabels, getTransportUsageLimitText, stripTransportUsageSuffix, getServiceSearchAliases, getServiceSearchText, normalizeDestinationMatchText, getDestinationMatchTerms, doesServiceMatchDestination, getServiceTypeLabel, getSelectedServiceIconTone, renderSelectedServiceSummaryIcon, getSelectedServiceIncludedItems, formatServiceDateLabel, getServiceCardDomId, getSelectedServiceSummaryDomId, isIndianDestination, getExchangeRateForCurrency, convertAmountToInr, calculateServiceOriginalTotal, buildServiceEditBaseline, getSelectedServiceQuotationEdits, serviceCardVariants, getHotelVariantOptions, getTransportVehicleOptions, getHotelBaseRateDisplayValue, formatRoomOccupancyLabel } from './serviceHelpers';
import { getFixedHotelRoomTypePrice, inferHotelRoomTypeValue, getFixedHotelBedTypePrice, getFixedTransportUsagePrice, getResolvedHotelBaseRate, normalizeDateOnlyString, isDateInRange, checkBlackoutMatch, resolveSmartSeasonAndBlackoutPrice, resolveHotelSmartRate, resolveTransportSmartRate, resolveActivitySmartRate, getTransportVehicleUsagePrices, resolveTransportVehicleSelection, getTransportUsageOptionDisplayPrice, getFixedHotelOptionDelta, applyFixedHotelOptionPricing, applyFixedTransportUsagePricing, applyTransportUsageOptionPricing, doesHotelVariantMatchField, getHotelVariantForOption, getHotelRoomTypeOptionRate, getAdjustedHotelRoomTypeRate, getInferredHotelMaxOccupancy, scoreHotelVariantMatch, resolveHotelVariantSelection } from './pricing';

﻿export const normalizeWhatsAppPhoneNumber = (value = "") => {
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

export const parseWhatsAppDate = (value) => {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatWhatsAppDate = (
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

export const formatWhatsAppActivityDate = (value) => {
  const parsed = parseWhatsAppDate(value);
  if (!parsed) return "";

  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "short" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });
  const year = String(parsed.getFullYear()).slice(-2);

  return `${weekday}, ${getOrdinalValue(parsed.getDate())} ${month}'${year}`;
};

export const formatWhatsAppItineraryDate = (value) => {
  const parsed = parseWhatsAppDate(value);
  if (!parsed) return "";

  const weekday = parsed.toLocaleDateString("en-GB", { weekday: "long" });
  const month = parsed.toLocaleDateString("en-GB", { month: "short" });

  return `${weekday} ${getOrdinalValue(parsed.getDate())} ${month}, ${parsed.getFullYear()}`;
};

export const addDaysForWhatsApp = (value, daysToAdd = 0) => {
  const parsed = parseWhatsAppDate(value);
  if (!parsed) return "";

  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString();
};

export const getWhatsAppDateDiff = (startDate, endDate) => {
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

export const inferSharingLabel = (services = []) => {
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

export const buildWhatsAppTravelerSummary = (quotation = {}) => {
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

export const buildWhatsAppNightLabel = (serviceDate, nights, tripStartDate) => {
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

export const buildWhatsAppHotelMeta = (service = {}, fallbackPax = 0) => {
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

export const buildWhatsAppHotelsSection = (quotation = {}) => {
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

export const buildWhatsAppTransportSection = (quotation = {}) => {
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

export const buildWhatsAppInclusionsSection = (items = [], prefix = "+") => {
  if (!Array.isArray(items) || !items.length) return "";

  return items.map((item) => `${prefix} ${item}`).join("\n");
};

export const buildWhatsAppExclusionsSection = (items = [], prefix = "-") => {
  if (!Array.isArray(items) || !items.length) return "";

  return items.map((item) => `${prefix} ${item}`).join("\n");
};

export const buildWhatsAppSellerBankDetailsSection = (items = []) => {
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

export const buildWhatsAppTermsSection = (items = []) => {
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

export const buildWhatsAppDayWiseItinerary = (quotation = {}) => {
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

export const buildWhatsAppQuotationMessage = (quotation = {}) => {
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
