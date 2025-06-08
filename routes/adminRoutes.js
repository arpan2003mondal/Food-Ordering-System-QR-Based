import express from "express";
import {
  login,
  logout,
  renderAdminRegister,
  adminRegister,
  resetPassword,
  sendResetOtp,
} from "../controllers/adminControllers.js";

import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const adminRouter = express.Router();

// GET - Render admin registration page
adminRouter.get('/register', renderAdminRegister);

// POST - Handle admin registration
adminRouter.post('/register', adminRegister);

adminRouter.get("/login" ,(req , res)=>{
  res.render('admin/login');
});

adminRouter.post("/login", login);

adminRouter.post("/logout", authenticateAdmin, logout);

adminRouter.get('/forgot-password', (req, res) => {
  res.render('admin/send-otp');
});

adminRouter.post("/send-otp", sendResetOtp);

adminRouter.get('/reset-password', (req, res) => {
  res.render('admin/reset-password');
});
adminRouter.post("/reset-password", resetPassword);

export default adminRouter;
