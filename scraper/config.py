import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://tracker:tracker_secret@localhost:5432/christoph47",
)

POLL_INTERVAL = float(os.environ.get("POLL_INTERVAL", "8"))

# Callsign prefixes for German rescue helicopters.
# Matches any callsign that STARTS WITH one of these strings (case-insensitive).
# Override via env var: RESCUE_PREFIXES=CHRISTOPH,LIBELLE,SAR
_prefix_env = os.environ.get("RESCUE_PREFIXES", "")
if _prefix_env:
    RESCUE_PREFIXES: tuple[str, ...] = tuple(
        p.strip().upper() for p in _prefix_env.split(",") if p.strip()
    )
else:
    RESCUE_PREFIXES = (
        # Primary ADS-B callsign format for German rescue helicopters: CHX + number
        # e.g. CHX47 = Christoph 47, CHX1 = Christoph 1, CHX23 = Christoph 23
        "CHX",          # All numbered Christoph stations (CHX1–CHX99+)
        # Some stations broadcast under alternative prefixes:
        "LIBELLE",      # ADAC Libelle stations (LIBELLE3, LIBELLE7, …)
        "PEGASUS",      # ADAC Pegasus München
        "MARTIN",       # ADAC Martin München Trauma Center
    )

# ADS-B Exchange endpoints
ADSB_BASE = "https://globe.adsbexchange.com"
ADSB_ALL_URL = f"{ADSB_BASE}/re-api/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Referer": f"{ADSB_BASE}/",
    "Accept": "application/json, text/plain, */*",
}
