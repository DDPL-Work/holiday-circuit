import express from "express";
import { registerAgent, login  } from "../controllers/agentController.js";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { approveAgent } from "../controllers/adminController.js";

const routes = express.Router();

routes.post("/register", registerAgent);
routes.post("/login", login);
routes.put("/approve-agent/:id", isAuthenticated, approveAgent );

// route.post( "/query", authenticateUser, authorizeRoles("agent"), submitTravelQuery );
// route.get( "/my-queries", authenticateUser, authorizeRoles("agent"), getMyQueries) ;

export default routes;
