const Debate = require("../models/Debate");

const WAITING_EXPIRY_MS  = 5 * 60 * 1000;  // waiting rooms: 5 min to get an opponent
const LIVE_EXPIRY_MS     = 20 * 60 * 1000; // live rooms with no endsAt: kill after 20 min
const CLEANUP_INTERVAL_MS = 30 * 1000;     // run every 30 seconds

async function cleanupStaleDebates() {
  try {
    const now = Date.now();

    // 1. Delete waiting rooms older than 5 min (no opponent joined)
    const waitingCutoff = new Date(now - WAITING_EXPIRY_MS);
    const waiting = await Debate.deleteMany({
      status: "waiting",
      createdAt: { $lt: waitingCutoff },
    });

    // 2. Delete live rooms whose endsAt has passed (timer expired but wasn't cleaned up)
    const liveExpired = await Debate.deleteMany({
      
      status: "live",
      endsAt: { $lt: new Date(now) },
    });

    // 3. Delete live rooms with NO endsAt that are older than 20 min (legacy debates)
    const legacyCutoff = new Date(now - LIVE_EXPIRY_MS);
    const legacy = await Debate.deleteMany({
      status: "live",
      endsAt: null,
      startedAt: { $lt: legacyCutoff },
    });

    const total = waiting.deletedCount + liveExpired.deletedCount + legacy.deletedCount;
    if (total > 0) {
      console.log(
        `[Cleanup] Removed ${waiting.deletedCount} waiting, ` +
        `${liveExpired.deletedCount} expired live, ` +
        `${legacy.deletedCount} legacy live debate(s).`
      );
    }
  } catch (err) {
    console.error("[Cleanup] Error:", err.message);
  }
}

function startDebateCleanup() {
  console.log("[Cleanup] Debate room cleanup job started.");
  cleanupStaleDebates(); // run immediately on boot
  setInterval(cleanupStaleDebates, CLEANUP_INTERVAL_MS);
}

module.exports = { startDebateCleanup };