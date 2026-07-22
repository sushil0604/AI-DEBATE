import { useState, useEffect, useRef, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN relay — required when a direct peer-to-peer path isn't possible
    // (e.g. one side on mobile data, the other on home/office wifi, or behind
    // a symmetric NAT/firewall). Without this, ICE negotiation can complete
    // but no actual audio/video ever flows between peers.
    // Replace with your own TURN credentials before shipping to production —
    // this is Metered's free open TURN server, fine for testing only.
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

/**
 * Handles the WebRTC peer connection for a 1-on-1 video debate.
 * The passed-in `socket` must already be connected and joined to the debate room.
 * `shouldInitiate` controls who sends the initial offer (avoids both sides
 * racing to call each other) — pass true for exactly one side, e.g. the
 * participant on the "for" side, or whoever created the debate.
 */
export function useWebRTC(socket, debateId, { enabled, shouldInitiate }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("idle"); // idle | connecting | connected | failed
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaError, setMediaError] = useState(null); // human-readable local media error, if any

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  // Tracks whether we've completed the initial offer/answer handshake at
  // least once. Used to tell "first connection" apart from "renegotiation"
  // so onnegotiationneeded doesn't fire a redundant offer during setup.
  const initialNegotiationDoneRef = useRef(false);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc_ice_candidate", { debateId, candidate: e.candidate });
      }
    };

    pc.onicecandidateerror = (e) => {
      // Common cause: the TURN server is unreachable or its credentials are
      // wrong/expired. Doesn't always mean failure (some candidates are
      // expected to fail), but worth seeing if nothing ever connects.
      console.warn("ICE candidate error:", e.errorText, e.url);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log("Peer connection state:", pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    // Fires whenever tracks are added/removed after the initial handshake,
    // e.g. getUserMedia resolving late (slow camera init, permission dialog
    // delay) and attachLocalTracks calling addTrack post-connection. Without
    // this, tracks are attached locally but the remote peer's SDP is never
    // updated — so audio/video is silently attached but never sent.
    pc.onnegotiationneeded = async () => {
      try {
        // Only the initiating side renegotiates to avoid both peers
        // creating competing offers ("glare"). Also skip if we're already
        // mid-negotiation.
        if (!shouldInitiate || pc.signalingState !== "stable") return;
        if (!initialNegotiationDoneRef.current) return; // initial offer path handles this
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", { debateId, offer });
      } catch (err) {
        console.error("Renegotiation failed:", err);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, debateId, shouldInitiate]);

  // Returns the existing peer connection if one is already being negotiated,
  // otherwise creates exactly one. Never overwrites an in-progress connection.
  const ensurePeerConnection = useCallback(() => {
    return pcRef.current || createPeerConnection();
  }, [createPeerConnection]);

  // Adds each local track to the connection exactly once, even if called
  // multiple times (e.g. once when media resolves, once when an offer
  // arrives) — avoids "InvalidAccessError: A sender already exists".
  const attachLocalTracks = (pc, stream) => {
    const alreadyAttached = new Set(pc.getSenders().map((s) => s.track).filter(Boolean));
    stream.getTracks().forEach((track) => {
      if (!alreadyAttached.has(track)) {
        pc.addTrack(track, stream);
      }
    });
  };

  // Applies any ICE candidates that arrived before the remote description
  // was set, then clears the queue. Shared by both the offer and answer
  // paths so late candidates are never silently dropped on either side.
  const drainPendingCandidates = async (pc) => {
    for (const c of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.error("Error applying queued ICE candidate:", err);
      }
    }
    pendingCandidatesRef.current = [];
  };

  useEffect(() => {
    if (!enabled || !socket) return;

    let stream;
    let cancelled = false;

    (async () => {
      // Try full video+audio first; if the camera is missing/broken/in use,
      // fall back to audio-only so the participant can still join the call.
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.warn("Camera unavailable, falling back to audio-only:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setCamOn(false);
          setMediaError("Camera unavailable — joined with audio only.");
        } catch (err2) {
          console.error("Could not access camera/mic at all:", err2);
          setMediaError(
            err2.name === "NotAllowedError"
              ? "Camera/mic permission denied."
              : err2.name === "NotReadableError"
              ? "Camera or mic already in use by another app/tab."
              : "Could not access camera or microphone."
          );
          setConnectionState("failed");
          return;
        }
      }

      if (cancelled) return;
      setLocalStream(stream);

      // Reuse the connection if one was already created (e.g. an offer from
      // the other side arrived while we were still waiting on getUserMedia).
      // Creating a second RTCPeerConnection here would silently discard any
      // negotiation that already happened on the first one.
      const pc = ensurePeerConnection();
      attachLocalTracks(pc, stream);

      if (shouldInitiate && !pc.currentLocalDescription) {
        setConnectionState("connecting");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", { debateId, offer });
        initialNegotiationDoneRef.current = true;
      }
    })();

    const handleOffer = async ({ offer }) => {
      const pc = ensurePeerConnection();
      // Attach local tracks now in case media resolved after this offer
      // arrived — attachLocalTracks is safe to call more than once, it
      // skips tracks that are already attached.
      if (stream) attachLocalTracks(pc, stream);

      setConnectionState("connecting");
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await drainPendingCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc_answer", { debateId, answer });
      initialNegotiationDoneRef.current = true;
    };

    const handleAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      // BUGFIX: candidates that arrived before the answer was set were
      // previously left in the queue forever on the initiating side.
      await drainPendingCandidates(pc);
      initialNegotiationDoneRef.current = true;
    };

    const handleIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleIceCandidate);

    return () => {
      cancelled = true;
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice_candidate", handleIceCandidate);
      pcRef.current?.close();
      pcRef.current = null;
      pendingCandidatesRef.current = [];
      initialNegotiationDoneRef.current = false;
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionState("idle");
      setMediaError(null);
    };
  }, [enabled, socket, debateId, shouldInitiate, createPeerConnection, ensurePeerConnection]);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((prev) => !prev);
  }, [localStream]);

  const toggleCam = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((prev) => !prev);
  }, [localStream]);

  return { localStream, remoteStream, connectionState, micOn, camOn, toggleMic, toggleCam, mediaError };
}