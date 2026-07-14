const express = require("express");
const router = express.Router();
const {
  createTournament,
  getTournaments,
  getTournamentById,
  joinTournament,
  leaveTournament,
  startTournament,
} = require("../controllers/tournamentController");
const { protect, optionalAuth } = require("../middleware/auth");

router.get("/", optionalAuth, getTournaments);
router.get("/:id", getTournamentById);
router.post("/", protect, createTournament);
router.post("/:id/join", protect, joinTournament);
router.delete("/:id/leave", protect, leaveTournament);
router.post("/:id/start", protect, startTournament);

module.exports = router;