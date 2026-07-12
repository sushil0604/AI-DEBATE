-- ============================================
-- DebateAI Database Schema
-- ============================================
-- Uses gen_random_uuid(), built into PostgreSQL 13+.
-- If you're on Postgres < 13, uncomment the line below:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Users ───
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  rating        INTEGER DEFAULT 1200,
  wins          INTEGER DEFAULT 0,
  losses        INTEGER DEFAULT 0,
  streak        INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Categories ───
CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO categories (name) VALUES
  ('Technology'), ('Politics'), ('Science'), ('Education'),
  ('Health'), ('Ethics & Law'), ('Society'), ('Culture'), ('Economics');

-- ─── Debates ───
CREATE TABLE debates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  category_id     INTEGER REFERENCES categories(id),
  creator_id      UUID REFERENCES users(id),
  debater_a_id    UUID REFERENCES users(id),
  debater_b_id    UUID REFERENCES users(id), -- NULL if vs AI
  is_ai_opponent  BOOLEAN DEFAULT false,
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'live', 'completed', 'cancelled')),
  winner_id       UUID REFERENCES users(id),
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_debates_status ON debates(status);
CREATE INDEX idx_debates_category ON debates(category_id);

-- ─── Debate Arguments (each turn) ───
CREATE TABLE debate_arguments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id   UUID REFERENCES debates(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  side        VARCHAR(1) CHECK (side IN ('A', 'B')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_arguments_debate ON debate_arguments(debate_id);

-- ─── AI Judge Scores ───
CREATE TABLE judge_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id       UUID REFERENCES debates(id) ON DELETE CASCADE,
  side            VARCHAR(1) CHECK (side IN ('A', 'B')),
  logic_score     INTEGER CHECK (logic_score BETWEEN 0 AND 100),
  evidence_score  INTEGER CHECK (evidence_score BETWEEN 0 AND 100),
  persuasiveness  INTEGER CHECK (persuasiveness BETWEEN 0 AND 100),
  rebuttal_score  INTEGER CHECK (rebuttal_score BETWEEN 0 AND 100),
  total_score     INTEGER,
  feedback        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Spectators / Watching (live count) ───
CREATE TABLE debate_watchers (
  debate_id  UUID REFERENCES debates(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (debate_id, user_id)
);

-- ─── Tournaments ───
CREATE TABLE tournaments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  category_id  INTEGER REFERENCES categories(id),
  status       VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'past')),
  max_players  INTEGER DEFAULT 32,
  prize_cents  INTEGER DEFAULT 0,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tournament_participants (
  tournament_id  UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tournament_id, user_id)
);

-- ─── Refresh tokens (for auth) ───
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ─── Helper view: leaderboard ───
CREATE VIEW leaderboard AS
SELECT
  id, name, avatar_url, rating, wins, losses, streak,
  RANK() OVER (ORDER BY rating DESC) AS rank
FROM users
ORDER BY rating DESC;
