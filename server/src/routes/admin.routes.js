import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { getPendingAgents, approveAgent, getAllUsers, createRateContract, deactivateRateContract, getSystemStats, getAllPayments, updateRateContract, createOperationsUser, createDmcPartner, createFinancePartner, getFinanceDashboard, getAdvancedAnalytics, getInternalInvoices, updateInternalInvoiceStatus, getPaymentVerifications, reviewPaymentVerification, sendFinalInvoiceToAgent, sendPaymentReceiptToAgent, verifyPaymentTrackerInstallment, getAdminDashboardData, getManagedUsers, createManagedUser, updateManagedUser, updateManagedUserStatus, deleteManagedUser, restoreManagedUser, permanentlyDeleteManagedUser, replyToOpsEscalation, resolveAdminOverrideCase, getFinanceDmcVendors, uploadManualBulkInvoice, previewManualInvoiceExtraction } from "../controllers/adminController.js";
import { createCoupon, deleteCoupon, generateCouponCode, getAdminCoupons, sendCouponToAgent, updateCoupon } from "../controllers/couponController.js";
import { getMyNotifications, markAllNotificationsRead, deleteNotification } from "../controllers/agentController.js";
import { getOperationManagerQueryQuotations } from "../controllers/opsManagerController.js";
import { getVoucheredQueries, getQueryDetails } from "../controllers/admin.bookingStatistics.controller.js";
import { createTermsAndConditions, updateTermsAndConditions, fetchTermsAndConditions, fetchByIDTermsAndConditions, deleteTermsAndConditions } from "../controllers/adminTerms.controller.js";
import { getIncExcPresets, getIncExcPresetById, createIncExcPreset, updateIncExcPreset, deleteIncExcPreset } from "../controllers/adminIncExc.controller.js";
import multer from "multer";

const routers = express.Router();
const manualBulkInvoiceUpload = multer({
  storage: multer.diskStorage({
    destination: function (_req, _file, cb) { cb(null, "uploads/") },
    filename: function (_req, file, cb) { cb(null, Date.now() + "-" + file.originalname) },
  }),
});

routers.get("/pending-agents", isAuthenticated, getPendingAgents);
routers.put("/approve-agent/:id" , isAuthenticated, approveAgent);
routers.get("/agent-approvals", isAuthenticated, getPendingAgents);
routers.patch("/agent-approvals/:id/review", isAuthenticated, approveAgent);

routers.get("/users", isAuthenticated, getAllUsers);
routers.get("/managed-users", isAuthenticated, getManagedUsers);
routers.post("/managed-users", isAuthenticated, createManagedUser);
routers.patch("/managed-users/:id", isAuthenticated, updateManagedUser);
routers.patch("/managed-users/:id/status", isAuthenticated, updateManagedUserStatus);
routers.patch("/managed-users/:id/restore", isAuthenticated, restoreManagedUser);
routers.delete("/managed-users/:id", isAuthenticated, deleteManagedUser);
routers.delete("/managed-users/:id/permanent", isAuthenticated, permanentlyDeleteManagedUser);
routers.post("/create-operations",isAuthenticated, createOperationsUser);
routers.post("/create-dmc",isAuthenticated, createDmcPartner);
routers.post("/create-finance-partner",isAuthenticated,createFinancePartner);
// routers.put("/users/:id/role", isAuthenticated, changeUserRole);
routers.get("/coupons", isAuthenticated, getAdminCoupons);
routers.get("/coupons/generate-code", isAuthenticated, generateCouponCode);
routers.post("/coupons", isAuthenticated, createCoupon);
routers.patch("/coupons/:id", isAuthenticated, updateCoupon);
routers.delete("/coupons/:id", isAuthenticated, deleteCoupon);
routers.post("/coupons/:id/send", isAuthenticated, sendCouponToAgent);

routers.post("/rate-contract", isAuthenticated, createRateContract);
routers.put("/rate-contract/:contractId", isAuthenticated, updateRateContract );
routers.put("/rate-contract/:id/deactivate", deactivateRateContract);

routers.get("/stats", isAuthenticated , getSystemStats);
routers.get("/dashboard", isAuthenticated, getAdminDashboardData);
routers.get("/queries/:queryId/quotations", isAuthenticated, getOperationManagerQueryQuotations);
routers.patch("/queries/:id/reply-to-ops", isAuthenticated, replyToOpsEscalation);

routers.get("/booking-statistics/vouchered", isAuthenticated, getVoucheredQueries);
routers.get("/booking-statistics/query/:id", isAuthenticated, getQueryDetails);

routers.patch("/override-cases/:targetType/:id/resolve", isAuthenticated, resolveAdminOverrideCase);
routers.get("/payments", getAllPayments);
routers.get("/payment-verifications", isAuthenticated, getPaymentVerifications);
routers.patch("/payment-verifications/:id/status", isAuthenticated, reviewPaymentVerification);
routers.post("/payment-verifications/:id/send-final-invoice", isAuthenticated, sendFinalInvoiceToAgent);
routers.post("/payment-verifications/:id/send-payment-receipt", isAuthenticated, sendPaymentReceiptToAgent);
routers.post("/payment-verifications/:id/tracker-installments/:installmentIndex/verify", isAuthenticated, verifyPaymentTrackerInstallment);
routers.get("/finance-dashboard", isAuthenticated, getFinanceDashboard);
routers.get("/advanced-analytics", isAuthenticated, getAdvancedAnalytics);
routers.get("/internal-invoices", isAuthenticated, getInternalInvoices);
routers.get("/vendors", isAuthenticated, getFinanceDmcVendors);
routers.post(
  "/internal-invoices/parse-upload",
  isAuthenticated,
  manualBulkInvoiceUpload.single("uploadedInvoice"),
  previewManualInvoiceExtraction,
);
routers.post(
  "/internal-invoices/manual-bulk-upload",
  isAuthenticated,
  manualBulkInvoiceUpload.single("uploadedInvoice"),
  uploadManualBulkInvoice,
);
routers.patch("/internal-invoices/:id/status", isAuthenticated, updateInternalInvoiceStatus);
routers.get("/notifications", isAuthenticated, getMyNotifications);
routers.patch("/notifications/read-all", isAuthenticated, markAllNotificationsRead);
routers.delete("/notifications/:id", isAuthenticated, deleteNotification);

routers.get("/terms", isAuthenticated, fetchTermsAndConditions);
routers.post("/terms", isAuthenticated, createTermsAndConditions);
routers.get("/terms/:id", isAuthenticated, fetchByIDTermsAndConditions);
routers.put("/terms/:id", isAuthenticated, updateTermsAndConditions);
routers.delete("/terms/:id", isAuthenticated, deleteTermsAndConditions);

routers.get("/inc-exc-presets", isAuthenticated, getIncExcPresets);
routers.get("/inc-exc-presets/:id", isAuthenticated, getIncExcPresetById);
routers.post("/inc-exc-presets", isAuthenticated, createIncExcPreset);
routers.put("/inc-exc-presets/:id", isAuthenticated, updateIncExcPreset);
routers.delete("/inc-exc-presets/:id", isAuthenticated, deleteIncExcPreset);

export default routers;
