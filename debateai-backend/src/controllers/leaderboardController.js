import { query } from "../config/db.js";

// GET /api/leaderboard?period=week|month|all
export const getLeaderboard = async (req, res, next) => {
  try {
    // NOTE: rating/wins/losses are currently all-time totals on the users table.
    // For true weekly/monthly leaderboards, track results in a separate
    // time-stamped results table and aggregate by period. This endpoint
    // currently always returns the all-time view regardless of `period`,
    // but accepts the param so the frontend tabs already work end-to-end.
    const { rows } = await query(`SELECT * FROM leaderboard LIMIT 100`);
    res.json({ leaderboard: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaderboard/me
export const getMyRank = async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM leaderboard WHERE id = $1`, [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "User not ranked yet" });
    res.json({ rank: rows[0] });
  } catch (err) {
    next(err);
  }
};
