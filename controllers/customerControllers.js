import Food from "../model/foodModel.js";
import Cart from "../model/cartModel.js";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import LiveOrder from "../model/liveOrder.js";


// Qr Scanning : scans qr and session created
export const qrScanRoute = async (req, res) => {
  const { tableId } = req.params;

  try {
    // Save table ID and a unique session key to session
    req.session.tableId = tableId;
    req.session.sessionKey = uuidv4(); // Unique identifier per customer session

    // Redirect to the category page
    return res.redirect("/customer/category");
  } catch (error) {
    // Flash an error message
    req.flash("error", "Something went wrong loading the page. Please scan the QR code again.");
    return res.redirect("/scar-qr");
  }
};

// Category : Show all category items
export const viewCategory = async (req, res) => {
  try {
    // Fetch all food items and sort by name
    const foodItems = await Food.find().sort({ name: 1 });

    // Extract unique categories
    const categories = [...new Set(foodItems.map(item => item.category))];

    // Render the category page with categories
    res.render("customer/category", {
      categories,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Something went wrong loading the menu.");
    res.status(500).render("scan-qr", {
      categories: [],
      messages: req.flash(),
    });
  }
};


// Category Wise Menu : Show the food available under selected category
export const viewMenu = async (req, res) => {
  const { categoryName } = req.params;

  try {
    // Filter food items by category (case-insensitive match)
    const foodItems = await Food.find({
      category: { $regex: new RegExp(`^${categoryName}$`, "i") },
    });

    res.render("customer/category-menu", {
      category: categoryName,
      foodItems,
      messages: req.flash(),     // ✅ Include flash messages
      req,                       // ✅ Pass req for redirectTo = req.originalUrl
    });
  } catch (error) {
    // console.error("Error loading category menu:", error.message);
    req.flash("error", "Failed to load menu items for this category.");
    res.status(500).render("customer/all-menu", {
      category: categoryName,
      foodItems: [],
      messages: req.flash(),
    });
  }
};


// All Menu Page : Shows the all dishes available
export const getAllFoods = async (req, res) => {
  try {
    // Fetch and sort food items alphabetically
    const foodItems = await Food.find().sort({ name: 1 });

    res.render("customer/all-menu", {
      foodItems,
    });
  } catch (error) {
    req.flash("error", "Failed to load menu.");
    res.status(500).redirect("/customer/category");
  }
};

// search food items by item name
export const searchFood = async (req, res) => {
  const { q, category, veg, sort } = req.query;
  const query = {};

  if (q) {
    query.name = { $regex: q, $options: "i" };
  }
  
  if (category) {
    // Case-insensitive match for category, like viewMenu
    query.category = { $regex: new RegExp(`^${category}$`, "i") };
  }

  if (veg === "true") {
    query.isVegetarian = true;
  }

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
        req,  // pass req to template, like in viewMenu
      });
    }

    // req.flash("success", `${results.length} item(s) found.`);
    res.render("customer/search-results", {
      results,
      query: q,
      messages: req.flash(),
      req,
    });
  } catch (err) {
    // console.error("Error during food search:", err.message);
    req.flash("error", "Search failed. Try again.");
    res.redirect("/customer/category");
  }
};



// Add to cart
export const addToCart = async (req, res) => {
  const { itemId, quantity, redirectTo } = req.body;
  const { tableId, sessionKey } = req.session;

  if (!itemId || isNaN(quantity)) {
    req.flash("error", "Invalid request to add item.");
    return res.redirect(redirectTo || "/customer/all-menu");
  }

  try {
    const foodItem = await Food.findById(itemId);
    if (!foodItem) {
      req.flash("error", "Food item not found.");
      return res.redirect(redirectTo || "/customer/all-menu");
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
        (sum, item) => (item.foodId?.price || 0) * item.quantity + sum,
        0
      );
    }

    await cart.save();
    req.flash("success", "Item added to cart!");
    res.redirect(redirectTo || "/customer/all-menu");

  } catch (err) {
    req.flash("error", "Error adding item to cart.");
    res.redirect(redirectTo || "/customer/category");
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
    // console.error("Error loading cart:", error.message);
    req.flash("error", "Unable to load cart!");
    res.render("customer/cart", {
      cart: { items: [], totalAmount: 0 },
      messages: req.flash(),
    });
  }
};
// update cart items
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
  const sessionKey = req.session.sessionKey;

  try {
    const cart = await Cart.findOne({
      tableId,
      sessionKey,
      status: "active",
    }).populate("items.foodId");

    if (!cart || cart.items.length === 0) {
      req.flash("error", "Cart is empty!");
      return res.redirect("/customer/cart/view");
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
    res.redirect("/customer/order-confirmation");
  } catch (error) {
    console.error("Order error:", error.message);
    req.flash("error", "Error placing order.");
    res.redirect("/customer/cart/view");
  }
};

// orders page redirection

export const renderOrderConfirmation = async (req, res) => {
  const tableId = req.session.tableId;
  const sessionKey = req.session.sessionKey;

  try {
    const allOrders = await LiveOrder.find({ tableId, sessionKey })
      .sort({ createdAt: -1 })
      .populate("items.foodId");

    // if (!allOrders || allOrders.length === 0) {
    //   req.flash("error", "No orders found.");
    //   return res.redirect("/customer/all-menu");
    // }

    res.render("customer/order-confirmation", { orders: allOrders });
  } catch (err) {
    req.flash("error", "Unable to load orders.");
    res.redirect("/customer/all-menu");
  }
};



// <-- Future Works -->

// export const getFoodDetails = async (req, res) => {
//   const { itemId } = req.query;
//   if (!itemId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "itemId is required!" });
//   }
//   try {
//     const foodItem = await Food.findById(itemId);
//     if (!foodItem) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Food item not found!" });
//     }
//     res
//       .status(200)
//       .json({
//         success: true,
//         message: "Food item details fetched successfully!",
//         foodItem,
//       });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Error fetching food item details!",
//         error: error.message,
//       });
//   }
// };

// export const initiatePayment = async (req, res) => {
//   const { orderId } = req.query;
//   try {
//     const order = await Order.findById(orderId);
//     if (!order || order.status !== "pending") {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid or already paid order!" });
//     }
//     const paymentId = `PAY_${Date.now()}`;
//     order.paymentId = paymentId;
//     order.paymentStatus = "processing";
//     await order.save();
//     res
//       .status(200)
//       .json({
//         success: true,
//         message: "Payment initiated!",
//         paymentId,
//         orderId: order._id,
//       });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Error initiating payment!",
//         error: error.message,
//       });
//   }
// };

// export const verifyPayment = async (req, res) => {
//   const { orderId, paymentId, status } = req.body;
//   try {
//     const order = await Order.findById(orderId);
//     if (!order || order.paymentId !== paymentId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid payment or order!" });
//     }
//     order.paymentStatus = status === "success" ? "paid" : "failed";
//     order.status = status === "success" ? "completed" : "pending";
//     await order.save();
//     res
//       .status(200)
//       .json({ success: true, message: "Payment verified!", order });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Error verifying payment!",
//         error: error.message,
//       });
//   }
// };

// <-- Future Works -->

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

