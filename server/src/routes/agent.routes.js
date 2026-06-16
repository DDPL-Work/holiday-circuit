import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  getAgentDashboard,
  createQuery,
  getMyQueries,
  getMyActiveBookings,
  ensureActiveBookingInvoice,
  getAgentFinanceOverview,
  uploadTravelerDocument,
  removeTravelerDocument,
  submitTravelerDocumentsForVerification,
  confirmQuotation,
  requestQuotationRevision,
  getMyInvoices,
  getHotelRateDestinations,
  applyCouponToInvoice,
  updatePaymentStatus,
  generateAgentFinancePaymentReceipt,
  getQuotationsByQuery,
  acceptQuotationByAgent,
  generateClientQuotationPdf,
  getMyNotifications,
  markAllNotificationsRead,
  deleteNotification,
  updateQueryByAgent,
  updateQuotationBranding,
} from "../controllers/agentController.js";
import { getAgentCoupons, markAgentCouponNotificationsRead } from "../controllers/couponController.js";

const routers = express.Router();

/* 🔹 DASHBOARD */
routers.get("/dashboard",isAuthenticated, getAgentDashboard);

//============ Notification Routes=============

routers.get("/notifications", isAuthenticated, getMyNotifications);
routers.patch("/notifications/read-all", isAuthenticated, markAllNotificationsRead);
routers.delete("/notifications/:id", isAuthenticated, deleteNotification);
routers.get("/coupons", isAuthenticated, getAgentCoupons);
routers.patch("/coupons/read", isAuthenticated, markAgentCouponNotificationsRead);


/* 🔹 TRAVEL QUERIES */
routers.post("/queries", isAuthenticated, createQuery);
routers.put("/queries/:queryId", isAuthenticated, updateQueryByAgent);
routers.get("/hotel-rate-destinations", isAuthenticated, getHotelRateDestinations);
routers.get("/getAllQueries",isAuthenticated, getMyQueries);
routers.get("/active-bookings", isAuthenticated, getMyActiveBookings);
routers.post("/quotations/:id/ensure-invoice", isAuthenticated, ensureActiveBookingInvoice);
routers.get("/finance-overview", isAuthenticated, getAgentFinanceOverview);
routers.put("/queries/:queryId/travelers/:travelerId/document", isAuthenticated, upload.single("travelerDocument"), uploadTravelerDocument);
routers.delete("/queries/:queryId/travelers/:travelerId/document/:documentKey", isAuthenticated, removeTravelerDocument);
routers.patch("/queries/:queryId/traveler-documents/submit", isAuthenticated, submitTravelerDocumentsForVerification);

/* 🔹 QUOTATIONS */
routers.get("/quotations/query/:queryId", isAuthenticated, getQuotationsByQuery);
routers.get("/quotations/:id/client-pdf", isAuthenticated, generateClientQuotationPdf);
routers.put("/quotations/:id/revision", isAuthenticated, requestQuotationRevision);
routers.patch("/quotations/:id/accept",isAuthenticated, acceptQuotationByAgent);
routers.patch("/quotations/:id/branding", isAuthenticated, upload.single("agentLogo"), updateQuotationBranding);
routers.put("/quotations/:id/confirm", isAuthenticated, confirmQuotation);

/* 🔹 INVOICES & PAYMENTS */
routers.get("/invoices", isAuthenticated, getMyInvoices);
routers.post("/invoices/:id/apply-coupon", isAuthenticated, applyCouponToInvoice);
routers.post("/invoices/:id/payment-receipts/:installmentIndex/generate", isAuthenticated, generateAgentFinancePaymentReceipt);
routers.put("/invoices/:id/payment-status", isAuthenticated, upload.single("paymentReceipt"), updatePaymentStatus);

export default routers;
