// Enhanced Customer Controller with Improvements

import Food from "../model/foodModel.js";
import Cart from "../model/cartModel.js";
import Order from "../model/orderModel.js";

// Helper: Calculate total amount
const calculateTotalAmount = (items) => {
  return items.reduce(
    (total, item) => total + (item.foodId.price || 0) * item.quantity,
    0
  );
};

// Middleware for session validation
export const checkSession = (req, res, next) => {
  if (!req.session.tableId) {
    return res
      .status(400)
      .json({ success: false, message: "Table ID not found in session!" });
  }
  next();
};

export const qrScanRoute = async (req, res) => {
  const { tableId } = req.params;

  try {
    // Save table ID to session
    req.session.tableId = tableId;
    
    // Fetch all food items
    const foodItems = await Food.find().sort({ name: 1 });

    // Extract unique categories from food items
    const categorySet = new Set(foodItems.map(item => item.category));
    const categories = Array.from(categorySet);
    

    // Flash a success message
    req.flash("success", "Menu loaded successfully!");

    // Render the home page with categories instead of individual food items
    res.render("customer/home", {
      categories,   // Pass category names
      tableId,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading menu:", error.message);

    req.flash("error", "Something went wrong loading the menu.");
    res.status(500).render("customer/home", {
      categories: [],
      tableId,
      messages: req.flash(),
    });
  }
};


export const viewMenu = async (req, res) => {
  try {
    const foodItems = await Food.find();
    res.status(200).json({
      success: true,
      message: "Menu fetched successfully! viewMenu",
      tableId: req.session.tableId,
      menu: foodItems,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching menu!",
        error: error.message,
      });
  }
};

export const getFoodDetails = async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) {
    return res
      .status(400)
      .json({ success: false, message: "itemId is required!" });
  }
  try {
    const foodItem = await Food.findById(itemId);
    if (!foodItem) {
      return res
        .status(404)
        .json({ success: false, message: "Food item not found!" });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Food item details fetched successfully!",
        foodItem,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching food item details!",
        error: error.message,
      });
  }
};

export const searchFood = async (req, res) => {
  const { q, category, veg, sort } = req.query;
  const query = {};
  if (q) query.name = { $regex: q, $options: "i" };
  if (category) query.category = category;
  if (veg === "true") query.isVegetarian = true;
  let sortOption = {};
  if (sort === "price_asc") sortOption.price = 1;
  else if (sort === "price_desc") sortOption.price = -1;

  try {
    const results = await Food.find(query).sort(sortOption);
    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No food items found." });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Search successful!",
        total: results.length,
        results,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Search failed", error: err.message });
  }
};

export const addToCart = async (req, res) => {
  const { itemId, quantity } = req.query;
  const tableId = req.session.tableId;
  if (!itemId || isNaN(quantity)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid itemId or quantity!" });
  }
  try {
    const foodItem = await Food.findById(itemId);
    if (!foodItem) {
      return res
        .status(404)
        .json({ success: false, message: "Food item not found!" });
    }
    let cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );
    const qty = parseInt(quantity) || 1;
    if (!cart) {
      cart = new Cart({
        tableId,
        items: [{ foodId: itemId, quantity: qty }],
        totalAmount: foodItem.price * qty,
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.foodId._id.toString() === itemId
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ foodId: itemId, quantity: qty });
      }
      cart.totalAmount = calculateTotalAmount(cart.items);
    }
    await cart.save();
    await cart.populate("items.foodId");
    res
      .status(200)
      .json({ success: true, message: "Item added to cart!", cart });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error adding to cart!",
        error: error.message,
      });
  }
};

export const viewCart = async (req, res) => {
  const tableId = req.session.tableId;
  try {
    const cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );
    if (!cart || cart.items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cart is empty!" });
    }
    cart.totalAmount = calculateTotalAmount(cart.items);
    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Cart fetched successfully!", cart });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching cart!",
        error: error.message,
      });
  }
};

export const deleteFromCart = async (req, res) => {
  const { itemId } = req.query;
  const tableId = req.session.tableId;
  try {
    let cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );
    if (!cart || cart.items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cart is empty!" });
    }
    cart.items = cart.items.filter(
      (item) => item.foodId._id.toString() !== itemId
    );
    cart.totalAmount = calculateTotalAmount(cart.items);
    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Item removed from cart!", cart });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error removing item!",
        error: error.message,
      });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  const { itemId, action } = req.query;
  const tableId = req.session.tableId;
  try {
    let cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );
    const itemIndex = cart.items.findIndex(
      (item) => item.foodId._id.toString() === itemId
    );
    if (itemIndex === -1)
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart!" });
    if (action === "increase") cart.items[itemIndex].quantity++;
    else if (action === "decrease" && cart.items[itemIndex].quantity > 1)
      cart.items[itemIndex].quantity--;
    else cart.items.splice(itemIndex, 1);
    cart.totalAmount = calculateTotalAmount(cart.items);
    await cart.save();
    res.status(200).json({ success: true, message: "Cart updated!", cart });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error updating cart!",
        error: error.message,
      });
  }
};

export const placeOrder = async (req, res) => {
  const tableId = req.session.tableId;
  try {
    const cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );
    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty!" });
    }
    const newOrder = new Order({
      tableId,
      items: cart.items,
      totalAmount: cart.totalAmount,
      status: "pending",
    });
    await newOrder.save();
    cart.status = "ordered";
    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Order placed!", orderId: newOrder._id });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error placing order!",
        error: error.message,
      });
  }
};

export const initiatePayment = async (req, res) => {
  const { orderId } = req.query;
  try {
    const order = await Order.findById(orderId);
    if (!order || order.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or already paid order!" });
    }
    const paymentId = `PAY_${Date.now()}`;
    order.paymentId = paymentId;
    order.paymentStatus = "processing";
    await order.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Payment initiated!",
        paymentId,
        orderId: order._id,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error initiating payment!",
        error: error.message,
      });
  }
};

export const verifyPayment = async (req, res) => {
  const { orderId, paymentId, status } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order || order.paymentId !== paymentId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment or order!" });
    }
    order.paymentStatus = status === "success" ? "paid" : "failed";
    order.status = status === "success" ? "completed" : "pending";
    await order.save();
    res
      .status(200)
      .json({ success: true, message: "Payment verified!", order });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error verifying payment!",
        error: error.message,
      });
  }
};