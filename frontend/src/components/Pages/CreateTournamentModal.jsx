import { useState } from "react";
import { FaTimes, FaTrophy, FaCalendarAlt, FaUsers, FaCoins, FaTag } from "react-icons/fa";

const CATEGORIES = [
  "Technology", "Politics", "Science", "Society", "Ethics", "Education", "Business",
];

const CreateTournamentModal = ({ onClose, onSubmit, loading }) => {
  const [name,            setName]            = useState("");
  const [topic,           setTopic]           = useState("Technology");
  const [description,     setDescription]     = useState("");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [prize,           setPrize]           = useState("");
  const [startDate,       setStartDate]       = useState("");
  const [error,           setError]           = useState("");

  const handleSubmit = () => {
    if (!name.trim())  { setError("Tournament name is required."); return; }
    if (!startDate)    { setError("Start date is required."); return; }
    setError("");
    onSubmit({ name: name.trim(), topic, description, maxParticipants, prize, startDate });
  };

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "rgba(10,14,30,0.98)",
          border: "1px solid rgba(124,58,237,0.35)",
          boxShadow: "0 0 60px rgba(124,58,237,0.2)",
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>
              <FaTrophy className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-lg">Create Tournament</h2>
              <p className="text-gray-500 text-xs">Set up a new debate tournament</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        {/* Name */}
        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <FaTrophy className="text-violet-400 text-[10px]" /> Tournament Name *
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Winter Clash Championship"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Weekly debate tournament"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <FaTag className="text-violet-400 text-[10px]" /> Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setTopic(c)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: topic === c ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                  border: topic === c ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  color: topic === c ? "#c4b5fd" : "#9ca3af",
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Max players + Prize */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <FaUsers className="text-violet-400 text-[10px]" /> Max Players
            </label>
            <div className="flex gap-2">
              {[8, 16, 32, 64].map((n) => (
                <button key={n} onClick={() => setMaxParticipants(n)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: maxParticipants === n ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                    border: maxParticipants === n ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                    color: maxParticipants === n ? "#c4b5fd" : "#9ca3af",
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <FaCoins className="text-yellow-400 text-[10px]" /> Prize Pool
            </label>
            <input
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="e.g. $500"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
            />
          </div>
        </div>

        {/* Start date */}
        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <FaCalendarAlt className="text-blue-400 text-[10px]" /> Start Date *
          </label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-violet-500/50"
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !startDate}
          className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
        >
          <FaTrophy className="text-yellow-300" />
          {loading ? "Creating…" : "Create Tournament"}
        </button>
      </div>
    </div>
  );
};

export default CreateTournamentModal;
