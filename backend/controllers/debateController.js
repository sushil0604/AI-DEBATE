const asyncHandler = require("express-async-handler");
const Debate = require("../models/Debate");
const User = require("../models/User");
const { judgeArgument, judgeDebate } = require("../utils/aiService/index");

// Valid debate durations in minutes
const VALID_DURATIONS = [5, 10, 15];
const DEFAULT_DURATION = 10;

// Finds or creates the AI opponent used for human_vs_ai debates
async function getOrCreateAIOpponent() {
  let aiUser = await User.findOne({ email: "ai-opponent@debateai.system" });
  if (!aiUser) {
    aiUser = await User.create({
      name: "AI Judge",
      email: "ai-opponent@debateai.system",
      password: Math.random().toString(36).slice(2) + Date.now(),
      isAI: true,
    });
  }
  return aiUser;
}

// Finds or creates one of the two AI debaters used for ai_vs_ai spectator debates
async function getOrCreateAIDebater(slug, displayName) {
  const email = `ai-debater-${slug}@debateai.system`;
  let aiUser = await User.findOne({ email });
  if (!aiUser) {
    aiUser = await User.create({
      name: displayName,
      email,
      password: Math.random().toString(36).slice(2) + Date.now(),
      isAI: true,
    });
  }
  return aiUser;
}

// @desc    Create a new debate room
// @route   POST /api/debates
// @access  Private
const createDebate = asyncHandler(async (req, res) => {
  const { mode, topic, description, category, side, maxParticipants, duration } = req.body;

  if (!topic) {
    res.status(400);
    throw new Error("Topic is required");
  }

  // Validate and clamp duration to allowed values
  const parsedDuration = parseInt(duration);
  const debateDuration = VALID_DURATIONS.includes(parsedDuration)
    ? parsedDuration
    : DEFAULT_DURATION;

  const resolvedMode = ["human_vs_human", "human_vs_ai", "ai_vs_ai"].includes(mode)
    ? mode
    : "human_vs_human";

  let participants = [];
  let status = "waiting";
  let startedAt;
  let endsAt;

  if (resolvedMode === "ai_vs_ai") {
    const aiAlpha = await getOrCreateAIDebater("alpha", "AI Debater Alpha");
    const aiBeta = await getOrCreateAIDebater("beta", "AI Debater Beta");
    participants = [
      { user: aiAlpha._id, side: "for" },
      { user: aiBeta._id, side: "against" },
    ];
    status = "live";
    startedAt = new Date();
    endsAt = new Date(Date.now() + debateDuration * 60 * 1000);
  } else {
    if (!side || !["for", "against"].includes(side)) {
      res.status(400);
      throw new Error('side must be "for" or "against"');
    }
    participants = [{ user: req.user._id, side }];

    if (resolvedMode === "human_vs_ai") {
      const aiUser = await getOrCreateAIOpponent();
      const aiSide = side === "for" ? "against" : "for";
      participants.push({ user: aiUser._id, side: aiSide });
      status = "live";
      startedAt = new Date();
      endsAt = new Date(Date.now() + debateDuration * 60 * 1000);
    }
    // human_vs_human stays "waiting" — endsAt set when second user joins
  }

  const debate = await Debate.create({
    topic,
    description,
    category,
    mode: resolvedMode,
    createdBy: req.user._id,
    participants,
    maxParticipants: resolvedMode === "human_vs_human" ? (maxParticipants || 2) : participants.length,
    status,
    startedAt,
    endsAt,
    duration: debateDuration,
  });

  res.status(201).json({ success: true, debate });
});

// @desc    List debates (filterable by status)
// @route   GET /api/debates?status=live
// @access  Public
const getDebates = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const debates = await Debate.find(filter)
    .populate("createdBy", "name avatar rating")
    .populate("participants.user", "name avatar rating")
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit) || 50);

  res.json({ success: true, count: debates.length, debates });
});

// @desc    Get single debate by id
// @route   GET /api/debates/:id
// @access  Public
const getDebateById = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id)
    .populate("createdBy", "name avatar rating")
    .populate("participants.user", "name avatar rating")
    .populate("rounds.user", "name avatar")
    .populate("winner", "name avatar");

  if (!debate) {
    res.status(404);
    throw new Error("Debate not found");
  }

  res.json({ success: true, debate });
});

// @desc    Join a debate (opposing side)
// @route   POST /api/debates/:id/join
// @access  Private
const joinDebate = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id);
  if (!debate) {
    res.status(404);
    throw new Error("Debate not found");
  }

  if (debate.mode !== "human_vs_human") {
    res.status(400);
    throw new Error("This debate does not support joining");
  }

  if (debate.status !== "waiting") {
    res.status(400);
    throw new Error("This debate is not open for joining");
  }

  if (debate.participants.length >= debate.maxParticipants) {
    res.status(400);
    throw new Error("Debate is full");
  }

  const alreadyIn = debate.participants.some(
    (p) => p.user.toString() === req.user._id.toString()
  );
  if (alreadyIn) {
    res.status(400);
    throw new Error("You already joined this debate");
  }

  const takenSide = debate.participants[0].side;
  const side = req.body.side || (takenSide === "for" ? "against" : "for");

  if (side === takenSide) {
    res.status(400);
    throw new Error("That side is already taken");
  }

  debate.participants.push({ user: req.user._id, side });

  if (debate.participants.length >= debate.maxParticipants) {
    debate.status = "live";
    debate.startedAt = new Date();
    // Set endsAt now that the debate is live — use stored duration
    const durationMins = debate.duration || DEFAULT_DURATION;
    debate.endsAt = new Date(Date.now() + durationMins * 60 * 1000);
  }

  await debate.save();
  res.json({ success: true, debate });
});

// @desc    Submit an argument in a live debate
// @route   POST /api/debates/:id/argue
// @access  Private
const submitArgument = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const debate = await Debate.findById(req.params.id);

  if (!debate) {
    res.status(404);
    throw new Error("Debate not found");
  }
  if (debate.status !== "live") {
    res.status(400);
    throw new Error("Debate is not live");
  }
  if (debate.mode === "ai_vs_ai") {
    res.status(400);
    throw new Error("This is a spectator-only AI vs AI debate");
  }

  // Block submissions after timer expires
  if (debate.endsAt && new Date() > debate.endsAt) {
    res.status(400);
    throw new Error("Debate time has expired");
  }

  const participant = debate.participants.find(
    (p) => p.user.toString() === req.user._id.toString()
  );
  if (!participant) {
    res.status(403);
    throw new Error("You are not a participant in this debate");
  }

  const aiScore = await judgeArgument({
    topic: debate.topic,
    side: participant.side,
    argumentText: text,
  });

  debate.rounds.push({
    user: req.user._id,
    side: participant.side,
    text,
    aiScore: { score: aiScore.score ?? null, feedback: aiScore.feedback ?? "" },
  });

  await debate.save();
  res.status(201).json({
    success: true,
    round: debate.rounds[debate.rounds.length - 1],
  });
});

// @desc    End a debate and get AI final verdict + update ratings
// @route   POST /api/debates/:id/finish
// @access  Private
const finishDebate = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id).populate("participants.user");

  if (!debate) {
    res.status(404);
    throw new Error("Debate not found");
  }
  if (debate.status !== "live") {
    res.status(400);
    throw new Error("Debate is not live");
  }
  if (debate.rounds.length === 0) {
    res.status(400);
    throw new Error("Cannot finish a debate with no arguments");
  }

  const verdict = await judgeDebate({ topic: debate.topic, rounds: debate.rounds });

  let winnerParticipant = null;
  if (verdict.winnerSide === "for" || verdict.winnerSide === "against") {
    winnerParticipant = debate.participants.find((p) => p.side === verdict.winnerSide);
  }

  debate.status = "finished";
  debate.endedAt = new Date();
  debate.finalVerdict = verdict.verdict || "";
  debate.winner = winnerParticipant ? winnerParticipant.user._id : null;

  await debate.save();

  if (debate.mode !== "ai_vs_ai") {
    await updateRatingsAndStats(debate, winnerParticipant);
  }

  res.json({ success: true, debate, verdict });
});

// Simple ELO-style rating update
async function updateRatingsAndStats(debate, winnerParticipant) {
  const K = 32;
  const [p1, p2] = debate.participants;
  const u1 = await User.findById(p1.user._id || p1.user);
  const u2 = await User.findById(p2.user._id || p2.user);
  if (!u1 || !u2) return;

  const expected1 = 1 / (1 + Math.pow(10, (u2.rating - u1.rating) / 400));
  const expected2 = 1 - expected1;

  let score1 = 0.5;
  let score2 = 0.5;

  if (winnerParticipant) {
    const winnerId = winnerParticipant.user._id.toString();
    if (winnerId === u1._id.toString()) {
      score1 = 1; score2 = 0;
      u1.wins += 1; u2.losses += 1;
    } else {
      score1 = 0; score2 = 1;
      u2.wins += 1; u1.losses += 1;
    }
  } else {
    u1.draws += 1;
    u2.draws += 1;
  }

  u1.rating = Math.round(u1.rating + K * (score1 - expected1));
  u2.rating = Math.round(u2.rating + K * (score2 - expected2));
  u1.debatesCount += 1;
  u2.debatesCount += 1;

  await u1.save();
  await u2.save();
}

module.exports = {
  createDebate,
  getDebates,
  getDebateById,
  joinDebate,
  submitArgument,
  finishDebate,
};