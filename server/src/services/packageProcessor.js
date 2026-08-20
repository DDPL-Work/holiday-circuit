import XLSX from "xlsx"
import Package from "../models/PackageDmc.model.js"

const getVal = (row = {}, keys = []) => {
  for (const k of keys) {
    const foundKey = Object.keys(row || {}).find(
      (rk) => String(rk).trim().toLowerCase() === k.toLowerCase()
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return String(row[foundKey]).trim();
    }
  }
  return "";
};

export const processPackageExcel = async (filePath, ownerId) => {

  const workbook = XLSX.readFile(filePath)

  // ======================= PACKAGES =======================
  const packageSheet = workbook.Sheets["packages"]
  const packageRows = XLSX.utils.sheet_to_json(packageSheet)

  const packageMap = {}

  for (const row of packageRows) {
    const title = getVal(row, ["package_title", "title", "package title"]);
    if (!title) continue;

    const pkg = await Package.create({
      title,
      destination: getVal(row, ["city", "destination"]),
      country: getVal(row, ["country"]) || getVal(row, ["city", "destination"]), 
      duration: getVal(row, ["duration"]),
      price: Number(getVal(row, ["base_price", "price"])) || 0,
      description: getVal(row, ["description"]),
      inclusions: getVal(row, ["Inclusions", "inclusions"]),
      exclusions: getVal(row, ["Exclusions", "exclusions"]),
      dayWiseItinerary: getVal(row, ["Day Wise Itinerary", "day_wise_itinerary", "itinerary"]),
      termsAndConditions: getVal(row, ["Terms & Conditions", "terms_and_conditions", "terms"]),
      supplier: ownerId || null,
      hotels: [],
      activities: [],
      transfers: [],
      sightseeing: []
    })

    const key = title.trim().toLowerCase()
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
      name: getVal(row, ["service_name", "service name", "name"]),
      day: getVal(row, ["day"]),
      price: Number(getVal(row, ["price"])) || 0,
      unit: getVal(row, ["unit"]),
      quantity: Number(getVal(row, ["quantity"])) || 1,
      hotel_name: getVal(row, ["hotel_name", "hotel name"]),
      hotelName: getVal(row, ["hotel_name", "hotel name"]),
      room_type: getVal(row, ["room_type", "room type"]),
      roomType: getVal(row, ["room_type", "room type"]),
      vehicle_type: getVal(row, ["vehicle_type", "vehicle type"]),
      vehicleType: getVal(row, ["vehicle_type", "vehicle type"]),
      passenger_capacity: Number(getVal(row, ["passenger_capacity", "passenger capacity"])) || null,
      passengerCapacity: Number(getVal(row, ["passenger_capacity", "passenger capacity"])) || null,
      luggage_capacity: Number(getVal(row, ["luggage_capacity", "luggage capacity"])) || null,
      luggageCapacity: Number(getVal(row, ["luggage_capacity", "luggage capacity"])) || null,
      description: getVal(row, ["description"]),
    }

    const sType = String(getVal(row, ["service_type", "service type", "type"])).toLowerCase();
    switch (sType) {
      case "hotel":
        pkg.hotels.push(serviceData)
        break
      case "activity":
        pkg.activities.push(serviceData)
        break
      case "transport":
      case "transfer":
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