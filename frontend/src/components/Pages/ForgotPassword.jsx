import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      // Backend always returns success:true here regardless of whether the
      // email exists (see authRoutes.js comment) — this is intentional, so
      // just show the generic message it sends back.
      setStatus("sent");
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4" style={{ background: "#0a0a1a" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(8,12,30,0.9)", border: "1px solid rgba(124,58,237,0.25)" }}>
        <h1 className="text-2xl font-bold mb-1">Forgot your password?</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

        {status === "sent" ? (
          <div className="rounded-xl px-4 py-3 text-sm bg-green-500/10 border border-green-500/30 text-green-300">
            If an account with that email exists, a reset link has been sent. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Email</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <FaEnvelope className="text-gray-500 text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Remembered your password? <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
