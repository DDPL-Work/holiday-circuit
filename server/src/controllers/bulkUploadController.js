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

  if (serviceNameIndex === -1 || usageTypeIndex === -1 || priceIndex === -1 || currencyIndex === -1) {
    return null;
  }

  const hasGroupedTransportBlocks = rawData.slice(1).some((row, rowOffset) => {
    const rowIndex = rowOffset + 1;
    if (!getMatrixValue(row, serviceNameIndex)) return false;

    const detailRow = rawData[rowIndex + 1] || [];
    const priceRow = rawData[rowIndex + 2] || [];
    const nextServiceBlank = !getMatrixValue(detailRow, serviceNameIndex);
    const detailUsagePresent = [0, 1, 2, 3].some((offset) =>
      Boolean(getMatrixValue(detailRow, usageTypeIndex + offset))
    );
    const detailPricePresent = [0, 1, 2, 3].some((offset) =>
      Boolean(getMatrixValue(priceRow, priceIndex + offset))
    );

    return nextServiceBlank && (detailUsagePresent || detailPricePresent);
  });

  if (!hasGroupedTransportBlocks) {
    return null;
  }

  const columns = [
    { key: "serviceName", label: "Service Name" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "vehicleType", label: "Vehicle Type" },
    { key: "usagePointOneWay", label: "One Way / Airport Transfer" },
    { key: "usagePointInterHotel", label: "Inter Hotel Transfer" },
    { key: "usageHourlyFullDay", label: "Full Day - 80 km / 8 hours" },
    { key: "usageHourlyHalfDay", label: "Half Day - 40 km / 4 hours" },
    { key: "pricePointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "pricePointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "priceHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "priceHourlyFullDayExtraKm", label: "Full Day Extra Per KM", numeric: true },
    { key: "priceHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "priceHourlyHalfDayExtraKm", label: "Half Day Extra Per KM", numeric: true },
    { key: "currency", label: "Currency" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "type", label: "Type" },
    { key: "validFrom", label: "Valid From" },
    { key: "validTo", label: "Valid To" },
    { key: "description", label: "Description", isDesc: true },
    { key: "passengerCapacity", label: "Passenger Capacity", numeric: true },
    { key: "luggageCapacity", label: "Luggage Capacity", numeric: true },
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
      { label: "One Way Price" },
      { label: "Inter Hotel Price" },
      { label: "Full Day Price" },
      { label: "Full Day Extra / KM" },
      { label: "Half Day Price" },
      { label: "Half Day Extra / KM" },
    ],
  ];

  const inferFlatPriceTarget = (baseRow = [], detailRow = []) => {
    const text = [
      getMatrixValue(baseRow, serviceNameIndex),
      getMatrixValue(baseRow, descriptionIndex),
      getMatrixValue(baseRow, usageTypeIndex),
      getMatrixValue(detailRow, usageTypeIndex),
      getMatrixValue(detailRow, usageTypeIndex + 1),
      getMatrixValue(detailRow, usageTypeIndex + 2),
      getMatrixValue(detailRow, usageTypeIndex + 3),
    ].join(" ").toLowerCase();

    if (text.includes("half") || text.includes("4 hour") || text.includes("40 km")) return "priceHourlyHalfDay";
    if (text.includes("full") || text.includes("8 hour") || text.includes("80 km")) return "priceHourlyFullDay";
    if (text.includes("inter hotel")) return "pricePointInterHotel";
    return "pricePointOneWay";
  };

  const groupedPriceColumnCount = Math.max(1, currencyIndex - priceIndex);
  const rows = [];

  for (let rowIndex = 1; rowIndex < rawData.length; rowIndex += 1) {
    const baseRow = rawData[rowIndex] || [];
    if (!getMatrixValue(baseRow, serviceNameIndex)) continue;

    const detailRow = rawData[rowIndex + 1] || [];
    const priceRow = rawData[rowIndex + 2] || [];
    const rowData = {
      _id: `${upload._id}_transport_${rows.length}`,
      rowIndex,
      serviceName: getMatrixValue(baseRow, serviceNameIndex),
      supplierName: getMatrixValue(baseRow, supplierNameIndex),
      vehicleType: getMatrixValue(baseRow, vehicleTypeIndex),
      usagePointOneWay: getMatrixValue(detailRow, usageTypeIndex) || "One Way / Airport Transfer",
      usagePointInterHotel: getMatrixValue(detailRow, usageTypeIndex + 1) || "Inter Hotel Transfer",
      usageHourlyFullDay: getMatrixValue(detailRow, usageTypeIndex + 2) || "Full Day - 80 km / 8 hours",
      usageHourlyHalfDay: getMatrixValue(detailRow, usageTypeIndex + 3) || "Half Day - 40 km / 4 hours",
      pricePointOneWay: "",
      pricePointInterHotel: "",
      priceHourlyFullDay: "",
      priceHourlyFullDayExtraKm: "",
      priceHourlyHalfDay: "",
      priceHourlyHalfDayExtraKm: "",
      currency: getMatrixValue(baseRow, currencyIndex),
      country: getMatrixValue(baseRow, countryIndex),
      city: getMatrixValue(baseRow, cityIndex),
      type: getMatrixValue(baseRow, typeIndex),
      validFrom: getMatrixValue(baseRow, validFromIndex),
      validTo: getMatrixValue(baseRow, validToIndex),
      description: getMatrixValue(baseRow, descriptionIndex),
      passengerCapacity: getMatrixValue(baseRow, passengerCapacityIndex),
      luggageCapacity: getMatrixValue(baseRow, luggageCapacityIndex),
    };

    if (groupedPriceColumnCount >= 6) {
      rowData.pricePointOneWay = getMatrixValue(priceRow, priceIndex) || getMatrixValue(baseRow, priceIndex);
      rowData.pricePointInterHotel = getMatrixValue(priceRow, priceIndex + 1) || getMatrixValue(baseRow, priceIndex + 1);
      rowData.priceHourlyFullDay = getMatrixValue(priceRow, priceIndex + 2) || getMatrixValue(baseRow, priceIndex + 2);
      rowData.priceHourlyFullDayExtraKm = getMatrixValue(priceRow, priceIndex + 3) || getMatrixValue(baseRow, priceIndex + 3);
      rowData.priceHourlyHalfDay = getMatrixValue(priceRow, priceIndex + 4) || getMatrixValue(baseRow, priceIndex + 4);
      rowData.priceHourlyHalfDayExtraKm = getMatrixValue(priceRow, priceIndex + 5) || getMatrixValue(baseRow, priceIndex + 5);
    } else if (groupedPriceColumnCount >= 4) {
      rowData.pricePointOneWay = getMatrixValue(priceRow, priceIndex) || getMatrixValue(baseRow, priceIndex);
      rowData.pricePointInterHotel = getMatrixValue(priceRow, priceIndex + 1) || getMatrixValue(baseRow, priceIndex + 1);
      rowData.priceHourlyFullDay = getMatrixValue(priceRow, priceIndex + 2) || getMatrixValue(baseRow, priceIndex + 2);
      rowData.priceHourlyHalfDay = getMatrixValue(priceRow, priceIndex + 3) || getMatrixValue(baseRow, priceIndex + 3);
    } else {
      rowData[inferFlatPriceTarget(baseRow, detailRow)] = getMatrixValue(baseRow, priceIndex);
    }

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
        name: getCleanString(row, ["Service Name", "Activity Name"]),
      }),
      buildLooseIdentity: (row) => compactObject({
        name: getCleanString(row, ["Service Name", "Activity Name"]),
      }),
      buildUpdate: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name"]),
        supplierName: getCleanString(row, ["Supplier Name"]),
        name: getCleanString(row, ["Service Name", "Activity Name"]),
        country: getCleanString(row, ["Country"]),
        city: getCleanString(row, ["City"]),
        description: getCleanString(row, ["Description", "Service Description", "Activity Description"]),
        adultPrice: getCleanNumber(row, ["Adult Price", "Price"]),
        childPrice: getCleanNumber(row, ["Child Price"]),
        infantPrice: getCleanNumber(row, ["Infant Price"]),
        currency: normalizeCurrency(getCleanString(row, ["Currency"]), "AED"),
        validFrom: parseExcelDate(getCellValue(row, ["Valid From"])),
        validTo: parseExcelDate(getCellValue(row, ["Valid To"])),
      }),
    };
  }

  if (normalizedCategory === "sightseeing") {
    return {
      Model: Sightseeing,
      buildIdentity: (row) => compactObject({
        name: getCleanString(row, ["Sightseeing Name", "Service Name"]),
      }),
      buildLooseIdentity: (row) => compactObject({
        name: getCleanString(row, ["Sightseeing Name", "Service Name"]),
      }),
      buildUpdate: (row) => compactObject({
        serviceName: getCleanString(row, ["Service Name"]),
        supplierName: getCleanString(row, ["Supplier Name"]),
        name: getCleanString(row, ["Sightseeing Name", "Service Name"]),
        country: getCleanString(row, ["Country"]),
        city: getCleanString(row, ["City"]),
        price: getCleanNumber(row, ["Price"]),
        currency: normalizeCurrency(getCleanString(row, ["Currency"]), "USD"),
        description: getCleanString(row, ["Description"]),
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


export const bulkUpload = async (req, res) => {
  try {
    const category = req.body.category
    const fileName = req.file.originalname

    // 🔥 IMPORTANT FIX
    const filePath =`uploads/${req.file.filename}`
    console.log("FILE OBJECT:", req.file)

    const uploadedBy = req.user?.name || req.user?.email || req.user?.id
    const ext = path.extname(fileName).toLowerCase()

    let records = 0
    let blackoutDates = []

    if ([".xlsx", ".xls", ".csv"].includes(ext)) {
      switch (category) {
        case "hotel":
          {
            const result = await processHotelExcel(req.file.path, req.user.id)
            records = Number(result?.records || result || 0)
            blackoutDates = Array.isArray(result?.blackoutDates) ? result.blackoutDates : []
          }
          break
        case "transport":
          records = await processTransportExcel(req.file.path, req.user.id)
          break
        case "activity":
          records = await processActivityExcel(req.file.path, req.user.id)
          break
        case "package":
          records = await processPackageExcel(req.file.path)
          break
        case "sightseeing":
          records = await processSightseeingExcel(req.file.path, req.user.id)
          break
        default:
          return res.status(400).json({ message: "Invalid category" })
      }
    } else {
      return res.status(400).json({ message: "Only Excel or CSV files are allowed" })
    }

    // ✅ SAVE HISTORY
    await UploadHistory.create({
      fileName, // original name
      filePath, // lean path
      category,
      uploadedAuth: req.user.id,
      uploadedBy,
      records,
      blackoutDates,
      status: "success"
    })

    res.json({
      message: blackoutDates.length
        ? `Upload successful. ${blackoutDates.length} blackout date rule(s) imported.`
        : "Upload successful",
      records,
      blackoutDatesImported: blackoutDates.length,
      uploadedBy,
    })

  } catch (error) {
    console.log("ACTUAL ERROR:", error)

    await UploadHistory.create({
      fileName: req.file?.originalname,
      filePath: req.file?.filename ? `uploads/${req.file.filename}` : "",
      category: req.body.category,
      uploadedAuth: req.user?.id,
      uploadedBy: req.user?.name || "Unknown",
      records: 0,
      status: "failed"
    })
    res.status(500).json({ message: error.message, error: error.message })
  }
}


export const getBulkUploadHistory = async (req, res) => {
  try {
    // Optional filter (category wise)
    const { category } = req.query;
    let filter = {};
    if (req.user?.id && req.user?.role !== "admin") {
      filter.uploadedAuth = req.user.id;
    }
    // 👉 category filter
    if (category) {filter.category = category;}
    const uploads = await UploadHistory.find(filter)
    .sort({ createdAt: -1 }) // latest first
    .lean();

    res.status(200).json({success: true,count: uploads.length,uploads});

  } catch (error) {
    res.status(500).json({success: false,message: error.message});
  }
};

export const viewUploadData = async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await UploadHistory.findById(id).lean();
    if (!upload) {
      return res.status(404).json({ success: false, message: "Upload history not found" });
    }

    const fullPath = path.resolve(upload.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: "Excel file not found on server" });
    }

    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse sheet to JSON array
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (String(upload.category || "").toLowerCase() === "transport") {
      const groupedTransportPreview = buildTransportGroupedPreview(rawData, upload);
      if (groupedTransportPreview) {
        return res.status(200).json(groupedTransportPreview);
      }
    }

    const headers = rawData[0] || [];
    const rows = rawData.slice(1).map((row, rowIndex) => {
      const rowData = {};
      headers.forEach((header, index) => {
        if (header) {
          rowData[header] = row[index] !== undefined ? row[index] : "";
        }
      });
      return {
        _id: `${upload._id}_row_${rowIndex}`,
        rowIndex,
        ...rowData
      };
    });

    res.status(200).json({
      success: true,
      category: upload.category,
      fileName: upload.fileName,
      headers: headers.filter(Boolean),
      rows
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
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
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
    workbook.Sheets[sheetName] = newSheet;
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
