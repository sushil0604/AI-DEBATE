import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
} from "../utils/tokens.js";

const sanitizeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatarUrl: u.avatar_url,
  rating: u.rating,
  wins: u.wins,
  losses: u.losses,
  streak: u.streak,
});

// POST /api/auth/signup
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, avatar_url, rating, wins, losses, streak`,
      [name, email.toLowerCase(), passwordHash]
    );

    const user = rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashToken(refreshToken), refreshExpiryDate()]
    );

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashToken(refreshToken), refreshExpiryDate()]
    );

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    const tokenHash = hashToken(refreshToken);

    const { rows } = await query(
      `SELECT rt.*, u.id as user_id, u.email, u.name, u.avatar_url, u.rating, u.wins, u.losses, u.streak
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > now()`,
      [tokenHash]
    );

    const record = rows[0];
    if (!record) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const accessToken = generateAccessToken({ id: record.user_id, email: record.email });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [hashToken(refreshToken)]);
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, avatar_url, rating, wins, losses, streak FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    next(err);
  }
};
