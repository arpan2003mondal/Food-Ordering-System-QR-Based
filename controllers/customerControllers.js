import Food from "../model/foodModel.js";
import Cart from "../model/cartModel.js";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import LiveOrder from "../model/liveOrder.js";


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
    // Save table ID and a unique session key to session
    req.session.tableId = tableId;
    req.session.sessionKey = uuidv4(); // Unique identifier per customer session

    // Flash a success message
    req.flash("success", "Welcome To Our Restaurant");

    // Redirect to the category page
    return res.redirect("/api/customer/category");
  } catch (error) {
    console.error("QR Scan Error:", error.message);

    // Flash an error message
    req.flash("error", "Something went wrong loading the page. Please scan the QR code again.");
    return res.redirect("/");
  }
};


export const viewCategory = async (req, res) => {

  try {    
    const tableId = req.session.tableId || null;

    // Fetch all food items
    const foodItems = await Food.find().sort({ name: 1 });

    // Extract unique categories from food items
    const categorySet = new Set(foodItems.map(item => item.category));
    const categories = Array.from(categorySet);
    

    // Flash a success message
    // req.flash("success", "Menu loaded successfully!");

    // Render the home page with categories instead of individual food items
    res.render("customer/category", {
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
  const { categoryName } = req.params;

  try {
    // Filter food items by category (case insensitive)
    const foodItems = await Food.find({ category: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

    if (foodItems.length === 0) {
      req.flash("error", `No items found in ${categoryName} category.`);

    } else {
      req.flash("success", `${categoryName} items loaded successfully!`);
    }

    res.render("customer/category-menu", {
      category: categoryName,
      foodItems,
      tableId: req.session.tableId,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading category menu:", error.message);
    req.flash("error", "Failed to load menu items for this category.");
    res.status(500).render("customer/category-items", {
      category: categoryName,
      foodItems: [],
      tableId: req.session.tableId,
      messages: req.flash(),
    });
  }
};


export const getAllFoods = async (req, res) => {
  try {
    const tableId = req.session.tableId || null;

    // Fetch and sort food items alphabetically
    const foodItems = await Food.find().sort({ name: 1 });

    req.flash("success", "All Menu Items Loaded");

    res.render("customer/all-menu", {
      foodItems,
      tableId,
      messages: req.flash(),
    });
  } catch (error) {
    // console.error("Error fetching menu:", error.message);
    req.flash("error", "Failed to load menu.");
    res.status(500).redirect("/api/customer/category");
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


// search food items 
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
     req.flash("error", "No food items found.");
      return res.render("customer/search-results", {
        results,
        query: q,
        messages: req.flash(),
      });
    }

    req.flash("success", `${results.length} item(s) found.`);
    res.render("customer/search-results", {
      results,
      query: q,
      messages: req.flash(),
    });
  } catch (err) {
    req.flash("error", "Search failed. Try again.");
    res.redirect("/api/customer/category");
  }
};

// Add to cart

export const addToCart = async (req, res) => {
  const { itemId, quantity } = req.body;
  const { tableId, sessionKey } = req.session;

  if (!itemId || isNaN(quantity)) {
    req.flash("error", "Invalid request to add item.");
    return res.redirect("/api/customer/all-menu");
  }

  try {
    const foodItem = await Food.findById(itemId);
    if (!foodItem) {
      req.flash("error", "Food item not found.");
      return res.redirect("/api/customer/all-menu");
    }

    let cart = await Cart.findOne({ tableId, sessionKey, status: "active" }).populate("items.foodId");
    const qty = parseInt(quantity) || 1;

    if (!cart) {
      cart = new Cart({
        tableId,
        sessionKey,
        items: [{ foodId: itemId, quantity: qty }],
        totalAmount: foodItem.price * qty,
        status: "active",
      });
    } else {
      const index = cart.items.findIndex(item => item.foodId._id.toString() === itemId);
      if (index > -1) {
        cart.items[index].quantity += qty;
      } else {
        cart.items.push({ foodId: itemId, quantity: qty });
      }

      cart.totalAmount = cart.items.reduce(
        (sum, item) => {
          const price = item.foodId?.price || 0;
          return sum + price * item.quantity;
        },
        0
      );
    }

    await cart.save();
    req.flash("success", "Item added to cart!");
    res.redirect("/api/customer/all-menu");

  } catch (err) {
    console.error("Cart error:", err);
    req.flash("error", "Error adding item to cart.");
    res.redirect("/api/customer/category");
  }
};


// View cart items

export const viewCart = async (req, res) => {
  const { tableId, sessionKey } = req.session;

  try {
    const cart = await Cart.findOne({ tableId, sessionKey, status: "active" }).populate("items.foodId");

    if (!cart || cart.items.length === 0) {
      return res.render("customer/cart", {
        cart: { items: [], totalAmount: 0 },
        messages: req.flash(),
      });
    }

    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + (item.foodId?.price || 0) * item.quantity,
      0
    );
    await cart.save();

    res.render("customer/cart", {
      cart,
      messages: req.flash(),
    });

  } catch (error) {
    console.error("Error loading cart:", error.message);
    req.flash("error", "Unable to load cart!");
    res.render("customer/cart", {
      cart: { items: [], totalAmount: 0 },
      messages: req.flash(),
    });
  }
};

// export const placeOrder = async (req, res) => {
//   const tableId = req.session.tableId;
//   const sessionKey = req.session.sessionKey; // Get sessionKey from session

//   try {
//     const cart = await Cart.findOne({ tableId, sessionKey, status: "active" }).populate("items.foodId");

//     if (!cart || cart.items.length === 0) {
//       req.flash("error", "Cart is empty!");
//       return res.redirect("/api/customer/cart/view");
//     }

//     const startOfDay = moment().startOf("day").toDate();
//     const endOfDay = moment().endOf("day").toDate();

//     const orderCountToday = await Order.countDocuments({
//       createdAt: { $gte: startOfDay, $lte: endOfDay },
//     });

//     const token = orderCountToday + 1;

//     const newOrder = new Order({
//       tableId,
//       sessionKey,
//       items: cart.items,
//       totalAmount: cart.totalAmount,
//       status: "pending",
//       token,
//     });

//     await newOrder.save();

//     cart.status = "ordered";
//     await cart.save();

//     req.flash("success", `Order placed successfully! Your token number is ${token}.`);
//     res.redirect("/api/customer/order-confirmation");
//   } catch (error) {
//     console.error("Order error:", error.message);
//     req.flash("error", "Error placing order.");
//     res.redirect("/api/customer/cart/view");
//   }
// };


// export const renderOrderConfirmation = async (req, res) => {
//   const tableId = req.session.tableId;
//   const sessionKey = req.session.sessionKey;

//   try {
//     const latestOrder = await Order.findOne({ tableId, sessionKey })
//       .sort({ createdAt: -1 })
//       .populate("items.foodId");

//     if (!latestOrder) {
//       req.flash("error", "No recent order found.");
//       return res.redirect("/api/customer/all-menu");
//     }

//     res.render("customer/order-confirmation", { order: latestOrder });
//   } catch (err) {
//     console.error("Error loading order confirmation:", err.message);
//     req.flash("error", "Unable to load order confirmation.");
//     res.redirect("/api/customer/all-menu");
//   }
// };



// place order : cart --> live orders



export const placeOrder = async (req, res) => {
  const tableId = req.session.tableId;
  const sessionKey = req.session.sessionKey;

  try {
    const cart = await Cart.findOne({
      tableId,
      sessionKey,
      status: "active",
    }).populate("items.foodId");

    if (!cart || cart.items.length === 0) {
      req.flash("error", "Cart is empty!");
      return res.redirect("/api/customer/cart/view");
    }

    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    const orderCountToday = await LiveOrder.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const token = orderCountToday + 1;

    const newLiveOrder = new LiveOrder({
      tableId,
      sessionKey,
      items: cart.items,
      totalAmount: cart.totalAmount,
      status: "pending",
      token,
    });

    await newLiveOrder.save();

    cart.status = "ordered";
    await cart.save();

    req.flash("success", `Order placed successfully! Your token number is ${token}.`);
    res.redirect("/api/customer/order-confirmation");
  } catch (error) {
    console.error("Order error:", error.message);
    req.flash("error", "Error placing order.");
    res.redirect("/api/customer/cart/view");
  }
};

// orders page redirection

export const renderOrderConfirmation = async (req, res) => {
  const tableId = req.session.tableId;
  const sessionKey = req.session.sessionKey;

  try {
    const latestLiveOrder = await LiveOrder.findOne({ tableId, sessionKey })
      .sort({ createdAt: -1 })
      .populate("items.foodId");

    if (!latestLiveOrder) {
      req.flash("error", "No recent order found.");
      return res.redirect("/api/customer/all-menu");
    }

    res.render("customer/order-confirmation", { order: latestLiveOrder });
  } catch (err) {
    console.error("Error loading order confirmation:", err.message);
    req.flash("error", "Unable to load order confirmation.");
    res.redirect("/api/customer/all-menu");
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

// export const deleteFromCart = async (req, res) => {
//   const { itemId } = req.query;
//   const tableId = req.session.tableId;
//   try {
//     let cart = await Cart.findOne({ tableId, status: "active" }).populate(
//       "items.foodId"
//     );
//     if (!cart || cart.items.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Cart is empty!" });
//     }
//     cart.items = cart.items.filter(
//       (item) => item.foodId._id.toString() !== itemId
//     );
//     cart.totalAmount = calculateTotalAmount(cart.items);
//     await cart.save();
//     res
//       .status(200)
//       .json({ success: true, message: "Item removed from cart!", cart });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Error removing item!",
//         error: error.message,
//       });
//   }
// };

// export const updateCartItemQuantity = async (req, res) => {
//   const { itemId, action } = req.query;
//   const tableId = req.session.tableId;
//   try {
//     let cart = await Cart.findOne({ tableId, status: "active" }).populate(
//       "items.foodId"
//     );
//     const itemIndex = cart.items.findIndex(
//       (item) => item.foodId._id.toString() === itemId
//     );
//     if (itemIndex === -1)
//       return res
//         .status(404)
//         .json({ success: false, message: "Item not in cart!" });
//     if (action === "increase") cart.items[itemIndex].quantity++;
//     else if (action === "decrease" && cart.items[itemIndex].quantity > 1)
//       cart.items[itemIndex].quantity--;
//     else cart.items.splice(itemIndex, 1);
//     cart.totalAmount = calculateTotalAmount(cart.items);
//     await cart.save();
//     res.status(200).json({ success: true, message: "Cart updated!", cart });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Error updating cart!",
//         error: error.message,
//       });
//   }
// };

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