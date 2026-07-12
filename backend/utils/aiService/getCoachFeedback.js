const { askAI, safeParseJSON } = require("./groqClient");

/**
 * AI Coach: gives feedback/tips on a user's argument for a topic.
 * @param {string} topic
 * @param {string} side
 * @param {string} argumentText
 * @returns {{ strengths: string[], improvements: string[], score: number, tip: string }}
 */
async function getCoachFeedback({ topic, side, argumentText }) {
  const system = `You are an expert debate coach. You give constructive, specific,
encouraging feedback on a debater's argument. Focus on logic, evidence, rhetoric,
and structure. Keep feedback concise (under 200 words) and actionable. Return your
answer as strict JSON with keys: "strengths" (array of strings), "improvements"
(array of strings), "score" (number 0-10), "tip" (a single short actionable tip).`;

  const user = `Debate topic: "${topic}"
Debater's side: ${side}
Debater's argument:
"""
${argumentText}
"""`;

  const raw = await askAI(system, user, true);
  return safeParseJSON(raw);
}

module.exports = { getCoachFeedback };