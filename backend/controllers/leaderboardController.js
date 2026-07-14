const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Debate = require("../models/Debate");

const PERIOD_DAYS = { this_week: 7, this_month: 30 };

function getPeriodRange(period) {
  if (!PERIOD_DAYS[period]) return null; // all_time -> no filter
  const days = PERIOD_DAYS[period];
  const now = Date.now();
  const start = new Date(now - days * 86400000);
  const prevStart = new Date(now - days * 2 * 86400000);
  return { start, prevStart, prevEnd: start };
}

// @desc    Get leaderboard, ranked by rating, filtered to debaters active in the given period
// @route   GET /api/leaderboard?period=this_week|this_month|all_time
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const period = ["this_week", "this_month", "all_time"].includes(req.query.period)
    ? req.query.period
    : "all_time";

  const range = getPeriodRange(period);

  const baseFilter = { status: "finished", mode: { $ne: "ai_vs_ai" } };
  const currentFilter = range ? { ...baseFilter, endedAt: { $gte: range.start } } : baseFilter;

  const currentDebates = await Debate.find(currentFilter)
    .select("participants winner endedAt")
    .populate("participants.user", "isAI");

  let previousDebates = [];
  if (range) {
    previousDebates = await Debate.find({
      ...baseFilter,
      endedAt: { $gte: range.prevStart, $lt: range.prevEnd },
    }).select("participants winner");
  }

  // userId -> { wins, losses, results: [{ endedAt, won }] }
  const stats = {};

  for (const d of currentDebates) {
    for (const p of d.participants) {
      if (p.user?.isAI) continue; // exclude AI opponents from the leaderboard
      const uid = (p.user?._id || p.user)?.toString();
      if (!uid) continue;

      if (!stats[uid]) stats[uid] = { wins: 0, losses: 0, results: [] };

      const won = d.winner && d.winner.toString() === uid;
      const isDraw = !d.winner;
      if (won) stats[uid].wins += 1;
      else if (!isDraw) stats[uid].losses += 1;
      stats[uid].results.push({ endedAt: d.endedAt, won });
    }
  }

  const prevWins = {};
  for (const d of previousDebates) {
    for (const p of d.participants) {
      const uid = p.user?.toString();
      if (uid && d.winner && d.winner.toString() === uid) {
        prevWins[uid] = (prevWins[uid] || 0) + 1;
      }
    }
  }

  const userIds = Object.keys(stats);
  if (userIds.length === 0) {
    return res.json({ success: true, period, leaderboard: [] });
  }

  const users = await User.find({ _id: { $in: userIds } }).select(
    "name avatar rating wins losses draws debatesCount"
  );

  const leaderboard = users
    .map((u) => {
      const s = stats[u._id.toString()];

      // Streak: consecutive wins counting back from the most recent result
      const sorted = [...s.results].sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));
      let streak = 0;
      for (const r of sorted) {
        if (r.won) streak += 1;
        else break;
      }

      const prevW = prevWins[u._id.toString()] || 0;
      const trend = s.wins >= prevW ? "up" : "down";

      return {
        userId: u._id,
        name: u.name,
        avatar: u.avatar,
        rating: u.rating,
        wins: s.wins,
        losses: s.losses,
        streak,
        trend,
      };
    })
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }));

  res.json({ success: true, period, leaderboard });
});

// @desc    Get a single user's rank + stats (based on overall/all-time rating)
// @route   GET /api/leaderboard/:userId
// @access  Public
const getUserRank = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "name avatar rating wins losses draws debatesCount"
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const rank = (await User.countDocuments({ rating: { $gt: user.rating } })) + 1;

  res.json({ success: true, rank, user });
});

module.exports = { getLeaderboard, getUserRank };