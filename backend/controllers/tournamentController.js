const asyncHandler = require("express-async-handler");
const Tournament = require("../models/Tournament");
const Debate = require("../models/Debate");

const STATUS_MAP = {
  upcoming: ["registration_open", "upcoming"],
  in_progress: ["in_progress"],
  past: ["completed"],
};

const shapeTournament = (t, userId) => {
  const isPast = ["completed", "cancelled"].includes(t.status);
  const isInProgress = t.status === "in_progress";
  const isRegistered = userId
    ? t.participants.some((p) => p._id?.toString() === userId.toString() || p.toString() === userId.toString())
    : false;

  return {
    id: t._id,
    name: t.name,
    category: t.topic || "General",
    round: isInProgress ? "In Progress" : t.description || "",
    players: t.participants.length,
    maxPlayers: t.maxParticipants,
    prize: t.prize || "TBD",
    date: t.startDate ? new Date(t.startDate).toLocaleDateString() : "",
    hot: t.participants.length >= Math.ceil(t.maxParticipants * 0.75) && !isPast,
    status: isPast ? "past" : isInProgress ? "in_progress" : "upcoming",
    isRegistered,
  };
};

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Private
const createTournament = asyncHandler(async (req, res) => {
  const { name, description, topic, maxParticipants, startDate, endDate, prize } = req.body;

  if (!name || !startDate) {
    res.status(400);
    throw new Error("Name and startDate are required");
  }

  const tournament = await Tournament.create({
    name,
    description,
    topic,
    maxParticipants: maxParticipants || 8,
    startDate,
    endDate,
    prize,
    createdBy: req.user._id,
    participants: [req.user._id],
  });

  res.status(201).json({ success: true, tournament });
});

// @desc    List tournaments
// @route   GET /api/tournaments
// @access  Public
const getTournaments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && STATUS_MAP[req.query.status]) {
    filter.status = { $in: STATUS_MAP[req.query.status] };
  }

  const tournaments = await Tournament.find(filter)
    .populate("createdBy", "name avatar")
    .populate("participants", "name avatar rating")
    .sort({ startDate: 1 });

  // Pass userId if token present (optional auth)
  const userId = req.user?._id || null;

  res.json({
    success: true,
    count: tournaments.length,
    tournaments: tournaments.map((t) => shapeTournament(t, userId)),
  });
});

// @desc    Get tournament by id
// @route   GET /api/tournaments/:id
// @access  Public
const getTournamentById = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate("createdBy", "name avatar")
    .populate("participants", "name avatar rating")
    .populate({
      path: "debates",
      populate: { path: "participants.user", select: "name avatar rating" },
    })
    .populate("winner", "name avatar");

  if (!tournament) {
    res.status(404);
    throw new Error("Tournament not found");
  }

  res.json({ success: true, tournament });
});

// @desc    Join / register for a tournament
// @route   POST /api/tournaments/:id/join
// @access  Private
const joinTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) {
    res.status(404);
    throw new Error("Tournament not found");
  }
  if (tournament.status !== "registration_open") {
    res.status(400);
    throw new Error("Registration is not open for this tournament");
  }
  if (tournament.participants.length >= tournament.maxParticipants) {
    res.status(400);
    throw new Error("Tournament is full");
  }
  if (tournament.participants.some((p) => p.toString() === req.user._id.toString())) {
    res.status(400);
    throw new Error("You already joined this tournament");
  }

  tournament.participants.push(req.user._id);

  if (tournament.participants.length >= tournament.maxParticipants) {
    tournament.status = "upcoming";
  }

  await tournament.save();
  res.json({ success: true, tournament: shapeTournament(tournament, req.user._id) });
});

// @desc    Leave / unregister from a tournament
// @route   DELETE /api/tournaments/:id/leave
// @access  Private
const leaveTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) {
    res.status(404);
    throw new Error("Tournament not found");
  }
  if (!["registration_open", "upcoming"].includes(tournament.status)) {
    res.status(400);
    throw new Error("You can only unregister before the tournament starts");
  }

  const before = tournament.participants.length;
  tournament.participants = tournament.participants.filter(
    (p) => p.toString() !== req.user._id.toString()
  );

  if (tournament.participants.length === before) {
    res.status(400);
    throw new Error("You are not registered in this tournament");
  }

  // Re-open registration if it was closed due to being full
  if (tournament.status === "upcoming") {
    tournament.status = "registration_open";
  }

  await tournament.save();
  res.json({ success: true, message: "Successfully unregistered from tournament" });
});

// @desc    Generate first-round bracket debates
// @route   POST /api/tournaments/:id/start
// @access  Private (creator or admin)
const startTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) {
    res.status(404);
    throw new Error("Tournament not found");
  }

  if (
    tournament.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Only the tournament creator or an admin can start it");
  }

  if (tournament.participants.length < 2) {
    res.status(400);
    throw new Error("Need at least 2 participants to start");
  }

  const shuffled = [...tournament.participants].sort(() => Math.random() - 0.5);

  const debateIds = [];
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const debate = await Debate.create({
      topic: tournament.topic || tournament.name,
      createdBy: tournament.createdBy,
      tournament: tournament._id,
      participants: [
        { user: shuffled[i], side: "for" },
        { user: shuffled[i + 1], side: "against" },
      ],
      status: "live",
      startedAt: new Date(),
    });
    debateIds.push(debate._id);
  }

  tournament.debates.push(...debateIds);
  tournament.status = "in_progress";
  await tournament.save();

  res.json({ success: true, tournament, createdDebates: debateIds });
});

module.exports = {
  createTournament,
  getTournaments,
  getTournamentById,
  joinTournament,
  leaveTournament,
  startTournament,
};