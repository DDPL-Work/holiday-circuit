import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import {createHotel,getHotels,getHotelById,updateHotel,deleteHotel, createActivity,getActivities,createTransfer ,getTransfers,createPackage,getPackages, createSightseeing, getSightseeing, deleteUpload, downloadUpload, createOrUpdateConfirmation, getConfirmedQueriesForDmc, submitInternalInvoice, } from "../controllers/dmcController.js";
import { bulkUpload, getBulkUploadHistory } from "../controllers/bulkUploadController.js";
import multer from "multer";


const router = express.Router();


/* 🔹 HOTEL ROUTES  */
router.post("/hotel",isAuthenticated, createHotel);
router.get("/hotel",isAuthenticated, getHotels);
router.get("/hotel/:id",isAuthenticated, getHotelById);
router.put("/hotel/:id",isAuthenticated, updateHotel);
router.delete("/hotel/:id",isAuthenticated, deleteHotel);

/* 🔹 ACTIVITY ROUTES  */
router.post("/activity",isAuthenticated, createActivity);
router.get("/activity",isAuthenticated, getActivities);

/* 🔹 TRANSFER ROUTES  */
router.post("/transfer",isAuthenticated, createTransfer);
router.get("/transfer",isAuthenticated, getTransfers);

/* 🔹 SIGHTSEEING ROUTES  */
router.post("/sightseeing", isAuthenticated, createSightseeing);
router.get("/sightseeing", isAuthenticated, getSightseeing);

/* 🔹  PACKAGE ROUTES  */
router.post("/package",isAuthenticated, createPackage);
router.get("/package",isAuthenticated, getPackages)

const storage = multer.diskStorage({destination: function(req,file,cb){cb(null,"uploads/")},
 filename: function(req,file,cb){cb(null,Date.now()+"-"+file.originalname)}
})
const upload = multer({ storage })
router.post("/bulk-upload", upload.single("file"), isAuthenticated, bulkUpload)
router.get("/bulk-upload-history", isAuthenticated, getBulkUploadHistory);
router.delete("/upload/:id",isAuthenticated, deleteUpload)
router.get("/upload/download/:id",isAuthenticated, downloadUpload)
router.get("/confirmation/queries", isAuthenticated, getConfirmedQueriesForDmc);
router.post("/internal-invoice", isAuthenticated, submitInternalInvoice);


router.post( "/confirmation",isAuthenticated,
  upload.fields([
    { name: "supplierConfirmation", maxCount: 1 },
    { name: "voucherReference", maxCount: 1 },
    { name: "termsConditions", maxCount: 1 },
  ]),
  createOrUpdateConfirmation
);




export default router;
