import staffModel from "../model/staffModel.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";
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

    // Today's relevant orders
    const todayOrders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "ordered", "received"] }
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
