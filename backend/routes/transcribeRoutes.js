// Example Express route — adapt to your actual backend framework if different
// (Next.js API route, Fastify, etc. — the Groq call itself is the same).
//
// npm install express multer form-data node-fetch@2
//
// IMPORTANT: install node-fetch@2 specifically, not the latest version.
// node-fetch 3+ is ESM-only and can't be require()'d. We tried relying on
// Node's built-in global fetch instead, but this environment threw
// "fetch is not a function" — meaning something here doesn't expose a
// working global fetch the way newer Node versions normally do. Pinning to
// node-fetch@2 sidesteps that entirely: it's real CommonJS, and its export
// is directly callable as a function, so this works regardless of the
// underlying Node version or global fetch behavior.
//
// Requires GROQ_API_KEY set in your server environment. NEVER expose this
// key to the browser — that's why the client hook posts to this route
// instead of calling Groq directly.

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch"); // must be node-fetch@2 — see note above

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided." });
  }

  // Very short recording chunks (especially the first one right after
  // MediaRecorder.start()) can produce a near-empty container with little
  // to no actual encoded audio. Sending that to Groq wastes a request and
  // isn't transcribable anyway, so skip it quietly.
  if (req.file.size < 1000) {
    return res.json({ text: "" });
  }

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "chunk.webm",
      contentType: req.file.mimetype || "audio/webm",
    });
    // whisper-large-v3-turbo is fast and cheap — good fit for short chunks.
    // Swap to whisper-large-v3 if you want higher accuracy over speed.
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");
    form.append("language", "en"); // remove/adjust if debates aren't English

    // BUGFIX: passing `form` directly as the fetch body streams it, and
    // under node-fetch@2 this was cutting off before the closing multipart
    // boundary reached Groq — their parser saw "multipart: NextPart: EOF"
    // because the body was truncated. Materializing the whole multipart
    // payload into a single Buffer first (form.getBuffer()) and sending
    // that, with an explicit Content-Length, avoids the streaming timing
    // issue entirely — the full, correctly-sized payload goes out in one
    // shot.
    const buffer = form.getBuffer();
    const headers = {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      ...form.getHeaders(),
      "Content-Length": buffer.length,
    };

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers,
        body: buffer,
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