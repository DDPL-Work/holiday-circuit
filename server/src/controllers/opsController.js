import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravelQuery.model.js";
import Quotation from "../models/quotation.model.js";
import Invoice from "../models/invoice.model.js";
import Counter from "../models/counter.model.js"
import Hotel from "../models/hotelDmc.model.js";
import Activity from "../models/activityDmc.model.js";
import Transfer from "../models/transferDmc.model.js";
import Notification from "../models/notification.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js"
import Confirmation from "../models/dmcConfirmation.js";
import { sendAgentClientQuotationMail, sendEmailVoucher } from "../services/emailService.js";
import {sendWhatsAppMessage}  from "../services/whatsappService.js";
import mongoose from "mongoose";
import Voucher from "../models/voucher.model.js";
import Auth from "../models/auth.model.js";

const OPS_DASHBOARD_PENDING_STATUSES = ["New_Query", "Pending_Accept", "Revision_Query"];
const OPS_DASHBOARD_ACTIVE_BOOKING_STATUSES = ["Booking_Accepted", "Invoice_Requested", "Confirmed"];
const OPS_DASHBOARD_RESPONSE_ACTIONS = new Set([
  "Query Accepted",
  "Query Rejected",
  "Quotation Started",
  "Quote Sent",
  "Passed to Admin",
  "Traveler Documents Verified",
  "Voucher Sent",
  "Invoice Generated",
]);

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const shiftDays = (value, days) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const isDateWithinRange = (value, start, endExclusive) => {
  if (!value) return false;
  const date = new Date(value);
  if (!isValidDate(date)) return false;
  return date >= start && date < endExclusive;
};

const safePercent = (part, total) => {
  const safeTotal = Number(total || 0);
  if (!safeTotal) return 0;
  return (Number(part || 0) / safeTotal) * 100;
};

const clampPercent = (value) =>
  Math.max(0, Math.min(100, Math.round(Number(value || 0))));

const formatCompactHours = (hours) => {
  const safeHours = Number(hours || 0);

  if (!safeHours) return "0h";
  if (safeHours < 1) return `${Math.max(1, Math.round(safeHours * 60))}m`;
  if (safeHours < 10) return `${safeHours.toFixed(1).replace(/\.0$/, "")}h`;

  return `${Math.round(safeHours)}h`;
};

const formatVoucherPerDay = (value) => {
  const safeValue = Number(value || 0);
  if (!safeValue) return "0";
  if (safeValue < 10) return safeValue.toFixed(1).replace(/\.0$/, "");
  return `${Math.round(safeValue)}`;
};

const buildTrendMeta = (current = 0, previous = 0, fallbackText = "No change from last week") => {
  const safeCurrent = Number(current || 0);
  const safePrevious = Number(previous || 0);

  if (!safeCurrent && !safePrevious) {
    return { text: fallbackText, trend: "neutral" };
  }

  if (!safePrevious) {
    return {
      text: safeCurrent > 0 ? "+100% from last week" : fallbackText,
      trend: safeCurrent > 0 ? "up" : "neutral",
    };
  }

  const percent = Math.round(((safeCurrent - safePrevious) / safePrevious) * 100);
  if (!percent) {
    return { text: fallbackText, trend: "neutral" };
  }

  return {
    text: `${percent > 0 ? "+" : "-"}${Math.abs(percent)}% from last week`,
    trend: percent > 0 ? "up" : "down",
  };
};

const getQuoteSentAtForDashboard = (query = {}) => {
  const sentEntry = Array.isArray(query?.activityLog)
    ? query.activityLog.find((entry) => String(entry?.action || "").trim() === "Quote Sent")
    : null;

  return sentEntry?.timestamp ? new Date(sentEntry.timestamp) : null;
};

const getFirstOpsResponseAt = (query = {}) => {
  const timestamps = (Array.isArray(query?.activityLog) ? query.activityLog : [])
    .filter((entry) => OPS_DASHBOARD_RESPONSE_ACTIONS.has(String(entry?.action || "").trim()))
    .map((entry) => (entry?.timestamp ? new Date(entry.timestamp) : null))
    .filter(isValidDate)
    .sort((left, right) => left.getTime() - right.getTime());

  return timestamps[0] || null;
};

const isConvertedOpsQuery = (query = {}) =>
  ["Client Approved", "Confirmed"].includes(String(query?.agentStatus || "").trim()) ||
  ["Confirmed", "Vouchered"].includes(String(query?.opsStatus || "").trim());

const isHandledOpsQuery = (query = {}) => {
  const opsStatus = String(query?.opsStatus || "").trim();
  const quotationStatus = String(query?.quotationStatus || "").trim();

  if (OPS_DASHBOARD_PENDING_STATUSES.includes(opsStatus)) {
    return quotationStatus === "Quotation_Created" || Boolean(getFirstOpsResponseAt(query));
  }

  return true;
};

const buildPendingActionsConditions = () => ([
  { opsStatus: { $in: OPS_DASHBOARD_PENDING_STATUSES } },
  { "travelerDocumentVerification.status": "Pending" },
  { "adminCoordination.status": "pending_admin_reply" },
  {
    $and: [
      { opsStatus: "Confirmed" },
      {
        $or: [
          { voucherStatus: "ready" },
          { voucherStatus: { $exists: false } },
        ],
      },
    ],
  },
]);

const hasPendingActionQuery = (query = {}) => {
  const opsStatus = String(query?.opsStatus || "").trim();
  const verificationStatus = String(query?.travelerDocumentVerification?.status || "").trim();
  const adminCoordinationStatus = String(query?.adminCoordination?.status || "").trim();
  const voucherStatus = String(query?.voucherStatus || "").trim();

  return (
    OPS_DASHBOARD_PENDING_STATUSES.includes(opsStatus) ||
    verificationStatus === "Pending" ||
    adminCoordinationStatus === "pending_admin_reply" ||
    (opsStatus === "Confirmed" && (!voucherStatus || voucherStatus === "ready"))
  );
};

const buildDashboardActivityPresentation = (action = "") => {
  const normalizedAction = String(action || "").trim();

  if (normalizedAction === "Query Created") {
    return { title: "New Query", tag: "New", variant: "new" };
  }

  if (normalizedAction === "Query Accepted") {
    return { title: "Booking Accepted", tag: "Accepted", variant: "accepted" };
  }

  if (normalizedAction === "Quotation Started") {
    return { title: "Quotation Started", tag: "Drafting", variant: "draft" };
  }

  if (normalizedAction === "Quote Sent") {
    return { title: "Quotation Sent", tag: "Quoted", variant: "quoted" };
  }

  if (normalizedAction === "Voucher Generated") {
    return { title: "Voucher Generated", tag: "Vouchered", variant: "voucher" };
  }

  if (normalizedAction === "Voucher Sent") {
    return { title: "Voucher Sent", tag: "Sent", variant: "sent" };
  }

  if (normalizedAction === "Traveler Documents Verified") {
    return { title: "Documents Verified", tag: "Verified", variant: "verified" };
  }

  if (normalizedAction === "Query Rejected") {
    return { title: "Query Rejected", tag: "Rejected", variant: "rejected" };
  }

  if (normalizedAction === "Passed to Admin") {
    return { title: "Passed to Admin", tag: "Escalated", variant: "escalated" };
  }

  if (normalizedAction === "Invoice Generated") {
    return { title: "Invoice Generated", tag: "Invoiced", variant: "invoice" };
  }

  return {
    title: normalizedAction || "Activity Updated",
    tag: "Updated",
    variant: "updated",
  };
};

const buildOpsDashboardActivityFeed = (queries = []) =>
  queries
    .flatMap((query) => {
      const company =
        query?.agent?.companyName || query?.agent?.name || "Travel Partner";
      const destination = query?.destination || "Destination pending";
      const entries = [];

      for (const entry of Array.isArray(query?.activityLog) ? query.activityLog : []) {
        const timestamp = entry?.timestamp ? new Date(entry.timestamp) : null;
        if (!isValidDate(timestamp)) continue;

        const presentation = buildDashboardActivityPresentation(entry?.action);
        entries.push({
          id: `${query?._id || query?.queryId || "query"}-${presentation.title}-${timestamp.getTime()}`,
          queryId: query?.queryId || "",
          title: presentation.title,
          tag: presentation.tag,
          variant: presentation.variant,
          company,
          destination,
          occurredAt: timestamp,
        });
      }

      if (query?.voucherGeneratedAt) {
        const voucherGeneratedAt = new Date(query.voucherGeneratedAt);
        const alreadyLogged = entries.some((item) => item.title === "Voucher Generated");

        if (isValidDate(voucherGeneratedAt) && !alreadyLogged) {
          const presentation = buildDashboardActivityPresentation("Voucher Generated");
          entries.push({
            id: `${query?._id || query?.queryId || "query"}-${presentation.title}-${voucherGeneratedAt.getTime()}`,
            queryId: query?.queryId || "",
            title: presentation.title,
            tag: presentation.tag,
            variant: presentation.variant,
            company,
            destination,
            occurredAt: voucherGeneratedAt,
          });
        }
      }

      if (!entries.length && query?.createdAt) {
        const createdAt = new Date(query.createdAt);

        if (isValidDate(createdAt)) {
          const presentation = buildDashboardActivityPresentation("Query Created");
          entries.push({
            id: `${query?._id || query?.queryId || "query"}-${presentation.title}-${createdAt.getTime()}`,
            queryId: query?.queryId || "",
            title: presentation.title,
            tag: presentation.tag,
            variant: presentation.variant,
            company,
            destination,
            occurredAt: createdAt,
          });
        }
      }

      return entries;
    })
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 5);


const normalizeUsageType = (value) => {
  if (!value) return "point-to-point";

  const v = value.toLowerCase().trim();

  if (v.includes("one") || v.includes("point")) return "point-to-point";
  if (v.includes("round") || v.includes("two")) return "round-trip";
  if (v.includes("full")) return "full-day";
  if (v.includes("half")) return "half-day";

  return "point-to-point";
};

const normalizeBedType = (value) => {
  if (!value) return undefined;

  const normalizedValue = String(value).trim().toLowerCase();

  if (["single", "double", "twin", "triple"].includes(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.includes("king") || normalizedValue.includes("queen")) {
    return "double";
  }

  if (normalizedValue.includes("twin")) {
    return "twin";
  }

  if (normalizedValue.includes("triple")) {
    return "triple";
  }

  if (normalizedValue.includes("single")) {
    return "single";
  }

  return undefined;
};

const normalizeQuotationServiceType = (type) => {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType === "car" || normalizedType === "transport") {
    return "transfer";
  }

  return normalizedType || type;
};

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const calculateHotelServiceTotal = (service = {}) => {
  const nights = Math.max(Number(service?.nights || 0), 0);
  const rooms = Math.max(Number(service?.rooms || 1), 1);
  const perRoomNightRate =
    Number(service?.price || 0) +
    (service?.extraAdult ? Number(service?.awebRate || 0) : 0) +
    (service?.childWithBed ? Number(service?.cwebRate || 0) : 0) +
    (service?.childWithoutBed ? Number(service?.cwoebRate || 0) : 0);

  return roundCurrencyAmount(perRoomNightRate * nights * rooms);
};

const calculateResolvedServiceTotal = (service = {}) => {
  const normalizedType = normalizeQuotationServiceType(service?.type);
  const basePrice = Number(service?.price || 0);

  if (normalizedType === "hotel") {
    return calculateHotelServiceTotal(service);
  }

  if (normalizedType === "transfer") {
    return roundCurrencyAmount(basePrice * Number(service?.days || 1));
  }

  if (normalizedType === "activity") {
    return roundCurrencyAmount(basePrice * Number(service?.pax || 1));
  }

  if (normalizedType === "sightseeing") {
    return roundCurrencyAmount(
      basePrice * Math.max(Number(service?.pax || 1), Number(service?.days || 1)),
    );
  }

  return roundCurrencyAmount(Number(service?.total || basePrice || 0));
};

const scoreHotelVariantCandidate = (candidate = {}, service = {}) => {
  let score = 0;

  const desiredRoomCategory = normalizeComparableText(service?.roomCategory);
  const desiredRoomType = normalizeComparableText(service?.roomType);
  const desiredBedType = normalizeBedType(service?.bedType);
  const candidateRoomCategory = normalizeComparableText(candidate?.roomCategory);
  const candidateRoomType = normalizeComparableText(candidate?.roomType);
  const candidateBedType = normalizeBedType(candidate?.bedType);
  const serviceId = String(service?.serviceId || "").trim();

  if (serviceId && String(candidate?._id || "") === serviceId) {
    score += 5;
  }

  if (desiredRoomCategory && candidateRoomCategory === desiredRoomCategory) {
    score += 120;
  }

  if (desiredRoomType && candidateRoomType === desiredRoomType) {
    score += 120;
  }

  if (desiredBedType && candidateBedType === desiredBedType) {
    score += 120;
  }

  return score;
};

const resolveDynamicHotelServicePricing = async (service = {}) => {
  const normalizedType = normalizeQuotationServiceType(service?.type);

  if (normalizedType !== "hotel") {
    return {
      ...service,
      type: normalizedType,
    };
  }

  const hotelName = String(service?.title || "").trim();
  const city = String(service?.city || "").trim();
  const country = String(service?.country || "").trim();
  const supplierId = String(service?.supplierId || service?.dmcId || "").trim();
  const serviceId = String(service?.serviceId || "").trim();

  const query = {};

  if (hotelName) {
    query.hotelName = hotelName;
  }

  if (city) {
    query.city = city;
  }

  if (country) {
    query.country = country;
  }

  if (mongoose.Types.ObjectId.isValid(supplierId)) {
    query.supplier = supplierId;
  }

  let hotelVariants = [];

  if (Object.keys(query).length) {
    hotelVariants = await Hotel.find(query).lean();
  }

  if (!hotelVariants.length && mongoose.Types.ObjectId.isValid(serviceId)) {
    const fallbackHotel = await Hotel.findById(serviceId).lean();
    if (fallbackHotel) {
      hotelVariants = [fallbackHotel];
    }
  }

  if (!hotelVariants.length) {
    return {
      ...service,
      type: normalizedType,
      bedType: normalizeBedType(service?.bedType),
    };
  }

  const bestVariant =
    hotelVariants
      .map((candidate) => ({
        candidate,
        score: scoreHotelVariantCandidate(candidate, service),
      }))
      .sort((left, right) => right.score - left.score)[0]?.candidate || hotelVariants[0];

  return {
    ...service,
    serviceId: bestVariant?._id?.toString?.() || service?.serviceId,
    supplierId: service?.supplierId || bestVariant?.supplier,
    supplierName: service?.supplierName || bestVariant?.supplierName || "",
    dmcId: service?.dmcId || bestVariant?.supplier,
    dmcName:
      service?.dmcName ||
      service?.supplierName ||
      bestVariant?.supplierName ||
      "",
    type: normalizedType,
    title: service?.title || bestVariant?.hotelName || "",
    city: service?.city || bestVariant?.city || "",
    country: service?.country || bestVariant?.country || "",
    description: service?.description || bestVariant?.description || service?.desc || "",
    roomCategory: bestVariant?.roomCategory || service?.roomCategory || "",
    roomType: bestVariant?.roomType || service?.roomType || "",
    hotelCategory: bestVariant?.hotelCategory || service?.hotelCategory || "",
    bedType: normalizeBedType(bestVariant?.bedType) || normalizeBedType(service?.bedType),
    currency: normalizeCurrencyCode(bestVariant?.currency || service?.currency || "INR"),
    price: Number(bestVariant?.price ?? service?.price ?? 0),
    awebRate: Number(bestVariant?.awebRate || 0),
    cwebRate: Number(bestVariant?.cwebRate || 0),
    cwoebRate: Number(bestVariant?.cwoebRate || 0),
  };
};


const addLogIfNotExists = (query, action, performedBy) => {
  const exists = query.activityLog.some(
    (log) => log.action === action
  );

  if (!exists) {
    query.activityLog.push({
      action,
      performedBy,
      timestamp: new Date()
    });
  }
};

const generateUniqueQuotationNumber = async () => {
  let counter = await Counter.findOne({ name: "quotation" });

  if (!counter) {
    const latestQuotation = await Quotation.findOne({
      quotationNumber: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });

    const latestSeq = latestQuotation?.quotationNumber
      ? parseInt(latestQuotation.quotationNumber.split("-")[1], 10)
      : 1000;

    counter = await Counter.create({
      name: "quotation",
      seq: Number.isNaN(latestSeq) ? 1000 : latestSeq,
    });
  }

  let quotationNumber = "";
  let isUniqueQuotationNumber = false;

  while (!isUniqueQuotationNumber) {
    counter.seq += 1;
    quotationNumber = `QT-${counter.seq}`;

    const existingQuotation = await Quotation.findOne({ quotationNumber });
    if (!existingQuotation) {
      isUniqueQuotationNumber = true;
    }
  }

  await counter.save();
  return quotationNumber;
};

const formatInvoiceLocation = (service = {}) =>
  [service.city, service.country].filter(Boolean).join(", ");

const roundCurrencyAmount = (value) =>
  Number(Number(value || 0).toFixed(2));

const normalizeCurrencyCode = (value) =>
  String(value || "INR").trim().toUpperCase() || "INR";

const getResolvedExchangeRate = (service = {}) => {
  const currency = normalizeCurrencyCode(service?.currency);
  const exchangeRate = Number(service?.exchangeRate || 0);

  if (currency === "INR") return 1;
  if (Number.isFinite(exchangeRate) && exchangeRate > 0) return exchangeRate;

  return 1;
};

const buildInrPricingForService = (service = {}) => {
  const currency = normalizeCurrencyCode(service?.currency);
  const exchangeRate = getResolvedExchangeRate(service);
  const originalPrice = Number(service?.price || 0);
  const originalTotal = Number(service?.total || 0);
  const fallbackPriceInInr =
    currency === "INR"
      ? originalPrice
      : originalPrice * exchangeRate;
  const fallbackTotalInInr =
    currency === "INR"
      ? originalTotal
      : originalTotal * exchangeRate;
  const resolvedPriceInInr = Number(service?.priceInInr || 0);
  const resolvedTotalInInr = Number(service?.totalInInr || 0);

  return {
    currency,
    exchangeRate,
    priceInInr: roundCurrencyAmount(
      resolvedPriceInInr > 0 ? resolvedPriceInInr : fallbackPriceInInr,
    ),
    totalInInr: roundCurrencyAmount(
      resolvedTotalInInr > 0 ? resolvedTotalInInr : fallbackTotalInInr,
    ),
  };
};

const buildServiceCurrencyBreakdown = (services = []) => {
  const currencyTotals = new Map();

  for (const service of services) {
    const currency = normalizeCurrencyCode(service?.currency);
    if (currency === "INR") continue;

    const entry = currencyTotals.get(currency) || {
      currency,
      amount: 0,
      amountInInr: 0,
      exchangeRate: getResolvedExchangeRate(service),
    };

    entry.amount += Number(service?.total || 0);
    entry.amountInInr += Number(
      service?.totalInInr ?? buildInrPricingForService(service).totalInInr,
    );
    entry.exchangeRate = getResolvedExchangeRate(service);

    currencyTotals.set(currency, entry);
  }

  return Array.from(currencyTotals.values()).map((entry) => ({
    currency: entry.currency,
    amount: roundCurrencyAmount(entry.amount),
    amountInInr: roundCurrencyAmount(entry.amountInInr),
    exchangeRate: roundCurrencyAmount(entry.exchangeRate),
  }));
};

const buildInvoiceLineItems = (quotation) =>
  (quotation?.services || []).map((service) => {
    const inrPricing = buildInrPricingForService(service);
    const originalCurrency = normalizeCurrencyCode(service?.currency);
    const pricingNote =
      originalCurrency !== "INR"
        ? `Original ${originalCurrency} ${Number(service?.total || 0).toLocaleString("en-IN")} @ ${inrPricing.exchangeRate} INR`
        : "";

    return {
      serviceType: service.type || "",
      title: service.title || "",
      location: formatInvoiceLocation(service),
      serviceDate: service.serviceDate || null,
      nights: Number(service.nights || 0),
      days: Number(service.days || 0),
      pax: Number(service.pax || 0),
      rooms: Number(service.rooms || 0),
      adults: Number(service.adults || 0),
      children: Number(service.children || 0),
      currency: "INR",
      unitPrice: Number(inrPricing.priceInInr || 0),
      total: Number(inrPricing.totalInInr || 0),
      notes: [service.description || "", pricingNote].filter(Boolean).join(" | "),
    };
  });

const buildInvoicePricingSnapshot = (quotation, totalAmount) => ({
  currency: quotation?.pricing?.currency || "INR",
  baseAmount: Number(quotation?.pricing?.baseAmount || 0),
  servicesTotal: Number(quotation?.pricing?.subTotal || 0),
  packageTemplateAmount: Number(quotation?.pricing?.packageTemplateAmount || 0),
  opsMarkupPercent: Number(quotation?.pricing?.opsMarkup?.percent || 0),
  opsMarkupAmount: Number(quotation?.pricing?.opsMarkup?.amount || 0),
  serviceCharge: Number(quotation?.pricing?.opsCharges?.serviceCharge || 0),
  handlingFee: Number(quotation?.pricing?.opsCharges?.handlingFee || 0),
  gstPercent: Number(quotation?.pricing?.tax?.gst?.percent || 0),
  gstAmount: Number(quotation?.pricing?.tax?.gst?.amount || 0),
  tcsPercent: Number(quotation?.pricing?.tax?.tcs?.percent || 0),
  tcsAmount: Number(quotation?.pricing?.tax?.tcs?.amount || 0),
  tourismAmount: Number(quotation?.pricing?.tax?.tourismFee?.amount || 0),
  totalTax: Number(quotation?.pricing?.tax?.totalTax || 0),
  grandTotal: Number(totalAmount || 0),
});

const buildInvoiceTripSnapshot = (query) => ({
  queryId: query?.queryId || "",
  destination: query?.destination || "",
  startDate: query?.startDate || null,
  endDate: query?.endDate || null,
  numberOfAdults: Number(query?.numberOfAdults || 0),
  numberOfChildren: Number(query?.numberOfChildren || 0),
});

const formatMailDateLabel = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildTravelerSummary = (query = {}) => {
  const adults = Number(query?.numberOfAdults || 0);
  const children = Number(query?.numberOfChildren || 0);
  const parts = [];

  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);

  return parts.join(", ") || "Traveler details pending";
};

const buildDurationLabel = (query = {}) => {
  const start = query?.startDate ? new Date(query.startDate) : null;
  const end = query?.endDate ? new Date(query.endDate) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const timeDiff = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1);
  const totalNights = Math.max(0, totalDays - 1);

  return `${totalNights} Night${totalNights === 1 ? "" : "s"} / ${totalDays} Day${totalDays === 1 ? "" : "s"}`;
};

const buildServiceQuantityLabel = (service = {}) => {
  const details = [];

  if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
  if (Number(service?.days || 0) > 0) details.push(`${service.days}D`);
  if (Number(service?.rooms || 0) > 0) details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
  if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
  if (Number(service?.passengerCapacity || 0) > 0) details.push(`${service.passengerCapacity} Pax`);
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildServiceLocationLabel = (service = {}) =>
  [service?.city, service?.country].filter(Boolean).join(", ");

const buildAgentQuotationEmailPayload = ({ quotation, query }) => ({
  recipientName:
    query?.agent?.companyName ||
    query?.agent?.name ||
    "Guest",
  agencyName: query?.agent?.companyName || "",
  quotationNumber: quotation?.quotationNumber || "",
  queryId: query?.queryId || "",
  destination: query?.destination || "",
  travelDates: `${formatMailDateLabel(query?.startDate)} - ${formatMailDateLabel(query?.endDate)}`,
  durationLabel: buildDurationLabel(query),
  travelerSummary: buildTravelerSummary(query),
  validTill: formatMailDateLabel(quotation?.validTill),
  totalAmount: Number(quotation?.pricing?.totalAmount || 0),
  currency: quotation?.pricing?.currency || "INR",
  services: Array.isArray(quotation?.services)
    ? quotation.services.map((service) => ({
        title: service?.title || "Service",
        typeLabel: service?.type ? String(service.type).replace(/_/g, " ") : "Travel Service",
        location: buildServiceLocationLabel(service),
        serviceDateLabel: formatMailDateLabel(service?.serviceDate),
        quantityLabel: buildServiceQuantityLabel(service),
        description: String(service?.description || "").replace(/\|/g, " | ").trim(),
      }))
    : [],
});

const getTravelerDocumentVerification = (query = {}) => ({
  status: String(query?.travelerDocumentVerification?.status || "Draft"),
  submittedAt: query?.travelerDocumentVerification?.submittedAt || null,
  reviewedAt: query?.travelerDocumentVerification?.reviewedAt || null,
  reviewedBy: query?.travelerDocumentVerification?.reviewedBy || null,
  reviewedByName: String(query?.travelerDocumentVerification?.reviewedByName || "").trim(),
  rejectionReason: String(query?.travelerDocumentVerification?.rejectionReason || "").trim(),
  rejectionRemarks: String(query?.travelerDocumentVerification?.rejectionRemarks || "").trim(),
  issues: Array.isArray(query?.travelerDocumentVerification?.issues)
    ? query.travelerDocumentVerification.issues.map((issue) => ({
        travelerId: String(issue?.travelerId || "").trim(),
        travelerName: String(issue?.travelerName || "").trim(),
        documentKey: String(issue?.documentKey || "").trim(),
        documentLabel: String(issue?.documentLabel || "").trim(),
      }))
    : [],
});

const isAdminUser = (req) => req.user?.role === "admin";
const isOperationManagerUser = (req) => req.user?.role === "operation_manager";

const getManagerIdentityCandidates = (manager = {}) =>
  [...new Set([
    manager?._id?.toString?.(),
    manager?.id,
    manager?.name,
    manager?.email,
    manager?.employeeId,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean))];

const getAssignedQueryUserId = (query) => {
  const assignedTo = query?.assignedTo;

  if (!assignedTo) return "";
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo instanceof mongoose.Types.ObjectId) return assignedTo.toString();

  return String(assignedTo?._id || assignedTo?.id || assignedTo || "");
};

const getOperationManagerTeamUserIds = async (req) => {
  if (!isOperationManagerUser(req)) {
    return [];
  }

  const manager = await Auth.findById(req.user?.id).select("name email employeeId _id");
  if (!manager) {
    return [];
  }

  const identityCandidates = getManagerIdentityCandidates(manager);
  if (!identityCandidates.length) {
    return [];
  }

  const teamMembers = await Auth.find({
    role: "operations",
    isDeleted: { $ne: true },
    manager: { $in: identityCandidates },
  }).select("_id");

  return teamMembers
    .map((member) => String(member?._id || "").trim())
    .filter(Boolean);
};

const getAssignedQueryFilter = async (req) => {
  if (isAdminUser(req)) {
    return {};
  }

  if (isOperationManagerUser(req)) {
    const teamUserIds = await getOperationManagerTeamUserIds(req);

    if (!teamUserIds.length) {
      return { _id: { $in: [] } };
    }

    return {
      assignedTo: {
        $in: teamUserIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };
  }

  return { assignedTo: new mongoose.Types.ObjectId(req.user.id) };
};

const canManageAssignedQuery = async (req, query) => {
  if (isAdminUser(req)) {
    return true;
  }

  const assignedUserId = getAssignedQueryUserId(query);
  if (!assignedUserId) {
    return false;
  }

  if (isOperationManagerUser(req)) {
    const teamUserIds = await getOperationManagerTeamUserIds(req);
    return teamUserIds.includes(assignedUserId);
  }

  return assignedUserId === String(req.user?.id || "");
};

const getAuthorizedQueryForQuotation = async (quotationId, req) => {
  const quotation = await Quotation.findById(quotationId);

  if (!quotation) {
    throw new ApiError(404, "Quotation not found");
  }

  const query = await TravelQuery.findById(quotation.queryId);

  if (!query) {
    throw new ApiError(404, "Related query not found");
  }

  const isAllowed = await canManageAssignedQuery(req, query);
  if (!isAllowed) {
    throw new ApiError(403, "Not authorized");
  }

  return { quotation, query };
};


/* =========================GET ALL QUERIES (OPS) ========================= */

export const getAllQueries = async (req, res, next) => {
  try {
    const queryFilter = await getAssignedQueryFilter(req);

    const queries = await TravelQuery.find(queryFilter)
    
      .populate("agent", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Assigned queries fetched successfully",
      queries
    });
  } catch (error) {
    next(error);
  }
};

export const getOpsDashboard = async (req, res, next) => {
  try {
    const queryFilter = await getAssignedQueryFilter(req);
    const now = new Date();
    const todayStart = startOfDay(now);
    const currentWeekStart = shiftDays(todayStart, -7);
    const previousWeekStart = shiftDays(currentWeekStart, -7);
    const performanceLookbackStart = shiftDays(todayStart, -30);
    const activityLookbackStart = shiftDays(todayStart, -45);
    const pendingActionConditions = buildPendingActionsConditions();

    const [
      pendingQueriesCount,
      activeBookingsCount,
      vouchersGeneratedCount,
      pendingActionsCount,
      pendingCurrentWindowCount,
      pendingPreviousWindowCount,
      activeCurrentWindowCount,
      activePreviousWindowCount,
      vouchersCurrentWindowCount,
      vouchersPreviousWindowCount,
      pendingActionsCurrentWindowCount,
      pendingActionsPreviousWindowCount,
      dashboardQueries,
      activityQueries,
    ] = await Promise.all([
      TravelQuery.countDocuments({
        ...queryFilter,
        opsStatus: { $in: OPS_DASHBOARD_PENDING_STATUSES },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        opsStatus: { $in: OPS_DASHBOARD_ACTIVE_BOOKING_STATUSES },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        voucherStatus: { $in: ["generated", "sent"] },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        $or: pendingActionConditions,
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        opsStatus: { $in: OPS_DASHBOARD_PENDING_STATUSES },
        createdAt: { $gte: currentWeekStart, $lt: now },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        opsStatus: { $in: OPS_DASHBOARD_PENDING_STATUSES },
        createdAt: { $gte: previousWeekStart, $lt: currentWeekStart },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        opsStatus: { $in: OPS_DASHBOARD_ACTIVE_BOOKING_STATUSES },
        updatedAt: { $gte: currentWeekStart, $lt: now },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        opsStatus: { $in: OPS_DASHBOARD_ACTIVE_BOOKING_STATUSES },
        updatedAt: { $gte: previousWeekStart, $lt: currentWeekStart },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        voucherGeneratedAt: { $gte: currentWeekStart, $lt: now },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        voucherGeneratedAt: { $gte: previousWeekStart, $lt: currentWeekStart },
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        $and: [
          { $or: pendingActionConditions },
          { updatedAt: { $gte: currentWeekStart, $lt: now } },
        ],
      }),
      TravelQuery.countDocuments({
        ...queryFilter,
        $and: [
          { $or: pendingActionConditions },
          { updatedAt: { $gte: previousWeekStart, $lt: currentWeekStart } },
        ],
      }),
      TravelQuery.find({
        ...queryFilter,
        updatedAt: { $gte: performanceLookbackStart },
      })
        .select(
          "queryId destination createdAt updatedAt opsStatus agentStatus quotationStatus voucherStatus voucherGeneratedAt travelerDocumentVerification adminCoordination activityLog agent",
        )
        .populate("agent", "name companyName email")
        .sort({ updatedAt: -1 })
        .lean(),
      TravelQuery.find({
        ...queryFilter,
        updatedAt: { $gte: activityLookbackStart },
      })
        .select("queryId destination createdAt updatedAt voucherGeneratedAt activityLog agent")
        .populate("agent", "name companyName email")
        .sort({ updatedAt: -1 })
        .limit(120)
        .lean(),
    ]);

    const handledScopeQueries = dashboardQueries.filter(
      (query) =>
        isDateWithinRange(query?.createdAt, performanceLookbackStart, now) ||
        isDateWithinRange(query?.updatedAt, performanceLookbackStart, now) ||
        isDateWithinRange(query?.voucherGeneratedAt, performanceLookbackStart, now) ||
        isDateWithinRange(getQuoteSentAtForDashboard(query), performanceLookbackStart, now),
    );

    const handledRate = clampPercent(
      safePercent(
        handledScopeQueries.filter((query) => isHandledOpsQuery(query)).length,
        handledScopeQueries.length,
      ),
    );

    const responseDurations = dashboardQueries
      .map((query) => {
        const createdAt = query?.createdAt ? new Date(query.createdAt) : null;
        const firstResponseAt = getFirstOpsResponseAt(query);

        if (!isValidDate(createdAt) || !isValidDate(firstResponseAt)) {
          return null;
        }

        if (!isDateWithinRange(firstResponseAt, performanceLookbackStart, now)) {
          return null;
        }

        const diffInHours = (firstResponseAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffInHours >= 0 ? diffInHours : null;
      })
      .filter((value) => value !== null);

    const avgResponseHours = responseDurations.length
      ? responseDurations.reduce((total, value) => total + value, 0) / responseDurations.length
      : 0;

    const vouchersGeneratedInLookback = dashboardQueries.filter((query) =>
      isDateWithinRange(query?.voucherGeneratedAt, performanceLookbackStart, now),
    ).length;
    const vouchersPerDay = vouchersGeneratedInLookback / 30;

    const recentActivity = buildOpsDashboardActivityFeed(activityQueries);

    const dashboardPayload = {
      generatedAt: now,
      headerTitle: "OPS-DASHBOARD",
      stats: {
        pendingQueries: {
          value: pendingQueriesCount,
          ...buildTrendMeta(pendingCurrentWindowCount, pendingPreviousWindowCount),
        },
        activeBookings: {
          value: activeBookingsCount,
          ...buildTrendMeta(activeCurrentWindowCount, activePreviousWindowCount),
        },
        vouchersGenerated: {
          value: vouchersGeneratedCount,
          ...buildTrendMeta(vouchersCurrentWindowCount, vouchersPreviousWindowCount),
        },
        pendingActions: {
          value: pendingActionsCount,
          ...buildTrendMeta(pendingActionsCurrentWindowCount, pendingActionsPreviousWindowCount),
        },
      },
      recentActivity: recentActivity.map((item) => ({
        ...item,
        occurredAt: item.occurredAt,
      })),
      performance: {
        queriesHandled: {
          label: "Queries Handled",
          value: `${handledRate}%`,
          progress: handledRate,
        },
        avgResponseTime: {
          label: "Avg. Response Time",
          value: formatCompactHours(avgResponseHours),
          progress: clampPercent(100 - safePercent(avgResponseHours, 48)),
        },
        vouchersPerDay: {
          label: "Vouchers / Day",
          value: formatVoucherPerDay(vouchersPerDay),
          progress: clampPercent(safePercent(vouchersPerDay, 5)),
        },
      },
      meta: {
        scopeDays: 30,
        pendingActionCount: dashboardQueries.filter((query) => hasPendingActionQuery(query)).length,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardPayload,
    });
  } catch (error) {
    next(error);
  }
};


// ==================== Reject Query by Ops ==================================

export const rejectQueryByOps = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      console.log("USER ID:", req.user.id);
      return next(new ApiError(403, "Unauthorized"));
    }

    if (query.opsStatus === "Pending_Accept") {
      return res.json({ success: true, query });
    }

    query.opsStatus = "Pending_Accept";
    query.agentStatus = "Revision Requested";
    query.rejectionNote = reason;

   query.activityLog.push({action: "Query Rejected", performedBy: req.user.name || "Operations", timestamp: new Date()});

   await Notification.create({
  user: query.agent,
  type: "warning",
  title: "Query Rejected",
  message: `Your query ${query.queryId} has been rejected by operations.`,
  meta: {
    queryId: query._id,
    queryNumber: query.queryId,
    reason: reason || "",
  },
});

    await query.save();

    res.json({
      success: true,
      message: "Query rejected",
      query
    });

  } catch (error) {
    next(error);
  }
};

// ========================== Accept Query By Ops ==============================

export const acceptQueryByOps = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      console.log("USER ID:", req.user.id);
      return next(new ApiError(403, "Not authorized"));
    }

    if (["Booking_Accepted", "Confirmed", "Vouchered"].includes(query.opsStatus)) {
      return next(new ApiError(400, "Booking already accepted"));
    }

    if (!["Pending_Accept", "New_Query", "Rejected"].includes(query.opsStatus)) {
      return next(new ApiError(400, "This booking cannot be accepted now"));
    }

    query.opsStatus = "Booking_Accepted";
    query.agentStatus = "In Progress";
    query.rejectionNote = undefined;

    addLogIfNotExists(query, "Query Accepted", "Operations");

    await Notification.create({
  user: query.agent,
  type: "success",
  title: "Query Accepted",
  message: `Your query ${query.queryId} has been accepted by operations.`,
  meta: {
    queryId: query._id,
    queryNumber: query.queryId,
  },
});

    await query.save();

    res.json({ success: true, query });

  } catch (error) {
    next(error);
  }
};

export const reviewTravelerDocumentsByOps = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason = "", remarks = "", issues = [] } = req.body;

    const query = await TravelQuery.findById(id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return next(new ApiError(403, "Not authorized"));
    }

    const currentVerification = getTravelerDocumentVerification(query);

    if (currentVerification.status !== "Pending") {
      return next(new ApiError(400, "Traveler documents are not awaiting ops review"));
    }

    const normalizedAction = String(action || "").trim().toUpperCase();
    const reviewerName = req.user?.name || "Operations";
    const reviewedAt = new Date();

    if (normalizedAction === "APPROVE") {
      query.travelerDocumentVerification = {
        status: "Verified",
        submittedAt: currentVerification.submittedAt || reviewedAt,
        reviewedAt,
        reviewedBy: req.user.id,
        reviewedByName: reviewerName,
        rejectionReason: "",
        rejectionRemarks: "",
        issues: [],
      };
      query.activityLog.push({
        action: "Traveler Documents Verified",
        performedBy: reviewerName,
        timestamp: reviewedAt,
      });
      query.travelerDocumentAuditTrail.push({
        action: "Verified by operations",
        status: "Verified",
        performedBy: req.user.id,
        performedByName: reviewerName,
        remarks: String(remarks || "").trim(),
        performedAt: reviewedAt,
      });

      await query.save();

      await Notification.create({
        user: query.agent,
        type: "success",
        title: "Traveler Documents Verified",
        message: `Operations verified the traveler documents for ${query.queryId}.`,
        meta: {
          queryId: query._id,
          queryNumber: query.queryId,
          verificationStatus: "Verified",
        },
      });

      return res.json({
        success: true,
        message: "Traveler documents verified successfully",
        query,
      });
    }

    if (normalizedAction === "REJECT") {
      const rejectionReason = String(reason || "").trim();
      const rejectionRemarks = String(remarks || "").trim();
      const normalizedIssues = Array.isArray(issues)
        ? issues
            .map((issue) => ({
              travelerId: String(issue?.travelerId || "").trim(),
              travelerName: String(issue?.travelerName || "").trim(),
              documentKey: String(issue?.documentKey || "").trim(),
              documentLabel: String(issue?.documentLabel || "").trim(),
            }))
            .filter((issue) => issue.travelerId && issue.documentKey)
        : [];

      if (!rejectionReason) {
        return next(new ApiError(400, "Rejection reason is required"));
      }

      query.travelerDocumentVerification = {
        status: "Rejected",
        submittedAt: currentVerification.submittedAt || reviewedAt,
        reviewedAt,
        reviewedBy: req.user.id,
        reviewedByName: reviewerName,
        rejectionReason,
        rejectionRemarks,
        issues: normalizedIssues,
      };
      query.activityLog.push({
        action: "Traveler Documents Rejected",
        performedBy: reviewerName,
        timestamp: reviewedAt,
      });
      query.travelerDocumentAuditTrail.push({
        action: "Rejected by operations",
        status: "Rejected",
        performedBy: req.user.id,
        performedByName: reviewerName,
        remarks: [rejectionReason, rejectionRemarks].filter(Boolean).join(" | "),
        performedAt: reviewedAt,
      });

      await query.save();

      await Notification.create({
        user: query.agent,
        type: "warning",
        title: "Traveler Documents Rejected",
        message: `Operations requested traveler document corrections for ${query.queryId}.`,
        meta: {
          queryId: query._id,
          queryNumber: query.queryId,
          verificationStatus: "Rejected",
          rejectionReason,
          rejectionRemarks,
          issues: normalizedIssues,
        },
      });

      return res.json({
        success: true,
        message: "Traveler documents rejected and sent back to agent",
        query,
      });
    }

    return next(new ApiError(400, "Invalid review action"));
  } catch (error) {
    next(error);
  }
};


//========================================= Accept Query ================================================

// export const acceptQuery = async (req, res) => {
//   try {
//     const query = await TravelQuery.findById(req.params.id);

//     if (!query) {
//       return res.status(404).json({ message: "Query not found" });
//     }

//     const createLog = (action, performedBy) => ({action,performedBy,timestamp: new Date()});

//     query.opsStatus = "Booking_Accepted";
//     // addLogIfNotExists(query, "Query Accepted", "Ops");
//    query.activityLog.push({
//   action: "Query Accepted",
//   performedBy: "Ops",
//   timestamp: new Date()
// });
 
//     await query.save();

//     res.json({ success: true, message: "Query accepted" });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



export const startQuotation = async (req, res) => {
  const query = await TravelQuery.findById(req.params.id);
  const isAllowed = await canManageAssignedQuery(req, query);

  if (!query) {
    return res.status(404).json({ success: false, message: "Query not found" });
  }

  if (!isAllowed) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  query.quotationStatus = "Quotation_Created";
  addLogIfNotExists(query, "Quotation Started", "Ops");
  // query.activityLog.push(createLog("Quotation Started", "Ops"));

  await query.save();

  res.json({ success: true });
};


export const sendQuotation = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found"
      });
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // optional safety
    if (query.quotationStatus === "Sent_To_Agent") {return res.status(400).json({
        success: false,
        message: "Quotation already sent"
      });
    }

    // ✅ quotation sent, but booking is not confirmed until agent approves the client decision
    query.opsStatus = "Booking_Accepted";
    query.quotationStatus = "Sent_To_Agent";
    query.agentStatus = "Quote Sent";

    // Keep "Quote Sent" as a single timeline event even if resend happens.
    addLogIfNotExists(query, "Quote Sent", "Ops");

    await query.save();

    res.json({ success: true });

  } catch (error) {
    console.error("Send Quotation Error:", error);
    next(error);
  }
};



export const passToAdmin = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return next(new ApiError(403, "Not authorized"));
    }

    const note = String(req.body?.note || "").trim();

    if (!note) {
      return next(new ApiError(400, "Note for admin is required"));
    }

    const actorName = req.user?.name || req.user?.email || "Operations";
    const createdAt = new Date();

    query.activityLog = Array.isArray(query.activityLog) ? query.activityLog : [];
    query.activityLog.push({
      action: "Passed to Admin",
      performedBy: actorName,
      timestamp: createdAt,
    });

    const currentAdminCoordination =
      query.adminCoordination?.toObject?.() || query.adminCoordination || {};

    query.adminCoordination = {
      ...currentAdminCoordination,
      status: "pending_admin_reply",
      lastOpsMessage: note,
      lastOpsMessageAt: createdAt,
      lastOpsMessageBy: req.user?.id || null,
      lastOpsMessageByName: actorName,
      lastAdminReply: "",
      lastAdminReplyAt: null,
      lastAdminReplyBy: null,
      lastAdminReplyByName: "",
      thread: [
        ...(Array.isArray(currentAdminCoordination.thread) ? currentAdminCoordination.thread : []),
        {
          senderRole: "operations",
          senderId: req.user?.id || null,
          senderName: actorName,
          message: note,
          createdAt,
        },
      ],
    };

    await query.save();

    const adminUsers = await Auth.find({
      role: "admin",
      isDeleted: { $ne: true },
      accountStatus: { $ne: "Inactive" },
    }).select("_id");

    if (adminUsers.length) {
      await Notification.insertMany(
        adminUsers.map((adminUser) => ({
          user: adminUser._id,
          type: "warning",
          title: "Ops escalation received",
          message: `${query.queryId} was passed to admin by ${actorName}.`,
          link: "/ops/order-acceptance",
          meta: {
            queryId: query._id,
            queryNumber: query.queryId,
            note,
            source: "ops_order_acceptance",
          },
        })),
      );
    }

    res.json({
      success: true,
      message: "Query passed to admin successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================UPDATE QUERY STATUS========================= */

export const updateQueryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = await TravelQuery.findById(id);
    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return next(new ApiError(403, "Not authorized"));
    }

    query.status = status;
    await query.save();

    return res.json({message: "Query status updated successfully", query});
  } catch (error) {
    next(error);
  }
};

//==================== Get Order Acceptance Order =====================================

export const getOrderAcceptanceQueries = async (req, res, next) => {
  try {
  const assignmentFilter = await getAssignedQueryFilter(req);

  const queries = await TravelQuery.find({
  ...assignmentFilter,
  opsStatus: { 
    $in: ["Pending_Accept", "New_Query", "Rejected", "Revision_Query", "Booking_Accepted", "Invoice_Requested"]
  }
})
.populate("agent", "name companyName email")
.populate("assignedTo", "name email")
.sort({ createdAt: -1 });

    // Pending orders count
 const pendingOrders = await TravelQuery.countDocuments({
  ...assignmentFilter,
  opsStatus: { $in: ["New_Query", "Pending_Accept", "Revision_Query"] }
});


 let avgResponseTime = "0m";
  if (queries.length > 0) {
  const totalTime = queries.reduce((sum, q) => {
    return sum + (new Date() - new Date(q.createdAt));
  }, 0);
  const avgMs = totalTime / queries.length;
  const totalMinutes = Math.floor(avgMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  avgResponseTime =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

    res.status(200).json({ success: true, pendingOrders, avgResponseTime,queries });

  } catch (error) {
    next(error);
  }
};

/* ========================= CREATE QUOTATION ========================= */

export const createQuotation = async (req, res, next) => {
  try {

    const {
      quotationId,
      queryId,
      validTill,
      pricing,
      sendVia = [] ,
      services = [],
      opsPercent = 0,
      opsAmount = 0,
      serviceCharge = 0,
      handlingFee = 0,
      inclusions = [],
    } = req.body;

    if (!services.length) {
  return next(new ApiError(400, "No services selected"));
}

    const quoteCategory =
      pricing?.quoteCategory === "international"
        ? "international"
        : "domestic";

    const resolvedServices = await Promise.all(services.map(async (service) => {
      const hotelResolvedService = await resolveDynamicHotelServicePricing(service);
      const total = roundCurrencyAmount(calculateResolvedServiceTotal(hotelResolvedService));
      const currency = normalizeCurrencyCode(hotelResolvedService?.currency);
      const inrPricing = buildInrPricingForService({
        ...hotelResolvedService,
        currency,
        total,
      });

      return {
        ...hotelResolvedService,
        currency,
        type: normalizeQuotationServiceType(service.type),
        dmcId: hotelResolvedService.dmcId || hotelResolvedService.supplierId || "",
        dmcName: hotelResolvedService.dmcName || "",
        total,
        exchangeRate: inrPricing.exchangeRate,
        priceInInr: inrPricing.priceInInr,
        totalInInr: inrPricing.totalInInr,
      };
    }));

    const unmappedServices = resolvedServices.filter((service) => !service.dmcId);
    if (unmappedServices.length) {
      return next(
        new ApiError(
          400,
          `DMC owner missing for: ${unmappedServices
            .map((service) => service.title || service.type || "Service")
            .join(", ")}`
        )
      );
    }

    if (!queryId || !validTill || pricing?.baseAmount === undefined || pricing?.baseAmount === null) {
      return next(new ApiError(400, "Required fields are missing"));
    }

   const query = await TravelQuery.findOne({ queryId }).populate("agent");

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return next(new ApiError(403, "Not authorized"));
    }

   let quotation = null;

if (quotationId) {
  const requestedQuotation = await Quotation.findById(quotationId);
  if (
    requestedQuotation &&
    String(requestedQuotation.queryId) === String(query._id) &&
    requestedQuotation.status === "Pending"
  ) {
    quotation = requestedQuotation;
  }
}

if (!quotation) {
  quotation = await Quotation.findOne({
    queryId: query._id,
    status: "Pending",
  }).sort({ createdAt: -1 });
}

let quotationNumber = quotation?.quotationNumber || "";

if (!quotationNumber) {
  quotationNumber = await generateUniqueQuotationNumber();
}


const baseAmount = pricing?.baseAmount;
const packageTemplateAmount = Number(pricing?.packageTemplateAmount || 0);
const taxPayload = req.body.tax || {};
const tourismAmount = Number(taxPayload?.tourismAmount ?? 0);
const servicesTotal = resolvedServices.reduce((sum, s) => {return sum + Number(s.totalInInr || 0)}, 0);
const serviceCurrencyBreakdown = buildServiceCurrencyBreakdown(resolvedServices);
const opsMarkupBasisAmount = Number(servicesTotal + packageTemplateAmount);

    const base = Number(baseAmount || 0);
    console.log("🔥 BASE:", base);
    const ops = Number(opsPercent)
    const opsAmt = Number(opsAmount)
    let finalOpsAmount = 0;
   if (opsAmt > 0) {
  finalOpsAmount = opsAmt;
  } else if (ops > 0) {
  finalOpsAmount = (opsMarkupBasisAmount * ops) / 100;
  }

  console.log("🔥 OPS FINAL:", {
  opsPercent: ops,
  opsAmount: opsAmt,
  finalOpsAmount
});

    const service = Number(serviceCharge || 0);
    const handling = Number(handlingFee || 0);
    const tourismAmt = Number(tourismAmount);
     const subTotal = Number(
      servicesTotal + packageTemplateAmount + finalOpsAmount + service + handling
     );
     
const gstPercent = Number(taxPayload?.gstPercent || 0);
const tcsPercent = Number(taxPayload?.tcsPercent || 0);
const finalGstAmount = Number(taxPayload?.gstAmount || 0);
const finalTcsAmount = Number(taxPayload?.tcsAmount || 0);

const taxTotal = Number(finalGstAmount + finalTcsAmount + tourismAmount);
    // const subTotal = base + opsAmt + service + handling;
const totalAmount = Number(subTotal + taxTotal);

const formattedServices = resolvedServices.map(s => ({
  serviceId: s.serviceId,
  supplierId: s.supplierId || undefined,
  supplierName: s.supplierName || "",
  dmcId: s.dmcId || s.supplierId || undefined,
  dmcName: s.dmcName || "",
  type: s.type,
  title: s.title,

  city: s.city,
  country: s.country,
  description: s.description,
  serviceDate: s.serviceDate || undefined,

  roomCategory: s.roomCategory,
  roomType: s.roomType,
  hotelCategory: s.hotelCategory,
  bedType: normalizeBedType(s.bedType),
  adults: s.adults,
  children: s.children,
  infants: s.infants,

  // HOTEL
  nights: s.nights || 1,
  adults: s.adults || 0,
  children: s.children || 0,
  infants: s.infants || 0,
  rooms: s.rooms || 1,
  bedType: normalizeBedType(s.bedType),

  // TRANSFER
  vehicleType: s.vehicleType,
  passengerCapacity: s.passengerCapacity,
  luggageCapacity: s.luggageCapacity,
  days: s.days || 1,

  // ACTIVITY
  pax: s.pax || 1,

  // PRICE
  currency: s.currency || "INR",
  price: s.price || 0,
  exchangeRate: Number(s.exchangeRate || 1),
  priceInInr: Number(s.priceInInr || 0),
  extraAdult: Boolean(s.extraAdult),
  childWithBed: Boolean(s.childWithBed),
  childWithoutBed: Boolean(s.childWithoutBed),
  awebRate: Number(s.awebRate || 0),
  cwebRate: Number(s.cwebRate || 0),
  cwoebRate: Number(s.cwoebRate || 0),
  total: s.total || 0,
  totalInInr: Number(s.totalInInr || 0),
  usageType: normalizeUsageType(s.usageType)
}));

console.log("🔥 DEBUG:", {
  subTotal,
  gstPercent,
  finalGstAmount,
  tcsPercent,
  finalTcsAmount
});

  if (quotation) {
    quotation.quotationNumber = quotationNumber;
    quotation.queryId = query._id;
    quotation.agent = query.agent;
    quotation.createdBy = req.user.id;
    quotation.inclusions = inclusions;
    quotation.services = formattedServices;
    quotation.pricing = {
      currency: "INR",
      quoteCategory,
      baseAmount: base,
      subTotal: servicesTotal,
      packageTemplateAmount,
      serviceCurrencyBreakdown,
      opsMarkup: {
        percent: ops,
        amount: finalOpsAmount,
      },
      opsCharges: {
        serviceCharge: service,
        handlingFee: handling,
      },
      tax: {
        gst: {
          percent: gstPercent,
          amount: finalGstAmount,
        },
        tcs: {
          percent: tcsPercent,
          amount: finalTcsAmount,
        },
        tourismFee: {
          amount: tourismAmount,
        },
        totalTax: taxTotal,
      },
      totalAmount: totalAmount,
    };
    quotation.validTill = validTill;
    quotation.status = "Quote Sent";
    await quotation.save();

    const quoteDetails = {
      name: query.agent?.name,
      agentName: query.agent?.name,
      destination: query.destination,
      days: query.totalDays || 5,
      price: totalAmount,
      totalAmount: totalAmount,
      validTill: new Date(validTill).toDateString(),
      phone: query.agent?.phone,
    };

    if (isNaN(totalAmount)) {
      return next(new ApiError(400, "Total amount calculation failed"));
    }

    const sendViaArray = Array.isArray(sendVia) ? sendVia : [sendVia];
    const deliveryWarnings = [];

    if (sendViaArray.includes("email")) {
      try {
        await sendAgentClientQuotationMail(
          query.agent.email,
          buildAgentQuotationEmailPayload({ quotation, query }),
        );
      } catch (emailError) {
        console.error("Quotation email send failed:", emailError);
        deliveryWarnings.push("Quotation saved, but email delivery failed. Please verify SMTP credentials.");
      }
    }

    if (sendViaArray.includes("whatsapp")) {
      await sendWhatsAppMessage(quoteDetails);
    }

    await Notification.create({
      user: query.agent._id,
      type: "success",
      title: "Quotation Received",
      message: `Quotation ${quotation.quotationNumber} has been sent for ${query.destination}.`,
      meta: {
        quotationId: quotation._id,
        queryId: query._id,
        quotationNumber: quotation.quotationNumber,
        destination: query.destination,
        totalAmount,
      },
    });

    query.quotationStatus = "Sent_To_Agent";
    if (!["Confirmed", "Vouchered"].includes(query.opsStatus)) {
      query.opsStatus = "Booking_Accepted";
    }
    query.agentStatus = "Quote Sent";
    addLogIfNotExists(query, "Quote Sent", "Ops Team");

    await query.save();

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation,
      warnings: deliveryWarnings,
    });
  }

  const createdQuotation = await Quotation.create({
  quotationNumber,
  queryId: query._id,
  agent: query.agent,
  createdBy: req.user.id,

  inclusions,

  services: formattedServices,   // ✅ ADD THIS

  pricing: {
    currency: "INR",
    quoteCategory,
    baseAmount: base,
    subTotal: servicesTotal,
    packageTemplateAmount,
    serviceCurrencyBreakdown,
    opsMarkup:{
    percent: ops,
    amount:finalOpsAmount,
    },
    opsCharges: {
      serviceCharge: service,
      handlingFee: handling
    },
   tax: {
  gst: {
    percent: gstPercent,
    amount: finalGstAmount
  },
  tcs: {
    percent: tcsPercent,
    amount: finalTcsAmount
  },
  tourismFee: {
    amount: tourismAmount
  },
  totalTax: taxTotal
},
totalAmount: totalAmount
},

  validTill,
  status: "Quote Sent"
});

const quoteDetails = {
  name: query.agent?.name,
  agentName: query.agent?.name,
  destination: query.destination,
  days: query.totalDays || 5,
  price: totalAmount,
  totalAmount: totalAmount,
  validTill: new Date(validTill).toDateString(),
  phone: query.agent?.phone,
};

if (isNaN(totalAmount)) {
  return next(new ApiError(400, "Total amount calculation failed"));
}
// 🔥 SEND EMAIL / WHATSAPP BASED ON USER SELECTION
const sendViaArray = Array.isArray(sendVia) ? sendVia : [sendVia];
const deliveryWarnings = [];

if (sendViaArray.includes("email")) {
  try {
    await sendAgentClientQuotationMail(
      query.agent.email,
      buildAgentQuotationEmailPayload({ quotation: createdQuotation, query }),
    );
  } catch (emailError) {
    console.error("Quotation email send failed:", emailError);
    deliveryWarnings.push("Quotation saved, but email delivery failed. Please verify SMTP credentials.");
  }
}

if (sendViaArray.includes("whatsapp")) {
  await sendWhatsAppMessage(quoteDetails);
}

await Notification.create({
  user: query.agent._id,
  type: "success",
  title: "Quotation Received",
  message: `Quotation ${createdQuotation.quotationNumber} has been sent for ${query.destination}.`,
  meta: {
    quotationId: createdQuotation._id,
    queryId: query._id,
    quotationNumber: createdQuotation.quotationNumber,
    destination: query.destination,
    totalAmount,
  },
});

    query.quotationStatus = "Sent_To_Agent";
    if (!["Confirmed", "Vouchered"].includes(query.opsStatus)) {
      query.opsStatus = "Booking_Accepted";
    }
    query.agentStatus = "Quote Sent";

    // Keep "Quote Sent" as a single timeline event even if multiple quotations are created/sent.
    addLogIfNotExists(query, "Quote Sent", "Ops Team");

    await query.save();

    res.status(201).json({
      success: true,
      message : "Quotation created successfully",
      quotation: createdQuotation,
      warnings: deliveryWarnings,
    });

  } catch (error) {
    next(error);
  }
};

/* =========================ADD QUOTATION ITEM========================= */

export const addQuotationItem = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { inclusions } = req.body;

    if (!inclusions) {
      return next(new ApiError(400, "Inclusions are required"));
    }

    const { quotation } = await getAuthorizedQueryForQuotation(quotationId, req);

    //CASE 1: array
    if (Array.isArray(inclusions)) {
      quotation.inclusions.push(...inclusions);
    }
    //CASE 2: single string 
    else {
      quotation.inclusions.push(inclusions);
    }

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Inclusions added successfully",
      quotation,
    });
  } catch (error) {
    next(error);
  }
};

/* ========================REVISE QUOTATION ========================= */

export const reviseQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { quotation } = await getAuthorizedQueryForQuotation(id, req);

    quotation.revision = (quotation.revision || 0) + 1;
    quotation.status = "Revision Requested";

    await quotation.save();

    return res.json({
      message: "Quotation revised successfully",
      quotation,
    });
  } catch (error) {
    next(error);
  }
};


/* ========================= GENERATE INVOICE ========================= */
export const generateInvoice = async (req, res, next) => {
  try {
    const { quotationId } = req.body;

    if (!quotationId) {
      return next(new ApiError(400, "Quotation ID is required"));
    }

    // 1️⃣ Quotation fetch
    const quotation = await Quotation.findById(quotationId)
      .populate("queryId")
      .populate("agent", "name email companyName");

    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    const query = quotation.queryId;

    if (!query) {
      return next(new ApiError(404, "Related travel query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return next(new ApiError(403, "Not authorized"));
    }

    if (
      quotation.status !== "Confirmed" &&
      !["Client Approved", "Confirmed"].includes(query.agentStatus) &&
      query.opsStatus !== "Invoice_Requested"
    ) {
      return next(
        new ApiError(
          400,
          "Final invoice can be generated only after the agent confirms the quotation",
        ),
      );
    }

    const existingUnverifiedInvoice = await Invoice.findOne({
      query: query._id,
      "paymentVerification.status": { $in: ["Pending", "Rejected"] },
    });

    if (existingUnverifiedInvoice) {
      return next(
        new ApiError(
          400,
          "Invoice workflow is blocked until the previous payment verification is completed by finance",
        ),
      );
    }
      
    let counter = await Counter.findOne({ name: "invoice" });

if (!counter) {
  // first time
  counter = await Counter.create({
    name: "invoice",
    seq: 1000
  });
}

// increment
counter.seq += 1;
await counter.save();

const invoiceNumber = `INV-${counter.seq}`;
    const finalInvoiceAmount = Number(
      quotation.clientTotalAmount ||
      quotation.pricing?.totalAmount ||
      quotation.totalAmount ||
      0,
    );
    const lineItems = buildInvoiceLineItems(quotation);
    const pricingSnapshot = buildInvoicePricingSnapshot(quotation, finalInvoiceAmount);
    const tripSnapshot = buildInvoiceTripSnapshot(query);

    // Invoice create
    const invoice = await Invoice.create({
      query: query._id,
      agent: quotation.agent,
      quotation: quotation._id,
      generatedBy: req.user.id,        // ops / admin
      invoiceNumber,
      invoiceType: req.user.role,       // "operations" or "admin"
      totalAmount: finalInvoiceAmount,
      currency: pricingSnapshot.currency || "INR",
      lineItems,
      pricingSnapshot,
      tripSnapshot,
      templateVariant: "grand-ledger",
      paymentStatus: "Pending"
    });

    if (query.opsStatus !== "Vouchered") {
      query.opsStatus = "Invoice_Requested";
    }
    if (query.agentStatus !== "Confirmed") {
      query.agentStatus = "Client Approved";
    }
    addLogIfNotExists(query, "Invoice Generated", "Ops Team");
    await query.save();

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      invoice
    });

  } catch (error) {
    next(error);
  }
};

//============================= Search by destination, package name, or services=======================

export const searchServices = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: "Query is required" });

    const regex = new RegExp(query, 'i'); // case-insensitive partial match

    // Hotels
    const hotels = await Hotel.find({
      $or: [
        { serviceName: regex },
        { hotelName: regex },        // serviceName equivalent
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ],
      status: "active"
    });

    // Activities
    const activities = await Activity.find({
      $or: [
        { serviceName: regex },
        { name: regex },            // serviceName equivalent
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ]
    });

    // Transfers
    const transfers = await Transfer.find({
      $or: [
        { serviceName: regex },     // serviceName field
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ]
    });

    // Sightseeing
    const sightseeing = await Sightseeing.find({
      $or: [
        { serviceName: regex },
        { name: regex },            // serviceName equivalent
        { city: regex },
        { country: regex },
        { serviceCategory: regex }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        hotels,
        activities,
        transfers,
        sightseeing
      }
    });

  } catch (error) {
    next(error);
  }
};



export const getVouchers = async (req, res, next) => {
  try {
    const vouchers = await voucherModel.find()
      .populate("agent", "name companyName email")
      .populate("query", "queryId startDate endDate destination numberOfAdults numberOfChildren")
      .sort({ createdAt: -1 });

    const formatted = vouchers.map((voucher) => ({
      id: voucher._id,
      status: voucher.status,
      query: voucher.query?.queryId || voucher.voucherNumber,
      voucherNumber: voucher.voucherNumber,
      name: voucher.guestName,
      destination: voucher.destination,
      date: voucher.travelDate,
      duration: voucher.duration,
      passengers: voucher.passengers,
      services: voucher.services,
      agentName: voucher.agent?.companyName || voucher.agent?.name || "",
    }));

    const stats = {
      ready: formatted.filter((v) => v.status === "ready").length,
      generated: formatted.filter((v) => v.status === "generated").length,
      sent: formatted.filter((v) => v.status === "sent").length,
    };

      res.status(200).json({
      success: true, stats});

  } catch (error) {
    next(error);
  }
}



export const getVoucherManagementData = async (req, res, next) => {
  try {
    const assignmentFilter = await getAssignedQueryFilter(req);

    const rawVoucherDocs = await Voucher.find()
      .populate("query")
      .populate("quotation", "services")
      .populate("agent", "name companyName email")
      .sort({ createdAt: -1 });

    const voucherDocs = [];
    for (const voucher of rawVoucherDocs) {
      if (voucher.query && (await canManageAssignedQuery(req, voucher.query))) {
        voucherDocs.push(voucher);
      }
    }

    const voucherQueryIds = voucherDocs
      .map((voucher) => voucher.query?._id?.toString() || voucher.query?.toString())
      .filter(Boolean);

    const readyQueries = await TravelQuery.find({
      ...assignmentFilter,
      opsStatus: { $in: ["Confirmed", "Vouchered"] },
      _id: { $nin: voucherQueryIds },
    }).populate("agent", "name companyName email");

    const confirmationQueryIds = [
      ...new Set(
        [
          ...readyQueries.map((query) => query.queryId),
          ...readyQueries.map((query) => query._id?.toString()),
          ...voucherDocs.map((voucher) => voucher.query?.queryId).filter(Boolean),
          ...voucherDocs.map((voucher) => voucher.query?._id?.toString()).filter(Boolean),
        ].filter(Boolean)
      ),
    ];

    const confirmations = await Confirmation.find({
      queryId: { $in: confirmationQueryIds },
    });

    const confirmationMap = new Map(
      confirmations.map((item) => [item.queryId, item.services || []])
    );

    const readyItems = await Promise.all(
      readyQueries.map(async (query) => {
        const passengers =
          Number(query.numberOfAdults || 0) + Number(query.numberOfChildren || 0);

        const startDate = query.startDate ? new Date(query.startDate) : null;
        const endDate = query.endDate ? new Date(query.endDate) : null;
        const days =
          startDate && endDate
            ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
            : 0;
        const nights = days > 0 ? days - 1 : 0;

        const quotation = await Quotation.findOne({ queryId: query._id }).sort({
          createdAt: -1,
        });

        return {
          id: query._id,
          query: query.queryId,
          voucherNumber: query.voucherNumber || "",
          status: "ready",
          name: query.agent?.name || query.agent?.companyName || "Guest",
          destination: query.destination || "",
          date: query.startDate,
          duration: `${nights}N/${days}D`,
          passengers: `${passengers} PAX`,
          services: (quotation?.services || []).map((service, index) => ({
            type: service.type,
            title: service.title,
            confirmation: getServiceConfirmation(
              getConfirmationServicesForQuery(confirmationMap, query),
              service,
              index
            ),
          })),
          branding: "with",
          agentName: query.agent?.companyName || query.agent?.name || "",
        };
      })
    );

    const generatedSentItems = await Promise.all(voucherDocs.map(async (voucher) => {
      const confirmationServices = getConfirmationServicesForQuery(
        confirmationMap,
        voucher.query,
      );
      const fallbackQuotation =
        voucher.quotation ||
        (voucher.query?._id
          ? await Quotation.findOne({ queryId: voucher.query._id })
              .select("services")
              .sort({ createdAt: -1 })
          : null);
      const quotationServices = fallbackQuotation?.services || [];
      const resolvedVoucherServices = buildResolvedVoucherServices({
        voucherServices: voucher.services || [],
        quotationServices,
        confirmationServices,
      });

      return {
        id: voucher.query?._id || voucher._id,
        query: voucher.query?.queryId || "",
        voucherNumber: voucher.voucherNumber,
        status: voucher.status || "generated",
        name: voucher.guestName || voucher.agent?.name || "Guest",
        destination: voucher.destination || voucher.query?.destination || "",
        date: voucher.travelDate,
        duration: voucher.duration,
        passengers: voucher.passengers,
        services: resolvedVoucherServices.map((service) => ({
          type: service.type || "service",
          title: service.name || "Service missing",
          confirmation: service.confirmation || "Pending",
        })),
        branding: voucher.branding || "with",
        agentName: voucher.agent?.companyName || voucher.agent?.name || "",
      };
    }));

    const vouchers = [...readyItems, ...generatedSentItems];

    const stats = {
      ready: vouchers.filter((v) => v.status === "ready").length,
      generated: vouchers.filter((v) => v.status === "generated").length,
      sent: vouchers.filter((v) => v.status === "sent").length,
    };

    res.status(200).json({
      success: true,
      vouchers,
      stats,
    });
  } catch (error) {
    console.error("Get Voucher Management Data Error:", error);
    next(error);
  }
};

const normalizeServiceLabel = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getServiceTokens = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

const getServiceConfirmation = (confirmationServices = [], service, serviceIndex = -1) => {
  const rawServiceTitle = service.title || service.name || service.serviceName;
  const serviceTitle = normalizeServiceLabel(rawServiceTitle);
  const serviceTokens = getServiceTokens(rawServiceTitle);

  const matched = confirmationServices.find((item) => {
    const confirmationName = normalizeServiceLabel(item.serviceName);
    const confirmationTokens = getServiceTokens(item.serviceName);
    const overlappingTokens = serviceTokens.filter((token) =>
      confirmationTokens.includes(token)
    );

    return (
      confirmationName === serviceTitle ||
      confirmationName.includes(serviceTitle) ||
      serviceTitle.includes(confirmationName) ||
      overlappingTokens.length >= Math.min(2, serviceTokens.length || 0)
    );
  });

  if (matched?.confirmationNumber || matched?.voucherNumber) {
    return matched.confirmationNumber || matched.voucherNumber;
  }

  if (
    serviceIndex >= 0 &&
    confirmationServices[serviceIndex] &&
    (confirmationServices[serviceIndex].confirmationNumber ||
      confirmationServices[serviceIndex].voucherNumber)
  ) {
    return (
      confirmationServices[serviceIndex].confirmationNumber ||
      confirmationServices[serviceIndex].voucherNumber
    );
  }

  return "Pending";
};

const buildResolvedVoucherServices = ({
  voucherServices = [],
  quotationServices = [],
  confirmationServices = [],
}) =>
  Array.from({
    length: Math.max(voucherServices?.length || 0, quotationServices?.length || 0),
  }).map((_, index) => {
    const service = voucherServices?.[index] || {};
    const fallbackQuotationService = quotationServices[index] || {};
    const resolvedServiceName =
      service?.name ||
      service?.title ||
      fallbackQuotationService?.title ||
      fallbackQuotationService?.name ||
      "";

    return {
      type: service?.type || fallbackQuotationService?.type || "service",
      name: resolvedServiceName,
      confirmation:
        getServiceConfirmation(
          confirmationServices,
          {
            type: service?.type || fallbackQuotationService?.type,
            title: resolvedServiceName,
            name: resolvedServiceName,
          },
          index,
        ) || service?.confirmation || "Pending",
    };
  });

const getConfirmationServicesForQuery = (confirmationMap, query) => {
  const candidates = [
    query?.queryId,
    query?._id?.toString?.(),
    query?.toString?.(),
  ].filter(Boolean);

  for (const key of candidates) {
    if (confirmationMap.has(key)) {
      return confirmationMap.get(key);
    }
  }

  return [];
};




export const generateVoucher = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.id).populate("agent");

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to generate the voucher for this query",
      });
    }

    const existingVoucher = await Voucher.findOne({ query: query._id });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: "Voucher already generated for this query",
      });
    }

    let counter = await Counter.findOne({ name: "voucher" });

    if (!counter) {
      counter = await Counter.create({ name: "voucher", seq: 1000 });
    }

    counter.seq += 1;
    await counter.save();

    const voucherNumber = `VCH-${counter.seq}`;

    const quotation = await Quotation.findOne({ queryId: query._id }).sort({
      createdAt: -1,
    });

    const passengers =
      Number(query.numberOfAdults || 0) + Number(query.numberOfChildren || 0);

    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const days =
      startDate && endDate
        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        : 0;

    const nights = days > 0 ? days - 1 : 0;

    // 1. Update TravelQuery
    query.voucherNumber = voucherNumber;
    query.voucherStatus = "generated";
    query.voucherGeneratedAt = new Date();
    query.opsStatus = "Vouchered";

    await query.save();

    // 2. Create Voucher entry
    const voucher = await Voucher.create({
  query: query._id,
  quotation: quotation?._id || null,
  agent: query.agent?._id || query.agent, voucherNumber,
  status: "generated",
  guestName: query.agent?.name || "",
  destination: query.destination || "",
  travelDate: query.startDate || null,
  passengers: `${passengers} PAX`,
  duration: `${nights}N/${days}D`,
  services: (quotation?.services || []).map((service) => ({
    type: service.type || "service",
    name: service.title || "",
    confirmation: "Pending",
  })),
  generatedBy: req.user.id,
  generatedAt: new Date(),
});


    res.status(200).json({
      success: true,
      message: "Voucher generated successfully",
      voucherNumber,
      voucher,
    });
 } catch (error) {
  console.error("Generate Voucher Error:", error);
  return res.status(500).json({
    success: false,
    message: error.message,
    error,
  });
}
};


export const sendVoucherToAgent = async (req, res, next) => {
  try {
    const { branding = "with" } = req.body;
    const query = await TravelQuery.findById(req.params.id).populate("agent");

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to send the voucher for this query",
      });
    }

    const voucher = await Voucher.findOne({ query: query._id });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher not generated yet",
      });
    }

    const quotation =
      (voucher.quotation
        ? await Quotation.findById(voucher.quotation).select("services")
        : null) ||
      (await Quotation.findOne({ queryId: query._id })
        .select("services")
        .sort({ createdAt: -1 }));

    const confirmationQueryIds = [
      query.queryId,
      query._id?.toString?.(),
    ].filter(Boolean);

    const confirmation = await Confirmation.findOne({
      queryId: { $in: confirmationQueryIds },
    });

    const confirmationServices = confirmation?.services || [];
    const resolvedVoucherServices = buildResolvedVoucherServices({
      voucherServices: voucher.services || [],
      quotationServices: quotation?.services || [],
      confirmationServices,
    });

    const missingServiceNames = resolvedVoucherServices.filter(
      (service) => !String(service?.name || "").trim(),
    );
    const missingConfirmations = resolvedVoucherServices.filter((service) => {
      const confirmationValue = String(service?.confirmation || "").trim().toLowerCase();
      return !confirmationValue || confirmationValue === "pending";
    });

    if (!resolvedVoucherServices.length || missingServiceNames.length || missingConfirmations.length) {
      return res.status(400).json({
        success: false,
        message:
          !resolvedVoucherServices.length
            ? "Voucher cannot be sent because no services are mapped in this voucher."
            : missingServiceNames.length && missingConfirmations.length
              ? "Voucher cannot be sent because some services and confirmation numbers are missing."
              : missingServiceNames.length
                ? "Voucher cannot be sent because some service names are missing."
                : "Voucher cannot be sent because some DMC confirmation numbers are still pending.",
      });
    }

    try {
      await sendEmailVoucher(
        query.agent?.email,
        {
          voucherNumber: voucher.voucherNumber,
          name: voucher.guestName || query.agent?.name || "",
          destination: voucher.destination || query.destination || "",
          passengers: voucher.passengers,
          duration: voucher.duration,
          services: resolvedVoucherServices.map((service) => ({
            type: service.type,
            title: service.name,
            confirmation: service.confirmation,
          })),
        },
        branding
      );
    } catch (emailError) {
      console.error("Voucher email send failed:", emailError);

      const normalizedMessage = String(emailError?.message || "");
      const isCredentialError =
        normalizedMessage.includes("Username and Password not accepted") ||
        normalizedMessage.includes("BadCredentials") ||
        normalizedMessage.includes("Invalid login");

      return res.status(502).json({
        success: false,
        message: isCredentialError
          ? "Voucher email could not be sent because the configured Gmail credentials were rejected. Update EMAIL_USER and EMAIL_PASS with a valid Gmail address and App Password, then try again."
          : "Voucher email could not be sent. Please verify SMTP configuration and try again.",
      });
    }

    query.voucherStatus = "sent";
    query.voucherSentAt = new Date();
    query.voucherPdfUrl = "";

    addLogIfNotExists(query, "Voucher Sent", "Ops Team");

    await query.save();

    voucher.status = "sent";
    voucher.branding = branding;
    voucher.sentAt = new Date();
    voucher.services = resolvedVoucherServices.map((service) => ({
      type: service.type,
      name: service.name,
      confirmation: service.confirmation,
    }));
    await voucher.save();

    await Notification.create({
      user: query.agent._id,
      type: "success",
      title: "Voucher Sent",
      message: `Your voucher ${voucher.voucherNumber} for ${voucher.destination || query.destination} is ready to view.`,
      meta: {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        queryId: query._id,
        queryNumber: query.queryId,
        destination: voucher.destination || query.destination,
        branding,
      },
    });

    res.status(200).json({
      success: true,
      message: "Voucher sent to agent successfully",
    });
  } catch (error) {
    next(error);
  }
};




export const getOrCreateQuotationDraft = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.queryId).populate("agent");
    const requestedSourceQuotationId = String(req.query?.sourceQuotationId || "").trim();

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const latestQuotation = await Quotation.findOne({ queryId: query._id }).sort({ createdAt: -1 });
    const sourceQuotation = requestedSourceQuotationId
      ? await Quotation.findOne({ _id: requestedSourceQuotationId, queryId: query._id })
      : latestQuotation;

    const buildDraftPayload = (baseQuotation) => ({
      validTill: baseQuotation?.validTill || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pricing: baseQuotation?.pricing
        ? {
            currency: baseQuotation.pricing.currency || "INR",
            quoteCategory: baseQuotation.pricing.quoteCategory || "domestic",
            baseAmount: Number(baseQuotation.pricing.baseAmount || query.customerBudget || 0),
            subTotal: Number(baseQuotation.pricing.subTotal || 0),
            packageTemplateAmount: Number(baseQuotation.pricing.packageTemplateAmount || 0),
            serviceCurrencyBreakdown: Array.isArray(baseQuotation.pricing.serviceCurrencyBreakdown)
              ? baseQuotation.pricing.serviceCurrencyBreakdown.map((item) => ({
                  currency: item.currency || "INR",
                  amount: Number(item.amount || 0),
                  amountInInr: Number(item.amountInInr || 0),
                  exchangeRate: Number(item.exchangeRate || 1),
                }))
              : [],
            opsMarkup: {
              percent: Number(baseQuotation.pricing.opsMarkup?.percent || 0),
              amount: Number(baseQuotation.pricing.opsMarkup?.amount || 0),
            },
            opsCharges: {
              serviceCharge: Number(baseQuotation.pricing.opsCharges?.serviceCharge || 0),
              handlingFee: Number(baseQuotation.pricing.opsCharges?.handlingFee || 0),
            },
            tax: {
              gst: {
                percent: Number(baseQuotation.pricing.tax?.gst?.percent || 0),
                amount: Number(baseQuotation.pricing.tax?.gst?.amount || 0),
              },
              tcs: {
                percent: Number(baseQuotation.pricing.tax?.tcs?.percent || 0),
                amount: Number(baseQuotation.pricing.tax?.tcs?.amount || 0),
              },
              tourismFee: {
                amount: Number(baseQuotation.pricing.tax?.tourismFee?.amount || 0),
              },
              totalTax: Number(baseQuotation.pricing.tax?.totalTax || 0),
            },
            totalAmount: Number(baseQuotation.pricing.totalAmount || 0),
          }
        : {
            currency: "INR",
            quoteCategory: "domestic",
            baseAmount: Number(query.customerBudget || 0),
            subTotal: 0,
            packageTemplateAmount: 0,
            serviceCurrencyBreakdown: [],
            opsMarkup: { percent: 0, amount: 0 },
            opsCharges: { serviceCharge: 0, handlingFee: 0 },
            tax: {
              gst: { percent: 0, amount: 0 },
              tcs: { percent: 0, amount: 0 },
              tourismFee: { amount: 0 },
              totalTax: 0,
            },
            totalAmount: 0,
          },
      inclusions: Array.isArray(baseQuotation?.inclusions) ? baseQuotation.inclusions : [],
      services: Array.isArray(baseQuotation?.services)
        ? baseQuotation.services.map((service) => ({
            serviceId: service.serviceId,
            supplierId: service.supplierId,
            supplierName: service.supplierName || "",
            dmcId: service.dmcId,
            dmcName: service.dmcName || "",
            type: service.type,
            title: service.title,
            city: service.city || "",
            country: service.country || "",
            description: service.description || "",
            serviceDate: service.serviceDate,
            roomCategory: service.roomCategory || "",
            roomType: service.roomType || "",
            hotelCategory: service.hotelCategory || "",
            adults: Number(service.adults || 0),
            children: Number(service.children || 0),
            infants: Number(service.infants || 0),
            rooms: Number(service.rooms || 1),
            bedType: service.bedType,
            nights: Number(service.nights || 1),
            vehicleType: service.vehicleType || "",
            passengerCapacity: Number(service.passengerCapacity || 0),
            luggageCapacity: Number(service.luggageCapacity || 0),
            usageType: service.usageType || "point-to-point",
            days: Number(service.days || 1),
            pax: Number(service.pax || 1),
            currency: service.currency || "INR",
            price: Number(service.price || 0),
            exchangeRate: Number(service.exchangeRate || 1),
            priceInInr: Number(service.priceInInr || 0),
            extraAdult: Boolean(service.extraAdult),
            childWithBed: Boolean(service.childWithBed),
            childWithoutBed: Boolean(service.childWithoutBed),
            awebRate: Number(service.awebRate || 0),
            cwebRate: Number(service.cwebRate || 0),
            cwoebRate: Number(service.cwoebRate || 0),
            total: Number(service.total || 0),
            totalInInr: Number(service.totalInInr || 0),
          }))
        : [],
      sourceQuotationId: baseQuotation?._id || undefined,
      status: "Pending",
    });

    let quotation = await Quotation.findOne({
      queryId: query._id,
      status: "Pending",
    }).sort({ createdAt: -1 });

    if (quotation && requestedSourceQuotationId) {
      const pendingSourceId = String(quotation.sourceQuotationId || "");
      if (
        sourceQuotation &&
        pendingSourceId !== requestedSourceQuotationId
      ) {
        const draftPayload = buildDraftPayload(sourceQuotation);
        quotation.validTill = draftPayload.validTill;
        quotation.pricing = draftPayload.pricing;
        quotation.inclusions = draftPayload.inclusions;
        quotation.services = draftPayload.services;
        quotation.sourceQuotationId = draftPayload.sourceQuotationId;
        quotation.createdBy = req.user.id;
        quotation.status = "Pending";
        await quotation.save();
      }
    }

    if (!quotation) {
      const quotationNumber = await generateUniqueQuotationNumber();
      const draftPayload = buildDraftPayload(sourceQuotation);

      quotation = await Quotation.create({
        quotationNumber,
        queryId: query._id,
        agent: query.agent?._id || query.agent,
        createdBy: req.user.id,
        validTill: draftPayload.validTill,
        pricing: draftPayload.pricing,
        inclusions: draftPayload.inclusions,
        services: draftPayload.services,
        sourceQuotationId: draftPayload.sourceQuotationId,
        status: draftPayload.status,
      });
    }

    res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    console.error("Quotation Draft Error:", error);
    next(error);
  }
};

export const saveQuotationDraft = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const {
      validTill,
      pricing = {},
      services = [],
      opsPercent = 0,
      opsAmount = 0,
      serviceCharge = 0,
      handlingFee = 0,
      inclusions,
    } = req.body;

    const { quotation } = await getAuthorizedQueryForQuotation(quotationId, req);

    const resolvedServices = await Promise.all(services.map(async (service) => {
      const hotelResolvedService = await resolveDynamicHotelServicePricing(service);
      const total = roundCurrencyAmount(calculateResolvedServiceTotal(hotelResolvedService));
      const currency = normalizeCurrencyCode(hotelResolvedService?.currency);
      const inrPricing = buildInrPricingForService({
        ...hotelResolvedService,
        currency,
        total,
      });

      return {
        ...hotelResolvedService,
        currency,
        type: normalizeQuotationServiceType(service.type),
        dmcId: hotelResolvedService.dmcId || hotelResolvedService.supplierId || "",
        dmcName: hotelResolvedService.dmcName || "",
        total,
        exchangeRate: inrPricing.exchangeRate,
        priceInInr: inrPricing.priceInInr,
        totalInInr: inrPricing.totalInInr,
      };
    }));

    const servicesTotal = resolvedServices.reduce((sum, service) => (
      sum + Number(service.totalInInr || 0)
    ), 0);
    const packageTemplateAmount = Number(pricing?.packageTemplateAmount || 0);
    const opsMarkupBasisAmount = Number(servicesTotal + packageTemplateAmount);
    const ops = Number(opsPercent || 0);
    const opsAmt = Number(opsAmount || 0);
    const finalOpsAmount = opsAmt > 0 ? opsAmt : (opsMarkupBasisAmount * ops) / 100;
    const serviceChargeAmount = Number(serviceCharge || 0);
    const handlingFeeAmount = Number(handlingFee || 0);
    const taxPayload = req.body.tax || {};
    const gstPercent = Number(taxPayload?.gstPercent || 0);
    const tcsPercent = Number(taxPayload?.tcsPercent || 0);
    const gstAmount = Number(taxPayload?.gstAmount || 0);
    const tcsAmount = Number(taxPayload?.tcsAmount || 0);
    const tourismAmount = Number(taxPayload?.tourismAmount || 0);
    const totalTax = Number(gstAmount + tcsAmount + tourismAmount);
    const totalAmount = Number(
      servicesTotal +
      packageTemplateAmount +
      finalOpsAmount +
      serviceChargeAmount +
      handlingFeeAmount +
      totalTax
    );

    const formattedServices = resolvedServices.map((service) => ({
      _id: service.draftServiceId || service.dbServiceId || service._id || undefined,
      serviceId: service.serviceId || undefined,
      supplierId: service.supplierId || undefined,
      supplierName: service.supplierName || "",
      dmcId: service.dmcId || service.supplierId || undefined,
      dmcName: service.dmcName || "",
      type: service.type,
      title: service.title,
      city: service.city || "",
      country: service.country || "",
      description: service.description || service.desc || "",
      serviceDate: service.serviceDate || undefined,
      roomCategory: service.roomCategory || "",
      roomType: service.roomType || "",
      hotelCategory: service.hotelCategory || "",
      bedType: normalizeBedType(service.bedType),
      adults: Number(service.adults || 0),
      children: Number(service.children || 0),
      infants: Number(service.infants || 0),
      rooms: Number(service.rooms || 1),
      nights: Number(service.nights || 0),
      vehicleType: service.vehicleType || "",
      passengerCapacity: Number(service.passengerCapacity || 0),
      luggageCapacity: Number(service.luggageCapacity || 0),
      usageType: normalizeUsageType(service.usageType),
      days: Number(service.days || 1),
      pax: Number(service.pax || 1),
      currency: service.currency || "INR",
      price: Number(service.price || 0),
      exchangeRate: Number(service.exchangeRate || 1),
      priceInInr: Number(service.priceInInr || 0),
      extraAdult: Boolean(service.extraAdult),
      childWithBed: Boolean(service.childWithBed),
      childWithoutBed: Boolean(service.childWithoutBed),
      awebRate: Number(service.awebRate || 0),
      cwebRate: Number(service.cwebRate || 0),
      cwoebRate: Number(service.cwoebRate || 0),
      total: Number(service.total || 0),
      totalInInr: Number(service.totalInInr || 0),
    }));

    if (Array.isArray(inclusions)) {
      quotation.inclusions = inclusions;
    }
    quotation.services = formattedServices;
    quotation.validTill = validTill || quotation.validTill;
    quotation.pricing = {
      currency: "INR",
      quoteCategory: pricing?.quoteCategory === "international" ? "international" : "domestic",
      baseAmount: Number(pricing?.baseAmount || 0),
      subTotal: Number(servicesTotal || 0),
      packageTemplateAmount,
      serviceCurrencyBreakdown: buildServiceCurrencyBreakdown(resolvedServices),
      opsMarkup: {
        percent: ops,
        amount: finalOpsAmount,
      },
      opsCharges: {
        serviceCharge: serviceChargeAmount,
        handlingFee: handlingFeeAmount,
      },
      tax: {
        gst: {
          percent: gstPercent,
          amount: gstAmount,
        },
        tcs: {
          percent: tcsPercent,
          amount: tcsAmount,
        },
        tourismFee: {
          amount: tourismAmount,
        },
        totalTax,
      },
      totalAmount: Number(totalAmount || 0),
    };

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Quotation draft saved successfully",
      quotation,
    });
  } catch (error) {
    next(error);
  }
};

export const addQuotationService = async (req, res, next) => {
  try {
    const { quotation } = await getAuthorizedQueryForQuotation(req.params.quotationId, req);

    const {
      type,
      title,
      description,
      city,
      country,
      nights,
      days,
      pax,
      vehicleType,
      usageType,
      passengerCapacity,
      luggageCapacity,
      price,
      currency,
      exchangeRate,
      priceInInr,
      totalInInr,
      serviceDate,
      dmcId,
      dmcName,
      supplierId,
      supplierName,
      adults,
      children,
      infants,
      rooms,
      bedType,
      roomCategory,
      roomType,
      hotelCategory,
      extraAdult,
      childWithBed,
      childWithoutBed,
      awebRate,
      cwebRate,
      cwoebRate,
    } = req.body;

    if (!type || !title || !price) {
      return res.status(400).json({
        success: false,
        message: "Type, title and price are required",
      });
    }

    const normalizedType = normalizeQuotationServiceType(type);

    const normalizedService = {
      type: normalizedType,
      price: Number(price || 0),
      nights: Number(nights || 1),
      days: Number(days || 1),
      pax: Number(pax || 1),
      rooms: Number(rooms || 1),
      extraAdult: Boolean(extraAdult),
      childWithBed: Boolean(childWithBed),
      childWithoutBed: Boolean(childWithoutBed),
      awebRate: Number(awebRate || 0),
      cwebRate: Number(cwebRate || 0),
      cwoebRate: Number(cwoebRate || 0),
      total: 0,
    };

    const total = calculateResolvedServiceTotal(normalizedService);

    const resolvedCurrency = normalizeCurrencyCode(currency);
    const resolvedExchangeRate =
      resolvedCurrency === "INR"
        ? 1
        : Number(exchangeRate || 0) > 0
          ? Number(exchangeRate)
          : 1;
    const resolvedPriceInInr = roundCurrencyAmount(
      priceInInr ??
        (resolvedCurrency === "INR"
          ? Number(price || 0)
          : Number(price || 0) * resolvedExchangeRate),
    );
    const resolvedTotalInInr = roundCurrencyAmount(
      totalInInr ??
        (resolvedCurrency === "INR"
          ? total
          : total * resolvedExchangeRate),
    );

    quotation.services.push({
      type: normalizedType,
      title,
      description,
      city,
      country,
      serviceDate: serviceDate || undefined,
      supplierId: supplierId || undefined,
      supplierName: supplierName || "",
      dmcId: dmcId || undefined,
      dmcName: dmcName || "",
      roomCategory: roomCategory || "",
      roomType: roomType || "",
      hotelCategory: hotelCategory || "",
      nights: Number(nights || 1),
      days: Number(days || 1),
      pax: Number(pax || 1),
      vehicleType: vehicleType || "",
      usageType: usageType || "point-to-point",
      passengerCapacity: Number(passengerCapacity || 0),
      luggageCapacity: Number(luggageCapacity || 0),
      price: Number(price || 0),
      total,
      currency: resolvedCurrency,
      exchangeRate: resolvedExchangeRate,
      priceInInr: resolvedPriceInInr,
      totalInInr: resolvedTotalInInr,
      adults: Number(adults || 0),
      children: Number(children || 0),
      infants: Number(infants || 0),
      rooms: Number(rooms || 1),
      bedType: normalizeBedType(bedType),
      extraAdult: Boolean(extraAdult),
      childWithBed: Boolean(childWithBed),
      childWithoutBed: Boolean(childWithoutBed),
      awebRate: Number(awebRate || 0),
      cwebRate: Number(cwebRate || 0),
      cwoebRate: Number(cwoebRate || 0),
    });

    quotation.pricing.currency = "INR";
    quotation.pricing.serviceCurrencyBreakdown = buildServiceCurrencyBreakdown(quotation.services);
    quotation.pricing.subTotal = quotation.services.reduce((sum, item) => sum + Number(item.totalInInr || item.total || 0), 0);
    quotation.pricing.totalAmount =
      Number(quotation.pricing.subTotal || 0) +
      Number(quotation.pricing.packageTemplateAmount || 0);

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Service added successfully",
      services: quotation.services,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteQuotationService = async (req, res, next) => {
  try {
    const { quotation } = await getAuthorizedQueryForQuotation(req.params.quotationId, req);

    const service = quotation.services.id(req.params.serviceId);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    service.deleteOne();

    quotation.pricing.currency = "INR";
    quotation.pricing.serviceCurrencyBreakdown = buildServiceCurrencyBreakdown(quotation.services);
    quotation.pricing.subTotal = quotation.services.reduce((sum, item) => sum + Number(item.totalInInr || item.total || 0), 0);
    quotation.pricing.totalAmount =
      Number(quotation.pricing.subTotal || 0) +
      Number(quotation.pricing.packageTemplateAmount || 0);

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      services: quotation.services,
    });
  } catch (error) {
    next(error);
  }
};
