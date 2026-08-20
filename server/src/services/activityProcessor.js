import XLSX from "xlsx";
import Activity from "../models/activityDmc.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js";
import { parseBlackoutDatesFromWorkbook } from "../utils/blackoutDates.js";

const parseExcelDate = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === "number" && Number.isFinite(val)) {
    const p = XLSX.SSF.parse_date_code(val);
    if (p && p.y && p.m && p.d) {
      return new Date(Date.UTC(p.y, p.m - 1, p.d));
    }
  }
  const str = String(val).trim();
  if (!str) return null;
  if (/^\d{5}$/.test(str)) {
    const p = XLSX.SSF.parse_date_code(Number(str));
    if (p && p.y && p.m && p.d) {
      return new Date(Date.UTC(p.y, p.m - 1, p.d));
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatTimeValue = (val, fallback = "") => {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "number") {
    if (val > 0 && val < 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      const mins = String(totalMinutes % 60).padStart(2, "0");
      return `${hours}:${mins}`;
    }
    if (val >= 1 && val <= 24) {
      return `${String(Math.floor(val)).padStart(2, "0")}:00`;
    }
  }
  const str = String(val).trim();
  if (!str) return fallback;
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return str;
};

const formatSlotsValue = (val, fallback = "") => {
  if (val === undefined || val === null || val === "") return fallback;
  const str = String(val).trim();
  if (!str) return fallback;
  if (str.includes(",") || str.includes(";")) {
    const parts = str.split(/[,;]/).map((p) => formatTimeValue(p.trim())).filter(Boolean);
    return parts.join(", ");
  }
  return formatTimeValue(str, fallback);
};

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized || "INR";
};

export const processActivityExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath);

  // Extract blackout dates if blackout sheet exists
  const blackoutDates = parseBlackoutDatesFromWorkbook(workbook);

  // Use the main rates sheet (first non-blackout sheet)
  const mainSheetName =
    workbook.SheetNames.find((name) => !String(name || "").toLowerCase().includes("blackout")) ||
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[mainSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const normalizedRows = rawRows.map((row) => {
    const nextRow = {};
    Object.keys(row || {}).forEach((key) => {
      nextRow[String(key || "").trim()] = row[key];
    });
    return nextRow;
  });

  const activityGroups = new Map();
  const sightseeingGroups = new Map();

  let currServiceName = "";
  let currSupplierName = "";
  let currCountry = "";
  let currCity = "";
  let currCategory = "activity";
  let currCurrency = "INR";
  let currValidFrom = null;
  let currValidTo = null;
  let currOperatingDays = "Mon-Sun";
  let currOpeningTime = "08:00";
  let currClosingTime = "18:00";
  let currDuration = "";
  let currSlots = "";

  for (const row of normalizedRows) {
    const isRowEmpty = Object.values(row).every(
      (v) => v === undefined || v === null || String(v).trim() === ""
    );
    if (isRowEmpty) continue;

    // 1. Forward-fill Service Name, Supplier, Location
    const rowServiceName = String(
      row["Service Name"] || row["Activity Name"] || row["Sightseeing Name"] || ""
    ).trim();
    if (rowServiceName) currServiceName = rowServiceName;

    const rowSupplierName = String(row["Supplier Name"] || "").trim();
    if (rowSupplierName) currSupplierName = rowSupplierName;

    const rowCountry = String(row["Country"] || "").trim();
    if (rowCountry) currCountry = rowCountry;

    const rowCity = String(row["City"] || "").trim();
    if (rowCity) currCity = rowCity;

    if (!currServiceName && !currCountry) continue;

    // 2. Forward-fill Service Category ("Activity" vs "Sightseeing")
    const rawCat = String(
      row["Service Category"] ||
      row["Service_Category"] ||
      row["Category"] ||
      row["Service Type"] ||
      row["Type"] ||
      row["Activity/Sightseeing"] ||
      ""
    ).toLowerCase().trim();

    if (rawCat) {
      currCategory = rawCat.includes("sightseeing") ? "sightseeing" : "activity";
    }

    // 3. Forward-fill timings, currency, dates
    if (row["Currency"]) currCurrency = normalizeCurrency(row["Currency"]);
    if (row["Valid From"]) currValidFrom = parseExcelDate(row["Valid From"]) || currValidFrom;
    if (row["Valid To"]) currValidTo = parseExcelDate(row["Valid To"]) || currValidTo;
    if (row["Operating Days"] || row["Days"]) currOperatingDays = String(row["Operating Days"] || row["Days"]).trim();
    
    const rawOpen = row["Open Time"] || row["Opening Time"] || row["Open"] || row["Opening_Time"] || "";
    if (rawOpen) currOpeningTime = formatTimeValue(rawOpen, currOpeningTime);

    const rawClose = row["Close Time"] || row["Closing Time"] || row["Close"] || row["Closing_Time"] || "";
    if (rawClose) currClosingTime = formatTimeValue(rawClose, currClosingTime);

    const rawDuration = row["Duration (Mins)"] || row["Duration"] || row["Duration(Mins)"] || row["Duration (mins)"] || "";
    if (rawDuration) currDuration = String(rawDuration).trim();

    const rawSlots = row["Slots"] || row["Slot"] || row["Time Slots"] || row["Time_Slots"] || "";
    if (rawSlots) currSlots = formatSlotsValue(rawSlots, String(rawSlots).trim());

    const targetCategory = currCategory === "sightseeing" ? "sightseeing" : "activity";
    const targetMap = targetCategory === "sightseeing" ? sightseeingGroups : activityGroups;
    const groupKey = `${currServiceName}_${currCity}_${currCountry}`.toLowerCase();

    if (!targetMap.has(groupKey)) {
      targetMap.set(groupKey, {
        serviceName: currServiceName,
        supplier: ownerId,
        supplierName: currSupplierName,
        country: currCountry,
        city: currCity,
        serviceCategory: targetCategory,
        currency: currCurrency || "INR",
        validFrom: currValidFrom || new Date("2026-01-01"),
        validTo: currValidTo || new Date("2026-12-31"),
        operatingDays: currOperatingDays || "Mon-Sun",
        openingTime: currOpeningTime || "08:00",
        closingTime: currClosingTime || "18:00",
        duration: currDuration || "",
        slots: currSlots || "",
        status: "active",
        blackoutDates: blackoutDates || [],
        tourTypes: [],
      });
    }

    const serviceDoc = targetMap.get(groupKey);

    // Update timing and metadata if present on this specific row
    if (row["Valid From"]) serviceDoc.validFrom = parseExcelDate(row["Valid From"]) || serviceDoc.validFrom;
    if (row["Valid To"]) serviceDoc.validTo = parseExcelDate(row["Valid To"]) || serviceDoc.validTo;
    if (row["Currency"]) serviceDoc.currency = normalizeCurrency(row["Currency"]);
    if (row["Supplier Name"] && !serviceDoc.supplierName) serviceDoc.supplierName = currSupplierName;
    if (row["Operating Days"] || row["Days"]) serviceDoc.operatingDays = String(row["Operating Days"] || row["Days"]).trim();
    if (rawOpen) serviceDoc.openingTime = formatTimeValue(rawOpen, serviceDoc.openingTime);
    if (rawClose) serviceDoc.closingTime = formatTimeValue(rawClose, serviceDoc.closingTime);
    if (rawDuration) serviceDoc.duration = String(rawDuration).trim();
    if (rawSlots) serviceDoc.slots = formatSlotsValue(rawSlots, serviceDoc.slots);

    const tourTypeRaw = String(row["Tour Type"] || "").trim();
    const tourType = tourTypeRaw || (serviceDoc.tourTypes.length === 0 ? "Group Tour" : `Option ${serviceDoc.tourTypes.length + 1}`);

    const rawAdultPrice = Number(row["Adult Price"] ?? row["Price"] ?? 0) || 0;
    const rawChildPrice = Number(row["Child Price"] ?? 0) || 0;

    const pricingBasis = String(
      row["Pricing Basis"] ||
        (tourType.toLowerCase().includes("group") && !tourType.toLowerCase().includes("per group")
          ? "Per Pax"
          : "Per Group")
    ).trim() || "Per Pax";

    const maxPaxRaw = String(row["Max Pax"] || row["Max Capacity"] || row["Pax"] || "").trim();
    let maxPax = maxPaxRaw;
    if (!maxPax) {
      if (/group\s*tour/i.test(tourType)) {
        maxPax = "N/A (Shared Group)";
      } else if (/private/i.test(tourType)) {
        maxPax = "Up to 4 Pax";
      } else if (/premium|vip/i.test(tourType)) {
        maxPax = "Up to 6 Pax";
      } else {
        maxPax = pricingBasis.toLowerCase().includes("pax") ? "N/A (Shared Group)" : "Up to 4 Pax";
      }
    }

    const description = String(
      row["Description"] || row["Service Description"] || row["Activity Description"] || ""
    ).trim();

    // S1 Seasons Parsing
    const s1Vf = parseExcelDate(row["S1 Valid From"]) || currValidFrom;
    const s1Vt = parseExcelDate(row["S1 Valid To"]) || currValidTo;
    const s1AdultPrice = Number(row["S1 Adult Price"] ?? row["S1 Price"] ?? 0) || 0;
    const s1AdultBlackoutPrice = Number(row["S1 Adult Blackout Price"] ?? row["S1 Blackout Price"] ?? 0) || 0;
    const s1ChildPrice = Number(row["S1 Child Price"] ?? 0) || 0;
    const s1ChildBlackoutPrice = Number(row["S1 Child Blackout Price"] ?? 0) || 0;

    // S2 Seasons Parsing
    const s2Vf = parseExcelDate(row["S2 Valid From"]) || currValidFrom;
    const s2Vt = parseExcelDate(row["S2 Valid To"]) || currValidTo;
    const s2AdultPrice = Number(row["S2 Adult Price"] ?? row["S2 Price"] ?? 0) || 0;
    const s2AdultBlackoutPrice = Number(row["S2 Adult Blackout Price"] ?? row["S2 Blackout Price"] ?? 0) || 0;
    const s2ChildPrice = Number(row["S2 Child Price"] ?? 0) || 0;
    const s2ChildBlackoutPrice = Number(row["S2 Child Blackout Price"] ?? 0) || 0;

    const seasons = [];
    if (s1AdultPrice > 0 || s1Vf || s1Vt || s1AdultBlackoutPrice > 0) {
      seasons.push({
        seasonName: "S1",
        validFrom: s1Vf,
        validTo: s1Vt,
        price: s1AdultPrice,
        adultPrice: s1AdultPrice,
        adultBlackoutPrice: s1AdultBlackoutPrice,
        childPrice: s1ChildPrice,
        childBlackoutPrice: s1ChildBlackoutPrice,
        blackoutPrice: s1AdultBlackoutPrice || s1AdultPrice,
      });
    }

    if (s2AdultPrice > 0 || s2Vf || s2Vt || s2AdultBlackoutPrice > 0) {
      seasons.push({
        seasonName: "S2",
        validFrom: s2Vf,
        validTo: s2Vt,
        price: s2AdultPrice,
        adultPrice: s2AdultPrice,
        adultBlackoutPrice: s2AdultBlackoutPrice,
        childPrice: s2ChildPrice,
        childBlackoutPrice: s2ChildBlackoutPrice,
        blackoutPrice: s2AdultBlackoutPrice || s2AdultPrice,
      });
    }

    serviceDoc.tourTypes.push({
      tourType,
      price: rawAdultPrice,
      adultPrice: rawAdultPrice,
      childPrice: rawChildPrice,
      pricingBasis,
      maxPax,
      description,
      seasons,
    });
  }

  const activityData = Array.from(activityGroups.values());
  const sightseeingData = Array.from(sightseeingGroups.values());

  if (activityData.length > 0) {
    await Activity.bulkWrite(
      activityData.map((item) => ({
        updateOne: {
          filter: {
            supplier: ownerId,
            serviceName: item.serviceName,
            city: item.city,
            country: item.country,
          },
          update: {
            $set: item,
            $unset: {
              name: "",
              price: "",
              description: "",
            },
          },
          upsert: true,
        },
      }))
    );
  }

  if (sightseeingData.length > 0) {
    await Sightseeing.bulkWrite(
      sightseeingData.map((item) => ({
        updateOne: {
          filter: {
            supplier: ownerId,
            serviceName: item.serviceName,
            city: item.city,
            country: item.country,
          },
          update: {
            $set: item,
            $unset: {
              name: "",
              price: "",
              description: "",
            },
          },
          upsert: true,
        },
      }))
    );
  }

  const totalCount = activityData.length + sightseeingData.length;
  return {
    count: totalCount,
    activityCount: activityData.length,
    sightseeingCount: sightseeingData.length,
    blackoutDates,
  };
};

export const processSightseeingExcel = processActivityExcel;
