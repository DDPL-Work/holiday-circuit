import express from "express";
import { registerAgent, login  } from "../controllers/agentController.js";
import { upload } from "../middlewares/multer.middlewares.js";


const routes = express.Router();

routes.post("/register", upload.array("documents", 5), registerAgent);
routes.post("/login", login);

export default routes;
