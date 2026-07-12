const express = require("express");
const router = express.Router();
const {
  createTournament,
  getTournaments,
  getTournamentById,
  joinTournament,
  startTournament,
} = require("../controllers/tournamentController");
const { protect } = require("../middleware/auth");

router.get("/", getTournaments);
router.get("/:id", getTournamentById);
router.post("/", protect, createTournament);
router.post("/:id/join", protect, joinTournament);
router.post("/:id/start", protect, startTournament);

module.exports = router;
