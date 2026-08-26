import { pageShellVariants, sectionRevealVariants, sideStackVariants, rightCardVariants, INDIAN_DESTINATION_KEYWORDS, DEFAULT_EXCHANGE_RATES, CURRENCY_LABELS, DESTINATION_ALIAS_GROUPS, WHATSAPP_QUOTATION_BRAND, WHATSAPP_SECTION_DIVIDER, WHATSAPP_SUBSECTION_DIVIDER, DEFAULT_WHATSAPP_TERMS, SHOW_SELECTED_HISTORY_COMPARISON, SERVICE_TYPE_LABELS, CONTRACTED_RATE_FILTER_OPTIONS, HOTEL_ROOM_TYPE_OPTIONS, HOTEL_ROOM_CATEGORY_OPTIONS, HOTEL_BED_TYPE_OPTIONS, HOTEL_ROOM_TYPE_FIXED_PRICES, HOTEL_BED_TYPE_FIXED_PRICES, TRANSPORT_USAGE_OPTIONS, TRANSPORT_USAGE_LIMIT_OPTIONS, TRANSPORT_USAGE_FIXED_PRICES, TRANSPORT_USAGE_OPTION_LABELS } from './constants';
import { normalizeCurrencyCode, roundCurrencyAmount, roundExchangeRateValue, getCurrencyLabel, formatAmountValue, formatExchangeRateValue, formatCurrencyValue, getCurrentUserRole, formatShareDate, buildTravelerSummary, getQueryPassengerCount, buildShareServiceQuantityLabel, buildShareServiceLocationLabel, buildPlainTextQuotationSummary, sanitizeDynamicListItems, normalizeDateInputValue, addDaysToNormalizedDate, getOrdinalValue, formatItineraryDateLabel, buildItineraryDayLabel, sanitizeDayWiseItineraryItems, areDayWiseItineraryItemsEqual, reconcileDayWiseItineraryItems, copyTextToClipboard, normalizeComparisonDateValue, normalizeComparisonTextValue, normalizeComparisonCountValue, formatDateInput, addDaysToDate } from './formatters';
import { normalizeWhatsAppPhoneNumber, parseWhatsAppDate, formatWhatsAppDate, formatWhatsAppActivityDate, formatWhatsAppItineraryDate, addDaysForWhatsApp, getWhatsAppDateDiff, inferSharingLabel, buildWhatsAppTravelerSummary, buildWhatsAppNightLabel, buildWhatsAppHotelMeta, buildWhatsAppHotelsSection, buildWhatsAppTransportSection, buildWhatsAppInclusionsSection, buildWhatsAppExclusionsSection, buildWhatsAppSellerBankDetailsSection, buildWhatsAppTermsSection, buildWhatsAppDayWiseItinerary, buildWhatsAppQuotationMessage } from './whatsapp';
import { getPublicBaseUrl, createPublicAssetUrl, downloadFileFromUrl, escapeWordHtml, buildWordQuotationDocumentHtml, downloadWordDocument } from './documents';
import { normalizeServiceFilterType, normalizeBedTypeValue, getBedTypeOptionLabel, formatHotelOptionLabel, buildHotelVariantGroupKey, getHotelVariantServices, buildSelectOptionsWithFallback, normalizeHotelOptionLookupKey, normalizeHotelRoomTypeLookupKey, normalizeTransportUsageValue, normalizeTransportUsageOptionKey, getTransportUsageOptionMeta, getTransportUsageOptionKey, getSelectedTransportUsageOptionKeys, getSelectedTransportUsageOptionLabels, getTransportUsageLimitOptionsForKeys, getDefaultTransportUsageLimitKeyValue, getSelectedTransportUsageLimitLabels, getTransportUsageLimitText, stripTransportUsageSuffix, getServiceSearchAliases, getServiceSearchText, normalizeDestinationMatchText, getDestinationMatchTerms, doesServiceMatchDestination, getServiceTypeLabel, getSelectedServiceIconTone, renderSelectedServiceSummaryIcon, getSelectedServiceIncludedItems, formatServiceDateLabel, getServiceCardDomId, getSelectedServiceSummaryDomId, isIndianDestination, getExchangeRateForCurrency, convertAmountToInr, calculateServiceOriginalTotal, buildServiceEditBaseline, getSelectedServiceQuotationEdits, serviceCardVariants, getHotelVariantOptions, getTransportVehicleOptions, getHotelBaseRateDisplayValue, formatRoomOccupancyLabel } from './serviceHelpers';

﻿export const getFixedHotelRoomTypePrice = (roomType = "") =>
  HOTEL_ROOM_TYPE_FIXED_PRICES[normalizeHotelRoomTypeLookupKey(roomType)] || 0;

export const inferHotelRoomTypeValue = (service = {}) => {
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

export const getFixedHotelBedTypePrice = (bedType = "") =>
  HOTEL_BED_TYPE_FIXED_PRICES[normalizeHotelOptionLookupKey(bedType)] || 0;

export const getFixedTransportUsagePrice = (usageType = "") =>
  TRANSPORT_USAGE_FIXED_PRICES[normalizeTransportUsageValue(usageType)] || 0;

export const getResolvedHotelBaseRate = (service = {}, fallbackRate = 0) => {
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

export const normalizeDateOnlyString = (value) => {
  if (!value) return "";
  const text = String(value || "").trim();
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

export const isDateInRange = (targetDate, fromVal, toVal) => {
  if (!targetDate || !fromVal || !toVal) return false;
  const target = normalizeDateOnlyString(targetDate);
  const from = normalizeDateOnlyString(fromVal);
  const to = normalizeDateOnlyString(toVal);
  if (!target || !from || !to) return false;
  return target >= from && target <= to;
};

export const checkBlackoutMatch = (blackoutDates = [], targetDate = "") => {
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

export const resolveSmartSeasonAndBlackoutPrice = (
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

export const resolveHotelSmartRate = (service = {}, targetDate = "") => {
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

export const resolveTransportSmartRate = (service = {}, targetDate = "") => {
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

export const resolveActivitySmartRate = (
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

export const getTransportVehicleUsagePrices = (
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

export const resolveTransportVehicleSelection = (
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

export const getTransportUsageOptionDisplayPrice = (service = {}, usageType = "") => {
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

export const getFixedHotelOptionDelta = (
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

export const applyFixedHotelOptionPricing = (
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

export const applyFixedTransportUsagePricing = (
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

export const applyTransportUsageOptionPricing = (
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

export const doesHotelVariantMatchField = (variant = {}, field = "", value = "") => {
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

export const getHotelVariantForOption = (
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

export const getHotelRoomTypeOptionRate = (
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

export const getAdjustedHotelRoomTypeRate = (
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

export const getInferredHotelMaxOccupancy = (room = {}, service = {}) => {
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


export const scoreHotelVariantMatch = (
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

export const resolveHotelVariantSelection = (
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
