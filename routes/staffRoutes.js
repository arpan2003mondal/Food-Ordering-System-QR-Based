import express from "express";
import {
  getPastOrders,
  getStaffDashboard,
  login,
  logout,
  updateOrderStatus,
  reconfirmCancelledOrder,
  clearAllPastOrders,
} from "../controllers/staffControllers.js";
import { authenticateStaff } from "../middleware/staffAuthMiddleware.js";

const staffRouter = express.Router();

staffRouter.get("/login", (req, res) => {
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


export default staffRouter;
