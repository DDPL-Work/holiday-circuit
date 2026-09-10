import { pageShellVariants, sectionRevealVariants, sideStackVariants, rightCardVariants, INDIAN_DESTINATION_KEYWORDS, DEFAULT_EXCHANGE_RATES, CURRENCY_LABELS, DESTINATION_ALIAS_GROUPS, WHATSAPP_QUOTATION_BRAND, WHATSAPP_SECTION_DIVIDER, WHATSAPP_SUBSECTION_DIVIDER, DEFAULT_WHATSAPP_TERMS, SHOW_SELECTED_HISTORY_COMPARISON, SERVICE_TYPE_LABELS, CONTRACTED_RATE_FILTER_OPTIONS, HOTEL_ROOM_TYPE_OPTIONS, HOTEL_ROOM_CATEGORY_OPTIONS, HOTEL_BED_TYPE_OPTIONS, HOTEL_ROOM_TYPE_FIXED_PRICES, HOTEL_BED_TYPE_FIXED_PRICES, TRANSPORT_USAGE_OPTIONS, TRANSPORT_USAGE_LIMIT_OPTIONS, TRANSPORT_USAGE_FIXED_PRICES, TRANSPORT_USAGE_OPTION_LABELS } from './constants';
import { normalizeWhatsAppPhoneNumber, parseWhatsAppDate, formatWhatsAppDate, formatWhatsAppActivityDate, formatWhatsAppItineraryDate, addDaysForWhatsApp, getWhatsAppDateDiff, inferSharingLabel, buildWhatsAppTravelerSummary, buildWhatsAppNightLabel, buildWhatsAppHotelMeta, buildWhatsAppHotelsSection, buildWhatsAppTransportSection, buildWhatsAppInclusionsSection, buildWhatsAppExclusionsSection, buildWhatsAppSellerBankDetailsSection, buildWhatsAppTermsSection, buildWhatsAppDayWiseItinerary, buildWhatsAppQuotationMessage } from './whatsapp';
import { getPublicBaseUrl, createPublicAssetUrl, downloadFileFromUrl, escapeWordHtml, buildWordQuotationDocumentHtml, downloadWordDocument } from './documents';
import { normalizeServiceFilterType, normalizeBedTypeValue, getBedTypeOptionLabel, formatHotelOptionLabel, buildHotelVariantGroupKey, getHotelVariantServices, buildSelectOptionsWithFallback, normalizeHotelOptionLookupKey, normalizeHotelRoomTypeLookupKey, normalizeTransportUsageValue, normalizeTransportUsageOptionKey, getTransportUsageOptionMeta, getTransportUsageOptionKey, getSelectedTransportUsageOptionKeys, getSelectedTransportUsageOptionLabels, getTransportUsageLimitOptionsForKeys, getDefaultTransportUsageLimitKeyValue, getSelectedTransportUsageLimitLabels, getTransportUsageLimitText, stripTransportUsageSuffix, getServiceSearchAliases, getServiceSearchText, normalizeDestinationMatchText, getDestinationMatchTerms, doesServiceMatchDestination, getServiceTypeLabel, getSelectedServiceIconTone, renderSelectedServiceSummaryIcon, getSelectedServiceIncludedItems, formatServiceDateLabel, getServiceCardDomId, getSelectedServiceSummaryDomId, isIndianDestination, getExchangeRateForCurrency, convertAmountToInr, calculateServiceOriginalTotal, buildServiceEditBaseline, getSelectedServiceQuotationEdits, serviceCardVariants, getHotelVariantOptions, getTransportVehicleOptions, getHotelBaseRateDisplayValue, formatRoomOccupancyLabel } from './serviceHelpers';
import { getFixedHotelRoomTypePrice, inferHotelRoomTypeValue, getFixedHotelBedTypePrice, getFixedTransportUsagePrice, getResolvedHotelBaseRate, normalizeDateOnlyString, isDateInRange, checkBlackoutMatch, resolveSmartSeasonAndBlackoutPrice, resolveHotelSmartRate, resolveTransportSmartRate, resolveActivitySmartRate, getTransportVehicleUsagePrices, resolveTransportVehicleSelection, getTransportUsageOptionDisplayPrice, getFixedHotelOptionDelta, applyFixedHotelOptionPricing, applyFixedTransportUsagePricing, applyTransportUsageOptionPricing, doesHotelVariantMatchField, getHotelVariantForOption, getHotelRoomTypeOptionRate, getAdjustedHotelRoomTypeRate, getInferredHotelMaxOccupancy, scoreHotelVariantMatch, resolveHotelVariantSelection } from './pricing';

﻿export const normalizeCurrencyCode = (currency = "INR") =>
  String(currency || "INR")
    .trim()
    .toUpperCase() || "INR";
export const roundCurrencyAmount = (value) => Math.round(Number(value || 0));

export const roundExchangeRateValue = (value) => Number(Number(value || 0).toFixed(4));

export const getCurrencyLabel = (currency = "INR") =>
  CURRENCY_LABELS[normalizeCurrencyCode(currency)] ||
  normalizeCurrencyCode(currency);

export const formatAmountValue = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const formatExchangeRateValue = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

export const formatCurrencyValue = (value, currency = "INR") =>
  `${getCurrencyLabel(currency)} ${formatAmountValue(value)}`;

export const getCurrentUserRole = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    return String(user?.role || "").trim();
  } catch {
    return "";
  }
};

export const formatShareDate = (value) => {
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

export const buildTravelerSummary = (query = {}) => {
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

export const getQueryPassengerCount = (query = {}) =>
  Number(query?.numberOfAdults || 0) + Number(query?.numberOfChildren || 0);

export const buildShareServiceQuantityLabel = (service = {}, fallbackPax = 0) => {
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

export const buildShareServiceLocationLabel = (service = {}) =>
  [service?.city, service?.country].filter(Boolean).join(", ");

export const buildPlainTextQuotationSummary = (quotation = {}) => {
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
export const sanitizeDynamicListItems = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) =>
          String(item || "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean)
    : [];

export const normalizeDateInputValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

export const addDaysToNormalizedDate = (value, daysToAdd = 0) => {
  const normalizedValue = normalizeDateInputValue(value);
  if (!normalizedValue) return "";

  const parsed = new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) return "";

  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
};

export const getOrdinalValue = (value) => {
  const number = Number(value || 0);
  const remainderTen = number % 10;
  const remainderHundred = number % 100;

  if (remainderTen === 1 && remainderHundred !== 11) return `${number}st`;
  if (remainderTen === 2 && remainderHundred !== 12) return `${number}nd`;
  if (remainderTen === 3 && remainderHundred !== 13) return `${number}rd`;
  return `${number}th`;
};

export const formatItineraryDateLabel = (value) => {
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

export const buildItineraryDayLabel = (dayNumber, dateValue = "") => {
  const ordinalDay = getOrdinalValue(dayNumber);
  const dateLabel = formatItineraryDateLabel(dateValue);
  return dateLabel ? `${ordinalDay} Day (${dateLabel})` : `${ordinalDay} Day`;
};

export const sanitizeDayWiseItineraryItems = (items = []) =>
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

export const areDayWiseItineraryItemsEqual = (currentItems = [], nextItems = []) =>
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

export const reconcileDayWiseItineraryItems = (
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

export const copyTextToClipboard = async (value) => {
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
export const normalizeComparisonDateValue = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value || "").trim();
  }

  return parsed.toISOString().slice(0, 10);
};

export const normalizeComparisonTextValue = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

export const normalizeComparisonCountValue = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  return Number(value || fallback);
};
export const formatDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

export const addDaysToDate = (value, daysToAdd = 0) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
};
export const expandDestinationAliases = (values = []) => {
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
