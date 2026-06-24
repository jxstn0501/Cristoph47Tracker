const BASE = "/api";

async function get(path, params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  );
  const qs = new URLSearchParams(filtered).toString();
  const url = BASE + path + (qs ? `?${qs}` : "");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export const api = {
  helicopters: () => get("/helicopters"),
  liveAll: () => get("/flights/live/all"),
  live: (callsign) => get("/flights/live", { callsign }),
  track: (hours = 24, callsign) => get("/flights/track", { hours, callsign }),
  missions: (days = 60, callsign) => get("/flights/missions", { days, callsign }),
  dailyStats: (days = 30, callsign) => get("/stats/daily", { days, callsign }),
  summary: (callsign) => get("/stats/summary", { callsign }),
};
