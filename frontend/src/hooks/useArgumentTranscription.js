import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Records short chunks of the local mic audio and sends each one to your
 * backend for transcription (backend proxies to Groq's Whisper endpoint —
 * see server/transcribe route). Appends recognized text to a running
 * transcript roughly every `chunkMs` milliseconds while `isRecording` is true.
 *
 * Usage:
 *   const { transcript, isTranscribing, resetTranscript } = useArgumentTranscription(
 *     localStream,
 *     { isRecording: isMyTurn, chunkMs: 2000 }
 *   );
 *
 * `localStream` should be the same MediaStream you get from useWebRTC
 * (it already contains the mic audio track).
 */
export function useArgumentTranscription(
  localStream,
  { isRecording, chunkMs = 2000, endpoint = "/api/transcribe" } = {}
) {
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const audioOnlyStreamRef = useRef(null);
  const stopRequestedRef = useRef(false);

  const sendChunk = useCallback(
    async (blob) => {
      if (!blob || blob.size === 0) return;
      setIsTranscribing(true);
      try {
        const form = new FormData();
        // webm/opus is what MediaRecorder produces in Chrome/Firefox by default
        form.append("audio", blob, "chunk.webm");

        const res = await fetch(endpoint, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          throw new Error(`Transcription request failed: ${res.status}`);
        }

        const data = await res.json();
        const text = (data.text || "").trim();
        if (text) {
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
        }
        setError(null);
      } catch (err) {
        console.error("Chunk transcription failed:", err);
        setError("Transcription failed for a segment — continuing.");
      } finally {
        setIsTranscribing(false);
      }
    },
    [endpoint]
  );

  // Records one chunk of `chunkMs` length, sends it off, then immediately
  // starts the next chunk — giving a rolling ~chunkMs-delayed transcript
  // instead of waiting for the whole turn to finish.
  const recordLoop = useCallback(
    (stream) => {
      if (stopRequestedRef.current) return;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      const localChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) localChunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(localChunks, { type: mimeType });
        sendChunk(blob);
        if (!stopRequestedRef.current) {
          recordLoop(stream); // start the next chunk right away
        }
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e.error);
        setError("Recording error — retrying.");
        if (!stopRequestedRef.current) {
          recordLoop(stream);
        }
      };

      recorderRef.current = recorder;
      recorder.start();

      // Stop this chunk after chunkMs — onstop fires, sends it, restarts.
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, chunkMs);
    },
    [chunkMs, sendChunk]
  );

  useEffect(() => {
    if (!isRecording || !localStream) return;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setError("No microphone track available to transcribe.");
      return;
    }

    // Use an audio-only clone so we don't interfere with the video track
    // being sent over the peer connection.
    const audioOnlyStream = new MediaStream(audioTracks);
    audioOnlyStreamRef.current = audioOnlyStream;
    stopRequestedRef.current = false;

    recordLoop(audioOnlyStream);

    return () => {
      stopRequestedRef.current = true;
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      audioOnlyStreamRef.current = null;
    };
  }, [isRecording, localStream, recordLoop]);

  const resetTranscript = useCallback(() => setTranscript(""), []);

  return { transcript, isTranscribing, error, resetTranscript };
}