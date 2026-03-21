import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { getAgentDashboard, createQuery, getMyQueries,confirmQuotation, getMyInvoices, updatePaymentStatus, 
getQuotationsByQuery,acceptQuotationByAgent} from "../controllers/agentController.js";
 
const routers = express.Router();

/* 🔹 DASHBOARD */
routers.get("/dashboard", getAgentDashboard);

/* 🔹 TRAVEL QUERIES */
routers.post("/queries", isAuthenticated, createQuery);
routers.get("/getAllQueries",isAuthenticated, getMyQueries);

/* 🔹 QUOTATIONS */
routers.get("/quotations/query/:queryId", isAuthenticated, getQuotationsByQuery);
// routers.put("/quotations/:id/revision", requestQuotationRevision);
routers.patch("/quotations/:id/accept",isAuthenticated, acceptQuotationByAgent);
routers.put("/quotations/:id/confirm", confirmQuotation);

/* 🔹 INVOICES & PAYMENTS */
routers.get("/invoices", getMyInvoices);
routers.put("/invoices/:id/payment-status", updatePaymentStatus);

export default routers;