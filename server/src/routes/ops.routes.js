import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import {
  acceptQueryByOps,
  addQuotationItem,
  addQuotationService,
  createQuotation,
  deleteQuotationService,
  generateInvoice,
  generateVoucher,
  getAllQueries,
  getOrderAcceptanceQueries,
  getOrCreateQuotationDraft,
  getVoucherManagementData,
  passToAdmin,
  rejectQueryByOps,
  reviewTravelerDocumentsByOps,
  saveQuotationDraft,
  reviseQuotation,
  searchServices,
  sendQuotation,
  sendVoucherToAgent,
  startQuotation,
  updateQueryStatus,
} from "../controllers/opsController.js";
import {
  createOperationTeamMember,
  getOperationManagerDashboard,
  getOperationManagerQueryQuotations,
  getOperationManagerQueries,
  getOperationManagerReassignPreview,
  getOperationManagerReassignmentDetails,
  reassignOperationManagerWorkload,
  submitOperationManagerReport,
} from "../controllers/opsManagerController.js";
import { sendQuotationController } from "../controllers/quotationNotificationController.js";
import { getAllServices } from "../controllers/dmcController.js";

const router = express.Router();

router.get("/queries", isAuthenticated, getAllQueries);
router.put("/queries/:id/status", isAuthenticated, updateQueryStatus);
router.patch("/queries/accept/:id", isAuthenticated, acceptQueryByOps);
router.patch("/queries/reject/:id", isAuthenticated, rejectQueryByOps);
router.patch("/queries/:id/traveler-documents/review", isAuthenticated, reviewTravelerDocumentsByOps);
router.get("/queries/order-acceptance", isAuthenticated, getOrderAcceptanceQueries);
router.patch("/queries/start-quotation/:id", isAuthenticated, startQuotation);
router.patch("/queries/send-quotation/:id", isAuthenticated, sendQuotation);
router.patch("/queries/pass-admin/:id", isAuthenticated, passToAdmin);
router.get("/queries/:queryId/quotation-draft", isAuthenticated, getOrCreateQuotationDraft);
router.put("/quotations/:quotationId/draft", isAuthenticated, saveQuotationDraft);
router.post("/quotations/:quotationId/services", isAuthenticated, addQuotationService);
router.delete("/quotations/:quotationId/services/:serviceId", isAuthenticated, deleteQuotationService);

router.post("/quotations", isAuthenticated, createQuotation);
router.post("/quotations/:quotationId/items", isAuthenticated, addQuotationItem);
router.put("/quotations/:id/revise", isAuthenticated, reviseQuotation);

router.post("/search", isAuthenticated, searchServices);
router.post("/send", isAuthenticated, sendQuotationController);
router.get("/dmcAllGetServices", isAuthenticated, getAllServices);

router.get("/vouchers", isAuthenticated, getVoucherManagementData);
router.patch("/vouchers/:id/generate", isAuthenticated, generateVoucher);
router.patch("/vouchers/:id/send", isAuthenticated, sendVoucherToAgent);

router.get("/manager/dashboard", isAuthenticated, getOperationManagerDashboard);
router.get("/manager/queries", isAuthenticated, getOperationManagerQueries);
router.get("/manager/queries/:queryId/quotations", isAuthenticated, getOperationManagerQueryQuotations);
router.get("/manager/reassign-preview/:userId", isAuthenticated, getOperationManagerReassignPreview);
router.get("/manager/reassignments/:userId", isAuthenticated, getOperationManagerReassignmentDetails);
router.post("/manager/team", isAuthenticated, createOperationTeamMember);
router.post("/manager/reassign", isAuthenticated, reassignOperationManagerWorkload);
router.post("/manager/report", isAuthenticated, submitOperationManagerReport);

router.post("/invoices", isAuthenticated, generateInvoice);

export default router;
