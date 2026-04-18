import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  getAgentDashboard,
  createQuery,
  getMyQueries,
  getMyActiveBookings,
  getAgentFinanceOverview,
  uploadTravelerDocument,
  submitTravelerDocumentsForVerification,
  confirmQuotation,
  requestQuotationRevision,
  getMyInvoices,
  updatePaymentStatus,
  getQuotationsByQuery,
  acceptQuotationByAgent,
  getMyNotifications,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/agentController.js";
 
const routers = express.Router();

/* 🔹 DASHBOARD */
routers.get("/dashboard",isAuthenticated, getAgentDashboard);

//============ Notification Routes=============

routers.get("/notifications", isAuthenticated, getMyNotifications);
routers.patch("/notifications/read-all", isAuthenticated, markAllNotificationsRead);
routers.delete("/notifications/:id", isAuthenticated, deleteNotification);


/* 🔹 TRAVEL QUERIES */
routers.post("/queries", isAuthenticated, createQuery);
routers.get("/getAllQueries",isAuthenticated, getMyQueries);
routers.get("/active-bookings", isAuthenticated, getMyActiveBookings);
routers.get("/finance-overview", isAuthenticated, getAgentFinanceOverview);
routers.put("/queries/:queryId/travelers/:travelerId/document", isAuthenticated, upload.single("travelerDocument"), uploadTravelerDocument);
routers.patch("/queries/:queryId/traveler-documents/submit", isAuthenticated, submitTravelerDocumentsForVerification);


/* 🔹 QUOTATIONS */
routers.get("/quotations/query/:queryId", isAuthenticated, getQuotationsByQuery);
routers.put("/quotations/:id/revision", isAuthenticated, requestQuotationRevision);
routers.patch("/quotations/:id/accept",isAuthenticated, acceptQuotationByAgent);
routers.put("/quotations/:id/confirm", isAuthenticated, confirmQuotation);

/* 🔹 INVOICES & PAYMENTS */
routers.get("/invoices", isAuthenticated, getMyInvoices);
routers.put("/invoices/:id/payment-status", isAuthenticated, upload.single("paymentReceipt"), updatePaymentStatus);

export default routers;
