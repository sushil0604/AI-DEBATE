import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGlobe, FaMicrochip, FaLeaf, FaLandmark, FaFlask,
  FaGraduationCap, FaBriefcase, FaUsers, FaSearch,
  FaUserFriends, FaRobot, FaBolt, FaTrophy, FaEye, FaTimes, FaClock,
} from "react-icons/fa";
import { MdOutlineBalance } from "react-icons/md";
import AIBackground from "./AIBackground";
import { useAuth } from "../../hooks/useAuth";
import { debateApi, aiCoachApi } from "../../services/api";

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

const DEFAULT_STATS = [
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

const DURATIONS = [
  { value: 5,  label: "5 min",  desc: "Quick fire" },
  { value: 10, label: "10 min", desc: "Standard" },
  { value: 15, label: "15 min", desc: "In-depth" },
];

/* ─── Start Debate Modal ─── */
const StartDebateModal = ({ onClose, onSubmit, submitting, error }) => {
  const [topic,    setTopic]    = useState("");
  const [side,     setSide]     = useState("for");
  const [duration, setDuration] = useState(10);

  const handleConfirm = () => {
    if (!topic.trim()) return;
    onSubmit(topic.trim(), side, duration);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "rgba(10,14,30,0.96)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-extrabold text-lg">Set Up Your Debate</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Debate topic</label>
        <input
          autoFocus
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Should AI have legal rights?"
          className="w-full mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
        />

        <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Your side</label>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {["for", "against"].map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                side === s ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              style={
                side === s
                  ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {s === "for" ? "👍 For" : "👎 Against"}
            </button>
          ))}
        </div>

        <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
          <FaClock className="text-blue-400" /> Debate Duration
        </label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className="flex flex-col items-center gap-0.5 py-3 rounded-xl transition-all"
              style={{
                background: duration === d.value ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                border: duration === d.value ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className={`text-sm font-black ${duration === d.value ? "text-violet-300" : "text-gray-300"}`}>
                {d.label}
              </span>
              <span className="text-[10px] text-gray-500">{d.desc}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!topic.trim() || submitting}
          className="w-full py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
        >
          {submitting ? "Starting…" : `Start ${duration}-min Debate`}
        </button>
      </div>
    </div>
  );
};

/* ─── Homepage ─── */
const Homepage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTopic, setActiveTopic] = useState("All Topics");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [biasLevel, setBiasLevel] = useState("Low");
  const [statsLoading, setStatsLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    aiCoachApi
      .judgeStats()
      .then((res) => {
        const d = res.data;
        setStats([
          { label: "Logic",          value: d.logic },
          { label: "Evidence",       value: d.evidence },
          { label: "Persuasiveness", value: d.persuasiveness },
          { label: "Rebuttal",       value: d.rebuttal },
        ]);
        setBiasLevel(d.biasLevel || "Low");
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const openStartDebate = (mode) => {
    setError("");
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/", intent: { mode } } });
      return;
    }
    setModalError("");
    setModalMode(mode);
  };

  const handleConfirmStart = async (topic, side, duration) => {
    try {
      setSubmitting(true);
      setModalError("");
      const res = await debateApi.create(modalMode, topic, side, { duration });

      const debateId =
        res?.data?.debateId ||
        res?.data?._id ||
        res?.data?.id ||
        res?.debate?._id ||
        res?.debate?.id ||
        res?._id ||
        res?.id;

      if (!debateId) {
        throw new Error("Debate was created but no ID was returned — check console.");
      }

      setModalMode(null);

      // Send creator directly into the room so they receive debate_started event
      navigate(`/debate/${debateId}`);
    } catch (err) {
      console.error("Start debate error:", err);
      setModalError(err.message || "Couldn't start the debate. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAIJudge = () => openStartDebate("human_vs_ai");

  const handleSampleAnalysis = async () => {
    try {
      const res = await aiCoachApi.sampleAnalysis();
      navigate("/ai-coach/sample", { state: { analysis: res.data } });
    } catch (err) {
      setError(err.message || "Couldn't load sample analysis.");
    }
  };

  return (
    <div
      className="relative min-h-screen text-white overflow-hidden"
      style={{ fontFamily: "'Exo 2', sans-serif", zIndex: 10 }}
    >
      <AIBackground fixed={true} />

      {modalMode && (
        <StartDebateModal
          onClose={() => !submitting && setModalMode(null)}
          onSubmit={handleConfirmStart}
          submitting={submitting}
          error={modalError}
        />
      )}

      <section className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 z-10"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(0,0,0,0) 0%, rgba(4,6,20,0.6) 100%)" }}
        />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-400" />
          <span className="text-[10px] tracking-[0.3em] text-violet-300/80 uppercase font-semibold">World Debate Map</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-400" />
        </div>

        <div className="relative z-20 flex flex-col justify-center h-full pt-16 pb-8 px-8 md:px-16 max-w-lg">
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4" style={{ textShadow: "0 0 40px rgba(65,33,121,0.6)" }}>
            Debate<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-blue-300">Without Borders</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base mb-7 max-w-sm leading-relaxed">
            Join active debates happening around the world and let AI evaluate your arguments.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openStartDebate("human_vs_ai")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.45)" }}
            >⚡ Start Debate</button>
            <button
              onClick={() => navigate("/topics")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
            >🌐 Explore Map</button>
            <button
              onClick={() => navigate("/livedebates")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
            >▷ Watch Live</button>
          </div>
        </div>
      </section>

      <div className="relative z-10 w-full">
        <nav className="w-full px-6 py-3 flex items-center gap-2 flex-wrap" style={{ background: "rgba(6,9,24,0.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {topics.map((t) => (
            <button
              key={t.label}
              onClick={() => setActiveTopic(t.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeTopic === t.label ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
              style={activeTopic === t.label ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 18px rgba(124,58,237,0.4)" } : {}}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 min-w-[160px]">
            <FaSearch className="text-gray-400 text-sm" />
            <input className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" placeholder="Search Debate" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </nav>

        <div className="flex flex-col justify-center">
          <div className="flex text-center py-10 grid grid-cols-1 lg:grid-cols-5 gap-6">

            <div className="lg:col-span-4 rounded-2xl md:w-350 p-8 ml-14">
              <div className="mb-6">
                <h2 className="text-white text-2xl font-extrabold tracking-wide uppercase">Choose Your Challenge</h2>
                <p className="text-gray-400 text-sm mt-1">Pick a mode and start debating now</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center gap-2 text-white font-bold text-base"><FaUserFriends className="text-blue-400 text-xl" />Human vs Human</div>
                  <p className="text-gray-400 text-xs leading-relaxed">Debate against real people from around the world.</p>
                  <button onClick={() => openStartDebate("human_vs_human")} className="mt-auto w-full py-2 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all duration-200" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>Start Match</button>
                </div>
                <div className="rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200" style={{ background: "linear-gradient(145deg,rgba(124,58,237,0.18),rgba(79,70,229,0.1))", border: "1px solid rgba(124,58,237,0.35)" }}>
                  <div className="flex items-center gap-2 text-white font-bold text-base"><FaRobot className="text-purple-400 text-xl" />Human vs AI</div>
                  <p className="text-gray-400 text-xs leading-relaxed">Challenge our advanced AI judge in a debate.</p>
                  <button onClick={() => openStartDebate("human_vs_ai")} className="mt-auto w-full py-2 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all duration-200" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>Challenge AI</button>
                </div>
                <div className="rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200" style={{ background: "linear-gradient(145deg,rgba(13,148,136,0.18),rgba(6,95,70,0.1))", border: "1px solid rgba(20,184,166,0.3)" }}>
                  <div className="flex items-center gap-2 text-white font-bold text-base"><FaBolt className="text-teal-400 text-xl" />AI vs AI</div>
                  <p className="text-gray-400 text-xs leading-relaxed">Watch AI models debate with each other.</p>
                  <button onClick={() => openStartDebate("ai_vs_ai")} className="mt-auto w-full py-2 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all duration-200" style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)", boxShadow: "0 4px 16px rgba(13,148,136,0.35)" }}>Watch AI Debate</button>
                </div>
              </div>
            </div>

            <div className="col-span-5 flex justify-center px-4">
              <div
                className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-4"
                style={{
                  background: "rgba(10,14,30,0.7)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.12)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ boxShadow: "0 0 18px rgba(124,58,237,0.4)", border: "1px solid rgba(124,58,237,0.35)" }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop&crop=face"
                      alt="AI Judge"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/1e1b4b/a78bfa?text=AI"; }}
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-widest flex items-center gap-1.5">
                      <MdOutlineBalance className="text-purple-400" />
                      AI Judge Preview
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-gray-500 text-[11px]">Bias:</span>
                      <span className="text-green-400 text-[11px] font-bold">{biasLevel}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 4px rgba(74,222,128,0.8)" }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {stats.map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <span className="text-gray-400 text-[11px] w-24 flex-shrink-0">{s.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor(s.label)} ${statsLoading ? "animate-pulse" : ""}`}
                          style={{ width: `${s.value}%`, transition: "width 0.7s ease" }}
                        />
                      </div>
                      <span className="text-white text-[11px] font-bold w-9 text-right flex-shrink-0">{s.value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleTryAIJudge}
                    className="py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
                    style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
                  >
                    <FaTrophy className="text-yellow-300 text-[11px]" />Try AI Judge
                  </button>
                  <button
                    onClick={handleSampleAnalysis}
                    className="py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0" }}
                  >
                    <FaEye className="text-teal-400 text-[11px]" />Sample Analysis
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
