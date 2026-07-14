const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem("token");
  }
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
};

export const statsApi = {
  platform: () => api.get("/stats/platform"),
};
export const leaderboardApi = {
  get: (period) => api.get(`/leaderboard?period=${encodeURIComponent(period)}`),
};

export const authApi = {
  me: () => api.get("/auth/me"),
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),
};
export const topicsApi = {
  list: () => api.get("/debates/topics"),

};
export const aiCoachApi = {
  judgeStats: () => api.get("/ai-coach/judge-stats"),
  sampleAnalysis: () => api.get("/ai-coach/sample-analysis"),
  chat: (message, history) => api.post("/ai-coach/chat", { message, history }),
};
export const debateRoomApi = {
  get: (debateId) => api.get(`/debates/${debateId}`),
};
export const debateApi = {
  create: (mode, topic, side, options = {}) =>
    api.post("/debates", { mode, topic, side, ...options }),
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/debates${qs ? `?${qs}` : ""}`);
  },
  join: (debateId) => api.post(`/debates/${debateId}/join`),
};
export const tournamentApi = {
  list: (status) => api.get(`/tournaments?status=${encodeURIComponent(status)}`),
  join: (tournamentId) => api.post(`/tournaments/${tournamentId}/join`),
  leave: (tournamentId) => request(`/tournaments/${tournamentId}/leave`, { method: "DELETE" }),
};