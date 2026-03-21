import express from "express";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { getPendingAgents, approveAgent, getAllUsers,createRateContract, deactivateRateContract, getSystemStats, getAllPayments, updateRateContract, createOperationsUser, createDmcPartner} from "../controllers/adminController.js";

const routers = express.Router();

routers.get("/pending-agents", getPendingAgents);
routers.put("/approve-agent/:id" , isAuthenticated, approveAgent);

routers.get("/users", getAllUsers);
routers.post("/create-operations", createOperationsUser);
routers.post("/create-dmc", createDmcPartner);
// routers.put("/users/:id/role", isAuthenticated, changeUserRole);

routers.post("/rate-contract", isAuthenticated, createRateContract);
routers.put("/rate-contract/:contractId", isAuthenticated, updateRateContract );
routers.put("/rate-contract/:id/deactivate", deactivateRateContract);

routers.get("/stats", isAuthenticated , getSystemStats);
routers.get("/payments", getAllPayments);

export default routers;
