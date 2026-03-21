import path from "path"
import fs from "fs"
import XLSX from "xlsx"

import { processHotelExcel } from "../services/hotelProcessor.js"
import { processTransportExcel } from "../services/transportProcessor.js"
import { processActivityExcel } from "../services/activityProcessor.js"
import { processPackageExcel } from "../services/packageProcessor.js"
import { processSightseeingExcel } from "../services/sightseeingProcessor.js"
import UploadHistory from "../models/uploadHistory.model.js"


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
          records = await processHotelExcel(req.file.path)
          break
        case "transport":
          records = await processTransportExcel(req.file.path)
          break
        case "activity":
          records = await processActivityExcel(req.file.path)
          break
        case "package":
          records = await processPackageExcel(req.file.path)
          break
        case "sightseeing":
          records = await processSightseeingExcel(req.file.path)
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
    res.status(500).json({ error: error.message })
  }
}


export const getBulkUploadHistory = async (req, res) => {
  try {
    // Optional filter (category wise)
    const { category } = req.query;
    let filter = {};
    if (req.user?.id) {
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



