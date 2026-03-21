import XLSX from "xlsx"
import Transport from "../models/transferDmc.model.js"

export const processTransportExcel = async (filePath) => {

 const workbook = XLSX.readFile(filePath)

 const sheet = workbook.Sheets[workbook.SheetNames[0]]

 const rows = XLSX.utils.sheet_to_json(sheet)

const data = rows
 .filter(row =>
  row["Service Name"] &&
  row["Country"] &&
  row["City"] &&
  row["Valid From"] &&
  row["Valid To"]
 )
 .map(row => ({

  serviceName: row["Service Name"],
  supplierName: row["Supplier Name"],

  country: row["Country"],
  city: row["City"],

  vehicleType: row["Vehicle Type"],

  price: Number(row["Price"]),
  currency: row["Currency"],

  validFrom: new Date(row["Valid From"]),
  validTo: new Date(row["Valid To"])

 }))

 await Transport.insertMany(data)

 return data.length
}