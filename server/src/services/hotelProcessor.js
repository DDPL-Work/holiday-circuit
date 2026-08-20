import XLSX from "xlsx";
import Hotel from "../models/hotelDmc.model.js";
import { parseBlackoutDatesFromWorkbook, normalizeDateOnly } from "../utils/blackoutDates.js";

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
  const parsed = normalizeDateOnly(val);
  return parsed && !isNaN(parsed.getTime()) ? parsed : fallback;
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
  const findIdx = (names) =>
    headers.findIndex((h) =>
      names.some((n) => h === n.toLowerCase() || h.includes(n.toLowerCase()))
    );

  const sNameIdx = findIdx(["service name"]);
  const supNameIdx = findIdx(["supplier name"]);
  const hNameIdx = findIdx(["hotel name"]);
  const countryIdx = findIdx(["country"]);
  const cityIdx = findIdx(["city"]);
  const hCatIdx = findIdx(["hotel category"]);
  const rCatIdx = findIdx(["room category"]);
  const bedIdx = findIdx(["bed type"]);
  const extraBedIdx = findIdx(["extra bed type", "extra bed"]);
  const maxAdultsIdx = findIdx(["max adults"]);
  const maxChildrenIdx = findIdx(["max children"]);
  const childAgeIdx = findIdx(["child age limit", "child age"]);
  const rTypeIdx = findIdx(["room type"]);
  const mealIdx = findIdx(["meal plan"]);
  const awebIdx = findIdx(["a.w.e.b rate", "a.w.e.b", "aweb rate", "aweb"]);
  const cwebIdx = findIdx(["c.w.e.b rate", "c.w.e.b", "cweb rate", "cweb"]);
  const cwoebIdx = findIdx(["c.wo.e.b rate", "c.wo.e.b", "cwoeb rate", "cwoeb", "cwob rate", "cwob"]);
  const currIdx = findIdx(["currency"]);
  const vfIdx = findIdx(["valid from"]);
  const vtIdx = findIdx(["valid to"]);
  const descIdx = findIdx(["description"]);

  // Base Price / Price
  const basePriceIdx = findIdx(["base price"]);
  const priceIdx = basePriceIdx !== -1 ? basePriceIdx : findIdx(["price"]);

  // Season 1
  const s1VfIdx = findIdx(["s1 valid from", "s1_valid_from", "s1 validfrom"]);
  const s1VtIdx = findIdx(["s1 valid to", "s1_valid_to", "s1 validto"]);
  const s1PriceIdx = findIdx(["s1 price", "s1_price", "season 1 price"]);
  const s1BoPriceIdx = findIdx(["s1 blackout price", "s1_blackout_price", "s1 blackout"]);

  // Season 2
  const s2VfIdx = findIdx(["s2 valid from", "s2_valid_from", "s2 validfrom"]);
  const s2VtIdx = findIdx(["s2 valid to", "s2_valid_to", "s2 validto"]);
  const s2PriceIdx = findIdx(["s2 price", "s2_price", "season 2 price"]);
  const s2BoPriceIdx = findIdx(["s2 blackout price", "s2_blackout_price", "s2 blackout"]);

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

    const rawBasePrice = basePriceIdx !== -1 && row[basePriceIdx] !== undefined ? Number(row[basePriceIdx]) : 0;
    const rawPrice = priceIdx !== -1 && row[priceIdx] !== undefined ? Number(row[priceIdx]) : 0;
    const s1Price = s1PriceIdx !== -1 ? Number(row[s1PriceIdx]) || 0 : 0;
    const s2Price = s2PriceIdx !== -1 ? Number(row[s2PriceIdx]) || 0 : 0;

    const basePrice = !isNaN(rawBasePrice) && rawBasePrice > 0 ? rawBasePrice : (!isNaN(rawPrice) && rawPrice > 0 ? rawPrice : 0);
    const price = basePrice || s1Price || s2Price || 0;
    const roomType = rTypeIdx !== -1 ? String(row[rTypeIdx] || "").trim() : "";

    // Skip row if no hotel or no valid price
    if (!currHotel || price <= 0) continue;

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

    const s1ValidFrom = s1VfIdx !== -1 && row[s1VfIdx] ? parseExcelDate(row[s1VfIdx], null) : null;
    const s1ValidTo = s1VtIdx !== -1 && row[s1VtIdx] ? parseExcelDate(row[s1VtIdx], null) : null;
    const s1BlackoutPrice = s1BoPriceIdx !== -1 ? Number(row[s1BoPriceIdx]) || 0 : 0;

    const s2ValidFrom = s2VfIdx !== -1 && row[s2VfIdx] ? parseExcelDate(row[s2VfIdx], null) : null;
    const s2ValidTo = s2VtIdx !== -1 && row[s2VtIdx] ? parseExcelDate(row[s2VtIdx], null) : null;
    const s2BlackoutPrice = s2BoPriceIdx !== -1 ? Number(row[s2BoPriceIdx]) || 0 : 0;

    const seasons = [];
    if (s1Price > 0 || s1ValidFrom || s1ValidTo || s1BlackoutPrice > 0) {
      seasons.push({
        seasonName: "S1",
        validFrom: s1ValidFrom,
        validTo: s1ValidTo,
        price: s1Price,
        blackoutPrice: s1BlackoutPrice,
      });
    }
    if (s2Price > 0 || s2ValidFrom || s2ValidTo || s2BlackoutPrice > 0) {
      seasons.push({
        seasonName: "S2",
        validFrom: s2ValidFrom,
        validTo: s2ValidTo,
        price: s2Price,
        blackoutPrice: s2BlackoutPrice,
      });
    }

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
      basePrice,
      awebRate,
      cwebRate,
      cwoebRate,
      description,
      seasons,
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

