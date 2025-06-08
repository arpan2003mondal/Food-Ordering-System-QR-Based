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
  showSalesReport,
  fetchSalesData,
  viewAllStaff,
  renderEditStaffPage,
  updateStaff,
} from "../controllers/adminDashBoardControllers.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const adminDashboardRouter = express.Router();

// ✅ Apply middleware to all admin dashboard routes
adminDashboardRouter.use(authenticateAdmin);

adminDashboardRouter.get("/", dashboard);

adminDashboardRouter.get("/add-food", renderAddFoodPage);
adminDashboardRouter.post("/add-food", upload.single("image"), addNewFoodItem);

adminDashboardRouter.get("/update-food/:id", renderEditFoodPage);
adminDashboardRouter.post("/update-food/:id", upload.single("image"), updateFoodItem);

adminDashboardRouter.get("/delete-food/:id", deleteFoodItem);

// Search route
adminDashboardRouter.get("/search", searchFood);

// staff controls

adminDashboardRouter.get('/view-staff', viewAllStaff);
adminDashboardRouter.get('/edit-staff/:id', renderEditStaffPage);
adminDashboardRouter.post('/update-staff/:id', updateStaff);

// Staff routes
adminDashboardRouter.get("/add-staff", renderAddStaffPage);

adminDashboardRouter.post("/register-staff", registerStaff);

// sales report

adminDashboardRouter.get("/sales-report",showSalesReport);

adminDashboardRouter.post("/sales-report",fetchSalesData);



export default adminDashboardRouter;
