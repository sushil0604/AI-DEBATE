import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import debateRoutes from "./routes/debateRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import topicRoutes from "./routes/topicRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// ─── Global middleware ───
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(globalLimiter);

// ─── Health check ───
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ─── Routes ───
app.use("/api/auth", authRoutes);
app.use("/api/debates", debateRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/topics", topicRoutes);

// ─── Error handling ───
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 DebateAI API running on http://localhost:${PORT}`);
});
