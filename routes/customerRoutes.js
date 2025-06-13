import express from "express";
import authenticateCustomer from "../middleware/customerAuthMiddleware.js";
import {
  addToCart,
  placeOrder,
  qrScanRoute,
  viewHomePage,        // NEW: Home page controller
  viewCategory,
  viewCart,
  viewMenu,
  getAllFoods,
  searchFood,
  updateCartItemQuantity,
  renderOrderConfirmation,
  renderReviewForm,
  submitReviews
} from "../controllers/customerControllers.js";

const customerRouter = express.Router();

// QR Code Scan Route - redirects to home page
customerRouter.get("/home/:tableId", qrScanRoute);

// NEW: Home Page Route
customerRouter.get("/home", authenticateCustomer, viewHomePage);

// Category page (keeping for backward compatibility)
customerRouter.get("/category", authenticateCustomer, viewCategory);

// View menu Route
customerRouter.get("/category/:categoryName", authenticateCustomer, viewMenu);

// Get All Food Items
customerRouter.get("/all-menu", authenticateCustomer, getAllFoods);

// Search route
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

//====================add this routes=================

customerRouter.get("/review/add",authenticateCustomer, renderReviewForm);
customerRouter.post("/review/submit",authenticateCustomer, submitReviews);



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


// review routes

// customerRouter.get("/reviews/:foodId",authenticateCustomer, getFoodReviews);
// customerRouter.put("/review/update",authenticateCustomer, updateReview);