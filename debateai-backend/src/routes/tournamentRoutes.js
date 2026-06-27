import express from "express";
import { listTournaments, joinTournament } from "../controllers/tournamentController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listTournaments);
router.post("/:id/join", authenticate, joinTournament);

export default router;
