import adminModel from "../model/adminModel.js";
import logger from "../utils/logger.js";

export const authenticateAdmin = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash("error", "Please login to access this resource");
    return res.redirect("/api/admin/login");
  }

  try {
    const admin = await adminModel.findById(req.session.user.id).select("-password");

    if (!admin) {
      req.flash("error", "User not found. Please login again.");
      return res.redirect("/api/admin/login");
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error("Admin authentication error", {
      message: error.message,
      stack: error.stack,
      userId: req.session.user?.id,
    });
    req.flash("error", "Authentication failed. Please login.");
    return res.redirect("/api/admin/login");
  }
};
