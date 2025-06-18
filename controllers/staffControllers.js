import staffModel from "../model/staffModel.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";
import LiveOrder from "../model/liveOrder.js";
import Order from "../model/orderModel.js";
import moment from "moment";
import logger from "../utils/logger.js";
import Food from "../model/foodModel.js";


// staff login code

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash("error", "Missing login details");
    return res.redirect("/staff/login");
  }

  try {
    const user = await staffModel.findOne({ username });

    if (!user) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/staff/login");
    }

    const passMatch = await comparePassword(password, user.password);

    if (!passMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/staff/login");
    }

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      role: "staff",
    };

    req.session.save((err) => {
      if (err) {
        logger.error("Session save error during login", err);
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/staff/login");
      }

      req.flash("success", "Logged in successfully!");
      return res.redirect("/staff/dashboard");
    });

  } catch (error) {
    logger.error("Login controller error", {
      username,
      message: error.message,
      stack: error.stack,
    });
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/staff/login");
  }
};


// staff dashboard : show all the live orders
export const getStaffDashboard = async (req, res) => {
  try {
    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    const todayOrders = await LiveOrder.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["completed", "cancelled"] },
    })
      .sort({ createdAt: 1 })
      .limit(20)
      .populate("tableId")
      .populate("items.foodId");

    res.render("staff/dashboard", {
      orders: todayOrders,
      moment,
      staff: req.session.user,
    });

  } catch (error) {
    logger.error("Staff dashboard error", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).send("Internal Server Error");
  }
};

// get past orders
export const getPastOrders = async (req, res) => {
  try {
    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    const pastOrders = await LiveOrder.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["completed", "cancelled"] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("tableId")
      .populate("items.foodId");

    res.render("staff/past-orders", {
      orders: pastOrders,
      moment,
      staff: req.session.user,
    });
  } catch (error) {
    logger.error("Past orders fetch error", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).send("Internal Server Error");
  }
};

// Get Menu Management Page
export const getMenuManagement = async (req, res) => {
  try {
    // Fetch all food items and sort by name alphabetically
    const foodItems = await Food.find({}).sort({ name: 1 });

    // Calculate available and unavailable items count
    const availableItems = foodItems.filter(item => item.isAvailable).length;
    const unavailableItems = foodItems.filter(item => !item.isAvailable).length;

    res.render('staff/menu-management', {
      foodItems,
      availableItems,
      unavailableItems,
      title: 'Menu Management'
    });
  } catch (error) {
    console.error('Error fetching menu data:', error);
    req.flash('error', 'Error loading menu management page');
    res.redirect('/staff/dashboard');
  }
}

// Toggle Individual Item Availability
export const toggleItemAvailability = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { isAvailable } = req.body;

    // Find the food item by ID
    const foodItem = await Food.findById(itemId);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Update availability
    foodItem.isAvailable = isAvailable;
    await foodItem.save();

    const status = isAvailable ? 'available' : 'unavailable';

    // If it's an AJAX request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        message: `${foodItem.name} marked as ${status}`,
        item: foodItem
      });
    }

    // Otherwise, redirect with flash message
    req.flash('success', `${foodItem.name} has been marked as ${status}`);
    res.redirect('/staff/menu');

  } catch (error) {
    console.error('Error toggling item availability:', error);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Error updating item availability'
      });
    }

    req.flash('error', 'Error updating item availability');
    res.redirect('/staff/menu');
  }
}


// order status update : pending - accepted -- ready -- served

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["accepted", "ready", "completed", "cancelled"];

  if (!validStatuses.includes(status)) {
    req.flash("error", "Invalid status");
    return res.redirect("/staff/dashboard");
  }

  try {
    const liveOrder = await LiveOrder.findById(id);
    if (!liveOrder) {
      req.flash("error", "Order not found");
      return res.redirect("/staff/dashboard");
    }

    // Status transition rules
    const current = liveOrder.status;
    const allowedTransitions = {
      pending: ["accepted", "cancelled"],
      accepted: ["ready", "cancelled"],
      ready: ["completed"],
    };

    if (
      allowedTransitions[current] &&
      !allowedTransitions[current].includes(status)
    ) {
      req.flash("error", `Cannot change status from ${current} to ${status}`);
      return res.redirect("/staff/dashboard");
    }

    // Set new status
    liveOrder.status = status;

    if (status === "cancelled") {
      const waitTimes = [5, 10, 15, 20];
      const randomTime = waitTimes[Math.floor(Math.random() * waitTimes.length)];

      const messages = 
        [`The item will be available after approximately ${randomTime} minutes. Please try ordering again later.`];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      liveOrder.cancelMessage = randomMessage;
      req.flash("info", randomMessage);

      // 🔄 Mark all items in the cancelled order as unavailable
      for (const item of liveOrder.items) {
        try {
          const foodItem = await Food.findById(item.foodId._id || item.foodId);
          if (foodItem) {
            foodItem.isAvailable = false;
            await foodItem.save();
          }
        } catch (itemErr) {
          console.error(`Failed to update availability for item ${item.foodId}:`, itemErr);
        }
      }
    }

    await liveOrder.save();

    // ✅ If completed, save to Order history
    if (status === "completed") {
      const existingOrder = await Order.findOne({
        token: liveOrder.token,
        tableId: liveOrder.tableId,
      });

      if (!existingOrder) {
        const completedOrder = new Order({
          tableId: liveOrder.tableId,
          sessionKey: liveOrder.sessionKey,
          items: liveOrder.items,
          totalAmount: liveOrder.totalAmount,
          status: "completed",
          token: liveOrder.token,
          createdAt: liveOrder.createdAt,
          completedAt: new Date(),
        });

        await completedOrder.save();
      }
    }

    req.flash("success", `Order marked as ${status}`);
    return res.redirect("/staff/dashboard");

  } catch (error) {
    console.error("Order Status Update Error:", error);
    req.flash("error", "Failed to update order status");
    return res.redirect("/staff/dashboard");
  }
};



// reconfirm past orders
export const reconfirmCancelledOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const liveOrder = await LiveOrder.findById(id);

    if (!liveOrder) {
      req.flash("error", "Order not found");
      return res.redirect("/staff/past-orders");
    }

    if (liveOrder.status !== "cancelled") {
      req.flash("error", "Only cancelled orders can be confirmed again");
      return res.redirect("/staff/past-orders");
    }

    // Reconfirm order by setting it back to accepted
    liveOrder.status = "pending";
    await liveOrder.save();

    req.flash("success", `Order token ${liveOrder.token} reconfirmed as accepted`);
    res.redirect("/staff/dashboard"); // or redirect to /staff/past-orders if preferred
  } catch (error) {
    console.error("Reconfirm Order Error:", error);
    req.flash("error", "Failed to reconfirm cancelled order");
    res.redirect("/staff/past-orders");
  }
};

// Clear all past orders
export const clearAllPastOrders = async (req, res) => {
  try {
    // Delete all orders with status 'completed' or 'cancelled'
    const result = await LiveOrder.deleteMany({
      status: { $in: ["completed", "cancelled", "pending"] }
    });

    if (result.deletedCount > 0) {
      req.flash("success", `Successfully cleared ${result.deletedCount} past orders`);
    } else {
      req.flash("info", "No past orders found to clear");
    }

    res.redirect("/staff/past-orders");
  } catch (error) {
    console.error("Clear All Past Orders Error:", error);
    req.flash("error", "Failed to clear past orders");
    res.redirect("/staff/past-orders");
  }
};


// staff logout : code
export const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error("Session destruction failed during logout:", err);
        return res.redirect("/staff/dashboard");
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return res.redirect("/staff/login?logout=success");
    });
  } catch (error) {
    logger.error("Logout error caught in try-catch:", error);
    return res.redirect("/staff/dashboard");
  }
};


