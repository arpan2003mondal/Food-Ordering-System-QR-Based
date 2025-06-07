import logger from "../utils/logger.js";
import staffModel from "../model/staffModel.js";

export const authenticateStaff = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash("error", "Please login to access this resource");
    return res.redirect("/staff/login");
  }

  try {
    const staff = await staffModel.findById(req.session.user.id).select("-password");

    if (!staff) {
      req.flash("error", "User not found. Please login again.");
      return res.redirect("/staff/login");
    }

    req.staff = staff;
    next();
  } catch (error) {
    logger.error("Authentication middleware error", {
      message: error.message,
      stack: error.stack,
    });
    req.flash("error", "Authentication failed. Please login.");
    return res.redirect("/staff/login");
  }
};
