import express from "express";
import rateLimit from "express-rate-limit";
import { signup, login, refresh, logout, getMe } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, please try again later" },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
