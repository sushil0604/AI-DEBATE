import { useState } from "react";
import {
  FaTimes, FaBolt, FaGlobe, FaMicrochip, FaLandmark,
  FaFlask, FaGraduationCap, FaClock, FaRobot, FaUsers,
} from "react-icons/fa";

const CATEGORIES = [
  { label: "General",    icon: <FaGlobe /> },
  { label: "Technology", icon: <FaMicrochip /> },
  { label: "Politics",   icon: <FaLandmark /> },
  { label: "Science",    icon: <FaFlask /> },
  { label: "Education",  icon: <FaGraduationCap /> },
];

const DURATIONS = [
  { value: 5,  label: "5 min",  desc: "Quick fire" },
  { value: 10, label: "10 min", desc: "Standard" },
  { value: 15, label: "15 min", desc: "In-depth" },
];

const MODES = [
  { value: "human_vs_human", label: "Human vs Human", icon: <FaUsers />,  desc: "Wait for another player to join" },
  { value: "human_vs_ai",    label: "Human vs AI",    icon: <FaRobot />, desc: "Debate against AI instantly" },
];

const CreateDebateModal = ({ onClose, onSubmit, loading }) => {
  const [topic,    setTopic]    = useState("");
  const [side,     setSide]     = useState("for");
  const [category, setCategory] = useState("General");
  const [duration, setDuration] = useState(10);
  const [mode,     setMode]     = useState("human_vs_human");
  const [error,    setError]    = useState("");

  const handleSubmit = () => {
    if (!topic.trim()) {
      setError("Please enter a debate topic.");
      return;
    }
    setError("");
    onSubmit({ topic: topic.trim(), side, category, duration, mode });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "linear-gradient(145deg,#0d1128,#0a0a1a)",
          border: "1px solid rgba(124,58,237,0.35)",
          boxShadow: "0 0 60px rgba(124,58,237,0.2)",
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-extrabold text-xl">Start a Debate</h2>
            <p className="text-gray-500 text-xs mt-0.5">Set up your debate room</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Topic */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Debate Topic *
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. AI will replace most jobs by 2035"
            maxLength={120}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <p className="text-gray-600 text-xs mt-1 text-right">{topic.length}/120</p>
        </div>

        {/* Mode */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className="flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: mode === m.value ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                  border: mode === m.value ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className={`flex items-center gap-2 text-sm font-bold ${mode === m.value ? "text-violet-300" : "text-gray-300"}`}>
                  <span className="text-xs">{m.icon}</span>
                  {m.label}
                </div>
                <p className="text-gray-500 text-[11px]">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Side */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Your Side
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["for", "against"].map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className="py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
                style={{
                  background:
                    side === s
                      ? s === "for"
                        ? "rgba(37,99,235,0.25)"
                        : "rgba(236,72,153,0.25)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    side === s
                      ? s === "for"
                        ? "1px solid rgba(37,99,235,0.6)"
                        : "1px solid rgba(236,72,153,0.6)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color:
                    side === s
                      ? s === "for" ? "#93c5fd" : "#f9a8d4"
                      : "#9ca3af",
                }}
              >
                {s === "for" ? "👍 For" : "👎 Against"}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Category
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                onClick={() => setCategory(c.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: category === c.label ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                  border: category === c.label ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  color: category === c.label ? "#c4b5fd" : "#9ca3af",
                }}
              >
                <span className="text-[10px]">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            <FaClock className="inline mr-1.5 text-blue-400" />
            Debate Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
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
                <span className={`text-base font-black ${duration === d.value ? "text-violet-300" : "text-gray-300"}`}>
                  {d.label}
                </span>
                <span className="text-[10px] text-gray-500">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !topic.trim()}
          className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
          }}
        >
          <FaBolt />
          {loading ? "Creating room…" : `Start ${duration}-min Debate`}
        </button>
      </div>
    </div>
  );
};

export default CreateDebateModal;
