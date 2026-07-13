const express = require("express");
const router = express.Router();
const { getFeedback, chatWithCoach } = require("../controllers/aiCoachController");
const { protect } = require("../middleware/auth");

router.post("/chat", chatWithCoach);
router.post("/feedback", protect, getFeedback);

// @desc  Returns static AI judge performance stats for the homepage preview
// @route GET /api/ai-coach/judge-stats
// @access Public
router.get("/judge-stats", (req, res) => {
  res.json({
    success: true,
    data: {
      logic: 92,
      evidence: 88,
      persuasiveness: 90,
      rebuttal: 85,
      biasLevel: "Low",
    },
  });
});

// @desc  Returns a sample AI analysis for the homepage "Sample Analysis" button
// @route GET /api/ai-coach/sample-analysis
// @access Public
router.get("/sample-analysis", (req, res) => {
  res.json({
    success: true,
    data: {
      topic: "Should AI have legal rights?",
      side: "for",
      argumentText: "AI systems have demonstrated complex reasoning and creativity. Granting them legal personhood would protect both AI and humans.",
      strengths: ["Clear position", "Mentions societal impact"],
      improvements: ["Needs more evidence", "Define 'legal rights' more precisely"],
      score: 7,
      tip: "Back your claim with real-world examples of AI decision-making.",
    },
  });
});

module.exports = router;