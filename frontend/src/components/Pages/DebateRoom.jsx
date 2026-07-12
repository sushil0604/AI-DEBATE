import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FaPaperPlane, FaTrophy, FaEye, FaClock } from "react-icons/fa";
import { debateRoomApi } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import AIBackground from "../Home/AIBackground";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
  : "http://localhost:5000";

/* ─── Timer display component ─── */
const DebateTimer = ({ secondsLeft, expired }) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const isUrgent = secondsLeft <= 60 && !expired;
  const isDanger = secondsLeft <= 30 && !expired;

  if (expired) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-400">
        <FaClock className="animate-pulse" />
        Time&apos;s up!
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-black tabular-nums transition-all ${
        isDanger
          ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
          : isUrgent
          ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
          : "bg-white/5 border border-white/10 text-gray-300"
      }`}
    >
      <FaClock className={`text-xs ${isDanger ? "text-red-400" : isUrgent ? "text-orange-400" : "text-blue-400"}`} />
      {display}
    </div>
  );
};

/* ─── Score bar component ─── */
const ScoreBar = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-gray-400 text-xs w-28 flex-shrink-0">{label}</span>
    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
    <span className="text-white text-xs font-bold w-14 text-right flex-shrink-0">{value}/100</span>
  </div>
);

/* ─── Results / Ended screen ─── */
const ResultsScreen = ({ ended, deleteCountdown, onLeave }) => {
  const forScores  = ended.scores?.for;
  const agScores   = ended.scores?.against;
  const biasLevel  = ended.biasLevel || "Low";

  const biasColor = { Low: "text-green-400", Medium: "text-yellow-400", High: "text-red-400" }[biasLevel] || "text-green-400";
  const biasDot   = { Low: "#4ade80",        Medium: "#facc15",         High: "#f87171"      }[biasLevel] || "#4ade80";

  return (
    <div
      className="mb-6 rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(37,99,235,0.12))",
        border: "1px solid rgba(124,58,237,0.3)",
      }}
    >
      {/* Winner banner */}
      <div className="flex items-center gap-2">
        <FaTrophy className="text-yellow-400 text-xl" />
        <h3 className="font-extrabold text-xl">
          {ended.winnerSide === "draw"
            ? "It's a Draw!"
            : `"${ended.winnerSide.toUpperCase()}" Side Wins!`}
        </h3>
        {ended.reason === "timer_expired" && (
          <span className="ml-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/25 rounded-lg px-2 py-1 flex items-center gap-1">
            <FaClock className="text-[10px]" /> Time expired
          </span>
        )}
      </div>

      {/* Verdict */}
      <p className="text-gray-300 text-sm leading-relaxed">{ended.verdict}</p>

      {/* Score bars — FOR side */}
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

      {/* Score bars — AGAINST side */}
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

      {/* Bias detection */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs w-28">Bias Detection</span>
        <span className={`text-xs font-bold ${biasColor}`}>{biasLevel}</span>
        <span className="w-2.5 h-2.5 rounded-full ml-1" style={{ background: biasDot, boxShadow: `0 0 6px ${biasDot}` }} />
      </div>

      {/* Delete countdown */}
      {deleteCountdown > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <p className="text-gray-500 text-xs">
            Room closes in <span className="text-white font-bold">{deleteCountdown}s</span>
          </p>
          <button
            onClick={onLeave}
            className="text-xs px-4 py-1.5 rounded-lg font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            Leave now
          </button>
        </div>
      )}
    </div>
  );
};

const DebateRoom = () => {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [debate, setDebate] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(null);
  const [sending, setSending] = useState(false);
  const [othersTyping, setOthersTyping] = useState(false);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(0);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const deleteIntervalRef = useRef(null);

  const isSpectatorOnly = debate?.mode === "ai_vs_ai";

  // Start the 60s delete countdown shown on the results screen
  const startDeleteCountdown = useCallback(() => {
    setDeleteCountdown(60);
    deleteIntervalRef.current = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(deleteIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(deleteIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/debate/${debateId}` } });
      return;
    }

    debateRoomApi
      .get(debateId)
      .then((res) => {
        const debateData = res.debate || res.data || res;
        setDebate(debateData);
        setRounds(debateData.rounds || []);

        // If debate is live, calculate initial secondsLeft from endsAt
        if (debateData.status === "live" && debateData.endsAt) {
          const left = Math.max(0, Math.round((new Date(debateData.endsAt) - Date.now()) / 1000));
          setSecondsLeft(left);
          if (left === 0) setTimerExpired(true);
        }

        if (debateData.status === "finished") {
          setTimerExpired(true);
          setEnded({
            winnerSide: debateData.winner ? "for" : "draw",
            verdict: debateData.finalVerdict || "",
          });
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

      // Sync timer from live debate state
      if (data.debate.status === "live" && data.debate.endsAt) {
        const left = Math.max(0, Math.round((new Date(data.debate.endsAt) - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left === 0) setTimerExpired(true);
      }
    });

    socket.on("new_argument", (data) => {
      setRounds((prev) => [...prev, data.round]);
      setSending(false);
      setInput("");
    });

    // ← timer tick from server every second
    socket.on("timer_tick", ({ secondsLeft: sl }) => {
      setSecondsLeft(sl);
      if (sl <= 0) setTimerExpired(true);
    });

    // ← debate finished (timer expired or rounds complete)
    socket.on("debate_ended", (data) => {
      setTimerExpired(true);
      setEnded({
        reason: data.reason,
        winnerSide: data.winnerSide,
        verdict: data.verdict,
        scores: data.scores || null,
        biasLevel: data.biasLevel || "Low",
      });
      startDeleteCountdown();
    });

    // ← room deleted — redirect everyone
    socket.on("room_deleted", () => {
      clearInterval(deleteIntervalRef.current);
      navigate("/livedebates", {
        state: { message: "The debate room has been removed." },
      });
    });

    socket.on("user_typing", ({ isTyping }) => {
      setOthersTyping(isTyping);
    });

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
  }, [debateId, isAuthenticated, authLoading, navigate, startDeleteCountdown]);

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

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending || !socketRef.current || isSpectatorOnly || timerExpired) return;

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
  }, [input, sending, debateId, isSpectatorOnly, timerExpired]);

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
        <div className="text-center max-w-md">
          <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen text-white px-4 py-8 overflow-hidden"
      style={{ fontFamily: "'Exo 2', sans-serif", background: "#0a0a1a" }}
    >
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

            {/* ── TIMER ── */}
            {secondsLeft !== null && (
              <DebateTimer secondsLeft={secondsLeft} expired={timerExpired} />
            )}
          </div>

          <p className="text-gray-500 text-xs">Debate ID: {debateId}</p>
          {isSpectatorOnly && !ended && (
            <p className="text-gray-400 text-xs mt-2">
              Two AI debaters are arguing this one out — sit back and watch.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Results screen */}
        {ended && (
          <ResultsScreen
            ended={ended}
            deleteCountdown={deleteCountdown}
            onLeave={() => navigate("/livedebates")}
          />
        )}

        {/* Rounds */}
        <div
          ref={scrollRef}
          className="rounded-2xl p-5 flex flex-col gap-4 mb-2 max-h-[60vh] overflow-y-auto"
          style={{ background: "rgba(8,12,30,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {rounds.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              {isSpectatorOnly
                ? "The AI debaters are getting started…"
                : "No arguments yet — be the first to speak."}
            </p>
          )}
          {rounds.map((r, i) => {
            const isMine = !isSpectatorOnly && (r.user?._id === user?.id || r.user === user?.id);
            return (
              <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl text-sm"
                  style={{
                    background: r.side === "for" ? "rgba(37,99,235,0.12)" : "rgba(236,72,153,0.12)",
                    border: r.side === "for" ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(236,72,153,0.25)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <span>{r.user?.name || "Debater"} · {r.side}</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{r.text}</p>
                  {r.aiScore?.feedback && (
                    <p className="text-gray-500 text-xs mt-2 italic">
                      Judge: {r.aiScore.feedback}{" "}
                      {r.aiScore.score != null ? `(${r.aiScore.score}/10)` : ""}
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

        {/* Input — hidden for spectator debates and after timer expires */}
        {!ended && !isSpectatorOnly && (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={timerExpired ? "Time's up — no more arguments." : "Make your argument…"}
              disabled={sending || timerExpired}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || timerExpired}
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
