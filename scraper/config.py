import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://tracker:tracker_secret@localhost:5432/christoph47",
)

POLL_INTERVAL = float(os.environ.get("POLL_INTERVAL", "8"))

# Callsigns to track (Christoph 47 may appear under slight variants)
CALLSIGN_FILTER = os.environ.get("CALLSIGN_FILTER", "CHRISTOPH47")
CALLSIGN_VARIANTS = {c.strip().upper() for c in CALLSIGN_FILTER.split(",")}

# ADS-B Exchange endpoints — reverse-engineered from globe.adsbexchange.com
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
