import XLSX from "xlsx";
import Transport from "../models/transferDmc.model.js";
import { parseBlackoutDatesFromWorkbook, normalizeDateOnly } from "../utils/blackoutDates.js";

const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "THB", "GBP", "IDR", "SGD", "MYR", "EGP"]);

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "INR";
  return allowedCurrencies.has(normalized) ? normalized : "INR";
};

const parseExcelDate = (val, fallback = null) => {
  if (!val) return fallback;
  const parsed = normalizeDateOnly(val);
  return parsed && !isNaN(parsed.getTime()) ? parsed : fallback;
};

export const processTransportExcel = async (filePath, ownerId, providedWorkbook = null, sourceUpload = null) => {
  const workbook = providedWorkbook || XLSX.readFile(filePath);
  const blackoutDates = parseBlackoutDatesFromWorkbook(workbook);

  const sheetName =
    workbook.SheetNames.find((s) => s.toLowerCase().includes("transport") || s.toLowerCase().includes("transfer")) ||
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (!rawRows || rawRows.length < 2) {
    return { records: 0, count: 0, blackoutDates };
  }

  // Forward-propagate row 0 and row 1 merged headers
  const colCount = Math.max(...rawRows.slice(0, 5).map((r) => (Array.isArray(r) ? r.length : 0)));
  const colHeaders = [];

  let lastH0 = "";
  let lastH1 = "";

  for (let c = 0; c < colCount; c++) {
    const cell0 = String(rawRows[0]?.[c] || "").trim();
    const cell1 = String(rawRows[1]?.[c] || "").trim();
    const cell2 = String(rawRows[2]?.[c] || "").trim();

    if (cell0) lastH0 = cell0;
    if (cell1) lastH1 = cell1;

    const h0 = cell0 || lastH0;
    const h1 = cell1 || lastH1;
    const h2 = cell2;

    const combined = `${h0} | ${h1} | ${h2}`.toLowerCase();
    colHeaders.push({ c, h0, h1, h2, combined });
  }

  const findCol = (predicate, fallback = -1) => {
    const found = colHeaders.find(predicate);
    return found ? found.c : fallback;
  };

  const sNameIdx = findCol((h) => h.combined.includes("service name"), 0);
  const supNameIdx = findCol((h) => h.combined.includes("supplier name"), 1);
  const vTypeIdx = findCol((h) => h.combined.includes("vehicle type"), 2);
  const currIdx = findCol((h) => h.combined.includes("currency"), 13);
  const countryIdx = findCol((h) => h.combined.includes("country"), 14);
  const cityIdx = findCol((h) => h.combined.includes("city"), 15);
  const vfIdx = findCol((h) => h.combined.includes("valid from") && !h.combined.includes("s1") && !h.combined.includes("s2"), 17);
  const vtIdx = findCol((h) => h.combined.includes("valid to") && !h.combined.includes("s1") && !h.combined.includes("s2"), 18);
  const descIdx = findCol((h) => h.combined.includes("description"), 19);
  const paxIdx = findCol((h) => h.combined.includes("passenger"), 20);
  const lugIdx = findCol((h) => h.combined.includes("luggage"), 21);
  const fullNoteIdx = findCol((h) => h.combined.includes("full day note"), 22);
  const halfNoteIdx = findCol((h) => h.combined.includes("half day note"), 23);

  // Base Prices (Point-to-Point & Hourly)
  let baseOneWayIdx = findCol((h) => (h.combined.includes("base price") || h.combined.includes("price")) && (h.combined.includes("one way") || h.combined.includes("airport")) && !h.combined.includes("s1") && !h.combined.includes("s2"), 7);
  let baseInterHotelIdx = findCol((h) => (h.combined.includes("base price") || h.combined.includes("price")) && h.combined.includes("inter hotel") && !h.combined.includes("s1") && !h.combined.includes("s2"), 8);
  let baseFullDayIdx = findCol((h) => (h.combined.includes("base price") || h.combined.includes("price")) && h.combined.includes("full day") && !h.combined.includes("s1") && !h.combined.includes("s2") && !h.combined.includes("extra per km"), 9);
  let baseFullDayExtraKmIdx = findCol((h) => (h.combined.includes("base price") || h.combined.includes("price")) && h.combined.includes("extra per km") && !h.combined.includes("half day") && !h.combined.includes("s1") && !h.combined.includes("s2"), 10);
  let baseHalfDayIdx = findCol((h) => (h.combined.includes("base price") || h.combined.includes("price")) && h.combined.includes("half day") && !h.combined.includes("s1") && !h.combined.includes("s2") && !h.combined.includes("extra per km"), 11);
  let baseHalfDayExtraKmIdx = findCol((h) => (h.combined.includes("base price") || h.combined.includes("price")) && h.combined.includes("extra per km") && h.c > (baseHalfDayIdx !== -1 ? baseHalfDayIdx - 1 : 10) && !h.combined.includes("s1") && !h.combined.includes("s2"), 12);

  // Season 1 Validity & Prices
  const s1VfIdx = findCol((h) => h.combined.includes("s1 valid from") || (h.combined.includes("s1") && h.combined.includes("valid from")), 24);
  const s1VtIdx = findCol((h) => h.combined.includes("s1 valid to") || (h.combined.includes("s1") && h.combined.includes("valid to")), 25);
  const s1PriceOneWayIdx = findCol((h) => h.combined.includes("s1 price") && (h.combined.includes("one way") || h.combined.includes("airport")), 26);
  const s1PriceInterHotelIdx = findCol((h) => h.combined.includes("s1 price") && h.combined.includes("inter hotel"), 27);
  const s1PriceFullDayIdx = findCol((h) => h.combined.includes("s1 price") && h.combined.includes("full day"), 28);
  const s1PriceHalfDayIdx = findCol((h) => h.combined.includes("s1 price") && h.combined.includes("half day"), 29);

  const s1BoOneWayIdx = findCol((h) => (h.combined.includes("s1 blackout") || h.combined.includes("s1 blackout price")) && (h.combined.includes("one way") || h.combined.includes("airport")), 30);
  const s1BoInterHotelIdx = findCol((h) => (h.combined.includes("s1 blackout") || h.combined.includes("s1 blackout price")) && h.combined.includes("inter hotel"), 31);
  const s1BoFullDayIdx = findCol((h) => (h.combined.includes("s1 blackout") || h.combined.includes("s1 blackout price")) && h.combined.includes("full day"), 32);
  const s1BoHalfDayIdx = findCol((h) => (h.combined.includes("s1 blackout") || h.combined.includes("s1 blackout price")) && h.combined.includes("half day"), 33);

  // Season 2 Validity & Prices
  const s2VfIdx = findCol((h) => h.combined.includes("s2 valid from") || (h.combined.includes("s2") && h.combined.includes("valid from")), 34);
  const s2VtIdx = findCol((h) => h.combined.includes("s2 valid to") || (h.combined.includes("s2") && h.combined.includes("valid to")), 35);
  const s2PriceOneWayIdx = findCol((h) => h.combined.includes("s2 price") && (h.combined.includes("one way") || h.combined.includes("airport")), 36);
  const s2PriceInterHotelIdx = findCol((h) => h.combined.includes("s2 price") && h.combined.includes("inter hotel"), 37);
  const s2PriceFullDayIdx = findCol((h) => h.combined.includes("s2 price") && h.combined.includes("full day"), 38);
  const s2PriceHalfDayIdx = findCol((h) => h.combined.includes("s2 price") && h.combined.includes("half day"), 39);

  const s2BoOneWayIdx = findCol((h) => (h.combined.includes("s2 blackout") || h.combined.includes("s2 blackout price")) && (h.combined.includes("one way") || h.combined.includes("airport")), 40);
  const s2BoInterHotelIdx = findCol((h) => (h.combined.includes("s2 blackout") || h.combined.includes("s2 blackout price")) && h.combined.includes("inter hotel"), 41);
  const s2BoFullDayIdx = findCol((h) => (h.combined.includes("s2 blackout") || h.combined.includes("s2 blackout price")) && h.combined.includes("full day"), 42);
  const s2BoHalfDayIdx = findCol((h) => (h.combined.includes("s2 blackout") || h.combined.includes("s2 blackout price")) && h.combined.includes("half day"), 43);

  let startRow = 3;
  if (rawRows.length <= 3) startRow = 1;

  let currService = "";
  let currSupplier = "";
  let currCountry = "India";
  let currCity = "New Delhi";
  let currCurrency = "INR";
  let currValidFrom = new Date("2026-01-01T00:00:00.000Z");
  let currValidTo = new Date("2026-12-31T00:00:00.000Z");
  let currFullNote = "";
  let currHalfNote = "";

  const serviceDocsMap = new Map();

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    if (sNameIdx !== -1 && row[sNameIdx]) currService = String(row[sNameIdx]).trim();
    if (supNameIdx !== -1 && row[supNameIdx]) currSupplier = String(row[supNameIdx]).trim();
    if (countryIdx !== -1 && row[countryIdx]) currCountry = String(row[countryIdx]).trim();
    if (cityIdx !== -1 && row[cityIdx]) currCity = String(row[cityIdx]).trim();
    if (currIdx !== -1 && row[currIdx]) currCurrency = String(row[currIdx]).trim();
    if (vfIdx !== -1 && row[vfIdx]) currValidFrom = parseExcelDate(row[vfIdx], currValidFrom);
    if (vtIdx !== -1 && row[vtIdx]) currValidTo = parseExcelDate(row[vtIdx], currValidTo);
    if (fullNoteIdx !== -1 && row[fullNoteIdx]) currFullNote = String(row[fullNoteIdx]).trim();
    if (halfNoteIdx !== -1 && row[halfNoteIdx]) currHalfNote = String(row[halfNoteIdx]).trim();

    const rawVehicleType = String(row[vTypeIdx !== -1 ? vTypeIdx : 2] || "");
    const vehicleType = rawVehicleType.replace(/[^\x20-\x7E]/g, "").trim();
    if (!vehicleType && !currService) continue;

    const serviceKey = `${currService || "Transport Service"}__${currSupplier}`;
    if (!serviceDocsMap.has(serviceKey)) {
      serviceDocsMap.set(serviceKey, {
        serviceName: currService || "Transport Service",
        supplierName: currSupplier,
        supplier: ownerId,
        sourceUpload,
        country: currCountry || "India",
        city: currCity || "New Delhi",
        serviceCategory: "transport",
        currency: normalizeCurrency(currCurrency),
        validFrom: currValidFrom,
        validTo: currValidTo,
        fullDayNote: currFullNote,
        halfDayNote: currHalfNote,
        blackoutDates: blackoutDates || [],
        status: "active",
        vehicles: [],
      });
    }

    // Base Prices
    const pOneWay = Number(row[baseOneWayIdx]) || 0;
    const pInterHotel = Number(row[baseInterHotelIdx]) || 0;
    const pFullDay = Number(row[baseFullDayIdx]) || 0;
    const pFullDayExtraKm = Number(row[baseFullDayExtraKmIdx]) || 0;
    const pHalfDay = Number(row[baseHalfDayIdx]) || 0;
    const pHalfDayExtraKm = Number(row[baseHalfDayExtraKmIdx]) || 0;

    // Season 1 Validity & Prices
    const s1ValidFrom = s1VfIdx !== -1 && row[s1VfIdx] ? parseExcelDate(row[s1VfIdx], null) : null;
    const s1ValidTo = s1VtIdx !== -1 && row[s1VtIdx] ? parseExcelDate(row[s1VtIdx], null) : null;
    const s1PriceOneWay = s1PriceOneWayIdx !== -1 ? Number(row[s1PriceOneWayIdx]) || 0 : 0;
    const s1PriceInterHotel = s1PriceInterHotelIdx !== -1 ? Number(row[s1PriceInterHotelIdx]) || 0 : 0;
    const s1PriceFullDay = s1PriceFullDayIdx !== -1 ? Number(row[s1PriceFullDayIdx]) || 0 : 0;
    const s1PriceHalfDay = s1PriceHalfDayIdx !== -1 ? Number(row[s1PriceHalfDayIdx]) || 0 : 0;

    const s1BoOneWay = s1BoOneWayIdx !== -1 ? Number(row[s1BoOneWayIdx]) || 0 : 0;
    const s1BoInterHotel = s1BoInterHotelIdx !== -1 ? Number(row[s1BoInterHotelIdx]) || 0 : 0;
    const s1BoFullDay = s1BoFullDayIdx !== -1 ? Number(row[s1BoFullDayIdx]) || 0 : 0;
    const s1BoHalfDay = s1BoHalfDayIdx !== -1 ? Number(row[s1BoHalfDayIdx]) || 0 : 0;

    // Season 2 Validity & Prices
    const s2ValidFrom = s2VfIdx !== -1 && row[s2VfIdx] ? parseExcelDate(row[s2VfIdx], null) : null;
    const s2ValidTo = s2VtIdx !== -1 && row[s2VtIdx] ? parseExcelDate(row[s2VtIdx], null) : null;
    const s2PriceOneWay = s2PriceOneWayIdx !== -1 ? Number(row[s2PriceOneWayIdx]) || 0 : 0;
    const s2PriceInterHotel = s2PriceInterHotelIdx !== -1 ? Number(row[s2PriceInterHotelIdx]) || 0 : 0;
    const s2PriceFullDay = s2PriceFullDayIdx !== -1 ? Number(row[s2PriceFullDayIdx]) || 0 : 0;
    const s2PriceHalfDay = s2PriceHalfDayIdx !== -1 ? Number(row[s2PriceHalfDayIdx]) || 0 : 0;

    const s2BoOneWay = s2BoOneWayIdx !== -1 ? Number(row[s2BoOneWayIdx]) || 0 : 0;
    const s2BoInterHotel = s2BoInterHotelIdx !== -1 ? Number(row[s2BoInterHotelIdx]) || 0 : 0;
    const s2BoFullDay = s2BoFullDayIdx !== -1 ? Number(row[s2BoFullDayIdx]) || 0 : 0;
    const s2BoHalfDay = s2BoHalfDayIdx !== -1 ? Number(row[s2BoHalfDayIdx]) || 0 : 0;

    // Build Seasons for Each Option
    const buildSeasons = (s1P, s1Bo, s2P, s2Bo) => {
      const list = [];
      if (s1P > 0 || s1ValidFrom || s1ValidTo || s1Bo > 0) {
        list.push({
          seasonName: "S1",
          validFrom: s1ValidFrom,
          validTo: s1ValidTo,
          price: s1P,
          blackoutPrice: s1Bo,
        });
      }
      if (s2P > 0 || s2ValidFrom || s2ValidTo || s2Bo > 0) {
        list.push({
          seasonName: "S2",
          validFrom: s2ValidFrom,
          validTo: s2ValidTo,
          price: s2P,
          blackoutPrice: s2Bo,
        });
      }
      return list;
    };

    const pointToPointOptions = [
      {
        name: "One Way / Airport Transfer",
        usageType: "point-to-point",
        price: pOneWay,
        extraPerKmRate: 0,
        seasons: buildSeasons(s1PriceOneWay, s1BoOneWay, s2PriceOneWay, s2BoOneWay),
      },
      {
        name: "Inter Hotel Transfer",
        usageType: "point-to-point",
        price: pInterHotel,
        extraPerKmRate: 0,
        seasons: buildSeasons(s1PriceInterHotel, s1BoInterHotel, s2PriceInterHotel, s2BoInterHotel),
      },
    ];

    const hourlyOptions = [
      {
        name: "Full Day - 80 km / 8 hours",
        usageType: "full-day",
        price: pFullDay,
        extraPerKmRate: pFullDayExtraKm,
        seasons: buildSeasons(s1PriceFullDay, s1BoFullDay, s2PriceFullDay, s2BoFullDay),
      },
      {
        name: "Half Day - 40 km / 4 hours",
        usageType: "half-day",
        price: pHalfDay,
        extraPerKmRate: pHalfDayExtraKm,
        seasons: buildSeasons(s1PriceHalfDay, s1BoHalfDay, s2PriceHalfDay, s2BoHalfDay),
      },
    ];

    const serviceDoc = serviceDocsMap.get(serviceKey);
    serviceDoc.vehicles.push({
      vehicleType,
      passengerCapacity: Number(row[paxIdx !== -1 ? paxIdx : 20]) || 4,
      luggageCapacity: Number(row[lugIdx !== -1 ? lugIdx : 21]) || 2,
      description: descIdx !== -1 ? String(row[descIdx] || "").trim() : "",
      usageTypes: {
        pointToPoint: pointToPointOptions,
        hourly: hourlyOptions,
      },
    });
  }

  const finalDocs = Array.from(serviceDocsMap.values());

  if (finalDocs.length > 0) {
    const serviceNames = finalDocs.map((d) => d.serviceName).filter(Boolean);
    if (serviceNames.length > 0) {
      const deleteFilter = { serviceName: { $in: serviceNames } };
      if (ownerId) {
        deleteFilter.supplier = ownerId;
      }
      await Transport.deleteMany(deleteFilter);
    }

    // Fewer database round trips for large supplier workbooks, while keeping
    // each insert safely below MongoDB's command-size limits.
    const batchSize = 500;
    for (let b = 0; b < finalDocs.length; b += batchSize) {
      const batch = finalDocs.slice(b, b + batchSize);
      await Transport.insertMany(batch, { ordered: false });
    }
  }

  return { records: finalDocs.length, count: finalDocs.length, blackoutDates: blackoutDates || [] };
};
