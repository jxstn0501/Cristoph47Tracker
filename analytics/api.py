"""
Christoph 47 Analytics REST API (FastAPI)
Provides aggregated flight data for dashboards.
"""

from datetime import datetime, timezone
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import DATABASE_URL

app = FastAPI(title="Christoph 47 Analytics", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/flights/live")
def live_position():
    """Most recent known position of Christoph 47."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT * FROM flight_positions
            WHERE callsign ILIKE 'CHRISTOPH47%'
            ORDER BY time DESC
            LIMIT 1
        """)
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No live data available")
    return dict(row)


@app.get("/flights/track")
def flight_track(
    hours: float = Query(default=24, ge=0.1, le=720),
):
    """Full position track for the last N hours."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT time, lat, lon, altitude_ft, ground_speed_kt, track_deg,
                   vertical_rate, on_ground, squawk, emergency
            FROM flight_positions
            WHERE callsign ILIKE 'CHRISTOPH47%'
              AND time >= NOW() - INTERVAL '1 hour' * %(hours)s
            ORDER BY time ASC
        """, {"hours": hours})
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/flights/missions")
def flight_missions(
    days: int = Query(default=30, ge=1, le=365),
):
    """
    Detect individual missions by finding gaps > 10 minutes between position
    reports. Returns start/end times and landing coordinates for classification.
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            WITH positions AS (
                SELECT time, lat, lon,
                       LAG(time)  OVER (ORDER BY time) AS prev_time,
                       LEAD(time) OVER (ORDER BY time) AS next_time,
                       LEAD(lat)  OVER (ORDER BY time) AS next_lat,
                       LEAD(lon)  OVER (ORDER BY time) AS next_lon
                FROM flight_positions
                WHERE callsign ILIKE 'CHRISTOPH47%%'
                  AND time >= NOW() - INTERVAL '1 day' * %(days)s
            ),
            starts AS (
                SELECT time AS start_time, lat AS start_lat, lon AS start_lon,
                       ROW_NUMBER() OVER (ORDER BY time) AS rn
                FROM positions
                WHERE prev_time IS NULL
                   OR EXTRACT(EPOCH FROM (time - prev_time)) > 600
            ),
            ends AS (
                SELECT time AS end_time, lat AS end_lat, lon AS end_lon,
                       ROW_NUMBER() OVER (ORDER BY time) AS rn
                FROM positions
                WHERE next_time IS NULL
                   OR EXTRACT(EPOCH FROM (next_time - time)) > 600
            )
            SELECT
                s.rn AS mission_id,
                s.start_time, s.start_lat, s.start_lon,
                e.end_time,   e.end_lat,   e.end_lon
            FROM starts s
            JOIN ends e ON s.rn = e.rn
            ORDER BY s.rn DESC
            LIMIT 50
        """, {"days": days})
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/stats/daily")
def daily_stats(days: int = Query(default=30, ge=1, le=365)):
    """Daily flight statistics aggregated per calendar day."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT
                time_bucket('1 day', time) AS day,
                COUNT(*) AS position_count,
                MAX(altitude_ft) AS max_altitude_ft,
                ROUND(AVG(ground_speed_kt)::numeric, 1) AS avg_speed_kt,
                SUM(CASE WHEN emergency IS NOT NULL THEN 1 ELSE 0 END) AS emergency_count
            FROM flight_positions
            WHERE callsign ILIKE 'CHRISTOPH47%'
              AND time >= NOW() - INTERVAL '1 day' * %(days)s
            GROUP BY day
            ORDER BY day DESC
        """, {"days": days})
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/stats/summary")
def summary():
    """Overall tracker statistics."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT
                COUNT(*) AS total_positions,
                MIN(time) AS tracking_since,
                MAX(time) AS last_seen,
                MAX(altitude_ft) AS max_altitude_ft,
                ROUND(AVG(ground_speed_kt)::numeric, 1) AS avg_speed_kt,
                SUM(CASE WHEN emergency IS NOT NULL THEN 1 ELSE 0 END) AS emergency_events
            FROM flight_positions
            WHERE callsign ILIKE 'CHRISTOPH47%'
        """)
        row = cur.fetchone()
    return dict(row)


@app.get("/aircraft")
def known_aircraft():
    """All known aircraft identities associated with Christoph 47."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM known_aircraft ORDER BY last_seen DESC")
        rows = cur.fetchall()
    return [dict(r) for r in rows]
