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
    Detect individual sorties (Einsätze) by grouping consecutive airborne
    positions (on_ground=FALSE).  A new sortie begins when:
      - the helicopter transitions from on_ground=TRUE → FALSE, OR
      - there is a gap > 5 minutes between airborne positions (ADS-B loss).
    Only sorties with at least 3 position reports are returned to suppress
    brief spurious airborne blips.  End coordinates come from the LAST
    airborne position before the next ground/gap event.
    """
    cs_clause, cs_params = callsign_clause(callsign)
    params = {"days": days, **cs_params}
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"""
            WITH airborne AS (
                -- Only truly airborne positions
                SELECT
                    time, lat, lon, callsign,
                    on_ground,
                    LAG(on_ground) OVER (PARTITION BY callsign ORDER BY time) AS prev_on_ground,
                    LAG(time)      OVER (PARTITION BY callsign ORDER BY time) AS prev_time
                FROM flight_positions
                WHERE time >= NOW() - INTERVAL '1 day' * %(days)s
                  AND callsign IS NOT NULL
                  AND on_ground = FALSE
                  {cs_clause}
            ),
            -- Mark the first position of each sortie
            sortie_starts AS (
                SELECT *,
                    CASE
                        WHEN prev_time IS NULL THEN 1
                        WHEN prev_on_ground = TRUE  THEN 1   -- just took off
                        WHEN EXTRACT(EPOCH FROM (time - prev_time)) > 300 THEN 1  -- gap > 5 min
                        ELSE 0
                    END AS is_start
                FROM airborne
            ),
            -- Assign a sortie number to each position
            sortie_numbered AS (
                SELECT *,
                    SUM(is_start) OVER (PARTITION BY callsign ORDER BY time) AS sortie_no
                FROM sortie_starts
            ),
            -- Aggregate per sortie
            sortie_agg AS (
                SELECT
                    callsign,
                    sortie_no,
                    MIN(time)  AS start_time,
                    MAX(time)  AS end_time,
                    -- Start position: lat/lon at earliest point in sortie
                    (ARRAY_AGG(lat  ORDER BY time ASC))[1]  AS start_lat,
                    (ARRAY_AGG(lon  ORDER BY time ASC))[1]  AS start_lon,
                    -- End position: lat/lon at latest point in sortie
                    (ARRAY_AGG(lat  ORDER BY time DESC))[1] AS end_lat,
                    (ARRAY_AGG(lon  ORDER BY time DESC))[1] AS end_lon,
                    COUNT(*) AS position_count
                FROM sortie_numbered
                GROUP BY callsign, sortie_no
            )
            SELECT
                callsign,
                ROW_NUMBER() OVER (PARTITION BY callsign ORDER BY start_time DESC) AS mission_id,
                start_time, start_lat, start_lon,
                end_time,   end_lat,   end_lon,
                position_count,
                EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_min
            FROM sortie_agg
            WHERE position_count >= 3          -- suppress spurious blips
            ORDER BY start_time DESC
            LIMIT 200
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
