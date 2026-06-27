import express from "express";
import {
  listDebates,
  getDebate,
  createDebate,
  joinDebate,
  watchDebate,
  postArgument,
  judgeDebate,
} from "../controllers/debateController.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", optionalAuth, listDebates);
router.get("/:id", optionalAuth, getDebate);
router.post("/", authenticate, createDebate);
router.post("/:id/join", authenticate, joinDebate);
router.post("/:id/watch", authenticate, watchDebate);
router.post("/:id/arguments", authenticate, postArgument);
router.post("/:id/judge", authenticate, judgeDebate);

export default router;
