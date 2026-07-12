const express = require("express");
const router = express.Router();
const {
  createDebate,
  getDebates,
  getDebateById,
  joinDebate,
  submitArgument,
  finishDebate,
} = require("../controllers/debateController");
const { protect } = require("../middleware/auth");

router.get("/", getDebates);
router.get("/:id", getDebateById);
router.post("/", protect, createDebate);
router.post("/:id/join", protect, joinDebate);
router.post("/:id/argue", protect, submitArgument);
router.post("/:id/finish", protect, finishDebate);

module.exports = router;
