import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { FaUser, FaTrophy, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

const navLinks = [
  { label: "Home",        path: "/" },
  { label: "Live Debates", path: "/livedebates" },
  { label: "Topics",      path: "/topics" },
  { label: "Leaderboard", path: "/leaderboard" },
  { label: "AI Coach",    path: "/ai-coach" },
  { label: "Tournaments", path: "/tournaments" },
  { label: "About",       path: "/about" },
];

/* ─── Profile dropdown ─── */
const ProfileDropdown = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-white/5"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
        >
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            : initials
          }
        </div>
        <div className="text-left hidden xl:block">
          <p className="text-white text-xs font-bold leading-tight">{user?.name || "User"}</p>
          <p className="text-gray-500 text-[10px]">⭐ {user?.rating || 1000}</p>
        </div>
        <FaChevronDown className={`text-gray-400 text-[10px] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-2xl py-2 z-50"
          style={{
            background: "rgba(10,14,30,0.98)",
            border: "1px solid rgba(124,58,237,0.25)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>
                {initials}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{user?.name}</p>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {[
                { label: "Rating", value: user?.rating || 1000 },
                { label: "Wins",   value: user?.wins || 0 },
                { label: "Debates", value: user?.debatesCount || 0 },
              ].map((s) => (
                <div key={s.label} className="flex-1 text-center rounded-lg py-1.5"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <p className="text-white text-xs font-bold">{s.value}</p>
                  <p className="text-gray-500 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button onClick={() => { navigate("/leaderboard"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
              <FaTrophy className="text-yellow-400 text-xs" /> Leaderboard
            </button>
            <button onClick={() => { navigate("/ai-coach"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
              <FaUser className="text-violet-400 text-xs" /> AI Coach
            </button>
          </div>

          <div className="border-t border-white/8 pt-1">
            <button onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all">
              <FaSignOutAlt className="text-xs" /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Navbar ─── */
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="w-full bg-[#0a0a1a] border-b border-white/10 px-6 py-3 flex items-center justify-between relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-fit">
        <img src="image1.png" alt="DebateAI Logo" className="w-10 h-10 object-contain" />
        <div>
          <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Debate<span className="text-violet-400">IQ</span>
          </span>
          <p className="text-[9px] text-violet-300/70 -mt-1 tracking-widest uppercase">
            Challenge Ideas. Change Minds.
          </p>
        </div>
      </div>

      {/* Desktop Nav Links */}
      <ul className="hidden lg:flex items-center gap-1">
        {navLinks.map(({ label, path }) => {
          const active = isActive(path);
          return (
            <li key={label}>
              <Link
                to={path}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/8"
                }`}
                style={active ? { background: "rgba(124,58,237,0.18)", borderBottom: "2px solid #7c3aed" } : {}}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right Side */}
      <div className="hidden lg:flex items-center gap-3">
        {isAuthenticated && user ? (
          <ProfileDropdown user={user} onLogout={handleLogout} />
        ) : (
          <>
            <Link to="/login"
              className="px-4 py-1.5 text-sm font-semibold text-white border border-white/20 rounded-lg hover:bg-white/5 transition-all duration-200"
              style={{ fontFamily: "'Exo 2', sans-serif" }}>
              Log In
            </Link>
            <Link to="/signup"
              className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-violet-500/25"
              style={{ fontFamily: "'Exo 2', sans-serif" }}>
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button className="lg:hidden text-gray-400 hover:text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0d0d20] border-b border-white/10 py-4 px-6 lg:hidden">
          {/* Mobile user info */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>
                {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="text-white text-sm font-bold">{user.name}</p>
                <p className="text-gray-500 text-xs">⭐ {user.rating || 1000} rating</p>
              </div>
            </div>
          )}

          <ul className="flex flex-col gap-2 mb-4">
            {navLinks.map(({ label, path }) => {
              const active = isActive(path);
              return (
                <li key={label}>
                  <Link to={path} onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? "text-white bg-white/10" : "text-gray-400 hover:text-white"}`}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {isAuthenticated ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="w-full py-2 text-sm font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all">
              Log Out
            </button>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-semibold text-white border border-white/20 rounded-lg hover:bg-white/5 transition-all">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&display=swap');`}</style>
    </nav>
  );
};

export default Navbar;
