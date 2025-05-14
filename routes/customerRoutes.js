import express from "express";
import authenticateCustomer from "../middleware/customerAuthMiddleware.js";
import {
  addToCart,
  getFoodDetails,
  initiatePayment,
  placeOrder,
  qrScanRoute,
  verifyPayment,
  viewCart,
  viewMenu,
  deleteFromCart,
  updateCartItemQuantity, // ✅ Import deleteFromCart
} from "../controllers/customeControllers.js";

const customerRouter = express.Router();

// QR Code Scan Route
customerRouter.get("/menu/:tableId", qrScanRoute);

// View menu Route
customerRouter.get("/menu/", authenticateCustomer, viewMenu);

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

export default customerRouter;
