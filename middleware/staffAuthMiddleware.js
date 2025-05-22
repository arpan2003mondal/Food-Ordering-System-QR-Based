import jwt from "jsonwebtoken";
import staffModel from "../model/staffModel.js";

export const authenticateStaff = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const staff = await staffModel.findById(decoded.id).select("-password");

    if (!staff) {
      return res
        .status(401)
        .json({ success: false, message: "Staff not found" });
    }

    req.staff = staff;
    next();
  } catch (error) {
    console.error("Token Verification Error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};
