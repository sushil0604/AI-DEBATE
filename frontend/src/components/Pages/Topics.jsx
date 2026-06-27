import { useState } from "react";
import {
  FaSearch, FaMicrochip, FaLandmark, FaFlask, FaGraduationCap,
  FaHeartbeat, FaBalanceScale, FaGlobeAmericas, FaFilm, FaCoins,
  FaChevronRight,
} from "react-icons/fa";
import PageShell from "../Pages/PageShell";

const categories = [
  {
    name: "Technology",
    icon: <FaMicrochip />,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    debateCount: 142,
    topics: ["AI Ethics & Rights", "Social Media Regulation", "Crypto's Future", "Privacy vs Innovation"],
  },
  {
    name: "Politics",
    icon: <FaLandmark />,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    debateCount: 98,
    topics: ["Electoral Reform", "Free Speech Limits", "Immigration Policy", "Term Limits"],
  },
  {
    name: "Science",
    icon: <FaFlask />,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    debateCount: 76,
    topics: ["Climate Action Pace", "Gene Editing Ethics", "Space Exploration Funding", "Nuclear Energy"],
  },
  {
    name: "Education",
    icon: <FaGraduationCap />,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
    debateCount: 54,
    topics: ["Standardized Testing", "College Debt Forgiveness", "AI in Classrooms", "Homeschooling"],
  },
  {
    name: "Health",
    icon: <FaHeartbeat />,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    debateCount: 61,
    topics: ["Universal Healthcare", "Mental Health Funding", "Vaccine Mandates", "Diet Science"],
  },
  {
    name: "Ethics & Law",
    icon: <FaBalanceScale />,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.25)",
    debateCount: 88,
    topics: ["Death Penalty", "Animal Rights", "Surveillance Laws", "Restorative Justice"],
  },
  {
    name: "Society",
    icon: <FaGlobeAmericas />,
    color: "#ec4899",
    bg: "rgba(236,72,153,0.1)",
    border: "rgba(236,72,153,0.25)",
    debateCount: 103,
    topics: ["Work-Life Balance", "Urbanization", "Gender Roles Today", "Aging Population"],
  },
  {
    name: "Culture",
    icon: <FaFilm />,
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.25)",
    debateCount: 47,
    topics: ["AI-Generated Art", "Streaming vs Theaters", "Cancel Culture", "Nostalgia Marketing"],
  },
  {
    name: "Economics",
    icon: <FaCoins />,
    color: "#eab308",
    bg: "rgba(234,179,8,0.1)",
    border: "rgba(234,179,8,0.25)",
    debateCount: 69,
    topics: ["Universal Basic Income", "Wealth Tax", "Remote Work Economics", "Minimum Wage"],
  },
];

const Topics = () => {
  const [search, setSearch] = useState("");

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageShell
      eyebrow="EXPLORE"
      title="Debate Topics"
      subtitle="Browse every category and dive into the conversations that matter to you"
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl max-w-md mb-8"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
        <input
          className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
          placeholder="Search topics or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaSearch className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-lg font-bold">No topics found</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer group"
              style={{
                background: "rgba(8,12,30,0.78)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                >
                  {c.icon}
                </div>
                <span className="text-gray-500 text-xs font-semibold">{c.debateCount} debates</span>
              </div>

              <h3 className="text-white font-extrabold text-lg mb-3">{c.name}</h3>

              <ul className="flex flex-col gap-1.5">
                {c.topics.slice(0, 3).map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-2 text-gray-400 text-xs group-hover:text-gray-300 transition-colors"
                  >
                    <FaChevronRight className="text-[8px] flex-shrink-0" style={{ color: c.color }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default Topics;
