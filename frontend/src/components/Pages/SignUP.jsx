import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaRobot, FaGoogle, FaGithub, FaCheck } from "react-icons/fa";
import AIBackground from "../Home/AIBackground";
import { authApi } from "../../services/api";

const passwordChecks = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
];

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allChecksPassed = passwordChecks.every((c) => c.test(form.password));

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setError("");

    if (!allChecksPassed) {
      setError("Password doesn't meet all requirements yet.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authApi.register(form.name, form.email, form.password);
      localStorage.setItem("token", res.token);

      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true, state: location.state?.intent ? { intent: location.state.intent } : undefined });
    } catch (err) {
      setError(err.message || "Couldn't create your account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const handleOAuth = (provider) => {
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
          <h1 className="text-white font-extrabold text-2xl mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm mb-6">Your first debate is free, no card required</p>

          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Full name</label>
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <FaUser className="text-gray-500 text-sm flex-shrink-0" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                />
              </div>
            </div>

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
              <label className="text-gray-400 text-xs font-semibold mb-1.5 block">Password</label>
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

              {/* Password strength checklist */}
              {form.password.length > 0 && (
                <div className="flex flex-col gap-1 mt-2.5">
                  {passwordChecks.map((c) => {
                    const passed = c.test(form.password);
                    return (
                      <div key={c.label} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: passed ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)",
                            border: passed ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.15)",
                          }}
                        >
                          {passed && <FaCheck className="text-green-400 text-[7px]" />}
                        </span>
                        <span className={passed ? "text-green-400" : "text-gray-500"}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 accent-violet-500 flex-shrink-0"
              />
              <span className="text-gray-400 text-xs leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!agreed || submitting}
              className="mt-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">or sign up with</span>
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
          Already have an account?{" "}
          <Link to="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;