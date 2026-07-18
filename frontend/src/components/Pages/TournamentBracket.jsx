import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTrophy, FaUsers, FaArrowLeft, FaCalendarAlt, FaBolt } from "react-icons/fa";
import PageShell from "./PageShell";
import { tournamentApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext"; // adjust relative path per file

const TournamentBracket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [starting, setStarting]     = useState(false);

  const fetchTournament = () => {
    setLoading(true);
    tournamentApi.getById(id)
      .then((res) => setTournament(res.tournament || res.data))
      .catch((err) => setError(err.message || "Couldn't load tournament."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTournament(); }, [id]);

  const handleStart = async () => {
    if (!window.confirm("Start the tournament and generate matches now?")) return;
    try {
      setStarting(true);
      setError("");
      await tournamentApi.start(id);
      await fetchTournament();
    } catch (err) {
      setError(err.message || "Couldn't start tournament.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) return (
    <PageShell eyebrow="COMPETE" title="Tournament Bracket" subtitle="">
      <div className="text-center py-20 text-gray-500 text-sm">Loading bracket…</div>
    </PageShell>
  );

  if (error || !tournament) return (
    <PageShell eyebrow="COMPETE" title="Tournament Bracket" subtitle="">
      <div className="text-center py-20">
        <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 inline-block">{error || "Tournament not found."}</p>
        <div className="mt-4">
          <button onClick={() => navigate("/tournaments")} className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-2 mx-auto">
            <FaArrowLeft className="text-xs" /> Back to Tournaments
          </button>
        </div>
      </div>
    </PageShell>
  );

  const debates = tournament.debates || [];
  const participants = tournament.participants || [];

  return (
    <PageShell
      eyebrow="COMPETE"
      title={tournament.name}
      subtitle={tournament.topic || "Tournament in progress"}
    >
      <button
        onClick={() => navigate("/tournaments")}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
      >
        <FaArrowLeft className="text-xs" /> Back to Tournaments
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: <FaUsers className="text-violet-400" />, label: "Players", value: `${participants.length}/${tournament.maxParticipants}` },
          { icon: <FaTrophy className="text-yellow-400" />, label: "Prize",   value: tournament.prize || "TBD" },
          { icon: <FaCalendarAlt className="text-blue-400" />, label: "Date", value: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(8,12,30,0.78)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-white font-bold text-lg">{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bracket / Debates */}
      {debates.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(8,12,30,0.78)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <FaTrophy className="text-4xl mx-auto mb-3 opacity-20 text-gray-400" />
          <p className="text-white font-bold text-lg mb-1">Bracket not generated yet</p>
          <p className="text-gray-500 text-sm mb-6">The tournament organizer hasn't started the matches yet.</p>

          {/* Show start button only to the creator */}
          {user && tournament?.createdBy &&
            (tournament.createdBy._id === user.id ||
             tournament.createdBy._id === user._id ||
             tournament.createdBy === user.id) && (
            <div className="flex flex-col items-center gap-3">
              {participants.length < 2 && (
                <p className="text-yellow-400 text-xs">Need at least 2 players to start.</p>
              )}
              <button
                onClick={handleStart}
                disabled={starting || participants.length < 2}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
              >
                <FaBolt />
                {starting ? "Generating matches…" : `Start Tournament (${participants.length} players)`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-extrabold text-lg mb-2">Match Bracket</h3>
          {debates.map((debate, i) => {
            const p1 = debate.participants?.[0];
            const p2 = debate.participants?.[1];
            return (
              <div key={debate._id || i}
                className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:-translate-y-0.5 transition-all"
                style={{ background: "rgba(8,12,30,0.78)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
                onClick={() => debate._id && navigate(`/debate/${debate._id}`)}
              >
                <div className="flex-1">
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Match {i + 1}</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="text-center p-3 rounded-xl" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
                      <p className="text-white font-bold text-sm">{p1?.user?.name || "TBD"}</p>
                      <p className="text-blue-400 text-[10px] mt-0.5">FOR</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>VS</div>
                    <div className="text-center p-3 rounded-xl" style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)" }}>
                      <p className="text-white font-bold text-sm">{p2?.user?.name || "TBD"}</p>
                      <p className="text-pink-400 text-[10px] mt-0.5">AGAINST</p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    debate.status === "live"     ? "bg-red-500/20 border border-red-500/30 text-red-400" :
                    debate.status === "finished" ? "bg-gray-500/20 border border-gray-500/30 text-gray-400" :
                    "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                  }`}>
                    {debate.status === "live" ? "🔴 Live" : debate.status === "finished" ? "Finished" : "Upcoming"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participants */}
      {participants.length > 0 && (
        <div className="mt-8">
          <h3 className="text-white font-extrabold text-lg mb-4">Registered Players ({participants.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.map((p, i) => (
              <div key={p._id || i} className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: "rgba(8,12,30,0.78)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {(p.name || p.user?.name || "?")[0].toUpperCase()}
                </div>
                <p className="text-white text-sm font-medium truncate">{p.name || p.user?.name || "Player"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default TournamentBracket;
