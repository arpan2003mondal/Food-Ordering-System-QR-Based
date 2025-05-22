import staffModel from "../model/staffModel.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";



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
