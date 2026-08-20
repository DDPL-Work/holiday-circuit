
import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravelQuery.model.js";
import AgentTask from "../models/agentTask.model.js";
import Counter from "../models/counter.model.js";
import Quotation from "../models/quotation.model.js";
import Invoice from "../models/invoice.model.js";
import Coupon from "../models/coupon.model.js";
import Notification from "../models/notification.model.js";
import Hotel from "../models/hotelDmc.model.js";
import Activity from "../models/activityDmc.model.js";
import Transfer from "../models/transferDmc.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js";
import DestinationName from "../models/destinationName.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  sendAgentQueryCreatedMail,
  sendAgentRegistrationReceivedMail,
  sendNewQueryAssignedMail,
  sendPasswordResetOtpMail,
} from "../services/sendEmail.js";
import { buildAgentClientQuotationTemplate, sendAgentClientQuotationMail } from "../services/emailService.js";
import { getRoundRobinFinanceAssignee } from "../services/financeTeamScopeService.js";
import { getEmailDeliveryErrorMessage } from "../services/resendMailer.js";
import { createNotification } from "../services/notificationDispatchService.js";
import { generatePDF } from "../services/pdfService.js";
import { generateAgentPaymentReceiptPdf } from "../services/payoutReceiptPdfService.js";
import { isAccessExpired } from "../utils/accessExpiry.js";
import { ensureDestinationName, ensureDestinationNames } from "../services/destinationNameService.js";
import { analyzeInvoiceFile } from "../services/invoiceExtractionService.js";

const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id || null;
const buildFrontendUrl = (path = "") => {
  const baseUrl = String(
    process.env.FRONTEND_APP_URL ||
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      process.env.FRONTEND_LOGIN_URL ||
      "",
  ).trim();

  if (!baseUrl) return "";

  const normalizedBase = baseUrl.replace(/\/+$/, "").replace(/\/login$/i, "");
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
};
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const AGENT_VISIBLE_QUOTATION_STATUSES = [
  "Quote Sent",
  "Revision Requested",
  "Revised",
  "Quote Accepted",
  "Quote Finalized",
  "Markup Applied",
  "Sent to Client",
  "Confirmed",
];
const INDIAN_DESTINATION_KEYWORDS = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

const validateAgentMarkupPolicy = ({ markupType, markupValue }) => {
  const normalizedType = String(markupType || "").trim().toUpperCase();
  const normalizedValue = Number(markupValue);

  if (!["PERCENT", "AMOUNT"].includes(normalizedType)) {
    return "Invalid markup type";
  }

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return "Invalid markup";
  }

  return "";
};

const normalizeCouponCode = (value = "") => String(value || "").trim().toUpperCase();
const formatInvoiceLocation = (service = {}) =>
  [service?.city, service?.country].filter(Boolean).join(", ");

const roundCurrencyAmount = (value) => Number(Number(value || 0).toFixed(2));

const normalizeHotelCategorySelection = (value = "") =>
  Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  ).join(", ");

export const getHotelRateDestinations = async (req, res, next) => {
  try {
    const hotelDestinations = await Hotel.aggregate([
      {
        $match: {
          status: "active",
          city: { $type: "string", $ne: "" },
          country: { $type: "string", $ne: "" },
        },
      },
      {
        $project: {
          city: { $trim: { input: "$city" } },
          country: { $trim: { input: "$country" } },
          hotelName: { $ifNull: ["$hotelName", ""] },
        },
      },
      {
        $match: {
          city: { $ne: "" },
          country: { $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            city: { $toLower: "$city" },
            country: { $toLower: "$country" },
          },
          city: { $first: "$city" },
          country: { $first: "$country" },
          hotelCount: { $sum: 1 },
        },
      },
      { $sort: { country: 1, city: 1 } },
      {
        $project: {
          _id: { $concat: ["$_id.city", "::", "$_id.country"] },
          city: 1,
          country: 1,
          hotelCount: 1,
          label: { $concat: ["$city", ", ", "$country"] },
        },
      },
    ]);

    const hotelCategories = await Hotel.aggregate([
      {
        $match: {
          status: "active",
          hotelCategory: { $type: "string", $ne: "" },
        },
      },
      {
        $project: {
          hotelCategory: { $trim: { input: "$hotelCategory" } },
        },
      },
      {
        $match: {
          hotelCategory: { $ne: "" },
        },
      },
      {
        $group: {
          _id: { $toLower: "$hotelCategory" },
          label: { $first: "$hotelCategory" },
          hotelCount: { $sum: 1 },
        },
      },
    ]);

    const savedQueryDestinations = await TravelQuery.aggregate([
      {
        $match: {
          destination: { $type: "string", $ne: "" },
        },
      },
      {
        $project: {
          label: { $trim: { input: "$destination" } },
        },
      },
      {
        $match: {
          label: { $ne: "" },
        },
      },
      {
        $group: {
          _id: { $toLower: "$label" },
          label: { $first: "$label" },
          queryCount: { $sum: 1 },
        },
      },
      { $sort: { label: 1 } },
      {
        $project: {
          _id: { $concat: ["query::", "$_id"] },
          label: 1,
          city: "$label",
          country: "",
          queryCount: 1,
          source: "query",
        },
      },
    ]);

    await ensureDestinationNames([
      ...hotelDestinations.map((destination) => ({
        label: destination?.label,
        city: destination?.city,
        country: destination?.country,
        source: "hotel",
      })),
      ...savedQueryDestinations.map((destination) => ({
        label: destination?.label,
        city: destination?.city,
        country: destination?.country,
        source: "query",
      })),
    ]);

    const savedDestinationEntries = await DestinationName.find({})
      .select("label city country source")
      .sort({ label: 1 })
      .lean();
    const savedDestinations = savedDestinationEntries.map((destination) => ({
      _id: `destination::${destination._id}`,
      label: destination.label,
      city: destination.city || destination.label,
      country: destination.country || "",
      source: destination.source || "manual",
    }));

    const hotelLabelSet = new Set(
      hotelDestinations.map((destination) => String(destination?.label || "").trim().toLowerCase()),
    );
    const hotelCitySet = new Set(
      hotelDestinations.map((destination) => String(destination?.city || "").trim().toLowerCase()),
    );

    const destinationMap = new Map();
    hotelDestinations.forEach((destination) => {
      const label = String(destination?.label || "").trim();
      if (!label) return;

      const key = label.toLowerCase();
      if (!destinationMap.has(key)) {
        destinationMap.set(key, destination);
      }
    });

    savedDestinations.forEach((destination) => {
      const label = String(destination?.label || "").trim();
      if (!label) return;

      const key = label.toLowerCase();
      if (hotelLabelSet.has(key) || hotelCitySet.has(key) || destinationMap.has(key)) return;

      destinationMap.set(key, destination);
    });

    const destinations = Array.from(destinationMap.values()).sort((left, right) =>
      String(left.label || "").localeCompare(String(right.label || "")),
    );
    const categoryPriority = ["3 Star", "4 Star", "5 Star", "Luxury"];
    const categories = hotelCategories
      .map((category) => String(category?.label || "").trim())
      .filter(Boolean)
      .sort((left, right) => {
        const leftPriority = categoryPriority.indexOf(left);
        const rightPriority = categoryPriority.indexOf(right);
        if (leftPriority !== -1 || rightPriority !== -1) {
          return (leftPriority === -1 ? 999 : leftPriority) - (rightPriority === -1 ? 999 : rightPriority);
        }
        return left.localeCompare(right);
      });

    res.status(200).json({
      success: true,
      count: destinations.length,
      destinations,
      hotelCategories: categories,
    });
  } catch (error) {
    next(error);
  }
};

const normalizeCurrencyCode = (value) =>
  String(value || "INR").trim().toUpperCase() || "INR";

const normalizeQuotationServiceType = (type = "") => {
  const normalizedType = String(type || "").trim().toLowerCase();
  if (normalizedType === "car" || normalizedType === "transport") return "transfer";
  return normalizedType;
};

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
  const fallbackPriceInInr = currency === "INR" ? originalPrice : originalPrice * exchangeRate;
  const fallbackTotalInInr = currency === "INR" ? originalTotal : originalTotal * exchangeRate;
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

const getLiveServiceModel = (type = "") => {
  const normalizedType = normalizeQuotationServiceType(type);
  if (normalizedType === "hotel") return Hotel;
  if (normalizedType === "activity") return Activity;
  if (normalizedType === "transfer") return Transfer;
  if (normalizedType === "sightseeing") return Sightseeing;
  return null;
};

const getLiveServiceRateSnapshot = (service = {}, typeOverride = "") => {
  const type = normalizeQuotationServiceType(typeOverride || service?.type || service?.serviceCategory);

  if (type === "hotel") {
    return {
      currency: normalizeCurrencyCode(service?.currency),
      price: Number(service?.price || 0),
      awebRate: Number(service?.awebRate || 0),
      cwebRate: Number(service?.cwebRate || 0),
      cwoebRate: Number(service?.cwoebRate || 0),
    };
  }

  if (type === "activity") {
    return {
      currency: normalizeCurrencyCode(service?.currency),
      price: Number(service?.adultPrice ?? service?.price ?? 0),
    };
  }

  return {
    currency: normalizeCurrencyCode(service?.currency),
    price: Number(service?.price || 0),
  };
};

const getQuotedServiceRateSnapshot = (service = {}) => ({
  currency: normalizeCurrencyCode(service?.currency),
  price: Number(service?.price || 0),
  awebRate: Number(service?.awebRate || 0),
  cwebRate: Number(service?.cwebRate || 0),
  cwoebRate: Number(service?.cwoebRate || 0),
});

const areRateValuesDifferent = (left, right) =>
  Math.abs(Number(left || 0) - Number(right || 0)) >= 0.5;

const formatRateValidationAmount = (currency, amount) =>
  `${normalizeCurrencyCode(currency)} ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const buildQuotationRateMismatch = (service = {}, liveService = null) => {
  const type = normalizeQuotationServiceType(service?.type);
  if (!liveService) {
    return {
      serviceTitle: service?.title || "Service",
      type,
      reason: "service_not_found",
      message: `${service?.title || "Service"} is no longer available in live supplier rates.`,
    };
  }

  const quoted = getQuotedServiceRateSnapshot(service);
  const live = getLiveServiceRateSnapshot(liveService, type);
  const changedFields = [];

  if (quoted.currency !== live.currency) {
    changedFields.push(`currency ${quoted.currency} -> ${live.currency}`);
  }

  if (areRateValuesDifferent(quoted.price, live.price)) {
    changedFields.push(
      `base rate ${formatRateValidationAmount(quoted.currency, quoted.price)} -> ${formatRateValidationAmount(live.currency, live.price)}`,
    );
  }

  if (type === "hotel") {
    [
      ["awebRate", "extra adult rate"],
      ["cwebRate", "child with bed rate"],
      ["cwoebRate", "child without bed rate"],
    ].forEach(([key, label]) => {
      if (areRateValuesDifferent(quoted[key], live[key])) {
        changedFields.push(
          `${label} ${formatRateValidationAmount(quoted.currency, quoted[key])} -> ${formatRateValidationAmount(live.currency, live[key])}`,
        );
      }
    });
  }

  if (!changedFields.length) return null;

  return {
    serviceTitle: service?.title || liveService?.hotelName || liveService?.name || liveService?.serviceName || "Service",
    type,
    reason: "rate_changed",
    quoted,
    live,
    changedFields,
    message: `${service?.title || "Service"}: ${changedFields.join(", ")}`,
  };
};

const validateQuotationSupplierRates = async (quotation = {}) => {
  const services = Array.isArray(quotation?.services) ? quotation.services : [];
  const mismatches = [];

  await Promise.all(services.map(async (service) => {
    const normalizedType = normalizeQuotationServiceType(service?.type);
    // Rate validation is strictly for hotel services only
    if (normalizedType !== "hotel") return;

    const serviceId = String(service?.serviceId || "").trim();
    const Model = getLiveServiceModel(service?.type);

    if (!Model || !serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) return;

    const liveService = await Model.findById(serviceId).lean();
    const mismatch = buildQuotationRateMismatch(service, liveService);
    if (mismatch) mismatches.push(mismatch);
  }));

  return {
    valid: mismatches.length === 0,
    mismatches,
  };
};

const getLatestAgentVisibleQuotation = async ({ queryId, agentId }) => {
  if (!queryId || !agentId) return null;

  return Quotation.findOne({
    queryId,
    agent: agentId,
    status: { $in: AGENT_VISIBLE_QUOTATION_STATUSES },
  })
    .select("_id quotationNumber status updatedAt createdAt")
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
};

const buildInvoiceLineItemsFromQuotation = (quotation = {}) =>
  (quotation?.services || []).map((service) => {
    const inrPricing = buildInrPricingForService(service);
    const originalCurrency = normalizeCurrencyCode(service?.currency);
    const pricingNote =
      originalCurrency !== "INR"
        ? `Original ${originalCurrency} ${Number(service?.total || 0).toLocaleString("en-IN")} @ ${inrPricing.exchangeRate} INR`
        : "";

    const normalizedType = String(service?.type || "").trim().toLowerCase();
    const isTransport = ["transfer", "car", "transport"].includes(normalizedType);

    const fallbackPax =
      Number(quotation?.numberOfAdults || quotation?.queryId?.numberOfAdults || 0) +
      Number(quotation?.numberOfChildren || quotation?.queryId?.numberOfChildren || 0);
    const quantityLabel = isTransport ? buildServiceQuantityLabel(service, fallbackPax) : "";
    const transportNotes = isTransport ? buildTransportQuotationNotes(service) : [];

    const combinedNotesList = [
      service?.description || "",
      quantityLabel ? `QTY: ${quantityLabel}` : "",
      ...transportNotes,
      pricingNote
    ].filter(Boolean);

    return {
      serviceType: service?.type || "",
      title: service?.title || "",
      location: formatInvoiceLocation(service),
      serviceDate: service?.serviceDate || null,
      nights: Number(service?.nights || 0),
      days: Number(service?.days || 0),
      pax: Number(service?.pax || 0),
      rooms: Number(service?.rooms || 0),
      adults: Number(service?.adults || 0),
      children: Number(service?.children || 0),
      currency: "INR",
      unitPrice: Number(inrPricing.priceInInr || 0),
      total: Number(inrPricing.totalInInr || 0),
      notes: combinedNotesList.join(" | "),
    };
  });

const buildInvoicePricingSnapshotFromQuotation = (quotation = {}, totalAmount = 0) => ({
  currency: quotation?.pricing?.currency || "INR",
  baseAmount: Number(quotation?.pricing?.baseAmount || 0),
  servicesTotal: Number(quotation?.pricing?.subTotal || 0),
  packageTemplateAmount: Number(quotation?.pricing?.packageTemplateAmount || 0),
  opsMarkupPercent: Number(quotation?.pricing?.opsMarkup?.percent || 0),
  opsMarkupAmount: Number(quotation?.pricing?.opsMarkup?.amount || 0),
  agentMarkupType: String(quotation?.agentMarkup?.type || "").trim().toUpperCase(),
  agentMarkupValue: Number(quotation?.agentMarkup?.value || 0),
  agentMarkupAmount: Number(quotation?.agentMarkup?.markupAmount || 0),
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

const buildInvoiceTripSnapshotFromQuery = (query = {}) => ({
  queryId: query?.queryId || "",
  destination: query?.destination || "",
  startDate: query?.startDate || null,
  endDate: query?.endDate || null,
  numberOfAdults: Number(query?.numberOfAdults || 0),
  numberOfChildren: Number(query?.numberOfChildren || 0),
});

const generateUniqueInvoiceNumber = async () => {
  let counter = await Counter.findOne({ name: "invoice" });

  if (!counter) {
    const latestInvoice = await Invoice.findOne({
      invoiceNumber: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });

    const latestSeq = latestInvoice?.invoiceNumber
      ? parseInt(String(latestInvoice.invoiceNumber).split("-")[1], 10)
      : 1000;

    counter = await Counter.create({
      name: "invoice",
      seq: Number.isNaN(latestSeq) ? 1000 : latestSeq,
    });
  }

  let invoiceNumber = "";
  let isUniqueInvoiceNumber = false;

  while (!isUniqueInvoiceNumber) {
    counter.seq += 1;
    invoiceNumber = `INV-${counter.seq}`;

    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (!existingInvoice) {
      isUniqueInvoiceNumber = true;
    }
  }

  await counter.save();
  return invoiceNumber;
};

const ensureInvoiceForConfirmedQuotation = async ({ quotation, query, actorId }) => {
  if (!quotation?._id || !query?._id) return null;

  const existingInvoice = await Invoice.findOne({
    query: query._id,
    quotation: quotation._id,
  }).sort({ createdAt: -1 });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceNumber = await generateUniqueInvoiceNumber();
  const finalInvoiceAmount = Number(
    quotation?.pricing?.totalAmount ||
    quotation?.pricing?.subTotal ||
    quotation?.clientTotalAmount ||
    quotation?.totalAmount ||
    0,
  );
  const lineItems = buildInvoiceLineItemsFromQuotation(quotation);
  const pricingSnapshot = buildInvoicePricingSnapshotFromQuotation(
    quotation,
    finalInvoiceAmount,
  );
  const tripSnapshot = buildInvoiceTripSnapshotFromQuery(query);

  return Invoice.create({
    query: query._id,
    agent: quotation.agent,
    quotation: quotation._id,
    generatedBy: actorId || null,
    invoiceNumber,
    invoiceType: "agent",
    totalAmount: finalInvoiceAmount,
    currency: pricingSnapshot.currency || "INR",
    lineItems,
    pricingSnapshot,
    tripSnapshot,
    templateVariant: "grand-ledger",
    paymentStatus: "Pending",
  });
};

const isCouponExpiredNow = (coupon = null) => {
  if (!coupon?.endDate) return false;
  const endDate = new Date(coupon.endDate);
  if (Number.isNaN(endDate.getTime())) return false;
  endDate.setHours(23, 59, 59, 999);
  return endDate < new Date();
};

const isCouponScheduledNow = (coupon = null) => {
  if (!coupon?.startDate) return false;
  const startDate = new Date(coupon.startDate);
  if (Number.isNaN(startDate.getTime())) return false;
  return startDate > new Date();
};

const isCouponRedeemedNow = (coupon = null) =>
  Boolean(coupon?.redeemedAt || coupon?.redeemedByInvoice);

const isCouponUsageExhaustedNow = (coupon = null) =>
  Boolean(coupon?.usageLimit) && Number(coupon?.usageCount || 0) >= Number(coupon?.usageLimit || 0);

const isCouponEligibleForAttempt = (coupon = null) =>
  Boolean(coupon) &&
  !isCouponExpiredNow(coupon) &&
  !isCouponScheduledNow(coupon) &&
  !isCouponRedeemedNow(coupon) &&
  !isCouponUsageExhaustedNow(coupon);

const calculateCouponDiscountAmount = (subtotal = 0, coupon = null) => {
  const amount = Math.round(Number(subtotal || 0));
  if (!coupon || amount <= 0) return 0;

  if (coupon.discountType === "percentage") {
    return Math.round((amount * Number(coupon.discountValue || 0)) / 100);
  }

  return Math.min(amount, Math.round(Number(coupon.discountValue || 0)));
};

const getLatestEligibleCouponForAttempt = async (agentId) =>
  Coupon.findOne({
    assignedAgent: agentId,
    redeemedAt: null,
    redeemedByInvoice: null,
  }).sort({ lastSentAt: -1, createdAt: -1 });

const verifyLegacyCompatiblePassword = async (inputPassword = "", storedPassword = "") => {
  const normalizedInputPassword = String(inputPassword ?? "");
  const normalizedStoredPassword = String(storedPassword ?? "");

  if (!normalizedStoredPassword) {
    return {
      isMatch: false,
      shouldUpgradeHash: false,
    };
  }

  if (BCRYPT_HASH_PATTERN.test(normalizedStoredPassword)) {
    return {
      isMatch: await bcrypt.compare(normalizedInputPassword, normalizedStoredPassword),
      shouldUpgradeHash: false,
    };
  }

  return {
    isMatch: normalizedInputPassword === normalizedStoredPassword,
    shouldUpgradeHash: normalizedInputPassword === normalizedStoredPassword,
  };
};

const formatAuthenticatedUser = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email || "",
  role: user.role,
  companyName: user.companyName || "",
  phone: user.phone || "",
  profileImage: user.profileImage || "",
  coverImage: user.coverImage || "",
  brandingName: user.brandingName || "",
  brandingLogo: user.brandingLogo || "",
  voucherFooterImage: user.voucherFooterImage || "",
  employeeId: user.employeeId || "",
  manager: user.manager || "",
  department: user.department || "",
  designation: user.designation || "",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  accountStatus: user.accountStatus || "Active",
  accessExpiry: user.accessExpiry || null,
  lastLoginAt: user.lastLoginAt || null,
  creditDays: Array.isArray(user.creditDays) ? user.creditDays : (user.creditDays !== undefined ? [user.creditDays] : [7]),
});

const resolveAgentBranding = ({ quotation = {}, agent = {} }) => ({
  brandingName:
    quotation?.agentBrandingName ||
    agent?.brandingName ||
    "",
  brandingLogo:
    quotation?.agentLogo ||
    agent?.brandingLogo ||
    "",
});

const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt ? new Date(document.uploadedAt) : null,
});

const emptyTravelerDocument = () => ({
  url: "",
  fileName: "",
  mimeType: "",
  size: 0,
  uploadedAt: null,
});

const hasTravelerDocumentTypeMismatch = (documentKey = "", document = {}) => {
  const fileName = String(document?.fileName || "").trim().toLowerCase();
  if (!fileName) return false;
  const looksLikePan = /\bpan\b|pan[-_\s]?card|aadhaar|aadhar|government[-_\s]?id|govt[-_\s]?id/.test(fileName);
  const looksLikePassport = /passport|pass[-_\s]?port/.test(fileName);
  if (documentKey === "passport") return looksLikePan;
  if (documentKey === "governmentId") return looksLikePassport;
  return false;
};

const getTravelerDocumentKey = (documentType = "Passport") => {
  const normalizedType = String(documentType || "").trim().toLowerCase();
  return normalizedType.includes("gov") || normalizedType.includes("id") || normalizedType.includes("aad") || normalizedType.includes("pan")
    ? "governmentId"
    : "passport";
};

const normalizeTravelerDocuments = (documents = {}, legacyDocument = {}, legacyDocumentType = "Passport") => {
  const normalizedDocuments = {
    passport: normalizeTravelerDocument(documents?.passport),
    governmentId: normalizeTravelerDocument(documents?.governmentId || documents?.govtId),
  };

  const normalizedLegacyDocument = normalizeTravelerDocument(legacyDocument);

  if (
    normalizedLegacyDocument.url &&
    !normalizedDocuments.passport.url &&
    !normalizedDocuments.governmentId.url
  ) {
    normalizedDocuments[getTravelerDocumentKey(legacyDocumentType)] = normalizedLegacyDocument;
  }

  return normalizedDocuments;
};

const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;
  return INDIAN_DESTINATION_KEYWORDS.some((keyword) => normalizedDestination.includes(keyword));
};

const getRequiredTravelerDocumentKeys = (query = {}) => {
  const explicitQuoteCategory = String(
    query?.quoteCategory || query?.pricingSnapshot?.quoteCategory || "",
  )
    .trim()
    .toLowerCase();

  if (explicitQuoteCategory === "international") {
    return ["passport", "governmentId"];
  }

  if (explicitQuoteCategory === "domestic") {
    return ["governmentId"];
  }

  return Boolean(query?.destination) && !isIndianDestination(query.destination)
    ? ["passport", "governmentId"]
    : ["governmentId"];
};

const normalizeTravelerDetails = (travelerDetails = [], numberOfAdults = 0, numberOfChildren = 0) => {
  const normalizedAdults = Number(numberOfAdults || 0);
  const normalizedChildren = Number(numberOfChildren || 0);
  const rawTravelers = Array.isArray(travelerDetails) ? travelerDetails : [];

  const cleanedTravelers = rawTravelers
    .map((traveler) => ({
      fullName: String(traveler?.fullName || "").trim(),
      travelerType: traveler?.travelerType === "Child" ? "Child" : "Adult",
      childAge:
        traveler?.travelerType === "Child" && traveler?.childAge !== undefined && traveler?.childAge !== null
          ? Number(traveler.childAge)
          : null,
      documentType: String(traveler?.documentType || "Passport").trim() || "Passport",
      document: normalizeTravelerDocument(traveler?.document),
      documents: normalizeTravelerDocuments(traveler?.documents, traveler?.document, traveler?.documentType),
    }))
    .filter((traveler) => traveler.fullName);

  const adults = cleanedTravelers.filter((traveler) => traveler.travelerType === "Adult");
  const children = cleanedTravelers.filter((traveler) => traveler.travelerType === "Child");

  if (adults.length !== normalizedAdults || children.length !== normalizedChildren) {
    throw new ApiError(400, "Traveler details must match adult and child counts");
  }

  const hasInvalidChildAge = children.some(
    (traveler) => !Number.isInteger(traveler.childAge) || traveler.childAge < 1 || traveler.childAge > 12,
  );

  if (hasInvalidChildAge) {
    throw new ApiError(400, "Each child traveler must have an age between 1 and 12");
  }

  return [...adults, ...children];
};

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
  verifiedDocuments: Array.isArray(query?.travelerDocumentVerification?.verifiedDocuments)
    ? query.travelerDocumentVerification.verifiedDocuments.map((document) => ({
        travelerId: String(document?.travelerId || "").trim(),
        travelerName: String(document?.travelerName || "").trim(),
        documentKey: String(document?.documentKey || "").trim(),
        documentLabel: String(document?.documentLabel || "").trim(),
      }))
    : [],
});

const matchesTravelerDocumentReviewEntry = (entry = {}, traveler = {}, documentKey = "") => {
  const normalizedDocumentKey = String(documentKey || "").trim();
  if (!normalizedDocumentKey) return false;

  const entryDocumentKey = String(entry?.documentKey || "").trim();
  if (entryDocumentKey !== normalizedDocumentKey) return false;

  const entryTravelerId = String(entry?.travelerId || "").trim();
  const entryTravelerName = String(entry?.travelerName || "").trim().toLowerCase();
  const travelerId = String(traveler?._id || traveler?.id || "").trim();
  const travelerName = String(traveler?.fullName || traveler?.name || "").trim().toLowerCase();

  return (
    (entryTravelerId && travelerId && entryTravelerId === travelerId) ||
    (entryTravelerName && travelerName && entryTravelerName === travelerName)
  );
};

const getVerifiedRequiredTravelerDocumentProgress = (query = {}, verifiedDocuments = []) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const requiredDocumentKeys = getRequiredTravelerDocumentKeys(query);
  const totalRequiredCount = travelers.length * requiredDocumentKeys.length;

  if (!totalRequiredCount) {
    return {
      verifiedRequiredCount: 0,
      totalRequiredCount: 0,
      allRequiredVerified: false,
    };
  }

  const verifiedRequiredCount = travelers.reduce(
    (count, traveler) =>
      count +
      requiredDocumentKeys.filter((documentKey) =>
        verifiedDocuments.some((document) =>
          matchesTravelerDocumentReviewEntry(document, traveler, documentKey),
        ),
      ).length,
    0,
  );

  return {
    verifiedRequiredCount,
    totalRequiredCount,
    allRequiredVerified: verifiedRequiredCount >= totalRequiredCount,
  };
};

const resetTravelerDocumentVerification = (query, status = "Draft", overrides = {}) => {
  query.travelerDocumentVerification = {
    status,
    submittedAt:
      Object.prototype.hasOwnProperty.call(overrides, "submittedAt")
        ? overrides.submittedAt
        : status === "Pending"
          ? new Date()
          : null,
    reviewedAt:
      Object.prototype.hasOwnProperty.call(overrides, "reviewedAt") ? overrides.reviewedAt : null,
    reviewedBy:
      Object.prototype.hasOwnProperty.call(overrides, "reviewedBy") ? overrides.reviewedBy : null,
    reviewedByName:
      Object.prototype.hasOwnProperty.call(overrides, "reviewedByName")
        ? overrides.reviewedByName
        : "",
    rejectionReason:
      Object.prototype.hasOwnProperty.call(overrides, "rejectionReason")
        ? overrides.rejectionReason
        : "",
    rejectionRemarks:
      Object.prototype.hasOwnProperty.call(overrides, "rejectionRemarks")
        ? overrides.rejectionRemarks
        : "",
    issues: Array.isArray(overrides?.issues) ? overrides.issues : [],
    verifiedDocuments: Array.isArray(overrides?.verifiedDocuments)
      ? overrides.verifiedDocuments
      : [],
  };
};

const getTravelerDocumentCompletion = (query = {}) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const requiredDocumentKeys = getRequiredTravelerDocumentKeys(query);
  const isInternationalTrip = requiredDocumentKeys.length === 2;

  const rows = travelers.map((traveler) => {
    const documents = normalizeTravelerDocuments(
      traveler?.documents,
      traveler?.document,
      traveler?.documentType,
    );
    const mismatchedDocumentKeys = ["passport", "governmentId"].filter(
      (key) => documents?.[key]?.url && hasTravelerDocumentTypeMismatch(key, documents[key]),
    );
    const uploadedRequiredCount = requiredDocumentKeys.filter((key) => documents?.[key]?.url).length;
    return {
      id: traveler?._id || null,
      name: traveler?.fullName || "Traveler",
      mismatchedDocumentKeys,
      isComplete: uploadedRequiredCount === requiredDocumentKeys.length && mismatchedDocumentKeys.length === 0,
    };
  });

  return {
    isInternationalTrip,
    requiredDocumentKeys,
    rows,
    allComplete: rows.length > 0 && rows.every((traveler) => traveler.isComplete),
  };
};

const getLatestInvoiceForQuery = async (queryId, agentId = null) => {
  const filter = { query: queryId };

  if (agentId) {
    filter.agent = agentId;
  }

  return Invoice.findOne(filter).sort({ createdAt: -1 });
};

const isPaymentVerifiedForBooking = (invoice = null) =>
  Boolean(invoice) &&
  (invoice?.paymentVerification?.status === "Verified" || invoice?.paymentStatus === "Paid");

const getAgentCommissionAmount = (quotation = null) => {
  const explicitMarkupAmount = Number(quotation?.agentMarkup?.markupAmount || 0);
  if (explicitMarkupAmount > 0) {
    return Math.round(explicitMarkupAmount);
  }

  const clientTotalAmount = Number(quotation?.clientTotalAmount || 0);
  const opsTotalAmount = Number(quotation?.pricing?.totalAmount || 0);
  return Math.max(0, Math.round(clientTotalAmount - opsTotalAmount));
};

const getInvoiceOpsSubtotalAmount = (invoice = null) => {
  const pricingSnapshot = invoice?.pricingSnapshot || {};

  return Math.round(
    Number(pricingSnapshot.servicesTotal || 0) +
    Number(pricingSnapshot.packageTemplateAmount || 0) +
    Number(pricingSnapshot.opsMarkupAmount || 0) +
    Number(pricingSnapshot.serviceCharge || 0) +
    Number(pricingSnapshot.handlingFee || 0) +
    Number(pricingSnapshot.totalTax || 0),
  );
};

const formatAgentFinanceTransactionId = (prefix = "TXN", value = "") => {
  const normalized = String(value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `${prefix}-${(normalized || "0000").slice(-6)}`;
};

const ACTIVE_BOOKING_STATUSES = ["Invoice_Requested", "Confirmed", "Vouchered", "Payment_Completed"];

const getStartOfToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getMonthRange = (offset = 0) => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() + offset, 1),
    end: new Date(now.getFullYear(), now.getMonth() + offset + 1, 1),
  };
};

const calculateTrendPercentage = (current = 0, previous = 0) => {
  const normalizedCurrent = Number(current || 0);
  const normalizedPrevious = Number(previous || 0);

  if (normalizedPrevious <= 0) {
    return normalizedCurrent > 0 ? 100 : 0;
  }

  return Math.round(((normalizedCurrent - normalizedPrevious) / normalizedPrevious) * 100);
};

const buildDashboardTrend = (current = 0, previous = 0) => {
  const change = calculateTrendPercentage(current, previous);
  return {
    change,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
};

const getDashboardActivityTone = (status = "") => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["confirmed", "verified", "sent", "paid", "client approved", "quote sent"].includes(normalizedStatus)) {
    return "success";
  }

  if (["pending", "awaiting decision", "in progress", "draft"].includes(normalizedStatus)) {
    return "warning";
  }

  return "info";
};

const buildQueryActivityItem = (query = {}) => {
  const latestLog = Array.isArray(query?.activityLog) && query.activityLog.length
    ? [...query.activityLog]
      .sort((left, right) => new Date(right?.timestamp || 0).getTime() - new Date(left?.timestamp || 0).getTime())[0]
    : null;

  const statusLabel =
    query?.agentStatus === "Confirmed" || ["Confirmed", "Vouchered", "Payment_Completed"].includes(query?.opsStatus)
      ? "Confirmed"
      : query?.agentStatus === "Quote Sent" || query?.quotationStatus === "Sent_To_Agent"
        ? "Quote Sent"
        : query?.agentStatus || query?.opsStatus || "New";

  const title = latestLog?.action
    ? latestLog.action
    : query?.agentStatus === "Confirmed" || ["Confirmed", "Vouchered", "Payment_Completed"].includes(query?.opsStatus)
      ? `Booking confirmed for ${query?.destination || "trip"}`
      : query?.quotationStatus === "Sent_To_Agent"
        ? `Quotation shared for ${query?.destination || "trip"}`
        : `New query for ${query?.destination || "trip"}`;

  return {
    id: `query-${query?._id || query?.queryId || Date.now()}`,
    source: "query",
    title,
    subtitle: `${query?.queryId || "Travel Query"}${query?.destination ? ` · ${query.destination}` : ""}`,
    status: statusLabel,
    tone: getDashboardActivityTone(statusLabel),
    date: latestLog?.timestamp || query?.updatedAt || query?.createdAt || null,
    link: "/agent/queries",
  };
};

const buildNotificationActivityItem = (notification = {}) => {
  const statusMap = {
    success: "Confirmed",
    warning: "Pending",
    info: "New",
  };

  return {
    id: `notification-${notification?._id || Date.now()}`,
    source: "notification",
    title: notification?.title || "Update",
    subtitle: notification?.message || "",
    status: statusMap[notification?.type] || "New",
    tone: notification?.type || "info",
    date: notification?.createdAt || null,
    link: notification?.link || "",
  };
};

const buildAgentFinanceOverviewPayload = async (agentId, { includeTransactions = true } = {}) => {
  const invoices = await Invoice.find({ agent: agentId })
    .populate("query", "queryId destination")
    .sort({ createdAt: -1 });

  const queryIds = [...new Set(
    invoices
      .map((invoice) =>
        invoice?.query?._id ? String(invoice.query._id) : invoice?.query ? String(invoice.query) : "",
      )
      .filter(Boolean),
  )];

  const quotations = queryIds.length
    ? await Quotation.find({
        agent: agentId,
        queryId: { $in: queryIds },
        status: { $in: AGENT_VISIBLE_QUOTATION_STATUSES },
      })
      .select("queryId quotationNumber status services pricing.totalAmount pricing.currency agentMarkup clientTotalAmount agentRevisionRemark validTill createdAt updatedAt")
      .sort({ updatedAt: -1, createdAt: -1 })
    : [];

  const latestQuotationByQuery = quotations.reduce((acc, quotation) => {
    const key = quotation?.queryId ? String(quotation.queryId) : "";
    if (key && !acc[key]) {
      acc[key] = quotation;
    }
    return acc;
  }, {});

  const transactions = [];
  let currentBalance = 0;
  let pendingCommissions = 0;
  let totalEarnings = 0;

  invoices.forEach((invoice) => {
    const queryKey = invoice?.query?._id ? String(invoice.query._id) : invoice?.query ? String(invoice.query) : "";
    const bookingReference =
      String(invoice?.query?.queryId || invoice?.invoiceNumber || "").trim() || "Booking";
    const latestQuotation = latestQuotationByQuery[queryKey] || null;
    const invoiceOpsSubtotalAmount = getInvoiceOpsSubtotalAmount(invoice);
    const snapshotMarkupAmount = Math.round(
      Number(invoice?.pricingSnapshot?.agentMarkupAmount || 0),
    );
    const derivedInvoiceMarkupAmount = Math.max(
      0,
      Math.round(Number(invoice?.totalAmount || 0) - invoiceOpsSubtotalAmount),
    );
    const commissionAmount = Math.max(
      0,
      Math.round(
        getAgentCommissionAmount(latestQuotation) ||
        snapshotMarkupAmount ||
        derivedInvoiceMarkupAmount,
      ),
    );
    const couponApplication = invoice?.paymentSubmission?.couponApplication || null;
    const markupAmount = Math.round(commissionAmount || 0);
    const subtotalAmount = Math.round(
      Number(
        couponApplication?.subtotalAmount ||
        latestQuotation?.pricing?.totalAmount ||
        invoiceOpsSubtotalAmount ||
        Math.max(0, Number(invoice?.totalAmount || 0) - markupAmount) ||
        invoice?.totalAmount ||
        0,
      ),
    );
    const couponDiscountAmount = Math.round(
      Number(couponApplication?.discountAmount || 0),
    );
    const payableAmount = Math.round(
      Number(couponApplication?.payableAmount || invoice?.paymentSubmission?.amount || invoice?.totalAmount || 0),
    );
    const paymentAmount = Math.round(
      Number(invoice?.paymentSubmission?.amount || payableAmount || invoice?.totalAmount || 0),
    );
    const paymentDate =
      invoice?.paymentSubmission?.paymentDate ||
      invoice?.paymentSubmission?.submittedAt ||
      invoice?.paymentVerification?.reviewedAt ||
      invoice?.createdAt ||
      null;
    const financeVerified = isPaymentVerifiedForBooking(invoice);
    const paymentVerificationStatus = String(
      invoice?.paymentVerification?.status || invoice?.paymentStatus || "Pending",
    ).trim();
    const normalizedPaymentStatus = financeVerified
      ? "Success"
      : paymentVerificationStatus === "Rejected"
        ? "Rejected"
        : "Pending";

    const matchedQuotes = quotations
      .filter((q) => q?.queryId && String(q.queryId) === queryKey)
      .map((q) => ({
        id: q._id,
        quotationNumber: q.quotationNumber,
        status: q.status,
        createdAt: q.createdAt,
        clientTotalAmount: q.clientTotalAmount,
        opsTotalAmount: q.pricing?.totalAmount,
        currency: q.pricing?.currency || "INR",
        validTill: q.validTill,
        revisionRemark: q.agentRevisionRemark || "",
        services: (q.services || []).map((s) => ({
          title: s.title,
          type: s.type,
          city: s.city,
          country: s.country,
          serviceDate: s.serviceDate,
          total: s.total,
          currency: s.currency,
          nights: s.nights,
          days: s.days,
          rooms: s.rooms,
          adults: s.adults,
          children: s.children,
          pax: s.pax,
          vehicleType: s.vehicleType,
          roomType: s.roomCategory || s.roomType || "",
          description: s.description || "",
        })),
      }));

    const quotationStats = {
      totalCount: matchedQuotes.length,
    };

    if (commissionAmount > 0) {
      totalEarnings += commissionAmount;
      if (financeVerified) {
        currentBalance += commissionAmount;
      } else {
        pendingCommissions += commissionAmount;
      }

      if (includeTransactions) {
        transactions.push({
          id: formatAgentFinanceTransactionId(
            "COM",
            latestQuotation?.quotationNumber || invoice?.invoiceNumber || invoice?._id,
          ),
          transactionType: "commission",
          date: paymentDate,
          description: `Booking Commission (${bookingReference})`,
          amount: commissionAmount,
          direction: "credit",
          status: normalizedPaymentStatus,
          meta: {
            markupAmount,
            couponDiscountAmount,
            subtotalAmount,
            payableAmount,
            quotationDetails: matchedQuotes,
            quotationStats,
          },
        });
      }
    }

    if (includeTransactions && paymentAmount > 0) {
      transactions.push({
        id: formatAgentFinanceTransactionId("PAY", invoice?.invoiceNumber || invoice?._id),
        transactionType: "payment",
        date: paymentDate,
        description: `Booking Payment (${bookingReference})`,
        amount: paymentAmount,
        direction: "debit",
        status: normalizedPaymentStatus,
        meta: {
          markupAmount,
          couponDiscountAmount,
          subtotalAmount,
          payableAmount,
          couponCode: String(couponApplication?.code || "").trim(),
          couponLabel: String(couponApplication?.discountLabel || "").trim(),
          quotationDetails: matchedQuotes,
          quotationStats,
        },
      });
    }
  });

  const sortedTransactions = includeTransactions
    ? transactions.sort((left, right) => {
      const leftTime = left?.date ? new Date(left.date).getTime() : 0;
      const rightTime = right?.date ? new Date(right.date).getTime() : 0;
      return rightTime - leftTime;
    })
    : [];

  return {
    currency: "INR",
    summary: {
      currentBalance: Math.round(currentBalance),
      pendingCommissions: Math.round(pendingCommissions),
      totalEarnings: Math.round(totalEarnings),
    },
    transactions: sortedTransactions,
  };
};

const getHashedOtp = (otp = "") =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateNumericOtp = () =>
  `${Math.floor(100000 + Math.random() * 900000)}`;

const formatMailDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  return {
    adults: adults > 0 ? adults : adultFallbackCount,
    children: children > 0 ? children : childFallbackCount,
  };
};

const buildTravelerSummary = (query = {}) => {
  const { adults, children } = getQueryTravelerCounts(query);
  const parts = [];

  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);

  return parts.join(", ") || "Traveler details pending";
};

const getQueryPassengerCount = (query = {}) => {
  const { adults, children } = getQueryTravelerCounts(query);
  return Number(adults || 0) + Number(children || 0);
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

const TRANSPORT_USAGE_LABELS = Object.freeze({
  "one-way-airport-transfer": "One Way / Airport Transfer",
  "inter-hotel-transfer": "Inter Hotel Transfer",
  "full-day": "Full Day",
  "half-day": "Half Day",
  "point-to-point": "One Way / Airport Transfer",
  "round-trip": "Two Way",
});

const TRANSPORT_USAGE_LIMIT_LABELS = Object.freeze({
  "full-day": "80 km / 8 hours",
  "full-day-80-km": "80 km / 8 hours",
  "full-day-8-hours": "80 km / 8 hours",
  "half-day": "40 km / 4 hours",
  "half-day-40-km": "40 km / 4 hours",
  "half-day-4-hours": "40 km / 4 hours",
});

const normalizeTransportUsageOptionKeyForQuote = (value = "") => {
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

const getTransportUsageDisplayLabelForQuote = (service = {}) => {
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

const getTransportLimitLabelForQuote = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );
  const limitKeys = String(service?.transportUsageLimitOptionKey || "")
    .split(",")
    .map((key) => normalizeTransportUsageOptionKeyForQuote(key))
    .filter(Boolean);
  const explicitLimitLabel = limitKeys
    .map((key) => TRANSPORT_USAGE_LIMIT_LABELS[key])
    .filter(Boolean)[0];

  return explicitLimitLabel || TRANSPORT_USAGE_LIMIT_LABELS[optionKey] || "";
};

const getTransportExtraKmRateForQuote = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );

  if (optionKey === "full-day") {
    return Number(service?.fullDayExtraPerKmRate || service?.extraPerKmRate || 0);
  }

  if (optionKey === "half-day") {
    return Number(service?.halfDayExtraPerKmRate || service?.extraPerKmRate || 0);
  }

  return 0;
};

const buildTransportQuotationNotes = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );

  if (!["full-day", "half-day"].includes(optionKey)) return [];

  const usageLabel = getTransportUsageDisplayLabelForQuote(service);
  const limitLabel = getTransportLimitLabelForQuote(service);
  const extraKmRate = getTransportExtraKmRateForQuote(service);
  const notes = [];

  if (extraKmRate > 0) {
    notes.push(`Extra km rate: \u20B9 ${extraKmRate.toLocaleString("en-IN")}/km.`);
  }

  if (limitLabel) {
    notes.push(`Note: ${usageLabel} limit selected as ${limitLabel}. Extra km will attract extra charges where applicable.`);
  }

  return notes;
};

const buildServiceQuantityLabel = (service = {}, fallbackPax = 0) => {
  const normalizedType = String(service?.type || "")
    .trim()
    .toLowerCase();
  const details = [];

  if (normalizedType === "hotel") {
    const hotelPax = Number(fallbackPax || 0) || Number(service?.pax || 0);
    if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
    if (Number(service?.rooms || 0) > 0) details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
    if (hotelPax > 0) details.push(`${hotelPax} Pax`);
    return details.join(" | ");
  }

  if (normalizedType === "transfer" || normalizedType === "car" || normalizedType === "transport") {
    const usageLabel = getTransportUsageDisplayLabelForQuote(service);
    const limitLabel = getTransportLimitLabelForQuote(service);
    if (usageLabel) details.push(usageLabel);
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
  if (Number(service?.passengerCapacity || 0) > 0) details.push(`${service.passengerCapacity} Pax`);
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildServiceLocationLabel = (service = {}) =>
  [service?.city, service?.country].filter(Boolean).join(", ");

const getQueryClientRecipientName = (query = {}) => {
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
const buildQuotationClientEmailPayload = ({ quotation, query, agent }) => {
  const totalAmount = Number(quotation?.clientTotalAmount || quotation?.pricing?.totalAmount || 0);
  const totalServiceBase = Array.isArray(quotation?.services)
    ? quotation.services.reduce((sum, s) => sum + Number(s.total || 0), 0)
    : 0;
  const resolvedBranding = resolveAgentBranding({ quotation, agent });
  const queryPax = getQueryPassengerCount(query);

  const getAbsoluteMediaUrl = (urlStr) => {
    const rawUrl = String(urlStr || "").trim();
    if (!rawUrl) return "";
    if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(rawUrl)) return rawUrl;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
    const protocol = "http";
    const host = process.env.BACKEND_URL || "localhost:5000";
    const baseUrl = host.startsWith("http") ? host : `${protocol}://${host}`;
    const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    return `${baseUrl}${cleanPath}`;
  };

  const rawLogo =
    resolvedBranding.brandingLogo ||
    agent?.brandingLogo ||
    agent?.companyLogo ||
    agent?.profileImage ||
    agent?.avatar ||
    quotation?.agentLogo ||
    "";

  const rawFooter =
    agent?.voucherFooterImage ||
    agent?.brandingFooter ||
    agent?.footerImage ||
    quotation?.voucherFooterImage ||
    quotation?.agentFooterImage ||
    "";

  return {
    includeSellerBankDetails: false,
    recipientName: getQueryClientRecipientName(query),
    agencyName: agent?.companyName || "",
    agentLogo: getAbsoluteMediaUrl(rawLogo),
    agentFooterImage: getAbsoluteMediaUrl(rawFooter),
    agentBrandingName: resolvedBranding.brandingName || agent?.brandingName || agent?.companyName || "DDLC Company",
    agentCompanyAddress: agent?.companyAddress || agent?.address || "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Delhi - 110018",
    agentPhone: agent?.phone || "",
    agentEmail: agent?.email || "",
    agentGstNumber: agent?.gstNumber || "",
    quotationNumber: quotation?.quotationNumber || "",
    queryId: query?.queryId || "",
    destination: query?.destination || "",
    travelDates: `${formatMailDateLabel(query?.startDate)} - ${formatMailDateLabel(query?.endDate)}`,
    durationLabel: buildDurationLabel(query),
    travelerSummary: buildTravelerSummary(query),
    validTill: formatMailDateLabel(quotation?.validTill),
    totalAmount,
    currency: quotation?.pricing?.currency || "INR",
    gstPercent: Number(
      quotation?.pricing?.tax?.gst?.percent ||
      quotation?.pricing?.gstPercent ||
      quotation?.gstPercent ||
      5
    ),
    tcsPercent: Number(
      quotation?.pricing?.tax?.tcs?.percent ||
      quotation?.pricing?.tcsPercent ||
      quotation?.tcsPercent ||
      0
    ),
    services: Array.isArray(quotation?.services)
      ? quotation.services.map((service) => {
          const ratio = totalServiceBase > 0 ? Number(service.total || 0) / totalServiceBase : 0;
          const clientAmount = totalServiceBase > 0 ? Math.round(totalAmount * ratio) : 0;
          const normalizedServiceType = String(service?.type || "").trim().toLowerCase();
          const serviceDescription = String(service?.description || "").replace(/\|/g, " | ").trim();
          const transportNotes = ["transfer", "car", "transport"].includes(normalizedServiceType)
            ? buildTransportQuotationNotes(service)
            : [];
          const description = [serviceDescription, ...transportNotes].filter(Boolean).join("\n");
          const rawServiceObj = typeof service?.toObject === "function" ? service.toObject() : (service || {});
          return {
            ...rawServiceObj,
            title: service?.title || "Service",
            type: service?.type || "service",
            nights: Number(service?.nights || service?.nightCount || 0),
            typeLabel: service?.type ? String(service.type).replace(/_/g, " ") : "Travel Service",
            location: buildServiceLocationLabel(service),
            serviceDateLabel: formatMailDateLabel(service?.serviceDate),
            quantityLabel: buildServiceQuantityLabel(service, queryPax),
            description,
            clientAmount,
          };
        })
      : [],
    inclusions: Array.isArray(quotation?.inclusions)
      ? quotation.inclusions.filter(Boolean)
      : [],
    exclusions: Array.isArray(quotation?.exclusions)
      ? quotation.exclusions.filter(Boolean)
      : [],
    additionalNotes: Array.isArray(quotation?.additionalNotes)
      ? quotation.additionalNotes.filter(Boolean)
      : [],
    dayWiseItinerary: Array.isArray(quotation?.dayWiseItinerary)
      ? quotation.dayWiseItinerary
          .map((item, index) => {
            const dayNumber = Math.max(1, Number(item?.dayNumber || index + 1));
            const parsedDate = item?.date ? new Date(item.date) : null;

            return {
              dayNumber,
              dayLabel: String(item?.dayLabel || "").trim(),
              date: parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toISOString()
                : "",
              title: String(item?.title || item?.heading || "").trim(),
              description: String(item?.description || "").trim(),
            };
          })
          .filter((item) => item.title || item.description)
      : [],
  };
};

const markQuotationSharedWithClient = async ({ quotation, query, performedBy = "Agent" }) => {
  const wasAlreadySent = quotation.status === "Sent to Client";

  quotation.status = "Sent to Client";
  await quotation.save();

  if (!query) {
    return { quotation, query, wasAlreadySent };
  }

  query.activityLog = Array.isArray(query.activityLog) ? query.activityLog : [];

  if (!wasAlreadySent) {
    query.activityLog.push({
      action: "Sent to Client",
      performedBy,
      timestamp: new Date(),
    });
    await query.save();
  }

  return { quotation, query, wasAlreadySent };
};


// ========================== Register Agent Controller ==========================

export const registerAgent = async (req, res, next) => {
  try {
    const { name, email, password, companyName, gstNumber, phone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingUser = await Auth.findOne({ email: normalizedEmail });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!req.files || req.files.length === 0) {
      return next(new ApiError(400, "Documents are required"));
    }

    const documents = req.files.map((file) => file.path);
    const agentPayload = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "agent",
      companyName,
      gstNumber,
      documents,
      phone,
      isApproved: false,
      status: "pending",
      accountStatus: "Inactive",
      reviewedAt: null,
      reviewedBy: "",
      reviewedById: "",
      rejectionReason: "",
    };

    let agent = null;
    let statusCode = 201;
    let message = "Registered successfully. Waiting for admin approval.";

    if (existingUser) {
      const canResubmit = existingUser.role === "agent" && existingUser.status === "rejected" && !existingUser.isApproved;

      if (!canResubmit) {
        return next(new ApiError(400, "Email already exists"));
      }

      Object.assign(existingUser, agentPayload);
      agent = await existingUser.save();
      statusCode = 200;
      message = "Registration resubmitted successfully. Waiting for admin approval.";
    } else {
      agent = await Auth.create(agentPayload);
    }

    const adminUsers = await Auth.find({
      role: "admin",
      isDeleted: { $ne: true },
    }).select("_id");

    if (adminUsers.length) {
      const notificationTitle = statusCode === 200 ? "Agent Registration Resubmitted" : "New Agent Registration";
      const notificationMessage = statusCode === 200
        ? `${agent.companyName || agent.name} has resubmitted registration documents for admin review.`
        : `${agent.companyName || agent.name} has submitted a new registration and is waiting for approval.`;

      await Notification.insertMany(
        adminUsers.map((adminUser) => ({
          user: adminUser._id,
          type: "warning",
          title: notificationTitle,
          message: notificationMessage,
          link: "/admin/superAdminDashboard#agent-approvals",
          meta: {
            agentId: agent._id,
            companyName: agent.companyName || "",
            agentName: agent.name || "",
            registrationStatus: "pending",
          },
        })),
      );
    }

    await sendAgentRegistrationReceivedMail(agent.email, {
      name: agent.name,
      companyName: agent.companyName,
    });

    res.status(statusCode).json({
      success: true,
      message,
      agent,
    });

  } catch (error) {
    next(error);
  }
};

// ======================== Generate Client Quotation PDF Controller ==========================

export const generateClientQuotationPdf = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const quotation = await Quotation.findOne({ _id: req.params.id, agent: agentId });
    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    if (!["Quote Accepted", "Markup Applied", "Sent to Client"].includes(quotation.status)) {
      return next(new ApiError(400, "Accept quote first"));
    }

    if (
      quotation.status === "Quote Accepted" &&
      (quotation.clientTotalAmount === undefined || quotation.clientTotalAmount === null)
    ) {
      quotation.agentMarkup = {
        type: quotation.agentMarkup?.type || "AMOUNT",
        value: Number(quotation.agentMarkup?.value || 0),
        markupAmount: Number(quotation.agentMarkup?.markupAmount || 0),
      };
      quotation.clientTotalAmount = Number(
        quotation.pricing?.totalAmount || quotation.totalAmount || 0,
      );
      await quotation.save();
    }

    const [query, agent] = await Promise.all([
      TravelQuery.findById(quotation.queryId),
      Auth.findById(agentId).select("name email companyName phone companyAddress website gstNumber brandingName brandingLogo voucherFooterImage profileImage avatar companyLogo"),
    ]);

    if (!query) {
      return next(new ApiError(404, "Travel query not found"));
    }

    const pdfPayload = buildQuotationClientEmailPayload({ quotation, query, agent });
    const pdf = await generatePDF({
      ...pdfPayload,
      includeSellerBankDetails: false,
    });

    return res.json({
      success: true,
      pdf,
    });
  } catch (error) {
    next(error);
  }
};


export const getClientQuotationEmailPreview = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    if (!agentId) return next(new ApiError(401, "Unauthorized"));

    const quotation = await Quotation.findOne({ _id: req.params.id, agent: agentId });
    if (!quotation) return next(new ApiError(404, "Quotation not found"));

    const [query, agent] = await Promise.all([
      TravelQuery.findById(quotation.queryId),
      Auth.findById(agentId).select("name email companyName phone companyAddress website gstNumber brandingName brandingLogo voucherFooterImage profileImage avatar companyLogo"),
    ]);
    if (!query) return next(new ApiError(404, "Travel query not found"));

    const payload = buildQuotationClientEmailPayload({ quotation, query, agent });
    return res.json({ success: true, html: buildAgentClientQuotationTemplate(payload) });
  } catch (error) {
    next(error);
  }
};

export const sendAgentVoucherEmail = async (req, res, next) => {
  try {
    const { recipientEmail, subject, html, voucherNumber } = req.body;
    const emailToUse = String(recipientEmail || "").trim().toLowerCase();

    if (!emailToUse) {
      return next(new ApiError(400, "Recipient email is required"));
    }

    const queryId = req.params.queryId || req.params.id;
    const agentId = getAuthenticatedUserId(req);

    // 1. FETCH DYNAMIC AGENT, QUERY & QUOTATION DATA FROM DATABASE
    const [agent, query] = await Promise.all([
      agentId
        ? Auth.findById(agentId).select(
            "name email companyName phone companyAddress website brandingName brandingLogo voucherFooterImage profileImage avatar companyLogo"
          )
        : null,
      queryId ? TravelQuery.findById(queryId) : null,
    ]);

    const quotation = query ? await Quotation.findOne({ queryId: query._id }).sort({ createdAt: -1 }) : null;

    // Helper to format relative upload paths into absolute server URLs for email clients
    const getAbsoluteMediaUrl = (urlStr) => {
      const rawUrl = String(urlStr || "").trim();
      if (!rawUrl) return "";
      // Keep data images intact here; they are converted into CID attachments
      // immediately before sending so Gmail can render them safely.
      if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(rawUrl)) return rawUrl;
      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
      const protocol = req?.protocol || "http";
      const host = req?.get?.("host") || process.env.BACKEND_URL || "localhost:5000";
      const baseUrl = host.startsWith("http") ? host : `${protocol}://${host}`;
      const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
      return `${baseUrl}${cleanPath}`;
    };

    // 2. DYNAMIC LOGO & COMPANY HEADER (SIDE-BY-SIDE LAYOUT WITH LARGER LOGO)
    const rawLogo =
      agent?.brandingLogo ||
      agent?.companyLogo ||
      agent?.profileImage ||
      agent?.avatar ||
      query?.agentLogo ||
      "";

    const absoluteLogoUrl = getAbsoluteMediaUrl(rawLogo);

    const companyName = agent?.brandingName || agent?.companyName || "Holiday Circuit Partner Desk";
    const companyPhone = agent?.phone || "+91 9368825518";
    const companyEmail = agent?.email || "support@holidaycircuit.com";
    const companyAddress = agent?.companyAddress || "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Near UK Nursing Home, New Delhi, Delhi, India - 110018";
    const website = agent?.website || "";

    const headerLogoCell = absoluteLogoUrl
      ? `<td style="vertical-align: middle; padding-right: 12px; width: 110px; text-align: left;">
          <img src="${absoluteLogoUrl}" alt="${companyName}" style="width: 105px; height: 75px; object-fit: contain; object-position: left; display: block; margin-left: 0;" />
         </td>`
      : "";

    const headerTableHtml = `
      <div style="padding: 14px 20px; border-bottom: 2px solid #e2e8f0; background-color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            ${headerLogoCell}
            <td style="vertical-align: middle; text-align: ${absoluteLogoUrl ? "left" : "center"}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 0;">
              <h2 style="margin: 0 0 3px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; line-height: 1.2;">${companyName}</h2>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569; line-height: 1.4;">${companyAddress}</p>
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #3252C3; line-height: 1.4;">
                Phone: ${companyPhone}${companyEmail ? ` &bull; Email: ${companyEmail}` : ""}${website ? ` &bull; Web: ${website}` : ""}
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;

    // 3. DYNAMIC FOOTER SELECTION (UPLOADED VOUCHER FOOTER BANNER vs COMPANY DETAILS FOOTER)
    const rawFooterImg = agent?.voucherFooterImage || agent?.brandingFooter || agent?.footerImage || "";
    const absoluteFooterImgUrl = getAbsoluteMediaUrl(rawFooterImg);

    const footerHtml = absoluteFooterImgUrl
      ? `
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid #e2e8f0; background-color: #ffffff;">
          <img src="${absoluteFooterImgUrl}" alt="Footer Banner" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
        </div>
      `
      : `
        <div style="background-color: #f8fafc; border-top: 2px solid #e2e8f0; padding: 20px 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-top: 24px;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #1e293b; letter-spacing: -0.01em;">
            ${companyName}
          </p>
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 500; color: #475569; line-height: 1.6;">
            Phone: ${companyPhone} &bull; Email: ${companyEmail}${website ? ` &bull; Web: ${website}` : ""}
          </p>
          <p style="margin: 0; font-size: 11px; font-weight: 400; color: #64748b; line-height: 1.5;">
            ${companyAddress}
          </p>
          <p style="margin: 12px 0 0 0; font-size: 10px; color: #94a3b8; font-style: italic;">
            Thank you for choosing ${companyName}. Have a safe & memorable journey!
          </p>
        </div>
      `;

    // 4. CLEAN HTML BODY & ENSURE COMPLETE VOUCHER CONTENT
    let cleanHtml = String(html || "").trim();
    // Safely remove any base64 <img> tags to avoid breaking HTML syntax or hitting Gmail size limit
    cleanHtml = cleanHtml.replace(/<img[^>]*src=["']data:image\/[^"']*["'][^>]*>/gi, '');
    cleanHtml = cleanHtml.replace(/<!--\s*AGENT BRAND HEADER BANNER[\s\S]*?<\/table>\s*<\/div>/i, "");

    const voucherOverviewIndex = cleanHtml.search(/TRAVEL\s+VOUCHER\s+OVERVIEW/i);
    const voucherSectionStart = cleanHtml.lastIndexOf("<div", voucherOverviewIndex);
    
    // Remove any duplicate company name/address text headers before TRAVEL VOUCHER OVERVIEW
    const voucherStartIndex = cleanHtml.search(/(?:📋\s*)?(?:TRAVEL\s+)?VOUCHER\s+OVERVIEW|<table/i);
    if (voucherOverviewIndex !== -1) {
      cleanHtml = cleanHtml.substring(voucherSectionStart !== -1 ? voucherSectionStart : voucherOverviewIndex);
    } else {
      cleanHtml = cleanHtml.replace(/<div[^>]*>[^<]*<h2[^>]*>[\s\S]*?<\/h2>[\s\S]*?<\/div>/gi, '');
    }

    const servicesList = quotation?.services || [];
    const serviceTableRows = servicesList.length > 0
      ? servicesList.map((s) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: 700; color: #1e3a8a; font-size: 11px; text-transform: uppercase; border-right: 1px solid #e2e8f0; width: 110px;">${s.type || s.category || "SERVICE"}</td>
            <td style="padding: 10px 14px; color: #0f172a; font-size: 12px; font-weight: 600; border-right: 1px solid #e2e8f0;">
              <div style="font-weight: 700;">${s.title || s.hotelName || s.name || "Service"}</div>
              ${s.city ? `<div style="font-size: 11px; color: #64748b;">City: ${s.city}</div>` : ""}
            </td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 600; font-size: 11px; border-right: 1px solid #e2e8f0; width: 150px;">${s.status || (String(s.confirmation || "").toLowerCase().includes("pending") ? "Pending" : "Confirmed")}</td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 600; font-size: 12px; width: 160px;">${s.confirmationNumber || s.confirmationNo || "-"}</td>
          </tr>
        `).join("")
      : `
          <tr>
            <td colspan="4" style="padding: 14px; text-align: center; color: #64748b; font-size: 12px;">No specific service line items found.</td>
          </tr>
        `;

    const defaultVoucherBodyHtml = `
      <div style="margin-bottom: 24px;">
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 800; color: #1e293b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 6px 6px 0 0;">
          📋 TRAVEL VOUCHER OVERVIEW
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1; border-top: none;">
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 9px 14px; color: #475569; font-weight: 600; background-color: #f8fafc; width: 140px; border-right: 1px solid #e2e8f0;">Voucher Number:</td>
              <td style="padding: 9px 14px; color: #0f172a; font-weight: 800; background-color: #ffffff;">${voucherNumber || query?.voucherNumber || `VCH-${query?.queryId || "1070"}`}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 9px 14px; color: #475569; font-weight: 600; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Guest Details:</td>
              <td style="padding: 9px 14px; color: #0f172a; font-weight: 700; background-color: #ffffff;">${query?.clientName || "Valued Client"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 9px 14px; color: #475569; font-weight: 600; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Destination:</td>
              <td style="padding: 9px 14px; color: #0f172a; font-weight: 700; background-color: #ffffff;">${query?.destination || "Destination"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 9px 14px; color: #475569; font-weight: 600; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Duration:</td>
              <td style="padding: 9px 14px; color: #0f172a; font-weight: 700; background-color: #ffffff;">${(query?.numberOfNights || 5)} Nights / ${(query?.numberOfNights || 5) + 1} Days</td>
            </tr>
            <tr>
              <td style="padding: 9px 14px; color: #475569; font-weight: 600; background-color: #f8fafc; border-right: 1px solid #e2e8f0;">Passengers:</td>
              <td style="padding: 9px 14px; color: #0f172a; font-weight: 700; background-color: #ffffff;">${query?.numberOfAdults || 2} Adults</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #ebf5ff; text-align: left; border-bottom: 2px solid #bfdbfe;">
              <th style="padding: 10px 14px; font-weight: 800; color: #1e3a8a; font-size: 11px; text-transform: uppercase; border-right: 1px solid #bfdbfe; width: 110px;">TYPE</th>
              <th style="padding: 10px 14px; font-weight: 800; color: #1e3a8a; font-size: 11px; text-transform: uppercase; border-right: 1px solid #bfdbfe;">SERVICE DESCRIPTION</th>
              <th style="padding: 10px 14px; font-weight: 800; color: #1e3a8a; font-size: 11px; text-transform: uppercase; border-right: 1px solid #bfdbfe; width: 150px;">CONFIRMATION STATUS</th>
              <th style="padding: 10px 14px; font-weight: 800; color: #1e3a8a; font-size: 11px; text-transform: uppercase; width: 160px;">CONFIRMATION NUMBER</th>
            </tr>
          </thead>
          <tbody>
            ${serviceTableRows}
          </tbody>
        </table>
      </div>
    `;

    const bodyContent = (cleanHtml && cleanHtml.length > 50) ? cleanHtml : defaultVoucherBodyHtml;

    const fullEmailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || "Package Details"}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="width: 100%; margin: 0 auto; background-color: #ffffff;">
    ${headerTableHtml}
    <div style="padding: 0;">
      ${bodyContent}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`;

    // 5. GENERATE & ATTACH PDF AUTOMATICALLY (PACKAGE PDF or VOUCHER PDF)
    const { generateVoucherPdf } = await import("../services/voucherPdfService.js");
    const { generatePDF } = await import("../services/pdfService.js");
    const fs = await import("fs");

    const safeVoucherNum = String(voucherNumber || query?.voucherNumber || query?.queryId || "VCH").replace(/[^a-zA-Z0-9-_]/g, "");
    const safeQueryId = String(query?.queryId || query?._id?.slice(-7) || "1107").replace(/[^a-zA-Z0-9-_]/g, "");
    const isPackageEmail = String(subject || "").toLowerCase().includes("package") || String(voucherNumber || "").startsWith("PKG");

    const voucherDetails = {
      voucherNumber: voucherNumber || query?.voucherNumber || `VCH-${query?.queryId || "1070"}`,
      query: query?.queryId || "QRY",
      destination: query?.destination || "Destination",
      duration: query?.duration || `${(query?.numberOfNights || query?.nights || 5)} Nights / ${(query?.numberOfNights || query?.nights || 5) + 1} Days`,
      passengers: `${query?.numberOfAdults || 2} Adults${Number(query?.numberOfChildren || 0) ? `, ${query.numberOfChildren} Children` : ""}`,
      name: query?.clientName || query?.name || query?.customerName || query?.guestName || "Valued Client",
      guestName: query?.clientName || query?.name || query?.customerName || query?.guestName || "Valued Client",
      travelDate: query?.startDate || query?.travelDates?.from || null,
      adults: query?.numberOfAdults || 2,
      children: query?.numberOfChildren || 0,
      infants: query?.numberOfInfants || 0,
      travelerSummary: `${query?.numberOfAdults || 2} Adults${Number(query?.numberOfChildren || 0) ? `, ${query.numberOfChildren} Children` : ""}`,
      travelDates: query?.travelDates ? `${new Date(query.travelDates.from).toLocaleDateString("en-IN")} to ${new Date(query.travelDates.to).toLocaleDateString("en-IN")}` : "Flexible",
      services: quotation?.services || [],
      agentName: companyName,
      companyPhone,
      companyEmail,
      branding: {
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        website,
        logo: rawLogo,
        footer: rawFooterImg,
      },
    };

    let attachments = [];
    try {
      if (isPackageEmail) {
        const defaultPackageInclusions = [
          "Accommodation in 5-Star Ocean Deluxe Room with daily breakfast (CP Plan)",
          "Access to Aquaventure Waterpark & Lost Chambers Aquarium",
          "Private SUV transfers (Day 2 - Day 4) available 10 hours/day with private chauffeur",
          "VIP Desert Safari by 4x4 Land Cruiser with BBQ Dinner Buffet & Live Cultural Shows",
          "At The Top Burj Khalifa 124th & 125th Floor Admission Tickets",
          "Arrival Airport Pickup & Departure Airport Drop-off Transfers",
          "All Applicable Fuel, Tolls, Driver Charges & Government Taxes",
        ];

        const defaultPackageExclusions = [
          "Airfare / Flight Tickets (Unless explicitly mentioned)",
          "Visa Fee & Travel Insurance",
          "Tourism Dirham / Destination City Tax (Payable directly at Hotel Check-in)",
          "Personal expenses such as laundry, room service, minibar, and telephone calls",
          "Early Check-in or Late Check-out charges",
          "Anything not explicitly mentioned in the Inclusions section",
        ];

        const defaultPackageItinerary = [
          {
            dayNumber: 1,
            title: "Day 1: Arrival in Dubai & Hotel Check-in",
            description: "Arrival at Dubai Airport, meet & greet by our representative and transfer to hotel. Included: Airport Transfer - Private SUV. Check-in and relax.",
          },
          {
            dayNumber: 2,
            title: "Day 2: Desert Safari",
            description: "After breakfast, proceed for the day's activities. Included: City Transfer. Enjoy Desert Safari. Overnight stay at hotel.",
          },
          {
            dayNumber: 3,
            title: "Day 3: Dhow Cruise Dinner & Burj Khalifa",
            description: "After breakfast, proceed for the day's activities. Included: City Transfer. Enjoy Dhow Cruise Dinner. Visit Burj Khalifa. Visit Dubai Mall Tour. Overnight stay at hotel.",
          },
          {
            dayNumber: 4,
            title: "Day 4: Dubai Sightseeing & Leisure",
            description: "After breakfast, proceed for the day's activities. Included: City Transfer. Overnight stay at hotel.",
          },
          {
            dayNumber: 5,
            title: "Day 5: Check-out & Departure",
            description: "After breakfast, check-out from hotel. Transfer to Dubai Airport for departure. Tour ends with wonderful memories.",
          },
        ];

        const defaultPackageTerms = [
          "Minimum 50% of the booking amount is required at the time of booking confirmation.",
          "Remaining 50% in 2 parts i.e. 25% of total booking amount within 30 Days prior to departure and 25% within 20 days prior to departure.",
          "In Case of Airline booking/Train Tickets, 100% ticket cost to be paid at the time of confirmation.",
          "In Case a booking is under 100% cancellation period, then 100% booking amount is required at the time of booking confirmation.",
          "Booking will be auto cancelled in case of non-payment within stipulated time.",
          "Confirmation Vouchers will only be provided 7 days before the arrival date.",
          "Airport Transfers include 60 minutes waiting time. Driver will wait 10 mins for hotel lobby pickups.",
          "Valid ID Proof (Passport/Election Card) is mandatory for all travelers. (Aadhar Card is not valid for Nepal Air entry).",
          `By booking with ${companyName}, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.`,
        ];

        // Construct package PDF details matching the Quotation PDF format!
        const packagePdfDetails = {
          quotationNumber: `PKG-${safeQueryId}`,
          queryId: query?.queryId || `QRY-${safeQueryId}`,
          destination: query?.destination || "Dubai",
          clientName: query?.clientName || query?.name || query?.customerName || query?.guestName || "Valued Client",
          startDate: query?.startDate || null,
          endDate: query?.endDate || null,
          numberOfNights: query?.numberOfNights || 4,
          numberOfAdults: query?.numberOfAdults || 2,
          numberOfChildren: query?.numberOfChildren || 0,
          pricing: {
            totalAmount: quotation?.pricing?.totalAmount || quotation?.clientTotalAmount || 225000,
          },
          services: (Array.isArray(quotation?.services) && quotation.services.length > 0)
            ? quotation.services
            : [
                { type: "hotel", title: "5-Star Luxury Oceanfront Resort Stay", hotelName: "Atlantis, The Palm", nights: 4, roomType: "Ocean Deluxe Room" },
                { type: "transfer", title: "City Transfer", vehicleType: "Private SUV (Toyota Fortuner / Innova / Land Cruiser)", days: 3 },
                { type: "activity", title: "Desert Safari & Live Shows", pax: 2 },
                { type: "sightseeing", title: "Burj Khalifa - 124th Floor", pax: 2 },
              ],
          inclusions: (Array.isArray(quotation?.inclusions) && quotation.inclusions.length > 0)
            ? quotation.inclusions
            : defaultPackageInclusions,
          exclusions: (Array.isArray(quotation?.exclusions) && quotation.exclusions.length > 0)
            ? quotation.exclusions
            : defaultPackageExclusions,
          itinerary: (Array.isArray(quotation?.itinerary) && quotation.itinerary.length > 0)
            ? quotation.itinerary
            : defaultPackageItinerary,
          dayWiseItinerary: (Array.isArray(quotation?.itinerary || quotation?.dayWiseItinerary) && (quotation.itinerary || quotation.dayWiseItinerary).length > 0)
            ? (quotation.itinerary || quotation.dayWiseItinerary)
            : defaultPackageItinerary,
          termsAndConditions: (Array.isArray(quotation?.termsAndConditions) && quotation.termsAndConditions.length > 0)
            ? quotation.termsAndConditions
            : defaultPackageTerms,
          sellerBankDetails: [
            { label: "Bank Name", value: "HDFC Bank" },
            { label: "A/c Holder Name", value: companyName || "Holiday Circuit" },
            { label: "A/c No.", value: "50200103968171" },
            { label: "IFSC", value: "HDFC0004413" },
            { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
          ],
          agentBrandingName: companyName,
          agentLogo: rawLogo,
          agentFooterImage: rawFooterImg,
        };

        const pdfResult = await generatePDF(packagePdfDetails);
        const pkgPdfPath = pdfResult?.filePath || pdfResult?.absoluteFilePath;
        if (pkgPdfPath && fs.existsSync(pkgPdfPath)) {
          attachments.push({
            filename: `Package-Details-${safeQueryId}.pdf`,
            path: pkgPdfPath,
            contentType: "application/pdf",
          });
        }
      } else {
        const pdfResult = await generateVoucherPdf(voucherDetails);
        const voucherPdfPath = pdfResult?.absoluteFilePath || pdfResult?.filePath;
        if (voucherPdfPath && fs.existsSync(voucherPdfPath)) {
          attachments.push({
            filename: `Travel-Voucher-${safeVoucherNum}.pdf`,
            path: voucherPdfPath,
            contentType: "application/pdf",
          });
        }
      }
    } catch (pdfErr) {
      console.error("PDF attachment generation error:", pdfErr);
      throw new ApiError(500, "PDF attachment could not be generated, so the email was not sent.");
    }

    // Email clients such as Gmail do not reliably render base64 image URLs in
    // HTML mail. They can also make the message body so large that Gmail clips
    // it, leaving literal `<img src="` text in the received email. Convert each
    // valid inline data image to a CID attachment before dispatching.
    const inlineImageAttachments = [];
    let inlineImageBytes = 0;
    const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;
    const MAX_TOTAL_INLINE_IMAGE_BYTES = 10 * 1024 * 1024;
    const emailHtml = fullEmailHtml.replace(
      /(<img\b[^>]*\bsrc\s*=\s*)(["'])(data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/_=\s-]+))\2/gi,
      (match, prefix, quote, _dataUrl, subtype, encodedImage) => {
        try {
          const imageContent = Buffer.from(String(encodedImage).replace(/\s/g, ""), "base64");

          if (
            !imageContent.length ||
            imageContent.length > MAX_INLINE_IMAGE_BYTES ||
            inlineImageBytes + imageContent.length > MAX_TOTAL_INLINE_IMAGE_BYTES
          ) {
            return `${prefix}${quote}${quote}`;
          }

          inlineImageBytes += imageContent.length;
          const cid = `voucher-image-${inlineImageAttachments.length + 1}-${Date.now()}@holidaycircuit`;
          inlineImageAttachments.push({
            filename: `voucher-image-${inlineImageAttachments.length + 1}.${subtype.replace(/[^a-z0-9]/gi, "") || "png"}`,
            content: imageContent,
            contentType: `image/${subtype}`,
            cid,
          });

          return `${prefix}${quote}cid:${cid}${quote}`;
        } catch {
          // Do not allow an invalid saved image value to break the voucher.
          return `${prefix}${quote}${quote}`;
        }
      },
    );

    // 6. DISPATCH EMAIL WITH TRANSPORTER & PDF ATTACHMENT
    const { transporter, MAIL_FROM_ADDRESS } = await import("../services/mailer.js");

    await transporter.sendMail({
      from: MAIL_FROM_ADDRESS,
      to: emailToUse,
      subject: subject || `Official Travel Voucher (${safeVoucherNum}) for ${query?.destination || "Trip"}`,
      html: emailHtml,
      attachments: [...attachments, ...inlineImageAttachments],
    });

    if (queryId) {
      await TravelQuery.findByIdAndUpdate(queryId, { voucherStatus: "sent" });
    }

    return res.json({
      success: true,
      message: `Voucher email with PDF attachment successfully sent to ${emailToUse}`,
    });
  } catch (error) {
    console.error("Agent voucher email send error:", error);
    next(error);
  }
};
// ========================== Login Agent Controller ==========================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim().replace(/^"|"$/g, "");

    const user = await Auth.findOne({ email: normalizedEmail });

    if (!user) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    const { isMatch, shouldUpgradeHash } = await verifyLegacyCompatiblePassword(
      normalizedPassword,
      user.password,
    );

    if (!isMatch) {
      return next(new ApiError(400, "Invalid credentials"));
    }

    if (shouldUpgradeHash) {
      user.password = await bcrypt.hash(normalizedPassword, 10);
    }

    // Only agents need approval
    if (false && user.role === "agent" && !user.isApproved) {
      return next(new ApiError(403, "Your profile is under review. You will get access within 24–48 hours."));
    }

    if (user.role === "agent") {
      if (user.status === "rejected") {
        const rejectionReason = String(user.rejectionReason || "").trim();
        return next(new ApiError(
          403,
          rejectionReason
            ? `Your registration was rejected: ${rejectionReason}. Please submit the corrected details again.`
            : "Your registration was rejected. Please submit the corrected details again.",
        ));
      }

      if (!user.isApproved || user.status === "pending") {
        return next(new ApiError(403, "Your profile is under review. You will get access after admin approval."));
      }
    }

    if (user.isDeleted) {
      if (process.env.NODE_ENV === "production") {
        return next(new ApiError(403, "Your account access has been removed. Please contact the administrator."));
      } else {
        user.isDeleted = false;
        user.accountStatus = "Active";
        await user.save();
      }
    }

    if (user.accountStatus === "Inactive") {
      if (process.env.NODE_ENV === "production") {
        return next(new ApiError(403, "Your account is inactive. Please contact the administrator."));
      } else {
        user.accountStatus = "Active";
        await user.save();
      }
    }

    if (user.accessExpiry && isAccessExpired(user.accessExpiry)) {
      if (process.env.NODE_ENV === "production") {
        return next(new ApiError(403, "Your account access has expired. Please contact the administrator."));
      } else {
        user.accessExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        await user.save();
      }
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id,role: user.role ,name: user.name,email: user.email },process.env.JWT_SECRET,
      { expiresIn: "5d"}
    );

    res.status(200).json({
      message: "Login successfully",
      success: true,
      token,
      role: user.role,
      user: formatAuthenticatedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const sendHeartbeat = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();
    await Auth.findByIdAndUpdate(userId, {
      lastActiveAt: now,
    });

    return res.status(200).json({ success: true, timestamp: now });
  } catch (error) {
    next(error);
  }
};

// ========================= Update Profile Controller ==========================

export const updateProfile = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const user = await Auth.findById(userId);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const companyName = String(req.body?.companyName || "").trim();
    const profileImage = String(req.body?.profileImage || "").trim();
    const normalizedPhone = phone || undefined;

    if (!name) {
      return next(new ApiError(400, "Name is required"));
    }

    if (!email) {
      return next(new ApiError(400, "Email is required"));
    }

    if (user.role === "agent" && !companyName) {
      return next(new ApiError(400, "Company name is required for agents"));
    }

    const emailOwner = await Auth.findOne({
      email,
      _id: { $ne: userId },
    }).select("_id");

    if (emailOwner) {
      return next(new ApiError(409, "This email is already in use"));
    }

    if (normalizedPhone) {
      const phoneOwner = await Auth.findOne({
        phone: normalizedPhone,
        _id: { $ne: userId },
      }).select("_id");

      if (phoneOwner) {
        return next(new ApiError(409, "This phone number is already in use"));
      }
    }

    user.name = name;
    user.email = email;
    user.phone = normalizedPhone;
    if (req.body?.profileImage !== undefined) {
      user.profileImage = String(req.body.profileImage || "").trim();
    }
    if (req.body?.coverImage !== undefined) {
      user.coverImage = String(req.body.coverImage || "").trim();
    }
    if (req.body?.brandingLogo !== undefined) {
      user.brandingLogo = String(req.body.brandingLogo || "").trim();
    }
    if (req.body?.voucherFooterImage !== undefined) {
      user.voucherFooterImage = String(req.body.voucherFooterImage || "").trim();
    }
    if (req.body?.brandingName !== undefined) {
      user.brandingName = String(req.body.brandingName || "").trim();
    }

    if (["agent", "dmc_partner", "finance_partner"].includes(user.role)) {
      user.companyName = companyName;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatAuthenticatedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const user = await Auth.findById(userId);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      user: formatAuthenticatedUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ======================== Forgot Password OTP Controller ==========================

export const sendForgotPasswordOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new ApiError(400, "A valid email address is required"));
    }

    const user = await Auth.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for this email, a verification code has been sent.",
      });
    }

    const otp = generateNumericOtp();
    user.resetPasswordOtpHash = getHashedOtp(otp);
    user.resetPasswordOtpExpiry = new Date(Date.now() + 1 * 60 * 1000);
    user.resetPasswordOtpVerifiedAt = null;
    await user.save();

    await sendPasswordResetOtpMail(user.email, {
      name: user.name || user.companyName || "Team Member",
      otp,
    });

    res.status(200).json({
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// ======================== Verify Forgot Password OTP Controller ==========================

export const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return next(new ApiError(400, "Email and OTP are required"));
    }

    const user = await Auth.findOne({ email });

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpiry) {
      return next(new ApiError(400, "No active password reset request was found"));
    }

    if (user.resetPasswordOtpExpiry.getTime() < Date.now()) {
      user.resetPasswordOtpHash = "";
      user.resetPasswordOtpExpiry = null;
      user.resetPasswordOtpVerifiedAt = null;
      await user.save();
      return next(new ApiError(400, "OTP has expired. Please request a new code"));
    }

    if (getHashedOtp(otp) !== user.resetPasswordOtpHash) {
      return next(new ApiError(400, "Invalid OTP"));
    }

    user.resetPasswordOtpVerifiedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ========================= Reset Password with OTP Controller ==========================

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!email || !password || !confirmPassword) {
      return next(new ApiError(400, "Email, password, and confirm password are required"));
    }

    if (password.length < 6) {
      return next(new ApiError(400, "Password must be at least 6 characters"));
    }

    if (password !== confirmPassword) {
      return next(new ApiError(400, "Password and confirm password must match"));
    }

    const user = await Auth.findOne({ email });

    if (!user) {
      return next(new ApiError(404, "Account not found"));
    }

    if (!user.resetPasswordOtpVerifiedAt) {
      return next(new ApiError(400, "Verify your OTP before creating a new password"));
    }

    if (
      !user.resetPasswordOtpExpiry ||
      user.resetPasswordOtpExpiry.getTime() < Date.now()
    ) {
      user.resetPasswordOtpHash = "";
      user.resetPasswordOtpExpiry = null;
      user.resetPasswordOtpVerifiedAt = null;
      await user.save();
      return next(new ApiError(400, "OTP session expired. Please restart password recovery"));
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordOtpHash = "";
    user.resetPasswordOtpExpiry = null;
    user.resetPasswordOtpVerifiedAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};


/* ========================= AGENT DASHBOARD DATA CONTROLLER ========================= */

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentMonth = getMonthRange(0);
    const previousMonth = getMonthRange(-1);
    const startOfToday = getStartOfToday();

    const [
      totalQueries,
      queriesThisMonth,
      queriesLastMonth,
      activeBookings,
      activeBookingsTouchedToday,
      pendingQuoteDecisions,
      pendingDocuments,
      confirmedTrips,
      vouchersReady,
      recentQueries,
      recentNotifications,
      financeOverview,
    ] = await Promise.all([
      TravelQuery.countDocuments({ agent: agentId }),
      TravelQuery.countDocuments({
        agent: agentId,
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        createdAt: { $gte: previousMonth.start, $lt: previousMonth.end },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        opsStatus: { $in: ACTIVE_BOOKING_STATUSES },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        opsStatus: { $in: ACTIVE_BOOKING_STATUSES },
        updatedAt: { $gte: startOfToday },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        quotationStatus: "Sent_To_Agent",
        agentStatus: { $nin: ["Client Approved", "Confirmed", "Rejected"] },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        opsStatus: { $in: ACTIVE_BOOKING_STATUSES },
        "travelerDocumentVerification.status": { $in: ["Draft", "Pending", "Rejected"] },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        opsStatus: { $in: ["Confirmed", "Vouchered", "Payment_Completed"] },
      }),
      TravelQuery.countDocuments({
        agent: agentId,
        voucherStatus: { $in: ["generated", "sent"] },
      }),
      TravelQuery.find({ agent: agentId })
        .select(
          "queryId destination agentStatus opsStatus quotationStatus voucherStatus activityLog createdAt updatedAt",
        )
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      Notification.find({
        user: agentId,
        $or: [
          { "meta.kind": { $ne: "coupon" } },
          { "meta.kind": { $exists: false } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      buildAgentFinanceOverviewPayload(agentId, { includeTransactions: false }),
    ]);

    const {
      queryRange,
      queryYear,
      queryMonth,
      queryWeek,
      paymentRange,
      paymentYear,
      paymentMonth,
      paymentWeek,
    } = req.query;

    const computeDateRange = (rangeType, yearParam, monthParam, weekParam) => {
      const now = new Date();
      const year = Number(yearParam) || now.getFullYear();
      let start = new Date(year, 0, 1, 0, 0, 0, 0);
      let end = new Date(year, 11, 31, 23, 59, 59, 999);

      if (monthParam !== undefined && monthParam !== null && monthParam !== "") {
        const month = Number(monthParam);
        start = new Date(year, month, 1, 0, 0, 0, 0);
        end = new Date(year, month + 1, 0, 23, 59, 59, 999);

        if (weekParam !== undefined && weekParam !== null && weekParam !== "") {
          const week = Number(weekParam);
          const dayStart = 1 + week * 7;
          const lastDayOfMonth = end.getDate();
          const dayEnd = Math.min(dayStart + 6, lastDayOfMonth);
          start = new Date(year, month, dayStart, 0, 0, 0, 0);
          end = new Date(year, month, dayEnd, 23, 59, 59, 999);
        }
      }

      return { start, end };
    };

    const qRange = computeDateRange(queryRange, queryYear, queryMonth, queryWeek);
    const pRange = computeDateRange(paymentRange, paymentYear, paymentMonth, paymentWeek);

    const activeBookingMatch = {
      agent: agentId,
      $or: [
        { opsStatus: { $in: ACTIVE_BOOKING_STATUSES } },
        { agentStatus: { $in: ["Confirmed", "Client Approved"] } },
      ],
    };

    const [
      pastQueriesCount,
      presentQueriesCount,
      futureQueriesCount,
    ] = await Promise.all([
      TravelQuery.countDocuments({
        agent: agentId,
        $and: [
          { createdAt: { $lt: qRange.start } },
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: null },
              { startDate: { $lt: qRange.start } },
            ],
          },
        ],
      }),

      TravelQuery.countDocuments({
        agent: agentId,
        $or: [
          { createdAt: { $gte: qRange.start, $lte: qRange.end } },
          { startDate: { $gte: qRange.start, $lte: qRange.end } },
        ],
      }),

      TravelQuery.countDocuments({
        agent: agentId,
        $or: [
          { createdAt: { $gt: qRange.end } },
          { startDate: { $gt: qRange.end } },
        ],
      }),
    ]);

    // Calculate Received Amount & Pending Amount for Payment Analytics in pRange
    const queriesForPayment = await TravelQuery.find({
      ...activeBookingMatch,
      $or: [
        { startDate: { $gte: pRange.start, $lte: pRange.end } },
        { createdAt: { $gte: pRange.start, $lte: pRange.end } },
        { updatedAt: { $gte: pRange.start, $lte: pRange.end } },
      ],
    })
      .select("_id queryId customerBudget opsStatus agentStatus")
      .lean();

    const queryIds = queriesForPayment.map((q) => q._id);

    const invoicesForPayment = await Invoice.find({
      $or: [
        { agent: agentId, createdAt: { $gte: pRange.start, $lte: pRange.end } },
        { query: { $in: queryIds } },
      ],
    }).lean();

    let receivedAmount = 0;       // Amount Received from Client
    let amountPayable = 0;        // Amount Agent needs to Pay Platform/Ops
    let clientPendingAmount = 0;  // Pending Balance to collect from Client
    const processedQueryIds = new Set();

    invoicesForPayment.forEach((inv) => {
      if (inv.query) processedQueryIds.add(String(inv.query));
      const grandTotal = Number(inv.totalAmount || inv.paymentSubmission?.amount || 0);
      const opsCost = typeof getInvoiceOpsSubtotalAmount === "function"
        ? getInvoiceOpsSubtotalAmount(inv)
        : Math.round(grandTotal * 0.85);
      const paid = Number(
        inv.paymentSubmission?.amount ||
        (inv.paymentStatus === "Paid" ? grandTotal : 0)
      );

      receivedAmount += paid;
      clientPendingAmount += Math.max(0, grandTotal - paid);

      const netPaidToOps = inv.paymentStatus === "Paid" ? opsCost : Math.min(paid, opsCost);
      amountPayable += Math.max(0, opsCost - netPaidToOps);
    });

    queriesForPayment.forEach((q) => {
      if (!processedQueryIds.has(String(q._id))) {
        const clientBudget = Number(q.customerBudget || 0);
        const estOpsCost = Math.round(clientBudget * 0.85);

        if (q.opsStatus === "Payment_Completed") {
          receivedAmount += clientBudget;
        } else if (q.opsStatus === "Confirmed" || q.opsStatus === "Vouchered") {
          const estPaid = Math.round(clientBudget * 0.5);
          receivedAmount += estPaid;
          clientPendingAmount += Math.max(0, clientBudget - estPaid);
          amountPayable += Math.max(0, estOpsCost - estPaid);
        } else {
          clientPendingAmount += clientBudget;
          amountPayable += estOpsCost;
        }
      }
    });

    const recentActivity = [...recentNotifications.map(buildNotificationActivityItem), ...recentQueries.map(buildQueryActivityItem)]
      .filter((item) => item?.date)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 6);

    // Calculate 12-month query trend data
    const startOfTrend = new Date();
    startOfTrend.setDate(1);
    startOfTrend.setMonth(startOfTrend.getMonth() - 11);
    startOfTrend.setHours(0, 0, 0, 0);

    const queriesForTrend = await TravelQuery.find({
      agent: agentId,
      createdAt: { $gte: startOfTrend },
    })
      .select("createdAt opsStatus agentStatus")
      .lean();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendMap = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap[key] = {
        key,
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        queries: 0,
        bookings: 0,
      };
    }

    queriesForTrend.forEach((query) => {
      const qDate = new Date(query.createdAt);
      const key = `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, "0")}`;
      if (trendMap[key]) {
        trendMap[key].queries += 1;
        const isConfirmed =
          query.agentStatus === "Confirmed" ||
          ["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus);
        if (isConfirmed) {
          trendMap[key].bookings += 1;
        }
      }
    });

    const queryTrendData = Object.keys(trendMap)
      .sort()
      .map((key) => trendMap[key]);

    res.json({
      summary: {
        totalQueries,
        activeBookings,
        activeBookingsTouchedToday,
        pastQueries: pastQueriesCount,
        presentQueries: presentQueriesCount,
        futureQueries: futureQueriesCount,
        receivedAmount: Math.round(receivedAmount || 0),
        amountPayable: Math.round(amountPayable || 0),
        clientPendingAmount: Math.round(clientPendingAmount || 0),
        walletBalance: financeOverview.summary.currentBalance,
        pendingCommissions: financeOverview.summary.pendingCommissions,
        totalEarnings: financeOverview.summary.totalEarnings,
        currency: financeOverview.currency,
      },
      trends: {
        queries: buildDashboardTrend(queriesThisMonth, queriesLastMonth),
      },
      pipeline: [
        {
          key: "quotes-awaiting",
          label: "Awaiting Quote Decision",
          count: pendingQuoteDecisions,
          tone: "info",
          link: "/agent/queries",
        },
        {
          key: "documents-pending",
          label: "Documents Pending",
          count: pendingDocuments,
          tone: "warning",
          link: "/agent/documents",
        },
        {
          key: "confirmed-trips",
          label: "Confirmed Trips",
          count: confirmedTrips,
          tone: "success",
          link: "/agent/bookings",
        },
        {
          key: "vouchers-ready",
          label: "Vouchers Ready",
          count: vouchersReady,
          tone: "success",
          link: "/agent/bookings",
        },
      ],
      recentActivity,
      queryTrendData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ========================= CREATE TRAVEL QUERY CONTROLLER ========================= */

export const createQuery = async (req, res, next) => {
  try {
    const createLog = (action, performedBy) => ({action, performedBy, timestamp: new Date()})

    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return next(new ApiError(401, "Unauthorized. Agent not found"));
    }

    const {
      destination,
      destinationCategory,
      tourType,
      clientEmail,
      startDate,
      endDate,
      numberOfAdults,
      numberOfChildren,
      customerBudget,
      hotelCategory,
      transportRequired,
      sightseeingRequired,
      specialRequirements,
      travelerDetails,
    } = req.body;

    // ✅ Basic validation
    const normalizedDestination = String(destination || "").trim();
    const normalizedDestinationCategory = String(destinationCategory || "").trim();
    const normalizedTourType = String(tourType || "").trim();

    if (!normalizedDestination || !startDate || !endDate || !numberOfAdults || !String(specialRequirements || "").trim()) {
      return next(new ApiError(400, "Detailed Requirement is required"));
    }

    const normalizedClientEmail = String(clientEmail || "").trim().toLowerCase();
    if (normalizedClientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedClientEmail)) {
      return next(new ApiError(400, "Please enter a valid client email address"));
    }

    const normalizedAdults = Number(numberOfAdults || 0);
    const normalizedChildren = Number(numberOfChildren || 0);
    const normalizedTravelerDetails = normalizeTravelerDetails(
      travelerDetails,
      normalizedAdults,
      normalizedChildren,
    );
    const normalizedHotelCategory = normalizeHotelCategorySelection(hotelCategory);

    await ensureDestinationName({
      label: normalizedDestination,
      source: "manual",
      createdBy: req.user.id,
    });

    /* ================= QUERY NUMBER ================= */

    let queryCounter = await Counter.findOne({ name: "query" });

    if (!queryCounter) {
      queryCounter = await Counter.create({
        name: "query",
        seq: 1000
      });
    }

    queryCounter.seq += 1;
    await queryCounter.save();

    const queryId = `QRY-${queryCounter.seq}`;


    /* ================= OPS ROUND ROBIN ================= */

    //========================= 1️⃣ get all active ops users ================================
    const opsUsers = await Auth.find({
      role: "operations",
      isApproved: true,
      isDeleted: { $ne: true },
      accountStatus: "Active",
      manager: { $exists: true, $ne: "" },
    }).sort({ createdAt: 1 });

    if (!opsUsers.length) {
      return next(new ApiError(400, "No manager-created operations executive available for query assignment"));
    }

    //===================== 2️⃣ ops counter ==========================
    let opsCounter = await Counter.findOne({ name: "ops_assign" });

    if (!opsCounter) {
      opsCounter = await Counter.create({
        name: "ops_assign",
        seq: 0
      });
    }

    //======================== 3️⃣round robin logic ========================================
    const opsIndex = opsCounter.seq % opsUsers.length;
    const assignedOps = opsUsers[opsIndex];

    opsCounter.seq += 1;
    await opsCounter.save();

    /* ================= CREATE QUERY ================= */

    const query = await TravelQuery.create({
      agent: req.user.id,
      assignedTo: assignedOps._id,   // KEY LINE
      queryId,
      destination: normalizedDestination,
      destinationCategory: normalizedDestinationCategory,
      tourType: normalizedTourType,
      clientEmail: normalizedClientEmail,
      startDate,
      endDate,
      numberOfAdults: normalizedAdults,
      numberOfChildren: normalizedChildren,
      customerBudget,
      hotelCategory: normalizedHotelCategory,
      transportRequired,
      sightseeingRequired,
      specialRequirements,
      travelerDetails: normalizedTravelerDetails,
       //  IMPORTANT
       agentStatus: "Pending",
       opsStatus: "New_Query",
  // ✅ ACTIVITY LOG
    activityLog: [
    createLog("Query Created", "Agent"),
  ]
    });

  await Notification.create({
  user: req.user.id,
  type: "info",
  title: "Query Submitted",
  message: `Your query ${query.queryId} has been created successfully.`,
  meta: {
    queryId: query._id,
    destination: query.destination,
  },
});

  await createNotification(
    {
      user: assignedOps._id,
      type: "info",
      title: "New Query Assigned",
      message: `${query.queryId} has been assigned to you for ${query.destination}.`,
      link: "/ops/bookings-management",
      meta: {
        queryId: query._id,
        queryNumber: query.queryId,
        destination: query.destination,
        assignedTo: assignedOps._id,
        nextAction: "review_new_query",
      },
    },
    {
      mirrorToAdmins: true,
      sourceRole: req.user?.role,
      sourceUserId: req.user?.id || req.user?._id || null,
      sourceName: req.user?.name || req.user?.companyName || "Agent",
    },
  );

  try {
    if (assignedOps?.email) {
      await sendNewQueryAssignedMail(assignedOps.email, {
        opsName: assignedOps.name || "Operations Team",
        queryId: query.queryId,
        destination: query.destination,
        startDate: query.startDate,
        endDate: query.endDate,
        numberOfAdults: query.numberOfAdults,
        numberOfChildren: query.numberOfChildren,
        customerBudget: query.customerBudget,
        hotelCategory: query.hotelCategory,
        transportRequired: query.transportRequired,
        sightseeingRequired: query.sightseeingRequired,
        specialRequirements: query.specialRequirements,
        agentName: req.user?.name || "Agent",
        agentCompany: req.user?.companyName || "",
        agentEmail: req.user?.email || "",
        dashboardUrl: buildFrontendUrl("/ops/bookings-management"),
      });
    }
  } catch (mailError) {
    console.error("Unable to send new query assignment email", {
      queryId: query.queryId,
      assignedTo: assignedOps?._id,
      recipient: assignedOps?.email,
      error: mailError?.message || mailError,
    });
  }

  try {
    if (req.user?.email) {
      await sendAgentQueryCreatedMail(req.user.email, {
        agentName: req.user?.name || req.user?.companyName || "Agent",
        queryId: query.queryId,
        destination: query.destination,
        startDate: query.startDate,
        endDate: query.endDate,
        numberOfAdults: query.numberOfAdults,
        numberOfChildren: query.numberOfChildren,
        customerBudget: query.customerBudget,
        hotelCategory: query.hotelCategory,
        transportRequired: query.transportRequired,
        sightseeingRequired: query.sightseeingRequired,
        specialRequirements: query.specialRequirements,
        assignedOpsName: assignedOps?.name || "Operations Team",
        dashboardUrl: buildFrontendUrl("/agent/queries"),
      });
    }
  } catch (mailError) {
    console.error("Unable to send query creation confirmation email", {
      queryId: query.queryId,
      agent: req.user?.id || req.user?._id,
      recipient: req.user?.email,
      error: mailError?.message || mailError,
    });
  }

    return res.status(201).json({
      success: true,
      message: "Query created and assigned successfully",
      query
    });

  } catch (error) {
    next(error);
  }
};


/* ========================= VIEW OWN QUERIES CONTROLLER ========================= */

export const getMyQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const queries = await TravelQuery.find({ agent: req.user.id }).sort({ createdAt: -1 });

    return res.json({ message: "All queries fetched successfully", queries });

  } catch (error) {
    next(error);
  }
};



/* ========================= VIEW ACTIVE BOOKINGS CONTROLLER ========================= */

export const getMyActiveBookings = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const queries = await TravelQuery.find({
      agent: agentId,
      opsStatus: { $in: ["Invoice_Requested", "Confirmed", "Vouchered", "Payment_Completed"] },
    })
      .select(
        "queryId destination startDate endDate numberOfAdults numberOfChildren customerBudget specialRequirements travelerDetails travelerDocumentVerification travelerDocumentAuditTrail opsStatus agentStatus activityLog createdAt updatedAt",
      )
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    if (!queries.length) {
      return res.json([]);
    }

    const queryIds = queries.map((query) => query._id);

    const [invoices, quotations] = await Promise.all([
      Invoice.find({
        agent: agentId,
        query: { $in: queryIds },
      })
        .select(
          "query invoiceNumber totalAmount currency lineItems pricingSnapshot tripSnapshot templateVariant paymentStatus remarks paymentSubmission paymentVerification paymentAuditTrail createdAt",
        )
        .sort({ createdAt: -1 })
        .lean(),
      Quotation.find({
        agent: agentId,
        queryId: { $in: queryIds },
        status: { $in: AGENT_VISIBLE_QUOTATION_STATUSES },
      })
        .select("queryId quotationNumber clientTotalAmount pricing validTill status createdAt updatedAt")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
    ]);

    const latestInvoiceByQuery = invoices.reduce((acc, invoice) => {
      const key = invoice?.query ? String(invoice.query) : "";
      if (key && !acc[key]) {
        acc[key] = invoice;
      }
      return acc;
    }, {});

    const latestQuotationByQuery = quotations.reduce((acc, quotation) => {
      const key = quotation?.queryId ? String(quotation.queryId) : "";
      if (key && !acc[key]) {
        acc[key] = quotation;
      }
      return acc;
    }, {});

    const activeBookings = [];

    for (const query of queries) {
      try {
        const key = query?._id ? String(query._id) : "";
        if (!key) continue;

        let invoice = latestInvoiceByQuery[key] || null;
        const quotation = latestQuotationByQuery[key];

        if (!invoice && quotation?.status === "Confirmed") {
          invoice = await ensureInvoiceForConfirmedQuotation({
            quotation,
            query,
            actorId: agentId,
          });
          latestInvoiceByQuery[key] = invoice;
        }

        activeBookings.push({
          _id: query._id,
          createdAt: query.createdAt || null,
          updatedAt: query.updatedAt || null,
          queryId: query.queryId || "",
          destination: query.destination || "",
          startDate: query.startDate || null,
          endDate: query.endDate || null,
          numberOfAdults: Number(query.numberOfAdults || 0),
          numberOfChildren: Number(query.numberOfChildren || 0),
          customerBudget: Number(query.customerBudget || 0),
          specialRequirements: query.specialRequirements || "",
          travelerDetails: Array.isArray(query.travelerDetails) ? query.travelerDetails : [],
          travelerDocumentVerification: getTravelerDocumentVerification(query),
          travelerDocumentAuditTrail: Array.isArray(query.travelerDocumentAuditTrail)
            ? query.travelerDocumentAuditTrail
            : [],
          opsStatus: query.opsStatus || "",
          agentStatus: query.agentStatus || "",
          activityLog: Array.isArray(query.activityLog) ? query.activityLog : [],
          invoice: invoice
            ? {
                _id: invoice._id,
                invoiceNumber: invoice.invoiceNumber || "",
                totalAmount: Number(invoice.totalAmount || 0),
                currency: invoice.currency || "INR",
                lineItems: Array.isArray(invoice.lineItems) ? invoice.lineItems : [],
                pricingSnapshot: invoice.pricingSnapshot || {},
                tripSnapshot: invoice.tripSnapshot || {},
                templateVariant: invoice.templateVariant || "grand-ledger",
                paymentStatus: invoice.paymentStatus || "Pending",
                remarks: invoice.remarks || "",
                paymentSubmission: invoice.paymentSubmission || {},
                paymentVerification: invoice.paymentVerification || { status: "Pending" },
                paymentAuditTrail: Array.isArray(invoice.paymentAuditTrail) ? invoice.paymentAuditTrail : [],
                createdAt: invoice.createdAt || null,
              }
            : null,
          quotation: quotation
            ? {
                _id: quotation._id,
                quotationNumber: quotation.quotationNumber || "",
                clientTotalAmount: Number(quotation.clientTotalAmount || 0),
                pricingTotalAmount: Number(quotation.pricing?.totalAmount || 0),
                quoteCategory: quotation.pricing?.quoteCategory || "",
                validTill: quotation.validTill || null,
                status: quotation.status || "",
              }
            : null,
        });
      } catch (mappingError) {
        console.error("[agent/active-bookings] booking mapping failed", {
          agentId: String(agentId),
          queryMongoId: query?._id ? String(query._id) : "",
          queryId: query?.queryId || "",
          message: mappingError?.message || "Unknown mapping error",
        });
      }
    }

    res.json(activeBookings);
  } catch (error) {
    console.error("[agent/active-bookings] request failed", {
      agentId: req.user?.id || req.user?._id || "",
      message: error?.message || "Unknown error",
      stack: error?.stack || "",
    });
    res.status(500).json({ message: error.message });
  }
};



//================= Upload traveler document (passport or government ID) for a specific traveler in a travel query ============ 

export const uploadTravelerDocument = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { queryId, travelerId } = req.params;

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!req.file) {
      return next(new ApiError(400, "Traveler document is required"));
    }

    const query = await TravelQuery.findOne({
      _id: queryId,
      agent: agentId,
    });

    if (!query) {
      return next(new ApiError(404, "Booking not found"));
    }

    const traveler = query.travelerDetails.id(travelerId);

    if (!traveler) {
      return next(new ApiError(404, "Traveler not found"));
    }

    const requestedDocumentType =
      String(req.body?.documentType || traveler.documentType || "Passport").trim() || "Passport";
    const documentKey = getTravelerDocumentKey(requestedDocumentType);
    const uploadedDocument = {
      url: req.file?.path || req.file?.secure_url || "",
      fileName: req.file?.originalname || req.file?.filename || "traveler-document",
      mimeType: req.file?.mimetype || "",
      size: Number(req.file?.size || 0),
      uploadedAt: new Date(),
    };

    if (hasTravelerDocumentTypeMismatch(documentKey, uploadedDocument)) {
      return next(
        new ApiError(
          400,
          documentKey === "passport"
            ? "This looks like a PAN/Government ID file. Please upload it in the PAN Card slot, or rename the file if this is actually a passport."
            : "This looks like a passport file. Please upload it in the Passport slot, or rename the file if this is actually a PAN Card.",
        ),
      );
    }

    const existingDocuments = normalizeTravelerDocuments(
      traveler.documents,
      traveler.document,
      traveler.documentType,
    );

    traveler.documentType = requestedDocumentType;
    traveler.document = uploadedDocument;
    traveler.documents = {
      ...existingDocuments,
      [documentKey]: uploadedDocument,
    };

    const currentVerification = getTravelerDocumentVerification(query);
    if (currentVerification.status !== "Draft") {
      const remainingIssues = currentVerification.issues.filter(
        (issue) => !matchesTravelerDocumentReviewEntry(issue, traveler, documentKey),
      );
      const remainingVerifiedDocuments = currentVerification.verifiedDocuments.filter(
        (document) => !matchesTravelerDocumentReviewEntry(document, traveler, documentKey),
      );
      const shouldKeepVerifiedStatus =
        currentVerification.status === "Verified" &&
        remainingIssues.length === 0 &&
        getVerifiedRequiredTravelerDocumentProgress(query, remainingVerifiedDocuments)
          .allRequiredVerified;

      resetTravelerDocumentVerification(
        query,
        shouldKeepVerifiedStatus
          ? "Verified"
          : currentVerification.status === "Rejected"
            ? "Rejected"
            : "Draft",
        {
          issues: remainingIssues,
          verifiedDocuments: remainingVerifiedDocuments,
          rejectionReason:
            currentVerification.status === "Rejected"
              ? currentVerification.rejectionReason
              : "",
          rejectionRemarks:
            currentVerification.status === "Rejected"
              ? currentVerification.rejectionRemarks
              : "",
        },
      );
      query.travelerDocumentAuditTrail.push({
        action: "Traveler documents updated",
        status: query.travelerDocumentVerification.status,
        performedBy: agentId,
        performedByName: req.user?.name || "Agent",
        remarks: `${traveler.fullName || "Traveler"} ${requestedDocumentType} updated by agent.`,
        performedAt: new Date(),
      });
    }

    await query.save();

    res.status(200).json({
      success: true,
      message: "Traveler document uploaded successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};


// ===================== Remove traveler document (passport or government ID) for a specific traveler in a travel query =========================

export const removeTravelerDocument = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { queryId, travelerId } = req.params;
    const documentKey = String(req.params?.documentKey || "").trim();

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!["passport", "governmentId"].includes(documentKey)) {
      return next(new ApiError(400, "Invalid traveler document slot"));
    }

    const query = await TravelQuery.findOne({
      _id: queryId,
      agent: agentId,
    });

    if (!query) {
      return next(new ApiError(404, "Booking not found"));
    }

    const traveler = query.travelerDetails.id(travelerId);

    if (!traveler) {
      return next(new ApiError(404, "Traveler not found"));
    }

    const existingDocuments = normalizeTravelerDocuments(
      traveler.documents,
      traveler.document,
      traveler.documentType,
    );
    const removedDocument = existingDocuments[documentKey] || {};

    if (!removedDocument.url) {
      return next(new ApiError(400, "No document uploaded in this slot"));
    }

    traveler.documents = {
      ...existingDocuments,
      [documentKey]: emptyTravelerDocument(),
    };

    const legacyDocument = normalizeTravelerDocument(traveler.document);
    if (legacyDocument.url && legacyDocument.url === removedDocument.url) {
      traveler.document = emptyTravelerDocument();
      traveler.documentType = documentKey === "governmentId" ? "PAN Card" : "Passport";
    }

    const currentVerification = getTravelerDocumentVerification(query);
    const remainingIssues = currentVerification.issues.filter(
      (issue) => !matchesTravelerDocumentReviewEntry(issue, traveler, documentKey),
    );
    const remainingVerifiedDocuments = currentVerification.verifiedDocuments.filter(
      (document) => !matchesTravelerDocumentReviewEntry(document, traveler, documentKey),
    );

    if (currentVerification.status !== "Draft" || remainingIssues.length !== currentVerification.issues.length || remainingVerifiedDocuments.length !== currentVerification.verifiedDocuments.length) {
      resetTravelerDocumentVerification(query, currentVerification.status === "Rejected" ? "Rejected" : "Draft", {
        issues: remainingIssues,
        verifiedDocuments: remainingVerifiedDocuments,
        rejectionReason:
          currentVerification.status === "Rejected"
            ? currentVerification.rejectionReason
            : "",
        rejectionRemarks:
          currentVerification.status === "Rejected"
            ? currentVerification.rejectionRemarks
            : "",
      });
    }

    query.travelerDocumentAuditTrail.push({
      action: "Traveler document removed",
      status: query.travelerDocumentVerification.status,
      performedBy: agentId,
      performedByName: req.user?.name || "Agent",
      remarks: `${traveler.fullName || "Traveler"} ${documentKey === "passport" ? "Passport" : "PAN Card"} removed by agent.`,
      performedAt: new Date(),
    });

    await query.save();

    res.status(200).json({
      success: true,
      message: "Traveler document removed successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};



// ==================== Submit traveler documents for ops verification Controller =========================

export const submitTravelerDocumentsForVerification = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { queryId } = req.params;

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const query = await TravelQuery.findOne({
      _id: queryId,
      agent: agentId,
    });

    if (!query) {
      return next(new ApiError(404, "Booking not found"));
    }

    const currentVerification = getTravelerDocumentVerification(query);
    if (currentVerification.status === "Pending") {
      return next(new ApiError(400, "Traveler documents are already pending ops review"));
    }

    if (currentVerification.status === "Verified") {
      return next(new ApiError(400, "Traveler documents are already verified by ops"));
    }

    const latestQuotation = await Quotation.findOne({ queryId: query._id })
      .sort({ createdAt: -1 })
      .select("pricing.quoteCategory");

    const completion = getTravelerDocumentCompletion({
      destination: query?.destination || "",
      travelerDetails: Array.isArray(query?.travelerDetails) ? query.travelerDetails : [],
      quoteCategory: latestQuotation?.pricing?.quoteCategory || "",
    });

    if (!completion.rows.length) {
      return next(new ApiError(400, "No traveler records are available for this booking"));
    }

    if (!completion.allComplete) {
      const mismatchRows = completion.rows.filter((row) => row.mismatchedDocumentKeys?.length);
      if (mismatchRows.length) {
        return next(
          new ApiError(
            400,
            "One or more documents look uploaded in the wrong slot. Please remove or replace the highlighted file before submitting.",
          ),
        );
      }

      return next(
        new ApiError(
          400,
          completion.isInternationalTrip
            ? "International trips require both Passport and PAN Card for every traveler before submission"
            : "Domestic trips require at least one PAN Card upload for every traveler before submission",
        ),
      );
    }

    resetTravelerDocumentVerification(query, "Pending", {
      issues: currentVerification.issues,
      verifiedDocuments: currentVerification.verifiedDocuments,
    });
    query.activityLog.push({
      action: "Traveler Documents Submitted",
      performedBy: req.user?.name || "Agent",
      timestamp: new Date(),
    });
    query.travelerDocumentAuditTrail.push({
      action: "Submitted for ops review",
      status: "Pending",
      performedBy: agentId,
      performedByName: req.user?.name || "Agent",
      remarks: "Traveler documents submitted to operations for verification.",
      performedAt: new Date(),
    });

    await query.save();

    if (query.assignedTo) {
      await Notification.create({
        user: query.assignedTo,
        type: "info",
        title: "Traveler Documents Submitted",
        message: `${query.queryId} traveler documents are ready for ops verification.`,
        meta: {
          queryId: query._id,
          queryNumber: query.queryId,
          verificationStatus: "Pending",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Traveler documents submitted to operations successfully",
      query,
    });
  } catch (error) {
    next(error);
  }
};

/* ========================= VIEW QUOTATION CONTROLLER ========================= */

// Get quotations for a specific TravelQuery
export const getQuotationsByQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;

    if (!queryId) {
      return next(new ApiError(400, "Query ID is required"));
    }

    // Check if the TravelQuery exists
    const query = await TravelQuery.findById(queryId);
    if (!query) {
      return next(new ApiError(404, "Travel query not found"));
    }

    // Role-based access
    const userRole = req.user.role; // middleware se set
    const userId = req.user.id;

    if (userRole === "agent" && query.agent.toString() !== userId) {
      return next(new ApiError(403, "Forbidden: You cannot access this quotation"));
    }

    // Fetch quotations for this query
    const quotations = await Quotation.find({
      queryId: query._id,
      status: { $in: AGENT_VISIBLE_QUOTATION_STATUSES },
    }).sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      quotations
    });

  } catch (error) {
    next(error);
  }
};


//================ Accept Quotation by Agent Controller ======================

export const acceptQuotationByAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, markupType, markupValue } = req.body;
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    if (String(quotation.agent?._id || quotation.agent) !== String(agentId)) {
      return next(new ApiError(403, "Forbidden: You cannot modify this quotation"));
    }

    /* STEP 1: ACCEPT QUOTE */
    if (action === "ACCEPT") {
      if (quotation.status !== "Quote Sent") {
        return next(new ApiError(400, "Quote cannot be accepted"));
      }

      quotation.status = "Quote Accepted";
      await quotation.save();

      return res.json({ success: true, quotation });
    }

    /* STEP 2: APPLY MARKUP */
    if (action === "APPLY_MARKUP") {
      if (!["Quote Sent", "Quote Accepted", "Markup Applied", "Sent to Client"].includes(quotation.status)) {
        return next(new ApiError(400, "Quote cannot be modified"));
      }

      const opsTotal = Number(quotation.pricing?.totalAmount || quotation.totalAmount || 0);
      if (opsTotal <= 0) {
        return next(new ApiError(400, "Ops quote total is missing"));
      }

      const validationMessage = validateAgentMarkupPolicy({
        markupType,
        markupValue,
      });

      if (validationMessage) {
        return next(new ApiError(400, validationMessage));
      }

      const normalizedMarkupType = String(markupType || "").trim().toUpperCase();
      const normalizedMarkupValue = Number(markupValue);

      const markupAmount =
  normalizedMarkupType === "PERCENT"
    ? Math.round((opsTotal * normalizedMarkupValue) / 100)
    : Math.round(normalizedMarkupValue);

      quotation.agentMarkup = {
        type: normalizedMarkupType,
        value: normalizedMarkupValue,
        markupAmount,
      };

      quotation.clientTotalAmount = Math.round(opsTotal + markupAmount);
      quotation.status =
        quotation.status === "Sent to Client" ? "Sent to Client" : "Markup Applied";

      await quotation.save();

      return res.json({ success: true, quotation });
    }

    /* STEP 3: SEND TO CLIENT */
    if (action === "SEND_TO_CLIENT") {
      if (!["Quote Sent", "Quote Accepted", "Markup Applied", "Sent to Client"].includes(quotation.status)) {
        return next(new ApiError(400, "Quote cannot be sent"));
      }

      if (
        quotation.status === "Quote Accepted" &&
        (quotation.clientTotalAmount === undefined || quotation.clientTotalAmount === null)
      ) {
        quotation.agentMarkup = {
          type: quotation.agentMarkup?.type || "AMOUNT",
          value: Number(quotation.agentMarkup?.value || 0),
          markupAmount: Number(quotation.agentMarkup?.markupAmount || 0),
        };
        quotation.clientTotalAmount = Number(
          quotation.pricing?.totalAmount || quotation.totalAmount || 0,
        );
      }

      const [query, agent] = await Promise.all([
        TravelQuery.findById(quotation.queryId),
        Auth.findById(agentId).select("name email companyName phone address companyAddress website gstNumber brandingName brandingLogo brandingFooter voucherFooterImage footerImage profileImage avatar companyLogo"),
      ]);

      if (!query) {
        return next(new ApiError(404, "Travel query not found"));
      }

      const requestedRecipientEmail = String(req.body?.recipientEmail || "").trim().toLowerCase();
      const recipientEmail = String(
        requestedRecipientEmail || query?.clientEmail || agent?.email || "",
      )
        .trim()
        .toLowerCase();

      if (!recipientEmail) {
        return next(new ApiError(400, "No registered email is available to send this quotation"));
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(recipientEmail)) {
        return next(new ApiError(400, "Please provide a valid recipient email"));
      }

      const emailPayload = buildQuotationClientEmailPayload({ quotation, query, agent });

      if (query.clientEmail !== recipientEmail) {
        query.clientEmail = recipientEmail;
      }

      await markQuotationSharedWithClient({
        quotation,
        query,
        performedBy: req.user?.name || "Agent",
      });

      // Dispatch email asynchronously in background so user receives instant sub-second response!
      sendAgentClientQuotationMail(recipientEmail, emailPayload).catch((mailError) => {
        console.error("Async client quotation email send error:", mailError);
      });

      return res.json({
        success: true,
        quotation,
        recipientEmail,
        mail: { status: "processing", email: recipientEmail },
        summary: {
          quotationNumber: quotation.quotationNumber || "",
          destination: query.destination || "",
          serviceCount: Array.isArray(emailPayload.services) ? emailPayload.services.length : 0,
          inclusionCount: Array.isArray(emailPayload.inclusions) ? emailPayload.inclusions.length : 0,
          totalAmount: emailPayload.totalAmount,
          validTill: emailPayload.validTill,
        },
      });
    }

    if (action === "MARK_SHARED_TO_CLIENT") {
      if (!["Quote Accepted", "Markup Applied", "Sent to Client"].includes(quotation.status)) {
        return next(new ApiError(400, "Accept quote first"));
      }

      const query = await TravelQuery.findById(quotation.queryId);
      if (!query) {
        return next(new ApiError(404, "Travel query not found"));
      }

      if (
        quotation.status === "Quote Accepted" &&
        (quotation.clientTotalAmount === undefined || quotation.clientTotalAmount === null)
      ) {
        quotation.agentMarkup = {
          type: quotation.agentMarkup?.type || "AMOUNT",
          value: Number(quotation.agentMarkup?.value || 0),
          markupAmount: Number(quotation.agentMarkup?.markupAmount || 0),
        };
        quotation.clientTotalAmount = Number(
          quotation.pricing?.totalAmount || quotation.totalAmount || 0,
        );
      }

      await markQuotationSharedWithClient({
        quotation,
        query,
        performedBy: req.user?.name || "Agent",
      });

      return res.json({
        success: true,
        quotation,
        summary: {
          quotationNumber: quotation.quotationNumber || "",
          destination: query.destination || "",
          serviceCount: Array.isArray(quotation.services) ? quotation.services.length : 0,
          totalAmount: Number(
            quotation.clientTotalAmount || quotation.pricing?.totalAmount || quotation.totalAmount || 0,
          ),
          validTill: quotation.validTill ? formatMailDateLabel(quotation.validTill) : "-",
        },
      });
    }

    return next(new ApiError(400, "Invalid action"));
  } catch (error) {
    next(error);
  }
};



/* ========================= REQUEST QUOTATION REVISION CONTROLLER ========================= */

export const requestQuotationRevision = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { reason = "" } = req.body;

    const quotation = await Quotation.findOne({ _id: req.params.id, agent: agentId });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (!["Quote Sent", "Sent to Client"].includes(quotation.status)) {
      return res.status(400).json({
        message: "Revision can only be requested for a quote that was sent by operations or already shared with the client",
      });
    }

    quotation.status = "Revision Requested";
    quotation.agentRevisionRemark = String(reason || "").trim();
    await quotation.save();

    const query = await TravelQuery.findById(quotation.queryId);

    if (query) {
      query.agentStatus = "Revision Requested";
      query.opsStatus = "Revision_Query";
      query.quotationStatus = "Awaiting_Decision";
      query.rejectionNote = String(reason || "").trim();
      query.activityLog = query.activityLog || [];
      query.activityLog.push({
        action: "Revision Requested",
        performedBy: req.user?.name || "Agent",
        timestamp: new Date(),
      });

      await query.save();

      const usersToNotify = new Set();
      if (query.assignedTo) {
        usersToNotify.add(query.assignedTo.toString());
      }
      if (quotation.createdBy) {
        usersToNotify.add(quotation.createdBy.toString());
      }
      try {
        const managers = await Auth.find({ role: "operation_manager" }).select("_id");
        for (const manager of managers) {
          usersToNotify.add(manager._id.toString());
        }
      } catch (err) {
        console.error("Failed to fetch operation managers for notification:", err);
      }

      const reasonText = String(reason || "").trim();
      const msgSuffix = reasonText ? ` Reason: "${reasonText}"` : "";

      for (const userId of usersToNotify) {
        await Notification.create({
          user: userId,
          type: "warning",
          title: "Quotation Revision Requested",
          message: `Agent requested quotation changes for ${query.queryId}.${msgSuffix} Please prepare a revised quotation.`,
          link: "/ops/bookings-management",
          meta: {
            queryId: query._id,
            queryNumber: query.queryId,
            quotationId: quotation._id,
            destination: query.destination,
            revisionReason: reasonText,
            nextAction: "revise_quotation",
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Revision requested successfully",
      quotation,
      query,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* ========================= CONFIRM QUOTATION CONTROLLER ========================= */

export const confirmQuotation = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const quotation = await Quotation.findOne({ _id: req.params.id, agent: agentId });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (quotation.status === "Confirmed") {
      const existingInvoice = await Invoice.findOne({
        query: quotation.queryId,
        quotation: quotation._id,
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Client approval already shared with operations",
        quotation,
        invoice: existingInvoice,
      });
    }

    if (quotation.status !== "Sent to Client") {
      return res.status(400).json({
        message: "Send the quotation to the client before confirming approval",
      });
    }

    // The agent may confirm whichever quotation the client selected, provided it was
    // actually shared with the client. Supplier-rate validation below still protects
    // against approving a quotation with outdated service rates.

    const rateValidation = await validateQuotationSupplierRates(quotation);
    if (!rateValidation.valid) {
      return res.status(409).json({
        success: false,
        code: "SUPPLIER_RATE_CHANGED",
        message: `Supplier rates have changed. Please review the quotation again before confirming the booking. ${rateValidation.mismatches
          .slice(0, 3)
          .map((item) => item.message)
          .join(" | ")}`,
        mismatches: rateValidation.mismatches,
      });
    }

    quotation.status = "Confirmed";
    await quotation.save();

    const query = await TravelQuery.findById(quotation.queryId);
    let invoice = null;
    if (query) {
      query.opsStatus = "Invoice_Requested";
      query.agentStatus = "Client Approved";
      query.quotationStatus = "Sent_To_Agent";
      query.activityLog = query.activityLog || [];

      const alreadyLogged = query.activityLog.some(
        (entry) => entry.action === "Client Approved",
      );

      if (!alreadyLogged) {
        query.activityLog.push({
          action: "Client Approved",
          performedBy: "Agent",
          timestamp: new Date(),
        });
      }

      invoice = await ensureInvoiceForConfirmedQuotation({
        quotation,
        query,
        actorId: agentId,
      });

      await query.save();

      const usersToNotify = new Set();
      if (query.assignedTo) {
        usersToNotify.add(query.assignedTo.toString());
      }
      if (quotation.createdBy) {
        usersToNotify.add(quotation.createdBy.toString());
      }

      for (const userId of usersToNotify) {
        await Notification.create({
          user: userId,
          type: "info",
          title: "Client Approved Quotation",
          message: `Agent approved quotation for ${query.queryId}. Booking has moved to the amount and documents stage.`,
          link: "/ops/bookings-management",
          meta: {
            queryId: query._id,
            queryNumber: query.queryId,
            quotationId: quotation._id,
            quotationNumber: quotation.quotationNumber,
            destination: query.destination,
            nextAction: "review_approved_booking",
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Client approval captured and operations notified",
      quotation,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================== ENSURE ACTIVE BOOKING INVOICE CONTROLLER =========================

export const ensureActiveBookingInvoice = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      agent: agentId,
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const query = await TravelQuery.findById(quotation.queryId);
    if (!query) {
      return res.status(404).json({ message: "Travel query not found" });
    }

    if (
      quotation.status !== "Confirmed" &&
      query.agentStatus !== "Client Approved" &&
      query.opsStatus !== "Invoice_Requested"
    ) {
      return res.status(400).json({
        message: "Invoice can be prepared only after client approval.",
      });
    }

    const invoice = await ensureInvoiceForConfirmedQuotation({
      quotation,
      query,
      actorId: agentId,
    });

    if (!["Invoice_Requested", "Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
      query.opsStatus = "Invoice_Requested";
      await query.save();
    }

    return res.json({
      success: true,
      message: "Booking amount is ready for payment submission.",
      invoice,
      query,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ======================== APPLY COUPON TO INVOICE CONTROLLER =========================

export const getAgentFinanceOverview = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const financeOverview = await buildAgentFinanceOverviewPayload(agentId, {
      includeTransactions: true,
    });

    res.json(financeOverview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ========================= VIEW INVOICES CONTROLLER ========================= */

export const getMyInvoices = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invoices = await Invoice.find({
      agent: agentId
    })
      .populate("query")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ======================== APPLY COUPON TO INVOICE CONTROLLER =========================

export const applyCouponToInvoice = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, agent: agentId }).populate("query");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.paymentSubmission?.submittedAt) {
      return res.status(400).json({
        message: "Coupon cannot be changed after payment submission for this invoice",
      });
    }

    const existingCouponApplication = invoice.paymentSubmission?.couponApplication || null;
    if (existingCouponApplication?.couponId) {
      await Notification.create({
        user: agentId,
        type: "warning",
        title: "Coupon Reuse Blocked",
        message: `A coupon is already locked for ${invoice.invoiceNumber}. You cannot apply another one on this payment.`,
        link: "/agent/bookings",
        meta: {
          kind: "coupon",
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          couponId: existingCouponApplication.couponId,
          code: existingCouponApplication.code || "",
          event: "invoice_coupon_already_applied",
        },
      });

      return res.status(400).json({
        message: "A coupon has already been applied to this payment",
      });
    }

    const couponCode = normalizeCouponCode(req.body?.couponCode || "");
    const subtotalAmount = Math.round(Number(req.body?.subtotalAmount || invoice.totalAmount || 0));

    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    if (!Number.isFinite(subtotalAmount) || subtotalAmount <= 0) {
      return res.status(400).json({ message: "Valid quotation amount is required before applying coupon" });
    }

    const exactCoupon = await Coupon.findOne({
      assignedAgent: agentId,
      code: couponCode,
    });

    if (!exactCoupon) {
      const attemptCoupon = await getLatestEligibleCouponForAttempt(agentId);

      if (!attemptCoupon) {
        return res.status(400).json({
          message: "No active coupon is available for attempt tracking right now",
        });
      }

      attemptCoupon.usageCount = Number(attemptCoupon.usageCount || 0) + 1;
      attemptCoupon.lastAttemptAt = new Date();
      attemptCoupon.updatedBy = agentId;
      await attemptCoupon.save();

      const remainingAttempts = attemptCoupon.usageLimit
        ? Math.max(Number(attemptCoupon.usageLimit || 0) - Number(attemptCoupon.usageCount || 0), 0)
        : null;

      return res.status(400).json({
        message:
          remainingAttempts === 0
            ? `Invalid coupon code. ${attemptCoupon.code} has now exhausted all allowed attempts.`
            : `Invalid coupon code. One usage has been consumed${remainingAttempts != null ? ` and ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remain` : ""}.`,
      });
    }

    if (isCouponRedeemedNow(exactCoupon)) {
      await Notification.create({
        user: agentId,
        type: "warning",
        title: "Coupon Reuse Blocked",
        message: `${exactCoupon.code} was already used for ${exactCoupon.redeemedInvoiceNumber || "another booking"} and cannot be used again.`,
        link: "/agent/bookings",
        meta: {
          kind: "coupon",
          couponId: exactCoupon._id,
          code: exactCoupon.code,
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          redeemedInvoiceId: exactCoupon.redeemedByInvoice || null,
          redeemedInvoiceNumber: exactCoupon.redeemedInvoiceNumber || "",
          event: "coupon_reuse_blocked",
        },
      });

      return res.status(400).json({
        message: `${exactCoupon.code} has already been used and is no longer valid`,
      });
    }

    if (isCouponExpiredNow(exactCoupon)) {
      return res.status(400).json({
        message: `${exactCoupon.code} expired on ${new Date(exactCoupon.endDate).toLocaleDateString("en-GB")}`,
      });
    }

    if (isCouponScheduledNow(exactCoupon)) {
      return res.status(400).json({
        message: `${exactCoupon.code} will be active from ${new Date(exactCoupon.startDate).toLocaleDateString("en-GB")}`,
      });
    }

    if (isCouponUsageExhaustedNow(exactCoupon)) {
      return res.status(400).json({
        message: `${exactCoupon.code} has exhausted all allowed attempts`,
      });
    }

    const appliedAt = new Date();
    const discountAmount = calculateCouponDiscountAmount(subtotalAmount, exactCoupon);
    const payableAmount = Math.max(subtotalAmount - discountAmount, 0);

    exactCoupon.usageCount = Number(exactCoupon.usageCount || 0) + 1;
    exactCoupon.lastAttemptAt = appliedAt;
    exactCoupon.redeemedAt = appliedAt;
    exactCoupon.redeemedByInvoice = invoice._id;
    exactCoupon.redeemedInvoiceNumber = invoice.invoiceNumber || "";
    exactCoupon.redeemedByAgent = agentId;
    exactCoupon.updatedBy = agentId;

    invoice.paymentSubmission = {
      ...(invoice.paymentSubmission?.toObject ? invoice.paymentSubmission.toObject() : invoice.paymentSubmission || {}),
      couponApplication: {
        couponId: exactCoupon._id,
        code: exactCoupon.code,
        discountType: exactCoupon.discountType || "",
        discountValue: Number(exactCoupon.discountValue || 0),
        discountLabel: exactCoupon.discountLabel || "",
        subtotalAmount,
        discountAmount,
        payableAmount,
        appliedAt,
        appliedBy: agentId,
      },
    };
    invoice.paymentUpdatedBy = agentId;

    await Promise.all([exactCoupon.save(), invoice.save()]);

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        coupon: {
          id: exactCoupon._id,
          code: exactCoupon.code,
          discount: exactCoupon.discountLabel,
          discountType: exactCoupon.discountType,
          discountValue: Number(exactCoupon.discountValue || 0),
          usageCount: Number(exactCoupon.usageCount || 0),
        },
        subtotalAmount,
        discountAmount,
        payableAmount,
        invoice,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ========================= UPDATE PAYMENT STATUS (OFFLINE) ========================= */

export const updatePaymentStatus = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      paymentStatus,
      remarks = "",
      paymentAmount = "",
      trackerPayments = "[]",
      paymentOnBehalfOf = "",
      onBehalfOf = "",
      utrNumber = "",
      bankName = "",
      paymentDate,
    } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, agent: agentId });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const relatedQuery = invoice.query
      ? await TravelQuery.findById(invoice.query).select("destination travelerDetails")
      : null;

    const trimmedUtr = String(utrNumber || "").trim();
    let trimmedBankName = String(bankName || "").trim();
    const hasBankNameInput = Boolean(trimmedBankName);
    const trimmedRemarks = String(remarks || "").trim();
    const trimmedPaymentOnBehalfOf = String(paymentOnBehalfOf || onBehalfOf || "").trim();
    const normalizedPaymentAmount = String(paymentAmount || "").replace(/,/g, "").trim();
    const isRejectedResubmission = invoice.paymentVerification?.status === "Rejected";
    const existingReceipt = isRejectedResubmission
      ? {}
      : invoice.paymentSubmission?.receipt || {};
    const submittedPaymentAmount = Number(normalizedPaymentAmount);
    const hasPaymentAmountInput = normalizedPaymentAmount !== "";
    const existingCouponApplication =
      invoice.paymentSubmission?.couponApplication
        ? invoice.paymentSubmission.couponApplication.toObject
          ? invoice.paymentSubmission.couponApplication.toObject()
          : invoice.paymentSubmission.couponApplication
        : null;
    const existingTrackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
      ? invoice.paymentSubmission.trackerPayments
      : [];
    const fallbackPaymentAmount = Number(
      existingCouponApplication?.payableAmount || invoice.totalAmount || 0,
    );
    let parsedTrackerPayments = [];
    try {
      const trackerPayload = typeof trackerPayments === "string" ? JSON.parse(trackerPayments || "[]") : trackerPayments;
      parsedTrackerPayments = Array.isArray(trackerPayload) ? trackerPayload : [];
    } catch {
      return res.status(400).json({ message: "Invalid payment tracker data" });
    }

    const sanitizeTrackerEntry = (entry = {}) => {
      const normalizedAmount = Math.round(Number(entry?.amount || 0));
      const rawPaymentDate = String(entry?.rawDate || entry?.paymentDate || "").trim();
      const parsedTrackerDate = rawPaymentDate ? new Date(rawPaymentDate) : null;
      const safeTrackerDate =
        parsedTrackerDate && !Number.isNaN(parsedTrackerDate.getTime())
          ? parsedTrackerDate
          : null;

      const createdAtValue = entry?.createdAt ? new Date(entry.createdAt) : new Date();
      const safeCreatedAt = !Number.isNaN(createdAtValue.getTime()) ? createdAtValue : new Date();

      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return null;
      }

      return {
        amount: normalizedAmount,
        note: String(entry?.note || "").trim(),
        paymentDate: safeTrackerDate,
        displayDate: String(entry?.date || entry?.displayDate || "").trim(),
        bankName: String(entry?.bankName || "").trim(),
        utrNumber: String(entry?.utrNumber || "").trim(),
        createdAt: safeCreatedAt,
        verificationStatus: String(entry?.verificationStatus || "").trim() === "Verified" ? "Verified" : "Pending",
        verifiedAt: entry?.verifiedAt ? new Date(entry.verifiedAt) : null,
        verifiedBy: entry?.verifiedBy || undefined,
        verifiedByName: String(entry?.verifiedByName || "").trim(),
        receipt: {
          url: String(entry?.receipt?.url || "").trim(),
          fileName: String(entry?.receipt?.fileName || "").trim(),
          mimeType: String(entry?.receipt?.mimeType || "").trim(),
          size: Number(entry?.receipt?.size || 0),
        },
        financeReceipt: {
          url: String(entry?.financeReceipt?.url || "").trim(),
          fileName: String(entry?.financeReceipt?.fileName || "").trim(),
          mimeType: String(entry?.financeReceipt?.mimeType || "").trim(),
          size: Number(entry?.financeReceipt?.size || 0),
        },
        receiptStatus: String(entry?.receiptStatus || "").trim() === "Sent" ? "Sent" : "",
        receiptSentAt: entry?.receiptSentAt ? new Date(entry.receiptSentAt) : null,
        receiptSentByName: String(entry?.receiptSentByName || "").trim(),
      };
    };

    if (!trimmedBankName && req.file) {
      try {
        const extraction = await analyzeInvoiceFile(req.file);
        const textToScan = (extraction?.rawTextSample || "").toLowerCase();
        const fileNameToScan = String(req.file.originalname || "").toLowerCase();

        if (textToScan.includes("hdfc") || fileNameToScan.includes("hdfc")) {
          trimmedBankName = "HDFC Bank";
        } else if (textToScan.includes("icici") || fileNameToScan.includes("icici")) {
          trimmedBankName = "ICICI Bank";
        } else if (textToScan.includes("axis") || fileNameToScan.includes("axis")) {
          trimmedBankName = "Axis Bank";
        } else if (textToScan.includes("kotak") || fileNameToScan.includes("kotak")) {
          trimmedBankName = "Kotak Bank";
        } else if (
          textToScan.includes("state bank") ||
          textToScan.includes("sbi") ||
          textToScan.includes("state bank of india") ||
          fileNameToScan.includes("state bank") ||
          fileNameToScan.includes("sbi") ||
          fileNameToScan.includes("state bank of india")
        ) {
          trimmedBankName = "State Bank of India";
        }
      } catch (err) {
        console.error("OCR Bank Name extraction failed:", err);
      }
    }

      if (!trimmedBankName) { trimmedBankName = null; }

    const sanitizedTrackerPayments = parsedTrackerPayments
      .map((entry) => {
        const sanitized = sanitizeTrackerEntry(entry);
        if (sanitized) {
          if (!sanitized.bankName) sanitized.bankName = trimmedBankName;
          if (!sanitized.utrNumber) sanitized.utrNumber = trimmedUtr;
        }
        return sanitized;
      })
      .filter(Boolean);

    const normalizedExistingTrackerPayments = existingTrackerPayments
      .map((entry, index) => {
        const sanitized = sanitizeTrackerEntry(entry);
        if (sanitized) {
          sanitized.bankName = String(entry?.bankName || "").trim();
          sanitized.utrNumber = String(entry?.utrNumber || "").trim();
          if (!sanitized.receipt?.url && index === 0 && existingReceipt?.url) {
            sanitized.receipt = {
              url: existingReceipt.url || "",
              fileName: existingReceipt.fileName || "",
              mimeType: existingReceipt.mimeType || "",
              size: Number(existingReceipt.size || 0),
            };
          }
        }
        return sanitized;
      })
      .filter(Boolean);

    const mergedTrackerPayments = [];
    const existingMap = new Map();

    normalizedExistingTrackerPayments.forEach((entry) => {
      const key = entry?.createdAt ? new Date(entry.createdAt).toISOString() : "";
      if (key) {
        existingMap.set(key, entry);
      }
    });

    const hasNewTrackerSubmission = sanitizedTrackerPayments.some((sentEntry) => {
      const key = sentEntry?.createdAt ? new Date(sentEntry.createdAt).toISOString() : "";
      return !key || !existingMap.has(key);
    });

    sanitizedTrackerPayments.forEach((sentEntry) => {
      const key = sentEntry?.createdAt ? new Date(sentEntry.createdAt).toISOString() : "";
      if (key && existingMap.has(key)) {
        const existing = existingMap.get(key);
        if (existing?.verificationStatus === "Verified") {
          mergedTrackerPayments.push(existing);
        } else {
          mergedTrackerPayments.push({
            ...sentEntry,
            verificationStatus: "Pending",
            verifiedAt: null,
            verifiedBy: undefined,
            verifiedByName: "",
          });
        }
        existingMap.delete(key);
      } else {
        mergedTrackerPayments.push({
          ...sentEntry,
          verificationStatus: "Pending",
          verifiedAt: null,
          verifiedBy: undefined,
          verifiedByName: "",
        });
      }
    });

    existingMap.forEach((existing) => {
      mergedTrackerPayments.push(existing);
    });

    mergedTrackerPayments.sort((left, right) => {
      const leftTime = new Date(left?.paymentDate || left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.paymentDate || right?.createdAt || 0).getTime();
      return leftTime - rightTime;
    });

    const trackerPaidAmount = mergedTrackerPayments.reduce(
      (sum, entry) => sum + Math.round(Number(entry.amount || 0)),
      0,
    );

    const resolvedPaymentAmount = sanitizedTrackerPayments.length
      ? trackerPaidAmount
      : hasPaymentAmountInput
        ? submittedPaymentAmount
        : fallbackPaymentAmount;
    const resolvedPaymentOnBehalfOf =
      trimmedPaymentOnBehalfOf || invoice.invoiceNumber || "Booking Payment";
    const hasSubmissionFields =
      Boolean(
        trimmedUtr ||
        hasBankNameInput ||
        paymentDate ||
        req.file ||
        hasPaymentAmountInput ||
        sanitizedTrackerPayments.length,
      );

    if (hasSubmissionFields) {
      const documentCompletion = getTravelerDocumentCompletion(relatedQuery || {});

      if (!documentCompletion.rows.length) {
        return res.status(400).json({
          message: "Traveler details are required before payment can be submitted",
        });
      }

      if (!documentCompletion.allComplete) {
        return res.status(400).json({
          message: documentCompletion.isInternationalTrip
            ? "Upload Passport and PAN Card for every traveler before submitting payment"
            : "Upload at least one PAN Card for every traveler before submitting payment",
        });
      }

      if (!trimmedUtr || !paymentDate) {
        return res.status(400).json({
          message: "UTR number and payment date are required",
        });
      }

      if (!sanitizedTrackerPayments.length) {
        return res.status(400).json({
          message: "Add at least one payment instalment with amount and date before submitting for verification",
        });
      }

      if (!isRejectedResubmission && !hasNewTrackerSubmission) {
        return res.status(400).json({
          message: "Add a new payment instalment before submitting for verification",
        });
      }

      const hasTrackerEntryWithoutDate = sanitizedTrackerPayments.some((entry) => !entry?.paymentDate);
      if (hasTrackerEntryWithoutDate) {
        return res.status(400).json({
          message: "Every payment instalment must include a valid payment date",
        });
      }

      const parsedPaymentDate = new Date(paymentDate);
      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: "Invalid payment date" });
      }

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (parsedPaymentDate.getTime() > endOfToday.getTime()) {
        return res.status(400).json({ message: "Future payment date is not allowed" });
      }

      const hasFutureTrackerDate = sanitizedTrackerPayments.some(
        (entry) => entry?.paymentDate && entry.paymentDate.getTime() > endOfToday.getTime(),
      );
      if (hasFutureTrackerDate) {
        return res.status(400).json({ message: "Payment instalment date cannot be in the future" });
      }

      if (hasPaymentAmountInput && !/^\d+$/.test(normalizedPaymentAmount)) {
        return res.status(400).json({ message: "Payment amount must be a whole number without decimals" });
      }

      if (!Number.isFinite(resolvedPaymentAmount) || resolvedPaymentAmount <= 0) {
        return res.status(400).json({ message: "Valid invoice amount is required" });
      }

      if (!req.file && (!existingReceipt?.url || hasNewTrackerSubmission)) {
        return res.status(400).json({ message: "Payment receipt is required" });
      }

      const latestTrackerEntry = mergedTrackerPayments[mergedTrackerPayments.length - 1] || null;
      if (mergedTrackerPayments.length > 1 && !latestTrackerEntry?.receipt?.url && !req.file) {
        return res.status(400).json({ message: "Payment receipt is required for this installment" });
      }

      const previousReceiptName = String(existingReceipt?.fileName || "").trim();
      const currentReceiptName = String(
        req.file?.originalname || existingReceipt?.fileName || "",
      ).trim();
      const submittedReceipt = {
        url: req.file?.path || existingReceipt?.url || "",
        fileName: req.file?.originalname || existingReceipt?.fileName || "",
        mimeType: req.file?.mimetype || existingReceipt?.mimeType || "",
        size: Number(req.file?.size || existingReceipt?.size || 0),
      };
      if (submittedReceipt.url && mergedTrackerPayments.length) {
        const receiptTargetIndex = req.file
          ? Math.max(0, mergedTrackerPayments.length - 1)
          : Math.max(0, mergedTrackerPayments.findIndex((entry) => !entry?.receipt?.url));
        const normalizedReceiptTargetIndex = receiptTargetIndex >= 0 ? receiptTargetIndex : 0;
        mergedTrackerPayments[normalizedReceiptTargetIndex] = {
          ...mergedTrackerPayments[normalizedReceiptTargetIndex],
          receipt: submittedReceipt,
        };
      }
      const receiptAuditMessage = req.file
        ? previousReceiptName && previousReceiptName !== currentReceiptName
          ? `Payment receipt replaced: ${currentReceiptName}`
          : `Payment receipt uploaded: ${currentReceiptName}`
        : currentReceiptName
          ? `Payment receipt retained: ${currentReceiptName}`
          : "";

      const submissionTimestamp = new Date();
      const assignedFinanceMember = await getRoundRobinFinanceAssignee({
        keepAssigneeId:
          invoice.paymentVerification?.assignedTo || invoice.paymentVerification?.reviewedBy,
      });

      invoice.paymentSubmission = {
        amount: Math.round(resolvedPaymentAmount),
        onBehalfOf: resolvedPaymentOnBehalfOf,
        utrNumber: trimmedUtr,
        bankName: trimmedBankName,
        paymentDate: parsedPaymentDate,
        receipt: submittedReceipt,
        submittedAt: submissionTimestamp,
        submittedBy: agentId,
        trackerPayments: mergedTrackerPayments,
        couponApplication: existingCouponApplication,
      };

      invoice.paymentVerification = {
        status: "Pending",
        assignedTo: assignedFinanceMember?._id,
        assignedToName: assignedFinanceMember?.name || "",
        assignedToEmail: assignedFinanceMember?.email || "",
        assignedAt: assignedFinanceMember ? submissionTimestamp : undefined,
        rejectionReason: "",
        rejectionRemarks: "",
        reviewedBy: undefined,
        reviewedByName: "",
        reviewedAt: undefined,
        teamDecisionStatus: "",
        teamDecisionReason: "",
        teamDecisionRemarks: "",
        teamDecisionBy: undefined,
        teamDecisionByName: "",
        teamDecisionAt: undefined,
        sentToManagerAt: undefined,
      };
      invoice.paymentStatus = "Partially Paid";
      invoice.remarks = trimmedRemarks;
      invoice.paymentUpdatedBy = agentId;
      invoice.paymentAuditTrail.push({
        action: "Submitted",
        status: "Pending",
        remarks: [
          `Declared amount: ${invoice.currency || "INR"} ${Math.round(resolvedPaymentAmount)}`,
          existingCouponApplication?.code
            ? `Coupon used: ${existingCouponApplication.code} (${existingCouponApplication.discountLabel || "discount applied"})`
            : "",
          `On behalf of: ${resolvedPaymentOnBehalfOf}`,
          trimmedRemarks,
          receiptAuditMessage,
          assignedFinanceMember?.name
            ? `Assigned to finance: ${assignedFinanceMember.name}`
            : "",
        ].filter(Boolean).join(" | "),
        performedBy: agentId,
        performedByName: req.user?.name || req.user?.companyName || "Agent",
        performedAt: submissionTimestamp,
      });
    } else if (paymentStatus) {
      invoice.paymentStatus = paymentStatus;
      invoice.remarks = trimmedRemarks;
      invoice.paymentUpdatedBy = agentId;
    } else {
      return res.status(400).json({
        message: "No payment submission details were provided",
      });
    }

    await invoice.save();
    await invoice.populate("query");

    if (hasSubmissionFields && invoice.paymentVerification?.assignedTo) {
      await Notification.create({
        user: invoice.paymentVerification.assignedTo,
        type: "info",
        title: "Payment Verification Assigned",
        message: `${invoice.invoiceNumber} payment from ${req.user?.companyName || req.user?.name || "Agent"} is ready for review.`,
        link: "/finance/paymentVerification",
        meta: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          queryId: invoice.query?.queryId || "",
          status: invoice.paymentVerification?.status || "Pending",
          submittedAt: invoice.paymentSubmission?.submittedAt || null,
        },
      });
    }

    res.json({
      success: true,
      message: hasSubmissionFields
        ? "Payment submitted for finance verification"
        : "Payment status updated",
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveReceiptClientName = (query = {}) => {
  const travelers = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
  const adultTraveler = travelers.find(
    (traveler) =>
      String(traveler?.travelerType || "").trim().toLowerCase() === "adult" &&
      String(traveler?.fullName || "").trim(),
  );
  const firstTraveler = travelers.find((traveler) => String(traveler?.fullName || "").trim());

  return (
    String(adultTraveler?.fullName || "").trim() ||
    String(firstTraveler?.fullName || "").trim() ||
    "Guest"
  );
};

const resolveAgentReceiptExpectedAmount = (invoice = {}) => {
  const couponApplication = invoice?.paymentSubmission?.couponApplication || null;
  const couponPayableAmount = Math.round(Number(couponApplication?.payableAmount || 0));

  if (couponPayableAmount > 0) {
    return couponPayableAmount;
  }

  return Math.round(Number(invoice?.totalAmount || invoice?.pricingSnapshot?.grandTotal || 0));
};



// ======================== GENERATE FINANCE RECEIPT =========================

export const generateAgentFinancePaymentReceipt = async (req, res) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { id, installmentIndex } = req.params;
    const normalizedInstallmentIndex = Number(installmentIndex);

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(normalizedInstallmentIndex) || normalizedInstallmentIndex < 0) {
      return res.status(400).json({ message: "Invalid installment index" });
    }

    const invoice = await Invoice.findOne({ _id: id, agent: agentId })
      .populate("query", "queryId destination startDate endDate numberOfAdults numberOfChildren travelerDetails")
      .populate("agent", "name companyName email");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const trackerPayments = Array.isArray(invoice.paymentSubmission?.trackerPayments)
      ? invoice.paymentSubmission.trackerPayments.filter((entry) => Number(entry?.amount || 0) > 0)
      : [];

    if (!trackerPayments.length || !trackerPayments[normalizedInstallmentIndex]) {
      return res.status(404).json({ message: "Selected installment was not found" });
    }

    const selectedInstallment = trackerPayments[normalizedInstallmentIndex];
    if (String(selectedInstallment?.verificationStatus || "").trim() !== "Verified") {
      return res.status(400).json({ message: "Finance receipt is available only after this installment is verified" });
    }

    if (selectedInstallment.financeReceipt?.url) {
      return res.status(200).json({
        success: true,
        message: "Finance receipt is ready",
        receipt: selectedInstallment.financeReceipt,
      });
    }

    const expectedAmount = resolveAgentReceiptExpectedAmount(invoice);
    const receiptAmount = Math.round(Number(selectedInstallment?.amount || 0));
    const cumulativePaid = trackerPayments
      .slice(0, normalizedInstallmentIndex + 1)
      .reduce((sum, entry) => sum + Math.round(Number(entry?.amount || 0)), 0);
    const remainingAmount = Math.max(0, expectedAmount - cumulativePaid);
    const clientName = resolveReceiptClientName(invoice.query);
    const travelerSummary = [
      clientName,
      Number(invoice.query?.numberOfAdults || 0) > 0 ? `${Math.round(Number(invoice.query?.numberOfAdults || 0))} Adults` : "",
      Number(invoice.query?.numberOfChildren || 0) > 0 ? `${Math.round(Number(invoice.query?.numberOfChildren || 0))} Children` : "",
    ].filter(Boolean).join(" - ");
    const paidBy = [
      invoice.agent?.companyName || invoice.agent?.name || "Agent",
      invoice.query?.queryId ? `Trip ID: ${invoice.query.queryId}` : "",
    ].filter(Boolean).join(" - ");

    const receiptPdf = await generateAgentPaymentReceiptPdf({
      invoiceNumber: invoice.invoiceNumber,
      queryCode: invoice.query?.queryId || "",
      paymentDate:
        selectedInstallment?.paymentDate ||
        selectedInstallment?.createdAt ||
        invoice.paymentSubmission?.paymentDate ||
        new Date(),
      paymentReference:
        selectedInstallment?.utrNumber ||
        invoice.paymentSubmission?.utrNumber ||
        "",
      bankName:
        selectedInstallment?.bankName ||
        invoice.paymentSubmission?.bankName ||
        "",
      amountPaid: receiptAmount,
      totalAmount: expectedAmount || cumulativePaid,
      cumulativePaid,
      remainingAmount,
      paidBy,
      destination: invoice.query?.destination || invoice.tripSnapshot?.destination || "",
      guestDetails: travelerSummary || clientName,
      startDate: invoice.query?.startDate || invoice.tripSnapshot?.startDate || null,
      endDate: invoice.query?.endDate || invoice.tripSnapshot?.endDate || null,
      generatedAt: new Date(),
      receiptTitle: "Installment Payment Receipt",
      trackerPayments: trackerPayments.filter(
        (entry) => String(entry?.verificationStatus || "").trim() === "Verified",
      ),
    });

    const serverBaseUrl = `${req.protocol}://${req.get("host")}`;
    selectedInstallment.financeReceipt = {
      url: `${serverBaseUrl}${receiptPdf.publicFilePath}`,
      fileName: receiptPdf.fileName,
      mimeType: "application/pdf",
      size: 0,
    };
    invoice.markModified("paymentSubmission.trackerPayments");
    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Finance receipt generated successfully",
      receipt: selectedInstallment.financeReceipt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


//=============================== Notification Controller ============================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("type title message isRead link meta createdAt updatedAt")
      .lean();

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//==================== Mark all notifications as read ===================================

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== Delete a specific notification ===================================

export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// ======================== UPDATE TRAVEL QUERY BY AGENT =========================

export const updateQueryByAgent = async (req, res, next) => {
  try {
    const createLog = (action, performedBy) => ({ action, performedBy, timestamp: new Date() });

    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return next(new ApiError(401, "Unauthorized. User not found"));
    }

    const { queryId } = req.params;
    let query;
    const isOpsOrManager = ["operation_manager", "operations", "admin"].includes(req.user.role);

    if (isOpsOrManager) {
      query = await TravelQuery.findById(queryId);
    } else {
      query = await TravelQuery.findOne({ _id: queryId, agent: req.user.id });
    }

    if (!query) {
      return next(new ApiError(404, "Travel query not found"));
    }

    // Verify if it can be edited
    if (["Confirmed", "Vouchered", "Payment_Completed", "Invoice_Requested"].includes(query.opsStatus)) {
      return next(new ApiError(400, "Query cannot be modified after confirmation/invoice request"));
    }

    const {
      destination,
      destinationCategory,
      tourType,
      clientEmail,
      startDate,
      endDate,
      numberOfAdults,
      numberOfChildren,
      customerBudget,
      hotelCategory,
      transportRequired,
      sightseeingRequired,
      specialRequirements,
      travelerDetails,
    } = req.body;

    // ✅ Basic validation
    const normalizedDestination = String(destination || "").trim();
    const normalizedDestinationCategory = String(destinationCategory || "").trim();
    const normalizedTourType = String(tourType || "").trim();

    if (!normalizedDestination || !startDate || !endDate || !numberOfAdults || !String(specialRequirements || "").trim()) {
      return next(new ApiError(400, "Detailed Requirement is required"));
    }

    const normalizedClientEmail = String(clientEmail || "").trim().toLowerCase();
    if (normalizedClientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedClientEmail)) {
      return next(new ApiError(400, "Please enter a valid client email address"));
    }

    const normalizedAdults = Number(numberOfAdults || 0);
    const normalizedChildren = Number(numberOfChildren || 0);
    const normalizedTravelerDetails = normalizeTravelerDetails(
      travelerDetails,
      normalizedAdults,
      normalizedChildren,
    );
    const normalizedHotelCategory = normalizeHotelCategorySelection(hotelCategory);

    await ensureDestinationName({
      label: normalizedDestination,
      source: "manual",
      createdBy: req.user.id,
    });

    // Update query fields
    const changes = [];
    if (normalizedDestination !== query.destination) {
      changes.push(`Destination: "${query.destination}" ➔ "${normalizedDestination}"`);
    }
    if (normalizedDestinationCategory !== (query.destinationCategory || "")) {
      changes.push(`Destination Category: "${query.destinationCategory || "Other"}" ➔ "${normalizedDestinationCategory || "Other"}"`);
    }
    if (normalizedTourType !== (query.tourType || "")) {
      changes.push(`Tour Type: "${query.tourType || "-"}" ➔ "${normalizedTourType || "-"}"`);
    }
    if (normalizedClientEmail !== query.clientEmail) {
      changes.push(`Client Email: "${query.clientEmail}" ➔ "${normalizedClientEmail}"`);
    }

    const formatDate = (d) => {
      if (!d) return "";
      const dateObj = new Date(d);
      return Number.isNaN(dateObj.getTime()) ? "" : dateObj.toISOString().split("T")[0];
    };

    const oldStart = formatDate(query.startDate);
    const newStart = formatDate(startDate);
    if (oldStart !== newStart) {
      changes.push(`Start Date: ${oldStart} ➔ ${newStart}`);
    }

    const oldEnd = formatDate(query.endDate);
    const newEnd = formatDate(endDate);
    if (oldEnd !== newEnd) {
      changes.push(`End Date: ${oldEnd} ➔ ${newEnd}`);
    }

    if (normalizedAdults !== query.numberOfAdults) {
      changes.push(`Adults: ${query.numberOfAdults} ➔ ${normalizedAdults}`);
    }
    if (normalizedChildren !== query.numberOfChildren) {
      changes.push(`Children: ${query.numberOfChildren} ➔ ${normalizedChildren}`);
    }
    if (Number(customerBudget || 0) !== Number(query.customerBudget || 0)) {
      changes.push(`Budget: ${query.customerBudget || 0} ➔ ${customerBudget || 0}`);
    }
    if (normalizedHotelCategory !== (query.hotelCategory || "4 Star")) {
      changes.push(`Hotel Category: ${query.hotelCategory || "4 Star"} ➔ ${normalizedHotelCategory}`);
    }
    if (Boolean(transportRequired) !== Boolean(query.transportRequired)) {
      changes.push(`Transport: ${query.transportRequired ? "Yes" : "No"} ➔ ${transportRequired ? "Yes" : "No"}`);
    }
    if (Boolean(sightseeingRequired) !== Boolean(query.sightseeingRequired)) {
      changes.push(`Sightseeing: ${query.sightseeingRequired ? "Yes" : "No"} ➔ ${sightseeingRequired ? "Yes" : "No"}`);
    }
    if ((specialRequirements || "") !== (query.specialRequirements || "")) {
      changes.push(`Special Requirements: "${query.specialRequirements || "None"}" ➔ "${specialRequirements || "None"}"`);
    }

    const hasTravelerDetailChanges = JSON.stringify(normalizedTravelerDetails) !== JSON.stringify(query.travelerDetails);
    if (hasTravelerDetailChanges) {
      changes.push("Traveler Details updated");
    }

    query.destination = normalizedDestination;
    query.destinationCategory = normalizedDestinationCategory;
    query.tourType = normalizedTourType;
    query.clientEmail = normalizedClientEmail;
    query.startDate = startDate;
    query.endDate = endDate;
    query.numberOfAdults = normalizedAdults;
    query.numberOfChildren = normalizedChildren;
    query.customerBudget = customerBudget;
    query.hotelCategory = normalizedHotelCategory;
    query.transportRequired = transportRequired;
    query.sightseeingRequired = sightseeingRequired;
    query.specialRequirements = specialRequirements;
    query.travelerDetails = normalizedTravelerDetails;

    // Add activity log entry
    const actorRole = isOpsOrManager ? "Operations Manager" : "Agent";
    const logAction = isOpsOrManager ? "Query Updated by Ops Manager" : "Query Updated by Agent";
    query.activityLog.push(createLog(logAction, actorRole));

    await query.save();

    // Send notification
    if (changes.length > 0) {
      const changeMsg = changes.join(", ");
      if (isOpsOrManager) {
        // 1. Notify the Agent
        await createNotification(
          {
            user: query.agent,
            type: "info",
            title: `Query ${query.queryId} Updated by Operations`,
            message: `Operations Manager has updated query ${query.queryId}. Changes: ${changeMsg}`,
            link: "/agent/queries",
            meta: {
              queryId: query._id,
              queryNumber: query.queryId,
              changes: changes,
            },
          },
          {
            sourceRole: req.user?.role,
            sourceUserId: req.user?.id || req.user?._id || null,
            sourceName: req.user?.name || req.user?.companyName || "Operations Manager",
          }
        );

        // 2. Notify all active Admins
        const adminUsers = await Auth.find({
          role: "admin",
          isDeleted: { $ne: true },
          accountStatus: { $ne: "Inactive" },
        }).select("_id");

        if (adminUsers.length > 0) {
          const adminPayloads = adminUsers.map((admin) => ({
            user: admin._id,
            type: "info",
            title: `Query ${query.queryId} Updated by Ops Manager`,
            message: `Operations Manager has updated query ${query.queryId}. Changes: ${changeMsg}`,
            link: "/admin/dashboard",
            meta: {
              queryId: query._id,
              queryNumber: query.queryId,
              changes: changes,
            },
          }));
          await Notification.insertMany(adminPayloads);
        }
      } else if (query.assignedTo) {
        // Notify assigned Ops Executive that Agent updated their query
        await createNotification(
          {
            user: query.assignedTo,
            type: "info",
            title: `Query ${query.queryId} Updated by Agent`,
            message: `Agent has edited query ${query.queryId}. Changes: ${changeMsg}`,
            link: "/ops/bookings-management",
            meta: {
              queryId: query._id,
              queryNumber: query.queryId,
              changes: changes,
            },
          },
          {
            mirrorToAdmins: true,
            sourceRole: req.user?.role,
            sourceUserId: req.user?.id || req.user?._id || null,
            sourceName: req.user?.name || req.user?.companyName || "Agent",
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Query updated successfully",
      query
    });
  } catch (error) {
    next(error);
  }
};


// ======================= UPDATE QUOTATION BRANDING BY AGENT =========================

export const updateQuotationBranding = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const { id } = req.params;
    const { agentBrandingName, agentLogoUrl } = req.body;

    const [quotation, user] = await Promise.all([
      Quotation.findById(id),
      Auth.findById(agentId),
    ]);

    if (!quotation) {
      return next(new ApiError(404, "Quotation not found"));
    }

    if (String(quotation.agent?._id || quotation.agent) !== String(agentId)) {
      return next(new ApiError(403, "Forbidden: You cannot modify this quotation"));
    }

    if (!agentBrandingName || !agentBrandingName.trim()) {
      return next(new ApiError(400, "Branding name is required"));
    }

    let logoUrl = agentLogoUrl || "";
    if (req.file) {
      logoUrl = req.file.path || req.file.secure_url || "";
    }

    if (!logoUrl) {
      return next(new ApiError(400, "Brand logo is required"));
    }

    quotation.agentBrandingName = String(agentBrandingName).trim();
    quotation.agentLogo = logoUrl;

    if (user && user.role === "agent") {
      user.brandingName = quotation.agentBrandingName;
      user.brandingLogo = quotation.agentLogo;
    }

    await Promise.all([
      quotation.save(),
      user ? user.save() : Promise.resolve(),
    ]);

    res.json({
      success: true,
      message: "Quotation branding updated successfully",
      quotation,
      user: user ? formatAuthenticatedUser(user) : null,
    });
  } catch (error) {
    next(error);
  }
};

const getAgentTaskStage = (query = {}) => {
  const status = String(query?.agentStatus || "").trim();
  if (["Confirmed", "Booking Confirmed"].includes(status)) return "BOOKING_CONFIRMED";
  if (["Client Approved", "Booking Processed"].includes(status)) return "BOOKING_PROCESSED";
  if (["Quote Sent", "Quote Received", "Sent to Client", "Quote Accepted", "Quote Updated", "Markup Applied"].includes(status)) return "QUOTE_SENT";
  return "NEW_QUERY";
};

const getAgentTaskActorName = (req) =>
  String(req.user?.name || req.user?.fullName || req.user?.email || "Agent").trim() || "Agent";

const getAgentTaskTimeAgo = (value) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "Just now";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
};

const serializeAgentTask = (task = {}) => ({
  id: String(task?._id || task?.id || ""),
  text: String(task?.text || ""),
  dueDate: task?.dueDate || null,
  author: String(task?.author || "Agent"),
  timeAgo: getAgentTaskTimeAgo(task?.createdAt),
  resolved: Boolean(task?.resolved),
  resolvedBy: task?.resolvedBy || null,
  resolvedTimeAgo: task?.resolvedAt ? getAgentTaskTimeAgo(task.resolvedAt) : null,
  createdAt: task?.createdAt || null,
});

const getAgentTaskDayRange = () => {
  const indiaOffsetMs = 330 * 60 * 1000;
  const indiaClock = new Date(Date.now() + indiaOffsetMs);
  indiaClock.setUTCHours(0, 0, 0, 0);

  const start = new Date(indiaClock.getTime() - indiaOffsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

const findAgentOwnedTaskQuery = async (agentId, queryId) => {
  if (!mongoose.isValidObjectId(queryId)) return null;
  return TravelQuery.findOne({ _id: queryId, agent: agentId }).select("agentStatus queryId");
};

export const getAgentQueryTasks = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const query = await findAgentOwnedTaskQuery(agentId, req.params.queryId);
    if (!agentId || !query) return res.status(404).json({ message: "Travel query not found" });

    const tasks = await AgentTask.find({
      agent: agentId,
      query: query._id,
      stage: getAgentTaskStage(query),
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, tasks: tasks.map(serializeAgentTask) });
  } catch (error) {
    next(error);
  }
};

export const createAgentQueryTask = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    const query = await findAgentOwnedTaskQuery(agentId, req.params.queryId);
    if (!agentId || !query) return res.status(404).json({ message: "Travel query not found" });

    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ message: "Task or comment is required" });

    const dueDateText = String(req.body?.dueDate || "").trim();
    let dueDate = null;
    if (dueDateText) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateText)) {
        return res.status(400).json({ message: "Please select a valid due date" });
      }
      dueDate = new Date(`${dueDateText}T00:00:00.000Z`);
      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: "Please select a valid due date" });
      }
    }

    const task = await AgentTask.create({
      agent: agentId,
      query: query._id,
      stage: getAgentTaskStage(query),
      text,
      dueDate,
      author: getAgentTaskActorName(req),
    });

    return res.status(201).json({ success: true, task: serializeAgentTask(task) });
  } catch (error) {
    next(error);
  }
};

export const updateAgentQueryTaskResolution = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    if (!agentId || !mongoose.isValidObjectId(req.params.taskId)) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await AgentTask.findOne({ _id: req.params.taskId, agent: agentId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const resolved = typeof req.body?.resolved === "boolean" ? req.body.resolved : !task.resolved;
    task.resolved = resolved;
    task.resolvedBy = resolved ? getAgentTaskActorName(req) : "";
    task.resolvedAt = resolved ? new Date() : null;
    await task.save();

    return res.json({ success: true, task: serializeAgentTask(task) });
  } catch (error) {
    next(error);
  }
};

export const deleteAgentQueryTask = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    if (!agentId || !mongoose.isValidObjectId(req.params.taskId)) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await AgentTask.findOneAndDelete({ _id: req.params.taskId, agent: agentId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getAgentDueTasks = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    if (!agentId) return res.status(401).json({ message: "Unauthorized" });

    const { start, end } = getAgentTaskDayRange();
    const tasks = await AgentTask.find({
      agent: agentId,
      dueDate: { $gte: start, $lt: end },
      resolved: false,
      dueNotificationDismissedAt: null,
    })
      .populate({ path: "query", select: "queryId" })
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      tasks: tasks.map((task) => ({
        ...serializeAgentTask(task),
        queryId: String(task?.query?.queryId || ""),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const dismissAgentDueTasks = async (req, res, next) => {
  try {
    const agentId = getAuthenticatedUserId(req);
    if (!agentId) return res.status(401).json({ message: "Unauthorized" });

    const taskIds = Array.isArray(req.body?.taskIds)
      ? req.body.taskIds.filter((id) => mongoose.isValidObjectId(id))
      : [];
    if (!taskIds.length) return res.json({ success: true, dismissed: 0 });

    const { start, end } = getAgentTaskDayRange();
    const result = await AgentTask.updateMany(
      {
        _id: { $in: taskIds },
        agent: agentId,
        dueDate: { $gte: start, $lt: end },
        resolved: false,
      },
      { $set: { dueNotificationDismissedAt: new Date() } },
    );

    return res.json({ success: true, dismissed: result.modifiedCount || 0 });
  } catch (error) {
    next(error);
  }
};