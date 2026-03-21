import XLSX from "xlsx"
import Activity from "../models/activityDmc.model.js"

export const processActivityExcel = async (filePath) => {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

 const data = rows
  .filter(row => Object.values(row).some(v => v !== undefined && v !== null && v !== ""))
  .map((row) => ({
    name: row["Service Name"] || row["Activity Name"],
    country: row["Country"],
    validFrom: row["Valid From"] ? new Date(row["Valid From"]) : null,
    validTo: row["Valid To"] ? new Date(row["Valid To"]) : null,
    city: row["City"] || "",
    price: row["Price"] || 0,
    currency: row["Currency"] || "AED"
  }))

  // Optional: check for missing required fields before insert
  const invalidRows = data.filter(
    (item) => !item.name || !item.country || !item.validFrom || !item.validTo
  )
  if (invalidRows.length > 0) {
    throw new Error(`Missing required fields in ${invalidRows.length} rows`)
  }

  await Activity.insertMany(data)
  return data.length
}