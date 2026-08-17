import XLSX from "xlsx";
import Activity from "../models/activityDmc.model.js";

const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"]);

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "INR";
  return allowedCurrencies.has(normalized) ? normalized : "INR";
};

const parseExcelDate = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

export const processActivityExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const normalizedRows = rawRows.map((row) => {
    const nextRow = {};
    Object.keys(row || {}).forEach((key) => {
      nextRow[String(key || "").trim()] = row[key];
    });
    return nextRow;
  });

  // Track service groupings for merged/split rows
  const serviceGroups = new Map();

  let currServiceName = "";
  let currSupplierName = "";
  let currCountry = "";
  let currCity = "";
  let currCurrency = "";
  let currValidFrom = null;
  let currValidTo = null;

  for (const row of normalizedRows) {
    const isRowEmpty = Object.values(row).every((v) => v === undefined || v === null || String(v).trim() === "");
    if (isRowEmpty) continue;

    const rowServiceName = String(row["Service Name"] || row["Activity Name"] || "").trim();
    if (rowServiceName) {
      currServiceName = rowServiceName;
      currSupplierName = String(row["Supplier Name"] || "").trim();
      currCountry = String(row["Country"] || "").trim();
      currCity = String(row["City"] || "").trim();
      currCurrency = normalizeCurrency(row["Currency"]);
      currValidFrom = parseExcelDate(row["Valid From"]);
      currValidTo = parseExcelDate(row["Valid To"]);
    }

    if (!currServiceName && !currCountry) continue;

    const groupKey = `${currServiceName}_${currCity}_${currCountry}`.toLowerCase();

    if (!serviceGroups.has(groupKey)) {
      serviceGroups.set(groupKey, {
        serviceName: currServiceName,
        supplier: ownerId,
        supplierName: currSupplierName,
        country: currCountry,
        city: currCity,
        serviceCategory: "activity",
        currency: currCurrency || "INR",
        validFrom: currValidFrom || new Date("2026-01-01"),
        validTo: currValidTo || new Date("2026-12-31"),
        status: "active",
        tourTypes: [],
      });
    }

    const serviceDoc = serviceGroups.get(groupKey);

    // Update dates/currency if found on this row
    if (row["Valid From"]) serviceDoc.validFrom = parseExcelDate(row["Valid From"]) || serviceDoc.validFrom;
    if (row["Valid To"]) serviceDoc.validTo = parseExcelDate(row["Valid To"]) || serviceDoc.validTo;
    if (row["Currency"]) serviceDoc.currency = normalizeCurrency(row["Currency"]);
    if (row["Supplier Name"] && !serviceDoc.supplierName) serviceDoc.supplierName = String(row["Supplier Name"]).trim();

    const tourTypeRaw = String(row["Tour Type"] || "").trim();
    const tourType = tourTypeRaw || (serviceDoc.tourTypes.length === 0 ? "Group Tour" : `Option ${serviceDoc.tourTypes.length + 1}`);

    const rawPrice = Number(row["Price"] ?? row["Adult Price"] ?? 0) || 0;
    const pricingBasis = String(row["Pricing Basis"] || (tourType.toLowerCase().includes("group") && !tourType.toLowerCase().includes("per group") ? "Per Pax" : "Per Group")).trim() || "Per Pax";
    
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

    const description = String(row["Description"] || row["Service Description"] || row["Activity Description"] || "").trim();

    serviceDoc.tourTypes.push({
      tourType,
      price: rawPrice,
      pricingBasis,
      maxPax,
      description,
    });
  }

  const data = Array.from(serviceGroups.values());

  const invalidRows = data.filter((item) => !item.serviceName || !item.country);
  if (invalidRows.length > 0) {
    throw new Error(`Missing required service name or country in ${invalidRows.length} services`);
  }

  if (data.length > 0) {
    await Activity.bulkWrite(
      data.map((item) => ({
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
              adultPrice: "",
              childPrice: "",
              infantPrice: "",
              price: "",
              description: "",
            },
          },
          upsert: true,
        },
      }))
    );
  }

  return data.length;
};

