const BASE = "/api";

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export const api = {
  live: () => get("/flights/live"),
  track: (hours = 24) => get(`/flights/track?hours=${hours}`),
  missions: (days = 60) => get(`/flights/missions?days=${days}`),
  dailyStats: (days = 30) => get(`/stats/daily?days=${days}`),
  summary: () => get("/stats/summary"),
};
