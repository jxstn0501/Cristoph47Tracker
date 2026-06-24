import { useState, useEffect, useCallback } from "react";
import { api } from "./lib/api";
import LiveMap from "./components/LiveMap";
import SummaryCards from "./components/SummaryCards";
import StatsChart from "./components/StatsChart";
import MissionList from "./components/MissionList";

const LIVE_INTERVAL = 15_000;
const STATS_INTERVAL = 120_000;

function useData(fetcher, interval) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setData(await fetcher());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { data, error, refresh };
}

export default function App() {
  const { data: live } = useData(api.live, LIVE_INTERVAL);
  const { data: track } = useData(() => api.track(24), LIVE_INTERVAL);
  const { data: missions } = useData(() => api.missions(60), STATS_INTERVAL);
  const { data: dailyStats } = useData(() => api.dailyStats(30), STATS_INTERVAL);
  const { data: summary } = useData(api.summary, STATS_INTERVAL);

  const [missionDays, setMissionDays] = useState(60);
  const [trackHours, setTrackHours] = useState(24);

  const isLive = live && !live.on_ground;
  const lastSeen = live?.time ? new Date(live.time) : null;
  const stale = lastSeen && Date.now() - lastSeen.getTime() > 5 * 60 * 1000;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚁</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Christoph 47</h1>
            <p className="text-xs text-slate-400">ADS-B Tracker · Greifswald</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {live ? (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  stale ? "bg-yellow-400" : isLive ? "bg-green-400 pulse-red" : "bg-slate-500"
                }`}
              />
              <span className={stale ? "text-yellow-400" : isLive ? "text-green-400" : "text-slate-400"}>
                {stale ? "Veraltet" : isLive ? "Im Flug" : "Am Boden"}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-slate-500">Keine Verbindung</span>
            </>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 space-y-4 max-w-7xl mx-auto w-full">
        {/* Top: Map + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Map */}
          <div className="lg:col-span-3 bg-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
              <span className="text-sm font-medium">Live Karte</span>
              <select
                className="bg-slate-700 text-xs text-slate-300 rounded px-2 py-1 border-none outline-none"
                value={trackHours}
                onChange={(e) => setTrackHours(Number(e.target.value))}
              >
                <option value={1}>Track: 1h</option>
                <option value={6}>Track: 6h</option>
                <option value={24}>Track: 24h</option>
                <option value={72}>Track: 3 Tage</option>
              </select>
            </div>
            <div style={{ height: 420 }}>
              <LiveMap live={live} track={track} />
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Summary cards */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h2 className="text-sm font-medium mb-3 text-slate-300">Gesamtübersicht</h2>
              <SummaryCards summary={summary} live={live} />
            </div>

            {/* Live details */}
            {live && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h2 className="text-sm font-medium mb-3 text-slate-300">Aktuelle Position</h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    ["Callsign", live.callsign],
                    ["Höhe", live.altitude_ft != null ? `${live.altitude_ft} ft` : "–"],
                    ["Speed", live.ground_speed_kt != null ? `${live.ground_speed_kt} kt` : "–"],
                    ["Kurs", live.track_deg != null ? `${live.track_deg}°` : "–"],
                    ["Reg.", live.registration ?? "–"],
                    ["Squawk", live.squawk ?? "–"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-slate-200 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                {live.emergency && (
                  <div className="mt-3 bg-red-900/50 border border-red-600 rounded px-3 py-2 text-red-300 text-xs font-semibold">
                    ⚠ NOTFALL: {live.emergency}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats chart */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3 text-slate-300">Tagesstatistik (letzte 30 Tage)</h2>
          <StatsChart data={dailyStats} />
        </div>

        {/* Mission list */}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-300">
              Missionen
              {missions && (
                <span className="ml-2 text-xs text-slate-500">({missions.length} gesamt)</span>
              )}
            </h2>
            <select
              className="bg-slate-700 text-xs text-slate-300 rounded px-2 py-1 border-none outline-none"
              value={missionDays}
              onChange={(e) => setMissionDays(Number(e.target.value))}
            >
              <option value={14}>14 Tage</option>
              <option value={30}>30 Tage</option>
              <option value={60}>60 Tage</option>
              <option value={90}>90 Tage</option>
            </select>
          </div>

          {/* Landing type legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            {[
              ["🏥", "Krankenhaus", "text-blue-300"],
              ["🌿", "Außenlandung", "text-amber-300"],
              ["🏠", "Heimatbasis", "text-slate-300"],
            ].map(([icon, label, cls]) => (
              <span key={label} className={`flex items-center gap-1 ${cls}`}>
                {icon} {label}
              </span>
            ))}
          </div>

          <MissionList missions={missions} />
        </div>
      </main>

      <footer className="text-center text-xs text-slate-600 py-4">
        Christoph 47 Tracker · ADS-B Daten via adsbexchange.com · Daten nur zur Information
      </footer>
    </div>
  );
}
