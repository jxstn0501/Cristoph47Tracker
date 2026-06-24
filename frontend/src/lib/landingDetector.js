// Known helipads and hospitals in Northeast Germany reachable by Christoph 47
const KNOWN_SITES = [
  // Mecklenburg-Vorpommern
  { name: "Universitätsmedizin Greifswald", lat: 54.0870, lon: 13.3835, type: "Krankenhaus" },
  { name: "Helios Hanseklinikum Stralsund", lat: 54.3155, lon: 13.0725, type: "Krankenhaus" },
  { name: "Klinikum Karlsburg (Herzzentrum)", lat: 54.0345, lon: 13.4170, type: "Krankenhaus" },
  { name: "Wolgaster Krankenhaus", lat: 54.0543, lon: 13.7665, type: "Krankenhaus" },
  { name: "Universitätsklinikum Rostock", lat: 54.0774, lon: 12.1003, type: "Krankenhaus" },
  { name: "Klinikum Südstadt Rostock", lat: 54.0640, lon: 12.0991, type: "Krankenhaus" },
  { name: "Helios Kliniken Schwerin", lat: 53.6307, lon: 11.4160, type: "Krankenhaus" },
  { name: "Dietrich-Bonhoeffer-Klinikum Neubrandenburg", lat: 53.5537, lon: 13.2707, type: "Krankenhaus" },
  { name: "Klinikum Güstrow", lat: 53.7978, lon: 12.1612, type: "Krankenhaus" },
  { name: "Klinikum Demmin", lat: 53.9055, lon: 13.0450, type: "Krankenhaus" },
  { name: "Klinikum Pasewalk", lat: 53.5070, lon: 14.0040, type: "Krankenhaus" },
  { name: "Klinikum Anklam", lat: 53.8615, lon: 13.7000, type: "Krankenhaus" },
  // Brandenburg
  { name: "Klinikum Ernst von Bergmann Potsdam", lat: 52.4017, lon: 13.0590, type: "Krankenhaus" },
  { name: "Klinikum Frankfurt (Oder)", lat: 52.3456, lon: 14.5580, type: "Krankenhaus" },
  // Berlin
  { name: "Charité – Virchow-Klinikum", lat: 52.5432, lon: 13.3419, type: "Krankenhaus" },
  { name: "Unfallkrankenhaus Berlin", lat: 52.4800, lon: 13.5477, type: "Krankenhaus" },
  { name: "Charité – Campus Benjamin Franklin", lat: 52.4470, lon: 13.3094, type: "Krankenhaus" },
  // Hamburg
  { name: "UKE Hamburg", lat: 53.5893, lon: 9.9770, type: "Krankenhaus" },
  { name: "BG Klinikum Hamburg", lat: 53.5509, lon: 10.0195, type: "Krankenhaus" },
  // Schleswig-Holstein / Usedom
  { name: "Klinikum Greifswald Heringsdorf", lat: 53.9610, lon: 14.1560, type: "Krankenhaus" },
  // Heimatstandort
  { name: "Christoph 47 Basis (Greifswald)", lat: 54.1007, lon: 13.4005, type: "Heimatbasis" },
];

const RADIUS_M = 600;

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function classifyLanding(lat, lon) {
  if (lat == null || lon == null) return { type: "Unbekannt", name: null };

  let closest = null;
  let closestDist = Infinity;

  for (const site of KNOWN_SITES) {
    const dist = haversineM(lat, lon, site.lat, site.lon);
    if (dist < closestDist) {
      closestDist = dist;
      closest = site;
    }
  }

  if (closestDist <= RADIUS_M) {
    return { type: closest.type, name: closest.name, distM: Math.round(closestDist) };
  }

  return { type: "Außenlandung", name: null, distM: null };
}
