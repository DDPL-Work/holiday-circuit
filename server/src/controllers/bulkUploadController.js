import path from "path"
import fs from "fs"
import XLSX from "xlsx"

import { processHotelExcel } from "../services/hotelProcessor.js"
import { processTransportExcel } from "../services/transportProcessor.js"
import { processActivityExcel } from "../services/activityProcessor.js"
import { processPackageExcel } from "../services/packageProcessor.js"
import { processSightseeingExcel } from "../services/sightseeingProcessor.js"
import UploadHistory from "../models/uploadHistory.model.js"
import Auth from "../models/auth.model.js"
import Notification from "../models/notification.model.js"
import mongoose from "mongoose"
import Hotel from "../models/hotelDmc.model.js"
import Transport from "../models/transferDmc.model.js"
import Activity from "../models/activityDmc.model.js"
import Sightseeing from "../models/sightseeingDmc.model.js"

const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"]);

const getCellValue = (row = {}, labels = []) => {
  const normalizedEntries = Object.entries(row || {}).map(([key, value]) => [
    String(key || "").trim().toLowerCase(),
    value,
  ]);
  for (const label of labels) {
    const normalizedLabel = String(label || "").trim().toLowerCase();
    const match = normalizedEntries.find(([key]) => key === normalizedLabel);
    if (match) return match[1];
  }
  return "";
};

const getCleanString = (row, labels) => String(getCellValue(row, labels) || "").trim();
const getCleanNumber = (row, labels) => Number(getCellValue(row, labels) || 0) || 0;

const normalizeCurrency = (value, fallback = "INR") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return fallback;
  return allowedCurrencies.has(normalized) ? normalized : fallback;
};

const normalizeMealPlan = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return ["EP", "CP", "MAP", "AP", "AI"].includes(normalized) ? normalized : "EP";
};

const normalizeHotelCategory = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("5")) return "5 Star";
  if (normalized.includes("4")) return "4 Star";
  if (normalized.includes("luxury")) return "Luxury";
  return "3 Star";
};

const normalizeBedType = (value = "") => {
  const normalized = String(value || "").trim();
  return ["King", "Queen", "Twin"].includes(normalized) ? normalized : "King";
};

const normalizeUsageType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("round")) return "round-trip";
  if (normalized.includes("full")) return "full-day";
  if (normalized.includes("half")) return "half-day";
  return "point-to-point";
};

const parseExcelDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const compactObject = (value = {}) =>
  Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""),
  );

const normalizeHeaderText = (value = "") => String(value || "").trim().toLowerCase();

const findHeaderIndex = (headers = [], labels = []) => {
  const normalizedLabels = labels.map(normalizeHeaderText);
  return headers.findIndex((header) => normalizedLabels.includes(normalizeHeaderText(header)));
};

const getMatrixValue = (row = [], index = -1) => (index >= 0 ? row[index] ?? "" : "");

const buildTransportGroupedPreview = (rawData = [], upload = {}) => {
  const topHeaders = rawData[0] || [];
  const serviceNameIndex = findHeaderIndex(topHeaders, ["Service Name"]);
  const supplierNameIndex = findHeaderIndex(topHeaders, ["Supplier Name"]);
  const vehicleTypeIndex = findHeaderIndex(topHeaders, ["Vehicle Type"]);
  const usageTypeIndex = findHeaderIndex(topHeaders, ["Usage Type"]);
  const priceIndex = findHeaderIndex(topHeaders, ["Price"]);
  const currencyIndex = findHeaderIndex(topHeaders, ["Currency"]);
  const countryIndex = findHeaderIndex(topHeaders, ["Country"]);
  const cityIndex = findHeaderIndex(topHeaders, ["City"]);
  const typeIndex = findHeaderIndex(topHeaders, ["Type"]);
  const validFromIndex = findHeaderIndex(topHeaders, ["Valid From"]);
  const validToIndex = findHeaderIndex(topHeaders, ["Valid To"]);
  const descriptionIndex = findHeaderIndex(topHeaders, ["Description"]);
  const passengerCapacityIndex = findHeaderIndex(topHeaders, ["Passenger Capacity"]);
  const luggageCapacityIndex = findHeaderIndex(topHeaders, ["Luggage Capacity"]);
  const fullDayNoteIndex = findHeaderIndex(topHeaders, ["Full Day Note"]);
  const halfDayNoteIndex = findHeaderIndex(topHeaders, ["Half Day Note"]);

  if (serviceNameIndex === -1 && usageTypeIndex === -1 && priceIndex === -1) {
    return null;
  }

  const columns = [
    { key: "serviceName", label: "Service Name", isGroupedMerged: true },
    { key: "supplierName", label: "Supplier Name", isGroupedMerged: true },
    { key: "vehicleType", label: "Vehicle Type" },
    { key: "usagePointOneWay", label: "One Way / Airport Transfer" },
    { key: "usagePointInterHotel", label: "Inter Hotel Transfer" },
    { key: "usageHourlyFullDay", label: "Full Day - 80 km / 8 hours" },
    { key: "usageHourlyHalfDay", label: "Half Day - 40 km / 4 hours" },
    { key: "pricePointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "pricePointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "priceHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "priceHourlyFullDayExtraKm", label: "Extra per km rate", numeric: true },
    { key: "priceHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "priceHourlyHalfDayExtraKm", label: "Extra per km rate", numeric: true },
    { key: "currency", label: "Currency", isGroupedMerged: true },
    { key: "country", label: "Country", isGroupedMerged: true },
    { key: "city", label: "City", isGroupedMerged: true },
    { key: "type", label: "Type", isGroupedMerged: true },
    { key: "validFrom", label: "Valid From", isGroupedMerged: true },
    { key: "validTo", label: "Valid To", isGroupedMerged: true },
    { key: "description", label: "Description", isDesc: true },
    { key: "passengerCapacity", label: "Passenger Capacity", numeric: true },
    { key: "luggageCapacity", label: "Luggage Capacity", numeric: true },
    { key: "fullDayNote", label: "Full Day Note", isDesc: true, isGroupedMerged: true },
    { key: "halfDayNote", label: "Half Day Note", isDesc: true, isGroupedMerged: true },
  ];

  const headerRows = [
    [
      { label: "Service Name", rowSpan: 3 },
      { label: "Supplier Name", rowSpan: 3 },
      { label: "Vehicle Type", rowSpan: 3 },
      { label: "Usage Type", colSpan: 4 },
      { label: "Price", colSpan: 6 },
      { label: "Currency", rowSpan: 3 },
      { label: "Country", rowSpan: 3 },
      { label: "City", rowSpan: 3 },
      { label: "Type", rowSpan: 3 },
      { label: "Valid From", rowSpan: 3 },
      { label: "Valid To", rowSpan: 3 },
      { label: "Description", rowSpan: 3 },
      { label: "Passenger Capacity", rowSpan: 3 },
      { label: "Luggage Capacity", rowSpan: 3 },
      { label: "Full Day Note", rowSpan: 3 },
      { label: "Half Day Note", rowSpan: 3 },
    ],
    [
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 4 },
    ],
    [
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Extra per km rate" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "Extra per km rate" },
    ],
  ];

  // Determine starting row for data (after 3 header rows if present)
  let startRowIndex = 3;
  if (rawData.length <= 3) startRowIndex = 1;

  const rows = [];
  let currService = "";
  let currSupplier = "";
  let currCurrency = "";
  let currCountry = "";
  let currCity = "";
  let currType = "";
  let currValidFrom = "";
  let currValidTo = "";
  let currFullDayNote = "";
  let currHalfDayNote = "";

  for (let rowIndex = startRowIndex; rowIndex < rawData.length; rowIndex += 1) {
    const row = rawData[rowIndex] || [];

    if (serviceNameIndex !== -1 && getMatrixValue(row, serviceNameIndex)) {
      currService = String(getMatrixValue(row, serviceNameIndex)).trim();
    }
    if (supplierNameIndex !== -1 && getMatrixValue(row, supplierNameIndex)) {
      currSupplier = String(getMatrixValue(row, supplierNameIndex)).trim();
    }
    if (currencyIndex !== -1 && getMatrixValue(row, currencyIndex)) currCurrency = String(getMatrixValue(row, currencyIndex)).trim();
    if (countryIndex !== -1 && getMatrixValue(row, countryIndex)) currCountry = String(getMatrixValue(row, countryIndex)).trim();
    if (cityIndex !== -1 && getMatrixValue(row, cityIndex)) currCity = String(getMatrixValue(row, cityIndex)).trim();
    if (typeIndex !== -1 && getMatrixValue(row, typeIndex)) currType = String(getMatrixValue(row, typeIndex)).trim();
    if (validFromIndex !== -1 && getMatrixValue(row, validFromIndex)) currValidFrom = String(getMatrixValue(row, validFromIndex)).trim();
    if (validToIndex !== -1 && getMatrixValue(row, validToIndex)) currValidTo = String(getMatrixValue(row, validToIndex)).trim();
    if (fullDayNoteIndex !== -1 && getMatrixValue(row, fullDayNoteIndex)) currFullDayNote = String(getMatrixValue(row, fullDayNoteIndex)).trim();
    if (halfDayNoteIndex !== -1 && getMatrixValue(row, halfDayNoteIndex)) currHalfDayNote = String(getMatrixValue(row, halfDayNoteIndex)).trim();

    // Clean any emoji/icon from vehicleType (e.g. 🚗 Sedan -> Sedan)
    const rawVehicleType = String(getMatrixValue(row, vehicleTypeIndex) || "");
    const vehicleType = rawVehicleType.replace(/[^\x20-\x7E]/g, "").trim();

    // Skip row if completely empty
    if (!vehicleType && !currService && !currSupplier && !row[priceIndex]) continue;

    const groupRowIndex = (rowIndex - startRowIndex) % 5;

    const rowData = {
      _id: `${upload._id}_transport_${rows.length}`,
      rowIndex,
      groupRowIndex,
      groupRowSpan: 5,
      serviceName: currService,
      supplierName: currSupplier,
      vehicleType: vehicleType,
      usagePointOneWay: row[usageTypeIndex] || "One Way / Airport Transfer",
      usagePointInterHotel: row[usageTypeIndex + 1] || "Inter Hotel Transfer",
      usageHourlyFullDay: row[usageTypeIndex + 2] || "Full Day - 80 km / 8 hours",
      usageHourlyHalfDay: row[usageTypeIndex + 3] || "Half Day - 40 km / 4 hours",
      pricePointOneWay: row[priceIndex] !== undefined ? row[priceIndex] : "",
      pricePointInterHotel: row[priceIndex + 1] !== undefined ? row[priceIndex + 1] : "",
      priceHourlyFullDay: row[priceIndex + 2] !== undefined ? row[priceIndex + 2] : "",
      priceHourlyFullDayExtraKm: row[priceIndex + 3] !== undefined ? row[priceIndex + 3] : "",
      priceHourlyHalfDay: row[priceIndex + 4] !== undefined ? row[priceIndex + 4] : "",
      priceHourlyHalfDayExtraKm: row[priceIndex + 5] !== undefined ? row[priceIndex + 5] : "",
      currency: currCurrency,
      country: currCountry,
      city: currCity,
      type: currType,
      validFrom: currValidFrom,
      validTo: currValidTo,
      description: (descriptionIndex !== -1 ? row[descriptionIndex] : "") || "",
      passengerCapacity: passengerCapacityIndex !== -1 ? row[passengerCapacityIndex] : "",
      luggageCapacity: luggageCapacityIndex !== -1 ? row[luggageCapacityIndex] : "",
      fullDayNote: currFullDayNote,
      halfDayNote: currHalfDayNote,
    };

    rows.push(rowData);
  }

  if (!rows.length) return null;

  return {
    success: true,
    category: upload.category,
    fileName: upload.fileName,
    headers: columns.map((column) => column.key),
    columns,
    headerRows,
    rows,
    readOnlyPreview: true,
  };
};

const rateChangeReasonOptions = {
  blackout: "Blackout / Event Date",
  dynamic_pricing: "Dynamic Pricing",
  availability: "Availability Constraint",
  supplier_revision: "Supplier Revision",
  other: "Other",
};

const rateSensitiveFieldPatterns = [
  /price/i,
  /rate/i,
  /currency/i,
  /valid\s*from/i,
  /valid\s*to/i,
  /availability/i,
  /blackout/i,
  /inventory/i,
  /allotment/i,
  /stock/i,
  /surcharge/i,
];

const normalizeRateChangeReason = (value = "") =>
  String(value || "").trim().toLowerCase().replace(/\s+/g, "_");

const isRateSensitiveField = (header = "") =>
  rateSensitiveFieldPatterns.some((pattern) => pattern.test(String(header || "")));

const validateRateChangeReason = ({ changes = [], reasonType = "", reasonNote = "" }) => {
  const rateSensitiveChanges = changes.filter((change) => isRateSensitiveField(change.field));

  if (!rateSensitiveChanges.length) {
    return { required: false, rateSensitiveChanges };
  }

  const normalizedReasonType = normalizeRateChangeReason(reasonType);
  const trimmedNote = String(reasonNote || "").trim();

  if (!rateChangeReasonOptions[normalizedReasonType]) {
    return {
      required: true,
      rateSensitiveChanges,
      error: "Rate change reason type is required. Select blackout, dynamic pricing, availability, supplier revision, or other.",
    };
  }

  if (trimmedNote.length < 10) {
    return {
      required: true,
      rateSensitiveChanges,
      error: "Rate change reason note is required and must be at least 10 characters.",
    };
  }

  return {
    required: true,
    rateSensitiveChanges,
    reasonType: normalizedReasonType,
    reasonLabel: rateChangeReasonOptions[normalizedReasonType],
    reasonNote: trimmedNote,
  };
};

const buildCategorySyncConfig = (category = "") => {
  const normalizedCategory = String(category || "").trim().toLowerCase();

  if (normalizedCategory === "hotel") {
    return {
      Model: Hotel,
      buildIdentity: (row) => compactObject({
        hotelName: getCleanString(row, ["Hotel Name"]),
        roomCategory: getCleanString(row, ["Room Category"]) || "Double",
        bedType: normalizeBedType(getCleanString(row, ["Bed Type"])),
        roomType: getCleanString(row, ["Room Type"]),
      }),
      buildLooseIdentity: (row) => compactObject({
        hotelName: getCleanString(row, ["Hotel Name"]),
      }),
      buildUpdate: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name"]),
        supplierName: getCleanString(row, ["Supplier Name"]),
        hotelName: getCleanString(row, ["Hotel Name"]),
        country: getCleanString(row, ["Country"]),
        city: getCleanString(row, ["City"]),
        hotelCategory: normalizeHotelCategory(getCleanString(row, ["Hotel Category"])),
        roomCategory: getCleanString(row, ["Room Category"]) || "Double",
        bedType: normalizeBedType(getCleanString(row, ["Bed Type"])),
        roomType: getCleanString(row, ["Room Type"]),
        mealPlan: normalizeMealPlan(getCleanString(row, ["Meal Plan"])),
        price: getCleanNumber(row, ["Price"]),
        awebRate: getCleanNumber(row, ["A.W.E.B Rate", "AWEB Rate", "AWEB"]),
        cwebRate: getCleanNumber(row, ["C.W.E.B Rate", "CWEB Rate", "CWEB"]),
        cwoebRate: getCleanNumber(row, ["C.Wo.E.B Rate", "CWOEB Rate", "CWOEB"]),
        currency: normalizeCurrency(getCleanString(row, ["Currency"]), "INR"),
        description: getCleanString(row, ["Description"]),
        validFrom: parseExcelDate(getCellValue(row, ["Valid From"])),
        validTo: parseExcelDate(getCellValue(row, ["Valid To"])),
      }),
    };
  }

  if (normalizedCategory === "transport") {
    return {
      Model: Transport,
      buildIdentity: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name"]),
        vehicleType: getCleanString(row, ["Vehicle Type"]),
        usageType: normalizeUsageType(getCleanString(row, ["Usage Type"])),
      }),
      buildLooseIdentity: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name"]),
      }),
      buildUpdate: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name"]),
        supplierName: getCleanString(row, ["Supplier Name"]),
        country: getCleanString(row, ["Country"]),
        city: getCleanString(row, ["City"]),
        vehicleType: getCleanString(row, ["Vehicle Type"]),
        passengerCapacity: getCleanNumber(row, ["Passenger Capacity"]),
        luggageCapacity: getCleanNumber(row, ["Luggage Capacity"]),
        usageType: normalizeUsageType(getCleanString(row, ["Usage Type"])),
        description: getCleanString(row, ["Description"]),
        price: getCleanNumber(row, ["Price"]),
        currency: normalizeCurrency(getCleanString(row, ["Currency"]), "USD"),
        validFrom: parseExcelDate(getCellValue(row, ["Valid From"])),
        validTo: parseExcelDate(getCellValue(row, ["Valid To"])),
      }),
    };
  }

  if (normalizedCategory === "activity") {
    return {
      Model: Activity,
      buildIdentity: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name", "Activity Name"]),
      }),
      buildLooseIdentity: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name", "Activity Name"]),
      }),
      buildUpdate: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name", "Activity Name"]),
        supplierName: getCleanString(row, ["Supplier Name"]),
        country: getCleanString(row, ["Country"]),
        city: getCleanString(row, ["City"]),
        currency: normalizeCurrency(getCleanString(row, ["Currency"]), "INR"),
        validFrom: parseExcelDate(getCellValue(row, ["Valid From"])),
        validTo: parseExcelDate(getCellValue(row, ["Valid To"])),
      }),
    };
  }

  if (normalizedCategory === "sightseeing") {
    return {
      Model: Sightseeing,
      buildIdentity: (row) => compactObject({
        serviceName: getCleanString(row, ["Sightseeing Name", "Service Name"]),
      }),
      buildLooseIdentity: (row) => compactObject({
        serviceName: getCleanString(row, ["Sightseeing Name", "Service Name"]),
      }),
      buildUpdate: (row) => compactObject({
        serviceName: getCleanString(row, ["Sightseeing Name", "Service Name"]),
        supplierName: getCleanString(row, ["Supplier Name"]),
        country: getCleanString(row, ["Country"]),
        city: getCleanString(row, ["City"]),
        currency: normalizeCurrency(getCleanString(row, ["Currency"]), "INR"),
        validFrom: parseExcelDate(getCellValue(row, ["Valid From"])),
        validTo: parseExcelDate(getCellValue(row, ["Valid To"])),
      }),
    };
  }

  return null;
};

const syncEditedRowToServiceCollection = async ({ category, ownerId, originalRow, updatedRow }) => {
  const config = buildCategorySyncConfig(category);
  if (!config || !ownerId) return { matched: false, modified: false };

  const { Model, buildIdentity, buildLooseIdentity, buildUpdate } = config;
  const supplierFilter = { supplier: ownerId };
  const update = buildUpdate(updatedRow);
  const identityFilters = [
    compactObject({ ...supplierFilter, ...buildIdentity(originalRow) }),
    compactObject({ ...supplierFilter, ...buildIdentity(updatedRow) }),
    compactObject({ ...supplierFilter, ...buildLooseIdentity(originalRow) }),
    compactObject({ ...supplierFilter, ...buildLooseIdentity(updatedRow) }),
  ].filter((filter) => Object.keys(filter).length > 1);

  for (const filter of identityFilters) {
    const result = await Model.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, runValidators: true },
    );

    if (result) {
      return { matched: true, modified: true, id: result._id };
    }
  }

  return { matched: false, modified: false };
};
const sanitizeCount = (val) => {
  if (typeof val === "number" && !isNaN(val)) return Math.max(0, Math.round(val));
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  if (val && typeof val === "object") {
    if (typeof val.records === "number" && !isNaN(val.records)) return Math.max(0, Math.round(val.records));
    if (typeof val.count === "number" && !isNaN(val.count)) return Math.max(0, Math.round(val.count));
    if (typeof val.length === "number" && !isNaN(val.length)) return Math.max(0, Math.round(val.length));
  }
  return 0;
};

export const bulkUpload = async (req, res) => {
  try {
    let category = String(req.body.category || "hotel").toLowerCase().trim();
    const fileName = req.file.originalname;

    // 🔥 IMPORTANT FIX
    const filePath = `uploads/${req.file.filename}`;
    console.log("FILE OBJECT:", req.file);

    const uploadedBy = req.user?.name || req.user?.email || req.user?.id;
    const ext = path.extname(fileName).toLowerCase();

    let records = 0;
    let blackoutDates = [];

    if ([".xlsx", ".xls", ".csv"].includes(ext)) {
      // Auto-detect category from sheets or filename if mismatched
      try {
        const wb = XLSX.readFile(req.file.path, { sheetRows: 5 });
        const sheetNames = (wb.SheetNames || []).map((s) => s.toLowerCase());
        const lowerName = fileName.toLowerCase();

        if (
          sheetNames.some((s) => s.includes("transport") || s.includes("transfer") || s.includes("vehicle")) ||
          lowerName.includes("transport") ||
          lowerName.includes("transfer")
        ) {
          category = "transport";
        } else if (
          sheetNames.some((s) => s.includes("hotel") || s.includes("room")) ||
          lowerName.includes("hotel")
        ) {
          category = "hotel";
        } else if (
          sheetNames.some((s) => s.includes("activity") || s.includes("excursion")) ||
          lowerName.includes("activity")
        ) {
          category = "activity";
        } else if (
          sheetNames.some((s) => s.includes("sightseeing") || s.includes("tour")) ||
          lowerName.includes("sightseeing")
        ) {
          category = "sightseeing";
        } else if (sheetNames.some((s) => s.includes("package")) || lowerName.includes("package")) {
          category = "package";
        }
      } catch (detectErr) {
        console.log("Category detection fallback:", detectErr.message);
      }

      switch (category) {
        case "hotel": {
          const result = await processHotelExcel(req.file.path, req.user.id);
          records = sanitizeCount(result);
          blackoutDates = Array.isArray(result?.blackoutDates) ? result.blackoutDates : [];
          break;
        }
        case "transport": {
          const result = await processTransportExcel(req.file.path, req.user.id);
          records = sanitizeCount(result);
          break;
        }
        case "activity": {
          const result = await processActivityExcel(req.file.path, req.user.id);
          records = sanitizeCount(result);
          break;
        }
        case "package": {
          const result = await processPackageExcel(req.file.path, req.user.id);
          records = sanitizeCount(result);
          break;
        }
        case "sightseeing": {
          const result = await processSightseeingExcel(req.file.path, req.user.id);
          records = sanitizeCount(result);
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid category" });
      }
    } else {
      return res.status(400).json({ message: "Only Excel or CSV files are allowed" });
    }

    records = sanitizeCount(records);

    // ✅ SAVE HISTORY
    await UploadHistory.create({
      fileName, // original name
      filePath, // lean path
      category,
      uploadedAuth: req.user.id,
      uploadedBy,
      records,
      blackoutDates,
      status: "success",
    });

    res.json({
      message: blackoutDates.length
        ? `Upload successful. ${blackoutDates.length} blackout date rule(s) imported.`
        : "Upload successful",
      records,
      blackoutDatesImported: blackoutDates.length,
      uploadedBy,
    });
  } catch (error) {
    console.log("ACTUAL ERROR:", error);

    await UploadHistory.create({
      fileName: req.file?.originalname || "unknown",
      filePath: req.file?.filename ? `uploads/${req.file.filename}` : "",
      category: req.body?.category || "general",
      uploadedAuth: req.user?.id,
      uploadedBy: req.user?.name || "Unknown",
      records: 0,
      status: "failed",
    });
    res.status(500).json({ message: error.message, error: error.message });
  }
};


export const getBulkUploadHistory = async (req, res) => {
  try {
    // Optional filter (category wise)
    const { category } = req.query;
    let filter = {};
    if (req.user?.id && req.user?.role !== "admin") {
      filter.uploadedAuth = req.user.id;
    }
    // 👉 category filter
    if (category) { filter.category = category; }
    const uploads = await UploadHistory.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .lean();

    res.status(200).json({ success: true, count: uploads.length, uploads });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const buildDynamicHotelSheetData = async (upload) => {
  const hotelDocs = await Hotel.find({ status: { $ne: "inactive" } })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (!hotelDocs || hotelDocs.length === 0) return null;

  const hotelHeaders = [
    "Service Name",
    "Supplier Name",
    "Hotel Name",
    "Country",
    "City",
    "Hotel Category",
    "Room Category",
    "Bed Type",
    "Extra Bed Type",
    "Max Adults",
    "Max Children",
    "Child Age Limit",
    "Room Type",
    "Meal Plan",
    "A.W.E.B Rate",
    "C.W.E.B Rate",
    "C.Wo.E.B Rate",
    "Currency",
    "Valid From",
    "Valid To",
    "Description",
    "Price",
  ];

  const hotelColumns = hotelHeaders.map((header) => {
    const lower = header.toLowerCase();
    const numeric = /rate|price|amount|pax|capacity|count|id|#|no/i.test(lower);
    const isDesc = /desc|detail|note|remark/i.test(lower);
    return {
      key: header,
      label: header,
      numeric,
      isDesc,
    };
  });

  const hotelRows = [];
  const blackoutDatesMap = new Map();

  hotelDocs.forEach((doc) => {
    const validFromStr = doc.validFrom ? new Date(doc.validFrom).toISOString().split("T")[0] : "";
    const validToStr = doc.validTo ? new Date(doc.validTo).toISOString().split("T")[0] : "";

    (doc.hotels || []).forEach((hotel, hIdx) => {
      (hotel.rooms || []).forEach((room, rIdx) => {
        const isFirstServiceRow = hIdx === 0 && rIdx === 0;
        const isFirstHotelRow = rIdx === 0;

        hotelRows.push({
          _id: `${doc._id}_${hIdx}_${rIdx}`,
          rowIndex: hotelRows.length,
          _serviceName: doc.serviceName || "",
          _city: doc.city || "",
          _country: doc.country || "",
          _hotelName: hotel.hotelName || "",
          _supplierName: hotel.supplierName || doc.supplierName || "",
          "Service Name": isFirstServiceRow ? (doc.serviceName || "") : "",
          "Supplier Name": isFirstHotelRow ? (hotel.supplierName || doc.supplierName || "") : "",
          "Hotel Name": isFirstHotelRow ? (hotel.hotelName || "") : "",
          "Country": isFirstServiceRow ? (doc.country || "") : "",
          "City": isFirstServiceRow ? (doc.city || "") : "",
          "Hotel Category": isFirstHotelRow ? (hotel.hotelCategory || "5 Star") : "",
          "Room Category": room.roomCategory || "Double",
          "Bed Type": room.bedType || "King",
          "Extra Bed Type": room.extraBedType || "None",
          "Max Adults": room.maxAdults !== undefined ? room.maxAdults : 2,
          "Max Children": room.maxChildren !== undefined ? room.maxChildren : 1,
          "Child Age Limit": room.childAgeLimit || "As per hotel policy",
          "Room Type": room.roomType || "Standard Room",
          "Meal Plan": room.mealPlan || "EP",
          "A.W.E.B Rate": room.awebRate || 0,
          "C.W.E.B Rate": room.cwebRate || 0,
          "C.Wo.E.B Rate": room.cwoebRate || 0,
          "Currency": isFirstServiceRow ? (doc.currency || "INR") : "",
          "Valid From": isFirstServiceRow ? validFromStr : "",
          "Valid To": isFirstServiceRow ? validToStr : "",
          "Description": room.description || "",
          "Price": room.price || 0,
        });
      });
    });

    (doc.blackoutDates || []).forEach((bo) => {
      const key = (bo.rawPeriod || bo.startDateKey || "") + "_" + (bo.occasion || "");
      if (key && !blackoutDatesMap.has(key)) {
        blackoutDatesMap.set(key, bo);
      }
    });
  });

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const blackoutHeaders = ["#", "Date / Period", "Day(s)", "Occasion", "Category", "Applicable Region"];
  const blackoutColumns = blackoutHeaders.map((header) => ({
    key: header,
    label: header,
    numeric: header === "#",
  }));

  const blackoutRows = [];
  let boIdx = 1;
  blackoutDatesMap.forEach((bo) => {
    let dayName = "";
    if (bo.startDate) {
      const d = new Date(bo.startDate);
      if (!isNaN(d.getTime())) {
        dayName = daysOfWeek[d.getDay()];
      }
    }
    blackoutRows.push({
      _id: `bo_${boIdx}`,
      rowIndex: boIdx - 1,
      "#": boIdx,
      "Date / Period": bo.rawPeriod || bo.startDateKey || "",
      "Day(s)": dayName || "All Days",
      "Occasion": bo.occasion || "Blackout Event",
      "Category": bo.category || "General",
      "Applicable Region": bo.applicableRegion || "All India & International",
    });
    boIdx++;
  });

  const sheets = {
    "Hotel Data": {
      sheetName: "Hotel Data",
      headers: hotelHeaders,
      columns: hotelColumns,
      rows: hotelRows,
    },
  };

  if (blackoutRows.length > 0) {
    sheets["Blackout Dates"] = {
      sheetName: "Blackout Dates",
      bannerTitle: "🚫  BLACKOUT DATES — Hotel Rates Sheet (2026)",
      bannerSubtitle: "Rates on these dates are NOT applicable. Special pricing / supplements will apply.",
      headers: blackoutHeaders,
      columns: blackoutColumns,
      rows: blackoutRows,
    };
  }

  const sheetNames = Object.keys(sheets);
  const defaultSheet = sheets["Hotel Data"];

  return {
    success: true,
    category: "hotel",
    fileName: upload?.fileName || "Hotel_Rates_Sheet.xlsx",
    sheetNames,
    sheets,
    headers: defaultSheet.headers,
    columns: defaultSheet.columns,
    rows: defaultSheet.rows,
  };
};

const buildDynamicActivitySheetData = async (upload) => {
  const filter = { status: { $ne: "inactive" } };
  if (upload?.uploadedAuth) {
    filter.supplier = upload.uploadedAuth;
  }
  let activityDocs = await Activity.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (!activityDocs || activityDocs.length === 0) {
    activityDocs = await Activity.find({ status: { $ne: "inactive" } })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  if (!activityDocs || activityDocs.length === 0) return null;

  const activityHeaders = [
    "Service Name",
    "Supplier Name",
    "City",
    "Country",
    "Type",
    "Tour Type",
    "Price",
    "Pricing Basis",
    "Max Pax",
    "Currency",
    "Description",
    "Valid From",
    "Valid To",
  ];

  const activityColumns = activityHeaders.map((header) => {
    const lower = header.toLowerCase();
    const numeric = /rate|price|amount|capacity|count|id|#|no/i.test(lower) && !/max\s*pax/i.test(lower);
    const isDesc = /desc|detail|note|remark/i.test(lower);
    const isGroupedMerged = ["Service Name", "Supplier Name", "City", "Country", "Type", "Currency", "Valid From", "Valid To"].includes(header);
    return {
      key: header,
      label: header,
      numeric,
      isDesc,
      isGroupedMerged,
    };
  });

  const activityRows = [];

  activityDocs.forEach((doc) => {
    const validFromStr = doc.validFrom ? new Date(doc.validFrom).toISOString().split("T")[0] : "";
    const validToStr = doc.validTo ? new Date(doc.validTo).toISOString().split("T")[0] : "";
    const tourTypesList = Array.isArray(doc.tourTypes) && doc.tourTypes.length > 0
      ? doc.tourTypes
      : [
          {
            tourType: "Group Tour",
            price: doc.adultPrice || doc.price || 0,
            pricingBasis: "Per Pax",
            maxPax: "N/A (Shared Group)",
            description: doc.description || "",
          },
        ];

    tourTypesList.forEach((tour, tIdx) => {
      const isFirstRow = tIdx === 0;

      activityRows.push({
        _id: `${doc._id}_${tIdx}`,
        rowIndex: activityRows.length,
        _serviceName: doc.serviceName || doc.name || "",
        _city: doc.city || "",
        _country: doc.country || "",
        _supplierName: doc.supplierName || "",
        "Service Name": isFirstRow ? (doc.serviceName || doc.name || "") : "",
        "Supplier Name": isFirstRow ? (doc.supplierName || "") : "",
        "City": isFirstRow ? (doc.city || "") : "",
        "Country": isFirstRow ? (doc.country || "") : "",
        "Type": isFirstRow ? "Activity" : "",
        "Tour Type": tour.tourType || "Group Tour",
        "Price": tour.price !== undefined ? tour.price : 0,
        "Pricing Basis": tour.pricingBasis || "Per Pax",
        "Max Pax": tour.maxPax || (tour.tourType?.toLowerCase().includes("group") && !tour.tourType?.toLowerCase().includes("per group") ? "N/A (Shared Group)" : "Up to 4 Pax"),
        "Currency": isFirstRow ? (doc.currency || "INR") : "",
        "Description": tour.description || doc.description || "",
        "Valid From": isFirstRow ? validFromStr : "",
        "Valid To": isFirstRow ? validToStr : "",
      });
    });
  });

  const sheets = {
    "Activity Rates": {
      sheetName: "Activity Rates",
      headers: activityHeaders,
      columns: activityColumns,
      rows: activityRows,
    },
  };

  const sheetNames = Object.keys(sheets);
  const defaultSheet = sheets["Activity Rates"];

  return {
    success: true,
    category: "activity",
    fileName: upload?.fileName || "Activity_Rates_Sheet.xlsx",
    sheetNames,
    sheets,
    headers: defaultSheet.headers,
    columns: defaultSheet.columns,
    rows: defaultSheet.rows,
  };
};

const buildDynamicSightseeingSheetData = async (upload) => {
  const filter = { status: { $ne: "inactive" } };
  if (upload?.uploadedAuth) {
    filter.supplier = upload.uploadedAuth;
  }
  let sightseeingDocs = await Sightseeing.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (!sightseeingDocs || sightseeingDocs.length === 0) {
    sightseeingDocs = await Sightseeing.find({ status: { $ne: "inactive" } })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  if (!sightseeingDocs || sightseeingDocs.length === 0) return null;

  const sightseeingHeaders = [
    "Service Name",
    "Supplier Name",
    "City",
    "Country",
    "Type",
    "Tour Type",
    "Price",
    "Pricing Basis",
    "Max Pax",
    "Currency",
    "Description",
    "Valid From",
    "Valid To",
  ];

  const sightseeingColumns = sightseeingHeaders.map((header) => {
    const lower = header.toLowerCase();
    const numeric = /rate|price|amount|capacity|count|id|#|no/i.test(lower) && !/max\s*pax/i.test(lower);
    const isDesc = /desc|detail|note|remark/i.test(lower);
    const isGroupedMerged = ["Service Name", "Supplier Name", "City", "Country", "Type", "Currency", "Valid From", "Valid To"].includes(header);
    return {
      key: header,
      label: header,
      numeric,
      isDesc,
      isGroupedMerged,
    };
  });

  const sightseeingRows = [];

  sightseeingDocs.forEach((doc) => {
    const validFromStr = doc.validFrom ? new Date(doc.validFrom).toISOString().split("T")[0] : "";
    const validToStr = doc.validTo ? new Date(doc.validTo).toISOString().split("T")[0] : "";
    const tourTypesList = Array.isArray(doc.tourTypes) && doc.tourTypes.length > 0
      ? doc.tourTypes
      : [
          {
            tourType: "Group Tour",
            price: doc.price || 0,
            pricingBasis: "Per Pax",
            maxPax: "N/A (Shared Group)",
            description: doc.description || "",
          },
        ];

    tourTypesList.forEach((tour, tIdx) => {
      const isFirstRow = tIdx === 0;

      sightseeingRows.push({
        _id: `${doc._id}_${tIdx}`,
        rowIndex: sightseeingRows.length,
        _serviceName: doc.serviceName || doc.name || "",
        _city: doc.city || "",
        _country: doc.country || "",
        _supplierName: doc.supplierName || "",
        "Service Name": isFirstRow ? (doc.serviceName || doc.name || "") : "",
        "Supplier Name": isFirstRow ? (doc.supplierName || "") : "",
        "City": isFirstRow ? (doc.city || "") : "",
        "Country": isFirstRow ? (doc.country || "") : "",
        "Type": isFirstRow ? "Sightseeing" : "",
        "Tour Type": tour.tourType || "Group Tour",
        "Price": tour.price !== undefined ? tour.price : 0,
        "Pricing Basis": tour.pricingBasis || "Per Pax",
        "Max Pax": tour.maxPax || (tour.tourType?.toLowerCase().includes("group") && !tour.tourType?.toLowerCase().includes("per group") ? "N/A (Shared Group)" : "Up to 4 Pax"),
        "Currency": isFirstRow ? (doc.currency || "INR") : "",
        "Description": tour.description || doc.description || "",
        "Valid From": isFirstRow ? validFromStr : "",
        "Valid To": isFirstRow ? validToStr : "",
      });
    });
  });

  const sheets = {
    "Sightseeing Rates": {
      sheetName: "Sightseeing Rates",
      headers: sightseeingHeaders,
      columns: sightseeingColumns,
      rows: sightseeingRows,
    },
  };

  const sheetNames = Object.keys(sheets);
  const defaultSheet = sheets["Sightseeing Rates"];

  return {
    success: true,
    category: "sightseeing",
    fileName: upload?.fileName || "Sightseeing_Rates_Sheet.xlsx",
    sheetNames,
    sheets,
    headers: defaultSheet.headers,
    columns: defaultSheet.columns,
    rows: defaultSheet.rows,
  };
};

export const viewUploadData = async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await UploadHistory.findById(id).lean();
    if (!upload) {
      return res.status(404).json({ success: false, message: "Upload history not found" });
    }

    const category = String(upload.category || "").toLowerCase().trim();

    // 🏨 Dynamic MongoDB Data for Hotels
    if (category === "hotel") {
      const dynamicHotelData = await buildDynamicHotelSheetData(upload);
      if (dynamicHotelData && dynamicHotelData.rows.length > 0) {
        return res.status(200).json(dynamicHotelData);
      }
    }

    // 🏄 Dynamic MongoDB Data for Activities
    if (category === "activity") {
      const dynamicActivityData = await buildDynamicActivitySheetData(upload);
      if (dynamicActivityData && dynamicActivityData.rows.length > 0) {
        return res.status(200).json(dynamicActivityData);
      }
    }

    // 🏛️ Dynamic MongoDB Data for Sightseeing
    if (category === "sightseeing") {
      const dynamicSightseeingData = await buildDynamicSightseeingSheetData(upload);
      if (dynamicSightseeingData && dynamicSightseeingData.rows.length > 0) {
        return res.status(200).json(dynamicSightseeingData);
      }
    }

    const fullPath = path.resolve(upload.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: "Excel file not found on server" });
    }

    const workbook = XLSX.readFile(fullPath);
    const sheetNames = workbook.SheetNames || [];
    const sheets = {};

    if (category === "transport") {
      const firstSheetRaw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { header: 1, defval: "" });
      const groupedTransportPreview = buildTransportGroupedPreview(firstSheetRaw, upload);
      if (groupedTransportPreview) {
        sheets[sheetNames[0] || "Transport Rates"] = groupedTransportPreview;
        return res.status(200).json({
          ...groupedTransportPreview,
          sheetNames: sheetNames.length ? sheetNames : ["Transport Rates"],
          sheets: {
            [sheetNames[0] || "Transport Rates"]: groupedTransportPreview,
          },
        });
      }
    }

    sheetNames.forEach((sName) => {
      const ws = workbook.Sheets[sName];
      if (!ws) return;
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!rawData || !rawData.length) {
        sheets[sName] = { sheetName: sName, headers: [], columns: [], rows: [] };
        return;
      }

      // Check for title/banner rows (e.g. Blackout dates title)
      let headerRowIndex = 0;
      let bannerTitle = "";
      let bannerSubtitle = "";

      if (rawData.length > 2) {
        const r0NonEmpty = (rawData[0] || []).filter((c) => String(c ?? "").trim() !== "").length;
        const r1NonEmpty = (rawData[1] || []).filter((c) => String(c ?? "").trim() !== "").length;
        const r2NonEmpty = (rawData[2] || []).filter((c) => String(c ?? "").trim() !== "").length;
        if (r0NonEmpty <= 2 && r2NonEmpty > r0NonEmpty) {
          bannerTitle = (rawData[0] || []).find((c) => String(c ?? "").trim() !== "") || "";
          bannerSubtitle = (rawData[1] || []).find((c) => String(c ?? "").trim() !== "") || "";
          headerRowIndex = 2;
        }
      }

      const headers = (rawData[headerRowIndex] || []).map((h) => String(h ?? "").trim()).filter(Boolean);
      const rawRowsSlice = rawData.slice(headerRowIndex + 1);
      const rows = [];

      const findHeader = (names) =>
        headers.find((h) =>
          names.some(
            (n) => h.toLowerCase() === n.toLowerCase() || h.toLowerCase().includes(n.toLowerCase())
          )
        );

      const sNameHeader = findHeader(["Service Name"]);
      const supHeader = findHeader(["Supplier Name"]);
      const hNameHeader = findHeader(["Hotel Name"]);
      const countryHeader = findHeader(["Country"]);
      const cityHeader = findHeader(["City"]);

      let currService = "";
      let currCountry = "";
      let currCity = "";
      let currHotel = "";
      let currSupplier = "";

      for (let rowIndex = 0; rowIndex < rawRowsSlice.length; rowIndex += 1) {
        const row = rawRowsSlice[rowIndex] || [];

        const hasAnyContent = row.some(
          (cell) => cell !== undefined && cell !== null && String(cell).trim() !== ""
        );
        if (!hasAnyContent) continue;

        if (sNameHeader && row[headers.indexOf(sNameHeader)]) currService = String(row[headers.indexOf(sNameHeader)]).trim();
        if (countryHeader && row[headers.indexOf(countryHeader)]) currCountry = String(row[headers.indexOf(countryHeader)]).trim();
        if (cityHeader && row[headers.indexOf(cityHeader)]) currCity = String(row[headers.indexOf(cityHeader)]).trim();
        if (hNameHeader && row[headers.indexOf(hNameHeader)]) currHotel = String(row[headers.indexOf(hNameHeader)]).trim();
        if (supHeader && row[headers.indexOf(supHeader)]) currSupplier = String(row[headers.indexOf(supHeader)]).trim();

        const rowData = {};
        headers.forEach((header, index) => {
          if (header) {
            let val = row[index] !== undefined && row[index] !== null ? row[index] : "";
            if (val instanceof Date) {
              val = val.toISOString().split("T")[0];
            }
            rowData[header] = val;
          }
        });

        rows.push({
          _id: `${upload._id}_${sName}_row_${rowIndex}`,
          rowIndex,
          _serviceName: currService,
          _country: currCountry,
          _city: currCity,
          _hotelName: currHotel,
          _supplierName: currSupplier,
          ...rowData,
        });
      }

      const columns = headers.map((header) => {
        const lower = header.toLowerCase();
        const numeric = /rate|price|amount|pax|capacity|count|id|#|no/i.test(lower);
        const isDesc = /desc|detail|note|remark/i.test(lower);
        return {
          key: header,
          label: header,
          numeric,
          isDesc,
        };
      });

      sheets[sName] = {
        sheetName: sName,
        bannerTitle,
        bannerSubtitle,
        headers,
        columns,
        rows,
      };
    });

    const primarySheetName = sheetNames[0] || "Sheet1";
    const defaultSheet = sheets[primarySheetName] || { headers: [], columns: [], rows: [] };

    res.status(200).json({
      success: true,
      category: upload.category,
      fileName: upload.fileName,
      sheetNames,
      sheets,
      headers: defaultSheet.headers,
      columns: defaultSheet.columns,
      rows: defaultSheet.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editSpreadsheetRowAndNotify = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      rowIndex,
      updatedRow = {},
      category,
      sheetName,
      changeReasonType = "",
      changeReasonNote = "",
    } = req.body || {};

    const upload = await UploadHistory.findById(id);
    if (!upload) {
      return res.status(404).json({ success: false, message: "Upload history not found" });
    }

    const fullPath = path.resolve(upload.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: "Excel file not found on server" });
    }

    // 1. Read existing file
    const workbook = XLSX.readFile(fullPath);
    const targetSheetName = sheetName && workbook.Sheets[sheetName] ? sheetName : workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];

    // 2. Parse to raw array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const headers = rawData[0] || [];

    // 3. Update specific row
    const rawRowIndex = Number(rowIndex) + 1;
    const changes = [];
    let originalRowData = {};

    if (!rawData[rawRowIndex]) {
      return res.status(400).json({ success: false, message: "Selected spreadsheet row was not found" });
    }

    if (rawData[rawRowIndex]) {
      const originalRow = [...rawData[rawRowIndex]];
      originalRowData = headers.reduce((accumulator, header, colIndex) => {
        if (header) {
          accumulator[header] = originalRow[colIndex] !== undefined ? originalRow[colIndex] : "";
        }
        return accumulator;
      }, {});
      headers.forEach((header, colIndex) => {
        if (header && updatedRow[header] !== undefined) {
          const originalVal = String(originalRow[colIndex] !== undefined ? originalRow[colIndex] : "").trim();
          const newVal = String(updatedRow[header]).trim();

          if (originalVal !== newVal) {
            changes.push({
              field: String(header || "").trim(),
              from: originalVal,
              to: newVal,
            });
          }
        }
      });
    }

    const reasonValidation = validateRateChangeReason({
      changes,
      reasonType: changeReasonType,
      reasonNote: changeReasonNote,
    });

    if (reasonValidation.error) {
      return res.status(400).json({
        success: false,
        message: reasonValidation.error,
        rateSensitiveFields: reasonValidation.rateSensitiveChanges.map((change) => change.field),
      });
    }

    if (rawData[rawRowIndex]) {
      headers.forEach((header, colIndex) => {
        if (header && updatedRow[header] !== undefined) {
          rawData[rawRowIndex][colIndex] = updatedRow[header];
        }
      });
    }

    // 4. Write back to Excel file
    const newSheet = XLSX.utils.aoa_to_sheet(rawData);
    workbook.Sheets[targetSheetName] = newSheet;
    XLSX.writeFile(workbook, fullPath);

    const serviceSync = await syncEditedRowToServiceCollection({
      category: category || upload.category,
      ownerId: upload.uploadedAuth || req.user.id,
      originalRow: originalRowData,
      updatedRow,
    });

    if (changes.length) {
      upload.changeLog = Array.isArray(upload.changeLog) ? upload.changeLog : [];
      upload.changeLog.push({
        rowIndex: Number(rowIndex) + 1,
        category: category || upload.category || "",
        reasonType: reasonValidation.reasonType || "",
        reasonLabel: reasonValidation.reasonLabel || "",
        reasonNote: reasonValidation.reasonNote || "",
        changedFields: changes.map((change) => `${change.field}: "${change.from}" -> "${change.to}"`),
        editedBy: req.user?.id || req.user?._id || null,
        editedByName: req.user?.companyName || req.user?.name || req.user?.email || "DMC Partner",
        editedAt: new Date(),
      });
      await upload.save();
    }

    // 5. Notify all Admin and Manager users
    const staffUsers = await Auth.find({
      role: { $in: ["admin", "finance_manager", "operation_manager", "operations"] },
      isDeleted: { $ne: true },
      accountStatus: { $ne: "Inactive" }
    }).select("_id");

    const dmcName = req.user?.companyName || req.user?.name || "DMC Partner";
    const notificationTitle = "Contracted Rate Edited by DMC";
    const changeSummary = changes.length > 0
      ? ` Changes: ${changes.map((change) => `${change.field}: "${change.from}" -> "${change.to}"`).join(", ")}`
      : " No field changes detected.";
    const reasonSummary = reasonValidation.required
      ? ` Reason: ${reasonValidation.reasonLabel} - ${reasonValidation.reasonNote}.`
      : "";
    const notificationMsg = `DMC Partner "${dmcName}" edited a row in contracted rate file "${upload.fileName}" (Category: ${category || upload.category}).${changeSummary}${reasonSummary}`;

    if (staffUsers.length) {
      await Notification.insertMany(
        staffUsers.map((user) => ({
          user: user._id,
          type: "info",
          title: notificationTitle,
          message: notificationMsg,
          link: "/dmc/contractedRates",
          meta: {
            uploadId: upload._id,
            fileName: upload.fileName,
            category: category || upload.category,
            editedBy: req.user.id,
            changeReasonType: reasonValidation.reasonType || "",
            changeReasonLabel: reasonValidation.reasonLabel || "",
            changeReasonNote: reasonValidation.reasonNote || "",
            rateSensitiveFields: reasonValidation.rateSensitiveChanges?.map((change) => change.field) || [],
          }
        }))
      );
    }

    res.status(200).json({
      success: true,
      message: serviceSync.matched
        ? "Spreadsheet row and live contracted rate updated successfully!"
        : "Spreadsheet row updated. Live contracted rate was not found for this row.",
      updatedRow,
      serviceSync,
      changeValidation: {
        reasonRequired: Boolean(reasonValidation.required),
        reasonType: reasonValidation.reasonType || "",
        reasonLabel: reasonValidation.reasonLabel || "",
        reasonNote: reasonValidation.reasonNote || "",
        rateSensitiveFields: reasonValidation.rateSensitiveChanges?.map((change) => change.field) || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
