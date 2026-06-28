"""
German Rescue Helicopter ADS-B Scraper Daemon
Polls globe.adsbexchange.com and stores flight data to TimescaleDB.
Tracks all German rescue helicopters (Christoph, Libelle, Pegasus, …).
"""

import json
import logging
import signal
import sys
import time
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras
import requests

from config import (
    ADSB_ALL_URL,
    DATABASE_URL,
    HEADERS,
    POLL_INTERVAL,
    RESCUE_PREFIXES,
)
from models import (
    CREATE_AIRCRAFT_CACHE,
    CREATE_EXTENSION,
    CREATE_FLIGHTS_TABLE,
    CREATE_HYPERTABLE,
    CREATE_INDEX_CALLSIGN,
    CREATE_INDEX_ICAO,
    INSERT_POSITION,
    UPSERT_AIRCRAFT,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("rescue-scraper")

_running = True


def handle_signal(sig, frame):
    global _running
    log.info("Shutdown signal received, stopping...")
    _running = False


signal.signal(signal.SIGTERM, handle_signal)
signal.signal(signal.SIGINT, handle_signal)


def init_db(conn):
    with conn.cursor() as cur:
        cur.execute(CREATE_EXTENSION)
        cur.execute(CREATE_FLIGHTS_TABLE)
        cur.execute(CREATE_HYPERTABLE)
        cur.execute(CREATE_INDEX_ICAO)
        cur.execute(CREATE_INDEX_CALLSIGN)
        cur.execute(CREATE_AIRCRAFT_CACHE)
    conn.commit()
    log.info("Database schema ready")


def fetch_all_aircraft(session: requests.Session) -> list[dict]:
    """Fetch all aircraft from ADS-B Exchange globe API."""
    try:
        resp = session.get(ADSB_ALL_URL, params={"all": ""}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("aircraft", [])
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            log.warning("Rate limited by ADS-B Exchange, backing off 30s")
            time.sleep(30)
        else:
            log.error("HTTP error fetching aircraft: %s", e)
        return []
    except (requests.RequestException, json.JSONDecodeError) as e:
        log.error("Error fetching aircraft data: %s", e)
        return []


def is_rescue_helicopter(callsign: str) -> bool:
    """Return True if callsign matches a known German rescue helicopter prefix."""
    cs = callsign.strip().upper()
    return any(cs.startswith(prefix) for prefix in RESCUE_PREFIXES)


def filter_rescue(aircraft_list: list[dict]) -> list[dict]:
    """Return only aircraft whose callsign matches a rescue helicopter prefix."""
    results = []
    for ac in aircraft_list:
        callsign = (ac.get("flight") or ac.get("r") or "").strip()
        if callsign and is_rescue_helicopter(callsign):
            results.append(ac)
    return results


def parse_aircraft(ac: dict, ts: datetime) -> dict:
    """Map raw ADS-B Exchange aircraft dict to our DB row schema."""

    def _int(val):
        try:
            return int(val) if val is not None else None
        except (TypeError, ValueError):
            return None

    def _float(val):
        try:
            return float(val) if val is not None else None
        except (TypeError, ValueError):
            return None

    altitude_raw = ac.get("alt_baro")
    altitude_ft = None
    if altitude_raw is not None and altitude_raw != "ground":
        altitude_ft = _int(altitude_raw)

    # Primary signal: ADS-B "ground" flag or alt_baro == "ground"
    # Secondary: very low altitude (<  50 ft) + near-zero speed → treat as on-ground
    #            This handles transponders that don't set the ground bit correctly.
    gs = _float(ac.get("gs")) or 0.0
    vr = abs(_int(ac.get("baro_rate") or ac.get("geom_rate")) or 0)
    adsb_ground = altitude_raw == "ground" or bool(ac.get("ground"))
    low_and_slow = (altitude_ft is not None and altitude_ft < 50 and gs < 5 and vr < 100)
    on_ground = adsb_ground or low_and_slow

    emergency = ac.get("emergency")
    if emergency in ("none", "", None):
        emergency = None

    return {
        "time": ts,
        "icao_hex": (ac.get("hex") or "").strip().upper(),
        "callsign": (ac.get("flight") or "").strip() or None,
        "lat": _float(ac.get("lat")),
        "lon": _float(ac.get("lon")),
        "altitude_ft": altitude_ft,
        "altitude_geom": _int(ac.get("alt_geom")),
        "ground_speed_kt": _float(ac.get("gs")),
        "track_deg": _float(ac.get("track")),
        "vertical_rate": _int(ac.get("baro_rate") or ac.get("geom_rate")),
        "squawk": ac.get("squawk") or None,
        "aircraft_type": ac.get("t") or None,
        "registration": ac.get("r") or None,
        "flight": (ac.get("flight") or "").strip() or None,
        "on_ground": on_ground,
        "emergency": emergency,
        "category": ac.get("category") or None,
        "messages": _int(ac.get("messages")),
        "seen": _float(ac.get("seen")),
        "rssi": _float(ac.get("rssi")),
    }


def store_positions(conn, rows: list[dict]):
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, INSERT_POSITION, rows)
        for row in rows:
            if row["icao_hex"]:
                psycopg2.extras.execute_batch(
                    cur,
                    UPSERT_AIRCRAFT,
                    [{
                        "icao_hex": row["icao_hex"],
                        "callsign": row["callsign"],
                        "registration": row["registration"],
                        "aircraft_type": row["aircraft_type"],
                    }],
                )
    conn.commit()


def run():
    log.info("German rescue helicopter ADS-B scraper starting")
    log.info("Tracking prefixes: %s", RESCUE_PREFIXES)
    log.info("Poll interval: %.1fs", POLL_INTERVAL)

    conn = None
    for attempt in range(10):
        try:
            conn = psycopg2.connect(DATABASE_URL)
            break
        except psycopg2.OperationalError as e:
            wait = 2 ** attempt
            log.warning("DB connection failed (attempt %d), retrying in %ds: %s", attempt + 1, wait, e)
            time.sleep(wait)

    if conn is None:
        log.error("Could not connect to database after 10 attempts, exiting")
        sys.exit(1)

    init_db(conn)

    session = requests.Session()
    session.headers.update(HEADERS)

    known_icao: set[str] = set()
    total_stored = 0

    while _running:
        loop_start = time.monotonic()
        ts = datetime.now(timezone.utc)

        aircraft_list = fetch_all_aircraft(session)
        matches = filter_rescue(aircraft_list)

        if matches:
            rows = [parse_aircraft(ac, ts) for ac in matches]
            rows = [r for r in rows if r["lat"] is not None and r["lon"] is not None]

            for r in rows:
                if r["icao_hex"] and r["icao_hex"] not in known_icao:
                    known_icao.add(r["icao_hex"])
                    log.info(
                        "Discovered %s | ICAO: %s | Reg: %s | Type: %s",
                        r["callsign"], r["icao_hex"], r["registration"], r["aircraft_type"],
                    )

            if rows:
                callsigns = {r["callsign"] for r in rows if r["callsign"]}
                try:
                    store_positions(conn, rows)
                    total_stored += len(rows)
                    log.info(
                        "Stored %d position(s) for %s | total=%d",
                        len(rows), sorted(callsigns), total_stored,
                    )
                except psycopg2.Error as e:
                    log.error("DB write error: %s", e)
                    conn.rollback()
                    try:
                        conn = psycopg2.connect(DATABASE_URL)
                        log.info("Reconnected to database")
                    except psycopg2.OperationalError:
                        pass
        else:
            log.debug("No rescue helicopters currently visible")

        elapsed = time.monotonic() - loop_start
        sleep_time = max(0.0, POLL_INTERVAL - elapsed)
        if _running and sleep_time > 0:
            time.sleep(sleep_time)

    if conn:
        conn.close()
    log.info("Scraper stopped. Total positions stored: %d", total_stored)


if __name__ == "__main__":
    run()
