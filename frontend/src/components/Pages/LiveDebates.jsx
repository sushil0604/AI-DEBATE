import { useState } from "react";
import {
  FaSearch, FaCircle, FaEye, FaUsers, FaClock,
  FaTrophy, FaFire, FaBolt, FaLeaf, FaLandmark,
  FaFlask, FaGraduationCap, FaBriefcase, FaGlobe,
  FaMicrochip, FaRobot, FaChevronDown, FaSignInAlt,
  FaUserPlus, FaPlay, FaUserFriends,
} from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";
import AIBackground from "../Home/AIBackground";

/* ─── Nav items ─── */
const navLinks = ["Home", "Live Debates", "Topics", "Leaderboard", "AI Coach"];

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

/* ─── Debate data ─── */
const debates = [
  {
    id: 1,
    title: "AI Ethics: Should AI have rights?",
    tag: "Technology",
    tagColor: "text-blue-400",
    tagBg: "bg-blue-500/10 border-blue-500/25",
    watching: 324,
    timeLeft: "45 min left",
    debaterA: {
      name: "Emma Watson",
      rating: 1840,
      avatar: "https://i.pravatar.cc/48?img=47",
      argument: "AI systems demonstrate self-awareness and deserve ethical consideration and legal protections.",
    },
    debaterB: {
      name: "AI Judge",
      rating: 2100,
      avatar: null, // robot
      argument: "Evaluating arguments based on logic, evidence, and persuasiveness in real time.",
    },
    isAI: true,
    hot: true,
  },
  {
    id: 2,
    title: "Climate Change: Act Now or Too Late?",
    tag: "Science",
    tagColor: "text-green-400",
    tagBg: "bg-green-500/10 border-green-500/25",
    watching: 278,
    timeLeft: "30 min left",
    debaterA: {
      name: "Michael Lee",
      rating: 1920,
      avatar: "https://i.pravatar.cc/48?img=12",
      argument: "Immediate, radical action on carbon emissions is our only path to survival.",
    },
    debaterB: {
      name: "Sarah Khan",
      rating: 1780,
      avatar: "https://i.pravatar.cc/48?img=32",
      argument: "Gradual, economically sustainable solutions prevent collapse while driving green innovation.",
    },
    isAI: false,
    hot: false,
  },
  {
    id: 3,
    title: "Social Media: Connection or Addiction?",
    tag: "Society",
    tagColor: "text-pink-400",
    tagBg: "bg-pink-500/10 border-pink-500/25",
    watching: 156,
    timeLeft: "20 min left",
    debaterA: {
      name: "David Brown",
      rating: 1650,
      avatar: "https://i.pravatar.cc/48?img=8",
      argument: "Social platforms have fundamentally eroded mental health and attention spans globally.",
    },
    debaterB: {
      name: "AI Judge",
      rating: 2100,
      avatar: null,
      argument: "Assessing the sociological and psychological evidence from both perspectives.",
    },
    isAI: true,
    hot: false,
  },
  {
    id: 4,
    title: "Future of Work: AI as a Partner or Threat?",
    tag: "Technology",
    tagColor: "text-blue-400",
    tagBg: "bg-blue-500/10 border-blue-500/25",
    watching: 189,
    timeLeft: "25 min left",
    debaterA: {
      name: "Olivia Smith",
      rating: 1710,
      avatar: "https://i.pravatar.cc/48?img=25",
      argument: "AI will eliminate more jobs than it creates, requiring urgent universal basic income policies.",
    },
    debaterB: {
      name: "James Wilson",
      rating: 1830,
      avatar: "https://i.pravatar.cc/48?img=15",
      argument: "Historical tech waves always created new categories of work; AI will be no different.",
    },
    isAI: false,
    hot: true,
  },
];

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
      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`; }}
    />
  );
};

/* ─── Debate Card ─── */
const DebateCard = ({ d }) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-violet-900/40 hover:shadow-2xl"
    style={{
      background: "rgba(8,12,30,0.78)",
      backdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
    }}
  >
    {/* Top row */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Live badge + tag */}
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
        </div>

        {/* Title */}
        <h3 className="text-white font-extrabold text-base leading-snug">{d.title}</h3>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <FaEye className="text-violet-400" />
          <span className="text-white font-bold">{d.watching}</span>
          <span>watching</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <FaClock className="text-blue-400" />
          <span>{d.timeLeft}</span>
        </div>
      </div>
    </div>

    {/* VS row */}
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      {/* Debater A */}
      <div className="flex items-center gap-3">
        <Avatar src={d.debaterA.avatar} name={d.debaterA.name} ring="ring-blue-500/50" />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{d.debaterA.name}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <FaTrophy className="text-yellow-400 text-[9px]" /> {d.debaterA.rating}
          </p>
        </div>
      </div>

      {/* VS */}
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

      {/* Debater B */}
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
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
        }}
      >
        <MdLiveTv className="text-base" />
        Watch Live
      </button>
      <button
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-white/10 active:scale-95"
        style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0" }}
      >
        <FaUserFriends className="text-blue-400" />
        Join Debate
      </button>
    </div>
  </div>
);

/* ─── Main Page ─── */
const LiveDebates = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Latest");
  const [search, setSearch] = useState("");

  const filtered = debates.filter((d) => {
    const matchFilter = activeFilter === "All" || d.tag === activeFilter || activeFilter === "Trending";
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.debaterA.name.toLowerCase().includes(search.toLowerCase()) ||
      d.debaterB.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "'Exo 2', sans-serif" }}>

      {/* ── AI Background (fixed, behind everything) ── */}
      <AIBackground fixed={true} />

      {/* ── All content at z-10+ ── */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* ══ PAGE CONTENT ══ */}
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
            <h1
              className="text-4xl md:text-5xl font-black leading-tight mb-2"
              style={{ textShadow: "0 0 40px rgba(124,58,237,0.3)" }}
            >
              Live Debates
            </h1>
            <p className="text-gray-400 text-base">Join or watch ongoing debates happening now</p>
          </div>

          {/* Filters + Search row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setActiveFilter(f.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeFilter === f.label
                      ? "text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
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

            {/* Search + Sort */}
            <div className="flex items-center gap-2">
              {/* Search */}
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

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold text-white outline-none cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
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
            style={{
              background: "rgba(8,12,30,0.7)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {[
              { icon: <FaUsers className="text-violet-400" />, value: "1,247", label: "Debaters Online" },
              { icon: <MdLiveTv className="text-red-400" />,   value: debates.length.toString(), label: "Live Debates" },
              { icon: <FaEye className="text-blue-400" />,     value: debates.reduce((a, d) => a + d.watching, 0).toLocaleString(), label: "Total Watching" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-lg">{s.icon}</span>
                <span className="text-white font-black text-xl">{s.value}</span>
                <span className="text-gray-500 text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Debate cards grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FaSearch className="text-4xl mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">No debates found</p>
              <p className="text-sm">Try a different filter or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filtered.map((d) => (
                <DebateCard key={d.id} d={d} />
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}
              >
                <FaBolt /> Start Debate
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0" }}
              >
                <FaPlay className="text-xs" /> Watch Random
              </button>
            </div>
          </div>

        </main>

        {/* ══ FOOTER ══ */}
        <footer
          className="text-center py-4 text-gray-600 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          © 2026 DebateAI · All rights reserved
        </footer>
      </div>
    </div>
  );
};

export default LiveDebates;
