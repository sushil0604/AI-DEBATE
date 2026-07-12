const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// @desc    Get global leaderboard, ranked by rating
// @route   GET /api/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const users = await User.find({ debatesCount: { $gt: 0 } })
    .select("name avatar rating wins losses draws debatesCount")
    .sort({ rating: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({ debatesCount: { $gt: 0 } });

  const ranked = users.map((u, idx) => ({
    rank: skip + idx + 1,
    ...u.toObject(),
  }));

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), leaderboard: ranked });
});

// @desc    Get a single user's rank + stats
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
