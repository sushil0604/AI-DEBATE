const { askAI, safeParseJSON } = require("./groqClient");

// Below this point difference (out of a possible 400 total: 4 categories ×
// 100 each), the two sides are considered close enough to call a draw
// rather than forcing a winner over what's essentially a tie.
const DRAW_THRESHOLD = 15;

function sumScores(sideScores) {
  if (!sideScores) return 0;
  const { logic = 0, evidence = 0, persuasiveness = 0, rebuttal = 0 } = sideScores;
  return logic + evidence + persuasiveness + rebuttal;
}

async function judgeDebate({ topic, rounds }) {
  const system = `You are an impartial debate judge AI. Given the full transcript of a debate, analyze both sides and return a detailed verdict.
Return ONLY strict JSON with these exact keys:
{
  "winnerSide": "for" | "against" | "draw",
  "verdict": "string under 150 words explaining why",
  "scores": {
    "for": {
      "logic": <number 0-100>,
      "evidence": <number 0-100>,
      "persuasiveness": <number 0-100>,
      "rebuttal": <number 0-100>
    },
    "against": {
      "logic": <number 0-100>,
      "evidence": <number 0-100>,
      "persuasiveness": <number 0-100>,
      "rebuttal": <number 0-100>
    }
  },
  "biasLevel": "Low" | "Medium" | "High"
}`;

  const transcript = rounds
    .map((r, i) => `Round ${i + 1} - ${r.side.toUpperCase()}: ${r.text}`)
    .join("\n\n");

  const user = `Debate topic: "${topic}"\n\nTranscript:\n${transcript}`;

  const raw = await askAI(system, user, true);
  const parsed = safeParseJSON(raw);

  // BUGFIX: previously we trusted parsed.winnerSide directly from the AI's
  // response. But the AI generates winnerSide and scores as separate JSON
  // fields with nothing forcing them to agree — it's possible (and was
  // happening in practice) for one side to score higher in every single
  // category while winnerSide still came back "draw", or vice versa,
  // because the model's holistic "who won" impression isn't guaranteed to
  // match the category-by-category numbers it also produced.
  //
  // Instead of trusting the AI's arithmetic, we calculate winnerSide
  // ourselves from the scores it already gave us — this is a simple sum
  // comparison, which is exactly the kind of deterministic calculation
  // code should do rather than an LLM. The AI's own winnerSide field is
  // discarded; verdict text and biasLevel are left as-is since those are
  // genuinely subjective/qualitative, not something with a "correct"
  // deterministic answer the way a score comparison has.
  if (parsed && parsed.scores) {
    const forTotal = sumScores(parsed.scores.for);
    const againstTotal = sumScores(parsed.scores.against);
    const diff = forTotal - againstTotal;

    if (Math.abs(diff) <= DRAW_THRESHOLD) {
      parsed.winnerSide = "draw";
    } else {
      parsed.winnerSide = diff > 0 ? "for" : "against";
    }
  }

  return parsed;
}

module.exports = { judgeDebate };