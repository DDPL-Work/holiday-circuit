import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import {getAllQueries, updateQueryStatus, createQuotation, addQuotationItem, reviseQuotation, generateInvoice, rejectQueryByOps, acceptQueryByOps, getOrderAcceptanceQueries, searchServices } from "../controllers/opsController.js";
import { sendQuotationController } from "../controllers/quotationNotificationController.js";
import { getAllServices } from "../controllers/dmcController.js";


const router = express.Router();

/* 🔹 QUERIES */
router.get("/queries", isAuthenticated, getAllQueries);
router.put("/queries/:id/status",isAuthenticated, updateQueryStatus);
router.patch("/queries/:id/reject-query", isAuthenticated, rejectQueryByOps);
router.patch("/queries/:id/accept", isAuthenticated, acceptQueryByOps);
router.get("/queries/order-acceptance",isAuthenticated, getOrderAcceptanceQueries);

/* 🔹 QUOTATIONS */
router.post("/quotations",isAuthenticated, createQuotation);
router.post("/quotations/:quotationId/items",isAuthenticated, addQuotationItem);
router.put("/quotations/:id/revise",isAuthenticated, reviseQuotation);

/* 🔹  SEARCH ROUTES  */
router.post('/search', isAuthenticated, searchServices);

/* 🔹  Notification ROUTES  */
router.post("/send",isAuthenticated, sendQuotationController);

/* 🔹  DMC GET ALL SERVICES ROUTES  */
router.get("/dmcAllGetServices", isAuthenticated, getAllServices);

/* 🔹 INVOICE */
router.post("/invoices",isAuthenticated, generateInvoice);

export default router;