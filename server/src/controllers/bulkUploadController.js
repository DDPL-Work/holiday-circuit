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
  const priceIndex = findHeaderIndex(topHeaders, ["Base Price", "Price"]);
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
  const s1ValidFromIndex = findHeaderIndex(topHeaders, ["S1 Valid From", "S1_Valid_From"]);
  const s1ValidToIndex = findHeaderIndex(topHeaders, ["S1 Valid To", "S1_Valid_To"]);
  const s1PriceIndex = findHeaderIndex(topHeaders, ["S1 Price", "S1_Price"]);
  const s1BoIndex = findHeaderIndex(topHeaders, ["S1 Blackout Price", "S1_Blackout_Price"]);
  const s2ValidFromIndex = findHeaderIndex(topHeaders, ["S2 Valid From", "S2_Valid_From"]);
  const s2ValidToIndex = findHeaderIndex(topHeaders, ["S2 Valid To", "S2_Valid_To"]);
  const s2PriceIndex = findHeaderIndex(topHeaders, ["S2 Price", "S2_Price"]);
  const s2BoIndex = findHeaderIndex(topHeaders, ["S2 Blackout Price", "S2_Blackout_Price"]);

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
    { key: "s1ValidFrom", label: "S1 Valid From", isGroupedMerged: true },
    { key: "s1ValidTo", label: "S1 Valid To", isGroupedMerged: true },
    { key: "s1PricePointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s1PricePointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s1PriceHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s1PriceHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "s1BlackoutPointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s1BlackoutPointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s1BlackoutHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s1BlackoutHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "s2ValidFrom", label: "S2 Valid From", isGroupedMerged: true },
    { key: "s2ValidTo", label: "S2 Valid To", isGroupedMerged: true },
    { key: "s2PricePointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s2PricePointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s2PriceHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s2PriceHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "s2BlackoutPointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s2BlackoutPointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s2BlackoutHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s2BlackoutHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
  ];

  const headerRows = [
    [
      { label: "Service Name", rowSpan: 3 },
      { label: "Supplier Name", rowSpan: 3 },
      { label: "Vehicle Type", rowSpan: 3 },
      { label: "Usage Type", colSpan: 4 },
      { label: "Base Price", colSpan: 6 },
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
      { label: "S1 Valid From", rowSpan: 3 },
      { label: "S1 Valid To", rowSpan: 3 },
      { label: "S1 Price", colSpan: 4 },
      { label: "S1 Blackout Price", colSpan: 4 },
      { label: "S2 Valid From", rowSpan: 3 },
      { label: "S2 Valid To", rowSpan: 3 },
      { label: "S2 Price", colSpan: 4 },
      { label: "S2 Blackout Price", colSpan: 4 },
    ],
    [
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 4 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
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
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
    ],
  ];

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
  let currS1Vf = "";
  let currS1Vt = "";
  let currS2Vf = "";
  let currS2Vt = "";

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
    if (s1ValidFromIndex !== -1 && getMatrixValue(row, s1ValidFromIndex)) currS1Vf = String(getMatrixValue(row, s1ValidFromIndex)).trim();
    if (s1ValidToIndex !== -1 && getMatrixValue(row, s1ValidToIndex)) currS1Vt = String(getMatrixValue(row, s1ValidToIndex)).trim();
    if (s2ValidFromIndex !== -1 && getMatrixValue(row, s2ValidFromIndex)) currS2Vf = String(getMatrixValue(row, s2ValidFromIndex)).trim();
    if (s2ValidToIndex !== -1 && getMatrixValue(row, s2ValidToIndex)) currS2Vt = String(getMatrixValue(row, s2ValidToIndex)).trim();

    // Clean emoji from vehicleType
    const rawVehicleType = String(getMatrixValue(row, vehicleTypeIndex) || "");
    const vehicleType = rawVehicleType.replace(/[^\x20-\x7E]/g, "").trim();

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
      s1ValidFrom: currS1Vf,
      s1ValidTo: currS1Vt,
      s1PricePointOneWay: s1PriceIndex !== -1 && row[s1PriceIndex] !== undefined ? row[s1PriceIndex] : "",
      s1PricePointInterHotel: s1PriceIndex !== -1 && row[s1PriceIndex + 1] !== undefined ? row[s1PriceIndex + 1] : "",
      s1PriceHourlyFullDay: s1PriceIndex !== -1 && row[s1PriceIndex + 2] !== undefined ? row[s1PriceIndex + 2] : "",
      s1PriceHourlyHalfDay: s1PriceIndex !== -1 && row[s1PriceIndex + 3] !== undefined ? row[s1PriceIndex + 3] : "",
      s1BlackoutPointOneWay: s1BoIndex !== -1 && row[s1BoIndex] !== undefined ? row[s1BoIndex] : "",
      s1BlackoutPointInterHotel: s1BoIndex !== -1 && row[s1BoIndex + 1] !== undefined ? row[s1BoIndex + 1] : "",
      s1BlackoutHourlyFullDay: s1BoIndex !== -1 && row[s1BoIndex + 2] !== undefined ? row[s1BoIndex + 2] : "",
      s1BlackoutHourlyHalfDay: s1BoIndex !== -1 && row[s1BoIndex + 3] !== undefined ? row[s1BoIndex + 3] : "",
      s2ValidFrom: currS2Vf,
      s2ValidTo: currS2Vt,
      s2PricePointOneWay: s2PriceIndex !== -1 && row[s2PriceIndex] !== undefined ? row[s2PriceIndex] : "",
      s2PricePointInterHotel: s2PriceIndex !== -1 && row[s2PriceIndex + 1] !== undefined ? row[s2PriceIndex + 1] : "",
      s2PriceHourlyFullDay: s2PriceIndex !== -1 && row[s2PriceIndex + 2] !== undefined ? row[s2PriceIndex + 2] : "",
      s2PriceHourlyHalfDay: s2PriceIndex !== -1 && row[s2PriceIndex + 3] !== undefined ? row[s2PriceIndex + 3] : "",
      s2BlackoutPointOneWay: s2BoIndex !== -1 && row[s2BoIndex] !== undefined ? row[s2BoIndex] : "",
      s2BlackoutPointInterHotel: s2BoIndex !== -1 && row[s2BoIndex + 1] !== undefined ? row[s2BoIndex + 1] : "",
      s2BlackoutHourlyFullDay: s2BoIndex !== -1 && row[s2BoIndex + 2] !== undefined ? row[s2BoIndex + 2] : "",
      s2BlackoutHourlyHalfDay: s2BoIndex !== -1 && row[s2BoIndex + 3] !== undefined ? row[s2BoIndex + 3] : "",
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
        extraBedType: getCleanString(row, ["Extra Bed Type", "Extra Bed"]) || "None",
        maxAdults: getCleanNumber(row, ["Max Adults"]) || 2,
        maxChildren: getCleanNumber(row, ["Max Children"]) || 1,
        childAgeLimit: getCleanString(row, ["Child Age Limit", "Child Age"]) || "As per hotel policy",
        roomType: getCleanString(row, ["Room Type"]),
        mealPlan: normalizeMealPlan(getCleanString(row, ["Meal Plan"])),
        price: getCleanNumber(row, ["Base Price", "Price"]),
        basePrice: getCleanNumber(row, ["Base Price", "Price"]),
        awebRate: getCleanNumber(row, ["A.W.E.B Rate", "AWEB Rate", "AWEB"]),
        cwebRate: getCleanNumber(row, ["C.W.E.B Rate", "CWEB Rate", "CWEB"]),
        cwoebRate: getCleanNumber(row, ["C.Wo.E.B Rate", "CWOEB Rate", "CWOEB", "CWOB Rate"]),
        s1ValidFrom: parseExcelDate(getCellValue(row, ["S1 Valid From", "S1_Valid_From"])),
        s1ValidTo: parseExcelDate(getCellValue(row, ["S1 Valid To", "S1_Valid_To"])),
        s1Price: getCleanNumber(row, ["S1 Price", "S1_Price"]),
        s1BlackoutPrice: getCleanNumber(row, ["S1 Blackout Price", "S1_Blackout_Price"]),
        s2ValidFrom: parseExcelDate(getCellValue(row, ["S2 Valid From", "S2_Valid_From"])),
        s2ValidTo: parseExcelDate(getCellValue(row, ["S2 Valid To", "S2_Valid_To"])),
        s2Price: getCleanNumber(row, ["S2 Price", "S2_Price"]),
        s2BlackoutPrice: getCleanNumber(row, ["S2 Blackout Price", "S2_Blackout_Price"]),
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

  if (String(category || "").toLowerCase() === "hotel") {
    const hotelName = getCleanString(updatedRow, ["Hotel Name"]) || getCleanString(originalRow, ["Hotel Name"]);
    const roomType = getCleanString(updatedRow, ["Room Type"]) || getCleanString(originalRow, ["Room Type"]);
    const serviceName = getCleanString(updatedRow, ["Service Name"]) || getCleanString(originalRow, ["Service Name"]);

    const hotelDocs = await Hotel.find({
      supplier: ownerId,
      ...(serviceName ? { $or: [{ serviceName }, { "hotels.hotelName": hotelName }] } : { "hotels.hotelName": hotelName }),
    });

    for (const doc of hotelDocs) {
      let hotelFound = false;
      for (const h of doc.hotels || []) {
        if (!hotelName || h.hotelName.toLowerCase() === hotelName.toLowerCase()) {
          const room = (h.rooms || []).find((r) => !roomType || r.roomType.toLowerCase() === roomType.toLowerCase()) || h.rooms?.[0];
          if (room) {
            if (update.roomCategory) room.roomCategory = update.roomCategory;
            if (update.bedType) room.bedType = update.bedType;
            if (update.extraBedType) room.extraBedType = update.extraBedType;
            if (update.maxAdults !== undefined) room.maxAdults = update.maxAdults;
            if (update.maxChildren !== undefined) room.maxChildren = update.maxChildren;
            if (update.childAgeLimit) room.childAgeLimit = update.childAgeLimit;
            if (update.mealPlan) room.mealPlan = update.mealPlan;
            if (update.price !== undefined) {
              room.price = update.price;
              room.basePrice = update.basePrice || update.price;
            }
            if (update.awebRate !== undefined) room.awebRate = update.awebRate;
            if (update.cwebRate !== undefined) room.cwebRate = update.cwebRate;
            if (update.cwoebRate !== undefined) room.cwoebRate = update.cwoebRate;
            if (update.description !== undefined) room.description = update.description;

            // Update seasons array
            const currentS1 = (room.seasons || []).find((s) => s.seasonName === "S1") || {};
            const currentS2 = (room.seasons || []).find((s) => s.seasonName === "S2") || {};

            const s1Vf = update.s1ValidFrom !== undefined ? update.s1ValidFrom : currentS1.validFrom;
            const s1Vt = update.s1ValidTo !== undefined ? update.s1ValidTo : currentS1.validTo;
            const s1P = update.s1Price !== undefined ? update.s1Price : currentS1.price;
            const s1Bo = update.s1BlackoutPrice !== undefined ? update.s1BlackoutPrice : currentS1.blackoutPrice;

            const s2Vf = update.s2ValidFrom !== undefined ? update.s2ValidFrom : currentS2.validFrom;
            const s2Vt = update.s2ValidTo !== undefined ? update.s2ValidTo : currentS2.validTo;
            const s2P = update.s2Price !== undefined ? update.s2Price : currentS2.price;
            const s2Bo = update.s2BlackoutPrice !== undefined ? update.s2BlackoutPrice : currentS2.blackoutPrice;

            const seasons = [];
            if (s1P > 0 || s1Vf || s1Vt || s1Bo > 0) {
              seasons.push({
                seasonName: "S1",
                validFrom: s1Vf,
                validTo: s1Vt,
                price: s1P || 0,
                blackoutPrice: s1Bo || 0,
              });
            }
            if (s2P > 0 || s2Vf || s2Vt || s2Bo > 0) {
              seasons.push({
                seasonName: "S2",
                validFrom: s2Vf,
                validTo: s2Vt,
                price: s2P || 0,
                blackoutPrice: s2Bo || 0,
              });
            }
            room.seasons = seasons;

            hotelFound = true;
            break;
          }
        }
      }

      if (hotelFound) {
        if (update.country) doc.country = update.country;
        if (update.city) doc.city = update.city;
        if (update.currency) doc.currency = update.currency;
        if (update.validFrom) doc.validFrom = update.validFrom;
        if (update.validTo) doc.validTo = update.validTo;
        await doc.save();
        return { matched: true, modified: true, id: doc._id };
      }
    }
  }

  // 🚗 Transport Hierarchical Sync
  if (normalizedCategory === "transport") {
    const sName = getCleanString(originalRow, ["Service Name", "serviceName", "_serviceName"]) || getCleanString(updatedRow, ["Service Name", "serviceName", "_serviceName"]);
    const supName = getCleanString(originalRow, ["Supplier Name", "supplierName", "_supplierName"]) || getCleanString(updatedRow, ["Supplier Name", "supplierName", "_supplierName"]);
    const vType = getCleanString(originalRow, ["Vehicle Type", "vehicleType", "_vehicleType"]) || getCleanString(updatedRow, ["Vehicle Type", "vehicleType", "_vehicleType"]);

    const searchFilter = { serviceCategory: "transport", status: { $ne: "inactive" } };
    if (sName) searchFilter.serviceName = new RegExp(`^${escapeRegExp(sName)}$`, "i");
    if (supplierFilter.supplier) searchFilter.supplier = supplierFilter.supplier;

    const doc = await Transport.findOne(searchFilter);
    if (doc && Array.isArray(doc.vehicles)) {
      const vIndex = doc.vehicles.findIndex((v) =>
        v.vehicleType && vType && v.vehicleType.toLowerCase().trim() === vType.toLowerCase().trim()
      );

      if (vIndex !== -1) {
        const vehicle = doc.vehicles[vIndex];
        if (update.passengerCapacity !== undefined) vehicle.passengerCapacity = update.passengerCapacity;
        if (update.luggageCapacity !== undefined) vehicle.luggageCapacity = update.luggageCapacity;
        if (update.description !== undefined) vehicle.description = update.description;

        const p2p = vehicle.usageTypes?.pointToPoint || [];
        const oneWay = p2p.find((o) => o.name?.toLowerCase().includes("one way") || o.name?.toLowerCase().includes("airport")) || p2p[0];
        const interHotel = p2p.find((o) => o.name?.toLowerCase().includes("inter hotel")) || p2p[1];

        const hourly = vehicle.usageTypes?.hourly || [];
        const fullDay = hourly.find((o) => o.name?.toLowerCase().includes("full day")) || hourly[0];
        const halfDay = hourly.find((o) => o.name?.toLowerCase().includes("half day")) || hourly[1];

        const updateSeason = (option, sName, priceVal, boPriceVal, vfVal, vtVal) => {
          if (!option) return;
          if (!Array.isArray(option.seasons)) option.seasons = [];
          let s = option.seasons.find((item) => item.seasonName === sName);
          const numPrice = priceVal !== undefined && priceVal !== "" ? Number(priceVal) : undefined;
          const numBo = boPriceVal !== undefined && boPriceVal !== "" ? Number(boPriceVal) : undefined;

          if (!s && ((numPrice && numPrice > 0) || (numBo && numBo > 0) || vfVal || vtVal)) {
            s = { seasonName: sName, validFrom: vfVal, validTo: vtVal, price: numPrice || 0, blackoutPrice: numBo || 0 };
            option.seasons.push(s);
          } else if (s) {
            if (numPrice !== undefined) s.price = numPrice;
            if (numBo !== undefined) s.blackoutPrice = numBo;
            if (vfVal !== undefined) s.validFrom = vfVal;
            if (vtVal !== undefined) s.validTo = vtVal;
          }
        };

        if (oneWay) {
          if (updatedRow["pricePointOneWay"] !== undefined) oneWay.price = Number(updatedRow["pricePointOneWay"]) || 0;
          updateSeason(oneWay, "S1", updatedRow["s1PricePointOneWay"], updatedRow["s1BlackoutPointOneWay"], update.s1ValidFrom, update.s1ValidTo);
          updateSeason(oneWay, "S2", updatedRow["s2PricePointOneWay"], updatedRow["s2BlackoutPointOneWay"], update.s2ValidFrom, update.s2ValidTo);
        }

        if (interHotel) {
          if (updatedRow["pricePointInterHotel"] !== undefined) interHotel.price = Number(updatedRow["pricePointInterHotel"]) || 0;
          updateSeason(interHotel, "S1", updatedRow["s1PricePointInterHotel"], updatedRow["s1BlackoutPointInterHotel"], update.s1ValidFrom, update.s1ValidTo);
          updateSeason(interHotel, "S2", updatedRow["s2PricePointInterHotel"], updatedRow["s2BlackoutPointInterHotel"], update.s2ValidFrom, update.s2ValidTo);
        }

        if (fullDay) {
          if (updatedRow["priceHourlyFullDay"] !== undefined) fullDay.price = Number(updatedRow["priceHourlyFullDay"]) || 0;
          if (updatedRow["priceHourlyFullDayExtraKm"] !== undefined) fullDay.extraPerKmRate = Number(updatedRow["priceHourlyFullDayExtraKm"]) || 0;
          updateSeason(fullDay, "S1", updatedRow["s1PriceHourlyFullDay"], updatedRow["s1BlackoutHourlyFullDay"], update.s1ValidFrom, update.s1ValidTo);
          updateSeason(fullDay, "S2", updatedRow["s2PriceHourlyFullDay"], updatedRow["s2BlackoutHourlyFullDay"], update.s2ValidFrom, update.s2ValidTo);
        }

        if (halfDay) {
          if (updatedRow["priceHourlyHalfDay"] !== undefined) halfDay.price = Number(updatedRow["priceHourlyHalfDay"]) || 0;
          if (updatedRow["priceHourlyHalfDayExtraKm"] !== undefined) halfDay.extraPerKmRate = Number(updatedRow["priceHourlyHalfDayExtraKm"]) || 0;
          updateSeason(halfDay, "S1", updatedRow["s1PriceHourlyHalfDay"], updatedRow["s1BlackoutHourlyHalfDay"], update.s1ValidFrom, update.s1ValidTo);
          updateSeason(halfDay, "S2", updatedRow["s2PriceHourlyHalfDay"], updatedRow["s2BlackoutHourlyHalfDay"], update.s2ValidFrom, update.s2ValidTo);
        }

        if (update.country) doc.country = update.country;
        if (update.city) doc.city = update.city;
        if (update.currency) doc.currency = update.currency;
        if (update.validFrom) doc.validFrom = update.validFrom;
        if (update.validTo) doc.validTo = update.validTo;
        if (update.fullDayNote) doc.fullDayNote = update.fullDayNote;
        if (update.halfDayNote) doc.halfDayNote = update.halfDayNote;

        await doc.save();
        return { matched: true, modified: true, id: doc._id };
      }
    }
  }

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
          blackoutDates = Array.isArray(result?.blackoutDates) ? result.blackoutDates : [];
          break;
        }
        case "activity":
        case "sightseeing": {
          const result = await processActivityExcel(req.file.path, req.user.id);
          records = sanitizeCount(result);
          blackoutDates = Array.isArray(result?.blackoutDates) ? result.blackoutDates : [];
          break;
        }
        case "package": {
          const result = await processPackageExcel(req.file.path, req.user.id);
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
    "Base Price",
    "S1 Valid From",
    "S1 Valid To",
    "S1 Price",
    "S1 Blackout Price",
    "S2 Valid From",
    "S2 Valid To",
    "S2 Price",
    "S2 Blackout Price",
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
        const s1 = (room.seasons || []).find((s) => s.seasonName === "S1") || room.seasons?.[0] || {};
        const s2 = (room.seasons || []).find((s) => s.seasonName === "S2") || room.seasons?.[1] || {};

        const s1ValidFromStr = s1.validFrom ? new Date(s1.validFrom).toISOString().split("T")[0] : "";
        const s1ValidToStr = s1.validTo ? new Date(s1.validTo).toISOString().split("T")[0] : "";
        const s2ValidFromStr = s2.validFrom ? new Date(s2.validFrom).toISOString().split("T")[0] : "";
        const s2ValidToStr = s2.validTo ? new Date(s2.validTo).toISOString().split("T")[0] : "";

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
          "Base Price": room.basePrice || room.price || 0,
          "S1 Valid From": s1ValidFromStr,
          "S1 Valid To": s1ValidToStr,
          "S1 Price": s1.price || 0,
          "S1 Blackout Price": s1.blackoutPrice || 0,
          "S2 Valid From": s2ValidFromStr,
          "S2 Valid To": s2ValidToStr,
          "S2 Price": s2.price || 0,
          "S2 Blackout Price": s2.blackoutPrice || 0,
        });
      });
    });

    (doc.blackoutDates || []).forEach((bo) => {
      const key = (bo.startDateKey || bo.rawPeriod || "") + "_" + (bo.endDateKey || "") + "_" + (bo.blackoutName || bo.occasion || "");
      if (key && !blackoutDatesMap.has(key)) {
        blackoutDatesMap.set(key, bo);
      }
    });
  });

  const blackoutHeaders = [
    "#",
    "Blackout Name",
    "Start Date",
    "End Date",
    "Season",
    "Category",
    "Applicable Region",
    "Rate Action",
  ];
  const blackoutColumns = blackoutHeaders.map((header) => ({
    key: header,
    label: header,
    numeric: header === "#",
  }));

  const blackoutRows = [];
  let boIdx = 1;
  blackoutDatesMap.forEach((bo) => {
    const sDate = bo.startDateKey || (bo.startDate ? new Date(bo.startDate).toISOString().split("T")[0] : bo.rawPeriod || "");
    const eDate = bo.endDateKey || (bo.endDate ? new Date(bo.endDate).toISOString().split("T")[0] : sDate);

    blackoutRows.push({
      _id: `bo_${boIdx}`,
      rowIndex: boIdx - 1,
      "#": boIdx,
      "Blackout Name": bo.blackoutName || bo.occasion || "Blackout Event",
      "Start Date": sDate,
      "End Date": eDate,
      "Season": bo.season || "Season 1",
      "Category": bo.category || "General",
      "Applicable Region": bo.applicableRegion || "All India & International",
      "Rate Action": bo.rateAction || "Black Date Rate",
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

const buildDynamicTransportSheetData = async (upload) => {
  const filter = { status: { $ne: "inactive" } };
  if (upload?.uploadedAuth) {
    filter.supplier = upload.uploadedAuth;
  }
  let transportDocs = await Transport.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (!transportDocs || transportDocs.length === 0) {
    transportDocs = await Transport.find({ status: { $ne: "inactive" } })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  if (!transportDocs || transportDocs.length === 0) return null;

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
    { key: "s1ValidFrom", label: "S1 Valid From", isGroupedMerged: true },
    { key: "s1ValidTo", label: "S1 Valid To", isGroupedMerged: true },
    { key: "s1PricePointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s1PricePointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s1PriceHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s1PriceHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "s1BlackoutPointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s1BlackoutPointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s1BlackoutHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s1BlackoutHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "s2ValidFrom", label: "S2 Valid From", isGroupedMerged: true },
    { key: "s2ValidTo", label: "S2 Valid To", isGroupedMerged: true },
    { key: "s2PricePointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s2PricePointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s2PriceHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s2PriceHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
    { key: "s2BlackoutPointOneWay", label: "One Way / Airport Transfer", numeric: true },
    { key: "s2BlackoutPointInterHotel", label: "Inter Hotel Transfer", numeric: true },
    { key: "s2BlackoutHourlyFullDay", label: "Full Day - 80 km / 8 hours", numeric: true },
    { key: "s2BlackoutHourlyHalfDay", label: "Half Day - 40 km / 4 hours", numeric: true },
  ];

  const headerRows = [
    [
      { label: "Service Name", rowSpan: 3 },
      { label: "Supplier Name", rowSpan: 3 },
      { label: "Vehicle Type", rowSpan: 3 },
      { label: "Usage Type", colSpan: 4 },
      { label: "Base Price", colSpan: 6 },
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
      { label: "S1 Valid From", rowSpan: 3 },
      { label: "S1 Valid To", rowSpan: 3 },
      { label: "S1 Price", colSpan: 4 },
      { label: "S1 Blackout Price", colSpan: 4 },
      { label: "S2 Valid From", rowSpan: 3 },
      { label: "S2 Valid To", rowSpan: 3 },
      { label: "S2 Price", colSpan: 4 },
      { label: "S2 Blackout Price", colSpan: 4 },
    ],
    [
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 4 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
      { label: "Point To Point", colSpan: 2 },
      { label: "Hourly", colSpan: 2 },
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
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
      { label: "One Way / Airport Transfer" },
      { label: "Inter Hotel Transfer" },
      { label: "Full Day - 80 km / 8 hours" },
      { label: "Half Day - 40 km / 4 hours" },
    ],
  ];

  const rows = [];
  const blackoutDatesMap = new Map();

  transportDocs.forEach((doc) => {
    const validFromStr = doc.validFrom ? new Date(doc.validFrom).toISOString().split("T")[0] : "";
    const validToStr = doc.validTo ? new Date(doc.validTo).toISOString().split("T")[0] : "";

    const vehiclesList = Array.isArray(doc.vehicles) && doc.vehicles.length > 0 ? doc.vehicles : [];

    vehiclesList.forEach((v, vIdx) => {
      const isFirstRow = vIdx === 0;

      const p2p = v.usageTypes?.pointToPoint || [];
      const hourly = v.usageTypes?.hourly || [];

      const oneWay = p2p.find((o) => o.name?.toLowerCase().includes("one way") || o.name?.toLowerCase().includes("airport")) || p2p[0] || {};
      const interHotel = p2p.find((o) => o.name?.toLowerCase().includes("inter hotel")) || p2p[1] || {};
      const fullDay = hourly.find((o) => o.name?.toLowerCase().includes("full day")) || hourly[0] || {};
      const halfDay = hourly.find((o) => o.name?.toLowerCase().includes("half day")) || hourly[1] || {};

      const s1OneWay = (oneWay.seasons || []).find((s) => s.seasonName === "S1") || {};
      const s2OneWay = (oneWay.seasons || []).find((s) => s.seasonName === "S2") || {};

      const s1InterHotel = (interHotel.seasons || []).find((s) => s.seasonName === "S1") || {};
      const s2InterHotel = (interHotel.seasons || []).find((s) => s.seasonName === "S2") || {};

      const s1FullDay = (fullDay.seasons || []).find((s) => s.seasonName === "S1") || {};
      const s2FullDay = (fullDay.seasons || []).find((s) => s.seasonName === "S2") || {};

      const s1HalfDay = (halfDay.seasons || []).find((s) => s.seasonName === "S1") || {};
      const s2HalfDay = (halfDay.seasons || []).find((s) => s.seasonName === "S2") || {};

      const s1Vf = s1OneWay.validFrom || s1FullDay.validFrom;
      const s1Vt = s1OneWay.validTo || s1FullDay.validTo;
      const s2Vf = s2OneWay.validFrom || s2FullDay.validFrom;
      const s2Vt = s2OneWay.validTo || s2FullDay.validTo;

      const s1VfStr = s1Vf ? new Date(s1Vf).toISOString().split("T")[0] : "";
      const s1VtStr = s1Vt ? new Date(s1Vt).toISOString().split("T")[0] : "";
      const s2VfStr = s2Vf ? new Date(s2Vf).toISOString().split("T")[0] : "";
      const s2VtStr = s2Vt ? new Date(s2Vt).toISOString().split("T")[0] : "";

      rows.push({
        _id: `${doc._id}_${vIdx}`,
        rowIndex: rows.length,
        _serviceName: doc.serviceName || "",
        _supplierName: doc.supplierName || "",
        _city: doc.city || "",
        _country: doc.country || "",
        _vehicleType: v.vehicleType || "",
        serviceName: isFirstRow ? (doc.serviceName || "") : "",
        supplierName: isFirstRow ? (doc.supplierName || "") : "",
        vehicleType: v.vehicleType || "",
        usagePointOneWay: "One Way / Airport Transfer",
        usagePointInterHotel: "Inter Hotel Transfer",
        usageHourlyFullDay: "Full Day - 80 km / 8 hours",
        usageHourlyHalfDay: "Half Day - 40 km / 4 hours",
        pricePointOneWay: oneWay.price || 0,
        pricePointInterHotel: interHotel.price || 0,
        priceHourlyFullDay: fullDay.price || 0,
        priceHourlyFullDayExtraKm: fullDay.extraPerKmRate || 0,
        priceHourlyHalfDay: halfDay.price || 0,
        priceHourlyHalfDayExtraKm: halfDay.extraPerKmRate || 0,
        currency: doc.currency || "INR",
        country: doc.country || "",
        city: doc.city || "",
        type: "transport",
        validFrom: validFromStr,
        validTo: validToStr,
        description: v.description || "",
        passengerCapacity: v.passengerCapacity || 4,
        luggageCapacity: v.luggageCapacity || 2,
        fullDayNote: doc.fullDayNote || "",
        halfDayNote: doc.halfDayNote || "",
        s1ValidFrom: s1VfStr,
        s1ValidTo: s1VtStr,
        s1PricePointOneWay: s1OneWay.price || 0,
        s1PricePointInterHotel: s1InterHotel.price || 0,
        s1PriceHourlyFullDay: s1FullDay.price || 0,
        s1PriceHourlyHalfDay: s1HalfDay.price || 0,
        s1BlackoutPointOneWay: s1OneWay.blackoutPrice || 0,
        s1BlackoutPointInterHotel: s1InterHotel.blackoutPrice || 0,
        s1BlackoutHourlyFullDay: s1FullDay.blackoutPrice || 0,
        s1BlackoutHourlyHalfDay: s1HalfDay.blackoutPrice || 0,
        s2ValidFrom: s2VfStr,
        s2ValidTo: s2VtStr,
        s2PricePointOneWay: s2OneWay.price || 0,
        s2PricePointInterHotel: s2InterHotel.price || 0,
        s2PriceHourlyFullDay: s2FullDay.price || 0,
        s2PriceHourlyHalfDay: s2HalfDay.price || 0,
        s2BlackoutPointOneWay: s2OneWay.blackoutPrice || 0,
        s2BlackoutPointInterHotel: s2InterHotel.blackoutPrice || 0,
        s2BlackoutHourlyFullDay: s2FullDay.blackoutPrice || 0,
        s2BlackoutHourlyHalfDay: s2HalfDay.blackoutPrice || 0,
      });
    });

    (doc.blackoutDates || []).forEach((bo) => {
      const key = (bo.startDateKey || bo.rawPeriod || "") + "_" + (bo.endDateKey || "") + "_" + (bo.blackoutName || bo.occasion || "");
      if (key && !blackoutDatesMap.has(key)) {
        blackoutDatesMap.set(key, bo);
      }
    });
  });

  const blackoutHeaders = [
    "#",
    "Blackout Name",
    "Start Date",
    "End Date",
    "Season",
    "Category",
    "Applicable Region",
    "Rate Action",
  ];
  const blackoutColumns = blackoutHeaders.map((header) => ({
    key: header,
    label: header,
    numeric: header === "#",
  }));

  const blackoutRows = [];
  let boIdx = 1;
  blackoutDatesMap.forEach((bo) => {
    const sDate = bo.startDateKey || (bo.startDate ? new Date(bo.startDate).toISOString().split("T")[0] : bo.rawPeriod || "");
    const eDate = bo.endDateKey || (bo.endDate ? new Date(bo.endDate).toISOString().split("T")[0] : sDate);

    blackoutRows.push({
      _id: `bo_${boIdx}`,
      rowIndex: boIdx - 1,
      "#": boIdx,
      "Blackout Name": bo.blackoutName || bo.occasion || "Blackout Event",
      "Start Date": sDate,
      "End Date": eDate,
      "Season": bo.season || "Season 1",
      "Category": bo.category || "General",
      "Applicable Region": bo.applicableRegion || "All India & International",
      "Rate Action": bo.rateAction || "Black Date Rate",
    });
    boIdx++;
  });

  const sheets = {
    "Transport Rates": {
      sheetName: "Transport Rates",
      headers: columns.map((c) => c.label),
      columns,
      headerRows,
      rows,
    },
  };

  if (blackoutRows.length > 0) {
    sheets["Blackout Dates"] = {
      sheetName: "Blackout Dates",
      bannerTitle: "🚫  BLACKOUT DATES — Transport Rates Sheet (2026)",
      bannerSubtitle: "Rates on these dates are NOT applicable. Special pricing / supplements will apply.",
      headers: blackoutHeaders,
      columns: blackoutColumns,
      rows: blackoutRows,
    };
  }

  const sheetNames = Object.keys(sheets);
  const defaultSheet = sheets["Transport Rates"];

  return {
    success: true,
    category: "transport",
    fileName: upload?.fileName || "Transport_Rates_Sheet.xlsx",
    sheetNames,
    sheets,
    headers: defaultSheet.headers,
    columns: defaultSheet.columns,
    headerRows: defaultSheet.headerRows,
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
    "Operating Days",
    "Open Time",
    "Close Time",
    "Duration (Mins)",
    "Slots",
    "Tour Type",
    "Adult Price",
    "Child Price",
    "Currency",
    "Description",
    "S1 Valid From",
    "S1 Valid To",
    "S1 Adult Price",
    "S1 Child Price",
    "S1 Blackout Adult Price",
    "S1 Blackout Child Price",
    "S2 Valid From",
    "S2 Valid To",
    "S2 Adult Price",
    "S2 Child Price",
    "S2 Blackout Adult Price",
    "S2 Blackout Child Price",
  ];

  const activityColumns = activityHeaders.map((header) => {
    const lower = header.toLowerCase();
    const numeric = /rate|price|amount|capacity|count|id|#|no/i.test(lower) && !/max\s*pax/i.test(lower);
    const isDesc = /desc|detail|note|remark/i.test(lower);
    const isGroupedMerged = [
      "Service Name",
      "Supplier Name",
      "City",
      "Country",
      "Type",
      "Operating Days",
      "Open Time",
      "Close Time",
      "Duration (Mins)",
      "Slots",
      "Currency",
    ].includes(header);
    return {
      key: header,
      label: header,
      numeric,
      isDesc,
      isGroupedMerged,
    };
  });

  const activityRows = [];
  const blackoutDatesMap = new Map();

  activityDocs.forEach((doc) => {
    const tourTypesList = Array.isArray(doc.tourTypes) && doc.tourTypes.length > 0
      ? doc.tourTypes
      : [
          {
            tourType: "Sharing Tour",
            price: doc.adultPrice || doc.price || 0,
            adultPrice: doc.adultPrice || doc.price || 0,
            childPrice: doc.childPrice || 0,
            pricingBasis: "Per Pax",
            maxPax: "N/A (Shared Group)",
            description: doc.description || "",
            seasons: [],
          },
        ];

    tourTypesList.forEach((tour, tIdx) => {
      const isFirstRow = tIdx === 0;
      const s1 = (tour.seasons || []).find((s) => s.seasonName === "S1") || {};
      const s2 = (tour.seasons || []).find((s) => s.seasonName === "S2") || {};

      const s1VfStr = s1.validFrom ? new Date(s1.validFrom).toISOString().split("T")[0] : "";
      const s1VtStr = s1.validTo ? new Date(s1.validTo).toISOString().split("T")[0] : "";
      const s2VfStr = s2.validFrom ? new Date(s2.validFrom).toISOString().split("T")[0] : "";
      const s2VtStr = s2.validTo ? new Date(s2.validTo).toISOString().split("T")[0] : "";

      const adultPrice = tour.adultPrice !== undefined ? tour.adultPrice : (tour.price || 0);
      const childPrice = tour.childPrice !== undefined ? tour.childPrice : 0;

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
        "Operating Days": isFirstRow ? (doc.operatingDays || "Mon-Sun") : "",
        "Open Time": isFirstRow ? (doc.openingTime || "08:00") : "",
        "Close Time": isFirstRow ? (doc.closingTime || "18:00") : "",
        "Duration (Mins)": isFirstRow ? (doc.duration || "") : "",
        "Slots": isFirstRow ? (doc.slots || "") : "",
        "Tour Type": tour.tourType || "Sharing Tour",
        "Adult Price": adultPrice,
        "Child Price": childPrice,
        "Currency": isFirstRow ? (doc.currency || "INR") : "",
        "Description": tour.description || doc.description || "",
        "S1 Valid From": s1VfStr,
        "S1 Valid To": s1VtStr,
        "S1 Adult Price": s1.adultPrice !== undefined ? s1.adultPrice : (s1.price || 0),
        "S1 Child Price": s1.childPrice !== undefined ? s1.childPrice : 0,
        "S1 Blackout Adult Price": s1.adultBlackoutPrice !== undefined ? s1.adultBlackoutPrice : (s1.blackoutPrice || 0),
        "S1 Blackout Child Price": s1.childBlackoutPrice !== undefined ? s1.childBlackoutPrice : 0,
        "S2 Valid From": s2VfStr,
        "S2 Valid To": s2VtStr,
        "S2 Adult Price": s2.adultPrice !== undefined ? s2.adultPrice : (s2.price || 0),
        "S2 Child Price": s2.childPrice !== undefined ? s2.childPrice : 0,
        "S2 Blackout Adult Price": s2.adultBlackoutPrice !== undefined ? s2.adultBlackoutPrice : (s2.blackoutPrice || 0),
        "S2 Blackout Child Price": s2.childBlackoutPrice !== undefined ? s2.childBlackoutPrice : 0,
      });
    });

    (doc.blackoutDates || []).forEach((bo) => {
      const key = (bo.startDateKey || bo.rawPeriod || "") + "_" + (bo.endDateKey || "") + "_" + (bo.blackoutName || bo.occasion || "");
      if (key && !blackoutDatesMap.has(key)) {
        blackoutDatesMap.set(key, bo);
      }
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

  if (blackoutDatesMap.size > 0) {
    const blackoutHeaders = ["#", "Blackout Name", "Start Date", "End Date", "Season", "Category", "Applicable Region", "Rate Action"];
    const blackoutColumns = blackoutHeaders.map((h) => ({ key: h, label: h, numeric: h === "#" }));
    const blackoutRows = [];
    let bIdx = 1;
    blackoutDatesMap.forEach((bo) => {
      const sDate = bo.startDateKey || (bo.startDate ? new Date(bo.startDate).toISOString().split("T")[0] : bo.rawPeriod || "");
      const eDate = bo.endDateKey || (bo.endDate ? new Date(bo.endDate).toISOString().split("T")[0] : sDate);
      blackoutRows.push({
        _id: `bo_${bIdx}`,
        rowIndex: bIdx - 1,
        "#": bIdx,
        "Blackout Name": bo.blackoutName || bo.occasion || "Blackout Event",
        "Start Date": sDate,
        "End Date": eDate,
        "Season": bo.season || "Season 1",
        "Category": bo.category || "General",
        "Applicable Region": bo.applicableRegion || "All India & International",
        "Rate Action": bo.rateAction || "Black Date Rate",
      });
      bIdx++;
    });
    sheets["Blackout Dates"] = {
      sheetName: "Blackout Dates",
      bannerTitle: "🚫 BLACKOUT DATES — Activity Rates Sheet",
      bannerSubtitle: "Rates on these dates are NOT applicable. Special pricing / supplements apply.",
      headers: blackoutHeaders,
      columns: blackoutColumns,
      rows: blackoutRows,
    };
  }

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
    "Operating Days",
    "Open Time",
    "Close Time",
    "Duration (Mins)",
    "Slots",
    "Tour Type",
    "Adult Price",
    "Child Price",
    "Currency",
    "Description",
    "S1 Valid From",
    "S1 Valid To",
    "S1 Adult Price",
    "S1 Child Price",
    "S1 Blackout Adult Price",
    "S1 Blackout Child Price",
    "S2 Valid From",
    "S2 Valid To",
    "S2 Adult Price",
    "S2 Child Price",
    "S2 Blackout Adult Price",
    "S2 Blackout Child Price",
  ];

  const sightseeingColumns = sightseeingHeaders.map((header) => {
    const lower = header.toLowerCase();
    const numeric = /rate|price|amount|capacity|count|id|#|no/i.test(lower) && !/max\s*pax/i.test(lower);
    const isDesc = /desc|detail|note|remark/i.test(lower);
    const isGroupedMerged = [
      "Service Name",
      "Supplier Name",
      "City",
      "Country",
      "Type",
      "Operating Days",
      "Open Time",
      "Close Time",
      "Duration (Mins)",
      "Slots",
      "Currency",
    ].includes(header);
    return {
      key: header,
      label: header,
      numeric,
      isDesc,
      isGroupedMerged,
    };
  });

  const sightseeingRows = [];
  const blackoutDatesMap = new Map();

  sightseeingDocs.forEach((doc) => {
    const tourTypesList = Array.isArray(doc.tourTypes) && doc.tourTypes.length > 0
      ? doc.tourTypes
      : [
          {
            tourType: "Sharing Tour",
            price: doc.adultPrice || doc.price || 0,
            adultPrice: doc.adultPrice || doc.price || 0,
            childPrice: doc.childPrice || 0,
            pricingBasis: "Per Pax",
            maxPax: "N/A (Shared Group)",
            description: doc.description || "",
            seasons: [],
          },
        ];

    tourTypesList.forEach((tour, tIdx) => {
      const isFirstRow = tIdx === 0;
      const s1 = (tour.seasons || []).find((s) => s.seasonName === "S1") || {};
      const s2 = (tour.seasons || []).find((s) => s.seasonName === "S2") || {};

      const s1VfStr = s1.validFrom ? new Date(s1.validFrom).toISOString().split("T")[0] : "";
      const s1VtStr = s1.validTo ? new Date(s1.validTo).toISOString().split("T")[0] : "";
      const s2VfStr = s2.validFrom ? new Date(s2.validFrom).toISOString().split("T")[0] : "";
      const s2VtStr = s2.validTo ? new Date(s2.validTo).toISOString().split("T")[0] : "";

      const adultPrice = tour.adultPrice !== undefined ? tour.adultPrice : (tour.price || 0);
      const childPrice = tour.childPrice !== undefined ? tour.childPrice : 0;

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
        "Operating Days": isFirstRow ? (doc.operatingDays || "Mon-Sun") : "",
        "Open Time": isFirstRow ? (doc.openingTime || "08:00") : "",
        "Close Time": isFirstRow ? (doc.closingTime || "18:00") : "",
        "Duration (Mins)": isFirstRow ? (doc.duration || "") : "",
        "Slots": isFirstRow ? (doc.slots || "") : "",
        "Tour Type": tour.tourType || "Sharing Tour",
        "Adult Price": adultPrice,
        "Child Price": childPrice,
        "Currency": isFirstRow ? (doc.currency || "INR") : "",
        "Description": tour.description || doc.description || "",
        "S1 Valid From": s1VfStr,
        "S1 Valid To": s1VtStr,
        "S1 Adult Price": s1.adultPrice !== undefined ? s1.adultPrice : (s1.price || 0),
        "S1 Child Price": s1.childPrice !== undefined ? s1.childPrice : 0,
        "S1 Blackout Adult Price": s1.adultBlackoutPrice !== undefined ? s1.adultBlackoutPrice : (s1.blackoutPrice || 0),
        "S1 Blackout Child Price": s1.childBlackoutPrice !== undefined ? s1.childBlackoutPrice : 0,
        "S2 Valid From": s2VfStr,
        "S2 Valid To": s2VtStr,
        "S2 Adult Price": s2.adultPrice !== undefined ? s2.adultPrice : (s2.price || 0),
        "S2 Child Price": s2.childPrice !== undefined ? s2.childPrice : 0,
        "S2 Blackout Adult Price": s2.adultBlackoutPrice !== undefined ? s2.adultBlackoutPrice : (s2.blackoutPrice || 0),
        "S2 Blackout Child Price": s2.childBlackoutPrice !== undefined ? s2.childBlackoutPrice : 0,
      });
    });

    (doc.blackoutDates || []).forEach((bo) => {
      const key = (bo.startDateKey || bo.rawPeriod || "") + "_" + (bo.endDateKey || "") + "_" + (bo.blackoutName || bo.occasion || "");
      if (key && !blackoutDatesMap.has(key)) {
        blackoutDatesMap.set(key, bo);
      }
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

  if (blackoutDatesMap.size > 0) {
    const blackoutHeaders = ["#", "Blackout Name", "Start Date", "End Date", "Season", "Category", "Applicable Region", "Rate Action"];
    const blackoutColumns = blackoutHeaders.map((h) => ({ key: h, label: h, numeric: h === "#" }));
    const blackoutRows = [];
    let bIdx = 1;
    blackoutDatesMap.forEach((bo) => {
      const sDate = bo.startDateKey || (bo.startDate ? new Date(bo.startDate).toISOString().split("T")[0] : bo.rawPeriod || "");
      const eDate = bo.endDateKey || (bo.endDate ? new Date(bo.endDate).toISOString().split("T")[0] : sDate);
      blackoutRows.push({
        _id: `bo_${bIdx}`,
        rowIndex: bIdx - 1,
        "#": bIdx,
        "Blackout Name": bo.blackoutName || bo.occasion || "Blackout Event",
        "Start Date": sDate,
        "End Date": eDate,
        "Season": bo.season || "Season 1",
        "Category": bo.category || "General",
        "Applicable Region": bo.applicableRegion || "All India & International",
        "Rate Action": bo.rateAction || "Black Date Rate",
      });
      bIdx++;
    });
    sheets["Blackout Dates"] = {
      sheetName: "Blackout Dates",
      bannerTitle: "🚫 BLACKOUT DATES — Sightseeing Rates Sheet",
      bannerSubtitle: "Rates on these dates are NOT applicable. Special pricing / supplements apply.",
      headers: blackoutHeaders,
      columns: blackoutColumns,
      rows: blackoutRows,
    };
  }

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

    // 1. If original uploaded file exists on disk, read directly to preserve 100% exact excel structure
    const fullPath = upload.filePath ? path.resolve(upload.filePath) : null;
    if (fullPath && fs.existsSync(fullPath)) {
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
              const isDateCol = /valid\s*from|valid\s*to|start\s*date|end\s*date|date/i.test(String(header || ""));
              if (val instanceof Date && !isNaN(val.getTime())) {
                const y = val.getFullYear();
                const m = String(val.getMonth() + 1).padStart(2, "0");
                const d = String(val.getDate()).padStart(2, "0");
                val = `${y}-${m}-${d}`;
              } else if (typeof val === "number" && (isDateCol || (val > 25569 && val < 60000))) {
                const p = XLSX.SSF.parse_date_code(val);
                if (p && p.y && p.m && p.d) {
                  val = `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
                }
              } else if (typeof val === "string" && isDateCol && /^\d{5}$/.test(val.trim())) {
                const p = XLSX.SSF.parse_date_code(Number(val.trim()));
                if (p && p.y && p.m && p.d) {
                  val = `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
                }
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
          const isDate = /valid\s*from|valid\s*to|start\s*date|end\s*date|date/i.test(lower);
          const numeric = !isDate && /rate|price|amount|pax|capacity|count|id|#|no/i.test(lower);
          const isDesc = /desc|detail|note|remark/i.test(lower);
          return {
            key: header,
            label: header,
            numeric,
            isDate,
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

      return res.status(200).json({
        success: true,
        category: upload.category,
        fileName: upload.fileName,
        sheetNames,
        sheets,
        headers: defaultSheet.headers,
        columns: defaultSheet.columns,
        rows: defaultSheet.rows,
      });
    }

    // 2. Fallback to Dynamic MongoDB Data if physical file is not on server
    if (category === "hotel") {
      const dynamicHotelData = await buildDynamicHotelSheetData(upload);
      if (dynamicHotelData && dynamicHotelData.rows.length > 0) {
        return res.status(200).json(dynamicHotelData);
      }
    }

    if (category === "transport") {
      const dynamicTransportData = await buildDynamicTransportSheetData(upload);
      if (dynamicTransportData && dynamicTransportData.rows.length > 0) {
        return res.status(200).json(dynamicTransportData);
      }
    }

    if (category === "activity") {
      const dynamicActivityData = await buildDynamicActivitySheetData(upload);
      if (dynamicActivityData && dynamicActivityData.rows.length > 0) {
        return res.status(200).json(dynamicActivityData);
      }
    }

    if (category === "sightseeing") {
      const dynamicSightseeingData = await buildDynamicSightseeingSheetData(upload);
      if (dynamicSightseeingData && dynamicSightseeingData.rows.length > 0) {
        return res.status(200).json(dynamicSightseeingData);
      }
    }

    return res.status(404).json({ success: false, message: "Excel file and database inventory not found on server" });
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
