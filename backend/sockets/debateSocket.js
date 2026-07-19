const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Debate = require("../models/Debate");
const { judgeArgument, generateAIArgument, judgeDebate } = require("../utils/aiService/index");

const AI_VS_AI_MAX_ROUNDS = 6;
const AI_VS_AI_ROUND_DELAY_MS = 4000;

// Tracks active countdown intervals keyed by debateId (prevents duplicate timers)
const activeTimers = new Map();

/**
 * Starts a countdown timer for a live debate.
 * Every second it emits "timer_tick" with secondsLeft.
 * When time runs out:
 *   1. Runs AI judge to get final verdict → emits "debate_ended" with results
 *   2. Waits 60s → deletes the debate room → emits "room_deleted"
 */
async function startDebateTimer(io, debateId) {
  // Guard: don't start a second timer for the same debate
  if (activeTimers.has(debateId)) return;

  const debate = await Debate.findById(debateId);
  if (!debate || !debate.endsAt || debate.status !== "live") return;

  const roomName = `debate:${debateId}`;
  const endsAt = new Date(debate.endsAt).getTime();

  const interval = setInterval(async () => {
    const secondsLeft = Math.max(0, Math.round((endsAt - Date.now()) / 1000));

    // Emit tick to everyone in the room
    io.to(roomName).emit("timer_tick", { secondsLeft });

    if (secondsLeft <= 0) {
      clearInterval(interval);
      activeTimers.delete(debateId);
      await handleTimerExpiry(io, debateId, roomName);
    }
  }, 1000);

  activeTimers.set(debateId, interval);
}

/**
 * Called when the timer hits 0.
 * Gets AI verdict, emits results, waits 60s, then deletes and notifies.
 */
async function handleTimerExpiry(io, debateId, roomName) {
  try {
    const debate = await Debate.findById(debateId).populate("participants.user");
    if (!debate || debate.status !== "live") return;

    let verdict = { winnerSide: "draw", verdict: "Time expired with no arguments submitted." };

    if (debate.rounds.length > 0) {
      verdict = await judgeDebate({ topic: debate.topic, rounds: debate.rounds });
    }

    let winnerParticipant = null;
    if (verdict.winnerSide === "for" || verdict.winnerSide === "against") {
      winnerParticipant = debate.participants.find((p) => p.side === verdict.winnerSide);
    }

    debate.status = "finished";
    debate.endedAt = new Date();
    debate.finalVerdict = verdict.verdict || "";
    debate.winner = winnerParticipant ? winnerParticipant.user._id : null;
    await debate.save();

    // Update ratings for human debates
    if (debate.mode !== "ai_vs_ai" && debate.rounds.length > 0) {
      await updateRatingsAndStats(debate, winnerParticipant);
    }

    // 1. Emit results screen to all users in the room
    io.to(roomName).emit("debate_ended", {
      reason: "timer_expired",
      winnerSide: verdict.winnerSide || "draw",
      verdict: verdict.verdict || "",
      scores: verdict.scores || null,
      biasLevel: verdict.biasLevel || "Low",
      deleteInSeconds: 60,
    });

    // 2. Wait 60s then delete and kick everyone
    setTimeout(async () => {
      try {
        await Debate.findByIdAndDelete(debateId);
        io.to(roomName).emit("room_deleted", {
          message: "This debate room has been removed.",
        });
        // Force all sockets to leave the room
        const sockets = await io.in(roomName).fetchSockets();
        for (const s of sockets) {
          s.leave(roomName);
        }
      } catch (err) {
        console.error("Error deleting debate room:", err);
      }
    }, 60 * 1000);

  } catch (err) {
    console.error("Timer expiry handler error:", err);
  }
}

/**
 * Simple ELO rating update (mirrors debateController).
 */
async function updateRatingsAndStats(debate, winnerParticipant) {
  const K = 32;
  const [p1, p2] = debate.participants;
  const u1 = await User.findById(p1.user._id || p1.user);
  const u2 = await User.findById(p2.user._id || p2.user);
  if (!u1 || !u2) return;

  const expected1 = 1 / (1 + Math.pow(10, (u2.rating - u1.rating) / 400));
  const expected2 = 1 - expected1;

  let score1 = 0.5, score2 = 0.5;
  if (winnerParticipant) {
    const winnerId = winnerParticipant.user._id.toString();
    if (winnerId === u1._id.toString()) {
      score1 = 1; score2 = 0; u1.wins += 1; u2.losses += 1;
    } else {
      score1 = 0; score2 = 1; u2.wins += 1; u1.losses += 1;
    }
  } else {
    u1.draws += 1; u2.draws += 1;
  }

  u1.rating = Math.round(u1.rating + K * (score1 - expected1));
  u2.rating = Math.round(u2.rating + K * (score2 - expected2));
  u1.debatesCount += 1;
  u2.debatesCount += 1;
  await u1.save();
  await u2.save();
}

/**
 * Runs an automatic AI-vs-AI debate to completion.
 */
async function runAIvsAIDebate(io, debateId) {
  const roomName = `debate:${debateId}`;

  for (let i = 0; i < AI_VS_AI_MAX_ROUNDS; i++) {
    const debate = await Debate.findById(debateId).populate("participants.user", "name avatar isAI");
    if (!debate || debate.status !== "live") return;

    const turnSide = i % 2 === 0 ? "for" : "against";
    const speaker = debate.participants.find((p) => p.side === turnSide);
    if (!speaker) return;

    const aiText = await generateAIArgument({
      topic: debate.topic,
      side: turnSide,
      transcript: debate.rounds,
    });

    const aiScore = await judgeArgument({
      topic: debate.topic,
      side: turnSide,
      argumentText: aiText,
    });

    const round = {
      user: speaker.user._id,
      side: turnSide,
      text: aiText,
      aiScore: { score: aiScore.score ?? null, feedback: aiScore.feedback ?? "" },
    };

    debate.rounds.push(round);
    await debate.save();

    io.to(roomName).emit("new_argument", {
      round: {
        ...round,
        user: { _id: speaker.user._id, name: speaker.user.name, avatar: speaker.user.avatar },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, AI_VS_AI_ROUND_DELAY_MS));
  }

  // All rounds done — timer expiry will handle the verdict for ai_vs_ai too,
  // but if timer hasn't fired yet, force finish now.
  const finalDebate = await Debate.findById(debateId).populate("participants.user", "name avatar isAI");
  if (!finalDebate || finalDebate.status !== "live") return;

  const verdict = await judgeDebate({ topic: finalDebate.topic, rounds: finalDebate.rounds });

  let winnerParticipant = null;
  if (verdict.winnerSide === "for" || verdict.winnerSide === "against") {
    winnerParticipant = finalDebate.participants.find((p) => p.side === verdict.winnerSide);
  }

  finalDebate.status = "finished";
  finalDebate.endedAt = new Date();
  finalDebate.finalVerdict = verdict.verdict || "";
  finalDebate.winner = winnerParticipant ? winnerParticipant.user._id : null;
  await finalDebate.save();

  // Cancel timer if still running (ai_vs_ai finished early via rounds)
  if (activeTimers.has(debateId)) {
    clearInterval(activeTimers.get(debateId));
    activeTimers.delete(debateId);
  }

  io.to(roomName).emit("debate_ended", {
    reason: "rounds_complete",
    winnerSide: verdict.winnerSide || "draw",
    verdict: verdict.verdict || "",
    scores: verdict.scores || null,
    biasLevel: verdict.biasLevel || "Low",
    deleteInSeconds: 60,
  });

  setTimeout(async () => {
    try {
      await Debate.findByIdAndDelete(debateId);
      io.to(roomName).emit("room_deleted", { message: "This debate room has been removed." });
      const sockets = await io.in(roomName).fetchSockets();
      for (const s of sockets) s.leave(roomName);
    } catch (err) {
      console.error("Error deleting ai_vs_ai room:", err);
    }
  }, 60 * 1000);
}

/**
 * Wires up all Socket.io behavior for live debates.
 *
 * Client events (emit from frontend):
 *  - "join_debate"    { debateId }
 *  - "leave_debate"   { debateId }
 *  - "send_argument"  { debateId, text }
 *  - "typing"         { debateId, isTyping }
 *  - "set_room_mode"  { debateId, mode }        ← NEW: "text" | "video", first choice wins
 *
 * Server events (listen on frontend):
 *  - "debate_state"   debate document snapshot (includes roomMode if already chosen)
 *  - "timer_tick"     { secondsLeft }
 *  - "new_argument"   { round }
 *  - "debate_ended"   { reason, winnerSide, verdict, deleteInSeconds }
 *  - "room_deleted"   { message }
 *  - "user_typing"    { userId, isTyping }
 *  - "user_joined"    { userId, name }
 *  - "room_mode_set"  { mode }                  ← NEW: broadcast to both participants
 *  - "error_message"  { message }
 */
function registerDebateSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user.name})`);

    socket.on("join_debate", async ({ debateId }) => {
      try {
        const debate = await Debate.findById(debateId).populate(
          "participants.user", "name avatar rating isAI"
        );
        if (!debate) {
          return socket.emit("error_message", { message: "Debate not found" });
        }

        socket.join(`debate:${debateId}`);
        socket.emit("debate_state", { debate });
        socket.to(`debate:${debateId}`).emit("user_joined", {
          userId: socket.user._id,
          name: socket.user.name,
        });

        // If this join made the debate go live, notify everyone in the room
        if (debate.status === "live" && debate.startedAt) {
          const justStarted = (Date.now() - new Date(debate.startedAt).getTime()) < 5000;
          if (justStarted) {
            io.to(`debate:${debateId}`).emit("debate_started", { debateId });
          }
        }

        // Start timer for any live debate that has an endsAt set
        if (debate.status === "live" && debate.endsAt) {
          startDebateTimer(io, debateId);
        }

        // Kick off the AI-vs-AI auto-play loop exactly once per debate
        if (debate.mode === "ai_vs_ai" && debate.status === "live" && !debate.autoPlayStarted) {
          debate.autoPlayStarted = true;
          await debate.save();
          runAIvsAIDebate(io, debateId).catch((err) => {
            console.error("AI vs AI debate loop error:", err);
          });
        }
      } catch (err) {
        socket.emit("error_message", { message: err.message });
      }
    });

    socket.on("leave_debate", ({ debateId }) => {
      socket.leave(`debate:${debateId}`);
    });

    socket.on("typing", ({ debateId, isTyping }) => {
      socket.to(`debate:${debateId}`).emit("user_typing", {
        userId: socket.user._id,
        isTyping: !!isTyping,
      });
    });

    // Room mode (text vs video) — chosen ONCE per debate, by whichever
    // participant picks first. Requires a `roomMode` field on the Debate
    // model: roomMode: { type: String, enum: ["text", "video"], default: null }
    socket.on("set_room_mode", async ({ debateId, mode }) => {
      try {
        if (mode !== "text" && mode !== "video") return;

        const debate = await Debate.findById(debateId);
        if (!debate) {
          return socket.emit("error_message", { message: "Debate not found" });
        }

        // First choice wins and is locked in — later attempts to change it
        // (from either participant) are ignored, so the two sides can never
        // end up desynced onto different rooms.
        if (!debate.roomMode) {
          debate.roomMode = mode;
          await debate.save();
        }

        // Broadcast the authoritative, locked-in mode to EVERYONE in the
        // room (including the sender) so both clients converge on the same
        // value even if they clicked different buttons at nearly the same time.
        io.to(`debate:${debateId}`).emit("room_mode_set", { mode: debate.roomMode });
      } catch (err) {
        socket.emit("error_message", { message: err.message });
      }
    });

    // WebRTC signaling — server just relays these between the two peers in the
    // room; it never touches the actual audio/video stream.
    socket.on("webrtc_offer", ({ debateId, offer }) => {
      socket.to(`debate:${debateId}`).emit("webrtc_offer", {
        offer,
        fromUserId: socket.user._id,
      });
    });

    socket.on("webrtc_answer", ({ debateId, answer }) => {
      socket.to(`debate:${debateId}`).emit("webrtc_answer", {
        answer,
        fromUserId: socket.user._id,
      });
    });

    socket.on("webrtc_ice_candidate", ({ debateId, candidate }) => {
      socket.to(`debate:${debateId}`).emit("webrtc_ice_candidate", {
        candidate,
        fromUserId: socket.user._id,
      });
    });

    socket.on("send_argument", async ({ debateId, text }) => {
      try {
        if (!text || !text.trim()) {
          return socket.emit("error_message", { message: "Argument text is required" });
        }

        const debate = await Debate.findById(debateId).populate(
          "participants.user", "name avatar isAI"
        );
        if (!debate) {
          return socket.emit("error_message", { message: "Debate not found" });
        }
        if (debate.status !== "live") {
          return socket.emit("error_message", { message: "Debate is not live" });
        }
        if (debate.mode === "ai_vs_ai") {
          return socket.emit("error_message", { message: "This is a spectator-only AI vs AI debate" });
        }

        // Block arguments after timer expires
        if (debate.endsAt && new Date() > debate.endsAt) {
          return socket.emit("error_message", { message: "Time is up! No more arguments allowed." });
        }

        const participant = debate.participants.find(
          (p) => p.user._id.toString() === socket.user._id.toString()
        );
        if (!participant) {
          return socket.emit("error_message", { message: "You are not a participant in this debate" });
        }

        const aiScore = await judgeArgument({
          topic: debate.topic,
          side: participant.side,
          argumentText: text,
        });

        const round = {
          user: socket.user._id,
          side: participant.side,
          text,
          aiScore: { score: aiScore.score ?? null, feedback: aiScore.feedback ?? "" },
        };

        debate.rounds.push(round);
        await debate.save();

        io.to(`debate:${debateId}`).emit("new_argument", {
          round: {
            ...round,
            user: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
          },
        });

        // If opponent is AI, generate counter-argument automatically
        const aiParticipant = debate.participants.find(
          (p) => p.user.isAI && p.user._id.toString() !== socket.user._id.toString()
        );

        if (aiParticipant) {
          const aiText = await generateAIArgument({
            topic: debate.topic,
            side: aiParticipant.side,
            transcript: debate.rounds,
          });

          const aiRound = {
            user: aiParticipant.user._id,
            side: aiParticipant.side,
            text: aiText,
          };

          debate.rounds.push(aiRound);
          await debate.save();

          io.to(`debate:${debateId}`).emit("new_argument", {
            round: {
              ...aiRound,
              user: {
                _id: aiParticipant.user._id,
                name: aiParticipant.user.name,
                avatar: aiParticipant.user.avatar,
              },
            },
          });
        }
      } catch (err) {
        socket.emit("error_message", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerDebateSocket;