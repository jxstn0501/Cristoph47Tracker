import { useState } from "react";

function statusColor(lastSeen) {
  if (!lastSeen) return "bg-slate-600";
  const ageMin = (Date.now() - new Date(lastSeen).getTime()) / 60000;
  if (ageMin < 5) return "bg-green-400";
  if (ageMin < 60) return "bg-yellow-400";
  return "bg-slate-500";
}

function fmtAge(lastSeen) {
  if (!lastSeen) return "–";
  const ageMin = Math.round((Date.now() - new Date(lastSeen).getTime()) / 60000);
  if (ageMin < 1) return "gerade eben";
  if (ageMin < 60) return `vor ${ageMin} Min`;
  const h = Math.floor(ageMin / 60);
  if (h < 24) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} T`;
}

// Format callsign for display: CHX47 → Christoph 47, CHX1 → Christoph 1
function fmtCallsign(cs) {
  if (!cs) return cs;
  const upper = cs.trim().toUpperCase();
  const match = upper.match(/^CHX(\d+)$/);
  if (match) return `Christoph ${parseInt(match[1], 10)}`;
  return cs.trim();
}

export default function HelicopterSelector({ helicopters, selected, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = (helicopters ?? []).filter((h) =>
    !search || h.callsign?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-full">
      <div className="px-3 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Hubschrauber
        </h2>
        <input
          type="text"
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-500
                     rounded px-2 py-1.5 outline-none border border-slate-700
                     focus:border-red-500 transition-colors"
        />
      </div>

      {/* "Alle" option */}
      <button
        onClick={() => onSelect(null)}
        className={`mx-3 mb-1 rounded px-2 py-2 text-left text-sm transition-colors
          ${selected === null
            ? "bg-red-700 text-white font-medium"
            : "text-slate-300 hover:bg-slate-800"
          }`}
      >
        🗺 Alle anzeigen
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-4">
            {helicopters?.length ? "Keine Treffer" : "Lade…"}
          </p>
        )}
        {filtered.map((h) => {
          const isActive = selected === h.callsign;
          const dot = statusColor(h.last_seen);
          return (
            <button
              key={h.callsign}
              onClick={() => onSelect(h.callsign)}
              className={`w-full rounded px-2 py-2 text-left transition-colors
                ${isActive
                  ? "bg-red-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-sm font-medium truncate">
                  {fmtCallsign(h.callsign)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-0.5 pl-4">
                <span className={isActive ? "text-red-200" : "text-slate-500"}>
                  {h.callsign}
                </span>
                <span className={isActive ? "text-red-200" : "text-slate-600"}>
                  {fmtAge(h.last_seen)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
