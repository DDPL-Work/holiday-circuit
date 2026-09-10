import { pageShellVariants, sectionRevealVariants, sideStackVariants, rightCardVariants, INDIAN_DESTINATION_KEYWORDS, DEFAULT_EXCHANGE_RATES, CURRENCY_LABELS, DESTINATION_ALIAS_GROUPS, WHATSAPP_QUOTATION_BRAND, WHATSAPP_SECTION_DIVIDER, WHATSAPP_SUBSECTION_DIVIDER, DEFAULT_WHATSAPP_TERMS, SHOW_SELECTED_HISTORY_COMPARISON, SERVICE_TYPE_LABELS, CONTRACTED_RATE_FILTER_OPTIONS, HOTEL_ROOM_TYPE_OPTIONS, HOTEL_ROOM_CATEGORY_OPTIONS, HOTEL_BED_TYPE_OPTIONS, HOTEL_ROOM_TYPE_FIXED_PRICES, HOTEL_BED_TYPE_FIXED_PRICES, TRANSPORT_USAGE_OPTIONS, TRANSPORT_USAGE_LIMIT_OPTIONS, TRANSPORT_USAGE_FIXED_PRICES, TRANSPORT_USAGE_OPTION_LABELS } from './constants';
import { normalizeCurrencyCode, roundCurrencyAmount, roundExchangeRateValue, getCurrencyLabel, formatAmountValue, formatExchangeRateValue, formatCurrencyValue, getCurrentUserRole, formatShareDate, buildTravelerSummary, getQueryPassengerCount, buildShareServiceQuantityLabel, buildShareServiceLocationLabel, buildPlainTextQuotationSummary, sanitizeDynamicListItems, normalizeDateInputValue, addDaysToNormalizedDate, getOrdinalValue, formatItineraryDateLabel, buildItineraryDayLabel, sanitizeDayWiseItineraryItems, areDayWiseItineraryItemsEqual, reconcileDayWiseItineraryItems, copyTextToClipboard, normalizeComparisonDateValue, normalizeComparisonTextValue, normalizeComparisonCountValue, formatDateInput, addDaysToDate, expandDestinationAliases } from './formatters';
import { normalizeWhatsAppPhoneNumber, parseWhatsAppDate, formatWhatsAppDate, formatWhatsAppActivityDate, formatWhatsAppItineraryDate, addDaysForWhatsApp, getWhatsAppDateDiff, inferSharingLabel, buildWhatsAppTravelerSummary, buildWhatsAppNightLabel, buildWhatsAppHotelMeta, buildWhatsAppHotelsSection, buildWhatsAppTransportSection, buildWhatsAppInclusionsSection, buildWhatsAppExclusionsSection, buildWhatsAppSellerBankDetailsSection, buildWhatsAppTermsSection, buildWhatsAppDayWiseItinerary, buildWhatsAppQuotationMessage } from './whatsapp';
import { getPublicBaseUrl, createPublicAssetUrl, downloadFileFromUrl, escapeWordHtml, buildWordQuotationDocumentHtml, downloadWordDocument } from './documents';
import { getFixedHotelRoomTypePrice, inferHotelRoomTypeValue, getFixedHotelBedTypePrice, getFixedTransportUsagePrice, getResolvedHotelBaseRate, normalizeDateOnlyString, isDateInRange, checkBlackoutMatch, resolveSmartSeasonAndBlackoutPrice, resolveHotelSmartRate, resolveTransportSmartRate, resolveActivitySmartRate, getTransportVehicleUsagePrices, resolveTransportVehicleSelection, getTransportUsageOptionDisplayPrice, getFixedHotelOptionDelta, applyFixedHotelOptionPricing, applyFixedTransportUsagePricing, applyTransportUsageOptionPricing, doesHotelVariantMatchField, getHotelVariantForOption, getHotelRoomTypeOptionRate, getAdjustedHotelRoomTypeRate, getInferredHotelMaxOccupancy, scoreHotelVariantMatch, resolveHotelVariantSelection } from './pricing';

﻿export const normalizeServiceFilterType = (type = "") => {
  const normalizedType = String(type || "")
    .toLowerCase()
    .trim();
  if (normalizedType === "car" || normalizedType === "transport") {
    return "transfer";
  }

  return normalizedType;
};

export const normalizeBedTypeValue = (value = "") => {
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

export const getBedTypeOptionLabel = (value = "") =>
  HOTEL_BED_TYPE_OPTIONS.find(
    (option) => option.value === normalizeBedTypeValue(value),
  )?.label || formatHotelOptionLabel(String(value || "").replace(/-/g, " "));

export const formatHotelOptionLabel = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());


export const buildHotelVariantGroupKey = (service = {}) =>
  [
    service.supplierId || service.dmcId || "",
    service.supplierName || service.hotelName || service.title || "",
    service.city || "",
    service.country || "",
  ]
    .map((value) => normalizeComparisonTextValue(value))
    .join("::");

export const getHotelVariantServices = (services = [], service = {}) =>
  services.filter(
    (candidate) =>
      normalizeServiceFilterType(candidate.type) === "hotel" &&
      buildHotelVariantGroupKey(candidate) ===
        buildHotelVariantGroupKey(service),
  );

export const buildSelectOptionsWithFallback = (values = [], fallbackValues = []) => {
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

export const normalizeHotelOptionLookupKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

export const normalizeHotelRoomTypeLookupKey = (value = "") => {
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

export const normalizeTransportUsageValue = (value = "") => {
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

export const normalizeTransportUsageOptionKey = (value = "") => {
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

export const getTransportUsageOptionMeta = (value = "") => {
  const normalizedKey =
    normalizeTransportUsageOptionKey(value) || "one-way-airport-transfer";
  return (
    TRANSPORT_USAGE_OPTIONS.find((option) => option.value === normalizedKey) ||
    TRANSPORT_USAGE_OPTIONS[0]
  );
};

export const getTransportUsageOptionKey = (service = {}) => {
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

export const getSelectedTransportUsageOptionKeys = (service = {}) =>
  [getTransportUsageOptionKey(service)].filter(Boolean);

export const getSelectedTransportUsageOptionLabels = (service = {}) =>
  getSelectedTransportUsageOptionKeys(service)
    .map(
      (key) =>
        TRANSPORT_USAGE_OPTION_LABELS[key] ||
        getTransportUsageOptionMeta(key).label,
    )
    .filter(Boolean);

export const getTransportUsageLimitOptionsForKeys = (usageKeys = []) =>
  usageKeys.flatMap((key) => TRANSPORT_USAGE_LIMIT_OPTIONS[key] || []);

export const getDefaultTransportUsageLimitKeyValue = () => "";

export const getSelectedTransportUsageLimitLabels = (...args) => {
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

export const getTransportUsageLimitText = (usageKey = "", separator = " / ") =>
  getTransportUsageLimitOptionsForKeys([usageKey])
    .map((option) => option.label)
    .join(separator);

export const stripTransportUsageSuffix = (title = "") => {
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
export const getServiceSearchAliases = (type = "") => {
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

export const getServiceSearchText = (service = {}) =>
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

export const normalizeDestinationMatchText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getDestinationMatchTerms = (destination = "") => {
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

export const doesServiceMatchDestination = (service = {}, destination = "") => {
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
export const getServiceTypeLabel = (type = "") =>
  SERVICE_TYPE_LABELS[String(type || "").toLowerCase()] || "Service";

export const getSelectedServiceIconTone = (type = "") => {
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

export const renderSelectedServiceSummaryIcon = (service = {}) => {
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

export const getSelectedServiceIncludedItems = (service = {}) => {
  const normalizedItems = String(service?.desc || service?.description || "")
    .split(/,|\||\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(normalizedItems)).slice(0, 12);
};

export const formatServiceDateLabel = (value) => {
  if (!value) return "Date pending";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getServiceCardDomId = (serviceId) =>
  `quotation-service-card-${serviceId}`;
export const getSelectedServiceSummaryDomId = (serviceId) =>
  `quotation-selected-service-${serviceId}`;

export const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "")
    .trim()
    .toLowerCase();
  if (!normalizedDestination) return false;

  return INDIAN_DESTINATION_KEYWORDS.some((keyword) =>
    normalizedDestination.includes(keyword),
  );
};

export const getExchangeRateForCurrency = (currency = "INR", exchangeRates = {}) => {
  const code = normalizeCurrencyCode(currency);
  if (code === "INR") return 1;

  const configuredRate = Number(exchangeRates?.[code]);
  if (Number.isFinite(configuredRate) && configuredRate > 0) {
    return configuredRate;
  }

  return Number(DEFAULT_EXCHANGE_RATES[code] || 1);
};

export const convertAmountToInr = (value, currency = "INR", exchangeRates = {}) =>
  roundCurrencyAmount(
    Number(value || 0) * getExchangeRateForCurrency(currency, exchangeRates),
  );

export const calculateServiceOriginalTotal = (service = {}) => {
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
export const buildServiceEditBaseline = (service = {}) => {
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

export const getSelectedServiceQuotationEdits = (service = {}) => {
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

export const serviceCardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const ROOM_CATEGORY_PRESETS = [
  {
    name: "Standard Room",
    occupancy: "Double",
    bedType: "Queen",
    extraBedType: "None",
    mealPlan: "EP",
    rate: 13600,
  },
  {
    name: "Deluxe Room",
    occupancy: "Double",
    bedType: "Queen",
    extraBedType: "None",
    mealPlan: "CP",
    rate: 16700,
  },
  {
    name: "Premium Room",
    occupancy: "Double",
    bedType: "King",
    extraBedType: "None",
    mealPlan: "CP",
    rate: 19900,
  },
  {
    name: "Family Room",
    occupancy: "Triple",
    bedType: "Twin",
    extraBedType: "Single Bed",
    mealPlan: "MAP",
    rate: 21900,
  },
  {
    name: "Luxury Room",
    occupancy: "Triple",
    bedType: "King",
    extraBedType: "Single Bed",
    mealPlan: "MAP",
    rate: 26100,
  },
  {
    name: "Suite",
    occupancy: "Triple",
    bedType: "King",
    extraBedType: "Single Bed",
    mealPlan: "AP",
    rate: 31400,
  },
];

export const getHotelVariantOptions = (services = [], service = {}) => {
  const variants = getHotelVariantServices(services, service);
  const baseRate = Number(service?.rate || service?.price || service?.baseRate || 13600);

  const combinedMap = new Map();

  // 1. Extract embedded rooms from dmc_hotel collection data (service.hotels / service.rooms / variants)
  const embeddedRooms = [];
  if (Array.isArray(service?.rooms)) {
    embeddedRooms.push(...service.rooms);
  }
  if (Array.isArray(service?.hotels)) {
    service.hotels.forEach((h) => {
      if (Array.isArray(h?.rooms)) {
        embeddedRooms.push(...h.rooms);
      }
    });
  }
  variants.forEach((v) => {
    if (Array.isArray(v?.rooms)) {
      embeddedRooms.push(...v.rooms);
    }
    if (Array.isArray(v?.hotels)) {
      v.hotels.forEach((h) => {
        if (Array.isArray(h?.rooms)) {
          embeddedRooms.push(...h.rooms);
        }
      });
    }
  });

  // Process embedded rooms from dmc_hotel collection
  embeddedRooms.forEach((r) => {
    const title = String(r.roomType || r.title || r.name || "").trim();
    if (title && title.toLowerCase() !== "standard") {
      const rPrice = Number(r.price || r.basePrice || r.rate || baseRate);
      combinedMap.set(title.toLowerCase(), {
        label: title,
        value: title,
        rate: rPrice > 0 ? rPrice : baseRate,
        occupancy: r.roomCategory || r.occupancy || "Double",
        bedType: r.bedType || "Queen",
        extraBedType: r.extraBedType || "None",
        mealPlan: r.mealPlan || "EP",
      });
    }
  });

  // 2. Process DB variants if any exist as separate service objects
  variants.forEach((v) => {
    const title = String(v.roomType || v.title || "").trim();
    if (title && title.toLowerCase() !== "standard") {
      const vRate = Number(v.rate || v.price || baseRate);
      if (!combinedMap.has(title.toLowerCase())) {
        combinedMap.set(title.toLowerCase(), {
          label: title,
          value: title,
          rate: vRate > 0 ? vRate : baseRate,
          occupancy: v.roomCategory || v.occupancy || (vRate > baseRate * 1.4 ? "Triple" : "Double"),
          bedType: v.bedType || "Queen",
          extraBedType: v.extraBedType || "None",
          variantId: v.id || v._id,
        });
      }
    }
  });

  // 3. Add standard presets from DMC sheet for any missing categories
  ROOM_CATEGORY_PRESETS.forEach((preset) => {
    const key = preset.name.toLowerCase();
    if (!combinedMap.has(key)) {
      combinedMap.set(key, {
        label: preset.name,
        value: preset.name,
        rate: preset.rate || baseRate,
        occupancy: preset.occupancy,
        bedType: preset.bedType,
        extraBedType: preset.extraBedType,
        mealPlan: preset.mealPlan,
      });
    }
  });

  // 4. Current custom roomType if any (ignoring plain "Standard")
  if (service?.roomType) {
    const rt = String(service.roomType).trim();
    if (rt && rt.toLowerCase() !== "standard" && !combinedMap.has(rt.toLowerCase())) {
      combinedMap.set(rt.toLowerCase(), {
        label: rt,
        value: rt,
        rate: baseRate,
        occupancy: service.roomCategory || "Double",
        bedType: service.bedType || "Queen",
        extraBedType: service.extraBedType || "None",
      });
    }
  }

  const roomTypesList = Array.from(combinedMap.values());
  const list = roomTypesList;
  list.roomTypes = roomTypesList;
  list.roomCategories = ["Single", "Double", "Triple", "Quad"];
  list.bedTypes = [
    { value: "King", label: "King" },
    { value: "Queen", label: "Queen" },
    { value: "Twin", label: "Twin" },
    { value: "Single", label: "Single" },
  ];
  list.extraBedTypes = [
    { value: "None", label: "None" },
    { value: "Single Bed", label: "Single Bed" },
  ];
  return list;
};

export const getTransportVehicleOptions = (services = [], service = {}) => {
  if (!services || !service) return [];
  const matches = services.filter(s =>
        s.type === service.type &&
        s.destination === service.destination &&
        (s.date === service.date || (!s.date && !service.date))
      );
  return matches.map(m => ({
    label: m.vehicleType || m.title || "Vehicle",
    value: m.id || m._id
  }));
};

export const getHotelBaseRateDisplayValue = (serviceOrRate) => {
  if (typeof serviceOrRate === "object" && serviceOrRate !== null) {
    const val =
      serviceOrRate.rate ??
      serviceOrRate.price ??
      serviceOrRate.baseRate ??
      0;
    const num = Number(val);
    return !isNaN(num) ? num : 0;
  }
  const num = Number(serviceOrRate);
  return !isNaN(num) ? num : 0;
};

export const formatRoomOccupancyLabel = (type) => {
  if (!type) return "Room";
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
};
