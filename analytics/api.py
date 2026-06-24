"""
German Rescue Helicopter Analytics REST API (FastAPI)
Provides aggregated flight data for dashboards. All flight endpoints accept
an optional `callsign` query parameter to filter by a specific helicopter.
"""

from datetime import datetime, timezone
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import DATABASE_URL

app = FastAPI(title="Rescue Helicopter Analytics", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def callsign_clause(callsign: Optional[str]) -> tuple[str, dict]:
    """Return a WHERE clause fragment and params dict for callsign filtering."""
    if callsign:
        return "AND callsign ILIKE %(callsign)s", {"callsign": callsign.strip()}
    return "", {}


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/helicopters")
def list_helicopters():
    """
    Return all tracked rescue helicopters with last-seen time and position count.
    Used by the frontend to populate the helicopter selector.
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT
                callsign,
                MAX(time)  AS last_seen,
                MIN(time)  AS first_seen,
                COUNT(*)   AS position_count,
                MAX(lat)   AS last_lat,
                MAX(lon)   AS last_lon
            FROM flight_positions
            WHERE callsign IS NOT NULL
            GROUP BY callsign
            ORDER BY last_seen DESC
        """)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/flights/live")
def live_position(callsign: Optional[str] = Query(default=None)):
    """Most recent known position of the selected helicopter (or all)."""
    cs_clause, cs_params = callsign_clause(callsign)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"""
            SELECT * FROM flight_positions
            WHERE TRUE {cs_clause}
            ORDER BY time DESC
            LIMIT 1
        """, cs_params)
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No live data available")
    return dict(row)


@app.get("/flights/live/all")
def live_all():
    """Most recent position of EVERY tracked helicopter (for the overview map)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT DISTINCT ON (callsign)
                callsign, lat, lon, altitude_ft, ground_speed_kt,
                track_deg, on_ground, time, registration, aircraft_type
            FROM flight_positions
            WHERE callsign IS NOT NULL
              AND time >= NOW() - INTERVAL '15 minutes'
            ORDER BY callsign, time DESC
        """)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/flights/track")
def flight_track(
    hours: float = Query(default=24, ge=0.1, le=720),
    callsign: Optional[str] = Query(default=None),
):
    """Full position track for the last N hours."""
    cs_clause, cs_params = callsign_clause(callsign)
    params = {"hours": hours, **cs_params}
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"""
            SELECT time, lat, lon, altitude_ft, ground_speed_kt, track_deg,
                   vertical_rate, on_ground, squawk, emergency, callsign
            FROM flight_positions
            WHERE time >= NOW() - INTERVAL '1 hour' * %(hours)s
              {cs_clause}
            ORDER BY time ASC
        """, params)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/flights/missions")
def flight_missions(
    days: int = Query(default=30, ge=1, le=365),
    callsign: Optional[str] = Query(default=None),
):
    """
    Detect individual missions by finding gaps > 10 minutes between position
    reports. Returns start/end times and landing coordinates for classification.
    """
    cs_clause, cs_params = callsign_clause(callsign)
    params = {"days": days, **cs_params}
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"""
            WITH positions AS (
                SELECT time, lat, lon, callsign,
                       LAG(time)  OVER (PARTITION BY callsign ORDER BY time) AS prev_time,
                       LEAD(time) OVER (PARTITION BY callsign ORDER BY time) AS next_time,
                       LEAD(lat)  OVER (PARTITION BY callsign ORDER BY time) AS next_lat,
                       LEAD(lon)  OVER (PARTITION BY callsign ORDER BY time) AS next_lon
                FROM flight_positions
                WHERE time >= NOW() - INTERVAL '1 day' * %(days)s
                  AND callsign IS NOT NULL
                  {cs_clause}
            ),
            starts AS (
                SELECT callsign, time AS start_time, lat AS start_lat, lon AS start_lon,
                       ROW_NUMBER() OVER (PARTITION BY callsign ORDER BY time) AS rn
                FROM positions
                WHERE prev_time IS NULL
                   OR EXTRACT(EPOCH FROM (time - prev_time)) > 600
            ),
            ends AS (
                SELECT callsign, time AS end_time, lat AS end_lat, lon AS end_lon,
                       ROW_NUMBER() OVER (PARTITION BY callsign ORDER BY time) AS rn
                FROM positions
                WHERE next_time IS NULL
                   OR EXTRACT(EPOCH FROM (next_time - time)) > 600
            )
            SELECT
                s.callsign,
                s.rn AS mission_id,
                s.start_time, s.start_lat, s.start_lon,
                e.end_time,   e.end_lat,   e.end_lon
            FROM starts s
            JOIN ends e ON s.callsign = e.callsign AND s.rn = e.rn
            ORDER BY s.start_time DESC
            LIMIT 100
        """, params)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/stats/daily")
def daily_stats(
    days: int = Query(default=30, ge=1, le=365),
    callsign: Optional[str] = Query(default=None),
):
    """Daily flight statistics aggregated per calendar day."""
    cs_clause, cs_params = callsign_clause(callsign)
    params = {"days": days, **cs_params}
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"""
            SELECT
                time_bucket('1 day', time) AS day,
                COUNT(*) AS position_count,
                MAX(altitude_ft) AS max_altitude_ft,
                ROUND(AVG(ground_speed_kt)::numeric, 1) AS avg_speed_kt,
                SUM(CASE WHEN emergency IS NOT NULL THEN 1 ELSE 0 END) AS emergency_count
            FROM flight_positions
            WHERE time >= NOW() - INTERVAL '1 day' * %(days)s
              {cs_clause}
            GROUP BY day
            ORDER BY day DESC
        """, params)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/stats/summary")
def summary(callsign: Optional[str] = Query(default=None)):
    """Overall tracker statistics for the selected helicopter (or all)."""
    cs_clause, cs_params = callsign_clause(callsign)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"""
            SELECT
                COUNT(*) AS total_positions,
                MIN(time) AS tracking_since,
                MAX(time) AS last_seen,
                MAX(altitude_ft) AS max_altitude_ft,
                ROUND(AVG(ground_speed_kt)::numeric, 1) AS avg_speed_kt,
                SUM(CASE WHEN emergency IS NOT NULL THEN 1 ELSE 0 END) AS emergency_events
            FROM flight_positions
            WHERE TRUE {cs_clause}
        """, cs_params)
        row = cur.fetchone()
    return dict(row)


@app.get("/aircraft")
def known_aircraft():
    """All known aircraft identities."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM known_aircraft ORDER BY last_seen DESC")
        rows = cur.fetchall()
    return [dict(r) for r in rows]
