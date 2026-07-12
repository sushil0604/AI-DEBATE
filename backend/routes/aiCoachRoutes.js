const express = require("express");
const router = express.Router();
const { getFeedback, chatWithCoach } = require("../controllers/aiCoachController");
const { protect } = require("../middleware/auth");

router.post("/chat", chatWithCoach);
router.post("/feedback", protect, getFeedback);

module.exports = router;