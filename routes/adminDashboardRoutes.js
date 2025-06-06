import express from "express";
import { upload } from "../middleware/multer.js";
import {
  addNewFoodItem,
  dashboard,
  deleteFoodItem,
  updateFoodItem,
  renderAddFoodPage,
  renderEditFoodPage,
  searchFood,
  renderAddStaffPage,
  registerStaff,
} from "../controllers/adminDashBoardControllers.js";
import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

const adminDashboardRouter = express.Router();

// ✅ Apply middleware to all admin dashboard routes
adminDashboardRouter.use(authenticateUser);

adminDashboardRouter.get("/", dashboard);

adminDashboardRouter.get("/add-food", renderAddFoodPage);
adminDashboardRouter.post("/add-food", upload.single("image"), addNewFoodItem);

adminDashboardRouter.get("/update-food/:id", renderEditFoodPage);
adminDashboardRouter.post("/update-food/:id", upload.single("image"), updateFoodItem);

adminDashboardRouter.get("/delete-food/:id", deleteFoodItem);

// Search route
adminDashboardRouter.get("/search", searchFood);

// Staff routes
adminDashboardRouter.get("/add-staff", renderAddStaffPage);
adminDashboardRouter.post("/register-staff", registerStaff);

export default adminDashboardRouter;
