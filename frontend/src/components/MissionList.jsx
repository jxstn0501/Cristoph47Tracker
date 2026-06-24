import { classifyLanding } from "../lib/landingDetector";

const TYPE_STYLE = {
  Krankenhaus:  "bg-blue-900/50 text-blue-300 border-blue-700",
  Heimatbasis:  "bg-slate-700 text-slate-300 border-slate-600",
  Außenlandung: "bg-amber-900/50 text-amber-300 border-amber-700",
  Unbekannt:    "bg-slate-800 text-slate-400 border-slate-700",
};

const TYPE_ICON = {
  Krankenhaus:  "🏥",
  Heimatbasis:  "🏠",
  Außenlandung: "🌿",
  Unbekannt:    "❓",
};

function fmtCallsign(cs) {
  if (!cs) return cs;
  const match = cs.trim().toUpperCase().match(/^CHX(\d+)$/);
  if (match) return `C${parseInt(match[1], 10)}`;
  return cs.trim();
}

function fmtTime(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function duration(start, end) {
  if (!start || !end) return null;
  const s = Math.round((new Date(end) - new Date(start)) / 60000);
  if (s < 60) return `${s} min`;
  return `${Math.floor(s / 60)}h ${s % 60}min`;
}

export default function MissionList({ missions, selectedCallsign }) {
  if (!missions?.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">Keine Missionen gefunden</p>
    );
  }

  const showCallsign = selectedCallsign === null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-slate-400 text-xs border-b border-slate-700">
            {showCallsign && <th className="pb-2 pr-3">Hubschrauber</th>}
            <th className="pb-2 pr-3">Start</th>
            <th className="pb-2 pr-3">Ende</th>
            <th className="pb-2 pr-3">Dauer</th>
            <th className="pb-2 pr-3">Landung</th>
            <th className="pb-2">Ort</th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m, i) => {
            const landing = classifyLanding(m.end_lat, m.end_lon);
            const typeStyle = TYPE_STYLE[landing.type] ?? TYPE_STYLE.Unbekannt;
            const icon = TYPE_ICON[landing.type] ?? "❓";
            const dur = duration(m.start_time, m.end_time);

            return (
              <tr
                key={`${m.callsign}-${m.mission_id ?? i}`}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                {showCallsign && (
                  <td className="py-2 pr-3 text-red-400 font-medium text-xs whitespace-nowrap">
                    {fmtCallsign(m.callsign)}
                  </td>
                )}
                <td className="py-2 pr-3 text-slate-300 whitespace-nowrap text-xs">
                  {fmtTime(m.start_time)}
                </td>
                <td className="py-2 pr-3 text-slate-400 whitespace-nowrap text-xs">
                  {m.end_time ? fmtTime(m.end_time) : <span className="text-green-400">Aktiv</span>}
                </td>
                <td className="py-2 pr-3 text-slate-400 whitespace-nowrap text-xs">
                  {dur ?? "–"}
                </td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${typeStyle}`}>
                    {icon} {landing.type}
                  </span>
                </td>
                <td className="py-2 text-slate-400 text-xs">
                  {landing.name ?? (m.end_lat != null ? `${m.end_lat?.toFixed(4)}, ${m.end_lon?.toFixed(4)}` : "–")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
