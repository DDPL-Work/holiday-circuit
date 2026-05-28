import Hotel from "../models/hotelDmc.model.js";
import Activity from "../models/activityDmc.model.js";
import Transfer from "../models/transferDmc.model.js";
import Package from "../models/PackageDmc.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js"
import Confirmation from "../models/dmcConfirmation.js"
import InternalInvoice from "../models/internalInvoice.model.js";
import Auth from "../models/auth.model.js";
import Notification from "../models/notification.model.js";
import UploadHistory from "../models/uploadHistory.model.js"
import TravelQuery from "../models/TravelQuery.model.js";
import Quotation from "../models/quotation.model.js";
import Voucher from "../models/voucher.model.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
import path from "path"
import fs from "fs"
import { generateInternalInvoicePdf } from "../services/internalInvoicePdfService.js";
import { getRoundRobinFinanceAssignee } from "../services/financeTeamScopeService.js";
import { createNotification } from "../services/notificationDispatchService.js";

const createDmcSideNotification = (req, payload) =>
  createNotification(payload, {
    mirrorToAdmins: true,
    sourceRole: req.user?.role,
    sourceUserId: req.user?.id || req.user?._id || null,
    sourceName: req.user?.companyName || req.user?.name || "DMC Partner",
  });

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

const roundMoney = (value = 0) => Math.round(Number(value || 0));

const getServiceStoredTotal = (service = {}) =>
  Number(service?.totalInInr ?? service?.total ?? 0) || 0;

const getQuotationServiceBaseAmount = (quotation = {}) =>
  Number(quotation?.pricing?.subTotal || 0) ||
  (quotation?.services || []).reduce(
    (sum, service) => sum + getServiceStoredTotal(service),
    0,
  );

const getQuotationFinanceServiceTotal = (quotation = {}) => {
  const serviceBaseAmount = getQuotationServiceBaseAmount(quotation);
  const opsGrandTotal = Number(quotation?.pricing?.totalAmount || 0);
  const clientGrandTotal =
    quotation?.clientTotalAmount === undefined || quotation?.clientTotalAmount === null
      ? 0
      : Number(quotation.clientTotalAmount || 0);

  if (clientGrandTotal > 0 && opsGrandTotal > 0 && clientGrandTotal < opsGrandTotal) {
    return roundMoney(clientGrandTotal * (serviceBaseAmount / opsGrandTotal));
  }

  return roundMoney(serviceBaseAmount);
};

const getServiceBillableQuantity = (service = {}) => {
  const normalizedType = String(service?.type || "").toLowerCase();

  if (normalizedType === "hotel") {
    return Math.max(1, Number(service?.nights || 1)) *
      Math.max(1, Number(service?.rooms || 1));
  }

  if (
    normalizedType === "transfer" ||
    normalizedType === "transport" ||
    normalizedType === "car"
  ) {
    return Math.max(1, Number(service?.days || 1));
  }

  return Math.max(1, Number(service?.pax || 1));
};

const buildAllocatedServiceTotals = (services = [], targetTotal = 0) => {
  const roundedTargetTotal = roundMoney(targetTotal);
  const serviceTotals = services.map(getServiceStoredTotal);
  const serviceTotalBase = serviceTotals.reduce((sum, value) => sum + Number(value || 0), 0);

  if (roundedTargetTotal <= 0 || serviceTotalBase <= 0) {
    return services.map(() => null);
  }

  let allocatedTotal = 0;
  return services.map((service, index) => {
    if (index === services.length - 1) {
      return Math.max(0, roundMoney(roundedTargetTotal - allocatedTotal));
    }

    const allocatedAmount = roundMoney(
      roundedTargetTotal * (Number(serviceTotals[index] || 0) / serviceTotalBase),
    );
    allocatedTotal += allocatedAmount;
    return allocatedAmount;
  });
};

const applyAlignedServiceTotal = (service = {}, alignedTotal = null) => {
  const total = Number(alignedTotal || 0);
  if (!Number.isFinite(total) || total <= 0) return service;

  const quantity = getServiceBillableQuantity(service);
  const unitRate = quantity > 0 ? Number((total / quantity).toFixed(2)) : total;

  return {
    ...service,
    price: unitRate,
    priceInInr: unitRate,
    total,
    totalInInr: total,
  };
};

const resolveQuotationServiceType = (service = {}) => {
  const explicitType = String(
    service?.type ||
    service?.serviceType ||
    service?.category ||
    "",
  ).trim();
  if (explicitType) return explicitType;

  if (service?.vehicleType || service?.usageType || service?.passengerCapacity) {
    return "transfer";
  }

  if (service?.hotelName || service?.roomType || service?.rooms || service?.nights) {
    return "hotel";
  }

  if (service?.activityName) return "activity";
  if (service?.sightseeingName) return "sightseeing";

  return "service";
};

const getQuotationServiceTypeLabel = (service = {}) => {
  const normalizedType = String(resolveQuotationServiceType(service) || "").trim().toLowerCase();
  if (normalizedType === "hotel") return "Hotel";
  if (["transfer", "transport", "car"].includes(normalizedType)) return "Transport";
  if (normalizedType === "activity") return "Activity";
  if (normalizedType === "sightseeing") return "Sightseeing";
  return "Service";
};

const resolveQuotationServiceName = (service = {}, index = 0) => {
  const candidates = [
    service?.title,
    service?.serviceName,
    service?.name,
    service?.hotelName,
    service?.activityName,
    service?.sightseeingName,
    service?.transferName,
    service?.vehicleType && service?.usageType
      ? `${service.vehicleType} ${service.usageType}`
      : "",
    service?.description,
  ];

  const resolvedName = candidates
    .map((item) => String(item || "").trim())
    .find(Boolean);

  return resolvedName || `${getQuotationServiceTypeLabel(service)} Service ${index + 1}`;
};

const isGeneratedServiceLabel = (value = "") => {
  const normalizedValue = String(value || "").trim();
  return (
    /^service service \d+$/i.test(normalizedValue) ||
    /^hotel service \d+$/i.test(normalizedValue) ||
    /^transport service \d+$/i.test(normalizedValue) ||
    /^activity service \d+$/i.test(normalizedValue) ||
    /^sightseeing service \d+$/i.test(normalizedValue)
  );
};

const buildDisplayServiceQuantityLabel = (service = {}) => {
  const normalizedType = String(resolveQuotationServiceType(service) || "")
    .trim()
    .toLowerCase();
  const details = [];

  if (normalizedType === "hotel") {
    if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
    if (Number(service?.rooms || 0) > 0) {
      details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
    }
    if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
    return details.join(" | ");
  }

  if (["transfer", "transport", "car"].includes(normalizedType)) {
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
  if (Number(service?.passengerCapacity || 0) > 0) {
    details.push(`${service.passengerCapacity} Pax`);
  }
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildDisplayServiceDescription = (service = {}) => {
  const normalizedType = String(resolveQuotationServiceType(service) || "")
    .trim()
    .toLowerCase();
  const explicitDescription = String(service?.description || service?.particulars || "")
    .replace(/\|/g, " | ")
    .trim();

  if (explicitDescription) return explicitDescription;

  const details = [];

  if (normalizedType === "hotel") {
    [
      service?.roomCategory,
      service?.roomType,
      service?.hotelCategory,
      service?.bedType,
      service?.mealPlan,
    ].forEach((item) => {
      const value = String(item || "").trim();
      if (value) details.push(value);
    });
  } else if (["transfer", "transport", "car"].includes(normalizedType)) {
    [
      service?.usageType ? String(service.usageType).replace(/-/g, " ") : "",
      service?.vehicleType,
    ].forEach((item) => {
      const value = String(item || "").trim();
      if (value) details.push(value);
    });
  } else {
    [
      service?.activityType,
      service?.sightseeingType,
      service?.duration,
    ].forEach((item) => {
      const value = String(item || "").trim();
      if (value) details.push(value);
    });
  }

  return details.join(" | ");
};

const hasUsableQuotationServiceDetails = (service = {}) => {
  const name = resolveQuotationServiceName(service, 0);
  const generatedFallbackNames = new Set([
    "Service Service 1",
    "Hotel Service 1",
    "Transport Service 1",
    "Activity Service 1",
    "Sightseeing Service 1",
  ]);
  const hasExplicitName = [
    service?.title,
    service?.serviceName,
    service?.name,
    service?.hotelName,
    service?.activityName,
    service?.sightseeingName,
    service?.transferName,
  ].some((item) => {
    const value = String(item || "").trim();
    return value && !isGeneratedServiceLabel(value);
  });

  return Boolean(
    (name && !generatedFallbackNames.has(name) && !isGeneratedServiceLabel(name)) ||
    hasExplicitName ||
    String(service?.city || "").trim() ||
    String(service?.country || "").trim() ||
    String(service?.description || service?.particulars || "").trim(),
  );
};

const mergeServiceDetailsWithPricing = (service = {}, detailSource = null) => {
  if (!detailSource) return service;

  return {
    ...detailSource,
    ...service,
    type: service.type || detailSource.type,
    title: service.title || detailSource.title || detailSource.serviceName || detailSource.name,
    serviceName: service.serviceName || detailSource.serviceName,
    name: service.name || detailSource.name,
    hotelName: service.hotelName || detailSource.hotelName,
    activityName: service.activityName || detailSource.activityName,
    sightseeingName: service.sightseeingName || detailSource.sightseeingName,
    transferName: service.transferName || detailSource.transferName,
    city: service.city || detailSource.city,
    country: service.country || detailSource.country,
    description: service.description || service.particulars || detailSource.description || detailSource.particulars,
    serviceDate: service.serviceDate || detailSource.serviceDate,
    roomCategory: service.roomCategory || detailSource.roomCategory,
    roomType: service.roomType || detailSource.roomType,
    hotelCategory: service.hotelCategory || detailSource.hotelCategory,
    bedType: service.bedType || detailSource.bedType,
    vehicleType: service.vehicleType || detailSource.vehicleType,
    usageType: service.usageType || detailSource.usageType,
    passengerCapacity: service.passengerCapacity || detailSource.passengerCapacity,
    luggageCapacity: service.luggageCapacity || detailSource.luggageCapacity,
    rooms: service.rooms || detailSource.rooms,
    nights: service.nights || detailSource.nights,
    days: service.days || detailSource.days,
    pax: service.pax || detailSource.pax,
  };
};

const normalizeDetailCandidateService = (service = {}) => ({
  ...service,
  title: service?.title || service?.serviceName || service?.name || "",
  serviceName: service?.serviceName || service?.name || service?.title || "",
});

const enrichQuotationServicesWithDetails = async (queryId, services = [], extraDetailSources = []) => {
  if (!services.length) return services;

  const needsDetails = services.some((service) => !hasUsableQuotationServiceDetails(service));
  if (!needsDetails) return services;

  const quotations = await Quotation.find({ queryId })
    .sort({ createdAt: -1 })
    .select("services")
    .lean();
  const voucherRows = await Voucher.find({ query: queryId })
    .sort({ createdAt: -1 })
    .select("services")
    .lean();
  const candidateServices = [
    ...extraDetailSources,
    ...voucherRows.flatMap((voucher) =>
      Array.isArray(voucher?.services) ? voucher.services.map(normalizeDetailCandidateService) : [],
    ),
    ...quotations.flatMap((quotation) =>
      Array.isArray(quotation?.services) ? quotation.services.map(normalizeDetailCandidateService) : [],
    ),
  ];

  return services.map((service, index) => {
    if (hasUsableQuotationServiceDetails(service)) return service;

    const serviceId = String(service?.serviceId || "").trim();
    const detailById =
      serviceId &&
      candidateServices.find(
        (candidate) =>
          hasUsableQuotationServiceDetails(candidate) &&
          String(candidate?.serviceId || candidate?._id || "").trim() === serviceId,
      );
    const detailByIndex = quotations
      .map((quotation) => quotation?.services?.[index])
      .find((candidate) => hasUsableQuotationServiceDetails(candidate));
    const detailByCandidateIndex = candidateServices
      .filter((candidate) => hasUsableQuotationServiceDetails(candidate))[index];

    return mergeServiceDetailsWithPricing(
      service,
      detailById || detailByIndex || detailByCandidateIndex || null,
    );
  });
};

const getServiceDetailScore = (service = {}) => {
  let score = 0;

  if (hasUsableQuotationServiceDetails(service)) score += 10;
  if (String(service?.city || "").trim() || String(service?.country || "").trim()) score += 4;
  if (String(service?.description || service?.particulars || "").trim()) score += 4;
  if (["hotel", "transfer", "transport", "car", "activity", "sightseeing"].includes(
    String(resolveQuotationServiceType(service) || "").trim().toLowerCase(),
  )) score += 2;
  if (Number(service?.total || service?.totalInInr || 0) > 0) score += 1;

  return score;
};

const getQuotationDetailScore = (quotation = {}) =>
  (quotation?.services || []).reduce(
    (score, service) => score + getServiceDetailScore(service),
    0,
  );

const getBestServiceDetailQuotation = async (queryId, currentQuotation = null) => {
  const quotations = await Quotation.find({ queryId })
    .sort({ createdAt: -1 })
    .select("services createdAt")
    .lean();

  const candidates = [
    currentQuotation?.toObject ? currentQuotation.toObject() : currentQuotation,
    ...quotations,
  ].filter((quotation) => Array.isArray(quotation?.services) && quotation.services.length);

  return candidates.reduce((best, quotation) =>
    getQuotationDetailScore(quotation) > getQuotationDetailScore(best)
      ? quotation
      : best,
  candidates[0] || null);
};

const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt ? new Date(document.uploadedAt) : null,
});

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




/* ======================= HOTEL CONTROLLERS ================================= */

//----------------------- Create Hotel ---------------------------
export const createHotel = async (req, res, next) => {
  try {

    const { hotelName, city, pricePerNight, roomType, mealPlan } = req.body;

    if (!hotelName || !city || !pricePerNight) {
      const error = new Error("hotelName, city and pricePerNight are required");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check
    const existingHotel = await Hotel.findOne({
      hotelName,
      city,
      supplier: req.user.id
    });

    if (existingHotel) {
      const error = new Error("Hotel already exists for this supplier in this city");
      error.statusCode = 409;
      return next(error);
    }

    const serviceName = `${hotelName} ${roomType || ""} ${mealPlan || ""}`;

    const hotel = await Hotel.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: req.body.supplierName || "",
      serviceName,
      serviceCategory: "hotel"
    });

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: hotel
    });

  } catch (error) {
    next(error);
  }
};


//------------------- GET ALL HOTELS  Controller -----------------------

export const getHotels = async (req, res, next) => {
  try {

    const hotels = await Hotel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });

  } catch (error) {
    next(error);
  }
};



// GET SINGLE HOTEL
export const getHotelById = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: hotel
    });

  } catch (error) {
    next(error);
  }
};



// UPDATE HOTEL
export const updateHotel = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      return next(error);
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: updatedHotel
    });

  } catch (error) {
    next(error);
  }
};

// DELETE HOTEL

export const deleteHotel = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      return next(error);
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: "Hotel deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};




/* ============================= ACTIVITY CONTROLLERS ================================== */


//---------- CREATE ACTIVITY-------------
export const createActivity = async (req, res, next) => {
  try {

    const {
      name,
      country,
      city,
      adultPrice,
      childPrice,
      infantPrice,
      currency,
      validFrom,
      validTo
    } = req.body;

    // validation
    if (!name || !country || !city || !validFrom || !validTo) {
      const error = new Error("Required activity fields missing");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check
    const existingActivity = await Activity.findOne({
      name,
      city,
      supplier: req.user.id
    });

    if (existingActivity) {
      const error = new Error("Activity already exists for this supplier in this city");
      error.statusCode = 409;
      return next(error);
    }

    const serviceName = name;

    const activity = await Activity.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: req.body.supplierName || "",
      serviceName,
      serviceCategory: "activity"
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity
    });

  } catch (error) {
    next(error);
  }
};


//------------ All GET ACTIVITIES -----------------------------

export const getActivities = async (req, res, next) => {
  try {

    const activities = await Activity.find();

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    next(error);
  }
};


/* ======================================== TRANSFER CONTROLLERS ================================== */

//-------------------------- CREATE TRANSFER-----------------------------------
export const createTransfer = async (req, res, next) => {
  try {

    const {
      serviceName,
      country,
      city,
      vehicleType,
      passengerCapacity,
      luggageCapacity,
      price,
      currency,
      usageType,
      validFrom,
      validTo
    } = req.body;

    // validation
    if (!serviceName || !country || !city || !vehicleType || !price || !validFrom || !validTo) {
      const error = new Error("Required transfer fields missing");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check 
    const existingTransfer = await Transfer.findOne({
      city,
      vehicleType,
      usageType,
      supplier: req.user.id
    });

    if (existingTransfer) {
      const error = new Error(
        "Transfer already exists for this vehicle type in this city"
      );
      error.statusCode = 409;
      return next(error);
    }

    const transfer = await Transfer.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: req.body.supplierName || "",
      serviceCategory: "transport"
    });

    res.status(201).json({
      success: true,
      message: "Transfer created successfully",
      data: transfer
    });

  } catch (error) {
    next(error);
  }
};



//---------------- GET TRANSFERS -------------------
export const getTransfers = async (req, res, next) => {
  try {

    const transfers = await Transfer.find();

    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });

  } catch (error) {
    next(error);
  }
};


//========================================= CREATE SIGHTSEEING ===================================

export const createSightseeing = async (req, res, next) => {
  try {

    const {
      name,
      country,
      city,
      price,
      currency,
      validFrom,
      validTo
    } = req.body;

    // validation
    if (!name || !country || !city || !price || !validFrom || !validTo) {
      const error = new Error("Required sightseeing fields missing");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check
    const existingSightseeing = await Sightseeing.findOne({
      name,
      city,
      supplier: req.user.id
    });

    if (existingSightseeing) {
      const error = new Error(
        "Sightseeing already exists for this supplier in this city"
      );
      error.statusCode = 409;
      return next(error);
    }

    const serviceName = name;

    const sightseeing = await Sightseeing.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: req.body.supplierName || "",
      serviceName,
      serviceCategory: "sightseeing"
    });

    res.status(201).json({
      success: true,
      message: "Sightseeing created successfully",
      data: sightseeing
    });

  } catch (error) {
    next(error);
  }
};


//---------------- GET Sightseeing  -------------------
export const getSightseeing = async (req, res, next) => {
  try {

    const sightseeing = await Sightseeing.find()
      .populate("supplier", "name email");

    res.status(200).json({
      success: true,
      count: sightseeing.length,
      data: sightseeing
    });

  } catch (error) {
    next(error);
  }
};

/* ======================================== PACKAGE CONTROLLERS ======================================= */

//------------- CREATE PACKAGE ----------------------
export const createPackage = async (req, res, next) => {
  try {

    const {
      title,
      destination,
      days,
      hotels,
      activities,
      transfers,
      sightseeing,
      price
    } = req.body;

    if (!title || !destination || !price) {
      const error = new Error("Title, destination and price required");
      error.statusCode = 400;
      return next(error);
    }

    const pkg = await Package.create({
      title,
      destination,
      days,
      hotels,
      activities,
      transfers,
      sightseeing,
      price,
      supplier: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: pkg
    });

  } catch (error) {
    next(error);
  }
};



//----------- GET PACKAGES ---------------------------

export const getPackages = async (req, res, next) => {
  try {

    const packages = await Package.find()

      .populate("hotels", "hotelName roomType")
      .populate("activities", "name")
      .populate("transfers", "serviceName")
      .populate("sightseeing", "name");

    res.status(200).json({
      success: true,
      data: packages
    });

  } catch (error) {
    next(error);
  }
};

//======================= UPLOAD DELETE FILE CONTROLLER ========================================================

export const deleteUpload = async (req, res) => {
  try {
    const { id } = req.params

    const file = await UploadHistory.findById(id)

    if (!file) {
      return res.status(404).json({ message: "File not found" })
    }

    // server se file delete
    if (file.filePath && fs.existsSync("." + file.filePath)) {
      fs.unlinkSync("." + file.filePath)
    }

    // DB se delete
    await UploadHistory.findByIdAndDelete(id)

    res.json({ message: "Deleted successfully" })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

//========================= DOWNLOAD FILE DMC BULK ==============================================


export const downloadUpload = async (req, res) => {
  try {
    const { id } = req.params

    const file = await UploadHistory.findById(id)

    if (!file || !file.filePath) {
      return res.status(404).json({ message: "File not found in DB" })
    }

    // 🔥 ADD THESE LOGS HERE
    console.log("CWD:", process.cwd())
    console.log("FILE PATH FROM DB:", file.filePath)

    const fullPath = path.join(process.cwd(), file.filePath)

    console.log("FINAL PATH:", fullPath)

    if (!fs.existsSync(fullPath)) {
      console.log("❌ FILE NOT FOUND")
      return res.status(404).json({ message: "File missing on server" })
    }

    res.download(fullPath)

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message })
  }
}


// ======================= GET ALL SERVICES (QUOTATION BUILDER) =======================

export const getAllServices = async (req, res, next) => {
  try {

    const [hotels, activities, transfers, sightseeing] = await Promise.all([
      Hotel.find(),
      Activity.find().sort({ updatedAt: -1, createdAt: -1 }),
      Transfer.find(),
      Sightseeing.find()
    ]);

    const dedupedActivities = Array.from(
      new Map(
        activities.map((item) => [
          [
            item?.supplier?.toString?.() || "",
            String(item?.name || "").trim().toLowerCase(),
            String(item?.city || "").trim().toLowerCase(),
            String(item?.country || "").trim().toLowerCase(),
          ].join("::"),
          item,
        ]),
      ).values(),
    );

    const ownerIds = [
      ...hotels.map((item) => item.supplier).filter(Boolean),
      ...dedupedActivities.map((item) => item.supplier).filter(Boolean),
      ...transfers.map((item) => item.supplier).filter(Boolean),
      ...sightseeing.map((item) => item.supplier).filter(Boolean),
    ].map((item) => item.toString());

    const owners = await Auth.find({
      _id: { $in: [...new Set(ownerIds)] },
    }).select("name companyName").lean();

    const ownerMap = new Map(
      owners.map((owner) => [
        owner._id.toString(),
        owner.companyName || owner.name || "",
      ]),
    );

    // 🔹 FORMAT HOTELS
    const hotelData = hotels.map(h => ({
      id: h._id,
      supplierId: h.supplier,
      supplierName: h.supplierName || "",
      dmcId: h.supplier,
      dmcName: ownerMap.get(h.supplier?.toString()) || "",
      type: "hotel",
      title: h.hotelName,
      description: h.description || `${h.roomType || ""} | ${h.mealPlan || ""}`,
      country: h.country,
      city: h.city,
      price: h.price,
      currency: h.currency,
      hotelCategory: h.hotelCategory,
      roomCategory: h.roomCategory || "Double",
      bedType: h.bedType,
      roomType: h.roomType,
      awebRate: h.awebRate || 0,
      cwebRate: h.cwebRate || 0,
      cwoebRate: h.cwoebRate || 0,
    }));

    // 🔹 FORMAT ACTIVITIES
    const activityData = dedupedActivities.map(a => ({
      id: a._id,
      supplierId: a.supplier,
      supplierName: a.supplierName || "",
      dmcId: a.supplier,
      dmcName: ownerMap.get(a.supplier?.toString()) || "",
      type: "activity",
      title: a.name,
      subtitle: `${a.city} | Activity`,
      description: a.description || a.serviceName || "",
      city: a.city || "",
      country: a.country || "",
      price: a.adultPrice || a.price,
      currency: a.currency
    }));


    //======================== 🔹 FORMAT TRANSFERS =================================
    const transferData = transfers.map(t => ({
      id: t._id,
      supplierId: t.supplier,
      supplierName: t.supplierName || "",
      dmcId: t.supplier,
      dmcName: ownerMap.get(t.supplier?.toString()) || "",
      type: "transfer",
      // 🔹 MAIN INFO
      title: t.serviceName,
      description: t.description,

      // 🔹 LOCATION
      city: t.city,
      country: t.country,
      // 🔹 VEHICLE INFO
      vehicleType: t.vehicleType,
      passengerCapacity: t.passengerCapacity,
      luggageCapacity: t.luggageCapacity,
      // 🔹 USAGE
      usageType: t.usageType,
      // 🔹 PRICE
      price: t.price,
      currency: t.currency,
      // 🔹 UI HELPER
      subtitle: `${t.vehicleType} | ${t.usageType}`
    }));

    // 🔹 FORMAT SIGHTSEEING
    const sightseeingData = sightseeing.map(s => ({
      id: s._id,
      supplierId: s.supplier,
      supplierName: s.supplierName || "",
      dmcId: s.supplier,
      dmcName: ownerMap.get(s.supplier?.toString()) || "",
      type: "sightseeing",
      title: s.name,
      subtitle: `${s.city} | Sightseeing`,
      price: s.price,
      currency: s.currency,
      description: s.description || `${s.roomType || ""} | ${s.mealPlan || ""}`,
      city: s.city,
      country: s.country || "",
      price: s.price,
    }));

    // 🔥 MERGE ALL
    const allServices = [
      ...hotelData,
      ...activityData,
      ...transferData,
      ...sightseeingData
    ];

    res.status(200).json({
      success: true,
      count: allServices.length,
      data: allServices
    });

  } catch (error) {
    next(error);
  }
};



// 
export const createOrUpdateConfirmation = async (req, res) => {
  try {
    const { queryId, services, emergencyContact, status } = req.body;
    const currentDmcId = req.user.id;
    const normalizedStatus = String(status || "draft").trim().toLowerCase() || "draft";

    let confirmation = await Confirmation.findOne({
      queryId,
      dmcId: currentDmcId,
    });
    const wasSubmittedBefore =
      String(confirmation?.status || "").trim().toLowerCase() === "submitted";

    const documents = {
      supplierConfirmation:
        req.files?.supplierConfirmation?.[0]?.path,

      voucherReference:
        req.files?.voucherReference?.[0]?.path,

      termsConditions:
        req.files?.termsConditions?.[0]?.path,
    };

    if (confirmation) {
      confirmation.services = services
        ? JSON.parse(services)
        : confirmation.services;

      confirmation.emergencyContact = emergencyContact;

      confirmation.documents = {
        ...confirmation.documents,
        ...documents,
      };

      confirmation.status = normalizedStatus;

      await confirmation.save();
    } else {
      confirmation = await Confirmation.create({
        dmcId: currentDmcId,
        queryId,
        services: JSON.parse(services),
        emergencyContact,
        documents,
        status: normalizedStatus,
      });
    }

    if (normalizedStatus === "submitted") {
      const query = await TravelQuery.findOne({ queryId })
        .select("queryId destination assignedTo")
        .lean();

      if (query?.assignedTo) {
        await createDmcSideNotification(req, {
          user: query.assignedTo,
          type: "info",
          title: wasSubmittedBefore
            ? "DMC Service Confirmation Updated"
            : "DMC Service Confirmation Submitted",
          message: `${req.user?.companyName || req.user?.name || "DMC partner"} ${wasSubmittedBefore ? "updated" : "submitted"} service confirmation for ${query.queryId}${query.destination ? ` (${query.destination})` : ""}.`,
          link: "/ops/voucher-management",
          meta: {
            kind: "dmc_confirmation_submitted",
            queryId: query.queryId,
            confirmationId: confirmation._id,
            dmcId: currentDmcId,
            dmcName: req.user?.companyName || req.user?.name || "DMC Partner",
          },
        });
      }
    }

    res.json({ success: true, data: confirmation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const normalizeCreditPeriodDays = (value, fallback = 7) => {
  const numericValue = Number(value);
  if ([7, 15].includes(numericValue)) return numericValue;
  return [7, 15].includes(Number(fallback)) ? Number(fallback) : 7;
};

const INTERNAL_INVOICE_TEMPLATE_VARIANTS = [
  "aurora-ledger",
  "classic-ledger",
  "compact-ledger",
  "finance-ledger",
];

const normalizeInternalInvoiceTemplateVariant = (value) =>
  INTERNAL_INVOICE_TEMPLATE_VARIANTS.includes(String(value || "").trim())
    ? String(value).trim()
    : "aurora-ledger";

const calculateCreditDueDate = (invoiceDate, creditPeriodDays) => {
  const parsedDate = new Date(invoiceDate);
  if (Number.isNaN(parsedDate.getTime())) return null;
  parsedDate.setDate(parsedDate.getDate() + normalizeCreditPeriodDays(creditPeriodDays));
  return parsedDate;
};

const inferCreditPeriodDays = (invoiceDate, dueDate) => {
  const parsedInvoiceDate = new Date(invoiceDate);
  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedInvoiceDate.getTime()) || Number.isNaN(parsedDueDate.getTime())) {
    return 7;
  }

  parsedInvoiceDate.setHours(0, 0, 0, 0);
  parsedDueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((parsedDueDate - parsedInvoiceDate) / (1000 * 60 * 60 * 24));
  return normalizeCreditPeriodDays(diffDays);
};

export const submitInternalInvoice = async (req, res, next) => {
  try {
    const {
      queryId,
      invoiceMeta = {},
      items = [],
      taxConfig = {},
      summary = {},
      templateVariant = "aurora-ledger",
    } = req.body;

    if (!queryId) {
      return next(new ApiError(400, "Query is required"));
    }

    if (!invoiceMeta?.supplierName || !invoiceMeta?.invoiceNumber || !invoiceMeta?.invoiceDate) {
      return next(new ApiError(400, "Invoice header details are required"));
    }

    const creditPeriodDays = normalizeCreditPeriodDays(
      invoiceMeta?.creditPeriodDays,
      inferCreditPeriodDays(invoiceMeta?.invoiceDate, invoiceMeta?.dueDate),
    );
    const calculatedDueDate = calculateCreditDueDate(invoiceMeta.invoiceDate, creditPeriodDays);

    if (!calculatedDueDate) {
      return next(new ApiError(400, "A valid invoice date is required"));
    }

    const normalizedInvoiceMeta = {
      ...invoiceMeta,
      creditPeriodDays,
      dueDate: calculatedDueDate,
    };
    const normalizedTemplateVariant = normalizeInternalInvoiceTemplateVariant(
      invoiceMeta?.templateVariant || templateVariant,
    );

    if (!Array.isArray(items) || !items.length) {
      return next(new ApiError(400, "At least one line item is required"));
    }

    const queryLookup = mongoose.Types.ObjectId.isValid(queryId)
      ? {
        $or: [{ queryId }, { _id: queryId }],
      }
      : { queryId };

    const query = await TravelQuery.findOne(queryLookup)
      .populate("agent", "name companyName")
      .lean();

    if (!query) {
      return next(new ApiError(404, "Query not found"));
    }

    const existingInvoice = await InternalInvoice.findOne({
      query: query._id,
      dmc: req.user.id,
    })
      .select("status invoiceNumber assignedTo reviewedBy")
      .lean();

    if (["Approved", "Paid"].includes(String(existingInvoice?.status || "").trim())) {
      return next(
        new ApiError(
          409,
          `Finance has already verified ${existingInvoice?.invoiceNumber || "this internal invoice"}. A new internal invoice cannot be submitted again for this booking.`,
        ),
      );
    }

    const dmc = await Auth.findById(req.user.id)
      .select("name companyName")
      .lean();
    const assignedFinanceMember = await getRoundRobinFinanceAssignee({
      keepAssigneeId: existingInvoice?.assignedTo || existingInvoice?.reviewedBy,
    });

    const normalizedItems = items.map((item) => ({
      type: String(item.type || "Hotel").trim(),
      service: String(item.service || "").trim(),
      currency: String(item.currency || "INR").trim().toUpperCase(),
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
      subtotal: Number(item.subtotal || 0),
      tax: Number(item.tax || 0),
    }));

    const confirmation = await Confirmation.findOne({
      queryId: query.queryId,
      dmcId: req.user.id,
    }).lean();

    const generatedInvoiceDocument = await generateInternalInvoicePdf({
      queryCode: query.queryId,
      invoiceMeta: normalizedInvoiceMeta,
      items: normalizedItems,
      summary,
      taxConfig,
      dmcName: dmc?.companyName || dmc?.name || "",
      destination: query.destination || "",
      templateVariant: normalizedTemplateVariant,
    });

    const supportingDocuments = [
      confirmation?.documents?.supplierConfirmation,
      confirmation?.documents?.voucherReference,
      confirmation?.documents?.termsConditions,
    ]
      .filter(Boolean)
      .map((filePath, index) => {
        const normalizedFilePath = String(filePath).replace(/\\/g, "/");
        const absoluteFilePath = path.join(process.cwd(), normalizedFilePath);
        const fileSizeKb =
          fs.existsSync(absoluteFilePath)
            ? Math.max(1, Math.round(fs.statSync(absoluteFilePath).size / 1024))
            : null;

        return {
          name: path.basename(filePath),
          filePath: `/${normalizedFilePath.replace(/^\/+/, "")}`,
          size: fileSizeKb ? `${fileSizeKb} kB` : "",
          kind: index === 0 ? "supporting" : "reference",
        };
      });

    const invoicePayload = {
      query: query._id,
      queryCode: query.queryId,
      agent: query.agent?._id || null,
      agentName: query.agent?.companyName || query.agent?.name || "",
      dmc: req.user.id,
      dmcName: dmc?.companyName || dmc?.name || "",
      destination: query.destination || "",
      supplierName: String(invoiceMeta.supplierName || "").trim(),
      invoiceNumber: String(invoiceMeta.invoiceNumber || "").trim(),
      invoiceDate: new Date(invoiceMeta.invoiceDate),
      dueDate: calculatedDueDate,
      creditPeriodDays,
      items: normalizedItems,
      taxConfig: {
        gstRate: Number(taxConfig.gstRate || 0),
        tcsRate: Number(taxConfig.tcsRate || 0),
        otherTax: Number(taxConfig.otherTax || 0),
      },
      summary: {
        subtotal: Number(summary.subtotal || 0),
        gstAmount: Number(summary.gstAmount || 0),
        tcsAmount: Number(summary.tcsAmount || 0),
        otherTaxAmount: Number(summary.otherTaxAmount || 0),
        totalTax: Number(summary.totalTax || 0),
        grandTotal: Number(summary.grandTotal || 0),
      },
      documents: [generatedInvoiceDocument, ...supportingDocuments],
      templateVariant: normalizedTemplateVariant,
      status: "Submitted",
      assignedTo: assignedFinanceMember?._id || null,
      assignedToName: assignedFinanceMember?.name || "",
      assignedToEmail: assignedFinanceMember?.email || "",
      assignedAt: assignedFinanceMember ? new Date() : null,
      reviewedBy: null,
      reviewedByName: "",
      reviewedAt: null,
      financeNotes: "",
      submittedBy: req.user.id,
      submittedAt: new Date(),
    };

    const invoice = await InternalInvoice.findOneAndUpdate(
      { query: query._id, dmc: req.user.id },
      invoicePayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    if (assignedFinanceMember?._id) {
      await Notification.create({
        user: assignedFinanceMember._id,
        type: "info",
        title: "New Internal Invoice Submitted",
        message: `${invoicePayload.dmcName || "DMC"} submitted ${invoicePayload.invoiceNumber} for ${invoicePayload.queryCode}.`,
        link: "/finance/internalInvoice",
        meta: {
          internalInvoiceId: invoice._id,
          invoiceNumber: invoicePayload.invoiceNumber,
          queryId: invoicePayload.queryCode,
          dmcId: req.user.id,
          assignedTo: assignedFinanceMember._id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Internal invoice sent to finance team",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};


const getDmcVisibleQueriesData = async (req) => {
  const isAdminAccess = req.user?.role === "admin";
  const currentDmcId = req.user.id?.toString();
  const currentDmc = await Auth.findById(currentDmcId)
    .select("name companyName")
    .lean();
  const currentDmcNames = [currentDmc?.companyName, currentDmc?.name]
    .filter(Boolean)
    .map((item) => item.trim().toLowerCase());

  const getServiceModel = (type) => {
    const normalized = (type || "").toLowerCase();
    if (normalized === "hotel") return Hotel;
    if (
      normalized === "transfer" ||
      normalized === "transport" ||
      normalized === "car"
    ) {
      return Transfer;
    }
    if (normalized === "activity") return Activity;
    if (normalized === "sightseeing") return Sightseeing;
    return null;
  };

  const buildServiceBreakdown = (service) => {
    const normalizedType = resolveQuotationServiceType(service).toLowerCase();
    const currency = service.currency || "INR";
    const unitPrice = Number(service.price || 0);
    const totalAmount = Number(service.total || 0);

    if (normalizedType === "hotel") {
      const unitCount = Number(service.nights || 1);
      const roomCount = Math.max(1, Number(service.rooms || 1));
      const billableQuantityValue = Math.max(1, unitCount * roomCount);
      const addonBreakdown = [
        service?.extraAdult
          ? {
            code: "A.W.E.B",
            label: "A.W.E.B",
            rate: Number(service?.awebRate || 0),
          }
          : null,
        service?.childWithBed
          ? {
            code: "C.W.E.B",
            label: "C.W.E.B",
            rate: Number(service?.cwebRate || 0),
          }
          : null,
        service?.childWithoutBed
          ? {
            code: "C.Wo.E.B",
            label: "C.Wo.E.B",
            rate: Number(service?.cwoebRate || 0),
          }
          : null,
      ]
        .filter(Boolean)
        .map((item) => ({
          ...item,
          units: billableQuantityValue,
          total: billableQuantityValue * Number(item.rate || 0),
        }));
      const addonRatePerRoomNight =
        addonBreakdown.reduce((sum, item) => sum + Number(item.rate || 0), 0);
      const addonTotal = addonBreakdown.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0,
      );
      const baseTotalAmount = billableQuantityValue * unitPrice;
      const resolvedTotalAmount =
        totalAmount > 0 ? totalAmount : baseTotalAmount + addonTotal;
      const billableUnitRate =
        billableQuantityValue > 0
          ? Number((resolvedTotalAmount / billableQuantityValue).toFixed(2))
          : Number((unitPrice + addonRatePerRoomNight).toFixed(2));
      const visibleAddonBreakdown = totalAmount > 0 ? [] : addonBreakdown;

      return {
        quantityValue: roomCount,
        quantityLabel: `${roomCount} ${roomCount === 1 ? "Room" : "Rooms"}`,
        stayLabel: `${unitCount} ${unitCount === 1 ? "Night" : "Nights"}`,
        unitLabel: "per night",
        billableQuantityValue,
        billableUnitRate,
        addonBreakdown: visibleAddonBreakdown,
        calculationText:
          visibleAddonBreakdown.length > 0
            ? `${billableQuantityValue} room-night${billableQuantityValue === 1 ? "" : "s"} x ${currency} ${billableUnitRate.toLocaleString("en-IN")} (includes add-ons ${currency} ${addonTotal.toLocaleString("en-IN")})`
            : `${billableQuantityValue} room-night${billableQuantityValue === 1 ? "" : "s"} x ${currency} ${billableUnitRate.toLocaleString("en-IN")}`,
        totalAmount: resolvedTotalAmount,
        currency,
      };
    }

    if (
      normalizedType === "transfer" ||
      normalizedType === "transport" ||
      normalizedType === "car"
    ) {
      const unitCount = Number(service.days || 1);
      return {
        quantityValue: unitCount,
        quantityLabel: `${unitCount} ${unitCount === 1 ? "Day" : "Days"}`,
        unitLabel: service.usageType || "transfer",
        billableQuantityValue: unitCount,
        billableUnitRate: unitPrice,
        calculationText: `${unitCount} ${unitCount === 1 ? "day" : "days"} x ${currency} ${unitPrice.toLocaleString()}`,
        totalAmount,
        currency,
      };
    }

    const unitCount = Number(service.pax || 1);
    return {
      quantityValue: unitCount,
      quantityLabel: `${unitCount} Pax`,
      stayLabel: "",
      unitLabel: "per guest",
      billableQuantityValue: unitCount,
      billableUnitRate: unitPrice,
      calculationText: `${unitCount} pax x ${currency} ${unitPrice.toLocaleString()}`,
      totalAmount,
      currency,
    };
  };

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const serviceMatchesDmcByName = (service) => {
    if (isAdminAccess) return true;

    const serviceNames = [
      service?.supplierName,
      service?.dmcName,
      service?.supplier?.name,
      service?.supplier?.companyName,
    ]
      .filter(Boolean)
      .map((item) => normalizeText(item));

    return serviceNames.some((item) => currentDmcNames.includes(item));
  };

  const serviceBelongsToCurrentDmcByDetails = async (service) => {
    if (isAdminAccess) return true;

    const ServiceModel = getServiceModel(service.type);
    if (!ServiceModel) return false;

    const normalizedTitle = normalizeText(service.title);
    const normalizedCity = normalizeText(service.city);
    const normalizedCountry = normalizeText(service.country);

    const ownServices = await ServiceModel.find({ supplier: currentDmcId })
      .select("hotelName name serviceName city country")
      .lean();

    return ownServices.some((item) => {
      const candidateTitles = [item.hotelName, item.name, item.serviceName]
        .filter(Boolean)
        .map(normalizeText);

      const candidateCity = normalizeText(item.city);
      const candidateCountry = normalizeText(item.country);

      const titleMatched = candidateTitles.some(
        (candidateTitle) =>
          candidateTitle &&
          normalizedTitle &&
          (candidateTitle === normalizedTitle ||
            candidateTitle.includes(normalizedTitle) ||
            normalizedTitle.includes(candidateTitle)),
      );

      if (!titleMatched) return false;

      const cityMatched =
        !normalizedCity || !candidateCity || normalizedCity === candidateCity;
      const countryMatched =
        !normalizedCountry ||
        !candidateCountry ||
        normalizedCountry === candidateCountry;

      return cityMatched && countryMatched;
    });
  };

  const formatDateForUi = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  const addDaysToDate = (value, daysToAdd = 0) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
    return parsed.toISOString().slice(0, 10);
  };

  const getLaterDate = (firstDate, secondDate) => {
    if (firstDate && secondDate) {
      return firstDate > secondDate ? firstDate : secondDate;
    }

    return firstDate || secondDate || "";
  };

  const deriveQuotationServiceSchedule = (services = [], tripStartDate) => {
    let cursorDate = formatDateForUi(tripStartDate);

    return services.map((service) => {
      const explicitDate = formatDateForUi(service?.serviceDate);
      const normalizedType = String(service?.type || "").toLowerCase();
      const resolvedDate =
        normalizedType === "hotel"
          ? getLaterDate(explicitDate, cursorDate)
          : explicitDate || cursorDate || "";
      let serviceEndDate = resolvedDate;
      let checkInDate = "";
      let checkOutDate = "";

      if (normalizedType === "hotel") {
        const hotelNights = Math.max(1, Number(service?.nights || 1));
        checkInDate = resolvedDate;
        checkOutDate = addDaysToDate(resolvedDate || cursorDate, hotelNights);
        serviceEndDate = addDaysToDate(
          resolvedDate || cursorDate,
          Math.max(hotelNights - 1, 0),
        );
        cursorDate = checkOutDate;
      } else if (
        (
          normalizedType === "transfer" ||
          normalizedType === "transport" ||
          normalizedType === "car" ||
          normalizedType === "sightseeing"
        ) &&
        Number(service?.days || 0) > 1
      ) {
        const serviceDays = Number(service.days || 1);
        serviceEndDate = addDaysToDate(
          resolvedDate || cursorDate,
          Math.max(serviceDays - 1, 0),
        );
        cursorDate = addDaysToDate(resolvedDate || cursorDate, serviceDays);
      }

      return {
        serviceStartDate: resolvedDate,
        serviceEndDate,
        checkInDate,
        checkOutDate,
      };
    });
  };

  const mapQuotationServiceReference = (service, schedule = {}, alignedTotal = null, index = 0) => {
    const alignedService = applyAlignedServiceTotal(service, alignedTotal);
    const breakdown = buildServiceBreakdown(alignedService);
    const resolvedType = resolveQuotationServiceType(alignedService);
    const normalizedType = String(resolvedType || "").toLowerCase();
    const resolvedServiceDate =
      normalizedType === "hotel"
        ? schedule?.serviceStartDate || formatDateForUi(alignedService.serviceDate) || ""
        : formatDateForUi(alignedService.serviceDate) ||
        schedule?.serviceStartDate ||
        "";

    return {
      type: resolvedType,
      serviceName: resolveQuotationServiceName(alignedService, index),
      description: buildDisplayServiceDescription(alignedService),
      serviceDate: resolvedServiceDate,
      serviceEndDate: schedule?.serviceEndDate || resolvedServiceDate,
      checkInDate: schedule?.checkInDate || "",
      checkOutDate: schedule?.checkOutDate || "",
      checkInTime: alignedService.checkInTime || alignedService.hotelCheckInTime || "",
      checkOutTime: alignedService.checkOutTime || alignedService.hotelCheckOutTime || "",
      status: "Confirmed",
      confirmationNumber: "",
      voucherNumber: "",
      emergency: "",
      city: alignedService.city || "",
      country: alignedService.country || "",
      supplierId: alignedService.supplierId || alignedService.dmcId || "",
      supplierName: alignedService.supplierName || alignedService.dmcName || "",
      currency: breakdown.currency,
      rate: Number(breakdown.billableUnitRate || alignedService.price || 0),
      billableQuantityValue: Number(breakdown.billableQuantityValue || breakdown.quantityValue || 1),
      billableUnitRate: Number(breakdown.billableUnitRate || alignedService.price || 0),
      addonBreakdown: Array.isArray(breakdown.addonBreakdown)
        ? breakdown.addonBreakdown
        : [],
      total: breakdown.totalAmount,
      quantityValue: breakdown.quantityValue,
      quantityLabel: breakdown.quantityLabel,
      displayQuantityLabel:
        buildDisplayServiceQuantityLabel(alignedService) || breakdown.quantityLabel,
      stayLabel: breakdown.stayLabel || "",
      unitLabel: breakdown.unitLabel,
      calculationText: breakdown.calculationText,
    };
  };

  const mapDmcVisibleService = async (service, schedule = {}, alignedTotal = null, index = 0) => {
    if (isAdminAccess) {
      return mapQuotationServiceReference(service, schedule, alignedTotal, index);
    }

    const serviceSupplierId =
      service?.dmcId?.toString?.() ||
      service?.dmcId ||
      service?.supplierId?.toString?.() ||
      service?.supplierId;

    if (serviceSupplierId) {
      if (serviceSupplierId !== currentDmcId) return null;
      return mapQuotationServiceReference(service, schedule, alignedTotal, index);
    }

    if (serviceMatchesDmcByName(service)) {
      return mapQuotationServiceReference(service, schedule, alignedTotal, index);
    }

    if (!service?.serviceId) {
      const ownedByDetails = await serviceBelongsToCurrentDmcByDetails(service);
      return ownedByDetails
        ? mapQuotationServiceReference(service, schedule, alignedTotal, index)
        : null;
    }

    const ServiceModel = getServiceModel(service.type);
    if (!ServiceModel) return null;

    const sourceService = await ServiceModel.findById(service.serviceId)
      .select("supplier")
      .lean();

    if (sourceService?.supplier?.toString() === currentDmcId) {
      return mapQuotationServiceReference(service, schedule, alignedTotal, index);
    }

    const ownedByDetails = await serviceBelongsToCurrentDmcByDetails(service);
    return ownedByDetails
      ? mapQuotationServiceReference(service, schedule, alignedTotal, index)
      : null;
  };

  const queries = await TravelQuery.find({
    opsStatus: { $in: DMC_VISIBLE_BOOKING_STATUSES },
  })
    .populate("agent", "name companyName email")
    .sort({ createdAt: -1 });

  const internalInvoices = await InternalInvoice.find({
    ...(isAdminAccess ? {} : { dmc: currentDmcId }),
    query: { $in: queries.map((query) => query._id) },
  })
    .select(
      "query supplierName invoiceNumber invoiceDate dueDate creditPeriodDays templateVariant items documents taxConfig summary status submittedAt updatedAt financeNotes payoutReference payoutDate payoutBank payoutAmount",
    )
    .lean();

  const internalInvoiceByQueryId = new Map(
    internalInvoices.map((invoice) => [invoice.query?.toString(), invoice]),
  );

  const data = await Promise.all(
    queries.map(async (query) => {
      const quotation = await getLatestOperationalQuotation(query._id);
      const confirmation = await Confirmation.findOne({
        ...(isAdminAccess ? {} : { dmcId: currentDmcId }),
        queryId: { $in: [query.queryId, query._id.toString()] },
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

      const detailQuotation = await getBestServiceDetailQuotation(query._id, quotation);
      const detailServices =
        Array.isArray(detailQuotation?.services) && detailQuotation.services.length
          ? detailQuotation.services
          : quotation?.services || [];
      const quotationServices = await enrichQuotationServicesWithDetails(
        query._id,
        detailServices,
        Array.isArray(confirmation?.services)
          ? confirmation.services.map(normalizeDetailCandidateService)
          : [],
      );
      const derivedServiceSchedule = deriveQuotationServiceSchedule(
        quotationServices,
        query.startDate,
      );
      const alignedServiceTotals = buildAllocatedServiceTotals(
        quotationServices,
        getQuotationFinanceServiceTotal(quotation),
      );
      const quotationTaxableAmount =
        Number(quotation?.pricing?.subTotal || 0) +
        Number(quotation?.pricing?.packageTemplateAmount || 0) +
        Number(quotation?.pricing?.opsMarkup?.amount || 0) +
        Number(quotation?.pricing?.opsCharges?.serviceCharge || 0) +
        Number(quotation?.pricing?.opsCharges?.handlingFee || 0);

      const visibleServices = (
        await Promise.all(
          quotationServices.map((service, index) =>
            mapDmcVisibleService(
              service,
              derivedServiceSchedule[index] || {},
              alignedServiceTotals[index],
              index,
            ),
          ),
        )
      ).filter(Boolean);

      if (!visibleServices.length) {
        return null;
      }

      const existingInternalInvoice = internalInvoiceByQueryId.get(
        query._id?.toString(),
      );

      return {
        _id: query._id,
        queryId: query.queryId,
        destination: query.destination,
        opsStatus: query.opsStatus || "",
        createdAt: query.createdAt || null,
        updatedAt: query.updatedAt || null,
        quotationCreatedAt: quotation?.createdAt || null,
        quotationUpdatedAt: quotation?.updatedAt || null,
        startDate: query.startDate,
        endDate: query.endDate,
        numberOfAdults: Number(query.numberOfAdults || 0),
        numberOfChildren: Number(query.numberOfChildren || 0),
        voucherNumber: query.voucherNumber || "",
        voucherStatus: query.voucherStatus || "",
        voucherGeneratedAt: query.voucherGeneratedAt || null,
        voucherSentAt: query.voucherSentAt || null,
        isVoucherGenerated:
          Boolean(query.voucherNumber) ||
          String(query.voucherStatus || "").toLowerCase() === "generated" ||
          String(query.voucherStatus || "").toLowerCase() === "sent" ||
          String(query.opsStatus || "").toLowerCase() === "vouchered",
        quotationTaxableAmount,
        passengers,
        duration: `${nights}N/${days}D`,
        agentName: query.agent?.companyName || query.agent?.name || "",
        travelerDetails: (query.travelerDetails || []).map((traveler, index) => ({
          id: traveler?._id?.toString?.() || `traveler-${index + 1}`,
          fullName: String(traveler?.fullName || "").trim(),
          travelerType:
            traveler?.travelerType === "Child" ? "Child" : "Adult",
          childAge:
            traveler?.travelerType === "Child" &&
              traveler?.childAge !== undefined &&
              traveler?.childAge !== null
              ? Number(traveler.childAge)
              : null,
          documentType:
            String(traveler?.documentType || "Passport").trim() || "Passport",
          documents: normalizeTravelerDocuments(
            traveler?.documents,
            traveler?.document,
            traveler?.documentType,
          ),
        })),
        travelerDocumentVerification: getTravelerDocumentVerification(query),
        travelerDocumentAuditTrail: Array.isArray(
          query.travelerDocumentAuditTrail,
        )
          ? query.travelerDocumentAuditTrail.map((entry) => ({
            action: String(entry?.action || "").trim(),
            status: String(entry?.status || "Draft").trim(),
            performedByName: String(entry?.performedByName || "").trim(),
            remarks: String(entry?.remarks || "").trim(),
            performedAt: entry?.performedAt || null,
          }))
          : [],
        internalInvoice: existingInternalInvoice
          ? {
            id: existingInternalInvoice._id,
            supplierName: existingInternalInvoice.supplierName || "",
            invoiceNumber: existingInternalInvoice.invoiceNumber || "",
            invoiceDate: existingInternalInvoice.invoiceDate || null,
            dueDate: existingInternalInvoice.dueDate || null,
            creditPeriodDays: Number(existingInternalInvoice.creditPeriodDays || 7),
            templateVariant: existingInternalInvoice.templateVariant || "aurora-ledger",
            items: Array.isArray(existingInternalInvoice.items)
              ? existingInternalInvoice.items
              : [],
            documents: Array.isArray(existingInternalInvoice.documents)
              ? existingInternalInvoice.documents
              : [],
            taxConfig: existingInternalInvoice.taxConfig || {},
            summary: existingInternalInvoice.summary || {},
            status: existingInternalInvoice.status || "Submitted",
            submittedAt: existingInternalInvoice.submittedAt || null,
            updatedAt: existingInternalInvoice.updatedAt || null,
            financeNotes: existingInternalInvoice.financeNotes || "",
            payoutReference: existingInternalInvoice.payoutReference || "",
            payoutDate: existingInternalInvoice.payoutDate || null,
            payoutBank: existingInternalInvoice.payoutBank || "",
            payoutAmount: Number(existingInternalInvoice.payoutAmount || 0),
          }
          : null,
        services: visibleServices,
        existingConfirmation: confirmation || null,
      };
    }),
  );

  return data.filter(Boolean);
};

const clampPercent = (value) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const DMC_VISIBLE_BOOKING_STATUSES = ["Confirmed", "Vouchered", "Payment_Completed", "Invoice_Requested"];

const formatDashboardDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const getWindowStart = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
};

const isWithinWindow = (value, start, end = new Date()) => {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= start && parsed < end;
};

const buildChangeMeta = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  const percentChange =
    previousValue <= 0
      ? currentValue > 0
        ? 100
        : 0
      : Math.round(((currentValue - previousValue) / previousValue) * 100);

  const sign = percentChange > 0 ? "+" : percentChange < 0 ? "-" : "";

  return {
    value: percentChange,
    text: `${sign}${Math.abs(percentChange)}% from last week`,
    tone: percentChange < 0 ? "negative" : "positive",
  };
};

const getConfirmationServices = (query = {}) =>
  Array.isArray(query?.existingConfirmation?.services)
    ? query.existingConfirmation.services
    : [];

const hasSubmittedConfirmation = (query = {}) =>
  String(query?.existingConfirmation?.status || "").toLowerCase() ===
  "submitted";

const getConfirmedServiceCount = (query = {}) =>
  getConfirmationServices(query).filter(
    (service) =>
      service?.confirmationNumber ||
      service?.voucherNumber ||
      String(service?.status || "").toLowerCase() === "confirmed",
  ).length;

const getPendingActionCountForQuery = (query = {}) => {
  const visibleServiceCount = Array.isArray(query?.services)
    ? query.services.length
    : 0;
  const confirmedServiceCount = getConfirmedServiceCount(query);
  const pendingServiceCount = Math.max(
    visibleServiceCount - confirmedServiceCount,
    0,
  );

  if (!hasSubmittedConfirmation(query)) {
    return Math.max(pendingServiceCount, visibleServiceCount || 1);
  }

  return pendingServiceCount + (query?.isVoucherGenerated ? 0 : 1);
};

const getQueryAssignmentDate = (query = {}) =>
  query?.quotationCreatedAt ||
  query?.createdAt ||
  query?.updatedAt ||
  null;

const getResponseTimeHours = (query = {}) => {
  if (!hasSubmittedConfirmation(query)) return null;

  const startedAt = getQueryAssignmentDate(query);
  const completedAt =
    query?.existingConfirmation?.updatedAt ||
    query?.existingConfirmation?.createdAt;

  if (!startedAt || !completedAt) return null;

  const start = new Date(startedAt);
  const end = new Date(completedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hours >= 0 ? hours : null;
};

const formatHoursCompact = (hours) => {
  const numericHours = Number(hours || 0);
  if (!numericHours) return "0h";
  if (numericHours >= 24) {
    return `${(numericHours / 24).toFixed(1)}d`;
  }
  return `${numericHours.toFixed(1)}h`;
};

const buildDmcRecentActivity = (queries = []) =>
  queries
    .flatMap((query) => {
      const company = `${query?.agentName || "Assigned Agent"} -> ${query?.destination || "-"}`;
      const items = [];
      const newQueryAt = getQueryAssignmentDate(query);

      if (newQueryAt) {
        items.push({
          title: "New Query",
          badge: "New",
          color: "bg-purple-100 text-purple-600",
          company,
          timestamp: newQueryAt,
        });
      }

      if (DMC_VISIBLE_BOOKING_STATUSES.includes(String(query?.opsStatus || "").trim())) {
        items.push({
          title: "Booking Accepted",
          badge: "Accepted",
          color: "bg-blue-100 text-blue-600",
          company,
          timestamp: query?.updatedAt || query?.quotationUpdatedAt || newQueryAt,
        });
      }

      if (hasSubmittedConfirmation(query)) {
        items.push({
          title: "Confirmation Entered",
          badge: "Confirmed",
          color: "bg-cyan-100 text-cyan-600",
          company,
          timestamp:
            query?.existingConfirmation?.updatedAt ||
            query?.existingConfirmation?.createdAt,
        });
      }

      if (query?.isVoucherGenerated) {
        items.push({
          title: "Voucher Generated",
          badge: "Vouchered",
          color: "bg-green-100 text-green-600",
          company,
          timestamp:
            query?.voucherGeneratedAt ||
            query?.voucherSentAt ||
            query?.updatedAt ||
            query?.quotationUpdatedAt ||
            newQueryAt,
        });
      }

      return items;
    })
    .filter((item) => item.timestamp)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 5);

const buildDmcDashboardPayload = (queries = []) => {
  const currentWeekStart = getWindowStart(7);
  const previousWeekStart = getWindowStart(14);
  const now = new Date();

  const activeBookings = queries.length;
  const pendingQueries = queries.filter(
    (query) => !hasSubmittedConfirmation(query),
  ).length;
  const vouchersGenerated = queries.filter(
    (query) => query?.isVoucherGenerated,
  ).length;
  const pendingActions = queries.reduce(
    (total, query) => total + getPendingActionCountForQuery(query),
    0,
  );

  const currentWeekAssigned = queries.filter((query) =>
    isWithinWindow(getQueryAssignmentDate(query), currentWeekStart, now),
  );
  const previousWeekAssigned = queries.filter((query) =>
    isWithinWindow(getQueryAssignmentDate(query), previousWeekStart, currentWeekStart),
  );

  const currentWeekPendingQueries = currentWeekAssigned.filter(
    (query) => !hasSubmittedConfirmation(query),
  ).length;
  const previousWeekPendingQueries = previousWeekAssigned.filter(
    (query) => !hasSubmittedConfirmation(query),
  ).length;

  const currentWeekVouchers = queries.filter((query) =>
    isWithinWindow(
      query?.voucherGeneratedAt ||
      query?.voucherSentAt ||
      (query?.isVoucherGenerated ? query?.updatedAt : null),
      currentWeekStart,
      now,
    ),
  ).length;
  const previousWeekVouchers = queries.filter((query) =>
    isWithinWindow(
      query?.voucherGeneratedAt ||
      query?.voucherSentAt ||
      (query?.isVoucherGenerated ? query?.updatedAt : null),
      previousWeekStart,
      currentWeekStart,
    ),
  ).length;

  const currentWeekPendingActions = currentWeekAssigned.reduce(
    (total, query) => total + getPendingActionCountForQuery(query),
    0,
  );
  const previousWeekPendingActions = previousWeekAssigned.reduce(
    (total, query) => total + getPendingActionCountForQuery(query),
    0,
  );

  const submittedCount = queries.filter((query) =>
    hasSubmittedConfirmation(query),
  ).length;
  const queriesHandledPercent = activeBookings
    ? Math.round((submittedCount / activeBookings) * 100)
    : 0;

  const responseTimeSamples = queries
    .map((query) => getResponseTimeHours(query))
    .filter((value) => value !== null);
  const avgResponseHours = responseTimeSamples.length
    ? responseTimeSamples.reduce((sum, value) => sum + value, 0) /
    responseTimeSamples.length
    : 0;

  const voucherWindowStart = getWindowStart(30);
  const recentVoucherTimestamps = queries
    .map(
      (query) =>
        query?.voucherGeneratedAt ||
        query?.voucherSentAt ||
        (query?.isVoucherGenerated ? query?.updatedAt : null),
    )
    .filter((value) => isWithinWindow(value, voucherWindowStart, now));
  const voucherActiveDays = new Set(
    recentVoucherTimestamps.map((value) =>
      new Date(value).toISOString().slice(0, 10),
    ),
  ).size;
  const vouchersPerDay = recentVoucherTimestamps.length
    ? Math.round(recentVoucherTimestamps.length / Math.max(voucherActiveDays, 1))
    : 0;

  return {
    dateLabel: formatDashboardDate(),
    summary: {
      pendingQueries: {
        value: pendingQueries,
        ...buildChangeMeta(currentWeekPendingQueries, previousWeekPendingQueries),
      },
      activeBookings: {
        value: activeBookings,
        ...buildChangeMeta(currentWeekAssigned.length, previousWeekAssigned.length),
      },
      vouchersGenerated: {
        value: vouchersGenerated,
        ...buildChangeMeta(currentWeekVouchers, previousWeekVouchers),
      },
      pendingActions: {
        value: pendingActions,
        ...buildChangeMeta(currentWeekPendingActions, previousWeekPendingActions),
      },
    },
    recentActivity: buildDmcRecentActivity(queries),
    performance: {
      queriesHandled: {
        value: `${queriesHandledPercent}%`,
        width: `${clampPercent(queriesHandledPercent)}%`,
        color: "bg-blue-600",
      },
      avgResponseTime: {
        value: formatHoursCompact(avgResponseHours),
        width: `${clampPercent(avgResponseHours ? ((8 - Math.min(avgResponseHours, 8)) / 8) * 100 : 0)}%`,
        color: "bg-green-600",
      },
      vouchersPerDay: {
        value: `${vouchersPerDay}`,
        width: `${clampPercent((vouchersPerDay / 25) * 100)}%`,
        color: "bg-purple-600",
      },
    },
  };
};

export const getConfirmedQueriesForDmc = async (req, res, next) => {
  try {
    const data = await getDmcVisibleQueriesData(req);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDmcDashboard = async (req, res, next) => {
  try {
    const queries = await getDmcVisibleQueriesData(req);

    res.status(200).json({
      success: true,
      data: buildDmcDashboardPayload(queries),
    });
  } catch (error) {
    next(error);
  }
};
