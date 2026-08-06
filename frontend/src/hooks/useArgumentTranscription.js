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
  { isRecording, chunkMs = 2000, endpoint, silenceThreshold = 0.02 } = {}
) {
  // BUGFIX: a bare relative path like "/api/transcribe" resolves against
  // whatever domain this page is currently loaded from — the frontend's
  // own domain (e.g. your Vercel deployment), which has no such route.
  // That's why every chunk was failing with "Transcription failed for a
  // segment": the request wasn't even reaching the backend, so Vercel
  // (or whatever's serving the frontend) returned a 404/405 for a route
  // it doesn't have, and the hook correctly reported that as a failure.
  // Default to the same backend base URL the rest of the app already uses.
  const resolvedEndpoint =
    endpoint ||
    `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/transcribe`;

  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const audioOnlyStreamRef = useRef(null);
  const stopRequestedRef = useRef(false);

  // Web Audio API nodes used purely to measure mic volume in real time —
  // completely separate from the MediaRecorder, which still records the
  // full-fidelity audio for upload. This just watches the signal level.
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const volumeDataRef = useRef(null);
  const maxVolumeThisChunkRef = useRef(0);
  const volumeMonitorFrameRef = useRef(null);

  const sendChunk = useCallback(
    async (blob) => {
      if (!blob || blob.size === 0) return;
      setIsTranscribing(true);
      try {
        const form = new FormData();
        // webm/opus is what MediaRecorder produces in Chrome/Firefox by default
        form.append("audio", blob, "chunk.webm");

        const res = await fetch(resolvedEndpoint, {
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
    [resolvedEndpoint]
  );

  // Continuously samples the mic's volume level via an AnalyserNode and
  // tracks the loudest moment seen so far in the current chunk window.
  // Runs on a requestAnimationFrame loop, independent of the recorder.
  const monitorVolume = useCallback(() => {
    if (!analyserRef.current || !volumeDataRef.current) return;

    analyserRef.current.getByteTimeDomainData(volumeDataRef.current);

    // Compute RMS (root mean square) of the waveform, normalized 0–1.
    // Silence sits right at the midpoint (128) of the byte range, so we
    // measure deviation from that midpoint.
    let sumSquares = 0;
    for (let i = 0; i < volumeDataRef.current.length; i++) {
      const normalized = (volumeDataRef.current[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / volumeDataRef.current.length);

    if (rms > maxVolumeThisChunkRef.current) {
      maxVolumeThisChunkRef.current = rms;
    }

    volumeMonitorFrameRef.current = requestAnimationFrame(monitorVolume);
  }, []);

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
      maxVolumeThisChunkRef.current = 0; // reset the peak-volume tracker for this window

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) localChunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(localChunks, { type: mimeType });

        // BUGFIX: sending near-silent chunks to Whisper was producing
        // hallucinated text (invented words/phrases) roughly as often as
        // it correctly returned empty results — Whisper isn't reliable on
        // audio that's mostly silence. If the loudest moment in this whole
        // chunk never exceeded the threshold, nobody was really speaking —
        // skip the upload entirely instead of gambling on what Whisper
        // guesses.
        if (maxVolumeThisChunkRef.current >= silenceThreshold) {
          sendChunk(blob);
        }

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
    [chunkMs, sendChunk, silenceThreshold]
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

    // Set up the volume-monitoring side channel.
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(audioOnlyStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    volumeDataRef.current = new Uint8Array(analyser.fftSize);

    volumeMonitorFrameRef.current = requestAnimationFrame(monitorVolume);

    recordLoop(audioOnlyStream);

    return () => {
      stopRequestedRef.current = true;
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      audioOnlyStreamRef.current = null;

      if (volumeMonitorFrameRef.current) {
        cancelAnimationFrame(volumeMonitorFrameRef.current);
        volumeMonitorFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      volumeDataRef.current = null;
    };
  }, [isRecording, localStream, recordLoop, monitorVolume]);

  const resetTranscript = useCallback(() => setTranscript(""), []);

  return { transcript, isTranscribing, error, resetTranscript };
}