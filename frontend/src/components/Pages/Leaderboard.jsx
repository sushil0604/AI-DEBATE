import { useState, useEffect } from "react";
import { FaTrophy, FaFire, FaMedal, FaArrowUp, FaArrowDown } from "react-icons/fa";
import PageShell from "../Pages/PageShell";
import { leaderboardApi } from "../../services/api";

const periods = [
  { label: "This Week",  value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "All Time",   value: "all_time" },
];

const medalColor = { 1: "#fbbf24", 2: "#cbd5e1", 3: "#fb923c" };

const Leaderboard = () => {
  const [activePeriod, setActivePeriod] = useState("this_month");
  const [debaters, setDebaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    leaderboardApi
      .get(activePeriod)
      .then((res) => setDebaters(res.data.debaters || []))
      .catch((err) => setError(err.message || "Couldn't load the leaderboard."))
      .finally(() => setLoading(false));
  }, [activePeriod]);

  const top3 = debaters.slice(0, 3);
  const rest = debaters.slice(3);

  return (
    <PageShell
      eyebrow="RANKINGS"
      title="Leaderboard"
      subtitle="The sharpest minds, ranked by performance and consistency"
    >
      {/* Period tabs */}
      <div className="flex items-center gap-2 mb-8">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePeriod(p.value)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={
              activePeriod === p.value
                ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500 text-sm">Loading leaderboard…</div>
      ) : debaters.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaTrophy className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-lg font-bold">No rankings yet</p>
          <p className="text-sm">Check back once debates have been scored for this period.</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[top3[1], top3[0], top3[2]].map((d) => {
                const isFirst = d.rank === 1;
                return (
                  <div
                    key={d.rank}
                    className={`rounded-2xl p-5 flex flex-col items-center text-center transition-all ${isFirst ? "sm:-mt-4" : ""}`}
                    style={{
                      background: isFirst ? "linear-gradient(160deg,rgba(124,58,237,0.18),rgba(8,12,30,0.78))" : "rgba(8,12,30,0.78)",
                      backdropFilter: "blur(18px)",
                      border: isFirst ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      boxShadow: isFirst ? "0 8px 32px rgba(251,191,36,0.15)" : "0 4px 24px rgba(0,0,0,0.35)",
                    }}
                  >
                    <FaMedal className="text-2xl mb-2" style={{ color: medalColor[d.rank] }} />
                    {d.avatar ? (
                      <img src={d.avatar} alt={d.name} className="w-16 h-16 rounded-full ring-2 ring-violet-500/40 object-cover mb-3" />
                    ) : (
                      <div className="w-16 h-16 rounded-full ring-2 ring-violet-500/40 flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 mb-3 text-2xl">
                        🤖
                      </div>
                    )}
                    <p className="text-white font-bold text-sm mb-1">{d.name}</p>
                    <p className="text-2xl font-black text-white mb-1">{d.rating}</p>
                    <p className="text-gray-500 text-xs">{d.wins}W · {d.losses}L</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(8,12,30,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {rest.map((d, idx) => (
                <div
                  key={d.rank}
                  className={`flex items-center gap-4 px-5 py-4 ${idx !== rest.length - 1 ? "border-b border-white/5" : ""} hover:bg-white/5 transition-colors`}
                >
                  <span className="text-gray-500 font-bold text-sm w-6 text-center">{d.rank}</span>

                  {d.avatar ? (
                    <img src={d.avatar} alt={d.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-800 text-base">
                      🤖
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{d.name}</p>
                    <p className="text-gray-500 text-xs">{d.wins}W · {d.losses}L</p>
                  </div>

                  {d.streak > 0 && (
                    <span className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                      <FaFire className="text-[10px]" /> {d.streak}
                    </span>
                  )}

                  <span className={`flex items-center gap-1 text-xs font-bold ${d.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {d.trend === "up" ? <FaArrowUp className="text-[9px]" /> : <FaArrowDown className="text-[9px]" />}
                  </span>

                  <span className="text-white font-black text-base w-16 text-right">{d.rating}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
};

export default Leaderboard;