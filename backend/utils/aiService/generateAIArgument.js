const { askAI } = require("./groqClient");

async function generateAIArgument({ topic, side, transcript = [] }) {
  const system = `You are a skilled debate AI arguing the "${side}" side of a topic.
Your arguments are logical, evidence-based, and persuasive.
Keep each argument concise — 3 to 5 sentences maximum.
Directly respond to the opponent's last point if one exists.
Do not repeat arguments already made. Respond in plain text only.`;

  const transcriptText = transcript.length > 0
    ? transcript.map((r) => `${r.side.toUpperCase()}: ${r.text}`).join("\n\n")
    : "No arguments yet — make your opening statement.";

  const userPrompt = `Debate topic: "${topic}"
Your side: ${side}

Debate transcript so far:
${transcriptText}

Now make your next argument for the "${side}" side:`;

  const text = await askAI(system, userPrompt, false);
  return text.trim() || "I stand by my position on this topic.";
}

module.exports = { generateAIArgument };