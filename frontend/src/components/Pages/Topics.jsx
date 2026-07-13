import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaMicrochip, FaLandmark, FaFlask, FaGraduationCap,
  FaHeartbeat, FaBalanceScale, FaGlobeAmericas, FaFilm, FaCoins,
  FaChevronRight,
} from "react-icons/fa";
import PageShell from "../Pages/PageShell";
import { topicsApi } from "../../services/api";

const iconMap = {
  microchip: <FaMicrochip />,
  landmark: <FaLandmark />,
  flask: <FaFlask />,
  "graduation-cap": <FaGraduationCap />,
  heartbeat: <FaHeartbeat />,
  "balance-scale": <FaBalanceScale />,
  globe: <FaGlobeAmericas />,
  film: <FaFilm />,
  coins: <FaCoins />,
};

const Topics = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  topicsApi
    .list()
    .then((res) => {
      const cats =
        res?.data?.categories ||
        res?.categories ||
        res?.data ||
        [];
      setCategories(Array.isArray(cats) ? cats : []);
    })
    .catch((err) => setError(err.message || "Couldn't load topics."))
    .finally(() => setLoading(false));
}, []);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCategoryClick = (categoryName) => {
    navigate(`/livedebates?category=${encodeURIComponent(categoryName)}`);
  };

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

      {error && (
        <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500 text-sm">Loading topics…</div>
      ) : filtered.length === 0 ? (
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
              onClick={() => handleCategoryClick(c.name)}
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
                  {iconMap[c.icon] || <FaGlobeAmericas />}
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