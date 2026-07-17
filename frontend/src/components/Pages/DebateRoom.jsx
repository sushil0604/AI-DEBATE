import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FaPaperPlane, FaTrophy, FaEye, FaClock, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { debateRoomApi } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import AIBackground from "../Home/AIBackground";
import { FaVideo, FaVideoSlash, FaMicrophone as FaMic, FaMicrophoneSlash as FaMicOff } from "react-icons/fa";
import { useWebRTC } from "../../hooks/useWebRTC";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
  : "http://localhost:5000";

const TURN_SECONDS = 60;

const VideoPanel = ({ localStream, remoteStream, connectionState, micOn, camOn, toggleMic, toggleCam }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      {[
        { ref: remoteRef, label: "Opponent", muted: false, active: !!remoteStream },
        { ref: localRef, label: "You", muted: true, active: !!localStream },
      ].map((v) => (
        <div key={v.label} className="relative rounded-xl overflow-hidden aspect-video" style={{ background: "rgba(8,12,30,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {v.active ? (
            <video ref={v.ref} autoPlay playsInline muted={v.muted} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
              {v.label === "Opponent" ? "Waiting to connect…" : "Camera off"}
            </div>
          )}
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white">
            {v.label}
          </span>
        </div>
      ))}
      <div className="col-span-2 flex items-center justify-center gap-3">
        <button onClick={toggleMic} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: micOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {micOn ? <FaMic className="text-white text-xs" /> : <FaMicOff className="text-red-400 text-xs" />}
        </button>
        <button onClick={toggleCam} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: camOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {camOn ? <FaVideo className="text-white text-xs" /> : <FaVideoSlash className="text-red-400 text-xs" />}
        </button>
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">{connectionState}</span>
      </div>
    </div>
  );
};

/* ─── Voice input hook ─── */
const useVoiceInput = (onTranscript) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;       // keep recording until stopped
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (e) => {
        // Append each result to input
        const transcript = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join(" ");
        onTranscript(transcript);
      };

      recognition.onend = () => {
        // Auto-restart if user hasn't manually stopped
        if (listeningRef.current) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.onerror = (e) => {
        if (e.error === "aborted") return; // user stopped manually
        listeningRef.current = false;
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listeningRef.current) {
      // Stop recording
      listeningRef.current = false;
      setListening(false);
      recognitionRef.current.stop();
    } else {
      // Start recording
      listeningRef.current = true;
      setListening(true);
      try { recognitionRef.current.start(); } catch (_) {}
    }
  }, []);

  return { listening, supported, toggle };
};

/* ─── Overall debate timer (top right) ─── */
const DebateTimer = ({ secondsLeft, expired }) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 60 && !expired;
  const isDanger = secondsLeft <= 30 && !expired;

  if (expired) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-400">
        <FaClock className="animate-pulse" /> Time's up!
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-black tabular-nums transition-all ${
      isDanger ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
      : isUrgent ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
      : "bg-white/5 border border-white/10 text-gray-300"
    }`}>
      <FaClock className={`text-xs ${isDanger ? "text-red-400" : isUrgent ? "text-orange-400" : "text-blue-400"}`} />
      {display}
    </div>
  );
};

/* ─── Turn timer bar (shown above input) ─── */
const TurnTimer = ({ turnSecondsLeft, currentTurnSide, myInfo, isMyTurn }) => {
  const pct = Math.max(0, (turnSecondsLeft / TURN_SECONDS) * 100);
  const isUrgent = turnSecondsLeft <= 10;

  const forColor  = isMyTurn ? "#534AB7" : "#374151";
  const agColor   = isMyTurn ? "#D85A30" : "#374151";
  const fillColor = currentTurnSide === "for" ? "#534AB7" : "#D85A30";

  return (
    <div className="mb-3 rounded-xl p-3 flex flex-col gap-2"
      style={{ background: "rgba(8,12,30,0.8)", border: `1px solid ${isMyTurn ? (currentTurnSide === "for" ? "rgba(83,74,183,0.5)" : "rgba(216,90,48,0.5)") : "rgba(255,255,255,0.07)"}` }}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`font-bold uppercase tracking-wide ${currentTurnSide === "for" ? "text-blue-400" : "text-pink-400"}`}>
            {currentTurnSide === "for" ? "👍 FOR" : "👎 AGAINST"}'s turn
          </span>
          {isMyTurn && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 animate-pulse">
              YOUR TURN
            </span>
          )}
        </div>
        <span className={`font-black tabular-nums ${isUrgent ? "text-red-400 animate-pulse" : "text-gray-300"}`}>
          {turnSecondsLeft}s
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: isUrgent
              ? "linear-gradient(90deg,#f87171,#ef4444)"
              : `linear-gradient(90deg,${fillColor}cc,${fillColor})`,
          }}
        />
      </div>
    </div>
  );
};

/* ─── Score bar ─── */
const ScoreBar = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-gray-400 text-xs w-28 flex-shrink-0">{label}</span>
    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
    </div>
    <span className="text-white text-xs font-bold w-14 text-right flex-shrink-0">{value}/100</span>
  </div>
);

/* ─── Results screen ─── */
const ResultsScreen = ({ ended, deleteCountdown, onLeave }) => {
  const forScores = ended.scores?.for;
  const agScores  = ended.scores?.against;
  const biasLevel = ended.biasLevel || "Low";
  const biasColor = { Low: "text-green-400", Medium: "text-yellow-400", High: "text-red-400" }[biasLevel] || "text-green-400";
  const biasDot   = { Low: "#4ade80", Medium: "#facc15", High: "#f87171" }[biasLevel] || "#4ade80";

  return (
    <div className="mb-6 rounded-2xl p-6 flex flex-col gap-5"
      style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(37,99,235,0.12))", border: "1px solid rgba(124,58,237,0.3)" }}>
      <div className="flex items-center gap-2">
        <FaTrophy className="text-yellow-400 text-xl" />
        <h3 className="font-extrabold text-xl">
          {ended.winnerSide === "draw" ? "It's a Draw!" : `"${ended.winnerSide.toUpperCase()}" Side Wins!`}
        </h3>
        {ended.reason === "timer_expired" && (
          <span className="ml-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/25 rounded-lg px-2 py-1 flex items-center gap-1">
            <FaClock className="text-[10px]" /> Time expired
          </span>
        )}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{ended.verdict}</p>

      {forScores && (
        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">FOR side scores</p>
          <div className="flex flex-col gap-2">
            <ScoreBar label="Logic"          value={forScores.logic}          color="#a855f7" />
            <ScoreBar label="Evidence"       value={forScores.evidence}       color="#3b82f6" />
            <ScoreBar label="Persuasiveness" value={forScores.persuasiveness} color="#2dd4bf" />
            <ScoreBar label="Rebuttal"       value={forScores.rebuttal}       color="#818cf8" />
          </div>
        </div>
      )}
      {agScores && (
        <div>
          <p className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">AGAINST side scores</p>
          <div className="flex flex-col gap-2">
            <ScoreBar label="Logic"          value={agScores.logic}          color="#a855f7" />
            <ScoreBar label="Evidence"       value={agScores.evidence}       color="#3b82f6" />
            <ScoreBar label="Persuasiveness" value={agScores.persuasiveness} color="#2dd4bf" />
            <ScoreBar label="Rebuttal"       value={agScores.rebuttal}       color="#818cf8" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs w-28">Bias Detection</span>
        <span className={`text-xs font-bold ${biasColor}`}>{biasLevel}</span>
        <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ background: biasDot, boxShadow: `0 0 6px ${biasDot}` }} />
      </div>
      {deleteCountdown > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <p className="text-gray-500 text-xs">Room closes in <span className="text-white font-bold">{deleteCountdown}s</span></p>
          <button onClick={onLeave} className="text-xs px-4 py-1.5 rounded-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            Leave now
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Main component ─── */
const DebateRoom = () => {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isHumanVsHuman = debate?.mode === "human_vs_human";
  const videoEnabled = isHumanVsHuman && debate?.status === "live" && !ended;
  const shouldInitiate = mySide === "for"; // one deterministic side always offers, avoids both racing

  const webrtc = useWebRTC(socketRef.current, debateId, {
    enabled: videoEnabled,
    shouldInitiate,
  });

  const [debate, setDebate]           = useState(null);
  const [rounds, setRounds]           = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [ended, setEnded]             = useState(null);
  const [sending, setSending]         = useState(false);
  const [othersTyping, setOthersTyping] = useState(false);

  // Overall debate timer
  const [secondsLeft, setSecondsLeft]     = useState(null);
  const [timerExpired, setTimerExpired]   = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(0);

  // Turn-based timer
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(TURN_SECONDS);
  const [currentTurnSide, setCurrentTurnSide] = useState("for"); // who can speak now
  const turnIntervalRef = useRef(null);

  const socketRef        = useRef(null);
  const scrollRef        = useRef(null);
  const typingTimeoutRef = useRef(null);
  const deleteIntervalRef = useRef(null);

  const isSpectatorOnly = debate?.mode === "ai_vs_ai";

  // My side in this debate
  const mySide = debate?.participants?.find(
    (p) => p.user?._id === user?.id || p.user?._id === user?._id || p.user === user?.id
  )?.side;
  const isMyTurn = !isSpectatorOnly && mySide === currentTurnSide && !timerExpired && debate?.status === "live";

  // Derive whose turn it is from rounds
  const deriveTurnSide = useCallback((roundsList) => {
    if (!roundsList || roundsList.length === 0) return "for";
    const lastSide = roundsList[roundsList.length - 1].side;
    return lastSide === "for" ? "against" : "for";
  }, []);

  const currentTurnSideRef = useRef("for");
  const turnSecondsRef = useRef(TURN_SECONDS);

  // Single persistent interval — reads/writes refs only, updates state for UI
  const startTurnTimer = useCallback((side) => {
    clearInterval(turnIntervalRef.current);

    const resolvedSide = side ?? (currentTurnSideRef.current === "for" ? "against" : "for");
    currentTurnSideRef.current = resolvedSide;
    turnSecondsRef.current = TURN_SECONDS;
    setCurrentTurnSide(resolvedSide);
    setTurnSecondsLeft(TURN_SECONDS);

    turnIntervalRef.current = setInterval(() => {
      turnSecondsRef.current -= 1;
      setTurnSecondsLeft(turnSecondsRef.current);

      if (turnSecondsRef.current <= 0) {
        // Switch side
        const next = currentTurnSideRef.current === "for" ? "against" : "for";
        currentTurnSideRef.current = next;
        turnSecondsRef.current = TURN_SECONDS;
        setCurrentTurnSide(next);
        setTurnSecondsLeft(TURN_SECONDS);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(turnIntervalRef.current);
      clearInterval(deleteIntervalRef.current);
    };
  }, []);

  const startDeleteCountdown = useCallback(() => {
    setDeleteCountdown(60);
    deleteIntervalRef.current = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) { clearInterval(deleteIntervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/debate/${debateId}` } });
      return;
    }

    debateRoomApi.get(debateId)
      .then((res) => {
        const d = res.debate || res.data || res;
        setDebate(d);
        setRounds(d.rounds || []);
        if (d.status === "live" && d.endsAt) {
          const left = Math.max(0, Math.round((new Date(d.endsAt) - Date.now()) / 1000));
          setSecondsLeft(left);
          if (left === 0) setTimerExpired(true);
          startTurnTimer(deriveTurnSide(d.rounds || []));
        }
        if (d.status === "finished") {
          setTimerExpired(true);
          setEnded({ winnerSide: d.winner ? "for" : "draw", verdict: d.finalVerdict || "" });
        }
      })
      .catch((err) => setError(err.message || "Couldn't load this debate."))
      .finally(() => setLoading(false));

    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;
    socket.emit("join_debate", { debateId });

    socket.on("debate_state", (data) => {
      setDebate(data.debate);
      setRounds(data.debate.rounds || []);
      setLoading(false);
        if (data.debate.status === "live" && data.debate.endsAt) {
        const left = Math.max(0, Math.round((new Date(data.debate.endsAt) - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left === 0) setTimerExpired(true);
        startTurnTimer(deriveTurnSide(data.debate.rounds || []));
      }
    });

    socket.on("debate_started", ({ debateId: startedId }) => {
      debateRoomApi.get(startedId).then((res) => {
        const d = res.debate || res.data || res;
        setDebate(d);
        setRounds(d.rounds || []);
        if (d.endsAt) {
          const left = Math.max(0, Math.round((new Date(d.endsAt) - Date.now()) / 1000));
          setSecondsLeft(left);
          setTimerExpired(false);
        }
        startTurnTimer("for");
      }).catch(() => {});
    });

    socket.on("user_joined", () => {
      debateRoomApi.get(debateId).then((res) => {
        const d = res.debate || res.data || res;
        if (d.status === "live") {
          setDebate(d);
          if (d.endsAt) {
            const left = Math.max(0, Math.round((new Date(d.endsAt) - Date.now()) / 1000));
            setSecondsLeft(left);
          }
          startTurnTimer("for");
        }
      }).catch(() => {});
    });

    socket.on("new_argument", (data) => {
      setRounds((prev) => {
        const updated = [...prev, data.round];
        const next = data.round.side === "for" ? "against" : "for";
        startTurnTimer(next);
        return updated;
      });
      setSending(false);
      setInput("");
    });

    socket.on("timer_tick", ({ secondsLeft: sl }) => {
      setSecondsLeft(sl);
      if (sl <= 0) setTimerExpired(true);
    });

    socket.on("debate_ended", (data) => {
      setTimerExpired(true);
      clearInterval(turnIntervalRef.current);
      setEnded({
        reason: data.reason,
        winnerSide: data.winnerSide,
        verdict: data.verdict,
        scores: data.scores || null,
        biasLevel: data.biasLevel || "Low",
      });
      startDeleteCountdown();
    });

    socket.on("room_deleted", () => {
      clearInterval(deleteIntervalRef.current);
      navigate("/livedebates", { state: { message: "The debate room has been removed." } });
    });

    socket.on("user_typing", ({ isTyping }) => setOthersTyping(isTyping));

    socket.on("error_message", (data) => {
      setError(data.message || "Something went wrong.");
      setSending(false);
    });

    socket.on("connect_error", (err) => {
      setError(err.message || "Live connection lost — trying to reconnect…");
      setSending(false);
    });

    return () => {
      socket.emit("leave_debate", { debateId });
      socket.disconnect();
    };
  }, [debateId, isAuthenticated, authLoading, navigate, startDeleteCountdown, startTurnTimer, deriveTurnSide]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [rounds]);

  const handleTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { debateId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { debateId, isTyping: false });
    }, 1500);
  }, [debateId]);

  // Append voice transcript to input
  const handleTranscript = useCallback((transcript) => {
    setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const { listening, supported: voiceSupported, toggle: toggleVoice } = useVoiceInput(handleTranscript);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending || !socketRef.current || isSpectatorOnly || timerExpired) return;
    if (!isMyTurn) {
      setError("It's not your turn yet — wait for the other side to finish.");
      return;
    }
    setError("");
    setSending(true);
    socketRef.current.emit("send_argument", { debateId, text });
    setTimeout(() => {
      setSending((current) => {
        if (current) {
          setError("No response from server — check your connection and try again.");
          return false;
        }
        return current;
      });
    }, 15000);
  }, [input, sending, debateId, isSpectatorOnly, timerExpired, isMyTurn]);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ background: "#0a0a1a" }}>
        <p className="text-gray-400 text-sm">Loading debate…</p>
      </div>
    );
  }

  if (error && !debate) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center px-4" style={{ background: "#0a0a1a" }}>
        <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white px-4 py-8 overflow-hidden"
      style={{ fontFamily: "'Exo 2', sans-serif", background: "#0a0a1a" }}>
      <AIBackground fixed={true} />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{debate?.topic || "Debate Room"}</h1>
              {isSpectatorOnly && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-teal-500/15 border border-teal-500/30 text-teal-300">
                  <FaEye className="text-[10px]" /> Spectating
                </span>
              )}
            </div>
            {secondsLeft !== null && (
              <DebateTimer secondsLeft={secondsLeft} expired={timerExpired} />
            )}
          </div>
          <p className="text-gray-500 text-xs">Debate ID: {debateId}</p>
          {isSpectatorOnly && !ended && (
            <p className="text-gray-400 text-xs mt-2">Two AI debaters are arguing this one out — sit back and watch.</p>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Waiting for opponent */}
        {debate?.status === "waiting" && rounds.length === 0 && !ended && (
          <div className="mb-6 rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
            style={{ background: "rgba(8,12,30,0.7)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <FaEye className="text-violet-400 text-xl animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Waiting for opponent…</h3>
              {videoEnabled && (
          <VideoPanel {...webrtc} />
        )}
              <p className="text-gray-400 text-sm">Share this room link or wait for someone to join from Live Debates.</p>
            </div>
            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="flex-1 truncate text-left">{window.location.href}</span>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-violet-400 hover:text-violet-300 font-bold flex-shrink-0">Copy</button>
            </div>
          </div>
        )}

        {/* Results */}
        {ended && (
          <ResultsScreen ended={ended} deleteCountdown={deleteCountdown} onLeave={() => navigate("/livedebates")} />
        )}

        {/* Rounds */}
        <div ref={scrollRef} className="rounded-2xl p-5 flex flex-col gap-4 mb-3 max-h-[55vh] overflow-y-auto"
          style={{ background: "rgba(8,12,30,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {rounds.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              {isSpectatorOnly ? "The AI debaters are getting started…" : "No arguments yet — be the first to speak."}
            </p>
          )}
          {rounds.map((r, i) => {
            const isMine = !isSpectatorOnly && (r.user?._id === user?.id || r.user === user?.id);
            return (
              <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm"
                  style={{
                    background: r.side === "for" ? "rgba(37,99,235,0.12)" : "rgba(236,72,153,0.12)",
                    border: r.side === "for" ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(236,72,153,0.25)",
                  }}>
                  <div className="flex items-center justify-between gap-3 mb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <span>{r.user?.name || "Debater"} · {r.side}</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{r.text}</p>
                  {r.aiScore?.feedback && (
                    <p className="text-gray-500 text-xs mt-2 italic">
                      Judge: {r.aiScore.feedback} {r.aiScore.score != null ? `(${r.aiScore.score}/10)` : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {isSpectatorOnly && !ended && rounds.length > 0 && (
            <p className="text-gray-500 text-xs text-center italic py-2">Next argument incoming…</p>
          )}
        </div>

        {othersTyping && !isSpectatorOnly && (
          <p className="text-gray-500 text-xs mb-2 pl-1 italic">Someone is typing…</p>
        )}

        {/* Turn timer — only shown in live human debates */}
        {!ended && !isSpectatorOnly && debate?.status === "live" && (
          <TurnTimer
            turnSecondsLeft={turnSecondsLeft}
            currentTurnSide={currentTurnSide}
            myInfo={mySide}
            isMyTurn={isMyTurn}
          />
        )}

        {/* Input */}
        {!ended && !isSpectatorOnly && (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                timerExpired ? "Time's up — no more arguments."
                : !isMyTurn && debate?.status === "live" ? `Waiting for ${currentTurnSide === "for" ? "FOR" : "AGAINST"} side…`
                : listening ? "Listening… speak now"
                : "Make your argument…"
              }
              disabled={sending || timerExpired || (!isMyTurn && debate?.status === "live")}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none disabled:opacity-60"
              style={{
                borderColor: listening ? "rgba(239,68,68,0.6)"
                  : isMyTurn ? (mySide === "for" ? "rgba(37,99,235,0.5)" : "rgba(236,72,153,0.5)")
                  : undefined
              }}
            />

            {/* Mic button — shows 🎤 while recording (click to stop), ⏹ when idle (click to start) */}
            {voiceSupported && isMyTurn && !timerExpired && (
              <button
                onClick={toggleVoice}
                title={listening ? "Click to stop recording" : "Click to start speaking"}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: listening
                    ? "linear-gradient(135deg,#ef4444,#dc2626)"
                    : "rgba(255,255,255,0.07)",
                  border: listening ? "none" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: listening ? "0 0 16px rgba(239,68,68,0.5)" : "none",
                }}
              >
                {listening
                  ? <FaMicrophone className="text-white text-sm animate-pulse" />
                  : <FaMicrophoneSlash className="text-gray-300 text-sm" />
                }
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || timerExpired || (!isMyTurn && debate?.status === "live")}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebateRoom;
