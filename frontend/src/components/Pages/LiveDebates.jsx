import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaCircle, FaEye, FaUsers, FaClock,
  FaTrophy, FaFire, FaBolt, FaLeaf, FaLandmark,
  FaFlask, FaGraduationCap, FaBriefcase, FaGlobe,
  FaMicrochip, FaRobot, FaChevronDown, FaSignInAlt,
  FaUserPlus, FaPlay, FaUserFriends,
} from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";
import AIBackground from "../Home/AIBackground";
import { debateApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext"; // adjust relative path per file
import CreateDebateModal from "./CreateDebateModal";

/* ─── Filter tabs ─── */
const filters = [
  { label: "All",        icon: <FaGlobe /> },
  { label: "Trending",   icon: <FaFire /> },
  { label: "Technology", icon: <FaMicrochip /> },
  { label: "Politics",   icon: <FaLandmark /> },
  { label: "Science",    icon: <FaFlask /> },
  { label: "Education",  icon: <FaGraduationCap /> },
];

const sortOptions = ["Latest", "Most Watched", "Ending Soon", "Most Joined"];

const TAG_STYLES = {
  Technology: { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/25" },
  Science:    { color: "text-green-400",  bg: "bg-green-500/10 border-green-500/25" },
  Politics:   { color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/25" },
  Education:  { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/25" },
  General:    { color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/25" },
};

const WAITING_EXPIRY_MS = 5 * 60 * 1000; // must match backend debateCleanup.js

/* ─── Time left string from endsAt ─── */
function getTimeLeft(endsAt, status, duration, createdAt) {
  if (status === "waiting") {
    if (!createdAt) return duration ? `${duration} min debate` : "Waiting";
    const expiresAt = new Date(createdAt).getTime() + WAITING_EXPIRY_MS;
    const secs = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
    if (secs <= 0) return "Expiring…";
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `Closes in ${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  if (!endsAt) return "In progress";
  const secs = Math.max(0, Math.round((new Date(endsAt) - Date.now()) / 1000));
  if (secs <= 0) return "Ending…";
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")} left`;
}

function toCardShape(d) {
  const tagStyle = TAG_STYLES[d.category] || TAG_STYLES.General;
  const forSide = d.participants?.find((p) => p.side === "for");
  const againstSide = d.participants?.find((p) => p.side === "against");

  const toDebater = (p) => ({
    name: p?.user?.name || "Waiting…",
    rating: p?.user?.rating ?? 1000,
    avatar: p?.user?.isAI ? null : p?.user?.avatar || null,
    argument:
      [...(d.rounds || [])].reverse().find((r) => r.side === p?.side)?.text ||
      "No argument yet.",
  });

  const isJoinable = d.mode === "human_vs_human" && d.status === "waiting";
  const isEnding = d.endsAt && Math.max(0, (new Date(d.endsAt) - Date.now()) / 1000) <= 60;

  return {
    id: d._id,
    title: d.topic,
    tag: d.category || "General",
    tagColor: tagStyle.color,
    tagBg: tagStyle.bg,
    watching: 0,
    timeLeft: getTimeLeft(d.endsAt, d.status, d.duration, d.createdAt),
    endsAt: d.endsAt || null,
    createdAt: d.createdAt || null,
    duration: d.duration || null,
    status: d.status,
    debaterA: toDebater(forSide),
    debaterB: toDebater(againstSide),
    isAI: !!(forSide?.user?.isAI || againstSide?.user?.isAI),
    isJoinable,
    isEnding,
    hot: (d.rounds || []).length >= 3,
  };
}

/* ─── Live timer badge (updates itself every second) ─── */
const LiveTimerBadge = ({ endsAt, status, duration, createdAt }) => {
  const [display, setDisplay] = useState(() => getTimeLeft(endsAt, status, duration, createdAt));
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (status === "waiting") {
        if (!createdAt) {
          setDisplay(duration ? `${duration} min debate` : "Waiting");
          return;
        }
        const expiresAt = new Date(createdAt).getTime() + WAITING_EXPIRY_MS;
        const secs = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        setDisplay(secs <= 0 ? "Expiring…" : `Closes in ${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        setIsUrgent(secs <= 60 && secs > 0);
        return;
      }
      if (!endsAt) { setDisplay("In progress"); return; }
      const secs = Math.max(0, Math.round((new Date(endsAt) - Date.now()) / 1000));
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      setDisplay(secs <= 0 ? "Ending…" : `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")} left`);
      setIsUrgent(secs <= 60 && secs > 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, status, duration, createdAt]);

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${isUrgent ? "text-orange-400 font-bold" : status === "waiting" ? "text-yellow-400" : "text-gray-300"}`}>
      <FaClock className={`${isUrgent ? "text-orange-400 animate-pulse" : status === "waiting" ? "text-yellow-400" : "text-blue-400"}`} />
      <span>{display}</span>
    </div>
  );
};

/* ─── Avatar helper ─── */
const Avatar = ({ src, name, size = 48, ring = "ring-violet-500/50" }) => {
  if (!src) {
    return (
      <div
        className={`flex-shrink-0 rounded-full ring-2 ${ring} flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800`}
        style={{ width: size, height: size }}
      >
        <FaRobot className="text-violet-200" style={{ fontSize: size * 0.42 }} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={`flex-shrink-0 rounded-full ring-2 ${ring} object-cover`}
      style={{ width: size, height: size }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`;
      }}
    />
  );
};

/* ─── Debate Card ─── */
const DebateCard = ({ d, onWatch, onJoin, joining }) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-violet-900/40 hover:shadow-2xl"
    style={{
      background: "rgba(8,12,30,0.78)",
      backdropFilter: "blur(18px)",
      border: d.isEnding
        ? "1px solid rgba(251,146,60,0.45)"
        : "1px solid rgba(255,255,255,0.07)",
      boxShadow: d.isEnding
        ? "0 4px 24px rgba(251,146,60,0.15)"
        : "0 4px 24px rgba(0,0,0,0.35)",
    }}
  >
    {/* Top row */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-red-500/20 border border-red-500/40 text-red-400">
            <FaCircle className="text-[6px] animate-pulse" />
            LIVE
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${d.tagBg} ${d.tagColor}`}>
            {d.tag}
          </span>
          {d.hot && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <FaFire className="text-[8px]" /> HOT
            </span>
          )}
          {d.isEnding && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
              <FaClock className="text-[8px]" /> ENDING SOON
            </span>
          )}
        </div>
        <h3 className="text-white font-extrabold text-base leading-snug">{d.title}</h3>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <FaEye className="text-violet-400" />
          <span className="text-white font-bold">{d.watching}</span>
          <span>watching</span>
        </div>
        {/* ── Live ticking timer per card ── */}
        <LiveTimerBadge endsAt={d.endsAt} status={d.status} duration={d.duration} createdAt={d.createdAt} />
      </div>
    </div>

    {/* VS row */}
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="flex items-center gap-3">
        <Avatar src={d.debaterA.avatar} name={d.debaterA.name} ring="ring-blue-500/50" />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{d.debaterA.name}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <FaTrophy className="text-yellow-400 text-[9px]" /> {d.debaterA.rating}
          </p>
        </div>
      </div>

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
        style={{
          background: "linear-gradient(135deg,#7c3aed,#2563eb)",
          boxShadow: "0 0 18px rgba(124,58,237,0.45)",
          color: "#fff",
        }}
      >
        VS
      </div>

      <div className="flex items-center gap-3 flex-row-reverse sm:flex-row justify-end sm:justify-start">
        <div className="min-w-0 text-right sm:text-left">
          <p className="text-white font-bold text-sm truncate">{d.debaterB.name}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1 justify-end sm:justify-start">
            <FaTrophy className="text-yellow-400 text-[9px]" />
            {d.isAI ? <FaRobot className="text-violet-300 text-[9px]" /> : d.debaterB.rating}
          </p>
        </div>
        <Avatar
          src={d.debaterB.avatar}
          name={d.debaterB.name}
          ring={d.isAI ? "ring-violet-500/60" : "ring-pink-500/50"}
        />
      </div>
    </div>

    {/* Arguments preview */}
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl p-3" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)" }}>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Argument</p>
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{d.debaterA.argument}</p>
      </div>
      <div className="rounded-xl p-3" style={{ background: d.isAI ? "rgba(124,58,237,0.08)" : "rgba(236,72,153,0.08)", border: d.isAI ? "1px solid rgba(124,58,237,0.18)" : "1px solid rgba(236,72,153,0.18)" }}>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Argument</p>
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{d.debaterB.argument}</p>
      </div>
    </div>

    {/* Action buttons */}
    <div className="flex gap-2 pt-1">
      <button
        onClick={() => onWatch(d.id)}
        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95 ${d.isJoinable ? "flex-1" : "w-full"}`}
        style={{
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
        }}
      >
        <MdLiveTv className="text-base" />
        Watch Live
      </button>
      {d.isJoinable && (
        <button
          onClick={() => onJoin(d.id)}
          disabled={joining === d.id}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-white/10 active:scale-95 disabled:opacity-60"
          style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0" }}
        >
          <FaUserFriends className="text-blue-400" />
          {joining === d.id ? "Joining…" : "Join Debate"}
        </button>
      )}
    </div>
  </div>
);

/* ─── Main Page ─── */
const LiveDebates = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Latest");
  const [search, setSearch] = useState("");

  const [debates, setDebates] = useState([]);
  const [pageStats, setPageStats] = useState({ debatersOnline: 0, liveCount: 0, totalWatching: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(null);
  const [startingDebate, setStartingDebate] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchDebates = useCallback(() => {
    setLoading(true);
    setError("");
    debateApi
      .list({
        category: activeFilter !== "All" ? activeFilter : "",
        sort: activeSort,
        search,
      })
      .then((res) => {
        const rawDebates = (res.debates || []).filter(
          (d) => d.status === "waiting" || d.status === "live"
        );
        setDebates(rawDebates.map(toCardShape));
        setPageStats({
          debatersOnline: 0,
          liveCount: rawDebates.filter((d) => d.status === "live").length,
          totalWatching: 0,
        });
      })
      .catch((err) => setError(err.message || "Couldn't load live debates."))
      .finally(() => setLoading(false));
  }, [activeFilter, activeSort, search]);

  useEffect(() => {
    fetchDebates();
    const interval = setInterval(fetchDebates, 20000);
    return () => clearInterval(interval);
  }, [fetchDebates]);

  const requireAuth = (onGo) => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/livedebates" } });
      return;
    }
    onGo();
  };

  const handleWatch = (debateId) => navigate(`/debate/${debateId}`);

  const handleJoin = (debateId) => {
    requireAuth(async () => {
      try {
        setJoining(debateId);
        const res = await debateApi.join(debateId);
        const id = res?.debate?._id || res?.data?.debateId || debateId;
        // Go straight into the debate room
        navigate(`/debate/${id}`);
      } catch (err) {
        setError(err.message || "Couldn't join the debate.");
      } finally {
        setJoining(null);
      }
    });
  };

  const handleStartDebate = () => {
    requireAuth(() => setShowModal(true));
  };

  const handleModalSubmit = async ({ topic, side, category, duration, mode }) => {
    try {
      setStartingDebate(true);
      setError("");
      const res = await debateApi.create(mode, topic, side, { category, duration });
      if (!res?.debate?._id && !res?.data?.debateId) {
        throw new Error("Debate was created but no ID was returned.");
      }
      setShowModal(false);
      // Always go straight into the room so creator is in the socket room
      const id = res?.debate?._id || res?.data?.debateId;
      navigate(`/debate/${id}`);
    } catch (err) {
      setError(err.message || "Couldn't start a debate.");
    } finally {
      setStartingDebate(false);
    }
  };

  const handleWatchRandom = () => {
    if (debates.length === 0) return;
    const random = debates[Math.floor(Math.random() * debates.length)];
    navigate(`/debate/${random.id}`);
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <AIBackground fixed={true} />

      {/* Create Debate Modal */}
      {showModal && (
        <CreateDebateModal
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          loading={startingDebate}
        />
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-8">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-widest"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                <FaCircle className="text-[7px] animate-pulse" />
                LIVE NOW
              </div>
              <span className="text-gray-400 text-sm font-medium">{debates.length} active debates</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-2" style={{ textShadow: "0 0 40px rgba(124,58,237,0.3)" }}>
              Live Debates
            </h1>
            <p className="text-gray-400 text-base">Join or watch ongoing debates happening now</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setActiveFilter(f.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeFilter === f.label ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  style={activeFilter === f.label ? {
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    boxShadow: "0 0 14px rgba(124,58,237,0.35)",
                  } : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-[11px]">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl min-w-[180px]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <FaSearch className="text-gray-400 text-xs flex-shrink-0" />
                <input
                  className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-full"
                  placeholder="Search debates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold text-white outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {sortOptions.map((o) => (
                    <option key={o} value={o} style={{ background: "#0a0f1e" }}>{`Sort by: ${o}`}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[9px] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="grid grid-cols-3 gap-3 mb-6 rounded-2xl p-4"
            style={{ background: "rgba(8,12,30,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { icon: <FaUsers className="text-violet-400" />, value: pageStats.debatersOnline.toLocaleString(), label: "Debaters Online" },
              { icon: <MdLiveTv className="text-red-400" />,   value: pageStats.liveCount.toString(),            label: "Live Debates" },
              { icon: <FaEye className="text-blue-400" />,     value: pageStats.totalWatching.toLocaleString(),  label: "Total Watching" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-lg">{s.icon}</span>
                <span className={`text-white font-black text-xl ${loading ? "animate-pulse" : ""}`}>{s.value}</span>
                <span className="text-gray-500 text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-sm">Loading live debates…</p>
            </div>
          ) : debates.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FaSearch className="text-4xl mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">No debates found</p>
              <p className="text-sm">Try a different filter or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {debates.map((d) => (
                <DebateCard key={d.id} d={d} onWatch={handleWatch} onJoin={handleJoin} joining={joining} />
              ))}
            </div>
          )}

          {/* CTA bottom */}
          <div
            className="mt-8 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.12))",
              border: "1px solid rgba(124,58,237,0.25)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div>
              <h3 className="text-white font-extrabold text-lg mb-1">Ready to Debate?</h3>
              <p className="text-gray-400 text-sm">Create your own debate room and challenge the world.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStartDebate}
                disabled={startingDebate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
              >
                <FaBolt /> {startingDebate ? "Starting…" : "Start Debate"}
              </button>
              <button
                onClick={handleWatchRandom}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0" }}
              >
                <FaPlay className="text-xs" /> Watch Random
              </button>
            </div>
          </div>

        </main>

        <footer className="text-center py-4 text-gray-600 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          © 2026 DebateAI · All rights reserved
        </footer>
      </div>
    </div>
  );
};

export default LiveDebates;
