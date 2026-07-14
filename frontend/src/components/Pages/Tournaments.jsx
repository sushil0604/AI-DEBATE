import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaUsers, FaCalendarAlt, FaCoins, FaFire, FaTimes } from "react-icons/fa";
import PageShell from "./PageShell";
import { tournamentApi } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const tabs = [
  { label: "Upcoming", value: "upcoming" },
  { label: "In Progress", value: "in_progress" },
  { label: "Past", value: "past" },
];

const statusColor = {
  in_progress: { label: "In Progress", color: "#f87171", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
  upcoming:    { label: "Upcoming",    color: "#60a5fa", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
  past:        { label: "Past",        color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" },
};

const Tournaments = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab]   = useState("upcoming");
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [actionId, setActionId]     = useState(null); // id of tournament being acted on

  const fetchTournaments = async (tab) => {
    setLoading(true);
    setError("");
    try {
      const res = await tournamentApi.list(tab);
      setTournaments(res.tournaments || []);
    } catch (err) {
      setError(err.message || "Couldn't load tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(activeTab); }, [activeTab]);

  const requireAuth = (cb) => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/tournaments" } });
      return;
    }
    cb();
  };

  const handleRegister = (t) => {
    requireAuth(async () => {
      try {
        setActionId(t.id);
        setError("");
        await tournamentApi.join(t.id);
        await fetchTournaments(activeTab);
      } catch (err) {
        setError(err.message || "Couldn't register.");
      } finally {
        setActionId(null);
      }
    });
  };

  const handleUnregister = (t) => {
    requireAuth(async () => {
      if (!window.confirm(`Cancel your registration for "${t.name}"?`)) return;
      try {
        setActionId(t.id);
        setError("");
        await tournamentApi.leave(t.id);
        await fetchTournaments(activeTab);
      } catch (err) {
        setError(err.message || "Couldn't unregister.");
      } finally {
        setActionId(null);
      }
    });
  };

  const handleNavigate = (t) => {
    if (t.status === "past") navigate(`/tournaments/${t.id}/results`);
    else if (t.status === "in_progress") navigate(`/tournaments/${t.id}/bracket`);
  };

  return (
    <PageShell eyebrow="COMPETE" title="Tournaments" subtitle="Climb the bracket, win the crowd, take the prize">

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={activeTab === t.value
              ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500 text-sm">Loading tournaments…</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaTrophy className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-lg font-bold">No tournaments here yet</p>
          <p className="text-sm">Check back soon or browse another tab</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tournaments.map((t) => {
            const sc = statusColor[t.status] || statusColor.upcoming;
            const isFull = t.maxPlayers ? t.players >= t.maxPlayers : false;
            const isActing = actionId === t.id;

            return (
              <div
                key={t.id}
                className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                style={{
                  background: t.isRegistered ? "rgba(83,74,183,0.1)" : "rgba(8,12,30,0.78)",
                  backdropFilter: "blur(18px)",
                  border: t.isRegistered ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                      {sc.label}
                    </span>
                    {t.isRegistered && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300">
                        ✓ Registered
                      </span>
                    )}
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
                      <FaUsers className="text-violet-400 text-xs" /> {t.players}{t.maxPlayers ? `/${t.maxPlayers}` : ""}
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

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {t.status === "upcoming" && t.isRegistered ? (
                    /* Cancel registration */
                    <button
                      onClick={() => handleUnregister(t)}
                      disabled={isActing}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                    >
                      <FaTimes className="text-xs" />
                      {isActing ? "Cancelling…" : "Cancel"}
                    </button>
                  ) : t.status === "upcoming" ? (
                    /* Register */
                    <button
                      onClick={() => handleRegister(t)}
                      disabled={isActing || isFull}
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
                    >
                      {isActing ? "Registering…" : isFull ? "Full" : "Register"}
                    </button>
                  ) : (
                    /* View results / bracket */
                    <button
                      onClick={() => handleNavigate(t)}
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
                    >
                      {t.status === "past" ? "View Results" : "Watch Bracket"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default Tournaments;
