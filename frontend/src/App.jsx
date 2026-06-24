import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./lib/api";
import LiveMap from "./components/LiveMap";
import SummaryCards from "./components/SummaryCards";
import StatsChart from "./components/StatsChart";
import MissionList from "./components/MissionList";
import HelicopterSelector from "./components/HelicopterSelector";

const LIVE_INTERVAL = 15_000;
const STATS_INTERVAL = 120_000;

function useData(fetcher, interval) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    setData(null);
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { data, error };
}

// Format callsign for header display
function fmtCallsign(cs) {
  if (!cs) return null;
  const match = cs.trim().toUpperCase().match(/^CHX(\d+)$/);
  if (match) return `Christoph ${parseInt(match[1], 10)}`;
  return cs.trim();
}

export default function App() {
  const [selected, setSelected] = useState(null); // null = alle
  const [trackHours, setTrackHours] = useState(24);
  const [missionDays, setMissionDays] = useState(60);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: helicopters } = useData(api.helicopters, STATS_INTERVAL);
  const { data: allLive } = useData(api.liveAll, LIVE_INTERVAL);
  const { data: live } = useData(
    useCallback(() => selected ? api.live(selected) : Promise.resolve(null), [selected]),
    LIVE_INTERVAL
  );
  const { data: track } = useData(
    useCallback(() => selected ? api.track(trackHours, selected) : Promise.resolve([]), [selected, trackHours]),
    LIVE_INTERVAL
  );
  const { data: missions } = useData(
    useCallback(() => api.missions(missionDays, selected), [missionDays, selected]),
    STATS_INTERVAL
  );
  const { data: dailyStats } = useData(
    useCallback(() => api.dailyStats(30, selected), [selected]),
    STATS_INTERVAL
  );
  const { data: summary } = useData(
    useCallback(() => api.summary(selected), [selected]),
    STATS_INTERVAL
  );

  const displayLive = selected ? live : null;
  const isLive = displayLive && !displayLive.on_ground;
  const stale = displayLive?.time && Date.now() - new Date(displayLive.time).getTime() > 5 * 60 * 1000;
  const activeCount = (allLive ?? []).filter((h) => !h.on_ground).length;

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-slate-400 hover:text-white transition-colors text-lg leading-none"
          title="Sidebar ein-/ausblenden"
        >
          ☰
        </button>
        <span className="text-xl">🚁</span>
        <div>
          <h1 className="text-base font-bold text-white leading-none">
            {selected ? fmtCallsign(selected) : "Rettungshubschrauber DE"}
          </h1>
          <p className="text-xs text-slate-400">ADS-B Tracker</p>
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs">
          {/* Overall active count */}
          {!selected && allLive && (
            <span className="text-slate-400">
              <span className="text-green-400 font-semibold">{activeCount}</span> im Flug
              · {allLive.length} sichtbar
            </span>
          )}

          {/* Single helicopter status */}
          {selected && (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                stale ? "bg-yellow-400" : isLive ? "bg-green-400 pulse-red" : "bg-slate-500"
              }`} />
              <span className={stale ? "text-yellow-400" : isLive ? "text-green-400" : "text-slate-400"}>
                {stale ? "Veraltet" : isLive ? "Im Flug" : live ? "Am Boden" : "Keine Daten"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <HelicopterSelector
            helicopters={helicopters}
            selected={selected}
            onSelect={setSelected}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Map + right panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Map */}
            <div className="lg:col-span-3 bg-slate-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
                <span className="text-sm font-medium">
                  {selected ? "Live Karte" : "Übersichtskarte Deutschland"}
                </span>
                {selected && (
                  <select
                    className="bg-slate-700 text-xs text-slate-300 rounded px-2 py-1 outline-none"
                    value={trackHours}
                    onChange={(e) => setTrackHours(Number(e.target.value))}
                  >
                    <option value={1}>Track: 1h</option>
                    <option value={6}>Track: 6h</option>
                    <option value={24}>Track: 24h</option>
                    <option value={72}>Track: 3 Tage</option>
                  </select>
                )}
              </div>
              <div style={{ height: 420 }}>
                <LiveMap
                  live={displayLive}
                  track={track}
                  allLive={allLive}
                  selectedCallsign={selected}
                />
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h2 className="text-sm font-medium mb-3 text-slate-300">
                  {selected ? `Stats · ${fmtCallsign(selected)}` : "Gesamtübersicht"}
                </h2>
                <SummaryCards summary={summary} live={displayLive} />
              </div>

              {displayLive && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h2 className="text-sm font-medium mb-3 text-slate-300">Aktuelle Position</h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {[
                      ["Callsign", displayLive.callsign],
                      ["Höhe", displayLive.altitude_ft != null ? `${displayLive.altitude_ft} ft` : "–"],
                      ["Speed", displayLive.ground_speed_kt != null ? `${displayLive.ground_speed_kt} kt` : "–"],
                      ["Kurs", displayLive.track_deg != null ? `${displayLive.track_deg}°` : "–"],
                      ["Reg.", displayLive.registration ?? "–"],
                      ["Squawk", displayLive.squawk ?? "–"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="text-slate-200 font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {displayLive.emergency && (
                    <div className="mt-3 bg-red-900/50 border border-red-600 rounded px-3 py-2 text-red-300 text-xs font-semibold">
                      ⚠ NOTFALL: {displayLive.emergency}
                    </div>
                  )}
                </div>
              )}

              {/* All-view: active helicopters list */}
              {!selected && allLive && allLive.length > 0 && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h2 className="text-sm font-medium mb-3 text-slate-300">Aktiv jetzt</h2>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allLive
                      .filter((h) => !h.on_ground)
                      .map((h) => (
                        <button
                          key={h.callsign}
                          onClick={() => setSelected(h.callsign)}
                          className="w-full text-left flex justify-between items-center
                                     text-xs px-2 py-1.5 rounded hover:bg-slate-700 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span className="text-slate-200 font-medium">
                              {fmtCallsign(h.callsign) || h.callsign}
                            </span>
                          </span>
                          <span className="text-slate-500">
                            {h.altitude_ft != null ? `${h.altitude_ft} ft` : ""}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats chart */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-sm font-medium mb-3 text-slate-300">
              Tagesstatistik (letzte 30 Tage)
              {selected && <span className="text-slate-500 ml-1">· {fmtCallsign(selected)}</span>}
            </h2>
            <StatsChart data={dailyStats} />
          </div>

          {/* Mission list */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-300">
                Missionen
                {missions && (
                  <span className="ml-2 text-xs text-slate-500">({missions.length})</span>
                )}
              </h2>
              <select
                className="bg-slate-700 text-xs text-slate-300 rounded px-2 py-1 outline-none"
                value={missionDays}
                onChange={(e) => setMissionDays(Number(e.target.value))}
              >
                <option value={14}>14 Tage</option>
                <option value={30}>30 Tage</option>
                <option value={60}>60 Tage</option>
                <option value={90}>90 Tage</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              {[["🏥", "Krankenhaus", "text-blue-300"], ["🌿", "Außenlandung", "text-amber-300"], ["🏠", "Heimatbasis", "text-slate-300"]].map(
                ([icon, label, cls]) => (
                  <span key={label} className={`flex items-center gap-1 ${cls}`}>{icon} {label}</span>
                )
              )}
            </div>
            <MissionList missions={missions} selectedCallsign={selected} />
          </div>
        </main>
      </div>
    </div>
  );
}
