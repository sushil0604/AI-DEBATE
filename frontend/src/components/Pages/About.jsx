import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRobot, FaUsers, FaGlobeAmericas, FaBalanceScale, FaLightbulb } from "react-icons/fa";
import PageShell from "../Pages/PageShell";
import { statsApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext"; // adjust relative path per file

const DEFAULT_STATS = [
  { value: "48,000+", label: "Debates Hosted", key: "debatesHosted" },
  { value: "120+", label: "Countries", key: "countries" },
  { value: "9,400", label: "Active Debaters", key: "activeDebaters" },
  { value: "99.2%", label: "Fair-Judging Score", key: "fairJudgingScore" },
];

const values = [
  {
    icon: <FaBalanceScale />,
    title: "Fair, Every Time",
    desc: "Our AI Judge evaluates arguments on logic and evidence, not charisma or follower count.",
    color: "#06b6d4",
  },
  {
    icon: <FaGlobeAmericas />,
    title: "Open to Everyone",
    desc: "No gatekeeping. Anyone with an internet connection can debate, learn, and improve.",
    color: "#22c55e",
  },
  {
    icon: <FaLightbulb />,
    title: "Built for Growth",
    desc: "Every debate comes with feedback designed to make your next argument sharper.",
    color: "#f59e0b",
  },
];

const About = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(DEFAULT_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    statsApi
      .platform()
      .then((res) => {
        const d = res.data;
        setStats([
          { value: d.debatesHosted,   label: "Debates Hosted",     key: "debatesHosted" },
          { value: d.countries,       label: "Countries",          key: "countries" },
          { value: d.activeDebaters,  label: "Active Debaters",    key: "activeDebaters" },
          { value: d.fairJudgingScore,label: "Fair-Judging Score", key: "fairJudgingScore" },
        ]);
      })
      .catch(() => {
        // fall back silently to DEFAULT_STATS if endpoint isn't ready yet
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const handleJoinArena = () => {
    if (authLoading) return;
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/signup");
    }
  };

  return (
    <PageShell
      eyebrow="OUR MISSION"
      title="Changing How the World Argues"
      subtitle="DebateAI exists to make rigorous, good-faith argument accessible to anyone, anywhere"
    >
      {/* Story block */}
      <div
        className="rounded-2xl p-6 md:p-8 mb-8"
        style={{
          background: "rgba(8,12,30,0.78)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            <FaRobot className="text-white text-lg" />
          </div>
          <h2 className="text-white font-extrabold text-xl">Why We Built This</h2>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          Most online discourse rewards volume, not reasoning. We built DebateAI as a structured
          space where the strength of an argument, not the size of an audience, decides who wins.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Every debate is timed, scored, and judged by a consistent standard, whether your opponent
          is a person across the world or our AI Judge. The goal isn't to win arguments — it's to
          get better at making them.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 rounded-2xl p-5"
        style={{ background: "rgba(8,12,30,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {stats.map((s) => (
          <div key={s.key} className="flex flex-col items-center text-center">
            <span className={`text-white font-black text-2xl mb-1 ${statsLoading ? "animate-pulse" : ""}`}>
              {s.value}
            </span>
            <span className="text-gray-500 text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Values */}
      <h2 className="text-white font-extrabold text-xl mb-4">What We Stand For</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl p-5"
            style={{
              background: "rgba(8,12,30,0.78)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-base"
              style={{ background: `${v.color}1a`, border: `1px solid ${v.color}40`, color: v.color }}
            >
              {v.icon}
            </div>
            <h3 className="text-white font-bold text-base mb-1.5">{v.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.12))",
          border: "1px solid rgba(124,58,237,0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <FaUsers className="text-violet-300 text-2xl flex-shrink-0" />
          <div>
            <h3 className="text-white font-extrabold text-lg mb-0.5">Join the Arena</h3>
            <p className="text-gray-400 text-sm">Your first debate is free. No card required.</p>
          </div>
        </div>
        <button
          onClick={handleJoinArena}
          className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
        >
          {isAuthenticated ? "Go to Debates" : "Create Free Account"}
        </button>
      </div>
    </PageShell>
  );
};

export default About;