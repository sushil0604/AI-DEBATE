const Debate = require("../models/Debate");

const WAITING_EXPIRY_MS   = 5 * 60 * 1000;  // waiting rooms: 5 min to get an opponent
const LIVE_EXPIRY_MS      = 20 * 60 * 1000; // live rooms with no endsAt: kill after 20 min
const CLEANUP_INTERVAL_MS = 30 * 1000;      // run every 30 seconds

// BUGFIX: this used to delete ANY "live" debate the instant endsAt passed,
// with zero grace period, checked every 30s. But debateSocket.js's own
// handleTimerExpiry is ALREADY responsible for processing that exact same
// moment — judging the debate, saving the verdict, and emitting
// "debate_ended" so the frontend shows the results screen. That normally
// takes a few seconds (the AI judge call is the slow part). With no grace
// period here, this job could delete the debate document mid-flight,
// before handleTimerExpiry finished saving its verdict — causing
// DocumentNotFoundError there and the frontend getting stuck on
// "Time's up!" forever with no results ever shown. Short debates (e.g. 1
// min) made this race far more likely to actually happen in practice.
//
// This grace period turns the rule back into what it was meant to be: a
// safety net for debates that are GENUINELY stuck (crashed before finishing,
// server restarted mid-processing, etc.) rather than a race against the
// normal, working expiry flow. 3 minutes is comfortably longer than any
// realistic AI judging call.
const LIVE_EXPIRY_GRACE_MS = 3 * 60 * 1000;

async function cleanupStaleDebates() {
  try {
    const now = Date.now();

    // 1. Delete waiting rooms older than 5 min (no opponent joined)
    const waitingCutoff = new Date(now - WAITING_EXPIRY_MS);
    const waiting = await Debate.deleteMany({
      status: "waiting",
      createdAt: { $lt: waitingCutoff },
    });

    // 2. Delete live rooms whose endsAt passed more than the grace period
    // ago — meaning handleTimerExpiry should have already finished
    // processing them by now, and if the debate is STILL "live" (not
    // "finished") after that much extra time, something genuinely went
    // wrong and it's safe to clean up.
    const liveExpiredCutoff = new Date(now - LIVE_EXPIRY_GRACE_MS);
    const liveExpired = await Debate.deleteMany({
      status: "live",
      endsAt: { $lt: liveExpiredCutoff },
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