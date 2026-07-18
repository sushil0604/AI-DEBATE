import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

/**
 * Wrap the app once with <AuthProvider> (in main.jsx / App.jsx, above the
 * router). This runs the token check exactly ONCE for the whole app's
 * lifetime, instead of every component that calls useAuth() re-checking
 * independently. That's what was causing the "start debate -> login ->
 * login again does nothing" bug: each page's own useAuth() call remounted
 * on every navigation, restarting the loading race from scratch.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.user);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Call this right after a successful login/signup so the whole app
  // updates immediately, without waiting for a remount + fresh /me call.
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    if (userData) {
      setUser(userData);
      setLoading(false);
    } else {
      // No user object returned from login response — fetch it once.
      setLoading(true);
      refreshUser();
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Same name/shape as before (`user`, `loading`, `isAuthenticated`) so every
// existing `const { isAuthenticated, loading: authLoading } = useAuth();`
// call site keeps working unchanged — just update the import path.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>. Make sure main.jsx/App.jsx wraps the app with <AuthProvider>.");
  }
  return ctx;
}
