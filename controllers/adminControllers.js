import adminModel from "../model/adminModel.js";
import transporter from "../config/nodeMailer.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";
import { passwordRest, wellcomeMail } from "../utils/sendMails.js";
import logger from "../utils/logger.js";


// Render admin registration page
export const renderAdminRegister = (req, res) => {
  try {
    res.render('admin/register', { 
      title: 'Admin Registration',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Failed to render admin registration page', { 
      error: error.message 
    });
    res.status(500).send('Server Error');
  }
};


// register admin
export const adminRegister = async (req, res) => {
  const { name, email, password, secretKey } = req.body;

  // Validate required fields
  if (!name || !email || !password || !secretKey) {
    logger.warn('Admin registration attempt with missing fields', { 
      email, 
      missingFields: { 
        name: !name, 
        email: !email, 
        password: !password, 
        secretKey: !secretKey 
      } 
    });
    return res.status(400).json({ 
      success: false, 
      message: "All fields including secret key are required" 
    });
  }

  // Validate secret key
  const adminSecretKey = process.env.ADMIN_SECRET_KEY;
  if (!adminSecretKey) {
    logger.error('ADMIN_SECRET_KEY not configured in environment variables');
    return res.status(500).json({ 
      success: false, 
      message: "Server configuration error" 
    });
  }

  if (secretKey !== adminSecretKey) {
    logger.warn('Admin registration attempt with invalid secret key', { 
      email, 
      providedKey: secretKey.substring(0, 3) + '***' // Log partial key for security
    });
    return res.status(403).json({ 
      success: false, 
      message: "Invalid secret key. Access denied." 
    });
  }

  try {
    // Check if admin already exists
    const existingAdmin = await adminModel.findOne({ role: "admin" });

    if (existingAdmin) {
      logger.warn('Admin registration attempt when admin already exists', { 
        existingAdminEmail: existingAdmin.email,
        attemptedEmail: email 
      });
      return res.status(400).json({
        success: false,
        message: "Admin already registered. Only one admin allowed!",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const newAdmin = await adminModel.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    logger.info('New admin registered successfully', { 
      adminId: newAdmin._id,
      email: newAdmin.email,
      name: newAdmin.name 
    });
    // Send welcome email
    try {
      const mail = wellcomeMail(name, email);
      await transporter.sendMail(mail);
      logger.info('Welcome email sent to new admin', { email });
    } catch (emailError) {
      logger.error('Failed to send welcome email to new admin', { 
        email, 
        error: emailError.message 
      });
      // Don't fail registration if email fails
    }

    logger.info('Admin registration completed successfully', { 
      adminId: newAdmin._id,
      email 
    });

    res.status(201).json({ 
      success: true, 
      message: "Admin registered successfully!" 
    });

  } catch (error) {
    logger.error('Admin registration failed', { 
      email, 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({ 
      success: false, 
      message: "Registration failed. Please try again." 
    });
  }
};





// session based admin login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash("error", "Missing login details");
    return res.redirect("/admin/login");
  }

  try {
    const user = await adminModel.findOne({ email });

    if (!user) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/admin/login");
    }

    const passMatch = await comparePassword(password, user.password);

    if (!passMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/admin/login");
    }

    // ✅ Session-based login
    req.session.user = {
      id: user._id,
      role: "admin",
      email: user.email,
    };

    req.flash("success", "Logged in successfully!");
    return res.redirect("/admin/dashboard");

  } catch (error) {
    logger.error("Admin login error", {
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
    });
    req.flash("error", "Server error: " + error.message);
    return res.redirect("/admin/login");
  }
};

// logout admin : session based

export const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error("Admin session destruction failed during logout:", err);
        req.flash("error", "Logout failed. Please try again.");
        return res.redirect("/admin/dashboard");
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return res.redirect("/admin/login");
    });
  } catch (error) {
    logger.error("Admin logout error caught in try-catch:", {
      message: error.message,
      stack: error.stack,
    });
    req.flash("error", "Something went wrong during logout.");
    return res.redirect("/admin/dashboard");
  }
};


// send otp for update admin password

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    req.flash("error", "Email is required!");
    return res.redirect("/admin/send-otp");
  }

  try {
    const user = await adminModel.findOne({ email });

    if (!user) {
      req.flash("error", "No user found with this email!");
      return res.redirect("/admin/forgot-password");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expireAt = Date.now() + 15 * 60 * 1000;

    await adminModel.findByIdAndUpdate(user._id, {
      resetOtp: otp,
      resetOtpExpireAt: expireAt,
    });

    const passwordResetMail = passwordRest(email, otp);
    await transporter.sendMail(passwordResetMail);
    req.session.resetEmail = email; // Save email to session for use in reset step

    req.flash("success", "OTP sent to your email.");
    return res.redirect("/admin/reset-password"); // You can implement this next

  } catch (error) {
    console.error("Error sending OTP:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/admin/forgot-password");
  }
};

// reset admin password

export const resetPassword = async (req, res) => {
  const email = req.session.resetEmail;
  const { otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/admin/reset-password');
  }

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/admin/reset-password');
  }

  try {
    const user = await adminModel.findOne({ email });

    if (!user) {
      req.flash('error', 'Admin not found.');
      return res.redirect('/admin/reset-password');
    }

    if (user.resetOtp !== otp) {
      req.flash('error', 'Invalid OTP.');
      return res.redirect('/admin/reset-password');
    }

    if (user.resetOtpExpireAt < Date.now()) {
      req.flash('error', 'OTP has expired. Please try again.');
      return res.redirect('/admin/forgot-password');
    }

    const hashedPassword = await hashPassword(newPassword);

    await adminModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetOtp: '',
      resetOtpExpireAt: 0,
    });

    req.session.resetEmail = null; // Clear session after reset
    req.flash('success', 'Password updated successfully.');
    return res.redirect('/admin/login');

  } catch (error) {
    console.error('Reset password error:', error.message);
    req.flash('error', 'Something went wrong.');
    return res.redirect('/admin/reset-password');
  }
};

