import express from "express";
import {
  getPastOrders,
  getStaffDashboard,
  login,
  logout,
  updateOrderStatus,
  reconfirmCancelledOrder,
  clearAllPastOrders,
  getMenuManagement,
  toggleItemAvailability,
} from "../controllers/staffControllers.js";
import { authenticateStaff } from "../middleware/staffAuthMiddleware.js";
import staffModel from "../model/staffModel.js"; // Ensure this is imported
import logger from "../utils/logger.js"; // Reuse your logger

const staffRouter = express.Router();

staffRouter.get("/login", async (req, res) => {
  // Check if staff session exists
  if (req.session && req.session.user) {
    try {
      const staff = await staffModel.findById(req.session.user.id);
      if (staff) {
        // If staff exists and is logged in, redirect to dashboard
        return res.redirect("/staff/dashboard");
      }
    } catch (error) {
      logger.error("Error checking staff session on login route", {
        message: error.message,
        stack: error.stack,
        userId: req.session.user?.id,
      });
    }
  }

  // If no session or invalid, show login page
  res.render("staff/login");
});


staffRouter.post("/login", login);

staffRouter.get("/dashboard", authenticateStaff, getStaffDashboard);

// get past orders
staffRouter.get("/past-orders",authenticateStaff,getPastOrders)

staffRouter.post("/logout", authenticateStaff, logout);

// This handles all status update button submissions
staffRouter.post("/orders/:id/status", authenticateStaff, updateOrderStatus);

// reconfirm cancelled order
staffRouter.post("/orders/:id/reconfirm", authenticateStaff, reconfirmCancelledOrder);

// Clear all past orders
staffRouter.delete("/past-orders/clear-all", authenticateStaff, clearAllPastOrders);

// Staff Menu Management Routes
staffRouter.get('/menu', authenticateStaff,getMenuManagement);

staffRouter.post('/menu/:itemId/toggle-availability', authenticateStaff,toggleItemAvailability);


export default staffRouter;
