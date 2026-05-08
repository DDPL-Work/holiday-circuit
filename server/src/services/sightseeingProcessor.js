import XLSX from "xlsx";
import Sightseeing from "../models/sightseeingDmc.model.js";

const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"]);

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "USD";
  return allowedCurrencies.has(normalized) ? normalized : "USD";
};

export const processSightseeingExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const data = rows
    .map((row) => {
      const name = row["Sightseeing Name"] || row["Service Name"];
      const country = row["Country"];

      if (!name || !country) {
        console.log("Invalid Row:", row);
        return null;
      }

      return {
        serviceName: row["Service Name"] || name,
        supplier: ownerId,
        supplierName: row["Supplier Name"] || "",
        city: row["City"] || "",
        country,
        name,
        price: Number(row["Price"] || 0),
        currency: normalizeCurrency(row["Currency"]),
        description: row["Description"] || "",
        validFrom: new Date(row["Valid From"]),
        validTo: new Date(row["Valid To"]),
      };
    })
    .filter(Boolean);

  await Sightseeing.insertMany(data);

  return data.length;
};
