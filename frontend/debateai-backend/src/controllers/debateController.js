import { query } from "../config/db.js";

// GET /api/debates  (with optional ?category=&search=&status=)
export const listDebates = async (req, res, next) => {
  try {
    const { category, search, status = "live" } = req.query;

    const conditions = ["d.status = $1"];
    const params = [status];
    let idx = 2;

    if (category && category !== "All") {
      conditions.push(`c.name = $${idx++}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`d.title ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }

    const sql = `
      SELECT
        d.id, d.title, d.status, d.is_ai_opponent, d.starts_at, d.ends_at,
        c.name AS category,
        ua.id AS debater_a_id, ua.name AS debater_a_name, ua.avatar_url AS debater_a_avatar, ua.rating AS debater_a_rating,
        ub.id AS debater_b_id, ub.name AS debater_b_name, ub.avatar_url AS debater_b_avatar, ub.rating AS debater_b_rating,
        (SELECT COUNT(*) FROM debate_watchers w WHERE w.debate_id = d.id) AS watching
      FROM debates d
      LEFT JOIN categories c ON c.id = d.category_id
      LEFT JOIN users ua ON ua.id = d.debater_a_id
      LEFT JOIN users ub ON ub.id = d.debater_b_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY d.created_at DESC
      LIMIT 50
    `;

    const { rows } = await query(sql, params);
    res.json({ debates: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/debates/:id
export const getDebate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT d.*, c.name AS category
       FROM debates d
       LEFT JOIN categories c ON c.id = d.category_id
       WHERE d.id = $1`,
      [id]
    );

    if (!rows[0]) return res.status(404).json({ error: "Debate not found" });

    const { rows: argRows } = await query(
      `SELECT da.*, u.name AS user_name FROM debate_arguments da
       JOIN users u ON u.id = da.user_id
       WHERE debate_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({ debate: rows[0], arguments: argRows });
  } catch (err) {
    next(err);
  }
};

// POST /api/debates
export const createDebate = async (req, res, next) => {
  try {
    const { title, categoryName, isAiOpponent = false } = req.body;

    if (!title || !categoryName) {
      return res.status(400).json({ error: "title and categoryName are required" });
    }

    const { rows: catRows } = await query(`SELECT id FROM categories WHERE name = $1`, [categoryName]);
    if (!catRows[0]) return res.status(400).json({ error: "Unknown category" });

    const { rows } = await query(
      `INSERT INTO debates (title, category_id, creator_id, debater_a_id, is_ai_opponent, status, starts_at)
       VALUES ($1, $2, $3, $3, $4, 'open', now())
       RETURNING *`,
      [title, catRows[0].id, req.user.id, isAiOpponent]
    );

    res.status(201).json({ debate: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/debates/:id/join  (as debater B)
export const joinDebate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await query(`SELECT * FROM debates WHERE id = $1`, [id]);
    const debate = rows[0];
    if (!debate) return res.status(404).json({ error: "Debate not found" });
    if (debate.status !== "open") return res.status(400).json({ error: "Debate is not open to join" });
    if (debate.debater_a_id === req.user.id) {
      return res.status(400).json({ error: "You already created this debate" });
    }

    const { rows: updated } = await query(
      `UPDATE debates SET debater_b_id = $1, status = 'live', ends_at = now() + interval '45 minutes'
       WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );

    res.json({ debate: updated[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/debates/:id/watch  (spectator joins live count)
export const watchDebate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(
      `INSERT INTO debate_watchers (debate_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, req.user.id]
    );
    const { rows } = await query(
      `SELECT COUNT(*) AS watching FROM debate_watchers WHERE debate_id = $1`,
      [id]
    );
    res.json({ watching: parseInt(rows[0].watching) });
  } catch (err) {
    next(err);
  }
};

// POST /api/debates/:id/arguments
export const postArgument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, side } = req.body;

    if (!content || !["A", "B"].includes(side)) {
      return res.status(400).json({ error: "content and side ('A' or 'B') are required" });
    }

    const { rows: debateRows } = await query(`SELECT * FROM debates WHERE id = $1`, [id]);
    const debate = debateRows[0];
    if (!debate) return res.status(404).json({ error: "Debate not found" });
    if (debate.status !== "live") return res.status(400).json({ error: "Debate is not live" });

    const expectedUserId = side === "A" ? debate.debater_a_id : debate.debater_b_id;
    if (expectedUserId !== req.user.id) {
      return res.status(403).json({ error: "You are not the debater for this side" });
    }

    const { rows } = await query(
      `INSERT INTO debate_arguments (debate_id, user_id, side, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.user.id, side, content]
    );

    res.status(201).json({ argument: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/debates/:id/judge  (trigger AI scoring - stub logic, replace with real AI call)
export const judgeDebate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: argRows } = await query(
      `SELECT * FROM debate_arguments WHERE debate_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    if (argRows.length === 0) {
      return res.status(400).json({ error: "No arguments to judge yet" });
    }

    // --- Placeholder scoring logic ---
    // Replace this block with a real call to an LLM (e.g. Claude/OpenAI) that scores
    // the transcript on logic, evidence, persuasiveness, and rebuttal quality.
    const scoreSide = (side) => {
      const count = argRows.filter((a) => a.side === side).length;
      const base = 60 + Math.min(count * 5, 30);
      return {
        logic: base + Math.floor(Math.random() * 10),
        evidence: base + Math.floor(Math.random() * 10),
        persuasiveness: base + Math.floor(Math.random() * 10),
        rebuttal: base + Math.floor(Math.random() * 10),
      };
    };

    const scoresA = scoreSide("A");
    const scoresB = scoreSide("B");
    const totalA = scoresA.logic + scoresA.evidence + scoresA.persuasiveness + scoresA.rebuttal;
    const totalB = scoresB.logic + scoresB.evidence + scoresB.persuasiveness + scoresB.rebuttal;

    await query(
      `INSERT INTO judge_scores (debate_id, side, logic_score, evidence_score, persuasiveness, rebuttal_score, total_score, feedback)
       VALUES ($1, 'A', $2, $3, $4, $5, $6, $7), ($1, 'B', $8, $9, $10, $11, $12, $13)`,
      [
        id,
        scoresA.logic, scoresA.evidence, scoresA.persuasiveness, scoresA.rebuttal, totalA, "Solid structure, could use more evidence.",
        scoresB.logic, scoresB.evidence, scoresB.persuasiveness, scoresB.rebuttal, totalB, "Strong rebuttals, clear delivery.",
      ]
    );

    const { rows: debateRows } = await query(`SELECT * FROM debates WHERE id = $1`, [id]);
    const debate = debateRows[0];
    const winnerId = totalA >= totalB ? debate.debater_a_id : debate.debater_b_id;

    await query(`UPDATE debates SET status = 'completed', winner_id = $1 WHERE id = $2`, [winnerId, id]);

    // Update ratings/wins/losses (simple ELO-ish bump)
    const loserId = winnerId === debate.debater_a_id ? debate.debater_b_id : debate.debater_a_id;
    if (winnerId) {
      await query(`UPDATE users SET wins = wins + 1, rating = rating + 15, streak = streak + 1 WHERE id = $1`, [winnerId]);
    }
    if (loserId) {
      await query(`UPDATE users SET losses = losses + 1, rating = GREATEST(rating - 10, 0), streak = 0 WHERE id = $1`, [loserId]);
    }

    res.json({ scoresA, scoresB, totalA, totalB, winnerId });
  } catch (err) {
    next(err);
  }
};
