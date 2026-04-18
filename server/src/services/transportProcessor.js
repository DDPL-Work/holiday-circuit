import XLSX from "xlsx"
import Transport from "../models/transferDmc.model.js"

export const processTransportExcel = async (filePath, ownerId) => {
 const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "THB", "GBP", "IDR", "SGD", "MYR", "EGP"]);

 const workbook = XLSX.readFile(filePath)
 const sheet = workbook.Sheets[workbook.SheetNames[0]]
 const rows = XLSX.utils.sheet_to_json(sheet)

 // ✅ Usage Type Formatter
 const formatUsageType = (value) => {
  if (!value) return "point-to-point";

  const v = value.toLowerCase();

  if (v.includes("one")) return "point-to-point";
  if (v.includes("round")) return "round-trip";
  if (v.includes("full")) return "full-day";
  if (v.includes("half")) return "half-day";

  return "point-to-point";
 };

 const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "USD";
  return allowedCurrencies.has(normalized) ? normalized : "USD";
 };

 // ✅ Capacity Logic (NEW ADD)
 const getCapacity = (vehicle) => {
  const v = vehicle?.toLowerCase();

  if (v?.includes("sedan")) return { pax: 3, luggage: 2 };
  if (v?.includes("4x4")) return { pax: 6, luggage: 4 };
  if (v?.includes("suv")) return { pax: 6, luggage: 4 };
  if (v?.includes("van")) return { pax: 10, luggage: 8 };
  if (v?.includes("luxury")) return { pax: 3, luggage: 2 };

  return { pax: 4, luggage: 2 }; // fallback
 };

 const data = rows
 .filter(row =>
  row["Service Name"] &&
  row["Country"] &&
  row["City"] &&
  row["Valid From"] &&
  row["Valid To"]
 )
 .map(row => {

  const capacity = getCapacity(row["Vehicle Type"]);

  return {
    serviceName: row["Service Name"],
    supplierName: row["Supplier Name"],
    supplier: ownerId,

    country: row["Country"],
    city: row["City"],

    vehicleType: row["Vehicle Type"],

    // ✅ NEW ADD (IMPORTANT)
    passengerCapacity: Number(row["Passenger Capacity"]) || capacity.pax,
    luggageCapacity: Number(row["Luggage Capacity"]) || capacity.luggage,

    usageType: formatUsageType(row["Usage Type"]),
    description: row["Description"] || "",

    price: Number(row["Price"]),
    currency: normalizeCurrency(row["Currency"]),

    validFrom: new Date(row["Valid From"]),
    validTo: new Date(row["Valid To"])
  }
 })

 await Transport.insertMany(data)

 return data.length
}
