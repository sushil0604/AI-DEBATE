const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * AI Coach: conversational chat with history.
 */
async function getCoachChatReply({ message, history = [] }) {
  const messages = [
    {
      role: "system",
      content: `You are Coach Atlas, a friendly and sharp AI debate coach.
Give concise, actionable feedback on arguments. Point out weaknesses,
suggest evidence, and help sharpen rhetoric. Keep responses under 4
sentences unless the user explicitly asks for more depth.`,
    },
  ];

  // Convert history to Groq/OpenAI format
  history.forEach((m) => {
    if (!m.text || !m.text.trim()) return;

    messages.push({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    });
  });

  // Current user message
  messages.push({
    role: "user",
    content: message,
  });

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  return completion.choices[0].message.content;
}

module.exports = { getCoachChatReply };