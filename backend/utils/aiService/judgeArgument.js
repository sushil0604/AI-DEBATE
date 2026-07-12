const { askAI, safeParseJSON } = require("./groqClient");

/**
 * AI Judge: scores a single round argument during a live debate.
 * @param {string} topic
 * @param {string} side
 * @param {string} argumentText
 * @returns {{ score: number, feedback: string }}
 */
async function judgeArgument({ topic, side, argumentText }) {
  const system = `You are an impartial debate judge AI. Score a single argument
on a 0-10 scale based on logic, evidence, relevance to the topic, and persuasiveness.
Return strict JSON with keys: "score" (number 0-10), "feedback" (string, under 60 words).`;

  const user = `Debate topic: "${topic}"
Side: ${side}
Argument:
"""
${argumentText}
"""`;

  const raw = await askAI(system, user, true);
  return safeParseJSON(raw);
}

module.exports = { judgeArgument };