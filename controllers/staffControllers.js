import staffModel from "../model/staffModel.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";
import LiveOrder from "../model/liveOrder.js";
import Order from "../model/orderModel.js";
import moment from "moment";


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

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    req.flash("success", "Logged in successfully!");
    return res.redirect("/staff/dashboard"); // change to your staff dashboard route

  } catch (error) {
    req.flash("error", "Server error: " + error.message);
    return res.redirect("/staff/login");
  }
};

 
// Render staff dashboard with orders

export const getStaffDashboard = async (req, res) => {
  try {
    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    const todayOrders = await LiveOrder.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ["completed", "cancelled"] },  // show only active live orders
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("tableId")
      .populate("items.foodId");

    res.render("staff/dashboard", {
      orders: todayOrders,
      moment,
    });
  } catch (error) {
    console.error("Staff Dashboard Error:", error);
    res.status(500).send("Internal Server Error");
  }
};





// export const updateOrderStatus = async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   const validStatuses = ["accepted", "ready", "completed", "cancelled"];

//   if (!validStatuses.includes(status)) {
//     req.flash("error", "Invalid status");
//     return res.redirect("/staff/dashboard");
//   }

//   try {
//     const order = await Order.findById(id);

//     if (!order) {
//       req.flash("error", "Order not found");
//       return res.redirect("/staff/dashboard");
//     }

//     // Optional: implement status transition rules
//     const current = order.status;
//     const allowedTransitions = {
//       pending: ["accepted", "cancelled"],
//       accepted: ["ready", "cancelled"],
//       ready: ["completed"],
//     };

//     if (
//       allowedTransitions[current] &&
//       !allowedTransitions[current].includes(status)
//     ) {
//       req.flash("error", `Cannot change status from ${current} to ${status}`);
//       return res.redirect("/staff/dashboard");
//     }

//     order.status = status;
//     await order.save();

//     req.flash("success", `Order marked as ${status}`);
//     return res.redirect("/staff/dashboard");
//   } catch (error) {
//     console.error("Order Status Update Error:", error);
//     req.flash("error", "Failed to update order status");
//     return res.redirect("/staff/dashboard");
//   }
// };



// order status update by staff -- > pending,accepted


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

    // Optional: implement status transition rules
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

    liveOrder.status = status;
    await liveOrder.save();

    // If completed or cancelled, create a permanent order record
    if (status === "completed" || status === "cancelled") {
      // Avoid duplicate permanent order if it already exists (optional)
      const existingOrder = await Order.findOne({ token: liveOrder.token, tableId: liveOrder.tableId });
      if (!existingOrder) {
        const permanentOrder = new Order({
          tableId: liveOrder.tableId,
          sessionKey: liveOrder.sessionKey,
          items: liveOrder.items,
          totalAmount: liveOrder.totalAmount,
          status: status,
          token: liveOrder.token,
          createdAt: liveOrder.createdAt,
          // Add any other fields if necessary, like completedAt for completed
          ...(status === "completed" && { completedAt: new Date() }),
        });
        await permanentOrder.save();
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


export const logout = async (req, res) => {
  try {
    res.clearCookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: new Date(0),
    });

    req.flash("success", "Logged out successfully!");
    return res.redirect("/staff/login");
  } catch (error) {
    console.error("Logout error:", error.message);
    req.flash("error", "Something went wrong during logout.");
    return res.redirect("/staff/login");
  }
};
