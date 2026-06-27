import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// GET /api/topics  → categories with debate counts
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT c.id, c.name,
        COUNT(d.id) AS debate_count
      FROM categories c
      LEFT JOIN debates d ON d.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `);
    res.json({ topics: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
