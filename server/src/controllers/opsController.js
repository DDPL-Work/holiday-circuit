import ApiError from "../utils/ApiError.js";
import TravelQuery from "../models/TravelQuery.model.js";
import Quotation from "../models/quotation.model.js";
import QuotationDraft from "../models/quotationDraft.model.js";
import Invoice from "../models/invoice.model.js";
import Counter from "../models/counter.model.js"
import Hotel from "../models/hotelDmc.model.js";
import Activity from "../models/activityDmc.model.js";
import Transfer from "../models/transferDmc.model.js";
import Notification from "../models/notification.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js"
import Confirmation from "../models/dmcConfirmation.js";
import { sendAgentClientQuotationMail, sendEmailVoucher } from "../services/emailService.js";
import { getWhatsAppDeliveryErrorMessage, sendWhatsAppMessage } from "../services/whatsappService.js";
import { getEmailDeliveryErrorMessage } from "../services/mailer.js";
import {
  createNotification,
  createNotifications,
} from "../services/notificationDispatchService.js";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import XLSX from "xlsx";
import Voucher from "../models/voucher.model.js";
import Auth from "../models/auth.model.js";
import UploadHistory from "../models/uploadHistory.model.js";
import { findBlackoutMatch, formatBlackoutLabel, normalizeDateOnly } from "../utils/blackoutDates.js";

const OPS_DASHBOARD_PENDING_STATUSES = ["New_Query", "Pending_Accept", "Revision_Query"];
const OPS_DASHBOARD_ACTIVE_BOOKING_STATUSES = ["Booking_Accepted", "Invoice_Requested", "Confirmed", "Vouchered", "Payment_Completed"];
const ORDER_ACCEPTANCE_PENDING_STATUSES = ["New_Query", "Pending_Accept", "Rejected"];
const ORDER_ACCEPTANCE_VISIBLE_STATUSES = [
  "New_Query",
  "Pending_Accept",
  "Rejected",
  "Booking_Accepted",
  "Revision_Query",
  "Invoice_Requested",
];
const ORDER_ACCEPTANCE_STATUS_PRIORITY = {
  New_Query: 0,
  Pending_Accept: 1,
  Rejected: 2,
  Booking_Accepted: 3,
  Revision_Query: 4,
  Invoice_Requested: 5,
};
const OPS_DASHBOARD_RESPONSE_ACTIONS = new Set([
  "Query Accepted",
  "Query Rejected",
  "Quotation Started",
  "Quote Sent",
  "Passed to Admin",
  "Passed to Manager",
  "Traveler Documents Verified",
  "Voucher Sent",
  "Invoice Generated",
]);
const OPS_DASHBOARD_COMPLETION_ACTIONS = new Set([
  "Voucher Sent",
]);

const createOpsSideNotification = (req, payload) =>
  createNotification(payload, {
    mirrorToAdmins: true,
    sourceRole: req.user?.role,
    sourceUserId: req.user?.id || req.user?._id || null,
    sourceName: req.user?.name || req.user?.companyName || "Operations",
  });

const createOpsSideNotifications = (req, payloads, options = {}) =>
  createNotifications(payloads, {
    mirrorToAdmins: true,
    sourceRole: req.user?.role,
    sourceUserId: req.user?.id || req.user?._id || null,
    sourceName: req.user?.name || req.user?.companyName || "Operations",
    ...options,
  });

const joinNotificationParts = (items = []) => {
  const parts = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
};

const buildQuotationDeliveryNote = ({
  channels = [],
  agentEmail = "",
  agentPhone = "",
} = {}) => {
  const normalizedChannels = new Set(
    channels.map((channel) => String(channel || "").trim().toLowerCase()).filter(Boolean),
  );
  const parts = [];

  if (normalizedChannels.has("dashboard")) {
    parts.push("available in your dashboard");
  }

  if (normalizedChannels.has("email")) {
    parts.push(`sent to your email${agentEmail ? ` (${agentEmail})` : ""}`);
  }

  if (normalizedChannels.has("whatsapp")) {
    parts.push(`shared on WhatsApp${agentPhone ? ` (${agentPhone})` : ""}`);
  }

  const deliveryText = joinNotificationParts(parts);
  return deliveryText ? ` It was ${deliveryText}.` : "";
};

const getAgentNotificationUserId = (query = {}) => query?.agent?._id || query?.agent || null;

const createQuotationSentAgentNotification = async (
  req,
  {
    query,
    quotation = null,
    totalAmount = 0,
    deliveryChannels = [],
  } = {},
) => {
  const agentUserId = getAgentNotificationUserId(query);

  if (!agentUserId || !query?._id) {
    return null;
  }

  const quotationNumber = String(quotation?.quotationNumber || "").trim();
  const destination = query?.destination || "your trip";
  const channelList = Array.isArray(deliveryChannels) ? deliveryChannels.filter(Boolean) : [];
  const senderLabel =
    req.user?.role === "operation_manager"
      ? "Operations Manager"
      : req.user?.role === "operations"
        ? "Operations Team"
        : (req.user?.name || req.user?.companyName || "Operations");

  return createOpsSideNotification(req, {
    user: agentUserId,
    type: "success",
    title: "Quotation Received",
    message: quotationNumber
      ? `${senderLabel} sent quotation ${quotationNumber} for ${destination}.${buildQuotationDeliveryNote({
        channels: channelList,
        agentEmail: query.agent?.email || "",
        agentPhone: query.agent?.phone || "",
      })}`
      : `${senderLabel} sent a quotation for ${destination}.${buildQuotationDeliveryNote({
        channels: channelList,
        agentEmail: query.agent?.email || "",
        agentPhone: query.agent?.phone || "",
      })}`,
    link: "/agent/queries",
    meta: {
      quotationId: quotation?._id || null,
      queryId: query._id,
      queryNumber: query.queryId,
      quotationNumber,
      destination,
      totalAmount: Number(totalAmount || 0),
      deliveryChannels: channelList,
      senderLabel,
      sentByRole: req.user?.role || "",
      sentByUserId: req.user?.id || req.user?._id || null,
      source: "quotation_sent",
    },
  });
};

const getVoucherDispatchNote = (dispatchChannel = "", { email = "", phone = "" } = {}) => {
  const normalizedChannel = String(dispatchChannel || "").trim().toUpperCase();

  if (normalizedChannel === "EMAIL") {
    return ` It was sent to your email${email ? ` (${email})` : ""}.`;
  }

  if (normalizedChannel === "WHATSAPP") {
    return ` It was shared on WhatsApp${phone ? ` (${phone})` : ""}.`;
  }

  if (normalizedChannel === "PDF") {
    return " It was prepared as a downloadable PDF copy by operations.";
  }

  return "";
};

const OPERATIONAL_QUOTATION_STATUSES = [
  "Sent to Client",
  "Markup Applied",
  "Quote Accepted",
  "Quote Sent",
  "Confirmed",
  "Quote Finalized",
  "Revised",
];

const getLatestOperationalQuotation = (queryId) =>
  Quotation.findOne({
    queryId,
    status: { $in: OPERATIONAL_QUOTATION_STATUSES },
  }).sort({ createdAt: -1 });

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

const getQueryAcceptedAt = (query = {}) => {
  const timestamps = (Array.isArray(query?.activityLog) ? query.activityLog : [])
    .filter((entry) => String(entry?.action || "").trim() === "Query Accepted")
    .map((entry) => (entry?.timestamp ? new Date(entry.timestamp) : null))
    .filter(isValidDate)
    .sort((left, right) => left.getTime() - right.getTime());

  return timestamps[0] || null;
};

const getFinalOpsCompletionAt = (query = {}) => {
  const timestamps = (Array.isArray(query?.activityLog) ? query.activityLog : [])
    .filter((entry) => OPS_DASHBOARD_COMPLETION_ACTIONS.has(String(entry?.action || "").trim()))
    .map((entry) => (entry?.timestamp ? new Date(entry.timestamp) : null))
    .filter(isValidDate)
    .sort((left, right) => right.getTime() - left.getTime());

  return timestamps[0] || null;
};

const isConvertedOpsQuery = (query = {}) =>
  ["Client Approved", "Confirmed"].includes(String(query?.agentStatus || "").trim()) ||
  ["Confirmed", "Vouchered", "Payment_Completed"].includes(String(query?.opsStatus || "").trim());

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

  if (normalizedAction === "Passed to Manager") {
    return { title: "Passed to Manager", tag: "Escalated", variant: "escalated" };
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

const getLiveServiceModelForPricing = (type) => {
  const normalizedType = normalizeQuotationServiceType(type);
  if (normalizedType === "hotel") return Hotel;
  if (normalizedType === "activity") return Activity;
  if (normalizedType === "transfer") return Transfer;
  if (normalizedType === "sightseeing") return Sightseeing;
  return null;
};

const getLiveServiceBasePrice = (service = {}, liveService = {}) => {
  const normalizedType = normalizeQuotationServiceType(service?.type);
  if (normalizedType === "activity") {
    return Number(liveService?.adultPrice ?? liveService?.price ?? service?.price ?? 0);
  }

  return Number(liveService?.price ?? service?.price ?? 0);
};

const getRequestedServiceBasePrice = (service = {}) =>
  Number(service?.price || service?.quoteBaseRate || service?.rate || 0);

const hasManualRateIntent = ({ service = {}, livePrice = 0 }) => {
  if (service?.manualRateOverride) return true;

  const requestedPrice = getRequestedServiceBasePrice(service);
  return requestedPrice > 0 && livePrice > 0 && Math.abs(requestedPrice - Number(livePrice || 0)) >= 0.5;
};

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeUploadCategoryForService = (type = "") => {
  const normalizedType = normalizeQuotationServiceType(type);
  return normalizedType === "transfer" ? "transport" : normalizedType;
};

const getServiceRateUpdateField = (type = "") =>
  normalizeQuotationServiceType(type) === "activity" ? "adultPrice" : "price";

const getUploadRowValue = (row = {}, labels = []) => {
  const entries = Object.entries(row || {}).map(([key, value]) => [
    normalizeComparableText(key),
    value,
  ]);

  for (const label of labels) {
    const normalizedLabel = normalizeComparableText(label);
    const match = entries.find(([key]) => key === normalizedLabel);
    if (match) return match[1];
  }

  return "";
};

const buildUploadRowObject = (headers = [], row = []) =>
  headers.reduce((acc, header, index) => {
    if (header) acc[String(header).trim()] = row[index] ?? "";
    return acc;
  }, {});

const doesUploadRowMatchService = ({ row = {}, service = {}, liveService = null }) => {
  const type = normalizeQuotationServiceType(service?.type);
  const serviceTitle = normalizeComparableText(
    service?.title ||
    liveService?.hotelName ||
    liveService?.name ||
    liveService?.serviceName,
  );
  const description = normalizeComparableText(getUploadRowValue(row, ["Description", "Service Description"]));

  if (type === "hotel") {
    const hotelName = normalizeComparableText(getUploadRowValue(row, ["Hotel Name"]));
    const roomType = normalizeComparableText(getUploadRowValue(row, ["Room Type"]));
    const serviceRoomType = normalizeComparableText(service?.roomType || liveService?.roomType);
    const hotelMatches =
      (hotelName && serviceTitle && hotelName === serviceTitle) ||
      (description && serviceTitle && description.includes(serviceTitle));
    const roomMatches = !serviceRoomType || !roomType || roomType === serviceRoomType || description.includes(serviceRoomType);

    return Boolean(hotelMatches && roomMatches);
  }

  const rowName = normalizeComparableText(
    getUploadRowValue(row, ["Service Name", "Activity Name", "Sightseeing Name"]),
  );

  return Boolean(
    serviceTitle &&
    (rowName === serviceTitle || description.includes(serviceTitle)),
  );
};

const syncManualRateToUploadPreview = async ({ service = {}, liveService = null, price = 0 }) => {
  const category = normalizeUploadCategoryForService(service?.type);
  if (!["hotel", "transport", "activity", "sightseeing"].includes(category)) {
    return { matched: false, modified: false };
  }

  const ownerIds = [
    service?.supplierId,
    service?.dmcId,
    liveService?.supplier,
  ]
    .filter(Boolean)
    .map((value) => String(value));

  if (!ownerIds.length) return { matched: false, modified: false };

  const ownerUploads = await UploadHistory.find({
    category,
    uploadedAuth: { $in: ownerIds },
    status: { $ne: "failed" },
  }).sort({ updatedAt: -1, createdAt: -1 });

  const fallbackUploads = await UploadHistory.find({
    category,
    status: { $ne: "failed" },
  }).sort({ updatedAt: -1, createdAt: -1 });

  const seenUploadIds = new Set();
  const uploads = [...ownerUploads, ...fallbackUploads].filter((upload) => {
    const key = String(upload?._id || "");
    if (!key || seenUploadIds.has(key)) return false;
    seenUploadIds.add(key);
    return true;
  });

  for (const upload of uploads) {
    const fullPath = path.resolve(upload.filePath || "");
    if (!fs.existsSync(fullPath)) continue;

    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const headers = rawData[0] || [];
    const priceColIndex = headers.findIndex((header) => normalizeComparableText(header) === "price");

    if (priceColIndex === -1) continue;

    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex += 1) {
      const row = buildUploadRowObject(headers, rawData[rowIndex] || []);
      if (!doesUploadRowMatchService({ row, service, liveService })) continue;

      rawData[rowIndex][priceColIndex] = Number(price || 0);
      workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(rawData);
      XLSX.writeFile(workbook, fullPath);

      return {
        matched: true,
        modified: true,
        uploadId: upload._id,
        rowIndex,
      };
    }
  }

  return { matched: false, modified: false };
};

const syncManualRateOverrideToLiveService = async (service = {}) => {
  if (!service?.manualRateOverride) return { matched: false, modified: false };

  const Model = getLiveServiceModelForPricing(service?.type);
  const serviceId = String(service?.serviceId || "").trim();
  const nextPrice = Number(service?.price || service?.quoteBaseRate || service?.rate || 0);

  if (!Model || !mongoose.Types.ObjectId.isValid(serviceId) || nextPrice <= 0) {
    return { matched: false, modified: false };
  }

  const liveService = await Model.findById(serviceId).lean();
  if (!liveService) return { matched: false, modified: false };

  const priceField = getServiceRateUpdateField(service?.type);
  const updatedLiveService = await Model.findByIdAndUpdate(
    serviceId,
    { $set: { [priceField]: nextPrice } },
    { new: true, runValidators: true },
  ).lean();

  const uploadSync = await syncManualRateToUploadPreview({
    service,
    liveService: updatedLiveService || liveService,
    price: nextPrice,
  });

  return {
    matched: true,
    modified: true,
    id: serviceId,
    priceField,
    price: nextPrice,
    uploadSync,
  };
};

const syncManualRateOverridesToLiveServices = async (services = []) => {
  const manualServices = services.filter((service) => service?.manualRateOverride);
  if (!manualServices.length) return [];

  return Promise.all(manualServices.map((service) => syncManualRateOverrideToLiveService(service)));
};

const calculateHotelServiceTotal = (service = {}) => {
  const quoteBaseRate = Number(service?.quoteBaseRate || 0);
  const nights = Math.max(Number(service?.nights || 0), 0);
  const rooms = Math.max(Number(service?.rooms || 1), 1);
  const perRoomNightRate =
    Number(quoteBaseRate || service?.price || 0) +
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
    const Model = getLiveServiceModelForPricing(normalizedType);
    const serviceId = String(service?.serviceId || "").trim();

    if (Model && mongoose.Types.ObjectId.isValid(serviceId)) {
      const liveService = await Model.findById(serviceId).lean();
      if (liveService) {
        const livePrice = getLiveServiceBasePrice(service, liveService);
        const requestedPrice = getRequestedServiceBasePrice(service);
        const manualRateOverride = hasManualRateIntent({ service, livePrice });
        const resolvedPrice = manualRateOverride ? requestedPrice : livePrice;

        return {
          ...service,
          type: normalizedType,
          serviceId: liveService?._id?.toString?.() || service.serviceId,
          supplierId: service?.supplierId || liveService?.supplier,
          supplierName: service?.supplierName || liveService?.supplierName || "",
          dmcId: service?.dmcId || liveService?.supplier,
          dmcName: service?.dmcName || service?.supplierName || liveService?.supplierName || "",
          title:
            service?.title ||
            liveService?.hotelName ||
            liveService?.name ||
            liveService?.serviceName ||
            "",
          city: service?.city || liveService?.city || "",
          country: service?.country || liveService?.country || "",
          description: service?.description || liveService?.description || service?.desc || "",
          currency: normalizeCurrencyCode(service?.currency || liveService?.currency || "INR"),
          operatingDays: service?.operatingDays || liveService?.operatingDays || "Mon-Sun",
          openingTime: service?.openingTime || liveService?.openingTime || "08:00",
          closingTime: service?.closingTime || liveService?.closingTime || "18:00",
          duration: service?.duration || liveService?.duration || liveService?.durationMins || "",
          slots: service?.slots || liveService?.slots || "",
          selectedSlot: service?.selectedSlot || "",
          adultPrice: service?.adultPrice !== undefined ? service.adultPrice : (liveService?.adultPrice || resolvedPrice),
          childPrice: service?.childPrice !== undefined ? service.childPrice : (liveService?.childPrice || 0),
          price: resolvedPrice,
          manualRateOverride,
        };
      }
    }

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

  const liveVariantPrice = Number(bestVariant?.price ?? 0);
  const servicePrice = Number(
    service?.price !== undefined && service?.price !== null && service?.price !== 0
      ? service.price
      : (bestVariant?.price ?? 0),
  );
  const manualRateOverride = hasManualRateIntent({ service, livePrice: liveVariantPrice });
  const shouldUseLiveVariantPrice = !manualRateOverride && liveVariantPrice > 0;
  const resolvedPrice = shouldUseLiveVariantPrice ? liveVariantPrice : servicePrice;

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
    title: service?.serviceName || service?.title || bestVariant?.serviceName || bestVariant?.hotelName || "",
    serviceName: service?.serviceName || bestVariant?.serviceName || "",
    hotelName: service?.hotelName || bestVariant?.hotelName || "",
    city: service?.city || bestVariant?.city || "",
    country: service?.country || bestVariant?.country || "",
    description: service?.description || bestVariant?.description || service?.desc || "",
    roomCategory: service?.roomCategory || bestVariant?.roomCategory || "",
    roomType: service?.roomType || bestVariant?.roomType || "",
    hotelCategory: service?.hotelCategory || bestVariant?.hotelCategory || "",
    bedType: normalizeBedType(service?.bedType) || normalizeBedType(bestVariant?.bedType),
    currency: normalizeCurrencyCode(service?.currency || bestVariant?.currency || "INR"),
    price: resolvedPrice,
    manualRateOverride,
    hotelRateMode: String(service?.hotelRateMode || "").trim() === "service-total" ? "service-total" : "unit-rate",
    quoteBaseRate: shouldUseLiveVariantPrice ? resolvedPrice : Number(service?.quoteBaseRate || 0),
    roomTypeOptionRate: shouldUseLiveVariantPrice ? resolvedPrice : Number(service?.roomTypeOptionRate || 0),
    roomTypeOptionCurrency: normalizeCurrencyCode(service?.roomTypeOptionCurrency || service?.currency || bestVariant?.currency || "INR"),
    awebRate: Number(service?.awebRate !== undefined && service?.awebRate !== null ? service.awebRate : (bestVariant?.awebRate ?? 0)),
    cwebRate: Number(service?.cwebRate !== undefined && service?.cwebRate !== null ? service.cwebRate : (bestVariant?.cwebRate ?? 0)),
    cwoebRate: Number(service?.cwoebRate !== undefined && service?.cwoebRate !== null ? service.cwoebRate : (bestVariant?.cwoebRate ?? 0)),
    blackoutDates: bestVariant?.blackoutDates || service?.blackoutDates || [],
  };
};

const addDays = (value, days = 0) => {
  const date = normalizeDateOnly(value);
  if (!date) return null;
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + Number(days || 0));
  return nextDate;
};

const getServiceTravelRange = (query = {}, service = {}) => {
  const serviceStart = normalizeDateOnly(service?.serviceDate);
  if (serviceStart) {
    const nights = Number(service?.nights || 1);
    return {
      start: serviceStart,
      end: addDays(serviceStart, Math.max(nights - 1, 0)) || serviceStart,
    };
  }

  return {
    start: query?.startDate,
    end: query?.endDate || query?.startDate,
  };
};

const getBlackoutMatchForService = (query = {}, service = {}) => {
  if (normalizeQuotationServiceType(service?.type) !== "hotel") return null;
  if (!Array.isArray(service?.blackoutDates) || !service.blackoutDates.length) return null;

  const travelRange = getServiceTravelRange(query, service);
  return findBlackoutMatch({
    blackoutDates: service.blackoutDates,
    travelStart: travelRange.start,
    travelEnd: travelRange.end,
    country: service.country,
    city: service.city,
    destination: query.destination,
  });
};

const notifyOpsForBlockedBlackoutRate = async ({ query, service, blackout }) => {
  if (!query || !service || !blackout) return;

  const alertKey = [
    "blackout-rate-blocked",
    query._id?.toString?.() || query.queryId,
    service.serviceId || service.title || "hotel",
    blackout.startDateKey || blackout.startDate || "",
  ].join(":");

  const alreadyExists = await Notification.exists({ "meta.blackoutAlertKey": alertKey });
  if (alreadyExists) return;

  const staffUsers = await Auth.find({
    role: { $in: ["admin", "operation_manager", "operations"] },
    isDeleted: { $ne: true },
    accountStatus: { $ne: "Inactive" },
  }).select("_id").lean();

  if (!staffUsers.length) return;

  const blackoutLabel = formatBlackoutLabel(blackout) || "blackout date";
  await Notification.insertMany(
    staffUsers.map((user) => ({
      user: user._id,
      type: "warning",
      title: "Contract Rate Blocked: Blackout Date",
      message: `Query ${query.queryId || query._id} includes ${service.title || "hotel service"} during ${blackoutLabel}. Contracted rate was blocked; use manual/special pricing.`,
      link: "/operationManager/allTeamQueries",
      meta: {
        blackoutAlertKey: alertKey,
        queryId: query._id,
        queryNumber: query.queryId,
        serviceId: service.serviceId,
        serviceTitle: service.title,
        blackout,
      },
    })),
  );
};

const canUserOverrideBlackoutRate = (user = {}) => {
  const role = String(user?.role || "").trim().toLowerCase();
  return ["admin", "operation_manager", "operations_manager", "ops_manager", "operations", "ops"].includes(role);
};

const isBlackoutOverrideApproved = ({ user = {}, service = {} }) => {
  if (!canUserOverrideBlackoutRate(user)) return false;
  return Boolean(service?.blackoutOverride?.approved || service?.blackoutOverrideApproved);
};

const assertNoBlackoutContractRates = async ({ query, services = [], user = {} }) => {
  const blockedServices = services
    .map((service) => ({
      service,
      blackout: getBlackoutMatchForService(query, service),
    }))
    .filter((item) => item.blackout && !isBlackoutOverrideApproved({ user, service: item.service }));

  if (!blockedServices.length) return;

  try {
    await Promise.all(
      blockedServices.map((item) =>
        notifyOpsForBlockedBlackoutRate({
          query,
          service: item.service,
          blackout: item.blackout,
        }),
      ),
    );
  } catch (err) {
    console.error("Blackout notification error:", err);
  }
};

const notifyAssignedOpsMemberForBlackoutOverride = async ({ query, services = [], user = {}, quotation = null }) => {
  if (!query?.assignedTo || !canUserOverrideBlackoutRate(user)) return;
  if (String(query.assignedTo) === String(user?.id || user?._id || "")) return;

  const overrideServices = services
    .map((service) => ({
      service,
      blackout: getBlackoutMatchForService(query, service),
    }))
    .filter((item) => item.blackout && isBlackoutOverrideApproved({ user, service: item.service }));

  if (!overrideServices.length) return;

  const alertKey = [
    "blackout-override-quote",
    quotation?._id?.toString?.() || quotation?.quotationNumber || query._id,
    query.assignedTo?.toString?.() || query.assignedTo,
  ].join(":");

  const alreadyExists = await Notification.exists({ "meta.blackoutOverrideAlertKey": alertKey });
  if (alreadyExists) return;

  const serviceSummary = overrideServices
    .map(({ service, blackout }) => `${service.title || "Hotel"} (${formatBlackoutLabel(blackout)})`)
    .join(", ");

  await Notification.create({
    user: query.assignedTo,
    type: "warning",
    title: "Blackout Special Rate Quote Sent",
    message: `${user?.companyName || user?.name || "Ops Manager"} updated blackout pricing and prepared quotation ${quotation?.quotationNumber || ""} for ${query.queryId || "query"}. Services: ${serviceSummary}.`,
    link: "/ops/order-acceptance",
    meta: {
      blackoutOverrideAlertKey: alertKey,
      queryId: query._id,
      queryNumber: query.queryId,
      quotationId: quotation?._id,
      quotationNumber: quotation?.quotationNumber,
      services: overrideServices.map(({ service, blackout }) => ({
        serviceId: service.serviceId,
        title: service.title,
        blackout,
      })),
    },
  });
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

export const buildInvoiceLineItems = (quotation) =>
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
      service.description || "",
      quantityLabel ? `QTY: ${quantityLabel}` : "",
      ...transportNotes,
      pricingNote
    ].filter(Boolean);

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
      notes: combinedNotesList.join(" | "),
    };
  });

const buildInvoicePricingSnapshot = (quotation, totalAmount) => ({
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

const formatHistoryDateTimeLabel = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getQuotationCreatorSummary = (quotation = {}) => {
  const creator = quotation?.createdBy;
  const role = String(creator?.role || "").trim();
  const name = String(creator?.name || creator?.companyName || creator?.email || "").trim();
  const label =
    role === "operation_manager"
      ? "Operations Manager"
      : role === "operations"
        ? "Ops Team"
        : role === "admin"
          ? "Admin"
          : name || "Operations";

  return {
    id: String(creator?._id || creator || ""),
    name,
    role,
    label,
  };
};

const buildLatestQuotationSummary = (quotation = null) => {
  if (!quotation) return null;

  const creator = getQuotationCreatorSummary(quotation);
  const totalAmount = Number(quotation?.pricing?.totalAmount || quotation?.clientTotalAmount || 0);

  return {
    id: String(quotation?._id || ""),
    quotationNumber: quotation?.quotationNumber || "",
    status: quotation?.status || "",
    totalAmount,
    validTill: quotation?.validTill || null,
    createdAt: quotation?.createdAt || null,
    updatedAt: quotation?.updatedAt || null,
    createdAtLabel: formatHistoryDateTimeLabel(quotation?.createdAt),
    updatedAtLabel: formatHistoryDateTimeLabel(quotation?.updatedAt),
    createdBy: creator,
  };
};

const mapQuotationHistoryRow = (quotation = {}, index = 0, total = 0, latestRevisionRemark = "") => {
  const opsTotalAmount = Number(quotation?.pricing?.totalAmount || 0);
  const clientTotalAmount =
    quotation?.clientTotalAmount === undefined || quotation?.clientTotalAmount === null
      ? null
      : Number(quotation.clientTotalAmount);
  const markupAmount = Number(quotation?.agentMarkup?.markupAmount || 0);
  const creator = getQuotationCreatorSummary(quotation);

  return {
    id: String(quotation?._id || ""),
    quotationNumber: quotation?.quotationNumber || `Quotation ${index + 1}`,
    status: quotation?.status || "Pending",
    attemptNumber: total - index,
    isLatest: index === 0,
    createdAt: quotation?.createdAt || null,
    createdAtLabel: formatHistoryDateTimeLabel(quotation?.createdAt),
    updatedAt: quotation?.updatedAt || null,
    updatedAtLabel: formatHistoryDateTimeLabel(quotation?.updatedAt),
    createdBy: creator,
    validTill: quotation?.validTill || null,
    validTillLabel: formatMailDateLabel(quotation?.validTill),
    opsTotalAmount,
    clientTotalAmount,
    displayAmount: opsTotalAmount,
    pricing: {
      currency: quotation?.pricing?.currency || "INR",
      quoteCategory: quotation?.pricing?.quoteCategory || "domestic",
      baseAmount: Number(quotation?.pricing?.baseAmount || 0),
      subTotal: Number(quotation?.pricing?.subTotal || 0),
      packageTemplateAmount: Number(quotation?.pricing?.packageTemplateAmount || 0),
      totalAmount: opsTotalAmount,
      opsMarkup: {
        percent: Number(quotation?.pricing?.opsMarkup?.percent || 0),
        amount: Number(quotation?.pricing?.opsMarkup?.amount || 0),
      },
      opsCharges: {
        serviceCharge: Number(quotation?.pricing?.opsCharges?.serviceCharge || 0),
        handlingFee: Number(quotation?.pricing?.opsCharges?.handlingFee || 0),
      },
      tax: {
        gst: {
          percent: Number(quotation?.pricing?.tax?.gst?.percent || 0),
          amount: Number(quotation?.pricing?.tax?.gst?.amount || 0),
        },
        tcs: {
          percent: Number(quotation?.pricing?.tax?.tcs?.percent || 0),
          amount: Number(quotation?.pricing?.tax?.tcs?.amount || 0),
        },
        tourismFee: {
          amount: Number(quotation?.pricing?.tax?.tourismFee?.amount || 0),
        },
        totalTax: Number(quotation?.pricing?.tax?.totalTax || 0),
      },
    },
    agentMarkup: {
      type: String(quotation?.agentMarkup?.type || "").trim().toUpperCase(),
      value: Number(quotation?.agentMarkup?.value || 0),
      markupAmount,
    },
    agentRevisionRemark:
      String(quotation?.agentRevisionRemark || "").trim() ||
      (index === 0 && quotation?.status === "Revision Requested"
        ? String(latestRevisionRemark || "").trim()
        : ""),
    inclusions: Array.isArray(quotation?.inclusions) ? quotation.inclusions : [],
    exclusions: Array.isArray(quotation?.exclusions) ? quotation.exclusions : [],
    additionalNotes: Array.isArray(quotation?.additionalNotes) ? quotation.additionalNotes : [],
    dayWiseItinerary: Array.isArray(quotation?.dayWiseItinerary) ? quotation.dayWiseItinerary : [],
    services: Array.isArray(quotation?.services) ? quotation.services : [],
    serviceCount: Array.isArray(quotation?.services) ? quotation.services.length : 0,
  };
};

const buildTravelerSummary = (query = {}) => {
  const adults = Number(query?.numberOfAdults || 0);
  const children = Number(query?.numberOfChildren || 0);
  const parts = [];

  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);

  return parts.join(", ") || "Traveler details pending";
};

const getQueryPassengerCount = (query = {}) =>
  Number(query?.numberOfAdults || 0) + Number(query?.numberOfChildren || 0);

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

const MAIL_SERVICE_TYPE_LABELS = Object.freeze({
  hotel: "Hotel",
  transfer: "Transport",
  car: "Transport",
  activity: "Activity",
  sightseeing: "Sightseeing",
});

const normalizeDayWiseItinerary = (items = []) =>
  Array.isArray(items)
    ? items
      .map((item, index) => {
        const dayNumber = Math.max(1, Number(item?.dayNumber || index + 1));
        const parsedDate = item?.date ? new Date(item.date) : null;

        return {
          dayNumber,
          dayLabel: String(item?.dayLabel || "").trim(),
          date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
          title: String(item?.title || item?.heading || "").trim(),
          description: String(item?.description || "").trim(),
        };
      })
      .filter((item) => item.dayLabel || item.title || item.description || item.date)
    : [];

const buildAgentQuotationEmailPayload = ({ quotation, query }) => {
  const totalAmount = Number(quotation?.pricing?.totalAmount || 0);
  const totalServiceBase = Array.isArray(quotation?.services)
    ? quotation.services.reduce((sum, s) => sum + Number(s.total || 0), 0)
    : 0;
  const queryPax = getQueryPassengerCount(query);
  const inclusions = Array.isArray(quotation?.inclusions)
    ? quotation.inclusions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const exclusions = Array.isArray(quotation?.exclusions)
    ? quotation.exclusions.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const additionalNotes = Array.isArray(quotation?.additionalNotes)
    ? quotation.additionalNotes.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const sellerBankDetails = [
    { label: "Bank Name", value: "HDFC Bank" },
    { label: "A/c Holder Name", value: "Holiday Circuit" },
    { label: "A/c No.", value: "50200103968171" },
    { label: "IFSC", value: "HDFC0004413" },
    { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
  ];

  return {
    isOpsQuotation: true,
    agentBrandingName: "Holiday Circuit",
    agentLogo: "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",
    agentCompanyAddress: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
    agentPhone: "+91 8851346665, +91 9971706003",
    agentEmail: "ops@leelatravels.com",
    recipientName:
      query?.agent?.companyName ||
      query?.agent?.name ||
      "Guest",
    agencyName: "Holiday Circuit",
    quotationNumber: quotation?.quotationNumber || "",
    queryId: query?.queryId || "",
    destination: query?.destination || "",
    travelDates: `${formatMailDateLabel(query?.startDate)} - ${formatMailDateLabel(query?.endDate)}`,
    durationLabel: buildDurationLabel(query),
    travelerSummary: buildTravelerSummary(query),
    validTill: formatMailDateLabel(quotation?.validTill),
    totalAmount,
    currency: quotation?.pricing?.currency || "INR",
    inclusions,
    exclusions,
    additionalNotes,
    sellerBankDetails,
    dayWiseItinerary: normalizeDayWiseItinerary(quotation?.dayWiseItinerary),
    services: Array.isArray(quotation?.services)
      ? quotation.services.map((service) => {
        const rawService = typeof service?.toObject === "function" ? service.toObject() : (service || {});
        const normalizedServiceType = normalizeQuotationServiceType(rawService?.type);
        const ratio = totalServiceBase > 0 ? Number(rawService.total || 0) / totalServiceBase : 0;
        const clientAmount = totalServiceBase > 0 ? Math.round(totalAmount * ratio) : 0;
        const serviceDescription = String(rawService?.description || "").replace(/\|/g, " | ").trim();
        const transportNotes = normalizedServiceType === "transfer"
          ? buildTransportQuotationNotes(rawService)
          : [];
        const description = [serviceDescription, ...transportNotes].filter(Boolean).join("\n");
        return {
          ...rawService,
          title: rawService?.title || rawService?.name || "Service",
          type: normalizedServiceType || rawService?.type || "hotel",
          nights: Number(rawService?.nights || rawService?.nightCount || 0),
          typeLabel: MAIL_SERVICE_TYPE_LABELS[normalizedServiceType] || "Travel Service",
          location: buildServiceLocationLabel(rawService),
          serviceDateLabel: formatMailDateLabel(rawService?.serviceDate),
          quantityLabel: buildServiceQuantityLabel(rawService, queryPax),
          description,
          clientAmount,
        };
      })
      : [],
  };
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

const getLatestReassignmentEntry = (query = {}) => {
  const history = Array.isArray(query?.reassignmentHistory) ? query.reassignmentHistory : [];
  return history.length ? history[history.length - 1] : null;
};

const wasReassignedAwayFromOperationsUser = (query = {}, userId = "") => {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    return false;
  }

  const latestEntry = getLatestReassignmentEntry(query);
  if (!latestEntry) {
    return false;
  }

  const latestFromUserId = String(latestEntry?.fromUser || latestEntry?.fromUser?._id || "").trim();
  const latestToUserId = String(latestEntry?.toUser || latestEntry?.toUser?._id || "").trim();
  const assignedUserId = getAssignedQueryUserId(query);

  return (
    latestFromUserId === normalizedUserId &&
    latestToUserId &&
    latestToUserId !== normalizedUserId &&
    assignedUserId !== normalizedUserId
  );
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

const getAuthorizedQueryForQuotationDraft = async (quotationId, req) => {
  const quotation = await QuotationDraft.findById(quotationId);

  if (!quotation) {
    throw new ApiError(404, "Quotation draft not found");
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

      .populate("agent", "name email phone companyName")
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

export const getVouchers = async (req, res, next) => {
  try {
    const vouchers = await Voucher.find()
      .populate("agent", "name companyName email phone")
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
      agentEmail: voucher.agent?.email || "",
      agentPhone: voucher.agent?.phone || "",
    }));

    console.log("getVouchers format sample:", formatted[0] ? {
      agentName: formatted[0].agentName,
      agentEmail: formatted[0].agentEmail,
      agentPhone: formatted[0].agentPhone,
    } : "No vouchers");

    res.status(200).json({
      success: true,
      vouchers: formatted,
      stats: {
        ready: formatted.filter((v) => v.status === "ready").length,
        generated: formatted.filter((v) => v.status === "generated").length,
        sent: formatted.filter((v) => v.status === "sent").length,
      },
      data: {
        vouchers: formatted,
        stats: {
          ready: formatted.filter((v) => v.status === "ready").length,
          generated: formatted.filter((v) => v.status === "generated").length,
          sent: formatted.filter((v) => v.status === "sent").length,
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==================== Reject Query by Ops ==================================
export const rejectQueryByOps = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const rejectionReason = String(reason || "").trim();
    const query = await TravelQuery.findById(req.params.id);

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    if (!(await canManageAssignedQuery(req, query))) {
      console.log("USER ID:", req.user.id);
      return next(new ApiError(403, "Unauthorized"));
    }

    if (!rejectionReason) {
      return next(new ApiError(400, "Rejection reason is required"));
    }

    query.opsStatus = "Rejected";
    query.agentStatus = "Rejected";
    query.rejectionNote = rejectionReason;

    query.activityLog.push({ action: "Query Rejected", performedBy: req.user.name || "Operations", timestamp: new Date() });

    await createOpsSideNotification(req, {
      user: query.agent,
      type: "warning",
      title: "Query Rejected",
      message: `Your query ${query.queryId} has been rejected by operations. Reason: ${rejectionReason}`,
      meta: {
        queryId: query._id,
        queryNumber: query.queryId,
        reason: rejectionReason,
      },
    });

    await query.save();

    res.json({
      success: true,
      message: "Query rejected by operations",
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

    await createOpsSideNotification(req, {
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
    const { action, reason = "", remarks = "", issues = [], verifiedDocuments = [] } = req.body;

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
    const normalizedVerifiedDocuments = Array.isArray(verifiedDocuments)
      ? verifiedDocuments
        .map((document) => ({
          travelerId: String(document?.travelerId || "").trim(),
          travelerName: String(document?.travelerName || "").trim(),
          documentKey: String(document?.documentKey || "").trim(),
          documentLabel: String(document?.documentLabel || "").trim(),
        }))
        .filter((document) => document.travelerId && document.documentKey)
      : [];

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
        verifiedDocuments: normalizedVerifiedDocuments,
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

      await createOpsSideNotification(req, {
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
        verifiedDocuments: normalizedVerifiedDocuments.filter(
          (document) =>
            !normalizedIssues.some(
              (issue) =>
                issue.travelerId === document.travelerId &&
                issue.documentKey === document.documentKey,
            ),
        ),
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

      await createOpsSideNotification(req, {
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
    if (query.quotationStatus === "Sent_To_Agent") {
      return res.status(400).json({
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

    await createQuotationSentAgentNotification(req, {
      query,
      deliveryChannels: ["dashboard"],
    });

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
    const actorName = req.user?.name || req.user?.email || "Operations";
    const isOperationManagerActor = req.user?.role === "operation_manager";
    const targetRole = isOperationManagerActor ? "admin" : "operation_manager";
    const activityAction = isOperationManagerActor ? "Passed to Admin" : "Passed to Manager";
    const notificationTitle = isOperationManagerActor
      ? "Admin review requested"
      : "Ops manager review requested";
    const notificationMessage = isOperationManagerActor
      ? `${query.queryId} was passed to admin by ${actorName}.`
      : `${query.queryId} was passed to ops manager by ${actorName}.`;
    const notificationLink = isOperationManagerActor
      ? "/admin/dashboard"
      : "/ops/order-acceptance";
    const senderRole = isOperationManagerActor ? "operation_manager" : "operations";

    if (!note) {
      return next(new ApiError(400, `Note for ${isOperationManagerActor ? "admin" : "manager"} is required`));
    }

    const createdAt = new Date();

    query.activityLog = Array.isArray(query.activityLog) ? query.activityLog : [];
    query.activityLog.push({
      action: activityAction,
      performedBy: actorName,
      timestamp: createdAt,
    });

    const currentAdminCoordination =
      query.adminCoordination?.toObject?.() || query.adminCoordination || {};

    query.adminCoordination = {
      ...currentAdminCoordination,
      status: isOperationManagerActor ? "pending_admin_reply" : "pending_manager_reply",
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
          senderRole,
          senderId: req.user?.id || null,
          senderName: actorName,
          message: note,
          createdAt,
        },
      ],
    };

    await query.save();

    const adminUsers = await Auth.find({
      role: targetRole,
      isDeleted: { $ne: true },
      accountStatus: { $ne: "Inactive" },
    }).select("_id");

    if (adminUsers.length) {
      const notificationPayloads = adminUsers.map((adminUser) => ({
        user: adminUser._id,
        type: "warning",
        title: notificationTitle,
        message: notificationMessage,
        link: notificationLink,
        meta: {
          queryId: query._id,
          queryNumber: query.queryId,
          note,
          source: "ops_order_acceptance",
        },
      }));

      if (isOperationManagerActor) {
        await Notification.insertMany(notificationPayloads);
      } else {
        await createOpsSideNotifications(req, notificationPayloads, {
          adminPayloads: [
            {
              type: "warning",
              title: "Ops manager review requested",
              message: `${query.queryId} was passed to ops manager by ${actorName}.`,
              link: "/admin/dashboard",
              meta: {
                queryId: query._id,
                queryNumber: query.queryId,
                note,
                source: "ops_order_acceptance_admin_copy",
              },
            },
          ],
        });
      }
    }

    res.json({
      success: true,
      message: `Query passed to ${isOperationManagerActor ? "admin" : "manager"} successfully`,
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

    return res.json({ message: "Query status updated successfully", query });
  } catch (error) {
    next(error);
  }
};

//==================== Get Order Acceptance Order =====================================

export const getOrderAcceptanceQueries = async (req, res, next) => {
  try {
    const assignmentFilter = await getAssignedQueryFilter(req);
    const normalizedUserId = String(req.user?.id || "").trim();
    const isOperationsUser = req.user?.role === "operations";
    const sortOrderAcceptanceQueries = (items = []) =>
      [...items].sort((left, right) => {
        const leftPriority =
          ORDER_ACCEPTANCE_STATUS_PRIORITY[String(left?.opsStatus || "").trim()] ?? Number.MAX_SAFE_INTEGER;
        const rightPriority =
          ORDER_ACCEPTANCE_STATUS_PRIORITY[String(right?.opsStatus || "").trim()] ?? Number.MAX_SAFE_INTEGER;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();
      });

    let queries = [];
    const metricQueries = await TravelQuery.find({
      ...assignmentFilter,
    }).select("createdAt activityLog assignedTo");

    if (isOperationsUser && normalizedUserId) {
      const visibleQueries = await TravelQuery.find({
        opsStatus: {
          $in: ORDER_ACCEPTANCE_VISIBLE_STATUSES,
        },
        $or: [
          { assignedTo: new mongoose.Types.ObjectId(normalizedUserId) },
          { "reassignmentHistory.fromUser": new mongoose.Types.ObjectId(normalizedUserId) },
        ],
      })
        .populate("agent", "name companyName email phone")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });

      queries = visibleQueries.filter((query) => {
        const assignedUserId = getAssignedQueryUserId(query);
        return (
          assignedUserId === normalizedUserId ||
          wasReassignedAwayFromOperationsUser(query, normalizedUserId)
        );
      });
      queries = sortOrderAcceptanceQueries(queries);
    } else {
      queries = await TravelQuery.find({
        ...assignmentFilter,
        opsStatus: {
          $in: ORDER_ACCEPTANCE_VISIBLE_STATUSES,
        },
      })
        .populate("agent", "name companyName email phone")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });
      queries = sortOrderAcceptanceQueries(queries);
    }

    const queryIdsForLatestQuotations = queries
      .map((query) => query?._id)
      .filter(Boolean);

    if (queryIdsForLatestQuotations.length) {
      const latestQuotations = await Quotation.find({
        queryId: { $in: queryIdsForLatestQuotations },
        status: { $ne: "Pending" },
      })
        .select("queryId quotationNumber status pricing clientTotalAmount validTill createdAt updatedAt createdBy")
        .populate("createdBy", "name email companyName role")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      const latestQuotationByQuery = latestQuotations.reduce((acc, quotation) => {
        const key = quotation?.queryId ? String(quotation.queryId) : "";
        if (key && !acc[key]) {
          acc[key] = buildLatestQuotationSummary(quotation);
        }
        return acc;
      }, {});

      queries = queries.map((query) => {
        const queryObject = query?.toObject ? query.toObject() : query;
        return {
          ...queryObject,
          latestQuotation: latestQuotationByQuery[String(queryObject?._id || "")] || null,
        };
      });
    }

    // Pending orders count
    const pendingOrders = await TravelQuery.countDocuments({
      ...assignmentFilter,
      opsStatus: { $in: ORDER_ACCEPTANCE_PENDING_STATUSES }
    });

    let avgResponseTime = "0m";
    const resolutionDurations = metricQueries
      .map((query) => {
        const acceptedAt = getQueryAcceptedAt(query);
        const completedAt = getFinalOpsCompletionAt(query);

        if (!isValidDate(acceptedAt) || !isValidDate(completedAt)) {
          return null;
        }

        const diffInMinutes = Math.floor(
          (completedAt.getTime() - acceptedAt.getTime()) / (1000 * 60),
        );

        return diffInMinutes >= 0 ? diffInMinutes : null;
      })
      .filter((value) => value !== null);

    if (resolutionDurations.length > 0) {
      const totalMinutes = Math.floor(
        resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length,
      );
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      avgResponseTime =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    res.status(200).json({ success: true, pendingOrders, avgResponseTime, queries });

  } catch (error) {
    next(error);
  }
};

/* ========================= CREATE QUOTATION ========================= */

export const createQuotation = async (req, res, next) => {
  try {

    const {
      quotationId,
      editExistingQuotation = false,
      queryId,
      validTill,
      pricing,
      sendVia = [],
      selectedAction = "",
      services = [],
      opsPercent = 0,
      opsAmount = 0,
      serviceCharge = 0,
      handlingFee = 0,
      inclusions = [],
      exclusions = [],
      additionalNotes = [],
      dayWiseItinerary = [],
    } = req.body;

    const normalizedInclusions = Array.isArray(inclusions)
      ? inclusions.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const normalizedExclusions = Array.isArray(exclusions)
      ? exclusions.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const normalizedAdditionalNotes = Array.isArray(additionalNotes)
      ? additionalNotes.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const normalizedDayWiseItinerary = normalizeDayWiseItinerary(dayWiseItinerary);
    const sendViaArray = Array.isArray(sendVia)
      ? sendVia.map((channel) => String(channel || "").trim().toLowerCase()).filter(Boolean)
      : [String(sendVia || "").trim().toLowerCase()].filter(Boolean);
    const normalizedSelectedAction = String(selectedAction || "").trim();
    const shouldSendDashboardNotification =
      sendViaArray.includes("dashboard") ||
      sendViaArray.includes("dashboard_notification") ||
      normalizedSelectedAction === "Dashboard Notification";
    const shouldSendEmail = sendViaArray.includes("email");
    const shouldSendWhatsApp = sendViaArray.includes("whatsapp");
    const shouldMarkAsSent =
      shouldSendDashboardNotification || shouldSendEmail || shouldSendWhatsApp;

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

    await assertNoBlackoutContractRates({ query, services: resolvedServices, user: req.user });
    await syncManualRateOverridesToLiveServices(resolvedServices);

    let quotation = null;
    let sourceDraft = null;

    if (quotationId) {
      if (!editExistingQuotation) {
        const requestedDraft = await QuotationDraft.findById(quotationId);
        if (requestedDraft && String(requestedDraft.queryId) === String(query._id)) {
          sourceDraft = requestedDraft;
        }
      }

      if (!sourceDraft) {
        const requestedQuotation = await Quotation.findById(quotationId);
        if (requestedQuotation && String(requestedQuotation.queryId) === String(query._id)) {
          if (Boolean(editExistingQuotation) || requestedQuotation.status !== "Pending") {
            quotation = requestedQuotation;
          } else {
            sourceDraft = requestedQuotation;
          }
        }
      }
    }

    let quotationNumber = quotation?.quotationNumber || sourceDraft?.quotationNumber || "";

    if (sourceDraft && quotationNumber) {
      const existingQuotationWithNumber = await Quotation.findOne({ quotationNumber }).select("_id");
      if (existingQuotationWithNumber && String(existingQuotationWithNumber._id) !== String(quotation?._id || "")) {
        quotationNumber = "";
      }
    }

    if (!quotationNumber) {
      quotationNumber = await generateUniqueQuotationNumber();
    }


    const baseAmount = pricing?.baseAmount;
    const packageTemplateAmount = Number(pricing?.packageTemplateAmount || 0);
    const servicesTotal = resolvedServices.reduce((sum, s) => { return sum + Number(s.totalInInr || 0) }, 0);
    const serviceCurrencyBreakdown = buildServiceCurrencyBreakdown(resolvedServices);
    const opsMarkupBasisAmount = Number(servicesTotal + packageTemplateAmount);
    const hasTaxableQuoteValue = roundCurrencyAmount(opsMarkupBasisAmount) > 0;
    const taxPayload = req.body.tax || {};
    const tourismAmount = hasTaxableQuoteValue ? Number(taxPayload?.tourismAmount ?? 0) : 0;

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
    const subTotal = Number(
      servicesTotal + packageTemplateAmount + finalOpsAmount + service + handling
    );

    const gstPercent = hasTaxableQuoteValue ? Number(taxPayload?.gstPercent || 0) : 0;
    const tcsPercent = hasTaxableQuoteValue ? Number(taxPayload?.tcsPercent || 0) : 0;
    const finalGstAmount = hasTaxableQuoteValue ? Number(taxPayload?.gstAmount || 0) : 0;
    const finalTcsAmount = hasTaxableQuoteValue ? Number(taxPayload?.tcsAmount || 0) : 0;

    const taxTotal = Number(finalGstAmount + finalTcsAmount + tourismAmount);
    // const subTotal = base + opsAmt + service + handling;
    const totalAmount = Number(subTotal + taxTotal);

    const formattedServices = resolvedServices.map(s => {
      const type = String(s.type || s.serviceType || s.category || "").toLowerCase();
      const basePayload = {
        serviceId: s.serviceId,
        supplierId: s.supplierId || undefined,
        supplierName: s.supplierName || "",
        dmcId: s.dmcId || s.supplierId || undefined,
        dmcName: s.dmcName || "",
        type: s.type || s.serviceType || s.category || "",
        title:
          s.title ||
          s.serviceName ||
          s.name ||
          s.hotelName ||
          s.activityName ||
          s.sightseeingName ||
          s.transferName ||
          s.description ||
          "Service",
        city: s.city,
        country: s.country,
        description: s.description,
        serviceDate: s.serviceDate || undefined,
        adults: Number(s.adults || 0),
        children: Number(s.children || 0),
        infants: Number(s.infants || 0),
        currency: s.currency || "INR",
        price: s.price || 0,
        exchangeRate: Number(s.exchangeRate || 1),
        priceInInr: Number(s.priceInInr || 0),
        total: s.total || 0,
        totalInInr: Number(s.totalInInr || 0),
      };

      if (type === "hotel") {
        return {
          ...basePayload,
          roomCategory: s.roomCategory,
          roomType: s.roomType,
          hotelCategory: s.hotelCategory,
          bedType: normalizeBedType(s.bedType),
          rooms: s.rooms || 1,
          nights: s.nights || 1,
          hotelRateMode: s.hotelRateMode === "service-total" ? "service-total" : "unit-rate",
          manualRateOverride: Boolean(s.manualRateOverride),
          quoteBaseRate: Number(s.quoteBaseRate || 0),
          roomTypeOptionRate: Number(s.roomTypeOptionRate || 0),
          roomTypeOptionCurrency: s.roomTypeOptionCurrency || s.currency || "INR",
          extraAdult: Boolean(s.extraAdult),
          childWithBed: Boolean(s.childWithBed),
          childWithoutBed: Boolean(s.childWithoutBed),
          awebRate: Number(s.awebRate || 0),
          cwebRate: Number(s.cwebRate || 0),
          cwoebRate: Number(s.cwoebRate || 0),
        };
      } else if (["transfer", "transport", "car"].includes(type)) {
        return {
          ...basePayload,
          vehicleType: s.vehicleType,
          pickupTime: s.pickupTime || s.time || "",
          time: s.pickupTime || s.time || "",
          passengerCapacity: s.passengerCapacity,
          luggageCapacity: s.luggageCapacity,
          usageType: normalizeUsageType(s.usageType),
          transportUsageOptionKey: s.transportUsageOptionKey || "",
          transportUsageLabel: s.transportUsageLabel || "",
          transportUsageLimitOptionKey: s.transportUsageLimitOptionKey || "",
          extraPerKmRate: Number(s.extraPerKmRate || 0),
          fullDayExtraPerKmRate: Number(s.fullDayExtraPerKmRate || 0),
          halfDayExtraPerKmRate: Number(s.halfDayExtraPerKmRate || 0),
          days: s.days || 1,
          pax: s.pax || 1,
        };
      } else if (["activity", "sightseeing"].includes(type)) {
        return {
          ...basePayload,
          tourType: s.tourType || "Sharing Tour",
          tourTypes: Array.isArray(s.tourTypes) ? s.tourTypes : [],
          pricingBasis: s.pricingBasis || "",
          maxPax: s.maxPax || "",
          adultPrice: Number(s.adultPrice !== undefined ? s.adultPrice : (s.price || 0)),
          childPrice: Number(s.childPrice !== undefined ? s.childPrice : 0),
          duration: s.duration || "",
          slots: s.slots || "",
          selectedSlot: s.selectedSlot || s.slot || "",
          operatingDays: s.operatingDays || "",
          openingTime: s.openingTime || "",
          closingTime: s.closingTime || "",
          days: s.days || 1,
          pax: s.pax || 1,
        };
      }

      return {
        ...basePayload,
        days: s.days || 1,
        pax: s.pax || 1,
      };
    });

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
      quotation.inclusions = normalizedInclusions;
      quotation.exclusions = normalizedExclusions;
      quotation.additionalNotes = normalizedAdditionalNotes;
      quotation.dayWiseItinerary = normalizedDayWiseItinerary;
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
      const previousQuotationStatus = String(quotation.status || "").trim();
      quotation.status = shouldMarkAsSent
        ? "Quote Sent"
        : (Boolean(editExistingQuotation) && previousQuotationStatus && previousQuotationStatus !== "Pending"
          ? previousQuotationStatus
          : "Pending");
      await quotation.save();
      if (typeof query !== "undefined" && typeof resolvedServices !== "undefined") {
        await notifyAssignedOpsMemberForBlackoutOverride({
          query,
          services: resolvedServices,
          user: req.user,
          quotation,
        });
      }

      const quoteDetails = {
        name: query.agent?.name,
        agentName: query.agent?.name,
        destination: query.destination,
        days: query.totalDays || 5,
        price: totalAmount,
        totalAmount: totalAmount,
        validTill: new Date(validTill).toDateString(),
        phone: query.agent?.phone,
        sellerBankDetails: [
          { label: "Bank Name", value: "HDFC Bank" },
          { label: "A/c Holder Name", value: "Holiday Circuit" },
          { label: "A/c No.", value: "50200103968171" },
          { label: "IFSC", value: "HDFC0004413" },
          { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
        ],
      };

      if (isNaN(totalAmount)) {
        return next(new ApiError(400, "Total amount calculation failed"));
      }

      const deliveryWarnings = [];
      const successfulDeliveryChannels = [];

      if (shouldSendEmail) {
        try {
          await sendAgentClientQuotationMail(
            query.agent.email,
            buildAgentQuotationEmailPayload({ quotation, query }),
          );
          successfulDeliveryChannels.push("email");
        } catch (emailError) {
          console.error("Quotation email send failed:", emailError);
          deliveryWarnings.push(
            `Quotation saved, but email delivery failed. ${getEmailDeliveryErrorMessage(emailError)}`,
          );
        }
      }

      if (shouldSendWhatsApp) {
        try {
          await sendWhatsAppMessage(quoteDetails);
          successfulDeliveryChannels.push("whatsapp");
        } catch (whatsappError) {
          console.error("Quotation WhatsApp send failed:", whatsappError);
          deliveryWarnings.push(getWhatsAppDeliveryErrorMessage(whatsappError));
        }
      }

      if (shouldSendDashboardNotification) {
        successfulDeliveryChannels.unshift("dashboard");
      }

      if (shouldMarkAsSent) {
        await createQuotationSentAgentNotification(req, {
          query,
          quotation,
          totalAmount,
          deliveryChannels: successfulDeliveryChannels,
        });
      }

      if (shouldMarkAsSent) {
        query.quotationStatus = "Sent_To_Agent";
        if (!["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
          query.opsStatus = "Booking_Accepted";
        }
        query.agentStatus = "Quote Sent";
        addLogIfNotExists(query, "Quote Sent", "Ops Team");

        await query.save();
      }

      if (sourceDraft?.constructor?.modelName === "QuotationDraft") {
        sourceDraft.draftStatus = "converted";
        sourceDraft.convertedQuotationId = quotation._id;
        sourceDraft.convertedAt = new Date();
        await sourceDraft.save();
      }

      return res.status(201).json({
        success: true,
        message: shouldMarkAsSent
          ? "Quotation created and sent successfully"
          : "Quotation saved successfully",
        quotation,
        warnings: deliveryWarnings,
        sentToAgent: shouldMarkAsSent,
      });
    }

    const createdQuotation = await Quotation.create({
      quotationNumber,
      queryId: query._id,
      agent: query.agent,
      createdBy: req.user.id,

      inclusions: normalizedInclusions,
      exclusions: normalizedExclusions,
      additionalNotes: normalizedAdditionalNotes,
      dayWiseItinerary: normalizedDayWiseItinerary,

      services: formattedServices,   // ✅ ADD THIS

      pricing: {
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
      status: shouldMarkAsSent ? "Quote Sent" : "Pending"
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
      sellerBankDetails: [
        { label: "Bank Name", value: "HDFC Bank" },
        { label: "A/c Holder Name", value: "Holiday Circuit" },
        { label: "A/c No.", value: "50200103968171" },
        { label: "IFSC", value: "HDFC0004413" },
        { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
      ],
    };

    if (isNaN(totalAmount)) {
      return next(new ApiError(400, "Total amount calculation failed"));
    }
    // 🔥 SEND EMAIL / WHATSAPP BASED ON USER SELECTION
    const deliveryWarnings = [];
    const successfulDeliveryChannels = [];

    if (shouldSendEmail) {
      try {
        await sendAgentClientQuotationMail(
          query.agent.email,
          buildAgentQuotationEmailPayload({ quotation: createdQuotation, query }),
        );
        successfulDeliveryChannels.push("email");
      } catch (emailError) {
        console.error("Quotation email send failed:", emailError);
        deliveryWarnings.push(
          `Quotation saved, but email delivery failed. ${getEmailDeliveryErrorMessage(emailError)}`,
        );
      }
    }

    if (shouldSendWhatsApp) {
      try {
        await sendWhatsAppMessage(quoteDetails);
        successfulDeliveryChannels.push("whatsapp");
      } catch (whatsappError) {
        console.error("Quotation WhatsApp send failed:", whatsappError);
        deliveryWarnings.push(getWhatsAppDeliveryErrorMessage(whatsappError));
      }
    }

    if (shouldSendDashboardNotification) {
      successfulDeliveryChannels.unshift("dashboard");
    }

    if (shouldMarkAsSent) {
      await createQuotationSentAgentNotification(req, {
        query,
        quotation: createdQuotation,
        totalAmount,
        deliveryChannels: successfulDeliveryChannels,
      });
    }

    if (shouldMarkAsSent) {
      query.quotationStatus = "Sent_To_Agent";
      if (!["Confirmed", "Vouchered", "Payment_Completed"].includes(query.opsStatus)) {
        query.opsStatus = "Booking_Accepted";
      }
      query.agentStatus = "Quote Sent";

      // Keep "Quote Sent" as a single timeline event even if multiple quotations are created/sent.
      addLogIfNotExists(query, "Quote Sent", "Ops Team");

      await query.save();
    }

    if (sourceDraft?.constructor?.modelName === "QuotationDraft") {
      sourceDraft.draftStatus = "converted";
      sourceDraft.convertedQuotationId = createdQuotation._id;
      sourceDraft.convertedAt = new Date();
      await sourceDraft.save();
    }

    res.status(201).json({
      success: true,
      message: shouldMarkAsSent
        ? "Quotation created and sent successfully"
        : "Quotation saved successfully",
      quotation: createdQuotation,
      warnings: deliveryWarnings,
      sentToAgent: shouldMarkAsSent,
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

    const { quotation, query } = await getAuthorizedQueryForQuotationDraft(quotationId, req);

    //CASE 1: array
    if (Array.isArray(inclusions)) {
      quotation.inclusions.push(...inclusions);
    }
    //CASE 2: single string 
    else {
      quotation.inclusions.push(inclusions);
    }

    await quotation.save();
    if (typeof query !== "undefined" && typeof resolvedServices !== "undefined") {
      if (typeof query !== "undefined" && typeof resolvedServices !== "undefined") {
        await notifyAssignedOpsMemberForBlackoutOverride({
          query,
          services: resolvedServices,
          user: req.user,
          quotation,
        });
      }
    }

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

    if (quotation.agent?._id || quotation.agent) {
      await createOpsSideNotification(req, {
        user: quotation.agent?._id || quotation.agent,
        type: "info",
        title: "Booking Amount Ready",
        message: `${invoiceNumber} has been prepared for ${query.queryId}. You can now continue the amount and documents process from Active Bookings.`,
        link: "/agent/bookings",
        meta: {
          queryId: query._id,
          invoiceId: invoice._id,
          invoiceNumber,
          kind: "finance_invoice_prepared",
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      invoice
    });

  } catch (error) {
    next(error);
  }
};

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



const getLatestInvoiceByQueryId = async (queryIds = []) => {
  const normalizedQueryIds = queryIds.filter(Boolean);
  if (!normalizedQueryIds.length) return new Map();

  const invoices = await Invoice.find({ query: { $in: normalizedQueryIds } })
    .select("query paymentStatus paymentVerification.status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const invoiceMap = new Map();
  invoices.forEach((invoice) => {
    const queryId = invoice.query?.toString?.() || String(invoice.query || "");
    if (queryId && !invoiceMap.has(queryId)) {
      invoiceMap.set(queryId, invoice);
    }
  });

  return invoiceMap;
};

const isPaymentVerifiedForVoucherGeneration = (invoice = null) => {
  const paymentStatus = String(invoice?.paymentStatus || "").trim();
  const verificationStatus = String(invoice?.paymentVerification?.status || "").trim();

  return (
    verificationStatus === "Verified" &&
    ["Partially Paid", "Paid"].includes(paymentStatus)
  );
};

const isPaymentVerifiedForVoucherDispatch = (invoice = null) =>
  isPaymentVerifiedForVoucherGeneration(invoice);

const isPaymentFullyVerifiedForVoucherDispatch = (invoice = null) =>
  String(invoice?.paymentVerification?.status || "").trim() === "Verified" &&
  String(invoice?.paymentStatus || "").trim() === "Paid";

export const getVoucherManagementData = async (req, res, next) => {
  try {
    const assignmentFilter = await getAssignedQueryFilter(req);

    const rawVoucherDocs = await Voucher.find()
      .populate("query")
      .populate("quotation", "services")
      .populate("agent", "name companyName email phone brandingName brandingLogo")
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

    const candidateReadyQueries = await TravelQuery.find({
      ...assignmentFilter,
      opsStatus: { $in: ["Invoice_Requested", "Confirmed", "Vouchered", "Payment_Completed"] },
      _id: { $nin: voucherQueryIds },
    }).populate("agent", "name companyName email phone brandingName brandingLogo");

    const readyInvoiceMap = await getLatestInvoiceByQueryId(
      candidateReadyQueries.map((query) => query._id),
    );
    const voucherInvoiceMap = await getLatestInvoiceByQueryId(
      voucherDocs
        .map((voucher) => voucher.query?._id || voucher.query)
        .filter(Boolean),
    );

    const readyQueries = candidateReadyQueries.filter((query) => {
      const opsStatus = String(query.opsStatus || "").trim();
      if (["Confirmed", "Vouchered", "Payment_Completed"].includes(opsStatus)) return true;

      return isPaymentVerifiedForVoucherGeneration(
        readyInvoiceMap.get(query._id?.toString()),
      );
    });

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

        const quotation = await getLatestOperationalQuotation(query._id);

        return {
          id: query._id,
          query: query.queryId,
          voucherNumber: query.voucherNumber || "",
          status: "ready",
          invoicePaymentStatus:
            readyInvoiceMap.get(query._id?.toString())?.paymentStatus || "",
          paymentVerificationStatus:
            readyInvoiceMap.get(query._id?.toString())?.paymentVerification?.status || "",
          canSendVoucher: false,
          name: query.agent?.name || query.agent?.companyName || "Guest",
          destination: query.destination || "",
          date: query.startDate,
          travelDate: query.startDate || null,
          duration: `${nights}N/${days}D`,
          passengers: `${passengers} PAX`,
          adults: Number(query.numberOfAdults || 0),
          children: Number(query.numberOfChildren || 0),
          travelerSummary: buildTravelerSummary(query),
          services: (quotation?.services || []).map((service, index) => ({
            type: service.type,
            title: service.title,
            status: getServiceConfirmationStatus(
              getConfirmationServicesForQuery(confirmationMap, query),
              service,
              index
            ) || "",
            confirmation: getServiceConfirmation(
              getConfirmationServicesForQuery(confirmationMap, query),
              service,
              index
            ),
          })),
          branding: "with",
          agentName: query.agent?.companyName || query.agent?.name || "",
          agentEmail: query.agent?.email || "",
          agentPhone: query.agent?.phone || "",
          termsAndConditions: quotation?.termsAndConditions || [],
        };
      })
    );

    const generatedSentItems = await Promise.all(voucherDocs.map(async (voucher) => {
      const latestInvoice = voucherInvoiceMap.get(
        voucher.query?._id?.toString?.() || voucher.query?.toString?.() || "",
      );
      const confirmationServices = getConfirmationServicesForQuery(
        confirmationMap,
        voucher.query,
      );
      const fallbackQuotation =
        voucher.quotation ||
        (voucher.query?._id
          ? await getLatestOperationalQuotation(voucher.query._id)
            .select("services termsAndConditions")
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
        invoicePaymentStatus: latestInvoice?.paymentStatus || "",
        paymentVerificationStatus: latestInvoice?.paymentVerification?.status || "",
        canSendVoucher: isPaymentVerifiedForVoucherDispatch(latestInvoice),
        name: voucher.guestName || voucher.agent?.name || "Guest",
        destination: voucher.destination || voucher.query?.destination || "",
        date: voucher.travelDate,
        travelDate: voucher.travelDate || voucher.query?.startDate || null,
        duration: voucher.duration,
        passengers: voucher.passengers,
        adults: Number(voucher.query?.numberOfAdults || 0),
        children: Number(voucher.query?.numberOfChildren || 0),
        travelerSummary: buildTravelerSummary(voucher.query || {}),
        services: resolvedVoucherServices.map((service) => ({
          type: service.type || "service",
          title: service.name || "Service missing",
          status: service.status || "",
          confirmation: service.confirmation || "Pending",
        })),
        branding: voucher.branding || "with",
        agentName: voucher.agent?.companyName || voucher.agent?.name || "",
        agentEmail: voucher.agent?.email || "",
        agentPhone: voucher.agent?.phone || "",
        agentBrandingName: voucher.agent?.brandingName || voucher.agent?.companyName || "",
        agentLogo: voucher.agent?.brandingLogo || "",
        termsAndConditions: voucher.termsAndConditions?.length ? voucher.termsAndConditions : (fallbackQuotation?.termsAndConditions || []),
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

const getServiceConfirmationStatus = (confirmationServices = [], service, serviceIndex = -1) => {
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

  if (matched?.status) {
    return matched.status;
  }

  if (serviceIndex >= 0 && confirmationServices[serviceIndex]?.status) {
    return confirmationServices[serviceIndex].status;
  }

  return "";
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
      status:
        getServiceConfirmationStatus(
          confirmationServices,
          {
            type: service?.type || fallbackQuotationService?.type,
            title: resolvedServiceName,
            name: resolvedServiceName,
          },
          index,
        ) || service?.status || "",
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

const DMC_CONFIRMATION_DOCUMENTS = [
  { key: "supplierConfirmation", filenamePrefix: "Supplier_Confirmation" },
  { key: "voucherReference", filenamePrefix: "Voucher_Reference" },
  { key: "termsConditions", filenamePrefix: "Terms_Conditions" },
];

const buildDmcConfirmationAttachments = (confirmation = null) =>
  DMC_CONFIRMATION_DOCUMENTS.map(({ key, filenamePrefix }) => {
    const storedPath = confirmation?.documents?.[key];
    if (!storedPath) return null;

    const normalizedPath = String(storedPath).replace(/\\/g, "/").replace(/^\/+/, "");
    const absolutePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.join(process.cwd(), normalizedPath);

    if (!fs.existsSync(absolutePath)) return null;

    const originalName = path.basename(normalizedPath);
    const fileExtension = path.extname(originalName);
    const readableName = originalName.replace(/^\d+-/, "") || `${filenamePrefix}${fileExtension}`;

    return {
      filename: `${filenamePrefix}_${readableName}`,
      path: absolutePath,
    };
  }).filter(Boolean);

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

    const latestInvoice = await Invoice.findOne({ query: query._id })
      .select("paymentStatus paymentVerification.status createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const canGenerateVoucher =
      ["Confirmed", "Vouchered", "Payment_Completed"].includes(String(query.opsStatus || "").trim()) ||
      isPaymentVerifiedForVoucherGeneration(latestInvoice);

    if (!canGenerateVoucher) {
      return res.status(400).json({
        success: false,
        message: "Voucher can be generated only after finance verifies a partial or full payment",
      });
    }

    let counter = await Counter.findOne({ name: "voucher" });

    if (!counter) {
      counter = await Counter.create({ name: "voucher", seq: 1000 });
    }

    counter.seq += 1;
    await counter.save();

    const voucherNumber = `VCH-${counter.seq}`;

    const quotation = await getLatestOperationalQuotation(query._id);
    const confirmation = await Confirmation.findOne({
      queryId: { $in: [query.queryId, query._id.toString()] },
    }).lean();
    const confirmationServices = confirmation?.services || [];

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
    if (isPaymentFullyVerifiedForVoucherDispatch(latestInvoice)) {
      query.opsStatus = "Payment_Completed";
    } else if (query.opsStatus === "Confirmed") {
      query.opsStatus = "Vouchered";
    }

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
      termsAndConditions: quotation?.termsAndConditions || [],
      services: (quotation?.services || []).map((service, index) => {
        const cnfNum = getServiceConfirmationNumber(confirmationServices, service, index);
        const cnfStatus = getServiceConfirmationStatus(confirmationServices, service, index);
        return {
          type: service.type || "service",
          name: service.title || service.name || "",
          status: cnfStatus || (cnfNum && cnfNum !== "Pending" ? "Confirmed" : "Pending"),
          confirmation: cnfNum && cnfNum !== "Pending" ? cnfNum : (cnfStatus === "Confirmed" ? "Confirmed" : "Pending"),
        };
      }),
      generatedBy: req.user.id,
      generatedAt: new Date(),
    });

    if (quotation && Array.isArray(quotation.services)) {
      quotation.services = quotation.services.map((service, index) => {
        const cnfNum = getServiceConfirmationNumber(confirmationServices, service, index);
        const cnfStatus = getServiceConfirmationStatus(confirmationServices, service, index);
        const serviceObj = service.toObject ? service.toObject() : { ...service };
        if (cnfNum && cnfNum !== "Pending") {
          serviceObj.confirmationNumber = cnfNum;
          serviceObj.voucherNumber = cnfNum;
          serviceObj.confirmation = cnfNum;
          serviceObj.status = "Confirmed";
          serviceObj.isVoucherGenerated = true;
        } else if (cnfStatus && cnfStatus !== "Pending") {
          serviceObj.status = cnfStatus;
          serviceObj.confirmation = cnfStatus;
        }
        return serviceObj;
      });
      await quotation.save();
    }

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
    const { branding = "with", email, phone, dispatchChannel = "EMAIL", termsAndConditions = null } = req.body;
    const normalizedDispatchChannel = String(dispatchChannel || "EMAIL").trim().toUpperCase();
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

    if (termsAndConditions && Array.isArray(termsAndConditions)) {
      voucher.termsAndConditions = termsAndConditions;
    }

    const latestInvoice = await Invoice.findOne({ query: query._id })
      .select("paymentStatus paymentVerification.status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (!isPaymentVerifiedForVoucherDispatch(latestInvoice)) {
      return res.status(400).json({
        success: false,
        message: "Voucher can be sent to the agent only after finance verifies a partial or full payment",
      });
    }

    const quotation =
      (voucher.quotation
        ? await Quotation.findById(voucher.quotation).select("services termsAndConditions")
        : null) ||
      (await getLatestOperationalQuotation(query._id)
        .select("services termsAndConditions")
      );

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

    if (normalizedDispatchChannel === "EMAIL") {
      try {
        const dmcConfirmationAttachments = buildDmcConfirmationAttachments(confirmation);

        await sendEmailVoucher(
          email || query.agent?.email,
          {
            voucherNumber: voucher.voucherNumber,
            name: voucher.guestName || query.agent?.name || "",
            destination: voucher.destination || query.destination || "",
            passengers: voucher.passengers,
            duration: voucher.duration,
            travelDate: voucher.travelDate || query.startDate || null,
            adults: Number(query.numberOfAdults || 0),
            children: Number(query.numberOfChildren || 0),
            travelerSummary: buildTravelerSummary(query),
            termsAndConditions: termsAndConditions || voucher.termsAndConditions || quotation?.termsAndConditions || [],
            services: resolvedVoucherServices.map((service) => ({
              type: service.type,
              title: service.name,
              status: service.status || "",
              confirmation: service.confirmation,
            })),
          },
          branding,
          dmcConfirmationAttachments
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
            ? `Voucher email could not be sent. ${emailError.message}`
            : "Voucher email could not be sent. Please verify SMTP configuration and try again.",
        });
      }
    }

    query.voucherStatus = "sent";
    query.voucherSentAt = new Date();
    query.voucherPdfUrl = "";
    if (isPaymentFullyVerifiedForVoucherDispatch(latestInvoice)) {
      query.opsStatus = "Payment_Completed";
    } else if (query.opsStatus !== "Vouchered") {
      query.opsStatus = "Vouchered";
    }

    addLogIfNotExists(query, "Voucher Sent", "Ops Team");

    await query.save();

    voucher.status = "sent";
    voucher.branding = branding;
    voucher.sentAt = new Date();
    voucher.services = resolvedVoucherServices.map((service) => ({
      type: service.type,
      name: service.name,
      status: service.status || "",
      confirmation: service.confirmation,
    }));
    await voucher.save();

    await createOpsSideNotification(req, {
      user: query.agent._id,
      type: "success",
      title: "Voucher Sent",
      message: `Your voucher ${voucher.voucherNumber} for ${voucher.destination || query.destination} is ready to view.${getVoucherDispatchNote(
        normalizedDispatchChannel,
        {
          email: email || query.agent?.email || "",
          phone,
        },
      )}`,
      meta: {
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        queryId: query._id,
        queryNumber: query.queryId,
        destination: voucher.destination || query.destination,
        branding,
        dispatchChannel: normalizedDispatchChannel,
        recipientEmail: email || query.agent?.email || "",
        recipientPhone: phone || "",
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
    const requestedSourceRefresh =
      String(req.query?.refreshFromSource || "").trim().toLowerCase() === "true";
    const requestedFreshDraft =
      String(req.query?.freshDraft || "").trim().toLowerCase() === "true";

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    const shouldStartBlankRevisionDraft =
      requestedFreshDraft ||
      (
        String(query?.opsStatus || "").trim() === "Revision_Query" &&
        !requestedSourceQuotationId
      );

    if (!(await canManageAssignedQuery(req, query))) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const latestQuotation = await Quotation.findOne({
      queryId: query._id,
      status: { $ne: "Pending" },
    }).sort({ createdAt: -1 });
    const sourceQuotation = requestedSourceQuotationId
      ? await Quotation.findOne({ _id: requestedSourceQuotationId, queryId: query._id })
      : shouldStartBlankRevisionDraft
        ? null
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
      exclusions: Array.isArray(baseQuotation?.exclusions) ? baseQuotation.exclusions : [],
      additionalNotes: Array.isArray(baseQuotation?.additionalNotes) ? baseQuotation.additionalNotes : [],
      dayWiseItinerary: normalizeDayWiseItinerary(baseQuotation?.dayWiseItinerary),
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
          transportUsageOptionKey: service.transportUsageOptionKey || "",
          transportUsageLabel: service.transportUsageLabel || "",
          transportUsageLimitOptionKey: service.transportUsageLimitOptionKey || "",
          extraPerKmRate: Number(service.extraPerKmRate || 0),
          fullDayExtraPerKmRate: Number(service.fullDayExtraPerKmRate || 0),
          halfDayExtraPerKmRate: Number(service.halfDayExtraPerKmRate || 0),
          days: Number(service.days || 1),
          pax: Number(service.pax || 1),
          currency: service.currency || "INR",
          price: Number(service.price || 0),
          hotelRateMode: service.hotelRateMode === "service-total" ? "service-total" : "unit-rate",
          quoteBaseRate: Number(service.quoteBaseRate || 0),
          roomTypeOptionRate: Number(service.roomTypeOptionRate || 0),
          roomTypeOptionCurrency: service.roomTypeOptionCurrency || service.currency || "INR",
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

    const activeDraftFilter = {
      queryId: query._id,
      draftStatus: "active",
      status: "Pending",
    };

    if (requestedSourceQuotationId) {
      activeDraftFilter.sourceQuotationId = requestedSourceQuotationId;
    }

    let quotation = requestedFreshDraft || requestedSourceRefresh
      ? null
      : await QuotationDraft.findOne(activeDraftFilter).sort({ updatedAt: -1, createdAt: -1 });

    if (quotation && requestedFreshDraft) {
      const draftPayload = buildDraftPayload(null);
      quotation.validTill = draftPayload.validTill;
      quotation.pricing = draftPayload.pricing;
      quotation.inclusions = draftPayload.inclusions;
      quotation.exclusions = draftPayload.exclusions;
      quotation.additionalNotes = draftPayload.additionalNotes;
      quotation.dayWiseItinerary = draftPayload.dayWiseItinerary;
      quotation.services = draftPayload.services;
      quotation.sourceQuotationId = undefined;
      quotation.createdBy = req.user.id;
      quotation.status = "Pending";
      await quotation.save();
    } else if (quotation && requestedSourceQuotationId) {
      const pendingSourceId = String(quotation.sourceQuotationId || "");
      if (
        sourceQuotation &&
        (pendingSourceId !== requestedSourceQuotationId || requestedSourceRefresh)
      ) {
        const draftPayload = buildDraftPayload(sourceQuotation);
        quotation.validTill = draftPayload.validTill;
        quotation.pricing = draftPayload.pricing;
        quotation.inclusions = draftPayload.inclusions;
        quotation.exclusions = draftPayload.exclusions;
        quotation.additionalNotes = draftPayload.additionalNotes;
        quotation.dayWiseItinerary = draftPayload.dayWiseItinerary;
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

      quotation = await QuotationDraft.create({
        quotationNumber,
        queryId: query._id,
        agent: query.agent?._id || query.agent,
        createdBy: req.user.id,
        validTill: draftPayload.validTill,
        pricing: draftPayload.pricing,
        inclusions: draftPayload.inclusions,
        exclusions: draftPayload.exclusions,
        additionalNotes: draftPayload.additionalNotes,
        dayWiseItinerary: draftPayload.dayWiseItinerary,
        services: draftPayload.services,
        sourceQuotationId: draftPayload.sourceQuotationId,
        status: draftPayload.status,
        draftStatus: "active",
      });
    }

    const draftTaxableQuoteValue = roundCurrencyAmount(
      Number(quotation?.pricing?.subTotal || 0) +
      Number(quotation?.pricing?.packageTemplateAmount || 0),
    );
    const hasDraftTaxValues =
      Number(quotation?.pricing?.tax?.gst?.percent || 0) > 0 ||
      Number(quotation?.pricing?.tax?.gst?.amount || 0) > 0 ||
      Number(quotation?.pricing?.tax?.tcs?.percent || 0) > 0 ||
      Number(quotation?.pricing?.tax?.tcs?.amount || 0) > 0 ||
      Number(quotation?.pricing?.tax?.tourismFee?.amount || 0) > 0 ||
      Number(quotation?.pricing?.tax?.totalTax || 0) > 0;

    if (quotation && draftTaxableQuoteValue <= 0 && hasDraftTaxValues) {
      quotation.pricing.tax = {
        gst: { percent: 0, amount: 0 },
        tcs: { percent: 0, amount: 0 },
        tourismFee: { amount: 0 },
        totalTax: 0,
      };
      quotation.pricing.totalAmount = Number(
        Number(quotation.pricing.subTotal || 0) +
        Number(quotation.pricing.packageTemplateAmount || 0) +
        Number(quotation.pricing.opsMarkup?.amount || 0) +
        Number(quotation.pricing.opsCharges?.serviceCharge || 0) +
        Number(quotation.pricing.opsCharges?.handlingFee || 0),
      );
      await quotation.save();
    }

    res.status(200).json({
      success: true,
      quotation,
      query,
    });
  } catch (error) {
    console.error("Quotation Draft Error:", error);
    next(error);
  }
};

export const getOpsQueryQuotations = async (req, res, next) => {
  try {
    const query = await TravelQuery.findById(req.params.queryId).select(
      "_id queryId rejectionNote opsStatus assignedTo",
    );

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    if (!(await canManageAssignedQuery(req, query))) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const quotations = await Quotation.find({
      queryId: query._id,
      status: { $ne: "Pending" },
    })
      .select(
        "quotationNumber status pricing clientTotalAmount validTill services inclusions exclusions additionalNotes dayWiseItinerary agentMarkup agentRevisionRemark createdAt updatedAt createdBy",
      )
      .populate("createdBy", "name email companyName role")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const rows = quotations.map((quotation, index, list) =>
      mapQuotationHistoryRow(quotation, index, list.length, query?.rejectionNote || ""),
    );

    res.status(200).json({
      success: true,
      data: {
        queryId: query.queryId || "",
        quotations: rows,
        summary: {
          totalQuotations: rows.length,
          latestStatus: rows[0]?.status || "",
        },
      },
    });
  } catch (error) {
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
      exclusions,
      additionalNotes,
      dayWiseItinerary,
    } = req.body;

    const { quotation, query } = await getAuthorizedQueryForQuotationDraft(quotationId, req);

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

    await assertNoBlackoutContractRates({ query, services: resolvedServices, user: req.user });
    await syncManualRateOverridesToLiveServices(resolvedServices);

    const packageTemplateAmount = Number(pricing?.packageTemplateAmount || 0);
    const opsMarkupBasisAmount = Number(servicesTotal + packageTemplateAmount);
    const hasTaxableQuoteValue = roundCurrencyAmount(opsMarkupBasisAmount) > 0;
    const ops = Number(opsPercent || 0);
    const opsAmt = Number(opsAmount || 0);
    const finalOpsAmount = opsAmt > 0 ? opsAmt : (opsMarkupBasisAmount * ops) / 100;
    const serviceChargeAmount = Number(serviceCharge || 0);
    const handlingFeeAmount = Number(handlingFee || 0);
    const taxPayload = req.body.tax || {};
    const gstPercent = hasTaxableQuoteValue ? Number(taxPayload?.gstPercent || 0) : 0;
    const tcsPercent = hasTaxableQuoteValue ? Number(taxPayload?.tcsPercent || 0) : 0;
    const gstAmount = hasTaxableQuoteValue ? Number(taxPayload?.gstAmount || 0) : 0;
    const tcsAmount = hasTaxableQuoteValue ? Number(taxPayload?.tcsAmount || 0) : 0;
    const tourismAmount = hasTaxableQuoteValue ? Number(taxPayload?.tourismAmount || 0) : 0;
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
      type: service.type || service.serviceType || service.category || "",
      title:
        service.title ||
        service.serviceName ||
        service.name ||
        service.hotelName ||
        service.activityName ||
        service.sightseeingName ||
        service.transferName ||
        service.description ||
        "Service",
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
      transportUsageOptionKey: service.transportUsageOptionKey || "",
      transportUsageLabel: service.transportUsageLabel || "",
      transportUsageLimitOptionKey: service.transportUsageLimitOptionKey || "",
      extraPerKmRate: Number(service.extraPerKmRate || 0),
      fullDayExtraPerKmRate: Number(service.fullDayExtraPerKmRate || 0),
      halfDayExtraPerKmRate: Number(service.halfDayExtraPerKmRate || 0),
      days: Number(service.days || 1),
      pax: Number(service.pax || 1),
      currency: service.currency || "INR",
      price: Number(service.price || 0),
      hotelRateMode: service.hotelRateMode === "service-total" ? "service-total" : "unit-rate",
      manualRateOverride: Boolean(service.manualRateOverride),
      quoteBaseRate: Number(service.quoteBaseRate || 0),
      roomTypeOptionRate: Number(service.roomTypeOptionRate || 0),
      roomTypeOptionCurrency: service.roomTypeOptionCurrency || service.currency || "INR",
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
      quotation.inclusions = inclusions.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (Array.isArray(exclusions)) {
      quotation.exclusions = exclusions.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (Array.isArray(additionalNotes)) {
      quotation.additionalNotes = additionalNotes.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (Array.isArray(dayWiseItinerary)) {
      quotation.dayWiseItinerary = normalizeDayWiseItinerary(dayWiseItinerary);
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
    const { quotation } = await getAuthorizedQueryForQuotationDraft(req.params.quotationId, req);

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
    const { quotation } = await getAuthorizedQueryForQuotationDraft(req.params.quotationId, req);

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