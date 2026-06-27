import { useState } from "react";
import { FaTrophy, FaUsers, FaCalendarAlt, FaCoins, FaFire } from "react-icons/fa";
import PageShell from "./PageShell";

const tabs = ["Upcoming", "In Progress", "Past"];

const tournaments = [
  {
    id: 1, status: "In Progress", name: "Winter Clash Championship", category: "Technology",
    players: 64, prize: "$2,000", date: "Jun 18 – Jun 28", round: "Quarterfinals", hot: true,
  },
  {
    id: 2, status: "Upcoming", name: "Climate Debate Cup", category: "Science",
    players: 32, prize: "$800", date: "Jul 3 – Jul 10", round: "Registration Open", hot: false,
  },
  {
    id: 3, status: "Upcoming", name: "AI Ethics Invitational", category: "Technology",
    players: 16, prize: "$1,200", date: "Jul 15 – Jul 18", round: "Registration Open", hot: true,
  },
  {
    id: 4, status: "Past", name: "Spring Rhetoric Open", category: "Politics",
    players: 48, prize: "$1,500", date: "Apr 2 – Apr 12", round: "Completed", hot: false,
  },
  {
    id: 5, status: "Past", name: "Education Reform Summit", category: "Education",
    players: 24, prize: "$600", date: "Mar 1 – Mar 5", round: "Completed", hot: false,
  },
];

const statusColor = {
  "In Progress": { color: "#f87171", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
  "Upcoming": { color: "#60a5fa", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
  "Past": { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" },
};

const Tournaments = () => {
  const [activeTab, setActiveTab] = useState("Upcoming");

  const filtered = tournaments.filter((t) => t.status === activeTab);

  return (
    <PageShell
      eyebrow="COMPETE"
      title="Tournaments"
      subtitle="Climb the bracket, win the crowd, take the prize"
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={
              activeTab === t
                ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaTrophy className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-lg font-bold">No tournaments here yet</p>
          <p className="text-sm">Check back soon or browse another tab</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((t) => {
            const sc = statusColor[t.status];
            return (
              <div
                key={t.id}
                className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                style={{
                  background: "rgba(8,12,30,0.78)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
                >
                  <FaTrophy className="text-white text-lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                    >
                      {t.status}
                    </span>
                    {t.hot && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 border border-orange-500/30 text-orange-400">
                        <FaFire className="text-[8px]" /> HOT
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">{t.category}</span>
                  </div>
                  <h3 className="text-white font-extrabold text-base mb-1">{t.name}</h3>
                  <p className="text-gray-400 text-xs">{t.round}</p>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-white font-bold text-sm flex items-center gap-1.5 justify-center">
                      <FaUsers className="text-violet-400 text-xs" /> {t.players}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Players</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm flex items-center gap-1.5 justify-center">
                      <FaCoins className="text-yellow-400 text-xs" /> {t.prize}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Prize</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-white font-bold text-sm flex items-center gap-1.5 justify-center">
                      <FaCalendarAlt className="text-blue-400 text-xs" />
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{t.date}</p>
                  </div>
                </div>

                <button
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex-shrink-0 hover:brightness-110 transition-all"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
                >
                  {t.status === "Past" ? "View Results" : t.status === "In Progress" ? "Watch Bracket" : "Register"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default Tournaments;
