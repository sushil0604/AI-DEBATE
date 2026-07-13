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

// @desc  Returns curated debate topics grouped by category
// @route GET /api/debates/topics
// @access Public
// NOTE: must be defined BEFORE /:id or Express will treat "topics" as an id
router.get("/topics", (req, res) => {
  const categories = [
    {
      name: "Technology",
      icon: "microchip",
      color: "#60a5fa",
      bg: "rgba(37,99,235,0.15)",
      border: "rgba(37,99,235,0.3)",
      debateCount: 142,
      topics: ["AI will replace most jobs by 2035", "Social media does more harm than good", "Open-source AI should be banned", "Cryptocurrencies are the future of finance"],
    },
    {
      name: "Politics",
      icon: "landmark",
      color: "#fbbf24",
      bg: "rgba(217,119,6,0.15)",
      border: "rgba(217,119,6,0.3)",
      debateCount: 98,
      topics: ["Democracy is failing in the internet age", "Universal basic income is inevitable", "Voting should be mandatory", "Nuclear energy is essential for a green future"],
    },
    {
      name: "Science",
      icon: "flask",
      color: "#34d399",
      bg: "rgba(16,185,129,0.15)",
      border: "rgba(16,185,129,0.3)",
      debateCount: 76,
      topics: ["Space colonization should be a global priority", "Gene editing in humans is ethical", "Climate change is the biggest threat to humanity", "AGI will arrive before 2035"],
    },
    {
      name: "Education",
      icon: "graduation-cap",
      color: "#a78bfa",
      bg: "rgba(124,58,237,0.15)",
      border: "rgba(124,58,237,0.3)",
      debateCount: 54,
      topics: ["Education systems are outdated", "University degrees are no longer worth it", "AI tutors will replace teachers", "Mental health should be taught in schools"],
    },
    {
      name: "Ethics",
      icon: "balance-scale",
      color: "#f472b6",
      bg: "rgba(236,72,153,0.15)",
      border: "rgba(236,72,153,0.3)",
      debateCount: 88,
      topics: ["Should AI have legal rights?", "Animals deserve the same rights as humans", "Capital punishment should be abolished", "Surveillance for safety is justified"],
    },
    {
      name: "Society",
      icon: "globe",
      color: "#2dd4bf",
      bg: "rgba(13,148,136,0.15)",
      border: "rgba(13,148,136,0.3)",
      debateCount: 67,
      topics: ["Cancel culture does more harm than good", "Wealth inequality is the root of most problems", "Social media is destroying democracy", "Remote work is better than office work"],
    },
  ];
  res.json({ success: true, data: { categories } });
});

router.get("/", getDebates);
router.get("/:id", getDebateById);
router.post("/", protect, createDebate);
router.post("/:id/join", protect, joinDebate);
router.post("/:id/argue", protect, submitArgument);
router.post("/:id/finish", protect, finishDebate);

module.exports = router;