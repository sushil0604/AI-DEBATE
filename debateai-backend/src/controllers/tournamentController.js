import { query } from "../config/db.js";

// GET /api/tournaments?status=upcoming|in_progress|past
export const listTournaments = async (req, res, next) => {
  try {
    const { status = "upcoming" } = req.query;

    const { rows } = await query(
      `SELECT t.*, c.name AS category,
        (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) AS player_count
       FROM tournaments t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.status = $1
       ORDER BY t.starts_at ASC`,
      [status]
    );

    res.json({ tournaments: rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/tournaments/:id/join
export const joinTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: tRows } = await query(`SELECT * FROM tournaments WHERE id = $1`, [id]);
    const tournament = tRows[0];
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    if (tournament.status !== "upcoming") {
      return res.status(400).json({ error: "Registration is closed for this tournament" });
    }

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1`,
      [id]
    );
    if (parseInt(countRows[0].count) >= tournament.max_players) {
      return res.status(400).json({ error: "Tournament is full" });
    }

    await query(
      `INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, req.user.id]
    );

    res.json({ message: "Joined tournament" });
  } catch (err) {
    next(err);
  }
};
