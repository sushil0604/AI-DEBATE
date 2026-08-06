// Example Express route — adapt to your actual backend framework if different
// (Next.js API route, Fastify, etc. — the Groq call itself is the same).
//
// npm install express multer form-data
//
// NOTE: this deliberately does NOT use the `node-fetch` package. Versions
// 3+ of node-fetch are ESM-only, so `require("node-fetch")` throws
// ERR_REQUIRE_ESM immediately — which is exactly what was crashing this
// route with a 500 on every single request. Node 18+ (Render is running
// Node 24) has `fetch` built in globally, so nothing needs to be imported
// for it at all.
//
// Requires GROQ_API_KEY set in your server environment. NEVER expose this
// key to the browser — that's why the client hook posts to this route
// instead of calling Groq directly.

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided." });
  }

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "chunk.webm",
      contentType: req.file.mimetype || "audio/webm",
    });
    // whisper-large-v3-turbo is fast and cheap — good fit for 2s chunks.
    // Swap to whisper-large-v3 if you want higher accuracy over speed.
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");
    form.append("language", "en"); // remove/adjust if debates aren't English

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          ...form.getHeaders(),
        },
        body: form,
      }
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq transcription error:", groqRes.status, errText);
      return res.status(502).json({ error: "Transcription provider error." });
    }

    const data = await groqRes.json();
    return res.json({ text: data.text || "" });
  } catch (err) {
    console.error("Transcription route failed:", err);
    return res.status(500).json({ error: "Internal transcription error." });
  }
});

module.exports = router;