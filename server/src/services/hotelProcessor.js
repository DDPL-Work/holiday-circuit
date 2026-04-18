import XLSX from "xlsx";
import Hotel from "../models/hotelDmc.model.js";

const allowedMealPlans = new Set(["EP", "CP", "MAP", "AP", "AI"]);
const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"]);

const normalizeMealPlan = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "EP";
  return allowedMealPlans.has(normalized) ? normalized : "EP";
};

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "INR";
  return allowedCurrencies.has(normalized) ? normalized : "INR";
};

const getHotelCategory = (row = {}) => {
  const category = String(row["Hotel Category"] || "").toLowerCase();

  if (category.includes("5")) return "5 Star";
  if (category.includes("4")) return "4 Star";
  if (category.includes("3")) return "3 Star";
  if (category.includes("luxury")) return "Luxury";

  const name = String(row["Hotel Name"] || "").toLowerCase();
  if (name.includes("luxury") || name.includes("palace")) return "5 Star";
  if (name.includes("resort") || name.includes("suite")) return "4 Star";

  return "3 Star";
};

export const processHotelExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const normalizedRows = rows.map((row) => {
    const nextRow = {};
    Object.keys(row || {}).forEach((key) => {
      nextRow[String(key).trim()] = row[key];
    });
    return nextRow;
  });

  const hotels = normalizedRows
    .filter(
      (row) =>
        row["Hotel Name"] &&
        row["Country"] &&
        row["City"] &&
        row["Price"] &&
        row["Valid From"] &&
        row["Valid To"],
    )
    .map((row) => ({
      serviceName: row["Service Name"] || "",
      supplierName: row["Supplier Name"] || "",
      supplier: ownerId,
      hotelName: row["Hotel Name"],
      country: row["Country"],
      city: row["City"],
      hotelCategory: getHotelCategory(row),
      roomCategory: row["Room Category"] || "Double",
      bedType: row["Bed Type"] || "King",
      roomType: row["Room Type"] || "",
      mealPlan: normalizeMealPlan(row["Meal Plan"]),
      price: Number(row["Price"]) || 0,
      awebRate: Number(row["A.W.E.B Rate"]) || 0,
      cwebRate: Number(row["C.W.E.B Rate"]) || 0,
      cwoebRate: Number(row["C.Wo.E.B Rate"]) || 0,
      currency: normalizeCurrency(row["Currency"]),
      description: row["Description"] || "",
      validFrom: new Date(row["Valid From"]),
      validTo: new Date(row["Valid To"]),
    }));

  if (hotels.length > 0) {
    await Hotel.insertMany(hotels);
  }

  return hotels.length;
};
