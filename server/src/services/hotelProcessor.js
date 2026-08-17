import XLSX from "xlsx";
import Hotel from "../models/hotelDmc.model.js";
import { parseBlackoutDatesFromWorkbook } from "../utils/blackoutDates.js";

const allowedMealPlans = new Set(["EP", "CP", "MAP", "AP", "AI"]);
const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"]);

const normalizeMealPlan = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "EP";
  if (allowedMealPlans.has(normalized)) return normalized;
  if (normalized.includes("MAP")) return "MAP";
  if (normalized.includes("AP")) return "AP";
  if (normalized.includes("CP")) return "CP";
  return "EP";
};

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "INR";
  return allowedCurrencies.has(normalized) ? normalized : "INR";
};

const normalizeBedType = (value) => {
  const str = String(value || "").trim().toLowerCase();
  if (str.includes("queen")) return "Queen";
  if (str.includes("twin")) return "Twin";
  if (str.includes("king")) return "King";
  return "King";
};

const getHotelCategory = (catStr = "", hotelNameStr = "") => {
  const category = String(catStr || "").toLowerCase();

  if (category.includes("5")) return "5 Star";
  if (category.includes("4")) return "4 Star";
  if (category.includes("3")) return "3 Star";
  if (category.includes("luxury")) return "Luxury";

  const name = String(hotelNameStr || "").toLowerCase();
  if (name.includes("luxury") || name.includes("palace") || name.includes("leela") || name.includes("taj") || name.includes("oberoi")) return "5 Star";
  if (name.includes("resort") || name.includes("hyatt") || name.includes("marriott") || name.includes("radisson")) return "4 Star";

  return "3 Star";
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

export const processHotelExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes("hotel")) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const blackoutDates = parseBlackoutDatesFromWorkbook(workbook);

  if (!aoa || aoa.length < 2) {
    return { records: 0, blackoutDates: [] };
  }

  // Find header row indices dynamically
  const headers = (aoa[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const findIdx = (names) => headers.findIndex((h) => names.some((n) => h.includes(n.toLowerCase())));

  const sNameIdx = findIdx(["service name"]);
  const supNameIdx = findIdx(["supplier name"]);
  const hNameIdx = findIdx(["hotel name"]);
  const countryIdx = findIdx(["country"]);
  const cityIdx = findIdx(["city"]);
  const hCatIdx = findIdx(["hotel category"]);
  const rCatIdx = findIdx(["room category"]);
  const bedIdx = findIdx(["bed type"]);
  const extraBedIdx = findIdx(["extra bed"]);
  const maxAdultsIdx = findIdx(["max adults"]);
  const maxChildrenIdx = findIdx(["max children"]);
  const childAgeIdx = findIdx(["child age"]);
  const rTypeIdx = findIdx(["room type"]);
  const mealIdx = findIdx(["meal plan"]);
  const awebIdx = findIdx(["a.w.e.b", "aweb"]);
  const cwebIdx = findIdx(["c.w.e.b", "cweb"]);
  const cwoebIdx = findIdx(["c.wo.e.b", "cwoeb"]);
  const currIdx = findIdx(["currency"]);
  const vfIdx = findIdx(["valid from"]);
  const vtIdx = findIdx(["valid to"]);
  const descIdx = findIdx(["description"]);
  const priceIdx = findIdx(["price"]);

  let currService = "";
  let currSupplier = "";
  let currHotel = "";
  let currCountry = "";
  let currCity = "";
  let currCategory = "5 Star";
  let currCurrency = "INR";
  let currValidFrom = new Date("2026-04-01");
  let currValidTo = new Date("2026-12-31");

  const serviceDocsMap = new Map();
  let totalRoomsCount = 0;

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] || [];

    // Forward-fill merged parent attributes
    if (sNameIdx !== -1 && row[sNameIdx]) currService = String(row[sNameIdx]).trim();
    if (supNameIdx !== -1 && row[supNameIdx]) currSupplier = String(row[supNameIdx]).trim();
    if (hNameIdx !== -1 && row[hNameIdx]) currHotel = String(row[hNameIdx]).trim();
    if (countryIdx !== -1 && row[countryIdx]) currCountry = String(row[countryIdx]).trim();
    if (cityIdx !== -1 && row[cityIdx]) currCity = String(row[cityIdx]).trim();
    if (hCatIdx !== -1 && row[hCatIdx]) currCategory = String(row[hCatIdx]).trim();
    if (currIdx !== -1 && row[currIdx]) currCurrency = String(row[currIdx]).trim();
    if (vfIdx !== -1 && row[vfIdx]) currValidFrom = parseExcelDate(row[vfIdx]);
    if (vtIdx !== -1 && row[vtIdx]) currValidTo = parseExcelDate(row[vtIdx]);

    const price = Number(row[priceIdx]);
    const roomType = rTypeIdx !== -1 ? String(row[rTypeIdx] || "").trim() : "";

    // Skip row if no hotel or no valid price
    if (!currHotel || isNaN(price) || price <= 0) continue;

    const serviceKey = currService || currHotel;
    if (!serviceDocsMap.has(serviceKey)) {
      serviceDocsMap.set(serviceKey, {
        serviceName: currService || currHotel,
        supplierName: currSupplier,
        supplier: ownerId,
        country: currCountry || "India",
        city: currCity || "New Delhi",
        serviceCategory: "hotel",
        currency: normalizeCurrency(currCurrency),
        validFrom: currValidFrom,
        validTo: currValidTo,
        blackoutDates,
        status: "active",
        hotelsMap: new Map(),
      });
    }

    const serviceDoc = serviceDocsMap.get(serviceKey);
    if (!serviceDoc.hotelsMap.has(currHotel)) {
      serviceDoc.hotelsMap.set(currHotel, {
        hotelName: currHotel,
        hotelCategory: getHotelCategory(currCategory, currHotel),
        supplierName: currSupplier,
        rooms: [],
      });
    }

    const hotelObj = serviceDoc.hotelsMap.get(currHotel);
    const roomCategory = rCatIdx !== -1 && row[rCatIdx] ? String(row[rCatIdx]).trim() : "Double";
    const bedType = bedIdx !== -1 ? normalizeBedType(row[bedIdx]) : "King";
    const extraBedType = extraBedIdx !== -1 && row[extraBedIdx] ? String(row[extraBedIdx]).trim() : "None";
    const maxAdults = maxAdultsIdx !== -1 && row[maxAdultsIdx] ? Number(row[maxAdultsIdx]) || 2 : 2;
    const maxChildren = maxChildrenIdx !== -1 && row[maxChildrenIdx] ? Number(row[maxChildrenIdx]) || 1 : 1;
    const childAgeLimit = childAgeIdx !== -1 && row[childAgeIdx] ? String(row[childAgeIdx]).trim() : "As per hotel policy";
    const mealPlan = mealIdx !== -1 ? normalizeMealPlan(row[mealIdx]) : "EP";
    const awebRate = awebIdx !== -1 ? Number(row[awebIdx]) || 0 : 0;
    const cwebRate = cwebIdx !== -1 ? Number(row[cwebIdx]) || 0 : 0;
    const cwoebRate = cwoebIdx !== -1 ? Number(row[cwoebIdx]) || 0 : 0;
    const description = descIdx !== -1 ? String(row[descIdx] || "").trim() : "";

    hotelObj.rooms.push({
      roomType: roomType || "Standard Room",
      roomCategory,
      bedType,
      extraBedType,
      maxAdults,
      maxChildren,
      childAgeLimit,
      mealPlan,
      price,
      awebRate,
      cwebRate,
      cwoebRate,
      description,
    });

    totalRoomsCount++;
  }

  const finalServiceDocs = Array.from(serviceDocsMap.values()).map((doc) => {
    const { hotelsMap, ...restDoc } = doc;
    return {
      ...restDoc,
      hotels: Array.from(hotelsMap.values()),
    };
  });

  if (finalServiceDocs.length > 0) {
    const batchSize = 100;
    for (let b = 0; b < finalServiceDocs.length; b += batchSize) {
      const batch = finalServiceDocs.slice(b, b + batchSize);
      await Hotel.insertMany(batch, { ordered: false });
    }
  }

  return {
    records: finalServiceDocs.length,
    totalRoomsCount,
    blackoutDates,
  };
};
