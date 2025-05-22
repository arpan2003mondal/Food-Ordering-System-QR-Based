import express from "express";
import { login, logout } from "../controllers/staffControllers.js";
import { authenticateStaff } from "../middleware/staffAuthMiddleware.js";

const staffRouter = express.Router();


staffRouter.get("/login", (req, res) => {
  res.render("staff/login");
});

staffRouter.post("/login", login);

staffRouter.post("/logout", authenticateStaff, logout);

export default staffRouter;
