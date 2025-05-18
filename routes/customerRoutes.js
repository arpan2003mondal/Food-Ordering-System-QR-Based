import express from "express";
import authenticateCustomer from "../middleware/customerAuthMiddleware.js";
import {
  addToCart,
  getFoodDetails,
  initiatePayment,
  placeOrder,
  qrScanRoute,
  viewCategory,
  verifyPayment,
  viewCart,
  viewMenu,
  getAllFoods,
  deleteFromCart,
  updateCartItemQuantity,
  searchFood,
} from "../controllers/customerControllers.js";

const customerRouter = express.Router();

// QR Code Scan Route
customerRouter.get("/home/:tableId", qrScanRoute);

// redirect to category page
customerRouter.get("/category", authenticateCustomer, viewCategory);

// View menu Route
customerRouter.get("/category/:categoryName", authenticateCustomer, viewMenu);

// Get All Food Items 
customerRouter.get("/all-menu", authenticateCustomer, getAllFoods);

// Get Food Item Details with Query String
customerRouter.get("/food/details", authenticateCustomer, getFoodDetails);

// Add to Cart Route
customerRouter.post("/cart/add", authenticateCustomer, addToCart);

// View Cart Route
customerRouter.get("/cart/view", authenticateCustomer, viewCart);

// Delete from Cart Route
customerRouter.delete("/cart/delete", authenticateCustomer, deleteFromCart);

// update quantity route
customerRouter.put("/cart/update", authenticateCustomer, updateCartItemQuantity);

// Place Order Route
customerRouter.post("/place/order", authenticateCustomer, placeOrder);

// Payment Route
customerRouter.post("/payment/initiate", authenticateCustomer, initiatePayment);

// Verify Payment Route
customerRouter.post("/payment/verify", authenticateCustomer, verifyPayment);

// search route 
customerRouter.get("/search", authenticateCustomer, searchFood);

export default customerRouter;