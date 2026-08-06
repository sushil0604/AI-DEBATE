import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaLock } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "This reset link is invalid or has expired.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4" style={{ background: "#0a0a1a" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(8,12,30,0.9)", border: "1px solid rgba(124,58,237,0.25)" }}>
        <h1 className="text-2xl font-bold mb-1">Set a new password</h1>
        <p className="text-gray-400 text-sm mb-6">Choose a new password for your account.</p>

        {status === "success" ? (
          <div className="rounded-xl px-4 py-3 text-sm bg-green-500/10 border border-green-500/30 text-green-300">
            Password reset successfully. Redirecting you to log in…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">New password</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <FaLock className="text-gray-500 text-sm" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Confirm new password</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <FaLock className="text-gray-500 text-sm" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              {status === "submitting" ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
