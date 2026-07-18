import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiSearch } from "react-icons/fi";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Live Debates", path: "/livedebates" },
  { label: "Topics", path: "/topics" },
  { label: "Leaderboard", path: "/leaderboard" },
  { label: "AI Coach", path: "/ai-coach" },
  { label: "Tournaments", path: "/tournaments" },
  // { label: "Pricing", path: "/pricing" },
  { label: "About", path: "/about" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="w-full bg-[#0a0a1a] border-b border-white/10 px-6 py-3 flex items-center justify-between relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-fit">
        <img src="image1.png" alt="DebateAI Logo" className="w-10 h-10 object-contain" />
        <div>
          <span
            className="text-white font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
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
                style={
                  active
                    ? { background: "rgba(124,58,237,0.18)", borderBottom: "2px solid #7c3aed" }
                    : {}
                }
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Right Side */}
      <div className="hidden lg:flex items-center gap-3">
        <Link
          to="/login"
          className="px-4 py-1.5 text-sm font-semibold text-white border border-white/20 rounded-lg hover:bg-white/5 transition-all duration-200"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-violet-500/25"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          Sign Up
        </Link>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="lg:hidden text-gray-400 hover:text-white p-2"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0d0d20] border-b border-white/10 py-4 px-6 lg:hidden">
          <ul className="flex flex-col gap-2 mb-4">
            {navLinks.map(({ label, path }) => {
              const active = isActive(path);
              return (
                <li key={label}>
                  <Link
                    to={path}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active ? "text-white bg-white/10" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-3">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-2 text-sm font-semibold text-white border border-white/20 rounded-lg hover:bg-white/5 transition-all"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&display=swap');`}</style>
    </nav>
  );
};

export default Navbar;
