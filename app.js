import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import path from "path";
import "dotenv/config";

import connectDb from "./config/connectDB.js";
import adminRouter from "./routes/adminRoutes.js";
import adminDashboardRouter from "./routes/adminDashboardRoutes.js";
import staffRouter from "./routes/staffRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import sessionTTL from "./middleware/sessionMiddleware.js"; 
import logger from "./utils/logger.js";
import methodOverride from 'method-override';

const app = express();
const port = process.env.PORT;

// Connect MongoDB
connectDb();

// View engine & static files
app.set("views", path.resolve("./views"));
app.set("view engine", "ejs");
app.use(express.static(path.resolve("./public")));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(flash());

// ✅ 1. Run TTL middleware before session
app.use(sessionTTL);

// ✅ 2. Initialize MongoStore once
const sessionStore = MongoStore.create({
  mongoUrl: process.env.Mongo_URL,
  ttl: 60 * 60, // fallback TTL in seconds
});

// ✅ 3. Apply session middleware only once
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000, // fallback maxAge
    },
  })
);

// ✅ 4. Set actual maxAge per request
app.use((req, res, next) => {
  if (req.session && req.sessionOptions?.maxAge) {
    req.session.cookie.maxAge = req.sessionOptions.maxAge;
  }
  next();
});

// Flash middleware
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
app.use(methodOverride('_method'));

// Routes
app.use("/admin", adminRouter);
app.use("/admin/dashboard", adminDashboardRouter);
app.use("/staff", staffRouter);
app.use("/customer", customerRouter);

// Public pages
app.get("/", (req, res) => {
  res.status(200).render("partials/home");
});

app.get("/scan-qr", (req, res) => {
  res.status(200).render("partials/scan-qr");
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("partials/404", { message: "Page not found" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Server Error: ${err.stack}`);
  res.status(500).send("Internal Server Error");
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Server running at http://localhost:${port}`);
});
