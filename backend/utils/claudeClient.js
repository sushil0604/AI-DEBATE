const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Generic text completion helper.
 */
async function askAI(systemPrompt, userPrompt, jsonMode = false) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: jsonMode
      ? { type: "json_object" }
      : { type: "text" },
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
  });

  return completion.choices[0].message.content;
}

/**
 * AI Coach Feedback
 */
async function getCoachFeedback({ topic, side, argumentText }) {
  const system = `You are an expert debate coach.
Give constructive feedback.
Return ONLY valid JSON:

{
  "strengths": [],
  "improvements": [],
  "score": 0,
  "tip": ""
}`;

  const user = `
Topic: ${topic}
Side: ${side}

Argument:
${argumentText}
`;

  const raw = await askAI(system, user, true);
  return safeParseJSON(raw);
}

/**
 * Judge One Argument
 */
async function judgeArgument({ topic, side, argumentText }) {
  const system = `You are an impartial debate judge.

Return ONLY JSON:

{
  "score":0,
  "feedback":""
}`;

  const user = `
Topic: ${topic}
Side: ${side}

Argument:
${argumentText}
`;

  const raw = await askAI(system, user, true);
  return safeParseJSON(raw);
}

/**
 * Judge Entire Debate
 */
async function judgeDebate({ topic, rounds }) {
  const transcript = rounds
    .map(
      (r, i) =>
        `Round ${i + 1}
${r.side}
${r.text}`
    )
    .join("\n\n");

  const system = `You are an expert debate judge.

Return ONLY JSON.

{
"winnerSide":"for",
"verdict":""
}`;

  const raw = await askAI(
    system,
    `Topic: ${topic}

${transcript}`,
    true
  );

  return safeParseJSON(raw);
}

/**
 * AI Coach Chat
 */
async function getCoachChatReply({ message, history = [] }) {
  const messages = [
    {
      role: "system",
      content:
        "You are Coach Atlas, an expert AI Debate Coach. Give concise, actionable advice.",
    },
  ];

  history.forEach((m) => {
    messages.push({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    });
  });

  messages.push({
    role: "user",
    content: message,
  });

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    messages,
  });

  return completion.choices[0].message.content;
}

/**
 * AI Debater: generates a counter-argument for the AI's side, given the debate so far.
 * Used when the AI is a live participant in a human_vs_ai or ai_vs_ai debate.
 */
async function generateAIArgument({ topic, side, transcript = [] }) {
  const system = `You are a skilled debater arguing the "${side}" side of a debate.
Given the topic and the conversation so far, write a single strong, persuasive
argument or rebuttal (2-4 sentences). Directly address the opponent's most recent
point if there is one. Do not repeat earlier points. Do not use markdown, headers,
or bullet points. Return ONLY the argument text itself — no preamble like
"Here's my argument:" or quotation marks around it.`;

  const transcriptText = transcript.length
    ? transcript
        .map((r, i) => `Round ${i + 1} (${r.side}): ${r.text}`)
        .join("\n\n")
    : "(No arguments yet — you are opening the debate.)";

  const user = `Debate topic: "${topic}"
Your side: ${side}

Transcript so far:
${transcriptText}

Write your next argument.`;

  const reply = await askAI(system, user, false);
  return reply.trim();
}

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
  getCoachFeedback,
  judgeArgument,
  judgeDebate,
  getCoachChatReply,
  generateAIArgument,
};