import express from "express";
import authenticateCustomer from "../middleware/customerAuthMiddleware.js";
import {
  addToCart,
  placeOrder,
  qrScanRoute,
  viewCategory,
  viewCart,
  viewMenu,
  getAllFoods,
  searchFood,
  updateCartItemQuantity,
  renderOrderConfirmation
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

// search route 
customerRouter.get("/search", authenticateCustomer, searchFood);

// Add to Cart Route
customerRouter.post("/cart/add", authenticateCustomer, addToCart);

// View Cart Route
customerRouter.get("/cart/view", authenticateCustomer, viewCart);

// Place Order Route
customerRouter.post("/placeOrder", authenticateCustomer, placeOrder);

// update quantity route
customerRouter.put("/cart/update", authenticateCustomer, updateCartItemQuantity);


// show my orders
customerRouter.get("/order-confirmation", authenticateCustomer, renderOrderConfirmation);

export default customerRouter;


// << Fututure Works >>

// Get Food Item Details with Query String
// customerRouter.get("/food/details", authenticateCustomer, getFoodDetails);

// // Payment Route
// customerRouter.post("/payment/initiate", authenticateCustomer, initiatePayment);

// // Verify Payment Route
// customerRouter.post("/payment/verify", authenticateCustomer, verifyPayment);

// Delete from Cart Route
// customerRouter.delete("/cart/delete", authenticateCustomer, deleteFromCart);

