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

    // Decode the JWT payload to get basic user info for context
    // (or better: call your backend's /api/auth/me endpoint with this token)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      login(token, { id: payload.id, email: payload.email });
      navigate("/", { replace: true });
    } catch {
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
