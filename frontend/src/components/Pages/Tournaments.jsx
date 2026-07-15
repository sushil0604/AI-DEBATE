import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy, FaUsers, FaCalendarAlt, FaCoins, FaFire,
  FaTimes, FaUser, FaTag, FaCheckCircle, FaPlus,
} from "react-icons/fa";
import PageShell from "./PageShell";
import { tournamentApi } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import CreateTournamentModal from "./CreateTournamentModal";

const tabs = [
  { label: "Upcoming",    value: "upcoming" },
  { label: "In Progress", value: "in_progress" },
  { label: "Past",        value: "past" },
];

const statusColor = {
  in_progress: { label: "In Progress", color: "#f87171", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.3)" },
  upcoming:    { label: "Upcoming",    color: "#60a5fa", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
  past:        { label: "Past",        color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" },
};

const TOPIC_OPTIONS = [
  "Technology & AI", "Politics & Governance", "Science & Environment",
  "Society & Culture", "Ethics & Philosophy", "Economics & Business",
];

/* ─── Registration Modal ─── */
const RegisterModal = ({ tournament, onClose, onConfirm, submitting }) => {
  const [name,  setName]  = useState("");
  const [topic, setTopic] = useState(tournament.category || "");
  const [agree, setAgree] = useState(false);
  const canSubmit = name.trim() && topic && agree && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "rgba(10,14,30,0.98)", border: "1px solid rgba(124,58,237,0.35)", boxShadow: "0 0 60px rgba(124,58,237,0.2)", fontFamily: "'Exo 2', sans-serif" }}>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-extrabold text-lg">Register for Tournament</h2>
            <p className="text-gray-500 text-xs mt-0.5">{tournament.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Players", value: `${tournament.players}/${tournament.maxPlayers}` },
            { label: "Prize",   value: tournament.prize },
            { label: "Date",    value: tournament.date },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <FaUser className="text-violet-400 text-[10px]" /> Your display name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DebateMaster99"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <FaTag className="text-violet-400 text-[10px]" /> Preferred topic
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TOPIC_OPTIONS.map((t) => (
              <button key={t} onClick={() => setTopic(t)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                style={{
                  background: topic === t ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                  border: topic === t ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  color: topic === t ? "#c4b5fd" : "#9ca3af",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          onClick={() => setAgree(!agree)}>
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{ background: agree ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent", border: agree ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
            {agree && <FaCheckCircle className="text-white text-xs" />}
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            I agree to participate in all scheduled rounds and follow the tournament rules. Missing a round may result in disqualification.
          </p>
        </div>

        <button
          onClick={() => onConfirm({ name: name.trim(), topic })}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
          {submitting ? "Registering…" : "Confirm Registration ↗"}
        </button>
      </div>
    </div>
  );
};

/* ─── Main page ─── */
const Tournaments = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab,     setActiveTab]     = useState("upcoming");
  const [tournaments,   setTournaments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [actionId,      setActionId]      = useState(null);
  const [modalFor,      setModalFor]      = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [showCreate,    setShowCreate]    = useState(false);
  const [creating,      setCreating]      = useState(false);
  // Load registered IDs from localStorage on mount
  const [registeredIds, setRegisteredIds] = useState(() => {
    try {
      const saved = localStorage.getItem("tournament_registrations");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Persist to localStorage whenever registeredIds changes
  useEffect(() => {
    localStorage.setItem("tournament_registrations", JSON.stringify([...registeredIds]));
  }, [registeredIds]);

  const fetchTournaments = async (tab) => {
    setLoading(true);
    setError("");
    try {
      const res = await tournamentApi.list(tab);
      const list = res.tournaments || [];
      setTournaments(list);
      const fromServer = list.filter((t) => t.isRegistered).map((t) => t.id);
      if (fromServer.length > 0) setRegisteredIds((p) => new Set([...p, ...fromServer]));
    } catch (err) {
      setError(err.message || "Couldn't load tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(activeTab); }, [activeTab]);

  const requireAuth = (cb) => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate("/login", { state: { from: "/tournaments" } }); return; }
    cb();
  };

  const handleConfirmRegister = async ({ name, topic }) => {
    if (!modalFor) return;
    try {
      setSubmitting(true);
      setError("");
      await tournamentApi.join(modalFor.id);
      setRegisteredIds((p) => new Set([...p, modalFor.id]));
      setModalFor(null);
      await fetchTournaments(activeTab);
    } catch (err) {
      setError(err.message || "Couldn't register.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnregister = (t) => {
    requireAuth(async () => {
      if (!window.confirm(`Cancel your registration for "${t.name}"?`)) return;
      try {
        setActionId(t.id);
        await tournamentApi.leave(t.id);
        setRegisteredIds((p) => { const s = new Set(p); s.delete(t.id); return s; });
        await fetchTournaments(activeTab);
      } catch (err) {
        setError(err.message || "Couldn't unregister.");
      } finally {
        setActionId(null);
      }
    });
  };

  const handleCreate = async (formData) => {
    try {
      setCreating(true);
      setError("");
      await tournamentApi.create(formData);
      setShowCreate(false);
      setActiveTab("upcoming");
      await fetchTournaments("upcoming");
    } catch (err) {
      setError(err.message || "Couldn't create tournament.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageShell eyebrow="COMPETE" title="Tournaments" subtitle="Climb the bracket, win the crowd, take the prize">

      {modalFor && (
        <RegisterModal tournament={modalFor} onClose={() => setModalFor(null)} onConfirm={handleConfirmRegister} submitting={submitting} />
      )}

      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={creating}
        />
      )}

      {/* Tabs + Create button */}
      <div className="flex items-center justify-between gap-2 mb-8">
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button key={t.value} onClick={() => setActiveTab(t.value)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={activeTab === t.value
                ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Create tournament button — only for logged in users */}
        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", boxShadow: "0 0 14px rgba(124,58,237,0.35)" }}
          >
            <FaPlus className="text-[10px]" /> Create Tournament
          </button>
        )}
      </div>

      {error && <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

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
            const isRegistered = registeredIds.has(t.id) || !!t.isRegistered;
            const isActing = actionId === t.id;

            return (
              <div key={t.id}
                className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                style={{
                  background: isRegistered ? "rgba(83,74,183,0.1)" : "rgba(8,12,30,0.78)",
                  backdropFilter: "blur(18px)",
                  border: isRegistered ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                }}>

                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>
                  <FaTrophy className="text-white text-lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>{sc.label}</span>
                    {isRegistered && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 flex items-center gap-1">
                        <FaCheckCircle className="text-[8px]" /> Registered
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
                    <p className="text-white font-bold text-sm flex items-center gap-1.5 justify-center"><FaUsers className="text-violet-400 text-xs" /> {t.players}{t.maxPlayers ? `/${t.maxPlayers}` : ""}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Players</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm flex items-center gap-1.5 justify-center"><FaCoins className="text-yellow-400 text-xs" /> {t.prize}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Prize</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-white font-bold text-sm flex items-center gap-1.5 justify-center"><FaCalendarAlt className="text-blue-400 text-xs" /></p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{t.date}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {t.status === "upcoming" && isRegistered ? (
                    <button onClick={() => handleUnregister(t)} disabled={isActing}
                      className="px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                      <FaTimes className="text-xs" />{isActing ? "Cancelling…" : "Cancel"}
                    </button>
                  ) : t.status === "upcoming" ? (
                    <button onClick={() => requireAuth(() => setModalFor(t))} disabled={isFull}
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
                      {isFull ? "Full" : "Register"}
                    </button>
                  ) : (
                    <button onClick={() => t.status === "past" ? navigate(`/tournaments/${t.id}/results`) : navigate(`/tournaments/${t.id}/bracket`)}
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
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
