import express from "express";
import {
  registerAgent,
  login,
  updateProfile,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
} from "../controllers/agentController.js";
import isAuthenticated from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";


const routes = express.Router();

routes.post("/register", upload.array("documents", 5), registerAgent);
routes.post("/login", login);
routes.patch("/profile", isAuthenticated, updateProfile);
routes.post("/forgot-password/send-otp", sendForgotPasswordOtp);
routes.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
routes.post("/forgot-password/reset", resetPasswordWithOtp);

export default routes;
