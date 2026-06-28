import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeHelicopterIcon(heading, onGround) {
  const rotation = heading ?? 0;
  const opacity = onGround ? 0.5 : 1;
  const glow = onGround ? "none" : "drop-shadow(0 0 6px rgba(239,68,68,0.95))";
  return L.divIcon({
    html: `<div style="
      font-size:28px;
      line-height:1;
      transform:rotate(${rotation}deg);
      filter:${glow};
      opacity:${opacity};
      transform-origin:center;
    ">🚁</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "",
  });
}

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

// Split track into 3 segments for gradient effect (old → faded, new → bright)
function buildTrackSegments(trackLine) {
  if (trackLine.length < 2) return [];
  const n = trackLine.length;
  const cut1 = Math.floor(n * 0.45);
  const cut2 = Math.floor(n * 0.75);
  return [
    { points: trackLine.slice(0, cut1 + 1), color: "#64748b", opacity: 0.35, weight: 2 },
    { points: trackLine.slice(cut1, cut2 + 1), color: "#f97316", opacity: 0.6, weight: 2.5 },
    { points: trackLine.slice(cut2), color: "#ef4444", opacity: 0.9, weight: 3 },
  ].filter((s) => s.points.length > 1);
}

export default function LiveMap({ live, track, allLive, selectedCallsign }) {
  const defaultCenter = [52.5, 10.5];
  const greifswald = [54.09, 13.38];

  const livePos = live?.lat && live?.lon ? [live.lat, live.lon] : null;
  const trackPoints = (track ?? []).filter((p) => p.lat && p.lon);
  const trackLine = trackPoints.map((p) => [p.lat, p.lon]);
  const trackSegments = buildTrackSegments(trackLine);

  const startPos = trackLine.length > 1 ? trackLine[0] : null;

  const showAll = selectedCallsign === null;

  return (
    <MapContainer
      center={showAll ? defaultCenter : greifswald}
      zoom={showAll ? 6 : 10}
      style={{ height: "100%", width: "100%", minHeight: 380 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {/* Single helicopter: gradient track + start pin + live marker */}
      {!showAll && (
        <>
          {/* Gradient track segments */}
          {trackSegments.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg.points}
              color={seg.color}
              weight={seg.weight}
              opacity={seg.opacity}
            />
          ))}

          {/* Start marker */}
          {startPos && (
            <CircleMarker
              center={startPos}
              radius={5}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
            >
              <Tooltip permanent={false} direction="top" offset={[0, -6]}>
                <span className="text-xs">Startpunkt</span>
              </Tooltip>
            </CircleMarker>
          )}

          {/* Live helicopter marker */}
          {livePos && (
            <>
              <FlyTo position={livePos} />
              <Marker
                position={livePos}
                icon={makeHelicopterIcon(live?.track_deg, live?.on_ground)}
              >
                <Popup>
                  <div style={{ color: "#e2e8f0", minWidth: 140 }} className="text-xs space-y-1">
                    <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>
                      {fmtCallsign(live.callsign)}
                    </p>
                    <p style={{ color: "#94a3b8" }}>{live.callsign}</p>
                    <p>Höhe: <b>{live.altitude_ft ?? "–"} ft</b></p>
                    <p>Speed: <b>{live.ground_speed_kt ?? "–"} kt</b></p>
                    <p>Kurs: <b>{live.track_deg ?? "–"}°</b></p>
                    {live.registration && <p>Reg: {live.registration}</p>}
                    {live.squawk && <p>Squawk: {live.squawk}</p>}
                    {live.on_ground && <p style={{ color: "#fbbf24" }}>Am Boden</p>}
                    {live.emergency && (
                      <p style={{ color: "#f87171", fontWeight: 700 }}>⚠ {live.emergency}</p>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Altitude badge near helicopter */}
              {!live.on_ground && live.altitude_ft != null && (
                <Marker
                  position={livePos}
                  icon={L.divIcon({
                    html: `<div style="
                      background:rgba(15,23,42,0.82);
                      border:1px solid #ef4444;
                      color:#fca5a5;
                      font-size:10px;
                      font-weight:600;
                      padding:2px 5px;
                      border-radius:4px;
                      white-space:nowrap;
                      margin-left:18px;
                      margin-top:-8px;
                    ">${live.altitude_ft} ft · ${live.ground_speed_kt ?? "–"} kt</div>`,
                    iconSize: [120, 20],
                    iconAnchor: [0, 10],
                    className: "",
                  })}
                  interactive={false}
                />
              )}
            </>
          )}

          {/* Track legend */}
          {trackLine.length > 1 && (
            <div className="leaflet-top leaflet-right" style={{ pointerEvents: "none" }}>
              <div style={{
                background: "rgba(15,23,42,0.85)",
                border: "1px solid #334155",
                borderRadius: 6,
                padding: "6px 10px",
                margin: 10,
                fontSize: 10,
                color: "#94a3b8",
                lineHeight: 1.6,
              }}>
                <div><span style={{ color: "#64748b", fontWeight: 700 }}>—</span> Älter</div>
                <div><span style={{ color: "#f97316", fontWeight: 700 }}>—</span> Mittel</div>
                <div><span style={{ color: "#ef4444", fontWeight: 700 }}>—</span> Aktuell</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* All helicopters view */}
      {showAll &&
        (allLive ?? []).map((ac) => {
          if (!ac.lat || !ac.lon) return null;
          return (
            <Marker
              key={ac.callsign}
              position={[ac.lat, ac.lon]}
              icon={makeHelicopterIcon(ac.track_deg, ac.on_ground)}
            >
              <Popup>
                <div style={{ color: "#e2e8f0", minWidth: 130 }} className="text-xs space-y-1">
                  <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>
                    {fmtCallsign(ac.callsign)}
                  </p>
                  <p style={{ color: "#94a3b8" }}>{ac.callsign}</p>
                  <p>Höhe: <b>{ac.altitude_ft ?? "–"} ft</b></p>
                  <p>Speed: <b>{ac.ground_speed_kt ?? "–"} kt</b></p>
                  {ac.on_ground && <p style={{ color: "#fbbf24" }}>Am Boden</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
