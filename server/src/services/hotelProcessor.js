import XLSX from "xlsx"
import Hotel from "../models/hotelDmc.model.js"

export const processHotelExcel = async (filePath) => {

 const workbook = XLSX.readFile(filePath)
console.log("Sheets:", workbook.SheetNames)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
console.log("Sheet content:", sheet)        
const rows = XLSX.utils.sheet_to_json(sheet)
console.log("Rows:", rows)
  
  // Normalize keys to remove extra spaces
  const normalizedRows = rows.map(row => {
    const newRow = {}
    Object.keys(row).forEach(key => {
      newRow[key.trim()] = row[key]
    })
    return newRow
  })

 
  const getHotelCategory = (row) => {
  const val = row['Hotel Category']?.toLowerCase();
  console.log("ROW:", row['Hotel Category']);

  if (val?.includes("5")) return "5 Star";
  if (val?.includes("4")) return "4 Star";
  if (val?.includes("3")) return "3 Star";
  if (val?.includes("luxury")) return "Luxury";

  const name = row['Hotel Name']?.toLowerCase();

  if (name?.includes("resort") || name?.includes("suite")) return "4 Star";
  if (name?.includes("luxury") || name?.includes("palace")) return "5 Star";

  return "3 Star";
};

  // Filter and map hotels
  const hotels = normalizedRows
    .filter(row =>
      row["Hotel Name"] &&
      row["Country"] &&
      row["City"] &&
      row["Price"] &&
      row["Valid From"] &&  
      row["Valid To"]
    )
    .map(row => ({
      serviceName: row["Service Name"] || "",
      supplierName: row["Supplier Name"] || "",
      hotelName: row["Hotel Name"],
      country: row["Country"],
      city: row["City"],
      hotelCategory: getHotelCategory(row),
      roomType: row["Room Type"] || "",
      mealPlan: row["Meal Plan"] || "",
      price: Number(row["Price"]) || 0,
      currency: row["Currency"] || "INR",
      description:row["Description"],
      validFrom: new Date(row["Valid From"]),
      validTo: new Date(row["Valid To"])
    }))

  if (hotels.length > 0) {
    await Hotel.insertMany(hotels)
  }

  return hotels.length
}