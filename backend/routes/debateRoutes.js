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
  const topics = [
    { category: "Technology", topics: ["AI will replace most jobs by 2035", "Social media does more harm than good", "Open-source AI should be banned", "Cryptocurrencies are the future of finance"] },
    { category: "Politics",   topics: ["Democracy is failing in the internet age", "Universal basic income is inevitable", "Voting should be mandatory", "Nuclear energy is essential for a green future"] },
    { category: "Science",    topics: ["Space colonization should be a global priority", "Gene editing in humans is ethical", "Climate change is the biggest threat to humanity", "AGI will arrive before 2035"] },
    { category: "Society",    topics: ["Cancel culture does more harm than good", "Education systems are outdated", "Wealth inequality is the root of most problems", "Mental health should be taught in schools"] },
    { category: "Ethics",     topics: ["Animals deserve the same rights as humans", "Surveillance for safety is justified", "Capital punishment should be abolished", "Should AI have legal rights?"] },
  ];
  res.json({ success: true, topics });
});

router.get("/", getDebates);
router.get("/:id", getDebateById);
router.post("/", protect, createDebate);
router.post("/:id/join", protect, joinDebate);
router.post("/:id/argue", protect, submitArgument);
router.post("/:id/finish", protect, finishDebate);

module.exports = router;