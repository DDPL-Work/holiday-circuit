import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { createHotel, getHotels, getHotelById, updateHotel, deleteHotel, createActivity, getActivities, createTransfer, getTransfers, createPackage, getPackages, deletePackage, createSightseeing, getSightseeing, deleteUpload, downloadUpload, createOrUpdateConfirmation, getConfirmedQueriesForDmc, getDmcDashboard, submitInternalInvoice, getDmcPaymentLedger, submitDmcSettlementBatch, previewUploadedInvoiceExtraction, addOrUpdateSupplierPayment } from "../controllers/dmcController.js";
import { bulkUpload, getBulkUploadHistory, getBulkUploadStatus, viewUploadData, editSpreadsheetRowAndNotify } from "../controllers/bulkUploadController.js";
import multer from "multer";


const router = express.Router();


/* 🔹 HOTEL ROUTES  */
router.post("/hotel", isAuthenticated, createHotel);
router.get("/hotel", isAuthenticated, getHotels);
router.get("/hotel/:id", isAuthenticated, getHotelById);
router.put("/hotel/:id", isAuthenticated, updateHotel);
router.delete("/hotel/:id", isAuthenticated, deleteHotel);

/* 🔹 ACTIVITY ROUTES  */
router.post("/activity", isAuthenticated, createActivity);
router.get("/activity", isAuthenticated, getActivities);

/* 🔹 TRANSFER ROUTES  */
router.post("/transfer", isAuthenticated, createTransfer);
router.get("/transfer", isAuthenticated, getTransfers);

/* 🔹 SIGHTSEEING ROUTES  */
router.post("/sightseeing", isAuthenticated, createSightseeing);
router.get("/sightseeing", isAuthenticated, getSightseeing);

/* 🔹  PACKAGE ROUTES  */
router.post("/package", isAuthenticated, createPackage);
router.get("/package", isAuthenticated, getPackages);
router.delete("/package/:id", isAuthenticated, deletePackage);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, "uploads/") },
  filename: function (req, file, cb) { cb(null, Date.now() + "-" + file.originalname) }
})
const upload = multer({ storage })
router.post("/bulk-upload", upload.single("file"), isAuthenticated, bulkUpload)
router.get("/bulk-upload/:id/status", isAuthenticated, getBulkUploadStatus);
router.get("/bulk-upload-history", isAuthenticated, getBulkUploadHistory);
router.delete("/upload/:id", isAuthenticated, deleteUpload)
router.get("/upload/download/:id", isAuthenticated, downloadUpload)
router.get("/upload/view/:id", isAuthenticated, viewUploadData)
router.patch("/upload/edit-row/:id", isAuthenticated, editSpreadsheetRowAndNotify)
router.get("/dashboard", isAuthenticated, getDmcDashboard);
router.get("/confirmation/queries", isAuthenticated, getConfirmedQueriesForDmc);
router.post("/confirmation/supplier-payment", isAuthenticated, addOrUpdateSupplierPayment);
router.post("/internal-invoice/parse-upload", isAuthenticated, upload.single("uploadedInvoice"), previewUploadedInvoiceExtraction);
router.post("/internal-invoice", isAuthenticated, upload.single("uploadedInvoice"), submitInternalInvoice);
router.get("/payment-ledger", isAuthenticated, getDmcPaymentLedger);
router.post("/settlement-batches", isAuthenticated, upload.single("uploadedInvoice"), submitDmcSettlementBatch);


router.post("/confirmation", isAuthenticated,
  upload.fields([
    { name: "supplierConfirmation", maxCount: 1 },
    { name: "voucherReference", maxCount: 1 },
    { name: "termsConditions", maxCount: 1 },
  ]),
  createOrUpdateConfirmation
);




export default router;
