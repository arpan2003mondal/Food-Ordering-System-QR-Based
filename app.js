import express from "express";
import "dotenv/config";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectDb from "./config/connectDB.js";
import adminRouter from "./routes/adminRoutes.js";
import adminDashboardRouter from "./routes/adminDashboardRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import { authenticateUser } from "./middleware/adminAuthMiddleware.js";
import path from "path";  
import flash from "connect-flash";


const app = express();
const port = process.env.PORT || 3000;

connectDb();

app.set("views",path.resolve("./views"));
app.use(express.static(path.resolve('./public')));


// Middleware to parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Middleware to parse application/json
app.use(express.json());

app.use(cookieParser());

app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET || "default_secret",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Session middleware
app.use(
  "/api/customer",
  session({
    secret: process.env.SESSION_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    },
  })
);


// Admin Routes wih no Session
app.use("/api/admin", adminRouter);
app.use("/api/admin/dashboard", authenticateUser, adminDashboardRouter);

// Customer Routes with Session
app.use("/api/customer", customerRouter);


app.set("view engine","ejs");

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.get("/scan-qr", (req, res) => {
  return res.render("scan-qr");
});

app.get("/test-flash", (req, res) => {
  req.flash("success", "This is a test success message");
  res.redirect("/api/admin/dashboard");
});


app.listen(port, () => console.log(`Server is running on port: ${port}`));
