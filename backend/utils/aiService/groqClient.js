const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Generic text completion helper.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {boolean} jsonMode
 */
async function askAI(systemPrompt, userPrompt, jsonMode = false) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.7,
    response_format: jsonMode
      ? { type: "json_object" }
      : { type: "text" },
  });

  return completion.choices[0].message.content;
}

/**
 * Safely parse JSON responses.
 */
function safeParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {
      error: "Failed to parse AI response",
      raw,
    };
  }
}

module.exports = {
  groq,
  MODEL,
  askAI,
  safeParseJSON,
};