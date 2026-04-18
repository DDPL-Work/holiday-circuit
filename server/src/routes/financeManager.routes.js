import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import {
  createFinanceTeamMember,
  getFinanceManagerTeam,
} from "../controllers/financeManagerController.js";
import {
  getPaymentVerifications,
  reviewPaymentVerification,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/team", isAuthenticated, getFinanceManagerTeam);
router.post("/team", isAuthenticated, createFinanceTeamMember);
router.get("/team-transactions", isAuthenticated, getPaymentVerifications);
router.patch("/team-transactions/:id/status", isAuthenticated, reviewPaymentVerification);

export default router;
