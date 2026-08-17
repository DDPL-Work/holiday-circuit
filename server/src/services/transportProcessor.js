import XLSX from "xlsx";
import Transport from "../models/transferDmc.model.js";

const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "THB", "GBP", "IDR", "SGD", "MYR", "EGP"]);

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "INR";
  return allowedCurrencies.has(normalized) ? normalized : "INR";
};

const parseExcelDate = (val, fallback = new Date("2026-04-01")) => {
  if (!val) return fallback;
  if (val instanceof Date) return isNaN(val.getTime()) ? fallback : val;
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? fallback : d;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? fallback : parsed;
};

export const processTransportExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes("transport")) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (!rawRows || rawRows.length < 2) {
    return 0;
  }

  const topHeaders = (rawRows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const findIdx = (names) => topHeaders.findIndex((h) => names.some((n) => h.includes(n.toLowerCase())));

  const sNameIdx = findIdx(["service name"]);
  const supNameIdx = findIdx(["supplier name"]);
  const vTypeIdx = findIdx(["vehicle type"]);
  const priceIdx = findIdx(["price"]);
  const currIdx = findIdx(["currency"]);
  const countryIdx = findIdx(["country"]);
  const cityIdx = findIdx(["city"]);
  const vfIdx = findIdx(["valid from"]);
  const vtIdx = findIdx(["valid to"]);
  const descIdx = findIdx(["description"]);
  const paxIdx = findIdx(["passenger"]);
  const lugIdx = findIdx(["luggage"]);
  const fullNoteIdx = findIdx(["full day note"]);
  const halfNoteIdx = findIdx(["half day note"]);

  let startRow = 3;
  if (rawRows.length <= 3) startRow = 1;

  let currService = "";
  let currSupplier = "";
  let currCountry = "India";
  let currCity = "New Delhi";
  let currCurrency = "INR";
  let currValidFrom = new Date("2026-04-01");
  let currValidTo = new Date("2026-12-31");
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
    if (vfIdx !== -1 && row[vfIdx]) currValidFrom = parseExcelDate(row[vfIdx]);
    if (vtIdx !== -1 && row[vtIdx]) currValidTo = parseExcelDate(row[vtIdx]);
    if (fullNoteIdx !== -1 && row[fullNoteIdx]) currFullNote = String(row[fullNoteIdx]).trim();
    if (halfNoteIdx !== -1 && row[halfNoteIdx]) currHalfNote = String(row[halfNoteIdx]).trim();

    const rawVehicleType = String(row[vTypeIdx] || "");
    const vehicleType = rawVehicleType.replace(/[^\x20-\x7E]/g, "").trim();
    if (!vehicleType && !currService) continue;

    const serviceKey = currService || currSupplier;
    if (!serviceDocsMap.has(serviceKey)) {
      serviceDocsMap.set(serviceKey, {
        serviceName: currService || "Transport Service",
        supplierName: currSupplier,
        supplier: ownerId,
        country: currCountry || "India",
        city: currCity || "New Delhi",
        serviceCategory: "transport",
        currency: normalizeCurrency(currCurrency),
        validFrom: currValidFrom,
        validTo: currValidTo,
        fullDayNote: currFullNote,
        halfDayNote: currHalfNote,
        status: "active",
        vehicles: [],
      });
    }

    const pOneWay = Number(row[priceIdx]) || 0;
    const pInterHotel = Number(row[priceIdx + 1]) || 0;
    const pFullDay = Number(row[priceIdx + 2]) || 0;
    const pFullDayExtraKm = Number(row[priceIdx + 3]) || 0;
    const pHalfDay = Number(row[priceIdx + 4]) || 0;
    const pHalfDayExtraKm = Number(row[priceIdx + 5]) || 0;

    const pointToPointOptions = [
      {
        name: "One Way / Airport Transfer",
        usageType: "point-to-point",
        price: pOneWay,
        extraPerKmRate: 0,
      },
      {
        name: "Inter Hotel Transfer",
        usageType: "point-to-point",
        price: pInterHotel,
        extraPerKmRate: 0,
      },
    ];

    const hourlyOptions = [
      {
        name: "Full Day - 80 km / 8 hours",
        usageType: "full-day",
        price: pFullDay,
        extraPerKmRate: pFullDayExtraKm,
      },
      {
        name: "Half Day - 40 km / 4 hours",
        usageType: "half-day",
        price: pHalfDay,
        extraPerKmRate: pHalfDayExtraKm,
      },
    ];

    const serviceDoc = serviceDocsMap.get(serviceKey);
    serviceDoc.vehicles.push({
      vehicleType,
      passengerCapacity: Number(row[paxIdx]) || 4,
      luggageCapacity: Number(row[lugIdx]) || 2,
      description: descIdx !== -1 ? String(row[descIdx] || "").trim() : "",
      usageTypes: {
        pointToPoint: pointToPointOptions,
        hourly: hourlyOptions,
      },
    });
  }

  const finalDocs = Array.from(serviceDocsMap.values());

  if (finalDocs.length > 0) {
    const batchSize = 100;
    for (let b = 0; b < finalDocs.length; b += batchSize) {
      const batch = finalDocs.slice(b, b + batchSize);
      await Transport.insertMany(batch, { ordered: false });
    }
  }

  return finalDocs.length;
};
