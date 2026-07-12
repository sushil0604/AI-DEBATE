# DebateAI Backend

Node.js + Express + PostgreSQL API for the DebateAI frontend.

**Tested:** the schema and auth flow in this package were run end-to-end against
a real PostgreSQL engine (signup, duplicate-email rejection, login,
correct/incorrect password handling, JWT issuance and verification, debate
creation/joining, argument posting, and the leaderboard view all passed).

## 1. Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
- `CLIENT_URL` — your frontend's URL (for CORS)

## 2. Create the database

```bash
createdb debateai
npm run migrate
```

This runs `src/db/schema.sql`, which creates all tables, indexes, and the
`leaderboard` view, and seeds the 9 default categories.

> Requires PostgreSQL 13+ (uses the built-in `gen_random_uuid()`). On older
> versions, uncomment the `pgcrypto` extension line at the top of `schema.sql`.

## 3. Run the server

```bash
npm start        # production
npm run dev       # auto-restart on file changes
```

Server starts on `http://localhost:5000` (or your `PORT`).

## API Overview

### Auth — `/api/auth`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/signup` | – | Create account, returns user + access/refresh tokens |
| POST | `/login` | – | Returns user + access/refresh tokens |
| POST | `/refresh` | – | Exchange refresh token for new access token |
| POST | `/logout` | – | Invalidates the given refresh token |
| GET | `/me` | ✅ | Current user's profile |

### Debates — `/api/debates`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/?category=&search=&status=` | optional | List debates (default status=live) |
| GET | `/:id` | optional | Debate detail + full argument transcript |
| POST | `/` | ✅ | Create a debate (you become debater A) |
| POST | `/:id/join` | ✅ | Join an open debate as debater B |
| POST | `/:id/watch` | ✅ | Register as a spectator (bumps watch count) |
| POST | `/:id/arguments` | ✅ | Post an argument as your assigned side |
| POST | `/:id/judge` | ✅ | Trigger AI scoring, close debate, update ratings |

### Leaderboard — `/api/leaderboard`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | – | Top 100 ranked users |
| GET | `/me` | ✅ | Your own rank |

### Tournaments — `/api/tournaments`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/?status=upcoming\|in_progress\|past` | – | List tournaments |
| POST | `/:id/join` | ✅ | Register for a tournament |

### Topics — `/api/topics`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | – | All categories with live debate counts |

## Auth flow for the frontend

```javascript
// Signup / Login both return:
{ user: {...}, accessToken: "...", refreshToken: "..." }

// Store accessToken in memory (or a short-lived cookie), refreshToken in
// localStorage or an httpOnly cookie. Attach accessToken to requests:
fetch("/api/debates", {
  headers: { Authorization: `Bearer ${accessToken}` }
});

// When accessToken expires (15 min default), call /api/auth/refresh
// with the refreshToken to get a new accessToken.
```

## Known stub / things to finish before production

1. **AI judging (`POST /api/debates/:id/judge`)** — currently uses placeholder
   random scoring. Swap the `scoreSide()` logic in
   `src/controllers/debateController.js` for a real call to an LLM that reads
   the argument transcript and scores it.
2. **Leaderboard periods** — `GET /api/leaderboard?period=week|month` accepts
   the param but currently always returns all-time stats. To support real
   weekly/monthly views, add a `debate_results` table with timestamps and
   aggregate by period instead of reading the live `users` columns.
3. **Refresh token rotation** — tokens are currently not rotated/invalidated
   on use. For production, consider rotating on each refresh and revoking the
   old one.
4. **Email verification / password reset** — not implemented yet.
5. **WebSockets** — live debate arguments currently require polling
   (`GET /api/debates/:id`). For real real-time updates, add Socket.io or
   similar on top of this REST layer.
