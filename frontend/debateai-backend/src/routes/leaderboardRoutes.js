import express from "express";
import { getLeaderboard, getMyRank } from "../controllers/leaderboardController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getLeaderboard);
router.get("/me", authenticate, getMyRank);

export default router;
