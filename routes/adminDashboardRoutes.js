import express from "express";
import {upload} from "../middleware/multer.js";

const adminDashboardRouter = express.Router();

import {
  addNewFoodItem,
  dashboard,
  deleteFoodItem,
  updateFoodItem,
  renderAddFoodPage,
  renderEditFoodPage,
  searchFood
} from "../controllers/adminDashBoard.js";
import { authenticateUser } from "../middleware/adminAuthMiddleware.js";

adminDashboardRouter.get("/", authenticateUser, dashboard);

adminDashboardRouter.get("/add-food",authenticateUser,renderAddFoodPage);
adminDashboardRouter.post("/add-food",upload.single("image"), authenticateUser, addNewFoodItem);

adminDashboardRouter.get("/update-food/:id",authenticateUser,renderEditFoodPage);
adminDashboardRouter.post("/update-food/:id",  upload.single('image'),authenticateUser, updateFoodItem);

adminDashboardRouter.get("/delete-food/:id",authenticateUser, deleteFoodItem);

// search route 
adminDashboardRouter.get("/search", authenticateUser, searchFood);

export default adminDashboardRouter;
