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
import logger from "../utils/logger.js";
import adminModel from "../model/adminModel.js";
const adminRouter = express.Router();

// GET - Render admin registration page
adminRouter.get('/register', renderAdminRegister);

// POST - Handle admin registration
adminRouter.post('/register', adminRegister);

adminRouter.get("/login", async (req, res) => {
  // Check if admin session exists
  if (req.session && req.session.user) {
    try {
      const admin = await adminModel.findById(req.session.user.id);
      if (admin) {
        // If admin exists and is logged in, redirect to dashboard
        return res.redirect("/admin/dashboard");
      }
    } catch (error) {
      // Log the error (optional)
      logger.error("Error checking admin session on login route", {
        message: error.message,
        stack: error.stack,
        userId: req.session.user?.id,
      });
    }
  }

  // If no session, render login page
  res.render("admin/login");
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
