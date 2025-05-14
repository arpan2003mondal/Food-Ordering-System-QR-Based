import express from "express";
import {
  login,
  logout,
  register,
  resetPassword,
  sendResetOtp,
} from "../controllers/adminControllers.js";

import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

const adminRouter = express.Router();

adminRouter.post("/register", register);

adminRouter.get("/login" ,(req , res)=>{
  res.render('admin/login');
});

adminRouter.post("/login", login);
adminRouter.post("/logout", authenticateUser, logout);

adminRouter.get('/forgot-password', (req, res) => {
  res.render('admin/send-otp');
});

adminRouter.post("/send-otp", sendResetOtp);

adminRouter.get('/reset-password', (req, res) => {
  res.render('admin/reset-password');
});
adminRouter.post("/reset-password", resetPassword);

export default adminRouter;
