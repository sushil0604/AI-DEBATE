import { useState, useEffect, useRef, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
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

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc_ice_candidate", { debateId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pcRef.current = pc;
    return pc;
  }, [socket, debateId]);

  useEffect(() => {
    if (!enabled || !socket) return;

    let stream;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) return;
        setLocalStream(stream);

        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        if (shouldInitiate) {
          setConnectionState("connecting");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc_offer", { debateId, offer });
        }
      } catch (err) {
        console.error("Could not access camera/mic:", err);
        setConnectionState("failed");
      }
    })();

    const handleOffer = async ({ offer }) => {
      const pc = pcRef.current || createPeerConnection();
      if (!pcRef.current) {
        // local stream wasn't ready yet — attach tracks once available
        stream?.getTracks().forEach((track) => pc.addTrack(track, stream));
      }
      setConnectionState("connecting");
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Apply any ICE candidates that arrived before the remote description was set
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc_answer", { debateId, answer });
    };

    const handleAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
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
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionState("idle");
    };
  }, [enabled, socket, debateId, shouldInitiate, createPeerConnection]);

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

  return { localStream, remoteStream, connectionState, micOn, camOn, toggleMic, toggleCam };
}