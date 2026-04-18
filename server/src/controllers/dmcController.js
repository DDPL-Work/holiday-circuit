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
import TravelQuery from "../models/TravalQuery.model.js";
import Quotation from "../models/quotation.model.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
import path from "path"
import fs from "fs"
import { generateInternalInvoicePdf } from "../services/internalInvoicePdfService.js";
import { getRoundRobinFinanceAssignee } from "../services/financeTeamScopeService.js";

const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt ? new Date(document.uploadedAt) : null,
});

const getTravelerDocumentKey = (documentType = "Passport") => {
  const normalizedType = String(documentType || "").trim().toLowerCase();
  return normalizedType.includes("gov") || normalizedType.includes("id") || normalizedType.includes("aad")
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
      const error = new Error( "Required transfer fields missing");
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
      Activity.find(),
      Transfer.find(),
      Sightseeing.find()
    ]);

    const ownerIds = [
      ...hotels.map((item) => item.supplier).filter(Boolean),
      ...activities.map((item) => item.supplier).filter(Boolean),
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
      country:h.country,
      city:h.city,
      price: h.price,
      currency: h.currency,
      hotelCategory:h.hotelCategory,
      bedType:h.bedType,
      roomType:h.roomType,
      awebRate: h.awebRate || 0,
      cwebRate: h.cwebRate || 0,
      cwoebRate: h.cwoebRate || 0,
    }));

    // 🔹 FORMAT ACTIVITIES
    const activityData = activities.map(a => ({
      id: a._id,
      supplierId: a.supplier,
      supplierName: a.supplierName || "",
      dmcId: a.supplier,
      dmcName: ownerMap.get(a.supplier?.toString()) || "",
      type: "activity",
      title: a.name,
      subtitle: `${a.city} | Activity`,
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
      city:s.city,
      price:s.price,
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

    let confirmation = await Confirmation.findOne({
      queryId,
      dmcId: currentDmcId,
    });

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

      confirmation.status = status;

      await confirmation.save();
    } else {
      confirmation = await Confirmation.create({
        dmcId: currentDmcId,
        queryId,
        services: JSON.parse(services),
        emergencyContact,
        documents,
        status,
      });
    }

    res.json({ success: true, data: confirmation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

    if (!invoiceMeta?.supplierName || !invoiceMeta?.invoiceNumber || !invoiceMeta?.invoiceDate || !invoiceMeta?.dueDate) {
      return next(new ApiError(400, "Invoice header details are required"));
    }

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
      invoiceMeta,
      items: normalizedItems,
      summary,
      taxConfig,
      dmcName: dmc?.companyName || dmc?.name || "",
      destination: query.destination || "",
      templateVariant,
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
      dueDate: new Date(invoiceMeta.dueDate),
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
      templateVariant,
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


export const getConfirmedQueriesForDmc = async (req, res, next) => {
  try {
    const isAdminAccess = req.user?.role === "admin";
    const currentDmcId = req.user.id?.toString();
    const currentDmc = await Auth.findById(currentDmcId)
      .select("name companyName")
      .lean();
    const currentDmcNames = [
      currentDmc?.companyName,
      currentDmc?.name,
    ]
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
      const normalizedType = (service.type || "").toLowerCase();
      const currency = service.currency || "INR";
      const unitPrice = Number(service.price || 0);
      const totalAmount = Number(service.total || 0);

      if (normalizedType === "hotel") {
        const unitCount = Number(service.nights || 1);
        const roomCount = Math.max(1, Number(service.rooms || 1));
        return {
          quantityValue: roomCount,
          quantityLabel: `${roomCount} ${roomCount === 1 ? "Room" : "Rooms"}`,
          stayLabel: `${unitCount} ${unitCount === 1 ? "Night" : "Nights"}`,
          unitLabel: unitCount === 1 ? "per night" : "per night",
          calculationText: `${unitCount} ${unitCount === 1 ? "night" : "nights"} x ${currency} ${unitPrice.toLocaleString()}`,
          totalAmount,
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
          calculationText: `${unitCount} ${unitCount === 1 ? "day" : "days"} x ${currency} ${unitPrice.toLocaleString()}`,
          totalAmount,
          currency,
        };
      }

      const unitCount = Number(service.pax || 1);
      return {
        quantityValue: unitCount,
        quantityLabel: `${unitCount} ${unitCount === 1 ? "Pax" : "Pax"}`,
        stayLabel: "",
        unitLabel: normalizedType === "sightseeing" ? "per guest" : "per guest",
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
        const candidateTitles = [
          item.hotelName,
          item.name,
          item.serviceName,
        ]
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

    const mapQuotationServiceReference = (service, schedule = {}) => {
      const breakdown = buildServiceBreakdown(service);
      const normalizedType = String(service?.type || "").toLowerCase();
      const resolvedServiceDate =
        normalizedType === "hotel"
          ? schedule?.serviceStartDate || formatDateForUi(service.serviceDate) || ""
          : formatDateForUi(service.serviceDate) || schedule?.serviceStartDate || "";

      return {
        type: service.type,
        serviceName: service.title || "",
        serviceDate: resolvedServiceDate,
        serviceEndDate: schedule?.serviceEndDate || resolvedServiceDate,
        checkInDate: schedule?.checkInDate || "",
        checkOutDate: schedule?.checkOutDate || "",
        checkInTime: service.checkInTime || service.hotelCheckInTime || "",
        checkOutTime: service.checkOutTime || service.hotelCheckOutTime || "",
        status: "Confirmed",
        confirmationNumber: "",
        voucherNumber: "",
        emergency: "",
        city: service.city || "",
        country: service.country || "",
        supplierId: service.supplierId || service.dmcId || "",
        supplierName: service.supplierName || service.dmcName || "",
        currency: breakdown.currency,
        rate: Number(service.price || 0),
        total: breakdown.totalAmount,
        quantityValue: breakdown.quantityValue,
        quantityLabel: breakdown.quantityLabel,
        stayLabel: breakdown.stayLabel || "",
        unitLabel: breakdown.unitLabel,
        calculationText: breakdown.calculationText,
      };
    };

    const mapDmcVisibleService = async (service, schedule = {}) => {
      if (isAdminAccess) {
        return mapQuotationServiceReference(service, schedule);
      }

      const serviceSupplierId =
        service?.dmcId?.toString?.() ||
        service?.dmcId ||
        service?.supplierId?.toString?.() ||
        service?.supplierId;

      if (serviceSupplierId) {
        if (serviceSupplierId !== currentDmcId) return null;
        return mapQuotationServiceReference(service, schedule);
      }

      if (serviceMatchesDmcByName(service)) {
        return mapQuotationServiceReference(service, schedule);
      }

      if (!service?.serviceId) {
        const ownedByDetails = await serviceBelongsToCurrentDmcByDetails(service);
        return ownedByDetails
          ? mapQuotationServiceReference(service, schedule)
          : null;
      }

      const ServiceModel = getServiceModel(service.type);
      if (!ServiceModel) return null;

      const sourceService = await ServiceModel.findById(service.serviceId)
        .select("supplier")
        .lean();

      if (sourceService?.supplier?.toString() === currentDmcId) {
        return mapQuotationServiceReference(service, schedule);
      }

      const ownedByDetails = await serviceBelongsToCurrentDmcByDetails(service);
      return ownedByDetails
        ? mapQuotationServiceReference(service, schedule)
        : null;
    };

    const queries = await TravelQuery.find({
      opsStatus: { $in: ["Confirmed", "Vouchered"] }
    })
      .populate("agent", "name companyName email")
      .sort({ createdAt: -1 });

    const internalInvoices = await InternalInvoice.find({
      ...(isAdminAccess ? {} : { dmc: currentDmcId }),
      query: { $in: queries.map((query) => query._id) },
    })
      .select(
        "query supplierName invoiceNumber invoiceDate dueDate items documents taxConfig summary status submittedAt updatedAt financeNotes payoutReference payoutDate payoutBank payoutAmount",
      )
      .lean();

    const internalInvoiceByQueryId = new Map(
      internalInvoices.map((invoice) => [invoice.query?.toString(), invoice]),
    );

    const data = await Promise.all(
      queries.map(async (query) => {
        const quotation = await Quotation.findOne({ queryId: query._id }).sort({ createdAt: -1 });
        const confirmation = await Confirmation.findOne({
          ...(isAdminAccess ? {} : { dmcId: currentDmcId }),
          queryId: { $in: [query.queryId, query._id.toString()] }
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

        const quotationServices = quotation?.services || [];
        const derivedServiceSchedule = deriveQuotationServiceSchedule(
          quotationServices,
          query.startDate,
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
              mapDmcVisibleService(service, derivedServiceSchedule[index] || {}),
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
          startDate: query.startDate,
          endDate: query.endDate,
          numberOfAdults: Number(query.numberOfAdults || 0),
          numberOfChildren: Number(query.numberOfChildren || 0),
          voucherNumber: query.voucherNumber || "",
          voucherStatus: query.voucherStatus || "",
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
            travelerType: traveler?.travelerType === "Child" ? "Child" : "Adult",
            childAge:
              traveler?.travelerType === "Child" && traveler?.childAge !== undefined && traveler?.childAge !== null
                ? Number(traveler.childAge)
                : null,
            documentType: String(traveler?.documentType || "Passport").trim() || "Passport",
            documents: normalizeTravelerDocuments(
              traveler?.documents,
              traveler?.document,
              traveler?.documentType,
            ),
          })),
          travelerDocumentVerification: getTravelerDocumentVerification(query),
          travelerDocumentAuditTrail: Array.isArray(query.travelerDocumentAuditTrail)
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
      })
    );

    res.status(200).json({
      success: true,
      data: data.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};
