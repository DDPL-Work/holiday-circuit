import XLSX from "xlsx"
import Transport from "../models/transferDmc.model.js"

export const processTransportExcel = async (filePath, ownerId) => {
 const allowedCurrencies = new Set(["USD", "INR", "AED", "EUR", "THB", "GBP", "IDR", "SGD", "MYR", "EGP"]);

 const workbook = XLSX.readFile(filePath)
 const sheet = workbook.Sheets[workbook.SheetNames[0]]
 const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })
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

 const normalizeHeaderText = (value = "") => String(value || "").trim().toLowerCase();

 const findHeaderIndex = (headers = [], labels = []) => {
  const normalizedLabels = labels.map(normalizeHeaderText);
  return headers.findIndex((header) => normalizedLabels.includes(normalizeHeaderText(header)));
 };

 const getMatrixValue = (row = [], index = -1) => (index >= 0 ? row[index] ?? "" : "");

 const getCleanNumber = (value) => Number(value || 0) || 0;

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

 const buildGroupedTransportRecords = () => {
  const topHeaders = rawRows[0] || [];
  const serviceNameIndex = findHeaderIndex(topHeaders, ["Service Name"]);
  const supplierNameIndex = findHeaderIndex(topHeaders, ["Supplier Name"]);
  const vehicleTypeIndex = findHeaderIndex(topHeaders, ["Vehicle Type"]);
  const usageTypeIndex = findHeaderIndex(topHeaders, ["Usage Type"]);
  const priceIndex = findHeaderIndex(topHeaders, ["Price"]);
  const currencyIndex = findHeaderIndex(topHeaders, ["Currency"]);
  const countryIndex = findHeaderIndex(topHeaders, ["Country"]);
  const cityIndex = findHeaderIndex(topHeaders, ["City"]);
  const validFromIndex = findHeaderIndex(topHeaders, ["Valid From"]);
  const validToIndex = findHeaderIndex(topHeaders, ["Valid To"]);
  const descriptionIndex = findHeaderIndex(topHeaders, ["Description"]);
  const passengerCapacityIndex = findHeaderIndex(topHeaders, ["Passenger Capacity"]);
  const luggageCapacityIndex = findHeaderIndex(topHeaders, ["Luggage Capacity"]);

  if (serviceNameIndex === -1 || usageTypeIndex === -1 || priceIndex === -1 || currencyIndex === -1) {
   return [];
  }

  const hasGroupedTransportBlocks = rawRows.slice(1).some((row, rowOffset) => {
   const rowIndex = rowOffset + 1;
   if (!getMatrixValue(row, serviceNameIndex)) return false;

   const detailRow = rawRows[rowIndex + 1] || [];
   const priceRow = rawRows[rowIndex + 2] || [];
   const nextServiceBlank = !getMatrixValue(detailRow, serviceNameIndex);
   const detailUsagePresent = [0, 1, 2, 3].some((offset) =>
    Boolean(getMatrixValue(detailRow, usageTypeIndex + offset))
   );
   const detailPricePresent = [0, 1, 2, 3].some((offset) =>
    Boolean(getMatrixValue(priceRow, priceIndex + offset))
   );

   return nextServiceBlank && (detailUsagePresent || detailPricePresent);
  });

  if (!hasGroupedTransportBlocks) {
   return [];
  }

  const groupedPriceColumnCount = Math.max(1, currencyIndex - priceIndex);
 const usageOptions = [
   { offset: 0, fallbackLabel: "One Way / Airport Transfer", usageType: "point-to-point", optionKey: "one-way-airport-transfer" },
   { offset: 1, fallbackLabel: "Inter Hotel Transfer", usageType: "point-to-point", optionKey: "inter-hotel-transfer" },
   { offset: 2, fallbackLabel: "Full Day - 80 km / 8 hours", usageType: "full-day", optionKey: "full-day" },
   { offset: 3, fallbackLabel: "Half Day - 40 km / 4 hours", usageType: "half-day", optionKey: "half-day" },
  ];

  const inferFlatPriceOffset = (baseRow = [], detailRow = []) => {
   const text = [
    getMatrixValue(baseRow, serviceNameIndex),
    getMatrixValue(baseRow, descriptionIndex),
    getMatrixValue(baseRow, usageTypeIndex),
    getMatrixValue(detailRow, usageTypeIndex),
    getMatrixValue(detailRow, usageTypeIndex + 1),
    getMatrixValue(detailRow, usageTypeIndex + 2),
    getMatrixValue(detailRow, usageTypeIndex + 3),
   ].join(" ").toLowerCase();

   if (text.includes("half") || text.includes("4 hour") || text.includes("40 km")) return 3;
   if (text.includes("full") || text.includes("8 hour") || text.includes("80 km")) return 2;
   if (text.includes("inter hotel")) return 1;
   return 0;
  };

  const records = [];

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex += 1) {
   const baseRow = rawRows[rowIndex] || [];
   const serviceName = String(getMatrixValue(baseRow, serviceNameIndex) || "").trim();
   if (!serviceName) continue;

   const country = getMatrixValue(baseRow, countryIndex);
   const city = getMatrixValue(baseRow, cityIndex);
   const validFrom = getMatrixValue(baseRow, validFromIndex);
   const validTo = getMatrixValue(baseRow, validToIndex);
   if (!country || !city || !validFrom || !validTo) continue;

   const detailRow = rawRows[rowIndex + 1] || [];
   const priceRow = rawRows[rowIndex + 2] || [];
   const vehicleType = getMatrixValue(baseRow, vehicleTypeIndex);
   const capacity = getCapacity(vehicleType);
   const commonRecord = {
    supplierName: getMatrixValue(baseRow, supplierNameIndex),
    supplier: ownerId,
    country,
    city,
    vehicleType,
    passengerCapacity: Number(getMatrixValue(baseRow, passengerCapacityIndex)) || capacity.pax,
    luggageCapacity: Number(getMatrixValue(baseRow, luggageCapacityIndex)) || capacity.luggage,
    currency: normalizeCurrency(getMatrixValue(baseRow, currencyIndex)),
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
   };

   if (groupedPriceColumnCount >= 6) {
    const priceOffsetsByUsageOffset = {
     0: 0,
     1: 1,
     2: 2,
     3: 4,
    };
    const fullDayExtraPerKmRate = getCleanNumber(
     getMatrixValue(priceRow, priceIndex + 3) || getMatrixValue(baseRow, priceIndex + 3)
    );
    const halfDayExtraPerKmRate = getCleanNumber(
     getMatrixValue(priceRow, priceIndex + 5) || getMatrixValue(baseRow, priceIndex + 5)
    );

    usageOptions.forEach((option) => {
     const optionLabel = getMatrixValue(detailRow, usageTypeIndex + option.offset) || option.fallbackLabel;
     const priceOffset = priceOffsetsByUsageOffset[option.offset];
     const price = getCleanNumber(
      getMatrixValue(priceRow, priceIndex + priceOffset) || getMatrixValue(baseRow, priceIndex + priceOffset)
     );
     if (!price) return;

     records.push({
      ...commonRecord,
      serviceName: `${serviceName} - ${optionLabel}`,
      usageType: option.usageType,
      description: [getMatrixValue(baseRow, descriptionIndex), optionLabel].filter(Boolean).join(" | "),
      price,
      extraPerKmRate:
       option.optionKey === "full-day"
        ? fullDayExtraPerKmRate
        : option.optionKey === "half-day"
         ? halfDayExtraPerKmRate
         : 0,
      fullDayExtraPerKmRate,
      halfDayExtraPerKmRate,
     });
    });
   } else if (groupedPriceColumnCount >= 4) {
    usageOptions.forEach((option) => {
     const optionLabel = getMatrixValue(detailRow, usageTypeIndex + option.offset) || option.fallbackLabel;
     const price = getCleanNumber(
      getMatrixValue(priceRow, priceIndex + option.offset) || getMatrixValue(baseRow, priceIndex + option.offset)
     );

     if (!price) return;

     records.push({
      ...commonRecord,
      serviceName: `${serviceName} - ${optionLabel}`,
      usageType: option.usageType,
      description: [getMatrixValue(baseRow, descriptionIndex), optionLabel].filter(Boolean).join(" | "),
      price,
      extraPerKmRate: 0,
      fullDayExtraPerKmRate: 0,
      halfDayExtraPerKmRate: 0,
     });
    });
   } else {
    const targetOption = usageOptions[inferFlatPriceOffset(baseRow, detailRow)];
    const baseUsageType = formatUsageType(getMatrixValue(baseRow, usageTypeIndex));
    const resolvedUsageType = ["full-day", "half-day"].includes(targetOption.usageType)
     ? targetOption.usageType
     : baseUsageType;

    records.push({
     ...commonRecord,
     serviceName,
     usageType: resolvedUsageType,
     description: getMatrixValue(baseRow, descriptionIndex) || "",
     price: getCleanNumber(getMatrixValue(baseRow, priceIndex)),
     extraPerKmRate: 0,
     fullDayExtraPerKmRate: 0,
     halfDayExtraPerKmRate: 0,
    });
   }
  }

  return records;
 };

 const groupedRecords = buildGroupedTransportRecords();
 if (groupedRecords.length) {
  await Transport.insertMany(groupedRecords)
  return groupedRecords.length
 }

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
    extraPerKmRate: Number(row["Extra Per KM Rate"] || row["Extra / KM"] || row["Extra Per Km"] || 0) || 0,
    fullDayExtraPerKmRate: Number(row["Full Day Extra Per KM"] || row["Full Day Extra / KM"] || row["Full Day Extra Per Km"] || 0) || 0,
    halfDayExtraPerKmRate: Number(row["Half Day Extra Per KM"] || row["Half Day Extra / KM"] || row["Half Day Extra Per Km"] || 0) || 0,
    currency: normalizeCurrency(row["Currency"]),

    validFrom: new Date(row["Valid From"]),
    validTo: new Date(row["Valid To"])
  }
 })

 await Transport.insertMany(data)

 return data.length
}
