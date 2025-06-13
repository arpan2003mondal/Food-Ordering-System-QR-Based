import Food from "../model/foodModel.js";
import Cart from "../model/cartModel.js";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import LiveOrder from "../model/liveOrder.js";

// review part 
import Review from "../model/reviewModel.js";


// Qr Scanning : scans qr and session created - UPDATED to redirect to home
export const qrScanRoute = async (req, res) => {
  const { tableId } = req.params;

  try {
    // Save table ID and a unique session key to session
    req.session.tableId = tableId;
    req.session.sessionKey = uuidv4(); // Unique identifier per customer session

    // Redirect to the home page instead of category page
    return res.redirect("/customer/home");
  } catch (error) {
    // Flash an error message
    req.flash("error", "Something went wrong loading the page. Please scan the QR code again.");
    return res.redirect("/scan-qr");
  }
};

// NEW: Home Page Route - Shows popular items, categories, and all food items
export const viewHomePage = async (req, res) => {
  try {
    // Fetch all available food items
    const allFoodItems = await Food.find({ isAvailable: true }).sort({ name: 1 });
    
    // Get unique categories
    const categories = [...new Set(allFoodItems.map(item => item.category))];
    
    // Get popular/featured items (you can modify this logic based on your needs)
    // For now, I'm getting items with highest price or you can add a 'featured' field to your model
    const popularItems = await Food.find({ isAvailable: true })
      .sort({ price: -1 }) // Sort by price descending to get premium items
      .limit(5); // Get top 5 items
    
    // You can also get items with discounts if you have a discount field
    const discountedItems = await Food.find({ isAvailable: true, discount: { $gt: 0 } })
      .sort({ discount: -1 })
      .limit(5);

    res.render("customer/home", {
      categories,
      allFoodItems,
      popularItems,
      discountedItems, // Uncomment if you have discount field
      messages: req.flash(),
      req
    });
  } catch (error) {
    console.error("Error loading home page:", error.message);
    req.flash("error", "Something went wrong loading the home page.");
    res.status(500).render("customer/home", {
      categories: [],
      allFoodItems: [],
      popularItems: [],
      messages: req.flash(),
      req
    });
  }
};


// Category : Show all category items - UPDATED (keeping original for backward compatibility)
export const viewCategory = async (req, res) => {
  try {
    // Fetch all food items and sort by name
    const foodItems = await Food.find({ isAvailable: true }).sort({ name: 1 });

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
    // Filter food items by category (case-insensitive match) and only show available items
    const foodItems = await Food.find({
      category: { $regex: new RegExp(`^${categoryName}$`, "i") },
      isAvailable: true  // ✅ Only show available items
    }).sort({ name: 1 }); // ✅ Sort alphabetically

    res.render("customer/category-menu", {
      category: categoryName,
      foodItems,
      messages: req.flash(),     // ✅ Include flash messages
      req,                       // ✅ Pass req for redirectTo = req.originalUrl
    });
  } catch (error) {
    console.error("Error loading category menu:", error.message);
    req.flash("error", "Failed to load menu items for this category.");
    res.status(500).render("customer/category-menu", {
      category: categoryName,
      foodItems: [],
      messages: req.flash(),
      req,
    });
  }
};


// All Menu Page : Shows the all dishes available
export const getAllFoods = async (req, res) => {
  try {
   // Fetch only available food items and sort alphabetically
    const foodItems = await Food.find({ isAvailable: true }).sort({ name: 1 });

    res.render("customer/all-menu", {
      foodItems,
      messages: req.flash(),
      req
    });
  } catch (error) {
    req.flash("error", "Failed to load menu.");
    res.status(500).redirect("/customer/home"); // Redirect to home instead of category
  }
};

// Search food items by item name
export const searchFood = async (req, res) => {
  const { q, category, veg, sort } = req.query;
  const query = { isAvailable: true }; // Only search available items

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
  else sortOption.name = 1; // Default sort by name

  try {
    const results = await Food.find(query).sort(sortOption);

    if (results.length === 0) {
      req.flash("error", "No food items found matching your search.");
      return res.render("customer/search-results", {
        results,
        query: q,
        messages: req.flash(),
        req,
      });
    }

    res.render("customer/search-results", {
      results,
      query: q,
      messages: req.flash(),
      req,
    });
  } catch (err) {
    console.error("Error during food search:", err.message);
    req.flash("error", "Search failed. Please try again.");
    res.redirect("/customer/home"); // Redirect to home instead of category
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  const { itemId, quantity, redirectTo } = req.body;
  const { tableId, sessionKey } = req.session;

  if (!itemId || isNaN(quantity)) {
    req.flash("error", "Invalid request to add item.");
    return res.redirect(redirectTo || "/customer/home");
  }

  try {
    const foodItem = await Food.findById(itemId);
    if (!foodItem || !foodItem.isAvailable) {
      req.flash("error", "Food item not found or not available.");
      return res.redirect(redirectTo || "/customer/home");
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
    req.flash("success", `${foodItem.name} added to cart successfully!`);
    res.redirect(redirectTo || "/customer/home");

  } catch (err) {
    console.error("Error adding item to cart:", err.message);
    req.flash("error", "Error adding item to cart. Please try again.");
    res.redirect(redirectTo || "/customer/home");
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
// Fixed updateCartItemQuantity function - matches viewCart logic
export const updateCartItemQuantity = async (req, res) => {
  const { itemId, action } = req.query;
  const { tableId, sessionKey } = req.session; // ✅ Use both like viewCart

  try {
    // ✅ Same query pattern as viewCart
    let cart = await Cart.findOne({ 
      tableId, 
      sessionKey,  // This was missing!
      status: "active" 
    }).populate("items.foodId");

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart not found!" 
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.foodId._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not in cart!" 
      });
    }

    // Update quantity based on action
    if (action === "increase") {
      cart.items[itemIndex].quantity++;
    } else if (action === "decrease" && cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity--;
    } else if (action === "decrease") {
      // Remove item if quantity becomes 0
      cart.items.splice(itemIndex, 1);
    }

    // ✅ Use same calculation as viewCart
    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + (item.foodId?.price || 0) * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({ 
      success: true, 
      message: "Cart updated!", 
      cart
    });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Error updating cart!",
      error: error.message,
    });
  }
};

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

    await Cart.deleteOne({ _id: cart._id });

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


// Show review form for order
export const renderReviewForm = async (req, res) => {
  const { orderId } = req.query;

  try {
    const order = await LiveOrder.findById(orderId).populate("items.foodId");
    if (!order) {
      req.flash("error", "Order not found.");
      return res.redirect("/customer/order-confirmation");
    }

    res.render("customer/review-form", { order });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading review form.");
    res.redirect("/customer/order-confirmation");
  }
};

// Submit reviews for items in order
export const submitReviews = async (req, res) => {
  try {
    const { reviews } = req.body; // Expecting array of reviews [{ foodId, rating, reviewText }]

    for (const review of reviews) {
      const { foodId, rating, reviewText } = review;

      // Save to Review model
      await Review.create({
        foodId,
        name: req.user?.name || "Guest", // adapt based on auth
        rating,
        reviewText,
      });

      // Update Food model
      const allReviews = await Review.find({ foodId });
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await Food.findByIdAndUpdate(foodId, {
        averageRating: avgRating.toFixed(1),
        numReviews: allReviews.length,
      });
    }

    req.flash("success", "Thank you for your feedback!");
    res.redirect("/customer/home");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while submitting reviews.");
    res.redirect("/customer/order-confirmation");
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

