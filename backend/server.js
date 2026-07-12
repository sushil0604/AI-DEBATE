require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const registerDebateSocket = require("./sockets/debateSocket");
const { startDebateCleanup } = require("./utils/debateCleanup.js"); // ← NEW

// Routes
const authRoutes = require("./routes/authRoutes");
const debateRoutes = require("./routes/debateRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const aiCoachRoutes = require("./routes/aiCoachRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { handleWebhook } = require("./controllers/paymentController");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

connectDB().then(() => {
  startDebateCleanup(); // ← NEW: runs immediately, then every 60s
});

// --- Global middleware ---
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Stripe webhook needs the RAW body, so it's mounted BEFORE express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Now safe to parse JSON for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.get("/api/health", (req, res) => res.json({ success: true, message: "AI Debate API is running" }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to AI Debate API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/debates", debateRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/ai-coach", aiCoachRoutes);
app.use("/api/payments", paymentRoutes);

// --- Socket.io ---
registerDebateSocket(io);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, server, io };