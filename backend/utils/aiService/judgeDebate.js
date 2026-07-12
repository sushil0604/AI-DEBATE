const { askAI, safeParseJSON } = require("./groqClient");

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
  return safeParseJSON(raw);
}

module.exports = { judgeDebate };