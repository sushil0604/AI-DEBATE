import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaGlobe, FaMicrochip, FaLeaf, FaLandmark, FaFlask,
  FaGraduationCap, FaBriefcase, FaUsers, FaSearch,
  FaUserFriends, FaRobot, FaBolt, FaTrophy, FaEye,
} from "react-icons/fa";
import { MdOutlineBalance } from "react-icons/md";
import AIBackground from "./AIBackground";

/* ─── Data ─── */
const topics = [
  { label: "All Topics",   icon: <FaGlobe /> },
  { label: "Technology",   icon: <FaMicrochip /> },
  { label: "Environment",  icon: <FaLeaf /> },
  { label: "Politics",     icon: <FaLandmark /> },
  { label: "Science",      icon: <FaFlask /> },
  { label: "Education",    icon: <FaGraduationCap /> },
  { label: "Business",     icon: <FaBriefcase /> },
  { label: "Society",      icon: <FaUsers /> },
];

const stats = [
  { label: "Logic",          value: 92 },
  { label: "Evidence",       value: 88 },
  { label: "Persuasiveness", value: 90 },
  { label: "Rebuttal",       value: 85 },
];

const barColor = (label) => ({
  Logic:          "bg-purple-500",
  Evidence:       "bg-blue-500",
  Persuasiveness: "bg-teal-400",
  Rebuttal:       "bg-indigo-400",
}[label] || "bg-purple-500");

/* ─── Homepage ─── */
const Homepage = () => {
  const [activeTopic, setActiveTopic] = useState("All Topics");
  const [search, setSearch] = useState("");

  return (
    /* z-10 so all content sits above the fixed AIBackground (z-0) */
    <div
      className="relative min-h-screen text-white overflow-hidden"
      style={{ fontFamily: "'Exo 2', sans-serif", zIndex: 10 }}
    >

      {/* ── AI Background (fixed, behind everything) ── */}
      <AIBackground fixed={true} />

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <section className="relative h-screen overflow-hidden">

        {/* Vignette — tightens focus on hero text */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse at 70% 50%, rgba(0,0,0,0) 0%, rgba(4,6,20,0.6) 100%)",
          }}
        />

        {/* World Debate Map label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-400" />
          <span className="text-[10px] tracking-[0.3em] text-violet-300/80 uppercase font-semibold">
            World Debate Map
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-400" />
        </div>

        {/* Hero text */}
        <div className="relative z-20 flex flex-col justify-center h-full pt-16 pb-8 px-8 md:px-16 max-w-lg">
          <h1
            className="text-5xl md:text-6xl font-black leading-tight mb-4"
            style={{ textShadow: "0 0 40px rgba(65,33,121,0.6)" }}
          >
            Debate
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-blue-300">
              Without Borders
            </span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base mb-7 max-w-sm leading-relaxed">
            Join active debates happening around the world and let AI evaluate your arguments.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-105 transition-transform"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
              }}
            >
              ⚡ Start Debate
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all">
              🌐 Explore Map
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all">
              ▷ Watch Live
            </button>
          </div>
        </div>
      </section>
      {/* ══ END HERO ══ */}


      {/* ══════════════════════════════
          DEBATE PLATFORM SECTION
          background is transparent so
          the fixed canvas shows through
      ══════════════════════════════ */}
      <div className="relative z-10 w-full">

        {/* ── Topic Nav ── */}
        <nav
          className="w-full px-6 py-3 flex items-center gap-2 flex-wrap"
          style={{
            background: "rgba(6,9,24,0.82)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {topics.map((t) => (
            <button
              key={t.label}
              onClick={() => setActiveTopic(t.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTopic === t.label
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              style={
                activeTopic === t.label
                  ? {
                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                      boxShadow: "0 0 18px rgba(124,58,237,0.4)",
                    }
                  : {}
              }
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}

          {/* Search */}
          <div className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 min-w-[160px]">
            <FaSearch className="text-gray-400 text-sm" />
            <input
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
              placeholder="Search Debate"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </nav>

        {/* ── Cards ── */}
        <div className="flex flex-col justify-center">
          <div className="flex text-center py-10 grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Choose Your Challenge */}
            <div
              className="lg:col-span-4 rounded-2xl md:w-350 p-8 ml-14"
          
            >
              <div className="mb-6">
                <h2 className="text-white text-2xl font-extrabold tracking-wide uppercase">
                  Choose Your Challenge
                </h2>
                <p className="text-gray-400 text-sm mt-1">Pick a mode and start debating now</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Human vs Human */}
                <div
                  className="rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <FaUserFriends className="text-blue-400 text-xl" />
                    Human vs Human
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Debate against real people from around the world.
                  </p>
                  <button
                    className="mt-auto w-full py-2 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                      boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
                    }}
                  >
                    Start Match
                  </button>
                </div>

                {/* Human vs AI */}
                <div
                  className="rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(145deg,rgba(124,58,237,0.18),rgba(79,70,229,0.1))",
                    border: "1px solid rgba(124,58,237,0.35)",
                  }}
                >
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <FaRobot className="text-purple-400 text-xl" />
                    Human vs AI
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Challenge our advanced AI judge in a debate.
                  </p>
                  <button
                    className="mt-auto w-full py-2 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                      boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                    }}
                  >
                    Challenge AI
                  </button>
                </div>

                {/* AI vs AI */}
                <div
                  className="rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(145deg,rgba(13,148,136,0.18),rgba(6,95,70,0.1))",
                    border: "1px solid rgba(20,184,166,0.3)",
                  }}
                >
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <FaBolt className="text-teal-400 text-xl" />
                    AI vs AI
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Watch AI models debate with each other.
                  </p>
                  <button
                    className="mt-auto w-full py-2 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg,#0d9488,#0f766e)",
                      boxShadow: "0 4px 16px rgba(13,148,136,0.35)",
                    }}
                  >
                    Watch AI Debate
                  </button>
                </div>
              </div>
            </div>

            {/* AI Judge Preview */}
            <div
              className="col-span-5 rounded-2xl p-6 flex flex-col gap-5 md:ml-80 md:mr-80"
              style={{
        
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              }}
            >
              <h3 className="text-white font-extrabold text-lg uppercase tracking-widest flex items-center gap-2">
                <MdOutlineBalance className="text-purple-400 text-xl" />
                AI Judge Preview
              </h3>

              <div className="flex gap-4 items-start">
                <div
                  className="rounded-xl overflow-hidden flex-shrink-0"
                  style={{
                    width: 200, height: 160,
                    boxShadow: "0 0 24px rgba(124,58,237,0.4)",
                    border: "1px solid rgba(124,58,237,0.3)",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=220&fit=crop&crop=face"
                    alt="AI Judge"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/100x110/1e1b4b/a78bfa?text=AI";
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {stats.map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs w-28">{s.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor(s.label)}`}
                          style={{ width: `${s.value}%`, transition: "width 0.7s ease" }}
                        />
                      </div>
                      <span className="text-white text-xs font-bold w-12 text-right">
                        {s.value}/100
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 text-xs w-28">Bias Detection</span>
                    <span className="text-green-400 text-xs font-bold">Low</span>
                    <span
                      className="ml-1 w-2.5 h-2.5 rounded-full bg-green-400"
                      style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  className="py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                  style={{
                    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}
                >
                  <FaTrophy className="text-yellow-300" />
                  Try AI Judge
                </button>
                <button
                  className="py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0" }}
                >
                  <FaEye className="text-teal-400" />
                  Sample Analysis
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* ══ END PLATFORM ══ */}

    </div>
  );
};

export default Homepage;
