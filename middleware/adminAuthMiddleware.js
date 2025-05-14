import jwt from "jsonwebtoken";
import adminModel from "../model/adminModel.js";

export const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await adminModel.findById(decoded.id).select("-password");

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Admin not found" });
    }

    req.admin = admin;
    
    next();
  } catch (error) {
    console.error("Token Verification Error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};
