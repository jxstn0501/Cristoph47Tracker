import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const helicopterIcon = L.divIcon({
  html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 0 4px rgba(239,68,68,0.9))">🚁</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: "",
});

const groundIcon = L.divIcon({
  html: `<div style="font-size:22px;line-height:1;opacity:0.6">🚁</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  className: "",
});

// Format callsign for display
function fmtCallsign(cs) {
  if (!cs) return cs;
  const match = cs.trim().toUpperCase().match(/^CHX(\d+)$/);
  if (match) return `Christoph ${parseInt(match[1], 10)}`;
  return cs.trim();
}

function FlyTo({ position }) {
  const map = useMap();
  const prevPos = useRef(null);
  useEffect(() => {
    if (!position) return;
    if (!prevPos.current) {
      map.setView(position, 11);
    } else {
      map.panTo(position, { animate: true, duration: 1 });
    }
    prevPos.current = position;
  }, [position, map]);
  return null;
}

export default function LiveMap({ live, track, allLive, selectedCallsign }) {
  const defaultCenter = [52.5, 10.5]; // Center of Germany for "all" view
  const greifswald = [54.09, 13.38];

  const livePos = live?.lat && live?.lon ? [live.lat, live.lon] : null;
  const trackLine = (track ?? [])
    .filter((p) => p.lat && p.lon)
    .map((p) => [p.lat, p.lon]);

  const showAll = selectedCallsign === null;

  return (
    <MapContainer
      center={showAll ? defaultCenter : greifswald}
      zoom={showAll ? 6 : 10}
      style={{ height: "100%", width: "100%", minHeight: 380 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Single helicopter: track + live marker */}
      {!showAll && (
        <>
          {trackLine.length > 1 && (
            <Polyline positions={trackLine} color="#ef4444" weight={2.5} opacity={0.7} />
          )}
          {livePos && (
            <>
              <FlyTo position={livePos} />
              <Marker position={livePos} icon={live?.on_ground ? groundIcon : helicopterIcon}>
                <Popup>
                  <div className="text-slate-200 text-xs space-y-1">
                    <p className="font-bold text-sm">{fmtCallsign(live.callsign)}</p>
                    <p className="text-slate-400">{live.callsign}</p>
                    <p>Höhe: {live.altitude_ft ?? "–"} ft</p>
                    <p>Speed: {live.ground_speed_kt ?? "–"} kt</p>
                    <p>Kurs: {live.track_deg ?? "–"}°</p>
                    {live.registration && <p>Reg: {live.registration}</p>}
                    {live.squawk && <p>Squawk: {live.squawk}</p>}
                    {live.on_ground && <p className="text-amber-400">Am Boden</p>}
                    {live.emergency && (
                      <p className="text-red-400 font-bold">⚠ {live.emergency}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </>
      )}

      {/* All helicopters: one marker per aircraft */}
      {showAll &&
        (allLive ?? []).map((ac) => {
          if (!ac.lat || !ac.lon) return null;
          return (
            <Marker
              key={ac.callsign}
              position={[ac.lat, ac.lon]}
              icon={ac.on_ground ? groundIcon : helicopterIcon}
            >
              <Popup>
                <div className="text-slate-200 text-xs space-y-1">
                  <p className="font-bold text-sm">{fmtCallsign(ac.callsign)}</p>
                  <p className="text-slate-400">{ac.callsign}</p>
                  <p>Höhe: {ac.altitude_ft ?? "–"} ft</p>
                  <p>Speed: {ac.ground_speed_kt ?? "–"} kt</p>
                  {ac.on_ground && <p className="text-amber-400">Am Boden</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
