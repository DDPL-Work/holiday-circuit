import XLSX from "xlsx"
import Activity from "../models/activityDmc.model.js"

const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"]);

const normalizeCurrency = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "AED";
  return allowedCurrencies.has(normalized) ? normalized : "AED";
};

export const processActivityExcel = async (filePath, ownerId) => {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)
  const normalizedRows = rows.map((row) => {
    const nextRow = {};
    Object.keys(row || {}).forEach((key) => {
      nextRow[String(key || "").trim()] = row[key];
    });
    return nextRow;
  });

 const data = normalizedRows
  .filter(row => Object.values(row).some(v => v !== undefined && v !== null && v !== ""))
  .map((row) => ({
    name: row["Service Name"] || row["Activity Name"],
    supplier: ownerId,
    supplierName: row["Supplier Name"] || "",
    country: row["Country"],
    validFrom: row["Valid From"] ? new Date(row["Valid From"]) : null,
    validTo: row["Valid To"] ? new Date(row["Valid To"]) : null,
    city: row["City"] || "",
    description:
      row["Description"] ||
      row["Service Description"] ||
      row["Activity Description"] ||
      "",
    adultPrice: Number(row["Adult Price"] ?? row["Price"] ?? 0) || 0,
    childPrice: Number(row["Child Price"] ?? 0) || 0,
    infantPrice: Number(row["Infant Price"] ?? 0) || 0,
    currency: normalizeCurrency(row["Currency"])
  }))

  // Optional: check for missing required fields before insert
  const invalidRows = data.filter(
    (item) => !item.name || !item.country || !item.validFrom || !item.validTo
  )
  if (invalidRows.length > 0) {
    throw new Error(`Missing required fields in ${invalidRows.length} rows`)
  }

  if (data.length > 0) {
    await Activity.bulkWrite(
      data.map((item) => ({
        updateOne: {
          filter: {
            supplier: ownerId,
            name: item.name,
            city: item.city,
            country: item.country,
          },
          update: {
            $set: item,
          },
          upsert: true,
        },
      })),
    );
  }

  return data.length
}
