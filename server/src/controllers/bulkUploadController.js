import path from "path"
import fs from "fs"
import XLSX from "xlsx"

import { processHotelExcel } from "../services/hotelProcessor.js"
import { processTransportExcel } from "../services/transportProcessor.js"
import { processActivityExcel } from "../services/activityProcessor.js"
import { processPackageExcel } from "../services/packageProcessor.js"
import { processSightseeingExcel } from "../services/sightseeingProcessor.js"
import UploadHistory from "../models/uploadHistory.model.js"
import Auth from "../models/auth.model.js"
import Notification from "../models/notification.model.js"
import mongoose from "mongoose"


export const bulkUpload = async (req, res) => {
  try {
    const category = req.body.category
    const fileName = req.file.originalname

    // 🔥 IMPORTANT FIX
    const filePath =`uploads/${req.file.filename}`
    console.log("FILE OBJECT:", req.file)

    const uploadedBy = req.user?.name || req.user?.email || req.user?.id
    const ext = path.extname(fileName).toLowerCase()

    let records = 0

    if ([".xlsx", ".xls", ".csv"].includes(ext)) {
      switch (category) {
        case "hotel":
          records = await processHotelExcel(req.file.path, req.user.id)
          break
        case "transport":
          records = await processTransportExcel(req.file.path, req.user.id)
          break
        case "activity":
          records = await processActivityExcel(req.file.path, req.user.id)
          break
        case "package":
          records = await processPackageExcel(req.file.path)
          break
        case "sightseeing":
          records = await processSightseeingExcel(req.file.path, req.user.id)
          break
        default:
          return res.status(400).json({ message: "Invalid category" })
      }
    } else {
      return res.status(400).json({ message: "Only Excel or CSV files are allowed" })
    }

    // ✅ SAVE HISTORY
    await UploadHistory.create({
      fileName, // original name
      filePath, // lean path
      category,
      uploadedAuth: req.user.id,
      uploadedBy,
      records,
      status: "success"
    })

    res.json({ message: "Upload successful", records, uploadedBy })

  } catch (error) {
    console.log("ACTUAL ERROR:", error)

    await UploadHistory.create({
      fileName: req.file?.originalname,
      filePath: req.file?.filename ? `uploads/${req.file.filename}` : "",
      category: req.body.category,
      uploadedAuth: req.user?.id,
      uploadedBy: req.user?.name || "Unknown",
      records: 0,
      status: "failed"
    })
    res.status(500).json({ message: error.message, error: error.message })
  }
}


export const getBulkUploadHistory = async (req, res) => {
  try {
    // Optional filter (category wise)
    const { category } = req.query;
    let filter = {};
    if (req.user?.id && req.user?.role !== "admin") {
      filter.uploadedAuth = req.user.id;
    }
    // 👉 category filter
    if (category) {filter.category = category;}
    const uploads = await UploadHistory.find(filter)
    .sort({ createdAt: -1 }) // latest first
    .lean();

    res.status(200).json({success: true,count: uploads.length,uploads});

  } catch (error) {
    res.status(500).json({success: false,message: error.message});
  }
};

export const viewUploadData = async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await UploadHistory.findById(id).lean();
    if (!upload) {
      return res.status(404).json({ success: false, message: "Upload history not found" });
    }

    const fullPath = path.resolve(upload.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: "Excel file not found on server" });
    }

    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse sheet to JSON array
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const headers = rawData[0] || [];
    const rows = rawData.slice(1).map((row, rowIndex) => {
      const rowData = {};
      headers.forEach((header, index) => {
        if (header) {
          rowData[header] = row[index] !== undefined ? row[index] : "";
        }
      });
      return {
        _id: `${upload._id}_row_${rowIndex}`,
        rowIndex,
        ...rowData
      };
    });

    res.status(200).json({
      success: true,
      category: upload.category,
      fileName: upload.fileName,
      headers: headers.filter(Boolean),
      rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editSpreadsheetRowAndNotify = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowIndex, updatedRow, category, fileName } = req.body || {};
    
    const upload = await UploadHistory.findById(id);
    if (!upload) {
      return res.status(404).json({ success: false, message: "Upload history not found" });
    }

    const fullPath = path.resolve(upload.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: "Excel file not found on server" });
    }

    // 1. Read existing file
    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // 2. Parse to raw array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const headers = rawData[0] || [];
    
    // 3. Update specific row
    const rawRowIndex = Number(rowIndex) + 1;
    const changes = [];
    
    if (rawData[rawRowIndex]) {
      const originalRow = [...rawData[rawRowIndex]];
      headers.forEach((header, colIndex) => {
        if (header && updatedRow[header] !== undefined) {
          const originalVal = String(originalRow[colIndex] !== undefined ? originalRow[colIndex] : "").trim();
          const newVal = String(updatedRow[header]).trim();
          
          if (originalVal !== newVal) {
            changes.push(`${header}: "${originalVal}" ➔ "${newVal}"`);
          }
          
          rawData[rawRowIndex][colIndex] = updatedRow[header];
        }
      });
    }

    // 4. Write back to Excel file
    const newSheet = XLSX.utils.aoa_to_sheet(rawData);
    workbook.Sheets[sheetName] = newSheet;
    XLSX.writeFile(workbook, fullPath);

    // 5. Notify all Admin and Manager users
    const staffUsers = await Auth.find({
      role: { $in: ["admin", "finance_manager", "operation_manager", "operations"] },
      isDeleted: { $ne: true },
      accountStatus: { $ne: "Inactive" }
    }).select("_id");

    const dmcName = req.user?.companyName || req.user?.name || "DMC Partner";
    const notificationTitle = "Contracted Rate Edited by DMC";
    const changeSummary = changes.length > 0 ? ` Changes: ${changes.join(", ")}` : " No field changes detected.";
    const notificationMsg = `DMC Partner "${dmcName}" edited a row in contracted rate file "${upload.fileName}" (Category: ${category}).${changeSummary}`;

    if (staffUsers.length) {
      await Notification.insertMany(
        staffUsers.map((user) => ({
          user: user._id,
          type: "info",
          title: notificationTitle,
          message: notificationMsg,
          link: "/dmc/contractedRates",
          meta: {
            uploadId: upload._id,
            fileName: upload.fileName,
            category,
            editedBy: req.user.id
          }
        }))
      );
    }

    res.status(200).json({
      success: true,
      message: "Spreadsheet row updated and managers notified successfully!",
      updatedRow
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
