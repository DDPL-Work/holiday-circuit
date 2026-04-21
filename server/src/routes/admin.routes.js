import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { getPendingAgents, approveAgent, getAllUsers, createRateContract, deactivateRateContract, getSystemStats, getAllPayments, updateRateContract, createOperationsUser, createDmcPartner, createFinancePartner, getFinanceDashboard, getAdvancedAnalytics, getInternalInvoices, updateInternalInvoiceStatus, getPaymentVerifications, reviewPaymentVerification, getAdminDashboardData, getManagedUsers, createManagedUser, updateManagedUser, updateManagedUserStatus, deleteManagedUser, replyToOpsEscalation } from "../controllers/adminController.js";
import { getMyNotifications, markAllNotificationsRead, deleteNotification } from "../controllers/agentController.js";
import { getOperationManagerQueryQuotations } from "../controllers/opsManagerController.js";

const routers = express.Router();

routers.get("/pending-agents", isAuthenticated, getPendingAgents);
routers.put("/approve-agent/:id" , isAuthenticated, approveAgent);
routers.get("/agent-approvals", isAuthenticated, getPendingAgents);
routers.patch("/agent-approvals/:id/review", isAuthenticated, approveAgent);

routers.get("/users", isAuthenticated, getAllUsers);
routers.get("/managed-users", isAuthenticated, getManagedUsers);
routers.post("/managed-users", isAuthenticated, createManagedUser);
routers.patch("/managed-users/:id", isAuthenticated, updateManagedUser);
routers.patch("/managed-users/:id/status", isAuthenticated, updateManagedUserStatus);
routers.delete("/managed-users/:id", isAuthenticated, deleteManagedUser);
routers.post("/create-operations",isAuthenticated, createOperationsUser);
routers.post("/create-dmc",isAuthenticated, createDmcPartner);
routers.post("/create-finance-partner",isAuthenticated,createFinancePartner);
// routers.put("/users/:id/role", isAuthenticated, changeUserRole);

routers.post("/rate-contract", isAuthenticated, createRateContract);
routers.put("/rate-contract/:contractId", isAuthenticated, updateRateContract );
routers.put("/rate-contract/:id/deactivate", deactivateRateContract);

routers.get("/stats", isAuthenticated , getSystemStats);
routers.get("/dashboard", isAuthenticated, getAdminDashboardData);
routers.get("/queries/:queryId/quotations", isAuthenticated, getOperationManagerQueryQuotations);
routers.patch("/queries/:id/reply-to-ops", isAuthenticated, replyToOpsEscalation);
routers.get("/payments", getAllPayments);
routers.get("/payment-verifications", isAuthenticated, getPaymentVerifications);
routers.patch("/payment-verifications/:id/status", isAuthenticated, reviewPaymentVerification);
routers.get("/finance-dashboard", isAuthenticated, getFinanceDashboard);
routers.get("/advanced-analytics", isAuthenticated, getAdvancedAnalytics);
routers.get("/internal-invoices", isAuthenticated, getInternalInvoices);
routers.patch("/internal-invoices/:id/status", isAuthenticated, updateInternalInvoiceStatus);
routers.get("/notifications", isAuthenticated, getMyNotifications);
routers.patch("/notifications/read-all", isAuthenticated, markAllNotificationsRead);
routers.delete("/notifications/:id", isAuthenticated, deleteNotification);

export default routers;
