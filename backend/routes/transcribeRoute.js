// Example Express route — adapt to your actual backend framework if different
// (Next.js API route, Fastify, etc. — the Groq call itself is the same).
//
// npm install express multer form-data node-fetch
//
// Requires GROQ_API_KEY set in your server environment. NEVER expose this
// key to the browser — that's why the client hook posts to this route
// instead of calling Groq directly.

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/api/transcribe", upload.single("audio"), async (req, res) => {
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