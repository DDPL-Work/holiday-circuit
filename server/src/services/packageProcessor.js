import XLSX from "xlsx"
import Package from "../models/PackageDmc.model.js"

export const processPackageExcel = async (filePath) => {

  const workbook = XLSX.readFile(filePath)

  // ======================= PACKAGES =======================
  const packageSheet = workbook.Sheets["packages"]
  const packageRows = XLSX.utils.sheet_to_json(packageSheet)

  const packageMap = {}

  for (const row of packageRows) {
const pkg = await Package.create({
  title: row["package_title"],
  destination: row["city"],
  country: row["country"] || row["city"], 
  duration: row["duration"],
  price: row["base_price"],
  hotels: [],
  activities: [],
  transfers: [],
  sightseeing: []
})

   const key = row["package_title"]?.trim().toLowerCase()
   packageMap[key] = pkg
  }

  // ======================= SERVICES =======================
  const serviceSheet = workbook.Sheets["services"]
  const serviceRows = XLSX.utils.sheet_to_json(serviceSheet)

  for (const row of serviceRows) {

   
  const key = row["package_title"]?.trim().toLowerCase()
  const pkg = packageMap[key]

  if (!pkg) {
    console.log("❌ Not matched:", row["package_title"])
    continue
  }

    const serviceData = {
      name: row["service_name"],
      day: row["day"],
      price: row["price"],
      unit: row["unit"],
      quantity: row["quantity"]
    }

    switch (row["service_type"]) {
      case "hotel":
        pkg.hotels.push(serviceData)
        break
      case "activity":
        pkg.activities.push(serviceData)
        break
      case "transport":
        pkg.transfers.push(serviceData)
        break
      case "sightseeing":
        pkg.sightseeing.push(serviceData)
        break
    }
  }

  // ---------------- one time save
  await Promise.all(
    Object.values(packageMap).map(pkg => pkg.save())
  )

  return Object.keys(packageMap).length
}