import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // adjust path if needed

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    // Decode the JWT payload to get basic user info for context.
    // JWTs use base64url encoding (with '-' and '_' instead of '+' and '/',
    // and no padding), which plain atob() can't handle directly — it throws
    // on those characters. Convert to standard base64 first.
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      const payload = JSON.parse(atob(padded));
      login(token, { id: payload.id, email: payload.email });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("OAuth token decode failed:", err);
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <p>Signing you in…</p>
    </div>
  );
};

export default OAuthSuccess;
