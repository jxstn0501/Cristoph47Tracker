import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const helicopterIcon = L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 4px rgba(239,68,68,0.8))">🚁</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

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

export default function LiveMap({ live, track }) {
  const defaultCenter = [54.09, 13.38]; // Greifswald
  const livePos = live?.lat && live?.lon ? [live.lat, live.lon] : null;

  const trackLine = (track ?? [])
    .filter((p) => p.lat && p.lon)
    .map((p) => [p.lat, p.lon]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={10}
      style={{ height: "100%", width: "100%", minHeight: 380 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trackLine.length > 1 && (
        <Polyline
          positions={trackLine}
          color="#ef4444"
          weight={2.5}
          opacity={0.7}
        />
      )}

      {livePos && (
        <>
          <FlyTo position={livePos} />
          <Marker position={livePos} icon={helicopterIcon}>
            <Popup>
              <div className="text-slate-200 text-xs space-y-1">
                <p className="font-bold text-sm">{live.callsign}</p>
                <p>Höhe: {live.altitude_ft ?? "–"} ft</p>
                <p>Speed: {live.ground_speed_kt ?? "–"} kt</p>
                <p>Kurs: {live.track_deg ?? "–"}°</p>
                {live.squawk && <p>Squawk: {live.squawk}</p>}
                {live.on_ground && (
                  <p className="text-amber-400">Am Boden</p>
                )}
                {live.emergency && (
                  <p className="text-red-400 font-bold">⚠ {live.emergency}</p>
                )}
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
