import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaRobot, FaGoogle, FaGithub } from "react-icons/fa";
import AIBackground from "../Home/AIBackground";
import { authApi } from "../../services/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await authApi.login(form.email, form.password);
      localStorage.setItem("token", res.token);

      // send them back where they came from (e.g. Homepage's "Start Debate" flow), else home
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true, state: location.state?.intent ? { intent: location.state.intent } : undefined });
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const handleOAuth = (provider) => {
    // Redirects to your backend's OAuth entry point (needs passport/OAuth strategy set up server-side)
    window.location.href = `${API_BASE}/auth/${provider}`;
  };

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex items-center justify-center px-4"
      style={{ fontFamily: "'Exo 2', sans-serif" }}
    >
      <AIBackground fixed={true} />

      <div className="relative z-10 w-full max-w-md py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 24px rgba(124,58,237,0.45)" }}
          >
            <FaRobot className="text-white text-2xl" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Debate<span className="text-violet-400">AI</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 sm:p-8"
          style={{
            background: "rgba(8,12,30,0.78)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          <h1 className="text-white font-extrabold text-2xl mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-6">Log in to keep the conversation going</p>

          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Email</label>
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <FaEnvelope className="text-gray-500 text-sm flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-xs font-semibold">Password</label>
                <Link to="/forgot-password" className="text-violet-400 text-xs font-semibold hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <FaLock className="text-gray-500 text-sm flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                >
                  {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 py-2.5 rounded-xl text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
            >
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuth("google")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <FaGoogle className="text-sm" /> Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <FaGithub className="text-sm" /> GitHub
            </button>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;