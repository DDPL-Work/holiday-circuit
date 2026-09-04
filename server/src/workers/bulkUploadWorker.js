import { parentPort, workerData } from "worker_threads";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import XLSX from "xlsx";
import dns from "dns";

dns.setServers(['8.8.8.8']);

import UploadHistory from "../models/uploadHistory.model.js";
import { processHotelExcel } from "../services/hotelProcessor.js";
import { processTransportExcel } from "../services/transportProcessor.js";
import { processActivityExcel } from "../services/activityProcessor.js";
import { processPackageExcel } from "../services/packageProcessor.js";

const detectCategory = (workbook, fileName, requestedCategory) => {
  const sheetNames = (workbook.SheetNames || []).map((sheet) => String(sheet).toLowerCase());
  const lowerName = String(fileName || "").toLowerCase();

  if (sheetNames.some((sheet) => /transport|transfer|vehicle/.test(sheet)) || /transport|transfer/.test(lowerName)) {
    return "transport";
  }
  if (sheetNames.some((sheet) => /hotel|room/.test(sheet)) || lowerName.includes("hotel")) {
    return "hotel";
  }
  if (sheetNames.some((sheet) => /activity|excursion|sightseeing|tour/.test(sheet)) || /activity|sightseeing/.test(lowerName)) {
    return "activity";
  }
  if (sheetNames.some((sheet) => sheet.includes("package")) || lowerName.includes("package")) {
    return "package";
  }
  return requestedCategory;
};

const getRecordCount = (result) => {
  if (typeof result === "number") return result;
  return Number(result?.records ?? result?.count ?? 0) || 0;
};

const run = async () => {
  const { filePath, fileName, requestedCategory, ownerId, uploadHistoryId } = workerData;

  try {
    await mongoose.connect(process.env.MONGO_URL);

    // Read the workbook exactly once. Category detection and import share it.
    const workbook = XLSX.readFile(filePath);
    const category = detectCategory(workbook, fileName, requestedCategory);
    let result;

    switch (category) {
      case "hotel":
        result = await processHotelExcel(filePath, ownerId, workbook, uploadHistoryId);
        break;
      case "transport":
        result = await processTransportExcel(filePath, ownerId, workbook, uploadHistoryId);
        break;
      case "activity":
      case "sightseeing":
        result = await processActivityExcel(filePath, ownerId, workbook, uploadHistoryId);
        break;
      case "package":
        result = await processPackageExcel(filePath, ownerId, workbook, uploadHistoryId);
        break;
      default:
        throw new Error("Invalid inventory category");
    }

    const blackoutDates = Array.isArray(result?.blackoutDates) ? result.blackoutDates : [];
    await UploadHistory.findByIdAndUpdate(uploadHistoryId, {
      $set: {
        category,
        records: getRecordCount(result),
        blackoutDates,
        status: "success",
      },
    });
    parentPort?.postMessage({ status: "success", uploadHistoryId });
  } catch (error) {
    await UploadHistory.findByIdAndUpdate(uploadHistoryId, {
      $set: { status: "failed" },
    }).catch(() => null);
    parentPort?.postMessage({ status: "failed", uploadHistoryId, error: error.message });
  } finally {
    await mongoose.disconnect().catch(() => null);
  }
};

if (parentPort && workerData) {
  run();
}
