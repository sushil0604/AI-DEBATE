# AI Debate — Backend

Node.js / Express / MongoDB (Mongoose) backend for the AI Debate frontend.
Covers Auth, Live Debates (Socket.io), Leaderboard, Tournaments, AI Coach
(Claude API), and Pricing/Payments (Stripe).

## 1. Prerequisites

- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string
  - Local install: https://www.mongodb.com/docs/manual/installation/
  - Or run via Docker: `docker run -d -p 27017:27017 --name ai-debate-mongo mongo:7`
- An Anthropic API key (for the AI Coach / AI Judge features)
- A Stripe test account + price ID (only needed for the Pricing/Payments feature)

## 2. Setup

```bash
cd ai-debate-backend
npm install
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/ai_debate
JWT_SECRET=<generate a long random string>
ANTHROPIC_API_KEY=<your key>
STRIPE_SECRET_KEY=<your key>          # optional until you wire up payments
STRIPE_PRICE_PRO_MONTHLY=<price id>   # optional until you wire up payments
CLIENT_URL=http://localhost:5173      # your Vite frontend dev URL
```

## 3. Run

```bash
npm run dev      # nodemon, auto-restart
# or
npm start
```

Server starts on `http://localhost:5000`. Health check: `GET /api/health`.

Optional demo data:

```bash
npm run seed
```

This creates 3 users (`alice@example.com` / `bob@example.com` / `carol@example.com`,
password `password123`), one waiting debate, and one tournament.

## 4. Connecting your React frontend

In your frontend `.env` (Vite):

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Example fetch:

```js
const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { token, user } = await res.json();
localStorage.setItem("token", token);
```

Example Socket.io client (for `LiveDebates.jsx`):

```js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: { token: localStorage.getItem("token") },
});

socket.emit("join_debate", { debateId });
socket.on("debate_state", ({ debate }) => { /* ... */ });
socket.on("new_argument", ({ round }) => { /* append round to UI */ });
socket.emit("send_argument", { debateId, text: "My argument..." });
```

## 5. API Reference

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password }` |
| POST | `/auth/login` | Public | `{ email, password }` |
| GET | `/auth/me` | Private | Current user profile |
| PUT | `/auth/me` | Private | Update name/avatar/password |

### Debates (Live Debates)
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/debates?status=live` | Public | List debates |
| GET | `/debates/:id` | Public | Debate detail |
| POST | `/debates` | Private | `{ topic, description, category, side }` create + auto-join creator |
| POST | `/debates/:id/join` | Private | `{ side }` join opposing side |
| POST | `/debates/:id/argue` | Private | `{ text }` submit argument (REST fallback; prefer socket) |
| POST | `/debates/:id/finish` | Private | AI judges the debate, updates ratings |

Real-time argument exchange happens over **Socket.io** — see `sockets/debateSocket.js`.

### Leaderboard
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/leaderboard?limit=100&page=1` | Public | Ranked list by rating |
| GET | `/leaderboard/:userId` | Public | One user's rank + stats |

### Tournaments
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/tournaments` | Public | List tournaments |
| GET | `/tournaments/:id` | Public | Tournament detail + bracket debates |
| POST | `/tournaments` | Private | Create tournament |
| POST | `/tournaments/:id/join` | Private | Join tournament |
| POST | `/tournaments/:id/start` | Private (creator/admin) | Random-pair bracket, creates live Debate docs |

### AI Coach
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/ai-coach/feedback` | Private | `{ topic, side, argumentText }` → strengths/improvements/score/tip |

### Payments (Stripe)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/payments/create-checkout-session` | Private | Returns Stripe Checkout URL for Pro plan |
| POST | `/payments/webhook` | Public (Stripe-signed) | Handles subscription lifecycle events |
| GET | `/payments/my-history` | Private | Current user's payment history |

## 6. Rating system

Debates use a simple ELO-style rating (K=32). When a debate finishes, the AI
judge picks a winner (or draw) and both participants' `rating`, `wins`,
`losses`/`draws`, and `debatesCount` are updated automatically.

## 7. Project structure

```
ai-debate-backend/
├── config/db.js              MongoDB connection
├── models/                   User, Debate, Tournament, Payment (Mongoose schemas)
├── middleware/                auth (JWT), error handling
├── controllers/               route logic per feature
├── routes/                    Express routers per feature
├── sockets/debateSocket.js    real-time live debate events
├── utils/
│   ├── generateToken.js       JWT signing
│   ├── claudeClient.js        Anthropic API wrapper (coach + judge)
│   └── seed.js                demo data
└── server.js                  app entry point
```
