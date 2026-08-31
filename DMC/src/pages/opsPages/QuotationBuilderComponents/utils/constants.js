import { normalizeCurrencyCode, roundCurrencyAmount, roundExchangeRateValue, getCurrencyLabel, formatAmountValue, formatExchangeRateValue, formatCurrencyValue, getCurrentUserRole, formatShareDate, buildTravelerSummary, getQueryPassengerCount, buildShareServiceQuantityLabel, buildShareServiceLocationLabel, buildPlainTextQuotationSummary, sanitizeDynamicListItems, normalizeDateInputValue, addDaysToNormalizedDate, getOrdinalValue, formatItineraryDateLabel, buildItineraryDayLabel, sanitizeDayWiseItineraryItems, areDayWiseItineraryItemsEqual, reconcileDayWiseItineraryItems, copyTextToClipboard, normalizeComparisonDateValue, normalizeComparisonTextValue, normalizeComparisonCountValue, formatDateInput, addDaysToDate } from './formatters';
import { normalizeWhatsAppPhoneNumber, parseWhatsAppDate, formatWhatsAppDate, formatWhatsAppActivityDate, formatWhatsAppItineraryDate, addDaysForWhatsApp, getWhatsAppDateDiff, inferSharingLabel, buildWhatsAppTravelerSummary, buildWhatsAppNightLabel, buildWhatsAppHotelMeta, buildWhatsAppHotelsSection, buildWhatsAppTransportSection, buildWhatsAppInclusionsSection, buildWhatsAppExclusionsSection, buildWhatsAppSellerBankDetailsSection, buildWhatsAppTermsSection, buildWhatsAppDayWiseItinerary, buildWhatsAppQuotationMessage } from './whatsapp';
import { getPublicBaseUrl, createPublicAssetUrl, downloadFileFromUrl, escapeWordHtml, buildWordQuotationDocumentHtml, downloadWordDocument } from './documents';
import { normalizeServiceFilterType, normalizeBedTypeValue, getBedTypeOptionLabel, formatHotelOptionLabel, buildHotelVariantGroupKey, getHotelVariantServices, buildSelectOptionsWithFallback, normalizeHotelOptionLookupKey, normalizeHotelRoomTypeLookupKey, normalizeTransportUsageValue, normalizeTransportUsageOptionKey, getTransportUsageOptionMeta, getTransportUsageOptionKey, getSelectedTransportUsageOptionKeys, getSelectedTransportUsageOptionLabels, getTransportUsageLimitOptionsForKeys, getDefaultTransportUsageLimitKeyValue, getSelectedTransportUsageLimitLabels, getTransportUsageLimitText, stripTransportUsageSuffix, getServiceSearchAliases, getServiceSearchText, normalizeDestinationMatchText, getDestinationMatchTerms, doesServiceMatchDestination, getServiceTypeLabel, getSelectedServiceIconTone, renderSelectedServiceSummaryIcon, getSelectedServiceIncludedItems, formatServiceDateLabel, getServiceCardDomId, getSelectedServiceSummaryDomId, isIndianDestination, getExchangeRateForCurrency, convertAmountToInr, calculateServiceOriginalTotal, buildServiceEditBaseline, getSelectedServiceQuotationEdits, serviceCardVariants, getHotelVariantOptions, getTransportVehicleOptions, getHotelBaseRateDisplayValue, formatRoomOccupancyLabel } from './serviceHelpers';
import { getFixedHotelRoomTypePrice, inferHotelRoomTypeValue, getFixedHotelBedTypePrice, getFixedTransportUsagePrice, getResolvedHotelBaseRate, normalizeDateOnlyString, isDateInRange, checkBlackoutMatch, resolveSmartSeasonAndBlackoutPrice, resolveHotelSmartRate, resolveTransportSmartRate, resolveActivitySmartRate, getTransportVehicleUsagePrices, resolveTransportVehicleSelection, getTransportUsageOptionDisplayPrice, getFixedHotelOptionDelta, applyFixedHotelOptionPricing, applyFixedTransportUsagePricing, applyTransportUsageOptionPricing, doesHotelVariantMatchField, getHotelVariantForOption, getHotelRoomTypeOptionRate, getAdjustedHotelRoomTypeRate, getInferredHotelMaxOccupancy, scoreHotelVariantMatch, resolveHotelVariantSelection } from './pricing';

﻿export const pageShellVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.06,
    },
  },
};

export const sectionRevealVariants = {
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

export const sideStackVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const rightCardVariants = {
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

export const INDIAN_DESTINATION_KEYWORDS = [
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

export const DEFAULT_EXCHANGE_RATES = Object.freeze({
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

export const CURRENCY_LABELS = Object.freeze({
  INR: "\u20B9",
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
export const DESTINATION_ALIAS_GROUPS = [
  [
    "dharamshala",
    "dharamsala",
    "mcleod ganj",
    "mcleodganj",
    "mc leod ganj",
    "mcleodgunj",
  ],
];
export const WHATSAPP_QUOTATION_BRAND = "Holiday Circuit";
export const WHATSAPP_SECTION_DIVIDER = "----------";
export const WHATSAPP_SUBSECTION_DIVIDER = "-------";
export const DEFAULT_WHATSAPP_TERMS = Object.freeze([
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

export const SHOW_SELECTED_HISTORY_COMPARISON = false;
export const SERVICE_TYPE_LABELS = Object.freeze({
  hotel: "Hotel",
  transfer: "Transport",
  car: "Transport",
  activity: "Activity",
  sightseeing: "Sightseeing",
});

export const CONTRACTED_RATE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hotel", label: "Hotels" },
  { value: "transfer", label: "Transport" },
  { value: "activity", label: "Activities" },
  { value: "sightseeing", label: "Sightseeing" },
];

export const HOTEL_ROOM_TYPE_OPTIONS = [
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

export const HOTEL_ROOM_CATEGORY_OPTIONS = [
  "Single",
  "Double",
  "Twin",
  "Triple",
  "Quad",
  "Family",
  "Interconnecting",
];

export const HOTEL_BED_TYPE_OPTIONS = [
  { value: "king-bed", label: "King Bed" },
  { value: "queen-bed", label: "Queen Bed" },
  { value: "twin-beds", label: "Twin Beds" },
  { value: "double-bed", label: "Double Bed" },
  { value: "single-bed", label: "Single Bed" },
  { value: "extra-bed-rollaway-bed", label: "Extra Bed / Rollaway Bed" },
];

export const HOTEL_ROOM_TYPE_FIXED_PRICES = Object.freeze({
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

export const HOTEL_BED_TYPE_FIXED_PRICES = Object.freeze({
  "king-bed": 7000,
  "queen-bed": 6500,
  "twin-beds": 6200,
  "double-bed": 6000,
  "single-bed": 4500,
  "extra-bed-rollaway-bed": 3000,
});

export const TRANSPORT_USAGE_OPTIONS = Object.freeze([
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

export const TRANSPORT_USAGE_LIMIT_OPTIONS = Object.freeze({
  "full-day": [
    { value: "full-day-80-km", label: "80 km" },
    { value: "full-day-8-hours", label: "8 hours" },
  ],
  "half-day": [
    { value: "half-day-40-km", label: "40 km" },
    { value: "half-day-4-hours", label: "4 hours" },
  ],
});

export const TRANSPORT_USAGE_FIXED_PRICES = Object.freeze(
  TRANSPORT_USAGE_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.value] = option.price;
    if (!accumulator[option.usageType]) {
      accumulator[option.usageType] = option.price;
    }
    return accumulator;
  }, {}),
);

export const TRANSPORT_USAGE_OPTION_LABELS = Object.freeze(
  TRANSPORT_USAGE_OPTIONS.reduce((accumulator, option) => {
    accumulator[option.value] = option.label;
    return accumulator;
  }, {}),
);
