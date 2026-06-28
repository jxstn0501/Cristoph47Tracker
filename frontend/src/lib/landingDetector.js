// -----------------------------------------------------------------------
// KNOWN SITES: Christoph RTH-Stationen + Krankenhäuser mit Hubschrauberlandeplatz
// Koordinaten aus offiziellen Quellen (ADAC, DRF, Overture Maps / OSM).
// Radius für Bases kleiner (400 m), für Krankenhäuser großzügiger (1000 m),
// da Helikoptervorfeldflächen bei Krankenhäusern teils weit vom Hauptgebäude liegen.
// -----------------------------------------------------------------------

// Alle deutschen Christoph-RTH-Stationen (CHX-Callsign + einige Sonderstationen)
const CHRISTOPH_BASES = [
  // ── Norddeutschland ──────────────────────────────────────────────────
  { name: "Christoph 47 – Greifswald",         lat: 54.1007, lon: 13.4005 },
  { name: "Christoph 27 – Rostock",             lat: 54.0640, lon: 12.0991 },
  { name: "Christoph 36 – Güstrow",             lat: 53.7978, lon: 12.1612 },
  { name: "Christoph 44 – Neubrandenburg",      lat: 53.5537, lon: 13.2707 },
  { name: "Christoph 13 – Sande (Friesland)",   lat: 53.6008, lon:  7.9939 },
  { name: "Christoph 32 – Flensburg/Harrislee", lat: 54.7785, lon:  9.3730 },
  { name: "Christoph 38 – Rendsburg",           lat: 54.2860, lon:  9.6620 },
  { name: "Christoph 4 – Hannover (MHH)",       lat: 52.3832, lon:  9.8041 },
  { name: "Christoph 35 – Bremen",              lat: 53.0748, lon:  8.7880 },
  { name: "Christoph 46 – Hildesheim",          lat: 52.1430, lon:  9.9600 },
  { name: "Christoph 55 – Wolfsburg",           lat: 52.4370, lon: 10.7830 },
  { name: "Christoph 49 – Wolfenbüttel",        lat: 52.1630, lon: 10.5380 },
  // ── Berlin / Brandenburg / Sachsen-Anhalt ────────────────────────────
  { name: "Christoph 31 – Berlin (Unfallkrankenhaus)", lat: 52.4800, lon: 13.5477 },
  { name: "Christoph 61 – Berlin-Mitte (Charité)", lat: 52.5299, lon: 13.3781 },
  { name: "Christoph 50 – Cottbus",             lat: 51.7730, lon: 14.3140 },
  { name: "Christoph 42 – Magdeburg",           lat: 52.1210, lon: 11.6230 },
  { name: "Christoph 51 – Senftenberg",         lat: 51.5300, lon: 13.9600 },
  // ── Mecklenburg-Vorpommern weitere ───────────────────────────────────
  { name: "Christoph 48 – Ulm (RKU)",           lat: 48.4160, lon:  9.9490 },
  // ── Thüringen / Sachsen ──────────────────────────────────────────────
  { name: "Christoph 22 – Dresden",             lat: 51.0600, lon: 13.7400 },
  { name: "Christoph 37 – Bautzen",             lat: 51.1810, lon: 14.4340 },
  { name: "Christoph 39 – Gera",                lat: 50.8830, lon: 12.0810 },
  { name: "Christoph 40 – Suhl",                lat: 50.6090, lon: 10.6940 },
  { name: "Christoph 41 – Nordhausen",          lat: 51.5090, lon: 10.7910 },
  { name: "Christoph 43 – Erfurt",              lat: 50.9780, lon: 11.0290 },
  // ── Hessen / NRW / Rheinland-Pfalz ──────────────────────────────────
  { name: "Christoph 7 – Kassel",               lat: 51.3160, lon:  9.4710 },
  { name: "Christoph 8 – Bad Arolsen",          lat: 51.3760, lon:  8.9980 },
  { name: "Christoph 9 – Bad Homburg",          lat: 50.2280, lon:  8.6210 },
  { name: "Christoph 3 – Köln-Bonn",            lat: 50.8660, lon:  7.1427 },
  { name: "Christoph 53 – Siegen",              lat: 50.8630, lon:  8.0260 },
  { name: "Christoph 54 – Düsseldorf",          lat: 51.2580, lon:  6.7800 },
  { name: "Christoph 14 – Koblenz",             lat: 50.3750, lon:  7.6010 },
  { name: "Christoph 23 – Wittlich",            lat: 49.9868, lon:  6.8697 },
  { name: "Christoph 29 – Mainz",               lat: 49.9840, lon:  8.2620 },
  // ── Saarland / Baden-Württemberg ─────────────────────────────────────
  { name: "Christoph 16 – Saarbrücken",         lat: 49.2740, lon:  6.9260 },
  { name: "Christoph 11 – Mühlheim/Frankfurt",  lat: 50.1210, lon:  8.7590 },
  { name: "Christoph 45 – Friedrichshafen",     lat: 47.6710, lon:  9.5110 },
  // ── Bayern ───────────────────────────────────────────────────────────
  { name: "Christoph 1 – Frankfurt (Unfallklinik)", lat: 50.0461, lon: 8.7573 },
  { name: "Christoph 2 – Lohr am Main",         lat: 49.9930, lon:  9.5660 },
  { name: "Christoph 5 – Ludwigshafen",         lat: 49.4810, lon:  8.4040 },
  { name: "Christoph 6 – Nürnberg",             lat: 49.4980, lon: 11.0430 },
  { name: "Christoph 10 – Wiesbaden",           lat: 50.0820, lon:  8.2340 },
  { name: "Christoph 12 – Haßfurt",             lat: 50.0350, lon: 10.5110 },
  { name: "Christoph 15 – Straubing",           lat: 48.8910, lon: 12.5680 },
  { name: "Christoph 17 – Augsburg",            lat: 48.3720, lon: 10.9280 },
  { name: "Christoph 18 – Ochsenfurt",          lat: 49.6680, lon: 10.0730 },
  { name: "Christoph 19 – Göttingen",           lat: 51.5330, lon:  9.9200 },
  { name: "Christoph 20 – Bayreuth",            lat: 49.9420, lon: 11.5730 },
  { name: "Christoph 21 – Regensburg",          lat: 49.0210, lon: 12.0740 },
  { name: "Christoph 24 – Nürnberg (DRF)",      lat: 49.4450, lon: 11.0950 },
  { name: "Christoph 25 – München Bogenhausen", lat: 48.1300, lon: 11.6140 },
  { name: "Christoph 26 – Dinkelsbühl",         lat: 49.0760, lon: 10.3250 },
  { name: "Christoph 28 – Erfurt-Frienstedt",   lat: 51.0400, lon: 10.9600 },
  { name: "Christoph 30 – Ingolstadt",          lat: 48.7710, lon: 11.4320 },
  { name: "Christoph 33 – Regen",               lat: 48.9710, lon: 13.1360 },
  { name: "Christoph 60 – München (MHM)",       lat: 48.1760, lon: 11.6000 },
  { name: "Christoph 65 – Traunstein",          lat: 47.8700, lon: 12.6450 },
  { name: "Christoph 77 – München BG Unfallklinik", lat: 48.1070, lon: 11.5360 },
  // ── SAR / Bundeswehr / Sonderstationen ───────────────────────────────
  { name: "SAR Hamburg (Flughafen)",            lat: 53.6304, lon: 10.0056 },
  { name: "SAR Holzdorf",                       lat: 51.7878, lon: 13.1671 },
  { name: "SAR Laage",                          lat: 54.0157, lon: 12.3024 },
  { name: "SAR Niederstetten",                  lat: 49.3907, lon:  9.9585 },
  { name: "SAR Nörvenich",                      lat: 50.8318, lon:  6.6587 },
];

// Krankenhäuser und Kliniken mit Hubschrauberlandeplatz (deutlich erweitert)
const HOSPITALS = [
  // ── Mecklenburg-Vorpommern ────────────────────────────────────────────
  { name: "Universitätsmedizin Greifswald",           lat: 54.0870, lon: 13.3835 },
  { name: "Helios Hanseklinikum Stralsund",            lat: 54.3155, lon: 13.0725 },
  { name: "Klinikum Karlsburg (Herzzentrum)",          lat: 54.0345, lon: 13.4170 },
  { name: "Klinikum Wolgast",                          lat: 54.0543, lon: 13.7665 },
  { name: "Universitätsklinikum Rostock",              lat: 54.0774, lon: 12.1003 },
  { name: "Klinikum Südstadt Rostock",                 lat: 54.0640, lon: 12.0991 },
  { name: "Helios Kliniken Schwerin",                  lat: 53.6307, lon: 11.4160 },
  { name: "Dietrich-Bonhoeffer-Klinikum Neubrandenburg", lat: 53.5537, lon: 13.2707 },
  { name: "Klinikum Güstrow",                          lat: 53.7978, lon: 12.1612 },
  { name: "Klinikum Demmin",                           lat: 53.9055, lon: 13.0450 },
  { name: "Klinikum Pasewalk",                         lat: 53.5070, lon: 14.0040 },
  { name: "Klinikum Anklam",                           lat: 53.8615, lon: 13.7000 },
  { name: "Klinikum Usedom Heringsdorf",               lat: 53.9610, lon: 14.1560 },
  { name: "HELIOS Klinikum Waren (Müritz)",            lat: 53.5179, lon: 12.6802 },
  { name: "Ameos Klinikum Ueckermünde",                lat: 53.7398, lon: 14.0526 },
  // ── Brandenburg ──────────────────────────────────────────────────────
  { name: "Klinikum Ernst von Bergmann Potsdam",       lat: 52.4017, lon: 13.0590 },
  { name: "Klinikum Frankfurt (Oder)",                  lat: 52.3456, lon: 14.5580 },
  { name: "Carl-Thiem-Klinikum Cottbus",               lat: 51.7630, lon: 14.3180 },
  { name: "Klinikum Niederlausitz Senftenberg",        lat: 51.5255, lon: 13.9644 },
  { name: "Ruppiner Kliniken Neuruppin",               lat: 52.9246, lon: 12.8079 },
  { name: "Lausitz Klinik Forst",                      lat: 51.7312, lon: 14.6390 },
  { name: "Städtisches Klinikum Brandenburg",          lat: 52.4156, lon: 12.5415 },
  // ── Berlin ────────────────────────────────────────────────────────────
  { name: "Charité – Virchow-Klinikum Berlin",         lat: 52.5432, lon: 13.3419 },
  { name: "Unfallkrankenhaus Berlin (ukb)",            lat: 52.4800, lon: 13.5477 },
  { name: "Charité – Campus Benjamin Franklin",        lat: 52.4470, lon: 13.3094 },
  { name: "Charité – Campus Mitte",                    lat: 52.5299, lon: 13.3781 },
  { name: "HELIOS Klinikum Emil von Behring Berlin",   lat: 52.4434, lon: 13.2548 },
  { name: "DRK Kliniken Berlin Westend",               lat: 52.5133, lon: 13.2764 },
  // ── Sachsen ───────────────────────────────────────────────────────────
  { name: "Universitätsklinikum Dresden (UKD)",        lat: 51.0531, lon: 13.7586 },
  { name: "HELIOS Park-Klinikum Leipzig",              lat: 51.3432, lon: 12.3774 },
  { name: "Universitätsklinikum Leipzig (UKL)",        lat: 51.3337, lon: 12.3764 },
  { name: "Klinikum Chemnitz",                         lat: 50.8270, lon: 12.9238 },
  { name: "Klinikum Zwickau",                          lat: 50.7263, lon: 12.4857 },
  { name: "Klinikum Bautzen",                          lat: 51.1810, lon: 14.4340 },
  { name: "Kreiskrankenhaus Zittau",                   lat: 50.8989, lon: 14.8104 },
  // ── Sachsen-Anhalt ────────────────────────────────────────────────────
  { name: "Universitätsklinikum Halle (Saale)",        lat: 51.4927, lon: 11.9599 },
  { name: "Universitätsklinikum Magdeburg (UKM)",      lat: 52.1210, lon: 11.6230 },
  { name: "BG Klinikum Bergmannstrost Halle",          lat: 51.4788, lon: 11.9655 },
  { name: "Klinikum Dessau",                           lat: 51.8370, lon: 12.2380 },
  // ── Thüringen ─────────────────────────────────────────────────────────
  { name: "Universitätsklinikum Jena (UKJ)",           lat: 50.9209, lon: 11.5872 },
  { name: "HELIOS Klinikum Erfurt",                    lat: 50.9780, lon: 11.0290 },
  { name: "SRH Waldklinikum Gera",                     lat: 50.8830, lon: 12.0810 },
  { name: "Klinikum Suhl",                             lat: 50.6090, lon: 10.6940 },
  { name: "Klinikum Nordhausen",                       lat: 51.5090, lon: 10.7910 },
  // ── Niedersachsen ─────────────────────────────────────────────────────
  { name: "Medizinische Hochschule Hannover (MHH)",    lat: 52.3832, lon:  9.8041 },
  { name: "Klinikum Region Hannover Nordstadt",        lat: 52.3888, lon:  9.7470 },
  { name: "BG Klinikum Hannover",                      lat: 52.3340, lon:  9.7770 },
  { name: "Klinikum Braunschweig",                     lat: 52.2669, lon: 10.5144 },
  { name: "Universitätsklinikum Göttingen (UMG)",      lat: 51.5330, lon:  9.9200 },
  { name: "Klinikum Hildesheim",                       lat: 52.1430, lon:  9.9600 },
  { name: "Klinikum Wolfsburg",                        lat: 52.4370, lon: 10.7830 },
  { name: "Klinikum Lüneburg",                         lat: 53.2434, lon: 10.4133 },
  { name: "Klinikum Osnabrück",                        lat: 52.2764, lon:  8.0446 },
  // ── Schleswig-Holstein ────────────────────────────────────────────────
  { name: "UKSH Campus Kiel",                          lat: 54.3342, lon: 10.1360 },
  { name: "UKSH Campus Lübeck",                        lat: 53.8448, lon: 10.7124 },
  { name: "Westküstenklinikum Heide",                  lat: 54.1955, lon:  9.0946 },
  { name: "Klinikum Flensburg",                        lat: 54.7785, lon:  9.3730 },
  { name: "Friedrich-Ebert-Krankenhaus Neumünster",    lat: 54.0747, lon:  9.9873 },
  // ── Hamburg ───────────────────────────────────────────────────────────
  { name: "Universitätsklinikum Hamburg-Eppendorf (UKE)", lat: 53.5893, lon: 9.9770 },
  { name: "BG Klinikum Hamburg",                       lat: 53.5509, lon: 10.0195 },
  { name: "Asklepios Klinik Altona",                   lat: 53.5547, lon:  9.9356 },
  { name: "Asklepios Klinik St. Georg Hamburg",        lat: 53.5601, lon: 10.0129 },
  // ── Bremen ────────────────────────────────────────────────────────────
  { name: "Klinikum Bremen-Mitte",                     lat: 53.0748, lon:  8.7880 },
  { name: "Klinikum Bremerhaven",                      lat: 53.5478, lon:  8.5929 },
  // ── NRW ──────────────────────────────────────────────────────────────
  { name: "Universitätsklinikum Köln",                 lat: 50.9235, lon:  6.9197 },
  { name: "Universitätsklinikum Düsseldorf (UKD)",     lat: 51.1892, lon:  6.7981 },
  { name: "Universitätsklinikum Essen",                lat: 51.4302, lon:  7.0081 },
  { name: "BG Universitätsklinikum Bergmannsheil Bochum", lat: 51.4794, lon:  7.2105 },
  { name: "Universitätsklinikum Münster (UKM)",        lat: 51.9607, lon:  7.5964 },
  { name: "Universitätsklinikum Aachen (UKA)",         lat: 50.7733, lon:  6.0375 },
  { name: "Klinikum Dortmund",                         lat: 51.5190, lon:  7.4510 },
  { name: "HELIOS Klinikum Wuppertal",                 lat: 51.2619, lon:  7.1756 },
  { name: "Lukaskrankenhaus Neuss",                    lat: 51.1953, lon:  6.6834 },
  // ── Hessen ────────────────────────────────────────────────────────────
  { name: "Universitätsklinikum Frankfurt (Goethe)",   lat: 50.0940, lon:  8.6516 },
  { name: "BG Unfallklinik Frankfurt",                 lat: 50.0461, lon:  8.7573 },
  { name: "Klinikum Kassel (KKH)",                     lat: 51.3160, lon:  9.4710 },
  { name: "Universitätsklinikum Gießen (UKGM)",        lat: 50.5814, lon:  8.6724 },
  { name: "Universitätsklinikum Marburg (UKGM)",       lat: 50.8146, lon:  8.7690 },
  { name: "Klinikum Fulda",                            lat: 50.5503, lon:  9.6855 },
  // ── Rheinland-Pfalz / Saarland ───────────────────────────────────────
  { name: "Universitätsmedizin Mainz",                 lat: 49.9980, lon:  8.2672 },
  { name: "BG Klinik Ludwigshafen",                    lat: 49.4810, lon:  8.4040 },
  { name: "Universitätsklinikum des Saarlandes (UKS)", lat: 49.2477, lon:  7.1071 },
  { name: "Klinikum Koblenz (Bundeswehrzentralkrankenhaus)", lat: 50.3750, lon: 7.6010 },
  // ── Baden-Württemberg ─────────────────────────────────────────────────
  { name: "Universitätsklinikum Freiburg",             lat: 47.9992, lon:  7.8421 },
  { name: "Universitätsklinikum Heidelberg",           lat: 49.4158, lon:  8.6693 },
  { name: "Universitätsklinikum Ulm",                  lat: 48.4216, lon:  9.9562 },
  { name: "BG Klinik Tübingen",                        lat: 48.5310, lon:  9.0477 },
  { name: "Klinikum Stuttgart (Katharinenhospital)",   lat: 48.7783, lon:  9.1802 },
  { name: "BG Klinik Ludwigshafen",                    lat: 49.4810, lon:  8.4040 },
  { name: "SRH Klinikum Karlsbad-Langensteinbach",     lat: 48.9346, lon:  8.3935 },
  // ── Bayern ────────────────────────────────────────────────────────────
  { name: "Universitätsklinikum München – Großhadern", lat: 48.1129, lon: 11.4683 },
  { name: "Klinikum rechts der Isar München (TUM)",    lat: 48.1358, lon: 11.5985 },
  { name: "Universitätsklinikum Augsburg",             lat: 48.3720, lon: 10.9280 },
  { name: "Universitätsklinikum Regensburg (UKR)",     lat: 49.0210, lon: 12.0740 },
  { name: "Universitätsklinikum Würzburg",             lat: 49.7984, lon:  9.9723 },
  { name: "Klinikum Nürnberg",                         lat: 49.4380, lon: 11.1196 },
  { name: "BG Unfallklinik Murnau",                    lat: 47.6790, lon: 11.2010 },
  { name: "Klinikum Ingolstadt",                       lat: 48.7710, lon: 11.4320 },
  { name: "Klinikum Bayreuth",                         lat: 49.9420, lon: 11.5730 },
  { name: "Klinikum Straubing",                        lat: 48.8910, lon: 12.5680 },
  { name: "Klinikum Passau",                           lat: 48.5806, lon: 13.4620 },
  { name: "Klinikum Traunstein",                       lat: 47.8700, lon: 12.6450 },
  { name: "Klinikum Garmisch-Partenkirchen",           lat: 47.4874, lon: 11.1075 },
];

// Radius in Metern für die Klassifizierung
const BASE_RADIUS_M     = 450;   // Heimatbasen: präzise (Abstellfläche bekannt)
const HOSPITAL_RADIUS_M = 1200;  // Krankenhäuser: großzügiger (Helipad variiert)

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6_371_000;
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

  // 1. Heimatbasis prüfen (engerer Radius)
  let closestBase = null;
  let closestBaseDist = Infinity;
  for (const site of CHRISTOPH_BASES) {
    const dist = haversineM(lat, lon, site.lat, site.lon);
    if (dist < closestBaseDist) {
      closestBaseDist = dist;
      closestBase = site;
    }
  }
  if (closestBaseDist <= BASE_RADIUS_M) {
    return { type: "Heimatbasis", name: closestBase.name, distM: Math.round(closestBaseDist) };
  }

  // 2. Krankenhaus prüfen (weiterer Radius)
  let closestHosp = null;
  let closestHospDist = Infinity;
  for (const site of HOSPITALS) {
    const dist = haversineM(lat, lon, site.lat, site.lon);
    if (dist < closestHospDist) {
      closestHospDist = dist;
      closestHosp = site;
    }
  }
  if (closestHospDist <= HOSPITAL_RADIUS_M) {
    return { type: "Krankenhaus", name: closestHosp.name, distM: Math.round(closestHospDist) };
  }

  return { type: "Außenlandung", name: null, distM: null };
}

// Gibt den Heimatstandort eines Callsigns zurück (z.B. "CHX47" → Greifswald-Eintrag)
export function getHomeBase(callsign) {
  if (!callsign) return null;
  const upper = callsign.trim().toUpperCase();
  const match = upper.match(/^CHX(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const keyword = `Christoph ${num} –`;
  return CHRISTOPH_BASES.find(b => b.name.startsWith(keyword)) ?? null;
}
